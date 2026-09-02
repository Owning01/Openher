//! Router /shell/stats* + /shell/design/* — delegado desde api.rs.

use std::io::Read;
use std::sync::Arc;

use tiny_http::{Header, Method, Request, Response, StatusCode};

use crate::state::{json_err, json_ok, read_body, AppState};

#[allow(clippy::too_many_lines)]
pub fn handle(
    req: &mut Request,
    state: Arc<AppState>,
    path: &str,
    method: Method,
    _q: &dyn Fn(&str) -> String,
) -> Option<Response<std::io::Cursor<Vec<u8>>>> {
    if path == "/shell/stats" {
        return Some(json_ok(&state.stats.status()));
    }
    if path == "/shell/stats/start" && method == Method::Post {
        crate::statsx::ensure(&state);
        return Some(json_ok(&state.stats.status()));
    }
    if let Some(rest) = path.strip_prefix("/shell/stats/proxy/") {
        let url = req.url().to_string();
        let query = url.split('?').nth(1).unwrap_or("");
        let qs = if query.is_empty() { String::new() } else { format!("?{query}") };
        let stats_url = format!("http://127.0.0.1:8765/api/{rest}{qs}");
        let agent = ureq::builder().timeout(std::time::Duration::from_secs(15)).build();
        return Some(match agent.get(&stats_url).call() {
            Ok(resp) => {
                let mut body = Vec::new();
                resp.into_reader().read_to_end(&mut body).unwrap_or_default();
                let ct = "application/json";
                Response::from_string(String::from_utf8_lossy(&body).to_string())
                    .with_header(Header::from_bytes("Content-Type", ct).unwrap())
                    .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap())
                    .with_header(Header::from_bytes("Cache-Control", "no-store").unwrap())
                    .with_status_code(StatusCode(200))
            }
            Err(ureq::Error::Status(code, resp)) => {
                let mut body = Vec::new();
                resp.into_reader().read_to_end(&mut body).unwrap_or_default();
                let msg = String::from_utf8_lossy(&body).to_string();
                let body_json = if msg.is_empty() { format!("stats HTTP {code}") } else { msg };
                json_err(code, &body_json)
            }
            Err(_) => json_err(502, "stats server unavailable"),
        });
    }

    if path == "/shell/design/status" {
        let candidates = [
            "http://127.0.0.1:3000",
            "http://localhost:3000",
            "http://127.0.0.1:3001",
            "http://localhost:3001",
            "http://127.0.0.1:5173",
        ];
        let mut found: Option<&str> = None;
        for c in candidates {
            let ok = ureq::builder()
                .timeout(std::time::Duration::from_millis(600))
                .build()
                .get(c)
                .call()
                .is_ok();
            if ok {
                found = Some(c);
                break;
            }
        }
        return Some(if let Some(url) = found {
            json_ok(&serde_json::json!({ "running": true, "url": url }))
        } else {
            json_ok(&serde_json::json!({ "running": false, "url": "http://localhost:3000" }))
        });
    }
    if path == "/shell/design/open" && method == Method::Post {
        return Some(match read_body(req) {
            Ok(b) => {
                let url = b["url"].as_str().unwrap_or("http://localhost:3000").to_string();
                if !url.starts_with("http://") && !url.starts_with("https://") {
                    json_err(400, "URL debe ser http(s)")
                } else {
                    let url_c = url.clone();
                    let _ = std::process::Command::new("cmd")
                        .args(["/c", "start", "", &url_c])
                        .spawn();
                    json_ok(&serde_json::json!({ "ok": true, "url": url }))
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        });
    }

    None
}
