# 🧭 PROJECT_MAP.md — Mapa de Enrutamiento Rápido para Agentes de IA

> **Guía para agentes:** Este archivo elimina la necesidad de adivinar o buscar a ciegas.  
> Contiene el despacho directo (intención → archivo), trampas conocidas, arquitectura de puertos y responsabilidades exactas.

---

## ⚡ 1. Despacho Rápido por Intención (Quick Dispatch)

Si tu tarea es modificar o investigar una funcionalidad, ve **directamente** a estos archivos:

| Intención / Área | Frontend (`web/src/`) | Backend / Nativo |
| :--- | :--- | :--- |
| **Chat: Entrada & Composer** (input, adjuntos, atajos) | `components/Composer.tsx`<br>`components/PromptPresetSheet.tsx` | — |
| **Chat: Burbujas & Markdown** (render texto, código, thinking) | `components/MessageList.tsx`<br>`components/MessageBubble.tsx`<br>`components/Markdown.tsx`<br>`components/ThinkingBlock.tsx` | — |
| **Chat: Tool Calls & Acciones** (bash, edit, read, outputs) | `components/ToolPart.tsx` | — |
| **Chat: Estado & Streaming** (árbol mensajes, SSE, reconexión) | `hooks/useMessages.ts`<br>`hooks/useSSE.ts`<br>`hooks/useSSEHandler.ts`<br>`hooks/useAI.ts` | OpenCode Server (`:4096`/`:4097`) |
| **Modelos & Preguntas al Usuario** (selector, permisos, asks) | `components/ModelSelectorModal.tsx`<br>`components/QuestionPrompt.tsx`<br>`hooks/useQuestions.ts` | — |
| **IDE Desktop: Layout & Split** (docks, paneles, resize) | `components/shellPanels.tsx`<br>`hooks/useDesktopLayoutState.ts` | `desktop-app/src/main.rs` |
| **IDE: Terminal PTY** (xterm, tabs de terminal, split) | `components/TerminalView.tsx`<br>`components/ChatTerminalDock.tsx` | `desktop-app/src/ptyx.rs`<br>(WS `:4849` o SSE) |
| **IDE: Explorador de Archivos** (árbol, picker, iconos) | `components/FileBrowser.tsx`<br>`components/FolderPicker.tsx`<br>`hooks/useFileBrowser.ts` | `desktop-app/src/fsx.rs`<br>(`/shell/fs/*`) |
| **IDE: Editor de Código** (LiteEditor, CodeMirror, diffs) | `components/LiteEditor.tsx`<br>`components/DiffView.tsx`<br>`components/ADEDiffPanel.tsx` | `desktop-app/src/fsx.rs` |
| **IDE: Git / Control de Versiones** (staging, diff, commit) | `components/SourceControlPanel.tsx`<br>`components/scm/*` | `desktop-app/src/gitx.rs`<br>(`/shell/git/*`) |
| **IDE: Browser Integrado** (preview web, sync, pip) | `components/BrowserPanel.tsx`<br>`components/browserSync.ts` | `desktop-app/src/browser_view.rs` |
| **Plugin Canvas M3E** (boceto pantallas → prompt al agente) | `features/canvas/` (model/store/components/register) | — (localStorage, fase 2: `/shell/canvas/*`) |
| **IDE: Computer-Use / OS Automation** (mouse, teclado, capture) | `components/RemoteDesktop.tsx`<br>`hooks/useRemoteDesktop.ts` | `desktop-app/src/computer.rs`<br>(`/shell/computer/*`) |
| **Cliente de Red / Conexión OpenCode** (endpoints REST, auth) | `api.ts`<br>`hooks/useServers.ts`<br>`hooks/useAutoOpencode2.ts` | `desktop-app/src/srvman.rs` |
| **Cliente Shell Desktop Rust** (comunicación HTTP local) | `desktop.ts`<br>`shell.ts` | `desktop-app/src/api.rs`<br>(`/shell/*`) |
| **Estadísticas & Métricas** (tokens, costos, gráficos) | `components/StatsView.tsx`<br>`hooks/useStats.ts` | `desktop-app/src/statsx.rs`<br>`skill-project/opencode-stats/` (`:8765`) |
| **Configuración, Temas & Atajos** | `components/SettingsPanel.tsx`<br>`styles/*.css`<br>`shortcuts.ts` | — |
| **Android / Capacitor Nativo** | `capacitor.config.ts`<br>`scripts/copy-dist.py` | `android/` |

---

## 🚫 2. La "Zona de Trampas" (Evita perder tiempo aquí)

1. **La trampa de `web/src/{app, pages, widgets}/`:**  
   Son **scaffolds/placeholders vacíos** reservados para una futura migración FSD.  
   ❌ **NO busques ahí componentes vivos.**  
   ✅ **El código real en ejecución está en:** `web/src/App.tsx`, `web/src/components/`, `web/src/hooks/` y `web/src/features/chat/`.

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

---

## 🌐 3. Topología de Red y Puertos

