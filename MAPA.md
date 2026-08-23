# MAPA — opencode-remote-android

> Generado 2026-08-23. Verificado en disco. Stack: `web/` React 19.2.8 + Vite 8 + TS 7 + Capacitor 8 (pnpm 10.32) · `desktop-app/` Rust 2021 `tiny_http` + `wry` 0.51 + `winit` 0.30 + `portable-pty` 0.8 · `opencode-stats/` Rust crate read-only · Workspace `Cargo.toml:1-13` `members = ["desktop-app","opencode-stats"]`

---

## 1. Vista aérea — monorepo

```
opencode-remote-android/                         ← raíz, sin package.json raíz
│
├── web/                                         ← EL PRODUCTO (un solo frontend para 3 superficies)
│   ├── src/                                     ← 78 components + 41 hooks + 42 tests (~800 vitest)
│   ├── android/ · ios/                          ← proyectos nativos Capacitor (appId com.gbro.opencode)
│   ├── dist/ · dist-stale/ (LOCKED .gitignore)  ← Vite output
│   ├── capacitor.config.ts:1                    ← appId, webDir dist, cleartext, iosScheme http
│   ├── package.json:8                           ← pnpm@10.32.0
│   └── scripts/copy-dist.py                     ← workaround EPERM cap copy
│
├── desktop-app/                                 ← shell Windows portable (opencode-desktop.exe)
│   ├── src/main.rs:431                          ← event loop winit + WebView2 child + tiny_http :4848 + WS PTY :4849
│   ├── src/api.rs:11                            ← /shell/* router (1370L, if-chain prohibido AGENTS.md:125)
│   └── Cargo.toml:30                            ← opencode-stats path dep
│
├── opencode-stats/                              ← lee opencode.db read-only → :8765
│   └── src/{lib.rs,server.rs,db.rs,pricing.rs,payload.rs,admin.rs,types.rs}
│
├── od-web/                                      ← VENDORIZADO nexu-io/open-design v0.19.2 Next16+React18 pnpm@10.33.2
│   │  12.8k archivos, commit 1af174e3, SIN integración funcional (INTEGRATION.md)
│   └── {apps/web,daemon,packaged | packages/host,dsh-runtime,contracts | design-systems/ 150 marcas}
│
├── Cargo.toml                                   ← workspace root
├── build-desktop.ps1 / .bat | deploy-apk.ps1 | start-opencode-v2.bat
├── codemagic.yaml                               ← CI iOS (mac_mini_m2 Xcode16) + Android
├── architecture.md (399L vivo) + CATALOGO.md (719L) + AGENTS.md
└── marketing/ · docs/ · .env (user/pass gitignored) · dist-desktop/ (exe+web-dist)
```

### Qué es qué

```
┌──────────────┐  Tailscale/LAN HTTP   ┌──────────────────────────────┐
│ 📱 APK       │  REST+SSE             │ 🖥️ PC Windows               │
│ 🍎 IPA       │◄─────────────────────►│  opencode serve :4096 (v1)   │
│ 🖥️ Desktop   │  Basic auth           │  opencode2        :4097 (v2) │
│  └─ web/dist │  opencode/ octavio    │  desktop-app.exe  :4848 →    │
│     React19  │                       │    └─ embebe :8765 stats     │
└──────────────┘                       └──────────────────────────────┘
         ↑ thin client: NO corre modelos, solo pinta
         │  un solo frontend sirve a las 3 superficies
```

Eliminados `274fd81d`: `tunnel/` (Go WebRTC) + `signaling-worker/` (CF) + `desktop-agent/` (Go GDI MJPEG :5901). Reemplazo: **Tailscale** (AGENTS.md:2, architecture.md D6).

---

## 2. `web/src` — FSD + hexagonal EN MIGRACIÓN

### 2.1 Capas

