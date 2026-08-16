//! Terminales (ConPTY vía portable-pty). Output por SSE, input por POST.

use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Condvar, Mutex};

use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};

/// Buffer de salida del pty: append-only con condvar. Cada consumidor SSE
/// lleva su propio cursor (replay desde 0 en reconexión).
pub struct PtyOutput {
    pub data: Mutex<Vec<u8>>,
    pub done: std::sync::atomic::AtomicBool,
    pub cv: Condvar,
}

impl PtyOutput {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            data: Mutex::new(Vec::new()),
            done: std::sync::atomic::AtomicBool::new(false),
            cv: Condvar::new(),
        })
    }
    pub fn append(&self, bytes: &[u8]) {
        let mut d = self.data.lock().unwrap();
        if d.len() < 1_048_576 {
            d.extend_from_slice(bytes);
        }
        drop(d);
        self.cv.notify_all();
    }
}

pub struct PtySession {
    pub id: String,
    pub shell: String,
    pub cwd: String,
    writer: Mutex<Box<dyn Write + Send>>,
    master: Mutex<Box<dyn MasterPty + Send>>,
    pub output: Arc<PtyOutput>,
}

pub struct PtyRegistry {
    sessions: Mutex<HashMap<String, PtySession>>,
}

impl Default for PtyRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl PtyRegistry {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }

    pub fn list(&self) -> Vec<serde_json::Value> {
        let map = self.sessions.lock().unwrap();
        map.values()
            .map(|s| {
                serde_json::json!({
                    "id": s.id,
                    "shell": s.shell,
                    "cwd": s.cwd,
                })
            })
            .collect()
    }

    pub fn create(&self, shell: Option<String>, cwd: Option<String>) -> Result<String, String> {
        let shell = shell.unwrap_or_else(default_shell);
        let cwd = cwd.filter(|c| !c.is_empty() && std::path::Path::new(c).is_dir());
        let pty_system = native_pty_system();
        let size = PtySize {
            rows: 30,
            cols: 100,
            pixel_width: 0,
            pixel_height: 0,
        };
        let pair = pty_system.openpty(size).map_err(|e| e.to_string())?;
        let mut cmd = CommandBuilder::new(&shell);
        if let Some(dir) = &cwd {
            cmd.cwd(dir);
        }
        let mut child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
        drop(pair.slave);
        let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
        let master = pair.master;
        let writer = master.take_writer().map_err(|e| e.to_string())?;
        let output = PtyOutput::new();
        let out = output.clone();
        // Hilo lector: vuelca el output del pty al buffer compartido.
        std::thread::spawn(move || {
            let mut buf = vec![0u8; 8192];
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => out.append(&buf[..n]),
                    Err(_) => break,
                }
            }
            out.done.store(true, std::sync::atomic::Ordering::SeqCst);
            out.cv.notify_all();
            let _ = child.wait();
        });
        let id = format!("pt{}", crate::state::now_ms());
        let session = PtySession {
            id: id.clone(),
            shell,
            cwd: cwd.unwrap_or_else(|| std::env::current_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or_default()),
            writer: Mutex::new(writer),
            master: Mutex::new(master),
            output,
        };
        self.sessions.lock().unwrap().insert(id.clone(), session);
        Ok(id)
    }

    pub fn write(&self, id: &str, data: &[u8]) -> Result<(), String> {
        let map = self.sessions.lock().unwrap();
        let s = map.get(id).ok_or("pty no existe")?;
        let mut w = s.writer.lock().unwrap();
        w.write_all(data).map_err(|e| e.to_string())
    }

    pub fn resize(&self, id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let map = self.sessions.lock().unwrap();
        let s = map.get(id).ok_or("pty no existe")?;
        let mut m = s.master.lock().unwrap();
        m.resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())
    }

    pub fn kill(&self, id: &str) {
        let mut map = self.sessions.lock().unwrap();
        if let Some(s) = map.remove(id) {
            s.output.done.store(true, std::sync::atomic::Ordering::SeqCst);
            s.output.cv.notify_all();
        }
    }

    /// Buffer compartido de salida para streaming SSE (replay desde 0).
    pub fn stream_rx(&self, id: &str) -> Option<Arc<PtyOutput>> {
        let map = self.sessions.lock().unwrap();
        map.get(id).map(|s| s.output.clone())
    }
}

fn default_shell() -> String {
    if std::path::Path::new("C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe")
        .exists()
    {
        "powershell.exe".into()
    } else {
        "cmd.exe".into()
    }
}