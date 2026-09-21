# Architecture — opencode-remote-android

> **Documento único de arquitectura** — consolidación de los antiguos `MAPA.md` y
> `project-knowledge.md` (ambos eliminados; este archivo los reemplaza).
> Describe todo el monorepo: qué es cada carpeta, cómo se
> conectan, decisiones tomadas, estado real del código y flujos críticos.
> Verificado en disco al **2026-09-05**. Para reglas de contribución ver `AGENTS.md`.

---

## 1. Visión general

**OpenHer** es un ecosistema para usar [OpenCode](https://opencode.ai) (agente
de código IA) de forma remota:

```
┌─────────────────────┐        ┌──────────────────────────────────────────┐
│  📱 Teléfono / 🖥️   │        │  🖥️ PC (Windows)                         │
│  web/ (React 19)    │◄──────►│  · opencode serve v1  → 0.0.0.0:4096     │
│  empaquetado en:    │Tailscale  opencode2 (beta v2) → 0.0.0.0:4097     │
│  · APK Capacitor    │ o LAN  │  · desktop-app.exe    → 127.0.0.1:4848   │
└─────────────────────┘        └──────────────────────────────────────────┘
         ↑ thin client: NO corre modelos, solo pinta
         │  un solo frontend sirve a las 3 superficies
```

- **Un solo frontend** (`web/`) sirve a tres superficies: APK Android (Capacitor),
  IPA iOS (Capacitor) y app de escritorio Windows (shell Rust con WebView2).
- El cliente es **thin client**: no corre modelos ni tools; todo lo delega al server
  opencode remoto vía REST + SSE con Basic Auth (`opencode`/`octavio`).
- El acceso remoto se resuelve con **Tailscale** (VPN mesh); no hay puertos abiertos
  en el router ni túnel propio (el túnel WebRTC fue eliminado, ver §10).

### Mapa del monorepo

```
opencode-remote-android/                         ← raíz, sin package.json raíz
├── web/                ← EL PRODUCTO (un frontend para APK/iPA/desktop)
│   ├── src/            ← 96 components + 49 hooks + tests (1679 vitest)
│   ├── android/ · ios/ ← proyectos nativos Capacitor (appId com.gbro.opencode)
│   ├── dist/           ← Vite output (dist-stale/ LOCKED en .gitignore)
│   ├── capacitor.config.ts  ← appId, webDir dist, cleartext, androidScheme http
│   └── scripts/copy-dist.py ← workaround EPERM de cap copy
├── desktop-app/        ← shell Windows portable (openher-desktop.exe)
│   └── src/{main,api,memx,ptyx,fsx,gitx,browser_view,...}.rs + infrastructure/http/ (19 routers)
├── (externo) open-design, vioeditor, m3e-canvas, screenshots ← plugins on-demand vía EXTERNAL_PROJECTS (NO vendorizados)
├── Cargo.toml          ← workspace root: ["desktop-app"]
├── scripts/build-desktop.ps1 / scripts/update-app.ps1 / scripts/start-opencode-v2.bat / codemagic.yaml
└── docs/ · .env (gitignored) · dist-desktop/ (build artifact)
```

| Carpeta | Qué es | Estado |
|---|---|---|
| `web/` | Frontend React 19 + Vite + TS + Capacitor. **El producto central** | Activo |
| `desktop-app/` | Shell de escritorio Windows en Rust (wry + hyper/tokio + 19 routers en `infrastructure/http/`) que embebe `web/dist` | Activo |
| `open-design` + `vioeditor` + `m3e-canvas` + `screenshots` (externos) | Plugins on-demand (`features/external-plugins/config.ts`: 3000/1420/3005/3002) | Externos, no vendorizados |
| `%SystemDrive%/` | **Basura**: jerarquía vacía por variable sin expandir en PowerShell | A eliminar |

Workspace Cargo raíz: release con `strip + lto + codegen-units=1`, members
`["desktop-app"]`. Sin `package.json`
raíz: cada proyecto JS gestiona sus deps (`web` pnpm 12.3.4, pin packageManager: pnpm@10.32.0, Node v24.19.0).

---

## 2. `web/` — el producto central

### 2.1 Stack

- React **19.2.8** (+ react-compiler-runtime), TypeScript **7.0.2**, Vite **8**, Vitest 4, **pnpm**.
- Capacitor **8.5** (core/android/ios) + plugins: speech-recognition, app,
  filesystem, local-notifications, network, share.
- Markdown: react-markdown + remark-gfm + highlight.js/lowlight. Terminal:
  @xterm/xterm 6 (+fit/webgl) — **cargado lazy** (solo chunk async de shellPanels;
  excluido del vendor catch-all en `vite.config.ts`). Virtualización:
  @tanstack/react-virtual. QR: jsqr.
- Sin librería de estado global: estado en hooks + Context (decisión deliberada).
- Estilos: CSS propio en **28 archivos** `src/styles/` (tokens, base, layout, chat,
  composer, motion, notes, editor, pc-files, sessions, titlebar, toasts,
  learning, scm, canvas, shell, browser…), temas runtime vía CSS variables +
  modo claro por tokens `var(--*)` (sin hex oscuro hardcodeado en chrome).
- `index.html`: viewport meta incluye `interactive-widget=resizes-content` (teclado móvil);
  AndroidManifest MainActivity con `windowSoftInputMode="adjustResize"`.

### 2.2 Arquitectura: FSD + Hexagonal **en migración**

Estructura objetivo (reglas en `AGENTS.md`, flujo unidireccional
`app → pages → widgets → features → entities → shared`):

