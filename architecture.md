# Architecture — opencode-remote-android

> Documento vivo que describe todo el monorepo: qué es cada carpeta, cómo se conectan,
> decisiones arquitectónicas tomadas y estado real del código (verificado en disco al
> 2026-08-20). Para reglas de contribución ver `AGENTS.md`; para catálogo de funciones
> ver `CATALOGO.md`; para knowledge graph histórico ver `project-knowledge.md`.

---

## 1. Visión general

**OpenCode Mobile** es un ecosistema para usar [OpenCode](https://opencode.ai) (agente
de código IA) de forma remota:

```
┌─────────────────────┐        ┌──────────────────────────────────────────┐
│  📱 Teléfono / 🖥️   │        │  🖥️ PC (Windows)                         │
│  web/ (React 19)    │◄──────►│  · opencode serve v1  → 0.0.0.0:4096     │
│  empaquetado en:    │Tailscale  opencode2 (beta v2) → 0.0.0.0:4097     │
│  · APK Capacitor    │ o LAN  │  · desktop-app.exe    → 127.0.0.1:4848   │
│  · desktop-app Rust │  HTTP  │    └─ embebe opencode-stats → :8765      │
└─────────────────────┘        └──────────────────────────────────────────┘
```

- **Un solo frontend** (`web/`) sirve a tres superficies: APK Android (Capacitor),
  IPA iOS (Capacitor) y app de escritorio Windows (shell Rust con WebView2).
- El cliente es **thin client**: no corre modelos ni tools; todo lo delega al server
  opencode remoto vía REST + SSE.
- El acceso remoto se resuelve con **Tailscale** (VPN mesh); no hay puertos abiertos
  en el router ni túnel propio (el túnel WebRTC fue eliminado, ver §8).

### Mapa del monorepo

| Carpeta | Qué es | Estado |
|---|---|---|
| `web/` | Frontend React 19 + Vite + TS + Capacitor (Android/iOS). **El producto central** | Activo |
| `desktop-app/` | Shell de escritorio Windows en Rust (wry + tiny_http) que embebe `web/dist` | Activo |
| `opencode-stats/` | Server de estadísticas en Rust: lee `opencode.db` read-only, UI web local | Activo |
| `od-web/` | Copia vendorizada de **OpenDesign** (nexu-io), proyecto ajeno en integración temprana | Vendored, aislado |
| `dist-desktop/` | Output de empaquetado (`build-desktop.ps1`): exe + web-dist | Build artifact |
| `marketing/` | Assets de stores (Play Store, App Store, thumbs de GitHub README) | Activo |
| `docs/` | Solo `perf-architecture.md` (análisis de performance server+app) | Activo |
| `.opencode/` | Config local de opencode + knowledge graphs de repos externos | Local |
| `%SystemDrive%/` | **Basura**: jerarquía vacía creada por variable sin expandir en PowerShell | A eliminar |
| ~~`tunnel/`~~ | Túnel WebRTC en Go | **Eliminado** (commit `274fd81d`) |
| ~~`signaling-worker/`~~ | Worker Cloudflare de señalización WS | **Eliminado** (commit `274fd81d`) |
| ~~`desktop-agent/`~~ | Agente Go de escritorio remoto (MJPEG + input) | **Eliminado** del repo |

Workspace Cargo raíz (`Cargo.toml`): `members = ["desktop-app", "opencode-stats"]`,
release con `strip + lto + codegen-units=1`. No hay `package.json` raíz: cada proyecto
JS gestiona sus propios deps (web usa pnpm 10.32, od-web pnpm 10.33 aislado).

---

## 2. `web/` — el producto central

### 2.1 Stack

- React **19.2.8** (+ react-compiler-runtime, babel-plugin-react-compiler), TypeScript **7.0.2**, Vite **8**, Vitest 4.
- Capacitor **8.5** (core/android/ios) + plugins: speech-recognition, app, camera, dialog, filesystem, local-notifications, network, share.
- Markdown: react-markdown + remark-gfm + highlight.js/lowlight. Terminal: @xterm/xterm 6 (+fit/webgl). Virtualización: @tanstack/react-virtual. QR: jsqr.
- Sin librería de estado global: estado en hooks + Context (decisión deliberada).
- Estilos: CSS propio (~17 archivos en `src/styles/`: tokens, base, layout, chat, composer, modals, settings, desktop…), 30+ temas runtime vía CSS variables.

