//! Self-update del desktop (OpenHer).
//!
//! La máquina que compila publica `openher-desktop.zip` (exe + data/web-dist)
//! junto a `openher-version.json`. Una instalación remota (notebook conectada
//! a un server no-local) descarga ese zip, verifica sha256, lo extrae en
//! `data/cache/desktop-update/` y deja un helper `.cmd` que:
//!   1) espera a que este proceso salga (Windows lockea el .exe en uso),
//!   2) copia el exe y hace espejo de `data/web-dist`,
//!   3) relanza la app.
//!
//! El download corre en un thread aparte: el endpoint responde al instante y
//! la web hace polling de `/shell/app-update/status`.

use std::io::Read;
use std::path::{Path, PathBuf};
use std::time::Duration;

use sha2::{Digest, Sha256};

use crate::state::{cache_dir, request_app_quit};

#[derive(Default, Clone, serde::Serialize)]
pub struct UpdateStatus {
    /// idle | downloading | verifying | extracting | ready | error
    pub state: String,
    pub error: Option<String>,
    pub received: u64,
    pub total: u64,
}

static STATUS: std::sync::OnceLock<std::sync::Mutex<UpdateStatus>> = std::sync::OnceLock::new();

fn status_cell() -> &'static std::sync::Mutex<UpdateStatus> {
    STATUS.get_or_init(|| {
        std::sync::Mutex::new(UpdateStatus {
            state: "idle".into(),
            ..Default::default()
        })
    })
}

fn set_status(state: &str, error: Option<String>, received: u64, total: u64) {
    if let Ok(mut s) = status_cell().lock() {
        s.state = state.to_string();
        s.error = error;
        s.received = received;
        s.total = total;
    }
}

pub fn status_json() -> serde_json::Value {
    let s = status_cell().lock().map(|s| s.clone()).unwrap_or_default();
    serde_json::json!({ "state": s.state, "error": s.error, "received": s.received, "total": s.total })
}

