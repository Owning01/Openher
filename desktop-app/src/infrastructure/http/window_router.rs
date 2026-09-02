//! Router /shell/window/* — controles frameless.

use std::sync::Arc;

use tiny_http::{Method, Request, Response};

use crate::state::{json_ok, AppState};

pub fn handle(
    _req: &mut Request,
    _state: Arc<AppState>,
    path: &str,
    method: Method,
    _q: &dyn Fn(&str) -> String,
) -> Option<Response<std::io::Cursor<Vec<u8>>>> {
    let route = path.strip_prefix("/shell/window")?;
    let resp = match (method, route) {
        (Method::Get, "/state") => {
            let maximized = crate::state::window_is_maximized();
            json_ok(&serde_json::json!({ "maximized": maximized }))
        }
        (Method::Post, "/minimize") => {
            crate::state::window_minimize();
            json_ok(&serde_json::json!({ "ok": true }))
        }
        (Method::Post, "/maximize") => {
            crate::state::window_maximize_toggle();
            let maximized = crate::state::window_is_maximized();
            json_ok(&serde_json::json!({ "ok": true, "maximized": maximized }))
        }
        (Method::Post, "/close") => {
            crate::state::window_close();
            json_ok(&serde_json::json!({ "ok": true }))
        }
        (Method::Post, "/drag") => {
            crate::state::window_drag();
            json_ok(&serde_json::json!({ "ok": true }))
        }
        _ => return None,
    };
    Some(resp)
}
