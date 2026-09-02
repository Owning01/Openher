# Inventario completo — OpenCode Stats (fuente para la migración a Rust)

> Documento de referencia de la migración. Cada símbolo del sistema Python actual,
> con firma, propósito, constantes y contratos. Nada se omite: si no está acá, no existe.
> Generado desde el código real (commits previos a la migración).

## 0. Estructura de archivos (estado actual)

```
main.py                     — entry dev (browser mode)
launcher.py                 — entry .exe (pywebview/WebView2)
server.py                   — HTTP stdlib + build_payload
opencode_stats/
  __init__.py
  db.py                     — SOLO LECTURA (mode=ro)
  pricing.py                — PRICES/LIMITS/MODEL_NAMES + overrides
  admin.py                  — ÚNICA capa de escritura
  icon.py                   — ICON64_B64 (base64 PNG 64px, generado por tools/make_icon.py)
static/
  index.html (166 L)  app.js (507 L)  admin.js (696 L)  app.css (99 L)  vendor/ (tailwind.js, chart.js)
tests/
  conftest.py               — SCHEMA 13 tablas + seed + fixture tmp_db
  test_admin.py             — 13 tests
stats-watch.py              — monitor de terminal
tools/make_icon.py          — generador de logo (PNG + ICO + icon.py)
pyproject.toml              — deps: pywebview; dev: pyinstaller/pytest/ruff/pyright
run.ps1, start-stats.bat, OpenCodeStats.spec, README.md, AGENTS.md, docs/
```

---

## 1. main.py (5 L)

| Símbolo | Detalle |
|---|---|
| `main()` | → `server.run()` (levanta servidor + abre navegador) |

---

## 2. launcher.py

### Constantes
| Símbolo | Valor |
|---|---|
| `PORT` | `server.PORT` (=8765, env `OPENCODE_STATS_PORT`) |
| `URL` | `http://127.0.0.1:{PORT}` |
| `APP_MODE_EXES` | Edge x86/x64, Chrome x86/x64 (`--app=` mode) |
| `WINDOW_STATE_FILE` | `"window_state.json"` |

### Funciones
| Símbolo | Firma / Detalle |
|---|---|
| `_config_dir()` | frozen → `%LOCALAPPDATA%\OpenCodeStats`; dev → `data/` |
| `_load_window_state()` | lee JSON {x,y,width,height}; valida: width≥400, height≥300, \|x\|≤20000, \|y\|≤20000; inválido → `{}` |
| `_save_window_state(st)` | mkdir + write JSON (silencioso) |
| `_watch_window_state(window)` | thread daemon, loop 0.7 s: `int(window.x/y/width/height)`; TypeError/ValueError → `continue` (ventana inicializándose); otra excepción → `return` (destruida; último estado ya guardado) |
| `_start_server()` | `ThreadingHTTPServer(("127.0.0.1", PORT), server.Handler)` en thread daemon; `OSError` → `None` (ya corre) |
| `_quit(srv)` | `srv.shutdown()` + `srv.server_close()` + `os._exit(0)` |
| `_open_browser_app_mode()` | primer exe de `APP_MODE_EXES` existente → Popen `--app=URL --no-first-run` CREATE_NO_WINDOW; fallback `webbrowser.open(URL)` |
| `main()` | 1) `_start_server()`; si None → abrir navegador y salir. 2) `OPENCODE_STATS_HIDE_WINDOW` → espera infinita. 3) import webview falla → browser-mode. 4) `webview.create_window("OpenCode Stats", URL, width=1280, height=820, x=st.x, y=st.y, min_size=(940,600))` + thread `_watch_window_state` + `webview.start()` → `_quit(srv)` |

Env de test: `OPENCODE_STATS_HIDE_WINDOW=1`, `OPENCODE_STATS_NO_BROWSER=1`, `OPENCODE_STATS_PORT`.

---

## 3. server.py (332 L)

### Constantes
| Símbolo | Valor |
|---|---|
| `ROOT`, `STATIC` | raíz del repo / `static/` |
| `PORT` | env `OPENCODE_STATS_PORT` = 8765 |
| `HOST` | env `OPENCODE_STATS_HOST` = "0.0.0.0" (NO se usa en run) |
| `MIME` | `.html`→text/html; charset=utf-8 · `.js`→text/javascript · `.css`→text/css · `.svg`→image/svg+xml · `.png`→image/png · `.ico`→image/x-icon; default octet-stream |

### Formatters (contrato exacto de strings)
| Símbolo | Reglas |
|---|---|
| `_fmt(n)` | n≥1e9 → `"{:.2f} B"`; n≥1e6 → `"{:.2f} M"`; n≥1e3 → `"{:.1f} K"`; else `str(int(n))` |
| `_cost(n)` | n≥100 → `"${:,.0f}"`; n≥1 → `"${:,.2f}"`; else `"${:.4f}"` (comas de miles) |

### `SCOPE_KEYS` (dict[str, list[str]])
| scope | keys |
|---|---|
| summary | meta, totals, cost, est_total, stats, today, days, days_tokens, models_chart |
| modelo | by_model |
| proyecto | by_project |
| dia | by_day |
| mes | by_month |
| sesiones | sessions |
| limites | today, days, days_requests, limits, prices |
| usage | today, days, days_requests, limits, prices |

