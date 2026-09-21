//! Router /shell/team/* — relevo entre agentes de esta máquina.
//! Los agentes corren en el PC y llegan por loopback (sin auth propia); el
//! desktop reenvía al server opencode local con las credenciales que YA tiene
//! configuradas (las mismas de la app). Nada de esto sale del equipo.
//! - POST /shell/team/send {toSession, text, from, delivery?} → el mensaje
//!   entra al inbox de la sesión destino con metadata.from (el chat lo pinta
//!   de otro color con "de: <nombre>"). delivery: "queue" (default, no
//!   interrumpe) | "steer".

use std::sync::Arc;

use crate::infrastructure::http::common::config_clone;
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

/// Password del server gestionado (service.json de opencode). No se loguea
/// ni se expone: solo se usa para el Basic contra 127.0.0.1.
fn service_json_password() -> Option<String> {
    let mut cands: Vec<std::path::PathBuf> = Vec::new();
    if let Ok(xdg) = std::env::var("XDG_CONFIG_HOME") {
        cands.push(std::path::PathBuf::from(&xdg).join("opencode/service.json"));
    }
    if let Ok(home) = std::env::var("USERPROFILE").or_else(|_| std::env::var("HOME")) {
        cands.push(std::path::PathBuf::from(&home).join(".config/opencode/service.json"));
    }
    for p in cands {
        let Ok(txt) = std::fs::read_to_string(&p) else {
            continue;
        };
        let Ok(v) = serde_json::from_str::<serde_json::Value>(&txt) else {
            continue;
        };
        if let Some(pw) = v.get("password").and_then(|x| x.as_str()) {
            if !pw.trim().is_empty() {
                return Some(pw.trim().to_string());
            }
        }
    }
    None
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
    let cfg = config_clone(&state);
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
    let body_str = serde_json::to_string(&payload).unwrap_or_default();
    // Credenciales: las configuradas en el desktop; si no hay o el server las
    // rechaza, las de su service.json gestionado; si tampoco, intento sin auth
    // (server sin password). Nada de esto sale del equipo.
    let mut options: Vec<Option<String>> = Vec::new();
    if !cfg.server.username.is_empty() {
        options.push(Some(format!("{}:{}", cfg.server.username, cfg.server.password)));
    }
    if let Some(pw) = service_json_password() {
        options.push(Some(format!("opencode:{pw}")));
    }
    options.push(None);
    let mut last_status = 502u16;
    let mut last_msg = String::from("Sin server local");
    for opt in &options {
        let agent: ureq::Agent = ureq::builder()
            .timeout(std::time::Duration::from_secs(30))
            .redirects(0)
            .build();
        let mut ureq_req = agent.request("POST", &url);
        ureq_req = ureq_req.set("Content-Type", "application/json");
        if let Some(creds) = opt {
            ureq_req = ureq_req.set("Authorization", &format!("Basic {}", crate::state::base64_encode(creds.as_bytes())));
        }
        match ureq_req.send_string(&body_str) {
            Ok(resp) => {
                let status = resp.status();
                if (200..300).contains(&status) {
                    return Some(with_cors(ShellResponse::ok_json(&serde_json::json!({ "ok": true }))));
                }
                last_status = status;
                last_msg = String::from("El server rechazó el envío");
            }
            Err(ureq::Error::Status(code, resp)) => {
                if code == 401 {
                    continue; // probar siguiente credencial
                }
                let buf = crate::infrastructure::http::common::read_ureq_body(resp);
                let short: String = String::from_utf8_lossy(&buf).chars().take(200).collect();
                return Some(with_cors(ShellResponse::err_json(code, &format!("Server {code}: {short}"))));
            }
            Err(e) => {
                last_status = 502;
                last_msg = format!("Sin server local: {e}");
                break;
            }
        }
    }
    Some(with_cors(ShellResponse::err_json(last_status, &last_msg)))
}
