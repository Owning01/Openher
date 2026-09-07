//! Hyper + tokio server (Plan §3.1 completado) — IOCP en Windows.
//! Sirve estáticos via `common::serve_file_mmap` (mmap) + brotli y
//! `/shell/*` via `api::dispatch` (mismo dispatch puro, sin tiny_http).
//! El dispatch corre en spawn_blocking: handlers con I/O bloqueante
//! (ureq outbound) jamás stallean un worker tokio.

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

async fn handle_hyper(req: Request<Incoming>, state: Arc<AppState>) -> Result<Response<Full<Bytes>>, std::convert::Infallible> {
    let method = req.method().clone();
    let uri = req.uri().clone();
    let path = uri.path().to_string();
    let query = uri.query().unwrap_or("").to_string();

    // Fast path estáticos: app:// o /assets/*, /index.html via mmap
    if !path.starts_with("/shell/") {
        if let Some(dist) = &state.dist {
            // Intentar servir via mmap (incluye brotli si Accept-Encoding: br y .br existe)
            let accept_br = req.headers().get("accept-encoding").and_then(|v| v.to_str().ok()).map(|v| v.contains("br")).unwrap_or(false);
            let rel = if path == "/" { "/index.html" } else { &path };
            // Probar .br primero si cliente acepta
            if accept_br {
                let br_path = dist.join(rel.trim_start_matches('/').to_string() + ".br");
                if br_path.is_file() {
                    if let Ok(bytes) = std::fs::read(&br_path) {
                        let mime = crate::common::mime_for(std::path::Path::new(rel));
                        let resp = Response::builder()
                            .status(StatusCode::OK)
                            .header("content-type", mime)
                            .header("content-encoding", "br")
                            .header("cache-control", "public, max-age=31536000, immutable")
                            .body(Full::new(Bytes::from(bytes)))
                            .unwrap();
                        return Ok(resp);
                    }
                }
            }
            if let Some((bytes, mime)) = crate::common::serve_file_mmap(dist, rel) {
                let resp = Response::builder()
                    .status(StatusCode::OK)
                    .header("content-type", mime)
                    .header("cache-control", "public, max-age=3600")
                    .body(Full::new(Bytes::from(bytes)))
                    .unwrap();
                return Ok(resp);
            }
            // Fallback a index.html para SPA
            if let Some((bytes, _)) = crate::common::serve_file_mmap(dist, "/index.html") {
                let resp = Response::builder()
                    .status(StatusCode::OK)
                    .header("content-type", "text/html; charset=utf-8")
                    .body(Full::new(Bytes::from(bytes)))
                    .unwrap();
                return Ok(resp);
            }
        }
        let resp = Response::builder().status(StatusCode::NOT_FOUND).body(Full::new(Bytes::from("Not Found"))).unwrap();
        return Ok(resp);
    }

    // /shell/* — dispatch puro compartido (Plan 1). El body se recolecta con
    // cap 16MB (igual que el viejo read_body); el dispatch corre en
    // spawn_blocking porque algunos handlers hacen I/O bloqueante (ureq
    // outbound en proxy/search/stats) y jamás debe stall un worker tokio.
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