```
                ┌─────────────────────────────────────────────────────────────┐
                │  App.tsx:1  GOD COMPONENT ~3600L (~40 hooks, ~25 comps)    │
                │  composition root REAL — app/pages/widgets son placeholders│
                │  navStackRef, loadSessionRef, stopGenerationRef            │
                │  63 imports, lazyRetry() + Suspense para 10 pesados        │
                └────────────────────────┬────────────────────────────────────┘
                                         │ importa
              ┌──────────────────────────┼──────────────────────────┐
              ▼                          ▼                          ▼
     ┌─────────────────┐      ┌──────────────────┐       ┌──────────────────┐
     │ components/ 78  │      │ hooks/ 41        │       │ i18n/ en/es/it/zh│
     │ legacy UI viva  │◄────►│ estado real      │       │ createTranslator │
     │ ChatView,       │      │ useSessions      │       │ fallback en→es   │
     │ Composer,       │      │ useMessages      │       │ keys SOLO en/es  │
     │ MessageList/    │      │ useSSE/Handler   │       └────────┬─────────┘
     │ Bubble, ToolPart│      │ useConfig, useAI │                │
     │ shellPanels,    │      │ useOfflineCache  │                │
     │ TabBar, etc.    │      │ useShell, etc.   │                │
     └────────┬────────┘      └────────┬─────────┘                │
              │                        │                            │
              └──────────┐  ┌──────────┘                            │
                         ▼  ▼                                       │
              ┌──────────────────────────────────────┐              │
              │  shared/  (extraído, con tests)      │◄─────────────┘
              │  api/{client,version,mappers} 174T   │
              │  sse/{client,handler,parser}  96T    │
              │  storage, config, lib, ui            │
              └──────────────┬───────────────────────┘
                             │
              ┌──────────────▼───────────────────────┐
              │  entities/  (modelos puros, NO React)│
              │  agent, config, file, message,       │
              │  session, ui  — 262 tests             │
              │  types.ts: barrel SOLO re-exporta     │
              └──────────────┬───────────────────────┘
                             │
              ┌──────────────▼───────────────────────┐
              │  features/  hexagonal completo        │
              │  chat: domain/service + application/  │
              │        ports + infrastructure/adapters │
              │  edit-file, manage-sessions,          │
              │  quick-chat, run-terminal (scaffolds) │
              └──────────────────────────────────────┘
              │
     ┌────────┴────────┐  REGLA AGENTS.md:114
     │ app/ pages/     │  app → pages → widgets → features → entities → shared
     │ widgets/        │  UNIDIRECCIONAL — entities no importa React/fetch
     │ PLACEHOLDERS null│ PROHIBIDO fetch en comps/hooks → ports+adapter
     └─────────────────┘  >350L y sin .test.ts = rechazo PR
```

#### Estado real

| Capa | Estado | Evidencia |
|---|---|---|
| `shared/api` | ✅ 174 tests | `client.ts` CapacitorHttp/fetch + Basic, `version.ts` v1/v2 memoizado, `mappers.ts` toSessionV1 |
| `shared/sse` | ✅ 96 tests | `client.ts`, `handler.ts` multi-dialecto, `parser.ts` |
| `features/chat` | ✅ hexagonal | `domain/chat.service.ts`, `application/{load-messages,send-prompt}.usecase.ts`, `infrastructure/{message.api, message.cache}.adapter.ts` |
| `entities/*` | ✅ 262 tests | `agent/model.ts`, `session/model.ts` etc. — `types.ts` barrel |
| `utils/*` | ✅ 254 tests | `utils.ts`, `toolMeta.ts`, `parseCommand.ts`, `resolveTheme.ts` |
| `app/pages/widgets` | ⏳ null | placeholders vacíos |
| `App.tsx` | 🔴 God | 3600L, orquesta todo a mano |
| `desktop-app/domain+infrastructure/http` | ⏳ scaffolds vacíos | `api.rs:11` sigue con `if path == "/shell/..."` |

### 2.2 `api.ts:1` — facade (36 endpoints)

Re-exporta `shared/api/*` y expone `api = { health, listSessions, listStatuses, loadMessages, createSession, renameSession, deleteSession, sendPrompt/Command/Shell, abort, revert/unrevert, summarize(=compact), listAgents/Models/Commands/Files, loadTodos/Diff/ProjectCurrent/Vcs/FileStatus, question/permission, fetchDiffContent, readFile/writeFile, findFiles, setModelVariant ... }`

- `shared/api/client.ts` — dual `CapacitorHttp.request()` (nativo, 12s connect + read configurable + 1 retry) vs `fetch`+Abort web; `authHeader(config)=Basic base64(user:pass)`; `fetchFileBytes` blob nativo vs arrayBuffer; `recordDataUsage`
- `shared/api/version.ts:41-82` — `versionKey`, `ensureVersionDetected`, `getApiVersion` (async probe), `resolveApiVersion` (sync memo por `host:port`), `rememberApiVersion`, `onApiVersionChange` (App.tsx re-conecta SSE). v1: `/global/health`, rutas raíz; v2: `/api/health`, `/api/*`, `{data:...}`
- `shared/api/mappers.ts` — `toSessionV1`, `toMessageEnvelopeV1` (`content[]→parts[]`, `created/completed→start/end`), `toAgentOption`, `modelWireName`

