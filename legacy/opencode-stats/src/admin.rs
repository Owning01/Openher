//! Gestión de opencode.db — ÚNICA capa de escritura. Port de opencode_stats/admin.py.
//! Ver docs/migracion-rust/00-inventario.md §6 para el contrato completo.

use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{LazyLock, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use chrono::Local;
use rusqlite::{Connection, OpenFlags, params, params_from_iter};
use serde_json::{Map, Value, json};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

use crate::db;
use crate::pricing;
use crate::types::{AdminAction, ApiError, Guard, Price, Session};

const DESTRUCTIVE: [&str; 6] = ["delete", "move", "prune", "rename", "archive", "restore"];
const ROUTE_EVENT_TYPES: [&str; 2] = ["session.created.1", "session.updated.1"];

static BACKUPS_DIR: Mutex<Option<PathBuf>> = Mutex::new(None);
static OPENCODE_MOCK: Mutex<Option<bool>> = Mutex::new(None);
type EventCache = HashMap<i64, HashMap<String, (i64, i64)>>;
static EVENT_W_CACHE: LazyLock<Mutex<EventCache>> = LazyLock::new(|| Mutex::new(HashMap::new()));

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

/// Ejecuta un comando con timeout (std no tiene .timeout()): spawn + try_wait polling,
/// drenando stdout/stderr en threads para que el pipe no bloquee al hijo.
fn run_cmd_timeout(mut cmd: Command, secs: u64) -> Result<std::process::Output, std::io::Error> {
    #[cfg(windows)]
    cmd.creation_flags(0x0800_0000);
    use std::io::Read;
    cmd.stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());
    let mut child = cmd.spawn()?;
    let mut out_handle = child.stdout.take().map(|mut o| {
        std::thread::spawn(move || {
            let mut v = Vec::new();
            let _ = o.read_to_end(&mut v);
            v
        })
    });
    let mut err_handle = child.stderr.take().map(|mut e| {
        std::thread::spawn(move || {
            let mut v = Vec::new();
            let _ = e.read_to_end(&mut v);
            v
        })
    });
    let deadline = SystemTime::now() + Duration::from_secs(secs);
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) => {
                if SystemTime::now() >= deadline {
                    let _ = child.kill();
                    let _ = child.wait();
                    return Err(std::io::Error::new(std::io::ErrorKind::TimedOut, "timeout"));
                }
                std::thread::sleep(Duration::from_millis(50));
            }
            Err(e) => return Err(e),
        }
    };
    let stdout = out_handle
        .take()
        .and_then(|h| h.join().ok())
        .unwrap_or_default();
    let stderr = err_handle
        .take()
        .and_then(|h| h.join().ok())
        .unwrap_or_default();
    Ok(std::process::Output {
        status,
        stdout,
        stderr,
    })
}

fn round2(x: f64) -> f64 {
    (x * 100.0).round() / 100.0
}

fn round1(x: f64) -> f64 {
    (x * 10.0).round() / 10.0
}

/// Directorio de backups: %LOCALAPPDATA%\OpenCodeStats\backups (frozen) o backups/ (dev).
pub fn backups_dir() -> PathBuf {
    if let Some(p) = BACKUPS_DIR.lock().unwrap().as_ref() {
        return p.clone();
    }
    if let Ok(base) = std::env::var("LOCALAPPDATA")
        && !base.is_empty()
    {
        return PathBuf::from(base).join("OpenCodeStats").join("backups");
    }
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("backups")
}

pub fn set_backups_dir(p: PathBuf) {
    *BACKUPS_DIR.lock().unwrap() = Some(p);
}

/// Detecta opencode corriendo (Windows: tasklist; fallback: ps).
/// OJO: el propio proceso es "opencode-stats.exe" — se excluye del match.
pub fn opencode_running() -> bool {
    if let Some(m) = *OPENCODE_MOCK.lock().unwrap() {
        return m;
    }
    let out = if cfg!(windows) {
        let mut cmd = Command::new("tasklist");
        cmd.args(["/FO", "CSV"]);
        run_cmd_timeout(cmd, 10)
    } else {
        let mut cmd = Command::new("ps");
        cmd.args(["-e", "-o", "comm="]);
        run_cmd_timeout(cmd, 10)
    };
    match out {
        Ok(o) if o.status.success() => {
            let s = String::from_utf8_lossy(&o.stdout);
            s.lines().any(|l| {
                let name = l
                    .split(',')
                    .next()
                    .unwrap_or("")
                    .trim_matches('"')
                    .trim()
                    .to_lowercase();
                name == "opencode"
                    || name == "opencode.exe"
                    || (name.starts_with("opencode") && !name.starts_with("opencode-stats"))
            })
        }
        _ => false,
    }
}

pub fn set_opencode_running_mock(m: Option<bool>) {
    *OPENCODE_MOCK.lock().unwrap() = m;
}

fn connect_rw() -> Result<Connection, ApiError> {
    let p = db::db_path();
    if !p.exists() {
        return Err(ApiError::NotFound(format!(
            "No existe la base de datos: {}",
            p.display()
        )));
    }
    let uri = format!("file:{}?mode=rw", p.to_string_lossy().replace('\\', "/"));
    let con = Connection::open_with_flags(
        uri,
        OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_URI,
    )?;
    con.busy_timeout(Duration::from_secs(5))?;
    con.execute_batch("PRAGMA foreign_keys=ON")?;
    Ok(con)
}

