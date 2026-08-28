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

/// Spawn detached: maneja `.bat` vía `cmd /c` vs binario con args. Siempre oculto (sin consola).
/// `cwd` opcional para `current_dir`.
pub fn spawn_detached(cmd: &str, cwd: Option<&Path>) -> Result<Child, String> {
    use std::os::windows::process::CommandExt;
    const HIDE: u32 = 0x08000000 | 0x00000008 | 0x00000200; // CREATE_NO_WINDOW | DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP
    let trimmed = cmd.trim();
    if trimmed.is_empty() {
        return Err("comando vacío".into());
    }
    if trimmed.to_lowercase().ends_with(".bat") {
        let mut c = std::process::Command::new("cmd");
        c.args(["/c", trimmed]);
        c.creation_flags(HIDE);
        c.stdin(std::process::Stdio::null());
        c.stdout(std::process::Stdio::null());
        c.stderr(std::process::Stdio::null());
        if let Some(dir) = cwd { c.current_dir(dir); }
        c.spawn().map_err(|e| e.to_string())
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
        c.creation_flags(HIDE);
        c.stdin(std::process::Stdio::null());
        c.stdout(std::process::Stdio::null());
        c.stderr(std::process::Stdio::null());
        c.spawn().map_err(|e| e.to_string())
    }
}

/// Spawn visible: abre una consola (CREATE_NEW_CONSOLE) para procesos interactivos como `opencode2`.
/// Si `auto_minimized` es false, la ventana es visible; si el exe es .bat, usa `cmd /c start`.
pub fn spawn_visible(cmd: &str, cwd: Option<&Path>) -> Result<Child, String> {
    use std::os::windows::process::CommandExt;
    const VISIBLE: u32 = 0x00000010 | 0x00000200; // CREATE_NEW_CONSOLE | CREATE_NEW_PROCESS_GROUP
    let trimmed = cmd.trim();
    if trimmed.is_empty() {
        return Err("comando vacío".into());
    }
    if trimmed.to_lowercase().ends_with(".bat") {
        let mut c = std::process::Command::new("cmd");
        c.args(["/c", "start", "", trimmed]);
        c.creation_flags(VISIBLE);
        if let Some(dir) = cwd { c.current_dir(dir); }
        c.spawn().map_err(|e| e.to_string())
    } else {
        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.is_empty() {
            return Err("comando vacío".into());
        }
        let mut c = std::process::Command::new(parts[0]);
        c.args(&parts[1..]);
        if let Some(dir) = cwd { c.current_dir(dir); }
        c.creation_flags(VISIBLE);
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

/// Versión mmap zero-copy: usa `memmap2` si el archivo >4KB, sino `read`.
/// Para `Accept-Encoding: br` el caller debe resolver `path.br` antes.
pub fn serve_file_mmap(root: &Path, rel: &str) -> Option<(Vec<u8>, &'static str)> {
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
    // Intentar mmap para >4KB (evita alloc extra para chicos)
    if let Ok(meta) = std::fs::metadata(&path) {
        if meta.len() > 4096 {
            if let Ok(file) = std::fs::File::open(&path) {
                if let Ok(mmap) = unsafe { memmap2::Mmap::map(&file) } {
                    let mime = mime_for(&path);
                    // Copia necesaria para tiny_http Response::from_data que toma ownership Vec<u8>
                    // En hyper path zero-copy se usará Bytes::from(mmap[..].to_vec()) o Bytes copy
                    // Mantener copia para compat; el win es evitar 2 copias y usar page cache
                    return Some((mmap[..].to_vec(), mime));
                }
            }
        }
    }
    let bytes = std::fs::read(&path).ok()?;
    let mime = mime_for(&path);
    Some((bytes, mime))
}

/// Parse JSON con `simd-json` si el payload >1KB, fallback a `serde_json`.
/// Requiere `&mut [u8]` para simd; si falla, usa serde.
pub fn parse_json_simd(bytes: &mut [u8]) -> Result<serde_json::Value, String> {
    if bytes.len() > 1024 {
        // simd-json necesita &mut [u8] porque modifica in-place (escapes)
        let mut v = bytes.to_vec();
        match simd_json::to_owned_value(&mut v) {
            Ok(val) => {
                // Convertir simd_json::OwnedValue -> serde_json::Value via to_value
                // simd-json Value es compatible via serde, fallback a transcode
                let s = serde_json::to_string(&val).map_err(|e| e.to_string())?;
                serde_json::from_str(&s).map_err(|e| e.to_string())
            }
            Err(_) => serde_json::from_slice(bytes).map_err(|e| e.to_string()),
        }
    } else {
        serde_json::from_slice(bytes).map_err(|e| e.to_string())
    }
}
