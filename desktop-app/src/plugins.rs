//! Plugins (data/plugins/<name>/plugin.json) + Labs (apps del ecosistema).

use std::path::Path;
use std::process::Child;
use std::sync::{Arc, Mutex};

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct PluginManifest {
    pub name: String,
    pub title: Option<String>,
    #[serde(rename = "type")]
    pub kind: String, // "web" | "command" | "link"
    pub url: Option<String>,
    pub command: Option<String>,
    pub cwd: Option<String>,
    pub description: Option<String>,
    pub version: Option<String>,
}

pub struct PluginRegistry {
    pub plugins: Mutex<Vec<PluginManifest>>,
    running: Mutex<Vec<(String, Child)>>,
}

impl PluginRegistry {
    pub fn new() -> Self {
        Self {
            plugins: Mutex::new(Vec::new()),
            running: Mutex::new(Vec::new()),
        }
    }

    pub fn scan(&self) -> Vec<serde_json::Value> {
        let dir = crate::state::plugins_dir();
        let mut out = Vec::new();
        if let Ok(rd) = std::fs::read_dir(&dir) {
            for e in rd.flatten() {
                let manifest_path = e.path().join("plugin.json");
                if let Ok(raw) = std::fs::read_to_string(&manifest_path) {
                    if let Ok(m) = serde_json::from_str::<PluginManifest>(&raw) {
                        out.push(serde_json::json!({
                            "name": m.name,
                            "title": m.title.as_deref().unwrap_or(&m.name),
                            "type": m.kind,
                            "description": m.description.as_deref().unwrap_or(""),
                            "version": m.version.as_deref().unwrap_or("0.0.0"),
                        }));
                    }
                }
            }
        }
        *self.plugins.lock().unwrap_or_else(|e| e.into_inner()) = out
            .iter()
            .filter_map(|v| serde_json::from_value(v.clone()).ok())
            .collect();
        out
    }

    pub fn list(&self) -> serde_json::Value {
        let plugins = self.plugins.lock().unwrap_or_else(|e| e.into_inner()).clone();
        serde_json::json!({ "plugins": plugins })
    }

    /// Sirve archivos de un plugin web desde data/plugins/<name>.
    pub fn serve_web(&self, name: &str, rel: &str) -> Option<(Vec<u8>, String)> {
        let root = crate::state::plugins_dir().join(name);
        let (bytes, mime) = crate::common::serve_file(&root, rel)?;
        Some((bytes, mime.to_string()))
    }

    pub fn run_command(&self, name: &str) -> Result<serde_json::Value, String> {
        let plugins = self.plugins.lock().unwrap_or_else(|e| e.into_inner());
        let m = plugins.iter().find(|p| p.name == name).ok_or("plugin no existe")?;
        let cmd = m.command.as_deref().ok_or("sin comando")?;
        let cwd = m.cwd.as_deref().map(Path::new);
        let child = crate::common::spawn_detached(cmd, cwd)?;
        let pid = child.id();
        self.running.lock().unwrap_or_else(|e| e.into_inner()).push((name.to_string(), child));
        Ok(serde_json::json!({ "started": true, "pid": pid }))
    }

    pub fn running(&self) -> serde_json::Value {
        let running = self.running.lock().unwrap_or_else(|e| e.into_inner());
        serde_json::json!({
            "running": running.iter().map(|(n, _)| n.clone()).collect::<Vec<_>>()
        })
    }
}

/// Labs: apps del ecosistema (server opencode, stats, desktop-agent, plugins).
pub fn labs_list(state: &crate::state::AppState) -> serde_json::Value {
    let cfg = state.config.read().unwrap_or_else(|e| e.into_inner());
    let mut apps = Vec::new();
    apps.push(serde_json::json!({
        "id": "server",
        "title": "Server opencode",
        "kind": "server",
        "configured": !cfg.start_command.trim().is_empty(),
    }));
    apps.push(serde_json::json!({
        "id": "stats",
        "title": "OpenCode Stats",
        "kind": "stats",
        "configured": true,
    }));
    apps.push(serde_json::json!({
        "id": "desktop-agent",
        "title": "Escritorio remoto",
        "kind": "exe",
        "configured": !cfg.desktop_agent_path.trim().is_empty(),
    }));
    for app in &cfg.labs_apps {
        apps.push(serde_json::json!({
            "id": app.id,
            "title": app.title,
            "kind": "exe",
            "configured": true,
        }));
    }
    serde_json::json!({ "apps": apps })
}

pub fn labs_start(state: &Arc<crate::state::AppState>, id: &str) -> Result<serde_json::Value, String> {
    if id == "stats" {
        crate::statsx::ensure(state);
        return Ok(serde_json::json!({ "started": true, "pid": "thread" }));
    }
    let cfg = state.config.read().unwrap_or_else(|e| e.into_inner());
    let (title, path): (String, String) = match id {
        "server" => ("Server opencode".to_string(), cfg.start_command.clone()),
        "desktop-agent" => ("Escritorio remoto".to_string(), cfg.desktop_agent_path.clone()),
        _ => cfg
            .labs_apps
            .iter()
            .find(|a| a.id == id)
            .map(|a| (a.title.clone(), a.path.clone()))
            .ok_or("app no existe")?,
    };
    if path.trim().is_empty() {
        return Err("sin ruta configurada".into());
    }
    let cwd = Path::new(&path).parent();
    let child = crate::common::spawn_detached(&path, cwd).map_err(|e| format!("{title}: {e}"))?;
    let pid = child.id();
    std::mem::forget(child); // detached a propósito
    Ok(serde_json::json!({ "started": true, "pid": pid }))
}