# AGENTS.md — OpenHer

## Estructura

| Carpeta | Descripción |
|---|---|
| `web/` | **Producto central**: React 19.2 + Vite 8 + TS 5.6 + Capacitor 8 + Tailwind CSS. Frontend compartido para APK Android y Desktop. |
| `desktop-app/` | **IDE Desktop en Rust** (`wry` + `tiny_http` + `hyper/tokio` + `mmap/brotli` + `fswatch` + `simd-json`, **NO Tauri**): sirve `web/dist` en `:4848`, expone `/shell/*` + WS PTY (`:4849`) + proxy stats (`:8765`). |
| `opencode-stats/` | **Monitor de estadísticas en Rust** (edición 2024): solo lectura sobre `opencode.db` (`:8765`). Tiene su propio `AGENTS.md`. |

---
## Comandos

### Build Completo
```powershell
.\build-desktop.ps1
```

### Frontend (`web/`)
```powershell
pnpm dev; pnpm test; pnpm run test:i18n ; pnpm run test:ui; pnpm run test:settings; pnpm run test:model; pnpm run build ; python scripts/copy-dist.py
```
### Desktop (`desktop-app/`)
```powershell
cargo check; cargo run; cargo build --release
```

## Arquitectura y Directivas

- **Skills de Frontend**: Usar skill `taste-impecable` (y `frontend-pro`) para dirección estética, UX y calidad artesanal de frontend.
- **Evitar Duplicación**: De código; aplicar la skill `ponytail` (YAGNI, stdlib sobre dependencias, diffs mínimos).
- **DRY y Estado**: Importante DRY y singleton en servicios, stores (Zustand) y utilidades compartidas.
- **Iconografía y Texto**: Cero emojis en la UI; solo iconografía SVG formal (Lucide).

---

<!-- GLOBAL-AGENTS-SYNC v2 -->
## Memoria del proyecto (no duplicar, solo referenciar)
- **Index-First:** Antes de investigar, revisar `.agents/INDEX.md`; si una skill aplica, leer ÚNICAMENTE su `SKILL.md`.
- **Anti-Patterns:** Revisar `.agents/ANTIPATTERNS.md` (locks/EPERM, sin bash en PowerShell, sin volcar `node_modules`/`.git`/`dist`).
- **Eficiencia:** Cero charla ociosa, lectura selectiva, `fast-find "<termino>"`.
- **Contribuir:** Patrón/bug -> `.agents/skills/<nombre>/SKILL.md` (máx 25 líneas) + fila en `INDEX.md`; trampa -> regla en `ANTIPATTERNS.md`.
