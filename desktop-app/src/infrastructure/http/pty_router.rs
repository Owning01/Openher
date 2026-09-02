//! Router /shell/pty/* — delegado desde api.rs.

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
    let route = path.strip_prefix("/shell/pty")?;
    if !route.is_empty() && !route.starts_with('/') {
        return None;
    }
    // ruta vacía o "/" corresponde a /shell/pty
    if route.is_empty() || route == "/" {
        match method {
            Method::Get => {
                return Some(json_ok(&serde_json::json!({ "terms": state.pty.list() })));
            }
            Method::Post => {
                let shell = q("shell");
                let cwd = q("cwd");
                let cfg_shell = {
                    let s = state.config.read().unwrap_or_else(|e| e.into_inner()).shell.clone();
                    if s.is_empty() { None } else { Some(s) }
                };
                let shell_param = if shell.is_empty() { cfg_shell } else { Some(shell) };
                return Some(match state.pty.create(shell_param, if cwd.is_empty() { None } else { Some(cwd) }) {
                    Ok(id) => json_ok(&serde_json::json!({ "id": id, "ws_port": state.port + 1 })),
                    Err(e) => json_err(500, &e.to_string()),
                });
            }
            _ => return None,
        }
    }

    let rest = route.trim_start_matches('/');
    let (id, op) = match rest.split_once('/') {
        Some((id, op)) => (id.to_string(), op.to_string()),
        None => (rest.to_string(), String::new()),
    };

    if op == "buffer" && method == Method::Get {
        let since = q("since").parse::<usize>().unwrap_or(0);
        let out = state.pty.stream_rx(&id);
        let info = match out {
            Some(o) => {
                let d = o.data.lock().unwrap_or_else(|e| e.into_inner());
                let base = o.base_offset.load(std::sync::atomic::Ordering::Relaxed);
                let total_len = base + d.len();
                let start = since.saturating_sub(base).min(d.len());
                let delta = &d[start..];
                serde_json::json!({
                    "len": total_len,
                    "done": o.done.load(std::sync::atomic::Ordering::SeqCst),
                    "data": crate::state::base64_encode(delta),
                })
            }
            None => serde_json::json!({ "error": "no existe" }),
        };
        return Some(json_ok(&info));
    }
    if op == "write" && method == Method::Post {
        return Some(match read_body(req) {
            Ok(b) => {
                let data = b["data"].as_str().unwrap_or("");
                match state.pty.write(&id, data.as_bytes()) {
                    Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                    Err(e) => json_err(404, &e),
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        });
    }
    if op == "resize" && method == Method::Post {
        return Some(match read_body(req) {
            Ok(b) => {
                let cols = b["cols"].as_u64().unwrap_or(100) as u16;
                let rows = b["rows"].as_u64().unwrap_or(30) as u16;
                let pw = b["pixel_width"].as_u64().unwrap_or(b["pixelWidth"].as_u64().unwrap_or(0)) as u16;
                let ph = b["pixel_height"].as_u64().unwrap_or(b["pixelHeight"].as_u64().unwrap_or(0)) as u16;
                match state.pty.resize_px(&id, cols, rows, pw, ph) {
                    Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                    Err(e) => json_err(404, &e),
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        });
    }
    if op.is_empty() && method == Method::Delete {
        state.pty.kill(&id);
        return Some(json_ok(&serde_json::json!({ "ok": true })));
    }

    None
}
