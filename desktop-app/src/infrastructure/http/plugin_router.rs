//! Router /shell/plugins* + /shell/plugin/* — registro de plugins ESM/web/command.
//! Extraído desde api.rs: scan, reload, toggle, running, run, y serve_web.

use std::sync::Arc;

use tiny_http::{Header, Method, Request, Response, StatusCode};

use crate::state::{json_err, json_ok, read_body, AppState};

#[allow(clippy::too_many_lines)]
pub fn handle(
    req: &mut Request,
    state: Arc<AppState>,
    path: &str,
    method: Method,
    _q: &dyn Fn(&str) -> String,
) -> Option<Response<std::io::Cursor<Vec<u8>>>> {
    if path == "/shell/plugins" && method == Method::Get {
        state.plugins.scan();
        return Some(json_ok(&state.plugins.list()));
    }
    // Mantener compat: /shell/plugins sin método explícito (GET implícito en api.rs previo documentaba solo path)
    if path == "/shell/plugins" {
        state.plugins.scan();
        return Some(json_ok(&state.plugins.list()));
    }
    if path == "/shell/plugins/reload" && method == Method::Post {
        let scanned = state.plugins.scan();
        return Some(json_ok(&serde_json::json!({ "ok": true, "plugins": scanned })));
    }
    if path == "/shell/plugins/toggle" && method == Method::Post {
        return Some(match read_body(req) {
            Ok(b) => {
                let name = b["name"].as_str().unwrap_or("");
                let enabled = b["enabled"].as_bool().unwrap_or(true);
                let updated = state.plugins.toggle(name, enabled);
                json_ok(&serde_json::json!({ "ok": updated }))
            }
            Err(e) => json_err(400, &e.to_string()),
        });
    }
    if path == "/shell/plugins/running" {
        return Some(json_ok(&state.plugins.running()));
    }
    if path == "/shell/plugins/run" && method == Method::Post {
        return Some(match read_body(req) {
            Ok(b) => {
                let name = b["name"].as_str().unwrap_or("");
                match state.plugins.run_command(name) {
                    Ok(v) => json_ok(&v),
                    Err(e) => json_err(500, &e.to_string()),
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        });
    }
    if let Some(rest) = path.strip_prefix("/shell/plugin/") {
        if let Some((name, rel)) = rest.split_once('/') {
            if let Some((bytes, mime)) = state.plugins.serve_web(name, rel) {
                return Some(
                    Response::from_data(bytes)
                        .with_status_code(StatusCode(200))
                        .with_header(Header::from_bytes("Content-Type", mime.as_str()).unwrap()),
                );
            }
        }
        return Some(json_err(404, "plugin no encontrado"));
    }
    if path.starts_with("/shell/plugins") || path.starts_with("/shell/plugin") {
        return Some(json_err(404, "ruta plugins desconocida"));
    }
    None
}
