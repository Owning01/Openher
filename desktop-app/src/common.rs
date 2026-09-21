//! Helpers compartidos — deduplicación de patrones repetidos en desktop-app.

use std::path::{Path, PathBuf};
use std::process::Child;
use std::time::Duration;

use bytes::Bytes;

/// Probe HTTP genérico: GET http://127.0.0.1:{port}{path} con timeout.
/// Retorna true si el status está en `ok_statuses`.
pub fn probe_http(port: u16, path: &str, timeout: Duration, ok_statuses: &[u16]) -> bool {
    let url = format!("http://127.0.0.1:{port}{path}");
    // ureq entrega 4xx/5xx como `Err(Error::Status)`; hay que mirar el código
    // ahí también o los probes que aceptan 401 (opencode2 con Basic auth)
    // siempre darían false.
    match ureq::get(&url).timeout(timeout).call() {
        Ok(r) => ok_statuses.contains(&r.status()),
        Err(ureq::Error::Status(code, _)) => ok_statuses.contains(&code),
        Err(_) => false,
    }
}

/// Separa el programa (respetando un programa entre comillas) de sus argumentos.
fn split_program_args(cmd: &str) -> (String, Vec<String>) {
    let cmd = cmd.trim();
    if let Some(rest) = cmd.strip_prefix('"') {
        if let Some(end) = rest.find('"') {
            let program = rest[..end].to_string();
            let args = rest[end + 1..].split_whitespace().map(str::to_string).collect();
            return (program, args);
        }
    }
    let mut it = cmd.split_whitespace();
    let program = it.next().unwrap_or("").to_string();
    let args = it.map(str::to_string).collect();
    (program, args)
}

/// Spawn detached: shims (`.bat`/`.cmd`/`.ps1` o sin extensión) van por
/// `cmd /c`; los `.exe` se lanzan directo. Siempre oculto y desprendido
/// (CREATE_NO_WINDOW | DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP), así el
/// proceso sobrevive al cierre de OpenHer y no abre su propia consola.
/// `cwd` opcional para `current_dir`.
pub fn spawn_detached(cmd: &str, cwd: Option<&Path>) -> Result<Child, String> {
    use std::os::windows::process::CommandExt;
    const HIDE: u32 = 0x08000000 | 0x00000008 | 0x00000200; // CREATE_NO_WINDOW | DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP
    let trimmed = cmd.trim();
    if trimmed.is_empty() {
        return Err("comando vacío".into());
    }
    let (program, args) = split_program_args(trimmed);
    if program.is_empty() {
        return Err("comando vacío".into());
    }
    let ext = Path::new(&program)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase());
    // Sin extensión (shim POSIX) o shim de shell: `cmd /c` lo resuelve igual
    // que la consola, pero con las flags ocultas que ya aplicamos al hijo.
    let via_cmd = ext.is_none() || matches!(ext.as_deref(), Some("bat" | "cmd" | "ps1"));
    let mut c = if via_cmd {
        let mut c = std::process::Command::new("cmd");
        c.args(["/c", trimmed]);
        c
    } else {
        let mut c = std::process::Command::new(&program);
        c.args(&args);
        c
    };
    if let Some(dir) = cwd {
        c.current_dir(dir);
    }
    c.creation_flags(HIDE);
    c.stdin(std::process::Stdio::null());
    c.stdout(std::process::Stdio::null());
    c.stderr(std::process::Stdio::null());
    c.spawn().map_err(|e| e.to_string())
}

/// Spawn visible: abre una consola (CREATE_NEW_CONSOLE) para procesos interactivos como `opencode2`.
/// Si `auto_minimized` es false, la ventana es visible; si el exe es .bat, usa `cmd /c start`.
#[allow(dead_code)] // helper intencional para lanzar procesos interactivos con consola visible
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
    let (path, mime) = resolve_static(root, rel)?;
    let bytes = std::fs::read(&path).ok()?;
    Some((bytes, mime))
}

/// Resuelve `rel` bajo `root` con guard anti path-traversal y fallback a
/// `index.html` si es dir. Devuelve la ruta final y su mime.
fn resolve_static(root: &Path, rel: &str) -> Option<(PathBuf, &'static str)> {
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
    let mime = mime_for(&path);
    Some((path, mime))
}

/// Lee a `Bytes` sin copiar: `mmap` envuelto en `Bytes::from_owner` si el
/// archivo >4KB, si no `fs::read`. Para `Accept-Encoding: br` el caller debe
/// resolver `path.br` antes.
pub fn read_file_bytes(path: &Path) -> Option<Bytes> {
    if let Ok(meta) = std::fs::metadata(path) {
        if meta.len() > 4096 {
            if let Ok(file) = std::fs::File::open(path) {
                if let Ok(mmap) = unsafe { memmap2::Mmap::map(&file) } {
                    // Zero-copy: el `Mmap` es el owner del buffer del body.
                    return Some(Bytes::from_owner(mmap));
                }
            }
        }
    }
    Some(Bytes::from(std::fs::read(path).ok()?))
}

/// Sirve un estático como `Bytes` (mmap zero-copy para >4KB).
pub fn serve_file_bytes(root: &Path, rel: &str) -> Option<(Bytes, &'static str)> {
    let (path, mime) = resolve_static(root, rel)?;
    Some((read_file_bytes(&path)?, mime))
}

/// Compat `Vec<u8>` para los callers que mutan el body (preview/embed HTML).
/// El fast-path del shell usa `serve_file_bytes` para no copiar el `Mmap`.
pub fn serve_file_mmap(root: &Path, rel: &str) -> Option<(Vec<u8>, &'static str)> {
    serve_file_bytes(root, rel).map(|(bytes, mime)| (bytes.to_vec(), mime))
}

