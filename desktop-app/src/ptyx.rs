//! Terminales (ConPTY vía portable-pty). Output por SSE, input por POST.

use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::TcpStream;
use std::sync::{Arc, Condvar, Mutex};
use std::time::Duration;

use portable_pty::{native_pty_system, CommandBuilder, Child, MasterPty, PtySize};

/// Buffer de salida del pty: ring buffer con condvar. Cada consumidor SSE
/// lleva su propio cursor (replay desde 0 en reconexión).
/// El buffer mantiene los últimos MAX_PTY_BYTES bytes; los más viejos se
/// descartan (en vez de bloquear tout el output nuevo como antes).
const MAX_PTY_BYTES: usize = 2 * 1024 * 1024; // 2 MB

pub struct PtyOutput {
    pub data: Mutex<Vec<u8>>,
    /// Bytes totales escritos (monotónico creciente). El cliente usa este
    /// valor como `len` para calcular su próximo `since`. Si el buffer
    /// recortó, el `since` del cliente puede ser menor que `base_offset` y
    /// se devuelve todo el buffer disponible.
    pub base_offset: std::sync::atomic::AtomicUsize,
    pub done: std::sync::atomic::AtomicBool,
    pub cv: Condvar,
}

impl PtyOutput {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            data: Mutex::new(Vec::new()),
            base_offset: std::sync::atomic::AtomicUsize::new(0),
            done: std::sync::atomic::AtomicBool::new(false),
            cv: Condvar::new(),
        })
    }
    pub fn append(&self, bytes: &[u8]) {
        let mut d = self.data.lock().unwrap_or_else(|e| e.into_inner());
        d.extend_from_slice(bytes);
        // Ring buffer: si excede el máximo, recortar la primera mitad.
        if d.len() > MAX_PTY_BYTES {
            let drain = d.len() / 2;
            d.drain(..drain);
            self.base_offset.fetch_add(drain, std::sync::atomic::Ordering::Relaxed);
        }
        drop(d);
        self.cv.notify_all();
    }
}

pub struct PtySession {
    pub id: String,
    pub shell: String,
    pub cwd: String,
    writer: Mutex<Option<Box<dyn Write + Send>>>,
    master: Mutex<Option<Box<dyn MasterPty + Send>>>,
    /// Handle del proceso hijo. `Option` + take(): un solo consumidor hace
    /// wait (kill o lector natural) y el otro lo encuentra vacío.
    child: Arc<Mutex<Option<Box<dyn Child + Send + Sync>>>>,
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
        let map = self.sessions.lock().unwrap_or_else(|e| e.into_inner());
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

