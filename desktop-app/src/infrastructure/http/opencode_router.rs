//! Router /shell/opencode/global + /shell/labs* — delegado desde api.rs.

use std::sync::Arc;

use tiny_http::{Method, Request, Response};

use crate::state::{json_err, json_ok, read_body, AppState};

#[allow(clippy::too_many_lines)]
pub fn handle(
    req: &mut Request,
    state: Arc<AppState>,
    path: &str,
    method: Method,
    _q: &dyn Fn(&str) -> String,
) -> Option<Response<std::io::Cursor<Vec<u8>>>> {
    // /shell/opencode/global GET y POST
    if path == "/shell/opencode/global" {
        if method == Method::Get {
            return Some(handle_global_get());
        }
        if method == Method::Post {
            return Some(match read_body(req) {
                Ok(b) => {
                    let config_path = b["configPath"].as_str().or_else(|| b["path"].as_str()).unwrap_or("");
                    let content = b["content"].as_str().unwrap_or("");
                    if config_path.is_empty() || content.is_empty() {
                        json_err(400, "Ruta o contenido inválido")
                    } else {
                        let p = std::path::PathBuf::from(config_path);
                        if let Some(parent) = p.parent() {
                            let _ = std::fs::create_dir_all(parent);
                        }
                        match std::fs::write(&p, content) {
                            Ok(_) => json_ok(&serde_json::json!({ "ok": true })),
                            Err(e) => json_err(500, &format!("Error al escribir archivo: {}", e)),
                        }
                    }
                }
                Err(e) => json_err(400, &e.to_string()),
            });
        }
        return Some(json_err(405, "method not allowed"));
    }

    // /shell/labs y /shell/labs/start
    let labs_route = path.strip_prefix("/shell/labs")?;
    let resp = match (method, labs_route) {
        (Method::Get, "") | (Method::Get, "/") => json_ok(&crate::plugins::labs_list(&state)),
        (Method::Post, "/start") => match read_body(req) {
            Ok(b) => {
                let id = b["id"].as_str().unwrap_or("");
                match crate::plugins::labs_start(&state, id) {
                    Ok(v) => json_ok(&v),
                    Err(e) => json_err(500, &e.to_string()),
                }
            }
            Err(e) => json_err(400, &e.to_string()),
        },
        // soporte ruta exacta /shell/labs sin strip para compatibilidad
        _ => return None,
    };
    Some(resp)
}

