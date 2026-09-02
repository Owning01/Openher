//! Entry del exe: ventana embebida (wry/WebView2 sobre winit) + servidor local en thread.
//! Port de launcher.py: guarda posición/tamaño de ventana, cerrar = matar todo.
//! Fallback: si la ventana no se puede crear, abre el navegador en modo app.

// El exe de release NO debe abrir una terminal (subsistema GUI); dev conserva la consola.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::time::{Duration, Instant};

use winit::application::ApplicationHandler;
use winit::dpi::{LogicalSize, PhysicalPosition};
use winit::event::WindowEvent;
use winit::event_loop::{ActiveEventLoop, EventLoop};
use winit::window::{Window, WindowId};
use wry::{Rect, WebView, WebViewBuilder};

use opencode_stats::{pricing, server};

const DEFAULT_W: f64 = 1280.0;
const DEFAULT_H: f64 = 820.0;
const MIN_W: f64 = 940.0;
const MIN_H: f64 = 600.0;

const APP_MODE_EXES: [&str; 4] = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
];

fn config_dir() -> PathBuf {
    if let Ok(base) = std::env::var("LOCALAPPDATA")
        && !base.is_empty()
    {
        return PathBuf::from(base).join("OpenCodeStats");
    }
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("data")
}

fn window_state_path() -> PathBuf {
    config_dir().join("window_state.json")
}

fn load_window_state() -> Option<(i32, i32, u32, u32)> {
    let raw = std::fs::read_to_string(window_state_path()).ok()?;
    let v: serde_json::Value = serde_json::from_str(&raw).ok()?;
    let x = v.get("x")?.as_i64()? as i32;
    let y = v.get("y")?.as_i64()? as i32;
    let w = v.get("width")?.as_u64()? as u32;
    let h = v.get("height")?.as_u64()? as u32;
    if w < 400 || h < 300 || x.abs() > 20000 || y.abs() > 20000 {
        return None;
    }
    Some((x, y, w, h))
}

fn save_window_state(x: i32, y: i32, w: u32, h: u32) {
    let v = serde_json::json!({ "x": x, "y": y, "width": w, "height": h });
    if let Ok(s) = serde_json::to_string(&v) {
        let p = window_state_path();
        if let Some(dir) = p.parent() {
            let _ = std::fs::create_dir_all(dir);
            let _ = std::fs::write(p, s);
        }
    }
}

/// Icono de la ventana: RGBA crudo 64x64 generado por `make-icon` (assets/icon-64.rgba).
fn include_bytes_icon() -> Result<winit::window::Icon, &'static str> {
    winit::window::Icon::from_rgba(
        include_bytes!(concat!(env!("CARGO_MANIFEST_DIR"), "/assets/icon-64.rgba")).to_vec(),
        64,
        64,
    )
    .map_err(|_| "icono inválido")
}

fn open_browser_app_mode(url: &str) {
    for exe in APP_MODE_EXES {
        if std::path::Path::new(exe).is_file() {
            let mut cmd = std::process::Command::new(exe);
            cmd.arg("--app=".to_string() + url).arg("--no-first-run");
            #[cfg(windows)]
            {
                use std::os::windows::process::CommandExt;
                cmd.creation_flags(0x0800_0000);
            }
            if cmd.spawn().is_ok() {
                return;
            }
        }
    }
    let _ = std::process::Command::new("cmd")
        .args(["/C", "start", "", url])
        .spawn();
}

struct App {
    url: String,
    window: Option<Window>,
    webview: Option<WebView>,
    last_state: Option<(u32, u32, i32, i32)>,
    last_saved: Option<Instant>,
    browser_mode: bool,
}

impl ApplicationHandler for App {
    fn resumed(&mut self, event_loop: &ActiveEventLoop) {
        if self.window.is_some() || self.browser_mode {
            return;
        }
        let mut attributes = Window::default_attributes();
        attributes.title = "OpenCode Stats".to_string();
        attributes.inner_size = Some(LogicalSize::new(DEFAULT_W, DEFAULT_H).into());
        attributes.min_inner_size = Some(LogicalSize::new(MIN_W, MIN_H).into());
        if let Ok(rgba) = include_bytes_icon() {
            attributes.window_icon = Some(rgba);
        }
        if let Some((x, y, w, h)) = load_window_state() {
            attributes.position = Some(PhysicalPosition::new(x, y).into());
            attributes.inner_size = Some(LogicalSize::new(w as f64, h as f64).into());
        }
        let Ok(window) = event_loop.create_window(attributes) else {
            self.browser_mode = true;
            open_browser_app_mode(&self.url);
            return;
        };
        let webview = WebViewBuilder::new()
            .with_url(&self.url)
            .build_as_child(&window);
        match webview {
            Ok(wv) => {
                self.webview = Some(wv);
                self.window = Some(window);
            }
            Err(_) => {
                self.browser_mode = true;
                open_browser_app_mode(&self.url);
            }
        }
    }

    fn window_event(&mut self, _event_loop: &ActiveEventLoop, _id: WindowId, event: WindowEvent) {
        match event {
            WindowEvent::Resized(size) => {
                if let (Some(window), Some(webview)) = (&self.window, &self.webview) {
                    let size = size.to_logical::<f64>(window.scale_factor());
                    let _ = webview.set_bounds(Rect {
                        position: winit::dpi::Position::Logical(Default::default()),
                        size: LogicalSize::new(size.width, size.height).into(),
                    });
                }
            }
            WindowEvent::CloseRequested => {
                // guardado final forzado (el exit(0) corta el loop sin más ticks)
                if let Some(window) = &self.window {
                    let size = window.inner_size();
                    if let Ok(pos) = window.outer_position() {
                        save_window_state(pos.x, pos.y, size.width, size.height);
                    }
                }
                std::process::exit(0);
            }
            _ => {}
        }
    }

    fn about_to_wait(&mut self, _event_loop: &ActiveEventLoop) {
        if let Some(window) = &self.window {
            let size = window.inner_size();
            let Some(pos) = window.outer_position().ok() else {
                return; // minimizada o sin posición válida: no pisar el estado guardado
            };
            let st = (size.width, size.height, pos.x, pos.y);
            if self.last_state != Some(st) {
                // debounce: durante drag/resize hay muchas escrituras por segundo
                let now = Instant::now();
                if self
                    .last_saved
                    .is_none_or(|t| now.duration_since(t) >= Duration::from_millis(300))
                {
                    save_window_state(st.2, st.3, st.0, st.1);
                    self.last_saved = Some(now);
                }
                self.last_state = Some(st);
            }
        }
    }
}

fn main() {
    pricing::init(); // aplica pricing_overrides.json (si existe) antes de servir
    let port: u16 = std::env::var("OPENCODE_STATS_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8765);
    let url = format!("http://127.0.0.1:{port}");

    // Si ya hay una instancia en el puerto: abrir el navegador y salir.
    if std::net::TcpListener::bind(("127.0.0.1", port)).is_err() {
        open_browser_app_mode(&url);
        return;
    }

    std::thread::spawn(move || {
        let _ = server::serve(port);
    });

    if std::env::var("OPENCODE_STATS_HIDE_WINDOW").is_ok() {
        loop {
            std::thread::sleep(Duration::from_secs(3600));
        }
    }

    let mut app = App {
        url,
        window: None,
        webview: None,
        last_state: None,
        last_saved: None,
        browser_mode: false,
    };
    let event_loop = EventLoop::new().expect("event loop");
    let _ = event_loop.run_app(&mut app);
    std::process::exit(0);
}
