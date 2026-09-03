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
use std::sync::Arc;
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
     --disable-ipc-flooding-protection --disable-popup-blocking \
     --disable-prompt-on-repost --enable-features=msWebView2EnableDraggableRegions,PartitionedCookies";

/// Comando enviado desde el thread HTTP al main thread para crear/manipular
/// el sub-WebView.
pub enum BrowserCommand {
    Open {
        url: String,
        bounds: Rect,
        reply: crossbeam_channel::Sender<Result<(), String>>,
    },
    Bounds {
        bounds: Rect,
        reply: crossbeam_channel::Sender<Result<(), String>>,
    },
    Visible {
        visible: bool,
        reply: crossbeam_channel::Sender<Result<(), String>>,
    },
    Navigate {
        url: String,
        action: Option<String>,
        reply: crossbeam_channel::Sender<Result<(), String>>,
    },
    Close {
        reply: crossbeam_channel::Sender<Result<(), String>>,
    },
    CurrentUrl {
        reply: crossbeam_channel::Sender<Result<String, String>>,
    },
    /// Ejecuta JS en el sub-WebView (fire-and-forget). El resultado de datos
    /// vuelve por HTTP vía /shell/browser/pick (evaluate_script no retorna valor).
    /// Usado por el modo inspección (overlay inyectado sin recargar la página).
    Eval {
        code: String,
        reply: crossbeam_channel::Sender<Result<(), String>>,
    },
}

/// Estado del sub-WebView (solo se accede desde el main thread).
pub struct SubWebViewInner {
    pub webview: Option<WebView>,
    pub url: String,
    pub visible: bool,
    pub shortcut_events: Arc<std::sync::Mutex<Vec<String>>>,
}

