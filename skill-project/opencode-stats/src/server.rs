//! Servidor HTTP local (tiny_http). Port de server.py — API JSON + estáticos static/.
//! Ver docs/migracion-rust/00-inventario.md §3 para el contrato completo.

use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::time::Duration;

use serde_json::{Value, json};
use tiny_http::{Header, Method, Request, Response, Server};

use crate::admin;
use crate::db;
use crate::payload;
use crate::types::{AdminAction, ApiError, Guard};

pub const STATIC_DIR: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/static");

const MIME: &[(&str, &str)] = &[
    (".html", "text/html; charset=utf-8"),
    (".js", "text/javascript; charset=utf-8"),
    (".css", "text/css; charset=utf-8"),
    (".svg", "image/svg+xml"),
    (".png", "image/png"),
    (".ico", "image/x-icon"),
];

fn mime_for(path: &str) -> &'static str {
    let ext = Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    MIME.iter()
        .find(|(k, _)| *k == format!(".{ext}"))
        .map(|(_, v)| *v)
        .unwrap_or("application/octet-stream")
}

fn json_resp(code: u16, v: &Value) -> Response<Cursor<Vec<u8>>> {
    let body = serde_json::to_vec(v).unwrap_or_else(|_| b"{}".to_vec());
    let len = body.len();
    Response::from_data(body)
        .with_status_code(code)
        .with_header(Header::from_bytes("Content-Type", "application/json; charset=utf-8").unwrap())
        .with_header(Header::from_bytes("Cache-Control", "no-store").unwrap())
        .with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap())
        .with_header(Header::from_bytes("Access-Control-Allow-Methods", "GET, OPTIONS").unwrap())
        .with_header(
            Header::from_bytes(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, Cache-Control",
            )
            .unwrap(),
        )
        .with_header(Header::from_bytes("Content-Length", len.to_string()).unwrap())
}

fn cors_only(r: Response<Cursor<Vec<u8>>>) -> Response<Cursor<Vec<u8>>> {
    r.with_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap())
        .with_header(Header::from_bytes("Access-Control-Allow-Methods", "GET, OPTIONS").unwrap())
        .with_header(
            Header::from_bytes(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, Cache-Control",
            )
            .unwrap(),
        )
}

fn err_resp(e: &ApiError) -> Response<Cursor<Vec<u8>>> {
    json_resp(500, &json!({ "error": e.to_string() }))
}

fn static_resp(path: &str) -> Response<Cursor<Vec<u8>>> {
    let rel = if path == "/" { "/index.html" } else { path };
    // rechazar traversal: ningún componente puede ser ".."
    if rel.split('/').any(|c| c == "..") {
        return Response::from_data("Not Found".as_bytes().to_vec()).with_status_code(404);
    }
    let root = PathBuf::from(STATIC_DIR);
    let file = root.join(rel.trim_start_matches('/'));
    if !file.starts_with(&root) || !file.is_file() {
        return Response::from_data("Not Found".as_bytes().to_vec()).with_status_code(404);
    }
    match std::fs::read(&file) {
        Ok(body) => Response::from_data(body)
            .with_header(Header::from_bytes("Content-Type", mime_for(rel)).unwrap()),
        Err(_) => Response::from_data("Not Found".as_bytes().to_vec()).with_status_code(404),
    }
}

/// Decodifica query string: a=b&c=d (url-decode básico, sin panics con bytes multi-byte).
fn parse_qs(query: &str) -> Vec<(String, String)> {
    fn dec(s: &str) -> String {
        let b = s.as_bytes();
        let mut out = Vec::with_capacity(b.len());
        let mut i = 0;
        while i < b.len() {
            match b[i] {
                b'+' => {
                    out.push(b' ');
                    i += 1;
                }
                b'%' if i + 2 < b.len() => {
                    let hex = std::str::from_utf8(&b[i + 1..i + 3]).unwrap_or("");
                    if let Ok(v) = u8::from_str_radix(hex, 16) {
                        out.push(v);
                        i += 3;
                    } else {
                        out.push(b[i]);
                        i += 1;
                    }
                }
                c => {
                    out.push(c);
                    i += 1;
                }
            }
        }
        String::from_utf8_lossy(&out).into_owned()
    }
    query
        .split('&')
        .filter(|kv| !kv.is_empty())
        .map(|kv| {
            let mut it = kv.splitn(2, '=');
            (dec(it.next().unwrap_or("")), dec(it.next().unwrap_or("")))
        })
        .collect()
}

fn qs_get(qs: &[(String, String)], key: &str) -> String {
    qs.iter()
        .find(|(k, _)| k == key)
        .map(|(_, v)| v.clone())
        .unwrap_or_default()
}