```
       [ 📱 Android APK / 🖥️ Desktop WebView2 ]
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
   [ :4848 HTTP ]                   [ :4096 / :4097 ]
desktop-app.exe (Rust)             OpenCode Server (Go/TS)
 ├─ Sirve web/dist                   ├─ REST: /session, /prompt
 ├─ API: /shell/fs/*                 └─ SSE: stream de eventos
 ├─ API: /shell/git/*
 ├─ API: /shell/computer/*                 │ Proxy (:4848) o directo
 ├─ :4849 WS (PTY terminal)                ▼
 └─ Proxy -> :8765 ──────────────► [ :8765 HTTP ]
                                   opencode-stats (Rust)
                                   (Lee opencode.db read-only)
```

| Puerto | Servicio | Rol |
| :--- | :--- | :--- |
| `4096` | OpenCode v1 | Servidor remoto/local del agente OpenCode (REST + SSE) |
| `4098` | OpenCode v2 | Servidor OpenCode v2 (beta) |
| `4848` | Desktop Shell (Rust) | Servidor local embebido en `desktop-app`. Sirve el frontend y la API `/shell/*` |
| `4849` | ConPTY WebSocket | WebSocket de la terminal xterm (puerto del shell + 1) |
| `8765` | `opencode-stats` | Monitor estadístico sobre `opencode.db` (read-only) |
| `5173` | Vite Dev Server | Solo durante desarrollo activo del frontend (`pnpm dev`) |

---

## 📂 4. Mapa Estructural de Archivos Clave

### A. Frontend (`web/src/`)
- `App.tsx`: Orquestador raíz. Monta la barra superior, tabs, vista de chat (`ChatView`), docks laterales y modales.
- `api.ts`: Cliente HTTP para el servidor OpenCode (`:4096`/`:4097`). Maneja sesiones, mensajes, prompts, aborts y auth.
- `desktop.ts`: Cliente HTTP para el backend Rust (`:4848`). Maneja `/shell/fs/*`, `/shell/git/*`, `/shell/pty/*`.
- `hooks/useMessages.ts`: Manejador central del árbol de mensajes, streaming en vivo y persistencia.
- `hooks/useSSEHandler.ts`: Parser de eventos SSE del servidor (tokens de texto, inicio/fin de tools, errores).
- `hooks/useDesktopLayoutState.ts`: Estado de paneles divididos (editor, terminal, git, browser).
- `components/shellPanels.tsx`: Contenedor maestro del IDE desktop (archivo pesado: maneja tabs de terminales, editor y navegador).
- `styles/tokens.css` y `styles/base.css`: Variables CSS del sistema de diseño (30+ temas, colores y contrastes).

### B. Backend Desktop (`desktop-app/src/`)
- `main.rs`: Inicialización de WebView2 (`wry`), servidor HTTP (`tiny_http`), bind `0.0.0.0:4848` e inicio de hilos.
- `api.rs`: Enrutador de peticiones `/shell/*` y `/api/*` hacia sus respectivos módulos.
- `ptyx.rs`: Manejo de pseudo-terminales Windows (`portable-pty` / ConPTY) y servidor WebSocket en `:4849`.
- `fsx.rs`: Operaciones nativas de sistema de archivos (lectura eficiente, escritura, listado, búsqueda).
- `gitx.rs`: Comandos git de alta velocidad (status, diffs, commits, branches).
- `computer.rs`: Servidor de "computer-use" (captura de pantalla y simulación de mouse/teclado para IA).
- `state.rs`: Estado global compartido en memoria del backend Rust (`AppState`).

### C. Estadísticas (`skill-project/opencode-stats/`)
- `src/main.rs`: Servidor HTTP en `:8765` con consultas SQLite directas sobre `opencode.db` sin bloquear el agente.

---

## 🔄 5. Flujos de Ejecución Principales (Traceability)

### Flujo 1: Envío de Mensaje y Streaming
1. Usuario escribe en `components/Composer.tsx` y presiona Enviar.
2. Llama a `sendMessage` en `hooks/useAI.ts`.
3. `api.ts` envía `POST /session/{id}/prompt` al servidor OpenCode (`:4096`/`:4097`).
4. `hooks/useSSE.ts` recibe el stream SSE y delega en `hooks/useSSEHandler.ts`.
5. `useSSEHandler.ts` procesa tokens y actualiza `hooks/useMessages.ts`.
6. `components/MessageList.tsx` y `MessageBubble.tsx` renderizan el contenido reactivamente con `Markdown.tsx` y `ToolPart.tsx`.

### Flujo 2: Terminal en Desktop
1. `components/TerminalView.tsx` inicializa xterm.js.
2. Abre WebSocket con `ws://127.0.0.1:4849` gestionado por `desktop-app/src/ptyx.rs`.
3. Input de teclado fluye vía WS -> ConPTY -> proceso (`powershell.exe` / `cmd.exe`).
4. Output del proceso se envía de vuelta por WS -> terminal xterm.

---

## 🛠️ 6. Cheatsheet de Comandos Directos

```powershell
# --- Frontend (desde carpeta web/) ---
pnpm test                         # Tests unitarios rápidos con Vitest
pnpm run test:ui                  # Tests de regresión UI
pnpm run test:model               # Tests de integración de modelos
pnpm run build                    # Build Vite a web/dist
python scripts/copy-dist.py       # Copiar dist a plataformas sin lock EPERM

# --- Backend Rust (desde carpeta desktop-app/) ---
cargo check                       # Chequeo rápido de tipos
cargo build --release             # Compilar opencode-desktop.exe optimizado

# --- Build Completo (desde la raíz) ---
.\build-desktop.ps1               # Orquesta build de frontend + release de Rust
```
