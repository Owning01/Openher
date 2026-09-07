//! Router /shell/computer/* — delegado desde api.rs.
//! Extraído como P0 FSD: api.rs tenía 8 rutas con duplicados unreachable (screenshot.bin x2, find_element x2, list_windows x2).

use std::sync::Arc;

use crate::infrastructure::http::io::{ShellRequest, ShellResponse};

use crate::state::AppState;

pub fn handle(
    req: &ShellRequest,
    _state: Arc<AppState>,
    path: &str,
    method: &str,
    q: &dyn Fn(&str) -> String,
) -> Option<ShellResponse> {
    let route = path.strip_prefix("/shell/computer")?;

    let resp = match (method, route) {
        ("GET", "/screenshot") | ("GET", "/screenshot/") => {
            let w = q("width").parse::<u32>().ok();
            let fmt = q("format");
            let qual = q("quality").parse::<u8>().ok();
            let x = q("x").parse::<i32>().ok();
            let y = q("y").parse::<i32>().ok();
            let rw = q("w").parse::<u32>().ok();
            let rh = q("h").parse::<u32>().ok();
            let bare = q("bare") == "1" || q("bare") == "true";
            let cursor = q("cursor") == "1" || q("cursor") == "true";
            let screen = q("screen").parse::<u32>().ok();
            let etag_q = if q("etag").is_empty() { None } else { Some(q("etag")) };
            let etag_hdr = req.header("if-none-match").map(|s| s.to_string());
            let etag = etag_q.or(etag_hdr);
            let opts = crate::computer::ScreenshotOpts {
                width: w,
                format: if fmt.is_empty() { None } else { Some(fmt) },
                quality: qual,
                x,
                y,
                w: rw,
                h: rh,
                bare: Some(bare),
                cursor: Some(cursor),
                screen,
            };
            match crate::computer::screenshot_v2(&opts, etag) {
                Ok(v) => ShellResponse::ok_json(&serde_json::to_value(v).unwrap_or_default()),
                Err(e) => ShellResponse::err_json(500, &e.to_string()),
            }
        }
        ("POST", "/batch") => match req.json_body() {
            Ok(b) => {
                let r: Result<crate::computer::BatchReq, _> = serde_json::from_value(b.clone());
                match r {
                    Ok(req_batch) => match crate::computer::batch(&req_batch) {
                        Ok(v) => {
                            if let Some(s) = v {
                                ShellResponse::ok_json(&serde_json::json!({ "ok": true, "screenshot": s }))
                            } else {
                                ShellResponse::ok_json(&serde_json::json!({ "ok": true }))
                            }
                        }
                        Err(e) => ShellResponse::err_json(500, &e.to_string()),
                    },
                    Err(e) => ShellResponse::err_json(400, &format!("batch json: {e}")),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e.to_string()),
        },
        ("POST", "/mouse") => match req.json_body() {
            Ok(b) => {
                let r: Result<crate::computer::MouseReq, _> = serde_json::from_value(b.clone());
                match r {
                    Ok(m) => match crate::computer::mouse(&m) {
                        Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                        Err(e) => ShellResponse::err_json(500, &e.to_string()),
                    },
                    Err(e) => ShellResponse::err_json(400, &format!("mouse json: {e}")),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e.to_string()),
        },
        ("POST", "/key") => match req.json_body() {
            Ok(b) => {
                let r: Result<crate::computer::KeyReq, _> = serde_json::from_value(b.clone());
                match r {
                    Ok(k) => match crate::computer::key(&k) {
                        Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                        Err(e) => ShellResponse::err_json(500, &e.to_string()),
                    },
                    Err(e) => ShellResponse::err_json(400, &format!("key json: {e}")),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e.to_string()),
        },
        ("POST", "/type") => match req.json_body() {
            Ok(b) => {
                let r: Result<crate::computer::TypeReq, _> = serde_json::from_value(b.clone());
                match r {
                    Ok(t) => match crate::computer::type_text(&t) {
                        Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                        Err(e) => ShellResponse::err_json(500, &e.to_string()),
                    },
                    Err(e) => ShellResponse::err_json(400, &format!("type json: {e}")),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e.to_string()),
        },
        ("POST", "/scroll") => match req.json_body() {
            Ok(b) => {
                let r: Result<crate::computer::ScrollReq, _> = serde_json::from_value(b.clone());
                match r {
                    Ok(s) => match crate::computer::scroll(&s) {
                        Ok(()) => ShellResponse::ok_json(&serde_json::json!({ "ok": true })),
                        Err(e) => ShellResponse::err_json(500, &e.to_string()),
                    },
                    Err(e) => ShellResponse::err_json(400, &format!("scroll json: {e}")),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e.to_string()),
        },
        // Un único handler para screenshot.bin — deduce duplicado de api.rs:645/725
        ("GET", "/screenshot.bin") => {
            let w = q("width").parse::<u32>().ok();
            let fmt = q("format");
            let qual = q("quality").parse::<u8>().ok();
            let x = q("x").parse::<i32>().ok();
            let y = q("y").parse::<i32>().ok();
            let rw = q("w").parse::<u32>().ok();
            let rh = q("h").parse::<u32>().ok();
            let cursor = q("cursor") == "1" || q("cursor") == "true";
            let screen = q("screen").parse::<u32>().ok();
            let opts = crate::computer::ScreenshotOpts {
                width: w,
                format: if fmt.is_empty() { None } else { Some(fmt) },
                quality: qual,
                x,
                y,
                w: rw,
                h: rh,
                bare: Some(true),
                cursor: Some(cursor),
                screen,
            };
            return match crate::computer::screenshot_v2(&opts, None) {
                Ok(v) => {
                    let b64 = if v.image.starts_with("data:") {
                        v.image.split(',').nth(1).unwrap_or("").to_string()
                    } else {
                        v.image.clone()
                    };
                    if let Ok(raw) = crate::state::base64_decode(&b64) {
                        let mime = if v.format == "jpeg" { "image/jpeg" } else { "image/png" };
                        Some(
                            ShellResponse::data(200, raw, mime)
                                .with_header("Access-Control-Allow-Origin", "*")
                                .with_header("ETag", &v.etag)
                                .with_header("Cache-Control", "no-store"),
                        )
                    } else {
                        Some(ShellResponse::err_json(500, "base64 decode fail"))
                    }
                }
                Err(e) => Some(ShellResponse::err_json(500, &e.to_string())),
            };
        }
        ("POST", "/find_element") => match req.json_body() {
            Ok(b) => {
                let name = b["name"].as_str().unwrap_or("").to_string();
                let timeout = b["timeout"]
                    .as_u64()
                    .unwrap_or(b["timeout_ms"].as_u64().unwrap_or(2000));
                match crate::computer::find_element(&name, timeout) {
                    Ok(Some((x, y, w, h))) => ShellResponse::ok_json(&serde_json::json!({
                        "found": true, "x": x, "y": y, "w": w, "h": h, "cx": x + w / 2, "cy": y + h / 2
                    })),
                    Ok(None) => ShellResponse::ok_json(&serde_json::json!({ "found": false })),
                    Err(e) => ShellResponse::err_json(500, &e),
                }
            }
            Err(e) => ShellResponse::err_json(400, &e.to_string()),
        },
        ("GET", "/list_windows") => {
            let filter = q("filter");
            let f = if filter.is_empty() { None } else { Some(filter) };
            let wins = crate::computer::list_windows(f);
            let arr: Vec<serde_json::Value> = wins
                .into_iter()
                .map(|(n, x, y, w, h)| serde_json::json!({ "name": n, "x": x, "y": y, "w": w, "h": h }))
                .collect();
            ShellResponse::ok_json(&serde_json::json!({ "windows": arr }))
        }
        _ => return None,
    };

    Some(resp)
}
