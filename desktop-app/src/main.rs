//! OpenCode Desktop — shell portable que embebe la web app de OpenCode Mobile.
//!
//! F0-F4: ventana wry (WebView2) + server local (tiny_http) que sirve
//! web/dist y la API /shell/* (explorador, terminales, kanban, updates,
//! docs, stats, plugins, labs, config, autostart, sesiones). Portable:
//! data/ junto al exe, sin escrituras en C:.

// App GUI de Windows: sin ventana de terminal.
#![windows_subsystem = "windows"]

mod api;
mod browser_view;
mod common;
mod docsx;
mod fsx;
mod gitx;
mod kanban;
mod plugins;
mod ptyx;
mod srvman;
mod state;
mod statsx;
mod updates;
mod doc_engine;

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

use state::AppState;
use tiny_http::Server;
use wry::{Rect, WebContext, WebView, WebViewBuilder, WebViewBuilderExtWindows};
use winit::application::ApplicationHandler;
use winit::dpi::{LogicalPosition, LogicalSize};
use winit::event::WindowEvent;
use winit::event_loop::{ActiveEventLoop, ControlFlow, EventLoop, EventLoopProxy};
use winit::window::{Window, WindowId};

const DEFAULT_W: f64 = 1280.0;
const DEFAULT_H: f64 = 800.0;

/// Carpeta con los estáticos de la web app: data/web-dist (release) o rutas
/// relativas al exe para desarrollo (target/.../web/dist).
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
    for up in 1..=3 {
        if let Some(base) = dir.ancestors().nth(up) {
            candidates.push(base.join("web").join("dist"));
        }
    }
    candidates.into_iter().find(|p| p.join("index.html").exists())
}

struct App {
    url: String,
    window: Option<Window>,
    webview: Option<WebView>,
    web_context: Option<WebContext>,
    browser_mode: bool,
    /// Canal de comandos del sub-WebView (receiver se procesa en el event loop).
    browser_rx: Option<crossbeam_channel::Receiver<browser_view::BrowserCommand>>,
    /// Sender: se mantiene vivo para que el canal no se cierre si el AppState
    /// todavía tiene referencias (browser_mgr.tx es clone de este).
    _browser_tx: crossbeam_channel::Sender<browser_view::BrowserCommand>,
    /// Estado interno del sub-WebView (solo main thread).
    browser_inner: browser_view::SubWebViewInner,
    /// Último instante en que se persistió la geometría (throttle de escritura).
    last_geom_save: std::time::Instant,
    modifiers: winit::keyboard::ModifiersState,
}

enum AppEvent {
    Quit,
    Restore,
    /// Un comando de browser llegó desde el HTTP thread: despertar el loop
    /// para que about_to_wait bombee la cola (sin esto, con ControlFlow::Wait
    /// y app idle, el request quedaba colgado hasta un evento del OS).
    BrowserWork,
}

/// ¿Está instalado el runtime de WebView2 (Evergreen)? En Windows 10 no
/// viene por defecto; la shell lo detecta y lo instala si falta.
fn webview2_runtime_installed() -> bool {
    use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
    use winreg::RegKey;
    for root in [HKEY_LOCAL_MACHINE, HKEY_CURRENT_USER] {
        for sub in [
            r"SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
            r"SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
            r"SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{EB1C19B2-1D18-41B8-89DB-6F77C8958A5C}",
            r"SOFTWARE\Microsoft\EdgeUpdate\Clients\{EB1C19B2-1D18-41B8-89DB-6F77C8958A5C}",
        ] {
            if let Ok(key) = RegKey::predef(root).open_subkey(sub) {
                if key.get_value::<String, _>("pv").is_ok() {
                    return true;
                }
            }
        }
    }
    false
}

/// Descarga el bootstrapper de WebView2 (Evergreen, ~2MB) a data/ y lo
/// instala en silencio. Best-effort: no bloquea y no pide admin.
fn install_webview2_runtime_bg() {
    std::thread::Builder::new()
        .name("webview2-setup".into())
        .spawn(|| {
            let target = state::data_dir().join("webview2-setup.exe");
            let url = "https://go.microsoft.com/fwlink/p/?LinkId=2124703";
            let resp = match ureq::get(url)
                .timeout(std::time::Duration::from_secs(90))
                .call()
            {
                Ok(r) => r,
                Err(_) => return,
            };
            let mut reader = resp.into_reader();
            let mut file = match std::fs::File::create(&target) {
                Ok(f) => f,
                Err(_) => return,
            };
            if std::io::copy(&mut reader, &mut file).is_err() {
                let _ = std::fs::remove_file(&target);
                return;
            }
            drop(file);
            let _ = std::process::Command::new(&target)
                .args(["/silent", "/install"])
                .spawn();
        })
        .ok();
}

