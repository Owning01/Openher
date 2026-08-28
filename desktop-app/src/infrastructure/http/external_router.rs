//! Router para proyectos externos on-demand (screenshots, vioeditor, informes, widget_notas)
//! Expone /shell/external/* con auto-start/stop sin UI manual.
//! Respeta regla FSD: no va en api.rs.

use std::collections::HashMap;
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use tiny_http::{Method, Request, Response};

use crate::state::{json_err, json_ok, AppState};

const CREATE_NO_WINDOW: u32 = 0x08000000;
const DETACHED_PROCESS: u32 = 0x00000008;
const CREATE_NEW_PROCESS_GROUP: u32 = 0x00000200;

#[derive(Clone)]
struct ExternalDef {
    dir: &'static str,
    port: Option<u16>,
    url: Option<&'static str>,
    dev_cmd: &'static str,
    prod_cmd: Option<&'static str>,
    prod_check: Option<&'static str>,
}

fn effective_cmd(def: &ExternalDef) -> &str {
    if let (Some(prod), Some(check)) = (def.prod_cmd, def.prod_check) {
        let p = PathBuf::from(def.dir).join(check);
        if p.exists() {
            return prod;
        }
    }
    def.dev_cmd
}

// Cache de probe 1.5s para que /list no haga 5 HTTP secuenciales de 350ms (=1.7s)
static PROBE_CACHE: std::sync::OnceLock<std::sync::Mutex<std::collections::HashMap<u16, (bool, std::time::Instant)>>> = std::sync::OnceLock::new();
fn cached_probe(port: u16, probe_fn: impl FnOnce() -> bool) -> bool {
    let cache = PROBE_CACHE.get_or_init(|| std::sync::Mutex::new(std::collections::HashMap::new()));
    if let Ok(map) = cache.lock() {
        if let Some((val, at)) = map.get(&port) {
            if at.elapsed() < Duration::from_millis(1500) {
                return *val;
            }
        }
    }
    let res = probe_fn();
    if let Ok(mut map) = cache.lock() {
        map.insert(port, (res, std::time::Instant::now()));
    }
    res
}

fn defs() -> HashMap<&'static str, ExternalDef> {
    let mut m = HashMap::new();
    m.insert("opendesign", ExternalDef {
        dir: r"G:\Proyectos\open-design",
        port: Some(3000),
        url: Some("http://127.0.0.1:3000"),
        dev_cmd: "pnpm tools-dev start web --web-port 3000 --daemon-port 3456",
        // opendesign prod (`start --prod`) cuelga en este entorno (IPC del daemon);
        // el path dev `start` queda vivo y prewarm lo hace instantáneo al click.
        prod_cmd: None,
        prod_check: Some(r"apps\web\.next\BUILD_ID"),
    });
    m.insert("screenshots", ExternalDef {
        dir: r"G:\Proyectos\0 screenshots",
        port: Some(3002),
        url: Some("http://127.0.0.1:3002"),
        dev_cmd: "pnpm exec next dev -p 3002 -H 127.0.0.1",
        prod_cmd: Some("pnpm exec next start -p 3002 -H 127.0.0.1"),
        prod_check: Some(r".next\BUILD_ID"),
    });
    m.insert("vioeditor", ExternalDef {
        dir: r"G:\Proyectos\17-vioeditor\aplicacion",
        port: Some(1420),
        url: Some("http://127.0.0.1:1420"),
        dev_cmd: "pnpm exec vite --port 1420 --host 127.0.0.1 --strictPort false",
        prod_cmd: Some("pnpm exec vite preview --port 1420 --host 127.0.0.1 --strictPort"),
        prod_check: Some(r"dist\index.html"),
    });
    m.insert("informes", ExternalDef {
        dir: r"G:\Proyectos\53plataforma-informes",
        port: Some(5174),
        url: Some("http://127.0.0.1:5174"),
        dev_cmd: "pnpm exec vite --port 5174 --host 127.0.0.1",
        prod_cmd: Some("pnpm exec vite preview --port 5174 --host 127.0.0.1"),
        prod_check: Some(r"dist\index.html"),
    });
    m.insert("widgetnotas", ExternalDef {
        dir: r"G:\Proyectos\HERRAMIENTAS-VARIAS\46widgetnotas",
        port: None,
        url: None,
        dev_cmd: "flutter run -d windows",
        prod_cmd: None,
        prod_check: None,
    });
    // alias por si el frontend usa nombre largo
    m.insert("plataforma-informes", ExternalDef {
        dir: r"G:\Proyectos\53plataforma-informes",
        port: Some(5174),
        url: Some("http://127.0.0.1:5174"),
        dev_cmd: "pnpm exec vite --port 5174 --host 127.0.0.1",
        prod_cmd: Some("pnpm exec vite preview --port 5174 --host 127.0.0.1"),
        prod_check: Some(r"dist\index.html"),
    });
    m
}