/// Manager que despacha comandos al main thread vía canal.
pub struct SubWebViewManager {
    pub tx: Sender<BrowserCommand>,
    shortcut_events: Arc<std::sync::Mutex<Vec<String>>>,
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
        let shortcut_events = Arc::new(std::sync::Mutex::new(Vec::new()));
        (Self { tx, shortcut_events, waker: std::sync::Mutex::new(None) }, rx)
    }

    pub fn shortcut_events(&self) -> Arc<std::sync::Mutex<Vec<String>>> {
        Arc::clone(&self.shortcut_events)
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

    pub fn open(&self, url: &str, bounds: Rect) -> Result<(), String> {
        let (reply_tx, reply_rx) = bounded(1);
        self.send(
            BrowserCommand::Open {
                url: url.to_string(),
                bounds,
                reply: reply_tx,
            },
            reply_rx,
        )?
    }

    pub fn set_bounds(&self, bounds: Rect) -> Result<(), String> {
        let (reply_tx, reply_rx) = bounded(1);
        self.send(BrowserCommand::Bounds { bounds, reply: reply_tx }, reply_rx)?
    }

    pub fn set_visible(&self, visible: bool) -> Result<(), String> {
        let (reply_tx, reply_rx) = bounded(1);
        self.send(BrowserCommand::Visible { visible, reply: reply_tx }, reply_rx)?
    }

    pub fn navigate(&self, url: &str, action: Option<&str>) -> Result<(), String> {
        let (reply_tx, reply_rx) = bounded(1);
        self.send(
            BrowserCommand::Navigate {
                url: url.to_string(),
                action: action.map(|s| s.to_string()),
                reply: reply_tx,
            },
            reply_rx,
        )?
    }

    pub fn close(&self) -> Result<(), String> {
        let (reply_tx, reply_rx) = bounded(1);
        self.send(BrowserCommand::Close { reply: reply_tx }, reply_rx)?
    }

    pub fn current_url(&self) -> Result<String, String> {
        let (reply_tx, reply_rx) = bounded(1);
        self.send(BrowserCommand::CurrentUrl { reply: reply_tx }, reply_rx)?
    }

    pub fn eval(&self, code: &str) -> Result<(), String> {
        let (reply_tx, reply_rx) = bounded(1);
        self.send(
            BrowserCommand::Eval {
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
                BrowserCommand::Open { url, bounds, reply } => {
                    let result = cmd_open(inner, ctx.as_deref_mut(), window, &url, bounds);
                    let _ = reply.send(result);
                }
                BrowserCommand::Bounds { bounds, reply } => {
                    let result = cmd_bounds(inner, bounds);
                    let _ = reply.send(result);
                }
                BrowserCommand::Visible { visible, reply } => {
                    let result = cmd_visible(inner, visible);
                    let _ = reply.send(result);
                }
                BrowserCommand::Navigate { url, action, reply } => {
                    let result = cmd_navigate(inner, &url, action.as_deref());
                    let _ = reply.send(result);
                }
                BrowserCommand::Close { reply } => {
                    let result = cmd_close(inner);
                    let _ = reply.send(result);
                }
                BrowserCommand::CurrentUrl { reply } => {
                    let result = cmd_current_url(inner);
                    let _ = reply.send(result);
                }
                BrowserCommand::Eval { code, reply } => {
                    let result = cmd_eval(inner, &code);
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
    url: &str,
    bounds: Rect,
) -> Result<(), String> {
    // Singleton: si ya existe, reusar (warn si doble-open)
    if let Some(wv) = &inner.webview {
        eprintln!("[browser] singleton reuse url={} visible={} (pool de 1 WebView)", url, inner.visible);
        let _ = wv.load_url(url);
        let _ = wv.set_bounds(bounds);
        let _ = wv.set_visible(true);
        let _ = wv.set_memory_usage_level(MemoryUsageLevel::Normal);
        inner.url = url.to_string();
        inner.visible = true;
        return Ok(());
    }

    let ctx = ctx.ok_or("WebContext not initialized")?;
    let window = window.ok_or("Window not initialized")?;

    let wv = WebViewBuilder::with_web_context(ctx)
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
        .map_err(|e| format!("SubWebView create: {e}"))?;

    let _ = wv.set_bounds(bounds);
    let _ = wv.set_memory_usage_level(MemoryUsageLevel::Normal);

    inner.webview = Some(wv);
    inner.url = url.to_string();
    inner.visible = true;
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

fn cmd_bounds(inner: &mut SubWebViewInner, bounds: Rect) -> Result<(), String> {
    if let Some(wv) = &inner.webview {
        wv.set_bounds(bounds).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn cmd_visible(inner: &mut SubWebViewInner, visible: bool) -> Result<(), String> {
    if let Some(wv) = &inner.webview {
        let _ = wv.set_visible(visible);
        let level = if visible {
            MemoryUsageLevel::Normal
        } else {
            MemoryUsageLevel::Low
        };
        let _ = wv.set_memory_usage_level(level);
        inner.visible = visible;
    }
    Ok(())
}

fn cmd_navigate(inner: &mut SubWebViewInner, url: &str, action: Option<&str>) -> Result<(), String> {
    if let Some(wv) = &inner.webview {
        match action {
            Some("back") => {
                let _ = wv.evaluate_script("history.back()");
            }
            Some("forward") => {
                let _ = wv.evaluate_script("history.forward()");
            }
            Some("reload") => {
                let _ = wv.reload();
            }
            _ => {
                wv.load_url(url).map_err(|e| e.to_string())?;
            }
        }
    }
    Ok(())
}

fn cmd_close(inner: &mut SubWebViewInner) -> Result<(), String> {
    // WebView::drop() llama controller.Close() + DestroyWindow
    inner.webview = None;
    inner.url.clear();
    inner.visible = false;
    Ok(())
}

fn cmd_current_url(inner: &mut SubWebViewInner) -> Result<String, String> {
    if let Some(wv) = &inner.webview {
        return wv.url().map_err(|e| e.to_string());
    }
    Ok(inner.url.clone())
}

fn cmd_eval(inner: &mut SubWebViewInner, code: &str) -> Result<(), String> {
    if let Some(wv) = &inner.webview {
        return wv.evaluate_script(code).map_err(|e| e.to_string());
    }
    Ok(())
}
