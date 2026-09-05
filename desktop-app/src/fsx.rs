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
            let path = Self::file();
            let tmp = path.with_extension("json.tmp");
            let data = serde_json::to_string(&*p).unwrap_or_default();
            if std::fs::write(&tmp, &data).is_ok() {
                let _ = std::fs::rename(&tmp, &path);
            } else {
                let _ = std::fs::write(&path, &data);
            }
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
    let t = path.trim();
    if t.is_empty() {
        return serde_json::json!({ "ok": false, "error": "ruta vacía" });
    }
    let p = PathBuf::from(t);
    if !p.exists() {
        // Antes se lanzaba `explorer /select,<inexistente>` igual y Windows
        // abría cualquier lado (Quick Access) en silencio: parecía que el
        // botón "no llevaba a ningún lado". Ahora ok:false y el front avisa.
        return serde_json::json!({ "ok": false, "error": "no existe", "path": t });
    }
    let is_dir = p.is_dir();
    let mut arg = crate::state::pstring(&p);
    // Sin backslash final: `explorer.exe "G:\"` rompe el quoteo C-runtime
    // (\" = comilla escapada) y abre cualquier lado. "G:" abre el drive.
    while arg.len() > 2 && (arg.ends_with('/') || arg.ends_with('\\')) {
        arg.pop();
    }
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

/// Mueve a la Papelera de reciclaje (recuperable), a diferencia de
/// delete_entry que borra definitivo. En Windows usa SHFileOperation con
/// FOF_ALLOWUNDO (sin dependencias nuevas: windows-sys ya está).
pub fn trash_entry(path: &str) -> Result<(), String> {
    let p = Path::new(path);
    if !p.exists() {
        return Err("No existe".into());
    }
    #[cfg(windows)]
    {
        trash_win(p)
    }
    #[cfg(not(windows))]
    {
        let _ = p;
        Err("Papelera no soportada en esta plataforma".into())
    }
}

#[cfg(windows)]
fn trash_win(p: &Path) -> Result<(), String> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::UI::Shell::{
        SHFileOperationW, SHFILEOPSTRUCTW, FOF_ALLOWUNDO, FOF_NOERRORUI, FOF_NOCONFIRMATION,
        FOF_SILENT, FO_DELETE,
    };
    // pFrom exige UTF-16 con doble nulo final.
    let mut wide: Vec<u16> = p.as_os_str().encode_wide().collect();
    wide.push(0);
    wide.push(0);
    let mut op = SHFILEOPSTRUCTW {
        hwnd: std::ptr::null_mut(),
        wFunc: FO_DELETE,
        pFrom: wide.as_ptr(),
        pTo: std::ptr::null(),
        fFlags: (FOF_ALLOWUNDO | FOF_NOCONFIRMATION | FOF_NOERRORUI | FOF_SILENT) as u16,
        fAnyOperationsAborted: 0,
        hNameMappings: std::ptr::null_mut(),
        lpszProgressTitle: std::ptr::null(),
    };
    let rc = unsafe { SHFileOperationW(&mut op) };
    if rc != 0 {
        return Err(format!("Papelera falló (código {rc})"));
    }
    if op.fAnyOperationsAborted != 0 {
        return Err("Operación cancelada".into());
    }
    Ok(())
}

