//! Router de la API /shell/* + estáticos de la web app (mismo origen).

use std::io::Read;
use std::path::Path;
use std::sync::Arc;

use tiny_http::{Header, Method, Request, Response, StatusCode};

use crate::state::{json_err, json_ok, read_body, AppState};

fn cors_headers() -> Vec<Header> {
    vec![
        Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap(),
        Header::from_bytes("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD").unwrap(),
        Header::from_bytes("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept").unwrap(),
        Header::from_bytes("Access-Control-Expose-Headers", "Content-Length, Content-Type, Content-Disposition, Authorization").unwrap(),
        Header::from_bytes("Access-Control-Max-Age", "86400").unwrap(),
    ]
}

fn is_loopback_host(req: &Request) -> bool {
    for h in req.headers() {
        if h.field.as_str().to_ascii_lowercase() == "host" {
            let v = h.value.as_str().to_ascii_lowercase();
            let host = v.split(':').next().unwrap_or(&v);
            return host == "127.0.0.1" || host == "localhost" || host == "::1" || host == "[::1]";
        }
    }
    true
}

fn check_shell_auth(req: &Request, state: &AppState) -> Option<Response<std::io::Cursor<Vec<u8>>>> {
    if is_loopback_host(req) {
        return None;
    }
    let cfg = state.config.read().unwrap_or_else(|e| e.into_inner()).clone();
    if cfg.server.username.is_empty() && cfg.server.password.is_empty() {
        return None;
    }
    let expected = format!("Basic {}", crate::state::base64_encode(format!("{}:{}", cfg.server.username, cfg.server.password).as_bytes()));
    let got = req.headers().iter().find(|h| h.field.as_str().to_ascii_lowercase() == "authorization").map(|h| h.value.as_str().to_string()).unwrap_or_default();
    if got == expected {
        return None;
    }
    let mut r = Response::from_string(serde_json::json!({ "error": "unauthorized" }).to_string())
        .with_status_code(StatusCode(401))
        .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
        .with_header(Header::from_bytes("WWW-Authenticate", "Basic realm=\"opencode-desktop\"").unwrap());
    for h in cors_headers() {
        r = r.with_header(h);
    }
    Some(r)
}

