//! Helpers compartidos — deduplicación de patrones repetidos en desktop-app.

use std::path::Path;
use std::process::Child;
use std::time::Duration;

/// Probe HTTP genérico: GET http://127.0.0.1:{port}{path} con timeout.
/// Retorna true si el status está en `ok_statuses`.
pub fn probe_http(port: u16, path: &str, timeout: Duration, ok_statuses: &[u16]) -> bool {
    let url = format!("http://127.0.0.1:{port}{path}");
    ureq::get(&url)
        .timeout(timeout)
        .call()
        .map(|r| ok_statuses.contains(&r.status()))
        .unwrap_or(false)
}

/// Spawn detached: maneja `.bat` vía `cmd /c` vs binario con args.
/// `cwd` opcional para `current_dir`.
pub fn spawn_detached(cmd: &str, cwd: Option<&Path>) -> Result<Child, String> {
    let trimmed = cmd.trim();
    if trimmed.is_empty() {
        return Err("comando vacío".into());
    }
    if trimmed.to_lowercase().ends_with(".bat") {
        std::process::Command::new("cmd")
            .args(["/c", trimmed])
            .spawn()
            .map_err(|e| e.to_string())
    } else {
        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.is_empty() {
            return Err("comando vacío".into());
        }
        let mut c = std::process::Command::new(parts[0]);
        c.args(&parts[1..]);
        if let Some(dir) = cwd {
            c.current_dir(dir);
        }
        c.spawn().map_err(|e| e.to_string())
    }
}

/// MIME centralizado — única tabla usada por api.rs y plugins.rs.
pub fn mime_for(path: &Path) -> &'static str {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    match ext.as_str() {
        "html" => "text/html; charset=utf-8",
        "js" | "mjs" => "text/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" => "application/json",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "wasm" => "application/wasm",
        "map" => "application/json",
        "woff" => "font/woff",
        "woff2" => "font/woff2",
        "ttf" => "font/ttf",
        "ico" => "image/x-icon",
        _ => "application/octet-stream",
    }
}

/// Servir archivo estático con guard de path-traversal y fallback a index.html si es dir.
/// Retorna (bytes, mime) si existe.
pub fn serve_file(root: &Path, rel: &str) -> Option<(Vec<u8>, &'static str)> {
    let rel_clean = rel.trim_start_matches('/');
    let mut path = root.join(rel_clean);
    if !path.starts_with(root) {
        return None;
    }
    if path.is_dir() {
        path = path.join("index.html");
    }
    if !path.is_file() {
        return None;
    }
    let bytes = std::fs::read(&path).ok()?;
    let mime = mime_for(&path);
    Some((bytes, mime))
}
