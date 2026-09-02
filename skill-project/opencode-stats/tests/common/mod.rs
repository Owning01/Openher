//! Fixture compartido de tests: schema de 13 tablas + seed (port de tests/conftest.py).
#![allow(dead_code)]
use std::sync::Mutex;

use rusqlite::{Connection, params};

use opencode_stats::admin;
use opencode_stats::types::Session;

static LOCK: Mutex<()> = Mutex::new(());

pub const SCHEMA: &str = "
CREATE TABLE project (
  id TEXT PRIMARY KEY, worktree TEXT NOT NULL, vcs TEXT, name TEXT,
  sandboxes TEXT NOT NULL DEFAULT '[]', time_created INTEGER, time_updated INTEGER
);
CREATE TABLE session (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, workspace_id TEXT, parent_id TEXT,
  slug TEXT NOT NULL, directory TEXT NOT NULL, path TEXT, title TEXT NOT NULL,
  version TEXT NOT NULL, share_url TEXT, summary_additions INTEGER, summary_deletions INTEGER,
  summary_files INTEGER, summary_diffs TEXT, metadata TEXT, cost REAL NOT NULL DEFAULT 0,
  tokens_input INTEGER NOT NULL DEFAULT 0, tokens_output INTEGER NOT NULL DEFAULT 0,
  tokens_reasoning INTEGER NOT NULL DEFAULT 0, tokens_cache_read INTEGER NOT NULL DEFAULT 0,
  tokens_cache_write INTEGER NOT NULL DEFAULT 0, revert TEXT, permission TEXT, agent TEXT,
  model TEXT, time_created INTEGER, time_updated INTEGER, time_compacting INTEGER,
  time_archived INTEGER
);
CREATE TABLE message (
  id TEXT PRIMARY KEY, session_id TEXT NOT NULL, time_created INTEGER, time_updated INTEGER, data TEXT NOT NULL
);
CREATE TABLE part (
  id TEXT PRIMARY KEY, message_id TEXT NOT NULL, session_id TEXT NOT NULL,
  time_created INTEGER, time_updated INTEGER, data TEXT NOT NULL
);
CREATE TABLE todo (
  session_id TEXT NOT NULL, content TEXT NOT NULL, status TEXT NOT NULL,
  priority TEXT NOT NULL, position INTEGER NOT NULL, time_created INTEGER, time_updated INTEGER,
  PRIMARY KEY (session_id, position)
);
CREATE TABLE session_message (
  id TEXT PRIMARY KEY, session_id TEXT NOT NULL, type TEXT NOT NULL, seq INTEGER NOT NULL,
  time_created INTEGER, time_updated INTEGER, data TEXT NOT NULL
);
CREATE TABLE session_input (
  id TEXT PRIMARY KEY, session_id TEXT NOT NULL, prompt TEXT NOT NULL, delivery TEXT NOT NULL,
  admitted_seq INTEGER NOT NULL, promoted_seq INTEGER, time_created INTEGER
);
CREATE TABLE session_context_epoch (
  session_id TEXT PRIMARY KEY, baseline TEXT NOT NULL, snapshot TEXT NOT NULL, baseline_seq INTEGER NOT NULL
);
CREATE TABLE project_directory (
  project_id TEXT NOT NULL, directory TEXT NOT NULL, type TEXT, strategy TEXT,
  time_created INTEGER NOT NULL, PRIMARY KEY (project_id, directory)
);
CREATE TABLE event_sequence (aggregate_id TEXT PRIMARY KEY, seq INTEGER NOT NULL, owner_id TEXT);
CREATE TABLE event (
  id TEXT PRIMARY KEY, aggregate_id TEXT NOT NULL, seq INTEGER NOT NULL,
  type TEXT NOT NULL, data TEXT NOT NULL
);
";

/// Timestamp "ahora" del fixture anclado a mediodía local (evita flakiness de medianoche:
/// s_new = now-1h siempre cae en el mismo día).
pub fn now_ms() -> i64 {
    use chrono::{Local, TimeZone};
    let noon = Local::now().date_naive().and_hms_opt(12, 0, 0).unwrap();
    Local
        .from_local_datetime(&noon)
        .single()
        .or_else(|| Local.from_local_datetime(&noon).earliest())
        .or_else(|| Local.from_local_datetime(&noon).latest())
        .map(|dt| dt.timestamp_millis())
        .unwrap_or_else(|| {
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as i64
        })
}

/// Sesión sintética mínima (modelo "x") para tests de pricing/payload.
pub fn session(created: i64, updated: i64) -> Session {
    Session {
        id: format!("sid_{created}"),
        title: "T".to_string(),
        model: "x".to_string(),
        project_id: "p".to_string(),
        created,
        updated,
        directory: "/dir".to_string(),
        archived: false,
        input: 1000,
        output: 500,
        reasoning: 100,
        cache_read: 50,
        cache_write: 20,
        cost: 1.0,
    }
}

