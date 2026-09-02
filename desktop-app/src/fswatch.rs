//! File watcher kernel: `ReadDirectoryChangesW` vía `notify` crate.
//! Un solo watcher global, registra directorios de `AppState.projects` y `fsx` explorador.
//! Push a frontend vía `SSE`/`ws` (aquí solo log + invalidación de cache).

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use notify::{Watcher, RecursiveMode, Event, EventKind};

pub struct FsWatcher {
    watcher: Mutex<Option<notify::RecommendedWatcher>>,
    watched: Mutex<HashMap<PathBuf, bool>>,
    tx: crossbeam_channel::Sender<FsEvent>,
    rx: crossbeam_channel::Receiver<FsEvent>,
}

#[derive(Debug, Clone)]
pub struct FsEvent {
    pub path: PathBuf,
    pub kind: String,
}

impl FsWatcher {
    pub fn new() -> Arc<Self> {
        let (tx, rx) = crossbeam_channel::unbounded();
        Arc::new(Self {
            watcher: Mutex::new(None),
            watched: Mutex::new(HashMap::new()),
            tx,
            rx,
        })
    }

    pub fn ensure_init(self: &Arc<Self>) {
        let mut guard = self.watcher.lock().unwrap_or_else(|e| e.into_inner());
        if guard.is_some() { return; }
        let tx = self.tx.clone();
        let watcher = notify::recommended_watcher(move |res: Result<Event, _>| {
            if let Ok(ev) = res {
                let kind = match ev.kind {
                    EventKind::Create(_) => "create",
                    EventKind::Modify(_) => "modify",
                    EventKind::Remove(_) => "remove",
                    _ => "other",
                };
                for path in ev.paths {
                    let _ = tx.send(FsEvent { path: path.clone(), kind: kind.to_string() });
                    // También log para diagnóstico
                    eprintln!("fswatch: {kind} {}", path.display());
                }
            }
        });
        match watcher {
            Ok(w) => *guard = Some(w),
            Err(e) => eprintln!("fswatch: init failed {e}"),
        }
    }

    pub fn watch_dir(self: &Arc<Self>, dir: &Path) {
        self.ensure_init();
        let mut watched = self.watched.lock().unwrap_or_else(|e| e.into_inner());
        if watched.contains_key(dir) { return; }
        let mut watcher = self.watcher.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(w) = watcher.as_mut() {
            // No seguir enlaces, no recursivo por defecto para no saturar; caller puede elegir RecursiveMode
            let mode = RecursiveMode::NonRecursive;
            // Si es proyecto root, vigilar recursivo 1 nivel (dist, public, src)
            let mode = if dir.join("package.json").exists() || dir.join("Cargo.toml").exists() {
                RecursiveMode::Recursive
            } else { mode };
            match w.watch(dir, mode) {
                Ok(_) => { watched.insert(dir.to_path_buf(), true); eprintln!("fswatch: watching {}", dir.display()); }
                Err(e) => eprintln!("fswatch: watch {} failed {e}", dir.display()),
            }
        }
    }

    pub fn unwatch_dir(self: &Arc<Self>, dir: &Path) {
        if let Some(w) = self.watcher.lock().unwrap_or_else(|e| e.into_inner()).as_mut() {
            let _ = w.unwatch(dir);
        }
        self.watched.lock().unwrap_or_else(|e| e.into_inner()).remove(dir);
    }

    /// Poll no bloqueante para integrar en SSE loop si se desea
    pub fn try_recv(&self) -> Option<FsEvent> {
        self.rx.try_recv().ok()
    }

    /// Bloqueante con timeout para thread dedicado
    pub fn recv_timeout(&self, dur: Duration) -> Option<FsEvent> {
        self.rx.recv_timeout(dur).ok()
    }
}

/// Helper global singleton
pub fn global() -> Arc<FsWatcher> {
    static INSTANCE: std::sync::OnceLock<Arc<FsWatcher>> = std::sync::OnceLock::new();
    INSTANCE.get_or_init(|| FsWatcher::new()).clone()
}
