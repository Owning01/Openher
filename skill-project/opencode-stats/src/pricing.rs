//! Precios y límites de OpenCode Go. Port de opencode_stats/pricing.py.
//! Ver docs/migracion-rust/00-inventario.md §5 para el contrato completo.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Once, OnceLock, RwLock, RwLockReadGuard};

use serde::Serialize;

use crate::types::{Price, Session, TokenCounts};

pub use crate::types::Limits;

/// Ruta del archivo de overrides: frozen → `%LOCALAPPDATA%\OpenCodeStats\`,
/// dev → `data/` de la raíz del repo. En el exe empaquetado LOCALAPPDATA existe.
pub fn overrides_path() -> PathBuf {
    if let Ok(base) = std::env::var("LOCALAPPDATA") {
        PathBuf::from(base)
            .join("OpenCodeStats")
            .join("pricing_overrides.json")
    } else {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("data")
            .join("pricing_overrides.json")
    }
}

static OVERRIDES: OnceLock<RwLock<PathBuf>> = OnceLock::new();

fn current_overrides_path() -> PathBuf {
    OVERRIDES
        .get_or_init(|| RwLock::new(overrides_path()))
        .read()
        .unwrap()
        .clone()
}

/// Ruta actual de overrides (para tests: guardar/restaurar).
#[doc(hidden)]
pub fn current_overrides_path_for_tests() -> PathBuf {
    current_overrides_path()
}

/// Redirige la ruta de overrides (para tests).
pub fn set_overrides_path(p: PathBuf) {
    *OVERRIDES
        .get_or_init(|| RwLock::new(overrides_path()))
        .write()
        .unwrap() = p;
}

/// Orden de definición de los modelos (el dict de Python preserva el orden de inserción;
/// el frontend renderiza prices en ese orden).
pub const MODEL_ORDER: [&str; 18] = [
    "grok-4.5",
    "gpt-5.6-luna",
    "glm-5.2",
    "glm-5.1",
    "kimi-k3",
    "kimi-k2.7-code",
    "kimi-k2.6",
    "mimo-v2.5",
    "mimo-v2.5-pro",
    "minimax-m3",
    "minimax-m2.7",
    "minimax-m2.5",
    "qwen3.7-max",
    "qwen3.7-plus",
    "qwen3.6-plus",
    "deepseek-v4-pro",
    "deepseek-v4-flash",
    "hy3",
];

/// Precios iterados en el orden de definición (equivalente a recorrer el dict de Python).
pub fn prices_ordered() -> Vec<(String, Price)> {
    let p = prices();
    MODEL_ORDER
        .iter()
        .filter_map(|k| p.get(*k).map(|v| (k.to_string(), *v)))
        .collect()
}

/// Precios por 1M tokens (USD): entrada, salida, cache read, cache write.
/// Port exacto de pricing.PRICES — 18 modelos (inventario §5).
pub fn default_prices() -> HashMap<String, Price> {
    HashMap::from([
        (
            "grok-4.5".to_string(),
            Price {
                input: 2.00,
                output: 6.00,
                cache_read: 0.30,
                cache_write: 0.00,
            },
        ),
        (
            "gpt-5.6-luna".to_string(),
            Price {
                input: 0.20,
                output: 1.20,
                cache_read: 0.02,
                cache_write: 0.25,
            },
        ),
        (
            "glm-5.2".to_string(),
            Price {
                input: 1.40,
                output: 4.40,
                cache_read: 0.26,
                cache_write: 0.00,
            },
        ),
        (
            "glm-5.1".to_string(),
            Price {
                input: 1.40,
                output: 4.40,
                cache_read: 0.26,
                cache_write: 0.00,
            },
        ),
        (
            "kimi-k3".to_string(),
            Price {
                input: 3.00,
                output: 15.00,
                cache_read: 0.30,
                cache_write: 0.00,
            },
        ),
        (
            "kimi-k2.7-code".to_string(),
            Price {
                input: 0.95,
                output: 4.00,
                cache_read: 0.19,
                cache_write: 0.00,
            },
        ),
        (
            "kimi-k2.6".to_string(),
            Price {
                input: 0.95,
                output: 4.00,
                cache_read: 0.16,
                cache_write: 0.00,
            },
        ),
        (
            "mimo-v2.5".to_string(),
            Price {
                input: 0.14,
                output: 0.28,
                cache_read: 0.0028,
                cache_write: 0.00,
            },
        ),
        (
            "mimo-v2.5-pro".to_string(),
            Price {
                input: 0.435,
                output: 0.87,
                cache_read: 0.003625,
                cache_write: 0.00,
            },
        ),
        (
            "minimax-m3".to_string(),
            Price {
                input: 0.30,
                output: 1.20,
                cache_read: 0.06,
                cache_write: 0.00,
            },
        ),
        (
            "minimax-m2.7".to_string(),
            Price {
                input: 0.30,
                output: 1.20,
                cache_read: 0.06,
                cache_write: 0.375,
            },
        ),
        (
            "minimax-m2.5".to_string(),
            Price {
                input: 0.30,
                output: 1.20,
                cache_read: 0.06,
                cache_write: 0.375,
            },
        ),
        (
            "qwen3.7-max".to_string(),
            Price {
                input: 2.50,
                output: 7.50,
                cache_read: 0.50,
                cache_write: 3.125,
            },
        ),
        (
            "qwen3.7-plus".to_string(),
            Price {
                input: 0.40,
                output: 1.60,
                cache_read: 0.04,
                cache_write: 0.50,
            },
        ),
        (
            "qwen3.6-plus".to_string(),
            Price {
                input: 0.50,
                output: 3.00,
                cache_read: 0.05,
                cache_write: 0.625,
            },
        ),
        (
            "deepseek-v4-pro".to_string(),
            Price {
                input: 0.435,
                output: 0.87,
                cache_read: 0.003625,
                cache_write: 0.00,
            },
        ),
        (
            "deepseek-v4-flash".to_string(),
            Price {
                input: 0.14,
                output: 0.28,
                cache_read: 0.0028,
                cache_write: 0.00,
            },
        ),
        (
            "hy3".to_string(),
            Price {
                input: 0.14,
                output: 0.58,
                cache_read: 0.035,
                cache_write: 0.00,
            },
        ),
    ])
}