### 2.3 Transporte — SSE + Polling

```
opencode serve ──►  /event (v1)  ─┐
                 o /api/event (v2)│  text/event-stream + Authorization
                                  │
                    fetch + reader│  (NO EventSource)
                                  ▼
                     useSSE.ts:57 connect()
                       ├─ v2 ? api/event : event + ?directory=...
                       ├─ headers { Accept: text/event-stream, Authorization }
                       ├─ fetch() + 8s connect timeout → getReader()
                       ├─ decoder + createSSEFrameParser() por conexión
                       ├─ pump() read() loop + parseChunk
                       └─ dispatch() filtro por sessionID
                           ├─ isSubagentTaskPart?(task/subagent) → NO filtrar
                           └─ else evtSession !== visible → discard

                       heartbeat: 1 timer permanente
                       lastEventAtRef touch() por frame → interval 5s
                       si now - last > 70s → abort + reader.cancel + reconnecting + scheduleReconnect()
                       reconnect: computeBackoff 1s→30s + jitter
                       versionTick: onApiVersionChange → tick
                       directoryRef + sessionIDRef para no quedar stale
```

- Type del evento **DENTRO del JSON** `{id,type,properties}` nunca en `event:` (arch:9.3). v1 fluye `message.part.delta` con `partID` (tipo vía `partTypeCacheRef`); v2 `session.next.*` con `data` anidado.
- `usePolling.ts` — backoff `1→60s` jitter 30%. `App.tsx:1013` `pollControl = usePolling(callback, pollInterval)` — `full` sin SSE vivo = `refreshSessions(true)` per-dir; `!full` = `refreshSessions(false)` light; `lastMsgFetchUpdatedRef` skip si `updated` no avanzó y SSE vivo; idle usa `listStatuses` (1 req) vs 21 req.

### 2.4 `hooks/useMessages.ts:53` — hook crítico (~892L)

```
state: messages[MessageEnvelope[]], optimisticUserMessages[], composer, awaitingAssistantReply, compactingIds Set
renderedMessages: merge messages+optimistas (por id/text/imgCount) → computeRenderedMessages (cache para bubbles memo)
messageScrollSignature / assistantResponseSignature (baratas)
pendingIndex (último assistant sin completed)
clearSession() / preloadMessages(id,cached) — merge inmediato

loadSelected(sessionID,dir):  ← flujo estrella
  requestID guard → loadedSessionIDRef = sid ANTES del await
  subagentAnchor.clear()
  api.loadMessages(limit 500/100/100) → stripNonEssential si !full/saver → safe filter !!m?.info?.id
  setMessages merge incremental (nunca encoge):
    seen Set, msgMap, merged=[]
    for prev (solo sessionID):
      si updated en msgMap → extraLocal = m.parts.filter(!remoteIDs.has) → merged.push({...updated,parts:+extraLocal})
      else merged.push(m) // conservar ventana acotada
    for remaining → merged.push; sort por time.created
    setOptimistic: confirmar por id O texto más viejo O imgCount

updateSend() — con guard isSendingRef (solo HTTP POST)
  parseCommand → /help /status /undo /redo /compact /themes /connect → returns tempranos (finally resetea)
  buildOptimisticMessage → push optimistas + optimisticIDs/Texts refs
  api.sendPrompt(id,text,dir,ModelSelection,agentID,images) → POST /session/{id}/prompt_async (v1) o /api/session/:id/prompt {text} (v2)
  ok → await loadSelected + poll 8s(+12s imgs) cada 1.5s hasta que id desaparezca → refreshSessions

applyDelta / applyPart — batch rAF (60/s), guard loadedSessionIDRef, subagentAnchor Map<partID,{sessionID,messageID}>
```

Reglas que NO romper (AGENTS.md:54): optimista NO se remueve tras send; `loadSelected` merge-only; `partID` monotónico `part_<hex>`; `translationOriginals` cap 200.

### 2.5 `hooks/useOfflineCache.ts` — IndexedDB `opencode-mobile` v2

