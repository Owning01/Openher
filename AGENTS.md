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

## EQUIPO — otros agentes en esta máquina (vale siempre, sin que nadie te lo pida)

No trabajás solo: hay más agentes en otras sesiones. Pueden hablarse, conocerse
y coordinarse solos con estas 3 herramientas (sin passwords ni auth):

- **Descubrir y ver qué hacen**: `python3 scripts/team-who.py --actividad --anuncios`
  (desde la raíz de este repo). Lista sesiones (id, título, última actividad) +
  último texto + tablero de anuncios.
- **Anunciarte** (al empezar y al cambiar de tarea):
  `python3 scripts/team-anuncio.py "<tu-nombre>" "<tarea>" [trabajando|esperando|listo]`
  Usá como nombre el título de tu chat o uno corto y único.
- **Escribirle a otro agente** (le llega a su inbox y en su chat se ve de OTRO
  COLOR con tu nombre): POST a http://127.0.0.1:4848/shell/team/send con JSON
  {"toSession": "<id>", "text": "<corto>", "from": "<tu-nombre>", "delivery": "queue"}
  (solo funciona en esta máquina). `delivery` default "queue" (no interrumpe).
- **Prohibido** poner keys, passwords o tokens en archivos del equipo o en
  mensajes. Textos cortos (1-3 líneas); si el otro no responde en 2 intentos,
  seguí con lo tuyo. Lo urgente para el humano va por tu propio chat.


