//! Acceso a la base de datos de opencode (SOLO LECTURA). Port de opencode_stats/db.py.
//! Ver docs/migracion-rust/00-inventario.md §4 para el contrato completo.

use chrono::{Local, NaiveDate, TimeZone};
use rusqlite::{Connection, OpenFlags};
use serde_json::Value;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{LazyLock, Mutex};

use crate::pricing::estimate_cost;
use crate::types::{ApiError, Group, Session, TokenCounts, ToolUsage};

/// Path.home() con fallback a variables de entorno (robusto en .exe/servicios).
/// Port de db._home(): Path.home(); RuntimeError -> USERPROFILE -> HOME.
pub fn home() -> PathBuf {
    if let Ok(h) = std::env::var("USERPROFILE")
        && !h.is_empty()
    {
        return PathBuf::from(h);
    }
    if let Ok(h) = std::env::var("HOME")
        && !h.is_empty()
    {
        return PathBuf::from(h);
    }
    std::path::PathBuf::from(".")
}

/// Ruta del archivo de configuración local (ruta de la DB elegida por el usuario).
/// En el exe va a `%LOCALAPPDATA%\OpenCodeStats\config.json`; en dev a `data/config.json`.
static CONFIG_DIR: Mutex<Option<PathBuf>> = Mutex::new(None);

/// Redirige el directorio de config (para tests).
#[doc(hidden)]
pub fn set_config_dir_for_tests(p: Option<PathBuf>) {
    *CONFIG_DIR.lock().unwrap() = p;
}

pub fn config_path() -> PathBuf {
    if let Some(p) = CONFIG_DIR.lock().unwrap().as_ref() {
        return p.join("config.json");
    }
    if let Ok(base) = std::env::var("LOCALAPPDATA")
        && !base.is_empty()
    {
        return PathBuf::from(base)
            .join("OpenCodeStats")
            .join("config.json");
    }
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("data")
        .join("config.json")
}

/// Ruta de la DB guardada por el usuario en config.json (si existe).
pub fn saved_db_path() -> Option<PathBuf> {
    let raw = std::fs::read_to_string(config_path()).ok()?;
    let v: Value = serde_json::from_str(&raw).ok()?;
    let p = v.get("db_path")?.as_str()?;
    if p.is_empty() {
        None
    } else {
        Some(PathBuf::from(p))
    }
}