/// Crea un .zip en dest_dir con los paths dados (archivos y/o carpetas,
/// recursivo, sin seguir enlaces). Devuelve el path del zip. Colisión de
/// nombre: sufijo -copia como copy/move.
pub fn zip_create(paths: &[String], dest_dir: &str, name: &str) -> Result<String, String> {
    if paths.is_empty() {
        return Err("Nada que comprimir".into());
    }
    let d = Path::new(dest_dir);
    if !d.is_dir() {
        return Err("Destino no es carpeta".into());
    }
    let mut clean = name.trim().replace(['/', '\\'], "");
    if clean.is_empty() {
        return Err("Nombre vacío".into());
    }
    if !clean.to_lowercase().ends_with(".zip") {
        clean.push_str(".zip");
    }
    let mut target = d.join(&clean);
    if target.exists() {
        let stem = clean.trim_end_matches(".zip").trim_end_matches(".ZIP");
        let mut candidate = d.join(format!("{stem}-copia.zip"));
        let mut n = 2;
        while candidate.exists() {
            candidate = d.join(format!("{stem}-copia-{n}.zip"));
            n += 1;
        }
        target = candidate;
    }
    let file = std::fs::File::create(&target).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);
    let options =
        zip::write::SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
    let mut added = 0usize;
    for p in paths {
        let src = Path::new(p);
        if !src.exists() {
            continue;
        }
        let root = src
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("item")
            .to_string();
        add_to_zip(&mut zip, src, &root, options)?;
        added += 1;
    }
    if added == 0 {
        drop(zip);
        let _ = std::fs::remove_file(&target);
        return Err("Ningún origen existe".into());
    }
    zip.finish().map_err(|e| e.to_string())?;
    Ok(crate::state::pstring(&target))
}

