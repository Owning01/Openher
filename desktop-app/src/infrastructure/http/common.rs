//! Helpers compartidos por los routers de `/shell/*` (R3/R5).
//!
//! Una sola implementación para los patrones que estaban repetidos en los
//! `*_router.rs`. La conducta observable (paths, métodos y JSON de respuesta)
//! no cambia.

/// `match req.json_body()` con el error 400 estándar.
///
/// Sustituye el bloque repetido en los routers:
/// ```ignore
/// match req.json_body() {
///     Ok(b) => { /* ... */ }
///     Err(e) => ShellResponse::err_json(400, &e),
/// }
/// ```
/// por `post!(req, b => { /* ... */ })`. El JSON de error sale idéntico:
/// `{"error":"<e>"}` con content-type + CORS (vía `ShellResponse::err_json`).
macro_rules! post {
    ($req:expr, $b:ident => $body:expr) => {
        match $req.json_body() {
            Ok($b) => $body,
            Err(e) => $crate::infrastructure::http::io::ShellResponse::err_json(400, &e),
        }
    };
}
pub(crate) use post;

/// Cuerpo completo de una respuesta `ureq`, ignorando errores de I/O.
/// Unifica el `read_to_end(...).unwrap_or_default()` repetido en
/// proxy/team/zen/search.
pub(crate) fn read_ureq_body(resp: ureq::Response) -> Vec<u8> {
    let mut buf = Vec::new();
    let mut reader = resp.into_reader();
    let _ = std::io::Read::read_to_end(&mut reader, &mut buf);
    buf
}

/// Snapshot del config con recuperación de poison + clone. Unifica el
/// `state.config.read().unwrap_or_else(|e| e.into_inner()).clone()` repetido.
pub(crate) fn config_clone(state: &crate::state::AppState) -> crate::state::ShellConfig {
    state.config.read().unwrap_or_else(|e| e.into_inner()).clone()
}

/// Percent-encoding de los caracteres no "unreserved" (RFC 3986). Usado por
/// el router de búsqueda para armar la URL de DuckDuckGo.
pub(crate) fn url_encode(s: &str) -> String {
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

/// Percent-decoding (`+` -> espacio, `%XX` -> byte).
pub(crate) fn url_decode(s: &str) -> String {
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

/// Quita tags HTML y decodifica las entidades básicas.
pub(crate) fn strip_html(s: &str) -> String {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn url_encode_unreserved() {
        assert_eq!(url_encode("a b+c/"), "a%20b%2Bc%2F");
    }

    #[test]
    fn url_decode_plus_and_hex() {
        assert_eq!(url_decode("a+b%20c%2F"), "a b c/");
    }

    #[test]
    fn strip_html_removes_tags_and_entities() {
        assert_eq!(strip_html("<b>x</b> &amp; <i>y</i>"), "x & y");
    }

    #[test]
    fn post_macro_error_is_400_json() {
        let req = crate::infrastructure::http::io::ShellRequest {
            method: "POST".into(),
            path: "/x".into(),
            query: String::new(),
            headers: Vec::new(),
            body: Vec::new(),
        };
        let resp = post!(req, _b => unreachable!());
        assert_eq!(resp.status, 400);
        assert!(String::from_utf8_lossy(&resp.body).contains("\"error\""));
    }
}