fn guard(action: &str, force: bool) -> Result<(), ApiError> {
    if DESTRUCTIVE.contains(&action) && !force && opencode_running() {
        return Err(ApiError::Permission(
            "opencode está corriendo — las operaciones destructivas están bloqueadas. \
             Cerrá opencode o usá force=true si sabés lo que hacés."
                .to_string(),
        ));
    }
    Ok(())
}

fn value_from_ref(r: rusqlite::types::ValueRef<'_>) -> Value {
    match r {
        rusqlite::types::ValueRef::Null => Value::Null,
        rusqlite::types::ValueRef::Integer(i) => json!(i),
        rusqlite::types::ValueRef::Real(f) => json!(f),
        rusqlite::types::ValueRef::Text(t) => {
            Value::String(String::from_utf8_lossy(t).into_owned())
        }
        rusqlite::types::ValueRef::Blob(b) => {
            Value::String(String::from_utf8_lossy(b).into_owned())
        }
    }
}

/// SELECT * → objeto JSON con todas las columnas por nombre.
fn row_to_value(row: &rusqlite::Row<'_>, cols: &[String]) -> Value {
    let mut obj = Map::new();
    for (i, c) in cols.iter().enumerate() {
        obj.insert(
            c.clone(),
            value_from_ref(row.get_ref(i).unwrap_or(rusqlite::types::ValueRef::Null)),
        );
    }
    Value::Object(obj)
}

fn rows_to_array(conn: &Connection, sql: &str, sid: &str) -> Result<Value, ApiError> {
    let mut stmt = conn.prepare(sql)?;
    let cols: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();
    let mut out = Vec::new();
    let mut rows = stmt.query(params![sid])?;
    while let Some(r) = rows.next()? {
        out.push(row_to_value(r, &cols));
    }
    Ok(Value::Array(out))
}

fn session_row(conn: &Connection, sid: &str) -> Result<Option<Value>, ApiError> {
    let mut stmt = conn.prepare("SELECT * FROM session WHERE id=?1")?;
    let cols: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();
    let mut rows = stmt.query(params![sid])?;
    match rows.next()? {
        None => Ok(None),
        Some(r) => Ok(Some(row_to_value(r, &cols))),
    }
}

fn snapshot_session(conn: &Connection, sid: &str) -> Result<Value, ApiError> {
    Ok(json!({
        "session": session_row(conn, sid)?,
        "messages": rows_to_array(conn, "SELECT * FROM message WHERE session_id=?1", sid)?,
        "parts": rows_to_array(conn, "SELECT * FROM part WHERE session_id=?1", sid)?,
        "todos": rows_to_array(conn, "SELECT * FROM todo WHERE session_id=?1", sid)?,
        "exported_at": Local::now().format("%Y-%m-%dT%H:%M:%S").to_string(),
    }))
}

fn write_pretty(path: &Path, v: &Value) -> Result<(), ApiError> {
    let mut buf = Vec::new();
    let mut ser = serde_json::Serializer::with_formatter(
        &mut buf,
        serde_json::ser::PrettyFormatter::with_indent(b" "),
    );
    serde::Serialize::serialize(v, &mut ser)?;
    std::fs::write(path, buf)?;
    Ok(())
}

fn save_backup(action: &str, snapshots: &Value) -> Result<PathBuf, ApiError> {
    let dir = backups_dir();
    std::fs::create_dir_all(&dir)?;
    let name = format!("{}-{action}.json", Local::now().format("%Y%m%d-%H%M%S"));
    let path = dir.join(&name);
    write_pretty(&path, snapshots)?;
    let last = json!({
        "path": path.to_string_lossy(),
        "action": action,
        "at": Local::now().format("%Y-%m-%dT%H:%M:%S").to_string(),
    });
    write_pretty(&dir.join("last.json"), &last)?;
    Ok(path)
}

pub fn list_backups() -> Value {
    let dir = backups_dir();
    if !dir.exists() {
        return json!({ "backups": [] });
    }
    let mut files: Vec<Value> = Vec::new();
    if let Ok(rd) = std::fs::read_dir(&dir) {
        for e in rd.flatten() {
            let p = e.path();
            if p.extension().and_then(|s| s.to_str()) != Some("json") {
                continue;
            }
            if p.file_name().and_then(|s| s.to_str()) == Some("last.json") {
                continue;
            }
            if let Ok(md) = p.metadata() {
                files.push(json!({
                    "name": p.file_name().and_then(|s| s.to_str()).unwrap_or("").to_string(),
                    "path": p.to_string_lossy(),
                    "size_mb": round2(md.len() as f64 / 1e6),
                    "mtime": md.modified().ok().and_then(|t| t.duration_since(UNIX_EPOCH).ok()).map(|d| d.as_millis() as i64).unwrap_or(0),
                }));
            }
        }
    }
    files.sort_by(|a, b| {
        b["mtime"]
            .as_i64()
            .unwrap_or(0)
            .cmp(&a["mtime"].as_i64().unwrap_or(0))
    });
    files.truncate(50);
    let last = dir.join("last.json");
    let last_info = if last.exists() {
        std::fs::read_to_string(&last)
            .ok()
            .and_then(|s| serde_json::from_str::<Value>(&s).ok())
    } else {
        None
    };
    json!({ "backups": Value::Array(files), "last": last_info })
}

