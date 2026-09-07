//! Router /shell/fs/* — delegado desde api.rs.

use std::path::Path;
use std::sync::Arc;

use crate::infrastructure::http::io::{ShellRequest, ShellResponse};

use crate::fsx;
use crate::state::AppState;

#[allow(clippy::too_many_lines)]
pub fn handle(
    req: &ShellRequest,
    _state: Arc<AppState>,
    path: &str,
    method: &str,
    q: &dyn Fn(&str) -> String,
) -> Option<ShellResponse> {
    let route = path.strip_prefix("/shell/fs")?;

    macro_rules! j {
        ($res:expr) => {
            match $res {
                Ok(v) => ShellResponse::ok_json(&v),
                Err(e) => ShellResponse::err_json(400, &e),
            }
        };
    }

    let resp = match (method, route) {
        ("GET", "/drives") => ShellResponse::ok_json(&serde_json::json!({ "drives": fsx::drives() })),
        ("GET", "/list") => {
            let p = q("path").replace("%2F", "/");
            // Watch on-demand: el dir listado queda vigilado para /changes
            // (dedupeado por el mapa interno; no recursivo salvo project root)
            let pb = Path::new(&p).to_path_buf();
            if pb.is_dir() {
                crate::fswatch::global().watch_dir(&pb);
            }
            j!(fsx::list_dir(&p))
        }
        ("GET", "/changes") => {
            let since = q("since").parse::<u64>().unwrap_or(0);
            let (seq, events) = crate::fswatch::global().changes_since(since);
            ShellResponse::ok_json(&serde_json::json!({
                "seq": seq,
                "events": events.iter().map(|(s, e)| serde_json::json!({
                    "seq": s,
                    "path": e.path.to_string_lossy(),
                    "kind": e.kind,
                })).collect::<Vec<_>>(),
            }))
        }
        ("GET", "/search") => {
            let p = q("path").replace("%2F", "/");
            let query = q("q");
            let limit = q("limit").parse::<usize>().unwrap_or(100);
            j!(fsx::search_code(&p, &query, limit))
        }
        ("GET", "/download") => {
            let p = q("path");
            if p.is_empty() {
                return Some(ShellResponse::err_json(400, "falta path"));
            }
            let path_buf = Path::new(&p).to_path_buf();
            if !path_buf.exists() {
                return Some(ShellResponse::err_json(404, "no existe"));
            }
            if path_buf.is_dir() {
                return Some(ShellResponse::err_json(400, "es directorio, no archivo"));
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
                        ShellResponse::data(200, bytes, mime)
                            .with_header("Content-Length", &len)
                            .with_header("Content-Disposition", &cd)
                            .with_header("Access-Control-Allow-Origin", "*")
                            .with_header(
                                "Access-Control-Expose-Headers",
                                "Content-Disposition, Content-Length, Content-Type",
                            ),
                    );
                }
                Err(e) => return Some(ShellResponse::err_json(500, &e.to_string())),
            }
        }
        ("GET", "/read") => {
            let p = q("path");
            match fsx::read_file(&p, 65536) {
                Ok(v) => ShellResponse::ok_json(&v),
                Err(e) => ShellResponse::err_json(404, &e),
            }
        }
        ("GET", "/resolve") => ShellResponse::ok_json(&fsx::resolve(&q("path"))),
        ("GET", "/session") => ShellResponse::ok_json(&fsx::session_for_dir(&q("path"))),
        ("GET", "/pick-folder") => match fsx::pick_folder() {
            Ok(Some(p)) => ShellResponse::ok_json(&serde_json::json!({ "ok": true, "path": p })),
            Ok(None) => ShellResponse::ok_json(&serde_json::json!({ "ok": false, "path": null })),
            Err(e) => ShellResponse::err_json(500, &e),
        },
        ("GET", "/favorites") => ShellResponse::ok_json(&serde_json::json!({ "favorites": fsx::favorites() })),
        ("POST", "/favorites") => match req.json_body() {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("").to_string();
                let add = b["add"].as_bool().unwrap_or(true);
                match fsx::toggle_favorite(&p, add) {
                    Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                    Err(e) => ShellResponse::err_json(500, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/delete") => match req.json_body() {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                match fsx::delete_entry(p) {
                    Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                    Err(e) => ShellResponse::err_json(500, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/trash") => match req.json_body() {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                match fsx::trash_entry(p) {
                    Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                    Err(e) => ShellResponse::err_json(500, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/zip") => match req.json_body() {
            Ok(b) => {
                let paths: Vec<String> = b["paths"]
                    .as_array()
                    .map(|a| a.iter().filter_map(|v| v.as_str().map(str::to_string)).collect())
                    .unwrap_or_default();
                let dest = b["dest"].as_str().unwrap_or("");
                let name = b["name"].as_str().unwrap_or("archivos.zip");
                match fsx::zip_create(&paths, dest, name) {
                    Ok(target) => ShellResponse::ok_json(&serde_json::json!({ "ok": true, "path": target })),
                    Err(e) => ShellResponse::err_json(500, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/unzip") => match req.json_body() {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                match fsx::zip_extract(p) {
                    Ok(target) => ShellResponse::ok_json(&serde_json::json!({ "ok": true, "path": target })),
                    Err(e) => ShellResponse::err_json(500, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/terminal") => match req.json_body() {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                match fsx::open_terminal(p) {
                    Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                    Err(e) => ShellResponse::err_json(500, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/copy") => match req.json_body() {
            Ok(b) => {
                let src = b["src"].as_str().unwrap_or("");
                let dest = b["dest"].as_str().unwrap_or("");
                match fsx::copy_entry(src, dest) {
                    Ok(target) => ShellResponse::ok_json(&serde_json::json!({ "ok": true, "path": target })),
                    Err(e) => ShellResponse::err_json(500, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/move") => match req.json_body() {
            Ok(b) => {
                let src = b["src"].as_str().unwrap_or("");
                let dest = b["dest"].as_str().unwrap_or("");
                match fsx::move_entry(src, dest) {
                    Ok(target) => ShellResponse::ok_json(&serde_json::json!({ "ok": true, "path": target })),
                    Err(e) => ShellResponse::err_json(400, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/write") => match req.json_body() {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                let data = b["data"].as_str().unwrap_or("");
                match fsx::write_file(p, data) {
                    Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                    Err(e) => ShellResponse::err_json(500, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/mkdir") => match req.json_body() {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                match fsx::mkdir_entry(p) {
                    Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                    Err(e) => ShellResponse::err_json(500, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/rename") => match req.json_body() {
            Ok(b) => {
                let old = b["oldPath"].as_str().or(b["path"].as_str()).unwrap_or("");
                let name = b["newName"].as_str().or(b["name"].as_str()).unwrap_or("");
                match fsx::rename_entry(old, name) {
                    Ok(target) => ShellResponse::ok_json(&serde_json::json!({ "ok": true, "path": target })),
                    Err(e) => ShellResponse::err_json(400, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/reveal") => match req.json_body() {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                ShellResponse::ok_json(&fsx::reveal_in_explorer(p))
            }
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/exec") => match req.json_body() {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                match fsx::execute_file(p) {
                    Ok(val) => ShellResponse::ok_json(&val),
                    Err(e) => ShellResponse::err_json(500, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/open") => match req.json_body() {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                match fsx::open_default(p) {
                    Ok(val) => ShellResponse::ok_json(&val),
                    Err(e) => ShellResponse::err_json(500, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/open-with") => match req.json_body() {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                let app = b["app"].as_str().unwrap_or("");
                match fsx::open_with(p, app) {
                    Ok(val) => ShellResponse::ok_json(&val),
                    Err(e) => ShellResponse::err_json(500, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("GET", "/pick-app") => match fsx::pick_app() {
            Ok(Some(p)) => ShellResponse::ok_json(&serde_json::json!({ "ok": true, "path": p })),
            Ok(None) => ShellResponse::ok_json(&serde_json::json!({ "ok": false, "path": null })),
            Err(e) => ShellResponse::err_json(500, &e),
        },
        _ => return None,
    };

    Some(resp)
}
