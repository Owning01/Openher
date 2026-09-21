//! Hyper + tokio server (Plan §3.1 completado) — IOCP en Windows.
//! Sirve estáticos via `common::serve_file_mmap` (mmap) + brotli y
//! `/shell/*` via `api::dispatch` (mismo dispatch puro, sin tiny_http).
//! El dispatch corre en spawn_blocking: handlers con I/O bloqueante
//! (ureq outbound) jamás stallean un worker tokio.

use std::path::Path;
use std::sync::Arc;

use bytes::Bytes;
use http_body_util::{BodyExt, Full};
use hyper::body::Incoming;
use hyper::{Request, Response, StatusCode};
use hyper::service::service_fn;
use hyper_util::rt::TokioIo;
use tokio::net::TcpListener;

use crate::infrastructure::http::io::{ShellRequest, ShellResponse};
use crate::state::AppState;

/// Accept loop sobre un listener ya bindeado (main pre-bindea el socket std
/// para elegir el puerto ANTES de construir AppState). No retorna.
pub async fn serve_listener(state: Arc<AppState>, listener: TcpListener) {
    loop {
        let (stream, _) = match listener.accept().await {
            Ok(s) => s,
            Err(_) => continue,
        };
        let io = TokioIo::new(stream);
        let st = state.clone();
        tokio::spawn(async move {
            let svc = service_fn(move |req: Request<Incoming>| {
                let st = st.clone();
                async move { handle_hyper(req, st).await }
            });
            if let Err(e) = hyper::server::conn::http1::Builder::new()
                .serve_connection(io, svc)
                .await
            {
                eprintln!("hyper conn error: {e}");
            }
        });
    }
}

/// Cache-Control de assets con hash en el nombre (vite) — 1 año inmutable.
/// Constante única: la reusa el embed estático de external_router.
pub const IMMUTABLE_CACHE: &str = "public, max-age=31536000, immutable";
/// Cache-Control para nombres que no cambian entre builds.
pub const NO_CACHE: &str = "no-cache";

/// Cache para estáticos: solo /assets/* es immutable (vite les pone hash en
/// el nombre y cambian por build). index.html, el fallback SPA y el resto
/// (manifest, themes, audio...) van con no-cache: sus nombres no cambian
/// entre builds y con max-age el WebView2 mostraba la UI vieja hasta 1h.
fn static_cache_for(rel: &str) -> &'static str {
    if rel.starts_with("/assets/") {
        IMMUTABLE_CACHE
    } else {
        NO_CACHE
    }
}

/// Respuesta estática ya resuelta (todo I/O bloqueante fuera del worker tokio).
struct StaticReply {
    status: StatusCode,
    content_type: &'static str,
    cache: &'static str,
    encoding: Option<&'static str>,
    body: Bytes,
}

impl StaticReply {
    fn not_found() -> Self {
        Self {
            status: StatusCode::NOT_FOUND,
            content_type: "",
            cache: "",
            encoding: None,
            body: Bytes::from_static(b"Not Found"),
        }
    }

    fn into_response(self) -> Response<Full<Bytes>> {
        let mut b = Response::builder().status(self.status);
        if !self.content_type.is_empty() {
            b = b.header("content-type", self.content_type);
        }
        // Mismo orden que el handler original: content-encoding antes de cache-control.
        if let Some(enc) = self.encoding {
            b = b.header("content-encoding", enc);
        }
        if !self.cache.is_empty() {
            b = b.header("cache-control", self.cache);
        }
        // CORS solo en 200 (el 404 previo no llevaba headers). La notebook
        // consulta /openher-version.json del shell remoto cross-origin.
        if self.status == StatusCode::OK {
            b = b.header("access-control-allow-origin", "*");
        }
        b.body(Full::new(self.body)).unwrap()
    }
}