fn count_delete(conn: &Connection, sid: &str) -> Result<Value, ApiError> {
    let messages: i64 = conn.query_row(
        "SELECT COUNT(*) FROM message WHERE session_id=?1",
        params![sid],
        |r| r.get(0),
    )?;
    let parts: i64 = conn.query_row(
        "SELECT COUNT(*) FROM part WHERE session_id=?1",
        params![sid],
        |r| r.get(0),
    )?;
    let todos: i64 = conn.query_row(
        "SELECT COUNT(*) FROM todo WHERE session_id=?1",
        params![sid],
        |r| r.get(0),
    )?;
    let (events, bytes): (i64, Option<i64>) = conn.query_row(
        "SELECT COUNT(*), SUM(LENGTH(data)) FROM event WHERE aggregate_id=?1",
        params![sid],
        |r| Ok((r.get(0)?, r.get(1)?)),
    )?;
    Ok(json!({
        "session": sid,
        "messages": messages,
        "parts": parts,
        "todos": todos,
        "events": events,
        "events_mb": round2(bytes.unwrap_or(0) as f64 / 1e6),
    }))
}

fn do_delete(conn: &Connection, sid: &str) -> Result<(), ApiError> {
    for t in [
        "part",
        "message",
        "todo",
        "session_message",
        "session_input",
        "session_context_epoch",
    ] {
        conn.execute(
            &format!("DELETE FROM {t} WHERE session_id=?1"),
            params![sid],
        )?;
    }
    for t in ["session_share", "session_input"] {
        let has: bool = conn
            .query_row(&format!("PRAGMA table_info({t})"), [], |r| {
                let name: String = r.get(1)?;
                Ok(name == "session_id")
            })
            .unwrap_or(false);
        if has {
            conn.execute(
                &format!("DELETE FROM {t} WHERE session_id=?1"),
                params![sid],
            )?;
        }
    }
    conn.execute("DELETE FROM session WHERE id=?1", params![sid])?;
    conn.execute("DELETE FROM event WHERE aggregate_id=?1", params![sid])?;
    conn.execute(
        "DELETE FROM event_sequence WHERE aggregate_id=?1",
        params![sid],
    )?;
    Ok(())
}

pub fn delete_sessions(ids: Vec<String>, g: Guard) -> Result<Value, ApiError> {
    guard("delete", g.force)?;
    let ids = dedup(ids);
    if ids.is_empty() {
        return Ok(json!({ "dry_run": g.dry_run, "deleted": 0, "rows": [] }));
    }
    let con = connect_rw()?;
    let plan: Result<Vec<Value>, ApiError> =
        ids.iter().map(|sid| count_delete(&con, sid)).collect();
    let plan = plan?;
    if g.dry_run {
        let total: f64 = plan.iter().filter_map(|r| r["events_mb"].as_f64()).sum();
        return Ok(
            json!({ "dry_run": true, "deleted": 0, "rows": plan, "total_events_mb": round2(total) }),
        );
    }
    let snaps: Result<Vec<Value>, ApiError> =
        ids.iter().map(|sid| snapshot_session(&con, sid)).collect();
    let path = save_backup("delete", &Value::Array(snaps?))?;
    con.execute_batch("BEGIN")?;
    for sid in &ids {
        do_delete(&con, sid)?;
    }
    con.execute_batch("COMMIT")?;
    let total: f64 = plan.iter().filter_map(|r| r["events_mb"].as_f64()).sum();
    Ok(json!({
        "dry_run": false,
        "deleted": ids.len(),
        "rows": plan,
        "backup": path.to_string_lossy(),
        "total_events_mb": round2(total),
    }))
}

fn dedup(ids: Vec<String>) -> Vec<String> {
    let mut seen = HashSet::new();
    ids.into_iter()
        .filter(|i| !i.is_empty() && seen.insert(i.clone()))
        .collect()
}

fn sha1_hex(data: &[u8]) -> String {
    let mut h: [u32; 5] = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
    let ml = (data.len() as u64) * 8;
    let mut msg = data.to_vec();
    msg.push(0x80);
    while msg.len() % 64 != 56 {
        msg.push(0);
    }
    msg.extend_from_slice(&ml.to_be_bytes());
    for chunk in msg.chunks(64) {
        let mut w = [0u32; 80];
        for i in 0..16 {
            w[i] = u32::from_be_bytes([
                chunk[i * 4],
                chunk[i * 4 + 1],
                chunk[i * 4 + 2],
                chunk[i * 4 + 3],
            ]);
        }
        for i in 16..80 {
            w[i] = (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]).rotate_left(1);
        }
        let (mut a, mut b, mut c, mut d, mut e) = (h[0], h[1], h[2], h[3], h[4]);
        for (i, &wi) in w.iter().enumerate() {
            let (f, k) = match i {
                0..=19 => ((b & c) | ((!b) & d), 0x5A827999u32),
                20..=39 => (b ^ c ^ d, 0x6ED9EBA1),
                40..=59 => ((b & c) | (b & d) | (c & d), 0x8F1BBCDC),
                _ => (b ^ c ^ d, 0xCA62C1D6),
            };
            let tmp = a
                .rotate_left(5)
                .wrapping_add(f)
                .wrapping_add(e)
                .wrapping_add(k)
                .wrapping_add(wi);
            e = d;
            d = c;
            c = b.rotate_left(30);
            b = a;
            a = tmp;
        }
        h[0] = h[0].wrapping_add(a);
        h[1] = h[1].wrapping_add(b);
        h[2] = h[2].wrapping_add(c);
        h[3] = h[3].wrapping_add(d);
        h[4] = h[4].wrapping_add(e);
    }
    h.iter().map(|x| format!("{x:08x}")).collect()
}

