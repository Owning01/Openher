//! Router /shell/stats* + /shell/design/* — delegado desde api.rs.

use std::io::Read;
use std::sync::Arc;

use crate::infrastructure::http::io::{ShellRequest, ShellResponse};

use crate::state::AppState;

#[allow(clippy::too_many_lines)]
pub fn handle(
    req: &ShellRequest,
    state: Arc<AppState>,
    path: &str,
    method: &str,
    _q: &dyn Fn(&str) -> String,
) -> Option<ShellResponse> {
    if path == "/shell/stats" {
        return Some(ShellResponse::ok_json(&state.stats.status()));
    }
    if path == "/shell/stats/start" && method == "POST" {
        crate::statsx::ensure(&state);
        return Some(ShellResponse::ok_json(&state.stats.status()));
    }
    if let Some(rest) = path.strip_prefix("/shell/stats/proxy/") {
        let query = req.query.as_str();
        let qs = if query.is_empty() { String::new() } else { format!("?{query}") };
        let stats_url = format!("http://127.0.0.1:8765/api/{rest}{qs}");
        let agent = ureq::builder().timeout(std::time::Duration::from_secs(15)).build();
        return Some(match agent.get(&stats_url).call() {
            Ok(resp) => {
                let mut body = Vec::new();
                resp.into_reader().read_to_end(&mut body).unwrap_or_default();
                let ct = "application/json";
                ShellResponse::from_string(200, String::from_utf8_lossy(&body).to_string())
                    .with_header("Content-Type", ct)
                    .with_header("Access-Control-Allow-Origin", "*")
                    .with_header("Cache-Control", "no-store")
            }
            Err(ureq::Error::Status(code, resp)) => {
                let mut body = Vec::new();
                resp.into_reader().read_to_end(&mut body).unwrap_or_default();
                let msg = String::from_utf8_lossy(&body).to_string();
                let body_json = if msg.is_empty() { format!("stats HTTP {code}") } else { msg };
                ShellResponse::err_json(code, &body_json)
            }
            Err(_) => ShellResponse::err_json(502, "stats server unavailable"),
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
            ShellResponse::ok_json(&serde_json::json!({ "running": true, "url": url }))
        } else {
            ShellResponse::ok_json(&serde_json::json!({ "running": false, "url": "http://localhost:3000" }))
        });
    }
    if path == "/shell/design/open" && method == "POST" {
        return Some(match req.json_body() {
            Ok(b) => {
                let url = b["url"].as_str().unwrap_or("http://localhost:3000").to_string();
                if !url.starts_with("http://") && !url.starts_with("https://") {
                    ShellResponse::err_json(400, "URL debe ser http(s)")
                } else {
                    let url_c = url.clone();
                    let _ = std::process::Command::new("cmd")
                        .args(["/c", "start", "", &url_c])
                        .spawn();
                    ShellResponse::ok_json(&serde_json::json!({ "ok": true, "url": url }))
                }
            }
            Err(e) => ShellResponse::err_json(400, &e.to_string()),
        });
    }

    None
}
