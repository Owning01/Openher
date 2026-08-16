//! OpenCode Desktop — shell portable que embebe la web app de OpenCode Mobile.
//!
//! F0: ventana wry (WebView2 del sistema) apuntando a un server local
//! (tiny_http) que sirve web/dist + API /shell/*. Todo vive junto al exe
//! (portable, sin escrituras en C:): data/ para estado y el user-data de
//! WebView2 se redirige a data/webview.

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tiny_http::{Header, Method, Response, Server, StatusCode};
use wry::{Rect, WebContext, WebView, WebViewBuilder};
use winit::application::ApplicationHandler;
use winit::dpi::{LogicalPosition, LogicalSize};
use winit::event::WindowEvent;
use winit::event_loop::{ActiveEventLoop, ControlFlow, EventLoop, EventLoopProxy};
use winit::window::{Window, WindowId};

const DEFAULT_PORT: u16 = 4848;
const DEFAULT_W: f64 = 1280.0;
const DEFAULT_H: f64 = 800.0;

// ============================================================ Config portable

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
struct ShellConfig {
    /// Config del server opencode que la web app usa por defecto
    /// (se inyecta en el localStorage del webview si no hay nada guardado).
    server: ServerConfigFile,
    /// Puerto del server local de la shell (0 = auto, se busca uno libre).
    port: u16,
    /// Iniciar minimizado a la bandeja.
    start_minimized: bool,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
struct ServerConfigFile {
    host: String,
    port: u16,
    username: String,
    password: String,
    use_ssl: bool,
}

impl Default for ShellConfig {
    fn default() -> Self {
        Self {
            server: ServerConfigFile::default(),
            port: DEFAULT_PORT,
            start_minimized: false,
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

/// data/ vive al lado del exe (portable, cero escrituras en C:).
fn data_dir() -> PathBuf {
    let exe = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("opencode-desktop.exe"));
    let dir = exe.parent().unwrap_or(Path::new("."));
    dir.join("data")
}

fn config_path() -> PathBuf {
    data_dir().join("config.json")
}

fn load_config() -> ShellConfig {
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

/// Carpeta con los estáticos de la web app: primero data/web-dist (release),
/// después rutas relativas al exe para desarrollo (target/.../web/dist).
fn web_dist_dir() -> Option<PathBuf> {
    if let Ok(env) = std::env::var("OPENCODE_DESKTOP_DIST") {
        let p = PathBuf::from(env);
        if p.join("index.html").exists() {
            return Some(p);
        }
    }
    let exe = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("opencode-desktop.exe"));
    let dir = exe.parent().unwrap_or(Path::new("."));
    let mut candidates = vec![dir.join("data").join("web-dist")];
    // target/release/opencode-desktop.exe -> ../../web/dist (dev)
    for up in 1..=3 {
        if let Some(base) = dir.ancestors().nth(up) {
            candidates.push(base.join("web").join("dist"));
        }
    }
    candidates.into_iter().find(|p| p.join("index.html").exists())
}

// ================================================================ Servidor

struct ShellServer {
    addr: String,
    port: u16,
    dist: Option<PathBuf>,
    config: Arc<ShellConfig>,
}

const MIME: &[(&str, &str)] = &[
    ("html", "text/html; charset=utf-8"),
    ("htm", "text/html; charset=utf-8"),
    ("js", "text/javascript; charset=utf-8"),
    ("mjs", "text/javascript; charset=utf-8"),
    ("css", "text/css; charset=utf-8"),
    ("json", "application/json"),
    ("svg", "image/svg+xml"),
    ("png", "image/png"),
    ("jpg", "image/jpeg"),
    ("jpeg", "image/jpeg"),
    ("webp", "image/webp"),
    ("ico", "image/x-icon"),
    ("woff", "font/woff"),
    ("woff2", "font/woff2"),
    ("ttf", "font/ttf"),
    ("map", "application/json"),
    ("txt", "text/plain; charset=utf-8"),
    ("md", "text/markdown; charset=utf-8"),
    ("wasm", "application/wasm"),
];

fn mime_for(path: &Path) -> &'static str {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    MIME.iter()
        .find(|(e, _)| *e == ext)
        .map(|(_, m)| *m)
        .unwrap_or("application/octet-stream")
}

/// Script inyectado en index.html: si la web app no tiene config de server
/// guardada (origen WebView2 limpio), usa la del config.json de la shell.
fn inject_config_script(cfg: &ShellConfig) -> String {
    let srv = &cfg.server;
    format!(
        r#"<script>
try {{
  const k = 'opencode.remote.server';
  if (!localStorage.getItem(k)) {{
    localStorage.setItem(k, JSON.stringify({{ host: {h:?}, port: {p}, username: {u:?}, password: {pw:?}, useSSL: {ssl} }}));
  }}
}} catch (e) {{}}
</script>"#,
        h = srv.host,
        p = srv.port,
        u = srv.username,
        pw = srv.password,
        ssl = srv.use_ssl,
    )
}

impl ShellServer {
    fn start(cfg: ShellConfig) -> std::io::Result<Arc<ShellServer>> {
        let config = Arc::new(cfg);
        let port = config.port;
        let mut server = None;
        let mut chosen = port;
        // Si el puerto configurado está ocupado, buscar uno libre hacia arriba.
        for p in port..(port + 200) {
            match Server::http(("127.0.0.1", p)) {
                Ok(s) => {
                    chosen = match s.server_addr() {
                        tiny_http::ListenAddr::IP(ip) => ip.port(),
                        #[cfg(unix)]
                        tiny_http::ListenAddr::Unix(_) => p,
                    };
                    server = Some(s);
                    break;
                }
                Err(_) => continue,
            }
        }
        let server = server.ok_or_else(|| {
            std::io::Error::new(std::io::ErrorKind::AddrInUse, "no free port found")
        })?;
        let dist = web_dist_dir();
        let srv = Arc::new(ShellServer {
            addr: format!("http://127.0.0.1:{chosen}"),
            port: chosen,
            dist,
            config,
        });
        let spawn = srv.clone();
        thread::Builder::new()
            .name("shell-http".into())
            .spawn(move || {
                for request in server.incoming_requests() {
                    let srv = spawn.clone();
                    thread::Builder::new()
                        .name("shell-req".into())
                        .spawn(move || srv.handle(request))
                        .ok();
                }
            })
            .ok();
        Ok(srv)
    }

