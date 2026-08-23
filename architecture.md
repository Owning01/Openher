# Architecture — opencode-remote-android

> **Documento único de arquitectura** — consolidación de los antiguos `MAPA.md` y
> `project-knowledge.md` (ambos eliminados; este archivo los reemplaza).
> Describe todo el monorepo: qué es cada carpeta, cómo se
> conectan, decisiones tomadas, estado real del código y flujos críticos.
> Verificado en disco al **2026-08-23**. Para reglas de contribución ver `AGENTS.md`.

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
         ↑ thin client: NO corre modelos, solo pinta
         │  un solo frontend sirve a las 3 superficies
```

- **Un solo frontend** (`web/`) sirve a tres superficies: APK Android (Capacitor),
  IPA iOS (Capacitor) y app de escritorio Windows (shell Rust con WebView2).
- El cliente es **thin client**: no corre modelos ni tools; todo lo delega al server
  opencode remoto vía REST + SSE con Basic Auth (`opencode`/`octavio`).
- El acceso remoto se resuelve con **Tailscale** (VPN mesh); no hay puertos abiertos
  en el router ni túnel propio (el túnel WebRTC fue eliminado, ver §11).

### Mapa del monorepo

```
opencode-remote-android/                         ← raíz, sin package.json raíz
├── web/                ← EL PRODUCTO (un frontend para APK/iPA/desktop)
│   ├── src/            ← ~80 components + 41 hooks + tests (>1100 vitest)
│   ├── android/ · ios/ ← proyectos nativos Capacitor (appId com.gbro.opencode)
│   ├── dist/           ← Vite output (dist-stale/ LOCKED en .gitignore)
│   ├── capacitor.config.ts  ← appId, webDir dist, cleartext, androidScheme http
│   └── scripts/copy-dist.py ← workaround EPERM de cap copy
├── desktop-app/        ← shell Windows portable (opencode-desktop.exe)
│   └── src/{main,api,ptyx,fsx,gitx,...}.rs
├── opencode-stats/     ← lee opencode.db read-only → :8765 (crate propio)
├── od-web/             ← VENDORIZADO nexu-io/open-design v0.19.2, SIN integración funcional
├── Cargo.toml          ← workspace root: ["desktop-app","opencode-stats"]
├── build-desktop.ps1 / deploy-apk.ps1 / start-opencode-v2.bat / codemagic.yaml
└── marketing/ · docs/ · scrum/ · .env (gitignored) · dist-desktop/ (build artifact)
```

| Carpeta | Qué es | Estado |
|---|---|---|
| `web/` | Frontend React 19 + Vite + TS + Capacitor. **El producto central** | Activo |
| `desktop-app/` | Shell de escritorio Windows en Rust (wry + tiny_http) que embebe `web/dist` | Activo |
| `opencode-stats/` | Server de estadísticas Rust sobre `opencode.db` read-only | Activo |
| `od-web/` | Copia vendorizada de OpenDesign (proyecto ajeno), integración temprana | Vendored, aislado |
| `%SystemDrive%/` | **Basura**: jerarquía vacía por variable sin expandir en PowerShell | A eliminar |

Workspace Cargo raíz: release con `strip + lto + codegen-units=1`. Sin `package.json`
raíz: cada proyecto JS gestiona sus deps (web pnpm 10.32, od-web pnpm 10.33 aislado,
Node 24 para od-web).

---

## 2. `web/` — el producto central

### 2.1 Stack

- React **19.2.8** (+ react-compiler-runtime), TypeScript **7.0.2**, Vite **8**, Vitest 4, **pnpm**.
- Capacitor **8.5** (core/android/ios) + plugins: speech-recognition, app, camera,
  dialog, filesystem, local-notifications, network, share.
- Markdown: react-markdown + remark-gfm + highlight.js/lowlight. Terminal:
  @xterm/xterm 6 (+fit/webgl) — **cargado lazy** (solo chunk async de shellPanels;
  excluido del vendor catch-all en `vite.config.ts`). Virtualización:
  @tanstack/react-virtual. QR: jsqr.
- Sin librería de estado global: estado en hooks + Context (decisión deliberada).
- Estilos: CSS propio en **17 archivos** `src/styles/` (tokens, base, layout, chat,
  composer, modals, settings, desktop, shell…), 30+ temas runtime vía CSS variables.
- `index.html`: viewport meta incluye `interactive-widget=resizes-content` (teclado móvil);
  AndroidManifest MainActivity con `windowSoftInputMode="adjustResize"`.

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

**Estado real de la migración**:

| Capa | Estado | Evidencia |
|---|---|---|
| `shared/api` | ✅ 174 tests | `client.ts` dual transporte, `version.ts` v1/v2 memoizado, `mappers.ts` |
| `shared/sse` | ✅ 96 tests | `client.ts`, `handler.ts` multi-dialecto, `parser.ts` |
| `features/chat` | ✅ hexagonal | domain/application/ports/infrastructure completos |
| `entities/*` | ✅ 262 tests | modelos puros sin React; `types.ts` hoy es SOLO barrel |
| `utils/*` | ✅ 254 tests | `utils.ts`, `toolMeta.ts`, `parseCommand.ts`, `resolveTheme.ts` |
| `app/pages/widgets` | ⏳ null | placeholders vacíos |
| `App.tsx` | 🔴 God | ~3.600L, ~40 hooks + ~25 componentes wired a mano (deuda reconocida) |
| Routers Rust | ⏳ scaffolds vacíos | `api.rs` sigue con `if path == "/shell/..."` (prohibido para código nuevo) |

Conviven dos generaciones: la legacy funcional (`App.tsx` + `components/` + `hooks/`)
y la nueva estructura FSD parcialmente poblada. Los usecases/adapters de
`features/chat` ya envuelven `api.*` tras el puerto `IMessageRepository`.
Tipos nuevos van en `entities/<domain>/model.ts`, nunca en `types.ts` (barrel).

### 2.3 Capa API (`src/api.ts` → `shared/api/`)

`api.ts` es un **facade delgado** (~36 endpoints) que re-exporta y expone:
`health, listSessions, listStatuses, loadMessages, createSession, renameSession,
deleteSession, sendPrompt/Command/Shell, abort, revert/unrevert, summarize(=compact),
listAgents/Models/Commands/Files, loadTodos/Diff/ProjectCurrent/Vcs/FileStatus,
question/permission, fetchDiffContent, readFile/writeFile, findFiles, setModelVariant…`

- **`shared/api/client.ts`** — transporte dual: `CapacitorHttp.request()` en nativo
  (bypass CORS, connectTimeout 12s, readTimeout configurable, 1 retry backoff 1s→2s)
  y `fetch` + AbortController en web (timeout 30s default, 300s commands/summarize).
  Auth Basic (`Basic base64(user:pass)`). Contabilidad de consumo (`recordDataUsage`).
  `fetchFileBytes` blob nativo vs arrayBuffer. `withDirectory()` agrega `?directory=`.
- **`shared/api/version.ts`** — detección automática del dialecto del server:
  - v1: rutas raíz (`/session`, `/event`, `/global/health`…).
  - v2 (opencode2 beta): rutas `/api/*`, respuestas `{data:...}`, renames
    (abort→`/interrupt`, summarize→`/compact`, status→`/session/active`, todo→no existe).
  - Cache memoizado por host + promesas deduplicadas; `getApiVersion` async /
    `resolveApiVersion` sync / override manual en Settings (Auto/v1/v2);
    `onApiVersionChange` → App reconecta SSE.
- **`shared/api/mappers.ts`** — `toSessionV1`, `toMessageEnvelopeV1`
  (content[]→parts[], time created/completed→start/end), mapProviderModels…

### 2.4 Tiempo real: SSE + Polling

```
opencode serve ──►  /event (v1)  o /api/event (v2)   text/event-stream + Authorization
                                   │
                     fetch + reader│  (NO EventSource: hay que mandar Authorization)
                                   ▼
                      useSSE.ts connect()
                        ├─ headers { Accept: text/event-stream, Authorization }
                        ├─ fetch() + 8s connect timeout → getReader()
                        ├─ decoder + createSSEFrameParser() por conexión
                        ├─ pump() read() loop + parseChunk
                        └─ dispatch() filtro por sessionID
                            ├─ isSubagentTaskPart?(task/subagent) → NO filtrar
                            └─ else evtSession !== visible → discard
                        heartbeat: UN timer permanente; touch() por frame → interval 5s
                        si now - last > 70s → abort + reconnect backoff exponencial 1s→30s + jitter
                        versionTick: onApiVersionChange → tick; refs directory/sessionID anti-stale
```

- **El type del evento va DENTRO del JSON** (`{id,type,properties}`), nunca en la
  línea `event:`. En v1 fluye SOLO `message.part.delta` (con `partID`; tipo de part
  vía `partTypeCacheRef` alimentado por `message.part.updated`); en v2,
  `session.next.*` con body anidado en `data`.
- **`usePolling.ts`** — respaldo con backoff exponencial 1s→60s + jitter 30%.
  Interacción SSE↔polling detallada en §6.3.
- **Modos de datos** (Full/Balance(saver)/Ultra/Miser): intervalo de polling
  (3.5s/15s/30s/60s), límite de mensajes iniciales (100/100/30/20), recorte de payload
  (sin tools/audio en ultra, solo texto en miser), auto-switch WiFi↔celular
  (`useNetworkMode`). Selector en Settings; en home solo indicador pasivo.

### 2.5 Mensajes y persistencia

- **`hooks/useMessages.ts`** (~892L, hook crítico):
  - Estado: `messages[MessageEnvelope[]]`, `optimisticUserMessages[]`, `composer`,
    `awaitingAssistantReply`, `compactingIds`. `renderedMessages` = merge
    mensajes+optimistas (por id/texto/imgCount) con cache para memo de bubbles.
  - `loadSelected(sessionID,dir)` hace **merge incremental por id SIEMPRE** (nunca
    encoge): requestID guard antes del await; limit 500/100/100 según modo →
    stripNonEssential → merge: mensaje actualizado reemplaza pero conserva
    `extraLocal = parts` no confirmadas por el server; sort por `time.created`.
    Confirma optimistas por id O texto O imgCount.
  - `updateSend()` con guard `isSendingRef`: parseCommand (/help /status /undo /redo
    /compact /themes /connect con returns tempranos) → buildOptimisticMessage →
    `api.sendPrompt` (v1 `prompt_async` / v2 `prompt {text}`) → poll deadline
    8s(+12s imgs) cada 1.5s hasta que id desaparezca → refreshSessions.
  - `applyDelta/applyPart` batch rAF (60/s) con guard de sesión cargada;
    subagentAnchor Map<partID,{sessionID,messageID}>.
- **Mensaje optimista**: NO se remueve tras el send exitoso — la confirmación la hace
  `loadSelected` por match de texto (removerlo antes causa el bug "aparece tarde").
- **`useOfflineCache.ts`** — IndexedDB `opencode-mobile` **DB_VERSION = 2** (NUNCA
  bajar; si la DB queda corrupta/sin stores, se recrea). Merge-only: `cacheMessages`
  lee-mezcla-escribe la unión; `cacheSessions` upsert. Cifrado AES-GCM de textos
  (`utils/crypto.ts`). Restauración offline si el server no responde.
  `useOfflineQueue` guarda `pendingActions` y las drena al reconectar.
- **Config**: localStorage + archivo externo `opencode-config.json` en Documents vía
  `persistentStorage.ts` (sobrevive reinstalaciones) + password cifrada.

### 2.6 Hooks (41)

| Hook | Rol |
|---|---|
| `useConfig` | ServerConfig, health, `connectionState idle→connected→offline`, `dataMode`, auto-save 700ms |
| `useSessions` | CRUD sesiones, favoritos, archivadas, `groupedSessions` Map<dir,View[]> |
| `useMessages` / `useSSE` / `usePolling` / `useSSEHandler` | Ver §2.4–2.5; handler central de eventos |
| `useAI` | Agentes/modelos; key GLOBAL > por-directorio; nunca `primary[0]` ciego; variantes |
| `useSessionSidecar` | Dashboard de sesión: todos, diff, project/VCS/files |
| `useShell` | Cliente `/shell/*` del desktop-app (terminal, FS, kanban…) |
| `useRemoteDesktop` | Reader MJPEG fetch+blob (no `<img>`: Chromium no manda Authorization en URL) |
| `useNetworkMode` / `useOfflineQueue` / `useMemoryCleanup` | Red, cola offline, limpieza cada 60s |
| `useFileBrowser` / `useFolderPicker` | FS del server (navegación relativa) |
| `useQuestions` | pendingQuestions / permissionRequest |
| `useBackButton` | Back hardware Android (navStack, sheets, dialog exit) |
| `useDeepLink` | `opencode://connect` |
| `useServers` | Perfiles de servidores (add/remove/rename/update; preserva id activo) |
| `useChatSettings` | Font size / spacing / thinking toggles |
| `useCompletionAudio` / `useNotifications` / `usePushNotifications` | Sonido, browser push, nativas (APK) |
| `useShareReceiver` | Share-to-OpenCode (guard nativo; en web no-op) |
| `useBlockedModels` / `useFeatureFlags` (13) / `useTheme` / `useChatSettings` | Preferencias |
| `useSpeechRecognition` | Voz en Composer |
| `useStats` | ⚠️ contador LOCAL de localStorage (no consume opencode-stats :8765) |
| `useServerStats` | Cliente de opencode-stats :8765 |
| `useFocusTrap` / `useOutsideClick` / `useLocalStorage` | UI infra (modals, dropdowns, persistencia genérica) |

Dependencias clave: `useConfig` alimenta a `useSessions/useMessages/useSessionSidecar/
useFolderPicker/useFileBrowser`; `useAI` depende de config; `usePolling` captura
refreshSessions/loadSelected por ref; `useCompletionAudio` captura awaiting+dataMode.

### 2.7 Componentes (~80)

Grupos funcionales:

- **chat**: `ChatView`, `Composer` (localValue + useTransition + slash menu + mic +
  imágenes), `MessageList` (auto-scroll, footerInfoMap), `MessageBubble` (lazy),
  `ToolPart` (compact, DiffStatBadge+DiffView), `ThinkingBlock`, `Markdown`,
  `QuestionPrompt`/`PermissionPrompt`, `QueuedPrompts`, `PlanBreakdown`.
- **sesiones**: `SessionList/Card/Toolbar`, `QuickAccessCard` (DRY favoritos/activos/
  recientes), `InlineRename`, `FavoritesManager`, `ArchivedList`.
- **archivos/git**: `FileBrowser`, `FileEditor`, `DiffViewer`/`InlineDiff`,
  `GitToolbar`, `ImageEditor`, `DocEditorPanel`, `ADEDiffPanel`, `FolderPicker`.
- **escritorio**: `RemoteDesktop`, `shellPanels` (todos los paneles), `TabBar`
  (`__design__ → ◈ Open Design`, drag moveTab), `QuickChatPanel`, `StatsView`,
  `KanbanPanel`, `SourceControlPanel` (SCM completo: Changes/History, graph lanes,
  staging, commit/push/pull/fetch, diff modal).
- **infra**: `NavBar`, `BottomSheet`, `Modal*`/`ModalHeader`, `ErrorBoundary`,
  `ContextMenu`, `DropdownMenu`, `EmptyState`, `ConnectionNotices`, `ErrorNotice`.
- **settings**: `SettingsPanel`, `ThemePicker`/`ThemeCreator`, `DataModeSwitcher`
  (⚠️ legacy sin uso), `ProviderManager`, `ServerProfileModal`, `ConnectProviderSheet`.

Pesados vía `lazyRetry` (lazy + auto-reload del chunk): MessageBubble, shellPanels
completos (ShellPanel/Explorer/Stats/Kanban/Config/FileEditor/Browser/Design/Terminal/
SourceControl), SessionStatsPanel — así @xterm queda fuera del bundle eager.

### 2.8 Escritorio dentro de la web (`isDesktop`)

Detección por ancho ≥781px (`useIsDesktop`) + `window.__OPENCODE_DESKTOP__` (inyectado
por el shell Rust) + `Capacitor.isNativePlatform()` para ramas nativas.

```
┌────────────────────────────────────────────────────────────────────┐
│ DesktopLayout grid (cols×rows) + sidebar 340px (colapsable)        │
│  ┌──────────┬─────────────────────────────────────────┐            │
│  │ activity │  panels grid  (colSizes/rowSizes)       │            │
│  │  rail    │  ┌──────────┬──────────┐                │            │
│  │ sessions │  │  panel 0 │  panel 1 │  resizers 4px  │            │
│  │ explorer │  │ session  │  editor  │  (col/row)     │            │
│  │ scm      │  ├──────────┼──────────┤                │            │
│  │ stats    │  │  panel 2 │  panel 3 │                │            │
│  │ kanban   │  │ browser  │ terminal │                │            │
│  │ config   │  └──────────┴──────────┘                │            │
│  └──────────┴─────────────────────────────────────────┘            │
│  bottomBar 26px · status 22px                                      │
│  DesktopState: layout{cols,rows,panelKinds,panelIds,               │
│    panelEditorTabStacks,panelBrowserUrls,colSizes,rowSizes}        │
│    + sidebarWidth (clamp 200-480) + tabStacks[]                    │
└────────────────────────────────────────────────────────────────────┘
```

- `src/shell.ts` — cliente tipado `/shell/*`: `ShellPanelKind`
  `session|terminal|explorer|kanban|stats|config|browser|doc|quickchat|design|scm`,
  más clientes git (log/diff/stage/unstage/discard/commit/push/fetch/pull/branches/
  checkout/showCommitDiff) y `fs.*` (incluye `move` para drag&drop entre carpetas).
- `components/shellPanels.tsx` — `ShellPanel`, `ExplorerPanel` (drag&move interno vía
  payload `application/x-opencode-path`; drops OS externos también soportados),
  `StatsPanel` (iframe :8765), `KanbanPanel`, `FileEditorPanel` (tab-bar 24px),
  `BrowserPanel` (sub-WebView), `DesignPanel` (iframe od-web), `TerminalPanel`
  (WS :4849), `SourceControlPanel` + `scm/{graph.ts,GraphRail.tsx,HistoryPane.tsx}`.
- `App.tsx` hotspots desktop: `DESKTOP_STATE_KEY`/`loadDesktopState` (migra estados
  viejos), `ShellPanelCell` (DnD 5 dropZones, swap/split/openFile), clamp sidebar.

Móvil: navegación state-based con navStack (sessions/detail/settings/help + sheets);
back button hardware cierra en orden: picker → sheet → detail → dialog exit.

### 2.9 Escritorio remoto

- `components/RemoteDesktop.tsx` + `hooks/useRemoteDesktop.ts` — visor MJPEG con
  gestos (tap=click, long-press=click derecho, 2 dedos scroll/pinch), fit-to-screen
  Baja/Media/Alta, stats chip, selector de fuente con miniaturas. Cero tráfico si el
  modal está cerrado (abort + revoke blobs). El agente Go backend fue eliminado (§11).

### 2.10 i18n, temas, proveedores

- `i18n/` — en/es/it/zh. Keys nuevas **SOLO en `en.ts`/`es.ts`**; it/zh caen al inglés
  por fallback de `createTranslator` (`test:i18n` lo verifica).
- Temas: 30+ JSON en `public/themes/`, resueltos a CSS variables en runtime
  (`utils/resolveTheme.ts`), creator custom, test de contraste (`check:contrast`).
- `providers/` — cerebras, groq, opencodeGo: quick-chat directo a LLMs con API key
  propia (independiente del server opencode).

### 2.11 Empaquetado móvil

- `android/` — proyecto Gradle nativo. El build copia `web/dist` a
  `app/src/main/assets/public/` con `python scripts/copy-dist.py` porque
  `npx cap copy` falla con EPERM en `app-icon.png` (trampa conocida).
- `ios/` — proyecto Xcode; CI en Codemagic firma y publica.
- Firma Play Store: keystore externo (ver `PLAY-STORE.md`, no commiteado).

### 2.12 Estilos — 17 archivos `src/styles/`

`tokens.css` (30+ temas runtime) · `base.css` · `layout.css` (grid, resizers 4px) ·
`chat.css` · `composer.css` · `desktop.css` · `sessions.css` · `settings.css` ·
`modals.css` (`will-change`) · `shell.css` (kanban 300px cols, drop-targets explorer) ·
`browser.css` · `buttons/forms/utilities/stats/quickchat/responsive.css` ·
`styles.css` import-all. Tokens: `--space-1..8`, `--radius-sm/md/lg`, `--shadow-sm/md`,
z-index sticky/modal-backdrop(40)/modal(50), `--font-family/--font-mono`.
Animaciones `.fade-in/.animate-spin/.typing-dot` respetan `prefers-reduced-motion`.
Breakpoints ≤780px (tablet/mobile) y ≤430px (teléfono chico). Elementos hover-only
llevan fallback `@media (hover: none), (pointer: coarse)`.

### 2.13 Tests y benchmarks

Suites npm: `test` (vitest unit >1100), `test:i18n`, `test:ui`, `test:settings`,
`test:model`, `test:rendered`, `check:contrast`. Del refactor: entities 262,
shared/api 174, sse+chat 96, utils 254. Un solo archivo:
`pnpm exec vitest run src/<ruta>/file.test.ts`. `benchmarks/runner.mjs` — benchmarks
de render/lógica. Regla: todo domain/application puro lleva `.test.ts`.

---

## 3. `desktop-app/` — shell de escritorio Rust

### 3.1 Qué es

Binario Windows portable (`opencode-desktop`, crate `tiny_http` + `wry`/`winit` +
`tray-icon`) que:

1. Sirve la misma web app (`web/dist`) por HTTP local en `127.0.0.1:4848`
   (escanea hasta +200 puertos si está ocupado).
2. La muestra en una ventana nativa con **WebView2 como child** (no Tauri).
3. Expone capacidades nativas al frontend por REST `/shell/*` + WebSocket PTY (:4849)
   + proxy a stats (:8765).

Portable: todo el estado vive en `data/` junto al exe (config.json, kanban.json,
window-geometry.json, cache/, web-dist/, webview/). Autostart opcional HKCU Run.
Tray icon Abrir/Salir + restore click izquierdo. Sin single-instance guard.

### 3.2 Arranque (`main.rs`)

```
panic hook → MessageBoxW + opencode-desktop-error.log
  │
load_config() + load_persisted() (state.rs)
  │
Server::http("127.0.0.1", port→port+200 scan) ──► thread por request → api::route
  │ web_dist_dir(): env OPENCODE_DESKTOP_DIST → <exe>/data/web-dist → ../../web/dist
  │
statsx::ensure(&state) ──► probe /api/data?raw=1 → spawn opencode-stats (:8765)
ptyx::start_ws_server(pty, port+1) ──► 4849 WS manual RFC6455 (portable-pty pwsh7)
  │
EventLoop winit + WebContext(data/webview) + WebViewBuilder
  ├─ http://127.0.0.1:<chosen>
  ├─ window.__OPENCODE_DESKTOP__ = true
  ├─ additional_browser_args GPU idénticos parent/child
  └─ build_as_child(window) → 1280×800 (geometría persistida throttle 400ms)

tray-icon: Abrir/Salir · fallback sin WebView2: install_webview2_runtime_bg()
(ureq bootstrapper) → cmd /c start URL · save_geometry en Resized/Moved/Close
```

### 3.3 API HTTP (`src/api.rs`) — rutas `/shell/*`

Enrutado con cadena `if path == ...` (**patrón prohibido para código nuevo — los
routers van en `infrastructure/http/*_router.rs`; hoy existe `scm_router.rs` como
primer router extraído**). Grupos:

| Grupo | Rutas |
|---|---|
| Salud/config | `GET /shell/health`, `GET\|POST /shell/config`, `config/export\|import`, `GET\|POST /shell/autostart`, `GET\|POST /shell/session-state` |
| Filesystem | `GET /shell/fs/drives\|list\|read\|resolve\|session\|pick-folder\|favorites`, POST `delete\|copy\|write\|mkdir\|reveal\|exec\|move` |
| Git (SCM) | `GET /shell/git/status\|log\|branches\|remote-url`, POST `stage\|unstage\|discard\|commit\|push\|fetch\|pull\|checkout\|commit-diff\|show-commit-diff` (router `scm_router.rs`, motor `gitx.rs`) |
| Docs engine | `POST /shell/doc/convert\|save` (PDF↔MD↔DOCX: pdf-extract, lopdf, quick-xml, zip) |
| PTY | `GET /shell/pty`, `POST /shell/pty?shell=&cwd=`, `GET /pty/{id}/buffer?since=`, POST `write\|resize`, DELETE |
| Kanban | `GET /shell/kanban`, POST/DELETE board, POST/PATCH/DELETE card (`data/kanban.json`) |
| Server manager | `GET /shell/server`, `POST /shell/server/start\|stop` (`srvman.rs`) |
| Updates/docs | `GET /shell/updates?refresh=1` (cache 1h), `GET /shell/docs[\|/read]` |
| Stats | `GET /shell/stats`, `POST /shell/stats/start`, `GET /shell/stats/proxy/*` → :8765 |
| Plugins/Labs | `GET /shell/plugins[\|/running]`, `POST run`, `GET /shell/plugin/{name}/{rel}`, `/shell/labs` + POST start |
| Web search | `GET /shell/search?q=` (DDG lite top3, cache 6h `data/cache/search/<hash>.json`) |
| Proxy CORS | ANY `/shell/proxy?url=` (limpia CSP/X-Frame, cap 16MB, sanitize_proxy_html) |
| Browser embebido | `POST /shell/browser/open\|bounds\|visibility\|navigate\|close\|eval\|pick`, GET url (sub-WebView2 UA Chrome, MemoryUsageLevel Low oculto) |
| Design | `GET /shell/design/status\|open` (prueba 3000/3001/5173 → cmd start) |

Estáticos (guard `!path.startsWith("/shell/")`): path-traversal guard
(`file.startsWith(base)` else index.html), SPA fallback si `!rel.contains('.')`,
e index.html **inyecta `<script>`** que precarga
`localStorage["opencode.remote.server"]` con host/port/user/pass ⇒ autoconexión.
Guard crítico: sin él, POST `/shell/browser/*` cae al fallback SPA.

Helpers: `common.rs` (`json_ok/json_err`, `read_body`, base64, sanitize_proxy_html).

### 3.4 WebSocket PTY (`ptyx.rs`)

Handshake RFC6455 manual (`Sec-WebSocket-Key + sha1 + base64 → 101`, sin librería WS)
en puerto 4849. Terminal `portable-pty` (pwsh7 default). Ring buffer 2MB por sesión
con condvar + `base_offset` para `?since=` incremental. Frames binarios chunked 16KB;
comandos JSON `{cmd: attach|write|resize|kill}`. El buffer persiste al ocultar la
pestaña terminal.

### 3.5 Módulos

| Módulo | Rol |
|---|---|
| `state.rs` | config/persisted serde |
| `fsx.rs` | operaciones FS (`move_entry`: rename atómico mismo volumen, fallback copy+delete cross-volume, rechaza carpeta dentro de sí/descendiente, colisión → sufijo `-copia`) |
| `gitx.rs` | motor git std-only (timeout por polling): porcelain v2 parser portado de terax, 19 operaciones, 13 tests |
| `scm_router.rs` | primer router `infrastructure/http/` (rutas `/shell/git/*`) |
| `doc_engine.rs` | conversión documentos md↔pdf↔docx |
| `kanban.rs` | modelo Board/Column/Card + store |
| `plugins.rs` | registry manifests (`data/plugins/<name>/plugin.json`: type web/command/link) + labs |
| `updates.rs` / `srvman.rs` | feed updates cache 1h / gestor del server opencode |
| `statsx.rs` | embebe crate `opencode-stats` como lib, garantiza :8765 |
| `browser_view.rs` | sub-WebView manager + waker `AppEvent::BrowserWork` (sale de `ControlFlow::Wait`) |
| `common.rs` / `docsx.rs` | helpers / docs |

Tests Rust: `cargo test` — gitx 13, fsx 16, opencode-stats ~44 (contra DB temporal,
nunca la real).

---

## 4. `opencode-stats/` — estadísticas de uso (Rust)

Crate `opencode-stats` v0.2.0 (edition 2024) — port Rust del backend Python previo
(contratos JSON exactos). Miembro del workspace; consumido como **lib** por desktop-app.

```
opencode.db (SQLite WAL del server)
      │  URI file:...?mode=ro  (seguro con WAL)
      │  env OPENCODE_DB → config.json (%LOCALAPPDATA%\OpenCodeStats|data/)
      ▼
db.rs       SELECT session (tokens_*, cost, model JSON) + request_counts cache
            incremental keyed max(time_updated) (~57ms incremental vs ~4s inicial)
pricing.rs  PRICES/LIMITS/MODEL_NAMES 18 modelos + pricing_overrides.json (RwLock)
payload.rs  build_payload(scope) — contrato JSON exacto del frontend
            (summary|modelo|proyecto|dia|mes|sesiones|tools|limites|usage)
admin.rs    ÚNICA escritura (mode=rw busy_timeout 5s) POST /api/admin
            delete/move/rename/archive/prune/export/backup/vacuum/restore/pricing_save/set_db
            guarda: si opencode corre (tasklist) → 403 salvo force; snapshot backups/ + last.json
server.rs   tiny_http sync: GET /api/data?scope&since&until&model&raw, /api/admin/*,
            CORS *, no-store · static/ vanilla JS + Tailwind/Chart.js vendoreados offline
main.rs     server thread + ventana wry (close=exit(0), OPENCODE_STATS_HIDE_WINDOW=1)
            fallback Edge --app
```

- **API**: `GET /api/data?scope=...` (payload completo o por scope), `GET /api/admin/
  status|sessions|backups|pricing|session/{id}`, `GET /api/go/usage` (proxy autenticado
  opencode.ai/zen), `POST /api/admin`.
- **Integración**: desktop-app lo levanta in-process (`statsx::ensure` idempotente) y lo
  proxéa por `/shell/stats/proxy/*`; la web lo embebe en iframe desde `shellPanels.tsx`.
  ⚠️ `hooks/useStats.ts` NO consume este server — es contador local de localStorage.

---

## 5. `od-web/` — OpenDesign vendorizado

**Proyecto ajeno**: copia `github.com/nexu-io/open-design` v0.19.2 (Apache-2.0),
vendorizada SIN `.git` propio (commit único `1af174e3`, ~12.8k archivos). Workspace
pnpm aislado 10.33.2, Node 24, Next16+React18 (incompatible a propósito con React19+Vite).

- Contenido: `apps/web` (Studio chat+preview sandboxeada), `apps/desktop|daemon|
  packaged|landing-page`, 16 packages (`host`, `dsh-runtime`, `plugin-runtime`,
  `contracts`, `sidecar`…), `design-systems/` (150+ marcas), `skills/`, `plugins/`,
  `clipper/`, `figma-plugin/`, `mocks/` (CLIs fake replay), `native/registry-core` napi.
- Bin `od` en `apps/daemon/bin/od.mjs` (`RUNTIME_DATA_DIR/OD_DATA_DIR`).
- Plan en `od-web/INTEGRATION.md` (port daemon Express→Rust, panel OD en desktop-app).
  Hoy **sin conexión funcional**. NO tocar ni buildear como parte de este repo.

---

## 6. Flujos críticos

### 6.1 Enviar mensaje

```
Usuario type → Composer localValue+useTransition
   ▼ Enter
App.tsx handleSend(text = localValueRef)  ← siempre explícito
   │ visualSelection? → formatSelectionForPrompt
   │ offline? → queueAction → "queued"
   │ recordPrompt, stopGenerationRef=false
   ▼
useMessages.updateSend()
  parseCommand → returns tempranos (/help /status /undo /redo /compact /themes /connect)
  buildOptimisticMessage → push optimisticIDs/Texts
  isSending=true, awaiting=true
  api.sendPrompt → POST /session/{id}/prompt_async (v1) o /api/session/:id/prompt {text} (v2)
  ok → loadSelected + poll deadline 8s(+12s imgs) cada 1.5s hasta que id desaparezca

        ┌────────────── SSE ──────────────┐
        │ applyDelta/Part batch rAF → setMessages merge → rendered → MessageList │
        └─────────────────────────────────┘
```

Comandos slash: `/help`→vista ayuda, `/status`→mensaje estado optimista,
`/undo`→revert, `/redo`→unrevert, `/compact`→summarize, resto→sendCommand/sendPrompt.

### 6.2 `loadSelected` — merge que nunca encoge

```
ANTES del await: loadedSessionIDRef = sid
limit 500/100/100 → api.loadMessages (server ignora since) → safe filter !!info.id
setMessages merge incremental por id:
  for prev (solo sid):
    si updated existe → extraLocal = parts.filter(!remoteIDs.has)
                        → parts = [...updated.parts, ...extraLocal].sort(id)
    else conservar prev (ventana acotada)
  for remaining → push; sort por time.created
  confirmar optimistas por id/text/imgCount
```

Reglas que NO romper: optimista NO se remueve tras send; merge-only SIEMPRE;
`partID` monotónico `part_<hex>`; `translationOriginals` cap 200.

### 6.3 SSE ↔ Polling — ahorro de datos

```
useSSE (solo si full+streamingFull) → streamState polling|streaming|reconnecting
pollControl = usePolling(callback, pollInterval)
  callback:
    sseLive = streaming
    if full && !sseLive → refreshSessions(true)
    else if !full → refreshSessions(false) // light
    if offline → throw "offline"   // así se dispara el backoff
    skip = !full && sseLive && prevUpdated>=updated → NO fetch
    else loadSelected
  pollInterval = isActive ? min(base,3000) : base  // active = isSessionActive || awaiting
```

| Modo | Poll | Audio | Thinking/Tools | Background |
|------|------|-------|----------------|-----------|
| `full` | 3.5s | ✓ | Se conservan | Siempre |
| `saver` | 15s | ✓ | Se conservan | Solo activo |
| `ultra` | 30s | ✗ | Stripped | Solo activo |
| `miser` | 60s | ✗ | Stripped | Nunca |

Idle usa `listStatuses` (1 req) en vez del refresh completo (~21 req);
skip si `time.updated` no avanzó y SSE vivo.

### 6.4 Detección v1/v2

```
health → /global/health raw → v1 si 200 ; si 404 → /api/health → v2
forced config.apiVersion override · memo por host · onApiVersionChange → tick SSE
v2: /api/session, POST {text} (model/agent por sesión), /interrupt,
    /revert/stage+commit, /revert/clear, /compact, /model, /fs/*, /vcs/*,
    location[directory]= · NO: todo ([]), writeFile
v2 prompt rechaza model/agent en body (400)
```

### 6.5 Offline

```
IndexedDB opencode-mobile v2 (never downgrade; recrea si corrupta)
  cacheSessions upsert; cacheMessages read→union→write + AES-GCM
  onLoadSelected: getCachedMessages → preloadMessages inmediato → red
useOfflineQueue: pendingActions IndexedDB → dequeueAll al volver connected
useNetworkMode: Capacitor Network → auto ultra/miser
```

### 6.6 Conexión y errores de red

Retry 1× backoff exponencial (1s, 2s) en `shared/api/client.ts`.
`backgroundFailureCountRef`: 3 fallos consecutivos de poll → "offline";
primera carga fallida → "offline" directo, siguientes → "reconnecting"→"offline".
`loadSessionRef`/`loadSelectedRequestRef` descartan respuestas stale.

---

## 7. Persistencia

| Dónde | Qué |
|---|---|
| `localStorage` | `ServerConfig{host,port,user,pass,apiVersion}`, `dataMode`, `theme`, `language`, `favorites`, model/agent GLOBAL, `recentModels/blockedModels/featureFlags/chatSettings`, `servers:ServerProfile[]`, `activeServer`, `statsPort`, `desktopState`, `composer`, `cursor` |
| `Documents/opencode-config.json` | sobrevive reinstalación (`persistentStorage.ts`), password cifrada |
| `IndexedDB opencode-mobile v2` | `sessions, messages, pendingActions` — merge-only, recrea si corrupta |
| `desktop-app data/` | `config.json, kanban.json, window-geometry.json, cache/search/<hash>.json (6h), web-dist/, webview/` |
| `opencode-stats` | `%LOCALAPPDATA%\OpenCodeStats\` o `data/` → `config.json`, `pricing_overrides.json`, `backups/last.json` |
| `server` | Source of truth: `opencode.db` WAL (`session`, `part/message/todo`, `event_sequence`) |

---

## 8. Toolchain — build & deploy

```
pnpm run build (web/) ──► tsc -b && vite build → dist/
       │
       ├─► APK: python web/scripts/copy-dist.py (NO cap copy — EPERM)
       │       → ./gradlew assembleDebug → deploy-apk.ps1
       │         (sube a tmpfiles.org, imprime LINK; -SkipBuild = solo subir)
       │
       └─► Desktop: cargo build --release → build-desktop.ps1 [-SkipWeb] [-Run]
              → dist-desktop/ (exe portable sin consola + data/web-dist)
```

| Script | Qué hace |
|---|---|
| `deploy-apk.ps1` | build web → copy-dist → gradle → upload tmpfiles.org + LINK |
| `build-desktop.ps1/.bat` | web build → cargo release → empaqueta exe + web-dist |
| `start-opencode-v2.bat` | verifica `opencode2`, asegura config (port 4097, 0.0.0.0), arranca detached |
| `codemagic.yaml` | CI real: iOS (mac_mini_m2 Xcode16 firma + ASC) y Android (assembleRelease APK/AAB) |
| `.env` | solo usuario/contraseña (gitignored) |

Regla crítica operativa: **nunca levantar servers/procesos largos desde el chat** —
usar `Start-Process`/`.bat` detached; comandos >30s detached o timeout explícito.
Antes de commit: `tsc -b`, tests web y `cargo check` verdes.

---

## 9. Decisiones arquitectónicas (registro)

| # | Decisión | Racional |
|---|---|---|
| D1 | **Thin client**: toda la IA corre en el server remoto; la app solo pinta | El teléfono no tiene GPU/modelos; el server ya tiene el contexto del código |
| D2 | **SSE primario + polling respaldo**, watchdog heartbeat + backoff+jitter | Streaming real + cobertura de cortes; jitter evita thundering herd |
| D3 | **4 modos de datos** que recortan polling, payload e historial | El consumo móvil era el problema #1; `time.updated` estable permite saltar fetches |
| D4 | **Cache offline merge-only** + restauración offline | Una respuesta parcial nunca debe destruir historial |
| D5 | **Detección automática v1/v2** memoizada por host | Soportar server estable y beta opencode2 sin forks del cliente |
| D6 | **Túnel WebRTC eliminado → Tailscale** (`274fd81d`) | Menos piezas propias; NAT-traversal probado, gratis ≤100 devices |
| D7 | **Un solo frontend para las 3 superficies**: shell Rust mínimo que sirve `web/dist` | Reuso total de UI; el shell aporta solo capacidades nativas |
| D8 | **WebView2 vía wry directo sobre winit** (no Tauri) | Control fino del event loop, sub-webviews, deps mínimas |
| D9 | **Stats como crate aparte read-only sobre `opencode.db`** | Cero interferencia con el server; admin con backups y bloqueo |
| D10 | **Python → Rust** manteniendo contratos JSON exactos | Un runtime nativo compartido con el desktop-app, sin Python en producción |
| D11 | **Refactor FSD + Hexagonal incremental** con tests por fase | Migrar sin big-bang; App.tsx God Component queda para el final |
| D12 | **Sin librería de estado global**; hooks + Context + CSS variables | Alcance contenido; evita dependencia y boilerplate |
| D13 | **Vendorizar OpenDesign** con workspace aislado | Evaluar integración futura sin contaminar builds |
| D14 | **Optimista confirmado por match** (no se remueve tras send) | Evita el parpadeo "el mensaje aparece cuando responde el asistente" |
| D15 | **MJPEG por fetch+blob** (no `<img>`) | Chromium no envía Authorization en URLs de imagen |

---

## 10. Trampas conocidas (verificadas) y edge cases

1. `npx cap copy` falla EPERM en app-icon.png → `python web/scripts/copy-dist.py` + gradle aparte; `deploy-quick.ps1` oculta errores con `Out-Null`.
2. Server v1 1.18.x emite SOLO `message.part.delta` — no duplicar handlers v2 sin dedupe.
3. Type SSE dentro del JSON, nunca en línea `event:`.
4. `refreshSessions` traga errores internamente; el backoff se dispara lanzando desde el callback cuando `connectionState === "offline"`.
5. NO bajar `DB_VERSION=2` de IndexedDB; el bump migra instalaciones viejas.
6. v2 prompt rechaza model/agent en el body (400) — son por-sesión.
7. Hover-only necesita fallback `@media (hover: none), (pointer: coarse)`.
8. Switches con `role="switch"` usan `aria-checked`.
9. Guard estáticos `api.rs` (~línea 1035): sin él, POST `/shell/browser/*` cae al SPA fallback.
10. Footer del mensaje: `footerInfoMap` en MessageList — solo último assistant o cambio de modelo/plan; duración = `completed − created` del user padre vía `parentID` (TUI parity).
11. `setModelVariant`: PATCH `/config` parcial — el server hace mergeDeep, no pisa config.
12. `useShareReceiver` requiere guard nativo — en web los métodos del plugin rechazan y generaban "Uncaught (in promise)".
13. `useOfflineCache`: DB sin stores por migración vieja → recrear (delete con retry si hay conexiones bloqueantes).
14. `useMemoryCleanup`: limpia mensajes de otras sesiones >5min cada 60s.
15. `lastMessageTsRef` (por sesión) alimenta carga incremental; `translationOriginals` cap 200.
16. Perfiles servidor (`useServers`): `updateProfile` preserva id para no perder el activo.
17. Config persistida también en Documents (sobrevive uninstall); favoritos/bloqueados en localStorage-backed Sets.

---

## 11. Componentes eliminados (historial)

- **`tunnel/` + `signaling-worker/`** — túnel WebRTC Go + worker Cloudflare WS.
  Eliminados en `274fd81d` (2026-08-04) junto con RemoteConnect; reemplazados por Tailscale.
- **`desktop-agent/`** — agente Go standalone de escritorio remoto (GDI MJPEG :5901 +
  SendInput). Eliminado; `RemoteDesktop.tsx` sobrevive esperando backend equivalente.

---

## 12. ¿Dónde toco qué?

- **UI chat/mensajes** → `components/Composer.tsx`, `ChatView.tsx`, `MessageList/Bubble.tsx`, `hooks/useMessages.ts` + `shared/sse/`, `features/chat/` (tipos nuevos → `entities/message/`, no `types.ts`)
- **Transporte** → `shared/api/client.ts`, `version.ts`, `hooks/useSSE.ts`, `usePolling.ts`, `useSSEHandler.ts`
- **Sesiones/agentes** → `hooks/useSessions.ts`, `useAI.ts`, `entities/session|agent/model.ts`
- **Desktop shell** → `desktop-app/src/api.rs`, `main.rs`, `ptyx.rs`, `gitx.rs`, `scm_router.rs`, `browser_view.rs`, `web/src/shell.ts`, `components/shellPanels.tsx`, `SourceControlPanel.tsx`, `App.tsx` (DesktopState/layout)
- **Stats** → `opencode-stats/src/{db,server,payload,admin}.rs` + `static/app.js`
- **Estilo/tema** → `styles/*.css` + `utils/resolveTheme.ts` + `public/themes/` + `ThemeCreator.tsx`
- **Deploy** → `web/package.json` scripts, `build-desktop.ps1`, `deploy-apk.ps1`, `codemagic.yaml`