### 2.2 Arquitectura: FSD + Hexagonal **en migración**

Estructura objetivo (reglas en `AGENTS.md`, flujo unidireccional
`app → pages → widgets → features → entities → shared`):

```
web/src/
├── app/            # Composition root — PLACEHOLDER (vacío)
├── pages/          # desktop-workspace, mobile-chat, settings — PLACEHOLDERS (null)
├── widgets/        # desktop-shell, nav-shell, session-workspace — PLACEHOLDERS (null)
├── features/       # chat (IMPLEMENTADO hexagonal), edit-file, manage-sessions,
│                   # quick-chat, run-terminal (scaffolds)
├── entities/       # agent, config, file, message, session, ui — modelos puros + tests
├── shared/         # api/{client,version,mappers}, sse/{client,handler}, storage, ui, lib, config
├── components/     # ~80 componentes UI reales (legado, aún activos)
├── hooks/          # 41 hooks (legado, aún activos)
└── i18n/           # en, es, it, zh
```

**Estado real de la migración** (commits recientes):

- ✅ `shared/api` extraído de `api.ts` (1119→636 líneas) — 174 tests.
- ✅ `shared/sse` + `features/chat` hexagonal (domain/application/ports/infrastructure) — 96 tests.
- ✅ `entities/*` extraídos de `types.ts` (barrel) — 262 tests. `types.ts` hoy es solo barrel.
- ✅ `utils/*` — 254 tests.
- ⏳ `app/`, `pages/`, `widgets/` son placeholders; **`src/App.tsx` sigue siendo el God
  Component (~3.600 líneas)** con ~40 hooks y ~25 componentes wired a mano.
- ⏳ Routers Rust del desktop-app scaffoldeados pero vacíos (ver §3).

Conviven entonces dos generaciones: la legacy funcional (`App.tsx` + `components/` +
`hooks/`) y la nueva estructura FSD parcialmente poblada. Los usecases/adapters de
`features/chat` ya envuelven `api.*` tras el puerto `IMessageRepository`.

### 2.3 Capa API (`src/api.ts` → `shared/api/`)

`api.ts` es un **facade delgado** que re-exporta:

- **`shared/api/client.ts`** — transporte dual: `CapacitorHttp.request()` en nativo
  (connectTimeout 12s, readTimeout configurable, 1 retry) y `fetch` + AbortController
  en web. Auth Basic (`Basic base64(user:pass)`). Contabilidad de consumo de datos
  (`recordDataUsage`). `fetchFileBytes` con blob nativo vs arrayBuffer.
- **`shared/api/version.ts`** — detección automática del dialecto del server:
  - v1: rutas raíz (`/session`, `/event`, `/config/providers`…).
  - v2 (opencode2 beta): rutas `/api/*`, respuestas envueltas `{data:...}`, renames
    (abort→`/interrupt`, summarize→`/compact`, status→`/session/active`, todo→no existe…).
  - Cache memoizado por host + promesas deduplicadas; `getApiVersion` async /
    `resolveApiVersion` sync / override manual en Settings (Auto/v1/v2).
  - Health probe: `/global/health` (v1) con fallback `/api/health` (v2).
- **`shared/api/mappers.ts`** — `toSessionV1`, `toMessageEnvelopeV1`
  (content[]→parts[], time created/completed→start/end), mapProviderModels…

### 2.4 Tiempo real: SSE + Polling

- **`useSSE.ts`** — SSE por `fetch`+reader (no EventSource, para poder mandar
  Authorization) a `/event` o `/api/event`. Watchdog de heartbeat con UN timer
  permanente (touch por evento; timeout → abort + reconnect backoff exponencial cap 30s).
  Filtro defensivo por sessionID (permite parts task/subagent del padre).
- **Eventos**: el type real va DENTRO del JSON (`{id,type,properties}`), nunca en la
  línea `event:`. En v1 fluyen `message.part.delta` (con `partID`; el tipo de part se
  resuelve con `partTypeCacheRef` alimentado por `message.part.updated`); en v2,
  `session.next.*` con body anidado en `data`.
