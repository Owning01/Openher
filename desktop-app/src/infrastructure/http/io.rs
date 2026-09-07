//! Tipos HTTP agnósticos al servidor (Plan 1 — migración hyper).
//!
//! Los routers de `/shell/*` trabajan SOLO con `ShellRequest`/`ShellResponse`.
//! `http_server.rs` adapta hyper Request -> ShellRequest y de vuelta.
//!
//! Reglas: headers con nombre en minúsculas; `method` en mayúsculas ("GET");
//! `path` sin query; `query` cruda (el parse con `q()` sigue en api.rs).

// ---------------------------------------------------------------------------
// ShellRequest
// ---------------------------------------------------------------------------
pub struct ShellRequest {
    pub method: String,
    pub path: String,
    pub query: String,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

impl ShellRequest {
    pub fn header(&self, name: &str) -> Option<&str> {
        let want = name.to_ascii_lowercase();
        self.headers
            .iter()
            .find(|(k, _)| k == &want)
            .map(|(_, v)| v.as_str())
    }

    /// Cuerpo como JSON (reemplaza a `state::read_body`, misma semántica:
    /// cuerpo vacío -> Err, cap 16MB, fast path simd-json >1KB).
    pub fn json_body(&self) -> Result<serde_json::Value, String> {
        const MAX_BODY_BYTES: usize = 16 * 1024 * 1024;
        if self.body.is_empty() {
            return Err("empty body".to_string());
        }
        if self.body.len() > MAX_BODY_BYTES {
            return Err(format!("body too large: >{MAX_BODY_BYTES} bytes"));
        }
        if self.body.len() > 1024 {
            let mut buf = self.body.clone();
            return crate::common::parse_json_simd(&mut buf);
        }
        let s = String::from_utf8_lossy(&self.body);
        serde_json::from_str(&s).map_err(|e| format!("json inválido: {e}"))
    }
}

// ---------------------------------------------------------------------------
// ShellResponse
// ---------------------------------------------------------------------------
pub struct ShellResponse {
    pub status: u16,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

impl ShellResponse {
    pub fn new(status: u16, body: Vec<u8>) -> Self {
        Self { status, headers: Vec::new(), body }
    }

    pub fn with_header(mut self, name: &str, value: &str) -> Self {
        self.headers.push((name.to_ascii_lowercase(), value.to_string()));
        self
    }

    pub fn from_string(status: u16, body: String) -> Self {
        Self::new(status, body.into_bytes())
    }

    fn cors(mut self) -> Self {
        for (k, v) in [
            ("access-control-allow-origin", "*"),
            ("access-control-allow-methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"),
            ("access-control-allow-headers", "Content-Type, Authorization, X-Requested-With, Accept"),
            ("access-control-expose-headers", "Content-Length, Content-Type, Content-Disposition, Authorization"),
            ("access-control-max-age", "86400"),
        ] {
            self.headers.push((k.to_string(), v.to_string()));
        }
        self
    }

    /// Equivale a `state::json_ok` + CORS (mismo content-type con charset).
    pub fn ok_json(v: &serde_json::Value) -> Self {
        Self::new(200, v.to_string().into_bytes())
            .with_header("content-type", "application/json; charset=utf-8")
            .cors()
    }

    /// Equivale a `state::json_err` + CORS.
    pub fn err_json(code: u16, msg: &str) -> Self {
        Self::new(code, serde_json::json!({ "error": msg }).to_string().into_bytes())
            .with_header("content-type", "application/json; charset=utf-8")
            .cors()
    }

    pub fn data(status: u16, bytes: Vec<u8>, content_type: &str) -> Self {
        Self::new(status, bytes).with_header("content-type", content_type)
    }

    /// Preflight OPTIONS 204 (origen y headers eco del request).
    pub fn options_preflight(origin: &str, req_headers: &str) -> Self {
        Self::new(204, Vec::new())
            .with_header("access-control-allow-origin", origin)
            .with_header(
                "access-control-allow-methods",
                "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
            )
            .with_header("access-control-allow-headers", req_headers)
            .with_header("access-control-max-age", "86400")
    }

    pub fn unauthorized() -> Self {
        Self::err_json(401, "unauthorized")
            .with_header("www-authenticate", "Basic realm=\"opencode-desktop\"")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn header_case_insensitive() {
        let r = ShellRequest {
            method: "GET".into(),
            path: "/x".into(),
            query: String::new(),
            headers: vec![("content-type".into(), "application/json".into())],
            body: Vec::new(),
        };
        assert_eq!(r.header("Content-Type"), Some("application/json"));
        assert_eq!(r.header("x-missing"), None);
    }

    #[test]
    fn json_body_empty_is_err() {
        let r = ShellRequest {
            method: "POST".into(),
            path: "/x".into(),
            query: String::new(),
            headers: Vec::new(),
            body: Vec::new(),
        };
        assert!(r.json_body().is_err());
    }

    #[test]
    fn ok_json_shape() {
        let r = ShellResponse::ok_json(&serde_json::json!({ "ok": true }));
        assert_eq!(r.status, 200);
        assert!(r.headers.iter().any(|(k, v)| k == "content-type" && v == "application/json; charset=utf-8"));
        assert!(r.headers.iter().any(|(k, _)| k == "access-control-allow-origin"));
    }

    #[test]
    fn preflight_is_204() {
        let r = ShellResponse::options_preflight("http://x", "Content-Type");
        assert_eq!(r.status, 204);
        assert!(r.body.is_empty());
    }
}
