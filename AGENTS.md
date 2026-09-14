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

### Actualizar la app (web + APK + link corto)
```powershell
.\scripts\update-app.ps1 -Notes "que cambio en esta version"
```
Sube la version (patch + versionCode), buildea la web, deploya a los `web-dist`, compila la APK y publica en `http://100.77.237.102:4848/openher.apk` + `openher-version.json`. La APK instalada detecta la version nueva sola (al abrir o volver a primer plano) y ofrece Actualizar; Android solo pide confirmar la instalacion.

### Frontend (`web/`)
```powershell
pnpm dev; pnpm test; pnpm run test:i18n ; pnpm run test:ui; pnpm run test:settings; pnpm run test:model; pnpm run build ; python scripts/copy-dist.py
```
### Desktop (`desktop-app/`)
```powershell
cargo check; cargo run; cargo build --release
```

## Arquitectura y Directivas

- **Skills de Frontend**: Usar skill `taste-impecable` (y `frontend-pro`) para direcciÃ³n estÃ©tica, UX y calidad artesanal de frontend.
- **Evitar DuplicaciÃ³n**: De cÃ³digo; aplicar la skill `ponytail` (YAGNI, stdlib sobre dependencias, diffs mÃ­nimos).
- **DRY y Estado**: Importante DRY y singleton en servicios, stores (Zustand) y utilidades compartidas.
- **IconografÃ­a y Texto**: Cero emojis en la UI; solo iconografÃ­a SVG formal (Lucide).