pub fn route(mut req: Request, state: Arc<AppState>) {
    let url = req.url().to_string();
    let method = req.method().clone();
    let path = url.split('?').next().unwrap_or(&url).to_string();
    let query = url.split('?').nth(1).unwrap_or("").to_string();
    let q = |k: &str| {
        query
            .split('&')
            .find(|p| p.starts_with(&format!("{k}=")))
            .map(|p| p.split('=').nth(1).unwrap_or("").to_string())
            .map(|v| url_decode(&v))
            .unwrap_or_default()
    };

    if method == Method::Options {
        let origin = req.headers().iter().find(|h| h.field.as_str().to_ascii_lowercase() == "origin").map(|h| h.value.as_str().to_string()).unwrap_or_else(|| "*".to_string());
        let req_headers = req.headers().iter().find(|h| h.field.as_str().to_ascii_lowercase() == "access-control-request-headers").map(|h| h.value.as_str().to_string()).unwrap_or_else(|| "Content-Type, Authorization, X-Requested-With".to_string());
        let _ = req.respond(
            Response::from_string("")
                .with_status_code(StatusCode(204))
                .with_header(Header::from_bytes("Access-Control-Allow-Origin", origin.as_bytes()).unwrap())
                .with_header(Header::from_bytes("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD").unwrap())
                .with_header(Header::from_bytes("Access-Control-Allow-Headers", req_headers.as_bytes()).unwrap())
                .with_header(Header::from_bytes("Access-Control-Max-Age", "86400").unwrap()),
        );
        return;
    }

    if path.starts_with("/shell/") {
        if let Some(resp) = check_shell_auth(&req, &state) {
            let _ = req.respond(resp);
            return;
        }
    }

    if path == "/shell/health" {
        let body = serde_json::json!({
            "ok": true,
            "app": "opencode-desktop",
            "version": env!("CARGO_PKG_VERSION"),
            "dist": state.dist.is_some(),
            "ws_port": state.port + 1,
        });
        let _ = req.respond(json_ok(&body));
        return;
    }

    // ============================== Source control (git)
    if path.starts_with("/shell/git/") {
        if let Some(resp) =
            crate::infrastructure::http::scm_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
    }

    // ============================== Proyectos externos on-demand (plugins)
    if path.starts_with("/shell/external") {
        if let Some(resp) =
            crate::infrastructure::http::external_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
    }

    // ============================== Config
    if path == "/shell/config" && method == Method::Get {
        let cfg = state.config.read().unwrap_or_else(|e| e.into_inner()).clone();
        let _ = req.respond(json_ok(&serde_json::to_value(cfg).unwrap_or_default()));
        return;
    }
    if path == "/shell/config" && method == Method::Post {
        match read_body(&mut req) {
            Ok(patch) => {
                let mut cfg = state.config.read().unwrap_or_else(|e| e.into_inner()).clone();
                merge_config(&mut cfg, &patch);
                crate::state::save_config(&cfg);
                *state.config.write().unwrap_or_else(|e| e.into_inner()) = cfg.clone();
                let _ = req.respond(json_ok(&serde_json::json!({ "ok": true, "config": cfg })));
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }
    if path == "/shell/config/export" {
        let cfg = state.config.read().unwrap_or_else(|e| e.into_inner()).clone();
        let _ = req.respond(json_ok(&serde_json::json!({ "config": cfg })));
        return;
    }
    if path == "/shell/config/import" && method == Method::Post {
        match read_body(&mut req) {
            Ok(body) => {
                if let Some(cfg) = body.get("config") {
                    if let Ok(cfg) = serde_json::from_value::<crate::state::ShellConfig>(cfg.clone()) {
                        crate::state::save_config(&cfg);
                        *state.config.write().unwrap_or_else(|e| e.into_inner()) = cfg.clone();
                        let _ = req.respond(json_ok(&serde_json::json!({ "ok": true })));
                        return;
                    }
                }
                let _ = req.respond(json_err(400, "config inválida"));
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }

    // ============================== Autostart
    if path == "/shell/autostart" && method == Method::Get {
        let _ = req.respond(json_ok(&serde_json::json!({ "enabled": crate::state::autostart_enabled() })));
        return;
    }
    if path == "/shell/autostart" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let enabled = b["enabled"].as_bool().unwrap_or(false);
                match crate::state::set_autostart(enabled) {
                    Ok(()) => {
                        let _ = req.respond(json_ok(&serde_json::json!({ "ok": true, "enabled": enabled })));
                    }
                    Err(e) => {
                        let _ = req.respond(json_err(500, &e));
                    }
                }
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }

    // ============================== Sesiones (estado persistido)
    if path == "/shell/session-state" && method == Method::Get {
        let s = state.persisted.read().unwrap_or_else(|e| e.into_inner()).clone();
        let _ = req.respond(json_ok(&serde_json::to_value(s).unwrap_or_default()));
        return;
    }
    if path == "/shell/session-state" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let mut s = state.persisted.write().unwrap_or_else(|e| e.into_inner());
                if let Some(w) = b["window_w"].as_f64() {
                    s.window_w = Some(w);
                }
                if let Some(h) = b["window_h"].as_f64() {
                    s.window_h = Some(h);
                }
                if let Some(p) = b["last_panels"].as_array() {
                    s.last_panels = p.clone();
                }
                crate::state::save_persisted(&s);
                let _ = req.respond(json_ok(&serde_json::json!({ "ok": true })));
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }

    // ============================== File explorer
    if path.starts_with("/shell/fs") {
        if let Some(resp) =
            crate::infrastructure::http::fs_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
    }

    // ============================== Conversor y Editor de Documentos (Rust ultra-ligero)
    if path == "/shell/doc/convert" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let src = b["src"].as_str().unwrap_or("");
                let target = b["target"].as_str().unwrap_or("md");
                let dest = b["dest"].as_str();
                match crate::doc_engine::convert_file(src, target, dest) {
                    Ok(val) => {
                        let _ = req.respond(json_ok(&val));
                    }
                    Err(e) => {
                        let _ = req.respond(json_err(500, &e));
                    }
                }
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }
    if path == "/shell/doc/save" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let path_str = b["path"].as_str().unwrap_or("");
                let md_content = b["content"].as_str().unwrap_or("");
                let format = b["format"].as_str().unwrap_or("md").to_lowercase();
                let p = Path::new(path_str);
                let res: Result<(), String> = match format.as_str() {
                    "docx" => match crate::doc_engine::md_to_docx(md_content) {
                        Ok(bytes) => std::fs::write(p, bytes).map_err(|e| e.to_string()),
                        Err(e) => Err(e),
                    },
                    "pdf" => match crate::doc_engine::md_to_pdf(md_content) {
                        Ok(bytes) => std::fs::write(p, bytes).map_err(|e| e.to_string()),
                        Err(e) => Err(e),
                    },
                    _ => std::fs::write(p, md_content.as_bytes()).map_err(|e| e.to_string()),
                };
                match res {
                    Ok(_) => {
                        let _ = req.respond(json_ok(&serde_json::json!({ "ok": true, "path": path_str })));
                    }
                    Err(e) => {
                        let _ = req.respond(json_err(500, &e));
                    }
                }
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }

    // ============================== Terminales (pty)
    if path == "/shell/pty" && method == Method::Get {
        let _ = req.respond(json_ok(&serde_json::json!({ "terms": state.pty.list() })));
        return;
    }
    if path == "/shell/pty" && method == Method::Post {
        let shell = q("shell");
        let cwd = q("cwd");
        let cfg_shell = {
            let s = state.config.read().unwrap_or_else(|e| e.into_inner()).shell.clone();
            if s.is_empty() { None } else { Some(s) }
        };
        let shell_param = if shell.is_empty() { cfg_shell } else { Some(shell) };
        match state.pty.create(shell_param, if cwd.is_empty() { None } else { Some(cwd) }) {
            Ok(id) => {
                let _ = req.respond(json_ok(&serde_json::json!({ "id": id, "ws_port": state.port + 1 })));
            }
            Err(e) => {
                let _ = req.respond(json_err(500, &e));
            }
        }
        return;
    }
    if let Some(rest) = path.strip_prefix("/shell/pty/") {
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
                    // Si el cliente pide datos antes del base (buffer rotó),
                    // devolver todo el buffer disponible.
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
            let _ = req.respond(json_ok(&info));
            return;
        }
        if op == "write" && method == Method::Post {
            match read_body(&mut req) {
                Ok(b) => {
                    let data = b["data"].as_str().unwrap_or("");
                    match state.pty.write(&id, data.as_bytes()) {
                        Ok(()) => {
                            let _ = req.respond(json_ok(&serde_json::json!({ "ok": true })));
                        }
                        Err(e) => {
                            let _ = req.respond(json_err(404, &e));
                        }
                    }
                }
                Err(e) => {
                    let _ = req.respond(json_err(400, &e));
                }
            }
            return;
        }
        if op == "resize" && method == Method::Post {
            match read_body(&mut req) {
                Ok(b) => {
                    let cols = b["cols"].as_u64().unwrap_or(100) as u16;
                    let rows = b["rows"].as_u64().unwrap_or(30) as u16;
                    let pw = b["pixel_width"].as_u64().unwrap_or(b["pixelWidth"].as_u64().unwrap_or(0)) as u16;
                    let ph = b["pixel_height"].as_u64().unwrap_or(b["pixelHeight"].as_u64().unwrap_or(0)) as u16;
                    match state.pty.resize_px(&id, cols, rows, pw, ph) {
                        Ok(()) => {
                            let _ = req.respond(json_ok(&serde_json::json!({ "ok": true })));
                        }
                        Err(e) => {
                            let _ = req.respond(json_err(404, &e));
                        }
                    }
                }
                Err(e) => {
                    let _ = req.respond(json_err(400, &e));
                }
            }
            return;
        }
        if op.is_empty() && method == Method::Delete {
            state.pty.kill(&id);
            let _ = req.respond(json_ok(&serde_json::json!({ "ok": true })));
            return;
        }
    }

    // ============================== Kanban
    if path == "/shell/kanban" && method == Method::Get {
        let _ = req.respond(json_ok(&state.kanban.all()));
        return;
    }
    if path == "/shell/kanban/board" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let name = b["name"].as_str().unwrap_or("Nuevo board");
                match state.kanban.add_board(name) {
                    Ok(v) => {
                        let _ = req.respond(json_ok(&serde_json::json!({ "ok": true, "board": v })));
                    }
                    Err(e) => {
                        let _ = req.respond(json_err(500, &e));
                    }
                }
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }
    if path == "/shell/kanban/board" && method == Method::Delete {
        let id = q("id");
        match state.kanban.delete_board(&id) {
            Ok(()) => {
                let _ = req.respond(json_ok(&serde_json::json!({ "ok": true })));
            }
            Err(e) => {
                let _ = req.respond(json_err(404, &e));
            }
        }
        return;
    }
    if path == "/shell/kanban/card" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let board = b["board"].as_str().unwrap_or("");
                let column = b["column"].as_str().unwrap_or("todo");
                let title = b["title"].as_str().unwrap_or("");
                let notes = b["notes"].as_str().unwrap_or("");
                let color = b["color"].as_str().unwrap_or("#fab283");
                match state.kanban.add_card(board, column, title, notes, color) {
                    Ok(v) => {
                        let _ = req.respond(json_ok(&serde_json::json!({ "ok": true, "card": v })));
                    }
                    Err(e) => {
                        let _ = req.respond(json_err(500, &e));
                    }
                }
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }
    if path == "/shell/kanban/card" && method == Method::Patch {
        match read_body(&mut req) {
            Ok(b) => {
                let id = b["id"].as_str().unwrap_or("");
                match state.kanban.update_card(id, &b) {
                    Ok(()) => {
                        let _ = req.respond(json_ok(&serde_json::json!({ "ok": true })));
                    }
                    Err(e) => {
                        let _ = req.respond(json_err(404, &e));
                    }
                }
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }
    if path == "/shell/kanban/card" && method == Method::Delete {
        let id = q("id");
        match state.kanban.delete_card(&id) {
            Ok(()) => {
                let _ = req.respond(json_ok(&serde_json::json!({ "ok": true })));
            }
            Err(e) => {
                let _ = req.respond(json_err(404, &e));
            }
        }
        return;
    }

    // ============================== Server manager
    if path == "/shell/server" && method == Method::Get {
        let ports = state.config.read().unwrap_or_else(|e| e.into_inner()).server_ports.clone();
        let _ = req.respond(json_ok(&state.servers.status(&ports)));
        return;
    }
    if path == "/shell/server/start" && method == Method::Post {
        let cmd = state.config.read().unwrap_or_else(|e| e.into_inner()).start_command.clone();
        match state.servers.start(&cmd) {
            Ok(v) => {
                let _ = req.respond(json_ok(&v));
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }
    if path == "/shell/server/stop" && method == Method::Post {
        match state.servers.stop() {
            Ok(v) => {
                let _ = req.respond(json_ok(&v));
            }
            Err(e) => {
                let _ = req.respond(json_err(500, &e));
            }
        }
        return;
    }

    // ============================== Updates (GitHub + X)
    if path == "/shell/updates" {
        let force = q("refresh") == "1";
        let _ = req.respond(json_ok(&crate::updates::build(&state, force)));
        return;
    }

    // ============================== Docs
    if path == "/shell/docs" {
        let _ = req.respond(json_ok(&crate::docsx::list(&state)));
        return;
    }
    if path == "/shell/docs/read" {
        let rel = q("path");
        match crate::docsx::read(&state, &rel) {
            Ok(v) => {
                let _ = req.respond(json_ok(&v));
            }
            Err(e) => {
                let _ = req.respond(json_err(404, &e));
            }
        }
        return;
    }

    // ============================== Stats
    if path == "/shell/stats" {
        let _ = req.respond(json_ok(&state.stats.status()));
        return;
    }
    if path == "/shell/stats/start" && method == Method::Post {
        crate::statsx::ensure(&state);
        let _ = req.respond(json_ok(&state.stats.status()));
        return;
    }
    // Proxy a opencode-stats: /shell/stats/proxy/* → http://127.0.0.1:8765/api/*?{query}
    // Local, rápido, mismo origen (sin CORS). Reenvía query string tal cual.
    if let Some(rest) = path.strip_prefix("/shell/stats/proxy/") {
        let qs = if query.is_empty() { String::new() } else { format!("?{query}") };
        let stats_url = format!("http://127.0.0.1:8765/api/{rest}{qs}");
        // Timeout 15s — el primer scope completo puede tardar por el scan de opencode.db
        let agent = ureq::builder().timeout(std::time::Duration::from_secs(15)).build();
        match agent.get(&stats_url).call() {
            Ok(resp) => {
                let mut body = Vec::new();
                resp.into_reader().read_to_end(&mut body).unwrap_or_default();
                let ct = "application/json";
                let _ = req.respond(
                    Response::from_string(String::from_utf8_lossy(&body).to_string())
                        .with_header(Header::from_bytes("Content-Type", ct).unwrap())
                        .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap())
                        .with_header(Header::from_bytes("Cache-Control", "no-store").unwrap()),
                );
            }
            Err(ureq::Error::Status(code, resp)) => {
                let mut body = Vec::new();
                resp.into_reader().read_to_end(&mut body).unwrap_or_default();
                let msg = String::from_utf8_lossy(&body).to_string();
                let body_json = if msg.is_empty() { format!("stats HTTP {code}") } else { msg };
                let _ = req.respond(json_err(code, &body_json));
            }
            Err(_) => {
                let _ = req.respond(json_err(502, "stats server unavailable"));
            }
        }
        return;
    }
    // ============================== Open Design (od-web) — estado + abrir externo
    if path == "/shell/design/status" {
        // Probar puertos típicos de od-web (tools-dev por defecto usa 3000)
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
        if let Some(url) = found {
            let _ = req.respond(json_ok(&serde_json::json!({ "running": true, "url": url })));
        } else {
            let _ = req.respond(json_ok(&serde_json::json!({ "running": false, "url": "http://localhost:3000" })));
        }
        return;
    }
    if path == "/shell/design/open" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let url = b["url"].as_str().unwrap_or("http://localhost:3000").to_string();
                // Validar esquema
                if !url.starts_with("http://") && !url.starts_with("https://") {
                    let _ = req.respond(json_err(400, "URL debe ser http(s)"));
                    return;
                }
                let url_c = url.clone();
                // Abrir en navegador por defecto (Windows)
                let _ = std::process::Command::new("cmd")
                    .args(["/c", "start", "", &url_c])
                    .spawn();
                let _ = req.respond(json_ok(&serde_json::json!({ "ok": true, "url": url })));
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }

    // ============================== Plugins + Labs
    if path == "/shell/plugins" {
        state.plugins.scan();
        let _ = req.respond(json_ok(&state.plugins.list()));
        return;
    }
    if path == "/shell/plugins/reload" && method == Method::Post {
        let scanned = state.plugins.scan();
        let _ = req.respond(json_ok(&serde_json::json!({ "ok": true, "plugins": scanned })));
        return;
    }
    if path == "/shell/plugins/toggle" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let name = b["name"].as_str().unwrap_or("");
                let enabled = b["enabled"].as_bool().unwrap_or(true);
                let updated = state.plugins.toggle(name, enabled);
                let _ = req.respond(json_ok(&serde_json::json!({ "ok": updated })));
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }
    if path == "/shell/plugins/running" {
        let _ = req.respond(json_ok(&state.plugins.running()));
        return;
    }
    if path == "/shell/plugins/run" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let name = b["name"].as_str().unwrap_or("");
                match state.plugins.run_command(name) {
                    Ok(v) => {
                        let _ = req.respond(json_ok(&v));
                    }
                    Err(e) => {
                        let _ = req.respond(json_err(500, &e));
                    }
                }
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }
    if let Some(rest) = path.strip_prefix("/shell/plugin/") {
        if let Some((name, rel)) = rest.split_once('/') {
            if let Some((bytes, mime)) = state.plugins.serve_web(name, rel) {
                let _ = req.respond(
                    Response::from_data(bytes)
                        .with_status_code(StatusCode(200))
                        .with_header(Header::from_bytes("Content-Type", mime.as_str()).unwrap()),
                );
                return;
            }
        }
        let _ = req.respond(json_err(404, "plugin no encontrado"));
        return;
    }

    // ============================== Project Auto-Serve / Preview
    if path == "/shell/project/serve" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let p_str = b["path"].as_str().unwrap_or("");
                let p = std::path::PathBuf::from(p_str);
                let dir = if p.is_file() {
                    p.parent().unwrap_or(std::path::Path::new(".")).to_path_buf()
                } else {
                    p.clone()
                };

                if !dir.exists() || !dir.is_dir() {
                    let _ = req.respond(json_err(400, "El directorio no existe"));
                    return;
                }

                // Generar token único / estable
                let token = format!("p{:x}", dir.to_string_lossy().as_bytes().iter().fold(0u64, |acc: u64, &b| acc.wrapping_mul(31).wrapping_add(b as u64)));
                state.projects.write().unwrap_or_else(|e| e.into_inner()).insert(token.clone(), dir.clone());
                // Registrar watcher kernel para invalidación live (ReadDirectoryChangesW/USN)
                crate::fswatch::global().watch_dir(&dir);

                // Escanear archivos html
                let mut html_files = Vec::new();
                let mut entrypoint = String::new();
                if let Ok(entries) = std::fs::read_dir(&dir) {
                    for entry in entries.flatten() {
                        let name = entry.file_name().to_string_lossy().to_string();
                        if name.ends_with(".html") || name.ends_with(".htm") {
                            html_files.push(name.clone());
                            if name == "index.html" || name == "index.htm" {
                                entrypoint = name.clone();
                            }
                        }
                    }
                }

                // Si no se encontró index.html en raíz, buscar en subdirectorios típicos (dist, build, public, src)
                if entrypoint.is_empty() {
                    for sub in &["dist", "build", "public", "src"] {
                        let sub_path = dir.join(sub);
                        if sub_path.is_dir() {
                            if let Ok(entries) = std::fs::read_dir(&sub_path) {
                                for entry in entries.flatten() {
                                    let name = entry.file_name().to_string_lossy().to_string();
                                    if name.ends_with(".html") || name.ends_with(".htm") {
                                        let rel = format!("{}/{}", sub, name);
                                        html_files.push(rel.clone());
                                        if entrypoint.is_empty() {
                                            entrypoint = rel;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                if entrypoint.is_empty() && !html_files.is_empty() {
                    entrypoint = html_files[0].clone();
                }

                // Si p era un archivo específico html, usar ese
                if p.is_file() {
                    let file_name = p.file_name().unwrap_or_default().to_string_lossy().to_string();
                    if file_name.ends_with(".html") || file_name.ends_with(".htm") {
                        entrypoint = file_name;
                    }
                }

                // Revisar package.json
                let pkg_path = dir.join("package.json");
                let mut has_package_json = false;
                let mut scripts = serde_json::Map::new();
                if pkg_path.is_file() {
                    if let Ok(content) = std::fs::read_to_string(&pkg_path) {
                        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                            has_package_json = true;
                            if let Some(sc) = json.get("scripts").and_then(|s| s.as_object()) {
                                scripts = sc.clone();
                            }
                        }
                    }
                }

                let preview_url = if !entrypoint.is_empty() {
                    format!("http://127.0.0.1:{}/shell/preview/{}/{}", state.port, token, entrypoint)
                } else {
                    format!("http://127.0.0.1:{}/shell/preview/{}/index.html", state.port, token)
                };

                let _ = req.respond(json_ok(&serde_json::json!({
                    "ok": true,
                    "token": token,
                    "previewUrl": preview_url,
                    "directory": dir.to_string_lossy(),
                    "entrypoint": entrypoint,
                    "htmlFiles": html_files,
                    "hasPackageJson": has_package_json,
                    "scripts": scripts,
                })));
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }

    if let Some(rest) = path.strip_prefix("/shell/preview/") {
        let (token, rel) = rest.split_once('/').unwrap_or((rest, "index.html"));
        let rel = if rel.is_empty() { "index.html" } else { rel };
        let root = state.projects.read().unwrap_or_else(|e| e.into_inner()).get(token).cloned();
        if let Some(root_path) = root {
            let served = crate::common::serve_file_mmap(&root_path, rel)
                .or_else(|| crate::common::serve_file_mmap(&root_path.join("dist"), rel))
                .or_else(|| crate::common::serve_file_mmap(&root_path.join("public"), rel))
                .or_else(|| crate::common::serve_file_mmap(&root_path.join("build"), rel))
                .or_else(|| crate::common::serve_file_mmap(&root_path.join("web").join("dist"), rel))
                .or_else(|| crate::common::serve_file_mmap(&root_path.join("web"), rel));

            if let Some((mut bytes, mime)) = served {
                if mime.starts_with("text/html") {
                    if let Ok(html_str) = String::from_utf8(bytes.clone()) {
                        let base_tag = format!("<base href=\"/shell/preview/{}/\" />", token);
                        let modified = if html_str.contains("<head>") {
                            html_str.replacen("<head>", &format!("<head>\n  {}", base_tag), 1)
                        } else if html_str.contains("<HEAD>") {
                            html_str.replacen("<HEAD>", &format!("<HEAD>\n  {}", base_tag), 1)
                        } else {
                            format!("{}\n{}", base_tag, html_str)
                        };
                        bytes = modified.into_bytes();
                    }
                }
                let _ = req.respond(
                    Response::from_data(bytes)
                        .with_status_code(StatusCode(200))
                        .with_header(Header::from_bytes("Content-Type", mime).unwrap())
                        .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap())
                        .with_header(Header::from_bytes("Cache-Control", "no-cache").unwrap()),
                );
                return;
            }
        }
        let _ = req.respond(json_err(404, "Archivo de proyecto no encontrado"));
        return;
    }
    if path == "/shell/opencode/global" && method == Method::Get {
        // mecanismo robusto: resuelve HOME desde múltiples envs y APPDATA en Windows
        let home = std::env::var("USERPROFILE")
            .or_else(|_| std::env::var("HOME"))
            .or_else(|_| std::env::var("HOMEPATH").map(|hp| format!("{}{}", std::env::var("HOMEDRIVE").unwrap_or_default(), hp)))
            .or_else(|_| std::env::var("APPDATA").map(|a| std::path::PathBuf::from(&a).parent().and_then(|p| p.parent()).map(|p| p.to_string_lossy().to_string()).unwrap_or(a)))
            .unwrap_or_default();
        let home_path = std::path::PathBuf::from(&home);
        let appdata_path = std::env::var("APPDATA").ok().map(std::path::PathBuf::from);

        let mut candidate_configs = vec![
            home_path.join(".config").join("opencode").join("opencode.json"),
            home_path.join(".opencode").join("config.json"),
            home_path.join(".config").join("opencode3").join("opencode.json"),
            home_path.join(".config").join("opencode").join("config.json"),
            home_path.join(".opencode").join("opencode.json"),
            home_path.join("AppData").join("Roaming").join("opencode").join("config.json"),
            std::path::PathBuf::from("opencode.json"),
        ];
        if let Some(appdata) = &appdata_path {
            let p = appdata.join("opencode").join("config.json");
            if !candidate_configs.iter().any(|c| c == &p) { candidate_configs.insert(0, p); }
            let p2 = appdata.join("opencode").join("opencode.json");
            if !candidate_configs.iter().any(|c| c == &p2) { candidate_configs.insert(1, p2); }
        }

        let mut config_files = Vec::new();
        let mut config_path_found = String::new();
        let mut config_content = String::new();
        let mut config_json = serde_json::Value::Null;

        for p in &candidate_configs {
            if p.is_file() {
                if let Ok(c) = std::fs::read_to_string(p) {
                    if config_path_found.is_empty() {
                        config_path_found = p.to_string_lossy().to_string();
                        config_content = c.clone();
                        config_json = serde_json::from_str(&c).unwrap_or(serde_json::Value::Null);
                    }
                    config_files.push(serde_json::json!({
                        "path": p.to_string_lossy().to_string(),
                        "name": format!("{} ({})", p.file_name().unwrap_or_default().to_string_lossy(), p.parent().and_then(|pr| pr.file_name()).unwrap_or_default().to_string_lossy()),
                        "content": c,
                    }));
                }
            }
        }

        if config_path_found.is_empty() {
            let def_p = &candidate_configs[0];
            config_path_found = def_p.to_string_lossy().to_string();
            config_content = "{\n  \"$schema\": \"https://opencode.ai/schema.json\",\n  \"providers\": {}\n}".to_string();
            config_json = serde_json::from_str(&config_content).unwrap_or(serde_json::Value::Null);
            config_files.push(serde_json::json!({
                "path": config_path_found.clone(),
                "name": "opencode.json (nuevo)",
                "content": config_content.clone(),
            }));
        }

        let candidate_instructions = vec![
            std::path::PathBuf::from("AGENTS.md"),
            home_path.join(".config").join("opencode").join("AGENTS.md"),
            home_path.join(".opencode").join("AGENTS.md"),
        ];
        let mut instructions_files = Vec::new();
        for p in &candidate_instructions {
            if p.is_file() {
                if let Ok(c) = std::fs::read_to_string(p) {
                    instructions_files.push(serde_json::json!({
                        "path": p.to_string_lossy().to_string(),
                        "name": p.file_name().unwrap_or_default().to_string_lossy().to_string(),
                        "content": c,
                    }));
                }
            }
        }

        let mut candidate_skill_roots = vec![
            home_path.join(".agents").join("skills"),
            home_path.join(".claude").join("skills"),
            home_path.join(".opencode").join("skills"),
            home_path.join(".gemini").join("config").join("skills"),
            home_path.join(".gemini").join("antigravity").join("builtin").join("skills"),
            home_path.join(".config").join("skills"),
            std::path::PathBuf::from("skills"),
        ];
        if let Some(appdata) = &appdata_path {
            candidate_skill_roots.push(appdata.join("opencode").join("skills"));
        }

        let mut skills = Vec::new();
        let mut scanned_roots: Vec<String> = Vec::new();

        for root in candidate_skill_roots {
            // deja la ruta visible siempre (gris suave en frontend), aunque no exista
            let root_str = root.to_string_lossy().to_string();
            if !scanned_roots.contains(&root_str) {
                scanned_roots.push(root_str.clone());
            }
            if root.is_dir() {
                if let Ok(entries) = std::fs::read_dir(&root) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.is_dir() {
                            let skill_name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                            let skill_md_path = path.join("SKILL.md");
                            let mut description = String::new();
                            if skill_md_path.is_file() {
                                if let Ok(content) = std::fs::read_to_string(&skill_md_path) {
                                    let lines: Vec<&str> = content.lines().collect();
                                    let mut in_frontmatter = false;
                                    for line in lines.iter().take(40) {
                                        let trimmed = line.trim();
                                        if trimmed == "---" {
                                            in_frontmatter = !in_frontmatter;
                                            continue;
                                        }
                                        if in_frontmatter {
                                            if let Some(desc) = trimmed.strip_prefix("description:") {
                                                description = desc.trim().trim_matches('"').trim_matches('\'').to_string();
                                            }
                                        } else if description.is_empty() && trimmed.starts_with("# ") {
                                            description = trimmed.strip_prefix("# ").unwrap_or("").trim().to_string();
                                        }
                                    }
                                }
                            }
                            skills.push(serde_json::json!({
                                "name": skill_name,
                                "description": if description.is_empty() { format!("Skill {}", skill_name) } else { description },
                                "path": path.to_string_lossy().to_string(),
                                "skillFile": skill_md_path.to_string_lossy().to_string(),
                                "source": root.file_name().unwrap_or_default().to_string_lossy().to_string(),
                            }));
                        }
                    }
                }
            }
        }

        let _ = req.respond(json_ok(&serde_json::json!({
            "configPath": config_path_found,
            "configContent": config_content,
            "configJson": config_json,
            "configFiles": config_files,
            "instructionsFiles": instructions_files,
            "skills": skills,
            "scannedRoots": scanned_roots,
        })));
        return;
    }

    if path == "/shell/opencode/global" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let config_path = b["configPath"].as_str().or_else(|| b["path"].as_str()).unwrap_or("");
                let content = b["content"].as_str().unwrap_or("");
                if config_path.is_empty() || content.is_empty() {
                    let _ = req.respond(json_err(400, "Ruta o contenido inválido"));
                    return;
                }
                let p = std::path::PathBuf::from(config_path);
                if let Some(parent) = p.parent() {
                    let _ = std::fs::create_dir_all(parent);
                }
                match std::fs::write(&p, content) {
                    Ok(_) => {
                        let _ = req.respond(json_ok(&serde_json::json!({ "ok": true })));
                    }
                    Err(e) => {
                        let _ = req.respond(json_err(500, &format!("Error al escribir archivo: {}", e)));
                    }
                }
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }

    if path == "/shell/labs" {
        let _ = req.respond(json_ok(&crate::plugins::labs_list(&state)));
        return;
    }
    if path == "/shell/labs/start" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let id = b["id"].as_str().unwrap_or("");
                match crate::plugins::labs_start(&state, id) {                    Ok(v) => {
                        let _ = req.respond(json_ok(&v));
                    }
                    Err(e) => {
                        let _ = req.respond(json_err(500, &e));
                    }
                }
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }

    // ============================== QuickChat web search (DDG lite, token-min)
    if path == "/shell/search" {
        let query = q("q");
        if query.trim().is_empty() {
            let _ = req.respond(json_err(400, "Falta parámetro q"));
            return;
        }
        let query_trim = query.trim().to_string();
        // File cache: data/cache/search/<hash>.json, TTL 6h
        let cache_root = crate::state::cache_dir().join("search");
        let _ = std::fs::create_dir_all(&cache_root);
        let hash = {
            let mut h: u64 = 14695981039346656037;
            for b in query_trim.to_lowercase().as_bytes() {
                h ^= *b as u64;
                h = h.wrapping_mul(1099511628211);
            }
            format!("{:016x}", h)
        };
        let cache_file = cache_root.join(format!("{hash}.json"));
        let ttl_secs = 6 * 3600u64;
        if let Ok(meta) = std::fs::metadata(&cache_file) {
            if let Ok(modified) = meta.modified() {
                if let Ok(elapsed) = modified.elapsed() {
                    if elapsed.as_secs() < ttl_secs {
                        if let Ok(raw) = std::fs::read_to_string(&cache_file) {
                            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&raw) {
                                let mut out = v.clone();
                                if let Some(obj) = out.as_object_mut() { obj.insert("cached".into(), serde_json::json!(true)); }
                                let _ = req.respond(json_ok(&out));
                                return;
                            }
                        }
                    }
                }
            }
        }
        // Fetch DuckDuckGo lite (least JS, easy parse, token-min top3)
        let ddg_url = format!("https://lite.duckduckgo.com/lite/?q={}", url_encode(&query_trim));
        let client = ureq::builder().timeout(std::time::Duration::from_secs(8)).redirects(3).build();
        let body = match client.get(&ddg_url).set("User-Agent", "Mozilla/5.0").call() {
            Ok(resp) => {
                let mut buf = Vec::new();
                resp.into_reader().read_to_end(&mut buf).unwrap_or_default();
                String::from_utf8_lossy(&buf).to_string()
            }
            Err(_) => {
                // fallback: html.duckduckgo.com
                let fallback = format!("https://html.duckduckgo.com/html/?q={}", url_encode(&query_trim));
                match ureq::builder().timeout(std::time::Duration::from_secs(8)).build().get(&fallback).set("User-Agent", "Mozilla/5.0").call() {
                    Ok(resp) => {
                        let mut buf = Vec::new();
                        resp.into_reader().read_to_end(&mut buf).unwrap_or_default();
                        String::from_utf8_lossy(&buf).to_string()
                    }
                    Err(e) => {
                        let _ = req.respond(json_err(502, &format!("search fetch failed: {e}")));
                        return;
                    }
                }
            }
        };
        let mut results: Vec<serde_json::Value> = Vec::new();
        // Very light parser: split on anchor blocks
        for part in body.split("<a rel=\"nofollow\"").skip(1) {
            if results.len() >= 3 { break; }
            let href_start = part.find("href=\"").map(|i| i + 6).unwrap_or(0);
            let href_end = part[href_start..].find('"').map(|i| href_start + i).unwrap_or(href_start);
            let href = &part[href_start..href_end];
            // title is between > and </a> after href
            let title_start_rel = part[href_end..].find('>').map(|i| href_end + i + 1).unwrap_or(href_end);
            let title_end_rel = part[title_start_rel..].find("</a>").map(|i| title_start_rel + i).unwrap_or(title_start_rel);
            let title_raw = &part[title_start_rel..title_end_rel];
            let title = strip_html(title_raw).trim().to_string();
            if title.is_empty() || href.is_empty() || href.starts_with('#') { continue; }
            // snippet: next td with result-snippet
            let snip = if let Some(idx) = part.find("result-snippet") {
                let s = &part[idx..];
                let gt = s.find('>').map(|i| i + 1).unwrap_or(0);
                let lt = s[gt..].find('<').map(|i| gt + i).unwrap_or(gt + 120);
                strip_html(&s[gt..lt]).trim().chars().take(240).collect::<String>()
            } else {
                String::new()
            };
            let url_decoded = url_decode(href);
            // DDG wraps url as //duckduckgo.com/l/?uddg=ENCODED — extract uddg if present
            let final_url = if let Some(uddg_idx) = url_decoded.find("uddg=") {
                url_decode(&url_decode(&url_decoded[uddg_idx + 5..].split('&').next().unwrap_or(&url_decoded)))
            } else if href.starts_with("//") { format!("https:{href}") } else if href.starts_with('/') { href.to_string() } else { url_decoded };
            results.push(serde_json::json!({"title": title, "url": final_url, "snippet": snip}));
        }
        // fallback if lite parse yielded 0: try generic anchor parse on fallback html
        if results.is_empty() {
            for part in body.split("class=\"result__url\"").skip(1).take(3) {
                let href = part.find("href=\"").and_then(|i| { let s= i+6; part[s..].find('"').map(|e| part[s..s+e].to_string()) }).unwrap_or_default();
                let title = part.find("class=\"result__a\"").and_then(|i| { let s=&part[i..]; s.find('>').map(|g| { let st=g+1; s[st..].find('<').map(|e| strip_html(&s[st..st+e]).trim().to_string()).unwrap_or_default() }) }).unwrap_or_default();
                if !href.is_empty() { results.push(serde_json::json!({"title": title, "url": href, "snippet": ""})); }
            }
        }
        let out = serde_json::json!({"results": results, "cached": false});
        let _ = std::fs::write(&cache_file, serde_json::to_string(&out).unwrap_or_default());
        let _ = req.respond(json_ok(&out));
        return;
    }

    // ============================== Proxy robusto (bypass CORS/CSP/X-Frame-Options sin --disable-web-security)
    // Usa tiny_http como puente: el WebView pide mismo origen (127.0.0.1), Rust hace el fetch externo,
    // limpia headers restrictivos y reinyecta CORS. Soporta GET/POST/PUT/PATCH/DELETE y preflight OPTIONS.
    // Frontend debe usar: /shell/proxy?url=encodeURIComponent(target)
    if path == "/shell/proxy" {
        // Preflight CORS
        if method == Method::Options {
            let origin = req.headers().iter().find(|h| h.field.as_str() == "Origin").map(|h| h.value.as_str().to_string()).unwrap_or("*".to_string());
            let req_headers = req.headers().iter().find(|h| h.field.as_str() == "Access-Control-Request-Headers").map(|h| h.value.as_str().to_string()).unwrap_or("Content-Type, Authorization, X-Requested-With".to_string());
            let _ = req.respond(
                Response::from_string("")
                    .with_status_code(StatusCode(204))
                    .with_header(Header::from_bytes("Access-Control-Allow-Origin", origin.as_bytes()).unwrap())
                    .with_header(Header::from_bytes("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD").unwrap())
                    .with_header(Header::from_bytes("Access-Control-Allow-Headers", req_headers.as_bytes()).unwrap())
                    .with_header(Header::from_bytes("Access-Control-Max-Age", "86400").unwrap()),
            );
            return;
        }
        let url_param = q("url");
        if url_param.is_empty() {
            // También soporta POST body {"url": "..."}
            let _ = req.respond(json_err(400, "Falta parámetro url (?url=)"));
            return;
        }
        let mut target_url = if !url_param.starts_with("http://") && !url_param.starts_with("https://") {
            format!("https://{url_param}")
        } else {
            url_param
        };
        // Validar esquema para evitar SSRF a file:// etc.
        if !target_url.starts_with("http://") && !target_url.starts_with("https://") {
            let _ = req.respond(json_err(400, "URL debe ser http(s)"));
            return;
        }
        // 0.0.0.0 no es ruteable para el cliente; el server bindea en 0.0.0.0 pero el fetch debe ir a 127.0.0.1
        if target_url.contains("://0.0.0.0:") {
            target_url = target_url.replacen("://0.0.0.0:", "://127.0.0.1:", 1);
        } else if target_url.contains("://[::]:") {
            target_url = target_url.replacen("://[::]:", "://127.0.0.1:", 1);
        } else if target_url.contains("://::1:") || target_url.contains("://[::1]:") {
            // ::1 es loopback pero ureq+Windows puede fallar con corchetes; normalizar a 127.0.0.1
            target_url = target_url.replacen("://::1:", "://127.0.0.1:", 1).replacen("://[::1]:", "://127.0.0.1:", 1);
        }
        // Leer body crudo si hay (para POST/PUT/PATCH que vienen via proxy)
        let mut fwd_body: Vec<u8> = Vec::new();
        let has_body = matches!(method, Method::Post | Method::Put | Method::Patch);
        if has_body {
            let mut buf = Vec::new();
            let reader = req.as_reader();
            let mut chunk = [0u8; 8192];
            let mut total = 0usize;
            loop {
                match reader.read(&mut chunk) {
                    Ok(0) => break,
                    Ok(n) => {
                        total += n;
                        if total > 16 * 1024 * 1024 { break; }
                        buf.extend_from_slice(&chunk[..n]);
                    }
                    Err(_) => break,
                }
            }
            fwd_body = buf;
        }
        // Headers a reenviar (whitelist)
        let mut fwd_content_type: Option<String> = None;
        let mut fwd_auth: Option<String> = None;
        let mut fwd_accept: Option<String> = None;
        for h in req.headers() {
            let k = h.field.as_str().to_ascii_lowercase();
            let v = h.value.as_str().to_string();
            match k.as_str() {
                "content-type" => fwd_content_type = Some(v),
                "authorization" => fwd_auth = Some(v),
                "accept" => fwd_accept = Some(v),
                _ => {}
            }
        }
        let client = ureq::builder()
            .timeout(std::time::Duration::from_secs(15))
            .redirects(5)
            .build();
        let method_str = method.as_str().to_string();
        let mut ureq_req = client.request(&method_str, &target_url);
        ureq_req = ureq_req.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");
        ureq_req = ureq_req.set("Accept", fwd_accept.as_deref().unwrap_or("*/*"));
        ureq_req = ureq_req.set("Accept-Language", "en-US,en;q=0.9,es;q=0.8");
        if let Some(ct) = &fwd_content_type { ureq_req = ureq_req.set("Content-Type", ct); }
        if let Some(auth) = &fwd_auth { ureq_req = ureq_req.set("Authorization", auth); }
        // Ejecutar
        let ureq_resp = if has_body && !fwd_body.is_empty() {
            ureq_req.send_bytes(&fwd_body)
        } else {
            ureq_req.call()
        };
        match ureq_resp {
            Ok(resp) => {
                let status = resp.status();
                let ct = resp.header("Content-Type").unwrap_or("text/html; charset=utf-8").to_string();
                let mut reader = resp.into_reader();
                let mut body_bytes = Vec::new();
                let _ = std::io::Read::read_to_end(&mut reader, &mut body_bytes);
                // Limpiar/transformar HTML
                let is_html = ct.to_ascii_lowercase().contains("html") || ct.to_ascii_lowercase().contains("text/") && body_bytes.len() < 10*1024*1024 && String::from_utf8_lossy(&body_bytes).contains("<html");
                if is_html {
                    if let Ok(html) = String::from_utf8(body_bytes.clone()) {
                        let cleaned = sanitize_proxy_html(html, &target_url);
                        let _ = req.respond(
                            Response::from_string(cleaned)
                                .with_status_code(StatusCode(status))
                                .with_header(Header::from_bytes("Content-Type", ct.as_bytes()).unwrap())
                                .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap())
                                .with_header(Header::from_bytes("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD").unwrap())
                                .with_header(Header::from_bytes("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept").unwrap())
                                .with_header(Header::from_bytes("Access-Control-Expose-Headers", "Content-Length, Content-Type").unwrap())
                                .with_header(Header::from_bytes("Cache-Control", "no-cache").unwrap()),
                        );
                        return;
                    }
                }
                // Respuesta binaria / no-html: reenviar tal cual pero con CORS y sin headers bloqueantes
                // Filtrar headers restrictivos del origen ya no se reenvían; solo ponemos CORS
                let _ = req.respond(
                    Response::from_data(body_bytes)
                        .with_status_code(StatusCode(status))
                        .with_header(Header::from_bytes("Content-Type", ct.as_bytes()).unwrap())
                        .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap())
                        .with_header(Header::from_bytes("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD").unwrap())
                        .with_header(Header::from_bytes("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept").unwrap())
                        .with_header(Header::from_bytes("Access-Control-Expose-Headers", "Content-Length, Content-Type").unwrap()),
                );
            }
            Err(ureq::Error::Status(code, resp)) => {
                let status = code;
                let ct = resp.header("Content-Type").unwrap_or("text/html; charset=utf-8").to_string();
                let mut reader = resp.into_reader();
                let mut body_bytes = Vec::new();
                let _ = std::io::Read::read_to_end(&mut reader, &mut body_bytes);
                let is_html = ct.contains("html");
                let body_str = if is_html { String::from_utf8_lossy(&body_bytes).to_string() } else { format!("<pre>{}</pre>", String::from_utf8_lossy(&body_bytes)) };
                let sanitized = if is_html { sanitize_proxy_html(body_str, &target_url) } else { body_str };
                let _ = req.respond(
                    Response::from_string(sanitized)
                        .with_status_code(StatusCode(status))
                        .with_header(Header::from_bytes("Content-Type", ct.as_bytes()).unwrap())
                        .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap()),
                );
            }
            Err(e) => {
                let err_html = format!(
                    "<!DOCTYPE html><html><body style='font-family:sans-serif;padding:30px;background:#1e1e1e;color:#fff;'><h3>No se pudo cargar: {}</h3><p style='color:#ef4444;'>{}</p><p style='color:#888;'>Proxy: /shell/proxy?url=encodeURIComponent(target)</p></body></html>",
                    target_url, e
                );
                let _ = req.respond(
                    Response::from_string(err_html)
                        .with_status_code(StatusCode(502))
                        .with_header(Header::from_bytes("Content-Type", "text/html; charset=utf-8").unwrap())
                        .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap()),
                );
            }
        }
        return;
    }

    // ============================== Estáticos (web app)
    // GUARD: las rutas /shell/* son API — jamás caer al SPA fallback.
    // (Sin esto, POST /shell/browser/open devolvía index.html y el WebView
    // nativo jamás se abría: .catch(()=>{}) se tragaba el JSON parse error.)
    if !path.starts_with("/shell/") {
        if let Some(base) = state.dist.as_ref() {
        let rel = path.trim_start_matches('/');
        // brotli precomprimido: si Accept-Encoding incluye br y existe .br, servirlo
        let accept_br = req.headers().iter().any(|h| h.field.as_str().to_ascii_lowercase() == "accept-encoding" && h.value.as_str().contains("br"));
        let mut file = base.join(rel);
        if !file.starts_with(base) {
            file = base.join("index.html");
        }
        // intentar .br primero
        if accept_br {
            let br_file = if rel.is_empty() { base.join("index.html.br") } else { base.join(format!("{rel}.br")) };
            if br_file.is_file() && br_file.starts_with(base) {
                if let Ok(br_bytes) = std::fs::read(&br_file) {
                    let mime = mime_for(&file);
                    let _ = req.respond(
                        Response::from_data(br_bytes)
                            .with_status_code(StatusCode(200))
                            .with_header(Header::from_bytes("Content-Type", mime).unwrap())
                            .with_header(Header::from_bytes("Content-Encoding", "br").unwrap())
                            .with_header(Header::from_bytes("Cache-Control", "public, max-age=31536000, immutable").unwrap()),
                    );
                    return;
                }
            }
        }
        // mmap fast path (zero-copy-ish, usa page cache)
        let mut served = crate::common::serve_file_mmap(base, rel);
        if served.is_none() && !rel.contains('.') {
            served = crate::common::serve_file_mmap(base, "index.html");
            file = base.join("index.html");
        }
        if let Some((bytes, mime)) = served {
            let is_index = file.file_name().and_then(|n| n.to_str()) == Some("index.html")
                || (!rel.contains('.') && file.ends_with("index.html"));
            // Para index.html, inyectar config script (no cache)
            if is_index {
                // Si fue mmap, bytes ya es Vec<u8>; intentar utf8
                if let Ok(mut s) = String::from_utf8(bytes.clone()) {
                    let inject = inject_config_script(&state.config.read().unwrap_or_else(|e| e.into_inner()));
                    if let Some(pos) = s.rfind("</head>") {
                        s.insert_str(pos, &inject);
                    } else {
                        s.push_str(&inject);
                    }
                    let _ = req.respond(
                        Response::from_string(s)
                            .with_status_code(StatusCode(200))
                            .with_header(Header::from_bytes("Content-Type", mime).unwrap())
                            .with_header(Header::from_bytes("Cache-Control", "no-cache").unwrap()),
                    );
                    return;
                }
            }
            // Cache agresivo para assets hasheados, no-cache para index
            let cache = if is_index { "no-cache" } else { "public, max-age=31536000, immutable" };
            let _ = req.respond(
                Response::from_data(bytes)
                    .with_status_code(StatusCode(200))
                    .with_header(Header::from_bytes("Content-Type", mime).unwrap())
                    .with_header(Header::from_bytes("Cache-Control", cache).unwrap()),
            );
            return;
        }
    }
    } // fin guard /shell/*

    // ============================== Browser (Sub-WebView2 nativo ultra-ligero)
    if path == "/shell/browser/open" && method == Method::Post {
        if let Ok(v) = read_body(&mut req) {
            let url = v["url"].as_str().unwrap_or("about:blank");
            let bx = v["bounds"]["x"].as_f64().unwrap_or(0.0);
            let by = v["bounds"]["y"].as_f64().unwrap_or(0.0);
            let bw = v["bounds"]["w"].as_f64().unwrap_or(800.0);
            let bh = v["bounds"]["h"].as_f64().unwrap_or(600.0);
            let bounds = wry::Rect {
                position: wry::dpi::LogicalPosition::new(bx, by).into(),
                size: wry::dpi::LogicalSize::new(bw, bh).into(),
            };
            let resp = match state.browser.open(url, bounds) {
                Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                Err(e) => json_err(500, &e),
            };
            let _ = req.respond(resp);
            return;
        }
    }
    if path == "/shell/browser/bounds" && method == Method::Post {
        if let Ok(v) = read_body(&mut req) {
            let bx = v["x"].as_f64().unwrap_or(0.0);
            let by = v["y"].as_f64().unwrap_or(0.0);
            let bw = v["w"].as_f64().unwrap_or(800.0);
            let bh = v["h"].as_f64().unwrap_or(600.0);
            let bounds = wry::Rect {
                position: wry::dpi::LogicalPosition::new(bx, by).into(),
                size: wry::dpi::LogicalSize::new(bw, bh).into(),
            };
            let resp = match state.browser.set_bounds(bounds) {
                Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                Err(e) => json_err(500, &e),
            };
            let _ = req.respond(resp);
            return;
        }
    }
    if path == "/shell/browser/visibility" && method == Method::Post {
        if let Ok(v) = read_body(&mut req) {
            let visible = v["visible"].as_bool().unwrap_or(true);
            let resp = match state.browser.set_visible(visible) {
                Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                Err(e) => json_err(500, &e),
            };
            let _ = req.respond(resp);
            return;
        }
    }
    if path == "/shell/browser/navigate" && method == Method::Post {
        if let Ok(v) = read_body(&mut req) {
            let url = v["url"].as_str().unwrap_or("");
            let action = v["action"].as_str();
            let resp = match state.browser.navigate(url, action) {
                Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                Err(e) => json_err(500, &e),
            };
            let _ = req.respond(resp);
            return;
        }
    }
    if path == "/shell/browser/close" && method == Method::Post {
        let resp = match state.browser.close() {
            Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
            Err(e) => json_err(500, &e),
        };
        let _ = req.respond(resp);
        return;
    }
    if path == "/shell/browser/url" && method == Method::Get {
        let resp = match state.browser.current_url() {
            Ok(url) => json_ok(&serde_json::json!({ "url": url })),
            Err(e) => json_err(500, &e),
        };
        let _ = req.respond(resp);
        return;
    }
    // Eval JS en el sub-WebView (modo inspección visual sin recarga)
    if path == "/shell/browser/eval" && method == Method::Post {
        if let Ok(v) = read_body(&mut req) {
            let code = v["code"].as_str().unwrap_or("");
            if code.is_empty() {
                let _ = req.respond(json_err(400, "missing code"));
                return;
            }
            // Cap defensivo: el overlay inyectado ronda los 14KB; nada legítimo
            // supera 256KB. Sin tope, un bug del host podría OOMear el WebView.
            if code.len() > 256 * 1024 {
                let _ = req.respond(json_err(413, "code too large"));
                return;
            }
            let resp = match state.browser.eval(code) {
                Ok(()) => json_ok(&serde_json::json!({ "ok": true })),
                Err(e) => json_err(500, &e),
            };
            let _ = req.respond(resp);
            return;
        }
        let _ = req.respond(json_err(400, "bad body"));
        return;
    }
    // Picks del modo inspección: POST encola (lo llama el JS inyectado en el
    // sub-WebView), GET drena la cola hacia el host.
    if path == "/shell/browser/pick" && method == Method::Post {
        if let Ok(v) = read_body(&mut req) {
            let serialized = v.to_string();
            if serialized.len() > 128 * 1024 {
                let _ = req.respond(json_err(413, "pick too large"));
                return;
            }
            let mut queue = state.browser_picks.lock().unwrap_or_else(|e| e.into_inner());
            if queue.len() < 64 {
                queue.push(serialized);
            }
            let _ = req.respond(json_ok(&serde_json::json!({ "ok": true })));
            return;
        }
        let _ = req.respond(json_err(400, "bad body"));
        return;
    }
    if path == "/shell/browser/pick" && method == Method::Get {
        let drained: Vec<serde_json::Value> = {
            let mut queue = state.browser_picks.lock().unwrap_or_else(|e| e.into_inner());
            queue.drain(..).map(|s| serde_json::from_str(&s).unwrap_or(serde_json::Value::Null)).collect()
        };
        let _ = req.respond(json_ok(&serde_json::json!({ "picks": drained })));
        return;
    }

    let _ = req.respond(
        Response::from_string("not found")
            .with_status_code(StatusCode(404))
            .with_header(Header::from_bytes("Content-Type", "text/plain").unwrap()),
    );
}