fn handle_global_get() -> Response<std::io::Cursor<Vec<u8>>> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .or_else(|_| std::env::var("HOMEPATH").map(|hp| format!("{}{}", std::env::var("HOMEDRIVE").unwrap_or_default(), hp)))
        .or_else(|_| {
            std::env::var("APPDATA").map(|a| {
                std::path::PathBuf::from(&a)
                    .parent()
                    .and_then(|p| p.parent())
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or(a)
            })
        })
        .unwrap_or_default();
    let home_path = std::path::PathBuf::from(&home);
    let appdata_path = std::env::var("APPDATA").ok().map(std::path::PathBuf::from);

    let mut candidate_configs = vec![
        home_path.join(".config").join("opencode").join("opencode.json"),
        home_path.join(".opencode").join("config.json"),
        home_path.join(".config").join("opencode3").join("opencode.json"),
        home_path.join(".config").join("opencode").join("config.json"),
        home_path.join(".opencode").join("opencode.json"),
        home_path.join("AppData").join("Roaming").join("opencode").join("config.json"),
        std::path::PathBuf::from("opencode.json"),
    ];
    if let Some(appdata) = &appdata_path {
        let p = appdata.join("opencode").join("config.json");
        if !candidate_configs.iter().any(|c| c == &p) {
            candidate_configs.insert(0, p);
        }
        let p2 = appdata.join("opencode").join("opencode.json");
        if !candidate_configs.iter().any(|c| c == &p2) {
            candidate_configs.insert(1, p2);
        }
    }

    let mut config_files = Vec::new();
    let mut config_path_found = String::new();
    let mut config_content = String::new();
    let mut config_json = serde_json::Value::Null;

    for p in &candidate_configs {
        if p.is_file() {
            if let Ok(c) = std::fs::read_to_string(p) {
                if config_path_found.is_empty() {
                    config_path_found = p.to_string_lossy().to_string();
                    config_content = c.clone();
                    config_json = serde_json::from_str(&c).unwrap_or(serde_json::Value::Null);
                }
                config_files.push(serde_json::json!({
                    "path": p.to_string_lossy().to_string(),
                    "name": format!("{} ({})", p.file_name().unwrap_or_default().to_string_lossy(), p.parent().and_then(|pr| pr.file_name()).unwrap_or_default().to_string_lossy()),
                    "content": c,
                }));
            }
        }
    }

    if config_path_found.is_empty() {
        let def_p = &candidate_configs[0];
        config_path_found = def_p.to_string_lossy().to_string();
        config_content = "{\n  \"$schema\": \"https://opencode.ai/schema.json\",\n  \"providers\": {}\n}".to_string();
        config_json = serde_json::from_str(&config_content).unwrap_or(serde_json::Value::Null);
        config_files.push(serde_json::json!({
            "path": config_path_found.clone(),
            "name": "opencode.json (nuevo)",
            "content": config_content.clone(),
        }));
    }

    let candidate_instructions = vec![
        std::path::PathBuf::from("AGENTS.md"),
        home_path.join(".config").join("opencode").join("AGENTS.md"),
        home_path.join(".opencode").join("AGENTS.md"),
    ];
    let mut instructions_files = Vec::new();
    for p in &candidate_instructions {
        if p.is_file() {
            if let Ok(c) = std::fs::read_to_string(p) {
                instructions_files.push(serde_json::json!({
                    "path": p.to_string_lossy().to_string(),
                    "name": p.file_name().unwrap_or_default().to_string_lossy().to_string(),
                    "content": c,
                }));
            }
        }
    }

    let mut candidate_skill_roots = vec![
        home_path.join(".agents").join("skills"),
        home_path.join(".claude").join("skills"),
        home_path.join(".opencode").join("skills"),
        home_path.join(".gemini").join("config").join("skills"),
        home_path.join(".gemini").join("antigravity").join("builtin").join("skills"),
        home_path.join(".config").join("skills"),
        std::path::PathBuf::from("skills"),
    ];
    if let Some(appdata) = &appdata_path {
        candidate_skill_roots.push(appdata.join("opencode").join("skills"));
    }

    let mut skills = Vec::new();
    let mut scanned_roots: Vec<String> = Vec::new();

    for root in candidate_skill_roots {
        let root_str = root.to_string_lossy().to_string();
        if !scanned_roots.contains(&root_str) {
            scanned_roots.push(root_str.clone());
        }
        if root.is_dir() {
            if let Ok(entries) = std::fs::read_dir(&root) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_dir() {
                        let skill_name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                        let skill_md_path = path.join("SKILL.md");
                        let mut description = String::new();
                        if skill_md_path.is_file() {
                            if let Ok(content) = std::fs::read_to_string(&skill_md_path) {
                                let lines: Vec<&str> = content.lines().collect();
                                let mut in_frontmatter = false;
                                for line in lines.iter().take(40) {
                                    let trimmed = line.trim();
                                    if trimmed == "---" {
                                        in_frontmatter = !in_frontmatter;
                                        continue;
                                    }
                                    if in_frontmatter {
                                        if let Some(desc) = trimmed.strip_prefix("description:") {
                                            description = desc.trim().trim_matches('"').trim_matches('\'').to_string();
                                        }
                                    } else if description.is_empty() && trimmed.starts_with("# ") {
                                        description = trimmed.strip_prefix("# ").unwrap_or("").trim().to_string();
                                    }
                                }
                            }
                        }
                        skills.push(serde_json::json!({
                            "name": skill_name,
                            "description": if description.is_empty() { format!("Skill {}", skill_name) } else { description },
                            "path": path.to_string_lossy().to_string(),
                            "skillFile": skill_md_path.to_string_lossy().to_string(),
                            "source": root.file_name().unwrap_or_default().to_string_lossy().to_string(),
                        }));
                    }
                }
            }
        }
    }

    json_ok(&serde_json::json!({
        "configPath": config_path_found,
        "configContent": config_content,
        "configJson": config_json,
        "configFiles": config_files,
        "instructionsFiles": instructions_files,
        "skills": skills,
        "scannedRoots": scanned_roots,
    }))
}
