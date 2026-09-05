//! OpenCode Stats — port Rust del backend Python.
//!
//! Módulos (fieles a server.py / opencode_stats/{db,pricing,admin}.py):
//! - `db` — SQLite SOLO LECTURA (mode=ro) sobre opencode.db
//! - `pricing` — PRICES/LIMITS/MODEL_NAMES + overrides + estimación de costo/cuotas
//! - `admin` — ÚNICA capa de escritura (delete/move/rename/archive/prune/export/
//!   restore/backup/vacuum/pricing_save) con guardas dry-run/force
//! - `payload` — build_payload (contrato JSON exacto del frontend)
//! - `server` — HTTP local (tiny_http): API JSON + estáticos static/

pub mod admin;
pub mod db;
pub mod gpu;
pub mod payload;
pub mod pricing;
pub mod server;
pub mod types;