fn probe(def: &ExternalDef) -> bool {
    if let Some(port) = def.port {
        return cached_probe(port, || {
            let url = format!("http://127.0.0.1:{port}/");
            if ureq::builder()
                .timeout(Duration::from_millis(350))
                .build()
                .get(&url)
                .call()
                .is_ok()
            {
                return true;
            }
            crate::common::probe_http(port, "/", Duration::from_millis(350), &[200, 301, 302, 304])
        });
    } else {
        false
    }
}

pub fn probe_external(name: &str) -> bool {
    if let Some(def) = defs().get(name) {
        probe(def)
    } else {
        false
    }
}

fn external_manager(state: &AppState) -> Arc<crate::state::ExternalManager> {
    state.external.clone()
}

pub fn handle(
    _req: &mut Request,
    state: Arc<AppState>,
    path: &str,
    method: Method,
    _q: &dyn Fn(&str) -> String,
) -> Option<Response<std::io::Cursor<Vec<u8>>>> {
    // path: /shell/external/<name>/status | /start | /stop | /list
    if !path.starts_with("/shell/external") {
        return None;
    }

    let rest = path.strip_prefix("/shell/external").unwrap_or("");
    let rest = rest.trim_start_matches('/');
    // rest = "" | "list" | "<name>" | "<name>/status" etc
    if rest.is_empty() || rest == "list" {
        // lista todos con status — snapshot de procs para no mantener lock durante probe (350ms)
        let defs_map = defs();
        let mgr = external_manager(&state);
        let procs_snapshot: std::collections::HashSet<String> = {
            let procs = mgr.procs.lock().unwrap_or_else(|e| e.into_inner());
            procs.keys().cloned().collect()
        };
        let mut items = Vec::new();
        for (name, def) in defs_map.iter() {
            // evitar duplicado alias
            if *name == "plataforma-informes" { continue; }
            let running = if def.port.is_some() {
                let is_vite_embed = (*name == "vioeditor" || *name == "informes") && PathBuf::from(def.dir).join("dist").join("index.html").is_file();
                if is_vite_embed {
                    true
                } else {
                    if procs_snapshot.contains(*name) { true } else { probe(def) }
                }
            } else {
                procs_snapshot.contains(*name)
            };
            let url = def.url.map(|s| s.to_string()).unwrap_or_default();
            let mut stored_url = mgr.urls.lock().unwrap_or_else(|e| e.into_inner()).get(*name).cloned().unwrap_or(url.clone());
            if (*name == "vioeditor" || *name == "informes") && PathBuf::from(def.dir).join("dist").join("index.html").is_file() {
                let embed_url = format!("http://127.0.0.1:{}/shell/external/{}/embed/", state.port, name);
                if stored_url == url || stored_url.is_empty() {
                    stored_url = embed_url;
                }
            }
            items.push(serde_json::json!({
                "name": name,
                "title": match *name {
                    "opendesign" => "Open Design",
                    "screenshots" => "Screenshots",
                    "vioeditor" => "VioEditor",
                    "informes" => "Plataforma Informes",
                    "widgetnotas" => "Widget Notas",
                    _ => name,
                },
                "dir": def.dir,
                "port": def.port,
                "url": stored_url,
                "running": running,
            }));
        }
        return Some(json_ok(&serde_json::json!({ "ok": true, "items": items })));
    }

    // Embed static: /shell/external/<name>/embed/<path> → sirve dist via mmap sin Node (vite preview 0ms)
    if let Some((embed_name, embed_rest)) = rest.split_once("/embed") {
        let rel = embed_rest.trim_start_matches('/');
        let rel = if rel.is_empty() { "index.html" } else { rel };
        if let Some(def) = defs().get(embed_name) {
            let mut embed_root = PathBuf::from(def.dir);
            if let Some(check) = def.prod_check {
                if check.contains("dist") {
                    embed_root = embed_root.join("dist");
                }
            }
            // mmap fast path
            if let Some((bytes, mime)) = crate::common::serve_file_mmap(&embed_root, rel) {
                let is_html = mime.starts_with("text/html");
                let resp = if is_html {
                    tiny_http::Response::from_data(bytes)
                        .with_status_code(200)
                        .with_header(tiny_http::Header::from_bytes("Content-Type", mime).unwrap())
                        .with_header(tiny_http::Header::from_bytes("Cache-Control", "no-cache").unwrap())
                } else {
                    tiny_http::Response::from_data(bytes)
                        .with_status_code(200)
                        .with_header(tiny_http::Header::from_bytes("Content-Type", mime).unwrap())
                        .with_header(tiny_http::Header::from_bytes("Cache-Control", "public, max-age=31536000, immutable").unwrap())
                };
                return Some(resp);
            }
            return Some(json_err(404, &format!("embed no encontrado: {rel} en {}", embed_root.display())));
        }
    }

    // parse <name>[/action]
    let (name, action) = match rest.split_once('/') {
        Some((n, a)) => (n, a),
        None => (rest, "status"),
    };
    let name = name.to_string();
    let defs_map = defs();
    let def = match defs_map.get(name.as_str()) {
        Some(d) => d.clone(),
        None => return Some(json_err(404, "proyecto externo no existe")),
    };

    let mgr = external_manager(&state);

    if action == "status" && method == Method::Get {
        let running = if def.port.is_some() {
            let is_vite_embed = (name == "vioeditor" || name == "informes") && PathBuf::from(def.dir).join("dist").join("index.html").is_file();
            if is_vite_embed {
                true
            } else {
                let has_proc = mgr.procs.lock().unwrap_or_else(|e| e.into_inner()).contains_key(&name);
                if has_proc { true } else { probe(&def) }
            }
        } else {
            mgr.procs.lock().unwrap_or_else(|e| e.into_inner()).contains_key(&name)
        };
        let url = def.url.map(|s| s.to_string()).unwrap_or_default();
        let mut stored = mgr.urls.lock().unwrap_or_else(|e| e.into_inner()).get(&name).cloned().unwrap_or(url.clone());
        // Si es vite embed y no hay URL guardada, usar embed URL
        if (name == "vioeditor" || name == "informes") && PathBuf::from(def.dir).join("dist").join("index.html").is_file() {
            let embed_url = format!("http://127.0.0.1:{}/shell/external/{}/embed/", state.port, name);
            if stored == url || stored.is_empty() {
                stored = embed_url;
            }
        }
        return Some(json_ok(&serde_json::json!({ "ok": true, "name": name, "running": running, "url": stored, "dir": def.dir, "port": def.port })));
    }

    if action == "start" && method == Method::Post {
        // si ya running, retornar ok — verificar zombie (try_wait) sin mantener lock durante probe
        let already_running = {
            let mut procs = mgr.procs.lock().unwrap_or_else(|e| e.into_inner());
            if let Some(child) = procs.get_mut(&name) {
                match child.try_wait() {
                    Ok(Some(_)) => { procs.remove(&name); None }
                    Ok(None) => {
                        let url = def.url.map(|s| s.to_string()).unwrap_or_default();
                        Some(url)
                    }
                    Err(_) => { procs.remove(&name); None }
                }
            } else { None }
        };
        if let Some(url) = already_running {
            let stored = mgr.urls.lock().unwrap_or_else(|e| e.into_inner()).get(&name).cloned().unwrap_or(url.clone());
            return Some(json_ok(&serde_json::json!({ "ok": true, "already": true, "url": stored })));
        }
        // probe si ya está corriendo externamente (usuario lo lanzó manual) — skip para vite embed, sin lock
        {
            let is_vite_embed = (name == "vioeditor" || name == "informes") && PathBuf::from(def.dir).join("dist").join("index.html").is_file();
            if !is_vite_embed && def.port.is_some() && probe(&def) {
                let url = def.url.map(|s| s.to_string()).unwrap_or_default();
                return Some(json_ok(&serde_json::json!({ "ok": true, "already": true, "url": url, "external": true })));
            }
        }
        // Nunca permitir que dos plugins compartan el mismo puerto
        if let Some(port) = def.port {
            for (other_name, other_def) in defs_map.iter() {
                if *other_name == name.as_str() || *other_name == "plataforma-informes" { continue; }
                if other_def.port == Some(port) {
                    return Some(json_err(409, &format!("puerto {} ya configurado para '{}', '{}' no puede usar el mismo puerto", port, other_name, name)));
                }
            }
            if probe(&def) {
                let owner = defs_map
                    .iter()
                    .find(|(n, d)| *n != &name.as_str() && d.port == Some(port))
                    .map(|(n, _)| *n)
                    .unwrap_or("proceso externo");
                return Some(json_err(409, &format!("puerto {} ya en uso por '{}', no se puede iniciar '{}'", port, owner, name)));
            }
        }
        // Embed static 0ms para vite plugins con dist (sin Node) — vite preview reemplazado por mmap
        if name == "vioeditor" || name == "informes" || name == "plataforma-informes" {
            let embed_dist = PathBuf::from(def.dir).join("dist").join("index.html");
            if embed_dist.is_file() {
                let url = format!("http://127.0.0.1:{}/shell/external/{}/embed/", state.port, name);
                {
                    let mut urls = mgr.urls.lock().unwrap_or_else(|e| e.into_inner());
                    urls.insert(name.clone(), url.clone());
                }
                eprintln!("external: {} embed static → {} (sin spawn)", name, url);
                return Some(json_ok(&serde_json::json!({ "ok": true, "already": true, "url": url, "embed": true })));
            }
        }
        let dir = PathBuf::from(def.dir);
        if !dir.exists() {
            return Some(json_err(404, &format!("directorio no existe: {}", def.dir)));
        }
        let cmd_str = effective_cmd(&def);
        // log file para debug (data/external-<name>.log)
        let log_path = crate::state::data_dir().join(format!("external-{}.log", name));
        let _ = std::fs::create_dir_all(crate::state::data_dir());
        let log_file = std::fs::OpenOptions::new().create(true).append(true).open(&log_path).ok();
        // Spawn: sin ventana (CREATE_NO_WINDOW+DETACHED), pnpm directo sin cmd para no mostrar consola
        let mut child: std::process::Child = if cmd_str.starts_with("flutter") {
            // flutter es .bat, necesita cmd pero oculto
            let mut c = std::process::Command::new("cmd");
            c.args(["/c", cmd_str]);
            c.current_dir(&dir);
            c.creation_flags(CREATE_NO_WINDOW | DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP);
            c.stdin(std::process::Stdio::null());
            if let Some(f) = log_file {
                // duplicar handle para stdout/stderr
                if let Ok(cloned) = f.try_clone() {
                    c.stdout(std::process::Stdio::from(cloned));
                }
                c.stderr(std::process::Stdio::from(f));
            } else {
                c.stdout(std::process::Stdio::null());
                c.stderr(std::process::Stdio::null());
            }
            match c.spawn() {
                Ok(ch) => ch,
                Err(e) => return Some(json_err(500, &e.to_string())),
            }
        } else {
            // pnpm directo oculto sin cmd visible: evita conhost S/N y WindowsTerminal. Usa pnpm.cmd de Node24.
            let pnpm_bin = r"G:\Dev\nodejs-24\pnpm.cmd";
            let args: Vec<&str> = cmd_str.split_whitespace().skip(1).collect();
            let mut c = std::process::Command::new(pnpm_bin);
            if !args.is_empty() {
                c.args(&args);
            }
            c.current_dir(&dir);
            // PATH con Node24 primero para que el binario encuentre node
            let cur_path = std::env::var("PATH").unwrap_or_default();
            c.env("PATH", format!(r"G:\Dev\nodejs-24;G:\Dev\nodejs-24\node_modules\.bin;{cur_path}"));
            c.creation_flags(CREATE_NO_WINDOW | DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP);
            c.stdin(std::process::Stdio::null());
            if let Some(f) = log_file {
                if let Ok(cloned) = f.try_clone() {
                    c.stdout(std::process::Stdio::from(cloned));
                }
                c.stderr(std::process::Stdio::from(f));
            } else {
                c.stdout(std::process::Stdio::null());
                c.stderr(std::process::Stdio::null());
            }
            match c.spawn() {
                Ok(ch) => ch,
                Err(e) => return Some(json_err(500, &e.to_string())),
            }
        };
        let pid = child.id();
        // early exit check: si falla al instante, verificar si es daemon already running (opendesign) con web sí arrancada
        std::thread::sleep(Duration::from_millis(900));
        if let Ok(Some(status)) = child.try_wait() {
            // Para opendesign, tools-dev start con daemon ya corriendo sale con code 1 pero web sí inicia (manual start lo hace)
            if name == "opendesign" {
                std::thread::sleep(Duration::from_millis(500));
                if probe(&def) {
                    let url = def.url.map(|s| s.to_string()).unwrap_or_default();
                    {
                        let mut urls = mgr.urls.lock().unwrap_or_else(|e| e.into_inner());
                        urls.insert(name.clone(), url.clone());
                    }
                    eprintln!("external: {} start con daemon already running pero web ok → pid {}", name, pid);
                    return Some(json_ok(&serde_json::json!({ "ok": true, "pid": pid, "url": url, "dir": def.dir, "daemon_already": true })));
                }
            }
            let code = status.code().unwrap_or(-1);
            let log_tail = std::fs::read_to_string(crate::state::data_dir().join(format!("external-{}.log", name))).unwrap_or_default();
            let tail = log_tail.chars().rev().take(800).collect::<String>().chars().rev().collect::<String>();
            return Some(json_err(500, &format!("proceso salió inmediato (code {code}): {tail} | cmd: {cmd_str}")));
        }
        let url = def.url.map(|s| s.to_string()).unwrap_or_default();
        // guardar
        {
            let mut procs = mgr.procs.lock().unwrap_or_else(|e| e.into_inner());
            procs.insert(name.clone(), child);
        }
        {
            let mut urls = mgr.urls.lock().unwrap_or_else(|e| e.into_inner());
            urls.insert(name.clone(), url.clone());
        }
        // cleanup thread: espera y remueve al salir
        let mgr_clone = mgr.clone();
        let name_clone = name.clone();
        std::thread::spawn(move || {
            // esperar a que el child termine (poll)
            loop {
                std::thread::sleep(Duration::from_secs(2));
                let mut procs = match mgr_clone.procs.lock() {
                    Ok(g) => g,
                    Err(_) => break,
                };
                if let Some(ch) = procs.get_mut(&name_clone) {
                    match ch.try_wait() {
                        Ok(Some(_)) => {
                            procs.remove(&name_clone);
                            break;
                        }
                        Ok(None) => {},
                        Err(_) => { procs.remove(&name_clone); break; }
                    }
                } else {
                    break;
                }
                drop(procs);
            }
        });

        return Some(json_ok(&serde_json::json!({ "ok": true, "pid": pid, "url": url, "dir": def.dir })));
    }

    if action == "stop" && method == Method::Post {
        let mut procs = mgr.procs.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(mut child) = procs.remove(&name) {
            let pid = child.id();
            // Matar árbol completo sin prompt S/N (cmd batch): taskkill /F /T
            let _ = std::process::Command::new("taskkill")
                .args(["/F", "/T", "/PID", &pid.to_string()])
                .creation_flags(CREATE_NO_WINDOW)
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .stdin(std::process::Stdio::null())
                .spawn()
                .and_then(|mut c| c.wait());
            let _ = child.kill();
            let _ = child.wait();
            // También matar por puerto si es open-design (daemon huérfano)
            if name == "opendesign" {
                let _ = std::process::Command::new("taskkill")
                    .args(["/F", "/IM", "node.exe"])
                    .creation_flags(CREATE_NO_WINDOW)
                    .stdout(std::process::Stdio::null())
                    .stderr(std::process::Stdio::null())
                    .spawn();
            }
            return Some(json_ok(&serde_json::json!({ "ok": true, "stopped": true })));
        } else {
            return Some(json_ok(&serde_json::json!({ "ok": true, "stopped": false, "msg": "no hay proceso gestionado" })));
        }
    }

    Some(json_err(404, "ruta external no encontrada"))
}
