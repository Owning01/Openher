//! Sub-WebView2 manager: browser embebido con WebContext compartido.
//!
//! Crea un segundo WebView2 como child del mismo HWND, compartiendo
//! red/GPU/cache con el principal. Usa `MemoryUsageLevel::Low` cuando
//! no está visible (~3 MB en vez de ~80 MB).
//!
//! La creación del WebView DEBE ocurrir en el thread principal (winit
//! event loop). El API HTTP corre en otro thread, así que usamos un
//! canal mpsc para enviar comandos al main thread y recibir resultados.

use std::sync::mpsc;
use wry::{MemoryUsageLevel, Rect, WebView, WebViewBuilder, WebViewBuilderExtWindows, WebViewExtWindows};

/// Comando enviado desde el thread HTTP al main thread para crear/manipular
/// el sub-WebView.
pub enum BrowserCommand {
    Open {
        url: String,
        bounds: Rect,
        reply: mpsc::Sender<Result<(), String>>,
    },
    Bounds {
        bounds: Rect,
        reply: mpsc::Sender<Result<(), String>>,
    },
    Visible {
        visible: bool,
        reply: mpsc::Sender<Result<(), String>>,
    },
    Navigate {
        url: String,
        action: Option<String>,
        reply: mpsc::Sender<Result<(), String>>,
    },
    Close {
        reply: mpsc::Sender<Result<(), String>>,
    },
    CurrentUrl {
        reply: mpsc::Sender<Result<String, String>>,
    },
}

/// Estado del sub-WebView (solo se accede desde el main thread).
pub struct SubWebViewInner {
    pub webview: Option<WebView>,
    pub url: String,
    pub visible: bool,
}

/// Manager que despacha comandos al main thread vía canal.
pub struct SubWebViewManager {
    pub tx: mpsc::Sender<BrowserCommand>,
}

impl SubWebViewManager {
    /// Crea el manager y spawnea el thread receptor de comandos.
    /// `web_context` y `window` se usan en el main thread para construir WebViews.
    pub fn new() -> (Self, mpsc::Receiver<BrowserCommand>) {
        let (tx, rx) = mpsc::channel();
        (Self { tx }, rx)
    }

    pub fn send<T>(&self, cmd: BrowserCommand, rx: mpsc::Receiver<T>) -> Result<T, String> {
        self.tx.send(cmd).map_err(|_| "main thread gone".to_string())?;
        rx.recv().map_err(|_| "main thread dropped reply".to_string())
    }

    pub fn open(&self, url: &str, bounds: Rect) -> Result<(), String> {
        let (reply_tx, reply_rx) = mpsc::channel();
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
        let (reply_tx, reply_rx) = mpsc::channel();
        self.send(BrowserCommand::Bounds { bounds, reply: reply_tx }, reply_rx)?
    }

    pub fn set_visible(&self, visible: bool) -> Result<(), String> {
        let (reply_tx, reply_rx) = mpsc::channel();
        self.send(BrowserCommand::Visible { visible, reply: reply_tx }, reply_rx)?
    }

    pub fn navigate(&self, url: &str, action: Option<&str>) -> Result<(), String> {
        let (reply_tx, reply_rx) = mpsc::channel();
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
        let (reply_tx, reply_rx) = mpsc::channel();
        self.send(BrowserCommand::Close { reply: reply_tx }, reply_rx)?
    }

    pub fn current_url(&self) -> Result<String, String> {
        let (reply_tx, reply_rx) = mpsc::channel();
        self.send(BrowserCommand::CurrentUrl { reply: reply_tx }, reply_rx)?
    }
}

/// Procesa comandos en el main thread. Llamar desde `App::window_event`
/// o un timer periódico. Retorna `true` si procesó algo.
pub fn process_browser_commands(
    rx: &mpsc::Receiver<BrowserCommand>,
    inner: &mut SubWebViewInner,
    ctx: Option<&mut wry::WebContext>,
    window: Option<&winit::window::Window>,
) {
    let mut ctx = ctx;
    // Drain todos los comandos pendientes (non-blocking)
    while let Ok(cmd) = rx.try_recv() {
        match cmd {
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
    // Si ya existe solo navegamos
    if let Some(wv) = &inner.webview {
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
        .with_focused(false)
        .with_additional_browser_args(
            "--process-per-site --renderer-process-limit=1 \
             --disable-background-networking --disable-background-timer-throttling \
             --disable-renderer-backgrounding \
             --enable-gpu --ignore-gpu-blocklist \
             --disable-web-security --disable-site-isolation-trials \
             --disable-features=IsolateOrigins,site-per-process",
        )
        .build_as_child(window)
        .map_err(|e| format!("SubWebView create: {e}"))?;

    let _ = wv.set_bounds(bounds);
    let _ = wv.set_memory_usage_level(MemoryUsageLevel::Normal);

    inner.webview = Some(wv);
    inner.url = url.to_string();
    inner.visible = true;
    Ok(())
}

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
