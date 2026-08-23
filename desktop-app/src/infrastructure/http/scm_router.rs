//! Router /shell/git/* — delegado desde api.rs (una sola línea de dispatch).

use std::sync::Arc;

use tiny_http::{Method, Request, Response};

use crate::gitx;
use crate::state::{json_err, json_ok, read_body, AppState};

/// Atiende rutas git. Devuelve Some(response) si la ruta es del módulo.
pub fn handle(
    mut req: Request,
    _state: Arc<AppState>,
    path: &str,
    method: Method,
    q: &dyn Fn(&str) -> String,
) -> Option<Response<std::io::Cursor<Vec<u8>>>> {
    let route = path.strip_prefix("/shell/git")?;
    macro_rules! j {
        ($res:expr) => {
            match $res {
                Ok(v) => serde_json::to_value(v).map(|v| json_ok(&v)).unwrap_or_else(|e| json_err(500, &e.to_string())),
                Err(e) => json_err(400, &e),
            }
        };
    }

    let resp = match (method, route) {
        (Method::Get, "/panel") => j!(gitx::panel_snapshot(&q("path"))),
        (Method::Get, "/status") => j!(gitx::status(&q("path"))),
        (Method::Get, "/diff") => j!(gitx::diff(
            &q("path"),
            Some(q("file").as_str()).filter(|s| !s.is_empty()),
            q("staged") == "true"
        )),
        (Method::Get, "/diff-content") => j!(gitx::diff_content(
            &q("path"),
            &q("file"),
            q("staged") == "true",
            Some(q("originalPath").as_str()).filter(|s| !s.is_empty())
        )),
        (Method::Get, "/log") => {
            let limit: u32 = q("limit").parse().unwrap_or(50);
            let before = q("before");
            let search = q("search");
            j!(gitx::log(
                &q("path"),
                limit,
                Some(before.as_str()).filter(|s| !s.is_empty()),
                Some(search.as_str()).filter(|s| !s.is_empty())
            ))
        }
        (Method::Get, "/commit-files") => j!(gitx::commit_files(&q("path"), &q("sha"))),
        (Method::Post, "/commit-diff") => {
            let body = read_body(&mut req).unwrap_or(serde_json::Value::Null);
            let sha = body.get("sha").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let file = body.get("file").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let original = body.get("originalPath").and_then(|v| v.as_str()).unwrap_or("").to_string();
            match gitx::commit_file_diff(&q("path"), &sha, &file, Some(original).filter(|s| !s.is_empty())) {
                Ok(v) => serde_json::to_value(v).map(|v| json_ok(&v)).unwrap_or_else(|e| json_err(500, &e.to_string())),
                Err(e) => json_err(400, &e),
            }
        }
        (Method::Get, "/remote-url") => j!(gitx::remote_url(&q("path"), &q("name"))),
        (Method::Get, "/branches") => j!(gitx::list_branches(&q("path"))),
        (Method::Post, "/stage") => match body_strings(&mut req, "files") {
            Ok(files) => j!(gitx::stage(&q("path"), &files)),
            Err(e) => json_err(400, &e),
        },
        (Method::Post, "/unstage") => match body_strings(&mut req, "files") {
            Ok(files) => j!(gitx::unstage(&q("path"), &files)),
            Err(e) => json_err(400, &e),
        },
        (Method::Post, "/discard") => match body_discard(&mut req) {
            Ok(entries) => j!(gitx::discard(&q("path"), &entries)),
            Err(e) => json_err(400, &e),
        },
        (Method::Post, "/commit") => {
            let body = read_body(&mut req).unwrap_or(serde_json::Value::Null);
            let message = body.get("message").and_then(|v| v.as_str()).unwrap_or("").to_string();
            j!(gitx::commit(&q("path"), &message))
        }
        (Method::Post, "/push") => j!(gitx::push(&q("path"))),
        (Method::Post, "/fetch") => {
            match gitx::fetch(&q("path")) {
                Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                Err(e) => json_err(400, &e),
            }
        }
        (Method::Post, "/pull") => {
            match gitx::pull_ff_only(&q("path")) {
                Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                Err(e) => json_err(400, &e),
            }
        }
        (Method::Post, "/checkout") => {
            let body = read_body(&mut req).unwrap_or(serde_json::Value::Null);
            let name = body.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
            match gitx::checkout_branch(&q("path"), &name) {
                Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                Err(e) => json_err(400, &e),
            }
        }
        (Method::Post, "/show-commit-diff") => {
            let body = read_body(&mut req).unwrap_or(serde_json::Value::Null);
            let sha = body.get("sha").and_then(|v| v.as_str()).unwrap_or("").to_string();
            j!(gitx::show_commit_diff(&q("path"), &sha))
        }
        _ => return Some(json_err(404, "ruta git desconocida")),
    };
    Some(resp)
}

fn body_strings(req: &mut Request, key: &str) -> Result<Vec<String>, String> {
    let body = read_body(req)?;
    let arr = body
        .get(key)
        .and_then(|v| v.as_array())
        .ok_or_else(|| format!("body sin '{key}'"))?;
    Ok(arr
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect())
}

fn body_discard(req: &mut Request) -> Result<Vec<(String, bool)>, String> {
    let body = read_body(req)?;
    let arr = body
        .get("entries")
        .and_then(|v| v.as_array())
        .ok_or_else(|| "body sin 'entries'".to_string())?;
    Ok(arr
        .iter()
        .filter_map(|v| {
            let path = v.get("path").and_then(|p| p.as_str())?.to_string();
            let untracked = v.get("untracked").and_then(|u| u.as_bool()).unwrap_or(false);
            Some((path, untracked))
        })
        .collect())
}