    pub fn create(&self, shell_req: Option<String>, cwd: Option<String>) -> Result<String, String> {
        let (shell_exe, shell_args) = resolve_shell(shell_req.as_deref());
        let cwd = cwd.filter(|c| !c.is_empty());
        let pty_system = native_pty_system();
        let size = PtySize {
            rows: 30,
            cols: 100,
            pixel_width: 0,
            pixel_height: 0,
        };
        let pair = pty_system.openpty(size).map_err(|e| e.to_string())?;
        let mut cmd = CommandBuilder::new(&shell_exe);
        for arg in shell_args {
            cmd.arg(arg);
        }
        if let Some(dir) = &cwd {
            cmd.cwd(dir);
        }
        // Env para TUI bbox: UTF-8 + 256color + sin CI poisoning (termenv degrada a ASCII con CI=1)
        cmd.env("TERM", "xterm-256color");
        cmd.env("COLORTERM", "truecolor");
        cmd.env("LANG", std::env::var("LANG").unwrap_or_else(|_| "en_US.UTF-8".to_string()));
        // No propagar CI que rompe bubbletea/opentui (ver sst/opencode#3417)
        let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
        drop(pair.slave);
        let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
        let master = pair.master;
        let writer = master.take_writer().map_err(|e| e.to_string())?;
        let output = PtyOutput::new();
        let out = output.clone();
        // Handle compartido: kill() y el hilo lector compiten por hacer wait —
        // el take() bajo lock garantiza que solo uno lo haga (quiescencia).
        let child: Arc<Mutex<Option<Box<dyn Child + Send + Sync>>>> =
            Arc::new(Mutex::new(Some(child)));
        let child_for_reader = child.clone();
        // Hilo lector: vuelca el output del pty al buffer compartido.
        std::thread::spawn(move || {
            let mut buf = vec![0u8; 16384];
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => out.append(&buf[..n]),
                    Err(_) => break,
                }
            }
            out.done.store(true, std::sync::atomic::Ordering::SeqCst);
            out.cv.notify_all();
            // Salida natural (el usuario tipeó exit): reap del hijo para no
            // dejar zombie. Si kill() llegó primero, el take() devuelve None.
            if let Ok(mut guard) = child_for_reader.lock() {
                if let Some(mut c) = guard.take() {
                    let _ = c.wait();
                }
            }
        });
        let id = format!("pt{}", crate::state::now_ms());
        let session = PtySession {
            id: id.clone(),
            shell: shell_exe,
            cwd: cwd.unwrap_or_else(|| std::env::current_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or_default()),
            writer: Mutex::new(Some(writer)),
            master: Mutex::new(Some(master)),
            child,
            output,
        };
        self.sessions.lock().unwrap_or_else(|e| e.into_inner()).insert(id.clone(), session);
        Ok(id)
    }

    pub fn write(&self, id: &str, data: &[u8]) -> Result<(), String> {
        let map = self.sessions.lock().unwrap_or_else(|e| e.into_inner());
        let s = map.get(id).ok_or("pty no existe")?;
        let mut w = s.writer.lock().unwrap_or_else(|e| e.into_inner());
        match w.as_mut() {
            Some(w) => w.write_all(data).map_err(|e| e.to_string()),
            None => Err("pty cerrado".into()),
        }
    }

    pub fn resize(&self, id: &str, cols: u16, rows: u16) -> Result<(), String> {
        self.resize_px(id, cols, rows, 0, 0)
    }
    pub fn resize_px(&self, id: &str, cols: u16, rows: u16, pixel_width: u16, pixel_height: u16) -> Result<(), String> {
        let map = self.sessions.lock().unwrap_or_else(|e| e.into_inner());
        let s = map.get(id).ok_or("pty no existe")?;
        let m = s.master.lock().unwrap_or_else(|e| e.into_inner());
        match m.as_ref() {
            Some(m) => m
                .resize(PtySize {
                    rows,
                    cols,
                    pixel_width,
                    pixel_height,
                })
                .map_err(|e| e.to_string()),
            None => Err("pty cerrado".into()),
        }
    }

    /// Teardown con quiescencia (no solo "pedirla"): 1) señala done a los
    /// consumidores ANTES de matar para que los completados tardíos queden
    /// silenciosos; 2) cierra stdin y el pty master (el shell suele salir
    /// solo); 3) kill explícito + wait del hijo — sin huérfanos ni zombies.
    pub fn kill(&self, id: &str) {
        let mut map = self.sessions.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(s) = map.remove(id) {
            drop(map);
            s.output.done.store(true, std::sync::atomic::Ordering::SeqCst);
            s.output.cv.notify_all();
            *s.writer.lock().unwrap_or_else(|e| e.into_inner()) = None;
            *s.master.lock().unwrap_or_else(|e| e.into_inner()) = None;
            if let Ok(mut guard) = s.child.lock() {
                if let Some(mut c) = guard.take() {
                    let _ = c.kill();
                    let _ = c.wait();
                }
            }
        }
    }

    /// Buffer compartido de salida para streaming SSE (replay desde 0).
    pub fn stream_rx(&self, id: &str) -> Option<Arc<PtyOutput>> {
        let map = self.sessions.lock().unwrap_or_else(|e| e.into_inner());
        map.get(id).map(|s| s.output.clone())
    }
}

