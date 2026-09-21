//! Router /shell/design/* — delegado desde api.rs.

use std::sync::Arc;

use crate::infrastructure::http::common::post;
use crate::infrastructure::http::io::{ShellRequest, ShellResponse};

use crate::state::AppState;

pub fn handle(
    req: &ShellRequest,
    _state: Arc<AppState>,
    path: &str,
    method: &str,
    _q: &dyn Fn(&str) -> String,
) -> Option<ShellResponse> {
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
        return Some(post!(req, b => {
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
        }));
    }

    None
}
