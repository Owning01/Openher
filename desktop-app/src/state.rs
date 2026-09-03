//! Estado compartido + utilidades de la shell (config, estado persistido,
//! autostart, ayuda JSON).

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicIsize, Ordering};
use std::sync::{Arc, RwLock};

pub static WINDOW_HWND: AtomicIsize = AtomicIsize::new(0);

#[derive(Clone, Copy, Debug)]
pub enum WindowAction {
    Drag,
    Minimize,
    MaximizeToggle,
    Close,
}

static WINDOW_ACTION_FN: std::sync::OnceLock<Arc<dyn Fn(WindowAction) + Send + Sync>> =
    std::sync::OnceLock::new();

pub fn set_window_action_handler(f: Arc<dyn Fn(WindowAction) + Send + Sync>) {
    let _ = WINDOW_ACTION_FN.set(f);
}

pub fn request_window_action(a: WindowAction) -> bool {
    if let Some(f) = WINDOW_ACTION_FN.get() {
        f(a);
        true
    } else {
        false
    }
}

#[cfg(windows)]
pub fn window_is_maximized() -> bool {
    let h = WINDOW_HWND.load(Ordering::Relaxed);
    if h == 0 {
        return false;
    }
    unsafe { windows_sys::Win32::UI::WindowsAndMessaging::IsZoomed(h as *mut core::ffi::c_void) != 0 }
}

#[cfg(windows)]
pub fn window_minimize() {
    if request_window_action(WindowAction::Minimize) {
        return;
    }
    let h = WINDOW_HWND.load(Ordering::Relaxed);
    if h == 0 {
        return;
    }
    unsafe {
        windows_sys::Win32::UI::WindowsAndMessaging::ShowWindow(
            h as *mut core::ffi::c_void,
            6, // SW_MINIMIZE
        );
    }
}

#[cfg(windows)]
pub fn window_maximize_toggle() {
    if request_window_action(WindowAction::MaximizeToggle) {
        return;
    }
    let h = WINDOW_HWND.load(Ordering::Relaxed);
    if h == 0 {
        return;
    }
    unsafe {
        let is_max = windows_sys::Win32::UI::WindowsAndMessaging::IsZoomed(h as *mut core::ffi::c_void) != 0;
        if is_max {
            windows_sys::Win32::UI::WindowsAndMessaging::ShowWindow(
                h as *mut core::ffi::c_void,
                9, // SW_RESTORE
            );
        } else {
            windows_sys::Win32::UI::WindowsAndMessaging::ShowWindow(
                h as *mut core::ffi::c_void,
                3, // SW_MAXIMIZE
            );
        }
    }
}

#[cfg(windows)]
pub fn window_close() {
    if request_window_action(WindowAction::Close) {
        return;
    }
    let h = WINDOW_HWND.load(Ordering::Relaxed);
    if h == 0 {
        return;
    }
    unsafe {
        windows_sys::Win32::UI::WindowsAndMessaging::PostMessageW(
            h as *mut core::ffi::c_void,
            0x0010, // WM_CLOSE
            0,
            0,
        );
    }
}

#[cfg(windows)]
pub fn window_drag() {
    if request_window_action(WindowAction::Drag) {
        return;
    }
    let h = WINDOW_HWND.load(Ordering::Relaxed);
    if h == 0 {
        return;
    }
    unsafe {
        windows_sys::Win32::UI::Input::KeyboardAndMouse::ReleaseCapture();
        windows_sys::Win32::UI::WindowsAndMessaging::SendMessageW(
            h as *mut core::ffi::c_void,
            0x00A1, // WM_NCLBUTTONDOWN
            2,      // HTCAPTION
            0,
        );
    }
}

#[cfg(not(windows))]
pub fn window_is_maximized() -> bool {
    false
}
#[cfg(not(windows))]
pub fn window_minimize() {}
#[cfg(not(windows))]
pub fn window_maximize_toggle() {}
#[cfg(not(windows))]
pub fn window_close() {}
#[cfg(not(windows))]
pub fn window_drag() {}

use serde::{Deserialize, Serialize};