- **`usePolling.ts`** — respaldo con backoff exponencial 1s→60s + jitter 30%. Mientras
  SSE está vivo, polling acelerado; en offline, el backoff se dispara lanzando desde
  el callback.
- **Modos de datos** (Full/Balance/Reduced/Miser): intervalo de polling (3.5s/15s/30s/60s),
  límite de mensajes iniciales (100/100/30/20), recorte de payload (sin audio/tools en
  Reduced, solo texto en Miser), detección automática WiFi↔celular. En no-full,
  `session.time.updated` sin cambios ⇒ se saltea el fetch de mensajes; al pasar a idle
  se usa refresh ligero + `listStatuses` (1 request) en vez del refresh completo (~21 req).

### 2.5 Mensajes y persistencia

- **`useMessages.ts`** (~850 líneas) — carga, envío, optimista, undo/redo, compact.
  `loadSelected` hace **merge incremental por id SIEMPRE**: solo reemplaza un mensaje
  cuando `time.completed` cambió (protege el texto streamed del clobber por polling);
  una respuesta parcial/vacía nunca encoge el historial. Sin tope de 500.
- **Mensaje optimista**: NO se remueve tras el send exitoso — la confirmación la hace
  `loadSelected` por match de texto (removerlo antes causa el bug "aparece tarde").
- **`useOfflineCache.ts`** — IndexedDB `opencode-mobile` **DB_VERSION = 2** (no bajar;
  el bump migra DBs viejas). Merge-only: `cacheMessages` lee-existe-mezcla-escribe la
  unión; `cacheSessions` upsert. Cifrado AES-GCM de textos (`utils/crypto.ts`, key en
  sessionStorage). Restauración offline si el server no responde.
- **Config**: localStorage + archivo externo `opencode-config.json` en Documents vía
  `persistentStorage.ts` (sobrevive reinstalaciones) + password cifrada.

### 2.6 Hooks destacados (de los 41)

| Hook | Rol |
|---|---|
| `useConfig` | Server config: load/save/test, descifrado, notice auto-dismiss |
| `useSessions` | CRUD sesiones, favoritos, archivadas, estados por directorio |
| `useMessages` / `useSSE` / `usePolling` | Ver §2.4–2.5 |
| `useAI` | Agentes/modelos; key GLOBAL `opencode.remote.agent` > por-directorio; nunca `primary[0]` ciego |
| `useSessionSidecar` | Dashboard de sesión: project, VCS, files, diff, todos |
| `useShell` | Cliente de la API `/shell/*` del desktop-app (terminal, FS, kanban…) |
| `useRemoteDesktop` | Reader MJPEG por fetch+blob para escritorio remoto (NO `<img>`: Chromium no manda Authorization en URL) |
| `useNetworkMode` / `useOfflineQueue` / `useMemoryCleanup` | Red, cola offline, limpieza en low-end |
| `useSpeechRecognition`, `useCompletionAudio`, `useNotifications` | Voz, sonido, push/local |
| `useBackButton`, `useFocusTrap`, `useDeepLink`, `useLocalStorage` | Plataforma/UI |

### 2.7 Componentes (~80)

Grupos funcionales: chat (`ChatView`, `Composer`, `MessageList/Bubble`, `ThinkingBlock`,
`ToolPart`, `Markdown`, `PlanBreakdown`, `QueuedPrompts`, `QuestionPrompt`,
`PermissionPrompt`), sesiones (`SessionList/Card/Toolbar`, `InlineRename`,
`FavoritesManager`, `ArchivedList`), archivos/git (`FileBrowser`, `FileEditor`,
`DiffViewer`, `InlineDiff`, `GitToolbar`, `ImageEditor`, `DocEditorPanel`),
escritorio (`RemoteDesktop`, `shellPanels`, `TabBar`, `QuickChatPanel`, `StatsView`,
`KanbanPanel`), infra UI (`BottomSheet`, `Modal*`, `ErrorBoundary`, `ContextMenu`,
`DropdownMenu`, `EmptyState`), settings (`SettingsPanel`, `ThemePicker/Creator`,
`DataModeSwitcher`, `ProviderManager`, `ServerProfileModal`, `ConnectProviderSheet`).

