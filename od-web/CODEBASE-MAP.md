# CODEBASE-MAP.md — Mapa de referencia para IA

Mapa informativo del repositorio `open-design` (OpenDesign). Orientado a que una IA
entienda rápido el lenguaje, la estructura, la arquitectura y las convenciones
observadas en el código. Contenido puramente descriptivo, sin reglas ni prescripciones.

---

## 0. Identidad del proyecto

- **Nombre:** `open-design` (binario `od`).
- **Versión:** `0.19.2`.
- **Licencia:** Apache-2.0.
- **Propósito:** producto de diseño local-first. Detecta tu CLI de agente de código
  instalada, ejecuta "design skills" + "design systems", y hace streaming de artifacts
  a una previsualización en sandbox.
- **Runtime objetivo:** Node `~24`, pnpm `10.33.2` (vía Corepack). Todo el repo es
  `"type": "module"` (ESM).
- **Stack base:** TypeScript 5.9, React 18, Next.js 16 (App Router), Express 5,
  SQLite (`better-sqlite3`), Electron (desktop/packaged).

---

## 1. Lenguajes y tecnologías

| Capa | Tecnología |
|---|---|
| Lenguaje principal | TypeScript (strict en packages/apps individuales) |
| UI web | Next.js 16 App Router + React 18 + Tailwind CSS v4 |
| API daemon | Express 5 + Server-Sent Events (SSE) |
| Persistencia | SQLite (`better-sqlite3`) + sistema de archivos del proyecto |
| Shell desktop | Electron (`apps/desktop`, `apps/packaged`) |
| Tests unitarios | Vitest 4 |
| Tests e2e | Playwright (en `e2e/ui`) + Vitest (en `e2e/tests`) |
| Runtime de agentes | spawn de CLIs externos (claude, codex, opencode, qoder, etc.) o ACP |
| Animación | `motion` (v12), CSS transitions con easing `cubic-bezier(0.23,1,0.32,1)` |
| Markup/react | `lexical`, `micromark` + `micromark-extension-gfm` para markdown |
| 3D/gráficos | `three`, shaders, WebGL |
| Diagramas | `@excalidraw/excalidraw` |
| Resaltado | `shiki` |
| Terminal embebida | `xterm` + `node-pty` |

Dependencias clave por app están en sus `package.json` (ver `apps/web`, `apps/daemon`).

---

## 2. Estructura del monorepo (pnpm workspace)

`pnpm-workspace.yaml` incluye: `packages/*`, `apps/*`, `tools/*`, `e2e`.

### 2.1 `apps/` (aplicaciones)
| Carpeta | Rol |
|---|---|
| `apps/web` | Runtime web Next.js 16 + React 18. UI de producto, cliente de API/eventos. |
| `apps/daemon` | Daemon Express + SQLite y binario `od`. Autoridad de `/api/*`. |
| `apps/desktop` | Shell Electron. Descubre la URL web vía sidecar IPC. |
| `apps/packaged` | Entry thin de Electron empaquetado. Arranca sidecars y registra `od://`. |
| `apps/landing-page` | Sitio Astro estático de marketing/catálogo. Build independiente. |

### 2.2 `packages/` (librerías compartidas, puras en lo posible)
| Paquete | Responsabilidad |
|---|---|
| `contracts` | DTOs/app contracts web↔daemon. TypeScript puro, sin Node/Next/Express. |
| `components` | Primitivos React + CSS Modules compartidos. |
| `sidecar-proto` | Protocolo de negocio de sidecar (app/mode/source, stamp, IPC schema). |
| `sidecar` | Runtime genérico de sidecar (bootstrap, IPC transport, paths). |
| `platform` | Primitivas genéricas de procesos OS (stamp, parsing, bin discovery). |
| `host` | Contrato de host bridge web/desktop (`window.__od__`). |
| `agui-adapter` | Adaptador eventos OD → protocolo AG-UI. |
| `plugin-runtime` | Parsers/manifest/validación de plugins (puro). |
| `registry-protocol` | Protocolo de backend de registries de plugins (puro). |
| `release` | Primitivas de dominio de release (canales, versiones) puras. |
| `diagnostics` | Export de diagnósticos/logs/redacción (puro). |
| `download` | Descargas gestionadas resumibles con checksum. |
| `launcher-proto` | Protocolo/path de launcher (canal/versión/namespace). |
| `metatool` | Helpers de metadata para outputs de build de herramientas repo-local. |
| `dsh-runtime` | Runtime de design-system host. |

