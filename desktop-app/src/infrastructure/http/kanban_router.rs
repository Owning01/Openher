//! Router /shell/kanban* — delegado desde api.rs.

use std::sync::Arc;

use tiny_http::{Method, Request, Response};

use crate::state::{json_err, json_ok, read_body, AppState};

#[allow(clippy::too_many_lines)]
pub fn handle(
    req: &mut Request,
    state: Arc<AppState>,
    path: &str,
    method: Method,
    q: &dyn Fn(&str) -> String,
) -> Option<Response<std::io::Cursor<Vec<u8>>>> {
    let route = path.strip_prefix("/shell/kanban")?;
    if !route.is_empty() && !route.starts_with('/') {
        return None;
    }
    let route = if route.is_empty() { "/" } else { route };

    let resp = match (method, route) {
        (Method::Get, "/") => json_ok(&state.kanban.all()),
        (Method::Post, "/board") => match read_body(req) {
            Ok(b) => {
                let name = b["name"].as_str().unwrap_or("Nuevo board");
                match state.kanban.add_board(name) {
                    Ok(v) => json_ok(&serde_json::json!({ "ok": true, "board": v })),
                    Err(e) => json_err(500, &e.to_string()),
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        },
        (Method::Delete, "/board") => {
            let id = q("id");
            match state.kanban.delete_board(&id) {
                Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                Err(e) => json_err(404, &e),
            }
        }
        (Method::Post, "/card") => match read_body(req) {
            Ok(b) => {
                let board = b["board"].as_str().unwrap_or("");
                let column = b["column"].as_str().unwrap_or("todo");
                let title = b["title"].as_str().unwrap_or("");
                let notes = b["notes"].as_str().unwrap_or("");
                let color = b["color"].as_str().unwrap_or("#fab283");
                match state.kanban.add_card(board, column, title, notes, color) {
                    Ok(v) => json_ok(&serde_json::json!({ "ok": true, "card": v })),
                    Err(e) => json_err(500, &e.to_string()),
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        },
        (Method::Patch, "/card") => match read_body(req) {
            Ok(b) => {
                let id = b["id"].as_str().unwrap_or("");
                match state.kanban.update_card(id, &b) {
                    Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                    Err(e) => json_err(404, &e),
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        },
        (Method::Delete, "/card") => {
            let id = q("id");
            match state.kanban.delete_card(&id) {
                Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                Err(e) => json_err(404, &e),
            }
        }
        _ => return None,
    };

    Some(resp)
}