Componentes pesados van lazy (`lazyRetry` = lazy con auto-reload del chunk).

### 2.8 Escritorio remoto y shell de escritorio

- `components/RemoteDesktop.tsx` + `hooks/useRemoteDesktop.ts` — visor MJPEG con
  gestos (tap=click, long-press=click derecho, 2 dedos scroll/pinch), fit-to-screen
  con calidades Baja/Media/Alta, stats chip, selector de fuente con miniaturas.
  Cero tráfico si el modal está cerrado (abort + revoke de blobs).
  *Nota: el agente Go que capturaba pantalla (`desktop-agent/`) fue eliminado del repo.*
- `src/shell.ts` — cliente tipado de `/shell/*` (solo tiene sentido dentro del
  desktop-app): FS, PTY, kanban, docs, plugins, stats proxy, browser embebido.
- `src/desktop.ts` — detección `window.__OPENCODE_DESKTOP__` (inyectado por el shell Rust).

### 2.9 i18n, temas, proveedores

- `i18n/` — en/es/it/zh-TW. Keys nuevas SOLO en/en/es; it/zh-TW caen al inglés por
  fallback de `createTranslator`. Test `test:i18n` lo verifica.
- Temas: 30+ JSON en `public/themes/`, resueltos a CSS variables en runtime
  (`utils/resolveTheme.ts`), creator custom, test de contraste (`check:contrast`).
- `providers/` — cerebras, groq, opencodeGo: quick-chat directo a LLMs con API key
  propia (independiente del server opencode).

### 2.10 Empaquetado móvil

- `android/` — proyecto Gradle nativo (appId Capacitor). El build copia `web/dist` a
  `app/src/main/assets/public/` con `python scripts/copy-dist.py` porque
  `npx cap copy` falla con EPERM en `app-icon.png` (trampa conocida).
- `ios/` — proyecto Xcode; CI en Codemagic firma y publica.
- Firma Play Store: keystore externo (ver `PLAY-STORE.md`, no commiteado).

### 2.11 Tests y benchmarks

- Suites npm: `test` (vitest unit), `test:i18n`, `test:ui`, `test:settings`,
  `test:model`, `test:rendered`, `check:contrast`. Total ~800 tests nuevos del refactor
  (entities 262, shared/api 174, sse+chat 96, utils 254).
- `benchmarks/runner.mjs` — benchmarks de render/lógica con reporte.

---

## 3. `desktop-app/` — shell de escritorio Rust

### 3.1 Qué es

Binario Windows portable (`opencode-desktop`, crate `tiny_http` + `wry`/`winit` +
`tray-icon`) que:

1. Sirve la misma web app (`web/dist`) por HTTP local en `127.0.0.1:4848`
   (escanea hasta +200 puertos si está ocupado).
2. La muestra en una ventana nativa con **WebView2 como child** (no Tauri).
3. Expone capacidades nativas al frontend por REST `/shell/*` + WebSocket PTY.

Portable: todo el estado vive en `data/` junto al exe (config.json, kanban.json,
window-geometry.json, cache/, web-dist/, webview/). Autostart opcional por registro
HKCU Run. Tray icon con Abrir/Salir. Sin single-instance guard.

### 3.2 Arranque (`main.rs`, 537 líneas)

panic hook → log + MessageBoxW → carga config/persisted → server tiny_http (thread
por request → `api::route`) → resolve `web_dist_dir()` (env `OPENCODE_DESKTOP_DIST` →
`<exe>/data/web-dist` → `../../web/dist` dev) → arranca stats (`statsx::ensure`, :8765)
→ WebSocket PTY en puerto+1 (4849) → tray → event loop winit: ventana 1280×800
(geometría persistida con throttle 400ms) + WebView2 child con init script
`window.__OPENCODE_DESKTOP__ = true`.

Fallback WebView2: detecta runtime por registro; si falta, instala Evergreen
bootstrapper en background y abre la URL en el navegador del sistema (server/tray siguen vivos).

### 3.3 API HTTP (`src/api.rs`, 1370 líneas)

Todo bajo `/shell/*`, enrutado con cadena de `if path == ...` (**patrón prohibido por
AGENTS.md — la extracción a `infrastructure/http/*_router.rs` está scaffoldeda pero
vacía**). Grupos:

| Grupo | Rutas |
|---|---|
| Salud/config | `GET /shell/health`, `GET\|POST /shell/config`, `config/export\|import`, `GET\|POST /shell/autostart`, `GET\|POST /shell/session-state` |
| Filesystem | `/shell/fs/drives\|list\|read\|resolve\|session\|pick-folder\|favorites`, POST `delete\|copy\|write\|mkdir\|reveal\|exec` |
| Docs engine | `POST /shell/doc/convert\|save` (PDF↔MD↔DOCX: pdf-extract, lopdf, quick-xml, zip) |
| PTY | `GET /shell/pty`, `POST /shell/pty?shell=&cwd=`, `GET /shell/pty/{id}/buffer?since=`, POST `write\|resize`, DELETE |
| Kanban | `GET /shell/kanban`, POST/DELETE board, POST/PATCH/DELETE card (persistido en `data/kanban.json`) |
| Server manager | `GET /shell/server`, `POST /shell/server/start\|stop` (controla opencode serve) |
| Updates/docs | `GET /shell/updates?refresh=1` (feed GitHub+X cache 1h), `GET /shell/docs[\|/read]` |
| Stats | `GET /shell/stats`, `POST /shell/stats/start`, `GET /shell/stats/proxy/*` → proxy a :8765 |
| Plugins/Labs | `GET /shell/plugins[\|/running]`, `POST run`, `GET /shell/plugin/{name}/{rel}`, `/shell/labs` |
| Web search | `GET /shell/search?q=` (DuckDuckGo, top 3, cache 6h) |
| Proxy CORS | ANY `/shell/proxy?url=` (limpia CSP/framebusting, cap 16MB) |
| Browser embebido | `POST /shell/browser/open\|bounds\|visibility\|navigate\|close`, `GET url` (sub-WebView2 con UA Chrome, MemoryUsageLevel Low oculto) |

Al servir `index.html` **inyecta un `<script>`** que precarga
`localStorage["opencode.remote.server"]` con host/port/user/pass ⇒ la web app se
autoconecta sin configurar nada. SPA fallback a index.html + path-traversal guard.

### 3.4 WebSocket PTY (`ptyx.rs`)

Handshake RFC6455 manual (sha1+base64, sin librería WS) en puerto 4849. Terminal
`portable-pty` (pwsh7 default). Ring buffer 2MB por sesión con condvar. Frames
binarios chunked 16KB; comandos JSON `{cmd: attach|write|resize|kill}`. El buffer
persiste al ocultar/redimensionar la pestaña terminal.

### 3.5 Módulos

`state.rs` (config/persisted serde), `fsx.rs` (operaciones FS), `doc_engine.rs`
(conversión documentos, casi pura), `kanban.rs` (modelo Board/Column/Card + store),
`plugins.rs` (registry + labs), `updates.rs`, `srvman.rs` (gestor del server opencode),
`statsx.rs` (embebe el crate `opencode-stats` como lib y garantiza :8765),
`browser_view.rs` (sub-WebView), `common.rs`, `docsx.rs`.

**Tests: cero.** Nada es testeable unitariamente hoy (todo acoplado a tiny_http/I/O);
los scaffolds `domain/` e `infrastructure/http/` existen justamente para eso.

---

## 4. `opencode-stats/` — estadísticas de uso (Rust)

Crate `opencode-stats` v0.2.0 (edition 2024) — **port Rust del backend Python previo**
(inventario de migración en `docs/migracion-rust/00-inventario.md`; contratos JSON
mantenidos exactos). Miembro del workspace; consumido como **lib** por desktop-app.

- **Qué hace**: lee `opencode.db` (SQLite del server opencode) en **modo read-only**
  (`file:...?mode=ro`, seguro con WAL) y presenta tokens/costos/cuotas en una web
  local en `127.0.0.1:8765` con ventana propia (wry/WebView2) o headless.
- **Flujo de datos**: SELECT de tabla `session` (tokens, cost, model JSON) → request
  counts con **caché incremental** keyed por `max(time_updated)` → agregadores
  by_model/project/day/month/tool → pricing estático (18 modelos OpenCode Go) +
  overrides de `pricing_overrides.json` → cuotas 5h/7d/30d.
