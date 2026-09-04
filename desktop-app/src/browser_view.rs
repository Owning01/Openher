//! Sub-WebView2 manager: browser embebido con WebContext compartido.
//!
//! Crea un segundo WebView2 como child del mismo HWND, compartiendo
//! red/GPU/cache con el principal. Usa `MemoryUsageLevel::Low` cuando
//! no está visible (~3 MB en vez de ~80 MB).
//!
//! La creación del WebView DEBE ocurrir en el thread principal (winit
//! event loop). El API HTTP corre en otro thread, así que usamos un
//! canal crossbeam para enviar comandos al main thread y recibir
//! resultados. crossbeam-channel soporta `try_recv()` (non-blocking)
//! para que el event loop no se quede colgado en `recv()`.

use crossbeam_channel::{bounded, Receiver, Sender, TryRecvError};
use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use wry::{MemoryUsageLevel, Rect, WebView, WebViewBuilder, WebViewBuilderExtWindows, WebViewExtWindows};

/// Args de browser COMPARTIDOS por el WebView principal y el sub-WebView.
/// WebView2 EXIGE que todos los WebViews que comparten user-data folder
/// (WebContext) usen argumentos compatibles: un mismatch (antes el hijo llevaba
/// --disable-web-security/--disable-site-isolation-trials y el principal no)
/// cuelga CreateCoreWebView2Controller para siempre → el event loop entero se
/// congela y TODOS los comandos del browser responden 500 por timeout.
/// Sin flags de seguridad desactivados: el bypass de CORS/X-Frame lo hace el
/// proxy /shell/proxy del server, no el renderer.
pub const WEBVIEW_BROWSER_ARGS: &str =
    "--enable-gpu --ignore-gpu-blocklist --enable-accelerated-video-decode \
     --enable-accelerated-2d-canvas --enable-gpu-rasterization --enable-zero-copy \
     --autoplay-policy=no-user-gesture-required \
     --renderer-process-limit=2 \
     --no-first-run --no-default-browser-check --disable-component-update \
     --disable-hang-monitor \
     --remote-debugging-port=9333 \
     --disable-ipc-flooding-protection --disable-popup-blocking \
     --disable-prompt-on-repost --enable-features=msWebView2EnableDraggableRegions,PartitionedCookies";

/// Comando enviado desde el thread HTTP al main thread para crear/manipular
/// los sub-WebViews. `view` es el id de pestaña del frontend (bid); "" =
/// modo legacy de un solo WebView (panel standalone / móvil).
pub enum BrowserCommand {
    Open {
        view: String,
        url: String,
        bounds: Rect,
        reply: crossbeam_channel::Sender<Result<(), String>>,
    },
    Bounds {
        view: String,
        bounds: Rect,
        reply: crossbeam_channel::Sender<Result<(), String>>,
    },
    Visible {
        view: String,
        visible: bool,
        reply: crossbeam_channel::Sender<Result<(), String>>,
    },
    Navigate {
        view: String,
        url: String,
        action: Option<String>,
        reply: crossbeam_channel::Sender<Result<(), String>>,
    },
    Close {
        /// Some(v) cierra esa vista; None las cierra todas.
        view: Option<String>,
        reply: crossbeam_channel::Sender<Result<(), String>>,
    },
    CurrentUrl {
        view: String,
        reply: crossbeam_channel::Sender<Result<String, String>>,
    },
    /// Ejecuta JS en el sub-WebView (fire-and-forget). El resultado de datos
    /// vuelve por HTTP vía /shell/browser/pick (evaluate_script no retorna valor).
    /// Usado por el modo inspección (overlay inyectado sin recargar la página).
    Eval {
        view: String,
        code: String,
        reply: crossbeam_channel::Sender<Result<(), String>>,
    },
}

/// Pool de vistas: alternar entre tabs del navegador ya NO recarga (cada
/// vista conserva su DOM/sesión). Cap 3 por RAM (~80 MB por WebView vivo);
/// al abrir la 4ª se destruye la oculta menos usada (LRU).
pub const MAX_BROWSER_VIEWS: usize = 3;

