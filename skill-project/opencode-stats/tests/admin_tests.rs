//! Tests de la capa de gestión — port de tests/test_admin.py (fixture de conftest.py).
use rusqlite::params;
use serde_json::Value;

use opencode_stats::admin;
use opencode_stats::db;
use opencode_stats::types::Guard;

mod common;
use common::{count, with_db};

pub use common::now_ms;

// ---------- delete ----------

#[test]
fn test_delete_dry_run() {
    with_db(|con, _| {
        let r = admin::delete_sessions(
            vec!["s_old".to_string()],
            Guard {
                dry_run: true,
                force: false,
            },
        )
        .unwrap();
        assert!(r["dry_run"] == true);
        assert_eq!(r["rows"][0]["messages"], 1);
        assert_eq!(r["rows"][0]["parts"], 1);
        assert_eq!(r["rows"][0]["events"], 3);
        assert_eq!(count(con, "session", "id='s_old'"), 1);
    });
}

#[test]
fn test_delete_removes_all() {
    with_db(|con, _| {
        let r = admin::delete_sessions(
            vec!["s_old".to_string()],
            Guard {
                dry_run: false,
                force: true,
            },
        )
        .unwrap();
        assert_eq!(r["deleted"], 1);
        assert!(!r["backup"].as_str().unwrap().is_empty());
        assert_eq!(count(con, "session", "id='s_old'"), 0);
        assert_eq!(count(con, "message", "session_id='s_old'"), 0);
        assert_eq!(count(con, "part", "session_id='s_old'"), 0);
        assert_eq!(count(con, "event", "aggregate_id='s_old'"), 0);
        assert_eq!(count(con, "event_sequence", "aggregate_id='s_old'"), 0);
        assert_eq!(count(con, "session", "id='s_new'"), 1);
    });
}

#[test]
fn test_delete_blocked_when_opencode_running() {
    with_db(|con, _| {
        admin::set_opencode_running_mock(Some(true));
        let r = admin::delete_sessions(
            vec!["s_old".to_string()],
            Guard {
                dry_run: true,
                force: false,
            },
        );
        assert!(r.is_err());
        let ok = admin::delete_sessions(
            vec!["s_old".to_string()],
            Guard {
                dry_run: false,
                force: true,
            },
        )
        .unwrap();
        assert_eq!(ok["deleted"], 1);
        assert_eq!(count(con, "session", "id='s_old'"), 0);
        admin::set_opencode_running_mock(Some(false));
    });
}

// ---------- move ----------

