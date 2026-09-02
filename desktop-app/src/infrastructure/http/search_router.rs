//! Router /shell/search — búsqueda DDG lite con cache 6h.
//! Extraído desde api.rs: DuckDuckGo lite, TTL 6h, parse top3, fallback html.

use std::io::Read;
use std::sync::Arc;

use tiny_http::{Method, Request, Response};

use crate::state::{json_err, json_ok, AppState};

#[allow(clippy::too_many_lines)]
pub fn handle(
    _req: &mut Request,
    _state: Arc<AppState>,
    path: &str,
    _method: Method,
    q: &dyn Fn(&str) -> String,
) -> Option<Response<std::io::Cursor<Vec<u8>>>> {
    if path != "/shell/search" {
        return None;
    }
    let query = q("q");
    if query.trim().is_empty() {
        return Some(json_err(400, "Falta parámetro q"));
    }
    let query_trim = query.trim().to_string();
    // File cache: data/cache/search/<hash>.json, TTL 6h
    let cache_root = crate::state::cache_dir().join("search");
    let _ = std::fs::create_dir_all(&cache_root);
    let hash = {
        let mut h: u64 = 14695981039346656037;
        for b in query_trim.to_lowercase().as_bytes() {
            h ^= *b as u64;
            h = h.wrapping_mul(1099511628211);
        }
        format!("{h:016x}")
    };
    let cache_file = cache_root.join(format!("{hash}.json"));
    let ttl_secs = 6 * 3600u64;
    if let Ok(meta) = std::fs::metadata(&cache_file) {
        if let Ok(modified) = meta.modified() {
            if let Ok(elapsed) = modified.elapsed() {
                if elapsed.as_secs() < ttl_secs {
                    if let Ok(raw) = std::fs::read_to_string(&cache_file) {
                        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&raw) {
                            let mut out = v.clone();
                            if let Some(obj) = out.as_object_mut() {
                                obj.insert("cached".into(), serde_json::json!(true));
                            }
                            return Some(json_ok(&out));
                        }
                    }
                }
            }
        }
    }
    // Fetch DuckDuckGo lite (least JS, easy parse, token-min top3)
    let ddg_url = format!(
        "https://lite.duckduckgo.com/lite/?q={}",
        url_encode(&query_trim)
    );
    let client = ureq::builder()
        .timeout(std::time::Duration::from_secs(8))
        .redirects(3)
        .build();
    let body = match client.get(&ddg_url).set("User-Agent", "Mozilla/5.0").call() {
        Ok(resp) => {
            let mut buf = Vec::new();
            resp.into_reader().read_to_end(&mut buf).unwrap_or_default();
            String::from_utf8_lossy(&buf).to_string()
        }
        Err(_) => {
            // fallback: html.duckduckgo.com
            let fallback = format!(
                "https://html.duckduckgo.com/html/?q={}",
                url_encode(&query_trim)
            );
            match ureq::builder()
                .timeout(std::time::Duration::from_secs(8))
                .build()
                .get(&fallback)
                .set("User-Agent", "Mozilla/5.0")
                .call()
            {
                Ok(resp) => {
                    let mut buf = Vec::new();
                    resp.into_reader().read_to_end(&mut buf).unwrap_or_default();
                    String::from_utf8_lossy(&buf).to_string()
                }
                Err(e) => {
                    return Some(json_err(502, &format!("search fetch failed: {e}")));
                }
            }
        }
    };
    let mut results: Vec<serde_json::Value> = Vec::new();
    // Very light parser: split on anchor blocks
    for part in body.split("<a rel=\"nofollow\"").skip(1) {
        if results.len() >= 3 {
            break;
        }
        let href_start = part.find("href=\"").map(|i| i + 6).unwrap_or(0);
        let href_end = part[href_start..]
            .find('"')
            .map(|i| href_start + i)
            .unwrap_or(href_start);
        let href = &part[href_start..href_end];
        // title is between > and </a> after href
        let title_start_rel = part[href_end..]
            .find('>')
            .map(|i| href_end + i + 1)
            .unwrap_or(href_end);
        let title_end_rel = part[title_start_rel..]
            .find("</a>")
            .map(|i| title_start_rel + i)
            .unwrap_or(title_start_rel);
        let title_raw = &part[title_start_rel..title_end_rel];
        let title = strip_html(title_raw).trim().to_string();
        if title.is_empty() || href.is_empty() || href.starts_with('#') {
            continue;
        }
        // snippet: next td with result-snippet
        let snip = if let Some(idx) = part.find("result-snippet") {
            let s = &part[idx..];
            let gt = s.find('>').map(|i| i + 1).unwrap_or(0);
            let lt = s[gt..]
                .find('<')
                .map(|i| gt + i)
                .unwrap_or(gt + 120);
            strip_html(&s[gt..lt]).trim().chars().take(240).collect::<String>()
        } else {
            String::new()
        };
        let url_decoded = url_decode(href);
        // DDG wraps url as //duckduckgo.com/l/?uddg=ENCODED — extract uddg if present
        let final_url = if let Some(uddg_idx) = url_decoded.find("uddg=") {
            url_decode(
                &url_decode(
                    &url_decoded[uddg_idx + 5..]
                        .split('&')
                        .next()
                        .unwrap_or(&url_decoded),
                ),
            )
        } else if href.starts_with("//") {
            format!("https:{href}")
        } else if href.starts_with('/') {
            href.to_string()
        } else {
            url_decoded
        };
        results.push(serde_json::json!({"title": title, "url": final_url, "snippet": snip}));
    }
    // fallback if lite parse yielded 0: try generic anchor parse on fallback html
    if results.is_empty() {
        for part in body.split("class=\"result__url\"").skip(1).take(3) {
            let href = part
                .find("href=\"")
                .and_then(|i| {
                    let s = i + 6;
                    part[s..].find('"').map(|e| part[s..s + e].to_string())
                })
                .unwrap_or_default();
            let title = part
                .find("class=\"result__a\"")
                .and_then(|i| {
                    let s = &part[i..];
                    s.find('>').map(|g| {
                        let st = g + 1;
                        s[st..]
                            .find('<')
                            .map(|e| strip_html(&s[st..st + e]).trim().to_string())
                            .unwrap_or_default()
                    })
                })
                .unwrap_or_default();
            if !href.is_empty() {
                results.push(serde_json::json!({"title": title, "url": href, "snippet": ""}));
            }
        }
    }
    let out = serde_json::json!({"results": results, "cached": false});
    let _ = std::fs::write(&cache_file, serde_json::to_string(&out).unwrap_or_default());
    Some(json_ok(&out))
}

fn url_encode(s: &str) -> String {
    let mut out = String::with_capacity(s.len() * 3);
    for b in s.as_bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => out.push(*b as char),
            b' ' => out.push_str("%20"),
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

fn strip_html(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut inside = false;
    for ch in s.chars() {
        match ch {
            '<' => inside = true,
            '>' => inside = false,
            _ if !inside => out.push(ch),
            _ => {}
        }
    }
    out.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#x27;", "'")
        .replace("&#39;", "'")
}

fn url_decode(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'%' if i + 2 < bytes.len() => {
                let hex = std::str::from_utf8(&bytes[i + 1..i + 3]).unwrap_or("");
                if let Ok(v) = u8::from_str_radix(hex, 16) {
                    out.push(v);
                    i += 3;
                    continue;
                }
                out.push(bytes[i]);
                i += 1;
            }
            b'+' => {
                out.push(b' ');
                i += 1;
            }
            b => {
                out.push(b);
                i += 1;
            }
        }
    }
    String::from_utf8_lossy(&out).to_string()
}
