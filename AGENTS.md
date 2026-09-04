# AGENTS.md â€” OpenHer

## Estructura

| Carpeta | DescripciÃ³n |
|---|---|
| `web/` | **Producto central**: React 19.2 + Vite 8 + TS 5.6 + Capacitor 8 + Tailwind CSS. Frontend compartido para APK Android y Desktop. |
| `desktop-app/` | **IDE Desktop en Rust** (`wry` + `tiny_http` + `hyper/tokio` + `mmap/brotli` + `fswatch` + `simd-json`, **NO Tauri**): sirve `web/dist` en `:4848`, expone `/shell/*` + WS PTY (`:4849`) + proxy stats (`:8765`). |
| `opencode-stats/` | **Monitor de estadÃ­sticas en Rust** (ediciÃ³n 2024): solo lectura sobre `opencode.db` (`:8765`). Tiene su propio `AGENTS.md`. |

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

- **Skills de Frontend**:  skills `TASTE` e `Impecable` para diseÃ±o, UX y calidad de frontend, con DESING.md .
 **Evitar DuplicaciÃ³n**: de cÃ³digo; leer skill Ponytail light`.
- **DRY y Estado**: importante dry y singleton servicios, stores y utilidades compartidas.
- **IconografÃ­a y Texto**: No emojis; iconografÃ­a SVG si / Lucide formal si .

---

<!-- GLOBAL-AGENTS-SYNC v2 -->
## Memoria del proyecto (no duplicar, solo referenciar)
- **Index-First:** antes de investigar, revisar `.agents/INDEX.md`; si una skill aplica, leer UNICAMENTE su `SKILL.md`.
- **Anti-Patterns:** revisar `.agents/ANTIPATTERNS.md` (locks/EPERM, sin bash en PowerShell, sin volcar `node_modules`/`.git`/`dist`).
- **Eficiencia:** cero charla ociosa, lectura selectiva, `fast-find "<termino>"`.
- **Contribuir:** patron/bug -> `.agents/skills/<nombre>/SKILL.md` (max 25 lineas) + fila en `INDEX.md`; trampa -> regla en `ANTIPATTERNS.md`.

