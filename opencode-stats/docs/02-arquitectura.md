# OpenCode Stats — Arquitectura

## Diagrama general

```
┌───────────────┐   HTTP 127.0.0.1:8765   ┌───────────────────┐     ┌──────────────────────┐
│ Ventana wry   │ <──────────────────────>│ src/server.rs     │────>│  SQLite (solo r/o)   │
│ (WebView2)    │  GET /api/data?since=…  │  tiny_http        │     │  opencode.db         │
│ + static/     │  GET /static/*          │  (thread pool)    │     │  (~6 GB, WAL)        │
└───────────────┘                         │  payload.rs       │────>│                      │
        ▲                                 └────────┬──────────┘     └──────────────────────┘
        │                                          │
        └────────── index.html + app.js (frontend) │
                    (un solo renderAll por carga)   ▼
                                            ┌───────────────────┐
                                            │ src/db.rs         │
                                            │ src/pricing.rs    │
                                            │ src/admin.rs (rw) │
                                            └───────────────────┘
```

## Flujo de datos

1. `main.rs` levanta `server::serve(port)` en un thread y abre la ventana
   embebida (wry/WebView2) en `http://127.0.0.1:8765`; restaura y guarda la
   posición/tamaño de la ventana (`window_state.json`).
2. El frontend hace **una sola petición** a `GET /api/data?since=&until=&model=&scope=summary`
   y cada pestaña fetchea su scope al abrirse (lazy + cache en `state.scopes`).
3. `payload::build_payload()`:
   - `db::load_sessions()` → sesiones con tokens agregados
   - `db::get_request_counts()` → peticiones por sesión (caché en memoria)
   - `db::totals()` / `db::stats()` / agregadores → tarjetas y tablas
   - `pricing::estimate_cost()` → costo estimado por modelo y total
   - `pricing::usage_by_window()` → uso vs cuota (5 h / 7 d / 30 d)
4. El frontend (`app.js`) renderiza todo con `renderAll()`: cards, gráficos
   (Chart.js), estadísticas y tablas.

## Decisiones clave

| Decisión | Por qué |
|---|---|
| `tiny_http` síncrono | cero async; la app es local; fiel a ThreadingHTTPServer |
| API `/api/data` por scopes | una round-trip por pestaña, frontend simple y rápido |
| Lectura `mode=ro` con URI | opencode mantiene la DB abierta; evita locks/daños |
| Tabla `session` como fuente de tokens | opencode agrega ahí input/output/reasoning/cache/costo por sesión |
| Conteo de peticiones por parts de tipo text (asistente) | una completion ≈ una respuesta de texto |
| Caché en memoria de peticiones | el scan de `part` tarda ~4 s; se invalida cuando `time_updated` máx cambia |
| `admin.rs` como única capa de escritura | todo lo demás es read-only; guardas dry-run/force + backups JSON |
| Ventana embebida wry/WebView2 | misma experiencia que pywebview, sin dependencias de Python |
| Tailwind + Chart.js vendoreados | funciona sin internet; sin build step |

## Arquitectura DRY

- **Backend**: `db.rs` y `pricing.rs` son los únicos dueños de la lógica de datos;
  `server.rs` solo serializa; `payload.rs` arma el contrato JSON del frontend.
- **Frontend**: un `renderTable(thId, tbId, cols, rows)` sirve para modelo,
  proyecto, día, mes, sesiones, límites y precios — cada tabla solo declara su
  configuración de columnas (`COLS`), incluidos formatos y clases por celda.
- **Formatters**: `fmt_num()`/`fmt_cost()`/`thousands()` en `types.rs` replican
  el contrato exacto de strings del frontend; `num()`/`usd()` y la lógica de
  cuota (`quotaBar`, `quotaCls`) se definen una sola vez en JS.

## Pestañas de la UI

| Pestaña | Fuente (payload.rs) |
|---|---|
| Resumen | `days` + `models_chart` + `stats` |
| Por modelo | `by_model` + `pricing::estimate_cost` + peticiones |
| Por proyecto | `by_project` (nombres desde tabla `project`) |
| Por día / Por mes | `by_day` / `by_month` |
| Sesiones | `top_sessions` (top 40 por costo) |
| Límites y precios | `limits` (`usage_by_window` + `LIMITS`) + `prices` (`PRICES`) |
| Gestión | `/api/admin/*` (admin.rs) |

## Migración desde Python

El proyecto se migró por completo de Python a Rust. El inventario original
(función por función, variables y contratos) está en
[docs/migracion-rust/00-inventario.md](migracion-rust/00-inventario.md);
la versión Python vive en el historial de git (rama/commits previos) para
comparaciones puntuales.
