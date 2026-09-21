# AGENTS.md — OpenHer

| Carpeta | Qué es |
|---|---|
| `web/` | **Producto central**: React 19.2 + Vite 8 + TS 7.0.2 + Capacitor 8 + Tailwind. Frontend compartido para APK Android y Desktop. |
| `desktop-app/` | **IDE Desktop en Rust** (`wry` + `hyper/tokio` + `mmap/brotli` + `fswatch` + `simd-json`, **NO Tauri**): sirve `web/dist` en `:4848`, expone `/shell/*` + WS PTY (`:4849`). |

## Comandos

```powershell
.\scripts\build-desktop.ps1                     # build completo
.\scripts\update-app.ps1 -Notes "que cambio"    # bump version+versionCode, build web, deploy web-dist, compila y publica la APK en :4848/openher.apk + openher-version.json; la APK instalada detecta la version nueva al abrir o volver a primer plano y ofrece Actualizar (Android solo confirma)
pnpm dev; pnpm test; pnpm run test:i18n ; pnpm run test:ui; pnpm run test:settings; pnpm run test:model; pnpm run test:rendered; pnpm run build ; pnpm run check:rules ; python scripts/copy-dist.py   # frontend (web/)
cargo check; cargo run; cargo build --release   # desktop (desktop-app/)
```

## Directivas

- Skills: `taste-impecable` (estética/UX) y `ponytail` (YAGNI, stdlib antes que deps, diffs mínimos).
- DRY + singleton en servicios, stores (Zustand) y utilidades compartidas.
- Cero emojis en la UI: solo SVG formal (Lucide).

## Reglas de codificación (ley del repo; el por qué en `CONTRIBUTING.md`)

1. **Un path, un escritor.** Dos agentes nunca editan el mismo archivo a la vez.
2. **Unificación, no rediseño.** La conducta observable no cambia salvo pedido explícito.
3. **Prohibido editar un test existente para que pase**; si cae un test, se arregla el código.
4. **No se afirma nada sin medirlo**: cada número y cada afirmación de un doc se comprueba con un comando.
5. **Se borra antes de agregar**: stdlib antes que dependencia; una sola implementación por concepto.
6. **Lista NO TOCAR intacta** (`CONTRIBUTING.md` §2: scroll de `MessageList`, outbox, `ptyx`, seguridad, `atomic_write_json`, `debateStore`, CSS generado, modelo de la grilla). Tocarla se pregunta antes.
7. **Cero secretos** en archivos, docs, artefactos o mensajes; nunca `git add -A`.
8. **Nadie commitea por su cuenta**: un commit por fase, cuando el usuario lo apruebe.
9. **Verificación adversarial antes de aceptar** (challenger + critic): el que hace no es el que aprueba.
10. **Si algo no se sostiene, se reporta bloqueado**: no se fuerza, no se inventa, no se borra "por las dudas".

Ciclo: leer el **mapa** (`PROJECT_MAP.md`, estado actual) → medir → cambio chico → gate del área (tsc + tests de esos archivos) → tribunal → actualizar mapa (reemplazar) y bitácora (`PROJECT_MEMORY.md`, agregar entrada) → reportar con evidencia. El gate global y el build los corre el verificador, no el que edita.

Presupuestos que **solo pueden bajar** (named exports, `any`, `!important`, CSS muerto, huérfanos, archivos >1.000 líneas): `pnpm run check:rules` (`tasks/rules-budget.json`); si un número sube, el cambio no entra.

## EQUIPO — otros agentes en esta máquina (vale siempre, sin que nadie te lo pida)

- Ver quién hay y qué hace: `team-who --actividad --anuncios` (id, título, último texto + anuncios). Anunciate al empezar y al cambiar de tarea: `team-anuncio "<tu-nombre>" "<tarea>" [trabajando|esperando|listo]`.
- Escribirle a otro: `team-send <id-sesion> "<tu-nombre>" "<texto>"` (agregá `steer` al final solo para interrumpirlo; default no interrumpe). Le llega a su inbox y en su chat se ve de otro color con tu nombre.
- **Prohibido** keys, passwords o tokens en archivos del equipo o mensajes. Textos de 1-3 líneas; si no responde en 2 intentos, seguí con lo tuyo. Lo urgente para el humano va por tu propio chat.
