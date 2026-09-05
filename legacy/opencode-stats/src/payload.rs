//! build_payload — contrato JSON exacto del frontend. Port de server.build_payload.
//! Ver docs/migracion-rust/00-inventario.md §3 y §3.1 para el contrato completo.

use std::collections::HashMap;

use chrono::{Local, TimeZone};
use rusqlite::Connection;
use serde_json::{Map, Value, json};

use crate::db::{
    by_day, by_model, by_month, by_project, by_tool, db_path, get_request_counts, load_sessions,
    stats, top_sessions, totals,
};
use crate::pricing::{
    WindowUsage, estimate_cost, limits, model_names, prices_ordered, usage_by_window,
};
use crate::types::{ApiError, Group, TokenCounts, fmt_cost, fmt_num};

/// Claves del payload por scope (port de server.SCOPE_KEYS, inventario §3).
const SCOPE_KEYS: &[(&str, &[&str])] = &[
    (
        "summary",
        &[
            "meta",
            "totals",
            "cost",
            "est_total",
            "stats",
            "today",
            "days",
            "days_tokens",
            "models_chart",
        ],
    ),
    ("modelo", &["by_model"]),
    ("proyecto", &["by_project"]),
    ("dia", &["by_day"]),
    ("mes", &["by_month"]),
    ("sesiones", &["sessions"]),
    ("tools", &["by_tool"]),
    (
        "limites",
        &["today", "days", "days_requests", "limits", "prices"],
    ),
    (
        "usage",
        &["today", "days", "days_requests", "limits", "prices"],
    ),
];

/// Formato de tokens: identidad si raw, sino _fmt.
fn fmt(v: f64, raw: bool) -> Value {
    if raw { json!(v) } else { json!(fmt_num(v)) }
}

/// Formato de costo: identidad si raw, sino _cost.
fn costfmt(v: f64, raw: bool) -> Value {
    if raw { json!(v) } else { json!(fmt_cost(v)) }
}

/// Clave de día/mes LOCAL (port de fromtimestamp(created/1000).strftime).
fn day_key(ts: i64, fmt: &str) -> String {
    match Local.timestamp_millis_opt(ts) {
        chrono::LocalResult::Single(dt) | chrono::LocalResult::Ambiguous(dt, _) => {
            dt.naive_local().format(fmt).to_string()
        }
        chrono::LocalResult::None => "?".to_string(),
    }
}

/// Filas de agregación con los campos del contrato (port de rows(grouped)).
fn rows(grouped: Vec<(String, Group)>, raw: bool) -> Vec<Value> {
    grouped
        .into_iter()
        .map(|(key, g)| {
            json!({
                "key": key,
                "sessions": g.n,
                "input": fmt(g.input as f64, raw),
                "output": fmt(g.output as f64, raw),
                "reasoning": fmt(g.reasoning as f64, raw),
                "cache_read": fmt(g.cache_read as f64, raw),
                "cache_write": fmt(g.cache_write as f64, raw),
                "cost": costfmt(g.cost, raw),
            })
        })
        .collect()
}

