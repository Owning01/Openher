//! Router /shell/browser/* — delegado desde api.rs.
//! Extraído como P0 FSD: 9 rutas (open/bounds/visibility/navigate/close/url/shortcuts/eval/pick).

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
    let route = path.strip_prefix("/shell/browser")?;
    // /shell/browser/pick tiene GET y POST — diferenciar por método
    let resp = match (method, route) {
        (Method::Post, "/open") => match read_body(req) {
            Ok(v) => {
                let view = v["view"].as_str().unwrap_or("");
                let url = v["url"].as_str().unwrap_or("about:blank");
                let has_bounds = v.get("bounds").is_some() && v["bounds"].is_object();
                let bx = v["bounds"]["x"].as_f64().unwrap_or(0.0);
                let by = v["bounds"]["y"].as_f64().unwrap_or(0.0);
                let bw = v["bounds"]["w"].as_f64().unwrap_or(800.0);
                let bh = v["bounds"]["h"].as_f64().unwrap_or(600.0);
                let bounds = wry::Rect {
                    position: wry::dpi::LogicalPosition::new(bx, by).into(),
                    size: wry::dpi::LogicalSize::new(bw, bh).into(),
                };
                let is_default_bounds = !has_bounds && bx == 0.0 && by == 0.0 && bw == 800.0 && bh == 600.0;
                match state.browser.open(view, url, bounds) {
                    Ok(()) => {
                        if is_default_bounds {
                            let _ = state.browser.set_visible(view, false);
                        }
                        json_ok(&serde_json::json!({ "ok": true, "hidden_default": is_default_bounds }))
                    }
                    Err(e) => json_err(500, &e.to_string()),
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        },
        (Method::Post, "/bounds") => match read_body(req) {
            Ok(v) => {
                let view = v["view"].as_str().unwrap_or("");
                let bx = v["x"].as_f64().unwrap_or(0.0);
                let by = v["y"].as_f64().unwrap_or(0.0);
                let bw = v["w"].as_f64().unwrap_or(800.0);
                let bh = v["h"].as_f64().unwrap_or(600.0);
                let bounds = wry::Rect {
                    position: wry::dpi::LogicalPosition::new(bx, by).into(),
                    size: wry::dpi::LogicalSize::new(bw, bh).into(),
                };
                match state.browser.set_bounds(view, bounds) {
                    Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                    Err(e) => json_err(500, &e.to_string()),
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        },
        (Method::Post, "/visibility") => match read_body(req) {
            Ok(v) => {
                let view = v["view"].as_str().unwrap_or("");
                let visible = v["visible"].as_bool().unwrap_or(true);
                match state.browser.set_visible(view, visible) {
                    Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                    Err(e) => json_err(500, &e.to_string()),
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        },
        (Method::Post, "/navigate") => match read_body(req) {
            Ok(v) => {
                let view = v["view"].as_str().unwrap_or("");
                let url = v["url"].as_str().unwrap_or("");
                let action = v["action"].as_str();
                match state.browser.navigate(view, url, action) {
                    Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                    Err(e) => json_err(500, &e.to_string()),
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        },
        // POST /close drena UNA vista ({"view": bid}) o todas (sin body).
        // El frontend cierra la vista nativa al podar el bid huérfano.
        (Method::Post, "/close") => {
            let view: Option<String> = read_body(req).ok().and_then(|v| v["view"].as_str().map(|s| s.to_string()));
            match state.browser.close(view.as_deref()) {
                Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                Err(e) => json_err(500, &e.to_string()),
            }
        }
        (Method::Get, "/url") => match state.browser.current_url(q("view").as_str()) {
            Ok(url) => json_ok(&serde_json::json!({ "url": url })),
            Err(e) => json_err(500, &e.to_string()),
        },
        // Descargas completadas desde la última lectura (cola, máx 20).
        (Method::Get, "/downloads") => {
            let items = state.browser.drain_downloads();
            json_ok(&serde_json::json!({ "downloads": items }))
        }
        (Method::Get, "/shortcuts") => {
            let shortcuts: Vec<serde_json::Value> = state
                .browser
                .drain_shortcuts()
                .into_iter()
                .filter_map(|s| serde_json::from_str(&s).ok())
                .collect();
            json_ok(&serde_json::json!({ "shortcuts": shortcuts }))
        }
        (Method::Post, "/eval") => match read_body(req) {
            Ok(v) => {
                let view = v["view"].as_str().unwrap_or("");
                let code = v["code"].as_str().unwrap_or("");
                if code.is_empty() {
                    return Some(json_err(400, "missing code"));
                }
                if code.len() > 256 * 1024 {
                    return Some(json_err(413, "code too large"));
                }
                // Allowlist: solo scripts de inspección generados por el host; bloquea XSS arbitrario desde markdown
                let trimmed = code.trim_start();
                let is_allowed = code.contains("__oc_")
                    || trimmed.starts_with("history.")
                    || trimmed.starts_with("window.find")
                    || trimmed.starts_with("document.")
                    || code.contains("document.documentElement.style.zoom")
                    || code.contains("window.chrome.webview.postMessage")
                    || trimmed.starts_with("(function()");
                if !is_allowed {
                    eprintln!("[browser][eval] forbidden code blocked (len={})", code.len());
                    return Some(json_err(403, "eval forbidden"));
                }
                match state.browser.eval(view, code) {
                    Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                    Err(e) => json_err(500, &e.to_string()),
                }
            }
            Err(_) => json_err(400, "bad body"),
        },
        (Method::Post, "/pick") => match read_body(req) {
            Ok(v) => {
                let serialized = v.to_string();
                if serialized.len() > 128 * 1024 {
                    return Some(json_err(413, "pick too large"));
                }
                let mut queue = state.browser_picks.lock().unwrap_or_else(|e| e.into_inner());
                if queue.len() < 64 {
                    queue.push(serialized);
                }
                json_ok(&serde_json::json!({ "ok": true }))
            }
            Err(_) => json_err(400, "bad body"),
        },
        (Method::Get, "/pick") => {
            let drained: Vec<serde_json::Value> = {
                let mut queue = state.browser_picks.lock().unwrap_or_else(|e| e.into_inner());
                queue.drain(..).map(|s| serde_json::from_str(&s).unwrap_or(serde_json::Value::Null)).collect()
            };
            json_ok(&serde_json::json!({ "picks": drained }))
        }
        _ => return None,
    };
    Some(resp)
}
