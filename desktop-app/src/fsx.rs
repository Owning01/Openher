//! API de archivos: unidades, browse, lectura (preview) y favoritos.
//! El explorador IDE-like lo dibuja el frontend; acá está el backend.

use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock};

pub struct FavoritesStore {
    pub paths: RwLock<Vec<String>>,
}

impl FavoritesStore {
    fn file() -> std::path::PathBuf {
        crate::state::data_dir().join("favorites.json")
    }
    pub fn load() -> Self {
        let paths = std::fs::read_to_string(Self::file())
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default();
        Self {
            paths: RwLock::new(paths),
        }
    }
    fn save(&self) {
        let _ = std::fs::create_dir_all(crate::state::data_dir());
        if let Ok(p) = self.paths.read() {
            let _ = std::fs::write(Self::file(), serde_json::to_string(&*p).unwrap_or_default());
        }
    }
}

pub fn drives() -> Vec<String> {
    let mut out = Vec::new();
    for letter in b'A'..=b'Z' {
        let root = format!("{}:\\", letter as char);
        if Path::new(&root).exists() {
            out.push(root);
        }
    }
    out
}

pub fn list_dir(path: &str) -> Result<serde_json::Value, String> {
    let p = Path::new(path);
    if !p.exists() {
        return Err("no existe".into());
    }
    if !p.is_dir() {
        return Err("no es directorio".into());
    }
    let mut dirs = Vec::new();
    let mut files = Vec::new();
    if let Ok(rd) = std::fs::read_dir(p) {
        for e in rd.flatten() {
            let name = e.file_name().to_string_lossy().to_string();
            if name.starts_with(".") {
                continue;
            }
            let path = e.path();
            let is_dir = e.file_type().map(|t| t.is_dir()).unwrap_or(false);
            let meta = e.metadata().ok();
            let size = if is_dir { None } else { meta.as_ref().and_then(|m| Some(m.len())) };
            let modified = meta
                .as_ref()
                .and_then(|m| m.modified().ok())
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs());
            let entry = serde_json::json!({
                "name": name,
                "path": crate::state::pstring(&path),
                "is_dir": is_dir,
                "size": size,
                "modified": modified,
            });
            if is_dir {
                dirs.push(entry);
            } else {
                files.push(entry);
            }
        }
    }
    dirs.sort_by(|a, b| a["name"].as_str().unwrap_or("").cmp(b["name"].as_str().unwrap_or("")));
    files.sort_by(|a, b| a["name"].as_str().unwrap_or("").cmp(b["name"].as_str().unwrap_or("")));
    Ok(serde_json::json!({ "path": crate::state::pstring(p), "dirs": dirs, "files": files }))
}

pub fn read_file(path: &str, limit: usize) -> Result<serde_json::Value, String> {
    let p = Path::new(path);
    if !p.is_file() {
        return Err("no es archivo".into());
    }
    let bytes = std::fs::read(p).map_err(|e| e.to_string())?;
    let truncated = bytes.len() > limit;
    let head = &bytes[..bytes.len().min(limit)];
    let text = String::from_utf8_lossy(head).to_string();
    Ok(serde_json::json!({
        "path": crate::state::pstring(p),
        "content": text,
        "truncated": truncated,
        "size": bytes.len(),
        "ext": p.extension().and_then(|e| e.to_str()).unwrap_or(""),
    }))
}

pub fn resolve(path: &str) -> serde_json::Value {
    let p = PathBuf::from(path);
    serde_json::json!({
        "exists": p.exists(),
        "is_dir": p.is_dir(),
        "path": crate::state::pstring(&p),
    })
}

/// Abre una sesión opencode en el directorio: el frontend usa este path para
/// crear la sesión (el server opencode lo toma como directory).
pub fn session_for_dir(path: &str) -> serde_json::Value {
    let p = PathBuf::from(path);
    if p.is_dir() {
        serde_json::json!({ "ok": true, "directory": crate::state::pstring(&p) })
    } else {
        serde_json::json!({ "ok": false, "error": "no es directorio" })
    }
}

pub fn app_state() -> Arc<FavoritesStore> {
    static FAV: std::sync::OnceLock<Arc<FavoritesStore>> = std::sync::OnceLock::new();
    FAV.get_or_init(|| Arc::new(FavoritesStore::load())).clone()
}

pub fn favorites() -> Vec<String> {
    app_state().paths.read().unwrap().clone()
}

pub fn toggle_favorite(path: &str, add: bool) -> Result<(), String> {
    let fav = app_state();
    let mut list = fav.paths.write().unwrap();
    if add {
        if !list.contains(&path.to_string()) {
            list.push(path.to_string());
        }
    } else {
        list.retain(|p| p != path);
    }
    fav.save();
    Ok(())
}