/// Payload JSON completo del frontend (port paso a paso de server.build_payload).
pub fn build_payload(
    conn: &Connection,
    since: &str,
    until: &str,
    model: &str,
    raw: bool,
    scope: &str,
) -> Result<Value, ApiError> {
    let sessions = load_sessions(conn, since, until, model)?;
    // scope vacío = "all" (stats-watch y clientes raw no pasan scope; el Python default era "all")
    let scope = if scope.is_empty() { "all" } else { scope };
    let wants_requests = matches!(scope, "all" | "modelo" | "limites" | "usage");
    let requests: HashMap<String, i64> = if wants_requests {
        get_request_counts(conn, &sessions)?
    } else {
        HashMap::new()
    };
    let t = totals(&sessions);
    let st = stats(&sessions, &t);

    // Σ estimate_cost por sesión — los None se excluyen (port del generator de Python).
    let est_total: f64 = sessions
        .iter()
        .filter_map(|s| estimate_cost(&TokenCounts::from(s), &s.model))
        .sum();

    // Estadísticas de hoy y peticiones/tokens por día (fechas LOCAL).
    let today_key = Local::now().format("%Y-%m-%d").to_string();
    let mut today_cost = 0.0_f64;
    let mut today_input = 0_i64;
    let mut today_output = 0_i64;
    let mut today_reasoning = 0_i64;
    let mut today_cache_read = 0_i64;
    let mut today_cache_write = 0_i64;
    let mut today_requests: Option<i64> = None;
    let mut today_sessions = 0_usize;
    let mut req_by_day: HashMap<String, i64> = HashMap::new();
    let mut tok_by_day: HashMap<String, i64> = HashMap::new();
    for s in &sessions {
        let day = day_key(s.created, "%Y-%m-%d");
        if wants_requests {
            *req_by_day.entry(day.clone()).or_insert(0) +=
                requests.get(&s.id).copied().unwrap_or(0);
        }
        *tok_by_day.entry(day.clone()).or_insert(0) += s.input + s.output;
        if day == today_key {
            today_cost += s.cost;
            today_input += s.input;
            today_output += s.output;
            today_reasoning += s.reasoning;
            today_cache_read += s.cache_read;
            today_cache_write += s.cache_write;
            if wants_requests {
                today_requests =
                    Some(today_requests.unwrap_or(0) + requests.get(&s.id).copied().unwrap_or(0));
            }
            today_sessions += 1;
        }
    }
    let days_requests = if wants_requests {
        let mut v: Vec<(String, i64)> = req_by_day.into_iter().collect();
        v.sort_by(|a, b| b.0.cmp(&a.0));
        v.truncate(45);
        Some(
            v.into_iter()
                .map(|(day, requests)| json!({"day": day, "requests": requests}))
                .collect::<Vec<Value>>(),
        )
    } else {
        None
    };
    let mut days_tokens: Vec<(String, i64)> = tok_by_day.into_iter().collect();
    days_tokens.sort_by(|a, b| b.0.cmp(&a.0));
    days_tokens.truncate(45);
    let days_tokens: Vec<Value> = days_tokens
        .into_iter()
        .map(|(day, tokens)| json!({"day": day, "tokens": tokens}))
        .collect();

    let names = model_names();

    // by_model (top 50) — solo si se pidió el scan de peticiones.
    let mut by_model_rows = Vec::new();
    if wants_requests {
        // pre-agregar peticiones por modelo (O(n) en vez de O(modelos × sesiones))
        let mut req_by_model: HashMap<String, i64> = HashMap::new();
        for s in &sessions {
            *req_by_model.entry(s.model.clone()).or_insert(0) +=
                requests.get(&s.id).copied().unwrap_or(0);
        }
        for (mid, g) in by_model(&sessions, 50) {
            let est = estimate_cost(&TokenCounts::from(&g), &mid);
            let req_sum = req_by_model.get(&mid).copied().unwrap_or(0);
            by_model_rows.push(json!({
                "model": names.get(&mid).cloned().unwrap_or_else(|| mid.clone()),
                "id": mid,
                "sessions": g.n,
                "requests": req_sum,
                "input": fmt(g.input as f64, raw),
                "output": fmt(g.output as f64, raw),
                "reasoning": fmt(g.reasoning as f64, raw),
                "cache_read": fmt(g.cache_read as f64, raw),
                "cache_write": fmt(g.cache_write as f64, raw),
                "cost": costfmt(g.cost, raw),
                "est": match est {
                    Some(e) if raw => json!(e),
                    Some(e) => json!(fmt_cost(e)),
                    None if raw => Value::Null,
                    None => json!("—"),
                },
            }));
        }
    }

    let sessions_rows: Vec<Value> = top_sessions(&sessions, 40)
        .iter()
        .map(|s| {
            let base = s.model.rsplit_once('/').map(|(_, r)| r).unwrap_or(&s.model);
            json!({
                "title": s.title.chars().take(60).collect::<String>(),
                "model": names.get(base).cloned().unwrap_or_else(|| base.to_string())
                    .chars().take(24).collect::<String>(),
                "start": day_key(s.created, "%Y-%m-%d %H:%M"),
                "input": fmt(s.input as f64, raw),
                "output": fmt(s.output as f64, raw),
                "cache_read": fmt(s.cache_read as f64, raw),
                "cost": costfmt(s.cost, raw),
            })
        })
        .collect();

    // Uso por ventana + límites: solo modelos con uso > 0, orden desc por suma.
    let usage: HashMap<String, WindowUsage> = if wants_requests {
        usage_by_window(&sessions, &requests, None)
    } else {
        HashMap::new()
    };
    let limits_json: Vec<Value> = {
        let lims = limits();
        let mut v: Vec<(String, WindowUsage)> = usage
            .into_iter()
            .filter(|(_, u)| u.h5 + u.semana + u.mes > 0)
            .collect();
        v.sort_by(|a, b| {
            let sa = a.1.h5 + a.1.semana + a.1.mes;
            let sb = b.1.h5 + b.1.semana + b.1.mes;
            sb.cmp(&sa)
        });
        v.into_iter()
            .map(|(mid, u)| {
                let lim = lims.get(&mid).copied();
                json!({
                    "model": names.get(&mid).cloned().unwrap_or_else(|| mid.clone()),
                    "u5h": u.h5,
                    "u7d": u.semana,
                    "u30d": u.mes,
                    "l5h": lim.map(|l| l.0),
                    "l7d": lim.map(|l| l.1),
                    "l30d": lim.map(|l| l.2),
                })
            })
            .collect()
    };

    let prices_json: Vec<Value> = {
        let names = model_names();
        prices_ordered()
            .iter()
            .map(|(mid, p)| {
                json!({
                    "model": names.get(mid).cloned().unwrap_or_else(|| mid.clone()),
                    "in": p.input,
                    "out": p.output,
                    "cr": p.cache_read,
                    "cw": p.cache_write,
                })
            })
            .collect()
    };

    let (first, last) = match &st {
        Some(st) => (
            day_key(st.primera, "%Y-%m-%d"),
            day_key(st.ultima, "%Y-%m-%d"),
        ),
        None => ("—".to_string(), "—".to_string()),
    };
    let highlights = match &st {
        Some(st) => json!({
            "mas_cara": {
                "cost": costfmt(st.sesion_mas_cara.cost, raw),
                "title": st.sesion_mas_cara.title.chars().take(40).collect::<String>(),
                "model": st.sesion_mas_cara.model.rsplit_once('/').map(|(_, r)| r).unwrap_or(&st.sesion_mas_cara.model),
            },
            "mas_tokens": {
                "title": st.sesion_mas_tokens.title.chars().take(50).collect::<String>(),
                "model": st.sesion_mas_tokens.model.rsplit_once('/').map(|(_, r)| r).unwrap_or(&st.sesion_mas_tokens.model),
            },
            "input_medio": fmt(st.input_medio_sesion, raw),
        }),
        None => json!({
            "mas_cara": {"cost": costfmt(0.0, raw), "title": "—", "model": "—"},
            "mas_tokens": {"title": "—", "model": "—"},
            "input_medio": fmt(0.0, raw),
        }),
    };

    let db_name = match db_path().file_name().and_then(|n| n.to_str()) {
        Some(name) if db_path().exists() => name.to_string(),
        _ => "no encontrada".to_string(),
    };
    let avg_cost = match (&st, raw) {
        (Some(st), true) => json!(st.costo_medio_sesion),
        (Some(st), false) => json!(format!("{:.4}", st.costo_medio_sesion)),
        (None, true) => json!(0.0),
        (None, false) => json!("0.0000"),
    };
    let meta = json!({
        "sessions": sessions.len(),
        "models": st.as_ref().map(|s| s.modelos).unwrap_or(0),
        "since": first,
        "until": last,
        "avg_cost": avg_cost,
        "db": db_name,
        "filtered": !(since.is_empty() && until.is_empty() && model.is_empty()),
    });

    // days: by_day devuelve desc; Python lo revierte a asc (costo crudo).
    let mut days_v = by_day(&sessions, 45);
    days_v.reverse();
    let days: Vec<Value> = days_v
        .into_iter()
        .map(|(day, g)| json!({"day": day, "cost": g.cost}))
        .collect();

    let models_chart: Vec<Value> = by_model(&sessions, 10)
        .into_iter()
        .map(|(mid, g)| {
            json!({
                "model": names.get(&mid).cloned().unwrap_or_else(|| mid.clone()),
                "cost": g.cost,
            })
        })
        .collect();

    let by_project_rows = rows(by_project(conn, &sessions, 15)?, raw);
    let by_day_rows = rows(by_day(&sessions, 60), raw);
    let by_month_rows = rows(by_month(&sessions), raw);

    let by_tool_rows: Vec<Value> = by_tool(conn, &sessions)?
        .into_iter()
        .map(|u| {
            json!({
                "tool": u.tool,
                "calls": u.calls,
                "input": fmt(u.input, raw),
                "output": fmt(u.output, raw),
                "reasoning": fmt(u.reasoning, raw),
                "cache_read": fmt(u.cache_read, raw),
                "cache_write": fmt(u.cache_write, raw),
                "cost": costfmt(u.cost, raw),
            })
        })
        .collect();

    let mut payload = Map::new();
    payload.insert("meta".to_string(), meta);
    payload.insert(
        "totals".to_string(),
        json!({
            "input": fmt(t.input as f64, raw),
            "output": fmt(t.output as f64, raw),
            "reasoning": fmt(t.reasoning as f64, raw),
            "cache_read": fmt(t.cache_read as f64, raw),
            "cache_write": fmt(t.cache_write as f64, raw),
        }),
    );
    payload.insert("cost".to_string(), costfmt(t.cost, raw));
    payload.insert("est_total".to_string(), costfmt(est_total, raw));
    payload.insert("stats".to_string(), highlights);
    payload.insert("days".to_string(), Value::Array(days));
    payload.insert(
        "today".to_string(),
        json!({
            "cost": today_cost,
            "input": today_input,
            "output": today_output,
            "reasoning": today_reasoning,
            "cache_read": today_cache_read,
            "cache_write": today_cache_write,
            "requests": today_requests,
            "sessions": today_sessions,
        }),
    );
    payload.insert(
        "days_requests".to_string(),
        match days_requests {
            Some(v) => Value::Array(v),
            None => Value::Null,
        },
    );
    payload.insert("days_tokens".to_string(), Value::Array(days_tokens));
    payload.insert("models_chart".to_string(), Value::Array(models_chart));
    payload.insert("by_model".to_string(), Value::Array(by_model_rows));
    payload.insert("by_project".to_string(), Value::Array(by_project_rows));
    payload.insert("by_day".to_string(), Value::Array(by_day_rows));
    payload.insert("by_month".to_string(), Value::Array(by_month_rows));
    payload.insert("sessions".to_string(), Value::Array(sessions_rows));
    payload.insert("by_tool".to_string(), Value::Array(by_tool_rows));
    payload.insert("limits".to_string(), Value::Array(limits_json));
    payload.insert("prices".to_string(), Value::Array(prices_json));

    // Filtro por scope: payload = {k: payload[k] for k in SCOPE_KEYS[scope] if k in payload}.
    if let Some((_, keys)) = SCOPE_KEYS.iter().find(|(s, _)| *s == scope).copied() {
        let mut out = Map::new();
        for k in keys {
            if let Some(v) = payload.get(*k) {
                out.insert((*k).to_string(), v.clone());
            }
        }
        return Ok(Value::Object(out));
    }
    Ok(Value::Object(payload))
}