/// Fast-path de estáticos con I/O bloqueante: mmap zero-copy (`Bytes::from_owner`),
/// `.br` por mmap si `Accept-Encoding: br`. Corre en `spawn_blocking`.
fn serve_static_blocking(dist: Option<&Path>, path: &str, accept_br: bool) -> StaticReply {
    let Some(dist) = dist else {
        return StaticReply::not_found();
    };
    let rel = if path == "/" { "/index.html" } else { path };
    // Probar .br primero si el cliente acepta (puede ser >4KB y usar mmap).
    if accept_br {
        let br_path = dist.join(format!("{}.br", rel.trim_start_matches('/')));
        if br_path.is_file() {
            if let Some(body) = crate::common::read_file_bytes(&br_path) {
                return StaticReply {
                    status: StatusCode::OK,
                    content_type: crate::common::mime_for(Path::new(rel)),
                    cache: static_cache_for(rel),
                    encoding: Some("br"),
                    body,
                };
            }
        }
    }
    if let Some((body, mime)) = crate::common::serve_file_bytes(dist, rel) {
        return StaticReply {
            status: StatusCode::OK,
            content_type: mime,
            cache: static_cache_for(rel),
            encoding: None,
            body,
        };
    }
    // Fallback a index.html para SPA
    if let Some((body, _)) = crate::common::serve_file_bytes(dist, "/index.html") {
        return StaticReply {
            status: StatusCode::OK,
            content_type: "text/html; charset=utf-8",
            cache: static_cache_for("/index.html"),
            encoding: None,
            body,
        };
    }
    StaticReply::not_found()
}

async fn handle_hyper(req: Request<Incoming>, state: Arc<AppState>) -> Result<Response<Full<Bytes>>, std::convert::Infallible> {    let method = req.method().clone();
    let uri = req.uri().clone();
    let path = uri.path().to_string();
    let query = uri.query().unwrap_or("").to_string();

    // Fast path estáticos: app:// o /assets/*, /index.html via mmap.
    // `metadata`/`open`/`mmap`/`read` son bloqueantes: van en spawn_blocking.
    if !path.starts_with("/shell/") {
        let dist = state.dist.clone();
        let accept_br = req.headers().get("accept-encoding").and_then(|v| v.to_str().ok()).map(|v| v.contains("br")).unwrap_or(false);
        let reply = tokio::task::spawn_blocking(move || serve_static_blocking(dist.as_deref(), &path, accept_br))
            .await
            .unwrap_or_else(|_| StaticReply::not_found());
        return Ok(reply.into_response());
    }

    // /shell/* — dispatch puro compartido (Plan 1). El body se recolecta con
    // cap 16MB (igual que el viejo read_body); el dispatch corre en
    // spawn_blocking porque algunos handlers hacen I/O bloqueante (ureq
    // outbound en proxy/search) y jamás debe stall un worker tokio.
    const MAX_BODY: usize = 16 * 1024 * 1024;
    let method = method.to_string();
    let mut headers: Vec<(String, String)> = Vec::new();
    for (k, v) in req.headers().iter() {
        headers.push((
            k.as_str().to_ascii_lowercase(),
            v.to_str().unwrap_or("").to_string(),
        ));
    }
    let body = req
        .into_body()
        .collect()
        .await
        .map(|b| b.to_bytes())
        .unwrap_or_default();
    if body.len() > MAX_BODY {
        let r = ShellResponse::err_json(413, "body too large");
        return Ok(shell_to_hyper(r));
    }
    let sreq = ShellRequest { method, path: path.clone(), query, headers, body: body.to_vec() };
    let resp = tokio::task::spawn_blocking(move || crate::api::dispatch(&sreq, &state))
        .await
        .unwrap_or_else(|_| ShellResponse::err_json(500, "dispatch panicked"));
    Ok(shell_to_hyper(resp))
}

fn shell_to_hyper(r: ShellResponse) -> Response<Full<Bytes>> {
    let mut b = Response::builder().status(
        StatusCode::from_u16(r.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
    );
    for (k, v) in &r.headers {
        b = b.header(k.as_str(), v.as_str());
    }
    b.body(Full::new(Bytes::from(r.body))).unwrap()
}