pub const DEFAULT_PORT: u16 = 4848;

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct ShellConfig {
    pub server: ServerConfigFile,
    pub port: u16,
    pub start_minimized: bool,
    /// Shell para terminales (cmd.exe, powershell.exe, etc.).
    pub shell: String,
    /// Comando para arrancar el server opencode (bat/exe). Vacío = no arranca.
    pub start_command: String,
    /// Puertos que se sondean para el estado del server.
    pub server_ports: Vec<u16>,
    /// Raíz de la documentación de opencode (solo lectura).
    pub docs_root: String,
    /// Handles de X para el feed de updates (best-effort).
    pub x_handles: Vec<String>,
    /// Aplicaciones del Labs (exe o bat, con título).
    pub labs_apps: Vec<LabsApp>,
    /// Ruta del desktop-agent.exe para Labs.
    pub desktop_agent_path: String,
    /// Cuentas GitHub (repo/repo) para el feed de updates.
    pub github_repos: Vec<String>,
    /// API key Cerebras para Quick Chat
    pub cerebras_api_key: String,
    pub groq_api_key: String,
    pub quickchat_provider: String,
    pub quickchat_model: String,
    /// Auto-abrir `opencode2` en una terminal al iniciar la app.
    pub auto_opencode2: bool,
    #[serde(default)]
    pub opencode2_enabled: bool,
    #[serde(default = "default_opencode2_port")]
    pub opencode2_port: u16,
    #[serde(default)]
    pub opencode2_command: String,
}

fn default_opencode2_port() -> u16 {
    4097
}

#[derive(Serialize, Deserialize, Clone)]
pub struct LabsApp {
    pub id: String,
    pub title: String,
    pub path: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct ServerConfigFile {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub use_ssl: bool,
}

impl Default for ShellConfig {
    fn default() -> Self {
        Self {
            server: ServerConfigFile::default(),
            port: DEFAULT_PORT,
            start_minimized: false,
            shell: crate::ptyx::default_shell(),
            start_command: String::new(),
            server_ports: vec![4096, 4097],
            docs_root: String::new(),
            x_handles: vec!["opencode".into(), "dax_rai".into()],
            labs_apps: Vec::new(),
            desktop_agent_path: String::new(),
            github_repos: vec!["sst/opencode".into()],
            cerebras_api_key: String::new(),
            groq_api_key: String::new(),
            quickchat_provider: String::new(),
            quickchat_model: String::new(),
            auto_opencode2: false,
            opencode2_enabled: false,
            opencode2_port: 4097,
            opencode2_command: String::new(),
        }
    }
}

impl Default for ServerConfigFile {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".into(),
            port: 4096,
            username: "opencode".into(),
            password: String::new(),
            use_ssl: false,
        }
    }
}

/// Estado persistido (ventana, sesiones, tabs) en data/state.json.
#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct PersistedState {
    pub window_w: Option<f64>,
    pub window_h: Option<f64>,
    pub last_panels: Vec<serde_json::Value>,
}

pub struct ExternalManager {
    pub procs: std::sync::Mutex<std::collections::HashMap<String, std::process::Child>>,
    pub urls: std::sync::Mutex<std::collections::HashMap<String, String>>,
}
impl ExternalManager {
    pub fn new() -> Self { Self { procs: std::sync::Mutex::new(std::collections::HashMap::new()), urls: std::sync::Mutex::new(std::collections::HashMap::new()) } }
}

pub struct AppState {
    pub config: RwLock<ShellConfig>,
    pub persisted: RwLock<PersistedState>,
    pub port: u16,
    pub pty: Arc<crate::ptyx::PtyRegistry>,
    pub kanban: crate::kanban::KanbanStore,
    pub plugins: crate::plugins::PluginRegistry,
    pub servers: crate::srvman::ServerManager,
    pub stats: crate::statsx::StatsManager,
    pub dist: Option<PathBuf>,
    /// Manager para enviar comandos al sub-WebView (main thread).
    pub browser: crate::browser_view::SubWebViewManager,
    /// Picks del modo inspección visual: el JS inyectado en el sub-WebView
    /// hace POST aquí y el host hace polling con GET (drena la cola).
    pub browser_picks: std::sync::Mutex<Vec<String>>,
    /// Raíces de proyectos para auto-servir en el panel navegador/diseño.
    pub projects: std::sync::RwLock<std::collections::HashMap<String, PathBuf>>,
    /// Procesos externos on-demand (screenshots, vioeditor, informes, widget_notas) — auto start/stop al abrir pestaña.
    pub external: Arc<ExternalManager>,
}

/// data/ vive al lado del exe (portable, cero escrituras en C:).
pub fn data_dir() -> PathBuf {
    let exe = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("opencode-desktop.exe"));
    let dir = exe.parent().unwrap_or(Path::new("."));
    dir.join("data")
}

pub fn config_path() -> PathBuf {
    data_dir().join("config.json")
}

pub fn state_path() -> PathBuf {
    data_dir().join("state.json")
}

pub fn geometry_path() -> PathBuf {
    data_dir().join("window-geometry.json")
}

pub fn cache_dir() -> PathBuf {
    data_dir().join("cache")
}

pub fn plugins_dir() -> PathBuf {
    data_dir().join("plugins")
}

pub fn kanban_path() -> PathBuf {
    data_dir().join("kanban.json")
}