fn project_id_for(con: &Connection, directory: &str) -> Result<String, ApiError> {
    if let Ok(id) = con.query_row(
        "SELECT id FROM project WHERE worktree=?1",
        params![directory],
        |r| r.get::<_, String>(0),
    ) {
        return Ok(id);
    }
    let mut cmd = Command::new("git");
    cmd.args(["-C", directory, "rev-list", "--max-parents=0", "--all"]);
    cmd.stderr(std::process::Stdio::null());
    if let Ok(out) = run_cmd_timeout(cmd, 10)
        && out.status.success()
    {
        let s = String::from_utf8_lossy(&out.stdout);
        if let Some(line) = s.lines().map(|l| l.trim()).find(|l| !l.is_empty()) {
            return Ok(line.to_string());
        }
    }
    #[cfg(windows)]
    let key = directory.to_lowercase();
    #[cfg(not(windows))]
    let key = directory.to_string();
    Ok(sha1_hex(key.as_bytes()))
}

fn ensure_project(con: &Connection, directory: &str) -> Result<String, ApiError> {
    let pid = project_id_for(con, directory)?;
    let exists: bool = con
        .query_row("SELECT 1 FROM project WHERE id=?1", params![pid], |_| {
            Ok(true)
        })
        .unwrap_or(false);
    if !exists {
        let name = Path::new(directory)
            .file_name()
            .and_then(|s| s.to_str())
            .filter(|s| !s.is_empty())
            .unwrap_or(&pid)
            .to_string();
        con.execute(
            "INSERT INTO project (id, worktree, name, sandboxes, time_created, time_updated) VALUES (?1,?2,?3,?4,?5,?6)",
            params![pid, directory, name, "[]", now_ms(), now_ms()],
        )?;
    }
    con.execute(
        "INSERT OR IGNORE INTO project_directory (project_id, directory, type, time_created) VALUES (?1,?2,'main',?3)",
        params![pid, directory, now_ms()],
    )?;
    Ok(pid)
}

fn patch_route_events(
    con: &Connection,
    sid: &str,
    directory: &str,
    path: &str,
    pid: &str,
) -> Result<(), ApiError> {
    for typ in ROUTE_EVENT_TYPES {
        let order = if typ == "session.updated.1" {
            "DESC"
        } else {
            "ASC"
        };
        let eid: Option<String> = con
            .query_row(
                &format!("SELECT id FROM event WHERE aggregate_id=?1 AND type=?2 ORDER BY seq {order} LIMIT 1"),
                params![sid, typ],
                |r| r.get(0),
            )
            .ok();
        if let Some(eid) = eid {
            con.execute(
                "UPDATE event SET data=json_set(data, '$.info.directory', ?1, '$.info.path', ?2, '$.info.projectID', ?3) WHERE id=?4",
                params![directory, path, pid, eid],
            )?;
        }
    }
    Ok(())
}

pub fn move_sessions(ids: Vec<String>, directory: &str, g: Guard) -> Result<Value, ApiError> {
    guard("move", g.force)?;
    let ids = dedup(ids);
    let directory = if Path::new(directory).is_absolute() {
        PathBuf::from(directory)
    } else {
        std::env::current_dir()
            .map_err(|e| ApiError::Msg(e.to_string()))?
            .join(directory)
    };
    #[cfg(windows)]
    let directory = directory.to_string_lossy().replace('/', "\\");
    #[cfg(not(windows))]
    let directory = directory.to_string_lossy().into_owned();
    if ids.is_empty() || directory.trim().is_empty() {
        return Ok(json!({ "error": "Faltan sesiones o ruta destino" }));
    }
    if !Path::new(&directory).is_dir() {
        return Ok(json!({ "error": format!("La ruta no existe: {directory}") }));
    }
    let con = connect_rw()?;
    if g.dry_run {
        return Ok(
            json!({ "dry_run": true, "moved": 0, "target": directory, "project_id": project_id_for(&con, &directory)? }),
        );
    }
    let snaps: Result<Vec<Value>, ApiError> =
        ids.iter().map(|sid| snapshot_session(&con, sid)).collect();
    let path = save_backup("move", &Value::Array(snaps?))?;
    let pid = ensure_project(&con, &directory)?;
    con.execute_batch("BEGIN")?;
    for sid in &ids {
        con.execute(
            "UPDATE session SET project_id=?1, directory=?2, path='', time_updated=?3 WHERE id=?4",
            params![pid, directory, now_ms(), sid],
        )?;
        patch_route_events(&con, sid, &directory, "", &pid)?;
    }
    con.execute_batch("COMMIT")?;
    Ok(json!({
        "dry_run": false,
        "moved": ids.len(),
        "target": directory,
        "project_id": pid,
        "backup": path.to_string_lossy(),
    }))
}

pub fn rename_session(id: &str, title: &str, g: Guard) -> Result<Value, ApiError> {
    guard("rename", g.force)?;
    let title = title.trim();
    if title.is_empty() {
        return Ok(json!({ "error": "El título no puede estar vacío" }));
    }
    let con = connect_rw()?;
    if session_row(&con, id)?.is_none() {
        return Ok(json!({ "error": format!("No existe la sesión {id}") }));
    }
    if g.dry_run {
        return Ok(json!({ "dry_run": true, "title": title }));
    }
    con.execute(
        "UPDATE session SET title=?1, time_updated=?2 WHERE id=?3",
        params![title, now_ms(), id],
    )?;
    Ok(json!({ "dry_run": false, "title": title }))
}

