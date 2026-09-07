# 🧭 PROJECT_MAP.md — Mapa de Enrutamiento Rápido para Agentes de IA

> **Guía para agentes:** Este archivo elimina la necesidad de adivinar o buscar a ciegas.  
> Contiene el despacho directo (intención → archivo), trampas conocidas, arquitectura de puertos y responsabilidades exactas.

---

## ⚡ 1. Despacho Rápido por Intención (Quick Dispatch)

Si tu tarea es modificar o investigar una funcionalidad, ve **directamente** a estos archivos:

| Intención / Área | Frontend (`web/src/`) | Backend / Nativo |
| :--- | :--- | :--- |
| **Chat: Entrada & Composer** (input, adjuntos, atajos, anillo sync, outbox) | `components/Composer.tsx` (`--ring-delay`, drop inserta ruta)<br>`components/PromptPresetSheet.tsx` | — |
| **Chat: Burbujas & Markdown** (render texto, código, thinking, reveal) | `components/MessageList.tsx` (`visibleCount`+`revealMessageID`)<br>`components/MessageBubble.tsx`<br>`components/Markdown.tsx`<br>`components/HighlightedCode.tsx` (highlight único)<br>`components/ThinkingBlock.tsx` | — |
| **Chat: Tool Calls & Acciones** (bash, edit, read, outputs) | `components/ToolPart.tsx` | — |
| **Chat: Notas & Historial** (bloc por sesión, salto a prompts) | `components/ChatNotesPanel.tsx`<br>`utils/chatNotes.ts`<br>`components/PromptHistoryPanel.tsx`<br>`utils/promptHistory.ts` | — (localStorage `openher.chatNotes.<id>`) |
| **Chat: Estado & Streaming** (árbol mensajes, SSE, reconexión, outbox) | `hooks/useMessages.ts`<br>`hooks/useSSE.ts`<br>`hooks/useSSEHandler.ts`<br>`hooks/useAI.ts` | OpenCode Server (`:4096`/`:4097`) |
| **Modelos & Preguntas al Usuario** (selector, permisos, asks) | `components/ModelSelectorModal.tsx`<br>`components/QuestionPrompt.tsx`<br>`hooks/useQuestions.ts` | — |
| **Sesiones** (lista, agrupado por proyecto, `+` con FolderPicker) | `hooks/useSessions.ts`<br>`utils/sessionDirs.ts` (`dirKey`/backfill)<br>`app/useAppController.ts` | — |
| **IDE Desktop: Layout & Split** (docks, paneles, resize) | `components/shellPanels.tsx` (~3.2KL)+`components/KanbanPanel.tsx` (split P1)<br>`widgets/desktop-grid/`<br>`widgets/titlebar/` | `desktop-app/src/main.rs` |
| **IDE: Terminal PTY** (xterm, tabs de terminal, split) | `components/TerminalView.tsx`<br>`components/ChatTerminalDock.tsx` | `desktop-app/src/ptyx.rs`<br>(WS `:4849` o SSE) |
| **IDE: Explorador de Archivos** (árbol, picker, iconos, visor) | `features/pc-files/PCFilesPanel.tsx`<br>`components/FileBrowser.tsx`<br>`components/FolderPicker.tsx`<br>`hooks/useFileBrowser.ts` | `desktop-app/src/fsx.rs`<br>(`/shell/fs/*`, `read` 64KB) |
| **IDE: Editor de Código** (LiteEditor único, diffs) | `components/LiteEditor.tsx` (único editor)<br>`components/FileEditor.tsx` (delega)<br>`components/DiffView.tsx`<br>`components/ADEDiffPanel.tsx`<br>`utils/editorOps.ts` | `desktop-app/src/fsx.rs` |
| **IDE: Git / Control de Versiones** (staging, diff, commit) | `components/SourceControlPanel.tsx`<br>`components/scm/*` | `desktop-app/src/gitx.rs`<br>(`/shell/git/*`) |
| **IDE: Browser Integrado** (preview web, sync, PiP, drag URL) | `components/BrowserPanel.tsx`<br>`components/browserSync.ts`<br>`components/browserPipScript.ts`<br>`components/browserWheelScript.ts`<br>`utils/urlDrag.ts` | `desktop-app/src/browser_view.rs`<br>(`/shell/browser/*` 9 rutas) |
| **IDE: Kanban** (tablero + enviar tarjeta a sesión) | `components/shellPanels.tsx` (`KanbanPanel`)<br>`shell.ts` (`kanbanPromptText`) | `desktop-app/src/kanban.rs`<br>(`/shell/kanban`) |
| **IDE: RAM / Memoria** (chip JS + WebView nativo) | `hooks/useMemoryUsage.ts`<br>`widgets/activity-bar/ActivityBar.tsx` | `desktop-app/src/memx.rs`<br>(`GET /shell/mem`) |
| **Plugin Canvas M3E** (boceto pantallas → prompt al agente) | `features/canvas/` (model/store/components/register) | — (localStorage, fase 2: `/shell/canvas/*`) |
| **IDE: Computer-Use / OS Automation** (mouse, teclado, capture) | `components/RemoteDesktop.tsx`<br>`hooks/useRemoteDesktop.ts` | `desktop-app/src/computer.rs`<br>(`/shell/computer/*`) |
| **Cliente de Red / Conexión OpenCode** (endpoints REST, auth) | `api.ts` (`loadMessages` tope 200, sin paginación cursor)<br>`hooks/useServers.ts`<br>`hooks/useAutoOpencode2.ts` | `desktop-app/src/srvman.rs` |
| **Cliente Shell Desktop Rust** (comunicación HTTP local) | `shell.ts` (kinds: session/editor/terminal/explorer/kanban/docs/updates/stats/session-stats/labs/browser/doc/design/quickchat/config) | `desktop-app/src/api.rs` + `infrastructure/http/` (19 routers)<br>(`/shell/*`) |
| **Estadísticas & Métricas** (tokens, costos, gráficos) | `components/StatsView.tsx`<br>`hooks/useStats.ts` | `desktop-app/src/statsx.rs`<br>`skill-project/opencode-stats/` (`:8765`) |
| **Configuración, Temas & Atajos** (incl. reducir animaciones) | `components/SettingsPanel.tsx`<br>`components/ChatCustomizer.tsx` (`reduceMotion` → `html.no-motion`)<br>`styles/*.css` (25)<br>`shortcuts.ts` | — |
| **Android / Capacitor Nativo** | `capacitor.config.ts`<br>`scripts/copy-dist.py` | `android/` |

