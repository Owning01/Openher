# Errores — hallazgos de auditoría full-repo (sin opencode-stats)

> Solo lectura, cero cambios. Afirmaciones de análisis estático, no verificadas en runtime.

## CRITICAL

1. **RCE vía `/shell/opencode/global`** — `desktop-app/src/infrastructure/http/opencode_router.rs:25`: POST escribe `configPath`+`content` arbitrarios sin jail. Fix: allowlist + rechazar `..`/absolutos.
2. **SSRF burlable en `/shell/proxy`** — `desktop-app/src/infrastructure/http/proxy_router.rs:163`: el guard solo bloquea literales `127.0.0.1:4848`; deja `:4849`, `:8765`, `0.0.0.0`, IPs decimales y `redirects(5)` que rebotan a loopback. Fix: denegar rangos privados + `redirects(0)` + allowlist.
3. **Inyección vía `opencode2_command`** — `desktop-app/src/common.rs:37,41` + `state.rs:658`: config seteable por POST sin validación + `split_whitespace`. Fix: `Command::new(exe)` + parseo con comillas + allowlist `.exe`.
4. **Doble `/api` en fallbacks v2** — `web/src/shared/api/client.ts:159,163` vs `web/src/api.ts:538,591`: `apiPath()` + `request()` anteponen el prefijo dos veces → `POST /api/api/session/:id/prompt|command` justo cuando el SDK ya falló. Fix: path crudo en el fallback.

## HIGH

- **Bind `0.0.0.0` + bypass de auth en loopback + password vacía por defecto** — `desktop-app/src/api.rs:22`, `main.rs:877`, `config.json:7`: `/shell/*` abierto a LAN/Tailscale. Fix: exigir token o bindear `127.0.0.1` por defecto.
- **`/shell/fs/exec|open` sin confirmación ni jail** — `desktop-app/src/fsx.rs:542,608,641` + `fs_router.rs:239,249`: cualquier página embebida → RCE. Fix: deshabilitar `exec` por defecto o confirmar + allowlist.
- **TOCTOU en `ensure_opencode2_running`** — `desktop-app/src/state.rs:669`, `main.rs:858,953`: probe-then-spawn sin lock → N daemons concurrentes. Fix: `Mutex`/lock-file en `data/`.
- **Procesos huérfanos** — `desktop-app/src/srvman.rs:50` sobrescribe handles, `plugins.rs:263` hace `mem::forget`, `kill_all_external` nunca mata opencode2. Fix: registrar todo en `ExternalManager` + `taskkill /T` al salir.
- **Secretos en claro** — `desktop-app/src/api.rs:373-390` (`GET /shell/config|export`, `inject_config_script`): exponen password y API keys en JSON/HTML/`localStorage`/`data/config.json`. Fix: enmascarar (`***`) + endpoint separado para rotar.
- **Probes sin `/api`** — `web/src/api.ts:1092` vs `desktop-app/src/state.rs:671,695` + `config_router.rs:132,146`: falso DOWN → respawn loop contra v2. Fix: centralizar `v2ProbePath="/api/session"`.
- **`permissionReply`/`rename`/`delete` con param de directorio equivocado en v2** — `web/src/api.ts:1066,348,353-373`: `withDirectory` en vez de `withLocationDirectory`. Fix: rama v2 explícita.
- **Puerto canónico 4098 vs default `[4096,4097]` + docs que dicen 4097** — `desktop-app/src/state.rs:260,386-389`. Fix: default con 4098 + actualizar docs.
- **Aborts directos sin guard** — `web/src/features/chat/hooks/useChatActions.ts:382-385,433-435`, `web/src/components/SessionChatPanel.tsx:301-302,320-321`: regenerate/revert/edit bypassean `stopGenerationRef` → mezcla stream viejo+nuevo. Fix: pasar por `handleAbort()`.
- **Timer de abort sin cancelar** — `web/src/features/chat/hooks/useChatActions.ts:514-517`, `web/src/components/SessionChatPanel.tsx:293-296`: abort→send→abort apaga el guard del segundo abort. Fix: guardar ID y `clearTimeout` al re-armar.
- **Outbox auto-flush sin deps ni `force`** — `web/src/app/useAppController.ts:868-880`: efecto cada render + `removeOutbox` tras re-encolar → duplicados. Fix: `force:true` o no remover si se re-encoló.
- **Batch SSE sin drenar con `document.hidden`** — `web/src/hooks/useMessages.ts:184-200`: eco puede quedar detrás del fetch. Fix: drenar antes de `loadSelected` en `onVis`.
- **Draft de otra sesión al enviar <1 frame tras switch** — `web/src/components/Composer.tsx:244,268-279`: `handleSend` lee `composerRef` stale. Fix: leer `localValueRef` en el envío.
- **Adjuntos solo en memoria** — `web/src/components/Composer.tsx:521,632-666`: reload/crash los pierde. Fix: persistir metadatos o `beforeunload`.
- **`split_whitespace` rompe paths con espacios** — `desktop-app/src/common.rs:37` (vs `external_router.rs:19` que sí usa `split_cmd`): ejecuta `C:\Program` → hijack. Fix: unificar a `split_cmd`.
- **PTY-WS sin auth en `0.0.0.0`, `id` adivinable** — `desktop-app/src/ptyx.rs:293,323`: attach/write desde Tailscale. Fix: token + check `Origin`.
- **BOM tumba la config** — `desktop-app/src/state.rs:370`: `serde_json` rechaza BOM → `Default` **sobrescribe** la config del usuario. Fix: strip `\uFEFF` + `config.bak`.
- **Migración 4097→4098 con `fs::write` directo** — `desktop-app/src/state.rs:399,411`: compite con `save_config`, trunca en corte. Fix: `atomic_write_json`.
- **Autostart stale** — `desktop-app/src/main.rs:946`: si `opencode2_enabled=false`, el valor `HKCU\Run` nunca se borra. Fix: `else set_opencode2_autostart(false)`.
- **Prebind silencioso cambia el puerto** — `desktop-app/src/main.rs:877,1051`: SSRF-block hardcodea `:4848`, PTY `+1` sin reintento → terminal muerto. Fix: propagar puerto real.
- **Descarga WebView2 sin hash** — `desktop-app/src/main.rs:313,336`: supply-chain + fallo silencioso. Fix: SHA256 anclado.
- **Descubrimiento opencode2 cableado a un solo PC** — `desktop-app/src/state.rs:604-653`: drives literales, `service.json` jamás leído. Fix: resolver vía PATH/`OPENCODE_HOME` + validar `--version`.
- **Password en `localStorage` + bypass loopback** — `desktop-app/src/api.rs:373-390` vs `web/src/shell.ts:115-130`: cualquier HTML proxeado lee secretos. Fix: no inyectar password.
- **CORS `*` + credentials** — `desktop-app/src/infrastructure/http/io.rs:71-82`, `proxy_router.rs:103-139`: combinación inválida, preflight falla según ruta. Fix: eco de `Origin`.
- **Contrato PTY `poll`**: TS espera `data?:string` utf8 (`web/src/shell.ts:367`), Rust devuelve base64 (`pty_router.rs:63`) → terminal muestra base64 crudo. Fix: alinear encoding.
- **`shell.ts` sin timeouts** — `web/src/shell.ts:232-247`: red hostil cuelga explorador/kanban/git. Fix: `fetchWithTimeout(12s)`.
- **`export→import` borra `shell`** — `web/src/shell.ts:83-103` vs `desktop-app/src/state.rs:200`: `merge_config` ignora el campo. Fix: añadirlo a ambos lados.
- **Doble vía al proxy de stats + comentario obsoleto** — `web/src/shell.ts:404` vs `web/src/api.ts:1143` vs `stats_router.rs:25-28`. Fix: una sola función `statsProxy()` y corregir comentario.

