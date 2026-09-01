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
            let path = e.path();
            let is_dir = e.file_type().map(|t| t.is_dir()).unwrap_or(false);
            let meta = e.metadata().ok();
            let size = if is_dir { None } else { meta.as_ref().map(|m| m.len()) };
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
    use std::io::Read;
    let p = Path::new(path);
    if !p.is_file() {
        return Err("no es archivo".into());
    }
    let meta = std::fs::metadata(p).map_err(|e| e.to_string())?;
    let total_size = meta.len() as usize;
    // Leer solo los primeros `limit` bytes en vez del archivo completo.
    // Para archivos de 500MB esto evita 500MB de alloc en memoria.
    let read_limit = limit.min(total_size);
    let mut buf = vec![0u8; read_limit];
    let mut f = std::fs::File::open(p).map_err(|e| e.to_string())?;
    f.read_exact(&mut buf).map_err(|e| e.to_string())?;
    let truncated = total_size > limit;
    let text = String::from_utf8_lossy(&buf).to_string();
    Ok(serde_json::json!({
        "path": crate::state::pstring(p),
        "content": text,
        "truncated": truncated,
        "size": total_size,
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

/// Abre el Explorador de Windows mostrando el archivo seleccionado (o la
/// carpeta directamente). Best-effort: si explorer no arranca, no falla.
pub fn reveal_in_explorer(path: &str) -> serde_json::Value {
    let p = PathBuf::from(path);
    let is_dir = p.is_dir();
    let arg = crate::state::pstring(&p);
    // Para archivos: /select,<path> abre la carpeta con el archivo seleccionado.
    let select = if is_dir { String::new() } else { format!("/select,{}", arg) };
    let mut cmd = std::process::Command::new("explorer.exe");
    if !select.is_empty() {
        cmd.arg(&select);
    } else {
        cmd.arg(&arg);
    }
    let ok = cmd.spawn().is_ok();
    serde_json::json!({ "ok": ok, "path": arg, "is_dir": is_dir })
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
    app_state().paths.read().unwrap_or_else(|e| e.into_inner()).clone()
}

pub fn toggle_favorite(path: &str, add: bool) -> Result<(), String> {
    let fav = app_state();
    let mut list = fav.paths.write().unwrap_or_else(|e| e.into_inner());
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

pub fn delete_entry(path: &str) -> Result<(), String> {
    let p = Path::new(path);
    if !p.exists() {
        return Err("No existe".into());
    }
    if p.is_dir() {
        std::fs::remove_dir_all(p).map_err(|e| e.to_string())
    } else {
        std::fs::remove_file(p).map_err(|e| e.to_string())
    }
}

pub fn mkdir_entry(path: &str) -> Result<(), String> {
    let p = Path::new(path);
    std::fs::create_dir_all(p).map_err(|e| e.to_string())
}

pub fn copy_entry(src: &str, dest_dir: &str) -> Result<String, String> {
    let s = Path::new(src);
    if !s.exists() {
        return Err("Origen no existe".into());
    }
    let d_dir = Path::new(dest_dir);
    if !d_dir.is_dir() {
        return Err("Destino no es carpeta".into());
    }
    let filename = s.file_name().ok_or("Nombre de archivo inválido")?;
    let mut target = d_dir.join(filename);
    if target.exists() && target == s {
        let stem = s.file_stem().and_then(|st| st.to_str()).unwrap_or("file");
        let ext = s.extension().and_then(|e| e.to_str()).map(|e| format!(".{e}")).unwrap_or_default();
        target = d_dir.join(format!("{stem}-copia{ext}"));
    }
    if s.is_file() {
        std::fs::copy(s, &target).map_err(|e| e.to_string())?;
    } else if s.is_dir() {
        copy_dir_recursive(s, &target).map_err(|e| e.to_string())?;
    }
    Ok(crate::state::pstring(&target))
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_recursive(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            std::fs::copy(entry.path(), dst.join(entry.file_name()))?;
        }
    }
    Ok(())
}

/// Mueve src hacia dest_dir (mismo nombre). Rename atómico en el mismo volumen;
/// fallback copiar+borrar entre volúmenes. Rechaza mover una carpeta dentro de
/// sí misma o de un descendiente.
pub fn move_entry(src: &str, dest_dir: &str) -> Result<String, String> {
    let s = Path::new(src);
    if !s.exists() {
        return Err("Origen no existe".into());
    }
    let d_dir = Path::new(dest_dir);
    if !d_dir.is_dir() {
        return Err("Destino no es carpeta".into());
    }
    let filename = s.file_name().ok_or("Nombre de archivo inválido")?;

    let s_canon = s.canonicalize().map_err(|e| e.to_string())?;
    let d_canon = d_dir.canonicalize().map_err(|e| e.to_string())?;
    let t_full = d_canon.join(filename);
    if t_full == s_canon {
        return Err("El archivo ya está en esa carpeta".into());
    }
    if t_full.starts_with(&s_canon) {
        return Err("No se puede mover una carpeta dentro de sí misma".into());
    }

    let mut target = d_dir.join(filename);
    if target.exists() {
        // Colisión: mismo criterio que copy_entry, sufijo -copia.
        let stem = s.file_stem().and_then(|st| st.to_str()).unwrap_or("file");
        let ext = s.extension().and_then(|e| e.to_str()).map(|e| format!(".{e}")).unwrap_or_default();
        let mut candidate = d_dir.join(format!("{stem}-copia{ext}"));
        let mut n = 2;
        while candidate.exists() {
            candidate = d_dir.join(format!("{stem}-copia-{n}{ext}"));
            n += 1;
        }
        target = candidate;
    }

    match std::fs::rename(s, &target) {
        Ok(()) => {}
        Err(_) => {
            // Cross-volume: copiar al destino final (con sufijo si hubo colisión)
            // y recién borrar el origen cuando la copia salió bien.
            if s.is_file() {
                std::fs::copy(s, &target).map_err(|e| e.to_string())?;
            } else {
                copy_dir_recursive(s, &target).map_err(|e| e.to_string())?;
            }
            if s.is_dir() {
                std::fs::remove_dir_all(s).map_err(|e| e.to_string())?;
            } else {
                std::fs::remove_file(s).map_err(|e| e.to_string())?;
            }
        }
    }
    Ok(crate::state::pstring(&target))
}

pub fn rename_entry(old_path: &str, new_name: &str) -> Result<String, String> {
    let name = new_name.trim();
    if name.is_empty() {
        return Err("Nombre vacío".into());
    }
    if name.contains('/') || name.contains('\\') {
        return Err("El nombre no puede contener / o \\".into());
    }
    if name.contains(':') || name.contains('*') || name.contains('?') || name.contains('"') || name.contains('<') || name.contains('>') || name.contains('|') {
        return Err("Caracter inválido en el nombre".into());
    }
    let s = Path::new(old_path);
    if !s.exists() {
        return Err("Origen no existe".into());
    }
    let parent = s.parent().ok_or("Sin carpeta padre")?;
    let target = parent.join(name);
    if target.exists() {
        return Err("Ya existe un archivo o carpeta con ese nombre".into());
    }
    // Evitar renombrar a mismo nombre (case insensitive check en Windows)
    if s.file_name().and_then(|n| n.to_str()) == Some(name) {
        return Err("Mismo nombre".into());
    }
    std::fs::rename(s, &target).map_err(|e| e.to_string())?;
    Ok(crate::state::pstring(&target))
}

pub fn write_file(path: &str, data_base64: &str) -> Result<(), String> {
    let p = Path::new(path);
    if let Some(parent) = p.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let bytes = crate::state::base64_decode(data_base64).map_err(|e| e.to_string())?;
    std::fs::write(p, bytes).map_err(|e| e.to_string())
}

pub fn execute_file(path: &str) -> Result<serde_json::Value, String> {
    let p = Path::new(path);
    if !p.exists() || !p.is_file() {
        return Err("El archivo no existe".into());
    }
    let parent = p.parent().unwrap_or_else(|| Path::new("."));
    let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let mut cmd = match ext.as_str() {
            "bat" | "cmd" => {
                let mut c = Command::new("cmd.exe");
                c.args(["/c", "start", "OpenCode Script", "cmd.exe", "/k", path]);
                c
            }
            "vbs" => {
                let mut c = Command::new("wscript.exe");
                c.arg(path);
                c
            }
            "ps1" => {
                let mut c = Command::new("cmd.exe");
                c.args(["/c", "start", "OpenCode PowerShell", "powershell.exe", "-NoExit", "-ExecutionPolicy", "Bypass", "-File", path]);
                c
            }
            "exe" => {
                
                Command::new(path)
            }
            _ => {
                let mut c = Command::new("cmd.exe");
                c.args(["/c", "start", "OpenCode Script", "cmd.exe", "/k", path]);
                c
            }
        };
        cmd.current_dir(parent);
        cmd.spawn().map_err(|e| e.to_string())?;
        Ok(serde_json::json!({ "ok": true, "path": path }))
    }
    #[cfg(not(target_os = "windows"))]
    {
        use std::process::Command;
        let mut cmd = Command::new("sh");
        cmd.args(["-c", path]);
        cmd.current_dir(parent);
        cmd.spawn().map_err(|e| e.to_string())?;
        Ok(serde_json::json!({ "ok": true, "path": path }))
    }
}

pub fn pick_folder() -> Result<Option<String>, String> {
    let dialog = rfd::FileDialog::new()
        .set_title("Seleccionar carpeta para nueva sesión");
    let path = dialog.pick_folder();
    Ok(path.map(|p| p.to_string_lossy().to_string()))
}

/// Busca texto recursivamente en archivos dentro de `path`.
pub fn search_code(path: &str, query: &str, limit: usize) -> Result<serde_json::Value, String> {
    let p = Path::new(path);
    if !p.exists() || !p.is_dir() {
        return Err("directorio no válido".into());
    }
    let q = query.trim();
    if q.is_empty() {
        return Ok(serde_json::json!({
            "query": query,
            "matches": [],
            "total_matches": 0,
            "total_files": 0,
            "truncated": false,
        }));
    }

    let q_lower = q.to_lowercase();
    let mut matches = Vec::new();
    let mut matched_files_set = std::collections::HashSet::new();
    let mut truncated = false;
    let max_results = if limit == 0 { 100 } else { limit.min(500) };

    let mut stack = vec![p.to_path_buf()];
    let max_depth = 12;

    'outer: while let Some(dir) = stack.pop() {
        if let Ok(rel) = dir.strip_prefix(p) {
            if rel.components().count() > max_depth {
                continue;
            }
        }

        if let Ok(rd) = std::fs::read_dir(&dir) {
            for entry in rd.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if name.starts_with('.') || name == "node_modules" || name == "target" || name == "dist"
                    || name == "build" || name == ".next" || name == "target-local" || name == ".cargo-target"
                    || name == "vendor" || name == "__pycache__" || name == ".git" || name == "Pods" {
                    continue;
                }

                let entry_path = entry.path();
                if let Ok(ft) = entry.file_type() {
                    if ft.is_dir() {
                        stack.push(entry_path);
                    } else if ft.is_file() {
                        if let Ok(meta) = entry.metadata() {
                            if meta.len() > 2 * 1024 * 1024 {
                                continue;
                            }
                        }

                        let ext = entry_path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
                        if matches!(ext.as_str(), "exe" | "dll" | "so" | "dylib" | "bin" | "png" | "jpg" | "jpeg" | "gif" | "webp" | "ico" | "pdf" | "zip" | "tar" | "gz" | "7z" | "woff" | "woff2" | "ttf" | "eot" | "mp3" | "mp4" | "wav" | "ogg" | "apk" | "ipa" | "jar" | "class" | "lock" | "pyc") {
                            continue;
                        }

                        if let Ok(content) = std::fs::read_to_string(&entry_path) {
                            let p_str = crate::state::pstring(&entry_path);
                            for (line_idx, line) in content.lines().enumerate() {
                                if line.to_lowercase().contains(&q_lower) {
                                    matched_files_set.insert(p_str.clone());
                                    matches.push(serde_json::json!({
                                        "path": p_str.clone(),
                                        "file_name": name.clone(),
                                        "line_number": line_idx + 1,
                                        "line_content": line.chars().take(300).collect::<String>(),
                                    }));

                                    if matches.len() >= max_results {
                                        truncated = true;
                                        break 'outer;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(serde_json::json!({
        "query": query,
        "matches": matches,
        "total_matches": matches.len(),
        "total_files": matched_files_set.len(),
        "truncated": truncated,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tmpdir(tag: &str) -> std::path::PathBuf {
        let d = std::env::temp_dir().join(format!("fsx_move_test_{tag}_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        d
    }

    #[test]
    fn moves_file_into_folder() {
        let root = tmpdir("file");
        let src = root.join("a.txt");
        let dest = root.join("sub");
        std::fs::create_dir_all(&dest).unwrap();
        std::fs::write(&src, b"hola").unwrap();
        let out = move_entry(src.to_str().unwrap(), dest.to_str().unwrap()).unwrap();
        assert!(!src.exists());
        assert!(dest.join("a.txt").exists());
        assert!(out.contains("a.txt"));
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn search_code_finds_matches() {
        let root = tmpdir("search");
        let src = root.join("hello.rs");
        std::fs::write(&src, b"fn main() {\n    println!(\"search_target_token\");\n}\n").unwrap();
        let res = search_code(root.to_str().unwrap(), "search_target_token", 10).unwrap();
        assert_eq!(res["total_matches"], 1);
        assert_eq!(res["matches"][0]["line_number"], 2);
        assert!(res["matches"][0]["line_content"].as_str().unwrap().contains("search_target_token"));
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn rejects_folder_into_itself_and_descendant() {
        let root = tmpdir("self");
        let parent = root.join("p");
        let child = parent.join("c");
        std::fs::create_dir_all(&child).unwrap();
        // dentro de sí misma (mismo lugar)
        assert!(move_entry(parent.to_str().unwrap(), &parent.to_string_lossy()).is_err());
        // descendiente
        assert!(move_entry(parent.to_str().unwrap(), child.to_str().unwrap()).is_err());
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn collision_gets_suffix_instead_of_overwrite() {
        let root = tmpdir("coll");
        let src = root.join("x.txt");
        let dest = root.join("d");
        std::fs::create_dir_all(&dest).unwrap();
        std::fs::write(&src, b"nuevo").unwrap();
        std::fs::write(dest.join("x.txt"), b"viejo").unwrap();
        move_entry(src.to_str().unwrap(), dest.to_str().unwrap()).unwrap();
        assert_eq!(std::fs::read_to_string(dest.join("x.txt")).unwrap(), "viejo");
        assert_eq!(std::fs::read_to_string(dest.join("x-copia.txt")).unwrap(), "nuevo");
        let _ = std::fs::remove_dir_all(&root);
    }
}