/// Proxy de la API pública de uso de OpenCode Go (sin CORS del lado de opencode.ai;
/// timeout 15 s, reenvía el status y el body JSON tal cual).
fn go_usage_proxy(auth: &str) -> Response<Cursor<Vec<u8>>> {
    let resp = ureq::get("https://opencode.ai/zen/go/v1/usage")
        .set("Authorization", auth)
        .set("Accept", "application/json")
        .set("Cache-Control", "no-store")
        .timeout(Duration::from_secs(15))
        .call();
    match resp {
        Ok(r) => json_resp(r.status(), &parse_body(r)),
        Err(ureq::Error::Status(code, r)) => json_resp(code, &parse_body(r)),
        Err(e) if e.to_string().to_lowercase().contains("timed out") => {
            json_resp(504, &json!({ "error": "Tiempo de espera agotado (15 s)" }))
        }
        Err(e) => json_resp(502, &json!({ "error": format!("Error de red: {e}") })),
    }
}

fn parse_body(r: ureq::Response) -> Value {
    r.into_string()
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or(Value::Null)
}

fn get_route(path: &str, query: &str, auth: &str) -> Result<Response<Cursor<Vec<u8>>>, ApiError> {
    match path {
        "/api/go/usage" => {
            if auth.is_empty() {
                return Ok(json_resp(
                    401,
                    &json!({ "error": "Falta el header Authorization" }),
                ));
            }
            Ok(go_usage_proxy(auth))
        }
        "/api/admin/status" => Ok(json_resp(200, &admin::status()?)),
        "/api/admin/sessions" => {
            let q = parse_qs(query);
            let conn = db::connect_ro()?;
            let sessions = db::load_sessions(
                &conn,
                &qs_get(&q, "since"),
                &qs_get(&q, "until"),
                &qs_get(&q, "model"),
            )?;
            let weights = admin::event_weights(&conn, &sessions)?;
            let names = db::project_names(&conn)?;
            let rows: Vec<Value> = sessions
                .iter()
                .map(|s| {
                    let project = names.get(&s.project_id).cloned().unwrap_or_else(|| {
                        if s.project_id.is_empty() {
                            "(sin proyecto)".to_string()
                        } else {
                            s.project_id.clone()
                        }
                    });
                    let (n, b) = weights.get(&s.id).copied().unwrap_or((0, 0));
                    json!({
                        "id": s.id, "title": s.title, "model": s.model,
                        "project": project, "directory": s.directory,
                        "archived": s.archived, "created": s.created, "updated": s.updated,
                        "input": s.input, "output": s.output, "cost": s.cost,
                        "events": n, "events_mb": (b as f64 / 1e6 * 100.0).round() / 100.0,
                    })
                })
                .collect();
            Ok(json_resp(200, &json!({ "sessions": rows })))
        }
        "/api/data" => {
            let q = parse_qs(query);
            let raw = matches!(
                qs_get(&q, "raw").to_lowercase().as_str(),
                "1" | "true" | "yes"
            );
            let scope = qs_get(&q, "scope");
            let conn = db::connect_ro()?;
            match payload::build_payload(
                &conn,
                &qs_get(&q, "since"),
                &qs_get(&q, "until"),
                &qs_get(&q, "model"),
                raw,
                &scope,
            ) {
                Ok(v) => Ok(json_resp(200, &v)),
                Err(e) => Ok(json_resp(500, &json!({ "error": e.to_string() }))),
            }
        }
        "/api/admin/backups" => Ok(json_resp(200, &admin::list_backups())),
        "/api/admin/pricing" => Ok(json_resp(200, &admin::get_pricing())),
        p if p.starts_with("/api/admin/session/") => {
            let sid = p.rsplit('/').next().unwrap_or("").to_string();
            Ok(json_resp(200, &admin::session_detail(&sid)?))
        }
        _ if path.starts_with("/api") => {
            Ok(json_resp(404, &json!({ "error": "Ruta desconocida" })))
        }
        _ => Ok(static_resp(path)),
    }
}

