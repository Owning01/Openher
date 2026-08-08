# AGENTS.md — OpenCode Mobile

App Android (Capacitor) + web (React 19 + Vite + TypeScript) que controla un servidor
`opencode serve` remoto. Incluye un túnel WebRTC (Go) en `tunnel/`, un worker de
señalización (Cloudflare) en `signaling-worker/` y un servidor de estadísticas Python
en `G:\Proyectos\opencode-stats`.

## REGLAS CRÍTICAS (NO violar)

1. **NO levantar servers ni procesos de larga duración desde el chat.** El usuario
   usa este chat conectado al MISMO server que administramos. Levantar `opencode2
   service start`, `python -m http.server`, gradle daemons, etc. en primer plano
   bloquea o traba el chat. Si hace falta levantar algo: usar `Start-Process`
   (detached) o scripts `.bat` que corren por fuera (`start-opencode-v2.bat`), NUNCA
   en la terminal del chat. Comandos bloqueantes (gradle assemble, cap sync, npm
   install largos, `Invoke-RestMethod` sin timeout) van con timeout explícito y en
   pasos separados — si un comando tarda más de ~30s, correrlo detached o dividirlo.
2. **El server opencode v1 corre en `0.0.0.0:4096`** (Basic auth `opencode`/`octavio`).
   El **v2 beta (`opencode2`) corre como servicio en `0.0.0.0:4097`** con username FIJO
   `opencode` (no configurable) y password `octavio`; config en `opencode2 service set`.
   V2 usa rutas `/api/*` y envuelve respuestas en `{data:...}` (la app lo auto-detecta
   en `api.ts` via `resolveApiVersion`/`rememberApiVersion`).
3. **El APK se compila con gradle** (`web/android`): copiar `web/dist` a
   `android/app/src/main/assets/public/` con `python scripts/copy-dist.py` (el
   `npx cap sync/copy` falla con EPERM — trampa conocida) y correr `gradlew
   assembleDebug` aparte, con timeout grande.
4. **Tests**: `npm run build` + `npm run test:ui` + `test:i18n` + `test:settings` +
   `test:model` después de tocar `web/src`. Todos deben quedar verdes.

## Comandos (todo en `web/`)

- `npm run build` — `tsc -b && vite build` → `dist/` (el APK embebe este dist)
- `npm run test:i18n` / `test:ui` / `test:settings` / `test:model` — tests de regresión
- `.\deploy-quick.ps1` (en `web/`) — build + cap copy + gradle assembleDebug + servidor/túnel
- `npx cap copy` — copia `dist/` a `android/app/src/main/assets/public/`

## Arquitectura clave

- **`src/api.ts`** — cliente HTTP del server opencode (endpoints `/session`, `/agent`,
  `/session/:id/message`, `/event` SSE, `/session/:id/prompt_async`).
- **`src/hooks/useSSE.ts`** — conexión SSE a `/event`. El server emite
  `event: message` con `data: {"id","type","properties"}` — **el type real va DENTRO del
  JSON** (nunca usar el `event:` line). Watchdog de heartbeat: se resetea con cualquier
  evento; timeout → abort + reconnect (backoff exponencial).