pub fn archive_sessions(ids: Vec<String>, archived: bool, g: Guard) -> Result<Value, ApiError> {
    guard("archive", g.force)?;
    let ids = dedup(ids);
    if ids.is_empty() {
        return Ok(json!({ "dry_run": g.dry_run, "affected": 0 }));
    }
    if g.dry_run {
        return Ok(json!({ "dry_run": true, "affected": ids.len() }));
    }
    let con = connect_rw()?;
    let val: Option<i64> = if archived { Some(now_ms()) } else { None };
    let placeholders = vec!["?"; ids.len()].join(",");
    let mut ps: Vec<rusqlite::types::Value> = vec![
        val.map(rusqlite::types::Value::Integer)
            .unwrap_or(rusqlite::types::Value::Null),
        rusqlite::types::Value::Integer(now_ms()),
    ];
    ps.extend(ids.iter().map(|i| rusqlite::types::Value::Text(i.clone())));
    con.execute(
        &format!("UPDATE session SET time_archived=?, time_updated=? WHERE id IN ({placeholders})"),
        params_from_iter(ps.iter()),
    )?;
    Ok(json!({ "dry_run": false, "affected": ids.len(), "archived": archived }))
}

pub fn prune_sessions(cutoff: &str, g: Guard) -> Result<Value, ApiError> {
    guard("prune", g.force)?;
    let cutoff_ms = db::parse_date(cutoff).map_err(ApiError::Msg)?;
    let con = connect_rw()?;
    let ids: Vec<String> = {
        let mut stmt =
            con.prepare("SELECT id FROM session WHERE time_created < ?1 AND time_updated < ?1")?;
        let mut rows = stmt.query(params![cutoff_ms])?;
        let mut out = Vec::new();
        while let Some(r) = rows.next()? {
            out.push(r.get(0)?);
        }
        out
    };
    if ids.is_empty() {
        return Ok(json!({ "dry_run": g.dry_run, "deleted": 0, "rows": [], "cutoff": cutoff }));
    }
    delete_sessions(ids, g)
}

pub fn export_sessions(ids: Vec<String>) -> Result<Value, ApiError> {
    let ids = dedup(ids);
    let con = connect_rw()?;
    let mut out = Map::new();
    for sid in &ids {
        let snap = snapshot_session(&con, sid)?;
        if snap["session"].is_null() {
            continue;
        }
        out.insert(sid.clone(), snap);
    }
    if out.is_empty() {
        return Ok(json!({ "error": "No se encontraron sesiones" }));
    }
    Ok(json!({ "sessions": Value::Object(out) }))
}

fn table_columns(con: &Connection, table: &str) -> Result<Vec<String>, ApiError> {
    let mut stmt = con.prepare(&format!("PRAGMA table_info({table})"))?;
    let mut rows = stmt.query([])?;
    let mut out = Vec::new();
    while let Some(r) = rows.next()? {
        out.push(r.get::<_, String>(1)?);
    }
    Ok(out)
}

fn insert_object(
    con: &Connection,
    table: &str,
    obj: &Map<String, Value>,
    default_sid: Option<&str>,
) -> Result<(), ApiError> {
    let cols = table_columns(con, table)?;
    let mut data: Vec<(String, Value)> = Vec::new();
    for c in &cols {
        if let Some(v) = obj.get(c)
            && !v.is_null()
        {
            data.push((c.clone(), v.clone()));
        }
    }
    if let Some(sid) = default_sid
        && !data.iter().any(|(c, _)| c == "session_id")
    {
        data.push(("session_id".to_string(), json!(sid)));
    }
    if data.is_empty() {
        return Ok(());
    }
    let cols_sql: Vec<&str> = data.iter().map(|(c, _)| c.as_str()).collect();
    let placeholders = vec!["?"; data.len()].join(",");
    let vals: Vec<rusqlite::types::Value> = data
        .iter()
        .map(|(_, v)| match v {
            Value::Null => rusqlite::types::Value::Null,
            Value::Bool(b) => rusqlite::types::Value::Integer(*b as i64),
            Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    rusqlite::types::Value::Integer(i)
                } else {
                    rusqlite::types::Value::Real(n.as_f64().unwrap_or(0.0))
                }
            }
            Value::String(s) => rusqlite::types::Value::Text(s.clone()),
            Value::Array(a) => {
                rusqlite::types::Value::Text(serde_json::to_string(a).unwrap_or_default())
            }
            Value::Object(o) => {
                rusqlite::types::Value::Text(serde_json::to_string(o).unwrap_or_default())
            }
        })
        .collect();
    let or_ignore = if table == "todo" { " OR IGNORE" } else { "" };
    con.execute(
        &format!(
            "INSERT {or_ignore} INTO {table} ({}) VALUES ({placeholders})",
            cols_sql.join(",")
        ),
        params_from_iter(vals.iter()),
    )?;
    Ok(())
}

fn restore_one(con: &Connection, snap: &Value) -> Result<bool, ApiError> {
    let Some(s) = snap.get("session") else {
        return Ok(false);
    };
    let Some(s) = s.as_object() else {
        return Ok(false);
    };
    let Some(sid) = s.get("id").and_then(|v| v.as_str()) else {
        return Ok(false);
    };
    let exists: bool = con
        .query_row("SELECT 1 FROM session WHERE id=?1", params![sid], |_| {
            Ok(true)
        })
        .unwrap_or(false);
    if exists {
        return Ok(false);
    }
    let now = now_ms();
    let pid = s
        .get("project_id")
        .and_then(|v| v.as_str())
        .filter(|p| !p.is_empty())
        .unwrap_or("global")
        .to_string();
    let proj_exists: bool = con
        .query_row("SELECT 1 FROM project WHERE id=?1", params![pid], |_| {
            Ok(true)
        })
        .unwrap_or(false);
    if !proj_exists {
        let worktree = s
            .get("directory")
            .and_then(|v| v.as_str())
            .filter(|d| !d.is_empty())
            .unwrap_or(&pid)
            .to_string();
        let name = Path::new(&worktree)
            .file_name()
            .and_then(|n| n.to_str())
            .filter(|n| !n.is_empty())
            .unwrap_or(&pid)
            .to_string();
        con.execute(
            "INSERT OR IGNORE INTO project (id, worktree, name, sandboxes, time_created, time_updated) VALUES (?1,?2,?3,?4,?5,?6)",
            params![pid, worktree, name, "[]", now, now],
        )?;
    }
    insert_object(con, "session", s, None)?;
    for m in snap
        .get("messages")
        .and_then(|v| v.as_array())
        .into_iter()
        .flatten()
    {
        if let Some(o) = m.as_object() {
            insert_object(con, "message", o, Some(sid))?;
        }
    }
    for p in snap
        .get("parts")
        .and_then(|v| v.as_array())
        .into_iter()
        .flatten()
    {
        if let Some(o) = p.as_object() {
            insert_object(con, "part", o, Some(sid))?;
        }
    }
    for t in snap
        .get("todos")
        .and_then(|v| v.as_array())
        .into_iter()
        .flatten()
    {
        if let Some(o) = t.as_object() {
            insert_object(con, "todo", o, Some(sid))?;
        }
    }
    Ok(true)
}