/// Guarda la ruta de la DB elegida por el usuario (config.json).
pub fn set_db_path(path: &str) -> Result<(), String> {
    let p = config_path();
    if let Some(dir) = p.parent() {
        std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    let v = serde_json::json!({ "db_path": path });
    std::fs::write(
        p,
        serde_json::to_string_pretty(&v).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())
}

/// Ruta de la DB: env OPENCODE_DB > config.json (elegida en la UI) > ruta por defecto.
pub fn db_path() -> PathBuf {
    if let Ok(p) = std::env::var("OPENCODE_DB")
        && !p.is_empty()
    {
        return PathBuf::from(p);
    }
    if let Some(p) = saved_db_path() {
        return p;
    }
    home()
        .join(".local")
        .join("share")
        .join("opencode")
        .join("opencode.db")
}

/// Conexión SOLO LECTURA a la DB (port de _connect()).
/// Error si la DB no existe; URI `file:{path}?mode=ro` con backslashes -> `/`.
pub fn connect_ro() -> Result<Connection, ApiError> {
    let path = db_path();
    if !path.exists() {
        return Err(ApiError::NotFound(format!(
            "No existe la base de datos: {}",
            path.display()
        )));
    }
    let uri = format!("file:{}?mode=ro", path.to_string_lossy().replace('\\', "/"));
    Connection::open_with_flags(
        &uri,
        OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_URI,
    )
    .map_err(ApiError::from)
}

/// Port de _parse_date(): "%Y-%m-%d" naive interpretado en hora LOCAL -> ms.
pub fn parse_date(s: &str) -> Result<i64, String> {
    let ndt = NaiveDate::parse_from_str(s, "%Y-%m-%d")
        .map_err(|e| e.to_string())?
        .and_hms_opt(0, 0, 0)
        .ok_or_else(|| format!("fecha inválida: {s}"))?;
    Local
        .from_local_datetime(&ndt)
        .earliest()
        .or_else(|| Local.from_local_datetime(&ndt).latest())
        .map(|dt| dt.timestamp_millis())
        .ok_or_else(|| format!("fecha inválida: {s}"))
}

/// Port de _model_id(): None/vacío -> "(sin modelo)"; JSON -> .id si es string; falla -> raw.
pub fn model_id(raw: Option<&str>) -> String {
    match raw {
        None | Some("") => "(sin modelo)".to_string(),
        Some(r) => match serde_json::from_str::<Value>(r) {
            Ok(v) => match v.get("id") {
                Some(Value::String(id)) => id.clone(),
                _ => r.to_string(),
            },
            Err(_) => r.to_string(),
        },
    }
}

/// Sesiones con sus tokens (port de load_sessions). Filtros opcionales
/// (since/until YYYY-MM-DD, model substring; until inclusivo +86_399_999 ms).
pub fn load_sessions(
    conn: &Connection,
    since: &str,
    until: &str,
    model: &str,
) -> Result<Vec<Session>, ApiError> {
    let mut q = String::from(
        "SELECT id, title, model, project_id, time_created, time_updated, directory, time_archived, \
         tokens_input, tokens_output, tokens_reasoning, tokens_cache_read, tokens_cache_write, cost \
         FROM session WHERE 1=1",
    );
    let mut params: Vec<i64> = Vec::new();
    if !since.is_empty() {
        q.push_str(" AND time_created >= ?");
        params.push(parse_date(since).map_err(ApiError::Msg)?);
    }
    if !until.is_empty() {
        q.push_str(" AND time_created <= ?");
        params.push(parse_date(until).map_err(ApiError::Msg)? + 86_399_999);
    }

    let mut stmt = conn.prepare(&q)?;
    let rows = stmt.query_map(rusqlite::params_from_iter(params.iter()), |r| {
        Ok((
            r.get::<_, String>(0)?,
            r.get::<_, Option<String>>(1)?,
            r.get::<_, Option<String>>(2)?,
            r.get::<_, String>(3)?,
            r.get::<_, Option<i64>>(4)?,
            r.get::<_, Option<i64>>(5)?,
            r.get::<_, Option<String>>(6)?,
            r.get::<_, Option<i64>>(7)?,
            r.get::<_, Option<i64>>(8)?,
            r.get::<_, Option<i64>>(9)?,
            r.get::<_, Option<i64>>(10)?,
            r.get::<_, Option<i64>>(11)?,
            r.get::<_, Option<i64>>(12)?,
            r.get::<_, Option<f64>>(13)?,
        ))
    })?;

    let mut sessions = Vec::new();
    for row in rows {
        let (
            id,
            title,
            model_raw,
            project_id,
            created,
            updated,
            directory,
            archived,
            input,
            output,
            reasoning,
            cache_read,
            cache_write,
            cost,
        ) = row?;
        sessions.push(Session {
            id,
            title: title
                .filter(|t| !t.is_empty())
                .unwrap_or_else(|| "(sin título)".to_string()),
            model: model_id(model_raw.as_deref()),
            project_id,
            created: created.unwrap_or(0),
            updated: updated.unwrap_or(0),
            directory: directory.unwrap_or_default(),
            archived: archived.is_some(),
            input: input.unwrap_or(0),
            output: output.unwrap_or(0),
            reasoning: reasoning.unwrap_or(0),
            cache_read: cache_read.unwrap_or(0),
            cache_write: cache_write.unwrap_or(0),
            cost: cost.unwrap_or(0.0),
        });
    }

    if !model.is_empty() {
        let m = model.trim().to_lowercase();
        if !m.is_empty() {
            sessions.retain(|s| s.model.to_lowercase().contains(&m));
        }
    }
    Ok(sessions)
}

/// Nombres de proyectos: `{id: "name  [worktree]"}` si worktree no vacío, sino name.
pub fn project_names(conn: &Connection) -> Result<HashMap<String, String>, ApiError> {
    let mut stmt = conn.prepare("SELECT id, name, worktree FROM project WHERE name IS NOT NULL")?;
    let rows = stmt.query_map([], |r| {
        Ok((
            r.get::<_, String>(0)?,
            r.get::<_, Option<String>>(1)?,
            r.get::<_, Option<String>>(2)?,
        ))
    })?;
    let mut out = HashMap::new();
    for row in rows {
        let (id, name, worktree) = row?;
        let name = name.unwrap_or_default();
        let worktree = worktree.unwrap_or_default();
        out.insert(
            id,
            if worktree.is_empty() {
                name
            } else {
                format!("{name}  [{worktree}]")
            },
        );
    }
    Ok(out)
}

/// Caché de peticiones por sesión con el max(time_updated) escaneado (port de _REQ_CACHE).
/// Cuando la DB crece (max(time_updated) sube) se hace un scan INCREMENTAL de las filas
/// nuevas (time_updated > cached) y se suma al mapa — evita re-escanear ~280K parts
/// (~17 s) en cada refresh; el full scan queda solo para el arranque.
struct ReqCache {
    newest: i64,
    map: HashMap<String, i64>,
}
static REQ_CACHE: LazyLock<Mutex<Option<ReqCache>>> = LazyLock::new(|| Mutex::new(None));

/// Vacía la caché de peticiones (después de mutaciones y para tests).
#[doc(hidden)]
pub fn clear_request_cache() {
    *REQ_CACHE.lock().unwrap() = None;
}

fn scan_request_counts(
    conn: &Connection,
    since: Option<i64>,
) -> Result<HashMap<String, i64>, ApiError> {
    let sql = if since.is_some() {
        "SELECT p.session_id AS sid, COUNT(*) AS n \
         FROM part p JOIN message m ON m.id = p.message_id \
         WHERE p.session_id IN (SELECT id FROM session WHERE time_updated > ?1) \
           AND json_extract(p.data, '$.type') = 'text' \
           AND json_extract(m.data, '$.role') = 'assistant' \
         GROUP BY p.session_id"
    } else {
        "SELECT p.session_id AS sid, COUNT(*) AS n \
         FROM part p JOIN message m ON m.id = p.message_id \
         WHERE json_extract(p.data, '$.type') = 'text' \
           AND json_extract(m.data, '$.role') = 'assistant' \
         GROUP BY p.session_id"
    };
    let rows = if let Some(s) = since {
        let mut stmt = conn.prepare(sql)?;
        let rows = stmt.query_map([s], |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?)))?;
        rows.collect::<Result<HashMap<_, _>, _>>()?
    } else {
        let mut stmt = conn.prepare(sql)?;
        let rows = stmt.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?)))?;
        rows.collect::<Result<HashMap<_, _>, _>>()?
    };
    Ok(rows)
}

