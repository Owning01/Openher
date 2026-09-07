//! Router /shell/kanban* — delegado desde api.rs.

use std::sync::Arc;

use crate::infrastructure::http::io::{ShellRequest, ShellResponse};

use crate::state::AppState;

#[allow(clippy::too_many_lines)]
pub fn handle(
    req: &ShellRequest,
    state: Arc<AppState>,
    path: &str,
    method: &str,
    q: &dyn Fn(&str) -> String,
) -> Option<ShellResponse> {
    let route = path.strip_prefix("/shell/kanban")?;
    if !route.is_empty() && !route.starts_with('/') {
        return None;
    }
    let route = if route.is_empty() { "/" } else { route };

    let resp = match (method, route) {
        ("GET", "/") => ShellResponse::ok_json(&state.kanban.all()),
        ("POST", "/board") => match req.json_body() {
            Ok(b) => {
                let name = b["name"].as_str().unwrap_or("Nuevo board");
                match state.kanban.add_board(name) {
                    Ok(v) => ShellResponse::ok_json(&serde_json::json!({ "ok": true, "board": v })),
                    Err(e) => ShellResponse::err_json(500, &e.to_string()),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e.to_string()),
        },
        ("DELETE", "/board") => {
            let id = q("id");
            match state.kanban.delete_board(&id) {
                Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                Err(e) => ShellResponse::err_json(404, &e),
            }
        }
        ("POST", "/card") => match req.json_body() {
            Ok(b) => {
                let board = b["board"].as_str().unwrap_or("");
                let column = b["column"].as_str().unwrap_or("todo");
                let title = b["title"].as_str().unwrap_or("");
                let notes = b["notes"].as_str().unwrap_or("");
                let color = b["color"].as_str().unwrap_or("#fab283");
                match state.kanban.add_card(board, column, title, notes, color) {
                    Ok(v) => ShellResponse::ok_json(&serde_json::json!({ "ok": true, "card": v })),
                    Err(e) => ShellResponse::err_json(500, &e.to_string()),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e.to_string()),
        },
        ("PATCH", "/card") => match req.json_body() {
            Ok(b) => {
                let id = b["id"].as_str().unwrap_or("");
                match state.kanban.update_card(id, &b) {
                    Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                    Err(e) => ShellResponse::err_json(404, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e.to_string()),
        },
        ("DELETE", "/card") => {
            let id = q("id");
            match state.kanban.delete_card(&id) {
                Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                Err(e) => ShellResponse::err_json(404, &e),
            }
        }
        _ => return None,
    };

    Some(resp)
}
