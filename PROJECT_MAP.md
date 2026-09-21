# 🧭 PROJECT_MAP.md — Mapa de Enrutamiento Rápido para Agentes de IA

> **Guía para agentes:** Este archivo elimina la necesidad de adivinar o buscar a ciegas.  
> Contiene el despacho directo (intención → archivo), trampas conocidas, arquitectura de puertos y responsabilidades exactas.

---

## ⚡ 1. Despacho Rápido por Intención (Quick Dispatch)

Si tu tarea es modificar o investigar una funcionalidad, ve **directamente** a estos archivos:

| Intención / Área | Frontend (`web/src/`) | Backend / Nativo |
| :--- | :--- | :--- |
| **Chat: Entrada & Composer** (input, adjuntos, atajos, anillo sync, outbox) | `components/Composer.tsx` (742L; `--ring-delay`, drop inserta ruta)<br>`components/composer/*` (`ComposerBar`, `SlashMenu`, `MentionMenu`, `ImageStrip`, `TurnChangesPanel`, `useMentions`, `downscaleImage`)<br>`components/PromptPresetSheet.tsx` | — |
| **Chat: Burbujas & Markdown** (render texto, código, thinking, reveal) | `components/MessageList.tsx` (`visibleCount`+`revealMessageID`)<br>`components/MessageBubble.tsx`<br>`components/Markdown.tsx`<br>`components/HighlightedCode.tsx` (highlight único)<br>`components/ThinkingBlock.tsx` | — |
| **Chat: Tool Calls & Acciones** (bash, edit, read, outputs) | `components/ToolPart.tsx` (795L)<br>`utils/toolName.ts` (fuente única de etiqueta/verbo/icono) · `utils/messageShape.ts` | — |
| **Chat: Notas & Historial** (bloc por sesión, salto a prompts) | `components/ChatNotesPanel.tsx`<br>`utils/chatNotes.ts`<br>`components/PromptHistoryPanel.tsx`<br>`utils/promptHistory.ts` | — (localStorage `openher.chatNotes.<id>`) |
| **Chat: Estado & Streaming** (árbol mensajes, SSE, reconexión, outbox) | `hooks/useMessages.ts` (621L, compositor)<br>`hooks/useMessageSend.ts` · `hooks/useStreamPatch.ts` (batching rAF)<br>`stores/outboxStore.ts` (claim/hold/cooldown 4 s) · `stores/translationOriginals.ts`<br>`hooks/useSSE.ts` · `hooks/useSSEHandler.ts` · `hooks/useAI.ts` | OpenCode Server (`:4096`/`:4097`) |
| **Modelos & Preguntas al Usuario** (selector, permisos, asks) | `components/ModelSelectorModal.tsx`<br>`components/QuestionPrompt.tsx`<br>`hooks/useQuestions.ts` | — |
| **Sesiones** (lista, agrupado por proyecto, `+` con FolderPicker) | `hooks/useSessions.ts` (205L)<br>`entities/session/sessionsPlan.ts` (fetch+merge puros; `toSessionView`/`mergeSessionPoll`)<br>`entities/session/model.ts` (**type-only**)<br>`utils/sessionDirs.ts` (`dirKey`/backfill)<br>`app/useAppController.ts` (506L) + `app/runtime/*` | — |
| **IDE Desktop: Layout & Split** (docks, paneles, resize) | `components/shellPanels.tsx` (1.1KL) + `features/shell/*` (`SingleTerminal`, `useXtermSession`, `DesignPanel`)<br>`components/KanbanPanel.tsx`<br>`widgets/desktop-grid/` (+ `hooks/{usePanelLayoutOps,useTabStackOps,usePanelDock}`)<br>`widgets/titlebar/` | `desktop-app/src/main.rs` (writer thread de geometría) |
| **IDE: Terminal PTY** (xterm, tabs de terminal, split) | `components/TerminalView.tsx`<br>`components/ChatTerminalDock.tsx` | `desktop-app/src/ptyx.rs`<br>(WS `:4849` o SSE) |
| **IDE: Explorador de Archivos** (árbol, picker, iconos, visor) | `features/pc-files/PCFilesPanel.tsx` (2.018L) + `ExplorerPane`/`usePaneNav`/`InlineRename`/`usePaneState`<br>`shared/lib/fileKind.ts`<br>`components/FileBrowser.tsx` · `components/FolderPicker.tsx` · `hooks/useFileBrowser.ts` | `desktop-app/src/fsx.rs`<br>(`/shell/fs/*`, `read` 64KB) |
| **IDE: Editor de Código** (CodeMirror único, diffs) | `components/CodeMirrorEditor.tsx` (único editor, lazy)<br>`components/FileEditor.tsx` (delega)<br>`components/DiffView.tsx`<br>`components/ADEDiffPanel.tsx`<br>`utils/editorOps.ts` | `desktop-app/src/fsx.rs` |
| **IDE: Git / Control de Versiones** (staging, diff, commit) | `components/SourceControlPanel.tsx`<br>`components/scm/*` | `desktop-app/src/gitx.rs`<br>(`/shell/git/*`) |
| **IDE: Browser Integrado** (preview web, sync, PiP, drag URL) | `components/BrowserPanel.tsx` (1.379L) + `features/browser/*` (`useBrowserTabs`, `useBookmarks`, `useBrowserFind`, `BrowserToolbar`, `BrowserHistoryMenu`, `BrowserDeviceBar`)<br>`components/browserSync.ts`<br>`components/browserPipScript.ts`<br>`components/browserWheelScript.ts`<br>`utils/urlDrag.ts` | `desktop-app/src/browser_view.rs`<br>(`/shell/browser/*` 9 rutas) |
| **IDE: Kanban** (tablero + enviar tarjeta a sesión) | `components/KanbanPanel.tsx`<br>`shell.ts` (`kanbanPromptText`) | `desktop-app/src/kanban.rs`<br>(`/shell/kanban`) |
| **IDE: RAM / Memoria** (chip JS + WebView nativo) | `hooks/useMemoryUsage.ts`<br>`widgets/activity-bar/ActivityBar.tsx` | `desktop-app/src/memx.rs`<br>(`GET /shell/mem`) |
| **Plugin Canvas M3E** (boceto pantallas → prompt al agente) | `features/canvas/` (model/store/components/register) | — (localStorage, fase 2: `/shell/canvas/*`) |
| **IDE: Computer-Use / OS Automation** (mouse, teclado, capture) | `components/RemoteDesktop.tsx`<br>`hooks/useRemoteDesktop.ts`<br>`desktop.ts` (cliente) | Agente externo OpenHer Desktop Agent (`:5901`, MJPEG `/stream` + `/input`) |
| **Cliente de Red / Conexión OpenCode** (endpoints REST, auth) | `api/index.ts` + `api/*` (12 módulos por dominio: health/sessions/messages/prompt/providers/config/fs/mcp/questions/permissions; `api.ts` es fachada; `versionDispatch.pickV2`)<br>`shared/api/*` (client/mappers/version/opencodeClient)<br>`hooks/useServers.ts` · `hooks/useAutoOpencode2.ts` | `desktop-app/src/srvman.rs` |
| **Cliente Shell Desktop Rust** (comunicación HTTP local) | `shell.ts` (kinds: session/editor/terminal/explorer/kanban/docs/updates/labs/browser/doc/design/config) | `desktop-app/src/api.rs` + `infrastructure/http/` (19 routers)<br>(`/shell/*`) |
| **Configuración, Temas & Atajos** (incl. reducir animaciones) | `components/SettingsPanel.tsx` (699L) + `features/settings/*` (secciones + `useSettingsDraft`/`useGoAccounts`/`useRemoteDesktopConfig`)<br>`components/ChatCustomizer.tsx` (`reduceMotion` → `html.no-motion`)<br>`styles/*.css` (28)<br>`shortcuts.ts` | — |
| **Android / Capacitor Nativo** | `capacitor.config.ts`<br>`scripts/copy-dist.py` | `android/` |