fn add_to_zip<W: std::io::Write + std::io::Seek>(
    zip: &mut zip::ZipWriter<W>,
    src: &Path,
    entry: &str,
    options: zip::write::SimpleFileOptions,
) -> Result<(), String> {
    // Sin seguir enlaces simbólicos (evita ciclos y fugas fuera del árbol).
    if std::fs::symlink_metadata(src)
        .map(|m| m.file_type().is_symlink())
        .unwrap_or(false)
    {
        return Ok(());
    }
    if src.is_dir() {
        zip.add_directory(entry, options).map_err(|e| e.to_string())?;
        let mut children: Vec<_> = std::fs::read_dir(src)
            .map_err(|e| e.to_string())?
            .flatten()
            .collect();
        children.sort_by_key(|e| e.file_name());
        for child in children {
            let name = child.file_name().to_string_lossy().to_string();
            add_to_zip(zip, &child.path(), &format!("{entry}/{name}"), options)?;
        }
    } else if src.is_file() {
        zip.start_file(entry, options).map_err(|e| e.to_string())?;
        let mut f = std::fs::File::open(src).map_err(|e| e.to_string())?;
        std::io::copy(&mut f, zip).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Extrae un .zip en una carpeta hermana `<nombre>/` (sufijo -copia si
/// colisiona). Ignora entradas con traversal (..) vía enclosed_name.
/// Devuelve el path de la carpeta creada.
pub fn zip_extract(zip_path: &str) -> Result<String, String> {
    let zp = Path::new(zip_path);
    if !zp.is_file() {
        return Err("No es archivo".into());
    }
    let parent = zp.parent().ok_or("Sin carpeta padre")?;
    let stem = zp
        .file_stem()
        .and_then(|s| s.to_str())
        .filter(|s| !s.is_empty())
        .ok_or("Nombre inválido")?;
    let mut dest = parent.join(stem);
    if dest.exists() {
        let mut candidate = parent.join(format!("{stem}-copia"));
        let mut n = 2;
        while candidate.exists() {
            candidate = parent.join(format!("{stem}-copia-{n}"));
            n += 1;
        }
        dest = candidate;
    }
    std::fs::create_dir_all(&dest).map_err(|e| e.to_string())?;
    let file = std::fs::File::open(zp).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
    for i in 0..archive.len() {
        let mut f = archive.by_index(i).map_err(|e| e.to_string())?;
        let out = match f.enclosed_name() {
            Some(p) => dest.join(p),
            None => continue,
        };
        if f.is_dir() {
            std::fs::create_dir_all(&out).map_err(|e| e.to_string())?;
        } else {
            if let Some(par) = out.parent() {
                if !par.exists() {
                    std::fs::create_dir_all(par).map_err(|e| e.to_string())?;
                }
            }
            let mut outf = std::fs::File::create(&out).map_err(|e| e.to_string())?;
            std::io::copy(&mut f, &mut outf).map_err(|e| e.to_string())?;
        }
    }
    Ok(crate::state::pstring(&dest))
}

/// Abre una terminal del SO en la carpeta (Windows: PowerShell). Si path es
/// archivo usa su carpeta padre. Best-effort como reveal_in_explorer.
pub fn open_terminal(path: &str) -> Result<(), String> {
    let p = Path::new(path.trim());
    let dir: &Path = if p.is_dir() {
        p
    } else if let Some(par) = p.parent().filter(|par| par.is_dir()) {
        par
    } else {
        return Err("No es carpeta".into());
    };
    #[cfg(windows)]
    {
        let loc = format!(
            "Set-Location -LiteralPath '{}'",
            dir.to_string_lossy().replace('\'', "''")
        );
        std::process::Command::new("powershell.exe")
            .args(["-NoExit", "-Command", &loc])
            .current_dir(dir)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = dir;
        Err("Terminal no soportada en esta plataforma".into())
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
    // Limitar payload: 16 MB base64 ≈ 12 MB binario — evita OOM/disco lleno
    if data_base64.len() > 16 * 1024 * 1024 {
        return Err("payload demasiado grande (>16MB base64)".into());
    }
    let bytes = crate::state::base64_decode(data_base64).map_err(|e| e.to_string())?;
    if bytes.len() > 12 * 1024 * 1024 {
        return Err("archivo demasiado grande (>12MB)".into());
    }
    let p = Path::new(path);
    // Validar que el path no escape a raíces peligrosas sin canonicalize previo
    // (canonicalize falla si el archivo no existe, así que validamos el parent)
    if let Some(parent) = p.parent() {
        if !parent.as_os_str().is_empty() {
            // Rechazar paths con .. que intenten salir del workspace si el caller espera jaula
            // Permitir paths absolutos normales de Windows (C:\) pero no UNC sin validar
            let raw = path.replace('\\', "/");
            if raw.contains("..") {
                // Verificar que el path canonicalizado quede dentro de un directorio permitido
                // Si el parent existe, canonicalizar; si no, validar que no haya traversal obvio
                if parent.exists() {
                    if let Ok(canon) = parent.canonicalize() {
                        let canon_str = canon.to_string_lossy().to_lowercase();
                        // Bloquear escritura en directorios sensibles del sistema
                        if canon_str.starts_with("c:\\windows") || canon_str.starts_with("c:/windows") {
                            return Err("escritura en directorio del sistema no permitida".into());
                        }
                    }
                }
            }
        }
        let _ = std::fs::create_dir_all(parent);
    }
    // Escritura atómica vía tmp+rename para no corromper en corte de energía
    let p_tmp = p.with_extension("tmp_write");
    if p.parent().is_some() && p_tmp.parent().is_some() {
        if std::fs::write(&p_tmp, &bytes).is_ok() {
            if std::fs::rename(&p_tmp, p).is_ok() {
                return Ok(());
            }
            let _ = std::fs::remove_file(&p_tmp);
        }
    }
    std::fs::write(p, bytes).map_err(|e| e.to_string())
}

pub fn execute_file(path: &str) -> Result<serde_json::Value, String> {
    let p = Path::new(path);
    if !p.exists() || !p.is_file() {
        return Err("El archivo no existe".into());
    }
    // Allowlist: solo extensiones ejecutables conocidas; rechazar scripts arbitrarios sin confirmación
    let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    const ALLOWED: &[&str] = &["bat", "cmd", "ps1", "vbs", "exe"];
    if !ALLOWED.contains(&ext.as_str()) {
        return Err(format!("extensión .{ext} no ejecutable — permitidas: bat/cmd/ps1/vbs/exe"));
    }
    let parent = p.parent().unwrap_or_else(|| Path::new("."));

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

/// Abre un archivo con su programa predeterminado (asociación del SO).
/// Best-effort: valida existencia; el spawn desacoplado no bloquea el server.
pub fn open_default(path: &str) -> Result<serde_json::Value, String> {
    let p = Path::new(path);
    if !p.exists() {
        return Err("El archivo no existe".into());
    }
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        // `start "" <path>` usa la asociación registrada (verb open).
        // CREATE_NO_WINDOW evita flashear una consola.
        let mut cmd = std::process::Command::new("cmd.exe");
        cmd.args(["/c", "start", "", path]);
        cmd.creation_flags(0x08000000);
        if let Some(parent) = p.parent() {
            cmd.current_dir(parent);
        }
        cmd.spawn().map_err(|e| e.to_string())?;
        Ok(serde_json::json!({ "ok": true, "path": path }))
    }
    #[cfg(not(target_os = "windows"))]
    {
        let mut cmd = std::process::Command::new("xdg-open");
        cmd.arg(path);
        if let Some(parent) = p.parent() {
            cmd.current_dir(parent);
        }
        cmd.spawn().map_err(|e| e.to_string())?;
        Ok(serde_json::json!({ "ok": true, "path": path }))
    }
}

/// Abre un archivo con un programa explícito (`app` es la ruta del ejecutable).
/// Solo Windows valida extensión del programa; el archivo puede ser cualquiera.
pub fn open_with(path: &str, app: &str) -> Result<serde_json::Value, String> {
    let p = Path::new(path);
    if !p.exists() {
        return Err("El archivo no existe".into());
    }
    let a = Path::new(app);
    if !a.exists() || !a.is_file() {
        return Err("El programa no existe".into());
    }
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        let ext = a.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
        const ALLOWED: &[&str] = &["exe", "bat", "cmd", "com", "ps1", "lnk"];
        if !ALLOWED.contains(&ext.as_str()) {
            return Err(format!("extensión .{ext} no válida como programa — usa un .exe/.bat/.cmd/.lnk"));
        }
        let mut cmd = std::process::Command::new(a);
        cmd.arg(path);
        cmd.creation_flags(0x08000000);
        if let Some(parent) = p.parent() {
            cmd.current_dir(parent);
        }
        cmd.spawn().map_err(|e| e.to_string())?;
        Ok(serde_json::json!({ "ok": true, "path": path, "app": app }))
    }
    #[cfg(not(target_os = "windows"))]
    {
        let mut cmd = std::process::Command::new(a);
        cmd.arg(path);
        if let Some(parent) = p.parent() {
            cmd.current_dir(parent);
        }
        cmd.spawn().map_err(|e| e.to_string())?;
        Ok(serde_json::json!({ "ok": true, "path": path, "app": app }))
    }
}

/// Diálogo nativo para elegir el programa (.exe) con el que abrir un archivo.
pub fn pick_app() -> Result<Option<String>, String> {
    let dialog = rfd::FileDialog::new()
        .set_title("Elegir programa para abrir el archivo")
        .add_filter("Programas", &["exe", "bat", "cmd", "lnk"]);
    let path = dialog.pick_file();
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

    #[test]
    fn zip_roundtrip_keeps_tree_and_content() {
        let root = tmpdir("zip");
        let sub = root.join("docs");
        std::fs::create_dir_all(&sub).unwrap();
        std::fs::write(root.join("a.txt"), b"hola zip").unwrap();
        std::fs::write(sub.join("b.txt"), b"anidado").unwrap();
        let paths = vec![
            root.join("a.txt").to_string_lossy().to_string(),
            sub.to_string_lossy().to_string(),
        ];
        let out = zip_create(&paths, root.to_str().unwrap(), "paquete.zip").unwrap();
        assert!(out.ends_with("paquete.zip"));
        assert!(Path::new(&out).is_file());
        let dest = zip_extract(&out).unwrap();
        assert_eq!(std::fs::read_to_string(Path::new(&dest).join("a.txt")).unwrap(), "hola zip");
        assert_eq!(
            std::fs::read_to_string(Path::new(&dest).join("docs").join("b.txt")).unwrap(),
            "anidado"
        );
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn zip_rejects_empty_and_bad_dest() {
        let root = tmpdir("zipbad");
        assert!(zip_create(&[], root.to_str().unwrap(), "x.zip").is_err());
        assert!(zip_create(
            &["C:\\no\\existe\\nada.txt".to_string()],
            root.to_str().unwrap(),
            "x.zip"
        )
        .is_err());
        assert!(zip_extract(root.join("no.zip").to_str().unwrap()).is_err());
        let _ = std::fs::remove_dir_all(&root);
    }
}
