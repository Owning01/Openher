# Integración OpenDesign → opencode-remote-android (monorepo)

Este directorio `od-web/` es la copia integrada de `G:\Proyectos\open-design` dentro del monorepo `opencode-remote-android`.
Mantiene su propio `pnpm-workspace.yaml` (workspace independiente) dentro del git monorepo.

## Estructura monorepo

```
opencode-remote-android/          # git monorepo root
├── web/                          # React 19 + Vite (opencode remote)
├── desktop-app/                  # Rust (wry/tao) — shell principal
├── desktop-agent/                # Go
├── opencode-stats/               # Rust
├── od-web/                       # ← OpenDesign integrado
│   ├── apps/
│   │   ├── web/                  # Next.js 16 + React 18
│   │   ├── daemon/               # Express 5 + SQLite (od bin)
│   │   ├── desktop/              # Electron (no usado, opencode usa Rust)
│   │   └── landing-page/         # Astro (no usado en integración)
│   ├── packages/                 # contracts, sidecar, platform, etc.
│   ├── tools/                    # dev, pack, release, serve
│   ├── skills/, design-templates/, design-systems/, craft/, plugins/
│   └── pnpm-workspace.yaml       # workspace propio
└── od-sidecar/                   # (futuro) binarios irremplazables sidecar
```

**Por qué workspace separado:** `web/` usa React 19 + Vite, `od-web/apps/web` usa React 18 + Next.js 16. Un único pnpm workspace con ambos causaría conflictos de peer deps. Al mantenerlos como workspaces separados dentro del mismo git repo, se preserva el aislamiento de deps y cada uno hace `pnpm install` en su carpeta.

## Limpieza realizada

### Dead dependencies eliminadas (web)
- `openai` — nunca importado (OpenAI-compatible usa fetch custom)
- `lucide-react` — nunca importado (iconos usan remix-icon-paths)
- `@formkit/auto-animate` — nunca importado (motion ya cubre animaciones)
- `three` — solo logo animado PixelScan (decorativo, tenía fallback estático)
  - Fix: `PixelScanLogo.tsx` ahora siempre usa `drawStaticLogo`, `engine.ts` reducido a solo funciones estáticas

### Terminal OpenDesign eliminado (xterm)
- Archivos borrados: `apps/web/src/components/workspace/TerminalViewer.tsx` + `.module.css`
- `FileWorkspace.tsx`: import de `TerminalViewer` removido, render de tab `terminal:<id>` reemplazado por placeholder "Terminal se ejecuta en opencode."
- Dependencias ` @xterm/xterm` + `@xterm/addon-fit` removidas de `apps/web/package.json`
- Comentarios que mencionan `<TerminalViewer>` dejados (no rompen build)
- Nota: el terminal de opencode (`web/src/components/TerminalView.tsx` con xterm 6.x) sigue intacto y es el único terminal del producto.

### Restaurado (no era dead)
- `micromark` + `micromark-extension-gfm` — usados en `apps/web/src/artifacts/markdown.ts` (core de renderizado de artefactos)
- `jspdf` — usado en `apps/web/src/runtime/exports.ts` (export a PDF)
- `posthog-node`, `prom-client`, `@opentelemetry/api`, `hyperframes` — usados en daemon (analytics, metrics, tracing, render). Restaurados tras detectar que no eran dead.

## Dependencias irremplazables (deben mantenerse como JS)

Estas NO pueden portarse a Rust sin reimplementar el producto o perder features:

| Dep | Razón irremplazable |
|-----|---------------------|
| `@excalidraw/excalidraw` | Lienzo colaborativo completo (Sketch). No hay alternativa ligera. |
| `lexical` + `@lexical/react` | Editor rico WYSIWYG con menciones. Reescribir = meses. |
| `shiki` | Highlight con gramáticas TextMate, lazy-loaded. Reemplazar por tree-sitter-WASM es más pesado. |
| `motion` | Backbone de animaciones en 30+ componentes. |
| `next` / `react` / `react-dom` | Framework de la web app |
| `hyperframes` (CLI) | Motor de render de motion-design empaquetado, se spawnea como binario |
| `kiwi-schema` | Único decodificador de .fig (Figma) |
| `@anthropic-ai/sdk` | BYOK chat streaming (capa delgada, pero maneja SSE) |

Estas SÍ tienen reemplazo Rust viable (futuro port del daemon):
`better-sqlite3→rusqlite`, `express→axum`, `node-pty→portable-pty` (ya lo usa opencode), `cheerio→scraper`, `jszip→zip`, `pdf-lib→lopdf`, `postcss→lightningcss`, `blake3-wasm→blake3`, `tar→tar`, etc.

## Próximos pasos para mínimo RAM

1. **Fase 1 (hecho):** Limpieza y monorepo git
2. **Fase 2 (pendiente):** Port del daemon Express→Rust (ahorro ~80-120 MB vs Node). Mantener `hyperframes`/`kiwi-schema` como sidecar binario si se necesitan.
3. **Fase 3:** Panel OD en desktop-app (Rust) que abre `http://127.0.0.1:{OD_PORT}` vía `shell.browser.open`, on-demand start/stop del daemon (0 MB idle)

## Comandos

```bash
# Instalar deps de OD (dentro de od-web)
cd od-web && pnpm install

# Typecheck
pnpm --filter @open-design/web typecheck
pnpm --filter @open-design/daemon typecheck

# Build web (static export)
pnpm --filter @open-design/web build

# Dev (requiere OD daemon)
pnpm tools-dev run web --daemon-port 7456 --web-port 3000
```

## Nota sobre duplicación
`G:\Proyectos\open-design` (original) y `od-web/` (integrado) coexisten temporalmente. Tras verificar que `od-web` compila y el monorepo funciona, archivar o eliminar el original para evitar drift.
