//! Kanban local (data/kanban.json): boards, columnas y cards.

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, RwLock};

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct KanbanData {
    pub boards: Vec<Board>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Board {
    pub id: String,
    pub name: String,
    pub columns: Vec<Column>,
    pub cards: Vec<Card>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Column {
    pub id: String,
    pub title: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Card {
    pub id: String,
    pub board: String,
    pub column: String,
    pub title: String,
    pub notes: String,
    pub color: String,
}

pub struct KanbanStore {
    pub data: RwLock<KanbanData>,
    /// Serializa los save(): los handlers HTTP corren en hilos y dos saves
    /// concurrentes al mismo tmp + rename se pisaban (rename fallaba y la
    /// tarjeta solo quedaba en memoria: "desaparecía" al cerrar la app).
    save_lock: Mutex<()>,
}

static SAVE_SEQ: AtomicU64 = AtomicU64::new(0);

fn path() -> std::path::PathBuf {
    crate::state::kanban_path()
}

impl KanbanStore {
    pub fn load() -> Self {
        let p = path();
        let main: KanbanData = std::fs::read_to_string(&p)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default();
        let data = Self::recover_orphan_tmp(&p, main);
        Self {
            data: RwLock::new(data),
            save_lock: Mutex::new(()),
        }
    }

    /// Si un save() murió entre write(tmp) y rename (cuelgue, dos instancias,
    /// rename bloqueado en Windows), el tmp huérfano tiene datos más nuevos que
    /// el principal. Se adopta solo si es más nuevo, parsea y no pierde tableros
    /// ni tarjetas respecto al principal (un tmp a medio escribir no parsea).
    fn recover_orphan_tmp(p: &std::path::Path, main: KanbanData) -> KanbanData {
        let main_mtime = std::fs::metadata(p).and_then(|m| m.modified()).ok();
        let main_cards: usize = main.boards.iter().map(|b| b.cards.len()).sum();
        let dir = p.parent();
        let mut best: Option<(KanbanData, std::path::PathBuf)> = None;
        let mut stale: Vec<std::path::PathBuf> = Vec::new();
        if let Some(dir) = dir {
            let entries = std::fs::read_dir(dir).into_iter().flatten().flatten();
            for e in entries {
                let tp = e.path();
                let name = tp.file_name().and_then(|n| n.to_str()).unwrap_or("");
                let is_tmp = name.ends_with(".tmp")
                    && (name.starts_with("kanban.") || name == "kanban.json.tmp");
                if !is_tmp {
                    continue;
                }
                let tmp_mtime = e.metadata().and_then(|m| m.modified()).ok();
                let newer = match (tmp_mtime, main_mtime) {
                    (Some(t), Some(m)) => t > m,
                    (Some(_), None) => true,
                    _ => false,
                };
                let parsed: Option<KanbanData> = std::fs::read_to_string(&tp)
                    .ok()
                    .and_then(|s| serde_json::from_str(&s).ok());
                match parsed {
                    Some(d) if newer => {
                        let cards: usize = d.boards.iter().map(|b| b.cards.len()).sum();
                        if d.boards.len() >= main.boards.len() && cards >= main_cards {
                            best = Some((d, tp));
                        } else {
                            stale.push(tp);
                        }
                    }
                    _ => {
                        if !newer {
                            stale.push(tp);
                        }
                    }
                }
            }
        }
        for s in stale {
            let _ = std::fs::remove_file(s);
        }
        match best {
            Some((d, tp)) => {
                // Adoptar = escribirlo como principal ya; si falla, igual se usa
                // en memoria y el próximo save() lo persistirá.
                let adopted = d.clone();
                if serde_json::to_string_pretty(&d)
                    .ok()
                    .map(|s| std::fs::write(p, s).is_ok())
                    .unwrap_or(false)
                {
                    let _ = std::fs::remove_file(tp);
                }
                eprintln!("[kanban] recuperado tmp huérfano con datos más nuevos");
                adopted
            }
            None => main,
        }
    }

    fn save(&self) {
        let _guard = self.save_lock.lock().unwrap_or_else(|e| e.into_inner());
        if let Err(e) = std::fs::create_dir_all(crate::state::data_dir()) {
            eprintln!("[kanban] no se pudo crear data_dir: {e}");
            return;
        }
        let data = match self.data.read() {
            Ok(d) => serde_json::to_string_pretty(&*d).unwrap_or_default(),
            Err(_) => return,
        };
        let p = path();
        // Tmp único por save (pid + secuencia): dos hilos/procesos ya no chocan.
        let seq = SAVE_SEQ.fetch_add(1, Ordering::Relaxed);
        let tmp = p.with_extension(format!("json.{}.tmp", format!("{}-{}", std::process::id(), seq)));
        // Legado: antes el tmp era fijo (kanban.json.tmp) y colisionaba.
        let legacy_tmp = p.with_extension("json.tmp");
        if std::fs::write(&tmp, &data).is_err() {
            eprintln!("[kanban] no se pudo escribir tmp {} — intento directo", tmp.display());
            if let Err(e) = std::fs::write(&p, &data) {
                eprintln!("[kanban] no se pudo persistir {}: {e}", p.display());
            }
            return;
        }
        // Rename con reintentos: en Windows falla si el destino está bloqueado
        // (otra instancia, antivirus, watcher). Antes el Err solo se logueaba y
        // el dato quedaba solo en memoria → se perdía al cerrar.
        let mut renamed = false;
        for _ in 0..5 {
            if std::fs::rename(&tmp, &p).is_ok() {
                renamed = true;
                break;
            }
            std::thread::sleep(std::time::Duration::from_millis(50));
        }
        if !renamed {
            // Último recurso: borrar destino y renombrar, o escritura directa.
            let _ = std::fs::remove_file(&p);
            if std::fs::rename(&tmp, &p).is_err() {
                eprintln!("[kanban] rename falló tras reintentos — escritura directa de {}", p.display());
                if let Err(e) = std::fs::write(&p, &data) {
                    eprintln!("[kanban] no se pudo persistir {}: {e}", p.display());
                } else {
                    let _ = std::fs::remove_file(&tmp);
                }
            }
        }
        let _ = std::fs::remove_file(&legacy_tmp);
    }

    pub fn all(&self) -> serde_json::Value {
        serde_json::to_value(&*self.data.read().unwrap_or_else(|e| e.into_inner())).unwrap_or(serde_json::json!({}))
    }

    pub fn add_board(&self, name: &str) -> Result<serde_json::Value, String> {
        let mut d = self.data.write().unwrap_or_else(|e| e.into_inner());
        let id = format!("b{}", crate::state::now_ms());
        let board = Board {
            id: id.clone(),
            name: name.trim().to_string(),
            columns: vec![
                Column { id: "todo".into(), title: "Por hacer".into() },
                Column { id: "doing".into(), title: "En curso".into() },
                Column { id: "done".into(), title: "Hecho".into() },
            ],
            cards: Vec::new(),
        };
        d.boards.push(board.clone());
        drop(d);
        self.save();
        Ok(serde_json::to_value(board).unwrap_or_default())
    }

    pub fn delete_board(&self, id: &str) -> Result<(), String> {
        let mut d = self.data.write().unwrap_or_else(|e| e.into_inner());
        let before = d.boards.len();
        d.boards.retain(|b| b.id != id);
        if d.boards.len() == before {
            return Err("board no existe".into());
        }
        drop(d);
        self.save();
        Ok(())
    }

    pub fn add_card(
        &self,
        board: &str,
        column: &str,
        title: &str,
        notes: &str,
        color: &str,
    ) -> Result<serde_json::Value, String> {
        let mut d = self.data.write().unwrap_or_else(|e| e.into_inner());
        let b = d
            .boards
            .iter_mut()
            .find(|b| b.id == board)
            .ok_or("board no existe")?;
        let card = Card {
            id: format!("c{}", crate::state::now_ms()),
            board: board.to_string(),
            column: column.to_string(),
            title: title.trim().to_string(),
            notes: notes.to_string(),
            color: color.to_string(),
        };
        b.cards.push(card.clone());
        drop(d);
        self.save();
        Ok(serde_json::to_value(card).unwrap_or_default())
    }

    pub fn update_card(&self, id: &str, patch: &serde_json::Value) -> Result<(), String> {
        let mut d = self.data.write().unwrap_or_else(|e| e.into_inner());
        for b in &mut d.boards {
            if let Some(card) = b.cards.iter_mut().find(|c| c.id == id) {
                if let Some(col) = patch["column"].as_str() {
                    card.column = col.to_string();
                }
                if let Some(title) = patch["title"].as_str() {
                    card.title = title.to_string();
                }
                if let Some(notes) = patch["notes"].as_str() {
                    card.notes = notes.to_string();
                }
                if let Some(color) = patch["color"].as_str() {
                    card.color = color.to_string();
                }
                drop(d);
                self.save();
                return Ok(());
            }
        }
        Err("card no existe".into())
    }

    pub fn delete_card(&self, id: &str) -> Result<(), String> {
        let mut d = self.data.write().unwrap_or_else(|e| e.into_inner());
        for b in &mut d.boards {
            let before = b.cards.len();
            b.cards.retain(|c| c.id != id);
            if b.cards.len() != before {
                drop(d);
                self.save();
                return Ok(());
            }
        }
        Err("card no existe".into())
    }
}