/// Abre la URL en el navegador por defecto (fallback si WebView2 no existe).
fn open_browser_mode(url: &str) {
    let _ = std::process::Command::new("cmd")
        .args(["/c", "start", "", url])
        .spawn();
}

impl ApplicationHandler<AppEvent> for App {
    fn resumed(&mut self, event_loop: &ActiveEventLoop) {
        if self.window.is_some() || self.browser_mode {
            return;
        }
        let mut attributes = Window::default_attributes();
        attributes.title = "OpenCode Desktop".to_string();
        // Restaurar geometría persistida si existe y es visible en algún monitor.
        // Si la ventana quedó fuera de pantalla (segundo monitor desconectado,
        // coordenadas inválidas), se ignora y se usa el default centrado.
        let mut use_saved_geometry = false;
        if let Some(g) = state::load_window_geometry() {
            if g.width >= 100.0 && g.height >= 100.0 && g.width <= 8000.0 && g.height <= 8000.0 {
                let monitors: Vec<_> = event_loop.available_monitors().collect();
                let saved_x = g.x;
                let saved_y = g.y;
                let saved_w = g.width;
                let saved_h = g.height;
                let visible = if monitors.is_empty() {
                    // Sin info de monitores, al menos validar que no sea absurdamente off-screen
                    saved_x > -10000.0 && saved_x < 10000.0 && saved_y > -10000.0 && saved_y < 10000.0
                } else {
                    monitors.iter().any(|m| {
                        let pos = m.position().to_logical::<f64>(m.scale_factor());
                        let size = m.size().to_logical::<f64>(m.scale_factor());
                        let mx = pos.x;
                        let my = pos.y;
                        let mw = size.width;
                        let mh = size.height;
                        // Chequear intersección: ventana y monitor se solapan al menos 100px
                        let overlap_x = (saved_x + saved_w).min(mx + mw) - saved_x.max(mx);
                        let overlap_y = (saved_y + saved_h).min(my + mh) - saved_y.max(my);
                        overlap_x > 100.0 && overlap_y > 100.0
                    })
                };
                if visible {
                    attributes.position = Some(LogicalPosition::new(g.x, g.y).into());
                    attributes.inner_size = Some(LogicalSize::new(g.width, g.height).into());
                    use_saved_geometry = true;
                } else {
                    eprintln!("opencode-desktop: geometría guardada fuera de pantalla ({},{} {}x{}), usando default", g.x, g.y, g.width, g.height);
                }
            }
        }
        if !use_saved_geometry {
            attributes.inner_size = Some(LogicalSize::new(DEFAULT_W, DEFAULT_H).into());
        }
        attributes.min_inner_size = Some(LogicalSize::new(720.0, 480.0).into());
        if let Ok(rgba) = load_window_icon() {
            attributes.window_icon = Some(rgba);
        }
        let Ok(window) = event_loop.create_window(attributes) else {
            event_loop.exit();
            return;
        };
        // WebView2 user-data redirigido a data/webview (portable, sin C:).
        let data = state::data_dir();
        let _ = std::fs::create_dir_all(data.join("webview"));
        let context = WebContext::new(Some(data.join("webview")));
        let ctx: &mut WebContext = self.web_context.get_or_insert(context);
        let builder = WebViewBuilder::with_web_context(ctx)
            .with_url(&self.url)
            .with_devtools(true)
            .with_initialization_script("window.__OPENCODE_DESKTOP__ = true;")
            // GPU + autoplay. DEBE ser idéntico al del sub-WebView del browser
            // (browser_view::WEBVIEW_BROWSER_ARGS): comparten WebContext y un
            // mismatch de argumentos cuelga la creación del WebView hijo.
            .with_additional_browser_args(browser_view::WEBVIEW_BROWSER_ARGS);
        match builder.build_as_child(&window) {
            Ok(wv) => {
                window.set_visible(true);
                window.focus_window();
                // Centrar si no se restauró geometría (primera vez)
                if !use_saved_geometry {
                    // Dejar que el WM centre la ventana (sin posición explícita)
                }
                self.webview = Some(wv);
                self.window = Some(window);
            }
            Err(e) => {
                eprintln!("opencode-desktop: webview error: {e}");
                // Windows 10 sin runtime WebView2: instalar en background y
                // abrir en el navegador por defecto mientras tanto.
                if !webview2_runtime_installed() {
                    eprintln!("opencode-desktop: WebView2 runtime no encontrado; instalando...");
                    install_webview2_runtime_bg();
                }
                open_browser_mode(&self.url);
                self.browser_mode = true;
                // El server/tray siguen vivos: la app funciona en el browser.
                drop(window);
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
                self.save_geometry();
            }
            WindowEvent::Moved(_pos) => {
                self.save_geometry();
            }
            WindowEvent::CloseRequested => {
                self.save_geometry();
                event_loop.exit();
            }
            WindowEvent::ModifiersChanged(m) => {
                self.modifiers = m.state();
            }
            WindowEvent::KeyboardInput { event, .. } => {
                if event.state == winit::event::ElementState::Pressed {
                    let is_f12 = matches!(event.physical_key, winit::keyboard::PhysicalKey::Code(winit::keyboard::KeyCode::F12));
                    let is_i = matches!(event.physical_key, winit::keyboard::PhysicalKey::Code(winit::keyboard::KeyCode::KeyI));
                    let ctrl = self.modifiers.control_key();
                    let shift = self.modifiers.shift_key();
                    if is_f12 || (is_i && ctrl && shift) {
                        if let Some(wv) = &self.webview {
                            wv.open_devtools();
                        }
                    }
                }
            }
            _ => {}
        }
    }