pub fn restore_session(backup_path: &str, g: Guard) -> Result<Value, ApiError> {
    guard("restore", g.force)?;
    let path = Path::new(backup_path);
    if !path.exists() {
        return Ok(json!({ "error": format!("No existe el backup: {}", path.display()) }));
    }
    let raw = std::fs::read_to_string(path)?;
    let data: Value = serde_json::from_str(&raw)?;
    let snapshots: Vec<Value> = if let Some(a) = data.as_array() {
        a.clone()
    } else {
        vec![data]
    };
    let con = connect_rw()?;
    let mut plan = Vec::new();
    for snap in &snapshots {
        if let Some(s) = snap.get("session").and_then(|v| v.as_object()) {
            let sid = s
                .get("id")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let exists = con
                .query_row("SELECT 1 FROM session WHERE id=?1", params![sid], |_| {
                    Ok(true)
                })
                .unwrap_or(false);
            plan.push(json!({
                "session": sid,
                "title": s.get("title").and_then(|v| v.as_str()).unwrap_or(""),
                "exists": exists,
                "messages": snap.get("messages").and_then(|v| v.as_array()).map(|a| a.len()).unwrap_or(0),
                "parts": snap.get("parts").and_then(|v| v.as_array()).map(|a| a.len()).unwrap_or(0),
            }));
        }
    }
    if g.dry_run {
        return Ok(json!({ "dry_run": true, "rows": plan, "backup": path.to_string_lossy() }));
    }
    let mut restored = 0usize;
    con.execute_batch("BEGIN")?;
    for snap in &snapshots {
        if restore_one(&con, snap)? {
            restored += 1;
        }
    }
    con.execute_batch("COMMIT")?;
    Ok(json!({ "dry_run": false, "restored": restored, "backup": path.to_string_lossy() }))
}

pub fn session_detail(sid: &str) -> Result<Value, ApiError> {
    let con = connect_rw()?;
    let Some(row) = session_row(&con, sid)? else {
        return Ok(json!({ "error": format!("No existe la sesión {sid}") }));
    };
    let project: Option<Value> = con
        .query_row(
            "SELECT name, worktree FROM project WHERE id=?1",
            params![row["project_id"].as_str().unwrap_or("")],
            |r| Ok(json!({ "name": r.get::<_, String>(0)?, "worktree": r.get::<_, String>(1)? })),
        )
        .ok();
    let mut parts = Vec::new();
    {
        let mut stmt = con.prepare(
            "SELECT json_extract(data, '$.type') AS typ, COUNT(*) AS n, SUM(LENGTH(data)) AS b FROM part WHERE session_id=?1 GROUP BY typ ORDER BY b DESC",
        )?;
        let mut rows = stmt.query(params![sid])?;
        while let Some(r) = rows.next()? {
            parts.push(json!({
                "typ": r.get::<_, Option<String>>(0)?,
                "n": r.get::<_, i64>(1)?,
                "b": r.get::<_, Option<i64>>(2)?.unwrap_or(0),
            }));
        }
    }
    let (ev_n, ev_b): (i64, Option<i64>) = con.query_row(
        "SELECT COUNT(*), SUM(LENGTH(data)) FROM event WHERE aggregate_id=?1",
        params![sid],
        |r| Ok((r.get(0)?, r.get(1)?)),
    )?;
    let mut msgs = Vec::new();
    {
        let mut stmt = con.prepare(
            "SELECT id, time_created, length(data) AS bytes, substr(data, 1, 80) AS head FROM message WHERE session_id=?1 ORDER BY time_created ASC LIMIT 20",
        )?;
        let mut rows = stmt.query(params![sid])?;
        while let Some(r) = rows.next()? {
            msgs.push(json!({
                "id": r.get::<_, String>(0)?,
                "time_created": r.get::<_, Option<i64>>(1)?,
                "bytes": r.get::<_, Option<i64>>(2)?.unwrap_or(0),
                "head": r.get::<_, Option<String>>(3)?.unwrap_or_default(),
            }));
        }
    }
    let model_raw = row["model"].as_str().unwrap_or("").to_string();
    let model = if model_raw.is_empty() {
        model_raw.clone()
    } else {
        serde_json::from_str::<Value>(&model_raw)
            .ok()
            .and_then(|v| v.get("id").and_then(|i| i.as_str()).map(|s| s.to_string()))
            .unwrap_or(model_raw)
    };
    let tokens = json!({
        "tokens_input": row["tokens_input"],
        "tokens_output": row["tokens_output"],
        "tokens_reasoning": row["tokens_reasoning"],
        "tokens_cache_read": row["tokens_cache_read"],
        "tokens_cache_write": row["tokens_cache_write"],
    });
    Ok(json!({
        "id": row["id"],
        "title": row["title"],
        "model": model,
        "project": project,
        "directory": row["directory"],
        "created": row["time_created"],
        "updated": row["time_updated"],
        "archived": !row["time_archived"].is_null(),
        "cost": row["cost"],
        "tokens": tokens,
        "share_url": row["share_url"],
        "messages": msgs.len(),
        "message_samples": msgs,
        "parts_by_type": parts,
        "events": ev_n,
        "events_mb": round2(ev_b.unwrap_or(0) as f64 / 1e6),
    }))
}

