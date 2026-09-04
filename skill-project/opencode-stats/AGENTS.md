# AGENTS.md â€” opencode-stats

App local de Rust (2024 edition) que lee `opencode.db` en solo-lectura y muestra tokens, costo estimado y cuotas vÃ­a web local. Frontend: JS vanilla + Tailwind + Chart.js vendoreados en `static/` (offline, sin build step ni npm). Toda la UI, docs y strings son en espaÃ±ol â€” mantener el idioma.

## Comandos
- Build dev: `cargo build` â†’ `target/debug/opencode-stats.exe`
- Build release: `cargo build --release` â†’ `target/release/opencode-stats.exe` (~3.9 MB, sin consola; requiere WebView2 Runtime, preinstalado en Win10/11). El exe abre una ventana embebida (wry/WebView2); cerrar la ventana mata el server
- **DIRECTIVA: el exe release NO debe abrir terminal** â€” `main.rs` lleva `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]`; no quitarlo ni cambiar el subsistema. Dev (debug) conserva consola
- Run (dev, sin ventana): `OPENCODE_STATS_HIDE_WINDOW=1 cargo run` â†’ http://127.0.0.1:8765
- Bins auxiliares: `cargo run --bin stats-watch` (monitor de terminal), `cargo run --bin make-icon` (regenera `assets/icon.ico` + `icon-256.png` + `icon-64.rgba` para la ventana)
- Tests: `cargo test` (42 tests: 14 admin + 16 db + 7 payload + 5 pricing, con DB temporal en `tests/*.rs`, sin tocar la real) Â· Lint: `cargo clippy` Â· Formato: `cargo fmt --check`
- API: `GET /api/data?since=YYYY-MM-DD&until=YYYY-MM-DD&model=substring&raw=1&scope=summary|modelo|proyecto|dia|mes|sesiones|limites|usage` Â· `GET /api/admin/status|sessions|backups|pricing|session/{id}` Â· `POST /api/admin` {action, dry_run, force, ...}
- Verificar cambios: `cargo test` + levantar el server y revisar `/api/data` + dry-runs de `/api/admin` (comparar contra el comportamiento de la versiÃ³n Python en git history si hace falta)