pub fn resolve_shell(shell_req: Option<&str>) -> (String, Vec<String>) {
    if cfg!(windows) {
        let req = shell_req.unwrap_or("").trim().to_lowercase();
        if req == "cmd" || req == "cmd.exe" {
            return ("cmd.exe".into(), vec![]);
        }
        if req == "bash" || req == "git-bash" {
            let paths = [
                r"C:\Program Files\Git\bin\bash.exe",
                r"C:\Program Files (x86)\Git\bin\bash.exe",
                "bash.exe",
            ];
            for p in paths {
                if std::path::Path::new(p).exists() {
                    return (p.into(), vec!["--login".into(), "-i".into()]);
                }
            }
            return ("bash.exe".into(), vec![]);
        }
        if req == "wsl" {
            return ("wsl.exe".into(), vec![]);
        }
        if req == "powershell" || req == "windows powershell" {
            let legacy = r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe";
            if std::path::Path::new(legacy).exists() {
                return (legacy.into(), vec!["-NoLogo".into()]);
            }
            return ("powershell.exe".into(), vec!["-NoLogo".into()]);
        }

        // Buscar primero la versión más reciente: PowerShell 7 (pwsh.exe)
        let pwsh_candidates = [
            r"C:\Program Files\PowerShell\7\pwsh.exe",
            r"C:\Program Files\PowerShell\7-preview\pwsh.exe",
            r"C:\Program Files (x86)\PowerShell\7\pwsh.exe",
        ];
        for p in pwsh_candidates {
            if std::path::Path::new(p).exists() {
                return (p.into(), vec!["-NoLogo".into()]);
            }
        }
        // Buscar pwsh en el PATH
        if let Ok(path_var) = std::env::var("PATH") {
            for dir in std::env::split_paths(&path_var) {
                let candidate = dir.join("pwsh.exe");
                if candidate.exists() {
                    return (candidate.to_string_lossy().to_string(), vec!["-NoLogo".into()]);
                }
            }
        }

        // Fallback a Windows PowerShell si pwsh no está disponible
        let ps_legacy = r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe";
        if std::path::Path::new(ps_legacy).exists() {
            return (ps_legacy.into(), vec!["-NoLogo".into()]);
        }
        ("cmd.exe".into(), vec![])
    } else {
        (shell_req.unwrap_or("sh").into(), vec![])
    }
}

pub fn default_shell() -> String {
    resolve_shell(None).0
}

// ======================================================== WebSocket (pty)
// Transporte en tiempo real para el terminal: cada conexión adjunta un pty
// (replay desde 0) y recibe frames binarios con el output apenas sale del
// ConPTY (escritura + flush directo al socket, sin buffers HTTP).

pub fn start_ws_server(registry: Arc<PtyRegistry>, port: u16) -> std::io::Result<()> {
    let listener = std::net::TcpListener::bind(("127.0.0.1", port))?;
    std::thread::Builder::new()
        .name("pty-ws".into())
        .spawn(move || {
            for stream in listener.incoming() {
                match stream {
                    Ok(s) => {
                        let reg = registry.clone();
                        std::thread::Builder::new()
                            .name("pty-ws-conn".into())
                            .spawn(move || handle_ws_conn(reg, s))
                            .ok();
                    }
                    Err(_) => std::thread::sleep(Duration::from_millis(30)),
                }
            }
        })
        .ok();
    Ok(())
}