pub fn get_pricing() -> Value {
    let prices = pricing::prices();
    let limits = pricing::limits();
    let names = pricing::model_names();
    let mut prices_map = Map::new();
    let mut limits_map = Map::new();
    let mut names_map = Map::new();
    for k in pricing::MODEL_ORDER {
        if let Some(p) = prices.get(k) {
            prices_map.insert(
                k.to_string(),
                json!({"in": p.input, "out": p.output, "cr": p.cache_read, "cw": p.cache_write}),
            );
        }
        if let Some(l) = limits.get(k) {
            limits_map.insert(k.to_string(), json!([l.0, l.1, l.2]));
        }
        if let Some(n) = names.get(k) {
            names_map.insert(k.to_string(), json!(n));
        }
    }
    json!({
        "prices": Value::Object(prices_map),
        "limits": Value::Object(limits_map),
        "names": Value::Object(names_map),
    })
}

pub fn save_pricing(prices: Value, limits: Value, names: Value) -> Result<Value, ApiError> {
    let prices_obj = prices
        .as_object()
        .ok_or_else(|| ApiError::Msg("Formato inválido: se esperan prices/limits/names".into()))?;
    let limits_obj = limits
        .as_object()
        .ok_or_else(|| ApiError::Msg("Formato inválido: se esperan prices/limits/names".into()))?;
    let names_obj = names
        .as_object()
        .ok_or_else(|| ApiError::Msg("Formato inválido: se esperan prices/limits/names".into()))?;
    let mut pmap = HashMap::new();
    for (mid, p) in prices_obj {
        let po = p.as_object().ok_or_else(|| {
            ApiError::Msg(format!(
                "Precio inválido para {mid}: se esperan in/out/cr/cw"
            ))
        })?;
        let get = |k: &str| {
            po.get(k).and_then(|v| v.as_f64()).ok_or_else(|| {
                ApiError::Msg(format!(
                    "Precio inválido para {mid}: se esperan in/out/cr/cw"
                ))
            })
        };
        pmap.insert(
            mid.clone(),
            Price {
                input: get("in")?,
                output: get("out")?,
                cache_read: get("cr")?,
                cache_write: get("cw")?,
            },
        );
    }
    let mut lmap = HashMap::new();
    for (mid, l) in limits_obj {
        let arr = l
            .as_array()
            .ok_or_else(|| ApiError::Msg(format!("Límite inválido para {mid}")))?;
        lmap.insert(
            mid.clone(),
            (
                arr.first().and_then(|x| x.as_i64()).unwrap_or(0),
                arr.get(1).and_then(|x| x.as_i64()).unwrap_or(0),
                arr.get(2).and_then(|x| x.as_i64()).unwrap_or(0),
            ),
        );
    }
    let mut nmap = HashMap::new();
    for (mid, n) in names_obj {
        nmap.insert(mid.clone(), n.as_str().unwrap_or(mid).to_string());
    }
    let nmodels = pmap.len();
    let path = pricing::save_overrides(pmap, lmap, nmap).map_err(ApiError::Msg)?;
    Ok(json!({ "saved": true, "path": path.to_string_lossy(), "models": nmodels }))
}

pub fn full_backup(dest: Option<&str>) -> Result<Value, ApiError> {
    let dest_dir = if let Some(d) = dest {
        PathBuf::from(d)
    } else {
        let mut candidates = vec![
            PathBuf::from("D:/opencode-backup"),
            db::home().join("opencode-backup"),
            backups_dir().join("full"),
        ];
        let picked = candidates
            .iter()
            .find(|p| p.exists() || p.parent().map(|q| q.exists()).unwrap_or(false))
            .cloned()
            .unwrap_or_else(|| candidates.pop().unwrap());
        candidates.push(picked.clone());
        picked
    };
    std::fs::create_dir_all(&dest_dir)?;
    let target = dest_dir.join("opencode.db");
    let src = db::connect_ro()?;
    src.backup("main", &target, None)?;
    drop(src);
    for suf in ["-wal", "-shm"] {
        let p = PathBuf::from(format!("{}{}", target.to_string_lossy(), suf));
        if p.exists() {
            let _ = std::fs::remove_file(p);
        }
    }
    let size = std::fs::metadata(&target)
        .map(|m| m.len() as f64)
        .unwrap_or(0.0);
    Ok(json!({ "path": target.to_string_lossy(), "size_mb": round1(size / 1e6) }))
}

pub fn vacuum() -> Result<Value, ApiError> {
    let p = db::db_path();
    let before = std::fs::metadata(&p)
        .map(|m| m.len() as f64 / 1e6)
        .unwrap_or(0.0);
    let con = connect_rw()?;
    con.execute_batch("VACUUM")?;
    let after = std::fs::metadata(&p)
        .map(|m| m.len() as f64 / 1e6)
        .unwrap_or(0.0);
    Ok(json!({ "before_mb": round1(before), "after_mb": round1(after) }))
}

