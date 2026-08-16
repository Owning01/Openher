//! Plugins (data/plugins/<name>/plugin.json) + Labs (apps del ecosistema).

use std::path::{Path, PathBuf};
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
        *self.plugins.lock().unwrap() = out
            .iter()
            .filter_map(|v| serde_json::from_value(v.clone()).ok())
            .collect();
        out
    }

    pub fn list(&self) -> serde_json::Value {
        let plugins = self.plugins.lock().unwrap().clone();
        serde_json::json!({ "plugins": plugins })
    }

    /// Sirve archivos de un plugin web desde data/plugins/<name>.
    pub fn serve_web(&self, name: &str, rel: &str) -> Option<(Vec<u8>, String)> {
        let root = crate::state::plugins_dir().join(name);
        let rel_clean = rel.trim_start_matches('/');
        let mut path = root.join(rel_clean);
        if !path.starts_with(&root) {
            return None;
        }
        if path.is_dir() {
            path = path.join("index.html");
        }
        if !path.is_file() {
            return None;
        }
        let bytes = std::fs::read(&path).ok()?;
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("").to_ascii_lowercase();
        let mime = match ext.as_str() {
            "html" => "text/html; charset=utf-8",
            "js" | "mjs" => "text/javascript; charset=utf-8",
            "css" => "text/css; charset=utf-8",
            "json" => "application/json",
            "svg" => "image/svg+xml",
            "png" => "image/png",
            _ => "application/octet-stream",
        };
        Some((bytes, mime.to_string()))
    }

    pub fn run_command(&self, name: &str) -> Result<serde_json::Value, String> {
        let plugins = self.plugins.lock().unwrap();
        let m = plugins.iter().find(|p| p.name == name).ok_or("plugin no existe")?;
        let cmd = m.command.as_deref().ok_or("sin comando")?;
        let child = if cmd.trim().to_lowercase().ends_with(".bat") {
            std::process::Command::new("cmd").args(["/c", cmd.trim()]).spawn()
        } else {
            let parts: Vec<&str> = cmd.trim().split_whitespace().collect();
            if parts.is_empty() {
                return Err("comando vacío".into());
            }
            let mut c = std::process::Command::new(parts[0]);
            c.args(&parts[1..]);
            if let Some(dir) = &m.cwd {
                c.current_dir(dir);
            }
            c.spawn()
        }
        .map_err(|e| e.to_string())?;
        let pid = child.id();
        self.running.lock().unwrap().push((name.to_string(), child));
        Ok(serde_json::json!({ "started": true, "pid": pid }))
    }

    pub fn running(&self) -> serde_json::Value {
        let running = self.running.lock().unwrap();
        serde_json::json!({
            "running": running.iter().map(|(n, _)| n.clone()).collect::<Vec<_>>()
        })
    }
}

/// Labs: apps del ecosistema (server opencode, stats, desktop-agent, plugins).
pub fn labs_list(state: &crate::state::AppState) -> serde_json::Value {
    let cfg = state.config.read().unwrap();
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
    let cfg = state.config.read().unwrap();
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
    let child = if path.trim().to_lowercase().ends_with(".bat") {
        std::process::Command::new("cmd").args(["/c", path.trim()]).spawn()
    } else {
        let mut c = std::process::Command::new(&path);
        if let Some(p) = Path::new(&path).parent() {
            c.current_dir(p);
        }
        c.spawn()
    }
    .map_err(|e| format!("{title}: {e}"))?;
    let pid = child.id();
    std::mem::forget(child); // detached a propósito
    Ok(serde_json::json!({ "started": true, "pid": pid }))
}