/// Peticiones permitidas por ventana: (5 horas, semana, mes).
/// Port exacto de pricing.LIMITS — 17 modelos (minimax-m2.5 no tiene límite).
pub fn default_limits() -> HashMap<String, Limits> {
    HashMap::from([
        ("grok-4.5".to_string(), (120, 300, 600)),
        ("gpt-5.6-luna".to_string(), (2050, 5100, 10250)),
        ("glm-5.2".to_string(), (880, 2150, 4300)),
        ("glm-5.1".to_string(), (880, 2150, 4300)),
        ("kimi-k3".to_string(), (110, 250, 490)),
        ("kimi-k2.7-code".to_string(), (1350, 3380, 6750)),
        ("kimi-k2.6".to_string(), (1150, 2880, 5750)),
        ("mimo-v2.5".to_string(), (30100, 75200, 150400)),
        ("mimo-v2.5-pro".to_string(), (3250, 8150, 16300)),
        ("minimax-m3".to_string(), (3200, 8000, 16000)),
        ("minimax-m2.7".to_string(), (3400, 8500, 17000)),
        ("qwen3.7-max".to_string(), (950, 2390, 4770)),
        ("qwen3.7-plus".to_string(), (4300, 10800, 21600)),
        ("qwen3.6-plus".to_string(), (3300, 8200, 16300)),
        ("deepseek-v4-pro".to_string(), (3450, 8550, 17150)),
        ("deepseek-v4-flash".to_string(), (31650, 79050, 158150)),
        ("hy3".to_string(), (4300, 10750, 21500)),
    ])
}

/// Nombres legibles de los modelos. Port exacto de pricing.MODEL_NAMES — 18 modelos.
pub fn default_model_names() -> HashMap<String, String> {
    HashMap::from([
        ("grok-4.5".to_string(), "Grok 4.5".to_string()),
        ("gpt-5.6-luna".to_string(), "GPT 5.6 Luna".to_string()),
        ("glm-5.2".to_string(), "GLM-5.2".to_string()),
        ("glm-5.1".to_string(), "GLM-5.1".to_string()),
        ("kimi-k3".to_string(), "Kimi K3".to_string()),
        ("kimi-k2.7-code".to_string(), "Kimi K2.7 Code".to_string()),
        ("kimi-k2.6".to_string(), "Kimi K2.6".to_string()),
        ("mimo-v2.5".to_string(), "MiMo-V2.5".to_string()),
        ("mimo-v2.5-pro".to_string(), "MiMo-V2.5-Pro".to_string()),
        ("minimax-m3".to_string(), "MiniMax M3".to_string()),
        ("minimax-m2.7".to_string(), "MiniMax M2.7".to_string()),
        ("minimax-m2.5".to_string(), "MiniMax M2.5".to_string()),
        ("qwen3.7-max".to_string(), "Qwen3.7 Max".to_string()),
        ("qwen3.7-plus".to_string(), "Qwen3.7 Plus".to_string()),
        ("qwen3.6-plus".to_string(), "Qwen3.6 Plus".to_string()),
        ("deepseek-v4-pro".to_string(), "DeepSeek V4 Pro".to_string()),
        (
            "deepseek-v4-flash".to_string(),
            "DeepSeek V4 Flash".to_string(),
        ),
        ("hy3".to_string(), "Hy3".to_string()),
    ])
}

