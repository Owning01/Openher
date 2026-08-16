//! Stats integrado: levanta el server de opencode-stats (lib) en un thread
//! lazy. El frontend lo muestra en un iframe a http://127.0.0.1:8765.

use std::sync::{Arc, Mutex};

use crate::state::AppState;

const STATS_PORT: u16 = 8765;

pub struct StatsManager {
    running: Mutex<bool>,
}

impl StatsManager {
    pub fn new() -> Self {
        Self {
            running: Mutex::new(false),
        }
    }

    pub fn status(&self) -> serde_json::Value {
        let running = *self.running.lock().unwrap();
        let alive = probe(STATS_PORT);
        serde_json::json!({
            "running": running || alive,
            "port": STATS_PORT,
            "url": format!("http://127.0.0.1:{STATS_PORT}"),
        })
    }
}

fn probe(port: u16) -> bool {
    let url = format!("http://127.0.0.1:{port}/api/data?raw=1");
    ureq::get(&url)
        .timeout(std::time::Duration::from_millis(800))
        .call()
        .map(|r| r.status() == 200)
        .unwrap_or(false)
}

/// Arranca (si no está) el server de stats en un thread. Idempotente.
pub fn ensure(state: &Arc<AppState>) {
    {
        let mut running = state.stats.running.lock().unwrap();
        if *running {
            return;
        }
        if probe(STATS_PORT) {
            *running = true;
            return;
        }
        *running = true; // reserva el slot antes de spawnear
    }
    let state = state.clone();
    std::thread::Builder::new()
        .name("stats".into())
        .spawn(move || {
            let _ = opencode_stats::server::serve(STATS_PORT);
            if let Ok(mut r) = state.stats.running.lock() {
                *r = false;
            }
        })
        .ok();
}

pub fn arc() -> Arc<StatsManager> {
    static STATS: std::sync::OnceLock<Arc<StatsManager>> = std::sync::OnceLock::new();
    STATS.get_or_init(|| Arc::new(StatsManager::new())).clone()
}