- **API**: `GET /api/data?scope=...` (payload completo o por scope: summary, modelo,
  proyecto, día, mes, sesiones, tools, límites), `GET /api/admin/status|sessions|
  backups|pricing|session/{id}`, `GET /api/go/usage` (proxy autenticado a
  opencode.ai/zen), `POST /api/admin` con acciones `delete|move|rename|archive|prune|
  export|backup|vacuum|restore|pricing_save|set_db` — **única capa de escritura**,
  bloqueada (403) si opencode está corriendo y siempre con snapshot JSON previo en
  `backups/` (deshacer vía `last.json`).
- **Frontend**: `static/` vanilla JS + Tailwind/Chart.js vendoreados (offline, sin
  build). Sidebar con filtros, tabs lazy con cache, export CSV, panel admin.
- **Bins extra**: `stats-watch` (monitor de terminal, refresh 5s), `make-icon`.
- **Tests**: ~44 (admin 15, db 13, payload 11, pricing 5) contra DB temporal schema-
  idéntica, nunca la real.
- **Integración**: desktop-app lo levanta in-process (`statsx::ensure` idempotente,
  probea `/api/data?raw=1`) y lo proxéa por `/shell/stats/proxy/*`; la web app lo
  embebe en un iframe desde `shellPanels.tsx` (o directo a :8765). Ojo:
  `hooks/useStats.ts` NO consume este server — es un contador local de localStorage.

---

## 5. `od-web/` — OpenDesign vendorizado

**Proyecto ajeno** al producto: copia de `github.com/nexu-io/open-design` v0.19.2
(Apache-2.0, "alternativa open-source a Claude Design"), vendorizada SIN `.git`
propio y commiteada en un único commit (`1af174e3`, ~12.810 archivos).

- **Stack incompatible a propósito**: Next.js 16 + React 18 + workspace pnpm aislado
  (vs React 19 + Vite del resto). Sin referencias desde `AGENTS.md` ni scripts raíz.
- **Contenido**: `apps/web` (Studio: chat con agente + preview sandboxeada),
  `apps/desktop|daemon|packaged|landing-page`, 16 packages (`host`, `dsh-runtime`,
  `plugin-runtime`, `contracts`, `sidecar`…), catálogo masivo de `design-systems/`
  (150+ marcas con DESIGN.md + tokens), `skills/` (tipo Claude SKILL.md),
  `plugins/`, extensión browser `clipper/`, `figma-plugin/`, `mocks/` (CLIs fake de
  agentes por replay), `native/registry-core` (crate napi Rust).
- **Plan de integración** documentado en `od-web/INTEGRATION.md`: port del daemon
  Express→Rust, panel OD dentro de desktop-app, xterm ya removido a favor de la
  terminal de opencode. Hoy **no hay conexión funcional** con el resto del monorepo.

---

## 6. Tooling raíz

| Script | Qué hace |
|---|---|
| `build-desktop.ps1` (y `.bat` wrapper) | `npm run build` en web/ → `cargo build --release` → empaqueta exe + `web/dist/*` en `dist-desktop/` (y `data/web-dist`). `-SkipWeb`, `-Run` |
| `deploy-apk.ps1` | build web → `copy-dist.py` → `gradlew assembleDebug` → sube APK a tmpfiles.org e imprime LINK. `-SkipBuild` = solo subir |
| `start-opencode-v2.bat` | Verifica `opencode2` en PATH, asegura config del servicio (port 4097, hostname 0.0.0.0) y lo arranca detached |
| `codemagic.yaml` | CI/CD: workflow iOS (mac_mini_m2, Xcode 16, firma + App Store Connect) y Android (assembleRelease, artifacts APK/AAB) |
| `.env` | Solo `usuario`/`contraseña` (gitignored) |

Regla crítica operativa: **nunca levantar servers/procesos largos desde el chat** —
usar `Start-Process`/scripts `.bat` detached; comandos >30s con timeout explícito.

---

## 7. Decisiones arquitectónicas (registro)