/// Peticiones (completions) por sesión. Caché en memoria con scan incremental:
/// si max(session.time_updated) creció, solo se cuentan las filas nuevas y se suman.
pub fn get_request_counts(
    conn: &Connection,
    sessions: &[Session],
) -> Result<HashMap<String, i64>, ApiError> {
    if sessions.is_empty() {
        return Ok(HashMap::new());
    }
    let newest = sessions.iter().map(|s| s.updated).max().unwrap_or(0);
    let cache = REQ_CACHE.lock().unwrap();
    let map = match cache.as_ref() {
        // DB sin cambios (o sesiones más viejas pedidas): datos vigentes
        Some(c) if newest <= c.newest => c.map.clone(),
        // la DB creció: contar solo lo nuevo desde el último scan y sumar
        Some(c) => {
            let incr = scan_request_counts(conn, Some(c.newest))?;
            let mut map = c.map.clone();
            for (sid, n) in incr {
                *map.entry(sid).or_insert(0) += n;
            }
            drop(cache); // soltar el lock antes de re-escribir
            *REQ_CACHE.lock().unwrap() = Some(ReqCache {
                newest,
                map: map.clone(),
            });
            map
        }
        // cache frío: full scan
        None => {
            let map = scan_request_counts(conn, None)?;
            drop(cache);
            *REQ_CACHE.lock().unwrap() = Some(ReqCache {
                newest,
                map: map.clone(),
            });
            map
        }
    };
    Ok(sessions
        .iter()
        .map(|s| (s.id.clone(), map.get(&s.id).copied().unwrap_or(0)))
        .collect())
}