```
web/src/
├── app/            # Composition root real — useAppController (+218L tras compactar desde ~1282)
├── pages/          # 3 reales: mobile-layout, detail, sessions
├── widgets/        # 5 reales: activity-bar, desktop-grid, desktop-layout, sidebar, titlebar
├── features/       # 16: chat, session, project, pc-files, canvas, learning,
│                   # external-plugins, shortcuts, host-actions, ... (+ scaffolds)
├── entities/       # agent, config, file, message, session, ui — modelos puros + tests
├── shared/         # api/{client,version,mappers}, sse/{client,parser}, lib, errors
├── components/     # 96 componentes UI reales (legado, aún activos)
├── hooks/          # 49 hooks (legado, aún activos)
└── i18n/           # en, es, it, zh
```

**Estado real de la migración**:

| Capa | Estado | Evidencia |
|---|---|---|
| `shared/api` | ✅ 174 tests | `client.ts` dual transporte, `version.ts` v1/v2 memoizado, `mappers.ts` |
| `shared/sse` | ✅ 96 tests | `client.ts`, `parser.ts` |
| `features/chat` | 🟡 parcial | `domain/message-order.ts` + `hooks/` (sin application/ports/infrastructure) |
| `entities/*` | ✅ 262 tests | modelos puros sin React; `types.ts` hoy es SOLO barrel |
| `utils/*` | ✅ 254 tests | `utils.ts`, `toolMeta.ts`, `parseCommand.ts`, `resolveTheme.ts` |
| `app/pages/widgets` | ✅ poblados | `app/useAppController.ts`, 3 pages, 5 widgets (los scaffolds vacíos ya no existen) |
| `App.tsx` | ✅ delgado (~412L) | Delega en `useAppController`; el God de ~3.600L quedó compactado |
| `shellPanels.tsx` | 🟡 adelgazado (~2.1KL; el Explorer propio se absorbió en `features/pc-files`) | roadmap `refactor/ts-compact-1` propone split P1-P5 (Kanban ya extraído) |
| Routers Rust | ✅ 19 routers | `infrastructure/http/*_router.rs`; `api.rs` solo despacha por prefijo (prohibido `if` nuevo) |

Conviven dos generaciones: la legacy funcional (`App.tsx` + `components/` + `hooks/`)
y la nueva estructura FSD parcialmente poblada.
Tipos nuevos van en `entities/<domain>/model.ts`, nunca en `types.ts` (barrel).

### 2.3 Capa API (`src/api.ts` → `shared/api/`)

`api.ts` es un **facade delgado** (~51 endpoints) que re-exporta y expone:
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
  Interacción SSE↔polling detallada en §5.3.
- **Modos de datos** (Full/Balance(saver)/Ultra/Miser): intervalo de polling
  (3.5s/15s/30s/60s), límite de mensajes iniciales (100/100/30/20), recorte de payload
  (sin tools/audio en ultra, solo texto en miser), auto-switch WiFi↔celular
  (`useNetworkMode`). Selector en Settings; en home solo indicador pasivo.

### 2.5 Mensajes y persistencia

- **`hooks/useMessages.ts`** (~1127L, hook crítico):
  - Estado: `messages[MessageEnvelope[]]`, `outbox` por sesión (pendiente con
    eliminar/editar/enviar-ahora + auto-flush), `composer`,
    `awaitingAssistantReply`, `compactingIds`. `renderedMessages` = merge
    mensajes+optimistas+outbox (por id/texto/imgCount) con `renderedCacheRef`.
  - `loadSelected(sessionID,dir)` hace **merge incremental por id SIEMPRE** (nunca
    encoge): requestID guard antes del await; limit 200 (ultra/miser 100) →
    `api.loadMessages` con `safeLimit = min(limit, 200)` (tope del server) →
    stripNonEssential → merge: mensaje actualizado reemplaza pero conserva
    `extraLocal = parts` no confirmadas por el server; sort por `time.created`.
    Confirma optimistas por id O texto O imgCount.
  - `updateSend()` con guard `isSendingRef`: parseCommand (/help /status /undo /redo
    /compact /themes /connect con returns tempranos) → si agente ocupado, encola en
    outbox visible en vez de bloquear → buildOptimisticMessage →
    `api.sendPrompt` (v1 `prompt_async` / v2 `prompt {text}`) → poll deadline
    8s(+12s imgs) cada 1.5s hasta que id desaparezca → refreshSessions.
  - `applyDelta/applyPart` batch rAF (60/s) con guard de sesión cargada;
    subagentAnchor Map<partID,{sessionID,messageID}>.
  - ⚠️ El server pagina por cursor (`message.list` limit/cursor/previous/next)
    pero el cliente pide UNA página (≤200): sesiones de +200 mensajes muestran
    solo los últimos 200 — paginación histórica pendiente (fase 2).
- **Mensaje optimista**: NO se remueve tras el send exitoso — la confirmación la hace
  `loadSelected` por match de texto (removerlo antes causa el bug "aparece tarde").
- **`useOfflineCache.ts`** — IndexedDB `openher` **DB_VERSION = 3** (NUNCA
  bajar; si la DB queda corrupta/sin stores, se recrea). Merge-only: `cacheMessages`
  lee-mezcla-escribe la unión; `cacheSessions` upsert. Cifrado AES-GCM de textos
  (`utils/crypto.ts`). Restauración offline si el server no responde.
  `useOfflineQueue` guarda `pendingActions` y las drena al reconectar.
- **Config**: localStorage + archivo externo `opencode-config.json` en Documents vía
  `persistentStorage.ts` (sobrevive reinstalaciones) + password cifrada.

### 2.6 Hooks (49)