---

## 🚫 2. La "Zona de Trampas" (Evita perder tiempo aquí)

1. **La trampa de `web/src/{app, pages, widgets}/`: YA NO están vacíos.**
   Fueron poblados: `app/useAppController.ts` (506L, compositor) + `app/runtime/{useChatRuntime,useConnectionRuntime,useWorkspaceRuntime}.ts`; `App.tsx` (~412L) delega ahí; 3 pages y 5 widgets reales.
   ❌ **NO asumas scaffold vacío ni busques el God `App.tsx` de 3.600L.**
   ✅ **Código vivo en:** `app/`, `pages/`, `widgets/`, `components/`, `hooks/`, `stores/`, `entities/`, `shared/` y `features/` (22 carpetas).

2. **La trampa de EPERM al copiar dist:**
   ❌ **NO ejecutes:** `npx cap copy` directamente (falla con `EPERM` en Windows por locks de archivos).  
   ✅ **Ejecuta siempre:** `python scripts/copy-dist.py` (dentro de `web/`) o usa `.\scripts\build-desktop.ps1`.

3. **La trampa del estado global:**
   ❌ **NO busques Redux, Zustand ni MobX.**
   ✅ El estado se maneja exclusivamente con **React Hooks + Context** y persistencia en `web/src/persistentStorage.ts` (localStorage seguro).

