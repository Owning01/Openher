//! Router /shell/plugins* + /shell/plugin/* — registro de plugins ESM/web/command.
//! Extraído desde api.rs: scan, reload, toggle, running, run, y serve_web.

use std::sync::Arc;

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
    if path == "/shell/plugins" && method == "GET" {
        state.plugins.scan();
        return Some(ShellResponse::ok_json(&state.plugins.list()));
    }
    // Mantener compat: /shell/plugins sin método explícito (GET implícito en api.rs previo documentaba solo path)
    if path == "/shell/plugins" {
        state.plugins.scan();
        return Some(ShellResponse::ok_json(&state.plugins.list()));
    }
    if path == "/shell/plugins/reload" && method == "POST" {
        let scanned = state.plugins.scan();
        return Some(ShellResponse::ok_json(&serde_json::json!({ "ok": true, "plugins": scanned })));
    }
    if path == "/shell/plugins/toggle" && method == "POST" {
        return Some(match req.json_body() {
            Ok(b) => {
                let name = b["name"].as_str().unwrap_or("");
                let enabled = b["enabled"].as_bool().unwrap_or(true);
                let updated = state.plugins.toggle(name, enabled);
                ShellResponse::ok_json(&serde_json::json!({ "ok": updated }))
            }
            Err(e) => ShellResponse::err_json(400, &e.to_string()),
        });
    }
    if path == "/shell/plugins/running" {
        return Some(ShellResponse::ok_json(&state.plugins.running()));
    }
    if path == "/shell/plugins/run" && method == "POST" {
        return Some(match req.json_body() {
            Ok(b) => {
                let name = b["name"].as_str().unwrap_or("");
                match state.plugins.run_command(name) {
                    Ok(v) => ShellResponse::ok_json(&v),
                    Err(e) => ShellResponse::err_json(500, &e.to_string()),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e.to_string()),
        });
    }
    if let Some(rest) = path.strip_prefix("/shell/plugin/") {
        if let Some((name, rel)) = rest.split_once('/') {
            if let Some((bytes, mime)) = state.plugins.serve_web(name, rel) {
                return Some(ShellResponse::data(200, bytes, mime.as_str()));
            }
        }
        return Some(ShellResponse::err_json(404, "plugin no encontrado"));
    }
    if path.starts_with("/shell/plugins") || path.starts_with("/shell/plugin") {
        return Some(ShellResponse::err_json(404, "ruta plugins desconocida"));
    }
    None
}
