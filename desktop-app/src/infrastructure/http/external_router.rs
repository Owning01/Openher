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

fn split_cmd(cmd: &str) -> Vec<String> {
    let mut res = Vec::new();
    let mut cur = String::new();
    let mut in_quotes = false;
    for c in cmd.chars() {
        match c {
            '"' => in_quotes = !in_quotes,
            ' ' | '\t' if !in_quotes => {
                if !cur.is_empty() {
                    res.push(cur.clone());
                    cur.clear();
                }
            }
            _ => cur.push(c),
        }
    }
    if !cur.is_empty() {
        res.push(cur);
    }
    res
}

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

fn file_mtime_ms(path: &PathBuf) -> u128 {
    std::fs::metadata(path)
        .and_then(|m| m.modified())
        .map(|t| t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_millis())
        .unwrap_or(0)
}

fn dir_max_mtime(dir: &PathBuf, depth: usize) -> u128 {
    let mut max = file_mtime_ms(dir);
    if depth == 0 { return max; }
    let entries = match std::fs::read_dir(dir) { Ok(e) => e, Err(_) => return max };
    for ent in entries.flatten() {
        let p = ent.path();
        let name = ent.file_name().to_string_lossy().to_string();
        // ignorar directorios pesados que no aportan a HMR / build
        if p.is_dir() {
            if name == "node_modules" || name == ".git" || name == "target" || name == ".next" || name == "dist" { 
                // para dist sí queremos su mtime ya capturado vía file, pero no recursivo profundo
                let m = file_mtime_ms(&p);
                if m > max { max = m; }
                continue;
            }
            let m = dir_max_mtime(&p, depth - 1);
            if m > max { max = m; }
        } else {
            let m = file_mtime_ms(&p);
            if m > max { max = m; }
        }
    }
    max
}