4. **Terminal PTY (Puertos y Protocolo):**
   - Servidor HTTP desktop: `http://127.0.0.1:4848` (sirve `web/dist` y endpoints `/shell/*`).
   - Servidor WebSocket PTY: `ws://127.0.0.1:4849` (iniciado dinámicamente como `chosen_port + 1`).
   - Terminal PTY también soporta fallback por SSE + POST en el propio `:4848` (`/shell/pty/*`).

5. **La trampa del commit con path (y del git roto):**
   ❌ **NO ejecutes:** `git commit -- <path>` (re-stagea todo el worktree y arrastra hunks ajenos).
   ✅ **Commitea selectivo:** `git apply --cached` con patch filtrado; verifica con `git diff --cached --stat`.
   ⚠️ El `git` del PATH (`X:\Dev\git`) puede crashear (`0xC0000005`): si `git --version` no imprime nada, usá la ruta explícita `C:\Program Files\Git\cmd\git.exe` (2.55.0.5) o `G:\Dev\Git\cmd\git.exe`.

6. **La trampa de i18n it/zh:**
   ❌ **NO agregues keys en `it.ts`/`zh.ts`.** Las keys nuevas van SOLO en `en.ts`/`es.ts` + tipo en `i18n.ts`; it/zh caen al inglés por fallback.

7. **La trampa del historial de mensajes:**
   `MessageList` pinta una ventana (`visibleCount` 40 iniciales); el botón tiene tope
   `messages.length`. El server pagina por cursor pero el cliente pide UNA página
   (≤200): en sesiones de +200 mensajes los más viejos no existen localmente.

8. **La trampa del drag desde Chrome:**
   El *tab handle* arrastra ventana, no URL — arrastrar icono/candado del omnibox o
   link. App→Chrome: soltar sobre la barra de pestañas. El bridge solo mueve URLs
   (`utils/urlDrag.ts`), nunca payload interno.

9. **La trampa de los bounds del browser:**
    El hijo nativo espera píxeles LÓGICOS (`LogicalPosition/Size`); enviar `×dpr`
    descuadra el viewport. PiP exige gesto real dentro de la página.

---

## 🌐 3. Topología de Red y Puertos

```
       [ 📱 Android APK / 🖥️ Desktop WebView2 ]
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
   [ :4848 HTTP ]                   [ :4096 / :4097 ]
desktop-app.exe (Rust)             OpenCode Server (Go/TS)
 ├─ Sirve web/dist                   ├─ REST: /session, /prompt (v1)
 ├─ API: /shell/fs/*                 ├─ REST: /api/* (v2 beta)
 ├─ API: /shell/git/*                └─ SSE: stream de eventos
 ├─ API: /shell/browser/* (9 rutas)
 ├─ API: /shell/mem (RSS app+WebView)
 └─ :4849 WS (PTY terminal)
```