### `build_payload(since, until, model, raw=False, scope="all") -> dict`
1. `sessions = db.load_sessions(since, until, model)`
2. `wants_requests = scope in ("all", "modelo", "limites", "usage")`
3. `requests = db.get_request_counts(sessions)` si wants_requests
4. `t = db.totals(sessions)`; `st = db.stats(sessions, t)`
5. `est_total = Σ pricing.estimate_cost(s, s["model"]) for s in sessions` (excluye None)
6. `fmt = identidad si raw else _fmt`; `costfmt = identidad si raw else _cost`
7. `today_key = datetime.now().strftime("%Y-%m-%d")` (LOCAL)
8. `today = {cost, input, output, reasoning, cache_read, cache_write, requests: None, sessions: 0}` — acumula solo si `day == today_key`; `requests` solo si wants_requests (None si ninguna sesión hoy)
9. `req_by_day`/`tok_by_day`: `day = datetime.fromtimestamp(created/1000).strftime("%Y-%m-%d")` (LOCAL)
   - `days_requests = [{day, requests}] sorted desc [:45]` si wants_requests, sino None
   - `days_tokens = [{day, tokens}] sorted desc [:45]`
10. `by_model` (top 50): por `db.by_model(sessions, top=50)`: `{model: MODEL_NAMES.get(mid,mid), id: mid, sessions: g.n, requests: Σ requests[s.id] for s in sessions if s.model==mid, input/output/reasoning/cache_read/cache_write: fmt(g.*), cost: costfmt(g.cost), est: raw ? est : (_cost(est) si est no None, sino "—")}`
11. `rows(grouped)`: `[{key: k, sessions: g.n, input, output, reasoning, cache_read, cache_write (fmt), cost (costfmt)}]`
12. `sessions_rows` (top 40 por costo): `{title: s.title[:60], model: (MODEL_NAMES.get(s.model.split("/")[-1]) or basename)[:24], start: fromtimestamp(created/1000) "%Y-%m-%d %H:%M", input, output (fmt), cache_read (fmt), cost (costfmt)}`
13. `usage = pricing.usage_by_window(sessions, requests)` si wants_requests
14. `limits`: `{model: MODEL_NAMES.get(mid,mid), u5h: u["5h"], u7d: u["semana"], u30d: u["mes"], l5h/l7d/l30d: LIMITS.get(mid) tuple or None}` — solo modelos con `any(u.values())`; ordenado por `-sum(u.values())`
15. `prices`: `{model: MODEL_NAMES.get(mid,mid), in, out, cr, cw}` (todos PRICES)
16. `first/last = "%Y-%m-%d"` de `st["primera"]`/`st["ultima"]` si sessions, sino "—"
17. `highlights` si sessions: `{mas_cara: {cost: costfmt, title: [:40], model: basename}, mas_tokens: {title: [:50], model: basename}, input_medio: fmt}`; sino `{mas_cara: {cost: costfmt(0), "—"}, mas_tokens: {"—"}, input_medio: fmt(0)}`
18. payload final (claves exactas):
```json
{
  "meta": {"sessions": int, "models": st.modelos, "since": str, "until": str,
           "avg_cost": raw ? float : "%.4f", "db": DB_PATH.name | "no encontrada", "filtered": bool},
  "totals": {input, output, reasoning, cache_read, cache_write: fmt},
  "cost": costfmt, "est_total": costfmt,
  "stats": highlights,
  "days": [{day, cost}]  // reversed(by_day(top=45))
  "today": {...}, "days_requests": [...|null], "days_tokens": [...],
  "models_chart": [{model, cost}]  // by_model(top=10), model = MODEL_NAMES.get
  "by_model": [...], "by_project": rows(by_project), "by_day": rows(by_day),
  "by_month": rows(by_month), "sessions": sessions_rows, "limits": [...], "prices": [...]
}
```
19. Filtro final: `payload = {k: payload[k] for k in SCOPE_KEYS[scope] if k in payload}`

### Clase `Handler(SimpleHTTPRequestHandler)`
- `__init__(*a, directory=str(STATIC))`
- `log_message()` — no-op
- `_json(obj, code=200)` — `json.dumps(obj, ensure_ascii=False)` utf-8; headers: `Content-Type: application/json; charset=utf-8`, `Content-Length`, `Cache-Control: no-store`, `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`
- `do_OPTIONS()` — 204 + CORS (sin Content-Type)
- `do_GET()` — rutas en orden:
  1. `/api/admin/status` → `admin.status()`
  2. `/api/admin/sessions` → query since/until/model → `db.load_sessions` + `admin.event_weights(sessions)` + `db.project_names()` → `{sessions: [{id, title, model, project: names.get(project_id, project_id or "(sin proyecto)"), directory, archived, created, updated, input, output, cost, events: w[0], events_mb: round(w[1]/1e6, 2)}]}`
  3. `/api/data` → query since/until/model/raw (raw ∈ "1","true","yes")/scope → `build_payload`; excepción → `{error}` 500
  4. `/api/admin/backups` → `admin.list_backups()`
  5. `/api/admin/pricing` → `admin.get_pricing()`
  6. `/api/admin/session/{id}` → `admin.session_detail(sid)` (último segmento)
  7. `/` → index.html; `/api*` restante → 404 del static handler