/// Registro de descarga completada (cola visible vía GET /shell/browser/downloads).
#[derive(Clone, serde::Serialize)]
pub struct DownloadRecord {
    pub url: String,
    pub path: Option<String>,
    pub ok: bool,
}

/// Una vista del pool (una pestaña browser: del frontend).
pub struct BrowserViewEntry {
    pub webview: WebView,
    pub url: String,
    pub visible: bool,
    pub last_used: std::time::Instant,
}

/// Estado de los sub-WebViews (solo se accede desde el main thread).
pub struct SubWebViewInner {
    pub views: HashMap<String, BrowserViewEntry>,
    /// Vista al frente (la única con HWND visible).
    pub active_view: String,
    pub shortcut_events: Arc<Mutex<Vec<String>>>,
    pub download_events: Arc<Mutex<VecDeque<DownloadRecord>>>,
}

impl SubWebViewInner {
    /// Oculta todas las vistas (cambio de tab/panel, Esc): Low ~3 MB c/u,
    /// sin destruir → cookies/sesión/DOM intactos.
    pub fn hide_all_views(&mut self) {
        for entry in self.views.values_mut() {
            let _ = entry.webview.set_visible(false);
            let _ = entry.webview.set_memory_usage_level(MemoryUsageLevel::Low);
            entry.visible = false;
        }
    }

    pub fn any_visible(&self) -> bool {
        self.views.values().any(|e| e.visible)
    }

    /// Destruye todas las vistas (cierre de app): WebView::drop() llama
    /// controller.Close() + DestroyWindow.
    pub fn drop_all_views(&mut self) {
        self.views.clear();
        self.active_view.clear();
    }

    /// Estaciona todas menos la indicada (solo una nativa visible a la vez:
    /// el child HWND de Win32 traga los clicks de lo que tape).
    fn park_others(&mut self, except: &str) {
        for (id, entry) in self.views.iter_mut() {
            if id != except && entry.visible {
                let _ = entry.webview.set_visible(false);
                let _ = entry.webview.set_memory_usage_level(MemoryUsageLevel::Low);
                entry.visible = false;
            }
        }
    }
}

/// Manager que despacha comandos al main thread vía canal.
pub struct SubWebViewManager {
    pub tx: Sender<BrowserCommand>,
    shortcut_events: Arc<Mutex<Vec<String>>>,
    download_events: Arc<Mutex<VecDeque<DownloadRecord>>>,
    /// Despierta el event loop de winit tras encolar un comando: sin esto,
    /// con ControlFlow::Wait y app idle, rx.recv() del main thread no corre
    /// y el request HTTP queda colgado hasta que llegue cualquier evento del OS.
    waker: std::sync::Mutex<Option<Arc<dyn Fn() + Send + Sync>>>,
}

impl SubWebViewManager {
    /// Crea el manager con un canal bounded(32) (backpressure contra el
    /// HTTP thread si el main thread está saturado procesando comandos).
    pub fn new() -> (Self, Receiver<BrowserCommand>) {
        let (tx, rx) = bounded(32);
        let shortcut_events = Arc::new(Mutex::new(Vec::new()));
        let download_events = Arc::new(Mutex::new(VecDeque::new()));
        (Self { tx, shortcut_events, download_events, waker: std::sync::Mutex::new(None) }, rx)
    }

    pub fn shortcut_events(&self) -> Arc<Mutex<Vec<String>>> {
        Arc::clone(&self.shortcut_events)
    }

    pub fn download_events_handle(&self) -> Arc<Mutex<VecDeque<DownloadRecord>>> {
        Arc::clone(&self.download_events)
    }

    pub fn drain_downloads(&self) -> Vec<DownloadRecord> {
        self.download_events.lock().unwrap_or_else(|e| e.into_inner()).drain(..).collect()
    }

    pub fn drain_shortcuts(&self) -> Vec<String> {
        let mut events = self.shortcut_events.lock().unwrap_or_else(|e| e.into_inner());
        std::mem::take(&mut *events)
    }

    pub fn set_waker(&self, f: Arc<dyn Fn() + Send + Sync>) {
        *self.waker.lock().unwrap_or_else(|e| e.into_inner()) = Some(f);
    }

