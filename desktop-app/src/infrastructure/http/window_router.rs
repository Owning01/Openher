//! Router /shell/window/* — controles frameless.

use std::sync::Arc;

use crate::infrastructure::http::io::{ShellRequest, ShellResponse};

use crate::state::AppState;

pub fn handle(
    _req: &ShellRequest,
    _state: Arc<AppState>,
    path: &str,
    method: &str,
    q: &dyn Fn(&str) -> String,
) -> Option<ShellResponse> {
    let route = path.strip_prefix("/shell/window")?;
    let resp = match (method, route) {
        ("GET", "/state") => {
            let maximized = crate::state::window_is_maximized();
            ShellResponse::ok_json(&serde_json::json!({ "maximized": maximized }))
        }
        ("POST", "/minimize") => {
            crate::state::window_minimize();
            ShellResponse::ok_json(&serde_json::json!({ "ok": true }))
        }
        ("POST", "/maximize") => {
            crate::state::window_maximize_toggle();
            let maximized = crate::state::window_is_maximized();
            ShellResponse::ok_json(&serde_json::json!({ "ok": true, "maximized": maximized }))
        }
        ("POST", "/close") => {
            crate::state::window_close();
            ShellResponse::ok_json(&serde_json::json!({ "ok": true }))
        }
        ("POST", "/drag") => {
            crate::state::window_drag();
            ShellResponse::ok_json(&serde_json::json!({ "ok": true }))
        }
        // Resize iniciado desde la web (handles .win-resize-*): no depende
        // del hit-test nativo, que el renderer del WebView (proceso hijo)
        // puede tragar devolviendo HTCLIENT antes de llegar al padre.
        ("POST", "/resize") => {
            use crate::state::WindowResizeDirection as D;
            let dir = match q("edge").as_str() {
                "top" => Some(D::Top),
                "bottom" => Some(D::Bottom),
                "left" => Some(D::Left),
                "right" => Some(D::Right),
                "top-left" => Some(D::TopLeft),
                "top-right" => Some(D::TopRight),
                "bottom-left" => Some(D::BottomLeft),
                "bottom-right" => Some(D::BottomRight),
                _ => None,
            };
            match dir {
                Some(d) => {
                    crate::state::window_resize(d);
                    ShellResponse::ok_json(&serde_json::json!({ "ok": true }))
                }
                None => ShellResponse::err_json(400, "edge inválido (top|bottom|left|right|top-left|top-right|bottom-left|bottom-right)"),
            }
        }
        _ => return None,
    };
    Some(resp)
}
