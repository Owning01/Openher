//! Router de la API /shell/* + estáticos de la web app (mismo origen).

use std::io::Read;
use std::path::Path;
use std::sync::Arc;

use tiny_http::{Header, Method, Request, Response, StatusCode};

use crate::state::{json_err, json_ok, read_body, AppState};

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

    // ============================== Config
    if path == "/shell/config" && method == Method::Get {
        let cfg = state.config.read().unwrap().clone();
        let _ = req.respond(json_ok(&serde_json::to_value(cfg).unwrap_or_default()));
        return;
    }
    if path == "/shell/config" && method == Method::Post {
        match read_body(&mut req) {
            Ok(patch) => {
                let mut cfg = state.config.read().unwrap().clone();
                merge_config(&mut cfg, &patch);
                crate::state::save_config(&cfg);
                *state.config.write().unwrap() = cfg.clone();
                let _ = req.respond(json_ok(&serde_json::json!({ "ok": true, "config": cfg })));
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }
    if path == "/shell/config/export" {
        let cfg = state.config.read().unwrap().clone();
        let _ = req.respond(json_ok(&serde_json::json!({ "config": cfg })));
        return;
    }
    if path == "/shell/config/import" && method == Method::Post {
        match read_body(&mut req) {
            Ok(body) => {
                if let Some(cfg) = body.get("config") {
                    if let Ok(cfg) = serde_json::from_value::<crate::state::ShellConfig>(cfg.clone()) {
                        crate::state::save_config(&cfg);
                        *state.config.write().unwrap() = cfg.clone();
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
        let s = state.persisted.read().unwrap().clone();
        let _ = req.respond(json_ok(&serde_json::to_value(s).unwrap_or_default()));
        return;
    }
    if path == "/shell/session-state" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let mut s = state.persisted.write().unwrap();
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
    if path == "/shell/fs/drives" {
        let _ = req.respond(json_ok(&serde_json::json!({ "drives": crate::fsx::drives() })));
        return;
    }
    if path == "/shell/fs/list" {
        let p = q("path").replace("%2F", "/");
        match crate::fsx::list_dir(&p) {
            Ok(v) => {
                let _ = req.respond(json_ok(&v));
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }
    if path == "/shell/fs/read" {
        let p = q("path");
        match crate::fsx::read_file(&p, 65536) {
            Ok(v) => {
                let _ = req.respond(json_ok(&v));
            }
            Err(e) => {
                let _ = req.respond(json_err(400, &e));
            }
        }
        return;
    }
    if path == "/shell/fs/resolve" {
        let _ = req.respond(json_ok(&crate::fsx::resolve(&q("path"))));
        return;
    }
    if path == "/shell/fs/session" {
        let _ = req.respond(json_ok(&crate::fsx::session_for_dir(&q("path"))));
        return;
    }
    if path == "/shell/fs/pick-folder" {
        match crate::fsx::pick_folder() {
            Ok(Some(p)) => {
                let _ = req.respond(json_ok(&serde_json::json!({ "ok": true, "path": p })));
            }
            Ok(None) => {
                let _ = req.respond(json_ok(&serde_json::json!({ "ok": false, "path": null })));
            }
            Err(e) => {
                let _ = req.respond(json_err(500, &e));
            }
        }
        return;
    }
    if path == "/shell/fs/favorites" && method == Method::Get {
        let _ = req.respond(json_ok(&serde_json::json!({ "favorites": crate::fsx::favorites() })));
        return;
    }
    if path == "/shell/fs/favorites" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("").to_string();
                let add = b["add"].as_bool().unwrap_or(true);
                match crate::fsx::toggle_favorite(&p, add) {
                    Ok(()) => {
                        let _ = req.respond(json_ok(&serde_json::json!({ "ok": true })));
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
    if path == "/shell/fs/delete" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                match crate::fsx::delete_entry(p) {
                    Ok(()) => {
                        let _ = req.respond(json_ok(&serde_json::json!({ "ok": true })));
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
    if path == "/shell/fs/copy" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let src = b["src"].as_str().unwrap_or("");
                let dest = b["dest"].as_str().unwrap_or("");
                match crate::fsx::copy_entry(src, dest) {
                    Ok(target) => {
                        let _ = req.respond(json_ok(&serde_json::json!({ "ok": true, "path": target })));
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
    if path == "/shell/fs/write" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                let data = b["data"].as_str().unwrap_or("");
                match crate::fsx::write_file(p, data) {
                    Ok(()) => {
                        let _ = req.respond(json_ok(&serde_json::json!({ "ok": true })));
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
    if path == "/shell/fs/mkdir" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                match crate::fsx::mkdir_entry(p) {
                    Ok(()) => {
                        let _ = req.respond(json_ok(&serde_json::json!({ "ok": true })));
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
    if path == "/shell/fs/reveal" && method == Method::Post {
        match read_body(&mut req) {
            Ok(b) => {
                let p = b["path"].as_str().unwrap_or("");
                let _ = req.respond(json_ok(&crate::fsx::reveal_in_explorer(p)));
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
        let cfg_shell = state.config.read().map(|c| c.shell.clone()).ok().filter(|s| !s.is_empty());
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
                    let d = o.data.lock().unwrap();
                    let len = d.len();
                    let start = since.min(len);
                    let delta = &d[start..len];
                    serde_json::json!({
                        "len": len,
                        "done": o.done.load(std::sync::atomic::Ordering::SeqCst),
                        "data": base64_encode(delta),
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
                    match state.pty.resize(&id, cols, rows) {
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
        let ports = state.config.read().unwrap().server_ports.clone();
        let _ = req.respond(json_ok(&state.servers.status(&ports)));
        return;
    }
    if path == "/shell/server/start" && method == Method::Post {
        let cmd = state.config.read().unwrap().start_command.clone();
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
    // Proxy a opencode-stats: /shell/stats/proxy/* → http://127.0.0.1:8765/api/*
    if let Some(rest) = path.strip_prefix("/shell/stats/proxy/") {
        let stats_url = format!("http://127.0.0.1:8765/api/{rest}");
        match ureq::get(&stats_url).call() {
            Ok(resp) => {
                let mut body = Vec::new();
                resp.into_reader().read_to_end(&mut body).unwrap_or_default();
                let ct = "application/json";
                let _ = req.respond(
                    Response::from_string(String::from_utf8_lossy(&body).to_string())
                        .with_header(Header::from_bytes("Content-Type", ct).unwrap())
                        .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap()),
                );
            }
            Err(_) => {
                let _ = req.respond(json_err(502, "stats server unavailable"));
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

    // ============================== Estáticos (web app)
    if method == Method::Get && state.dist.is_some() {
        let rel = path.trim_start_matches('/');
        let base = state.dist.as_ref().unwrap();
        let mut file = base.join(rel);
        if !file.starts_with(base) {
            file = base.join("index.html");
        }
        let mut bytes = if file.is_file() {
            std::fs::read(&file).ok()
        } else {
            None
        };
        if bytes.is_none() && !rel.contains('.') {
            file = base.join("index.html");
            bytes = std::fs::read(&file).ok();
        }
        if let Some(bytes) = bytes {
            let is_index = file.file_name().and_then(|n| n.to_str()) == Some("index.html");
            let mime = mime_for(&file);
            if is_index {
                if let Ok(mut s) = String::from_utf8(bytes.clone()) {
                    let inject = inject_config_script(&state.config.read().unwrap());
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
            let _ = req.respond(
                Response::from_data(bytes)
                    .with_status_code(StatusCode(200))
                    .with_header(Header::from_bytes("Content-Type", mime).unwrap())
                    .with_header(Header::from_bytes("Cache-Control", "no-cache").unwrap()),
            );
            return;
        }
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

/// Base64 estándar (sin padding) para el buffer del pty.
#[allow(dead_code)]
fn base64_encode(data: &[u8]) -> String {
    crate::state::base64_encode(data)
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
}