    fn wake(&self) {
        if let Ok(g) = self.waker.lock() {
            if let Some(f) = g.as_ref() {
                f();
            }
        }
    }

    /// Envía un comando y espera la respuesta. El HTTP thread se bloquea
    /// aquí hasta que el main thread procese y responda. Con timeout:
    /// si el main thread murió/está bloqueado, respondemos 500 en vez de
    /// colgar el worker para siempre.
    pub fn send<T>(&self, cmd: BrowserCommand, rx: crossbeam_channel::Receiver<T>) -> Result<T, String> {
        self.tx.send(cmd).map_err(|_| "main thread gone".to_string())?;
        self.wake();
        match rx.recv_timeout(Duration::from_millis(900)) {
            Ok(v) => Ok(v),
            Err(crossbeam_channel::RecvTimeoutError::Timeout) => {
                eprintln!("[browser] main thread timeout (900ms) — event loop saturado o WebView no listo");
                Err("main thread timeout (900ms)".to_string())
            }
            Err(crossbeam_channel::RecvTimeoutError::Disconnected) => {
                eprintln!("[browser] main thread dropped reply");
                Err("main thread dropped reply".to_string())
            }
        }
    }

    pub fn open(&self, view: &str, url: &str, bounds: Rect) -> Result<(), String> {
        let (reply_tx, reply_rx) = bounded(1);
        self.send(
            BrowserCommand::Open {
                view: view.to_string(),
                url: url.to_string(),
                bounds,
                reply: reply_tx,
            },
            reply_rx,
        )?
    }

    pub fn set_bounds(&self, view: &str, bounds: Rect) -> Result<(), String> {
        let (reply_tx, reply_rx) = bounded(1);
        self.send(BrowserCommand::Bounds { view: view.to_string(), bounds, reply: reply_tx }, reply_rx)?
    }

    pub fn set_visible(&self, view: &str, visible: bool) -> Result<(), String> {
        let (reply_tx, reply_rx) = bounded(1);
        self.send(BrowserCommand::Visible { view: view.to_string(), visible, reply: reply_tx }, reply_rx)?
    }

    pub fn navigate(&self, view: &str, url: &str, action: Option<&str>) -> Result<(), String> {
        let (reply_tx, reply_rx) = bounded(1);
        self.send(
            BrowserCommand::Navigate {
                view: view.to_string(),
                url: url.to_string(),
                action: action.map(|s| s.to_string()),
                reply: reply_tx,
            },
            reply_rx,
        )?
    }

    /// Cierra una vista (Some) o todas (None, legacy).
    pub fn close(&self, view: Option<&str>) -> Result<(), String> {
        let (reply_tx, reply_rx) = bounded(1);
        self.send(BrowserCommand::Close { view: view.map(|s| s.to_string()), reply: reply_tx }, reply_rx)?
    }

    pub fn current_url(&self, view: &str) -> Result<String, String> {
        let (reply_tx, reply_rx) = bounded(1);
        self.send(BrowserCommand::CurrentUrl { view: view.to_string(), reply: reply_tx }, reply_rx)?
    }

    pub fn eval(&self, view: &str, code: &str) -> Result<(), String> {
        let (reply_tx, reply_rx) = bounded(1);
        self.send(
            BrowserCommand::Eval {
                view: view.to_string(),
                code: code.to_string(),
                reply: reply_tx,
            },
            reply_rx,
        )?
    }
}

/// Procesa comandos en el main thread. Llamar desde `App::about_to_wait`.
/// Usa `try_recv()` (non-blocking) para no bloquear el event loop.
/// Limita a MAX_CMDS_PER_TICK por tick para evitar jank durante bursts
/// de comandos (ej: drag del browser panel genera un bounds por mousemove).
const MAX_CMDS_PER_TICK: usize = 8;