`cacheSessions` upsert, `cacheMessages` read-merge-write + AES-GCM `utils/crypto.ts`. `getCachedMessages` si server cae. **NO bajar DB_VERSION** (AGENTS.md:65).

### 2.6 Hooks (41)

| Hook | Rol |
|---|---|
| `useConfig` | ServerConfig, health, `connectionState idle→connected→offline`, `dataMode`, auto-save 700ms |
| `useSessions` | `sessions:SessionView[]`, CRUD, `favorites`, `groupedSessions` Map<dir,View[]> |
| `useAI` | agents/models, key GLOBAL > por-dir, `variantGroups`, `getModelForSession` |
| `useSessionSidecar` | todos/diffFiles/dashboard |
| `useShell` | `/shell/pty` terminal |
| `useRemoteDesktop` | **fetch+blob** MJPEG (no `<img>` — Chromium no manda Authorization) |
| `useSSE/usePolling/useMessages` | ver arriba |
| `useFileBrowser/useFolderPicker` | FS del server |
| `useNetworkMode` | Capacitor Network → auto `ultra/miser` |
| `useOfflineQueue` | `pendingActions` IndexedDB → `dequeueAll` al reconectar |
| `useQuestions` | pendingQuestions/permissionRequest |
| resto | `useVisualSelection` (Ctrl+Shift+C), `useTheme`, `useFeatureFlags` (13), `useSpeechRecognition`, `useCompletionAudio`, `useNotifications`, `useBackButton`, `useDeepLink` (`opencode://connect`), `useServers`, `useChatSettings`, `useMemoryCleanup` |

### 2.7 `App.tsx:361` — God Component

`AppInner` (~3200L) orquestador. Calientes:

- `DESKTOP_STATE_KEY:69` `loadDesktopState:139` — migra `panelKinds/sessions→tabStacks/panelIds/panelEditorTabStacks`, clamp `sidebarWidth 200-480`, `desktopDiffWidth 280-800`
- `ShellPanelCell:235` — DnD 5 dropZones, `parseDragPayload`, `onSwapPanels/onSplitSession/onOpenFile`
- `handleComposerChange:488` — SIN debounce padre (Composer ya 800ms)
- `onLoadSelected:512` — **cache-first**: `preloadMessages` de IndexedDB antes del fetch
- `groupedSessions/projects/recentSessions:943` — agenda por directorio
- `pollControl:1013` + `useSSE:777` + `handleSSEEvent:763` + watchdog 30s `awaiting+reconnecting:813`

### 2.8 Escritorio dentro de web (`isDesktop`)

```
┌────────────────────────────────────────────────────────────────────┐
│ DesktopLayout grid (cols×rows) + sidebar 340px (colapsable)        │
│  ┌──────────┬─────────────────────────────────────────┐            │
│  │ activity │  panels grid  (colSizes/rowSizes)       │            │
│  │  rail    │  ┌──────────┬──────────┐                │            │
│  │ sessions │  │  panel 0 │  panel 1 │  resizers 4px  │            │
│  │ explorer │  │ session  │  editor  │  (col/row)     │            │
│  │ stats    │  │+TabBar   │+tabStacks│                │            │
│  │ kanban   │  ├──────────┼──────────┤                │            │
│  │ config   │  │  panel 2 │  panel 3 │                │            │
│  │ quickchat│  │ browser  │ terminal │                │            │
│  └──────────┴──┴──────────┴──────────┘                │            │
│  bottomBar 26px · status 22px                          │            │
│  DesktopState: layout{cols,rows,sessions,panelKinds,   │            │
│    panelIds,panelEditorTabStacks,panelBrowserUrls,     │            │
│    colSizes,rowSizes} + sidebarWidth + tabStacks[]     │            │
└────────────────────────────────────────────────────────────────────┘
```

- `shell.ts` — `ShellPanelKind` `session|terminal|explorer|kanban|stats|config|browser|doc|quickchat|design` — cliente `/shell/*`
- `shellPanels.tsx` — `ShellPanel`, `ExplorerPanel`, `StatsPanel` (iframe :8765), `KanbanPanel`, `FileEditorPanel` (tab-bar 24px + md-bar 26px), `BrowserPanel` (sub-WebView), `DesignPanel` (iframe od-web), `TerminalPanel` (WS 4849)
- `components/TabBar.tsx:52` — `__design__ → ◈ Open Design`, drag `moveTab`
- `hooks/useShell.ts`, `useServerStats.ts`, `goUsage.ts` + `providers/{cerebras,opencodeGo}`