---

## 🚫 2. La "Zona de Trampas" (Evita perder tiempo aquí)

1. **La trampa de `web/src/{app, pages, widgets}/`: YA NO están vacíos.**
   Fueron poblados: `app/useAppController.ts` (composition root, `App.tsx` ~401L
   delega ahí), 6 pages y 9 widgets reales.
   ❌ **NO asumas scaffold vacío ni busques el God `App.tsx` de 3.600L.**
   ✅ **Código vivo en:** `app/`, `pages/`, `widgets/`, `components/`, `hooks/` y `features/`.

2. **La trampa de la ubicación de `opencode-stats`:**  
   ❌ **NO existe en la raíz:** `opencode-stats/` no está en la raíz del repo.  
   ✅ **Está en:** `skill-project/opencode-stats/` (miembro del workspace Cargo configurado en `Cargo.toml`).

3. **La trampa de EPERM al copiar dist:**  
   ❌ **NO ejecutes:** `npx cap copy` directamente (falla con `EPERM` en Windows por locks de archivos).  
   ✅ **Ejecuta siempre:** `python scripts/copy-dist.py` (dentro de `web/`) o usa `.\build-desktop.ps1`.

4. **La trampa del estado global:**
   ❌ **NO busques Redux, Zustand ni MobX.**
   ✅ El estado se maneja exclusivamente con **React Hooks + Context** y persistencia en `web/src/persistentStorage.ts` (localStorage seguro).

5. **Terminal PTY (Puertos y Protocolo):**
   - Servidor HTTP desktop: `http://127.0.0.1:4848` (sirve `web/dist` y endpoints `/shell/*`).
   - Servidor WebSocket PTY: `ws://127.0.0.1:4849` (iniciado dinámicamente como `chosen_port + 1`).
   - Terminal PTY también soporta fallback por SSE + POST en el propio `:4848` (`/shell/pty/*`).