const MIME: &[(&str, &str)] = &[
    ("html", "text/html; charset=utf-8"),
    ("htm", "text/html; charset=utf-8"),
    ("js", "text/javascript; charset=utf-8"),
    ("mjs", "text/javascript; charset=utf-8"),
    ("css", "text/css; charset=utf-8"),
    ("json", "application/json"),
    ("svg", "image/svg+xml"),
    ("png", "image/png"),
    ("jpg", "image/jpeg"),
    ("jpeg", "image/jpeg"),
    ("webp", "image/webp"),
    ("ico", "image/x-icon"),
    ("woff", "font/woff"),
    ("woff2", "font/woff2"),
    ("ttf", "font/ttf"),
    ("map", "application/json"),
    ("txt", "text/plain; charset=utf-8"),
    ("md", "text/markdown; charset=utf-8"),
    ("wasm", "application/wasm"),
];

fn mime_for(path: &Path) -> &'static str {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    MIME.iter()
        .find(|(e, _)| *e == ext)
        .map(|(_, m)| *m)
        .unwrap_or("application/octet-stream")
}

fn sanitize_proxy_html(mut html: String, base_url: &str) -> String {
    // Inyectar <base> para que recursos relativos resuelvan al origen real
    let base_tag = format!(r#"<base href="{}">"#, base_url);
    let lower = html.to_ascii_lowercase();
    if let Some(pos) = lower.find("<head>") {
        html.insert_str(pos + 6, &base_tag);
    } else if let Some(pos) = lower.find("<head ") {
        if let Some(end) = html[pos..].find('>') {
            html.insert_str(pos + end + 1, &base_tag);
        } else {
            html.insert_str(0, &base_tag);
        }
    } else {
        html.insert_str(0, &base_tag);
    }
    // Eliminar meta CSP / X-Frame que bloquean framing en el HTML mismo
    let mut search_start = 0usize;
    loop {
        if search_start >= html.len() { break; }
        let slice_low = html[search_start..].to_ascii_lowercase();
        let Some(rel) = slice_low.find("<meta") else { break; };
        let start = search_start + rel;
        let end = html[start..].find('>').map(|i| start + i + 1).unwrap_or((start + 6).min(html.len()));
        let tag_low = html[start..end].to_ascii_lowercase();
        if tag_low.contains("http-equiv") && (tag_low.contains("content-security-policy") || tag_low.contains("x-frame-options")) {
            html.replace_range(start..end, "");
            search_start = start;
            continue;
        } else {
            search_start = end;
            continue;
        }
    }
    let cleaned = html
        .replace("top.location", "self.location")
        .replace("parent.location", "self.location")
        .replace("window.top", "window.self")
        .replace("window.parent", "window.self")
        .replace("if (top != self)", "if (false)")
        .replace("if(top!=self)", "if(false)")
        .replace("if (parent != self)", "if (false)");
    cleaned
}

fn inject_config_script(cfg: &crate::state::ShellConfig) -> String {
    let srv = &cfg.server;
    format!(
        r#"<script>
try {{
  const k = 'opencode.remote.server';
  if (!localStorage.getItem(k)) {{
    localStorage.setItem(k, JSON.stringify({{ host: {h:?}, port: {p}, username: {u:?}, password: {pw:?}, useSSL: {ssl} }}));
  }}
}} catch (e) {{}}
</script>"#,
        h = srv.host,
        p = srv.port,
        u = srv.username,
        pw = srv.password,
        ssl = srv.use_ssl,
    )
}

fn url_encode(s: &str) -> String {
    let mut out = String::with_capacity(s.len() * 3);
    for b in s.as_bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => out.push(*b as char),
            b' ' => out.push_str("%20"),
            _ => out.push_str(&format!("%{:02X}", b)),
        }
    }
    out
}
fn strip_html(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut inside = false;
    for ch in s.chars() {
        match ch {
            '<' => inside = true,
            '>' => inside = false,
            _ if !inside => out.push(ch),
            _ => {}
        }
    }
    out.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"").replace("&#x27;", "'").replace("&#39;", "'")
}
fn url_decode(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'%' if i + 2 < bytes.len() => {
                let hex = std::str::from_utf8(&bytes[i + 1..i + 3]).unwrap_or("");
                if let Ok(v) = u8::from_str_radix(hex, 16) {
                    out.push(v);
                    i += 3;
                    continue;
                }
                out.push(bytes[i]);
                i += 1;
            }
            b'+' => {
                out.push(b' ');
                i += 1;
            }
            b => {
                out.push(b);
                i += 1;
            }
        }
    }
    String::from_utf8_lossy(&out).to_string()
}

