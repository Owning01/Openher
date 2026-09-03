//! Router /shell/proxy — bypass CORS con ureq, 16MB cap, SSRF normalize 0.0.0.0.
//! Extraído desde api.rs: tiny_http como puente, limpia CSP/X-Frame, reinyecta CORS.
//! Fix Google session: CookieJar por host + forward Set-Cookie (ureq all("Set-Cookie")).

use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::sync::Arc;

use tiny_http::{Header, Method, Request, Response, StatusCode};

use crate::state::{json_err, AppState};

// ── CookieJar global (por dominio) ──────────────────────────────────────────
static COOKIE_JAR: OnceLock<Mutex<HashMap<String, HashMap<String, String>>>> = OnceLock::new();
fn cookie_jar() -> &'static Mutex<HashMap<String, HashMap<String, String>>> {
    COOKIE_JAR.get_or_init(|| Mutex::new(HashMap::new()))
}
fn host_from_url(url: &str) -> String {
    // extrae host sin puerto
    let after = url.split("://").nth(1).unwrap_or(url);
    let host_port = after.split('/').next().unwrap_or(after);
    let host = host_port.split(':').next().unwrap_or(host_port);
    // strip [] for ipv6
    host.trim_matches(|c| c == '[' || c == ']').to_ascii_lowercase()
}
fn base_domain(host: &str) -> String {
    // naive eTLD+1 (últimos 2 labels) para google.com, youtube.com, etc.
    // Para localhost/ip no aplica
    if host.parse::<std::net::IpAddr>().is_ok() || !host.contains('.') {
        return host.to_string();
    }
    let parts: Vec<&str> = host.split('.').collect();
    if parts.len() >= 2 {
        format!("{}.{}", parts[parts.len() - 2], parts[parts.len() - 1])
    } else {
        host.to_string()
    }
}
fn cookie_header_for(host: &str) -> Option<String> {
    let jar = cookie_jar().lock().ok()?;
    let host_lc = host.to_ascii_lowercase();
    let mut pairs: Vec<String> = Vec::new();
    for (domain, map) in jar.iter() {
        let d = domain.to_ascii_lowercase();
        let matches = host_lc == d || host_lc.ends_with(&format!(".{}", d)) || d == base_domain(&host_lc);
        // también si guardamos bajo host exacto y pedimos su base, coincida
        if matches {
            for (k, v) in map {
                pairs.push(format!("{}={}", k, v));
            }
        }
    }
    if pairs.is_empty() { None } else { Some(pairs.join("; ")) }
}
fn store_set_cookies(request_host: &str, set_cookies: Vec<&str>) {
    if set_cookies.is_empty() { return; }
    let mut jar = match cookie_jar().lock() {
        Ok(g) => g,
        Err(e) => e.into_inner(),
    };
    for sc in set_cookies {
        // `Set-Cookie: NAME=VALUE; Domain=.google.com; Path=/; ...`
        let mut parts = sc.split(';');
        let Some(nv) = parts.next() else { continue };
        let nv = nv.trim();
        let Some(eq) = nv.find('=') else { continue };
        let name = nv[..eq].trim().to_string();
        let value = nv[eq + 1..].trim().to_string();
        if name.is_empty() { continue; }
        // detectar Domain= atributo
        let mut domain = request_host.to_ascii_lowercase();
        let mut delete = false;
        for attr in parts {
            let a = attr.trim();
            let al = a.to_ascii_lowercase();
            if al.starts_with("domain=") {
                let d = a[7..].trim().trim_start_matches('.').to_ascii_lowercase();
                if !d.is_empty() { domain = d; }
            } else if al.starts_with("max-age=") {
                let v = a[8..].trim();
                if v == "0" { delete = true; }
            } else if al.starts_with("expires=") {
                // si ya expiró, el server lo borrará; no parseamos fecha, solo Max-Age=0 es borrado explícito
            }
        }
        // manejar borrado
        if delete || value.is_empty() {
            if let Some(m) = jar.get_mut(&domain) {
                m.remove(&name);
                if m.is_empty() { jar.remove(&domain); }
            }
            // también intentar borrar en host original si domain difiere
            if domain != request_host {
                if let Some(m) = jar.get_mut(request_host) {
                    m.remove(&name);
                }
            }
            continue;
        }
        jar.entry(domain.clone()).or_default().insert(name, value);
    }
}
fn with_cors(mut resp: Response<std::io::Cursor<Vec<u8>>>) -> Response<std::io::Cursor<Vec<u8>>> {
    resp = resp.with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
    resp = resp.with_header(Header::from_bytes("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD").unwrap());
    resp = resp.with_header(Header::from_bytes("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Cookie, Set-Cookie").unwrap());
    resp = resp.with_header(Header::from_bytes("Access-Control-Expose-Headers", "Content-Length, Content-Type, Set-Cookie").unwrap());
    resp
}

