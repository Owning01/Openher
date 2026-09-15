//! Router /shell/zen/go/* — puente a la API de OpenCode Go/Zen.
//! La key vive en el auth.json local del PC y NUNCA viaja al cliente: el
//! desktop la lee y reenvía la respuesta tal cual (con CORS para el WebView).
//! - GET /shell/zen/go/usage  → {usage:{rolling,weekly,monthly:{status,percent,resetsAt}}}
//! - GET /shell/zen/go/models → {object:"list",data:[{id,...}]} (público: sin key igual responde)
//! Sin desktop nuevo (404) o sin key (404 JSON) la UI muestra el motivo.

use std::sync::Arc;

use crate::infrastructure::http::io::{ShellRequest, ShellResponse};

use crate::state::AppState;

const ZEN_BASE: &str = "https://opencode.ai";

/// Key `opencode-go` del auth.json local (misma ubicación que usa opencode).
fn go_api_key() -> Option<String> {
    let mut cands: Vec<std::path::PathBuf> = Vec::new();
    if let Ok(home) = std::env::var("USERPROFILE").or_else(|_| std::env::var("HOME")) {
        cands.push(std::path::PathBuf::from(&home).join(".local/share/opencode/auth.json"));
    }
    if let Ok(appdata) = std::env::var("APPDATA") {
        cands.push(std::path::PathBuf::from(&appdata).join("opencode/auth.json"));
    }
    for p in cands {
        let Ok(txt) = std::fs::read_to_string(&p) else {
            continue;
        };
        let Ok(v) = serde_json::from_str::<serde_json::Value>(&txt) else {
            continue;
        };
        if let Some(k) = v
            .get("opencode-go")
            .and_then(|e| e.get("key"))
            .and_then(|k| k.as_str())
        {
            if !k.trim().is_empty() {
                return Some(k.trim().to_string());
            }
        }
    }
    None
}

fn with_cors(resp: ShellResponse) -> ShellResponse {
    resp.with_header("Access-Control-Allow-Origin", "*")
        .with_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        .with_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

fn forward(suffix: &str, need_key: bool) -> ShellResponse {
    let key = go_api_key();
    if need_key && key.is_none() {
        return with_cors(ShellResponse::err_json(
            404,
            "Sin key opencode-go en este equipo (conectala con /connect en la TUI)",
        ));
    }
    let url = format!("{ZEN_BASE}{suffix}");
    let agent: ureq::Agent = ureq::builder()
        .timeout(std::time::Duration::from_secs(15))
        .redirects(3)
        .build();
    let mut ureq_req = agent.request("GET", &url);
    ureq_req = ureq_req.set("Accept", "application/json");
    if let Some(k) = &key {
        ureq_req = ureq_req.set("Authorization", &format!("Bearer {k}"));
    }
    match ureq_req.call() {
        Ok(resp) => {
            let status = resp.status();
            let ct = resp
                .header("Content-Type")
                .unwrap_or("application/json")
                .to_string();
            let mut reader = resp.into_reader();
            let mut body = Vec::new();
            let _ = std::io::Read::read_to_end(&mut reader, &mut body);
            with_cors(ShellResponse::data(status, body, &ct))
        }
        Err(ureq::Error::Status(code, resp)) => {
            let mut reader = resp.into_reader();
            let mut body = Vec::new();
            let _ = std::io::Read::read_to_end(&mut reader, &mut body);
            let msg = String::from_utf8_lossy(&body);
            let short: String = msg.chars().take(200).collect();
            with_cors(ShellResponse::err_json(code, &format!("Zen API {code}: {short}")))
        }
        Err(e) => with_cors(ShellResponse::err_json(502, &format!("No se pudo contactar a Zen: {e}"))),
    }
}

pub fn handle(
    _req: &ShellRequest,
    _state: Arc<AppState>,
    path: &str,
    method: &str,
    _q: &dyn Fn(&str) -> String,
) -> Option<ShellResponse> {
    if method == "OPTIONS" && path.starts_with("/shell/zen/go/") {
        return Some(with_cors(ShellResponse::from_string(204, String::new())));
    }
    if method != "GET" {
        return None;
    }
    match path {
        "/shell/zen/go/usage" => Some(forward("/zen/go/v1/usage", true)),
        "/shell/zen/go/models" => Some(forward("/zen/go/v1/models", false)),
        _ => None,
    }
}
