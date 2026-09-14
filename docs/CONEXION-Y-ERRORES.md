# Conexión OpenHer ↔ server opencode: mapa para informar y detectar errores

Referencia rápida de **toda la cadena de conexión** y de **dónde nace, viaja y se
muestra cada error**. El server es el repo `G:/Proyectos/opencode2` (paquete
`packages/opencode`, versión `1.18.x`); el cliente es esta app (`web/`).

---

## 1. Cadena de conexión — cliente (`web/src`)

| Capa | Archivo | Qué hace |
|---|---|---|
| Config + auth | `hooks/useConfig.ts` | host/puerto/usuario/pass, `connectionState`, `connectedVersion`, health y `testConnection`. |
| Descubrimiento | `utils/serverDiscovery.ts` | Si no hay config o es loopback, prueba `127.0.0.1/localhost × 4096/4098/4097` y se queda con el primero que responda `/health`. |
| HTTP base | `shared/api/client.ts` | `baseUrl`, `authHeader` (Basic), `request`/`requestRaw`: timeouts, 1 retry en GET, proxy CORS del desktop y mensaje "Network error…". |
| Detección v1/v2 | `shared/api/version.ts` | Prueba `/api/health` (v2) y cae a `/global/health` (v1). `apiPath()` prefija `/api`. |
| API tipada | `api.ts` | Todas las llamadas (`health`, `loadMessages`, `loadProviders`, `revert`, `setProviderAuth`, `sendPrompt`, …). |
| SDK opcional | `shared/api/opencodeClient.ts` | `@opencode-ai/client` con `fetch` nativo (Capacitor) para POST/GET unarios. |
| Mappers | `shared/api/mappers.ts` | Normaliza payloads v2 → tipos de la app (sesiones, mensajes, modelos, **errores del assistant**). |
| SSE frames | `shared/sse/parser.ts` | Parser incremental de `event:`/`id:`/`data:` (cortes TCP a mitad de frame). |
| SSE URL | `shared/sse/client.ts` | `buildSSEUrl`: `/api/event` (v2) o `/event` (v1) con `location[directory]` + `sessionID`. |
| SSE pump | `hooks/useSSE.ts` | `fetch` stream, timeout de conexión (8 s), heartbeat, reconexión con backoff, `streamState`. |
| SSE dispatch | `hooks/useSSEHandler.ts` | Filtra por sesión y aplica eventos: deltas, `message.updated`, `session.status/idle`, **`session.error`**. |
| Estado sesiones | `hooks/useSessions.ts` | `refreshSessions`: marca `connected` / `reconnecting` / `offline` (3 fallos). |
| Reconciliación | `features/app-lifecycle/hooks/useAppLifecycle.ts` | Poll de sesiones/mensajes y replay de la cola offline al reconectar. `hooks/usePolling.ts` da backoff/pausa. |
| Red/offline | `hooks/useNetworkMode.ts`, `hooks/useOfflineQueue.ts`, `hooks/useOfflineCache.ts` | Modo datos por red, cola de escrituras pendientes, caché IndexedDB. |
| Bus de eventos | `plugins/bus.ts` | Reemite cada evento SSE a plugins; `plugins/host.ts` guarda `instance.error`. |
| Errores REST | `shared/errors/sdkErrorInterceptor.ts`, `shared/errors/serverErrors.ts` | Envuelve `{body,status}` en `Error.cause` y lo traduce (`formatServerError`: config inválida, modelo no encontrado, "Transport"). |
| Errores assistant | `shared/errors/assistantError.ts` | Normaliza `{name, data:{message, ref?}}` → `{name, message, ref?}`. |
| UI de error | `app/AppModals.tsx` → `components/ErrorModal.tsx` | Muestra `runtimeError` (modal). `components/ConnectionNotices.tsx` (offline/reconnecting), `components/ErrorBoundary.tsx` (crash React). |

La app **no usa `EventSource`**: `useSSE.ts` hace streaming con `fetch` para poder
mandar Basic Auth y funcionar en nativo (Capacitor).

## 2. Cadena de conexión — server (`G:/Proyectos/opencode2`)

| Responsabilidad | Archivo |
|---|---|
| Health | `packages/opencode/src/server/routes/instance/httpapi/groups/global.ts` y `handlers/global.ts` (`/global/health` → `{healthy, version}`; v2 expone `/api/health`). |
| Stream SSE | `.../httpapi/groups/event.ts` (`/event`) y `handlers/event.ts`: filtra por `location.directory`, emite `server.connected`, heartbeat cada 10 s y `server.instance.disposed`; loguea `event connected/disconnected`. |
| Errores HTTP | `.../httpapi/middleware/error.ts`: los 500 sin tipo generan `ref: err_xxxxxxxx` y loguean `failed` con `Cause.pretty`. Catálogo en `.../httpapi/errors.ts` (400/401/403/409/502/503/504). Auth en `.../middleware/authorization.ts`. |
| Error de sesión | `packages/schema/src/v1/session.ts`: `session.error = { sessionID?, error }` y `AssistantErrorSchema` (union por `name`, detalle en `data`). Eventos v2 en `packages/schema/src/session-event.ts` (`step.failed`, `retried`). |
| Logs | `packages/core/src/observability/logging.ts`: `fileLogger()` en `Global.Path.log/opencode.log`; `OPENCODE_LOG_LEVEL` (DEBUG/INFO/WARN/ERROR) y `OPENCODE_PRINT_LOGS=1`. Rutas en `packages/core/src/global.ts`. |
| Credenciales / `/connect` | `packages/protocol/src/groups/integration.ts` (`connect/key` acepta `label`), `packages/protocol/src/groups/credential.ts` (`/api/credential/:id`, `/activate`), `packages/core/src/integration.ts` (`resolveConnections`). |