fn ws_accept_key(key: &str) -> String {
    use sha1::{Digest, Sha1};
    let mut h = Sha1::new();
    h.update(key.as_bytes());
    h.update(b"258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
    crate::state::base64_encode(&h.finalize())
}

fn handle_ws_conn(registry: Arc<PtyRegistry>, mut stream: TcpStream) {
    // Handshake: leer headers hasta CRLFCRLF y responder 101.
    let mut buf = Vec::new();
    let mut tmp = [0u8; 1024];
    loop {
        match stream.read(&mut tmp) {
            Ok(0) => return,
            Ok(n) => {
                buf.extend_from_slice(&tmp[..n]);
                if buf.windows(4).any(|w| w == b"\r\n\r\n") {
                    break;
                }
                if buf.len() > 16 * 1024 {
                    return;
                }
            }
            Err(_) => return,
        }
    }
    let head = String::from_utf8_lossy(&buf);
    let key = head
        .lines()
        .find(|l| l.to_ascii_lowercase().starts_with("sec-websocket-key"))
        .and_then(|l| l.split_once(':').map(|(_, v)| v.trim().to_string()))
        .unwrap_or_default();
    let accept = ws_accept_key(&key);
    let resp = format!(
        "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: {accept}\r\n\r\n"
    );
    if stream.write_all(resp.as_bytes()).is_err() {
        return;
    }
    let _ = stream.flush();
    let _ = stream.set_nodelay(true);
    let _ = stream.set_read_timeout(None);
    let _ = stream.set_write_timeout(None);

    let mut read_stream = match stream.try_clone() {
        Ok(s) => s,
        Err(_) => return,
    };
    let write_sock = Arc::new(Mutex::new(stream));
    // Estado: el pty adjuntado + condvar para avisar al writer.
    let conn = Arc::new(WsConn {
        pty: Mutex::new(None),
        attached: Condvar::new(),
    });

    // Writer: stream del output (bloquea en el condvar de datos).
    {
        let write_sock = write_sock.clone();
        let conn = conn.clone();
        std::thread::Builder::new()
            .name("pty-ws-writer".into())
            .spawn(move || {
                // consumed es ABSOLUTO (base_offset + len del Vec): el ring
                // recorta la primera mitad al crecer y base_offset avanza —
                // un índice relativo quedaba > len y congelaba el stream.
                let mut consumed_abs: usize = 0;
                let mut last_id = String::new();
                loop {
                    let out = {
                        let mut p = match conn.pty.lock() { Ok(p) => p, Err(_) => return };
                        loop {
                            if let Some((id, o)) = &*p {
                                // Reattach a OTRO pty: resetear cursor para
                                // replayear su ring completo (terminal nuevo
                                // no arranca en negro).
                                if *id != last_id {
                                    last_id = id.clone();
                                    consumed_abs = 0;
                                }
                                break o.clone();
                            }
                            let (g, _) = match conn.attached.wait_timeout(p, Duration::from_millis(500)) { Ok(r) => r, Err(_) => return };
                            p = g;
                            // Si la conexión murió, salir.
                            if write_sock.lock().map(|s| s.peer_addr().is_err()).unwrap_or(true) {
                                return;
                            }
                        }
                    };
                    let data = match out.data.lock() { Ok(d) => d, Err(_) => return };
                    let base = out.base_offset.load(std::sync::atomic::Ordering::Relaxed);
                    if consumed_abs < base {
                        // Rotación: lo previo ya no existe — arrancar desde lo disponible.
                        consumed_abs = base;
                    }
                    let total = base + data.len();
                    if consumed_abs < total {
                        let start = consumed_abs - base;
                        let delta = data[start..].to_vec();
                        consumed_abs = total;
                        drop(data);
                        // Chunk en frames de 16KB para no congelar el hilo UI del WebView (TUI a 60fps)
                        const CHUNK: usize = 16 * 1024;
                        for chunk in delta.chunks(CHUNK) {
                            if ws_write_locked(&write_sock, 0x2, chunk).is_err() {
                                return;
                            }
                        }
                        continue;
                    }
                    if out.done.load(std::sync::atomic::Ordering::SeqCst) {
                        return;
                    }
                    let res = out.cv.wait_timeout(data, Duration::from_millis(1000));
                    match res {
                        Ok((g, _)) => drop(g),
                        Err(_) => return,
                    }
                }
            })
            .ok();
    }

    // Reader: frames del cliente (comandos).
    let mut frame: Vec<u8> = Vec::new();
    loop {
        frame.clear();
        let mut hdr = [0u8; 2];
        match read_exact_or(&mut read_stream, &mut hdr) {
            Ok(true) => {}
            _ => return,
        }
        let opcode = hdr[0] & 0x0F;
        let masked = hdr[1] & 0x80 != 0;
        let mut len = (hdr[1] & 0x7F) as u64;
        if len == 126 {
            let mut b = [0u8; 2];
            if !read_exact_or(&mut read_stream, &mut b).unwrap_or(false) {
                return;
            }
            len = u16::from_be_bytes(b) as u64;
        } else if len == 127 {
            let mut b = [0u8; 8];
            if !read_exact_or(&mut read_stream, &mut b).unwrap_or(false) {
                return;
            }
            len = u64::from_be_bytes(b);
        }
        if len > 16 * 1024 * 1024 {
            return;
        }
        let mut mask = [0u8; 4];
        if masked && !read_exact_or(&mut read_stream, &mut mask).unwrap_or(false) {
            return;
        }
        let mut payload = vec![0u8; len as usize];
        if len > 0 && !read_exact_or(&mut read_stream, &mut payload).unwrap_or(false) {
            return;
        }
        if masked {
            for (i, b) in payload.iter_mut().enumerate() {
                *b ^= mask[i & 3];
            }
        }

        match opcode {
            0x8 => return, // close
            0x9 => {
                let _ = ws_write_locked(&write_sock, 0xA, &payload); // ping -> pong
            }
            0x1 | 0x2 => {
                let text = String::from_utf8_lossy(&payload).to_string();
                if let Ok(cmd) = serde_json::from_str::<serde_json::Value>(&text) {
                    match cmd["cmd"].as_str().unwrap_or("") {
                        "attach" => {
                            if let Some(id) = cmd["id"].as_str() {
                                if let Some(out) = registry.stream_rx(id) {
                                    let mut p = match conn.pty.lock() { Ok(p) => p, Err(_) => return };
                                    *p = Some((id.to_string(), out));
                                    conn.attached.notify_all();
                                }
                            }
                        }
                        "write" | "input" => {
                            let id = conn.pty.lock().ok().and_then(|p| p.as_ref().map(|(i, _)| i.clone()));
                            if let Some(id) = id {
                                if let Some(d) = cmd["data"].as_str() {
                                    let _ = registry.write(&id, d.as_bytes());
                                }
                            }
                        }
                        "resize" => {
                            let id = conn.pty.lock().ok().and_then(|p| p.as_ref().map(|(i, _)| i.clone()));
                            if let Some(id) = id {
                                let cols = cmd["cols"].as_u64().unwrap_or(100) as u16;
                                let rows = cmd["rows"].as_u64().unwrap_or(30) as u16;
                                let pw = cmd["pixel_width"].as_u64().or(cmd["pixelWidth"].as_u64()).unwrap_or(0) as u16;
                                let ph = cmd["pixel_height"].as_u64().or(cmd["pixelHeight"].as_u64()).unwrap_or(0) as u16;
                                let _ = registry.resize_px(&id, cols, rows, pw, ph);
                            }
                        }
                        "kill" => {
                            let id = conn.pty.lock().ok().and_then(|p| p.as_ref().map(|(i, _)| i.clone()));
                            if let Some(id) = id {
                                registry.kill(&id);
                            }
                            return;
                        }
                        _ => {}
                    }
                }
            }
            _ => {}
        }
    }
}

struct WsConn {
    pty: Mutex<Option<(String, Arc<PtyOutput>)>>,
    attached: Condvar,
}

/// Lee exactamente `buf.len()` bytes; Ok(true) si completó, false si EOF/error.
fn read_exact_or(stream: &mut TcpStream, buf: &mut [u8]) -> std::io::Result<bool> {
    let mut read = 0;
    while read < buf.len() {
        match stream.read(&mut buf[read..]) {
            Ok(0) => return Ok(false),
            Ok(n) => read += n,
            Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
            Err(e) if e.kind() == std::io::ErrorKind::WouldBlock
                || e.kind() == std::io::ErrorKind::TimedOut => {
                std::thread::sleep(Duration::from_millis(5));
                continue;
            }
            Err(_) => return Ok(false),
        }
    }
    Ok(true)
}

fn ws_write_locked(sock: &Arc<Mutex<TcpStream>>, opcode: u8, payload: &[u8]) -> std::io::Result<()> {
    let mut stream = sock.lock().unwrap_or_else(|e| e.into_inner());
    let mut header = vec![0x80 | opcode];
    let len = payload.len();
    if len < 126 {
        header.push(len as u8);
    } else if len <= 0xFFFF {
        header.push(126);
        header.extend_from_slice(&(len as u16).to_be_bytes());
    } else {
        header.push(127);
        header.extend_from_slice(&(len as u64).to_be_bytes());
    }
    stream.write_all(&header)?;
    stream.write_all(payload)?;
    stream.flush()
}