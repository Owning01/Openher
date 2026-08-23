# AGENTS.md — OpenCode Mobile

Cliente Android/iOS (Capacitor) + escritorio Windows para un server remoto `opencode serve`. Thin client: toda la IA corre en el server; la app solo consume REST + SSE.
> Arquitectura completa: [`architecture.md`](architecture.md) · Catálogo: [`CATALOGO.md`](CATALOGO.md)

## Estructura

| Carpeta | Qué es |
|---|---|
| `web/` | **Producto central**: React 19 + Vite + TS + Capacitor (un frontend para APK Android, IPA iOS y shell de escritorio) |
| `desktop-app/` | Shell Windows en Rust (wry + tiny_http, NO Tauri): sirve `web/dist` en :4848, expone `/shell/*` + WS PTY (:4849) |
| `opencode-stats/` | Crate Rust read-only sobre `opencode.db` (:8765). Tiene su propio `AGENTS.md` — aplicarlo al tocarlo |
| `od-web/` | OpenDesign vendorizado (proyecto ajeno). **NO tocar ni buildear como parte de este repo** |

Sin `package.json` raíz. JS usa **pnpm** (`web/pnpm-lock.yaml`). Cargo workspace raíz: `desktop-app` + `opencode-stats`.

## REGLAS CRÍTICAS

1. **NUNCA levantar servers/procesos largos desde el chat** (el chat corre conectado al mismo server que administramos): usar `Start-Process` o `.bat` detached (`start-opencode-v2.bat`). Comandos >30s (gradle, cap sync, installs) van detached o con timeout explícito, en pasos separados.
2. **Servers**: opencode v1 en `0.0.0.0:4096` (Basic auth), beta `opencode2` como servicio en `:4097`. La app auto-detecta el dialecto (`shared/api/version.ts`, memoizado por host): v1 rutas raíz; v2 `/api/*` + respuestas `{data:...}` (prompt v2 rechaza model/agent en el body, 400).
3. **APK**: `npx cap copy/sync` falla con EPERM → copiar con `python web/scripts/copy-dist.py` + `gradlew assembleDebug` aparte, o usar `.\deploy-apk.ps1` en raíz (build completo + sube a tmpfiles.org e imprime LINK; `-SkipBuild` = solo subir). Ojo: `deploy-quick.ps1` oculta errores con `Out-Null`.
4. Antes de commit: `tsc -b`, tests y `cargo check` verdes.

## Comandos

En `web/`: `pnpm run dev` · `pnpm run build` (`tsc -b && vite build`) · `pnpm test` (vitest, jsdom) · un solo test: `pnpm exec vitest run src/<ruta>/file.test.ts`
Tras tocar `web/src`, dejar verdes además: `test:i18n`, `test:ui`, `test:settings`, `test:model` (+ `check:contrast` si tocás temas).
Rust: `cargo check / build / test / clippy / fmt` desde raíz o `desktop-app/` · Desktop: `.\build-desktop.ps1 [-SkipWeb] [-Run]`.
CI real: `codemagic.yaml` — los workflows de `.github/` fueron eliminados.

## Arquitectura esencial

- **SSE**: el type real del evento va DENTRO del JSON (`{id,type,properties}`), nunca en la línea `event:`. Server v1 1.18.x emite SOLO `message.part.delta` (partID); v2 emite `session.next.*` con body anidado en `data`.
- **Datos**: cache IndexedDB merge-only, `DB_VERSION = 2` NUNCA bajar, restauración offline; el server ignora `since`. `loadSelected` hace merge incremental por id SIEMPRE; el mensaje optimista NO se remueve tras el send (lo confirma `loadSelected` por match de texto).
- **FSD en migración**: `types.ts` es barrel → tipos nuevos van en `entities/<domain>/model.ts`. `App.tsx` (~3.600 líneas) sigue siendo el God Component; `app/`, `pages/`, `widgets/` son placeholders.
- `refreshSessions` traga errores internamente; el backoff se dispara lanzando desde el callback cuando `connectionState === "offline"`.

## FSD + Hexagonal (violación = rechazo PR)

1. Flujo unidireccional `app → pages → widgets → features → entities → shared`; entities sin React/fetch.
2. PROHIBIDO `fetch/CapacitorHttp` en componentes/hooks → ports + infrastructure/adapters o `shared/api`.
3. Ningún archivo >350 líneas (App.tsx es deuda técnica reconocida, no precedente).
4. Rust: PROHIBIDO cadena `if path == "/shell/..."` en `api.rs` → routers en `infrastructure/http/*_router.rs`.
5. Todo domain/application puro lleva `.test.ts`.

## Convenciones y trampas

named exports + `import type` · keys i18n nuevas SOLO en `en.ts`/`es.ts` (`it`/`zh` caen al inglés por fallback) · switches con `role="switch"` usan `aria-checked` · elementos hover-only llevan fallback `@media (hover: none), (pointer: coarse)` · conventional commits, cuerpo en español.

Extra: `%SystemDrive%/` en raíz es basura generada — ignorar · keystore Play Store externo, NO commiteado (`PLAY-STORE.md`) · server upstream opencode: guía del checkout local en `OPENCODE-REPO.md` (repo aparte).