## 3. Rutas de diagnóstico (dónde mirar cuando algo falla)

- **Log del server**: `C:\Users\<usuario>\.local\share\opencode\log\opencode.log`
  (`Global.Path.log`; en Linux `~/.local/share/opencode/log`).
  Arrancar con `OPENCODE_LOG_LEVEL=DEBUG` y `OPENCODE_PRINT_LOGS=1` para verlo también en stderr.
- **`ref` de un error 500**: buscar `ref=err_xxxxxxxx` (o `level=Error` / `failed`) en ese log.
- **Health**: `GET http://127.0.0.1:4098/api/health` (v2) o `/global/health` (v1) → `{healthy, version}`.
- **SSE crudo**: `curl -u opencode:octavio http://127.0.0.1:4098/api/event` (v2) o `/event` (v1).
- **Config del server**: `%USERPROFILE%\.config\opencode\opencode.json`, `service.json`
  (bind `0.0.0.0`, puerto `4098`, pass `octavio`) y `cli.json`.
- **Consola de OpenHer**: `web/src/utils/log.ts` (prefijo `[app]`, `info` solo en dev),
  `ErrorBoundary` (`ErrorBoundary caught:`), `useOfflineCache` (`[OfflineCache]`).
  En el APK, `chrome://inspect` sobre el WebView.
- **Proxy del desktop (CORS)**: `desktop-app/src/infrastructure/http/proxy_router.rs`
  (`/shell/proxy?url=…`), usado por `client.ts` cuando el WebView2 no puede pegarle al server.
  Autostart del server: `desktop-app/src/state.rs` (`ensure_opencode2_running`) y
  `infrastructure/http/config_router.rs` (`/shell/opencode2/status|ensure|autostart`).

## 4. Flujo de un error, punta a punta
1. **500 del server** → `middleware/error.ts` responde `{name, data:{message, ref}}` y loguea `failed`.
2. **Cliente REST** (`client.ts`) lee el body → `sdkErrorInterceptor.toWrappedError` (Error con `cause.body/status`).
3. `formatServerError` (`shared/errors/serverErrors.ts`) traduce: `ConfigInvalidError`, `ProviderModelNotFoundError`, "Transport" o el `message` crudo.
4. `setRuntimeError(...)` → **modal** (`ErrorModal`). Si es de red, además `useSessions` marca `reconnecting`/`offline`.
5. **Error de turno** (no HTTP): llega por SSE `session.error` **o** en el historial como `message.info.error`.
   `assistantError.normalizeAssistantError` lo aplana; se muestra en el modal o en `MessageBubble`.
6. **Stream roto**: `useSSE` reconecta con backoff y emite `server.connected` → `onSettled` recarga la sesión;
   el poll de `useAppLifecycle`/`SessionChatPanel` reconcilia aunque el SSE esté vivo.

## 4b. Auto-update del desktop (server remoto)

- **Publicación** (máquina que compila): `scripts/publish-desktop.ps1` zippea
  `openher-desktop.exe` + `data/web-dist` (sin la APK) y agrega el bloque
  `desktop` a `openher-version.json`. `scripts/update-app.ps1` lo corre junto a la APK.
- **Detección** (notebook): `web/src/hooks/useAppUpdate.ts` (rama desktop) +
  `web/src/shell.ts` (`remoteShellBase`, `desktopVersion`, `desktopUpdate`,
  `desktopUpdateStatus`). Compara `desktop.versionCode` contra
  `data/web-dist/build-info.json` (lo escribe `build-desktop.ps1`).
- **Aplicación** (shell Rust): `desktop-app/src/app_update.rs` descarga el zip,
  verifica sha256, extrae con `Expand-Archive` y deja un helper PowerShell que
  espera la salida de la app, reemplaza el exe + espeja `data/web-dist` (sin
  borrar `openher.apk`/`openher-version.json`/`openher-desktop.zip`) y relanza.
  Rutas: `POST /shell/app-update/apply`, `GET /shell/app-update/status`,
  `GET /shell/app-version`.
- **Log del update**: `dist-desktop/data/cache/openher-update.log` (pasos,
  errores y PID del helper). El zip descargado queda en
  `data/cache/openher-desktop-update.zip`.
- **Bootstrap**: una instalación vieja (sin estos endpoints) necesita copiar
  `dist-desktop` o descomprimir `openher-desktop.zip` sobre su carpeta una vez;
  después se actualiza sola.

## 5. Estado y límites conocidos

- **Corregido**: `session.error` y `message.info.error` llegaban vacíos porque el cliente leía `error.message`
  en vez de `error.data.message` (el server manda `data`). Hoy se normalizan en `assistantError.ts`
  (ver tests `assistantError.test.ts`, `mappers.test.ts`, `useSSEHandler.test.ts`).
- El **`ref`** (`err_xxxxxxxx`) se normaliza pero no se muestra en la UI; para reportar, leerlo del log del server.
- **Sin telemetría remota**: todo el diagnóstico es local (log del server + consola del WebView).
- El `connected` de proveedores v2 sólo existe como lista de conexiones (`/api/integration`); no hay flag `active` explícito.