/// Agregación por clave (port de aggregate): suma tokens + cost + n por grupo.
/// Triple-GPU aware: si `sessions.len() > 50k` y `OPENCODE_STATS_GPU` no es `cpu`,
/// elige backend `wgpu` (Intel/AMD/NVIDIA) o `cuda` (NVIDIA) via `crate::gpu::chosen_backend`,
/// pero mantiene paridad CPU — el kernel WGSL/CUDA se activa tras validar `stats_parity`.
pub fn aggregate<F>(sessions: &[Session], key: F) -> HashMap<String, Group>
where
    F: Fn(&Session) -> String,
{
    // Detección lazy (wgpu enumerate es ~10-50ms, solo si >threshold)
    if sessions.len() > 50_000 {
        let backend = crate::gpu::chosen_backend(sessions.len());
        // Log una vez por proceso para diagnóstico triple-GPU
        static LOGGED: std::sync::Once = std::sync::Once::new();
        LOGGED.call_once(|| {
            eprintln!("opencode-stats: backend elegido para {} sessions → {}", sessions.len(), backend);
        });
        // TODO: dispatch a kernel WGSL/CUDA cuando `backend != Cpu` tras validar paridad.
        // Por ahora fallback CPU garantiza idéntico JSON en NVIDIA/Intel/AMD.
        let _ = backend; // evita warning cuando feature gpu off
    }
    // CPU path (rayon opcional para >10k)
    #[cfg(feature = "gpu")]
    if sessions.len() > 10_000 {
        // rayon parallel hashmap con dashmap no es estable para orden; mantener secuencial para paridad.
        // Se activará con `rayon::par_iter` + `fold` tras benchmark.
    }
    let mut groups: HashMap<String, Group> = HashMap::new();
    for s in sessions {
        let g = groups.entry(key(s)).or_default();
        g.input += s.input;
        g.output += s.output;
        g.reasoning += s.reasoning;
        g.cache_read += s.cache_read;
        g.cache_write += s.cache_write;
        g.cost += s.cost;
        g.n += 1;
    }
    groups
}

/// Totales globales de los 5 tokens + cost (n = cantidad de sesiones).
pub fn totals(sessions: &[Session]) -> Group {
    let mut t = Group::default();
    for s in sessions {
        t.input += s.input;
        t.output += s.output;
        t.reasoning += s.reasoning;
        t.cache_read += s.cache_read;
        t.cache_write += s.cache_write;
        t.cost += s.cost;
    }
    t.n = sessions.len();
    t
}