    fn about_to_wait(&mut self, _event_loop: &ActiveEventLoop) {
        if let Some(rx) = &self.browser_rx {
            browser_view::process_browser_commands(rx, &mut self.browser_inner, self.web_context.as_mut(), self.window.as_ref());
        }
    }

    fn user_event(&mut self, event_loop: &ActiveEventLoop, event: AppEvent) {
        match event {
            AppEvent::Quit => event_loop.exit(),
            AppEvent::BrowserWork => {
                // No-op intencional: despertó el loop; about_to_wait bombea
                // process_browser_commands. Con Wait, el wake ya reprogramó.
                self.about_to_wait(event_loop);
            }
            AppEvent::Restore => {
                if let Some(window) = &self.window {
                    window.set_visible(true);
                    window.focus_window();
                }
            }
        }
    }
}

impl App {
    /// Persiste posición+tamaño de la ventana (throttle ~400ms) para reabrir
    /// la app donde el usuario la dejó.
    fn save_geometry(&mut self) {
        if let Some(window) = &self.window {
            let now = std::time::Instant::now();
            if now.duration_since(self.last_geom_save).as_millis() < 400 {
                return;
            }
            self.last_geom_save = now;
            let sf = window.scale_factor();
            let pos = window.outer_position().unwrap_or_default().to_logical::<f64>(sf);
            let size = window.inner_size().to_logical::<f64>(sf);
            state::save_window_geometry(&state::WindowGeometry {
                x: pos.x,
                y: pos.y,
                width: size.width,
                height: size.height,
                scale: sf,
            });
        }
    }
}

/// Icono embebido del logo de opencode (resources/icon.ico, 32x32 BMP).
/// Decodificado en runtime: ventana + tray, sin sección de recursos.
fn icon_rgba32() -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let bytes = include_bytes!("../resources/icon.ico");
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
            return Ok(rgba);
        }
    }
    Err("no 32x32 bmp in ico".into())
}

