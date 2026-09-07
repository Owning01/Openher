//! Router /shell/window/* — controles frameless.

use std::sync::Arc;

use tiny_http::{Method, Request, Response};

use crate::state::{json_ok, AppState};

pub fn handle(
    _req: &mut Request,
    _state: Arc<AppState>,
    path: &str,
    method: Method,
    q: &dyn Fn(&str) -> String,
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
        // Resize iniciado desde la web (handles .win-resize-*): no depende
        // del hit-test nativo, que el renderer del WebView (proceso hijo)
        // puede tragar devolviendo HTCLIENT antes de llegar al padre.
        (Method::Post, "/resize") => {
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
                    json_ok(&serde_json::json!({ "ok": true }))
                }
                None => crate::state::json_err(400, "edge inválido (top|bottom|left|right|top-left|top-right|bottom-left|bottom-right)"),
            }
        }
        _ => return None,
    };
    Some(resp)
}
