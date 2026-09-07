//! Router /shell/server* — manager del server opencode.
//! Extraído desde api.rs: GET /shell/server, POST /shell/server/start, POST /shell/server/stop.

use std::sync::Arc;

use crate::infrastructure::http::io::{ShellRequest, ShellResponse};

use crate::state::AppState;

#[allow(clippy::too_many_lines)]
pub fn handle(
    _req: &ShellRequest,
    state: Arc<AppState>,
    path: &str,
    method: &str,
    _q: &dyn Fn(&str) -> String,
) -> Option<ShellResponse> {
    if path == "/shell/server" && method == "GET" {
        let ports = state
            .config
            .read()
            .unwrap_or_else(|e| e.into_inner())
            .server_ports
            .clone();
        return Some(ShellResponse::ok_json(&state.servers.status(&ports)));
    }
    if path == "/shell/server/start" && method == "POST" {
        let cmd = state
            .config
            .read()
            .unwrap_or_else(|e| e.into_inner())
            .start_command
            .clone();
        return Some(match state.servers.start(&cmd) {
            Ok(v) => ShellResponse::ok_json(&v),
            Err(e) => ShellResponse::err_json(400, &e.to_string()),
        });
    }
    if path == "/shell/server/stop" && method == "POST" {
        return Some(match state.servers.stop() {
            Ok(v) => ShellResponse::ok_json(&v),
            Err(e) => ShellResponse::err_json(500, &e.to_string()),
        });
    }
    // Perfil portable: qué data/ usa ESTE exe (cada carpeta de exe tiene el
    // suyo; alternar dev/release "pierde" sesiones). La UI lo muestra para
    // que el usuario sepa dónde viven cookies, tabs y descargas.
    if path == "/shell/profile" && method == "GET" {
        let data = crate::state::data_dir();
        return Some(ShellResponse::ok_json(&serde_json::json!({
            "data_dir": data.to_string_lossy(),
            "webview_dir": data.join("webview").to_string_lossy(),
            "downloads_dir": data.join("downloads").to_string_lossy(),
        })));
    }
    // No match — permitir prefijo para no confundir con /shell/server* desconocida
    if path.starts_with("/shell/server") {
        return Some(ShellResponse::err_json(404, "ruta server desconocida"));
    }
    None
}