pub fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

pub fn load_config() -> ShellConfig {
    let path = config_path();
    if let Ok(raw) = std::fs::read_to_string(&path) {
        if let Ok(cfg) = serde_json::from_str::<ShellConfig>(&raw) {
            return cfg;
        }
    }
    let cfg = ShellConfig::default();
    let _ = std::fs::create_dir_all(data_dir());
    let _ = std::fs::write(&path, serde_json::to_string_pretty(&cfg).unwrap_or_default());
    cfg
}

pub fn save_config(cfg: &ShellConfig) {
    let _ = std::fs::create_dir_all(data_dir());
    let path = config_path();
    let tmp = path.with_extension("json.tmp");
    let data = serde_json::to_string_pretty(cfg).unwrap_or_default();
    if std::fs::write(&tmp, &data).is_ok() {
        if let Ok(f) = std::fs::File::open(&tmp) { let _ = f.sync_all(); }
        let _ = std::fs::rename(&tmp, &path);
    } else {
        let _ = std::fs::write(&path, &data);
    }
}

pub fn load_persisted() -> PersistedState {
    if let Ok(raw) = std::fs::read_to_string(state_path()) {
        if let Ok(s) = serde_json::from_str(&raw) {
            return s;
        }
    }
    PersistedState::default()
}

pub fn save_persisted(s: &PersistedState) {
    let _ = std::fs::create_dir_all(data_dir());
    let path = state_path();
    let tmp = path.with_extension("json.tmp");
    let data = serde_json::to_string_pretty(s).unwrap_or_default();
    if std::fs::write(&tmp, &data).is_ok() {
        if let Ok(f) = std::fs::File::open(&tmp) { let _ = f.sync_all(); }
        let _ = std::fs::rename(&tmp, &path);
    } else {
        let _ = std::fs::write(&path, &data);
    }
}

/// Geometría de la ventana (posición + tamaño en lógico) persistida entre
/// ejecuciones para reabrir la app donde el usuario la dejó.
#[derive(Serialize, Deserialize, Clone, Default)]
pub struct WindowGeometry {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    /// Factor de escala (DPI) al que se midió la geometría.
    pub scale: f64,
}

pub fn load_window_geometry() -> Option<WindowGeometry> {
    let raw = std::fs::read_to_string(geometry_path()).ok()?;
    serde_json::from_str::<WindowGeometry>(&raw).ok()
}

pub fn save_window_geometry(g: &WindowGeometry) {
    let _ = std::fs::create_dir_all(data_dir());
    let path = geometry_path();
    let tmp = path.with_extension("json.tmp");
    let data = serde_json::to_string_pretty(g).unwrap_or_default();
    if std::fs::write(&tmp, &data).is_ok() {
        if let Ok(f) = std::fs::File::open(&tmp) { let _ = f.sync_all(); }
        let _ = std::fs::rename(&tmp, &path);
    } else {
        let _ = std::fs::write(&path, &data);
    }
}

/// Raíz de docs de opencode: config -> env -> checkout local del repo.
pub fn docs_root(cfg: &ShellConfig) -> PathBuf {
    if !cfg.docs_root.is_empty() {
        let p = PathBuf::from(&cfg.docs_root);
        if p.exists() {
            return p;
        }
    }
    if let Ok(env) = std::env::var("OPENCODE_DOCS_ROOT") {
        let p = PathBuf::from(env);
        if p.exists() {
            return p;
        }
    }
    // Fallback portable: busca un checkout de opencode relativo al exe o en
    // el home del usuario (OPENCODE_HOME/opencode), evitando rutas hard-codeadas.
    if let Ok(home) = std::env::var("OPENCODE_HOME") {
        let p = PathBuf::from(&home).join("opencode");
        if p.exists() {
            return p;
        }
    }
    if let Ok(home) = std::env::var("USERPROFILE").or_else(|_| std::env::var("HOME")) {
        let p = PathBuf::from(home).join("opencode");
        if p.exists() {
            return p;
        }
    }
    data_dir()
}

// ================================================================ Autostart

pub fn autostart_enabled() -> bool {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(run) = hkcu.open_subkey(r"Software\Microsoft\Windows\CurrentVersion\Run") {
        return run.get_value::<String, _>("OpenCodeDesktop").is_ok();
    }
    false
}

pub fn set_autostart(enabled: bool) -> Result<(), String> {
    use winreg::enums::{HKEY_CURRENT_USER, KEY_READ, KEY_SET_VALUE};
    use winreg::RegKey;
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let run = hkcu
        .open_subkey_with_flags(
            r"Software\Microsoft\Windows\CurrentVersion\Run",
            KEY_SET_VALUE | KEY_READ,
        )
        .map_err(|e| e.to_string())?;
    if enabled {
        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let cmd = format!("\"{}\" --autostart", exe.display());
        run.set_value("OpenCodeDesktop", &cmd).map_err(|e| e.to_string())?;
    } else {
        let _ = run.delete_value("OpenCodeDesktop");
    }
    Ok(())
}

