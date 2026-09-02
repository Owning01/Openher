//! Router /shell/server* — manager del server opencode.
//! Extraído desde api.rs: GET /shell/server, POST /shell/server/start, POST /shell/server/stop.

use std::sync::Arc;

use tiny_http::{Method, Request, Response};

use crate::state::{json_err, json_ok, AppState};

#[allow(clippy::too_many_lines)]
pub fn handle(
    _req: &mut Request,
    state: Arc<AppState>,
    path: &str,
    method: Method,
    _q: &dyn Fn(&str) -> String,
) -> Option<Response<std::io::Cursor<Vec<u8>>>> {
    if path == "/shell/server" && method == Method::Get {
        let ports = state
            .config
            .read()
            .unwrap_or_else(|e| e.into_inner())
            .server_ports
            .clone();
        return Some(json_ok(&state.servers.status(&ports)));
    }
    if path == "/shell/server/start" && method == Method::Post {
        let cmd = state
            .config
            .read()
            .unwrap_or_else(|e| e.into_inner())
            .start_command
            .clone();
        return Some(match state.servers.start(&cmd) {
            Ok(v) => json_ok(&v),
            Err(e) => json_err(400, &e.to_string()),
        });
    }
    if path == "/shell/server/stop" && method == Method::Post {
        return Some(match state.servers.stop() {
            Ok(v) => json_ok(&v),
            Err(e) => json_err(500, &e.to_string()),
        });
    }
    // No match — permitir prefijo para no confundir con /shell/server* desconocida
    if path.starts_with("/shell/server") {
        return Some(json_err(404, "ruta server desconocida"));
    }
    None
}
