//! Router /shell/updates + /shell/docs* — feed de updates y docs opencode.
//! Extraído desde api.rs: /shell/updates (cacheado), /shell/docs y /shell/docs/read.

use std::sync::Arc;

use crate::infrastructure::http::io::{ShellRequest, ShellResponse};

use crate::state::AppState;

#[allow(clippy::too_many_lines)]
pub fn handle(
    _req: &ShellRequest,
    state: Arc<AppState>,
    path: &str,
    _method: &str,
    q: &dyn Fn(&str) -> String,
) -> Option<ShellResponse> {
    if path == "/shell/updates" {
        let force = q("refresh") == "1";
        return Some(ShellResponse::ok_json(&crate::updates::build(&state, force)));
    }
    if path == "/shell/docs" {
        return Some(ShellResponse::ok_json(&crate::docsx::list(&state)));
    }
    if path == "/shell/docs/read" {
        let rel = q("path");
        return Some(match crate::docsx::read(&state, &rel) {
            Ok(v) => ShellResponse::ok_json(&v),
            Err(e) => ShellResponse::err_json(404, &e),
        });
    }
    // Prefijo no manejado pero para evitar caer a 404 genérico sin indicar dominio
    if path.starts_with("/shell/docs") || path.starts_with("/shell/updates") {
        return Some(ShellResponse::err_json(404, "ruta docs/updates desconocida"));
    }
    None
}