static PRICES: OnceLock<RwLock<HashMap<String, Price>>> = OnceLock::new();
static LIMITS: OnceLock<RwLock<HashMap<String, Limits>>> = OnceLock::new();
static MODEL_NAMES: OnceLock<RwLock<HashMap<String, String>>> = OnceLock::new();

fn prices_ref() -> &'static RwLock<HashMap<String, Price>> {
    PRICES.get_or_init(|| RwLock::new(default_prices()))
}

fn limits_ref() -> &'static RwLock<HashMap<String, Limits>> {
    LIMITS.get_or_init(|| RwLock::new(default_limits()))
}

fn model_names_ref() -> &'static RwLock<HashMap<String, String>> {
    MODEL_NAMES.get_or_init(|| RwLock::new(default_model_names()))
}

/// Estado en memoria (defaults + overrides aplicados). Equivalente al import
/// del Python, donde `_apply_overrides()` corría al cargar el módulo.
pub fn prices() -> RwLockReadGuard<'static, HashMap<String, Price>> {
    prices_ref().read().unwrap()
}

pub fn limits() -> RwLockReadGuard<'static, HashMap<String, Limits>> {
    limits_ref().read().unwrap()
}

pub fn model_names() -> RwLockReadGuard<'static, HashMap<String, String>> {
    model_names_ref().read().unwrap()
}

static INIT: Once = Once::new();

/// Inicializa los statics desde defaults + overrides del archivo (si existe).
/// Puede llamarse varias veces; solo inicializa una.
pub fn init() {
    INIT.call_once(|| {
        reset_to_defaults();
        let _ = apply_overrides_from_file();
    });
}

/// Re-inicializa los statics desde defaults SIN aplicar overrides (aislamiento de tests).
pub fn reset_to_defaults() {
    *prices_ref().write().unwrap() = default_prices();
    *limits_ref().write().unwrap() = default_limits();
    *model_names_ref().write().unwrap() = default_model_names();
}

/// Costo estimado en USD a partir de tokens reales y precios oficiales.
/// None si el modelo no tiene precio. El reasoning se factura como output.
pub fn estimate_cost(t: &TokenCounts, model_id: &str) -> Option<f64> {
    let guard = prices();
    let p = guard.get(model_id)?;
    Some(
        t.input as f64 / 1e6 * p.input
            + (t.output + t.reasoning) as f64 / 1e6 * p.output
            + t.cache_read as f64 / 1e6 * p.cache_read
            + t.cache_write as f64 / 1e6 * p.cache_write,
    )
}

/// Ventanas de uso en ms: (5 horas, semana, mes).
pub const WINDOWS_MS: [i64; 3] = [5 * 3_600_000, 7 * 24 * 3_600_000, 30 * 24 * 3_600_000];

/// Peticiones usadas por modelo en cada ventana (5h, semana, mes).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct WindowUsage {
    pub h5: i64,
    pub semana: i64,
    pub mes: i64,
}

/// Peticiones usadas por modelo: `now = now_ms` o `max(s.updated)` (0 si vacío);
/// cada sesión suma `requests[s.id]` (0 si ausente) a las ventanas donde `age <= window`.
pub fn usage_by_window(
    sessions: &[Session],
    requests: &HashMap<String, i64>,
    now_ms: Option<i64>,
) -> HashMap<String, WindowUsage> {
    let now = now_ms.unwrap_or_else(|| sessions.iter().map(|s| s.updated).max().unwrap_or(0));
    let mut usage: HashMap<String, WindowUsage> = HashMap::new();
    for s in sessions {
        let u = usage.entry(s.model.clone()).or_default();
        let n = requests.get(&s.id).copied().unwrap_or(0);
        let age = now - s.created;
        if age <= WINDOWS_MS[0] {
            u.h5 += n;
        }
        if age <= WINDOWS_MS[1] {
            u.semana += n;
        }
        if age <= WINDOWS_MS[2] {
            u.mes += n;
        }
    }
    usage
}