fn merge_config(cfg: &mut crate::state::ShellConfig, patch: &serde_json::Value) {
    if let Some(p) = patch.get("port").and_then(|v| v.as_u64()) {
        cfg.port = p as u16;
    }
    if let Some(s) = patch.get("start_minimized").and_then(|v| v.as_bool()) {
        cfg.start_minimized = s;
    }
    if let Some(s) = patch.get("start_command").and_then(|v| v.as_str()) {
        cfg.start_command = s.to_string();
    }
    if let Some(p) = patch.get("server_ports").and_then(|v| v.as_array()) {
        cfg.server_ports = p
            .iter()
            .filter_map(|x| x.as_u64().map(|n| n as u16))
            .collect();
    }
    if let Some(s) = patch.get("docs_root").and_then(|v| v.as_str()) {
        cfg.docs_root = s.to_string();
    }
    if let Some(a) = patch.get("x_handles").and_then(|v| v.as_array()) {
        cfg.x_handles = a.iter().filter_map(|x| x.as_str().map(|s| s.to_string())).collect();
    }
    if let Some(a) = patch.get("github_repos").and_then(|v| v.as_array()) {
        cfg.github_repos = a.iter().filter_map(|x| x.as_str().map(|s| s.to_string())).collect();
    }
    if let Some(s) = patch.get("desktop_agent_path").and_then(|v| v.as_str()) {
        cfg.desktop_agent_path = s.to_string();
    }
    if let Some(s) = patch.get("server").and_then(|v| v.get("port")).and_then(|v| v.as_u64()) {
        cfg.server.port = s as u16;
    }
    if let Some(s) = patch.get("server").and_then(|v| v.get("host")).and_then(|v| v.as_str()) {
        cfg.server.host = s.to_string();
    }
    if let Some(s) = patch.get("server").and_then(|v| v.get("username")).and_then(|v| v.as_str()) {
        cfg.server.username = s.to_string();
    }
    if let Some(s) = patch.get("server").and_then(|v| v.get("password")).and_then(|v| v.as_str()) {
        cfg.server.password = s.to_string();
    }
    if let Some(s) = patch.get("labs_apps").and_then(|v| v.as_array()) {
        cfg.labs_apps = s
            .iter()
            .filter_map(|x| serde_json::from_value(x.clone()).ok())
            .collect();
    }
    if let Some(s) = patch.get("cerebras_api_key").and_then(|v| v.as_str()) {
        cfg.cerebras_api_key = s.to_string();
    }
    if let Some(s) = patch.get("groq_api_key").and_then(|v| v.as_str()) {
        cfg.groq_api_key = s.to_string();
    }
    if let Some(s) = patch.get("quickchat_provider").and_then(|v| v.as_str()) {
        cfg.quickchat_provider = s.to_string();
    }
    if let Some(s) = patch.get("quickchat_model").and_then(|v| v.as_str()) {
        cfg.quickchat_model = s.to_string();
    }
    if let Some(b) = patch.get("auto_opencode2").and_then(|v| v.as_bool()) {
        cfg.auto_opencode2 = b;
    }
    if let Some(b) = patch.get("opencode2_enabled").and_then(|v| v.as_bool()) {
        cfg.opencode2_enabled = b;
    }
    if let Some(p) = patch.get("opencode2_port").and_then(|v| v.as_u64()) {
        cfg.opencode2_port = p as u16;
    }
    if let Some(s) = patch.get("opencode2_command").and_then(|v| v.as_str()) {
        cfg.opencode2_command = s.to_string();
    }
}