#[test]
fn test_move_updates_session_and_events() {
    with_db(|con, dir| {
        let dest = dir.join("otra-ruta");
        std::fs::create_dir_all(&dest).unwrap();
        let dest_str = dest.to_string_lossy().replace('/', "\\");
        let r = admin::move_sessions(
            vec!["s_old".to_string()],
            &dest_str,
            Guard {
                dry_run: false,
                force: true,
            },
        )
        .unwrap();
        assert_eq!(r["moved"], 1);
        let pid = r["project_id"].as_str().unwrap().to_string();
        let (proj, directory): (String, String) = con
            .query_row(
                "SELECT project_id, directory FROM session WHERE id='s_old'",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap();
        assert_eq!(proj, pid);
        assert_eq!(directory.replace('/', "\\"), dest_str);
        for typ in ["session.created.1", "session.updated.1"] {
            let data: String = con
                .query_row(
                    "SELECT data FROM event WHERE aggregate_id='s_old' AND type=?1",
                    params![typ],
                    |r| r.get(0),
                )
                .unwrap();
            let v: Value = serde_json::from_str(&data).unwrap();
            assert_eq!(
                v["info"]["directory"].as_str().unwrap().replace('/', "\\"),
                dest_str
            );
            assert_eq!(v["info"]["projectID"].as_str().unwrap(), pid);
        }
        assert_eq!(
            count(
                con,
                "project_directory",
                &format!("project_id='{}' AND directory='{}'", pid, dest_str)
            ),
            1
        );
    });
}

// ---------- prune ----------

#[test]
fn test_prune_only_closed() {
    with_db(|con, _| {
        let cutoff = chrono::Local::now()
            .checked_sub_days(chrono::Days::new(30))
            .unwrap()
            .format("%Y-%m-%d")
            .to_string();
        let r = admin::prune_sessions(
            &cutoff,
            Guard {
                dry_run: true,
                force: true,
            },
        )
        .unwrap();
        let ids: Vec<&str> = r["rows"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x["session"].as_str().unwrap())
            .collect();
        assert_eq!(ids, vec!["s_old"]);
        let r = admin::prune_sessions(
            &cutoff,
            Guard {
                dry_run: false,
                force: true,
            },
        )
        .unwrap();
        assert_eq!(r["deleted"], 1);
        assert_eq!(count(con, "session", "id='s_new'"), 1);
    });
}

// ---------- restore ----------

#[test]
fn test_restore_roundtrip() {
    with_db(|con, _| {
        let (orig_title, orig_dir): (String, String) = con
            .query_row(
                "SELECT title, directory FROM session WHERE id='s_old'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap();
        let r = admin::delete_sessions(
            vec!["s_old".to_string()],
            Guard {
                dry_run: false,
                force: true,
            },
        )
        .unwrap();
        assert_eq!(r["deleted"], 1);
        let backups = admin::list_backups();
        assert!(backups["last"]["path"].is_string());
        assert!(!backups["backups"].as_array().unwrap().is_empty());
        let path = backups["last"]["path"].as_str().unwrap().to_string();
        let r = admin::restore_session(
            &path,
            Guard {
                dry_run: false,
                force: true,
            },
        )
        .unwrap();
        assert_eq!(r["restored"], 1);
        let (title, directory): (String, String) = con
            .query_row(
                "SELECT title, directory FROM session WHERE id='s_old'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap();
        assert_eq!(title, orig_title);
        assert_eq!(directory, orig_dir);
        assert_eq!(count(con, "message", "session_id='s_old'"), 1);
        assert_eq!(count(con, "part", "session_id='s_old'"), 1);
    });
}

#[test]
fn test_restore_does_not_overwrite() {
    with_db(|con, _| {
        let _r = admin::delete_sessions(
            vec!["s_old".to_string()],
            Guard {
                dry_run: false,
                force: true,
            },
        )
        .unwrap();
        let path = admin::list_backups()["last"]["path"]
            .as_str()
            .unwrap()
            .to_string();
        let r1 = admin::restore_session(
            &path,
            Guard {
                dry_run: false,
                force: true,
            },
        )
        .unwrap();
        assert_eq!(r1["restored"], 1);
        let r2 = admin::restore_session(
            &path,
            Guard {
                dry_run: false,
                force: true,
            },
        )
        .unwrap();
        assert_eq!(r2["restored"], 0);
        assert_eq!(count(con, "session", "id='s_old'"), 1);
    });
}

// ---------- session detail ----------

#[test]
fn test_session_detail() {
    with_db(|_, _| {
        let d = admin::session_detail("s_old").unwrap();
        assert_eq!(d["title"], "Sesión vieja");
        assert_eq!(d["messages"], 1);
        assert_eq!(d["events"], 3);
        assert_eq!(d["model"], "deepseek-v4-flash");
        assert_eq!(d["parts_by_type"][0]["typ"], "text");
    });
}

// ---------- export ----------

#[test]
fn test_export() {
    with_db(|_, _| {
        let r = admin::export_sessions(vec!["s_old".to_string()]).unwrap();
        assert_eq!(r["sessions"]["s_old"]["session"]["title"], "Sesión vieja");
    });
}

// ---------- pricing ----------

#[test]
fn test_save_pricing() {
    with_db(|_, _| {
        let prices =
            serde_json::json!({"test-modelo": {"in": 1.0, "out": 2.0, "cr": 0.1, "cw": 0.0}});
        let limits = serde_json::json!({"test-modelo": [10, 20, 30]});
        let names = serde_json::json!({"test-modelo": "Test Modelo"});
        let r = admin::save_pricing(prices, limits, names).unwrap();
        assert_eq!(r["saved"], true);
        assert!(r["models"].as_u64().unwrap() >= 1);
        let bad = admin::save_pricing(
            serde_json::json!({"x": {"in": 1}}),
            serde_json::json!({}),
            serde_json::json!({}),
        );
        assert!(bad.is_err());
    });
}

// ---------- set_db ----------

#[test]
fn test_set_db_path() {
    with_db(|_, dir| {
        let target = dir.join("otra-db").join("opencode.db");
        let r = admin::set_db_path(target.to_str().unwrap()).unwrap();
        assert_eq!(r["saved"], true);
        assert_eq!(db::saved_db_path().unwrap(), target);
        assert!(db::config_path().exists());
        let bad = admin::set_db_path("   ").unwrap();
        assert_eq!(
            bad["error"].as_str().unwrap(),
            "La ruta no puede estar vacía"
        );
    });
}

// ---------- status / vacuum / full backup ----------

#[test]
fn test_status() {
    with_db(|_, _| {
        let s = admin::status().unwrap();
        assert!(s["db_mb"].as_f64().unwrap() > 0.0);
        assert_eq!(s["projects"][0]["name"], "Proy");
        assert!(s["page_count"].as_i64().unwrap() > 0);
        assert_eq!(s["opencode_running"], false);
    });
}

#[test]
fn test_vacuum() {
    with_db(|_, _| {
        let r = admin::vacuum().unwrap();
        assert!(r["before_mb"].as_f64().unwrap() > 0.0);
        assert!(r["after_mb"].as_f64().unwrap() > 0.0);
    });
}

#[test]
fn test_full_backup() {
    with_db(|_, dir| {
        let dest = dir.join("backup-full");
        let r = admin::full_backup(Some(dest.to_str().unwrap())).unwrap();
        assert!(dest.join("opencode.db").exists());
        assert!(r["size_mb"].as_f64().unwrap() > 0.0);
    });
}

// ---------- event weights ----------

#[test]
fn test_event_weights() {
    with_db(|con, _| {
        let sessions = db::load_sessions(con, "", "", "").unwrap();
        let w = admin::event_weights(con, &sessions).unwrap();
        let (n, bytes) = w.get("s_old").unwrap();
        assert_eq!(*n, 3);
        assert!(*bytes > 0);
    });
}
