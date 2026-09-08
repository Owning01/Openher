//! Stats: detecta si un servidor de stats externo está corriendo en :8765.
//! Ya no embebe el motor de base de datos opencode-stats en el binario.

use std::sync::Arc;

use crate::state::AppState;

const STATS_PORT: u16 = 8765;

#[derive(Default)]
pub struct StatsManager;

impl StatsManager {
    pub fn new() -> Self {
        Self
    }

    pub fn status(&self) -> serde_json::Value {
        let alive = probe(STATS_PORT);
        serde_json::json!({
            "running": alive,
            "port": STATS_PORT,
            "url": format!("http://127.0.0.1:{STATS_PORT}"),
        })
    }
}

fn probe(port: u16) -> bool {
    crate::common::probe_http(
        port,
        "/api/data?raw=1&scope=summary",
        std::time::Duration::from_millis(2000),
        &[200],
    )
}

/// Ya no levanta servidor embebido. Mantiene la firma para compatibilidad.
pub fn ensure(_state: &Arc<AppState>) {
    // No-op: opencode-stats no está embebido
}

#[allow(dead_code)]
pub fn arc() -> Arc<StatsManager> {
    static STATS: std::sync::OnceLock<Arc<StatsManager>> = std::sync::OnceLock::new();
    STATS.get_or_init(|| Arc::new(StatsManager::new())).clone()
}