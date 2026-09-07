//! Router /shell/git/* — delegado desde api.rs (una sola línea de dispatch).

use std::sync::Arc;

use crate::infrastructure::http::io::{ShellRequest, ShellResponse};

use crate::gitx;
use crate::state::AppState;

/// Atiende rutas git. Devuelve Some(response) si la ruta es del módulo.
#[allow(clippy::too_many_lines)]
pub fn handle(
    req: &ShellRequest,
    _state: Arc<AppState>,
    path: &str,
    method: &str,
    q: &dyn Fn(&str) -> String,
) -> Option<ShellResponse> {
    let route = path.strip_prefix("/shell/git")?;
    macro_rules! j {
        ($res:expr) => {
            match $res {
                Ok(v) => serde_json::to_value(v).map(|v| ShellResponse::ok_json(&v)).unwrap_or_else(|e| ShellResponse::err_json(500, &e.to_string())),
                Err(e) => ShellResponse::err_json(400, &e),
            }
        };
    }

    let resp = match (method, route) {
        ("GET", "/panel") => j!(gitx::panel_snapshot(&q("path"))),
        ("GET", "/status") => j!(gitx::status(&q("path"))),
        ("GET", "/diff") => j!(gitx::diff(
            &q("path"),
            Some(q("file").as_str()).filter(|s| !s.is_empty()),
            q("staged") == "true"
        )),
        ("GET", "/diff-content") => j!(gitx::diff_content(
            &q("path"),
            &q("file"),
            q("staged") == "true",
            Some(q("originalPath").as_str()).filter(|s| !s.is_empty())
        )),
        ("GET", "/log") => {
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
        ("GET", "/commit-files") => j!(gitx::commit_files(&q("path"), &q("sha"))),
        ("POST", "/commit-diff") => {
            let body = req.json_body().unwrap_or(serde_json::Value::Null);
            let sha = body.get("sha").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let file = body.get("file").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let original = body.get("originalPath").and_then(|v| v.as_str()).unwrap_or("").to_string();
            match gitx::commit_file_diff(&q("path"), &sha, &file, Some(original.as_str()).filter(|s| !s.is_empty())) {
                Ok(v) => serde_json::to_value(v).map(|v| ShellResponse::ok_json(&v)).unwrap_or_else(|e| ShellResponse::err_json(500, &e.to_string())),
                Err(e) => ShellResponse::err_json(400, &e),
            }
        }
        ("GET", "/remote-url") => j!(gitx::remote_url(&q("path"), &q("name"))),
        ("GET", "/branches") => j!(gitx::list_branches(&q("path"))),
        ("POST", "/stage") => match body_strings(req, "files") {
            Ok(files) => j!(gitx::stage(&q("path"), &files)),
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/unstage") => match body_strings(req, "files") {
            Ok(files) => j!(gitx::unstage(&q("path"), &files)),
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/discard") => match body_discard(req) {
            Ok(entries) => j!(gitx::discard(&q("path"), &entries)),
            Err(e) => ShellResponse::err_json(400, &e),
        },
        ("POST", "/commit") => {
            let body = req.json_body().unwrap_or(serde_json::Value::Null);
            let message = body.get("message").and_then(|v| v.as_str()).unwrap_or("").to_string();
            j!(gitx::commit(&q("path"), &message))
        }
        ("POST", "/push") => j!(gitx::push(&q("path"))),
        ("POST", "/fetch") => {
            match gitx::fetch(&q("path")) {
                Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                Err(e) => ShellResponse::err_json(400, &e),
            }
        }
        ("POST", "/pull") => {
            match gitx::pull_ff_only(&q("path")) {
                Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                Err(e) => ShellResponse::err_json(400, &e),
            }
        }
        ("POST", "/checkout") => {
            let body = req.json_body().unwrap_or(serde_json::Value::Null);
            let name = body.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
            match gitx::checkout_branch(&q("path"), &name) {
                Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                Err(e) => ShellResponse::err_json(400, &e),
            }
        }
        ("POST", "/show-commit-diff") => {
            let body = req.json_body().unwrap_or(serde_json::Value::Null);
            let sha = body.get("sha").and_then(|v| v.as_str()).unwrap_or("").to_string();
            j!(gitx::show_commit_diff(&q("path"), &sha))
        }
        _ => return Some(ShellResponse::err_json(404, "ruta git desconocida")),
    };
    Some(resp)
}

fn body_strings(req: &ShellRequest, key: &str) -> Result<Vec<String>, String> {
    let body = req.json_body()?;
    let arr = body
        .get(key)
        .and_then(|v| v.as_array())
        .ok_or_else(|| format!("body sin '{key}'"))?;
    Ok(arr
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect())
}

fn body_discard(req: &ShellRequest) -> Result<Vec<(String, bool)>, String> {
    let body = req.json_body()?;
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
