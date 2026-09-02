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
pnpm dev
pnpm test
pnpm run test:i18n
pnpm run test:ui
pnpm run test:settings
pnpm run test:model
pnpm run build
python scripts/copy-dist.py
```

### Desktop (`desktop-app/`)
```powershell
cargo check
cargo run
cargo build --release
```

---

## Arquitectura y Directivas

- **Skills de Frontend**: Leer skills `TASTE` e `Impecable` para diseño, UX y calidad de frontend y DESING.md de  nuestro repo
- **Evitar Duplicación**: No duplicar código; seguir la arquitectura `Ponytail light`.
- **DRY y Estado**: Aplicar DRY estricto mediante instancias singleton para servicios, stores y utilidades compartidas.
- **Iconografía y Texto**: No usar emojis en la interfaz ni en el código; utilizar iconografía SVG / Lucide formal.