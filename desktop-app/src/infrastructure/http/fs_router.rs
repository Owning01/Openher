//! Router /shell/fs/* — delegado desde api.rs.

use std::path::Path;
use std::sync::Arc;

use tiny_http::{Header, Method, Request, Response, StatusCode};

use crate::fsx;
use crate::state::{json_err, json_ok, read_body, AppState};

#[allow(clippy::too_many_lines)]
pub fn handle(
    req: &mut Request,
    _state: Arc<AppState>,
    path: &str,
    method: Method,
    q: &dyn Fn(&str) -> String,
) -> Option<Response<std::io::Cursor<Vec<u8>>>> {
    let route = path.strip_prefix("/shell/fs")?;

    macro_rules! j {
        ($res:expr) => {
            match $res {
                Ok(v) => json_ok(&v),
                Err(e) => json_err(400, &e),
            }
        };
    }

    let resp = match (method, route) {
        (Method::Get, "/drives") => json_ok(&serde_json::json!({ "drives": fsx::drives() })),
        (Method::Get, "/list") => {
            let p = q("path").replace("%2F", "/");
            j!(fsx::list_dir(&p))
        }
        (Method::Get, "/search") => {
            let p = q("path").replace("%2F", "/");
            let query = q("q");
            let limit = q("limit").parse::<usize>().unwrap_or(100);
            j!(fsx::search_code(&p, &query, limit))
        }
        (Method::Get, "/download") => {
            let p = q("path");
            if p.is_empty() {
                return Some(json_err(400, "falta path"));
            }
            let path_buf = Path::new(&p).to_path_buf();
            if !path_buf.exists() {
                return Some(json_err(404, "no existe"));
            }
            if path_buf.is_dir() {
                return Some(json_err(400, "es directorio, no archivo"));
            }
            let mime = crate::common::mime_for(&path_buf);
            let file_name = path_buf
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("download")
                .to_string();
            let sanitized = file_name.replace('"', "_");
            match std::fs::read(&path_buf) {
                Ok(bytes) => {
                    let len = bytes.len().to_string();
                    let cd = format!("attachment; filename=\"{}\"", sanitized);
                    return Some(
                        Response::from_data(bytes)
                            .with_status_code(StatusCode(200))
                            .with_header(Header::from_bytes("Content-Type", mime).unwrap())
                            .with_header(Header::from_bytes("Content-Length", len.as_bytes()).unwrap())
                            .with_header(Header::from_bytes("Content-Disposition", cd.as_bytes()).unwrap())
                            .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap())
                            .with_header(
                                Header::from_bytes(
                                    "Access-Control-Expose-Headers",
                                    "Content-Disposition, Content-Length, Content-Type",
                                )
                                .unwrap(),
                            ),
                    );
                }
                Err(e) => return Some(json_err(500, &e.to_string())),
            }
        }
        (Method::Get, "/read") => {
            let p = q("path");
            match fsx::read_file(&p, 65536) {
                Ok(v) => json_ok(&v),
                Err(e) => json_err(404, &e),
            }
        }
        (Method::Get, "/resolve") => json_ok(&fsx::resolve(&q("path"))),
        (Method::Get, "/session") => json_ok(&fsx::session_for_dir(&q("path"))),
        (Method::Get, "/pick-folder") => match fsx::pick_folder() {
            Ok(Some(p)) => json_ok(&serde_json::json!({ "ok": true, "path": p })),
            Ok(None) => json_ok(&serde_json::json!({ "ok": false, "path": null })),
            Err(e) => json_err(500, &e),
        },
        (Method::Get, "/favorites") => json_ok(&serde_json::json!({ "favorites": fsx::favorites() })),
        (Method::Post, "/favorites") => match read_body(req) {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("").to_string();
                let add = b["add"].as_bool().unwrap_or(true);
                match fsx::toggle_favorite(&p, add) {
                    Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                    Err(e) => json_err(500, &e),
                }
            }
            Err(e) => json_err(400, &e),
        },
        (Method::Post, "/delete") => match read_body(req) {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                match fsx::delete_entry(p) {
                    Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                    Err(e) => json_err(500, &e),
                }
            }
            Err(e) => json_err(400, &e),
        },
        (Method::Post, "/copy") => match read_body(req) {
            Ok(b) => {
                let src = b["src"].as_str().unwrap_or("");
                let dest = b["dest"].as_str().unwrap_or("");
                match fsx::copy_entry(src, dest) {
                    Ok(target) => json_ok(&serde_json::json!({ "ok": true, "path": target })),
                    Err(e) => json_err(500, &e),
                }
            }
            Err(e) => json_err(400, &e),
        },
        (Method::Post, "/move") => match read_body(req) {
            Ok(b) => {
                let src = b["src"].as_str().unwrap_or("");
                let dest = b["dest"].as_str().unwrap_or("");
                match fsx::move_entry(src, dest) {
                    Ok(target) => json_ok(&serde_json::json!({ "ok": true, "path": target })),
                    Err(e) => json_err(400, &e),
                }
            }
            Err(e) => json_err(400, &e),
        },
        (Method::Post, "/write") => match read_body(req) {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                let data = b["data"].as_str().unwrap_or("");
                match fsx::write_file(p, data) {
                    Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                    Err(e) => json_err(500, &e),
                }
            }
            Err(e) => json_err(400, &e),
        },
        (Method::Post, "/mkdir") => match read_body(req) {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                match fsx::mkdir_entry(p) {
                    Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                    Err(e) => json_err(500, &e),
                }
            }
            Err(e) => json_err(400, &e),
        },
        (Method::Post, "/rename") => match read_body(req) {
            Ok(b) => {
                let old = b["oldPath"].as_str().or(b["path"].as_str()).unwrap_or("");
                let name = b["newName"].as_str().or(b["name"].as_str()).unwrap_or("");
                match fsx::rename_entry(old, name) {
                    Ok(target) => json_ok(&serde_json::json!({ "ok": true, "path": target })),
                    Err(e) => json_err(400, &e),
                }
            }
            Err(e) => json_err(400, &e),
        },
        (Method::Post, "/reveal") => match read_body(req) {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                json_ok(&fsx::reveal_in_explorer(p))
            }
            Err(e) => json_err(400, &e),
        },
        (Method::Post, "/exec") => match read_body(req) {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                match fsx::execute_file(p) {
                    Ok(val) => json_ok(&val),
                    Err(e) => json_err(500, &e),
                }
            }
            Err(e) => json_err(400, &e),
        },
        _ => return None,
    };

    Some(resp)
}
