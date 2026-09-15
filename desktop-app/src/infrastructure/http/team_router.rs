//! Router /shell/team/* — relevo entre agentes de esta máquina.
//! Los agentes corren en el PC y llegan por loopback (sin auth propia); el
//! desktop reenvía al server opencode local con las credenciales que YA tiene
//! configuradas (las mismas de la app). Nada de esto sale del equipo.
//! - POST /shell/team/send {toSession, text, from, delivery?} → el mensaje
//!   entra al inbox de la sesión destino con metadata.from (el chat lo pinta
//!   de otro color con "de: <nombre>"). delivery: "queue" (default, no
//!   interrumpe) | "steer".

use std::sync::Arc;

use crate::infrastructure::http::io::{ShellRequest, ShellResponse};

use crate::state::AppState;

fn with_cors(resp: ShellResponse) -> ShellResponse {
    resp.with_header("Access-Control-Allow-Origin", "*")
        .with_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .with_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

fn valid_session_id(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 80
        && s.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
}

pub fn handle(
    req: &ShellRequest,
    state: Arc<AppState>,
    path: &str,
    method: &str,
    _q: &dyn Fn(&str) -> String,
) -> Option<ShellResponse> {
    if path != "/shell/team/send" {
        return None;
    }
    if method == "OPTIONS" {
        return Some(with_cors(ShellResponse::from_string(204, String::new())));
    }
    if method != "POST" {
        return None;
    }
    let body = match req.json_body() {
        Ok(b) => b,
        Err(e) => return Some(with_cors(ShellResponse::err_json(400, &format!("JSON inválido: {e}")))),
    };
    let to_session = body.get("toSession").and_then(|v| v.as_str()).unwrap_or("").trim().to_string();
    let text = body.get("text").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let from = body.get("from").and_then(|v| v.as_str()).unwrap_or("").trim().to_string();
    let delivery = body.get("delivery").and_then(|v| v.as_str()).unwrap_or("queue");
    if !valid_session_id(&to_session) {
        return Some(with_cors(ShellResponse::err_json(400, "toSession inválido")));
    }
    if text.trim().is_empty() || text.len() > 8000 {
        return Some(with_cors(ShellResponse::err_json(400, "text vacío o muy largo (máx 8000)")));
    }
    if from.is_empty() || from.len() > 80 {
        return Some(with_cors(ShellResponse::err_json(400, "from requerido (máx 80)")));
    }
    if delivery != "queue" && delivery != "steer" {
        return Some(with_cors(ShellResponse::err_json(400, "delivery: queue|steer")));
    }
    let cfg = state.config.read().unwrap_or_else(|e| e.into_inner()).clone();
    let port = if cfg.opencode2_port != 0 {
        cfg.opencode2_port
    } else {
        cfg.server_ports.first().copied().unwrap_or(4098)
    };
    let url = format!("http://127.0.0.1:{port}/api/session/{to_session}/prompt");
    let payload = serde_json::json!({
        "text": text,
        "delivery": delivery,
        "metadata": { "from": from, "kind": "agent", "via": "openher-team" },
    });
    let agent: ureq::Agent = ureq::builder()
        .timeout(std::time::Duration::from_secs(30))
        .redirects(0)
        .build();
    let mut ureq_req = agent.request("POST", &url);
    ureq_req = ureq_req.set("Content-Type", "application/json");
    if !cfg.server.username.is_empty() {
        let creds = format!("{}:{}", cfg.server.username, cfg.server.password);
        ureq_req = ureq_req.set("Authorization", &format!("Basic {}", crate::state::base64_encode(creds.as_bytes())));
    }
    let body_str = serde_json::to_string(&payload).unwrap_or_default();
    match ureq_req.send_string(&body_str) {
        Ok(resp) => {
            let status = resp.status();
            if !(200..300).contains(&status) {
                return Some(with_cors(ShellResponse::err_json(status, "El server rechazó el envío")));
            }
            Some(with_cors(ShellResponse::ok_json(&serde_json::json!({ "ok": true }))))
        }
        Err(ureq::Error::Status(code, resp)) => {
            let mut reader = resp.into_reader();
            let mut buf = Vec::new();
            let _ = std::io::Read::read_to_end(&mut reader, &mut buf);
            let short: String = String::from_utf8_lossy(&buf).chars().take(200).collect();
            Some(with_cors(ShellResponse::err_json(code, &format!("Server {code}: {short}"))))
        }
        Err(e) => Some(with_cors(ShellResponse::err_json(502, &format!("Sin server local: {e}")))),
    }
}