| Hook | Rol |
|---|---|
| `app/useAppController` | Composition root: sesiones, paneles, modales, `+` abre FolderPicker + persiste última carpeta |
| `useConfig` | ServerConfig, health, `connectionState idle→connected→offline`, `dataMode`, auto-save 700ms |
| `useSessions` | CRUD sesiones, favoritos, archivadas, `groupedSessions` por `dirKey` normalizada (`utils/sessionDirs.ts`: unión priorizada global>UI>/project>historial, cap 150) |
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
| `useChatSettings` | 21 campos (font/spacing/thinking + `reduceMotion` → clase `html.no-motion`) |
| `useMemoryUsage` | Heap JS + RSS nativo vía `GET /shell/mem` (chip apilado en ActivityBar; fuera de desktop solo JS) |
| `useCompletionAudio` / `useNotifications` | Sonido, browser push, nativas (APK) |
| `useBlockedModels` / `useFeatureFlags` (13) / `useTheme` / `useChatSettings` | Preferencias |
| `useSpeechRecognition` | Voz en Composer |
| `useFocusTrap` / `useOutsideClick` / `useLocalStorage` | UI infra (modals, dropdowns, persistencia genérica) |

Dependencias clave: `useConfig` alimenta a `useSessions/useMessages/useSessionSidecar/
useFolderPicker/useFileBrowser`; `useAI` depende de config; `usePolling` captura
refreshSessions/loadSelected por ref; `useCompletionAudio` captura awaiting+dataMode.

### 2.7 Componentes (96)

Grupos funcionales:

- **chat**: `ChatView` (header con `NoteIcon` + `jumpTarget` id+nonce, reset de
  buscador/salto por sesión), `Composer`
  (localValue + draft por sesión + slash menu + mic + imágenes + **anillo violeta
  sincronizado** por `--ring-delay` alineado al reloj + drop de archivos que
  inserta ruta), `MessageList` (ventana `visibleCount` 40 iniciales, tope
  `messages.length`, `revealMessageID/revealNonce` que expande + scroll +
  `msg-flash`, buscador con `CSS.escape`), `MessageBubble` (lazy),
  `ToolPart` (compact, DiffStatBadge+DiffView, highlight compartido),
  `ThinkingBlock`, `Markdown`, `HighlightedCode` (highlight único: lowlight +
  langFromFilename + sanitize), `QuestionPrompt`/`PermissionPrompt`,
  `PromptHistoryPanel` (clic salta y revela),
  `ChatNotesPanel` (bloc por sesión, papel rayado, debounce 400ms).
- **sesiones**: `SessionList/Card/Toolbar`, `QuickAccessCard` (DRY favoritos/activos/
  recientes), `InlineRename`, `FavoritesManager`, `ArchivedList`.
- **archivos/git**: `PCFilesPanel` (visor por líneas + `PcfCodeLines`), `FileBrowser`,
  `FileEditor` (modal delega en `CodeMirrorEditor` lazy), `CodeMirrorEditor`
  (**editor único**: CodeMirror 6, núcleo + solo el lenguaje activo por import
  dinámico, Tab inserta indent, history/undo, autocompletado, highlight con
  vars `--code-*`),
  `DiffViewer`, `GitToolbar`, `ImageEditor`, `DocEditorPanel`,
  `ADEDiffPanel`, `FolderPicker` (también crea sesión en carpeta elegida).
- **escritorio**: `RemoteDesktop`, `shellPanels` (todos los paneles), `TabBar`
  (drag solo-URL + `browserTabUrls`, drop crea tab en índice),
  `KanbanPanel` (look pro + botón Enviar por tarjeta → modal con
  prompt editable + buscador de sesiones, `sendPrompt` a la elegida),
  `SourceControlPanel` (SCM completo: Changes/History, graph lanes,
  staging, commit/push/pull/fetch, diff modal).
- **infra**: `NavBar`, `BottomSheet`, `Modal*`/`ModalHeader`, `ErrorBoundary`,
  `ContextMenu`, `DropdownMenu`, `ConnectionNotices`,
  `Toasts` (`ToastProvider` en `App.tsx`: avisos flotantes por encima del contenido).
- **settings**: `SettingsPanel`, `ThemePicker`/`ThemeCreator`, `ProviderManager`,
  `ConnectProviderSheet`.