fn sort_cost_desc(v: &mut [(String, Group)]) {
    v.sort_by(|a, b| {
        b.1.cost
            .partial_cmp(&a.1.cost)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
}

/// Agregado por modelo, ordenado por cost desc (port de by_model).
pub fn by_model(sessions: &[Session], top: usize) -> Vec<(String, Group)> {
    let mut v: Vec<(String, Group)> = aggregate(sessions, |s| s.model.clone())
        .into_iter()
        .collect();
    sort_cost_desc(&mut v);
    v.truncate(top);
    v
}

/// Agregado por proyecto (nombres de project_names), cost desc (port de by_project).
pub fn by_project(
    conn: &Connection,
    sessions: &[Session],
    top: usize,
) -> Result<Vec<(String, Group)>, ApiError> {
    let names = project_names(conn)?;
    let mut v: Vec<(String, Group)> = aggregate(sessions, |s| match names.get(&s.project_id) {
        Some(n) => n.clone(),
        None if s.project_id.is_empty() => "(sin proyecto)".to_string(),
        None => s.project_id.clone(),
    })
    .into_iter()
    .collect();
    sort_cost_desc(&mut v);
    v.truncate(top);
    Ok(v)
}

/// Clave de día local "%Y-%m-%d" (port de fromtimestamp(created/1000).strftime).
fn day_key(ts: i64, fmt: &str) -> String {
    let res = Local.timestamp_millis_opt(ts);
    res.earliest()
        .or_else(|| res.latest())
        .map(|dt| dt.naive_local().format(fmt).to_string())
        .unwrap_or_else(|| "?".to_string())
}

/// Agregado por día local (orden lexicográfico = cronológico), clave desc (port de by_day).
pub fn by_day(sessions: &[Session], top: usize) -> Vec<(String, Group)> {
    let mut v: Vec<(String, Group)> = aggregate(sessions, |s| day_key(s.created, "%Y-%m-%d"))
        .into_iter()
        .collect();
    v.sort_by(|a, b| b.0.cmp(&a.0));
    v.truncate(top);
    v
}

/// Agregado por mes local "%Y-%m", clave desc, sin top (port de by_month).
pub fn by_month(sessions: &[Session]) -> Vec<(String, Group)> {
    let mut v: Vec<(String, Group)> = aggregate(sessions, |s| day_key(s.created, "%Y-%m"))
        .into_iter()
        .collect();
    v.sort_by(|a, b| b.0.cmp(&a.0));
    v
}

/// Desglose de uso de tokens por herramienta: cuenta las parts `tool` y
/// atribuye los tokens del `step-finish` con reason "tool-calls" del mismo
/// mensaje, repartidos equitativamente entre las tools del turno.
/// Ordenado por input desc (las herramientas que más contexto consumen primero).
pub fn by_tool(conn: &Connection, sessions: &[Session]) -> Result<Vec<ToolUsage>, ApiError> {
    if sessions.is_empty() {
        return Ok(Vec::new());
    }
    let ids: Vec<String> = sessions.iter().map(|s| s.id.clone()).collect();
    let placeholders = vec!["?"; ids.len()].join(",");

    let mut stmt = conn.prepare(&format!(
        "SELECT message_id, json_extract(data, '$.tool') \
         FROM part WHERE session_id IN ({placeholders}) \
           AND json_extract(data, '$.type') = 'tool'"
    ))?;
    let mut tools_by_msg: HashMap<String, Vec<String>> = HashMap::new();
    for row in stmt.query_map(rusqlite::params_from_iter(ids.iter()), |r| {
        Ok((r.get::<_, String>(0)?, r.get::<_, Option<String>>(1)?))
    })? {
        let (mid, tool) = row?;
        if let Some(t) = tool {
            tools_by_msg.entry(mid).or_default().push(t);
        }
    }

    let mut stmt = conn.prepare(&format!(
        "SELECT p.message_id, json_extract(p.data, '$.tokens.input'), \
                json_extract(p.data, '$.tokens.output'), \
                json_extract(p.data, '$.tokens.reasoning'), \
                json_extract(p.data, '$.tokens.cache.read'), \
                json_extract(p.data, '$.tokens.cache.write'), \
                json_extract(s.model, '$.id') \
         FROM part p JOIN session s ON s.id = p.session_id \
         WHERE p.session_id IN ({placeholders}) \
           AND json_extract(p.data, '$.type') = 'step-finish' \
           AND json_extract(p.data, '$.reason') = 'tool-calls'"
    ))?;
    let mut tok_by_msg: HashMap<String, ([i64; 5], String)> = HashMap::new();
    for row in stmt.query_map(rusqlite::params_from_iter(ids.iter()), |r| {
        Ok((
            r.get::<_, String>(0)?,
            r.get::<_, Option<i64>>(1)?.unwrap_or(0),
            r.get::<_, Option<i64>>(2)?.unwrap_or(0),
            r.get::<_, Option<i64>>(3)?.unwrap_or(0),
            r.get::<_, Option<i64>>(4)?.unwrap_or(0),
            r.get::<_, Option<i64>>(5)?.unwrap_or(0),
            r.get::<_, Option<String>>(6)?.unwrap_or_default(),
        ))
    })? {
        let (mid, i, o, r, cr, cw, model) = row?;
        tok_by_msg.insert(mid, ([i, o, r, cr, cw], model));
    }

    let mut agg: HashMap<String, ToolUsage> = HashMap::new();
    for (mid, tools) in &tools_by_msg {
        let n = tools.len() as f64;
        let Some((tok, model)) = tok_by_msg.get(mid) else {
            continue;
        };
        let turn_cost = estimate_cost(
            &TokenCounts {
                input: tok[0],
                output: tok[1],
                reasoning: tok[2],
                cache_read: tok[3],
                cache_write: tok[4],
            },
            model,
        )
        .unwrap_or(0.0);
        for tool in tools {
            let a = agg.entry(tool.clone()).or_insert_with(|| ToolUsage {
                tool: tool.clone(),
                ..Default::default()
            });
            a.calls += 1;
            a.input += tok[0] as f64 / n;
            a.output += tok[1] as f64 / n;
            a.reasoning += tok[2] as f64 / n;
            a.cache_read += tok[3] as f64 / n;
            a.cache_write += tok[4] as f64 / n;
            a.cost += turn_cost / n;
        }
    }

    let mut v: Vec<ToolUsage> = agg.into_values().collect();
    v.sort_by(|a, b| {
        b.cost
            .partial_cmp(&a.cost)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    Ok(v)
}

/// Sesiones top por cost desc (port de top_sessions); devuelve clones.
pub fn top_sessions(sessions: &[Session], top: usize) -> Vec<Session> {
    let mut v = sessions.to_vec();
    v.sort_by(|a, b| {
        b.cost
            .partial_cmp(&a.cost)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    v.truncate(top);
    v
}

/// Estadísticas globales (port de stats(); None si no hay sesiones).
#[derive(Debug)]
pub struct Stats {
    pub sesiones: usize,
    pub modelos: usize,
    pub costo_medio_sesion: f64,
    pub costo_max_sesion: f64,
    pub costo_min_sesion: f64,
    pub input_medio_sesion: f64,
    pub primera: i64,
    pub ultima: i64,
    pub sesion_mas_cara: Session,
    pub sesion_mas_tokens: Session,
}

/// Port de stats(): vacío -> None; sesion_mas_tokens por input+cache_read,
/// sesion_mas_cara por cost (empates -> primera, como max() de Python).
pub fn stats(sessions: &[Session], totals: &Group) -> Option<Stats> {
    if sessions.is_empty() {
        return None;
    }
    let n = sessions.len();
    let mut modelos = std::collections::HashSet::new();
    let mut sum = 0.0;
    let mut max_cost = f64::MIN;
    let mut min_cost = f64::MAX;
    let mut primera = i64::MAX;
    let mut ultima = i64::MIN;
    let mut mas_cara: Option<&Session> = None;
    let mut mas_tokens: Option<&Session> = None;
    for s in sessions {
        modelos.insert(s.model.clone());
        sum += s.cost;
        max_cost = max_cost.max(s.cost);
        min_cost = min_cost.min(s.cost);
        primera = primera.min(s.created);
        ultima = ultima.max(s.updated);
        if mas_cara.is_none_or(|m| s.cost > m.cost) {
            mas_cara = Some(s);
        }
        if mas_tokens.is_none_or(|m| s.input + s.cache_read > m.input + m.cache_read) {
            mas_tokens = Some(s);
        }
    }
    Some(Stats {
        sesiones: n,
        modelos: modelos.len(),
        costo_medio_sesion: sum / n as f64,
        costo_max_sesion: max_cost,
        costo_min_sesion: min_cost,
        input_medio_sesion: totals.input as f64 / n as f64,
        primera,
        ultima,
        sesion_mas_cara: mas_cara.expect("sessions no vacío").clone(),
        sesion_mas_tokens: mas_tokens.expect("sessions no vacío").clone(),
    })
}
