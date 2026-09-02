//! Tests de pricing.rs — defaults, estimación, cuotas, overrides.
use std::collections::HashMap;

use opencode_stats::pricing;
use opencode_stats::types::{Price, TokenCounts};

mod common;
use common::session;

fn tokens(i: i64, o: i64, r: i64) -> TokenCounts {
    TokenCounts {
        input: i,
        output: o,
        reasoning: r,
        cache_read: 0,
        cache_write: 0,
    }
}

#[test]
fn test_defaults() {
    assert_eq!(pricing::default_prices().len(), 18);
    assert_eq!(pricing::default_limits().len(), 17);
    assert_eq!(pricing::default_model_names().len(), 18);
    assert_eq!(pricing::default_prices()["deepseek-v4-flash"].input, 0.14);
    assert_eq!(pricing::default_prices()["deepseek-v4-flash"].output, 0.28);
    assert_eq!(
        pricing::default_limits()["deepseek-v4-flash"],
        (31650, 79050, 158150)
    );
    assert_eq!(pricing::default_model_names()["hy3"], "Hy3");
    // orden de definición preservado (frontend renderiza prices en ese orden)
    assert_eq!(pricing::MODEL_ORDER.len(), 18);
    assert_eq!(pricing::MODEL_ORDER[0], "grok-4.5");
    assert_eq!(pricing::MODEL_ORDER[17], "hy3");
    let ordered = pricing::prices_ordered();
    assert_eq!(ordered.len(), 18);
    assert_eq!(ordered[0].0, "grok-4.5");
}

#[test]
fn test_estimate_cost() {
    let c = pricing::estimate_cost(&tokens(1_000_000, 1_000_000, 0), "deepseek-v4-flash").unwrap();
    assert!((c - 0.42).abs() < 1e-9);
    assert!(pricing::estimate_cost(&tokens(0, 0, 0), "modelo-inexistente").is_none());
    // reasoning se factura como output
    let c = pricing::estimate_cost(&tokens(0, 0, 1_000_000), "deepseek-v4-flash").unwrap();
    assert!((c - 0.28).abs() < 1e-9);
}

#[test]
fn test_usage_by_window() {
    let now = chrono::Local::now().timestamp_millis();
    let sessions = vec![
        session(now - 1000, now),            // reciente
        session(now - 40 * 86_400_000, now), // > mes
    ];
    let mut req = HashMap::new();
    req.insert(sessions[0].id.clone(), 5);
    req.insert(sessions[1].id.clone(), 7);
    let u = pricing::usage_by_window(&sessions, &req, Some(now));
    assert_eq!(u["x"].h5, 5);
    assert_eq!(u["x"].semana, 5);
    assert_eq!(u["x"].mes, 5);
}

#[test]
fn test_quota_status() {
    assert_eq!(pricing::quota_status("x", 0, None), None);
    assert_eq!(
        pricing::quota_status("x", 100, Some(100)),
        Some("AGOTADO".to_string())
    );
    assert_eq!(
        pricing::quota_status("x", 70, Some(100)),
        Some("70%".to_string())
    );
    assert_eq!(
        pricing::quota_status("x", 50, Some(100)),
        Some("OK".to_string())
    );
}

#[test]
fn test_overrides_roundtrip() {
    let dir = tempfile::tempdir().unwrap();
    let p = dir.path().join("pricing_overrides.json");
    pricing::set_overrides_path(p.clone());
    pricing::reset_to_defaults();
    let mut prices = pricing::default_prices();
    prices.insert(
        "test-modelo".to_string(),
        Price {
            input: 1.0,
            output: 2.0,
            cache_read: 0.1,
            cache_write: 0.0,
        },
    );
    let mut limits = HashMap::new();
    limits.insert("test-modelo".to_string(), (10, 20, 30));
    let mut names = HashMap::new();
    names.insert("test-modelo".to_string(), "Test Modelo".to_string());
    pricing::save_overrides(prices, limits, names).unwrap();
    assert_eq!(pricing::prices()["test-modelo"].input, 1.0);
    assert_eq!(pricing::limits()["test-modelo"], (10, 20, 30));
    assert_eq!(pricing::model_names()["test-modelo"], "Test Modelo");
    // recarga desde el archivo (como el import de Python)
    pricing::reset_to_defaults();
    assert!(!pricing::prices().contains_key("test-modelo"));
    pricing::apply_overrides_from_file().unwrap();
    assert_eq!(pricing::prices()["test-modelo"].input, 1.0);
    // reset limpio
    pricing::reset_to_defaults();
    assert!(!pricing::prices().contains_key("test-modelo"));
}