| Puerto | Servicio | Rol |
| :--- | :--- | :--- |
| `4096` | OpenCode v1 | Servidor remoto/local del agente OpenCode (REST + SSE) |
| `4097` | OpenCode v2 | Servidor OpenCode v2 (beta, rutas `/api/*`) |
| `4848` | Desktop Shell (Rust) | Servidor local embebido en `desktop-app`. Sirve el frontend y la API `/shell/*` |
| `4849` | ConPTY WebSocket | WebSocket de la terminal xterm (puerto del shell + 1) |
| `3000`/`1420`/`3005`/`3002` | Plugins externos | opendesign / vioeditor / m3e-canvas / screenshots (on-demand) |
| `5173` | Vite Dev Server | Solo durante desarrollo activo del frontend (`pnpm dev`) |

---

## 📂 4. Mapa Estructural de Archivos Clave

### A. Frontend (`web/src/`)
- `App.tsx` (~412L): delega en `app/useAppController.ts` (composition root: sesiones, paneles, modales, `+` abre FolderPicker). Orquestador raíz ya delgado.
- `api/` (12 módulos, 1.4KL en total): el cliente HTTP está partido **por dominio** (`health/sessions/messages/prompt/providers/config/fs/mcp/questions/permissions` + `versionDispatch.pickV2`); `api.ts` (6L) es la **fachada** que re-exporta. `loadMessages` con `safeLimit=min(limit,200)`; `sendPrompt`/`sendCommand` v2 con fallback HTTP directo si el SDK falla. `shared/api/opencodeClient.ts` inyecta `fetch` por `CapacitorHttp` en nativo (sin preflight CORS: en Android por Tailscale los POST caían aunque los GETs cargaban).
- `shell.ts`: Cliente HTTP para el backend Rust (`:4848`). 12 `ShellPanelKind` + `kanbanPromptText` + clientes git/fs.
- `utils/`: `sessionDirs.ts` (`dirKey`/agrupado/backfill), `urlDrag.ts` (bridge solo-URL 5 MIME), `chatNotes.ts` (nota por sesión 20KB), `promptHistory.ts`, `editorOps.ts`, `fsChanges.ts` (`normFsPath`).
- `hooks/useMessages.ts` (621L, compositor): árbol de mensajes + batch SSE por rAF + `renderedCacheRef`; tope 200. Partido en `hooks/useMessageSend.ts` (envío + confirmación optimista), `hooks/useStreamPatch.ts` (applyDelta/applyPart), `stores/outboxStore.ts` (claim/hold/cooldown 4 s) y `stores/translationOriginals.ts`. Rehidrata bytes de imagen en el eco (`rehydrateImages` en `utils/parseCommand.ts`: el server poda dataURLs y la imagen "aparecía y se borraba").
- `components/Composer.tsx` (742L) + `components/composer/*`: historial ↑/↓ POR SESIÓN (`opencode.remote.promptHistory.<id>`, 50 c/u; antes key global mezclaba todas). `utils/promptHistory.ts`: `extractUserPrompts(msgs, sessionID?)` filtra el panel /history a la sesión activa.
- `hooks/useSSEHandler.ts`: Parser de eventos SSE del servidor (tokens de texto, inicio/fin de tools, errores).
- `hooks/useMemoryUsage.ts`: heap JS + `GET /shell/mem` (chip apilado en ActivityBar).
- `hooks/useChatSettings.ts`: 21 campos incl. `reduceMotion` → `html.no-motion`.
- `hooks/useDesktopLayoutState.ts`: Estado de paneles divididos (editor, terminal, git, browser).
- `widgets/titlebar/`, `widgets/desktop-grid/`, `widgets/activity-bar/`: TitleBar, celdas con drops URL, chip RAM.
- `components/shellPanels.tsx` (1.140L tras partirse) + `features/shell/*` (`SingleTerminal`, `useXtermSession` —xterm/WS/zoom—, `DesignPanel`) + `components/KanbanPanel.tsx`: contenedor maestro del IDE desktop (KanbanPanel con envío a sesión, BrowserPanel PiP/sync, ExplorerPanel —adaptador fino sobre el explorer único—, TerminalPanel, SourceControlPanel…). El markdown de docs usa el `<Markdown>` compartido y los iconos son Lucide (cero emojis).
- Explorer ÚNICO `features/pc-files/PCFilesPanel.tsx` (2.018L) + `ExplorerPane`/`usePaneNav`/`InlineRename`/`usePaneState`/`useRowSelection`/`shared/lib/fileKind.ts`: el mismo en sidebar, panel `__pcFiles__`, móvil y celda explorer del grid (vía adaptador `ExplorerPanel` con `initialCwd` + `onOpenSessionDir`). Confirms inline en flujo por panel (Papelera/definitivo/ejecutar script, Aceptar/Cancelar, borde notorio) + animación de eliminado `is-deleting` (slide-out rojo 280ms, instantáneo con `no-motion`).
- Toasts flotantes `components/Toasts.tsx` (`ToastProvider` en `App.tsx`, portal a body, `styles/toasts.css`): todos los avisos del explorer salen por encima del contenido (info/error), nada inline dentro del panel.
- `components/MessageList.tsx` (ventana sliceada de 40): entrada con velo anti-salto + ancla fresca por identidad + pin en layout ante prepends; `SessionChatPanel` expone `loadingSessionID` real para cubrir vacío→caché→fetch.
- `components/CodeMirrorEditor.tsx` (lazy; `FileEditor` delega): editor único. `components/HighlightedCode.tsx`: highlight compartido.
- `styles/tokens.css` (+24): sistema de diseño light/dark por tokens, `motion.css` (`no-motion`), `notes.css`, `editor.css` (`var(--code-*)`). Ver `DESIGN.md` (Antigravity).
- **Primitivos compartidos** (`shared/lib/`): `store.ts` (`createStore`/`createEmitter`/`useStore`/`useSelector`), `async.ts` (`withTimeout`), `escapeHtml.ts`, `fileKind.ts`, `filePaths.ts`, `chatAnchor.ts`, `useFollowTail.ts`. Utils unificados: `utils/format.ts` (`formatBytes`/`formatTime` con estilo), `utils/toolName.ts`, `utils/messageShape.ts`, `shared/errors/errorShape.ts`.
- **Entidades puras** (`entities/*/model.ts`): **type-only** a propósito (importables sin React); la lógica runtime vive al lado (`entities/session/sessionsPlan.ts`). Lo pinea `entities/barrel.test.ts`.
- **Scripts de instalación: solo 2** — `scripts/install-apk.ps1` (celular: build+install+publicar el link corto) y `scripts/update-app.ps1` (global: bump + web + APK + desktop + GitHub; `-Autostart` para el arranque de opencode2). El resto del tooling vive en `scripts/` (`build-desktop.ps1`, `check-rules.ps1`, `health.ps1`, `lib/*.psm1`).
- **Reglas del repo** (ley, con enforcement): `CONTRIBUTING.md` + `AGENTS.md` (10 no negociables, lista NO TOCAR, guardrail de los tests pineados) y `tasks/rules-budget.json` + `pnpm run check:rules` (presupuestos que solo bajan: `as any`, `: any`, `export default`, `!important`, archivos >1.000 líneas, huérfanos, CSS muerto).