    fn handle(&self, mut request: tiny_http::Request) {
        let url = request.url().to_string();
        let method = request.method().clone();

        // API de la shell (mismo origen que la web app).
        if url == "/shell/health" {
            let body = serde_json::json!({
                "ok": true,
                "app": "opencode-desktop",
                "version": env!("CARGO_PKG_VERSION"),
                "port": self.port,
                "dist": self.dist.is_some(),
            })
            .to_string();
            let _ = request.respond(
                Response::from_string(body)
                    .with_status_code(StatusCode(200))
                    .with_header(Header::from_bytes("Content-Type", "application/json").unwrap()),
            );
            return;
        }

        // Estáticos de la web app (solo GET).
        if method == Method::Get && self.dist.is_some() {
            let rel = url.split('?').next().unwrap_or(&url).trim_start_matches('/');
            let base = self.dist.as_ref().unwrap();
            let mut file = base.join(rel);
            if !file.starts_with(base) {
                file = base.join("index.html");
            }
            let mut bytes = if file.is_file() {
                std::fs::read(&file).ok()
            } else {
                None
            };
            // SPA fallback: rutas sin archivo -> index.html.
            if bytes.is_none() && !rel.contains('.') {
                file = base.join("index.html");
                bytes = std::fs::read(&file).ok();
            }
            if let Some(bytes) = bytes {
                let is_index = file.file_name().and_then(|n| n.to_str()) == Some("index.html");
                let mime = mime_for(&file);
                if is_index {
                    // Inyección de la config del server en el origen limpio.
                    if let Ok(mut s) = String::from_utf8(bytes.clone()) {
                        let inject = inject_config_script(&self.config);
                        if let Some(pos) = s.rfind("</head>") {
                            s.insert_str(pos, &inject);
                        } else {
                            s.push_str(&inject);
                        }
                        let _ = request.respond(
                            Response::from_string(s)
                                .with_status_code(StatusCode(200))
                                .with_header(Header::from_bytes("Content-Type", mime).unwrap())
                                .with_header(
                                    Header::from_bytes("Cache-Control", "no-cache").unwrap(),
                                ),
                        );
                        return;
                    }
                }
                let _ = request.respond(
                    Response::from_data(bytes)
                        .with_status_code(StatusCode(200))
                        .with_header(Header::from_bytes("Content-Type", mime).unwrap())
                        .with_header(Header::from_bytes("Cache-Control", "no-cache").unwrap()),
                );
                return;
            }
        }

        let _ = request.respond(
            Response::from_string("not found")
                .with_status_code(StatusCode(404))
                .with_header(Header::from_bytes("Content-Type", "text/plain").unwrap()),
        );
    }
}

// ====================================================== Ventana (wry/winit)

struct App {
    url: String,
    window: Option<Window>,
    webview: Option<WebView>,
    web_context: Option<WebContext>,
}

enum AppEvent {
    Quit,
    Restore,
}

impl ApplicationHandler<AppEvent> for App {
    fn resumed(&mut self, event_loop: &ActiveEventLoop) {
        if self.window.is_some() {
            return;
        }
        let mut attributes = Window::default_attributes();
        attributes.title = "OpenCode Desktop".to_string();
        attributes.inner_size = Some(LogicalSize::new(DEFAULT_W, DEFAULT_H).into());
        attributes.min_inner_size = Some(LogicalSize::new(720.0, 480.0).into());
        if let Ok(rgba) = load_window_icon() {
            attributes.window_icon = Some(rgba);
        }
        let Ok(window) = event_loop.create_window(attributes) else {
            event_loop.exit();
            return;
        };
        // WebView2 user-data redirigido a data/webview (portable, sin C:).
        let data = data_dir();
        let _ = std::fs::create_dir_all(data.join("webview"));
        let context = WebContext::new(Some(data.join("webview")));
        let ctx: &mut WebContext = self.web_context.get_or_insert(context);
        // with_web_context es una función asociada (construye el builder).
        let builder = WebViewBuilder::with_web_context(ctx).with_url(&self.url);
        match builder.build_as_child(&window) {
            Ok(wv) => {
                self.webview = Some(wv);
                self.window = Some(window);
            }
            Err(e) => {
                eprintln!("opencode-desktop: webview error: {e}");
                event_loop.exit();
            }
        }
    }