| # | Decisión | Racional |
|---|---|---|
| D1 | **Thin client**: toda la IA corre en el server remoto; la app solo pinta | El teléfono no tiene GPU/modelos; el server ya tiene el contexto del código |
| D2 | **SSE primario + polling respaldo**, con watchdog de heartbeat y backoff exponencial+jitter | SSE da streaming real; polling cubre cortes; jitter evita thundering herd |
| D3 | **4 modos de datos** (Full/Balance/Reduced/Miser) que recortan polling, payload y límites de historial | El consumo móvil era el problema #1; `time.updated` estable permite saltar fetches completos |
| D4 | **Cache offline IndexedDB merge-only** (nunca encoge) + restauración offline | Una respuesta parcial o un modo ahorrativo nunca deben destruir historial |
| D5 | **Detección automática v1/v2** del dialecto del server, memoizada por host | Soportar el server estable y la beta opencode2 sin forks del cliente |
| D6 | **Túnel WebRTC eliminado → Tailscale** (commit `274fd81d`) | Menos piezas propias (Go + CF Worker); Tailscale es NAT-traversal probado, IP estable, gratis ≤100 devices |
| D7 | **Un solo frontend para móvil y escritorio**: shell Rust mínimo que sirve `web/dist` y expone `/shell/*` | Reuso total de la UI; el shell aporta solo capacidades nativas (PTY, FS, docs, tray) |
| D8 | **WebView2 vía wry directo sobre winit** (no Tauri) | Control fino del event loop, sub-webviews, dependencias mínimas |
| D9 | **Stats como crate aparte read-only sobre `opencode.db`** | Cero interferencia con el server; admin con backups y bloqueo si opencode corre |
| D10 | **Python → Rust** para stats manteniendo contratos JSON exactos | Un solo runtime nativo con el desktop-app (lib compartida), sin Python en producción |
| D11 | **Refactor FSD + Hexagonal incremental** por fases, con baterías de tests por fase | Migrar sin big-bang: shared/api → sse+chat → entities → scaffolds; App.tsx God Component queda para el final |
| D12 | **Sin librería de estado global**; hooks + Context + CSS variables para temas | Alcance contenido; evita dependencia y boilerplate |
| D13 | **Vendorizar OpenDesign** (`od-web/`) con workspace aislado | Evaluar integración futura sin contaminar builds; riesgo de tamaño aceptado temporalmente |
| D14 | **Mensajes optimistas confirmados por match** (no se remueven tras el send) | Evita el parpadeo "el mensaje aparece cuando responde el asistente" |
| D15 | **MJPEG por fetch+blob** para escritorio remoto (no `<img>`) | Chromium no envía Authorization en URLs de imagen; blob reader permite headers y abort limpio |

---

## 8. Componentes eliminados (historial)

- **`tunnel/` + `signaling-worker/`** — túnel WebRTC Go + worker Cloudflare de
  señalización. Eliminados en `274fd81d` (2026-08-04) junto con `RemoteConnect`;
  reemplazados por la guía de Tailscale del README. `architecture.json` y partes de
  `AGENTS.md` aún los mencionan (desactualizados).
- **`desktop-agent/`** — agente Go standalone de escritorio remoto (captura GDI/
  PrintWindow MJPEG en :5901 + SendInput). Eliminado del repo; `RemoteDesktop.tsx` y
  su hook sobreviven en `web/src` esperando un backend equivalente.

---

## 9. Trampas conocidas (verificadas)

1. `npx cap copy` falla con EPERM en `app-icon.png` → usar `python web/scripts/copy-dist.py` + gradle aparte.
2. El server v1 emite SOLO deltas v1 (`message.part.delta`) en 1.18.x — no duplicar handlers v2 sin dedupe.
3. El type del evento SSE va dentro del JSON, no en la línea `event:`.
4. `refreshSessions` traga errores internamente; el backoff se dispara lanzando desde el callback cuando `connectionState === "offline"`.
5. No bajar `DB_VERSION` de IndexedDB (2); el bump migra instalaciones viejas.
6. `deploy-quick.ps1` oculta errores con `Out-Null` — debuggear con pasos individuales.
7. En v2, prompt rechaza model/agent en el body (400) — son por-sesión.
8. Elementos hover-only necesitan fallback `@media (hover: none), (pointer: coarse)` (toque móvil).