/// Parse JSON con `simd-json` en UNA pasada si el payload >1KB, fallback a
/// `serde_json` sobre los bytes originales si simd falla.
pub fn parse_json_simd(bytes: &mut [u8]) -> Result<serde_json::Value, String> {
    if bytes.len() > 1024 {
        // simd-json muta el buffer in-place (unescapes): trabajamos sobre una
        // copia para poder caer a serde_json con los bytes originales intactos.
        let mut buf = bytes.to_vec();
        // Una sola pasada simd_json -> serde_json::Value (antes:
        // to_owned_value -> to_string -> from_str, dos parses y una copia).
        if let Ok(v) = simd_json::serde::from_slice::<serde_json::Value>(&mut buf) {
            return Ok(v);
        }
    }
    serde_json::from_slice(bytes).map_err(|e| e.to_string())
}

#[cfg(test)]
mod perf_bench {
    use super::parse_json_simd;
    use std::time::{Duration, Instant};

    /// Implementación previa (R1) para comparar: simd -> OwnedValue -> String -> serde.
    fn old_parse(bytes: &mut [u8]) -> serde_json::Value {
        if bytes.len() > 1024 {
            let mut v = bytes.to_vec();
            match simd_json::to_owned_value(&mut v) {
                Ok(val) => {
                    let s = serde_json::to_string(&val).unwrap();
                    serde_json::from_str(&s).unwrap()
                }
                Err(_) => serde_json::from_slice(bytes).unwrap(),
            }
        } else {
            serde_json::from_slice(bytes).unwrap()
        }
    }

    /// Variante: simd serde directo (la que quedó en `parse_json_simd`).
    fn simd_serde(bytes: &mut [u8]) -> serde_json::Value {
        let mut v = bytes.to_vec();
        simd_json::serde::from_slice::<serde_json::Value>(&mut v).unwrap()
    }

    /// Variante: serde_json puro.
    fn serde_only(bytes: &mut [u8]) -> serde_json::Value {
        serde_json::from_slice(bytes).unwrap()
    }

    fn payload(target: usize) -> Vec<u8> {
        // Items con escapes (`\"`, `\\`, `\u00f1`) para forzar el unescape real.
        let item = "{\"id\":123456,\"name\":\"a\\\"b\\\\c\\u00f1\"},";
        let mut s = String::with_capacity(target + 128);
        s.push_str("{\"items\":[");
        while s.len() < target {
            s.push_str(item);
        }
        s.push_str("{}]}");
        s.into_bytes()
    }

    fn per_iter<F: FnMut()>(iters: u32, mut f: F) -> Duration {
        let t = Instant::now();
        for _ in 0..iters {
            f();
        }
        t.elapsed() / iters
    }

    /// R1: `parse_json_simd` debe producir EXACTAMENTE el mismo `Value` que la
    /// implementación previa (misma semántica, un solo parse).
    #[test]
    fn parse_json_simd_matches_old() {
        let cases: Vec<Vec<u8>> = vec![
            br#"{"a":1,"b":"x\"y\\z","c":[true,null,1.5],"d":{"e":-2}}"#.to_vec(),
            format!(r#"{{"items":[{}0]}}"#, "{\"id\":123456,\"name\":\"a\\\"b\\\\c\\u00f1\\u2603\",\"ok\":true},".repeat(40)).into_bytes(),
            format!(r#"{{"n":[{}0]}}"#, "-0,9007199254740993,1e10,0.1,".repeat(80)).into_bytes(),
        ];
        for mut bytes in cases {
            let mut original = bytes.clone();
            let want = old_parse(&mut original);
            let got = parse_json_simd(&mut bytes).unwrap();
            assert_eq!(got, want, "divergencia con payload de {} bytes", bytes.len());
        }
    }

    #[test]
    #[ignore = "bench manual: cargo test --release perf_bench -- --ignored --nocapture"]
    fn bench_parse_simd_16k_16m() {
        // Rondas intercaladas + minimo por variante: la maquina tiene otros
        // agentes compilando, el minimo es el estimador menos contaminado.
        for target in [16 * 1024usize, 16 * 1024 * 1024] {
            let base = payload(target);
            let (iters, rounds) = if target > 1024 * 1024 { (3, 6) } else { (100, 8) };
            let mut a = Duration::MAX;
            let mut c = Duration::MAX;
            let mut d = Duration::MAX;
            let mut e = Duration::MAX;
            for _ in 0..rounds {
                a = a.min(per_iter(iters, || { let mut b = base.clone(); std::hint::black_box(old_parse(&mut b)); }));
                c = c.min(per_iter(iters, || { let mut b = base.clone(); std::hint::black_box(simd_serde(&mut b)); }));
                d = d.min(per_iter(iters, || { let mut b = base.clone(); std::hint::black_box(serde_only(&mut b)); }));
                e = e.min(per_iter(iters, || { let mut b = base.clone(); std::hint::black_box(parse_json_simd(&mut b).unwrap()); }));
            }
            println!(
                "payload={}B iters={} rounds={} A_old(OwnedValue+String+from_str)={:?} C_simdserde={:?} D_serdejson={:?} E_actual(parse_json_simd)={:?} A/E={:.2}x D/E={:.2}x",
                base.len(), iters, rounds, a, c, d, e,
                a.as_secs_f64() / e.as_secs_f64(),
                d.as_secs_f64() / e.as_secs_f64()
            );
        }
    }

}
