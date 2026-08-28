//! Hyper + tokio server (plan §3.1) — IOCP en Windows, zero-copy.
//! Fase 1: sirve estáticos via `common::serve_file_mmap` (mmap) + brotli.
//! Fase 2 (TODO): migrar `/shell/*` de `tiny_http` a `hyper` con `dispatch` genérico
//! para eliminar `1 thread/req` y CORS overhead. Por ahora coexiste con `tiny_http`.

use std::sync::Arc;
use std::net::SocketAddr;

use bytes::Bytes;
use http_body_util::Full;
use hyper::body::Incoming;
use hyper::{Request, Response, StatusCode};
use hyper::service::service_fn;
use hyper_util::rt::TokioIo;
use tokio::net::TcpListener;

use crate::state::AppState;

/// Inicia hyper en `0.0.0.0:port` (tokio runtime). Retorna el puerto elegido.
/// Si falla, cae a tiny_http existente en `main.rs`.
pub async fn serve_hyper(state: Arc<AppState>, port: u16) -> Result<u16, String> {
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = TcpListener::bind(addr).await.map_err(|e| e.to_string())?;
    let bound = listener.local_addr().map_err(|e| e.to_string())?.port();
    eprintln!("opencode-desktop: hyper sirviendo en http://0.0.0.0:{bound} (tokio IOCP, mmap)");

    let state_clone = state.clone();
    tokio::spawn(async move {
        loop {
            let (stream, _) = match listener.accept().await {
                Ok(s) => s,
                Err(_) => continue,
            };
            let io = TokioIo::new(stream);
            let st = state_clone.clone();
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
    });
    Ok(bound)
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

    // /shell/* — por ahora proxy a tiny_http interno (evita refactor masivo de routers)
    // TODO: dispatch genérico que llame a `crate::api::dispatch` sin tiny_http Request.
    // Hacer fetch interno a tiny_http port+1000? No — responder 501 hasta migrar dispatch.
    let body = format!("{{\"error\":\"hyper /shell proxy no migrado aún: {method} {path}?{query}\"}}");
    let resp = Response::builder()
        .status(StatusCode::NOT_IMPLEMENTED)
        .header("content-type", "application/json")
        .header("access-control-allow-origin", "*")
        .body(Full::new(Bytes::from(body)))
        .unwrap();
    Ok(resp)
}
