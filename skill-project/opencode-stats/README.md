# OpenCode Stats

Aplicación local de escritorio que lee la base de datos de [opencode](https://opencode.ai) en **solo lectura** y muestra el consumo real de tokens, el costo estimado (precios de OpenCode Go), el uso de peticiones contra las cuotas (5 h / semana / mes) y desgloses por modelo, proyecto, día, mes y sesión — todo en una ventana embebida liviana (WebView2) con una interfaz web en español.

Escrita en **Rust** (edición 2024). Sin async, sin npm, sin build steps de frontend: el frontend es JS vanilla + Tailwind + Chart.js vendoreados (funciona 100 % offline).

---

## Características

- **Tarjetas de totales**: tokens de entrada, salida, reasoning, cache leída/escrita y costo (real de la DB + estimado con precios oficiales).
- **Gráficos**: costo por día, peticiones por día, tokens por día y distribución de costo por modelo.
- **Pestañas de desglose**: por modelo, proyecto, día, mes, sesiones (top 40 por costo) y límites/precios.
- **Filtros globales**: rango de fechas (con accesos rápidos 24 h / 7 d / 30 d / este mes) y filtro por modelo (substring).
- **Cuotas de peticiones**: ventanas móviles de 5 horas, 7 y 30 días, con barras de uso y estados (AGOTADO / % / OK).
- **Vista personalizable**: ocultar tarjetas, gráficos o pestañas desde el botón ⚙ (persistente).
- **Exportar CSV** de la pestaña activa con los filtros aplicados.
- **Auto-refresh** cada 45 s (opcional).
- **Gestión de la base** (pestaña "Gestión"): eliminar, mover de proyecto/ruta, renombrar, archivar, exportar, limpiar por fecha (prune), backup completo, VACUUM, deshacer/restaurar y editor de precios/límites — todo con *dry-run*, backup JSON automático y bloqueo de seguridad cuando opencode está corriendo.
- **Ventana embebida** (wry/WebView2): guarda y restaura posición y tamaño; cerrar la ventana apaga el servidor y mata todo.

---

## Requisitos

| Herramienta | Versión | Nota |
|---|---|---|
| Rust | 1.94+ (edición 2024) | solo para compilar desde el código |
| opencode | cualquiera | la app lee `opencode.db` (no lo toca) |
| WebView2 Runtime | preinstalado en Win10/11 | solo para la ventana embebida |

La base de datos que se lee es `C:\Users\<usuario>\.local\share\opencode\opencode.db` (sobrescribible con la variable `OPENCODE_DB`). Se abre en **modo solo lectura** (`mode=ro`): se puede consultar mientras opencode está corriendo sin riesgo de locks ni corrupción.

---

## Instalación y build

```powershell
cd G:\Proyectos\opencode-stats
cargo build --release
```

El ejecutable queda en `target\release\opencode-stats.exe` (~3.9 MB, sin consola, con icono embebido). Las dependencias principales:

| Crate | Rol |
|---|---|
| `rusqlite` (bundled) | SQLite con JSON1, backup API y VACUUM |
| `tiny_http` | servidor HTTP local síncrono (thread pool) |
| `wry` + `winit` | ventana embebida WebView2 |
| `chrono` | fechas SIEMPRE hora local naive |
| `serde_json` | payloads de la API |
| `ureq` | cliente HTTP del monitor de terminal |
| `flate2` | generador del logo (PNG) |
| `embed-resource` | icono del .exe |

---

## Uso

### Doble clic (recomendado)

El acceso directo **"OpenCode Stats"** del escritorio apunta a `target\release\opencode-stats.exe` y abre la ventana embebida en `http://127.0.0.1:8765`.

### Desde la terminal

```powershell
cargo run --release                    # ventana embebida
OPENCODE_STATS_HIDE_WINDOW=1 cargo run # solo el servidor (http://127.0.0.1:8765)
cargo run --bin stats-watch            # monitor de terminal (actualiza cada 5 s)
cargo run --bin make-icon              # regenera assets/icon.ico, icon-256.png, icon-64.rgba
```

El servidor escucha **solo** en `127.0.0.1`.

### Variables de entorno

| Variable | Efecto |
|---|---|
| `OPENCODE_DB` | ruta alternativa a `opencode.db` |
| `OPENCODE_STATS_PORT` | puerto (default 8765) |
| `OPENCODE_STATS_HIDE_WINDOW` | sin ventana (solo servidor) |

---

## La interfaz

| Elemento | Descripción |
|---|---|
| Filtros | `Desde` / `Hasta` (date), `Modelo` (substring), botones de rango rápido y auto-refresh |
| Cards | entrada, salida, reasoning, cache leída/escrita y costo total (ocultables) |
| Resumen | 4 gráficos (Chart.js) + estadísticas: sesión más cara, más tokens, input medio |
| Por modelo | sesiones, peticiones, tokens y costo estimado por modelo |
| Por proyecto / día / mes | desgloses agregados (nombres legibles de la tabla `project`) |
| Sesiones | top 40 por costo (título, modelo, inicio, tokens) |
| Límites y precios | uso vs cuota (5 h / 7 d / 30 d) y tabla de precios por 1M tokens |
| Gestión | administración de la base (ver sección siguiente) |
| ⚙ | personalizar vista (ocultar cards/gráficos/pestañas) |

---

## Gestión de la base (pestaña "Gestión")

- **Lista de sesiones**: buscador, orden por columnas, selección múltiple (shift/ctrl), **agrupado por ruta** con totales y colapso, doble clic = detalle de sesión (partes por tipo, eventos, muestras de mensajes).
- **Eliminar**: dry-run con estimación (mensajes/parts/eventos/MB liberados) + confirmación + backup JSON automático en `backups/`.
- **Mover**: cambia la ruta/proyecto de la sesión y **parchea los eventos** `session.created.1` / `session.updated.1` (`json_set`) para que opencode no revierta el movimiento al re-proyectar.
- **Renombrar / Archivar / Exportar**: título, archivado (`time_archived`), snapshot JSON.
- **Prune**: borra sesiones cerradas anteriores a una fecha (requiere escribir `BORRAR`).
- **Backup completo**: copia la DB vía la API de backup de SQLite (candidatos: `D:/opencode-backup`, `~/opencode-backup`, `backups/full`).
- **VACUUM**: compacta la DB (muestra MB antes/después).
- **Deshacer / Restaurar**: desde el puntero `backups/last.json` de la última operación; re-inserta session/message/part/todo vía `PRAGMA table_info` dinámico. *(No reinserta el log de eventos: resume/revert/share de esa sesión quedan rotos — la UI lo advierte.)*
- **Editor de precios/límites**: overrides persistentes en `pricing_overrides.json`.

### Guardas de seguridad

- Todas las operaciones destructivas tienen **dry-run** y **backup automático previo**.
- Si **opencode está corriendo**, las operaciones destructivas (delete/move/rename/archive/prune/restore) quedan **bloqueadas** salvo que marques explícitamente **"Forzar"** (bajo tu responsabilidad).
- La detección compara el nombre exacto del proceso (`opencode.exe`) y **excluye el propio** `opencode-stats.exe`.

### Ubicación de archivos

| Archivo | Ruta |
|---|---|
| Backups | `%LOCALAPPDATA%\OpenCodeStats\backups` (en el exe) · `backups\` (dev) |
| Overrides de precios | `%LOCALAPPDATA%\OpenCodeStats\pricing_overrides.json` · `data\` (dev) |
| Estado de la ventana | `%LOCALAPPDATA%\OpenCodeStats\window_state.json` · `data\` (dev) |

---

## API local (HTTP 127.0.0.1:8765)

### Lectura

```
GET /api/data?since=YYYY-MM-DD&until=YYYY-MM-DD&model=substring&raw=1&scope=summary|modelo|proyecto|dia|mes|sesiones|limites|usage
```

- `raw=1` → números crudos; sin `raw` → strings formateados (`1.2 M`, `$34.56`).
- Sin `scope` equivale a `all` (payload completo).
- `summary` es la carga inicial (~1-2 s); cada pestaña pide su scope al abrirse (lazy + caché en el frontend).

```
GET /api/admin/status          → {opencode_running, db_mb, wal_mb, free_gb, page_count, projects[]}
GET /api/admin/sessions        → {sessions: [{id, title, model, project, directory, archived,
                                created, updated, input, output, cost, events, events_mb}]}
GET /api/admin/backups         → {backups: [{name, path, size_mb, mtime}], last}
GET /api/admin/pricing         → {prices, limits, names}
GET /api/admin/session/{id}    → detalle completo de una sesión
```

### Escritura

```
POST /api/admin   body: {action, ids, directory, archived, cutoff, title, id,
                         backup_path, dest, prices, limits, names, dry_run, force}
```

| Acción | Campos | Respuesta |
|---|---|---|
| `delete` | ids | deleted, rows, total_events_mb, backup |
| `move` | ids, directory | moved, target, project_id, backup |
| `rename` | id, title | title |
| `archive` | ids, archived | affected |
| `prune` | cutoff (YYYY-MM-DD) | deleted, rows, cutoff |
| `export` | ids | sessions: {id: snapshot} |
| `backup` | dest (opcional) | path, size_mb |
| `vacuum` | — | before_mb, after_mb |
| `restore` | backup_path | restored, backup |
| `pricing_save` | prices, limits, names | saved, path, models |

Errores: `PermissionError` (opencode corriendo sin `force`) → **403** `{error, blocked: true}`; otros errores → 500 `{error}`.

---

## Arquitectura

```
┌───────────────┐   HTTP 127.0.0.1:8765   ┌───────────────────┐     ┌──────────────────────┐
│ Ventana wry   │ <──────────────────────>│ src/server.rs     │────>│  SQLite (solo r/o)   │
│ (WebView2)    │  GET /api/data?…        │  tiny_http        │     │  opencode.db         │
│ + static/     │  GET /static/*          │  (thread pool)    │     │  (~6 GB, WAL)        │
└───────────────┘                         │  payload.rs       │────>│                      │
        ▲                                 └────────┬──────────┘     └──────────────────────┘
        │                                          │
        └────────── static/ (frontend JS vanilla)  ▼
                                            ┌───────────────────┐
                                            │ src/db.rs (ro)    │
                                            │ src/pricing.rs    │
                                            │ src/admin.rs (rw) │
                                            └───────────────────┘
```

| Módulo | Responsabilidad |
|---|---|
| `src/main.rs` | arranque: `pricing::init()`, servidor en thread, ventana wry/winit, window_state, fallback a Edge/Chrome `--app` |
| `src/server.rs` | HTTP: rutas JSON, CORS `*`, `Cache-Control: no-store` en API, estáticos (con guard de traversal), parse_qs propio, body limitado a 1 MiB |
| `src/db.rs` | SQLite SOLO LECTURA (`mode=ro`): `load_sessions` (filtros, `until` inclusivo +86_399_999 ms), `project_names`, `get_request_counts` (scan de `part` con `json_extract` + caché **incremental** por sesiones activas), agregadores y `stats` |
| `src/pricing.rs` | 18 modelos con PRICES/LIMITS/MODEL_NAMES, `MODEL_ORDER` (orden del dict original), overrides persistentes, `estimate_cost` (reasoning facturado como output), `usage_by_window`, `quota_status` |
| `src/payload.rs` | `build_payload`: contrato JSON exacto del frontend, scopes, formatters condicionales (raw vs formateado) |
| `src/admin.rs` | ÚNICA capa de escritura (`mode=rw` + `busy_timeout` 5 s): 10 acciones con dry-run/force, backups JSON + `last.json`, restore dinámico, event_weights, status |
| `src/types.rs` | `Session`, `Group`, `TokenCounts`, `Price`, `AdminAction` (enum + match), `Guard`, `ApiError` (→ 403/500) y formatters `fmt_num`/`fmt_cost`/`thousands` |
| `src/bin/stats-watch.rs` | monitor de terminal (lee `/api/data?raw=1` cada 5 s) |
| `src/bin/make-icon.rs` | generador del logo: `assets/icon.ico` (16/32/48/64 BMP), `icon-256.png`, `icon-64.rgba` (ventana) |
| `static/` | frontend sin cambios: `index.html`, `app.js` (tablas DRY con `COLS`), `admin.js` (Gestión), `app.css`, `vendor/` (Tailwind + Chart.js offline) |

### Decisiones clave

- **`tiny_http` síncrono**: fiel al `ThreadingHTTPServer` del Python; sin async.
- **Fechas siempre hora local naive** (`chrono::Local`), igual que el original.
- **`session.model`** guarda JSON `{"id": "..."}` → se parsea con `db::model_id()`.
- **Peticiones**: parts `type=text` de mensajes `role=assistant` (una completion ≈ una respuesta).
- **Cachés keyed por `max(time_updated)`**: se invalidan solas cuando la DB crece (y explícitamente tras operaciones de Gestión).
- **Frontend**: tema oscuro fijo, un solo `renderTable` para las 7 tablas, prefs en `localStorage`.

---

## Desarrollo

```powershell
cargo test          # 41 tests con DB temporal (no tocan la DB real)
cargo clippy        # lint (sin warnings)
cargo fmt --check   # formato
cargo run           # modo dev
```

Los tests (`tests/`) replican el schema de opencode (13 tablas) con una DB temporal aislada: `tests/common/mod.rs` provee el fixture (`with_db`) que además aísla el archivo de overrides de precios y resetea las caches estáticas. Cubren: delete (dry-run/real/bloqueado), move (con parcheo de eventos), prune, restore (roundtrip y no-sobrescritura), detalle de sesión, export, pricing (estimación/cuotas/overrides), payload (todos los scopes) y lecturas de db.

### Convenciones

- Commits: conventional commits en inglés (`feat/fix/refactor(scope)`).
- UI, docs y mensajes de usuario en español.
- `db.rs` NUNCA escribe; `admin.rs` es la única capa de escritura.
- `src/` sin comentarios superfluos; doc-comments cortos en las funciones públicas.

---

## Estructura del repositorio

```
opencode-stats/
├── Cargo.toml / Cargo.lock
├── build.rs                # icono del exe (embed-resource + assets/app.rc)
├── src/
│   ├── main.rs             # ventana wry + server
│   ├── server.rs           # HTTP tiny_http
│   ├── payload.rs          # build_payload
│   ├── db.rs               # SQLite (solo lectura)
│   ├── admin.rs            # capa de escritura (gestión)
│   ├── pricing.rs          # precios/límites/overrides
│   ├── types.rs            # tipos del dominio + formatters
│   └── bin/
│       ├── stats-watch.rs  # monitor de terminal
│       └── make-icon.rs    # generador del logo
├── static/                 # frontend (index.html, app.js, admin.js, app.css, vendor/)
├── tests/                  # 41 tests de integración + fixture común
├── assets/                 # icono/logo generados (icon.ico, icon-256.png, icon-64.rgba, app.rc)
├── docs/
│   ├── 01-setup.md         # setup detallado
│   ├── 02-arquitectura.md  # diagrama y flujo de datos
│   └── migracion-rust/     # inventario de la migración (referencia)
└── AGENTS.md               # guía para agentes de IA
```

---

## Notas

- **Estimaciones**: el costo estimado usa los tokens reales × precios oficiales de OpenCode Go (tramo base en modelos con precio por tramo: GPT 5.6 Luna, Qwen3.7/3.6 Plus). Los modelos `*-free` no cotizan y se muestran como `—`.
- **Historial**: el proyecto se migró por completo de Python a Rust. El inventario original (función por función) está en `docs/migracion-rust/00-inventario.md`; la versión Python vive en el historial de git para comparaciones.
- **Troubleshooting**: si la ventana no abre (sin WebView2), la app cae automáticamente al modo app del navegador (Edge/Chrome `--app`).
