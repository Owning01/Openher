//! OpenCode Desktop — shell portable que embebe la web app de OpenCode Mobile.
//!
//! F0-F4: ventana wry (WebView2) + server local (tiny_http) que sirve
//! web/dist y la API /shell/* (explorador, terminales, kanban, updates,
//! docs, stats, plugins, labs, config, autostart, sesiones). Portable:
//! data/ junto al exe, sin escrituras en C:.

mod api;
mod docsx;
mod fsx;
mod kanban;
mod plugins;
mod ptyx;
mod srvman;
mod state;
mod statsx;
mod updates;

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

use state::AppState;
use tiny_http::Server;
use wry::{Rect, WebContext, WebView, WebViewBuilder};
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
        let data = state::data_dir();
        let _ = std::fs::create_dir_all(data.join("webview"));
        let context = WebContext::new(Some(data.join("webview")));
        let ctx: &mut WebContext = self.web_context.get_or_insert(context);
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

    let dist = web_dist_dir();
    let app_state = Arc::new(AppState {
        config: std::sync::RwLock::new(config.clone()),
        persisted: std::sync::RwLock::new(persisted),
        pty: ptyx::PtyRegistry::new(),
        kanban: kanban::KanbanStore::load(),
        plugins: plugins::PluginRegistry::new(),
        servers: srvman::ServerManager::new(),
        stats: statsx::StatsManager::new(),
        cache: std::sync::RwLock::new(std::collections::HashMap::new()),
        dist,
    });
    state::save_config(&config);
    if !state::autostart_enabled() {
        // Sin autostart por defecto (portable).
    }

    match &app_state.dist {
        Some(d) => println!("opencode-desktop: sirviendo {} en http://127.0.0.1:{chosen}", d.display()),
        None => println!("opencode-desktop: AVISO - web/dist no encontrado; la app estará vacía"),
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

    if let Err(e) = setup_tray(proxy) {
        eprintln!("opencode-desktop: tray no disponible: {e}");
    }

    let mut app = App {
        url: format!("http://127.0.0.1:{chosen}"),
        window: None,
        webview: None,
        web_context: None,
    };
    event_loop.run_app(&mut app).unwrap();
}