### B. Backend Desktop (`desktop-app/src/`)
- `main.rs`: Inicialización de WebView2 (`wry`), servidor HTTP (`hyper/tokio`), bind `0.0.0.0:4848` e inicio de hilos. `mod memx`.
- `api.rs`: Despacha `/shell/*` por prefijo a `infrastructure/http/*_router.rs` (19 routers, `design_router.rs` incluido). Helpers duplicados en `infrastructure/http/common.rs` y macro `post!` para los bloques de JSON body. Sin `if` nuevo.
- `memx.rs`: snapshot RSS app + `msedgewebview2.exe` descendientes → `GET /shell/mem`.
- `ptyx.rs`: Manejo de pseudo-terminales Windows (`portable-pty` / ConPTY) y servidor WebSocket en `:4849`.
- `fsx.rs`: Operaciones nativas de sistema de archivos (lectura 64KB, escritura, listado, búsqueda, `move`).
- `gitx.rs`: Comandos git de alta velocidad (status, diffs, commits, branches).
- `browser_view.rs`: sub-WebView2 + `BROWSER_SHORTCUT_SCRIPT` + waker `AppEvent::BrowserWork`.
- `kanban.rs`: modelo Board/Column/Card + store (`save()` loguea a stderr).
- `state.rs`: Estado global compartido en memoria del backend Rust (`AppState`).