    fn window_event(&mut self, event_loop: &ActiveEventLoop, _id: WindowId, event: WindowEvent) {
        match event {
            WindowEvent::Resized(size) => {
                if let (Some(window), Some(webview)) = (&self.window, &self.webview) {
                    let size = size.to_logical::<f64>(window.scale_factor());
                    let _ = webview.set_bounds(Rect {
                        position: LogicalPosition::new(0, 0).into(),
                        size: LogicalSize::new(size.width, size.height).into(),
                    });
                }
            }
            WindowEvent::CloseRequested => {
                event_loop.exit();
            }
            _ => {}
        }
    }

    fn user_event(&mut self, event_loop: &ActiveEventLoop, event: AppEvent) {
        match event {
            AppEvent::Quit => event_loop.exit(),
            AppEvent::Restore => {
                if let Some(window) = &self.window {
                    window.set_visible(true);
                    window.focus_window();
                }
            }
        }
    }
}

/// Icono de la ventana: decodifica el 32x32 (BMP 32bpp) del .ico.
fn load_window_icon() -> Result<winit::window::Icon, Box<dyn std::error::Error>> {
    let icon_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("resources/icon.ico");
    let bytes = std::fs::read(icon_path)?;
    if bytes.len() < 6 {
        return Err("short ico".into());
    }
    let count = u16::from_le_bytes([bytes[4], bytes[5]]) as usize;
    for i in 0..count {
        let entry = &bytes[6 + i * 16..(6 + (i + 1) * 16).min(bytes.len())];
        let w = entry[0] as usize;
        let h = entry[1] as usize;
        if w != 32 || h != 32 {
            continue;
        }
        let size = u32::from_le_bytes([entry[8], entry[9], entry[10], entry[11]]) as usize;
        let offset = u32::from_le_bytes([entry[12], entry[13], entry[14], entry[15]]) as usize;
        if offset + size > bytes.len() {
            continue;
        }
        let data = &bytes[offset..offset + size];
        if data.len() >= 40 + 32 * 32 * 4 {
            let mut rgba = vec![0u8; 32 * 32 * 4];
            for y in 0..32 {
                for x in 0..32 {
                    let src = 40 + (31 - y) * 32 * 4 + x * 4;
                    let dst = (y * 32 + x) * 4;
                    rgba[dst] = data[src + 2];
                    rgba[dst + 1] = data[src + 1];
                    rgba[dst + 2] = data[src];
                    rgba[dst + 3] = data[src + 3];
                }
            }
            return Ok(winit::window::Icon::from_rgba(rgba, 32, 32)?);
        }
    }
    Err("no 32x32 bmp in ico".into())
}

// ================================================================ Tray icon

fn setup_tray(proxy: EventLoopProxy<AppEvent>) -> Result<(), Box<dyn std::error::Error>> {
    use tray_icon::menu::{Menu, MenuItem};
    use tray_icon::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

    let quit = MenuItem::new("Salir", true, None);
    let open = MenuItem::new("Abrir OpenCode Desktop", true, None);
    let menu = Menu::new();
    menu.append(&open)?;
    menu.append(&quit)?;
    let icon = tray_icon::Icon::from_path(
        Path::new(env!("CARGO_MANIFEST_DIR")).join("resources/icon.ico"),
        Some((32, 32)),
    )?;
    let tray = TrayIconBuilder::new()
        .with_menu(Box::new(menu))
        .with_tooltip("OpenCode Desktop")
        .with_icon(icon)
        .build()?;
    // El tray debe vivir toda la app.
    std::mem::forget(tray);

    let (tx, rx) = std::sync::mpsc::channel::<tray_icon::menu::MenuEvent>();
    tray_icon::menu::MenuEvent::set_event_handler(Some(move |event| {
        let _ = tx.send(event);
    }));
    let q_id = quit.id().clone();
    let o_id = open.id().clone();
    let proxy_thread = proxy.clone();
    thread::spawn(move || loop {
        match rx.recv_timeout(Duration::from_millis(200)) {
            Ok(event) if event.id() == &q_id => {
                let _ = proxy_thread.send_event(AppEvent::Quit);
                break;
            }
            Ok(event) if event.id() == &o_id => {
                let _ = proxy_thread.send_event(AppEvent::Restore);
            }
            _ => {}
        }
    });
    let _ = TrayIconEvent::set_event_handler(Some(move |event: TrayIconEvent| {
        if let TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
        } = event
        {
            let _ = proxy.send_event(AppEvent::Restore);
        }
    }));
    Ok(())
}

fn main() {
    let cfg = load_config();
    let server = match ShellServer::start(cfg.clone()) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("opencode-desktop: no se pudo iniciar el server: {e}");
            std::process::exit(1);
        }
    };
    match &server.dist {
        Some(dist) => println!("opencode-desktop: sirviendo {} en {}", dist.display(), server.addr),
        None => println!("opencode-desktop: AVISO - web/dist no encontrado; la app estará vacía"),
    }

    let event_loop = EventLoop::with_user_event().build().unwrap();
    event_loop.set_control_flow(ControlFlow::Wait);
    let proxy = event_loop.create_proxy();

    if let Err(e) = setup_tray(proxy) {
        eprintln!("opencode-desktop: tray no disponible: {e}");
    }

    let mut app = App {
        url: server.addr.clone(),
        window: None,
        webview: None,
        web_context: None,
    };
    event_loop.run_app(&mut app).unwrap();
}
