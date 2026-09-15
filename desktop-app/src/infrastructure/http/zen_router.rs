//! Router /shell/zen/go/* — puente a la API de OpenCode Go/Zen.
//! La key NUNCA viaja al cliente: el desktop la lee (configurada aquí o del
//! auth.json del PC) y reenvía la respuesta tal cual (con CORS para el WebView).
//! - GET /shell/zen/go/usage  → {usage:{rolling,weekly,monthly:{status,percent,resetsAt}}}
//! - GET /shell/zen/go/models → {object:"list",data:[{id,...}]} (público: sin key igual responde)
//! - GET /shell/zen/go/key-status → {configured, source:"custom"|"auth"|"none"} (jamás la key)
//! - POST /shell/zen/go/key {key} → guarda la key de ESTE equipo (vale para
//!   todos los que se conecten); DELETE la borra (vuelve al auth.json).
//! Sin desktop nuevo (404) o sin key (404 JSON) la UI muestra el motivo.

use std::sync::Arc;

use crate::infrastructure::http::io::{ShellRequest, ShellResponse};

use crate::state::AppState;

const ZEN_BASE: &str = "https://opencode.ai";

/// Key `opencode-go` del auth.json local (misma ubicación que usa opencode).
fn auth_json_key() -> Option<String> {
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

/// Key configurada en ESTE equipo (vale para todos los que se conecten):
/// archivo aparte del config general para que nunca se exponga por
/// /shell/config (que vuelca todo). Si hay, manda sobre el auth.json.
fn key_file() -> std::path::PathBuf {
    crate::state::data_dir().join("zen_go_key")
}

fn stored_key() -> Option<String> {
    let txt = std::fs::read_to_string(key_file()).ok()?;
    let k = txt.trim().to_string();
    if k.is_empty() {
        None
    } else {
        Some(k)
    }
}

fn key_source() -> &'static str {
    if stored_key().is_some() {
        "custom"
    } else if auth_json_key().is_some() {
        "auth"
    } else {
        "none"
    }
}

fn go_api_key() -> Option<String> {
    stored_key().or_else(auth_json_key)
}

fn with_cors(resp: ShellResponse) -> ShellResponse {
    resp.with_header("Access-Control-Allow-Origin", "*")
        .with_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
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
    req: &ShellRequest,
    _state: Arc<AppState>,
    path: &str,
    method: &str,
    _q: &dyn Fn(&str) -> String,
) -> Option<ShellResponse> {
    if method == "OPTIONS" && path.starts_with("/shell/zen/go/") {
        return Some(with_cors(ShellResponse::from_string(204, String::new())));
    }
    if path == "/shell/zen/go/key-status" && method == "GET" {
        return Some(with_cors(ShellResponse::ok_json(&serde_json::json!({
            "configured": key_source() != "none",
            "source": key_source(),
        }))));
    }
    if path == "/shell/zen/go/key" && method == "POST" {
        let key = req
            .json_body()
            .ok()
            .and_then(|b| b.get("key").and_then(|k| k.as_str()).map(|s| s.trim().to_string()))
            .unwrap_or_default();
        if key.len() < 10 {
            return Some(with_cors(ShellResponse::err_json(400, "Key inválida (vacía o muy corta)")));
        }
        let file = key_file();
        if let Some(parent) = file.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        return Some(match std::fs::write(&file, &key) {
            Ok(()) => with_cors(ShellResponse::ok_json(&serde_json::json!({ "ok": true, "source": "custom" }))),
            Err(e) => with_cors(ShellResponse::err_json(500, &format!("No se pudo guardar: {e}"))),
        });
    }
    if path == "/shell/zen/go/key" && method == "DELETE" {
        let _ = std::fs::remove_file(key_file());
        return Some(with_cors(ShellResponse::ok_json(&serde_json::json!({
            "ok": true,
            "source": key_source(),
        }))));
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