- `do_POST()` — solo `/api/admin`: `body = json.loads(rfile.read(Content-Length))`; `admin.dispatch(body["action"], body)`; `PermissionError` → `{error, blocked: True}` 403; `Exception` → `{error: str(e)}` 500
- `guess_type(path)` → `MIME.get(suffix, "application/octet-stream")`

### `run()`
`ThreadingHTTPServer(("127.0.0.1", PORT), Handler)`; OSError → "Ya está corriendo…" + webbrowser; `threading.Timer(0.6, webbrowser.open(url))`; `serve_forever()`; KeyboardInterrupt → shutdown.

---

## 4. opencode_stats/db.py (205 L) — SOLO LECTURA

### Constantes
| Símbolo | Valor |
|---|---|
| `DB_PATH` | env `OPENCODE_DB` si set, sino `_home()/.local/share/opencode/opencode.db` |
| `TOKEN_FIELDS` | ("input", "output", "reasoning", "cache_read", "cache_write") |
| `_REQ_CACHE` | `{max_time_updated: {session_id: count}}` (módulo-level) |

### Funciones
| Símbolo | Firma / Detalle |
|---|---|
| `_home()` | `Path.home()`; `RuntimeError` → `USERPROFILE` → `HOME`; ambos faltan → raise |
| `db_exists()` | `DB_PATH.exists()` |
| `_connect()` | FileNotFoundError si no existe DB; URI `file:{path}?mode=ro` (backslashes → `/`); `row_factory = sqlite3.Row` |
| `_parse_date(s)` | `int(datetime.strptime(s, "%Y-%m-%d").timestamp() * 1000)` — naive → hora LOCAL |
| `_model_id(raw)` | `None`/vacío → "(sin modelo)"; `json.loads(raw).get("id", raw)`; excepción → raw |
| `load_sessions(since="", until="", model="")` | SQL: `SELECT id, title, model, project_id, time_created, time_updated, directory, time_archived, tokens_input, tokens_output, tokens_reasoning, tokens_cache_read, tokens_cache_write, cost FROM session WHERE 1=1` + `AND time_created >= ?` (since) + `AND time_created <= ?` (until+86_399_999) · mapeo: id, title (None→"(sin título)"), model (_model_id), project_id, created (0 si None), updated (0), directory (""), archived (time_archived is not None), input/output/reasoning/cache_read/cache_write (0 si None), cost (0.0) · filtro model: substring lower de model contra model.lower() |
| `project_names()` | `SELECT id, name, worktree FROM project WHERE name IS NOT NULL` → `{id: f"{name}  [{worktree}]" si worktree sino name}` |
| `get_request_counts(sessions)` | vacío → {}; `newest = max(s.updated)`; si `newest in _REQ_CACHE` → devuelve {sid: n} para las pedidas · SQL: `SELECT p.session_id AS sid, COUNT(*) AS n FROM part p JOIN message m ON m.id = p.message_id WHERE p.data LIKE '%"type":"text"%' AND m.data LIKE '%"role":"assistant"%' GROUP BY p.session_id` · cachea por newest; devuelve {sid: n} para las sesiones pedidas (0 si ausente) |
| `aggregate(sessions, keyfn)` | defaultdict `{input:0, output:0, reasoning:0, cache_read:0, cache_write:0, cost:0.0, n:0}`; acumula TOKEN_FIELDS + cost + n |
| `totals(sessions)` | `{input, output, reasoning, cache_read, cache_write, cost}` suma |
| `by_model(top=15)` | aggregate por model; sort cost desc [:top] |
| `by_project(top=15)` | aggregate por `names.get(project_id, project_id or "(sin proyecto)")`; sort cost desc [:top] |
| `by_day(top=60)` | aggregate por `fromtimestamp(created/1000).strftime("%Y-%m-%d")` (LOCAL); sort clave desc [:top] |
| `by_month()` | idem "%Y-%m"; sort clave desc, sin top |
| `top_sessions(top=40)` | sort cost desc [:top] |
| `stats(sessions, totals)` | vacío → {}; `{sesiones: len, modelos: len(set model), costo_medio_sesion: sum/len, costo_max_sesion: max, costo_min_sesion: min, input_medio_sesion: totals.input/len, primera: min(created), ultima: max(updated), sesion_mas_cara: max(cost), sesion_mas_tokens: max(input+cache_read)}` |

---

## 5. opencode_stats/pricing.py (145 L)

