//! Estado compartido + utilidades de la shell (config, estado persistido,
//! autostart, ayuda JSON).

use std::path::{Path, PathBuf};
use std::sync::RwLock;

use serde::{Deserialize, Serialize};

pub const DEFAULT_PORT: u16 = 4848;

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct ShellConfig {
    pub server: ServerConfigFile,
    pub port: u16,
    pub start_minimized: bool,
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
            start_command: String::new(),
            server_ports: vec![4096, 4097],
            docs_root: String::new(),
            x_handles: vec!["opencode".into(), "dax_rai".into()],
            labs_apps: Vec::new(),
            desktop_agent_path: String::new(),
            github_repos: vec!["sst/opencode".into()],
        }
    }
}

impl Default for ServerConfigFile {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".into(),
            port: 4096,
            username: "opencode".into(),
            password: "octavio".into(),
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

pub struct AppState {
    pub config: RwLock<ShellConfig>,
    pub persisted: RwLock<PersistedState>,
    pub pty: crate::ptyx::PtyRegistry,
    pub kanban: crate::kanban::KanbanStore,
    pub plugins: crate::plugins::PluginRegistry,
    pub servers: crate::srvman::ServerManager,
    pub stats: crate::statsx::StatsManager,
    pub cache: RwLock<std::collections::HashMap<String, String>>,
    pub dist: Option<PathBuf>,
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
    let _ = std::fs::write(config_path(), serde_json::to_string_pretty(cfg).unwrap_or_default());
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
    let _ = std::fs::write(state_path(), serde_json::to_string_pretty(s).unwrap_or_default());
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
    for base in ["G:\\Proyectos\\opencode", "C:\\Users\\Octavio\\opencode"] {
        let p = PathBuf::from(base);
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
}

pub fn json_err(code: u16, msg: &str) -> tiny_http::Response<std::io::Cursor<Vec<u8>>> {
    tiny_http::Response::from_string(serde_json::json!({ "error": msg }).to_string())
        .with_status_code(tiny_http::StatusCode(code))
        .with_header(
            tiny_http::Header::from_bytes("Content-Type", "application/json; charset=utf-8")
                .unwrap(),
        )
}

pub fn read_body(req: &mut tiny_http::Request) -> Result<serde_json::Value, String> {
    use std::io::Read;
    let mut buf = Vec::new();
    let _ = req.as_reader().read_to_end(&mut buf);
    let s = String::from_utf8_lossy(&buf);
    serde_json::from_str(&s).map_err(|e| format!("json inválido: {e}"))
}

/// Escapa un path para salida JSON sin romper backslashes.
pub fn pstring(p: &Path) -> String {
    p.to_string_lossy().to_string()
}