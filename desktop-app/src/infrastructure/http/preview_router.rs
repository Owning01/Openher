//! Router /shell/preview/* + /shell/project/serve — delegado desde api.rs.

use std::sync::Arc;

use crate::infrastructure::http::io::{ShellRequest, ShellResponse};

use crate::state::AppState;

#[allow(clippy::too_many_lines)]
pub fn handle(
    req: &ShellRequest,
    state: Arc<AppState>,
    path: &str,
    method: &str,
    _q: &dyn Fn(&str) -> String,
) -> Option<ShellResponse> {
    // /shell/project/serve POST — genera token y previewUrl
    if path == "/shell/project/serve" {
        if method != "POST" {
            return Some(ShellResponse::err_json(405, "method not allowed"));
        }
        return Some(match req.json_body() {
            Ok(b) => {
                let p_str = b["path"].as_str().unwrap_or("");
                let p = std::path::PathBuf::from(p_str);
                let dir = if p.is_file() {
                    p.parent().unwrap_or(std::path::Path::new(".")).to_path_buf()
                } else {
                    p.clone()
                };

                if !dir.exists() || !dir.is_dir() {
                    ShellResponse::err_json(400, "El directorio no existe")
                } else {
                    let token = format!(
                        "p{:x}",
                        dir.to_string_lossy()
                            .as_bytes()
                            .iter()
                            .fold(0u64, |acc: u64, &b| acc.wrapping_mul(31).wrapping_add(b as u64))
                    );
                    state
                        .projects
                        .write()
                        .unwrap_or_else(|e| e.into_inner())
                        .insert(token.clone(), dir.clone());
                    crate::fswatch::global().watch_dir(&dir);

                    let mut html_files = Vec::new();
                    let mut entrypoint = String::new();
                    if let Ok(entries) = std::fs::read_dir(&dir) {
                        for entry in entries.flatten() {
                            let name = entry.file_name().to_string_lossy().to_string();
                            if name.ends_with(".html") || name.ends_with(".htm") {
                                html_files.push(name.clone());
                                if name == "index.html" || name == "index.htm" {
                                    entrypoint = name.clone();
                                }
                            }
                        }
                    }

                    if entrypoint.is_empty() {
                        for sub in &["dist", "build", "public", "src"] {
                            let sub_path = dir.join(sub);
                            if sub_path.is_dir() {
                                if let Ok(entries) = std::fs::read_dir(&sub_path) {
                                    for entry in entries.flatten() {
                                        let name = entry.file_name().to_string_lossy().to_string();
                                        if name.ends_with(".html") || name.ends_with(".htm") {
                                            let rel = format!("{}/{}", sub, name);
                                            html_files.push(rel.clone());
                                            if entrypoint.is_empty() {
                                                entrypoint = rel;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if entrypoint.is_empty() && !html_files.is_empty() {
                        entrypoint = html_files[0].clone();
                    }

                    if p.is_file() {
                        let file_name = p.file_name().unwrap_or_default().to_string_lossy().to_string();
                        if file_name.ends_with(".html") || file_name.ends_with(".htm") {
                            entrypoint = file_name;
                        }
                    }

                    let pkg_path = dir.join("package.json");
                    let mut has_package_json = false;
                    let mut scripts = serde_json::Map::new();
                    if pkg_path.is_file() {
                        if let Ok(content) = std::fs::read_to_string(&pkg_path) {
                            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                                has_package_json = true;
                                if let Some(sc) = json.get("scripts").and_then(|s| s.as_object()) {
                                    scripts = sc.clone();
                                }
                            }
                        }
                    }

                    let preview_url = if !entrypoint.is_empty() {
                        format!("http://127.0.0.1:{}/shell/preview/{}/{}", state.port, token, entrypoint)
                    } else {
                        format!("http://127.0.0.1:{}/shell/preview/{}/index.html", state.port, token)
                    };

                    ShellResponse::ok_json(&serde_json::json!({
                        "ok": true,
                        "token": token,
                        "previewUrl": preview_url,
                        "directory": dir.to_string_lossy(),
                        "entrypoint": entrypoint,
                        "htmlFiles": html_files,
                        "hasPackageJson": has_package_json,
                        "scripts": scripts,
                    }))
                }
            }
            Err(e) => ShellResponse::err_json(400, &e.to_string()),
        });
    }

    // /shell/preview/* — sirve archivos mmap con <base href> inyectado para html
    let rest = path.strip_prefix("/shell/preview/")?;
    let (token, rel) = rest.split_once('/').unwrap_or((rest, "index.html"));
    let rel = if rel.is_empty() { "index.html" } else { rel };
    let root = state.projects.read().unwrap_or_else(|e| e.into_inner()).get(token).cloned();
    if let Some(root_path) = root {
        let served = crate::common::serve_file_mmap(&root_path, rel)
            .or_else(|| crate::common::serve_file_mmap(&root_path.join("dist"), rel))
            .or_else(|| crate::common::serve_file_mmap(&root_path.join("public"), rel))
            .or_else(|| crate::common::serve_file_mmap(&root_path.join("build"), rel))
            .or_else(|| crate::common::serve_file_mmap(&root_path.join("web").join("dist"), rel))
            .or_else(|| crate::common::serve_file_mmap(&root_path.join("web"), rel));

        if let Some((mut bytes, mime)) = served {
            if mime.starts_with("text/html") {
                if let Ok(html_str) = String::from_utf8(bytes.clone()) {
                    let base_tag = format!("<base href=\"/shell/preview/{}/\" />", token);
                    let modified = if html_str.contains("<head>") {
                        html_str.replacen("<head>", &format!("<head>\n  {}", base_tag), 1)
                    } else if html_str.contains("<HEAD>") {
                        html_str.replacen("<HEAD>", &format!("<HEAD>\n  {}", base_tag), 1)
                    } else {
                        format!("{}\n{}", base_tag, html_str)
                    };
                    bytes = modified.into_bytes();
                }
            }
            return Some(
                ShellResponse::data(200, bytes, &mime)
                    .with_header("Access-Control-Allow-Origin", "*")
                    .with_header("Cache-Control", "no-cache"),
            );
        }
    }
    Some(ShellResponse::err_json(404, "Archivo de proyecto no encontrado"))
}