---

## 🔄 5. Flujos de Ejecución Principales (Traceability)

### Flujo 1: Envío de Mensaje y Streaming
1. Usuario escribe en `components/Composer.tsx` y presiona Enviar (si el agente está ocupado, el mensaje queda en el outbox visible con eliminar/editar/enviar-ahora).
2. Llama a `updateSend` en `hooks/useMessages.ts` (vía `app/useAppController.ts`).
3. `api.ts` envía `POST /session/{id}/prompt_async` (v1) o `/api/session/:id/prompt` (v2).
4. `hooks/useSSE.ts` recibe el stream SSE y delega en `hooks/useSSEHandler.ts`.
5. `useSSEHandler.ts` procesa tokens (batch rAF) y actualiza `hooks/useMessages.ts` (merge incremental, nunca encoge).
6. `components/MessageList.tsx` (ventana `visibleCount` + reveal por `revealMessageID`) y `MessageBubble.tsx` renderizan con `Markdown.tsx`, `ToolPart.tsx` y `HighlightedCode.tsx`.

### Flujo 2: Terminal en Desktop
1. `components/TerminalView.tsx` inicializa xterm.js.
2. Abre WebSocket con `ws://127.0.0.1:4849` gestionado por `desktop-app/src/ptyx.rs`.
3. Input de teclado fluye vía WS -> ConPTY -> proceso (`powershell.exe` / `cmd.exe`).
4. Output del proceso se envía de vuelta por WS -> terminal xterm.

---

## 🛠️ 6. Cheatsheet de Comandos Directos

```powershell
# --- Frontend (desde la raíz: el paquete es openher-mobile-web) ---
pnpm --dir web exec tsc -b --noEmit --force       # tipos (siempre con --force: sin el, la info incremental oculta errores)
pnpm --dir web exec vitest run src/<ruta>/file.test.ts  # un solo archivo
pnpm --dir web test                            # vitest unitario (~1.797 en 143 archivos)
pnpm --dir web run test:i18n                   # paridad i18n (keys solo en/es)
pnpm --dir web run test:ui                     # regresión UI (asserts sobre texto fuente)
pnpm --dir web run test:settings               # regresión settings
pnpm --dir web run test:model                  # regresión modelos
pnpm --dir web run test:rendered               # render real del chat (corre fuera de Vite)
pnpm --dir web run check:rules                 # presupuestos del repo (solo pueden bajar)
pnpm --dir web build                           # build Vite a web/dist
python web/scripts/copy-dist.py                # copiar dist sin lock EPERM (verifica failures:none)

# --- Backend Rust (desde la raíz) ---
cargo check --manifest-path desktop-app/Cargo.toml  # chequeo rápido
cargo build --release             # compilar openher-desktop.exe optimizado

# --- Build Completo (desde la raíz) ---
.\scripts\build-desktop.ps1               # Orquesta build de frontend + release de Rust
.\scripts\install-apk.ps1                 # APK al celular conectado
.\scripts\update-app.ps1 -Notes "..."     # release global (una versión por fase)
```

⚠️ Si `git --version` no imprime nada (crashea `X:\Dev\git`), usá `C:\Program Files\Git\cmd\git.exe` o `G:\Dev\Git\cmd\git.exe`.