/// Icono de la ventana: el logo embebido decodificado a RGBA.
fn load_window_icon() -> Result<winit::window::Icon, Box<dyn std::error::Error>> {
    let rgba = icon_rgba32()?;
    Ok(winit::window::Icon::from_rgba(rgba, 32, 32)?)
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
    let icon = {
        let rgba = icon_rgba32()?;
        tray_icon::Icon::from_rgba(rgba, 32, 32)?
    };
    let tray = TrayIconBuilder::new()
        .with_menu(Box::new(menu))
        .with_tooltip("OpenCode Desktop")
        .with_icon(icon)
        .build()?;
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
    TrayIconEvent::set_event_handler(Some(move |event: TrayIconEvent| {
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
    std::panic::set_hook(Box::new(|info| {
        let msg = format!("Error crítico en OpenCode Desktop:\n\n{}", info);
        eprintln!("{}", msg);
        let _ = std::fs::write("opencode-desktop-error.log", &msg);
        #[cfg(windows)]
        unsafe {
            use windows_sys::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_ICONERROR, MB_OK};
            let wide: Vec<u16> = msg.encode_utf16().chain(Some(0)).collect();
            let title: Vec<u16> = "OpenCode Desktop Error".encode_utf16().chain(Some(0)).collect();
            MessageBoxW(std::ptr::null_mut(), wide.as_ptr(), title.as_ptr(), MB_OK | MB_ICONERROR);
        }
    }));

    let config = state::load_config();
    let persisted = state::load_persisted();

    // Server HTTP local (sirve web/dist + API /shell/*).
    let port = config.port;
    let mut server = None;
    let mut chosen = port;
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
    let server = server.unwrap_or_else(|| {
        eprintln!("opencode-desktop: no se encontró puerto libre");
        std::process::exit(1);
    });

    let (browser_mgr, browser_rx) = browser_view::SubWebViewManager::new();
    let browser_tx = browser_mgr.tx.clone();
    let dist = web_dist_dir();
    let app_state = Arc::new(AppState {
        config: std::sync::RwLock::new(config.clone()),
        persisted: std::sync::RwLock::new(persisted),
        port: chosen,
        pty: Arc::new(ptyx::PtyRegistry::new()),
        kanban: kanban::KanbanStore::load(),
        plugins: plugins::PluginRegistry::new(),
        servers: srvman::ServerManager::new(),
        stats: statsx::StatsManager::new(),
        dist,
        browser: browser_mgr,
        browser_picks: std::sync::Mutex::new(Vec::new()),
        projects: std::sync::RwLock::new(std::collections::HashMap::new()),
    });
    state::save_config(&config);
    if !state::autostart_enabled() {
        // Sin autostart por defecto (portable).
    }

    match &app_state.dist {
        Some(d) => println!("opencode-desktop: sirviendo {} en http://127.0.0.1:{chosen}", d.display()),
        None => println!("opencode-desktop: AVISO - web/dist no encontrado; la app estará vacía"),
    }

    // Stats server arranca con la app (botón del panel izquierdo lo abre).
    statsx::ensure(&app_state);

    // WebSocket para terminales en tiempo real (puerto del shell + 1).
    if let Err(e) = ptyx::start_ws_server(app_state.pty.clone(), chosen + 1) {
        eprintln!("opencode-desktop: ws pty no disponible: {e}");
    }

    {
        let spawn = app_state.clone();
        thread::Builder::new()
            .name("shell-http".into())
            .spawn(move || {
                for request in server.incoming_requests() {
                    let st = spawn.clone();
                    thread::Builder::new()
                        .name("shell-req".into())
                        .spawn(move || api::route(request, st))
                        .ok();
                }
            })
            .ok();
    }

    let event_loop = EventLoop::with_user_event().build().unwrap();
    event_loop.set_control_flow(ControlFlow::Wait);
    let proxy = event_loop.create_proxy();

    // Waker: los comandos browser que lleguen por HTTP despiertan el loop
    // (antes, con app idle en Wait, el request colgaba hasta un evento del OS).
    {
        let wake_proxy = event_loop.create_proxy();
        app_state.browser.set_waker(std::sync::Arc::new(move || {
            let _ = wake_proxy.send_event(AppEvent::BrowserWork);
        }));
    }

    if let Err(e) = setup_tray(proxy) {
        eprintln!("opencode-desktop: tray no disponible: {e}");
    }

    let mut app = App {
        url: format!("http://127.0.0.1:{chosen}"),
        window: None,
        webview: None,
        web_context: None,
        browser_mode: false,
        browser_rx: Some(browser_rx),
        _browser_tx: browser_tx,
        browser_inner: browser_view::SubWebViewInner {
            webview: None,
            url: String::new(),
            visible: false,
        },
        last_geom_save: std::time::Instant::now(),
        modifiers: winit::keyboard::ModifiersState::empty(),
    };
    event_loop.run_app(&mut app).unwrap();
}