fn admin_action_from_body(body: &Value) -> Result<AdminAction, ApiError> {
    let action = body
        .get("action")
        .and_then(|a| a.as_str())
        .unwrap_or("")
        .to_string();
    let ids = |b: &Value| {
        b.get("ids")
            .and_then(|v| v.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|x| x.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default()
    };
    match action.as_str() {
        "delete" => Ok(AdminAction::Delete { ids: ids(body) }),
        "move" => Ok(AdminAction::Move {
            ids: ids(body),
            directory: body
                .get("directory")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
        }),
        "rename" => Ok(AdminAction::Rename {
            id: body
                .get("id")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            title: body
                .get("title")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
        }),
        "archive" => Ok(AdminAction::Archive {
            ids: ids(body),
            archived: body
                .get("archived")
                .and_then(|v| v.as_bool())
                .unwrap_or(false),
        }),
        "prune" => {
            let cutoff = body
                .get("cutoff")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            if cutoff.is_empty() {
                return Err(ApiError::Msg(
                    "Falta la fecha de corte (cutoff=YYYY-MM-DD)".into(),
                ));
            }
            Ok(AdminAction::Prune { cutoff })
        }
        "export" => Ok(AdminAction::Export { ids: ids(body) }),
        "backup" => Ok(AdminAction::Backup {
            dest: body
                .get("dest")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
        }),
        "vacuum" => Ok(AdminAction::Vacuum),
        "restore" => Ok(AdminAction::Restore {
            backup_path: body
                .get("backup_path")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
        }),
        "pricing_save" => Ok(AdminAction::PricingSave {
            prices: body.get("prices").cloned().unwrap_or(Value::Null),
            limits: body.get("limits").cloned().unwrap_or(Value::Null),
            names: body.get("names").cloned().unwrap_or(Value::Null),
        }),
        "set_db" => Ok(AdminAction::SetDb {
            path: body
                .get("path")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
        }),
        other => Err(ApiError::Msg(format!("Acción desconocida: {other}"))),
    }
}

fn handle(mut req: Request) {
    let method = req.method().clone();
    let url = req.url().to_string();
    let (path, query) = match url.split_once('?') {
        Some((p, q)) => (p.to_string(), q.to_string()),
        None => (url.clone(), String::new()),
    };

    if method == Method::Options {
        let _ = req.respond(cors_only(Response::from_data(Vec::new())).with_status_code(204));
        return;
    }

    let resp = if method == Method::Get {
        let auth = req
            .headers()
            .iter()
            .find(|h| h.field.equiv("Authorization"))
            .map(|h| h.value.as_str().to_string())
            .unwrap_or_default();
        match get_route(&path, &query, &auth) {
            Ok(r) => r,
            Err(e) => err_resp(&e),
        }
    } else if method == Method::Post && path == "/api/admin" {
        // límite de body (1 MB): evita DoS de memoria; el body real es de pocos KB
        const MAX_BODY: usize = 1 << 20;
        let too_big = req
            .headers()
            .iter()
            .find(|h| h.field.equiv("Content-Length"))
            .and_then(|h| h.value.as_str().parse::<usize>().ok())
            .map(|n| n > MAX_BODY)
            .unwrap_or(false);
        if too_big {
            json_resp(413, &json!({ "error": "Body demasiado grande" }))
        } else {
            let mut buf = vec![0u8; MAX_BODY + 1];
            let reader = req.as_reader();
            let mut n = 0usize;
            while n <= MAX_BODY {
                match reader.read(&mut buf[n..]) {
                    Ok(0) => break,
                    Ok(k) => n += k,
                    Err(_) => break,
                }
            }
            buf.truncate(n);
            let body: Value = serde_json::from_slice(&buf).unwrap_or(Value::Null);
            let g = Guard {
                dry_run: body
                    .get("dry_run")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false),
                force: body.get("force").and_then(|v| v.as_bool()).unwrap_or(false),
            };
            match admin_action_from_body(&body) {
                Ok(action) => match admin::dispatch(action, g) {
                    Ok(v) => json_resp(200, &v),
                    Err(ApiError::Permission(m)) => {
                        json_resp(403, &json!({ "error": m, "blocked": true }))
                    }
                    Err(e) => err_resp(&e),
                },
                Err(ApiError::Msg(m)) => json_resp(500, &json!({ "error": m })),
                Err(_) => json_resp(500, &json!({ "error": "error" })),
            }
        }
    } else {
        json_resp(404, &json!({ "error": "Ruta desconocida" }))
    };
    let _ = req.respond(resp);
}

/// Levanta el servidor en 127.0.0.1:{port} y atiende hasta que se cierre el proceso.
pub fn serve(port: u16) -> Result<(), String> {
    let server = Server::http(("127.0.0.1", port)).map_err(|e| e.to_string())?;
    // stdout puede estar cerrado (proceso detached): no dejar que un println paniquee
    let _ = std::io::Write::write_all(
        &mut std::io::stdout(),
        format!("OpenCode Stats en http://127.0.0.1:{port}\n").as_bytes(),
    );
    for request in server.incoming_requests() {
        handle(request);
    }
    Ok(())
}