6. **La trampa del commit con path:**
   ❌ **NO ejecutes:** `git commit -- <path>` (re-stagea todo el worktree y arrastra hunks ajenos).
   ✅ **Commitea selectivo:** `git apply --cached` con patch filtrado; verifica con `git diff --cached --stat`.

7. **La trampa de i18n it/zh:**
   ❌ **NO agregues keys en `it.ts`/`zh.ts`.** Las keys nuevas van SOLO en `en.ts`/`es.ts` + tipo en `i18n.ts`; it/zh caen al inglés por fallback.

8. **La trampa del historial de mensajes:**
   `MessageList` pinta una ventana (`visibleCount` 40 iniciales); el botón tiene tope
   `messages.length`. El server pagina por cursor pero el cliente pide UNA página
   (≤200): en sesiones de +200 mensajes los más viejos no existen localmente.

9. **La trampa del drag desde Chrome:**
   El *tab handle* arrastra ventana, no URL — arrastrar icono/candado del omnibox o
   link. App→Chrome: soltar sobre la barra de pestañas. El bridge solo mueve URLs
   (`utils/urlDrag.ts`), nunca payload interno.

10. **La trampa de los bounds del browser:**
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
 ├─ API: /shell/computer/*
 ├─ API: /shell/mem (RSS app+WebView)
 ├─ :4849 WS (PTY terminal)                │ Proxy (:4848) o directo
 └─ Proxy -> :8765 ──────────────► [ :8765 HTTP ]
                                   opencode-stats (Rust)
                                   (Lee opencode.db read-only)
```

| Puerto | Servicio | Rol |
| :--- | :--- | :--- |
| `4096` | OpenCode v1 | Servidor remoto/local del agente OpenCode (REST + SSE) |
| `4097` | OpenCode v2 | Servidor OpenCode v2 (beta, rutas `/api/*`) |
| `4848` | Desktop Shell (Rust) | Servidor local embebido en `desktop-app`. Sirve el frontend y la API `/shell/*` |
| `4849` | ConPTY WebSocket | WebSocket de la terminal xterm (puerto del shell + 1) |
| `8765` | `opencode-stats` | Monitor estadístico sobre `opencode.db` (read-only) |
| `3000`/`1420`/`3005`/`3002` | Plugins externos | opendesign / vioeditor / m3e-canvas / screenshots (on-demand) |
| `5173` | Vite Dev Server | Solo durante desarrollo activo del frontend (`pnpm dev`) |

---

## 📂 4. Mapa Estructural de Archivos Clave

### A. Frontend (`web/src/`)
- `App.tsx` (~401L): delega en `app/useAppController.ts` (composition root: sesiones, paneles, modales, `+` abre FolderPicker). Orquestador raíz ya delgado.
- `api.ts`: Cliente HTTP para el servidor OpenCode (`:4096`/`:4097`). `loadMessages` con `safeLimit=min(limit,200)`; variantes del client beta + fallback HTTP v1/v2. `sendPrompt`/`sendCommand` v2 con fallback HTTP directo si el SDK falla. `shared/api/opencodeClient.ts` inyecta `fetch` por `CapacitorHttp` en nativo (sin preflight CORS: en Android por Tailscale los POST caían aunque los GETs cargaban).
- `shell.ts`: Cliente HTTP para el backend Rust (`:4848`). 15 `ShellPanelKind` + `kanbanPromptText` + clientes git/fs.
- `utils/`: `sessionDirs.ts` (`dirKey`/agrupado/backfill), `urlDrag.ts` (bridge solo-URL 5 MIME), `chatNotes.ts` (nota por sesión 20KB), `promptHistory.ts`, `editorOps.ts`, `fsChanges.ts` (`normFsPath`).
- `hooks/useMessages.ts` (~921L): árbol de mensajes + outbox por sesión + batch SSE por rAF + `renderedCacheRef`; límite 200 (ultra/miser 100). Rehidrata bytes de imagen en el eco (`rehydrateImages` en `utils/parseCommand.ts`: el server poda dataURLs y la imagen "aparecía y se borraba").
- `hooks/useSSEHandler.ts`: Parser de eventos SSE del servidor (tokens de texto, inicio/fin de tools, errores).
- `hooks/useMemoryUsage.ts`: heap JS + `GET /shell/mem` (chip apilado en ActivityBar).
- `hooks/useChatSettings.ts`: 21 campos incl. `reduceMotion` → `html.no-motion`.
- `hooks/useDesktopLayoutState.ts`: Estado de paneles divididos (editor, terminal, git, browser).
- `widgets/titlebar/`, `widgets/desktop-grid/`, `widgets/activity-bar/`, `widgets/message-list/`: TitleBar, celdas con drops URL, chip RAM, lista de mensajes.
- `components/shellPanels.tsx` (~3.2KL, split P1 en curso) + `components/KanbanPanel.tsx` (extraído, re-export): contenedor maestro del IDE desktop (KanbanPanel con envío a sesión, BrowserPanel PiP/sync, ExplorerPanel, TerminalPanel, SourceControlPanel…).
- `widgets/message-list/MessageVirtualList.tsx`: virtualizer con medición dinámica (sin delegación: `MessageList.tsx` usa siempre la ventana sliceada de 40 — el virtualizador metía jank de 1s al abrir/cerrar y rompía el anclaje al último mensaje; tanstack fuera del eager).
- `components/LiteEditor.tsx`: editor único (FileEditor delega). `components/HighlightedCode.tsx`: highlight compartido.
- `styles/tokens.css` (+24): sistema de diseño light/dark por tokens, `motion.css` (`no-motion`), `notes.css`, `editor.css` (`var(--code-*)`). Ver `DESIGN.md` (Antigravity).

### B. Backend Desktop (`desktop-app/src/`)
- `main.rs`: Inicialización de WebView2 (`wry`), servidor HTTP (`tiny_http`), bind `0.0.0.0:4848` e inicio de hilos. `mod memx`.
- `api.rs`: Despacha `/shell/*` por prefijo a `infrastructure/http/*_router.rs` (19 routers). Sin `if` nuevo.
- `memx.rs`: snapshot RSS app + `msedgewebview2.exe` descendientes → `GET /shell/mem`.
- `ptyx.rs`: Manejo de pseudo-terminales Windows (`portable-pty` / ConPTY) y servidor WebSocket en `:4849`.
- `fsx.rs`: Operaciones nativas de sistema de archivos (lectura 64KB, escritura, listado, búsqueda, `move`).
- `gitx.rs`: Comandos git de alta velocidad (status, diffs, commits, branches).
- `browser_view.rs`: sub-WebView2 + `BROWSER_SHORTCUT_SCRIPT` + waker `AppEvent::BrowserWork`.
- `computer.rs`: Servidor de "computer-use" (captura de pantalla y simulación de mouse/teclado para IA).
- `kanban.rs`: modelo Board/Column/Card + store (`save()` loguea a stderr).
- `state.rs`: Estado global compartido en memoria del backend Rust (`AppState`).

### C. Estadísticas (`skill-project/opencode-stats/`)
- `src/main.rs`: Servidor HTTP en `:8765` con consultas SQLite directas sobre `opencode.db` sin bloquear el agente.

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
pnpm --dir web exec tsc --noEmit --skipLibCheck   # tipos (paquete web; --filter web NO matchea)
pnpm --dir web exec vitest run src/<ruta>/file.test.ts  # un solo archivo
pnpm --dir web test                            # vitest unitario (~1350)
pnpm --dir web run test:i18n                   # paridad i18n (keys solo en/es)
pnpm --dir web run test:ui                     # regresión UI
pnpm --dir web run test:settings               # regresión settings
pnpm --dir web run test:model                  # regresión modelos
pnpm --dir web build                           # build Vite a web/dist
python web/scripts/copy-dist.py                # copiar dist sin lock EPERM (verifica failures:none)

# --- Backend Rust (desde la raíz) ---
cargo check --manifest-path desktop-app/Cargo.toml  # chequeo rápido
cargo build --release             # compilar opencode-desktop.exe optimizado

# --- Build Completo (desde la raíz) ---
.\build-desktop.ps1               # Orquesta build de frontend + release de Rust
```