## MEDIUM / LOW

- **Stop/scroll residuales (web)**: `stopping` es estado muerto con re-renders en `useChatActions` (desenchufado de `isWorking`; queda eliminarlo o cablearlo al `Composer`); `useSSEHandler.ts:261` omite deps (stale `onSettled`); `messageScrollSignature` O(n) por delta — firmar `count+lastID+lastLen`; `ChatVirtuosoList.tsx:117-120` set-state-en-render; pin por intervalo 500 ms pisa reveal de búsqueda; doble persistencia `chatScroll.v2` + `chatAnchor.v3` sin consolidar; `useSSE.ts:250` reconecta SSE por `config` no memoizado; purga `seenEventIDs` asume orden.
- **Persistencia (web)**: `persistentStorage.ts` parchea `localStorage` global sin restore ni flush en `pagehide`; `STORAGE_KEYS` no cubre `composer-*`/`chatAnchor`/`chatScroll`/`promptHistory`; `writeComposerDraft` por tecla sin debounce; `messageVariantCache` sin TTL + `Math.random()` en IDs.
- **i18n/higiene (web)**: errores de abort en español hardcodeado (`api.ts:655,687`); `any` en el contrato stop/streaming; `catch{}` silenciosos en `loadMessages/abort/revert/questions`; `aria-label` en inglés hardcodeado (`ChatVirtuosoList.tsx:614-615`, `MessageVirtualList.tsx:564`); `ChatView.tsx:637,674` remontan lista+Composer y pierden adjuntos/foco.
- **Robustez Rust (desktop-app)**: `unwrap()` en `EventLoop/run_app/Response::builder/Runtime` (`main.rs:1057,1106`, `http_server.rs:80,91,101,146`) panican el proceso sin consola visible; `eprintln!` vuelca comandos con posibles tokens y sin contexto (`state.rs:685,700`); `write_file` con jail débil (`fsx.rs:496,530`); fast-path `.br` sin `starts_with(dist)` en `http_server.rs:70` (traversal de estáticos); `status/probe` bloqueantes 700-1800 ms saturan pool (`srvman.rs:25`, `external_router.rs:179`); `GET /shell/fs/resolve` sin caller (`fs_router.rs:104`); `FeatureFlags` sin endpoint (`entities/config/model.ts:36-50`); password documentada vs default vacío (`architecture.md:31`, `state.rs:283`) — rotar y sacar de docs.

## Contratos cross-stack

| Contrato | Estado |
|---|---|
| `/shell/health\|mem\|window\|git\|external\|kanban`, `/shell/fs/*`, PTY CRUD, `/shell/opencode2/*`, `/shell/autostart`, `/shell/config*`, `/shell/server*`, `/shell/stats*`, `/shell/plugins\|labs\|search\|proxy\|browser\|project\|doc\|updates` | OK forma |
| Prefijo `/api` v2 + `location[directory]` + `interrupt` crudo | **ROTO** |
| Puertos 4098 vs defaults/docs | **ROTO** |
| Timeouts/retry/CORS uniformes, credenciales no expuestas | **ROTO** |

## Top riesgos

1. **Superficie RCE en `/shell/*` con bind LAN** (global-write + exec sin jail + SSRF + bypass loopback): un HTML embebido/proxeado puede escribir config, ejecutar binarios y robar secretos.
2. **Desync v2** (doble `/api` + params de directorio + probes sin prefijo + puerto 4098 no canónico): los fallbacks fallan exactamente cuando más se necesitan y el autostart pelea contra sí mismo.
