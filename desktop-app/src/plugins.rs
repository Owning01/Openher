//! Plugins (data/plugins/<name>/package.json o plugin.json) + Labs (apps del ecosistema).

use std::path::Path;
use std::process::Child;
use std::sync::{Arc, Mutex};

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct OpenCodePluginManifest {
    pub name: String,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub version: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub entry: Option<String>,
    #[serde(rename = "entryUrl", default)]
    pub entry_url: Option<String>,
    #[serde(default)]
    pub capabilities: Vec<String>,
    #[serde(default)]
    pub config: serde_json::Value,
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(rename = "type", default = "default_type_esm")]
    pub kind: String, // "esm" | "web" | "command" | "link"
    #[serde(default)]
    pub command: Option<String>,
    #[serde(default)]
    pub cwd: Option<String>,
}

fn default_true() -> bool {
    true
}

fn default_type_esm() -> String {
    "esm".to_string()
}

pub struct PluginRegistry {
    pub plugins: Mutex<Vec<OpenCodePluginManifest>>,
    running: Mutex<Vec<(String, Child)>>,
}

impl PluginRegistry {
    pub fn new() -> Self {
        Self {
            plugins: Mutex::new(Vec::new()),
            running: Mutex::new(Vec::new()),
        }
    }

    pub fn scan(&self) -> Vec<OpenCodePluginManifest> {
        let dir = crate::state::plugins_dir();
        let mut out = Vec::new();
        if let Ok(rd) = std::fs::read_dir(&dir) {
            for e in rd.flatten() {
                if !e.path().is_dir() {
                    continue;
                }
                let folder_name = e.file_name().to_string_lossy().to_string();

                // 1. Probar package.json (estándar OpenCode / dsh ESM)
                let pkg_path = e.path().join("package.json");
                if let Ok(raw) = std::fs::read_to_string(&pkg_path) {
                    if let Ok(v) = serde_json::from_str::<serde_json::Value>(&raw) {
                        let name = v["name"].as_str().unwrap_or(&folder_name).to_string();
                        let title = v["title"].as_str().map(String::from);
                        let version = v["version"].as_str().map(String::from);
                        let desc = v["description"].as_str().map(String::from);

                        let opencode_sec = if v["opencode"].is_object() {
                            &v["opencode"]
                        } else if v["dsh"].is_object() {
                            &v["dsh"]
                        } else {
                            &serde_json::Value::Null
                        };

                        let entry_raw = opencode_sec["entry"]
                            .as_str()
                            .or_else(|| v["main"].as_str())
                            .or_else(|| v["module"].as_str())
                            .unwrap_or("index.js");
                        let entry = entry_raw.trim_start_matches("./").to_string();
                        let entry_url = format!("/shell/plugin/{}/{}", folder_name, entry);

                        let caps: Vec<String> = opencode_sec["capabilities"]
                            .as_array()
                            .map(|arr| {
                                arr.iter()
                                    .filter_map(|c| c.as_str().map(String::from))
                                    .collect()
                            })
                            .unwrap_or_else(|| {
                                vec![
                                    "ui".to_string(),
                                    "events".to_string(),
                                    "commands".to_string(),
                                    "storage".to_string(),
                                ]
                            });

                        let config = opencode_sec["config"].clone();

                        out.push(OpenCodePluginManifest {
                            name,
                            title,
                            version,
                            description: desc,
                            entry: Some(entry),
                            entry_url: Some(entry_url),
                            capabilities: caps,
                            config,
                            enabled: true,
                            kind: "esm".to_string(),
                            command: None,
                            cwd: None,
                        });
                        continue;
                    }
                }

                // 2. Probar plugin.json (legacy)
                let legacy_path = e.path().join("plugin.json");
                if let Ok(raw) = std::fs::read_to_string(&legacy_path) {
                    if let Ok(v) = serde_json::from_str::<serde_json::Value>(&raw) {
                        let name = v["name"].as_str().unwrap_or(&folder_name).to_string();
                        let title = v["title"].as_str().map(String::from);
                        let version = v["version"].as_str().map(String::from);
                        let desc = v["description"].as_str().map(String::from);
                        let kind = v["type"].as_str().unwrap_or("web").to_string();
                        let entry = v["entry"].as_str().unwrap_or("index.js").to_string();
                        let entry_url = format!("/shell/plugin/{}/{}", folder_name, entry);

                        out.push(OpenCodePluginManifest {
                            name,
                            title,
                            version,
                            description: desc,
                            entry: Some(entry),
                            entry_url: Some(entry_url),
                            capabilities: vec![
                                "ui".to_string(),
                                "events".to_string(),
                                "commands".to_string(),
                                "storage".to_string(),
                            ],
                            config: serde_json::Value::Null,
                            enabled: true,
                            kind,
                            command: v["command"].as_str().map(String::from),
                            cwd: v["cwd"].as_str().map(String::from),
                        });
                    }
                }
            }
        }

        *self.plugins.lock().unwrap_or_else(|e| e.into_inner()) = out.clone();
        out
    }

    pub fn list(&self) -> serde_json::Value {
        let plugins = self.plugins.lock().unwrap_or_else(|e| e.into_inner()).clone();
        serde_json::json!({ "ok": true, "plugins": plugins })
    }

    pub fn toggle(&self, name: &str, enabled: bool) -> bool {
        let mut plugins = self.plugins.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(p) = plugins.iter_mut().find(|p| p.name == name) {
            p.enabled = enabled;
            return true;
        }
        false
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