### 2.3 `tools/` (planos de control / lifecycle)
| Carpeta | Rol |
|---|---|
| `tools/dev` | Único entrypoint de desarrollo local (`tools-dev`). Maneja sidecars. |
| `tools/pack` | Build/instalación/updater empaquetado (mac/win/linux). |
| `tools/release` | Metadata de release, publicación, reportes. |
| `tools/serve` | Servicios de fixtures locales (`tools-serve start updater`). |

### 2.4 `e2e/` (tests de nivel usuario)
- `e2e/tests/` (Vitest, daemon HTTP boundary), `e2e/ui/` (Playwright),
  `e2e/lib/` (harness compartido de tools-dev/playwright/vitest/desktop).

### 2.5 Registros de contenido (raíz del repo)
- `skills/` — skills funcionales que un agente invoca.
- `design-templates/` — plantillas renderizables (decks, prototipos, ppt).
- `design-systems/` — sistemas de marca (tokens, reglas, fixtures).
- `plugins/` — bundles instalables (`_official/`, `community/`, `open-design/`, `registry/`, `spec/`).
- `craft/` — reglas universales de craft que un skill/template puede requerir.
- `mocks/` — CLIs mock de agentes (replay de traces) para tests sin presupuesto.
- `prompt-templates/` — templates de prompt para imagen/video.
- `specs/`, `docs/`, `scripts/`, `templates/` — documentación y scripts repo-local.

---

## 3. Arquitectura de runtime (topología)

```
browser / Electron renderer
        │  HTTP + SSE (same-origin)
        ▼
Next.js web app ── /api/* rewrites ──┐
        │                            │
        ▼                            │
Express daemon ◄─────────────────────┘
   │        │         │
   │        │         ├─ SQLite + archivos de proyecto (RUNTIME_DATA_DIR)
   │        ├─ skills / design templates / design systems / plugins
   └─ runtime registry → spawn de CLI o proceso ACP
                         → eventos estructurados, writes de archivos, o texto
```

- Web UI y CLI `od` llaman a las **mismas** APIs HTTP del daemon. El CLI no es
  una segunda implementación de lógica de negocio; es la superficie legible-máquina.
- El daemon resuelve `OD_DATA_DIR` → `RUNTIME_DATA_DIR` una vez al arrancar
  (`apps/daemon/src/server.ts`). Todos los datos del daemon cuelgan de ahí.
- Excepción: proyectos importados por carpeta usan `metadata.baseDir` (workspace externo).

### 3.1 Flujo de generación
1. Web/CLI crea/selecciona proyecto vía `/api/projects`.
2. Petición de chat/run llega al daemon.
3. El daemon resuelve proyecto + design system + skill/template primario + runtime + metadata.
4. Spawn del runtime con el workspace como cwd; stream de eventos normalizados por SSE.
5. Runtimes con FS escriben archivos canónicos → preview. Runtimes texto/BYOK entregan un
   bloque `<artifact>` que el host parsea/materializa al mismo workspace.

---

## 4. Web app (`apps/web`)

- **Framework:** Next.js 16 App Router, React 18, Tailwind v4.
- **Entrada cliente:** `apps/web/src/App.tsx`. Rutas bajo `apps/web/app/`.
- **Config:** `apps/web/next.config.ts` reescribe `/api/*`, `/artifacts/*`, `/frames/*` a `OD_PORT`.
- **Organización `src/`:**
  - `app/` — rutas App Router.
  - `components/` — componentes de feature (`*.tsx` + `*.module.css`).
  - `styles/` — globales (tokens, base/reset, app-shell). `index.css` es solo import-entrypoint.
  - `lib/` — client helpers (providers de API/BYOK, i18n, parsing).
  - `locales/` — 19 archivos i18n (`content.*.ts`); `content.ts` es la fuente `en`.
  - `hooks/` — React hooks.
- **Reutilización:** prefiere primitivos de `@open-design/components` antes de estilizar HTML plano.
- **Render mode** de previews: `components/file-viewer-render-mode.ts` decide URL vs `srcDoc`.
  Bridges (inspect, comment, palette, edit, tweaks) solo por `srcDoc`. Ambos iframes montados,
  CSS visibility toggle para evitar flash.

### 4.1 i18n
- Tipo `Dict` en `apps/web/src/i18n/types.ts`. Cada key debe existir en los 19 locales.
- Locales: `ar, de, en, es-ES, fa, fr, hu, id, it, ja, ko, pl, pt-BR, ru, th, tr, uk, zh-CN, zh-TW`.

### 4.2 CSS
- Tailwind v4 + CSS Modules colocalizados (`Component.module.css`) para componentes aislados.
- Globales solo para contratos compartidos (primitives, theme hooks, layout).
- Easing UI por defecto: `cubic-bezier(0.23, 1, 0.32, 1)`; enter ~200ms / exit ~140ms.
- Acordeón: patrón `.accordion-collapsible` + `grid-template-rows: 0fr→1fr`.
- Nunca `transform: scale(0)`; arrancar de `scale(0.9)` mínimo.