pub fn process_browser_commands(
    rx: &Receiver<BrowserCommand>,
    inner: &mut SubWebViewInner,
    ctx: Option<&mut wry::WebContext>,
    window: Option<&winit::window::Window>,
) {
    let mut ctx = ctx;
    for _ in 0..MAX_CMDS_PER_TICK {
        match rx.try_recv() {
            Ok(cmd) => match cmd {
                BrowserCommand::Open { view, url, bounds, reply } => {
                    let result = cmd_open(inner, ctx.as_deref_mut(), window, &view, &url, bounds);
                    let _ = reply.send(result);
                }
                BrowserCommand::Bounds { view, bounds, reply } => {
                    let result = cmd_bounds(inner, &view, bounds);
                    let _ = reply.send(result);
                }
                BrowserCommand::Visible { view, visible, reply } => {
                    let result = cmd_visible(inner, &view, visible);
                    let _ = reply.send(result);
                }
                BrowserCommand::Navigate { view, url, action, reply } => {
                    let result = cmd_navigate(inner, &view, &url, action.as_deref());
                    let _ = reply.send(result);
                }
                BrowserCommand::Close { view, reply } => {
                    let result = cmd_close(inner, view.as_deref());
                    let _ = reply.send(result);
                }
                BrowserCommand::CurrentUrl { view, reply } => {
                    let result = cmd_current_url(inner, &view);
                    let _ = reply.send(result);
                }
                BrowserCommand::Eval { view, code, reply } => {
                    let result = cmd_eval(inner, &view, &code);
                    let _ = reply.send(result);
                }
            },
            Err(TryRecvError::Empty) => break,
            Err(TryRecvError::Disconnected) => break,
        }
    }
}

fn cmd_open(
    inner: &mut SubWebViewInner,
    ctx: Option<&mut wry::WebContext>,
    window: Option<&winit::window::Window>,
    view: &str,
    url: &str,
    bounds: Rect,
) -> Result<(), String> {
    inner.active_view = view.to_string();
    // Reuso: la vista ya existe → bounds + visible, y solo navega si cambió
    // la URL (volver a un tab NO recarga: DOM/sesión intactos).
    let pool_n = inner.views.len();
    if let Some(entry) = inner.views.get_mut(view) {
        eprintln!("[browser] view reuse id={} url={} (pool {}/{})", view, url, pool_n, MAX_BROWSER_VIEWS);
        if entry.url != url {
            let _ = entry.webview.load_url(url);
            entry.url = url.to_string();
        }
        let _ = entry.webview.set_bounds(bounds);
        let _ = entry.webview.set_visible(true);
        let _ = entry.webview.set_memory_usage_level(MemoryUsageLevel::Normal);
        entry.visible = true;
        entry.last_used = std::time::Instant::now();
        inner.park_others(view);
        return Ok(());
    }

    // Evicción LRU si el pool está lleno (ocultas primero, nunca la activa).
    if inner.views.len() >= MAX_BROWSER_VIEWS {
        let victim = inner
            .views
            .iter()
            .filter(|(id, e)| id.as_str() != view && !e.visible)
            .min_by_key(|(_, e)| e.last_used)
            .map(|(id, _)| id.clone())
            .or_else(|| {
                inner
                    .views
                    .iter()
                    .filter(|(id, _)| id.as_str() != view)
                    .min_by_key(|(_, e)| e.last_used)
                    .map(|(id, _)| id.clone())
            });
        if let Some(v) = victim {
            eprintln!("[browser] pool lleno: desalojando vista oculta id={}", v);
            inner.views.remove(&v);
        }
    }

    let wv = create_view(inner, ctx, window, url)?;
    let _ = wv.set_bounds(bounds);
    let _ = wv.set_memory_usage_level(MemoryUsageLevel::Normal);
    inner.views.insert(
        view.to_string(),
        BrowserViewEntry {
            webview: wv,
            url: url.to_string(),
            visible: true,
            last_used: std::time::Instant::now(),
        },
    );
    inner.park_others(view);
    #[cfg(windows)]
    {
        let hwnd = crate::state::WINDOW_HWND.load(std::sync::atomic::Ordering::Relaxed);
        if hwnd != 0 {
            unsafe { crate::patch_child_windows(hwnd); }
            let hwnd2 = hwnd;
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(350));
                unsafe { crate::patch_child_windows(hwnd2); }
            });
        }
    }
    Ok(())
}