pub fn seed(con: &Connection) {
    let now = now_ms();
    con.execute(
        "INSERT INTO project (id, worktree, name, sandboxes, time_created, time_updated) VALUES ('p1', 'G:/proy', 'Proy', '[]', ?1, ?2)",
        params![now, now],
    )
    .unwrap();
    let old = now - 90 * 86_400_000;
    for (sid, title, created, updated, model, cost, cache_read) in [
        (
            "s_old",
            "Sesión vieja",
            old,
            old,
            r#"{"id":"deepseek-v4-flash"}"#,
            1.5,
            40,
        ),
        (
            "s_new",
            "Sesión nueva",
            now - 3_600_000,
            now,
            r#"{"id":"gpt-5.6-luna"}"#,
            3.2,
            50,
        ),
    ] {
        con.execute(
            "INSERT INTO session VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,?25,?26,?27,?28,?29)",
            params![
                sid, "p1", None::<String>, None::<String>, format!("slug-{sid}"), "G:/proy", "",
                title, "1", None::<String>, 10, 5, 2, None::<String>, "{}", cost,
                1000, 500, 100, cache_read, 20, None::<String>, None::<String>, None::<String>,
                model, created, updated, None::<i64>, None::<i64>
            ],
        )
        .unwrap();
        con.execute(
            "INSERT INTO message VALUES (?1,?2,?3,?4,?5)",
            params![
                format!("msg_{sid}"),
                sid,
                created,
                created,
                format!(r#"{{"id":"msg_{sid}","role":"user","time":{{"created":{created}}}}}"#)
            ],
        )
        .unwrap();
        con.execute(
            "INSERT INTO part VALUES (?1,?2,?3,?4,?5,?6)",
            params![
                format!("prt_{sid}"),
                format!("msg_{sid}"),
                sid,
                created,
                created,
                format!(r#"{{"id":"prt_{sid}","type":"text","text":"hola"}}"#)
            ],
        )
        .unwrap();
        con.execute(
            "INSERT INTO event_sequence VALUES (?1,?2,NULL)",
            params![sid, 2],
        )
        .unwrap();
        con.execute(
            "INSERT INTO event VALUES (?1,?2,?3,?4,?5)",
            params![
                format!("evt_c_{sid}"), sid, 0, "session.created.1",
                format!(r#"{{"sessionID":"{sid}","info":{{"id":"{sid}","directory":"G:/proy","path":"","projectID":"p1","title":"{title}"}}}}"#)
            ],
        )
        .unwrap();
        con.execute(
            "INSERT INTO event VALUES (?1,?2,?3,?4,?5)",
            params![
                format!("evt_u_{sid}"), sid, 1, "session.updated.1",
                format!(r#"{{"sessionID":"{sid}","info":{{"id":"{sid}","directory":"G:/proy","path":"","projectID":"p1","title":"{title}"}}}}"#)
            ],
        )
        .unwrap();
        con.execute(
            "INSERT INTO event VALUES (?1,?2,?3,?4,?5)",
            params![
                format!("evt_m_{sid}"), sid, 2, "message.updated.1",
                format!(r#"{{"sessionID":"{sid}","info":{{"id":"msg_{sid}","time":{{"created":{created}}}}}}}"#)
            ],
        )
        .unwrap();
    }
}

/// Crea DB temporal con seed, setea OPENCODE_DB + backups dir + mock opencode cerrado.
/// Aísla también pricing_overrides y limpia las caches estáticas.
pub fn with_db<T>(f: impl FnOnce(&Connection, &std::path::Path) -> T) -> T {
    let _g = LOCK.lock().unwrap_or_else(|e| e.into_inner());
    let dir = tempfile::tempdir().unwrap();
    let dbp = dir.path().join("opencode.db");
    let con = Connection::open(&dbp).unwrap();
    con.execute_batch(SCHEMA).unwrap();
    seed(&con);
    drop(con);
    // edición 2024: set_var/remove_var son unsafe (test single-threaded serializado por LOCK)
    unsafe { std::env::set_var("OPENCODE_DB", &dbp) };
    admin::set_backups_dir(dir.path().join("backups"));
    admin::set_opencode_running_mock(Some(false));
    opencode_stats::db::set_config_dir_for_tests(Some(dir.path().join("config")));
    let prev_overrides = opencode_stats::pricing::current_overrides_path_for_tests();
    opencode_stats::pricing::set_overrides_path(dir.path().join("pricing_overrides.json"));
    opencode_stats::pricing::reset_to_defaults();
    opencode_stats::db::clear_request_cache();
    admin::clear_event_cache();
    let con = Connection::open(&dbp).unwrap();
    let out = f(&con, dir.path());
    admin::clear_event_cache();
    opencode_stats::db::clear_request_cache();
    opencode_stats::pricing::reset_to_defaults();
    opencode_stats::pricing::set_overrides_path(prev_overrides);
    opencode_stats::db::set_config_dir_for_tests(None);
    admin::set_opencode_running_mock(None);
    unsafe { std::env::remove_var("OPENCODE_DB") };
    out
}

pub fn count(con: &Connection, table: &str, where_clause: &str) -> i64 {
    con.query_row(
        &format!("SELECT COUNT(*) FROM {table} WHERE {where_clause}"),
        [],
        |r| r.get(0),
    )
    .unwrap()
}