### Constantes
| Símbolo | Detalle |
|---|---|
| `OVERRIDES_PATH` | frozen → `%LOCALAPPDATA%\OpenCodeStats\pricing_overrides.json`; dev → `data/pricing_overrides.json` |
| `PRICES` | dict[str, {in, out, cr, cw}] — 18 modelos (ver código real L18-36): grok-4.5 (2.00/6.00/0.30/0.00), gpt-5.6-luna (0.20/1.20/0.02/0.25), glm-5.2 y glm-5.1 (1.40/4.40/0.26/0.00), kimi-k3 (3.00/15.00/0.30/0.00), kimi-k2.7-code (0.95/4.00/0.19/0.00), kimi-k2.6 (0.95/4.00/0.16/0.00), mimo-v2.5 (0.14/0.28/0.0028/0.00), mimo-v2.5-pro (0.435/0.87/0.003625/0.00), minimax-m3 (0.30/1.20/0.06/0.00), minimax-m2.7 y m2.5 (0.30/1.20/0.06/0.375), qwen3.7-max (2.50/7.50/0.50/3.125), qwen3.7-plus (0.40/1.60/0.04/0.50), qwen3.6-plus (0.50/3.00/0.05/0.625), deepseek-v4-pro (0.435/0.87/0.003625/0.00), deepseek-v4-flash (0.14/0.28/0.0028/0.00), hy3 (0.14/0.58/0.035/0.00) |
| `LIMITS` | dict[str, (5h, semana, mes)] — 17 modelos (ver código L38-55) |
| `MODEL_NAMES` | dict[str, str] — 18 nombres legibles (L57-65) |
| `WINDOWS_MS` | `{"5h": 5*3600_000, "semana": 7*24*3600_000, "mes": 30*24*3600_000}` |

### Funciones
| Símbolo | Firma / Detalle |
|---|---|
| `estimate_cost(tokens, model_id)` | sin precio → None; `reasoning` se factura como OUTPUT: `input/1e6*in + (output+reasoning)/1e6*out + cache_read/1e6*cr + cache_write/1e6*cw` |
| `usage_by_window(sessions, requests, now_ms=None)` | `now = now_ms o max(s.updated)` (0 si vacío); por modelo `{5h: n, semana: n, mes: n}` — `age = now - s.created`; suma `requests[s.id]` si `age <= window` |
| `quota_status(model_id, used, limit)` | limit None → None; used≥limit → "AGOTADO"; pct≥70 → "{:.0f}%"; else "OK" |
| `_apply_overrides()` | lee OVERRIDES_PATH JSON {prices, limits, names}; fusiona: `PRICES[mid]=v`, `LIMITS[mid]=tuple(v)`, `MODEL_NAMES[mid]=v`; FileNotFound/JSONDecode → no-op. Se ejecuta AL IMPORTAR |
| `save_overrides(prices, limits, names)` | escribe `{prices, limits: list(v), names}` (indent=1, ensure_ascii=False) + actualiza los 3 dicts en memoria; retorna Path |

---

## 6. opencode_stats/admin.py (617 L) — ÚNICA capa de escritura

### Constantes
| Símbolo | Valor |
|---|---|
| `BACKUP_DIR` | frozen → `%LOCALAPPDATA%\OpenCodeStats\backups`; dev → `backups/` |
| `_DESTRUCTIVE` | {"delete", "move", "prune", "rename", "archive", "restore"} |
| `_ROUTE_EVENT_TYPES` | ("session.created.1", "session.updated.1") |
| `_EVENT_W_CACHE` | `{max_time_updated: {sid: (n_events, bytes)}}` |

