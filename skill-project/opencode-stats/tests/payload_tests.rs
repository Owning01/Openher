//! Tests de payload.rs (build_payload) — port de test_payload_* del Python.
use opencode_stats::db;
use opencode_stats::payload::build_payload;
use opencode_stats::types::Group;

mod common;
use common::with_db;

fn payload(
    con: &rusqlite::Connection,
    since: &str,
    until: &str,
    model: &str,
    raw: bool,
    scope: &str,
) -> serde_json::Value {
    build_payload(con, since, until, model, raw, scope).unwrap()
}

#[test]
fn test_payload_full() {
    with_db(|con, _| {
        let d = payload(con, "", "", "", true, "all");
        assert_eq!(d["meta"]["sessions"], 2);
        assert_eq!(d["by_model"].as_array().unwrap().len(), 2);
        assert!(d.get("limits").is_some()); // vacío sin peticiones assistant en el seed
        assert!(d["today"]["cost"].as_f64().is_some());
        assert_eq!(d["by_project"][0]["key"], "Proy  [G:/proy]");
        assert_eq!(d["prices"].as_array().unwrap().len(), 18);
        assert_eq!(d["sessions"].as_array().unwrap().len(), 2);
        assert!(!d["days"].as_array().unwrap().is_empty());
        assert_eq!(d["meta"]["db"], "opencode.db");
        assert_eq!(d["meta"]["filtered"], false);
    });
}

#[test]
fn test_payload_scope_summary_is_light() {
    with_db(|con, _| {
        let d = payload(con, "", "", "", true, "summary");
        assert!(d.get("by_model").is_none());
        assert!(d.get("limits").is_none());
        assert!(d.get("sessions").is_none());
        assert!(d.get("totals").is_some());
        assert!(d.get("today").is_some());
        assert!(d["today"]["requests"].is_null());
    });
}

#[test]
fn test_payload_scope_modelo() {
    with_db(|con, _| {
        let d = payload(con, "", "", "", true, "modelo");
        assert!(d.get("by_model").is_some());
        assert!(d.get("totals").is_none());
    });
}

#[test]
fn test_payload_scope_limites() {
    with_db(|con, _| {
        let d = payload(con, "", "", "", true, "limites");
        assert!(d.get("limits").is_some());
        assert!(d.get("prices").is_some());
        assert!(d.get("by_model").is_none());
    });
}

#[test]
fn test_payload_formats() {
    with_db(|con, _| {
        let d = payload(con, "", "", "", false, "summary");
        // raw=false → strings formateados
        assert!(d["totals"]["input"].is_string());
        assert_eq!(d["totals"]["input"], "2.0 K"); // _fmt(2000) = "2.0 K"
        assert!(d["cost"].as_str().unwrap().starts_with('$'));
        assert!(d["meta"]["avg_cost"].is_string());
        assert_eq!(d["meta"]["avg_cost"], "2.3500");
        // raw=true → números
        let d = payload(con, "", "", "", true, "summary");
        assert!(d["totals"]["input"].is_number());
        assert!(d["meta"]["avg_cost"].is_number());
    });
}

#[test]
fn test_payload_est_total_raw() {
    with_db(|con, _| {
        let d = payload(con, "", "", "", true, "summary");
        assert!(d["est_total"].as_f64().unwrap() > 0.0);
        let d = payload(con, "", "", "", false, "summary");
        assert!(d["est_total"].as_str().unwrap().starts_with('$'));
    });
}

#[test]
fn test_payload_filtered() {
    with_db(|con, _| {
        let d = payload(con, "2020-01-01", "", "", true, "all");
        assert_eq!(d["meta"]["filtered"], true);
    });
}

#[test]
fn test_payload_days_tokens_requests() {
    with_db(|con, _| {
        let d = payload(con, "", "", "", true, "summary");
        assert!(!d["days_tokens"].as_array().unwrap().is_empty());
        let d = payload(con, "", "", "", true, "usage");
        assert!(!d["days_requests"].as_array().unwrap().is_empty());
    });
}

#[test]
fn test_payload_by_model_shape() {
    with_db(|con, _| {
        let d = payload(con, "", "", "", true, "modelo");
        let m = &d["by_model"][0];
        for k in [
            "model",
            "id",
            "sessions",
            "requests",
            "input",
            "output",
            "reasoning",
            "cache_read",
            "cache_write",
            "cost",
            "est",
        ] {
            assert!(m.get(k).is_some(), "falta {k}");
        }
        assert_eq!(d["by_model"][0]["model"], "GPT 5.6 Luna"); // orden por cost desc
    });
}

#[test]
fn test_payload_stats_highlights() {
    with_db(|con, _| {
        let d = payload(con, "", "", "", false, "summary");
        assert!(
            d["stats"]["mas_cara"]["cost"]
                .as_str()
                .unwrap()
                .starts_with('$')
        );
        assert!(d["stats"]["input_medio"].is_string());
    });
}

#[test]
fn test_payload_empty_sessions() {
    with_db(|con, _| {
        let d = payload(con, "2099-01-01", "", "", true, "all");
        assert_eq!(d["meta"]["sessions"], 0);
        assert_eq!(d["meta"]["since"], "—");
        assert_eq!(d["stats"]["mas_cara"]["title"], "—");
        assert_eq!(d["days"].as_array().unwrap().len(), 0);
        // totals sin sesiones: ceros
        let t = db::totals(&[]);
        assert_eq!(t, Group::default());
    });
}
