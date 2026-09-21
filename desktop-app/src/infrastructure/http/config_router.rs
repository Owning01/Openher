//! Router /shell/config* + /shell/autostart + /shell/session-state — delegado desde api.rs.

use std::sync::Arc;

use crate::infrastructure::http::common::{config_clone, post};
use crate::infrastructure::http::io::{ShellRequest, ShellResponse};

use crate::state::AppState;

#[allow(clippy::too_many_lines)]
pub fn handle(
    req: &ShellRequest,
    state: Arc<AppState>,
    path: &str,
    method: &str,
    _q: &dyn Fn(&str) -> String,
) -> Option<ShellResponse> {
    if path == "/shell/config" && method == "GET" {
        let cfg = config_clone(&state);
        return Some(ShellResponse::ok_json(&serde_json::to_value(cfg).unwrap_or_default()));
    }
    if path == "/shell/config" && method == "POST" {
        return Some(post!(req, patch => {
            let mut cfg = config_clone(&state);
            merge_config(&mut cfg, &patch);
            crate::state::save_config(&cfg);
            *state.config.write().unwrap_or_else(|e| e.into_inner()) = cfg.clone();
            ShellResponse::ok_json(&serde_json::json!({ "ok": true, "config": cfg }))
        }));
    }
    if path == "/shell/config/export" {
        let cfg = config_clone(&state);
        return Some(ShellResponse::ok_json(&serde_json::json!({ "config": cfg })));
    }
    if path == "/shell/config/import" && method == "POST" {
        return Some(post!(req, body => {
            if let Some(cfg_val) = body.get("config") {
                if let Ok(cfg) = serde_json::from_value::<crate::state::ShellConfig>(cfg_val.clone()) {
                    crate::state::save_config(&cfg);
                    *state.config.write().unwrap_or_else(|e| e.into_inner()) = cfg.clone();
                    ShellResponse::ok_json(&serde_json::json!({ "ok": true }))
                } else {
                    ShellResponse::err_json(400, "config inválida")
                }
            } else {
                ShellResponse::err_json(400, "config inválida")
            }
        }));
    }

    if path == "/shell/autostart" && method == "GET" {
        return Some(ShellResponse::ok_json(&serde_json::json!({
            "enabled": crate::state::autostart_enabled(),
            "opencode2": crate::state::opencode2_autostart_enabled(),
            "opencode2_enabled": state.config.read().unwrap_or_else(|e| e.into_inner()).opencode2_enabled,
        })));
    }
    if path == "/shell/autostart" && method == "POST" {
        return Some(post!(req, b => {
            let enabled = b["enabled"].as_bool().unwrap_or(false);
            // Toggle opcional del server: { enabled, opencode2?: bool }
            // Si no viene, no se toca (compat con UI vieja).
            let op2 = b.get("opencode2").and_then(|v| v.as_bool());
            if let Err(e) = crate::state::set_autostart(enabled) {
                ShellResponse::err_json(500, &e.to_string())
            } else if let Some(want) = op2 {
                if let Err(e) = crate::state::set_opencode2_autostart(want) {
                    ShellResponse::err_json(500, &e.to_string())
                } else {
                    let mut cfg = config_clone(&state);
                    cfg.opencode2_enabled = want;
                    crate::state::save_config(&cfg);
                    *state.config.write().unwrap_or_else(|e| e.into_inner()) = cfg;
                    if want {
                        let cfg2 = config_clone(&state);
                        std::thread::spawn(move || {
                            let _ = crate::state::ensure_opencode2_running(&cfg2);
                        });
                    }
                    ShellResponse::ok_json(&serde_json::json!({ "ok": true, "enabled": enabled, "opencode2": crate::state::opencode2_autostart_enabled() }))
                }
            } else {
                ShellResponse::ok_json(&serde_json::json!({ "ok": true, "enabled": enabled, "opencode2": crate::state::opencode2_autostart_enabled() }))
            }
        }));
    }

    // Control dedicado del server opencode2 headless (:4098)
    if path == "/shell/opencode2/autostart" && method == "GET" {
        let cfg = config_clone(&state);
        return Some(ShellResponse::ok_json(&serde_json::json!({
            "enabled": crate::state::opencode2_autostart_enabled(),
            "opencode2_enabled": cfg.opencode2_enabled,
            "port": cfg.opencode2_port,
            "cmd": crate::state::resolve_opencode2_cmd(&cfg),
        })));
    }
    if path == "/shell/opencode2/autostart" && method == "POST" {
        return Some(post!(req, b => {
            let want = b["enabled"].as_bool().unwrap_or(false);
            match crate::state::set_opencode2_autostart(want) {
                Ok(()) => {
                    let mut cfg = config_clone(&state);
                    cfg.opencode2_enabled = want;
                    crate::state::save_config(&cfg);
                    *state.config.write().unwrap_or_else(|e| e.into_inner()) = cfg.clone();
                    if want {
                        std::thread::spawn(move || {
                            let _ = crate::state::ensure_opencode2_running(&cfg);
                        });
                    }
                    ShellResponse::ok_json(&serde_json::json!({ "ok": true, "enabled": want }))
                }
                Err(e) => ShellResponse::err_json(500, &e.to_string()),
            }
        }));
    }
    if path == "/shell/opencode2/ensure" && method == "POST" {
        let cfg = config_clone(&state);
        let port = if cfg.opencode2_port == 0 { 4098 } else { cfg.opencode2_port };
        let up_before = crate::common::probe_http(port, "/session", std::time::Duration::from_millis(900), &[200, 401])
            || crate::common::probe_http(4098, "/session", std::time::Duration::from_millis(900), &[200, 401]);
        if up_before {
            return Some(ShellResponse::ok_json(&serde_json::json!({ "ok": true, "already": true, "port": port })));
        }
        let cfg2 = cfg.clone();
        std::thread::spawn(move || {
            let _ = crate::state::ensure_opencode2_running(&cfg2);
        });
        return Some(ShellResponse::ok_json(&serde_json::json!({ "ok": true, "started": true, "port": port })));
    }
    if path == "/shell/opencode2/status" && method == "GET" {
        let cfg = config_clone(&state);
        let port = if cfg.opencode2_port == 0 { 4098 } else { cfg.opencode2_port };
        let up = crate::common::probe_http(port, "/session", std::time::Duration::from_millis(900), &[200, 401])
            || crate::common::probe_http(4098, "/session", std::time::Duration::from_millis(900), &[200, 401]);
        return Some(ShellResponse::ok_json(&serde_json::json!({
            "ok": true, "running": up, "port": port,
            "autostart": crate::state::opencode2_autostart_enabled(),
            "enabled": cfg.opencode2_enabled,
        })));
    }

    if path == "/shell/session-state" && method == "GET" {
        let s = state.persisted.read().unwrap_or_else(|e| e.into_inner()).clone();
        return Some(ShellResponse::ok_json(&serde_json::to_value(s).unwrap_or_default()));
    }
    if path == "/shell/session-state" && method == "POST" {
        return Some(post!(req, b => {
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
            ShellResponse::ok_json(&serde_json::json!({ "ok": true }))
        }));
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
    if let Some(s) = patch.get("minimize_to_tray").and_then(|v| v.as_bool()) {
        cfg.minimize_to_tray = s;
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
    if let Some(b) = patch.get("context_menu").and_then(|v| v.as_bool()) {
        cfg.context_menu = b;
    }
}