### Funciones
| Símbolo | Firma / Detalle |
|---|---|
| `_rw()` | FileNotFoundError si no existe; URI `file:{path}?mode=rw`; `timeout=5`; `PRAGMA busy_timeout=5000`; `PRAGMA foreign_keys=ON` |
| `opencode_running()` | nt → `tasklist /FO CSV` (timeout 10, CREATE_NO_WINDOW); else `ps -e -o comm=`; `any("opencode" in line.lower())`; excepción → False |
| `_guard(action, force)` | si `action in _DESTRUCTIVE and not force and opencode_running()` → `PermissionError("opencode está corriendo — las operaciones destructivas están bloqueadas. Cerrá opencode o usá force=true si sabés lo que hacés.")` |
| `_session_row(con, sid)` | `SELECT * FROM session WHERE id=?` → dict \| None |
| `_snapshot_session(con, sid)` | `{session: row, messages: [..], parts: [..], todos: [..], exported_at: isoformat(seconds)}` — mensajes/parts/todos por session_id |
| `_save_backup(action, snapshots)` | mkdir BACKUP_DIR; archivo `{YYYYMMDD-HHMMSS}-{action}.json` (indent=1, ensure_ascii=False) + `last.json` `{path, action, at: isoformat(seconds)}` |
| `list_backups()` | `{backups: [{name, path, size_mb: round(st_size/1e6,2), mtime: int(st_mtime*1000)}] top 50, last: {path, action, at}}` (sin last.json en la lista; last_info None si corrupto) |
| `_count_delete(con, sid)` | `{session, messages: COUNT message, parts: COUNT part, todos: COUNT todo, events: COUNT event, events_mb: round(SUM(LENGTH(data))/1e6, 2)}` (b None→0) |
| `_do_delete(con, sid)` | DELETE part, message, todo, session_message, session_input, session_context_epoch (por session_id); para `session_share` (y session_input de nuevo): si `PRAGMA table_info` tiene session_id → DELETE; DELETE session; DELETE event (aggregate_id); DELETE event_sequence (aggregate_id) |
| `delete_sessions(ids, dry_run, force)` | `_guard("delete", force)`; dedup preserve-order; vacío → `{dry_run, deleted: 0, rows: []}`; `plan = [_count_delete]`; dry_run → `{dry_run: True, deleted: 0, rows, total_events_mb: round(Σ,2)}`; real → `_snapshot_session` c/u + `_save_backup("delete")` + `_do_delete` c/u + commit → `{dry_run: False, deleted: len, rows, backup: str(path), total_events_mb}` |
| `_project_id_for(con, directory)` | `SELECT id FROM project WHERE worktree=?` → id si existe; sino `git -C dir rev-list --max-parents=0 --all` (timeout 10, stderr DEVNULL, CREATE_NO_WINDOW) → primera línea no vacía; sino `sha1(normcase(directory).encode())` hexdigest |
| `_ensure_project(con, directory)` | pid = _project_id_for; si no existe → INSERT project (id, worktree, name=basename o pid, sandboxes="[]", time_created=now, time_updated=now); `INSERT OR IGNORE INTO project_directory (project_id, directory, type, time_created) VALUES (?,?, 'main', now)` |
| `_patch_route_events(con, sid, directory, path, pid)` | para `session.updated.1`: último por seq DESC; `session.created.1`: primero por seq ASC; si no existe → skip; `UPDATE event SET data = json_set(data, '$.info.directory', ?, '$.info.path', ?, '$.info.projectID', ?) WHERE id=?` |
| `move_sessions(ids, directory, dry_run, force)` | `_guard("move", force)`; dedup; `directory = os.path.abspath`; vacío/!dir → `{error}`; `not isdir` → `{error: "La ruta no existe: ..."}`; dry_run → `{dry_run: True, moved: 0, target, project_id: _project_id_for}`; real → snapshots + `_save_backup("move")` + `_ensure_project` + por sesión: `UPDATE session SET project_id=?, directory=?, path='', time_updated=? WHERE id=?` + `_patch_route_events(sid, directory, "", pid)`; commit → `{dry_run: False, moved, target, project_id, backup}` |
| `rename_session(sid, title, dry_run, force)` | `_guard("rename", force)`; título vacío → `{error}`; no existe → `{error}`; dry_run → `{dry_run: True, title: strip}`; real → `UPDATE session SET title=?, time_updated=?` + commit |
| `archive_sessions(ids, archived, dry_run, force)` | `_guard("archive", force)`; dedup; `val = now si archived sino None`; dry_run → `{dry_run: True, affected: len}`; real → `UPDATE session SET time_archived=?, time_updated=? WHERE id IN (?,...)` + commit |
| `prune_sessions(cutoff, dry_run, force)` | `_guard("prune", force)`; `cutoff_ms = db._parse_date(cutoff)`; `SELECT id FROM session WHERE time_created < ? AND time_updated < ?`; sin ids → `{dry_run, deleted: 0, rows: [], cutoff}`; sino `delete_sessions(ids, dry_run, force)` |
| `export_sessions(ids)` | dedup; snapshots; skip inexistentes; vacío → `{error: "No se encontraron sesiones"}`; `{sessions: {sid: snap}}` |
| `_restore_one(con, snap)` | sin session → False; existe → False (no pisa); `now`; `pid = s.project_id or "global"`; si project falta → INSERT OR IGNORE project (id, worktree=directory o pid, name=basename, sandboxes="[]", now, now); por cada entidad: `cols = PRAGMA table_info(table)`; `data = {k: v for k in cols if k in s}`; message/part: `setdefault session_id = s.id`; INSERT dinámico (message: INSERT, part: INSERT, todo: INSERT OR IGNORE); True |
| `restore_session(backup_path, dry_run, force)` | `_guard("restore", force)`; no existe → `{error}`; `data = json.loads` (list o single); plan: `[{session, title, exists, messages: len, parts: len}]`; dry_run → `{dry_run: True, rows, backup}`; real → `_restore_one` c/u (conteo) + commit → `{dry_run: False, restored, backup}` |
| `session_detail(sid)` | fila o `{error}`; `project = SELECT name, worktree FROM project WHERE id=?`; `parts_by_type = SELECT json_extract(data, '$.type') AS typ, COUNT(*) AS n, SUM(LENGTH(data)) AS b FROM part WHERE session_id=? GROUP BY typ ORDER BY b DESC`; `events = COUNT(*), SUM(LENGTH(data))`; `message_samples = SELECT id, time_created, length(data) AS bytes, substr(data, 1, 80) AS head FROM message WHERE session_id=? ORDER BY time_created ASC LIMIT 20`; `model = json.loads(s.model).get("id") si parseable sino raw`; respuesta: `{id, title, model: model or s.model, project: dict|None, directory, created, updated, archived, cost, tokens: {tokens_input, tokens_output, tokens_reasoning, tokens_cache_read, tokens_cache_write}, share_url, messages: len(msgs), message_samples, parts_by_type, events: n, events_mb: round(b/1e6, 2)}` |
| `get_pricing()` | `{prices: PRICES, limits: {k: list(v)}, names: MODEL_NAMES}` |
| `save_pricing(prices, limits, names)` | valida tipos dict; cada price con in/out/cr/cw → ValueError; `pricing.save_overrides(...)` → `{saved: True, path, models: len(prices)}` |
| `full_backup(dest=None)` | candidates: `D:/opencode-backup`, `~/opencode-backup`, `BACKUP_DIR/full` (primero existente o con parent existente, sino último); mkdir; `target = dest_dir/opencode.db`; `src = connect mode=ro`; `src.backup(dst)` (API SQLite) + commit; borra `target-wal`/`target-shm`; `{path, size_mb: round/1e6, 1}` |
| `vacuum()` | `before = DB_PATH.stat().st_size/1e6`; `_rw().execute("VACUUM")`; `after`; `{before_mb: round(1), after_mb: round(1)}` |
| `event_weights(sessions)` | vacío → {}; `newest = max(updated)`; si no en `_EVENT_W_CACHE`: `SELECT aggregate_id AS sid, COUNT(*) AS n, SUM(LENGTH(data)) AS b FROM event GROUP BY aggregate_id` → `{sid: (n, b or 0)}`; devuelve `{s.id: cached.get(id, (0,0))}` |
| `status()` | `size = DB_PATH.stat().st_size si existe sino 0`; `wal = DB_PATH+"-wal"` size; `free = shutil.disk_usage(parent).free si existe sino 0`; `projects = SELECT id, name, worktree FROM project ORDER BY name`; `page_count = PRAGMA page_count`; `{opencode_running, db_mb: round(size/1e6,1), wal_mb: round(wal/1e6,1), free_gb: round(free/1e9,1), page_count, projects: [{id, name, worktree}]}` |
| `ACTIONS` | {"delete": delete_sessions, "move": move_sessions, "rename": rename_session, "archive": archive_sessions, "prune": prune_sessions, "export": export_sessions, "backup": full_backup, "vacuum": vacuum, "restore": restore_session, "pricing_save": save_pricing} |
| `dispatch(action, body)` | desconocida → ValueError; restore → `(backup_path, dry_run, force)`; pricing_save → `(prices, limits, names)`; delete/export → `(ids or [], dry_run, force)`; move → `(ids, directory, dry_run, force)`; archive → `(ids, bool(archived), dry_run, force)`; prune → `cutoff = body.cutoff` (vacío → ValueError "Falta la fecha de corte (cutoff=YYYY-MM-DD)") → `(cutoff, dry_run, force)`; rename → `(id, title, dry_run, force)`; backup → `(dest)`; vacuum → `()` |

