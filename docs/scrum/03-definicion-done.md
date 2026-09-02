# Definition of Done — checklist técnica

Una historia está **Done** solo si TODOS los ítems aplicables pasan. Se corre el
viernes en el Review sobre cada historia del sprint.

## Web (`web/src`)

- [ ] `pnpm exec tsc --noEmit` → exit 0
- [ ] `pnpm exec vitest run` → 30+ suites, 1065+ tests, 0 fallas
- [ ] `npm run test:ui` ✓ (regresión de UI por string-matching)
- [ ] `npm run test:i18n` ✓
- [ ] `npm run build` → vite build OK (anota el tiempo)
- [ ] Si tocó settings/modelos: `test:settings` / `test:model` ✓

## Rust (`desktop-app/`)

- [ ] `cargo check` → 0 warnings nuevos
- [ ] Rutas nuevas en `infrastructure/http/*_router.rs`, NUNCA `if path == "/shell/..."` en `api.rs`
- [ ] `build-desktop.ps1` completo y exe probado al abrirlo

## Ambos / release

- [ ] `deploy-apk.ps1` genera APK y link descargable (si el cambio es visible en móvil)
- [ ] Assets viejos purgados: `dist-desktop/data/web-dist/assets` solo contiene los hashes del último build

## Reglas de código (de AGENTS.md — violación = no Done)

- [ ] Flujo FSD unidireccional: `app → pages → widgets → features → entities → shared`
- [ ] Sin `fetch/CapacitorHttp` directo en componentes/hooks → puertos + adapters
- [ ] Ningún archivo nuevo > 350 líneas
- [ ] `entities/*` sin imports de React/fetch/api
- [ ] named exports + `import type`
- [ ] Strings visibles nuevas en `src/i18n/` con traducción en + es
- [ ] Lógica pura nueva (domain/application) con `.test.ts` ≥ 15 tests

## Commits

- [ ] Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`)
- [ ] Commits atómicos: 1 intención = 1 commit, tests incluidos en el mismo commit
- [ ] `origin/main` verde al cerrar el sprint + tag `sprint/w<N>-done`

## No-regresión

- [ ] Los comportamientos críticos documentados siguen intactos:
  merge por id en `loadSelected`, mensaje optimista no se remueve antes del eco,
  `DB_VERSION=3` IndexedDB no baja, cache-first móvil+desktop, SSE solo en full.
