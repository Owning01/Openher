//! Kanban local (data/kanban.json): boards, columnas y cards.

use std::sync::RwLock;

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
}

fn path() -> std::path::PathBuf {
    crate::state::kanban_path()
}

impl KanbanStore {
    pub fn load() -> Self {
        let data = std::fs::read_to_string(path())
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default();
        Self {
            data: RwLock::new(data),
        }
    }

    fn save(&self) {
        if let Err(e) = std::fs::create_dir_all(crate::state::data_dir()) {
            // Antes fallaba en silencio y las tarjetas solo vivían en memoria:
            // al cerrar la app "desaparecían". Ahora queda en el log.
            eprintln!("[kanban] no se pudo crear data_dir: {e}");
            return;
        }
        if let Ok(d) = self.data.read() {
            let p = path();
            let tmp = p.with_extension("json.tmp");
            let data = serde_json::to_string_pretty(&*d).unwrap_or_default();
            if std::fs::write(&tmp, &data).is_ok() {
                if let Err(e) = std::fs::rename(&tmp, &p) {
                    eprintln!("[kanban] no se pudo persistir {}: {e}", p.display());
                }
            } else if let Err(e) = std::fs::write(&p, &data) {
                eprintln!("[kanban] no se pudo persistir {}: {e}", p.display());
            }
        }
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