---

## 7. static/ — contrato del frontend (SE MANTIENE IGUAL; el server Rust debe servirlo y respetar la API)

### index.html (166 L)
- `<html lang="es" class="dark">`; favicon inline SVG; `vendor/tailwind.js`; `app.css`; tema único (dark fijo).
- Header: título, `#dbBadge`, `#status`, `#btnPrefs` (⚙), `#btnExport` (Exportar CSV), `#btnRefresh` (Actualizar).
- Filtros: `#fSince` (date), `#fUntil` (date), `#fModel` (text), `#btnApply`, `#btnRange24/7/30/Month`, `#chkAuto`, `#autoInfo`.
- `#cards` (grid 3→6); `#tabs`; paneles: `#panel-resumen` (`#todayBox`, 4 divs `data-chart="days|requests|tokens|models"` con canvas `#chartDays/#chartRequests/#chartTokens/#chartModels`, `#statsBox`), `#panel-modelo/proyecto/dia/mes` (tablas `#th-X/#tb-X`), `#panel-sesiones` (`#sesionesCount`, `#th-sesiones/#tb-sesiones`), `#panel-limites` (`#th-uso/#tb-uso`, `#th-precios/#tb-precios`), `#panel-gestion` (`#adminBanner`, botones `#btnAdminRefresh/Delete/Move/Rename/Archive/Export/Undo/Pricing/Prune/Backup/Vacuum`, `#adminInfo`, `#adminSearch`, `#chkGroup` "Agrupar por proyecto", `#th-admin/#tb-admin`, `#adminDialog`).
- `#loadingOverlay` (`#loadingText`), `#prefsDialog`; scripts: vendor/chart.js, app.js, admin.js.

