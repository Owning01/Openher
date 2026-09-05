//! Monitor de terminal — port de stats-watch.py (lee la API local de OpenCode Stats).
use serde_json::Value;

const REFRESH: u64 = 5;

fn fetch(port: u16) -> Result<Value, String> {
    let url = format!("http://127.0.0.1:{port}/api/data?raw=1");
    let agent = ureq::AgentBuilder::new()
        .timeout_connect(std::time::Duration::from_secs(5))
        .timeout_read(std::time::Duration::from_secs(5))
        .build();
    let body = agent
        .get(&url)
        .call()
        .map_err(|e| e.to_string())?
        .into_string()
        .map_err(|e| e.to_string())?;
    serde_json::from_str(&body).map_err(|e| e.to_string())
}

fn cost(n: f64) -> String {
    opencode_stats::types::fmt_cost(n)
}

fn render(d: &Value) -> String {
    let t = &d["totals"];
    let days = d
        .get("days")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();
    let today_key = chrono::Local::now().format("%Y-%m-%d").to_string();
    let today: f64 = days
        .iter()
        .filter(|day| day["day"].as_str().unwrap_or("") == today_key)
        .map(|day| day["cost"].as_f64().unwrap_or(0.0))
        .sum();
    let week: f64 = days
        .iter()
        .rev()
        .take(7)
        .map(|day| day["cost"].as_f64().unwrap_or(0.0))
        .sum();
    let m = &d["meta"];
    let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let mut lines = Vec::new();
    lines.push("=".repeat(74));
    lines.push(format!(
        "  OpenCode Stats  |  {now}  |  refresh {REFRESH}s  (Ctrl+C salir)"
    ));
    lines.push("=".repeat(74));
    lines.push(format!(
        "  Sesiones: {}  Modelos: {}  Rango: {} -> {}",
        m["sessions"].as_i64().unwrap_or(0),
        m["models"].as_i64().unwrap_or(0),
        m["since"].as_str().unwrap_or(""),
        m["until"].as_str().unwrap_or("")
    ));
    lines.push(String::new());
    lines.push(format!(
        "  TOKENS  in={}  out={}  reasoning={}  cache_r={}  cache_w={}",
        t["input"].as_i64().unwrap_or(0),
        t["output"].as_i64().unwrap_or(0),
        t["reasoning"].as_i64().unwrap_or(0),
        t["cache_read"].as_i64().unwrap_or(0),
        t["cache_write"].as_i64().unwrap_or(0)
    ));
    lines.push(format!(
        "  COSTO   total={}  estimado={}  hoy={}  ultimos 7d={}",
        cost(d["cost"].as_f64().unwrap_or(0.0)),
        cost(d["est_total"].as_f64().unwrap_or(0.0)),
        cost(today),
        cost(week)
    ));
    lines.push(String::new());
    lines.push("  TOP MODELOS:".to_string());
    for row in d
        .get("by_model")
        .and_then(|v| v.as_array())
        .into_iter()
        .flatten()
        .take(6)
    {
        lines.push(format!(
            "    {:<22} ses={:<4} in={:>7} out={:>7} cost={:>9}",
            row["model"]
                .as_str()
                .unwrap_or("")
                .chars()
                .take(22)
                .collect::<String>(),
            row["sessions"].as_i64().unwrap_or(0),
            row["input"].as_i64().unwrap_or(0),
            row["output"].as_i64().unwrap_or(0),
            cost(row["cost"].as_f64().unwrap_or(0.0))
        ));
    }
    lines.push(String::new());
    lines.push("  ULTIMAS SESIONES:".to_string());
    for row in d
        .get("sessions")
        .and_then(|v| v.as_array())
        .into_iter()
        .flatten()
        .take(6)
    {
        lines.push(format!(
            "    {:<40} {:<14} in={:>7} cost={:>8}",
            row["title"]
                .as_str()
                .unwrap_or("")
                .chars()
                .take(40)
                .collect::<String>(),
            row["model"]
                .as_str()
                .unwrap_or("")
                .chars()
                .take(14)
                .collect::<String>(),
            row["input"].as_i64().unwrap_or(0),
            cost(row["cost"].as_f64().unwrap_or(0.0))
        ));
    }
    lines.push("=".repeat(74));
    lines.join("\n")
}

fn main() {
    let port: u16 = std::env::var("OPENCODE_STATS_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8765);
    loop {
        match fetch(port) {
            Ok(d) => {
                clear();
                println!("{}", render(&d));
            }
            Err(e) => {
                clear();
                println!("OpenCode Stats — sin conexion con el servidor (127.0.0.1:{port})");
                println!("  {e:?}");
                println!("  Arranca el servidor con: cargo run  en G:\\Proyectos\\opencode-stats");
            }
        }
        std::thread::sleep(std::time::Duration::from_secs(REFRESH));
    }
}

fn clear() {
    #[cfg(windows)]
    let _ = std::process::Command::new("cmd")
        .args(["/C", "cls"])
        .spawn()
        .map(|mut c| c.wait());
    #[cfg(not(windows))]
    print!("\x1b[2J\x1b[H");
}