### 2.9 Componentes (78)

- **chat**: `ChatView`, `Composer` (localValue+useTransition), `MessageList` (virtual), `MessageBubble`, `ToolPart` (compact `DiffStatBadge+DiffView`), `ThinkingBlock`, `Markdown` (remark-gfm+lowlight), `Question/PermissionPrompt`, `QueuedPrompts`, `PlanBreakdown`
- **sesiones**: `SessionList/Card/Toolbar`, `QuickAccessCard`, `InlineRename`, `FavoritesManager`, `ArchivedList`
- **archivos/git**: `FileBrowser/FileEditor`, `DiffViewer/InlineDiff`, `GitToolbar`, `ImageEditor`, `DocEditorPanel`, `ADEDiffPanel`, `FolderPicker`
- **escritorio**: `RemoteDesktop`, `shellPanels`, `TabBar`, `QuickChatPanel`, `StatsView`, `KanbanPanel`
- **infra**: `NavBar`, `BottomSheet`, `Modal*`, `ErrorBoundary`, `ContextMenu`, `SettingsPanel/ThemePicker/Creator`, `HelpPage`
- Pesados vía `lazyRetry` (auto-reload chunk mismatch) `App.tsx:71-99`

### 2.10 Estilos — 17 archivos `src/styles/`

`tokens.css` (30+ temas runtime), `base.css`, `layout.css` (grid, `desktop-resize-col/row 4px`), `chat.css`, `composer.css`, `desktop.css` (`.ade-diff-tabs-bar 35px`, `.file-editor-tab-bar 24px`), `sessions.css`, `settings.css`, `modals.css` (`will-change`), `shell.css` (kanban 300px cols), `browser.css`, `buttons/forms/utilities/stats/quickchat/responsive.css` + `styles.css` import-all. `utils/resolveTheme.ts`.

---

## 3. `desktop-app/` — shell Rust

### 3.1 `main.rs:431` — arranque

```
panic hook → MessageBoxW + opencode-desktop-error.log
  │
load_config() + load_persisted() (state.rs)
  │
Server::http("127.0.0.1", port→port+200 scan) ──► thread por request → api::route
  │ web_dist_dir() = OPENCODE_DESKTOP_DIST → <exe>/data/web-dist → ../../web/dist
  │
statsx::ensure(&appState) ──► probe /api/data?raw=1 → spawn opencode-stats (:8765)
ptyx::start_ws_server(pty, port+1) ──► 4849 WS manual RFC6455 (portable-pty pwsh7)
  │
EventLoop winit + WebContext(data/webview) + WebViewBuilder
  ├─ http://127.0.0.1:chosen
  ├─ window.__OPENCODE_DESKTOP__ = true
  ├─ additional_browser_args = browser_view::WEBVIEW_BROWSER_ARGS (GPU, idénticos parent/child)
  └─ build_as_child(window) → 1280×800 (geometría persistida throttle 400ms)

tray-icon: Abrir/Salir, Restore click izquierdo
fallback: sin WebView2 runtime (registro EdgeUpdate) → install_webview2_runtime_bg() ureq bootstrapper → cmd /c start URL
save_geometry() en Resized/Moved/CloseRequested
```

Portable: `data/` junto al exe (`config.json`, `kanban.json`, `window-geometry.json`, `cache/search/`, `web-dist/`, `webview/`). Sin single-instance, autostart HKCU Run opcional, `#![windows_subsystem="windows"]`.

### 3.2 `api.rs:11` — router `/shell/*` (1370L)

Todos los bloques:

