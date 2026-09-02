//! Router /shell/doc/* — conversor y guardado de documentos (Rust ultra-ligero).
//! Extraído desde api.rs: /shell/doc/convert y /shell/doc/save.

use std::path::Path;
use std::sync::Arc;

use tiny_http::{Method, Request, Response};

use crate::state::{json_err, json_ok, read_body, AppState};

#[allow(clippy::too_many_lines)]
pub fn handle(
    req: &mut Request,
    _state: Arc<AppState>,
    path: &str,
    method: Method,
    _q: &dyn Fn(&str) -> String,
) -> Option<Response<std::io::Cursor<Vec<u8>>>> {
    if path == "/shell/doc/convert" && method == Method::Post {
        return Some(match read_body(req) {
            Ok(b) => {
                let src = b["src"].as_str().unwrap_or("");
                let target = b["target"].as_str().unwrap_or("md");
                let dest = b["dest"].as_str();
                match crate::doc_engine::convert_file(src, target, dest) {
                    Ok(val) => json_ok(&val),
                    Err(e) => json_err(500, &e.to_string()),
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        });
    }
    if path == "/shell/doc/save" && method == Method::Post {
        return Some(match read_body(req) {
            Ok(b) => {
                let path_str = b["path"].as_str().unwrap_or("");
                let md_content = b["content"].as_str().unwrap_or("");
                let format = b["format"].as_str().unwrap_or("md").to_lowercase();
                let p = Path::new(path_str);
                let res: Result<(), String> = match format.as_str() {
                    "docx" => match crate::doc_engine::md_to_docx(md_content) {
                        Ok(bytes) => std::fs::write(p, bytes).map_err(|e| e.to_string()),
                        Err(e) => Err(e),
                    },
                    "pdf" => match crate::doc_engine::md_to_pdf(md_content) {
                        Ok(bytes) => std::fs::write(p, bytes).map_err(|e| e.to_string()),
                        Err(e) => Err(e),
                    },
                    _ => std::fs::write(p, md_content.as_bytes()).map_err(|e| e.to_string()),
                };
                match res {
                    Ok(_) => json_ok(&serde_json::json!({ "ok": true, "path": path_str })),
                    Err(e) => json_err(500, &e.to_string()),
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        });
    }
    if path.starts_with("/shell/doc") {
        return Some(json_err(404, "ruta doc desconocida"));
    }
    None
}
