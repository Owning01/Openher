//! Router de la API /shell/* + estáticos de la web app (mismo origen).

use std::path::Path;
use std::sync::Arc;

use tiny_http::{Header, Method, Request, Response, StatusCode};

use crate::state::{json_ok, AppState};

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
    // Sin header Host no asumir loopback — evita bypass de auth con curl -H "Host:"
    false
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

    // RAM nativa: proceso app + WebViews propios (msedgewebview2 hijas).
    // La usa el chip de RAM del ActivityBar junto al JS heap.
    if path == "/shell/mem" {
        let _ = req.respond(json_ok(&crate::memx::snapshot()));
        return;
    }

    // ============================== Window controls (extraído)
    if path.starts_with("/shell/window") {
        if let Some(resp) = crate::infrastructure::http::window_router::handle(&mut req, state.clone(), &path, method.clone(), &q) {
            let _ = req.respond(resp);
            return;
        }
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

    // ============================== Computer v2 (extraído a router — fix duplicados screenshot.bin)
    if path.starts_with("/shell/computer") {
        if let Some(resp) =
            crate::infrastructure::http::computer_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
    }

    if path.starts_with("/shell/pty") {
        if let Some(resp) =
            crate::infrastructure::http::pty_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
    }

    if path.starts_with("/shell/kanban") {
        if let Some(resp) =
            crate::infrastructure::http::kanban_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
    }

    // ============================== Config / Autostart / Session (extraído)
    if path.starts_with("/shell/config") || path == "/shell/autostart" || path == "/shell/session-state" {
        if let Some(resp) =
            crate::infrastructure::http::config_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
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

    // ============================== Conversor y Editor de Documentos (Rust ultra-ligero) (extraído)
    if path.starts_with("/shell/doc") {
        if let Some(resp) =
            crate::infrastructure::http::doc_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
    }

    // ============================== Server manager (extraído)
    if path.starts_with("/shell/server") {
        if let Some(resp) =
            crate::infrastructure::http::server_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
    }

    // ============================== Updates + Docs (extraído)
    if path == "/shell/updates" || path.starts_with("/shell/docs") {
        if let Some(resp) =
            crate::infrastructure::http::docs_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
    }

    // (computer routes migrados a infrastructure/http/computer_router.rs — delegado arriba)

    // ============================== Stats / Design (extraído)
    if path.starts_with("/shell/stats") || path.starts_with("/shell/design") {
        if let Some(resp) =
            crate::infrastructure::http::stats_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
    }

    // ============================== Plugins + Labs (extraído)
    if path.starts_with("/shell/plugins") || path.starts_with("/shell/plugin") {
        if let Some(resp) =
            crate::infrastructure::http::plugin_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
    }

    // ============================== Project Auto-Serve / Preview (extraído)
    if path == "/shell/project/serve" || path.starts_with("/shell/preview") {
        if let Some(resp) =
            crate::infrastructure::http::preview_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
    }

    // ============================== OpenCode global + Labs (extraído)
    if path == "/shell/opencode/global" || path.starts_with("/shell/labs") {
        if let Some(resp) =
            crate::infrastructure::http::opencode_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
    }

    // ============================== QuickChat web search (DDG lite, token-min) (extraído)
    if path == "/shell/search" {
        if let Some(resp) =
            crate::infrastructure::http::search_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
    }

    // ============================== Proxy robusto (extraído)
    if path == "/shell/proxy" {
        if let Some(resp) =
            crate::infrastructure::http::proxy_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
            return;
        }
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

    // ============================== Browser (Sub-WebView2 nativo ultra-ligero) (extraído)
    if path.starts_with("/shell/browser") {
        if let Some(resp) =
            crate::infrastructure::http::browser_router::handle(&mut req, state.clone(), &path, method.clone(), &q)
        {
            let _ = req.respond(resp);
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

#[allow(dead_code)]
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

#[allow(dead_code)]
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
#[allow(dead_code)]
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