#[allow(clippy::too_many_lines)]
pub fn handle(
    req: &mut Request,
    _state: Arc<AppState>,
    path: &str,
    method: Method,
    q: &dyn Fn(&str) -> String,
) -> Option<Response<std::io::Cursor<Vec<u8>>>> {
    if path != "/shell/proxy" {
        return None;
    }
    // Preflight CORS
    if method == Method::Options {
        let origin = req
            .headers()
            .iter()
            .find(|h| h.field.as_str() == "Origin")
            .map(|h| h.value.as_str().to_string())
            .unwrap_or_else(|| "*".to_string());
        let req_headers = req
            .headers()
            .iter()
            .find(|h| h.field.as_str() == "Access-Control-Request-Headers")
            .map(|h| h.value.as_str().to_string())
            .unwrap_or_else(|| "Content-Type, Authorization, X-Requested-With, Cookie".to_string());
        return Some(
            Response::from_string("")
                .with_status_code(StatusCode(204))
                .with_header(Header::from_bytes("Access-Control-Allow-Origin", origin.as_bytes()).unwrap())
                .with_header(
                    Header::from_bytes(
                        "Access-Control-Allow-Methods",
                        "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
                    )
                    .unwrap(),
                )
                .with_header(Header::from_bytes("Access-Control-Allow-Headers", req_headers.as_bytes()).unwrap())
                .with_header(Header::from_bytes("Access-Control-Max-Age", "86400").unwrap())
                .with_header(Header::from_bytes("Access-Control-Allow-Credentials", "true").unwrap()),
        );
    }
    let url_param = q("url");
    if url_param.is_empty() {
        return Some(json_err(400, "Falta parámetro url (?url=)"));
    }
    let mut target_url = if !url_param.starts_with("http://") && !url_param.starts_with("https://") {
        format!("https://{url_param}")
    } else {
        url_param
    };
    if !target_url.starts_with("http://") && !target_url.starts_with("https://") {
        return Some(json_err(400, "URL debe ser http(s)"));
    }
    if target_url.contains("://0.0.0.0:") {
        target_url = target_url.replacen("://0.0.0.0:", "://127.0.0.1:", 1);
    } else if target_url.contains("://[::]:") {
        target_url = target_url.replacen("://[::]:", "://127.0.0.1:", 1);
    } else if target_url.contains("://::1:") || target_url.contains("://[::1]:") {
        target_url = target_url
            .replacen("://::1:", "://127.0.0.1:", 1)
            .replacen("://[::1]:", "://127.0.0.1:", 1);
    }
    // SSRF: bloquear loop interno al propio shell (lectura de config.json con password desde página embebida)
    if target_url.contains("127.0.0.1:4848/shell") || target_url.contains("localhost:4848/shell") || target_url.contains("[::1]:4848/shell") {
        return Some(json_err(403, "proxy loop forbidden"));
    }
    let host_key = host_from_url(&target_url);
    // Leer body crudo si hay (para POST/PUT/PATCH que vienen via proxy) — cap 16MB
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
                    if total > 16 * 1024 * 1024 {
                        break;
                    }
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
    let mut fwd_cookie_in: Option<String> = None;
    for h in req.headers() {
        let k = h.field.as_str().to_ascii_lowercase();
        let v = h.value.as_str().to_string();
        match k.as_str() {
            "content-type" => fwd_content_type = Some(v),
            "authorization" => fwd_auth = Some(v),
            "accept" => fwd_accept = Some(v),
            "cookie" => fwd_cookie_in = Some(v),
            _ => {}
        }
    }
    let client = ureq::builder()
        .timeout(std::time::Duration::from_secs(15))
        .redirects(5)
        .build();
    let method_str = method.as_str().to_string();
    let mut ureq_req = client.request(&method_str, &target_url);
    ureq_req = ureq_req.set(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    );
    ureq_req = ureq_req.set("Accept", fwd_accept.as_deref().unwrap_or("*/*"));
    ureq_req = ureq_req.set("Accept-Language", "en-US,en;q=0.9,es;q=0.8");
    if let Some(ct) = &fwd_content_type {
        ureq_req = ureq_req.set("Content-Type", ct);
    }
    if let Some(auth) = &fwd_auth {
        ureq_req = ureq_req.set("Authorization", auth);
    }
    // Cookie: prioriza jar del server (persistente entre tabs), fallback al Cookie del cliente si hay
    let jar_cookie = cookie_header_for(&host_key);
    if let Some(c) = jar_cookie {
        ureq_req = ureq_req.set("Cookie", &c);
    } else if let Some(c) = fwd_cookie_in {
        ureq_req = ureq_req.set("Cookie", &c);
    }
    // Ejecutar
    let ureq_resp = if has_body && !fwd_body.is_empty() {
        ureq_req.send_bytes(&fwd_body)
    } else {
        ureq_req.call()
    };
    let resp = match ureq_resp {
        Ok(resp) => {
            let status = resp.status();
            let ct = resp
                .header("Content-Type")
                .unwrap_or("text/html; charset=utf-8")
                .to_string();
            // Capturar Set-Cookie antes de consumir body
            let set_cookies: Vec<String> = resp.all("set-cookie").into_iter().map(|s| s.to_string()).collect();
            store_set_cookies(&host_key, set_cookies.iter().map(|s| s.as_str()).collect());
            let mut reader = resp.into_reader();
            let mut body_bytes = Vec::new();
            let _ = std::io::Read::read_to_end(&mut reader, &mut body_bytes);
            let is_html = ct.to_ascii_lowercase().contains("html")
                || ct.to_ascii_lowercase().contains("text/")
                    && body_bytes.len() < 10 * 1024 * 1024
                    && String::from_utf8_lossy(&body_bytes).contains("<html");
            if is_html {
                if let Ok(html) = String::from_utf8(body_bytes.clone()) {
                    let cleaned = sanitize_proxy_html(html, &target_url);
                    let mut r = Response::from_string(cleaned)
                        .with_status_code(StatusCode(status))
                        .with_header(Header::from_bytes("Content-Type", ct.as_bytes()).unwrap())
                        .with_header(Header::from_bytes("Cache-Control", "no-cache").unwrap());
                    r = with_cors(r);
                    for sc in set_cookies {
                        if let Ok(h) = Header::from_bytes("Set-Cookie", sc.as_bytes()) {
                            r = r.with_header(h);
                        }
                    }
                    return Some(r);
                }
            }
            let mut r = Response::from_data(body_bytes)
                .with_status_code(StatusCode(status))
                .with_header(Header::from_bytes("Content-Type", ct.as_bytes()).unwrap());
            r = with_cors(r);
            for sc in set_cookies {
                if let Ok(h) = Header::from_bytes("Set-Cookie", sc.as_bytes()) {
                    r = r.with_header(h);
                }
            }
            r
        }
        Err(ureq::Error::Status(code, resp)) => {
            let status = code;
            let ct = resp
                .header("Content-Type")
                .unwrap_or("text/html; charset=utf-8")
                .to_string();
            let set_cookies: Vec<String> = resp.all("set-cookie").into_iter().map(|s| s.to_string()).collect();
            store_set_cookies(&host_key, set_cookies.iter().map(|s| s.as_str()).collect());
            let mut reader = resp.into_reader();
            let mut body_bytes = Vec::new();
            let _ = std::io::Read::read_to_end(&mut reader, &mut body_bytes);
            let is_html = ct.contains("html");
            let body_str = if is_html {
                String::from_utf8_lossy(&body_bytes).to_string()
            } else {
                format!("<pre>{}</pre>", String::from_utf8_lossy(&body_bytes))
            };
            let sanitized = if is_html {
                sanitize_proxy_html(body_str, &target_url)
            } else {
                body_str
            };
            let mut r = Response::from_string(sanitized)
                .with_status_code(StatusCode(status))
                .with_header(Header::from_bytes("Content-Type", ct.as_bytes()).unwrap());
            r = with_cors(r);
            for sc in set_cookies {
                if let Ok(h) = Header::from_bytes("Set-Cookie", sc.as_bytes()) {
                    r = r.with_header(h);
                }
            }
            r
        }
        Err(e) => {
            let err_html = format!(
                "<!DOCTYPE html><html><body style='font-family:sans-serif;padding:30px;background:#1e1e1e;color:#fff;'><h3>No se pudo cargar: {}</h3><p style='color:#ef4444;'>{}</p><p style='color:#888;'>Proxy: /shell/proxy?url=encodeURIComponent(target)</p></body></html>",
                target_url, e
            );
            let mut r = Response::from_string(err_html)
                .with_status_code(StatusCode(502))
                .with_header(Header::from_bytes("Content-Type", "text/html; charset=utf-8").unwrap());
            r = with_cors(r);
            r
        }
    };
    Some(resp)
}

fn sanitize_proxy_html(mut html: String, base_url: &str) -> String {
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
    let mut search_start = 0usize;
    loop {
        if search_start >= html.len() {
            break;
        }
        let slice_low = html[search_start..].to_ascii_lowercase();
        let Some(rel) = slice_low.find("<meta") else {
            break;
        };
        let start = search_start + rel;
        let end = html[start..]
            .find('>')
            .map(|i| start + i + 1)
            .unwrap_or((start + 6).min(html.len()));
        let tag_low = html[start..end].to_ascii_lowercase();
        if tag_low.contains("http-equiv")
            && (tag_low.contains("content-security-policy") || tag_low.contains("x-frame-options"))
        {
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