/// Destino de descarga: data/downloads/<nombre> único (portable, sin C:).
fn download_dest(url: &str) -> std::path::PathBuf {
    let dir = crate::state::data_dir().join("downloads");
    let _ = std::fs::create_dir_all(&dir);
    let base = url
        .rsplit(['/', '?', '#'])
        .next()
        .unwrap_or("")
        .split('?')
        .next()
        .unwrap_or("")
        .trim();
    let clean: String = base
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' { c } else { '_' })
        .collect();
    let stem = if clean.is_empty() {
        format!("descarga-{}", crate::state::now_ms())
    } else {
        clean
    };
    // Sufijo (n) si ya existe: jamás pisar un archivo del usuario.
    let mut candidate = dir.join(&stem);
    let mut n = 1u32;
    while candidate.exists() {
        let numbered = match stem.rfind('.') {
            Some(i) if i > 0 => format!("{} ({}).{}", &stem[..i], n, &stem[i + 1..]),
            _ => format!("{} ({})", stem, n),
        };
        candidate = dir.join(numbered);
        n += 1;
        if n > 9999 {
            candidate = dir.join(format!("{}-{}", crate::state::now_ms(), stem));
            break;
        }
    }
    candidate
}

fn create_view(
    inner: &mut SubWebViewInner,
    ctx: Option<&mut wry::WebContext>,
    window: Option<&winit::window::Window>,
    url: &str,
) -> Result<WebView, String> {
    let ctx = ctx.ok_or("WebContext not initialized")?;
    let window = window.ok_or("Window not initialized")?;
    let download_sink = Arc::clone(&inner.download_events);

    WebViewBuilder::with_web_context(ctx)
        .with_url(url)
        .with_focused(true)
        // UA Chrome-like: muchos sitios (Google, YouTube, etc.) detectan el UA
        // con "Edg/" y bloquean o degradan. WebView2 es Chromium real, así que
        // usar el UA de Chrome hace que la detección de browser funcione.
        .with_user_agent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        )
        // Permitir reproducción automática (YouTube, música, etc.) sin gesto del usuario.
        .with_autoplay(true)
        .with_initialization_script(BROWSER_SHORTCUT_SCRIPT)
        // Descargas: sin handler WebView2 las dejaba colgadas. Destino fijo
        // data/downloads (ver download_dest) + aviso por la cola de eventos.
        .with_download_started_handler(move |dl_url: String, path: &mut std::path::PathBuf| -> bool {
            *path = download_dest(&dl_url);
            eprintln!("[browser] descarga iniciada {} -> {}", dl_url, path.display());
            true
        })
        .with_download_completed_handler(move |dl_url: String, dest: Option<std::path::PathBuf>, ok: bool| {
            eprintln!("[browser] descarga {} -> {:?} ok={}", dl_url, dest, ok);
            let mut q = download_sink.lock().unwrap_or_else(|e| e.into_inner());
            q.push_back(DownloadRecord {
                url: dl_url,
                path: dest.map(|p| p.to_string_lossy().to_string()),
                ok,
            });
            while q.len() > 20 {
                q.pop_front();
            }
        })
        .with_ipc_handler({
            let events = Arc::clone(&inner.shortcut_events);
            move |request| {
                let mut queue = events.lock().unwrap_or_else(|e| e.into_inner());
                if queue.len() < 64 {
                    queue.push(request.body().clone());
                }
            }
        })
        // DEBE ser idéntico al del WebView principal (ver WEBVIEW_BROWSER_ARGS):
        // comparten WebContext y un mismatch cuelga la creación del controller.
        .with_additional_browser_args(WEBVIEW_BROWSER_ARGS)
        .build_as_child(window)
        .map_err(|e| format!("SubWebView create: {e}"))
}