fn plugin_mtime(def: &ExternalDef) -> u128 {
    let dist_html = PathBuf::from(def.dir).join("dist").join("index.html");
    if dist_html.is_file() {
        return file_mtime_ms(&dist_html);
    }
    // para dev sin dist, mirar src/public y root con profundidad 2
    let root = PathBuf::from(def.dir);
    dir_max_mtime(&root, 2)
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

fn invalidate_probe(port: u16) {
    if let Some(cache) = PROBE_CACHE.get() {
        if let Ok(mut map) = cache.lock() {
            map.remove(&port);
        }
    }
}

fn defs() -> HashMap<&'static str, ExternalDef> {
    let mut m = HashMap::new();
    m.insert("opendesign", ExternalDef {
        dir: r"G:\Proyectos\open-design",
        port: Some(3000),
        url: Some("http://127.0.0.1:3000"),
        dev_cmd: r#"G:\Dev\nodejs-24\node_hidden.exe "G:\Proyectos\open-design\tools\dev\bin\tools-dev.mjs" start web --web-port 3000 --daemon-port 3456"#,
        // opendesign prod (`start --prod`) cuelga en este entorno (IPC del daemon);
        // el path dev `start` queda vivo y prewarm lo hace instantáneo al click.
        prod_cmd: None,
        prod_check: Some(r"apps\web\.next\BUILD_ID"),
    });
    m.insert("vioeditor", ExternalDef {
        dir: r"G:\Proyectos\17-vioeditor\aplicacion",
        port: Some(1420),
        url: Some("http://127.0.0.1:1420"),
        dev_cmd: "pnpm exec vite --port 1420 --host 127.0.0.1 --strictPort false",
        prod_cmd: Some("pnpm exec vite preview --port 1420 --host 127.0.0.1 --strictPort"),
        prod_check: Some(r"dist\index.html"),
    });
    m.insert("screenshots", ExternalDef {
        dir: r"G:\Proyectos\0 screenshots",
        port: Some(3002),
        url: Some("http://127.0.0.1:3002"),
        dev_cmd: r#"G:\Dev\nodejs-24\node.exe "G:\Proyectos\0 screenshots\node_modules\next\dist\bin\next" dev -p 3002 -H 127.0.0.1"#,
        prod_cmd: Some(r#"G:\Dev\nodejs-24\node.exe "G:\Proyectos\0 screenshots\node_modules\next\dist\bin\next" start -p 3002 -H 127.0.0.1"#),
        prod_check: Some(r".next\BUILD_ID"),
    });
    m.insert("m3e-canvas", ExternalDef {
        dir: r"G:\Proyectos\m3e-canvas",
        port: Some(3005),
        url: Some("http://127.0.0.1:3005"),
        dev_cmd: r#"G:\Dev\nodejs-24\node.exe "G:\Proyectos\m3e-canvas\node_modules\next\dist\bin\next" dev -p 3005 -H 127.0.0.1"#,
        // static export (`output: export`): `next start` no aplica; dev always (igual que screenshots).
        prod_cmd: None,
        prod_check: None,
    });
    m
}

fn probe(def: &ExternalDef) -> bool {
    if let Some(port) = def.port {
        // TCP connect rápido: si el puerto está LISTENING, considerar running aunque HTTP tarde en compilar (Next Turbopack)
        let tcp_ok = {
            use std::net::{SocketAddr, TcpStream};
            let addr: SocketAddr = format!("127.0.0.1:{port}").parse().unwrap();
            TcpStream::connect_timeout(&addr, Duration::from_millis(250)).is_ok()
        };
        if tcp_ok {
            return true;
        }
        let timeout = if def.port == Some(3000) || def.port == Some(3002) {
            Duration::from_millis(1800)
        } else {
            Duration::from_millis(700)
        };
        cached_probe(port, || {
            let url = format!("http://127.0.0.1:{port}/");
            if ureq::builder()
                .timeout(timeout)
                .build()
                .get(&url)
                .call()
                .is_ok()
            {
                return true;
            }
            crate::common::probe_http(port, "/", timeout, &[200, 301, 302, 304])
        })
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
            let running = if def.port.is_some() {
                let is_vite_embed = *name == "vioeditor" && PathBuf::from(def.dir).join("dist").join("index.html").is_file();
                if is_vite_embed {
                    true
                } else {
                    // verificar probe incluso si hay proc (evita zombie con puerto caído)
                    probe(def)
                }
            } else {
                procs_snapshot.contains(*name)
            };
            let url = def.url.map(|s| s.to_string()).unwrap_or_default();
            let mut stored_url = mgr.urls.lock().unwrap_or_else(|e| e.into_inner()).get(*name).cloned().unwrap_or(url.clone());
            if *name == "vioeditor" && PathBuf::from(def.dir).join("dist").join("index.html").is_file() {
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
            // mmap fast path — para HTML inyectar <base href> y reescribir /assets absolutos (vite build base="/")
            if let Some((bytes, mime)) = crate::common::serve_file_mmap(&embed_root, rel) {
                let is_html = mime.starts_with("text/html");
                let resp = if is_html {
                    let mut html = String::from_utf8_lossy(&bytes).to_string();
                    let base = format!("/shell/external/{}/embed/", embed_name);
                    // reescribir antes de inyectar <base> para no duplicar el propio base href
                    // <base> no afecta rutas absolutas /assets — convertir a embed base para compat con builds viejos base="/"
                    html = html.replace("href=\"/", &format!("href=\"{base}"));
                    html = html.replace("src=\"/", &format!("src=\"{base}"));
                    html = html.replace("href='/", &format!("href='{}", base));
                    html = html.replace("src='/", &format!("src='{}", base));
                    if html.contains("<head>") {
                        html = html.replacen("<head>", &format!("<head><base href=\"{}\">", base), 1);
                    } else if html.contains("<head ") {
                        // <head attr> → insertar después
                        if let Some(pos) = html.find("<head") {
                            if let Some(end) = html[pos..].find('>') {
                                let insert_pos = pos + end + 1;
                                html.insert_str(insert_pos, &format!("<base href=\"{}\">", base));
                            }
                        }
                    }
                    // inyectar reenvío de contextmenu + Ctrl+Shift+R hacia el parent (para menú Reiniciar / Borrar caché)
                    let fwd_script = format!(
                        r#"<script>(function(){{var PLUGIN='{}';document.addEventListener('contextmenu',function(e){{try{{e.preventDefault();parent.postMessage({{type:'plugin-contextmenu',plugin:PLUGIN,x:e.clientX,y:e.clientY}},'*');}}catch(_ ){{}} }});document.addEventListener('keydown',function(e){{if((e.ctrlKey||e.metaKey)&&e.shiftKey&&String(e.key).toLowerCase()==='r'){{try{{e.preventDefault();parent.postMessage({{type:'plugin-hard-reload',plugin:PLUGIN}},'*');}}catch(_ ){{}} }} }});}})();</script>"#,
                        embed_name
                    );
                    if html.contains("</head>") {
                        html = html.replacen("</head>", &format!("{}</head>", fwd_script), 1);
                    } else if html.contains("<head>") || html.contains("<head ") {
                        // ya tiene base inyectada, añadir después de <head...>
                        if let Some(pos) = html.find("<base") {
                            if let Some(end) = html[pos..].find('>') {
                                let ins = pos + end + 1;
                                html.insert_str(ins, &fwd_script);
                            }
                        }
                    } else {
                        html = format!("{}{}", fwd_script, html);
                    }
                    tiny_http::Response::from_data(html.into_bytes())
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
            let is_vite_embed = (name == "vioeditor" ) && PathBuf::from(def.dir).join("dist").join("index.html").is_file();
            if is_vite_embed {
                true
            } else {
                probe(&def)
            }
        } else {
            mgr.procs.lock().unwrap_or_else(|e| e.into_inner()).contains_key(&name)
        };
        let url = def.url.map(|s| s.to_string()).unwrap_or_default();
        let mut stored = mgr.urls.lock().unwrap_or_else(|e| e.into_inner()).get(&name).cloned().unwrap_or(url.clone());
        // Si es vite embed y no hay URL guardada, usar embed URL
        if (name == "vioeditor" ) && PathBuf::from(def.dir).join("dist").join("index.html").is_file() {
            let embed_url = format!("http://127.0.0.1:{}/shell/external/{}/embed/", state.port, name);
            if stored == url || stored.is_empty() {
                stored = embed_url;
            }
        }
        return Some(json_ok(&serde_json::json!({ "ok": true, "name": name, "running": running, "url": stored, "dir": def.dir, "port": def.port })));
    }

    if action == "start" && method == Method::Post {
        // Anti-doble-spawn: si otro /start del mismo plugin está en curso (<20s),
        // no spawnear otro tools-dev (StrictMode / prewarm / doble instancia).
        {
            let mut starting = mgr.starting.lock().unwrap_or_else(|e| e.into_inner());
            if let Some(at) = starting.get(&name) {
                if at.elapsed() < Duration::from_secs(20) {
                    let url = mgr.urls.lock().unwrap_or_else(|e| e.into_inner()).get(&name).cloned()
                        .unwrap_or_else(|| def.url.map(|s| s.to_string()).unwrap_or_default());
                    return Some(json_ok(&serde_json::json!({ "ok": true, "already": true, "starting": true, "url": url })));
                } else {
                    starting.remove(&name);
                }
            }
            starting.insert(name.clone(), std::time::Instant::now());
        }
        // si ya running, retornar ok — verificar zombie (try_wait); el puerto
        // puede tardar ~9s en abrir (opendesign cold), así que solo se evicta
        // como zombie si lleva >25s vivo sin responder (gracia de boot).
        let already_running: Option<String> = {
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
            let is_vite_embed = (name == "vioeditor" ) && PathBuf::from(def.dir).join("dist").join("index.html").is_file();
            let need_probe = !is_vite_embed && def.port.is_some();
            let boot_elapsed = mgr.spawned_at.lock().unwrap_or_else(|e| e.into_inner()).get(&name).map(|t| t.elapsed());
            // Sin timestamp (prewarm viejo) → tratar como reciente, no evictar.
            let in_grace = boot_elapsed.map(|e| e < Duration::from_secs(25)).unwrap_or(true);
            if need_probe && !in_grace && !probe(&def) {
                // zombie real: vivo >25s pero puerto caído → limpiar y seguir al spawn
                let mut procs = mgr.procs.lock().unwrap_or_else(|e| e.into_inner());
                procs.remove(&name);
                // cae al spawn (mantiene marcador starting)
            } else {
                mgr.starting.lock().unwrap_or_else(|e| e.into_inner()).remove(&name);
                let stored = mgr.urls.lock().unwrap_or_else(|e| e.into_inner()).get(&name).cloned().unwrap_or(url.clone());
                return Some(json_ok(&serde_json::json!({ "ok": true, "already": true, "url": stored })));
            }
        }
        // probe si ya está corriendo externamente (usuario lo lanzó manual) — skip para vite embed, sin lock
        {
            let is_vite_embed = (name == "vioeditor" ) && PathBuf::from(def.dir).join("dist").join("index.html").is_file();
            if !is_vite_embed && def.port.is_some() && probe(&def) {
                mgr.starting.lock().unwrap_or_else(|e| e.into_inner()).remove(&name);
                let url = def.url.map(|s| s.to_string()).unwrap_or_default();
                return Some(json_ok(&serde_json::json!({ "ok": true, "already": true, "url": url, "external": true })));
            }
        }
        // Nunca permitir que dos plugins compartan el mismo puerto — skip para vite embed (mmap, sin Node)
        let is_vite_embed_check = (name == "vioeditor" ) && PathBuf::from(def.dir).join("dist").join("index.html").is_file();
        if !is_vite_embed_check {
            if let Some(port) = def.port {
                for (other_name, other_def) in defs_map.iter() {
                    if *other_name == name.as_str() || *other_name == "" { continue; }
                    if other_def.port == Some(port) {
                        mgr.starting.lock().unwrap_or_else(|e| e.into_inner()).remove(&name);
                        return Some(json_err(409, &format!("puerto {} ya configurado para '{}', '{}' no puede usar el mismo puerto", port, other_name, name)));
                    }
                }
                if probe(&def) {
                    mgr.starting.lock().unwrap_or_else(|e| e.into_inner()).remove(&name);
                    let owner = defs_map
                        .iter()
                        .find(|(n, d)| *n != &name.as_str() && d.port == Some(port))
                        .map(|(n, _)| *n)
                        .unwrap_or("proceso externo");
                    return Some(json_err(409, &format!("puerto {} ya en uso por '{}', no se puede iniciar '{}'", port, owner, name)));
                }
            }
        }
        // Embed static 0ms para vite plugins con dist (sin Node) — vite preview reemplazado por mmap
        if name == "vioeditor"  {
            let embed_dist = PathBuf::from(def.dir).join("dist").join("index.html");
            if embed_dist.is_file() {
                let url = format!("http://127.0.0.1:{}/shell/external/{}/embed/", state.port, name);
                {
                    let mut urls = mgr.urls.lock().unwrap_or_else(|e| e.into_inner());
                    urls.insert(name.clone(), url.clone());
                }
                mgr.starting.lock().unwrap_or_else(|e| e.into_inner()).remove(&name);
                eprintln!("external: {} embed static → {} (sin spawn)", name, url);
                return Some(json_ok(&serde_json::json!({ "ok": true, "already": true, "url": url, "embed": true })));
            }
        }
        let dir = PathBuf::from(def.dir);
        if !dir.exists() {
            mgr.starting.lock().unwrap_or_else(|e| e.into_inner()).remove(&name);
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
                Err(e) => { mgr.starting.lock().unwrap_or_else(|e| e.into_inner()).remove(&name); return Some(json_err(500, &e.to_string())); }
            }
        } else if cmd_str.trim_start().starts_with("G:\\Dev\\nodejs") {
            // Direct node (screenshots/opendesign) - evita pnpm y conhost, oculta ventana
            let parts = split_cmd(cmd_str);
            let mut c = std::process::Command::new(&parts[0]);
            if parts.len() > 1 {
                c.args(&parts[1..]);
            }
            c.current_dir(&dir);
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
                Err(e) => { mgr.starting.lock().unwrap_or_else(|e| e.into_inner()).remove(&name); return Some(json_err(500, &e.to_string())); }
            }
        } else {
            // pnpm directo oculto sin cmd visible: evita conhost S/N y WindowsTerminal. Usa binario Rust directo.
            let pnpm_bin = r"G:\Dev\nodejs-24\node_modules\pnpm\pnpm.exe";
            let pnpm_bin_alt = r"G:\Dev\nodejs-24\node_modules\pnpm\bin\pnpm.cjs";
            let use_node = !std::path::Path::new(pnpm_bin).exists();
            let args: Vec<&str> = cmd_str.split_whitespace().skip(1).collect();
            let mut c = if use_node {
                let mut cc = std::process::Command::new(r"G:\Dev\nodejs-24\node.exe");
                cc.arg(pnpm_bin_alt);
                cc
            } else {
                std::process::Command::new(pnpm_bin)
            };
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
                Err(e) => { mgr.starting.lock().unwrap_or_else(|e| e.into_inner()).remove(&name); return Some(json_err(500, &e.to_string())); }
            }
        };
        let pid = child.id();
        // early exit check: si falla al instante, verificar si es daemon already running (opendesign) con web sí arrancada
        std::thread::sleep(Duration::from_millis(1200));
        if let Ok(Some(status)) = child.try_wait() {
            // Para opendesign, tools-dev start con daemon ya corriendo sale con code 1 pero web sí inicia (manual start lo hace)
            if name == "opendesign" {
                std::thread::sleep(Duration::from_millis(800));
                // bypass cache para no devolver false stale de 1.5s
                let probe_ok = crate::common::probe_http(3000, "/", Duration::from_millis(1500), &[200, 301, 302, 304])
                    || crate::common::probe_http(3000, "/", Duration::from_millis(1500), &[200, 301, 302, 304]);
                if probe_ok || probe(&def) {
                    let url = def.url.map(|s| s.to_string()).unwrap_or_default();
                    {
                        let mut urls = mgr.urls.lock().unwrap_or_else(|e| e.into_inner());
                        urls.insert(name.clone(), url.clone());
                    }
                    mgr.starting.lock().unwrap_or_else(|e| e.into_inner()).remove(&name);
                    mgr.spawned_at.lock().unwrap_or_else(|e| e.into_inner()).insert(name.clone(), std::time::Instant::now());
                    eprintln!("external: {} start con daemon already running pero web ok → pid {}", name, pid);
                    return Some(json_ok(&serde_json::json!({ "ok": true, "pid": pid, "url": url, "dir": def.dir, "daemon_already": true })));
                }
            }
            let code = status.code().unwrap_or(-1);
            let log_tail = std::fs::read_to_string(crate::state::data_dir().join(format!("external-{}.log", name))).unwrap_or_default();
            let tail = log_tail.chars().rev().take(800).collect::<String>().chars().rev().collect::<String>();
            mgr.starting.lock().unwrap_or_else(|e| e.into_inner()).remove(&name);
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
        mgr.spawned_at.lock().unwrap_or_else(|e| e.into_inner()).insert(name.clone(), std::time::Instant::now());
        mgr.starting.lock().unwrap_or_else(|e| e.into_inner()).remove(&name);
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

    if action == "mtime" && method == Method::Get {
        let m = plugin_mtime(&def);
        return Some(json_ok(&serde_json::json!({ "ok": true, "name": name, "mtime": m, "dir": def.dir, "port": def.port })));
    }

    if action == "restart" && method == Method::Post {
        // Embed estático: no hay proceso, solo invalidar probe y devolver ok para que el frontend recargue con cache-bust
        let is_vite_embed_restart = (name == "vioeditor" ) && PathBuf::from(def.dir).join("dist").join("index.html").is_file();
        if is_vite_embed_restart {
            if let Some(port) = def.port { invalidate_probe(port); }
            let url = format!("http://127.0.0.1:{}/shell/external/{}/embed/", state.port, name);
            return Some(json_ok(&serde_json::json!({ "ok": true, "restarted": true, "embed": true, "url": url, "mtime": plugin_mtime(&def) })));
        }
        // Matar proceso existente si lo hay
        {
            let mut procs = mgr.procs.lock().unwrap_or_else(|e| e.into_inner());
            if let Some(mut child) = procs.remove(&name) {
                let pid = child.id();
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
            }
        }
        // Matar huérfanos por puerto (daemon) si corresponde
        if name == "opendesign" {
            // matar node huérfanos de open-design para liberar 3000/3456
            let _ = std::process::Command::new("powershell")
                .args(["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe' OR Name='node_hidden.exe'\" | Where-Object { $_.CommandLine -like \"*open-design*\" -or $_.CommandLine -like \"*tools-dev*\" } | ForEach-Object { taskkill /F /PID $_.ProcessId }"])
                .creation_flags(CREATE_NO_WINDOW)
                .stdin(std::process::Stdio::null())
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .spawn();
            std::thread::sleep(Duration::from_millis(600));
        }
        if let Some(port) = def.port { invalidate_probe(port); }
        // Pequeña pausa para liberar el puerto
        std::thread::sleep(Duration::from_millis(350));
        // Reutilizar lógica de start: verificar directorio, elegir comando y spawnear
        let dir = PathBuf::from(def.dir);
        if !dir.exists() {
            return Some(json_err(404, &format!("directorio no existe: {}", def.dir)));
        }
        // Para plugins con dist y prod, tras restart preferir dev si el puerto estaba en uso? No, usar effective_cmd igual que start
        let cmd_str = effective_cmd(&def);
        let log_path = crate::state::data_dir().join(format!("external-{}.log", name));
        let _ = std::fs::create_dir_all(crate::state::data_dir());
        let log_file = std::fs::OpenOptions::new().create(true).append(true).open(&log_path).ok();
        let mut child: std::process::Child = if cmd_str.starts_with("flutter") {
            let mut c = std::process::Command::new("cmd");
            c.args(["/c", cmd_str]);
            c.current_dir(&dir);
            c.creation_flags(CREATE_NO_WINDOW | DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP);
            c.stdin(std::process::Stdio::null());
            if let Some(f) = log_file {
                if let Ok(cloned) = f.try_clone() { c.stdout(std::process::Stdio::from(cloned)); }
                c.stderr(std::process::Stdio::from(f));
            } else { c.stdout(std::process::Stdio::null()); c.stderr(std::process::Stdio::null()); }
            match c.spawn() { Ok(ch) => ch, Err(e) => return Some(json_err(500, &e.to_string())) }
        } else if cmd_str.trim_start().starts_with("G:\\Dev\\nodejs") {
            let parts = split_cmd(cmd_str);
            let mut c = std::process::Command::new(&parts[0]);
            if parts.len() > 1 { c.args(&parts[1..]); }
            c.current_dir(&dir);
            let cur_path = std::env::var("PATH").unwrap_or_default();
            c.env("PATH", format!(r"G:\Dev\nodejs-24;G:\Dev\nodejs-24\node_modules\.bin;{cur_path}"));
            c.creation_flags(CREATE_NO_WINDOW | DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP);
            c.stdin(std::process::Stdio::null());
            if let Some(f) = log_file {
                if let Ok(cloned) = f.try_clone() { c.stdout(std::process::Stdio::from(cloned)); }
                c.stderr(std::process::Stdio::from(f));
            } else { c.stdout(std::process::Stdio::null()); c.stderr(std::process::Stdio::null()); }
            match c.spawn() { Ok(ch) => ch, Err(e) => return Some(json_err(500, &e.to_string())) }
        } else {
            let pnpm_bin = r"G:\Dev\nodejs-24\node_modules\pnpm\pnpm.exe";
            let pnpm_bin_alt = r"G:\Dev\nodejs-24\node_modules\pnpm\bin\pnpm.cjs";
            let use_node = !std::path::Path::new(pnpm_bin).exists();
            let args: Vec<&str> = cmd_str.split_whitespace().skip(1).collect();
            let mut c = if use_node {
                let mut cc = std::process::Command::new(r"G:\Dev\nodejs-24\node.exe");
                cc.arg(pnpm_bin_alt); cc
            } else { std::process::Command::new(pnpm_bin) };
            if !args.is_empty() { c.args(&args); }
            c.current_dir(&dir);
            let cur_path = std::env::var("PATH").unwrap_or_default();
            c.env("PATH", format!(r"G:\Dev\nodejs-24;G:\Dev\nodejs-24\node_modules\.bin;{cur_path}"));
            c.creation_flags(CREATE_NO_WINDOW | DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP);
            c.stdin(std::process::Stdio::null());
            if let Some(f) = log_file {
                if let Ok(cloned) = f.try_clone() { c.stdout(std::process::Stdio::from(cloned)); }
                c.stderr(std::process::Stdio::from(f));
            } else { c.stdout(std::process::Stdio::null()); c.stderr(std::process::Stdio::null()); }
            match c.spawn() { Ok(ch) => ch, Err(e) => return Some(json_err(500, &e.to_string())) }
        };
        let pid = child.id();
        std::thread::sleep(Duration::from_millis(1200));
        if let Ok(Some(status)) = child.try_wait() {
            if name == "opendesign" {
                std::thread::sleep(Duration::from_millis(800));
                let probe_ok = crate::common::probe_http(3000, "/", Duration::from_millis(1500), &[200, 301, 302, 304]) || probe(&def);
                if probe_ok || probe(&def) {
                    let url = def.url.map(|s| s.to_string()).unwrap_or_default();
                    { let mut urls = mgr.urls.lock().unwrap_or_else(|e| e.into_inner()); urls.insert(name.clone(), url.clone()); }
                    mgr.spawned_at.lock().unwrap_or_else(|e| e.into_inner()).insert(name.clone(), std::time::Instant::now());
                    return Some(json_ok(&serde_json::json!({ "ok": true, "pid": pid, "url": url, "dir": def.dir, "restarted": true, "daemon_already": true })));
                }
            }
            let code = status.code().unwrap_or(-1);
            let log_tail = std::fs::read_to_string(crate::state::data_dir().join(format!("external-{}.log", name))).unwrap_or_default();
            let tail = log_tail.chars().rev().take(800).collect::<String>().chars().rev().collect::<String>();
            return Some(json_err(500, &format!("reinicio falló, proceso salió (code {code}): {tail} | cmd: {cmd_str}")));
        }
        let url = def.url.map(|s| s.to_string()).unwrap_or_default();
        { let mut procs = mgr.procs.lock().unwrap_or_else(|e| e.into_inner()); procs.insert(name.clone(), child); }
        { let mut urls = mgr.urls.lock().unwrap_or_else(|e| e.into_inner()); urls.insert(name.clone(), url.clone()); }
        mgr.spawned_at.lock().unwrap_or_else(|e| e.into_inner()).insert(name.clone(), std::time::Instant::now());
        let mgr_clone = mgr.clone();
        let name_clone = name.clone();
        std::thread::spawn(move || {
            loop {
                std::thread::sleep(Duration::from_secs(2));
                let mut procs = match mgr_clone.procs.lock() { Ok(g) => g, Err(_) => break };
                if let Some(ch) = procs.get_mut(&name_clone) {
                    match ch.try_wait() {
                        Ok(Some(_)) => { procs.remove(&name_clone); break; }
                        Ok(None) => {},
                        Err(_) => { procs.remove(&name_clone); break; }
                    }
                } else { break; }
                drop(procs);
            }
        });
        return Some(json_ok(&serde_json::json!({ "ok": true, "pid": pid, "url": url, "dir": def.dir, "restarted": true })));
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
            // También matar huérfanos del daemon open-design por CommandLine
            // (NO taskkill /IM node.exe: mataría también screenshots y otros Node).
            if name == "opendesign" {
                let _ = std::process::Command::new("powershell")
                    .args(["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe' OR Name='node_hidden.exe'\" | Where-Object { $_.CommandLine -like \"*open-design*\" -or $_.CommandLine -like \"*tools-dev*\" } | ForEach-Object { taskkill /F /PID $_.ProcessId }"])
                    .creation_flags(CREATE_NO_WINDOW)
                    .stdin(std::process::Stdio::null())
                    .stdout(std::process::Stdio::null())
                    .stderr(std::process::Stdio::null())
                    .spawn();
            }
            mgr.spawned_at.lock().unwrap_or_else(|e| e.into_inner()).remove(&name);
            mgr.starting.lock().unwrap_or_else(|e| e.into_inner()).remove(&name);
            return Some(json_ok(&serde_json::json!({ "ok": true, "stopped": true })));
        } else {
            return Some(json_ok(&serde_json::json!({ "ok": true, "stopped": false, "msg": "no hay proceso gestionado" })));
        }
    }

    Some(json_err(404, "ruta external no encontrada"))
}