- **`src/hooks/useMessages.ts`** — estado de mensajes. `applyDelta` aplica deltas SSE;
  `renderedMessages` filtra por partes (text/compaction → texto, reasoning/thinking →
  thinkingParts, tool/* → toolParts, image → imagen). `loadSelected` hace merge
  incremental: solo reemplaza un mensaje cuando `time.completed` cambió (protege el
  texto streamed local del clobber por polling).
- **`src/App.tsx` `handleSSEEvent`** — maneja eventos v1 (`message.part.delta` con
  `partID` — el tipo de part se resuelve con `partTypeCacheRef` alimentado por
  `message.part.updated`) y v2 (`session.next.text/reasoning.delta/ended`,
  `session.next.compaction.*`). `session.status` es `{type: "busy"|"idle"|"retry"}`;
  reload solo en `idle`. `session.idle` (deprecado) también se emite.
- **`src/hooks/useAI.ts`** — persistencia del agente: la key GLOBAL
  (`opencode.remote.agent`) tiene prioridad sobre la por-directorio
  (`opencode.remote.agent.<encoded-dir>`). El server devuelve `/agent` con `id: null`
  (el app usa `name` como id) y la lista viene en orden `[research, build, plan]` —
  nunca usar `primary[0]` como fallback ciego con un saved presente.
- **`src/hooks/useConfig.ts`** — config del server; `saveConfig` recibe `t` para
  mensajes localizados; notice con auto-dismiss 6s.
- **`src/hooks/useOfflineCache.ts`** — IndexedDB `opencode-mobile` (stores
  sessions/messages, `DB_VERSION = 2` — NO bajar la versión; el bump migra DBs viejas
  sin stores).
- **Soporte v2 (beta)** — `api.ts` detecta el dialecto del server (rutas `/api/*` +
  `{data:...}` en v2 vs raíz en v1): `resolveApiVersion`/`rememberApiVersion` cachean
  por host:port; en modo "auto" un 404 en ruta v1 dispara retry con `/api` (y el
  health prueba `/global/health` vs `/api/health`). Mappers: `toSessionV1`,
  `toMessageEnvelopeV1` (content[] → parts[]). El SSE se salta en v2 (no existe
  `/event`; el polling cubre la recepción). Prompt v2: POST `/api/session/:id/prompt`
  con `{text}`. El toggle está en Settings → Preferencias → API version (Auto/v1/v2).

## Persistencia de datos (garantías)

- **Server-side**: el server opencode persiste sesiones/mensajes en su storage global
  (`opencode.db`, keyed por projectID = hash del directorio). Mismo server + mismo
  directorio = mismas sesiones. La app NUNCA borra datos del server.
- **Local (IndexedDB `opencode-mobile` v2)**: caché offline con **merge por id —
  nunca se encoge**. `cacheMessages` lee lo existente, mezcla y escribe la unión
  (solo agrega/actualiza lo nuevo). `cacheSessions` upsert por id.
- **Primera carga de mensajes**: ventana acotada SIEMPRE (sin historial completo):
  `limit=100` en full/saver, `limit=30` en ultra, `limit=20` en miser. El merge
  local + caché conservan el resto. El server IGNORA `since` — no depender de él.
- **Ahorro de datos (modos no-full)**: `session.time.updated` solo avanza al
  completar turnos (verificado empíricamente) — si `updated` no cambió desde el
  último fetch, se saltea el fetch de mensajes (evita re-bajar ~1MB por poll
  durante generaciones largas). Al pasar a idle, en no-full se usa refresh ligero
  + `listStatuses` del directorio (1 request) en vez del refresh completo (~21 requests).
- **`loadSelected`**: merge por id SIEMPRE (desde 2026-08) — una respuesta parcial o
  vacía nunca reemplaza el historial local. No hay tope de 500 mensajes.
- **Restauración offline**: `handleOpenSession` cae a `getCachedMessages` si el server
  no responde (nunca mostrar una sesión vacía si ya se trabajó).
- **Config**: sobrevive reinstalaciones vía archivo externo
  (`opencode-config.json` en Documents) + backup local en localStorage.

## Trampas conocidas (VERIFICADAS)

1. **`npx cap copy` falla con `EPERM`** en `assets/public/app-icon.png` (archivo
   bloqueado por otro proceso). Workaround: copiar `dist/` manualmente
   (python/shutil) y correr `gradlew assembleDebug`. `deploy-quick.ps1` oculta los
   errores con `Out-Null` — correr pasos individuales para debuggear.
2. **Server opencode 1.18.11** corre en `0.0.0.0:4096` con Basic auth
   (`OPENCODE_SERVER_USERNAME=opencode`, `OPENCODE_SERVER_PASSWORD` del entorno del
   shell — en este equipo es "octavio"). El `/event` requiere auth.
3. **Deltas SSE**: el server emite `message.part.delta` (v1, sin tipo de part) y
   `session.next.*` (v2). En 1.18.11 SOLO fluyen los v1 (verificado con E2E real) —
   NO duplicar manejos sin dedupe.
4. **Mensaje optimista del usuario**: NO remover `removeOptimistic` tras el send
   exitoso — la confirmación la hace `loadSelected` (match por texto). Remover antes
   causa el bug "el mensaje aparece recién cuando responde el asistente".
5. **Polling**: `refreshSessions` traga errores internamente; el backoff de
   `usePolling` se activa lanzando desde el callback cuando `connectionState === "offline"`.
6. **Stats server** (G:\Proyectos\opencode-stats): Python en `:8765`, API
   `/api/data?raw=1`. Monitor de terminal: `python stats-watch.py` (refresco 5s).
   `server.py` puede crashear con KeyError en `requests[s["id"]]` → ya parcheado con
   `.get(s["id"], 0)`.
7. **Compartir APK**: `tmpfiles.org` via `POST /api/v1/upload` (multipart, campo
   `file`); descarga directa en `https://tmpfiles.org/dl/<id>/<nombre>`.

## Convenciones

- named exports, `import type` para tipos, React 19 + Vite + TS.
- i18n: TODAS las strings visibles van a `src/i18n.ts` (4 idiomas: en/es/it/zh-TW;
   el test `test:i18n` valida paridad de claves).
- Switches con `role="switch"` usan `aria-checked` (no `aria-pressed`).
- Toques en móvil: elementos que aparecen solo en `:hover` llevan fallback
   `@media (hover: none), (pointer: coarse)`.