```
GET  /shell/health, /shell/config, /shell/autostart, /shell/session-state
POST /shell/config, /shell/config/export|import, /shell/autostart, /shell/session-state
GET  /shell/fs/drives|list|read|resolve|session|pick-folder|favorites
POST /shell/fs/delete|copy|write|mkdir|reveal|exec
POST /shell/doc/convert|save  (pdf-extract/lopdf/quick-xml/zip: md↔pdf↔docx)
GET  /shell/pty  POST /shell/pty?shell=&cwd=  GET /pty/{id}/buffer?since=  POST write|resize  DELETE
GET  /shell/kanban  POST/DELETE board  POST/PATCH/DELETE card  (data/kanban.json)
GET  /shell/server  POST start|stop  (srvman.rs)
GET  /shell/updates?refresh=1  (cache 1h)  GET /shell/docs[/read]
GET  /shell/stats  POST /shell/stats/start  GET /shell/stats/proxy/* → 127.0.0.1:8765/api/*
GET  /shell/plugins[/running]  POST run  GET /shell/plugin/{name}/{rel}  GET /shell/labs + POST /labs/start
GET  /shell/search?q=            (DDG lite, top3, cache 6h data/cache/search/<hash>.json)
ANY  /shell/proxy?url=            (CORS proxy: limpia CSP/X-Frame, cap 16MB, sanitize_proxy_html)
POST /shell/browser/open|bounds|visibility|navigate|close  GET url  POST eval|pick
GET  /shell/design/status|open    (probar 3000/3001/5173 → cmd /c start)
POST /shell/browser/pick + GET drena cola

↓ ESTÁTICOS web/dist (guard !path.startsWith("/shell/"))
   ├─ path traversal guard (file.startsWith(base) else index.html)
   ├─ SPA fallback si !rel.contains('.')
   └─ index.html inyecta <script>localStorage["opencode.remote.server"]=JSON(host/port/user/pass) → autoconexión
   Guard crítico api.rs:1035 — sin él POST /shell/browser/* cae al fallback
```

- `common.rs` `json_ok/json_err`, `read_body`, `base64_encode`, `sanitize_proxy_html`
- `ptyx.rs` — `PtyRegistry`, ring 2MB condvar, frames 16KB chunked, `{cmd:attach|write|resize|kill}`
- `fsx.rs` — `list_dir/read_file/drives/favorites/toggle/delete/copy/write/mkdir/reveal/execute/resolve/session_for_dir/pick_folder`
- `doc_engine.rs` — `convert_file`, `md_to_docx/pdf`
- `kanban.rs` — `Board/Column/Card` + `KanbanStore::load`
- `plugins.rs`, `docsx.rs`, `updates.rs`, `srvman.rs`, `statsx.rs`, `browser_view.rs` (SubWebViewManager + waker `AppEvent::BrowserWork` para salir de `ControlFlow::Wait`)
- Scaffolds vacíos `domain/` + `infrastructure/http/*_router.rs` — deuda AGENTS.md:125.

### 3.3 `ptyx.rs` — WS PTY `:4849`

Handshake manual `Sec-WebSocket-Key + sha1 + base64 → 101`, `portable-pty` pwsh7, buffer con `base_offset` para `?since=` incremental.

---

## 4. `opencode-stats/` — stats local

```
opencode.db (SQLite WAL del server)
      │  URI file:...?mode=ro  (seguro con WAL)
      │  env OPENCODE_DB → config.json (%LOCALAPPDATA%\OpenCodeStats|data/) → ~/.local/share/opencode/opencode.db
      ▼
   db.rs  ──►  SELECT session (tokens_*, cost, model JSON) + request_counts cache incremental keyed por max(time_updated)
              scan json_extract(part/message) (~4s) luego incremental IN (SELECT id WHERE time_updated>?) ~57ms
              home() fallback USERPROFILE/HOME
              Mutex caches
      │
   pricing.rs ──► PRICES/LIMITS/MODEL_NAMES 18 modelos (MODEL_ORDER = dict Python) + pricing_overrides.json (RwLock)
      │
   payload.rs ──► build_payload(scope) — contrato JSON exacto frontend (summary|modelo|proyecto|dia|mes|sesiones|tools|limites|usage)
                  inicial solo summary (~1-2s), cada tab fetchea su scope y cachea en state.scopes
      │
   admin.rs  ──► ÚNICA escritura (mode=rw busy_timeout 5s) POST /api/admin {action dry_run force}
                 delete/move/rename/archive/prune/export/backup/vacuum/restore/pricing_save/set_db
                 guarda: si opencode corre (tasklist) → 403 salvo force
                 snapshot JSON en backups/ + last.json para undo
      │
   server.rs ──► tiny_http sync, GET /api/data?scope&since&until&model&raw, GET /api/admin/*, POST /api/admin, CORS *, no-store
                  static/ vanilla JS + Tailwind/Chart.js vendoreados offline
   types.rs  ──► Session/Group/TokenCounts/Price/Limits/AdminAction/Guard/ApiError + fmt_num/cost
   main.rs   ──► server en thread + ventana wry (window_state.json, close=exit(0), OPENCODE_STATS_HIDE_WINDOW=1)
               fallback Edge --app si no hay WebView2
```

