//! Router para proyectos externos on-demand (screenshots, vioeditor, informes, widget_notas)
//! Expone /shell/external/* con auto-start/stop sin UI manual.
//! Respeta regla FSD: no va en api.rs.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use tiny_http::{Method, Request, Response};

use crate::state::{json_err, json_ok, AppState};

#[derive(Clone)]
struct ExternalDef {
    dir: &'static str,
    port: Option<u16>,
    url: Option<&'static str>,
    dev_cmd: &'static str,
}

fn defs() -> HashMap<&'static str, ExternalDef> {
    let mut m = HashMap::new();
    m.insert("screenshots", ExternalDef {
        dir: r"G:\Proyectos\0 screenshots",
        port: Some(3002),
        url: Some("http://127.0.0.1:3002"),
        dev_cmd: "pnpm exec next dev -p 3002 -H 127.0.0.1",
    });
    m.insert("vioeditor", ExternalDef {
        dir: r"G:\Proyectos\17-vioeditor\aplicacion",
        port: Some(5175),
        url: Some("http://127.0.0.1:5175"),
        dev_cmd: "pnpm exec vite --port 5175 --host 127.0.0.1",
    });
    m.insert("informes", ExternalDef {
        dir: r"G:\Proyectos\53plataforma-informes",
        port: Some(5174),
        url: Some("http://127.0.0.1:5174"),
        dev_cmd: "pnpm exec vite --port 5174 --host 127.0.0.1",
    });
    m.insert("widgetnotas", ExternalDef {
        dir: r"G:\Proyectos\HERRAMIENTAS-VARIAS\46widgetnotas",
        port: None,
        url: None,
        dev_cmd: "flutter run -d windows",
    });
    // alias por si el frontend usa nombre largo
    m.insert("plataforma-informes", ExternalDef {
        dir: r"G:\Proyectos\53plataforma-informes",
        port: Some(5174),
        url: Some("http://127.0.0.1:5174"),
        dev_cmd: "pnpm exec vite --port 5174 --host 127.0.0.1",
    });
    m
}

fn probe(def: &ExternalDef) -> bool {
    if let Some(port) = def.port {
        let url_owned = def.url.map(|s| s.to_string()).unwrap_or_else(|| format!("http://127.0.0.1:{port}"));
        let candidates = [url_owned.clone(), format!("http://127.0.0.1:{port}")];
        for c in candidates {
            let ok = ureq::builder()
                .timeout(Duration::from_millis(600))
                .build()
                .get(&c)
                .call()
                .is_ok();
            if ok { return true; }
        }
        return crate::common::probe_http(port, "/", Duration::from_millis(600), &[200, 301, 302, 304]);
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
        // lista todos con status
        let defs_map = defs();
        let mgr = external_manager(&state);
        let procs = mgr.procs.lock().unwrap_or_else(|e| e.into_inner());
        let mut items = Vec::new();
        for (name, def) in defs_map.iter() {
            // evitar duplicado alias
            if *name == "plataforma-informes" { continue; }
            let running = if def.port.is_some() {
                let probed = probe(def);
                probed || procs.contains_key(*name)
            } else {
                procs.contains_key(*name)
            };
            let url = def.url.map(|s| s.to_string()).unwrap_or_default();
            let stored_url = mgr.urls.lock().unwrap_or_else(|e| e.into_inner()).get(*name).cloned().unwrap_or(url.clone());
            items.push(serde_json::json!({
                "name": name,
                "title": match *name {
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
        let running = {
            let procs = mgr.procs.lock().unwrap_or_else(|e| e.into_inner());
            if def.port.is_some() {
                probe(&def) || procs.contains_key(&name)
            } else {
                procs.contains_key(&name)
            }
        };
        let url = def.url.map(|s| s.to_string()).unwrap_or_default();
        let stored = mgr.urls.lock().unwrap_or_else(|e| e.into_inner()).get(&name).cloned().unwrap_or(url.clone());
        return Some(json_ok(&serde_json::json!({ "ok": true, "name": name, "running": running, "url": stored, "dir": def.dir, "port": def.port })));
    }

    if action == "start" && method == Method::Post {
        // si ya running, retornar ok
        {
            let procs = mgr.procs.lock().unwrap_or_else(|e| e.into_inner());
            if procs.contains_key(&name) {
                let url = def.url.map(|s| s.to_string()).unwrap_or_default();
                return Some(json_ok(&serde_json::json!({ "ok": true, "already": true, "url": url })));
            }
            // probe si ya está corriendo externamente (usuario lo lanzó manual)
            if def.port.is_some() && probe(&def) {
                let url = def.url.map(|s| s.to_string()).unwrap_or_default();
                return Some(json_ok(&serde_json::json!({ "ok": true, "already": true, "url": url, "external": true })));
            }
        }
        let dir = PathBuf::from(def.dir);
        if !dir.exists() {
            return Some(json_err(404, &format!("directorio no existe: {}", def.dir)));
        }
        let cmd_str = def.dev_cmd;
        // Spawn: manejar pnpm.cmd / flutter via cmd /c
        let child = if cmd_str.starts_with("flutter") {
            let mut c = std::process::Command::new("cmd");
            c.args(["/c", cmd_str]);
            c.current_dir(&dir);
            // detach stdio para no bloquear
            c.stdout(std::process::Stdio::null());
            c.stderr(std::process::Stdio::null());
            match c.spawn() {
                Ok(ch) => ch,
                Err(e) => return Some(json_err(500, &e.to_string())),
            }
        } else {
            // pnpm / npm : usar cmd /c para resolver .cmd
            let mut c = std::process::Command::new("cmd");
            c.args(["/c", cmd_str]);
            c.current_dir(&dir);
            c.stdout(std::process::Stdio::null());
            c.stderr(std::process::Stdio::null());
            match c.spawn() {
                Ok(ch) => ch,
                Err(e) => return Some(json_err(500, &e.to_string())),
            }
        };
        let pid = child.id();
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
            let _ = child.kill();
            let _ = child.wait();
            return Some(json_ok(&serde_json::json!({ "ok": true, "stopped": true })));
        } else {
            // no hay Child guardado: intentar kill por puerto (best-effort: no-op)
            // para web, el proceso externo sigue pero lo marcamos como stopped
            return Some(json_ok(&serde_json::json!({ "ok": true, "stopped": false, "msg": "no hay proceso gestionado" })));
        }
    }

    Some(json_err(404, "ruta external no encontrada"))
}
