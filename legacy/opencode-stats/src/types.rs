//! Tipos compartidos del dominio — port fiel del backend Python.
//!
//! Contrato para db.rs / admin.rs / pricing.rs / payload.rs / server.rs.
//! Reglas del skill rust-architect: structs de datos + enums + match, sin herencia,
//! sin generics/lifetimes innecesarios (KISS), sin sobre-arquitectura.

/// Sesión cargada desde `session` (campo a campo con el mapeo de db.load_sessions).
#[derive(Debug, Clone)]
pub struct Session {
    pub id: String,
    pub title: String,
    pub model: String,
    pub project_id: String,
    pub created: i64,
    pub updated: i64,
    pub directory: String,
    pub archived: bool,
    pub input: i64,
    pub output: i64,
    pub reasoning: i64,
    pub cache_read: i64,
    pub cache_write: i64,
    pub cost: f64,
}

impl Session {
    pub fn total_tokens(&self) -> i64 {
        self.input + self.output
    }
}

/// Agregación de sesiones (equivalente al defaultdict de db.aggregate).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Group {
    pub input: i64,
    pub output: i64,
    pub reasoning: i64,
    pub cache_read: i64,
    pub cache_write: i64,
    pub cost: f64,
    pub n: usize,
}

/// Precio por 1M de tokens (USD): entrada, salida, cache read, cache write.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Price {
    pub input: f64,
    pub output: f64,
    pub cache_read: f64,
    pub cache_write: f64,
}

/// Desglose de tokens por herramienta: llamadas reales + tokens del turno
/// (step-finish "tool-calls") repartidos equitativamente entre las tools del mensaje.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct ToolUsage {
    pub tool: String,
    pub calls: i64,
    pub input: f64,
    pub output: f64,
    pub reasoning: f64,
    pub cache_read: f64,
    pub cache_write: f64,
    pub cost: f64,
}

/// Conteo de tokens (equivalente a los campos token_* de session / del dict de aggregate).
#[derive(Debug, Clone, Copy, Default, PartialEq)]
pub struct TokenCounts {
    pub input: i64,
    pub output: i64,
    pub reasoning: i64,
    pub cache_read: i64,
    pub cache_write: i64,
}

impl From<&Session> for TokenCounts {
    fn from(s: &Session) -> Self {
        TokenCounts {
            input: s.input,
            output: s.output,
            reasoning: s.reasoning,
            cache_read: s.cache_read,
            cache_write: s.cache_write,
        }
    }
}

impl From<&Group> for TokenCounts {
    fn from(g: &Group) -> Self {
        TokenCounts {
            input: g.input,
            output: g.output,
            reasoning: g.reasoning,
            cache_read: g.cache_read,
            cache_write: g.cache_write,
        }
    }
}

/// Límites de peticiones por ventana: (5 horas, semana, mes).
pub type Limits = (i64, i64, i64);

/// Acciones de gestión (POST /api/admin) — enum + pattern matching (ISP del skill).
#[derive(Debug)]
pub enum AdminAction {
    Delete {
        ids: Vec<String>,
    },
    Move {
        ids: Vec<String>,
        directory: String,
    },
    Rename {
        id: String,
        title: String,
    },
    Archive {
        ids: Vec<String>,
        archived: bool,
    },
    Prune {
        cutoff: String,
    },
    Export {
        ids: Vec<String>,
    },
    Backup {
        dest: Option<String>,
    },
    Vacuum,
    Restore {
        backup_path: String,
    },
    PricingSave {
        prices: serde_json::Value,
        limits: serde_json::Value,
        names: serde_json::Value,
    },
    /// Cambia la ruta de la base de datos (config.json; requiere reiniciar).
    SetDb {
        path: String,
    },
}

/// Opciones comunes: dry-run y forzar (opencode corriendo).
#[derive(Debug, Clone, Copy, Default)]
pub struct Guard {
    pub dry_run: bool,
    pub force: bool,
}

/// Error de API con mapeo a código HTTP (403 blocked para Permission).
#[derive(Debug)]
pub enum ApiError {
    Json(String),
    Sqlite(rusqlite::Error),
    Permission(String),
    NotFound(String),
    Msg(String),
}

impl std::fmt::Display for ApiError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ApiError::Json(m)
            | ApiError::Permission(m)
            | ApiError::NotFound(m)
            | ApiError::Msg(m) => {
                write!(f, "{m}")
            }
            ApiError::Sqlite(e) => write!(f, "{e}"),
        }
    }
}

impl From<rusqlite::Error> for ApiError {
    fn from(e: rusqlite::Error) -> Self {
        ApiError::Sqlite(e)
    }
}

impl From<serde_json::Error> for ApiError {
    fn from(e: serde_json::Error) -> Self {
        ApiError::Json(e.to_string())
    }
}

impl From<std::io::Error> for ApiError {
    fn from(e: std::io::Error) -> Self {
        ApiError::Msg(e.to_string())
    }
}

/// Formateadores exactos del backend Python (server._fmt / server._cost).
///
/// `_fmt`: n>=1e9 -> "{:.2f} B"; n>=1e6 -> "{:.2f} M"; n>=1e3 -> "{:.1f} K"; else int.
/// `_cost`: n>=100 -> "${:,.0f}"; n>=1 -> "${:,.2f}"; else "${:.4f}" (con comas de miles).
pub fn fmt_num(n: f64) -> String {
    if n >= 1e9 {
        format!("{:.2} B", n / 1e9)
    } else if n >= 1e6 {
        format!("{:.2} M", n / 1e6)
    } else if n >= 1e3 {
        format!("{:.1} K", n / 1e3)
    } else {
        (n as i64).to_string()
    }
}

/// Comas de miles estilo en-US: 1234567 -> "1,234,567".
pub fn thousands(n: i64) -> String {
    let neg = n < 0;
    let s = n.unsigned_abs().to_string();
    let mut out = String::with_capacity(s.len() + s.len() / 3);
    for (i, c) in s.chars().enumerate() {
        if i > 0 && (s.len() - i).is_multiple_of(3) {
            out.push(',');
        }
        out.push(c);
    }
    if neg {
        out.insert(0, '-');
    }
    out
}

pub fn fmt_cost(n: f64) -> String {
    if n >= 100.0 {
        // round_ties_even: f"{n:,.0f}" de Python usa redondeo bancario
        format!("${}", thousands(n.round_ties_even() as i64))
    } else if n >= 1.0 {
        format!("${:.2}", n)
    } else {
        format!("${:.4}", n)
    }
}