- Tests 42: `cargo test` (14 admin +16 db +7 payload +5 pricing, DB temporal)
- Integración: `desktop-app` lo levanta in-process (`StatsManager`) y lo proxéa `/shell/stats/proxy/*`; `web` lo embebe en iframe. `hooks/useStats.ts` es OTRO (contador localStorage).

---

## 5. `od-web/` — OpenDesign vendorizado (aislado)

- Copia `nexu-io/open-design` Apache-2.0 sin `.git` propio (`1af174e3`, 12.8k archivos), pnpm aislado 10.33.2, **Node 24**, Next16+React18 vs React19+Vite (incompatible a propósito).
- `apps/{web(Studio chat+preview), desktop, daemon, packaged, landing-page}`, 16 `packages/{host,dsh-runtime,plugin-runtime,contracts,sidecar}`, `design-systems/` 150+ marcas, `skills/`, `plugins/`, `clipper/`, `figma-plugin/`, `mocks/`, `native/registry-core` napi.
- Bin `od` en `apps/daemon/bin/od.mjs` (`RUNTIME_DATA_DIR/OD_DATA_DIR`).
- Plan `od-web/INTEGRATION.md` — hoy **sin conexión funcional**.

---

## 6. Flujos críticos

### 6.1 Enviar mensaje

```
Usuario type → Composer localValue+useTransition
   ▼ Enter
App.tsx:1134 handleSend(text = localValueRef)  ← siempre explícito
   │ visualSelection? → formatSelectionForPrompt
   │ offline? → queueAction → "queued"
   │ recordPrompt, stopGenerationRef=false
   ▼
useMessages.ts:704 updateSend()
  parseCommand → /help/status/undo/redo/compact/themes/connect → returns tempranos (finally resetea isSending)
  buildOptimisticMessage → push optimisticIDs/Texts
  isSending=true, awaiting=true
  api.sendPrompt → POST /session/{id}/prompt_async (v1) o /api/session/:id/prompt {text} (v2)
  ok → loadSelected + poll deadline 8s(+12s imgs) cada 1.5s hasta que id desaparezca

        ┌────────────── SSE ──────────────┐
        │ applyDelta/Part batch rAF → setMessages merge → rendered → MessageList │
        └─────────────────────────────────┘
```

### 6.2 `loadSelected` — merge que nunca encoge

```
ANTES del await: loadedSessionIDRef = sid
limit 500/100/100 → api.loadMessages (server ignora since) → safe filter
setMessages merge incremental por id:
  for prev (solo sid):
    si updated existe → extraLocal = m.parts.filter(!remoteIDs.has) → parts = [...updated.parts,...extraLocal].sort(id)
    else conservar prev (ventana acotada)
  for remaining → push; sort por time.created
  confirmar optimistas por id/text/imgCount
```

### 6.3 SSE ↔ Polling — ahorro de datos

```
useSSE (solo si full+streamingFull) → streamState polling|streaming|reconnecting
pollControl = usePolling(callback, pollInterval)
  callback:
    sseLive = streaming
    if full && !sseLive → refreshSessions(true)
    else if !full → refreshSessions(false) // light
    if offline → throw "offline"
    skip = !full && sseLive && prevUpdated>=updated → NO fetch
    else loadSelected
  pollInterval = isActive ? min(base,3000) : base  // active = isSessionActive || awaiting
  base: full 3.5/5s, saver 15s, ultra 30s, miser 60s
```

Modos: `full` SSE+poll 3.5s, `saver` 15s, `ultra` 30s strip tools, `miser` 60s solo texto.

### 6.4 Detección v1/v2

```
health → /global/health raw → v1 si 200
         si 404 → /api/health → v2
forced config.apiVersion override
memo por host, onApiVersionChange → tick SSE
v2: /api/session, POST {text} (model/agent por sesión), /interrupt, /revert/stage+commit, /revert/clear, /compact, /model, /fs/*, /vcs/*, location[directory]=
NO: todo ([]), writeFile
```

### 6.5 Offline

```
IndexedDB opencode-mobile v2 (never downgrade)
  cacheSessions upsert; cacheMessages read→union→write + AES-GCM
  onLoadSelected: getCachedMessages → preloadMessages inmediato → red
  timer 2.5s por signature
useOfflineQueue: pendingActions IndexedDB → dequeueAll al volver connected
useNetworkMode: Capacitor Network → auto ultra/miser
```