## Arquitectura (crate Ãºnico, sin async)
- `src/main.rs` â€” entry: server en thread + ventana wry/winit. Guarda/restaura posiciÃ³n y tamaÃ±o de la ventana en `window_state.json` (`%LOCALAPPDATA%\OpenCodeStats\` o `data/`); cerrar la ventana = `process::exit(0)`; sin WebView2 â†’ fallback a Edge/Chrome `--app`
- `src/server.rs` â€” `tiny_http` (sÃ­ncrono, thread pool, fiel a ThreadingHTTPServer): rutas JSON, CORS `*`, `Cache-Control: no-store` en API, estÃ¡ticos desde `static/`, MIME map, `parse_qs` propio
- `src/db.rs` â€” SQLite SOLO LECTURA (`mode=ro` URI) de la DB de opencode; ruta resuelta en este orden: env `OPENCODE_DB` â†’ `config.json` (`%LOCALAPPDATA%\OpenCodeStats\` o `data/`; ruta elegida por el usuario con el botÃ³n "Base de datosâ€¦" de GestiÃ³n, acciÃ³n `set_db`, requiere reiniciar) â†’ `~/.local/share/opencode/opencode.db`. CachÃ©s en memoria (`Mutex`) keyed por `max(time_updated)`: `get_request_counts` (scan de `part`/`message` ~4 s) y `event_weights`
- `src/pricing.rs` â€” dueÃ±a de PRICES/LIMITS/MODEL_NAMES (18 modelos; `MODEL_ORDER` preserva el orden de definiciÃ³n del dict de Python â€” el frontend renderiza prices en ese orden). Overrides desde `pricing_overrides.json` (`%LOCALAPPDATA%\OpenCodeStats\` o `data/`) fusionados en el primer `init()`; `save_overrides` actualiza los statics `RwLock`
- `src/payload.rs` â€” `build_payload` por `scope` â€” la carga inicial solo pide `summary` (~1-2 s); cada pestaÃ±a fetchea su scope al abrirse y lo cachea (`state.scopes` en app.js). `scope=usage` completa peticiones/cuotas en segundo plano. Cambiar el payload implica coordinar `static/app.js`
- `src/admin.rs` â€” ÃšNICA capa de escritura (conexiÃ³n `mode=rw` + `busy_timeout` 5 s). Acciones vÃ­a `POST /api/admin` (delete/move/rename/archive/prune/export/backup/vacuum/restore/pricing_save, todas con `dry_run`; `AdminAction` enum + match). Guardas: bloquea acciones destructivas si opencode estÃ¡ corriendo (tasklist `opencode` â€” pipe drenado con threads) excepto `force=true`; backup JSON automÃ¡tico previo en `backups/` (gitignored) + puntero `last.json` (para "Deshacer"). `db.rs` NUNCA escribe
- Mover sesiÃ³n de ruta = UPDATE `session` + parchear `json_set` en eventos `session.created.1`/Ãºltimo `session.updated.1` + `project_directory`; borrar sesiÃ³n = proyecciones + `event_sequence` (cascade events), espejo de `EventV2.remove()` de opencode (opencode re-proyecta desde eventos al reabrir una sesiÃ³n â€” borrar solo proyecciones las recrea); restaurar (undo) = re-insertar session/message/part/todo desde el backup JSON vÃ­a `PRAGMA table_info` dinÃ¡mico (sin log de eventos: resume/revert/share de esa sesiÃ³n quedan rotos â€” avisar en UI)
- `src/types.rs` â€” tipos del dominio: `Session`, `Group`, `TokenCounts`, `Price`, `Limits`, `AdminAction`, `Guard {dry_run, force}`, `ApiError` (Json/Sqlite/Permission/NotFound/Msg â†’ HTTP 403 blocked / 500) + formatters `fmt_num`/`fmt_cost`/`thousands` (contrato exacto de strings del frontend)
- `static/`: JS vanilla; Tailwind y Chart.js vendoreados en `static/vendor/` (offline). `admin.js` extiende la pestaÃ±a "GestiÃ³n" sin tocar `app.js`

## Gotchas
- `Path::home()` FALLA en servicios â†’ `db::home()` (fallback `USERPROFILE`/`HOME`). En el exe, backups/overrides/window_state van a `%LOCALAPPDATA%\OpenCodeStats\`
- Env de test: `OPENCODE_STATS_HIDE_WINDOW=1` (sin ventana), `OPENCODE_STATS_NO_BROWSER=1` (no aplica â€” el exe nunca abre navegador salvo fallback), `OPENCODE_STATS_PORT`
- Ruta de la DB: env `OPENCODE_DB` tiene prioridad sobre el `config.json` de la UI (acciÃ³n `set_db`); los tests usan `set_config_dir_for_tests` + env para no tocar la real
- `get_request_counts()` escanea `part`/`message` con `json_extract` (NO LIKE â€” 10x mÃ¡s rÃ¡pido); cachÃ© con **scan incremental**: si `max(time_updated)` de session creciÃ³, solo se cuentan las sesiones activas (`IN (SELECT id FROM session WHERE time_updated > ?)`, ~57 ms) y se suman al mapa; el full scan queda solo para el arranque. No "optimizarla" por sesiÃ³n sin mantener esa semÃ¡ntica
- `session.model` guarda JSON `{"id": "..."}` â€” parsear con `db::model_id()`; los tokens vienen de columnas `tokens_*` de `session` y el costo real de `cost`
- Filtro `until` es inclusivo (agrega 86_399_999 ms al timestamp)
- Fechas SIEMPRE hora local naive (`chrono::Local`), como el Python
- `run_cmd_timeout` (tasklist/git) drena stdout/stderr en threads â€” si no, el pipe lleno bloquea al hijo y el timeout mata la detecciÃ³n de opencode
- Frontend: tema dark fijo (`#0b0e14` bg / `#141a24` panels), tablas DRY con un solo `renderTable(thId, tbId, cols, rows)` + config `COLS` en `app.js`
- Commits: conventional commits en inglÃ©s (`feat/fix/refactor(scope)`); UI, docs y mensajes de usuario en espaÃ±ol

---

<!-- GLOBAL-AGENTS-SYNC v2 -->
## Memoria del proyecto (no duplicar, solo referenciar)
- **Index-First:** antes de investigar, revisar `../../.agents/INDEX.md`; si una skill aplica, leer UNICAMENTE su `SKILL.md`.
- **Anti-Patterns:** revisar `../../.agents/ANTIPATTERNS.md` (locks/EPERM, sin bash en PowerShell, sin volcar `node_modules`/`.git`/`dist`).
- **Eficiencia:** cero charla ociosa, lectura selectiva, `fast-find "<termino>"`.
- **Contribuir:** patron/bug -> `../../.agents/skills/<nombre>/SKILL.md` (max 25 lineas) + fila en `INDEX.md`; trampa -> regla en `ANTIPATTERNS.md`.

