//! Manager del server opencode (probe de estado, start/stop) + autostart.

use std::collections::HashMap;
use std::process::Child;
use std::sync::Mutex;

pub struct ServerManager {
    children: Mutex<HashMap<String, Child>>,
}

impl Default for ServerManager {
    fn default() -> Self {
        Self::new()
    }
}

impl ServerManager {
    pub fn new() -> Self {
        Self {
            children: Mutex::new(HashMap::new()),
        }
    }

    /// Sondea los puertos configurados y reporta qué servidor está vivo.
    pub fn status(&self, ports: &[u16]) -> serde_json::Value {
        let mut ports_up = Vec::new();
        for port in ports {
            let url = format!("http://127.0.0.1:{port}/session");
            if let Ok(resp) = ureq::get(&url)
                .timeout(std::time::Duration::from_millis(1200))
                .call()
            {
                if resp.status() == 200 || resp.status() == 401 {
                    ports_up.push(port);
                }
            }
        }
        serde_json::json!({
            "running": !ports_up.is_empty(),
            "ports_up": ports_up,
        })
    }

    /// Arranca el comando configurado (detached). Devuelve el pid si pudo.
    pub fn start(&self, cmd: &str) -> Result<serde_json::Value, String> {
        if cmd.trim().is_empty() {
            return Err("sin comando de arranque configurado".into());
        }
        // "C:\ruta\algo.bat" o "comando.exe args"
        let child = if cmd.trim().to_lowercase().ends_with(".bat") {
            std::process::Command::new("cmd")
                .args(["/c", cmd.trim()])
                .spawn()
                .map_err(|e| e.to_string())?
        } else {
            let parts: Vec<&str> = cmd.trim().split_whitespace().collect();
            if parts.is_empty() {
                return Err("comando vacío".into());
            }
            std::process::Command::new(parts[0])
                .args(&parts[1..])
                .spawn()
                .map_err(|e| e.to_string())?
        };
        let pid = child.id();
        self.children.lock().unwrap().insert("server".into(), child);
        Ok(serde_json::json!({ "started": true, "pid": pid }))
    }

    /// Detiene SOLO los procesos que la shell arrancó.
    pub fn stop(&self) -> Result<serde_json::Value, String> {
        let mut map = self.children.lock().unwrap();
        if let Some(mut child) = map.remove("server") {
            let _ = child.kill();
            let _ = child.wait();
            return Ok(serde_json::json!({ "stopped": true }));
        }
        Ok(serde_json::json!({ "stopped": false, "reason": "no gestionado por la shell" }))
    }
}

/// Estado del server opencode (v1/v2) para el tray y la UI.
#[allow(dead_code)]
pub fn probe_all(ports: &[u16]) -> serde_json::Value {
    let mut up = Vec::new();
    for port in ports {
        let url = format!("http://127.0.0.1:{port}/session");
        match ureq::get(&url).timeout(std::time::Duration::from_millis(900)).call() {
            Ok(resp) if resp.status() == 200 || resp.status() == 401 => up.push(*port),
            _ => {}
        }
    }
    serde_json::json!({
        "ok": !up.is_empty(),
        "ports_up": up,
    })
}