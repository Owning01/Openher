//! Router /shell/updates + /shell/docs* — feed de updates y docs opencode.
//! Extraído desde api.rs: /shell/updates (cacheado), /shell/docs y /shell/docs/read.

use std::sync::Arc;

use tiny_http::{Method, Request, Response};

use crate::state::{json_err, json_ok, AppState};

#[allow(clippy::too_many_lines)]
pub fn handle(
    _req: &mut Request,
    state: Arc<AppState>,
    path: &str,
    _method: Method,
    q: &dyn Fn(&str) -> String,
) -> Option<Response<std::io::Cursor<Vec<u8>>>> {
    if path == "/shell/updates" {
        let force = q("refresh") == "1";
        return Some(json_ok(&crate::updates::build(&state, force)));
    }
    if path == "/shell/docs" {
        return Some(json_ok(&crate::docsx::list(&state)));
    }
    if path == "/shell/docs/read" {
        let rel = q("path");
        return Some(match crate::docsx::read(&state, &rel) {
            Ok(v) => json_ok(&v),
            Err(e) => json_err(404, &e),
        });
    }
    // Prefijo no manejado pero para evitar caer a 404 genérico sin indicar dominio
    if path.starts_with("/shell/docs") || path.starts_with("/shell/updates") {
        return Some(json_err(404, "ruta docs/updates desconocida"));
    }
    None
}