const BROWSER_SHORTCUT_SCRIPT: &str = r#"
(function () {
  if (window.__openherBrowserShortcuts) return;
  window.__openherBrowserShortcuts = true;
  document.addEventListener('keydown', function (e) {
    var key = String(e.key || '').toLowerCase();
    var mod = !!(e.ctrlKey || e.metaKey);
    var action = null;
    if (e.key === 'F5' || (mod && key === 'r')) action = 'reload';
    else if (mod && key === 'l') action = 'focus-url';
    else if (mod && key === 'f') action = 'find';
    else if (mod && key === 't') action = 'new-tab';
    else if (mod && key === 'w') action = 'close-tab';
    else if (mod && key === 'd') action = 'bookmark';
    else if (mod && key === '0') action = 'zoom-reset';
    else if (mod && (key === '+' || key === '=')) action = 'zoom-in';
    else if (mod && (key === '-' || key === '_')) action = 'zoom-out';
    else if (e.altKey && e.key === 'ArrowLeft') action = 'back';
    else if (e.altKey && e.key === 'ArrowRight') action = 'forward';
    else if (mod && e.shiftKey && key === 'b') action = 'toggle-chrome';
    if (!action || !window.chrome || !window.chrome.webview) return;
    e.preventDefault();
    e.stopPropagation();
    window.chrome.webview.postMessage(JSON.stringify({ type: 'browser-shortcut', action: action }));
  }, true);
})();
"#;

fn cmd_bounds(inner: &mut SubWebViewInner, view: &str, bounds: Rect) -> Result<(), String> {
    if let Some(entry) = inner.views.get(view) {
        entry.webview.set_bounds(bounds).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn cmd_visible(inner: &mut SubWebViewInner, view: &str, visible: bool) -> Result<(), String> {
    if visible {
        inner.active_view = view.to_string();
        inner.park_others(view);
    }
    if let Some(entry) = inner.views.get_mut(view) {
        let _ = entry.webview.set_visible(visible);
        let level = if visible {
            MemoryUsageLevel::Normal
        } else {
            MemoryUsageLevel::Low
        };
        let _ = entry.webview.set_memory_usage_level(level);
        entry.visible = visible;
        if visible {
            entry.last_used = std::time::Instant::now();
        }
    }
    Ok(())
}

fn cmd_navigate(inner: &mut SubWebViewInner, view: &str, url: &str, action: Option<&str>) -> Result<(), String> {
    if let Some(entry) = inner.views.get_mut(view) {
        match action {
            Some("back") => {
                let _ = entry.webview.evaluate_script("history.back()");
            }
            Some("forward") => {
                let _ = entry.webview.evaluate_script("history.forward()");
            }
            Some("reload") => {
                let _ = entry.webview.reload();
            }
            _ => {
                // No-op si ya está en esa URL: el efecto de React re-navega al
                // reactivar el tab y recargaría sin necesidad.
                if entry.url != url {
                    entry.webview.load_url(url).map_err(|e| e.to_string())?;
                    entry.url = url.to_string();
                }
            }
        }
        entry.last_used = std::time::Instant::now();
    }
    Ok(())
}

fn cmd_close(inner: &mut SubWebViewInner, view: Option<&str>) -> Result<(), String> {
    match view {
        // WebView::drop() llama controller.Close() + DestroyWindow
        Some(v) => {
            inner.views.remove(v);
            if inner.active_view == v {
                inner.active_view.clear();
            }
        }
        None => inner.drop_all_views(),
    }
    Ok(())
}

fn cmd_current_url(inner: &mut SubWebViewInner, view: &str) -> Result<String, String> {
    if let Some(entry) = inner.views.get_mut(view) {
        let live = entry.webview.url().map_err(|e| e.to_string())?;
        // Sincronizar el espejo: la página pudo navegar por sí sola (links,
        // redirects, SPA) sin pasar por open()/navigate(). Sin esto el espejo
        // queda viejo y el skip de misma-URL actúa sobre datos rancios.
        if live != "about:blank" && !live.is_empty() {
            entry.url = live.clone();
        }
        return Ok(live);
    }
    Ok(String::new())
}

fn cmd_eval(inner: &mut SubWebViewInner, view: &str, code: &str) -> Result<(), String> {
    // Vista "" legacy: si el pool tiene una sola vista, cae en ella.
    if view.is_empty() && !inner.views.contains_key(view) {
        if inner.views.len() == 1 {
            if let Some((_, entry)) = inner.views.iter().next() {
                return entry.webview.evaluate_script(code).map_err(|e| e.to_string());
            }
        }
        return Ok(());
    }
    if let Some(entry) = inner.views.get(view) {
        return entry.webview.evaluate_script(code).map_err(|e| e.to_string());
    }
    Ok(())
}