---

## 7. Persistencia

| Dónde | Qué |
|---|---|
| `localStorage` | `ServerConfig{host,port,user,pass,apiVersion}`, `dataMode`, `theme`, `language`, `favorites`, `model/agent` (GLOBAL), `recentModels/blockedModels/featureFlags/connectedProviders/chatSettings/recentDismiss/modelVariant`, `servers:ServerProfile[]`, `activeServer`, `statsPort`, `desktopState:DesktopState`, `composer`, `cursor` |
| `Documents/opencode-config.json` | sobrevive reinstalación (`persistentStorage.ts`) |
| `IndexedDB opencode-mobile v2` | `sessions, messages, pendingActions` — merge-only, recrea si corrupta |
| `desktop-app data/` | `config.json, kanban.json, window-geometry.json, cache/search/<hash>.json (6h), web-dist/, webview/` |
| `opencode-stats` | `%LOCALAPPDATA%\OpenCodeStats\` o `data/` → `config.json`, `pricing_overrides.json`, `window_state.json`, `backups/last.json` |
| `server` | Source of truth: `opencode.db` WAL, `session` rows, `part/message/todo`, `event_sequence` |

---

## 8. Toolchain — build & deploy

```
npm run build (web) ──► tsc -b && vite build → dist/ (~558KB chunk)
       │
       ├─► npx cap sync (NO cap copy — EPERM)
       │   └─► python web/scripts/copy-dist.py → android/app/src/main/assets/public/
       │       └─► ./gradlew assembleDebug → app-debug.apk
       │           └─► deploy-apk.ps1 ──► tmpfiles.org /api/v1/upload → LINK https://tmpfiles.org/dl/<id>/apk
       │
       └─► cargo build --release → opencode-desktop.exe (portable, sin consola)
           └─► build-desktop.ps1 [--SkipWeb] [--Run] → dist-desktop/ (exe + data/web-dist)

Capacitor: cleartext http, androidScheme http, ios contentInset always
Codemagic: mac_mini_m2 Xcode16, assembleRelease AAB/APK

Regla AGENTS.md:1 — NUNCA levantar servers largos desde el chat (detached + timeout)
Antes de commit: npm run build + test:ui/i18n/settings/model + cargo check verdes
```

---

## 9. Decisiones (D1-D15) y trampas

D1 thin client · D2 SSE+poll+watchdog+jitter · D3 4 modos datos · D4 merge-only cache · D5 auto v1/v2 · D6 Tailscale reemplaza túnel · D7 un frontend 3 superficies · D8 wry sobre winit (no Tauri) · D9 stats read-only · D10 Python→Rust stats · D11 FSD+hexagonal incremental · D12 sin store global · D13 od-web vendorizado aislado · D14 optimista por match · D15 MJPEG fetch+blob

Trampas: `cap copy` EPERM → `copy-dist.py` · v1 solo `message.part.delta` en 1.18.x · type SSE dentro del JSON · `refreshSessions` traga errores · NO bajar `DB_VERSION=2` · `deploy-quick.ps1` `Out-Null` oculta · v2 prompt rechaza model/agent en body · hover-only necesita `@media (hover:none)` fallback.

---

## 10. ¿Dónde toco qué?

- **UI chat/mensajes** → `components/Composer.tsx`, `ChatView.tsx`, `MessageList/Bubble.tsx`, `hooks/useMessages.ts:53` + `shared/sse/`, `features/chat/` (no `types.ts` directo → `entities/`)
- **Transporte** → `shared/api/client.ts`, `version.ts`, `hooks/useSSE.ts:9`, `usePolling.ts`, `useSSEHandler.ts`
- **Sesiones/agentes** → `hooks/useSessions.ts`, `useAI.ts`, `entities/session|agent/model.ts`
- **Desktop shell** → `desktop-app/src/api.rs`, `main.rs:431`, `ptyx.rs`, `browser_view.rs`, `shell.ts`, `components/shellPanels.tsx`, `App.tsx:139`
- **Stats** → `opencode-stats/src/{db,server,payload,admin}.rs` + `static/app.js`
- **Estilo/tema** → `styles/*.css` + `utils/resolveTheme.ts` + `public/themes/` + `ThemeCreator.tsx`
- **Deploy** → `web/package.json:7` scripts, `build-desktop.ps1`, `deploy-apk.ps1`, `codemagic.yaml`