pub fn event_weights(
    con: &Connection,
    sessions: &[Session],
) -> Result<HashMap<String, (i64, i64)>, ApiError> {
    if sessions.is_empty() {
        return Ok(HashMap::new());
    }
    let newest = sessions.iter().map(|s| s.updated).max().unwrap_or(0);
    {
        let cache = EVENT_W_CACHE.lock().unwrap();
        if let Some(c) = cache.get(&newest) {
            return Ok(sessions
                .iter()
                .map(|s| (s.id.clone(), c.get(&s.id).copied().unwrap_or((0, 0))))
                .collect());
        }
    }
    let mut map = HashMap::new();
    {
        let mut stmt = con.prepare("SELECT aggregate_id AS sid, COUNT(*) AS n, SUM(LENGTH(data)) AS b FROM event GROUP BY aggregate_id")?;
        let mut rows = stmt.query([])?;
        while let Some(r) = rows.next()? {
            map.insert(
                r.get::<_, String>(0)?,
                (
                    r.get::<_, i64>(1)?,
                    r.get::<_, Option<i64>>(2)?.unwrap_or(0),
                ),
            );
        }
    }
    EVENT_W_CACHE.lock().unwrap().insert(newest, map.clone());
    Ok(sessions
        .iter()
        .map(|s| (s.id.clone(), map.get(&s.id).copied().unwrap_or((0, 0))))
        .collect())
}

/// Vacía la caché de event weights (después de operaciones que mutan `event`).
#[doc(hidden)]
pub fn clear_event_cache() {
    EVENT_W_CACHE.lock().unwrap().clear();
}

#[cfg(windows)]
fn free_disk_bytes(p: &Path) -> u64 {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::GetDiskFreeSpaceExW;
    let root = p.to_string_lossy();
    let root = if root.ends_with('/') || root.ends_with('\\') {
        root.into_owned()
    } else {
        format!("{root}\\")
    };
    let wide: Vec<u16> = std::ffi::OsStr::new(&root)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    let mut free: u64 = 0;
    let ok = unsafe {
        GetDiskFreeSpaceExW(
            wide.as_ptr(),
            &mut free,
            std::ptr::null_mut(),
            std::ptr::null_mut(),
        )
    };
    if ok == 0 { 0 } else { free }
}

#[cfg(not(windows))]
fn free_disk_bytes(_p: &Path) -> u64 {
    0
}

pub fn status() -> Result<Value, ApiError> {
    let p = db::db_path();
    let size = std::fs::metadata(&p).map(|m| m.len() as f64).unwrap_or(0.0);
    let wal = PathBuf::from(format!("{}-wal", p.to_string_lossy()));
    let wal_size = std::fs::metadata(&wal)
        .map(|m| m.len() as f64)
        .unwrap_or(0.0);
    let free = if p.exists() {
        free_disk_bytes(p.parent().unwrap_or(Path::new(".")))
    } else {
        0
    };
    let con = connect_rw()?;
    let mut projects = Vec::new();
    {
        let mut stmt = con.prepare("SELECT id, name, worktree FROM project ORDER BY name")?;
        let mut rows = stmt.query([])?;
        while let Some(r) = rows.next()? {
            projects.push(json!({
                "id": r.get::<_, String>(0)?,
                "name": r.get::<_, Option<String>>(1)?,
                "worktree": r.get::<_, Option<String>>(2)?,
            }));
        }
    }
    let page_count: i64 = con.query_row("PRAGMA page_count", [], |r| r.get(0))?;
    Ok(json!({
        "opencode_running": opencode_running(),
        "db_mb": round1(size / 1e6),
        "wal_mb": round1(wal_size / 1e6),
        "free_gb": round1(free as f64 / 1e9),
        "page_count": page_count,
        "projects": projects,
        "db_path": p.to_string_lossy(),
        "db_config_path": db::config_path().to_string_lossy(),
    }))
}

/// Cambia la ruta de la DB elegida por el usuario (persistente en config.json).
pub fn set_db_path(path: &str) -> Result<Value, ApiError> {
    let path = path.trim();
    if path.is_empty() {
        return Ok(json!({ "error": "La ruta no puede estar vacía" }));
    }
    db::set_db_path(path).map_err(ApiError::Msg)?;
    Ok(json!({ "saved": true, "path": path }))
}

pub fn dispatch(action: AdminAction, g: Guard) -> Result<Value, ApiError> {
    let r = match action {
        AdminAction::Delete { ids } => delete_sessions(ids, g),
        AdminAction::Move { ids, directory } => move_sessions(ids, &directory, g),
        AdminAction::Rename { id, title } => rename_session(&id, &title, g),
        AdminAction::Archive { ids, archived } => archive_sessions(ids, archived, g),
        AdminAction::Prune { cutoff } => prune_sessions(&cutoff, g),
        AdminAction::Export { ids } => export_sessions(ids),
        AdminAction::Backup { dest } => full_backup(dest.as_deref()),
        AdminAction::Vacuum => vacuum(),
        AdminAction::Restore { backup_path } => restore_session(&backup_path, g),
        AdminAction::PricingSave {
            prices,
            limits,
            names,
        } => save_pricing(prices, limits, names),
        AdminAction::SetDb { path } => set_db_path(&path),
    };
    // las operaciones que mutan la DB invalidan las caches keyed por max(time_updated)
    if r.is_ok() && !g.dry_run {
        db::clear_request_cache();
        clear_event_cache();
    }
    r
}
