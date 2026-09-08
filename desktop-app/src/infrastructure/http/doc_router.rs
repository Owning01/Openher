//! Router /shell/doc/* — conversor y guardado de documentos (Rust ultra-ligero).
//! Extraído desde api.rs: /shell/doc/convert y /shell/doc/save.

use std::path::Path;
use std::sync::Arc;

use crate::infrastructure::http::io::{ShellRequest, ShellResponse};

use crate::state::AppState;

#[allow(clippy::too_many_lines)]
pub fn handle(
    req: &ShellRequest,
    _state: Arc<AppState>,
    path: &str,
    method: &str,
    _q: &dyn Fn(&str) -> String,
) -> Option<ShellResponse> {
    if path == "/shell/doc/convert" && method == "POST" {
        return Some(ShellResponse::err_json(400, "el motor de conversión de documentos pesados ha sido desacoplado"));
    }
    if path == "/shell/doc/save" && method == "POST" {
        return Some(match req.json_body() {
            Ok(b) => {
                let path_str = b["path"].as_str().unwrap_or("");
                let md_content = b["content"].as_str().unwrap_or("");
                let p = Path::new(path_str);
                match std::fs::write(p, md_content.as_bytes()) {
                    Ok(_) => ShellResponse::ok_json(&serde_json::json!({ "ok": true, "path": path_str })),
                    Err(e) => ShellResponse::err_json(500, &e.to_string()),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e.to_string()),
        });
    }
    if path.starts_with("/shell/doc") {
        return Some(ShellResponse::err_json(404, "ruta doc desconocida"));
    }
    None
}
