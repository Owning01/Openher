<div align="center">

# OpenHer

**Cliente Android/iOS + Windows para [OpenCode](https://opencode.ai) — tu asistente de código IA en el celular y el escritorio**

**Español** · [**English**](README.md)

</div>

---

<div align="center">

**Tu asistente de código IA, en todos lados** — respuestas en streaming, tools en tiempo real, terminal, explorador, git (SCM), escritorio remoto, kanban, stats y OpenCode Hub.

</div>

```
┌──────────────────────────────────────────────┐
│              📱 TU CELULAR                    │
│          OpenHer (la app)                    │
└──────────────────────┬───────────────────────┘
                       │
                       │  ① Tailscale — VPN privada
                       │     sin abrir puertos en tu router
                       ▼
┌──────────────────────────────────────────────┐
│                🖥️ TU PC                       │
│           Tailscale node                      │
│  opencode serve v1  → 0.0.0.0:4096            │
│  opencode2        → 0.0.0.0:4097              │
│  desktop-app.exe  → 127.0.0.1:4848 + WS 4849  │
│  opencode-stats   → 127.0.0.1:8765            │
└──────────────────────────────────────────────┘
```

---

## 🚀 Empezar en 2 pasos

### 📲 1 — Instalá la app en tu celular

[⬇️ **Descargar OpenHer.apk**](https://github.com/Owning01/Openher/releases/latest)

O construíla vos mismo (ver [desarrollo](#️-desarrollo)).

**iOS** (requiere macOS + Xcode 16+): cloná el repo y abrí `web/ios/App/App.xcworkspace` en Xcode, seleccioná tu team y Build & Run.

**Desktop (Windows)**: `.\build-desktop.ps1` (compila `web` con `G:\Dev\nodejs-24\pnpm.cmd` + `cargo build --release` → `desktop-app/opencode-desktop.exe` portable, `data/` junto al exe). Requiere **Node ~24** (`G:\Dev\nodejs-24\node.exe` v24.20) y **pnpm 12.0.0** binario Rust + **Rust 1.98** (`CARGO_HOME=G:\Dev\cargo`). Sin Tauri, wry+WebView2.

---

### 🖥️ 2 — Instalá Tailscale en tu PC (para acceso remoto)

OpenHer se conecta a tu servidor OpenCode por HTTP directo. Para **acceso remoto desde cualquier red** (no solo tu WiFi), usá [**Tailscale**](https://tailscale.com) — una VPN mesh privada, gratuita y sin configuración.

#### Paso A — Instalá Tailscale en la PC (servidor)

1. Instalá Tailscale desde https://tailscale.com/download (Windows/macOS/Linux).
2. Iniciá sesión con tu cuenta y uní la PC a tu tailnet:
   ```
   tailscale up
   ```
3. Buscá la IP de Tailscale de la PC:
   ```
   tailscale ip -4
   ```
   → ej. `100.101.102.103`. Anotala — nunca cambia.

#### Paso B — Iniciá OpenCode escuchando en la interfaz Tailscale

OpenCode escucha en **0.0.0.0** por defecto, así que la IP de Tailscale ya es alcanzable — sin flags extra:

```
npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096
```

> 🔒 **Tip de seguridad**: activá autenticación para que el tailnet no sea la única protección:
> ```
> set OPENCODE_SERVER_USERNAME=opencode
> set OPENCODE_SERVER_PASSWORD=<una contraseña fuerte>
> npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096
> ```

#### Paso C — Instalá Tailscale en tu celular

1. Instalá **Tailscale** desde Play Store / App Store.
2. Iniciá sesión con la **misma cuenta** que la PC.
3. Tu celular ya está en la misma red privada que la PC — incluso con 4G/5G.

#### Paso D — Conectá la app

En OpenHer: **Ajustes → Servidor**:

| Campo | Valor |
|-------|-------|
| Host | La IP de Tailscale de la PC, ej. `100.101.102.103` |
| Puerto | `4096` (o el puerto en que iniciaste el servidor) |
| Usuario / Contraseña | Solo si activaste auth en el Paso B |

Tocá **Probar conexión** y luego **Guardar**. ✓ Listo — podés usar OpenCode desde cualquier lugar, sin abrir puertos en tu router.

---

### 🏠 Alternativa: WiFi local (sin Tailscale)

Si siempre estás en la misma red:
1. En PC: `npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096`
2. En la app: **Ajustes → Servidor**, poné la IP local de tu PC (ej. `192.168.1.20`)

---

### ❓ Preguntas frecuentes de Tailscale

- **¿Es gratis?** Sí — hasta 100 dispositivos y 3 usuarios en el plan gratuito.
- **¿Necesita abrir puertos en el router?** No. Tailscale usa NAT traversal (con relay de respaldo) — tu router no necesita nada.
- **¿Por qué no un túnel QR/WebRTC?** Tailscale es más confiable (relay de respaldo), ya está probado, y le da a tu PC una IP privada estable.
- **El celular muestra "offline"?** Verificá que Tailscale esté **conectado** (verde) en el celular y que el `tailscale status` de la PC muestre ambos dispositivos.

---

## 🖥️ Desktop híbrido (Windows)

Un solo frontend (`web/`) servido por shell Rust (`desktop-app/`) en `127.0.0.1:4848` + `4850` hyper estático (mmap+br) + `4849` WS PTY. Portable — `data/` junto al exe: `config.json`, `kanban.json`, `window-geometry.json`, `web-dist/`, `webview/`.

- **Plugins externos** (`/shell/external/*`): `opendesign` 3000 + daemon 3456 (`G:\Dev\nodejs-24\node_hidden.exe "…\tools-dev.mjs" start web`), `screenshots` 3002 (Next `next start`), `vioeditor` 1420 embed, `informes` 5174 embed (mmap + `<base href="/shell/external/<name>/embed/">` para Vite `/assets/*`), `widgetnotas`. Probe TCP 250ms + `cached_probe` 1500ms, `409` si puerto ocupado. Pestañas mantienen iframes montados `visibility:hidden` (no reinicia al volver). `CloseRequested/Quit` mata todos los hijos `taskkill /F /T`.
- **Archivos**: doble panel (`PCFilesPanel` `SplitIcon`), drag&drop `shell.fs.move`, dotfiles visibles (`.git` etc.), preview HTML `HtmlPreview` vía `/shell/preview/{token}/{file}` mmap.
- **Build**: `.\build-desktop.ps1` arregla PATH (`G:\Dev\nodejs-24` primero, `corepack disable`), `G:\Dev\nodejs-24\pnpm.cmd run build` (~14s) + `G:\Dev\Python311\python.exe scripts/copy-dist.py` (`failures: none`, `vite emptyOutDir:false`) + `cargo build --release` (~4m `G:\cache\cargo-target\release\opencode-desktop.exe`).

## 🧠 OpenCode Hub

`Ajustes → OpenCode Hub` — inspecciona config viva, agentes, skills y ubicaciones.

- **Agentes**: agentes oficiales con prompts de sistema (copiar/expandir).
- **Skills**: escanea `~/.agents/skills`, `~/.claude/skills`, `~/.opencode/skills`, `~/.gemini/*`, `~/.config/skills`, `./skills`, `APPDATA\opencode\skills` — `scannedRoots` siempre visible ruta completa en gris suave `rgba(161,161,170,0.95)` sobre `rgba(161,161,170,0.10)` pill con `title`+ellipsis (backend `api.rs:840` robusto `USERPROFILE||HOME||HOMEDRIVE+HOMEPATH||APPDATA`).
- **Config**: todos los `opencode.json` encontrados (`~/.config/opencode/opencode.json` primario, `~/.config/opencode3`, `APPDATA\opencode\config.json`, etc.) — file switcher pills + **Ruta:** pill gris suave + editor JSON (formatear/guardar). Fix `better-sqlite3@13.0.3` para Node 24 (12.10 crashea `RemoveEnvironmentCleanupHook`).

---

## 📱 Datos móviles

<details>
<summary><b>Datos móviles — modos de consumo</b> (clic para expandir)</summary>

La app ajusta automáticamente el modo al detectar datos móviles (cellular → Reducido, WiFi → Full).
También podés cambiarlo manualmente en **Ajustes**.

| Modo | Polling | KB/min (idle) | ~30 min | Ideal para |
|------|---------|---------------|---------|------------|
| **Full** | 3.5s | ~35 KB | ~1 MB | WiFi ilimitado · streaming SSE en tiempo real con audio |
| **Balance** | 15s | ~10 KB | ~300 KB | WiFi o datos generosos · payload completo + notificaciones |
| **Reducido** | 30s | ~3.6 KB | ~108 KB | 4G/LTE · sin audio ni tool parts · solo polling si activa |
| **Mínimo** | 60s | ~1.8 KB | ~54 KB | Datos limitados o roaming · solo texto, sin notificaciones |

Durante generación activa el consumo puntual se multiplica 2-3× por unos segundos (respuesta con tool calls).
Cifras estimadas sobre HTTP/2 comprimido con ~10 sesiones en el servidor.

</details>

---

> 🏗️ **Arquitectura**: [`architecture.md`](architecture.md) — mapa del monorepo, flujos críticos, decisiones y trampas.

## 📁 Estructura del proyecto

<details>
<summary><b>Estructura del proyecto</b> (clic para expandir)</summary>

```
web/                           # EL PRODUCTO (un frontend para APK/iPA/desktop)
├── src/
│   ├── app/                   # composition root (placeholder)
│   ├── pages/ widgets/ features/ entities/ shared/  # FSD hexagonal (migrando)
│   ├── components/            # ~80 componentes UI (ChatView, TabBar, OpenCodeHubModal…)
│   ├── features/pc-files/     # explorador doble panel + HtmlPreview
│   ├── features/external-plugins/  # ExternalIframePanel (keep-mounted)
│   ├── shell.ts               # /shell/* cliente tipado + fileIcon
│   ├── hooks/                 # 41 hooks (useMessages, useSSE, usePolling…)
│   ├── styles/                # 17 archivos css (tokens, shell, pc-files…)
│   ├── App.tsx                # ~3600L God Component (deuda)
│   └── api.ts / types.ts      # 36 endpoints facade
├── android/ ios/              # proyectos nativos Capacitor (com.gbro.opencode)
├── dist/                      # output Vite (web/data/web-dist en desktop)
└── scripts/copy-dist.py       # workaround EPERM cap copy

desktop-app/                   # shell Windows Rust (wry + tiny_http + hyper)
├── src/
│   ├── main.rs                # wry child WebView2, prewarm external, kill_all_external
│   ├── api.rs                 # /shell/* + /shell/opencode/global + mmap
│   ├── infrastructure/http/   # external_router.rs (+ fs/scm/pty/kanban/doc)
│   ├── common.rs              # mmap+br, simd-json, probe
│   ├── fsx.rs / gitx.rs / ptyx.rs / kanban.rs / state.rs
│   └── browser_view.rs / plugins.rs

opencode-stats/                # crate Rust read-only opencode.db → :8765

(externo) G:/proyectos/open-design  # nexu-io/open-design on-demand

Cargo.toml                     # workspace ["desktop-app","opencode-stats"]
build-desktop.ps1/.bat · deploy-apk.ps1 · codemagic.yaml
```

</details>

---

## 🏗️ Arquitectura

<details>
<summary><b>Arquitectura — principios clave</b> (clic para expandir)</summary>

| Principio | Descripción |
|-----------|-------------|
| **🔄 SSE + Polling handoff** | Cuando SSE está activo, el polling corre a 5s en vez del intervalo completo. Al desconectarse, el backoff entra inmediatamente |
| **📈 Backoff exponencial** | Polling empieza en 1s, se duplica por cada fallo hasta 60s, con 30% de jitter. SSE similar pero tope en 30s |
| **📦 Offline-first** | IndexedDB cachea sesiones + mensajes. Navegar datos antiguos funciona offline; las escrituras requieren conectividad |
| **⚡ Optimistic updates** | Los mensajes del usuario se renderizan inmediatamente antes del round-trip al servidor |
| **🛡️ Stale request rejection** | `loadSelected` usa un ID de request para descartar respuestas de polling obsoletas |
| **🎨 Temas dinámicos** | 30+ temas con variables CSS aplicadas en runtime via `resolveTheme.ts` |
| **🧩 Plugins externos** | 5 proyectos vía `external_router.rs` — mmap embed + `<base href>` + node_hidden, iframes keep-mounted |
| **🧠 OpenCode Hub** | Config global viva + skills + scannedRoots (siempre visibles gris suave) vía `/shell/opencode/global` |

</details>

---

## 🛠️ Desarrollo

```bash
# web (Node 24 + pnpm 12)
G:\Dev\nodejs-24\pnpm.cmd install
G:\Dev\nodejs-24\pnpm.cmd run dev       # Vite :5173
G:\Dev\nodejs-24\pnpm.cmd run build    # tsc -b && vite build (~14s)
G:\Dev\Python311\python.exe scripts/copy-dist.py  # → desktop-app/data/web-dist

# desktop (Rust 1.98, CARGO_HOME=G:\Dev\cargo)
cargo check && cargo build --release   # → G:\cache\cargo-target\release\opencode-desktop.exe
.\build-desktop.ps1 [-SkipWeb] [-Run]  # web build + cargo + package

# apk
.\deploy-apk.ps1                       # build + upload tmpfiles.org + LINK
```

<details>
<summary><b>Stack</b></summary>

React 19.2 + react-compiler, TS 7.0, Vite 8, Vitest 4, pnpm 12 (binario Rust), Capacitor 8, Node 24.20, Rust 1.98 (tokio+hyper, memmap2, simd-json, notify), WebView2 vía wry/winit, portable-pty (pwsh7), crate opencode-stats.

</details>

---

<div align="center">

**OpenHer** es un cliente para [**OpenCode**](https://opencode.ai) — el asistente de codificación AI open-source.

Desarrollado por [@Owning01](https://github.com/Owning01) · [Reportar issue](https://github.com/Owning01/Openher/issues) · [Contribuir](https://github.com/Owning01/Openher)

</div>