fn exe_dir() -> PathBuf {
    std::env::current_exe()
        .ok()
        .and_then(|e| e.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."))
}

/// Versión instalada: la escribe `update-app.ps1` en `data/web-dist/build-info.json`
/// (misma que la APK). Fallback: la versión del crate.
pub fn version_json() -> serde_json::Value {
    let dir = exe_dir();
    let info = dir.join("data").join("web-dist").join("build-info.json");
    let v: serde_json::Value = std::fs::read_to_string(&info)
        .ok()
        // PowerShell Out-File -Encoding utf8 agrega BOM: serde_json lo rechaza.
        .and_then(|raw| serde_json::from_str(raw.trim_start_matches('\u{feff}')).ok())
        .unwrap_or_else(|| serde_json::json!({}));
    serde_json::json!({
        "version": v.get("version").and_then(|x| x.as_str()).unwrap_or(env!("CARGO_PKG_VERSION")),
        "versionCode": v.get("versionCode").and_then(|x| x.as_u64()).unwrap_or(0),
        "builtAt": v.get("builtAt").cloned().unwrap_or(serde_json::Value::Null),
        "exe": dir.to_string_lossy(),
    })
}

fn sha256_file(path: &Path) -> Result<String, String> {
    let mut f = std::fs::File::open(path).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 64 * 1024];
    loop {
        let n = f.read(&mut buf).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

/// Lanza el update en background: descarga, verifica, extrae, deja el helper
/// y cierra la app para que el helper pueda reemplazar el .exe.
pub fn run(url: String, sha256: String) {
    match apply_inner(&url, &sha256) {
        Ok(()) => {
            set_status("ready", None, 0, 0);
            // Deja ver "ready" en el polling antes de cerrar.
            std::thread::sleep(Duration::from_millis(1500));
            request_app_quit();
        }
        Err(e) => {
            let (received, total) = status_cell()
                .lock()
                .map(|s| (s.received, s.total))
                .unwrap_or((0, 0));
            set_status("error", Some(e), received, total);
        }
    }
}

fn apply_inner(url: &str, expected_sha: &str) -> Result<(), String> {
    let dir = exe_dir();
    let cache = cache_dir();
    std::fs::create_dir_all(&cache).map_err(|e| format!("cache: {e}"))?;
    let zip_path = cache.join("openher-desktop-update.zip");
    set_status("downloading", None, 0, 0);

    let resp = ureq::get(url)
        .timeout(Duration::from_secs(600))
        .call()
        .map_err(|e| format!("descarga fallo: {e}"))?;
    let total: u64 = resp
        .header("content-length")
        .and_then(|v| v.parse().ok())
        .unwrap_or(0);
    let mut reader = resp.into_reader();
    let mut out = std::fs::File::create(&zip_path).map_err(|e| format!("crear zip: {e}"))?;
    let mut received: u64 = 0;
    let mut buf = [0u8; 128 * 1024];
    {
        use std::io::Write;
        loop {
            let n = reader.read(&mut buf).map_err(|e| format!("leer: {e}"))?;
            if n == 0 {
                break;
            }
            out.write_all(&buf[..n]).map_err(|e| format!("escribir: {e}"))?;
            received += n as u64;
            if received % (1024 * 1024) < 128 * 1024 {
                set_status("downloading", None, received, total);
            }
        }
    }
    drop(out);

    set_status("verifying", None, received, total);
    let got = sha256_file(&zip_path)?;
    if !expected_sha.trim().is_empty() && !got.eq_ignore_ascii_case(expected_sha.trim()) {
        return Err(format!(
            "sha256 no coincide (esperado {expected_sha}, obtenido {got})"
        ));
    }

    let stage = cache.join("desktop-update");
    let _ = std::fs::remove_dir_all(&stage);
    std::fs::create_dir_all(&stage).map_err(|e| format!("staging: {e}"))?;
    set_status("extracting", None, received, total);
    let ps = format!(
        "Expand-Archive -LiteralPath '{}' -DestinationPath '{}' -Force",
        zip_path.display(),
        stage.display()
    );
    let st = std::process::Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", &ps])
        .status()
        .map_err(|e| format!("powershell: {e}"))?;
    if !st.success() {
        return Err("Expand-Archive fallo".into());
    }
    if !stage.join("openher-desktop.exe").is_file() {
        return Err("el zip no trae openher-desktop.exe".into());
    }

    // Helper (PowerShell): espera al PID, reintenta copiar el exe, espeja
    // web-dist sin tocar los artefactos publicados y relanza. Logea todo en
    // data/cache/openher-update.log para poder diagnosticar fallas.
    let pid = std::process::id();
    let helper = cache.join("openher-apply-update.ps1");
    let log_path = cache.join("openher-update.log");
    let script = format!(
        r#"$ErrorActionPreference = 'Continue'
$log = '{log}'
function Log($m) {{ "$((Get-Date).ToString('s')) $m" | Out-File -Append -Encoding utf8 $log }}
try {{
  Log 'esperando salida del proceso {pid}'
  Wait-Process -Id {pid} -Timeout 600 -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 500
  Log 'copiando exe'
  for ($i = 0; $i -lt 30; $i++) {{
    try {{ Copy-Item -LiteralPath '{stage}\openher-desktop.exe' -Destination '{dir}\openher-desktop.exe' -Force -ErrorAction Stop; break }}
    catch {{ Start-Sleep -Milliseconds 500 }}
  }}
  if (Test-Path '{stage}\data\web-dist\index.html') {{
    Log 'espejando web-dist'
    robocopy '{stage}\data\web-dist' '{dir}\data\web-dist' /MIR /XF openher.apk openher-version.json openher-desktop.zip /NFL /NDL /NJH /NJS /NP | Out-Null
  }}
  Log 'relanzando'
  Start-Process -FilePath '{dir}\openher-desktop.exe' -WorkingDirectory '{dir}'
  Remove-Item -Recurse -Force '{stage}' -ErrorAction SilentlyContinue
  Log 'ok'
}} catch {{
  Log "error: $($_.Exception.Message)"
}} finally {{
  Remove-Item -LiteralPath $MyInvocation.MyCommand.Path -Force -ErrorAction SilentlyContinue
}}
"#,
        log = log_path.display(),
        pid = pid,
        stage = stage.display(),
        dir = dir.display()
    );
    std::fs::write(&helper, script).map_err(|e| format!("helper: {e}"))?;

    #[cfg(windows)]
    use std::os::windows::process::CommandExt;
    let mut cmd = std::process::Command::new("powershell");
    cmd.args([
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
    ])
    .arg(&helper)
    .stdin(std::process::Stdio::null())
    .stdout(std::process::Stdio::null())
    .stderr(std::process::Stdio::null());
    #[cfg(windows)]
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW (sin DETACHED: los handles nulos mataban al helper)
    let child = cmd.spawn().map_err(|e| format!("spawn helper: {e}"))?;
    {
        use std::io::Write;
        if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(&log_path) {
            let _ = writeln!(f, "helper ps1 lanzado pid={}", child.id());
        }
    }
    Ok(())
}