Pesados vía `lazyRetry` (lazy + auto-reload del chunk): MessageBubble, shellPanels
completos (ShellPanel/Explorer/Kanban/Config/FileEditor/Browser/Design/Terminal/
SourceControl) — así @xterm queda fuera del bundle eager.

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
│  │ kanban   │  │  panel 2 │  panel 3 │                │            │
│  │ config   │  │ browser  │ terminal │                │            │
│  │          │  └──────────┴──────────┘                │            │
│  └──────────┴─────────────────────────────────────────┘            │
│  bottomBar 26px · status 22px                                      │
│  DesktopState: layout{cols,rows,panelKinds,panelIds,               │
│    panelEditorTabStacks,panelBrowserUrls,colSizes,rowSizes}        │
│    + sidebarWidth (clamp 200-480) + tabStacks[]                    │
└────────────────────────────────────────────────────────────────────┘
```

- `src/shell.ts` — cliente tipado `/shell/*`: `ShellPanelKind`
  `session|editor|terminal|explorer|kanban|docs|updates|labs|browser|doc|design|config`
  (ver `SHELL_PANEL_KINDS`), más `kanbanPromptText` (prompt prearmado título+notas),
  clientes git (log/diff/stage/unstage/discard/commit/push/fetch/pull/branches/
  checkout/showCommitDiff) y `fs.*` (incluye `move` para drag&drop entre carpetas,
  `read` trunca a 64KB).
- `components/shellPanels.tsx` (adelgazado tras absorber el explorer) — `ShellPanel`, `ExplorerPanel` (adaptador fino sobre el explorer único `features/pc-files/PCFilesPanel`, con `initialCwd` + `onOpenSessionDir`; el drag&move interno vía payload `application/x-opencode-path` y los drops OS externos viven ahí),
  `KanbanPanel`, `FileEditorPanel` (tab-bar 24px),
  `BrowserPanel` (sub-WebView + PiP in-page + forwarder Ctrl+rueda + polls
  `/shortcuts` 350ms y `/url` 2s + fallback iframe con preflight + banner),
  `DesignPanel` (iframe od-web), `TerminalPanel`
  (WS :4849), `SourceControlPanel` + `scm/{graph.ts,GraphRail.tsx,HistoryPane.tsx}`.
- `App.tsx` (~412L, delega en `useAppController`) hotspots desktop: `DESKTOP_STATE_KEY`/`loadDesktopState` (migra estados
  viejos), `ShellPanelCell` (DnD 5 dropZones, swap/split/openFile), clamp sidebar.
  `DesktopState` incluye `panelBrowserUrls` + `browserTabUrls` (drag de tabs).
- **Browser nativo**: bounds al hijo en píxeles LÓGICOS; omnibox resync solo al
  cambiar tab/URL (nunca mientras se escribe); PiP exige gesto real dentro de la
  página (clic `<video>` → PiP nativo, clic región → Document PiP con restore en
  `pagehide`); **drag Chrome ↔ app solo-URL** (`utils/urlDrag.ts`: 5 MIME
  `application/x-opencode-browser-tab|text/uri-list|URL|text/x-moz-url|text/plain`,
  `copyMove`; drop interno por `tab-index` prioriza reorden).

Móvil: navegación state-based con navStack (sessions/detail/settings/help + sheets);
back button hardware cierra en orden: picker → sheet → detail → dialog exit.

### 2.9 Escritorio remoto

- `components/RemoteDesktop.tsx` + `hooks/useRemoteDesktop.ts` — visor MJPEG con
  gestos (tap=click, long-press=click derecho, 2 dedos scroll/pinch), fit-to-screen
  Baja/Media/Alta, stats chip, selector de fuente con miniaturas. Cero tráfico si el
  modal está cerrado (abort + revoke blobs). El agente Go backend fue eliminado (§10).

### 2.10 i18n y temas

- `i18n/` — en/es/it/zh. Keys nuevas **SOLO en `en.ts`/`es.ts`**; it/zh caen al inglés
  por fallback de `createTranslator` (`test:i18n` lo verifica; ej.
  `settings.chatReduceMotion` solo existe en en/es + tipo en `i18n.ts`).
- Temas: 30+ JSON en `public/themes/`, resueltos a CSS variables en runtime
  (`utils/resolveTheme.ts`), creator custom, test de contraste (`check:contrast`).

### 2.11 Empaquetado móvil

- `android/` — proyecto Gradle nativo. El build copia `web/dist` a
  `app/src/main/assets/public/` con `python scripts/copy-dist.py` porque
  `npx cap copy` falla con EPERM en `app-icon.png` (trampa conocida).
- `ios/` — proyecto Xcode; CI en Codemagic firma y publica.
- Firma Play Store: keystore externo (no commiteado).

### 2.12 Estilos — 28 archivos `src/styles/`

`tokens.css` (tokens light/dark `var(--*)`: modo claro sin hex oscuro en chrome;
viewports web/iframe, terminal TUI y badges SCM conservan sus colores) ·
`base.css` · `layout.css` (grid, resizers 4px) · `chat.css` (incluye `.msg-flash`) ·
`composer.css` (anillo: `--ring-delay` para fase compartida) ·
`motion.css` (transiciones GPU + `html.no-motion` que apaga todo) ·
`notes.css` (bloc papel rayado solo tokens) · `editor.css` (highlight OneDark→`var(--code-*)`) ·
`desktop.css` · `sessions.css` · `settings.css` · `modals.css` (`will-change`) ·
`shell.css` (kanban pro: headers Linear, tabs 8px, cards sin saltos) ·
`browser.css` · `pc-files.css` (visor `--code-bg`) · `titlebar.css` ·
`buttons/forms/utilities/responsive/canvas/learning/scm.css` ·
`styles.css` import-all. Tokens: `--space-1..8`, `--radius-sm/md/lg` (radio ley 6px),
`--shadow-sm/md`, z-index sticky/modal-backdrop(40)/modal(50),
`--font-family/--font-mono`, tipografía ley 13px body / 12px small / peso max 600.
Animaciones `.fade-in/.animate-spin/.typing-dot` respetan `prefers-reduced-motion`
+ toggle manual `reduceMotion`. Transiciones 120-150ms, sobriedad Antigravity
(ver `DESIGN.md`).
Breakpoints ≤780px (tablet/mobile) y ≤430px (teléfono chico). Elementos hover-only
llevan fallback `@media (hover: none), (pointer: coarse)`.

### 2.13 Tests y benchmarks

Suites npm: `test` (vitest unit 1679), `test:i18n`, `test:ui`, `test:settings`,
`test:model`, `test:rendered`, `check:contrast`. Del refactor: entities, shared/api,
sse+chat, utils con tests por dominio (incl. `sessionDirs`, `urlDrag`,
`browserSync`, `browserPipScript`, `chatNotes`, `ComposerRing`,
`ChatCustomizerMotion`, `MessageListReveal`). Un solo archivo:
`pnpm --dir web exec vitest run src/<ruta>/file.test.ts`. `benchmarks/runner.mjs` — benchmarks
de render/lógica. Regla: todo domain/application puro lleva `.test.ts`.

---

## 3. `desktop-app/` — shell de escritorio Rust

### 3.1 Qué es

Binario Windows portable (`openher-desktop`, crate `hyper`/`tokio` + `wry`/`winit` +
`tray-icon`) que:

1. Sirve la misma web app (`web/dist`) por HTTP local en `127.0.0.1:4848`
   (escanea hasta +200 puertos si está ocupado).
2. La muestra en una ventana nativa con **WebView2 como child** (no Tauri).
3. Expone capacidades nativas al frontend por REST `/shell/*` + WebSocket PTY (:4849).

Portable: todo el estado vive en `data/` junto al exe (config.json, kanban.json,
window-geometry.json, cache/, web-dist/, webview/). Autostart opcional HKCU Run.
Tray icon Abrir/Salir + restore click izquierdo. Sin single-instance guard.

### 3.2 Arranque (`main.rs`)

```
panic hook → MessageBoxW + openher-desktop-error.log
  │
load_config() + load_persisted() (state.rs)
  │
http_server.rs: Server::http("127.0.0.1", port→port+200 scan) ──► hyper/tokio → api::dispatch
  │ web_dist_dir(): env OPENCODE_DESKTOP_DIST → <exe>/data/web-dist → ../../web/dist
  │
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

### 3.3 API HTTP (`src/api.rs` + `infrastructure/http/` — 19 routers)

`api.rs` despacha por prefijo a routers (`browser|config|design|doc|docs|external|fs|
kanban|opencode|plugin|preview|proxy|pty|scm|search|server|team|window|zen`);
prohibido agregar `if path ==` nuevo. Grupos:

| Grupo | Rutas |
|---|---|
| Salud/config | `GET /shell/health`, `GET /shell/mem` (RSS app + WebView2, ver `memx.rs`), `GET\|POST /shell/config`, `config/export\|import`, `GET\|POST /shell/autostart`, `GET\|POST /shell/session-state`, `/shell/window/*` |
| Filesystem | `GET /shell/fs/drives\|list\|read(64KB)\|resolve\|session\|pick-folder\|pick-app\|favorites`, POST `delete\|trash\|copy\|write\|mkdir\|reveal\|exec\|move` |
| Git (SCM) | `GET /shell/git/status\|log\|branches\|remote-url`, POST `stage\|unstage\|discard\|commit\|push\|fetch\|pull\|checkout\|commit-diff\|show-commit-diff` (router `scm_router.rs`, motor `gitx.rs`) |
| Docs engine | `POST /shell/doc/save` (escribe MD) · `POST /shell/doc/convert` desacoplado (HTTP 400) |
| PTY | `GET /shell/pty`, `POST /shell/pty?shell=&cwd=`, `GET /pty/{id}/buffer?since=`, POST `write\|resize`, DELETE |
| Kanban | `GET /shell/kanban`, POST/DELETE board, POST/PATCH/DELETE card (`data/kanban.json`, `save()` loguea a stderr) |
| Server manager | `GET /shell/server`, `POST /shell/server/start\|stop` (`srvman.rs`) |
| Updates/docs | `GET /shell/updates?refresh=1` (cache 1h), `GET /shell/docs[\|/read]` |
| Plugins/Labs | `GET /shell/plugins[\|/running]`, `POST run`, `GET /shell/plugin/{name}/{rel}`, `GET /shell/opencode/global`, `/shell/labs` + POST start |
| External | `/shell/external/*` (opendesign:3000, vioeditor:1420, m3e-canvas:3005, screenshots:3002; guard `starting` 20s + gracia boot 25s + dedup frontend) |
| Preview | `POST /shell/project/serve`, `/shell/preview/*` |
| Web search | `GET /shell/search?q=` (DDG lite top3, cache 6h `data/cache/search/<hash>.json`) |
| Proxy CORS | ANY `/shell/proxy?url=` (limpia CSP/X-Frame, cap 16MB, sanitize_proxy_html) |
| Browser embebido | 9 rutas `POST /shell/browser/open\|bounds(LogicalPosition/Size)\|visibility\|navigate\|close\|eval(allowlist)\|pick`, `GET url\|shortcuts(drenado 350ms)\|pick` (sub-WebView2 UA Chrome, MemoryUsageLevel Low oculto) |
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
| `memx.rs` | snapshot RSS app + WebView2 descendientes (`msedgewebview2.exe` vía ToolHelp32 + cadena de padres) → `GET /shell/mem` |
| `http_server.rs` + `infrastructure/` | servidor + 19 routers HTTP (ver §3.3) |
| `fswatch.rs` | watcher FS nativo |
| `fsx.rs` | operaciones FS (`move_entry`: rename atómico mismo volumen, fallback copy+delete cross-volume, rechaza carpeta dentro de sí/descendiente, colisión → sufijo `-copia`) |
| `gitx.rs` | motor git std-only (timeout por polling): porcelain v2 parser portado de terax, 19 operaciones, 13 tests |
| `scm_router.rs` | primer router `infrastructure/http/` (rutas `/shell/git/*`) |
| `kanban.rs` | modelo Board/Column/Card + store |
| `plugins.rs` | registry manifests (`data/plugins/<name>/plugin.json`: type web/command/link) + labs |
| `updates.rs` / `srvman.rs` | feed updates cache 1h / gestor del server opencode |
| `browser_view.rs` | sub-WebView manager + waker `AppEvent::BrowserWork` (sale de `ControlFlow::Wait`) |
| `common.rs` / `docsx.rs` | helpers / docs |

Tests Rust: `cargo test` — gitx 13, fsx 16. Nota RAM: 1,1GB típicos son `opencode2.exe serve --service`
(`opencode.db` multi-GB + granja MCP), no la UI (heap JS ~40MB).

---

## 4. Plugins externos on-demand (open-design, vioeditor, m3e-canvas, screenshots)

**Proyectos ajenos NO vendorizados**, declarados en
`web/src/features/external-plugins/config.ts` (`EXTERNAL_PROJECTS`):

| Plugin | Puerto | Dir |
|---|---|---|
| opendesign (nexu-io/open-design, Apache-2.0) | 3000 | `G:/Proyectos/open-design` |
| vioeditor (Vite + Tauri) | 1420 | `G:/Proyectos/17-vioeditor/aplicacion` |
| m3e-canvas (lnkiai/m3e-canvas) | 3005 | `G:/Proyectos/m3e-canvas` |
| screenshots (Next.js) | 3002 | `G:/Proyectos/0 screenshots` |

- Ciclo de vida: desktop-app expone `/shell/external/*` + `/shell/design/*`
  (guard `starting` 20s + gracia boot 25s backend, `dedupedStart` frontend;
  kill al cerrar pestaña). La web los muestra en iframe on-demand — 0 MB en reposo.
- Actualización: `git -C <dir> pull && pnpm install` (fuera del repo). `.gitignore` ignora `/od-web/`.

---

## 5. Flujos críticos

### 5.1 Enviar mensaje

```
Usuario type → Composer localValue+useTransition (+ drop de archivo inserta ruta,
`plugin:insert-text` inserta texto del visor)
   ▼ Enter
useAppController.handleSend(text = localValueRef)  ← siempre explícito
   │ visualSelection? → formatSelectionForPrompt
   │ offline? → queueAction → "queued"
   │ recordPrompt (+ PromptHistoryPanel), stopGenerationRef=false
   ▼
useMessages.updateSend()
  parseCommand → returns tempranos (/help /status /undo /redo /compact /themes /connect)
  agente ocupado? → enqueueOutbox (burbuja pendiente con eliminar/editar/enviar-ahora, auto-flush al liberar)
  buildOptimisticMessage → push optimisticIDs/Texts
  isSending=true, awaiting=true (+ anillo del Composer con fase compartida `--ring-delay`)
  api.sendPrompt → POST /session/{id}/prompt_async (v1) o /api/session/:id/prompt {text} (v2)
  ok → loadSelected + poll deadline 8s(+12s imgs) cada 1.5s hasta que id desaparezca

        ┌────────────── SSE ──────────────┐
        │ applyDelta/Part batch rAF → setMessages merge → rendered → MessageList │
        └─────────────────────────────────┘
```

Comandos slash: `/help`→vista ayuda, `/status`→mensaje estado optimista,
`/undo`→revert, `/redo`→unrevert, `/compact`→summarize, resto→sendCommand/sendPrompt.

### 5.2 `loadSelected` — merge que nunca encoge

```
ANTES del await: loadedSessionIDRef = sid
limit 200 (ultra/miser 100) → api.loadMessages safeLimit=min(limit,200) → safe filter !!info.id
setMessages merge incremental por id:
  for prev (solo sid):
    si updated existe → extraLocal = parts.filter(!remoteIDs.has)
                        → parts = [...updated.parts, ...extraLocal].sort(id)
    else conservar prev (ventana acotada)
  for remaining → push; sort por time.created
  confirmar optimistas por id/text/imgCount
`MessageList` pinta por ventana `visibleCount` (40 iniciales, botón
"Cargar anteriores" con tope `messages.length`); el salto (historial/buscador)
publica `revealMessageID` +nonce → la lista expande hasta el id + scroll +
msg-flash (reintentado).
Entrada a sesión: spinner (`loadingSessionID`) + velo oculto hasta asentar el
scroll (sin "llevar" animado); buscador/salto se resetean por sesión. La
entrada distingue CAMBIO de chat (abajo + reset) de RETORNO al mismo chat
(remontaje o reload tras minimizar: restaura donde lo dejaste si la memoria
es reciente; `resolveSessionEntry`). `useFollowTail` guarda distancia-al-fondo
+ primer mensaje visible con offset (+ vuelco a sessionStorage al ocultar,
ventana 2h) y restaura por MENSAJE (`anchorScrollToSaved`: inmune a que el
streaming crezca abajo en ausencia, con fallback a distancia), re-afirmando
tras resize/visibilidad con snapshot anti-envenenamiento.
```

Reglas que NO romper: optimista NO se remueve tras send; merge-only SIEMPRE;
`partID` monotónico `part_<hex>`; `translationOriginals` cap 200.

### 5.3 SSE ↔ Polling — ahorro de datos

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

### 5.4 Detección v1/v2

```
health → /global/health raw → v1 si 200 ; si 404 → /api/health → v2
forced config.apiVersion override · memo por host · onApiVersionChange → tick SSE
v2: /api/session, POST {text} (model/agent por sesión), /interrupt,
    /revert/stage+commit, /revert/clear, /compact, /model, /fs/*, /vcs/*,
    location[directory]= · NO: todo ([]), writeFile
v2 prompt rechaza model/agent en body (400)
```

### 5.5 Offline

```
IndexedDB openher v3 (never downgrade; recrea si corrupta)
  cacheSessions upsert; cacheMessages read→union→write + AES-GCM
  onLoadSelected: getCachedMessages → preloadMessages inmediato → red
useOfflineQueue: pendingActions IndexedDB → dequeueAll al volver connected
useNetworkMode: Capacitor Network → auto ultra/miser
```

### 5.6 Conexión y errores de red

Retry 1× backoff exponencial (1s, 2s) en `shared/api/client.ts`.
`backgroundFailureCountRef`: 3 fallos consecutivos de poll → "offline";
primera carga fallida → "offline" directo, siguientes → "reconnecting"→"offline".
`loadSessionRef`/`loadSelectedRequestRef` descartan respuestas stale.

---

## 6. Persistencia

| Dónde | Qué |
|---|---|
| `localStorage` | `ServerConfig{host,port,user,pass,apiVersion}`, `dataMode`, `theme`, `language`, `favorites`, model/agent GLOBAL, `recentModels/blockedModels/featureFlags/chatSettings` (21 campos, incl. `reduceMotion`), `openher.chatNotes.<id>` (nota por sesión, 20KB), última carpeta del FolderPicker, columna kanban por tarjeta, `servers:ServerProfile[]`, `activeServer`, `desktopState` (+`browserTabUrls`), `composer`, `cursor` |
| `Documents/opencode-config.json` | sobrevive reinstalación (`persistentStorage.ts`), password cifrada |
| `IndexedDB openher v3` | `sessions, messages, pendingActions` — merge-only, recrea si corrupta |
| `desktop-app data/` | `config.json, kanban.json, window-geometry.json, cache/search/<hash>.json (6h), web-dist/, webview/` |
| `server` | Source of truth: `opencode.db` WAL (`session`, `part/message/todo`, `event_sequence`) |

---

## 7. Toolchain — build & deploy

```
pnpm --dir web build ──► node scripts/gen-desktop-css.mjs && tsc -b && vite build → dist/
       │
       ├─► APK: python web/scripts/copy-dist.py (NO cap copy — EPERM)
       │       → ./gradlew assembleDebug → scripts/update-app.ps1
       │         (bump + build web + APK + publica /openher.apk y openher-version.json)
       │
       └─► Desktop: cargo build --release → scripts/build-desktop.ps1 [-SkipWeb] [-Run]
              → dist-desktop/ (exe portable sin consola + data/web-dist)
```

| Script | Qué hace |
|---|---|
| `scripts/update-app.ps1` | bump versión + build web → copy-dist → gradle → publica `/openher.apk` + `openher-version.json` |
| `scripts/build-desktop.ps1/.bat` | web build → cargo release → empaqueta exe + web-dist |
| `scripts/start-opencode-v2.bat` | verifica `opencode2`, asegura config (port 4097, 0.0.0.0), arranca detached |
| `codemagic.yaml` | CI real: iOS (mac_mini_m2 Xcode16 firma + ASC) y Android (assembleRelease APK/AAB) |
| `.env` | solo usuario/contraseña (gitignored) |

Regla crítica operativa: **nunca levantar servers/procesos largos desde el chat** —
usar `Start-Process`/`.bat` detached; comandos >30s detached o timeout explícito.
Antes de commit: `tsc -b --noEmit` + `build` + `cargo check` +
`pnpm test` + `test:i18n`/`test:ui`/`test:settings`/`test:model` +
`copy-dist.py failures:none` verdes. Commitear solo hunks propios
(`git apply --cached`; nunca `git commit -- <path>`: re-stagea el worktree).

---

## 8. Decisiones arquitectónicas (registro)

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
| D10 | **Python → Rust** manteniendo contratos JSON exactos | Un runtime nativo compartido con el desktop-app, sin Python en producción |
| D11 | **Refactor FSD + Hexagonal incremental** con tests por fase | Migrar sin big-bang; App.tsx ya delgado (~412L), `shellPanels.tsx` adelgazado (~2.1KL tras absorber el explorer) |
| D12 | **Sin librería de estado global**; hooks + Context + CSS variables | Alcance contenido; evita dependencia y boilerplate |
| D13 | **Plugins externos on-demand** (`EXTERNAL_PROJECTS`, no vendorizados) | Evaluar integración sin contaminar builds; 0 MB en reposo |
| D14 | **Optimista confirmado por match** (no se remueve tras send) | Evita el parpadeo "el mensaje aparece cuando responde el asistente" |
| D15 | **MJPEG por fetch+blob** (no `<img>`) | Chromium no envía Authorization en URLs de imagen |
| D16 | **CodeMirrorEditor único editor** (FileEditor delega vía lazy; CodeMirror 6 modular) | Núcleo + solo el lenguaje activo; sin Monaco ni workers |
| D17 | **Highlight compartido** (`HighlightedCode`: lowlight + langFromFilename + sanitize) | ToolPart y visor reusan; paleta `var(--code-*)`, sin duplicar lógica |
| D18 | **Outbox por sesión** en vez de bloquear el Composer | Mensaje con agente ocupado queda pendiente con eliminar/editar/enviar-ahora |
| D19 | **Anillo sincronizado** (`--ring-delay` alineado al reloj) + **`reduceMotion`** (`html.no-motion`) | Sesiones activas giran en fase; accesibilidad manual más fuerte que el media query |
| D20 | **Drag Chrome ↔ app solo-URL** (5 MIME, `copyMove`, `tab-index` = reorden) | Nada de payload interno; no duplica tabs al reordenar |
| D21 | **Bounds del browser en píxeles lógicos** + omnibox resync diferido + PiP con gesto in-page | Rust usa `LogicalPosition/Size`; el navegador exige gesto real para PiP |
| D22 | **Puente página→host sin Rust** (drenar `/shortcuts` + poll `/url` + forwarder Ctrl+rueda) | Zoom/atajos/redirects sin tocar el shell |
| D23 | **RAM nativa vía `/shell/mem`** (`memx.rs`: app + WebView2 descendientes) | Distingue heap JS de bulto nativo; la RAM real suele ser `opencode2` + `opencode.db` |
| D24 | **Sesiones con `dirKey` normalizada + backfill por-dir** (unión priorizada, cap 150) | Mismo dir escrito distinto (`/` vs `\`, case, trailing) agrupaba separado; el historial capado congelaba proyectos |
| D25 | **Modo claro por tokens** (`var(--*)` en `tokens.css`, hex oscuro prohibido en chrome) | Un solo cambio de tokens invierte el tema; terminal/TUI, viewports web y badges SCM conservados |

---

## 9. Trampas conocidas (verificadas) y edge cases

1. `npx cap copy` falla EPERM en app-icon.png → `python web/scripts/copy-dist.py` + gradle aparte.
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
12. `useOfflineCache`: DB sin stores por migración vieja → recrear (delete con retry si hay conexiones bloqueantes).
13. `useMemoryCleanup`: limpia mensajes de otras sesiones >5min cada 60s.
14. `lastMessageTsRef` (por sesión) alimenta carga incremental; `translationOriginals` cap 200.
15. Perfiles servidor (`useServers`): `updateProfile` preserva id para no perder el activo.
16. Config persistida también en Documents (sobrevive uninstall); favoritos/bloqueados en localStorage-backed Sets.
17. **Nunca `git commit -- <path>`**: re-stagea todo el worktree y arrastra hunks
    ajenos — usar `git apply --cached` con patch filtrado por markers.
18. `ChatSettings` tiene **21 campos** (`entities/ui/model.test.ts` cuenta keys):
    agregar campo = actualizar `model.ts` + `useChatSettings.ts` DEFAULTS + test + keys en/es.
19. i18n: keys nuevas **solo en `en.ts`/`es.ts` + tipo en `i18n.ts`**; it/zh por fallback
    (no agregar ahí o el test de paridad falla al revés).
20. Tests jsdom de `MessageList`: mockear `MessageBubble` a `<div data-message-id>` +
    stubs `scrollIntoView`/`scrollTo`/rAF (jsdom no los implementa).
21. Drag desde Chrome: el *tab handle* arrastra ventana, no URL — arrastrar el
    icono/candado del omnibox o un link; app→Chrome suelta sobre la barra de
    pestañas (`copyMove`, no mueve el origen).
22. `message.list` pagina por cursor pero el cliente pide una sola página (≤200):
    en sesiones de +200 mensajes los más viejos no existen localmente (fase 2).
23. `opencode.db` multi-GB (1000+ sesiones) + granja MCP/npx = `opencode2` con ~1GB:
    purgar sesiones viejas + `vacuum` si la RAM importa; el frontend es inocente
    hasta ~50MB de heap.

---

## 10. Componentes eliminados (historial)

- **`tunnel/` + `signaling-worker/`** — túnel WebRTC Go + worker Cloudflare WS.
  Eliminados en `274fd81d` (2026-08-04) junto con RemoteConnect; reemplazados por Tailscale.
- **`desktop-agent/`** — agente Go standalone de escritorio remoto (GDI MJPEG :5901 +
  SendInput). Eliminado; `RemoteDesktop.tsx` sobrevive esperando backend equivalente.

---

## 11. ¿Dónde toco qué?

- **UI chat/mensajes** → `components/Composer.tsx` (anillo `--ring-delay`), `ChatView.tsx` (`jumpTarget`, reset de buscador por sesión), `components/MessageList.tsx` (`visibleCount`+reveal), `SessionChatPanel.tsx` (panel desktop con `useMessages` propio + `loadingSessionID`), `MessageBubble.tsx`, `PromptHistoryPanel.tsx`, `ChatNotesPanel.tsx` + `utils/chatNotes.ts`, `ChatCustomizer.tsx` (+`reduceMotion`), `hooks/useMessages.ts` (outbox) + `shared/sse/`, `features/chat/` (tipos nuevos → `entities/message/`, no `types.ts`)
- **Transporte** → `shared/api/client.ts`, `version.ts`, `hooks/useSSE.ts`, `usePolling.ts`, `useSSEHandler.ts`
- **Sesiones/agentes** → `hooks/useSessions.ts`, `useAI.ts`, `utils/sessionDirs.ts` (`dirKey`/backfill), `entities/session|agent/model.ts`
- **Editor** → `components/CodeMirrorEditor.tsx` (lazy, único) + `utils/editorOps.ts`, `FileEditor.tsx` (delega), `HighlightedCode.tsx` (compartido)
- **Explorer** → `features/pc-files/PCFilesPanel.tsx` (único en sidebar/panel `__pcFiles__`/móvil/grid vía adaptador `ExplorerPanel`; confirms inline + animación `is-deleting`) + `components/Toasts.tsx` (avisos flotantes)
- **Browser** → `components/BrowserPanel.tsx`, `browserPipScript.ts`, `browserWheelScript.ts`, `browserSync.ts`, `utils/urlDrag.ts`, `desktop-app/src/browser_view.rs` + `infrastructure/http/browser_router.rs` (9 rutas)
- **Kanban** → `components/KanbanPanel.tsx` (modal enviar a sesión), `shell.ts` (`kanbanPromptText`), `desktop-app/src/kanban.rs` + `kanban_router.rs`
- **RAM** → `hooks/useMemoryUsage.ts`, `widgets/activity-bar/ActivityBar.tsx` (chip), `desktop-app/src/memx.rs` (`GET /shell/mem`)
- **Desktop shell** → `desktop-app/src/api.rs`, `main.rs`, `ptyx.rs`, `gitx.rs`, `memx.rs`, `infrastructure/http/*_router.rs` (19), `web/src/shell.ts`, `components/shellPanels.tsx`, `SourceControlPanel.tsx`, `widgets/desktop-grid/`, `widgets/titlebar/`, `app/useAppController.ts` (DesktopState/layout)
- **Estilo/tema** → `styles/*.css` (28: `tokens.css` light/dark, `motion.css` no-motion, `notes.css`, `editor.css` `var(--code-*)`, `toasts.css`) + `utils/resolveTheme.ts` + `public/themes/` + `ThemeCreator.tsx` + `DESIGN.md`
- **Deploy** → `web/package.json` scripts, `scripts/build-desktop.ps1`, `scripts/update-app.ps1`, `codemagic.yaml`