### app.css (99 L)
- `.tbl` (bg #141a24, border #1e293b, rounded 12, th bg #11161f, filas pares rgba(148,163,184,.04)), scrollbar, calendar-picker invert, `.overlay` (fixed, pointer-events none, blur), `.spinner` 44px, `.spinner-sm` 13px (ambos `ocspin` 0.8s), tema único: `body` negro #000, mono "Cascadia Mono", overrides `body .bg-[#141a24]→#161616`, `body .bg-[#0b0e14]→#0a0a0a`, `body .bg-[#11161f]→#1a1a1a`, `body .bg-slate-800→#242424`, `body .bg-slate-700→#333333`, `body .border-slate-800→#262626`, `body .border-slate-700→#3a3a3a`, `body .border-slate-800\/60→rgba(38,38,38,.6)`, `body .text-white→#fff`, `body .text-slate-200→#ededed`, `body .text-slate-300→#d4d4d4`, `body .text-slate-400→#a3a3a3`, `body .text-slate-500→#737373`, `body .hover\:bg-slate-800\/40:hover→rgba(255,255,255,.07)`, `body .bg-blue-950\/40→rgba(37,99,235,.18)`, `.tbl` overrides, `#loadingOverlay rgba(0,0,0,.85)` — TODO con !important.

### app.js (507 L) — contrato de datos consumido
- `state` = {data, charts, activeTab, scopes, searchSes, prefs}; `PREF_DEFAULTS` (cards/charts/tabs); prefs en `localStorage.oc_prefs`; `oc_theme` ya no se usa.
- Scopes fetch: `/api/data?since&until&model&scope=summary|modelo|proyecto|dia|mes|sesiones|limites|usage`; `load()` carga summary + dispara `fetchScope("usage")` en segundo plano; `state.scopes` dedupe.
- Campos consumidos del payload: `d.meta.{sessions,models,since,until,avg_cost,db}`, `d.totals.{input,output,reasoning,cache_read,cache_write}`, `d.cost`, `d.est_total`, `d.stats.{input_medio,mas_cara.{cost,title,model},mas_tokens.{title,model}}`, `d.today.{cost,requests,input,output,sessions}`, `d.days[].{day,cost}`, `d.days_requests[].{day,requests}`, `d.days_tokens[].{day,tokens}`, `d.models_chart[].{model,cost}`, `d.by_model[].{model,sessions,requests,input,output,cache_read,cache_write,est}`, `d.by_project|by_day|by_month[].{key,sessions,input,output,reasoning,cache_read,cache_write,cost}`, `d.sessions[].{title,model,start,input,output,cache_read,cost}`, `d.limits[].{model,u5h,u7d,u30d,l5h,l7d,l30d}`, `d.prices[].{model,in,out,cr,cw}`.
- `exportCsv` → CSV de la pestaña activa (CSV_MAP: modelo→by_model/modelo; proyecto→by_project/generico; dia; mes; sesiones→sessions/sesiones; limites→limits/uso).
- Auto-refresh 45 s si `#chkAuto` y tab visible.

### admin.js (696 L) — API de gestión consumida
- GET: `/api/admin/status` → {opencode_running, db_mb, wal_mb, free_gb, page_count, projects:[{id,name,worktree}]} (usa: db_mb, wal_mb, free_gb, opencode_running, projects).
- GET: `/api/admin/sessions` → {sessions: [{id,title,model,project,directory,archived,created,updated,input,output,cost,events,events_mb}]} — usa: directory (agrupado por ruta), project, updated (orden último uso), events_mb, events, cost, title, model, created, archived, id.
- GET: `/api/admin/backups` → {backups:[{name,path,size_mb,mtime}], last:{path,action,at}}.
- GET: `/api/admin/pricing` → {prices, limits (listas), names}.
- GET: `/api/admin/session/{id}` → detalle (usa: id,title,model,project,directory,created,updated,archived,cost,tokens,share_url,messages,message_samples,parts_by_type,events,events_mb).
- POST `/api/admin` {action: delete|move|rename|archive|prune|export|backup|vacuum|restore|pricing_save, ids, directory, archived, cutoff, title, id, backup_path, dest, prices, limits, names, dry_run, force} → respuesta con campos por acción (deleted, moved, affected, restored, backup, target, project_id, rows, total_events_mb, saved, path, models, before_mb, after_mb, dry_run, error). Error bloqueado: `{error, blocked: true}` status 403.
- UI: selección shift/ctrl, agrupado por ruta (grupos colapsables con checkbox select-all), sort por columnas, search, dblclick → detalle, deshacer (last.json), precios (editor), prune con estimación, backup completo, VACUUM, forzar (force) cuando opencode corre.

---

## 8. tests/ (port obligatorio)

### conftest.py
- `SCHEMA`: 13 tablas — project (id PK, worktree NOT NULL, vcs, name, sandboxes NOT NULL '[]', time_created, time_updated); session (29 cols: id PK, project_id NOT NULL, workspace_id, parent_id, slug NOT NULL, directory NOT NULL, path, title NOT NULL, version NOT NULL, share_url, summary_additions/deletions/files, summary_diffs, metadata, cost REAL NOT NULL 0, tokens_input/output/reasoning/cache_read/cache_write INTEGER NOT NULL 0, revert, permission, agent, model, time_created, time_updated, time_compacting, time_archived); message (id PK, session_id NOT NULL, time_created, time_updated, data NOT NULL); part (id PK, message_id NOT NULL, session_id NOT NULL, time_created, time_updated, data NOT NULL); todo (session_id, content, status, priority, position, times, PK(session_id, position)); session_message (id PK, session_id, type, seq, times, data); session_input (id PK, session_id, prompt, delivery, admitted_seq, promoted_seq, time_created); session_context_epoch (session_id PK, baseline, snapshot, baseline_seq); project_directory (project_id, directory, type, strategy, time_created, PK(project_id, directory)); event_sequence (aggregate_id PK, seq, owner_id); event (id PK, aggregate_id, seq, type, data).
- `SESSION_COLS = 29`; `_seed(con)`: project p1 'G:/proy'/'Proy'; s_old (90 días atrás, model deepseek-v4-flash, cost 1.5) y s_new (hace 1h, gpt-5.6-luna, cost 3.2) con 1 message + 1 part + event_sequence(seq 2) + 3 events (session.created.1 seq0, session.updated.1 seq1, message.updated.1 seq2).
- fixture `tmp_db`: DB en tmp_path; monkeypatch db.DB_PATH, admin.opencode_running→False, admin.BACKUP_DIR→tmp/backups.

### test_admin.py — 13 tests (nombres + asserts clave)
1. `test_delete_dry_run` — rows[0].messages==1, parts==1, events==3; DB intacta.
2. `test_delete_removes_all` — deleted==1, backup existe; session/message/part/event/event_sequence=0; s_new intacta.
3. `test_delete_blocked_when_opencode_running` — raises PermissionError (aún en dry_run).
4. `test_move_updates_session_and_events` — moved==1; session.project_id/directory actualizados; eventos created/updated parcheados (info.directory, info.projectID); project_directory insertado.
5. `test_prune_only_closed` — cutoff -30d → solo s_old; deleted==1.
6. `test_restore_roundtrip` — delete → list_backups.last → restore → título/directorio y message/part restaurados.
7. `test_restore_does_not_overwrite` — (test trivial; sin backups previos → error claro).
8. `test_session_detail` — title, messages==1, events==3, model=="deepseek-v4-flash".
9. `test_pricing_override_save_load` — save_overrides con modelo nuevo → PRICES/LIMITS/MODEL_NAMES actualizados; recarga (importlib.reload + _apply_overrides) persiste.
10. `test_estimate_cost_and_usage` — estimate 1e6/1e6 flash ≈ 0.42; modelo inexistente → None; usage_by_window 5h==5.
11. `test_payload_full` — meta.sessions==2; by_model/limits/today presentes.
12. `test_payload_scope_summary_is_light` — sin by_model/limits; today.requests is None (sin scan).
13. `test_payload_scope_modelo` — by_model presente, totals ausente.

---

## 9. stats-watch.py
- `API = "http://127.0.0.1:8765/api/data?raw=1"`, `REFRESH = 5`.
- `fetch()` — GET 5 s timeout → JSON.
- `cost(n)` — idéntico a server._cost.
- `render(d)` — header con hora; Sesiones/Modelos/Rango; TOKENS in/out/reasoning/cache_r/cache_w; COSTO total/estimado/hoy (days con day==hoy)/últimos 7d (sum days[-7:]); TOP MODELOS (6): `{:<22} ses={:<4} in={:>7} out={:>7} cost={:>9}`; ULTIMAS SESIONES (6): `{:<40} {:<14} in={:>7} cost={:>8}`.
- `main()` — loop: fetch → `cls` → render; error → mensaje sin conexión + hint `.\start-stats.bat`; KeyboardInterrupt → exit.

---

## 10. tools/make_icon.py
- Constantes: SS=4 supersampling; BG_TOP=(13,20,32), BG_BOT=(24,34,54), RING=(51,65,85), BARS=[((79,141,249),(37,99,235)), ((74,222,128),(22,163,74)), ((251,191,36),(217,119,6))], BAR_W=30, BAR_GAP=12, BASE_Y=220, RADIUS=15, BAR_H=[120,168,96], BOX 8..248, CORNER=52.
- `lerp`, `in_rounded`, `render(size)` (px RGBA, downsample box 4x4), `write_png` (zlib compress 9), `write_ico` (BMP 16/32/48 + PNG 256, struct LE), `bmp_entry` (40-byte BITMAPINFOHEADER + BGRA bottom-up + AND mask), `main()` → assets/icon-256.png, assets/icon.ico, opencode_stats/icon.py (ICON64_B64 = base64 PNG 64).

---

## 11. Env / config / gotchas (no olvidar)
- Env: `OPENCODE_DB`, `OPENCODE_STATS_PORT`, `OPENCODE_STATS_HOST` (no usado), `OPENCODE_STATS_HIDE_WINDOW`, `OPENCODE_STATS_NO_BROWSER`, `USERPROFILE`/`HOME` (crítico en exe/servicios).
- `Path.home()` falla en servicios → `_home()`.
- `get_request_counts()` ~4 s; caché keyed por max(time_updated); NO "optimizar" por sesión sin mantener semántica.
- `event_weights` mismo patrón de caché.
- `until` inclusivo (+86_399_999 ms).
- `session.model` = JSON `{"id": ...}` → `_model_id()`.
- Fechas SIEMPRE hora local naive (sin timezone).
- JSON `ensure_ascii=False` en backups/payload.
- Mover sesión = UPDATE session + parche json_set en eventos route; borrar = proyecciones + event_sequence (espejo de EventV2.remove()); restore no reinserta eventos → resume/share rotos (avisar en UI).
- Backups en `backups/` (gitignored) + `last.json` (Deshacer).
