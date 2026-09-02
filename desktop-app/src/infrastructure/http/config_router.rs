//! Router /shell/config* + /shell/autostart + /shell/session-state — delegado desde api.rs.

use std::sync::Arc;

use tiny_http::{Method, Request, Response};

use crate::state::{json_err, json_ok, read_body, AppState};

#[allow(clippy::too_many_lines)]
pub fn handle(
    req: &mut Request,
    state: Arc<AppState>,
    path: &str,
    method: Method,
    _q: &dyn Fn(&str) -> String,
) -> Option<Response<std::io::Cursor<Vec<u8>>>> {
    if path == "/shell/config" && method == Method::Get {
        let cfg = state.config.read().unwrap_or_else(|e| e.into_inner()).clone();
        return Some(json_ok(&serde_json::to_value(cfg).unwrap_or_default()));
    }
    if path == "/shell/config" && method == Method::Post {
        return Some(match read_body(req) {
            Ok(patch) => {
                let mut cfg = state.config.read().unwrap_or_else(|e| e.into_inner()).clone();
                merge_config(&mut cfg, &patch);
                crate::state::save_config(&cfg);
                *state.config.write().unwrap_or_else(|e| e.into_inner()) = cfg.clone();
                json_ok(&serde_json::json!({ "ok": true, "config": cfg }))
            }
            Err(e) => json_err(400, &e.to_string()),
        });
    }
    if path == "/shell/config/export" {
        let cfg = state.config.read().unwrap_or_else(|e| e.into_inner()).clone();
        return Some(json_ok(&serde_json::json!({ "config": cfg })));
    }
    if path == "/shell/config/import" && method == Method::Post {
        return Some(match read_body(req) {
            Ok(body) => {
                if let Some(cfg_val) = body.get("config") {
                    if let Ok(cfg) = serde_json::from_value::<crate::state::ShellConfig>(cfg_val.clone()) {
                        crate::state::save_config(&cfg);
                        *state.config.write().unwrap_or_else(|e| e.into_inner()) = cfg.clone();
                        json_ok(&serde_json::json!({ "ok": true }))
                    } else {
                        json_err(400, "config inválida")
                    }
                } else {
                    json_err(400, "config inválida")
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        });
    }

    if path == "/shell/autostart" && method == Method::Get {
        return Some(json_ok(&serde_json::json!({ "enabled": crate::state::autostart_enabled() })));
    }
    if path == "/shell/autostart" && method == Method::Post {
        return Some(match read_body(req) {
            Ok(b) => {
                let enabled = b["enabled"].as_bool().unwrap_or(false);
                match crate::state::set_autostart(enabled) {
                    Ok(()) => json_ok(&serde_json::json!({ "ok": true, "enabled": enabled })),
                    Err(e) => json_err(500, &e.to_string()),
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        });
    }

    if path == "/shell/session-state" && method == Method::Get {
        let s = state.persisted.read().unwrap_or_else(|e| e.into_inner()).clone();
        return Some(json_ok(&serde_json::to_value(s).unwrap_or_default()));
    }
    if path == "/shell/session-state" && method == Method::Post {
        return Some(match read_body(req) {
            Ok(b) => {
                let mut s = state.persisted.write().unwrap_or_else(|e| e.into_inner());
                if let Some(w) = b["window_w"].as_f64() {
                    s.window_w = Some(w);
                }
                if let Some(h) = b["window_h"].as_f64() {
                    s.window_h = Some(h);
                }
                if let Some(p) = b["last_panels"].as_array() {
                    s.last_panels = p.clone();
                }
                crate::state::save_persisted(&s);
                json_ok(&serde_json::json!({ "ok": true }))
            }
            Err(e) => json_err(400, &e.to_string()),
        });
    }

    None
}

fn merge_config(cfg: &mut crate::state::ShellConfig, patch: &serde_json::Value) {
    if let Some(p) = patch.get("port").and_then(|v| v.as_u64()) {
        cfg.port = p as u16;
    }
    if let Some(s) = patch.get("start_minimized").and_then(|v| v.as_bool()) {
        cfg.start_minimized = s;
    }
    if let Some(s) = patch.get("start_command").and_then(|v| v.as_str()) {
        cfg.start_command = s.to_string();
    }
    if let Some(p) = patch.get("server_ports").and_then(|v| v.as_array()) {
        cfg.server_ports = p
            .iter()
            .filter_map(|x| x.as_u64().map(|n| n as u16))
            .collect();
    }
    if let Some(s) = patch.get("docs_root").and_then(|v| v.as_str()) {
        cfg.docs_root = s.to_string();
    }
    if let Some(a) = patch.get("x_handles").and_then(|v| v.as_array()) {
        cfg.x_handles = a.iter().filter_map(|x| x.as_str().map(|s| s.to_string())).collect();
    }
    if let Some(a) = patch.get("github_repos").and_then(|v| v.as_array()) {
        cfg.github_repos = a.iter().filter_map(|x| x.as_str().map(|s| s.to_string())).collect();
    }
    if let Some(s) = patch.get("desktop_agent_path").and_then(|v| v.as_str()) {
        cfg.desktop_agent_path = s.to_string();
    }
    if let Some(s) = patch.get("server").and_then(|v| v.get("port")).and_then(|v| v.as_u64()) {
        cfg.server.port = s as u16;
    }
    if let Some(s) = patch.get("server").and_then(|v| v.get("host")).and_then(|v| v.as_str()) {
        cfg.server.host = s.to_string();
    }
    if let Some(s) = patch.get("server").and_then(|v| v.get("username")).and_then(|v| v.as_str()) {
        cfg.server.username = s.to_string();
    }
    if let Some(s) = patch.get("server").and_then(|v| v.get("password")).and_then(|v| v.as_str()) {
        cfg.server.password = s.to_string();
    }
    if let Some(s) = patch.get("labs_apps").and_then(|v| v.as_array()) {
        cfg.labs_apps = s
            .iter()
            .filter_map(|x| serde_json::from_value(x.clone()).ok())
            .collect();
    }
    if let Some(s) = patch.get("cerebras_api_key").and_then(|v| v.as_str()) {
        cfg.cerebras_api_key = s.to_string();
    }
    if let Some(s) = patch.get("groq_api_key").and_then(|v| v.as_str()) {
        cfg.groq_api_key = s.to_string();
    }
    if let Some(s) = patch.get("quickchat_provider").and_then(|v| v.as_str()) {
        cfg.quickchat_provider = s.to_string();
    }
    if let Some(s) = patch.get("quickchat_model").and_then(|v| v.as_str()) {
        cfg.quickchat_model = s.to_string();
    }
    if let Some(b) = patch.get("auto_opencode2").and_then(|v| v.as_bool()) {
        cfg.auto_opencode2 = b;
    }
    if let Some(b) = patch.get("opencode2_enabled").and_then(|v| v.as_bool()) {
        cfg.opencode2_enabled = b;
    }
    if let Some(p) = patch.get("opencode2_port").and_then(|v| v.as_u64()) {
        cfg.opencode2_port = p as u16;
    }
    if let Some(s) = patch.get("opencode2_command").and_then(|v| v.as_str()) {
        cfg.opencode2_command = s.to_string();
    }
}
