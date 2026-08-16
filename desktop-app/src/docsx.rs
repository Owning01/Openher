//! Documentación de opencode: browse + read (markdown) desde el checkout local.

use std::path::{Path, PathBuf};

use crate::state::AppState;

pub fn list(state: &AppState) -> serde_json::Value {
    let root = crate::state::docs_root(&state.config.read().unwrap());
    let mut files = Vec::new();
    walk(&root, &root, 0, &mut files);
    serde_json::json!({
        "root": crate::state::pstring(&root),
        "files": files,
    })
}

fn walk(root: &Path, dir: &Path, depth: usize, out: &mut Vec<serde_json::Value>) {
    if depth > 4 {
        return;
    }
    if let Ok(rd) = std::fs::read_dir(dir) {
        let mut entries: Vec<_> = rd.flatten().collect();
        entries.sort_by_key(|e| e.file_name());
        for e in entries {
            let path = e.path();
            let rel = path.strip_prefix(root).unwrap_or(&path).to_string_lossy().to_string();
            let is_dir = e.file_type().map(|t| t.is_dir()).unwrap_or(false);
            if is_dir {
                walk(root, &path, depth + 1, out);
            } else {
                let is_doc = matches!(
                    path.extension().and_then(|x| x.to_str()).unwrap_or("").to_ascii_lowercase().as_str(),
                    "md" | "mdx"
                );
                if is_doc {
                    out.push(serde_json::json!({
                        "name": e.file_name().to_string_lossy(),
                        "path": rel.replace('\\', "/"),
                        "size": e.metadata().map(|m| m.len()).unwrap_or(0),
                    }));
                }
            }
        }
    }
}

pub fn read(state: &AppState, rel: &str) -> Result<serde_json::Value, String> {
    let root = crate::state::docs_root(&state.config.read().unwrap());
    let mut path = root.join(rel);
    if !path.starts_with(&root) {
        return Err("ruta inválida".into());
    }
    if path.is_dir() {
        path = path.join("index.md");
    }
    if !path.is_file() {
        return Err("no existe".into());
    }
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    let text = String::from_utf8_lossy(&bytes).to_string();
    Ok(serde_json::json!({
        "path": rel.replace('\\', "/"),
        "content": text,
        "size": bytes.len(),
        "root": crate::state::pstring(&root),
    }))
}

pub fn open_official() -> serde_json::Value {
    serde_json::json!({ "url": "https://opencode.ai/docs" })
}