---

## 5. Daemon (`apps/daemon`)

- **Stack:** Express 5 + SQLite + spawn de procesos (`node-pty`). Binario `od` en `bin/od.mjs`.
- **Composición:** `src/server.ts` es la composition root; monta servicios, middleware y
  registra route modules. `src/cli.ts` es la CLI composition root (`SUBCOMMAND_MAP`).
- **Layout `src/`:**
  - `server.ts`, `server-context.ts`, `route-context-contract.ts`, `route-registration-guard.ts` — wiring daemon-wide.
  - `routes/` — registradores de dominio (un `register*Routes(app, ctx)` por dominio).
    - Dominios: `chat.ts`, `terminal.ts`, `social-share.ts`, `projects`, `skills`, `design-systems`,
      `plugins`, `mcp`, `media`, `memory`, `collab`, `research`, `live-artifacts`, `critique`, etc.
  - `http/` — helpers HTTP compartidos, errores, origin checks, montaje de rutas.
  - `services/` — servicios reutilizables sin Express req/res.
  - `runtimes/` — defs de runtime, spawn, parsers de stream, discovery de ejecutables.
    - `defs/` — definiciones de runtime (`RuntimeAgentDef`).
    - `claude-stream.ts`, `qoder-stream.ts`, `json-event-stream.ts`, `plain-stream.ts` — parsers.
  - `prompts/` — construcción de prompts del lado daemon.
  - `plugins/`, `connectors/`, `registry/`, `research/`, `media-adapters/`,
    `live-artifacts/`, `storage/`, `critique/`, `design-systems/`, `collab/`, `integrations/` — dominios.
  - `skills.ts`, `db.ts`, `redact.ts`, `desktop-auth.ts`, `import-export-routes.ts` — core.
- **Runtime registry:** `src/runtimes/registry.ts` recolecta un `RuntimeAgentDef` por runtime
  + perfiles locales. Detección concurrente por `resolveAgentLaunch()`.
- **Contratos:** DTOs/errores compartidos viven en `packages/contracts`, no re-declarados a mano.

### 5.1 CLI `od`
- Subcomandos en `src/cli.ts` vía `SUBCOMMAND_MAP`.
- Dual-track: toda capacidad visible al usuario debe tener ruta web/API + subcomando CLI
  (con `--json` y `--prompt-file <path|->` para prompts largos).

---

## 6. Protocolo HTTP/SSE

- Transporte: HTTP + SSE (no WebSocket). Superficies representativas:

```
GET  /api/health              GET  /api/version
GET  /api/agents              GET  /api/skills
GET  /api/design-templates     GET  /api/design-systems
GET  /api/projects            POST /api/projects
POST /api/import/folder
GET  /api/projects/:id/files   POST /api/projects/:id/upload
POST /api/chat                -> text/event-stream
```

- SSE desactiva buffering/proxy; emite keepalives. Reverse proxy debe dejar `/api/*`
  sin buffer/compresión y con timeouts largos.
- Esquema exacto evoluciona en route modules + `packages/contracts/src/api/`.

---

## 7. Registros de contenido (formato y convenciones)

### 7.1 Skills (`skills/<id>/`)
- Carpeta con `SKILL.md` (frontmatter YAML + cuerpo) y side-files (`assets/`, `references/`, scripts).
- Frontmatter relevante: `name`, `description`, `triggers`, `license`, y bloque `od:`:
  - `od.mode`: `utility` | `prototype` | `design-system`
  - `od.category`: filtro (ej. `web-artifacts`, `image-generation`, `slides`, ...)
  - `od.craft.requires`: lista de reglas craft requeridas
  - `od.design_system.requires`: bool / secciones requeridas
  - `od.example_prompt`, `od.upstream`
- Scanner lazy: se recoge en la próxima petición `/api/skills`; no requiere rebuild en dev.
- Separación: entry que *renderiza* un artifact → `design-templates/`, no `skills/`.

### 7.2 Design templates (`design-templates/<id>/`)
- Plantillas renderizables (deck, prototype, ppt, html-ppt, etc.).
- Listado bajo `/api/design-templates`; el home "Start from" las consume.
- Pueden tener `assets/`, `references/`, `scripts/`, `examples/`.