/// Texto de estado de cuota: "OK" / "70%" / "AGOTADO" / None si no hay límite.
/// El `model_id` no se usa (port fiel de `quota_status`).
pub fn quota_status(_model_id: &str, used: i64, limit: Option<i64>) -> Option<String> {
    let limit = limit?;
    let pct = used as f64 / limit as f64 * 100.0;
    if used >= limit {
        Some("AGOTADO".to_string())
    } else if pct >= 70.0 {
        Some(format!("{:.0}%", pct))
    } else {
        Some("OK".to_string())
    }
}

/// Lee el archivo de overrides y fusiona sobre los statics (los keys faltantes
/// no se borran; los presentes pisan). Archivo ausente o corrupto → no-op.
pub fn apply_overrides_from_file() -> Result<(), String> {
    let path = current_overrides_path();
    let data = match std::fs::read_to_string(&path) {
        Ok(d) => d,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(e) => return Err(format!("no se pudo leer {}: {e}", path.display())),
    };
    let ov: serde_json::Value = match serde_json::from_str(&data) {
        Ok(v) => v,
        Err(_) => return Ok(()),
    };
    if let Some(prices) = ov.get("prices").and_then(|v| v.as_object()) {
        let mut guard = prices_ref().write().unwrap();
        for (mid, v) in prices {
            guard.insert(
                mid.clone(),
                Price {
                    input: v.get("in").and_then(|x| x.as_f64()).unwrap_or(0.0),
                    output: v.get("out").and_then(|x| x.as_f64()).unwrap_or(0.0),
                    cache_read: v.get("cr").and_then(|x| x.as_f64()).unwrap_or(0.0),
                    cache_write: v.get("cw").and_then(|x| x.as_f64()).unwrap_or(0.0),
                },
            );
        }
    }
    if let Some(limits) = ov.get("limits").and_then(|v| v.as_object()) {
        let mut guard = limits_ref().write().unwrap();
        for (mid, v) in limits {
            let arr = v.as_array();
            guard.insert(
                mid.clone(),
                (
                    arr.and_then(|a| a.first())
                        .and_then(|x| x.as_i64())
                        .unwrap_or(0),
                    arr.and_then(|a| a.get(1))
                        .and_then(|x| x.as_i64())
                        .unwrap_or(0),
                    arr.and_then(|a| a.get(2))
                        .and_then(|x| x.as_i64())
                        .unwrap_or(0),
                ),
            );
        }
    }
    if let Some(names) = ov.get("names").and_then(|v| v.as_object()) {
        let mut guard = model_names_ref().write().unwrap();
        for (mid, v) in names {
            if let Some(s) = v.as_str() {
                guard.insert(mid.clone(), s.to_string());
            }
        }
    }
    Ok(())
}

/// Guarda el estado completo de los 3 dicts en el archivo de overrides
/// (indent=1, sin escapar unicode) y los actualiza en memoria. Retorna la ruta.
pub fn save_overrides(
    prices: HashMap<String, Price>,
    limits: HashMap<String, Limits>,
    names: HashMap<String, String>,
) -> Result<PathBuf, String> {
    let path = current_overrides_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("no se pudo crear {}: {e}", parent.display()))?;
    }
    let payload = serde_json::json!({
        "prices": prices.iter().map(|(k, p)| (
            k.clone(),
            serde_json::json!({"in": p.input, "out": p.output, "cr": p.cache_read, "cw": p.cache_write})
        )).collect::<serde_json::Map<_, _>>(),
        "limits": limits.iter().map(|(k, l)| (k.clone(), serde_json::json!([l.0, l.1, l.2])))
            .collect::<serde_json::Map<_, _>>(),
        "names": names,
    });
    let mut buf = Vec::new();
    let mut ser = serde_json::Serializer::with_formatter(
        &mut buf,
        serde_json::ser::PrettyFormatter::with_indent(b" "),
    );
    payload.serialize(&mut ser).map_err(|e| e.to_string())?;
    std::fs::write(&path, buf)
        .map_err(|e| format!("no se pudo escribir {}: {e}", path.display()))?;
    *prices_ref().write().unwrap() = prices;
    *limits_ref().write().unwrap() = limits;
    *model_names_ref().write().unwrap() = names;
    Ok(path)
}

/// Actualiza los statics y persiste el archivo (usado por admin.save_pricing).
pub fn set_all(
    prices: HashMap<String, Price>,
    limits: HashMap<String, Limits>,
    names: HashMap<String, String>,
) -> Result<(), String> {
    save_overrides(prices, limits, names).map(|_| ())
}