// ================================================================== Helpers

pub fn json_ok(body: &serde_json::Value) -> tiny_http::Response<std::io::Cursor<Vec<u8>>> {
    tiny_http::Response::from_string(body.to_string())
        .with_status_code(200)
        .with_header(
            tiny_http::Header::from_bytes("Content-Type", "application/json; charset=utf-8")
                .unwrap(),
        )
        .with_header(tiny_http::Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap())
        .with_header(tiny_http::Header::from_bytes("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD").unwrap())
        .with_header(tiny_http::Header::from_bytes("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept").unwrap())
        .with_header(tiny_http::Header::from_bytes("Access-Control-Expose-Headers", "Content-Length, Content-Type, Content-Disposition, Authorization").unwrap())
}

pub fn json_err(code: u16, msg: &str) -> tiny_http::Response<std::io::Cursor<Vec<u8>>> {
    tiny_http::Response::from_string(serde_json::json!({ "error": msg }).to_string())
        .with_status_code(tiny_http::StatusCode(code))
        .with_header(
            tiny_http::Header::from_bytes("Content-Type", "application/json; charset=utf-8")
                .unwrap(),
        )
        .with_header(tiny_http::Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap())
        .with_header(tiny_http::Header::from_bytes("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD").unwrap())
        .with_header(tiny_http::Header::from_bytes("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept").unwrap())
        .with_header(tiny_http::Header::from_bytes("Access-Control-Expose-Headers", "Content-Length, Content-Type, Content-Disposition, Authorization").unwrap())
}

/// Lee el body de un request HTTP y lo parsea como JSON.
/// Cap de 16 MB para evitar OOM con payloads maliciosos o accidentsales
/// (base64 de archivos grandes, uploads sin límite).
pub fn read_body(req: &mut tiny_http::Request) -> Result<serde_json::Value, String> {
    const MAX_BODY_BYTES: usize = 16 * 1024 * 1024; // 16 MB
    let mut buf = Vec::new();
    let reader = req.as_reader();
    let mut total = 0usize;
    let mut chunk = [0u8; 8192];
    loop {
        let n = reader.read(&mut chunk).map_err(|e| format!("read error: {e}"))?;
        if n == 0 { break }
        total += n;
        if total > MAX_BODY_BYTES {
            return Err(format!("body too large: >{MAX_BODY_BYTES} bytes"))
        }
        buf.extend_from_slice(&chunk[..n]);
    }
    // simd-json fast path >1KB, fallback serde
    if buf.len() > 1024 {
        crate::common::parse_json_simd(&mut buf)
    } else {
        let s = String::from_utf8_lossy(&buf);
        serde_json::from_str(&s).map_err(|e| format!("json inválido: {e}"))
    }
}

/// Escapa un path para salida JSON sin romper backslashes.
pub fn pstring(p: &Path) -> String {
    p.to_string_lossy().to_string()
}

/// Base64 estándar (con padding) para bytes arbitrarios.
pub fn base64_encode(data: &[u8]) -> String {
    const T: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity(data.len().div_ceil(3) * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = *chunk.get(1).unwrap_or(&0) as u32;
        let b2 = *chunk.get(2).unwrap_or(&0) as u32;
        let n = (b0 << 16) | (b1 << 8) | b2;
        out.push(T[(n >> 18) as usize & 63] as char);
        out.push(T[(n >> 12) as usize & 63] as char);
        out.push(if chunk.len() > 1 { T[(n >> 6) as usize & 63] as char } else { '=' });
        out.push(if chunk.len() > 2 { T[n as usize & 63] as char } else { '=' });
    }
    out
}

pub fn base64_decode(input: &str) -> Result<Vec<u8>, String> {
    let mut out = Vec::new();
    let mut buf = 0u32;
    let mut bits = 0;
    for &b in input.as_bytes() {
        let val = match b {
            b'A'..=b'Z' => (b - b'A') as u32,
            b'a'..=b'z' => (b - b'a' + 26) as u32,
            b'0'..=b'9' => (b - b'0' + 52) as u32,
            b'+' => 62,
            b'/' => 63,
            b'=' | b'\r' | b'\n' | b' ' => continue,
            _ => return Err(format!("carácter base64 inválido: {}", b as char)),
        };
        buf = (buf << 6) | val;
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            out.push((buf >> bits) as u8);
        }
    }
    Ok(out)
}