### 7.3 Design systems (`design-systems/<id>/`)
- Tres subdirs por sistema: `system/` (reglas/tokens), `source/`, `preview/`.
- `system/tokens.default.json` — tokens (ej. `colorPrimary`, `borderRadius`, `fontSize`).
- `system/DESIGN.md` u `*.md` — secciones de brand (color, typography, layout, components, a11y).
- `system/` también contiene `kit.html` / `kit.dark.html` (kit de componentes) y `index.html`.
- Servicio aparte (no es "skill root"). APIs: `/api/design-systems`.

### 7.4 Craft (`craft/`)
- Reglas universales brand-agnostic que un skill/template puede requerir vía `od.craft.requires`.
- Archivos `*.md` (ej. `typography.md`, `color.md`, `anti-ai-slop.md`, `animation-discipline.md`).
- Compuesto por el daemon, no es un registry aparte.

### 7.5 Plugins (`plugins/`)
- `_official/` (bundles oficiales: atoms, design-systems, image/video templates, scenarios),
  `community/`, `open-design/`, `registry/`, `spec/`.
- Manifiestos parseados por `packages/plugin-runtime`; protocolo backend en `registry-protocol`.
- APIs: `/api/plugins`; marketplace metadata.

---

## 8. Conventions observadas (hechos, no reglas)

### 8.1 Naming / modules
- Named exports (no default salvo entrypoints bin). `import type` para tipos.
- `*.module.css` colocalizado para estilos de componente; globales en `styles/`.
- Tests: `*.test.ts` / `*.test.tsx` bajo `tests/` hermano de `src/`, nunca bajo `src/`.

### 8.2 TypeScript
- Cada package/app tiene su `tsconfig.json`. Builds emiten `dist/`.
- `packages/contracts` build vía esbuild + `tsc --emitDeclarationOnly`.
- Root typecheck: `pnpm typecheck` (recursivo `-r`) + `scripts/tsconfig.json`.

### 8.3 Dual-track UI/CLI
- Toda capacidad usuario-facing: web UI + CLI `od` + (si aplica) contrato en `contracts`.

### 8.4 Sidecar awareness
- Lógica de negocio de app no importa `sidecar`; awarenes en `apps/<app>/sidecar` o wrapper desktop.
- Stamp de proceso: exactamente 5 campos — `app`, `mode`, `namespace`, `ipc`, `source`.

### 8.5 Boundaries
- `apps/web` NO importa `apps/daemon/src`. Contratos en `packages/contracts`.
- `contracts` puro: sin Next/Express/Node-fs/SQLite/browser.
- `sidecar`/`platform` no hardcodean claves de app OpenDesign.

---

## 9. Comandos frecuentes

```bash
pnpm install                         # tras cambiar manifests/workspaces
pnpm tools-dev                       # lifecycle local (daemon + web + desktop)
pnpm tools-dev run web --daemon-port <p> --web-port <p>
pnpm tools-dev status --json
pnpm tools-dev logs --json
pnpm tools-serve start updater
pnpm tools-pack mac build --to all   # empaquetado
pnpm guard                           # guard de scripts/allowlist
pnpm typecheck                       # typecheck global
pnpm --filter @open-design/web typecheck
pnpm --filter @open-design/web test
pnpm --filter @open-design/daemon typecheck
pnpm --filter @open-design/daemon test
pnpm --filter @open-design/daemon build
```

---

## 10. Puntos de entrada rápidos (source map)

| Preocupación | Fuente principal |
|---|---|
| Composición daemon + data-root | `apps/daemon/src/server.ts` |
| Rutas HTTP por dominio | `apps/daemon/src/routes/` |
| CLI `od` | `apps/daemon/src/cli.ts` |
| Defs de runtime + engine | `apps/daemon/src/runtimes/` |
| Loader de skills funcionales | `apps/daemon/src/skills.ts` |
| DTOs/prompts compartidos | `packages/contracts/src/` |
| UI producto web | `apps/web/src/` |
| Lifecycle dev | `tools/dev/` |
| Launch empaquetado | `tools/pack/`, `apps/packaged/` |
| Validación usuario | `e2e/` |
| Docs de arquitectura | `docs/architecture.md` |

---

## 11. Documentación de soporte

- `docs/architecture.md` — topología runtime y boundaries.
- `docs/skills-protocol.md`, `docs/agent-adapters.md`, `docs/modes.md` — protocolos.
- `AGENTS.md` (root + `apps/`, `packages/`, `tools/`, `e2e/`) — guía por capa.
- `specs/current/` — specs activas; `specs/change/` — ADRs de cambios.
- `README.md`, `QUICKSTART.md`, `CONTRIBUTING.md` — onboarding.
- `scripts/` — `guard.ts`, `postinstall.mjs`, seeds, `i18n-check.ts`, `update-nix-pnpm-deps-hash.ts`.
