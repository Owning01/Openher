# Teamwork Progress — OpenHer Móvil

- [2026-09-12] Fase 1 completada. Brief aprobado por el usuario ("haz lo recomendado").
  Decisiones: visor **solo lectura** cómodo; descarga vía **share/guardar Android**.
- [2026-09-12] M1 exploración: planes accionables PC Files + Learning.
- [2026-09-12] M2 implementación (workers A/B): navegación táctil, visor móvil
  (A-/A+ persistido), errores humanizados, lista roadmap táctil, lightbox con zoom.
  Verificación en vivo 390x844: entrar/salir carpetas, visor, binario/bloqueado,
  descarga con toast, Learning 0 overflow, barrido móvil 0 overflow.
- [2026-09-12] M4 gates: Critic (3 MAJOR + 8 MINOR) y Bug Hunter (8 hallazgos, 4 races
  reproducidos). Remediación aplicada: F1 desktop 11px, F2 viewerSeqRef, F3 wrap móvil,
  F4 loadSeq en panel y usePaneState, F5 looksLikeBinary (ANSI/Latin-1), F6 aviso
  truncado, F7 aria-label heading, F8 guard rename en chevron, F9 clamp NaN, F10 toasts
  y targets. Tests nuevos de regresión (races, ANSI, clamp).
- [2026-09-12] Auditor: **APPROVED** — tsc 0; vitest 112/1667; ui/i18n/settings/model 0;
  cero tests debilitados; 8 fixes verificados en código.
- [2026-09-12] Success Auditor: **ACCEPTED** — 5/5 criterios DoD PASS.
- [2026-09-12] APK 1.0.7 publicada en `http://100.77.237.102:4848/openher-1.0.7.apk`.
- [2026-09-12] REPORTE DEL USUARIO: en el celular no se ven carpetas. Causa raíz real:
  `shell.ts` usaba `fetch` plano; en el APK el WebView vive en `https://localhost` y
  llamar a `http://<pc>:4848` es mixed-content + CORS → el explorador nunca obtenía
  datos (el resto de la app funciona porque usa el puente nativo CapacitorHttp).
  FIX: transporte único `shellFetch` (CapacitorHttp en APK, fetch en desktop/web) en
  health/list/read/download/pty/kanban/proxy; base derivada del host del server
  (incluye perfiles guardados) + invalidación al guardar/aplicar config; el explorador
  móvil arranca en la carpeta del proyecto activo (no en C:).
  Verificado en vivo 390x844 con override Tailscale: `G: > Proyectos > codsecuritymax`
  con carpetas/archivos reales; chunk `shell-DK-sju8Y.js` (fslist+servers+responseType)
  dentro de la APK; tests 112/1672, tsc 0.
- [2026-09-12] APK 1.0.8 (puente archivos) publicada en:
  `http://100.77.237.102:4848/openher-1.0.8.apk`
  SHA256 `66F1A5068F524F2406F15B08350546B77F33AE3F52E2B8D625749E51A9BF2840`
  (catbox sigue caído; se sirve desde el shell del desktop por Tailscale).
- [2026-09-12] LINK CORTO ESTABLE: `http://100.77.237.102:4848/openher.apk` sirve
  siempre la última APK + `openher-version.json` (version, versionCode, sha256,
  size, builtAt, notes). Script `scripts/publish-apk.ps1` publica en los 3
  web-dist. El link no cambia nunca más.
- [2026-09-12] FIX FLUJO DE PREGUNTAS (mini-team 3 roles: bug-hunter → worker
  plan+build → auditor independiente ACCEPTED):
  H1 orden texto/pregunta (segments id-keyed en rendered.ts + MessageBubble),
  H2 botones muertos (resolveQuestionForm frm_* por metadata.tool.id; reply
  /form/:frm/reply {answer}; 400 visible, 404/409 cierre válido),
  H3 modal duplicado (match por id + settle formID+callID + dismiss sticky con
  reopen), H4 Stop (dismissSessionQuestions local; flotante solo con isWorking).
  Gates: tsc 0; 112 archivos/1681 tests x2; i18n ok; build ok.
  Residual bajo: con 1 sola pregunta dismissada el badge de reapertura no se ve
  (remount/reload la reabre); dismiss vive en memoria.
- [2026-09-12] APK 1.0.9 publicada (bundle `index-BqfToXTm.js`):
  `http://100.77.237.102:4848/openher.apk`
  SHA256 `0FA2A979793D463DFC30B60064791309102873ABA652B4C1A05A7CE81D9A0713`
  size 20405580, verificado por red (Tailscale). Web deployada a los 3 web-dist.
- [2026-09-12] FIX MICRÓFONO (composer duplicaba palabras al hablar):
  causa raíz = el plugin Android emite `onEndOfSpeech` ("listeningState:
  stopped") ANTES del resultado final (`onResults` → evento partialResults) y
  el hook avanzaba `utteranceBaseRef` en "stopped", así que el final se
  agregaba como utterance nueva. Fix: flag `speechEndedRef`; la base se cierra
  al llegar el final (o al rearmar sin final, timer 400ms); merge tolerante a
  casing/puntuación (`normHypothesis`). Regresión:
  `useSpeechRecognition.native.test.tsx` (+2, reproduce el orden real) y
  `dictationBuffer.test.ts` (+2).
- [2026-09-12] AUTO-UPDATE DE LA APK:
  - `scripts/update-app.ps1`: sube patch+versionCode, buildea web, deploya,
    compila APK y publica link corto (`publish-apk.ps1`). Un solo comando.
  - Shell: `shell.appVersion()` (openher-version.json) y `shell.downloadApk()`
    (openher.apk) por el transporte del shell (CapacitorHttp en APK).
  - App: `useAppUpdate` (compara `App.getInfo().build` vs versionCode; chequeo
    a los 4s del arranque y al volver a primer plano, throttle 60s) +
    `AppUpdateBanner` (Actualizar → descarga a caché → instalador del sistema).
  - Nativo: `AppInstallerPlugin.java` (FileProvider `.fileprovider`, ACTION_VIEW
    package-archive) + `REQUEST_INSTALL_PACKAGES`. MainActivity registra
    plugins locales: se arregló de paso `ShareReceiver` (nunca registrado: el
    share-a-OpenHer no llegaba al JS).
  - Límite Android: no hay instalación silenciosa sin root/device-owner; el
    sistema pide confirmar (y la 1ª vez habilitar "instalar apps desconocidas").
  - Gates: tsc 0; 114 archivos/1688 tests; i18n ok; build ok; APK con
    AppInstaller en classes11.dex y permiso verificado por aapt.
- [2026-09-12] APK 1.0.10 (auto-update + fix micrófono) publicada:
  `http://100.77.237.102:4848/openher.apk`
  SHA256 `35C2FD489727381A09D95521AF0108440191B4CDD6553844CF5417781E97FF6C`
  size 20408156, verificado por red. Servida web `index-SrPqU7jD.js`.
  Para que el auto-update funcione hay que instalar la 1.0.10 una vez a mano:
  a partir de ahí, cada nueva versión se detecta sola.
- [2026-09-12] FIX "el chat no muestra cuando está activo" (móvil):
  - `useBaseChatProps` ignoraba el param `isWorking` (awaiting || sesión busy)
    y hardcodeaba `showTypingBubble: false`: el chat principal no mostraba
    trabajo cuando la sesión venía busy de otro lado (u tras resume). Ahora
    `working = isSending || isWorking || awaitingAssistantReply` alimenta
    `isWorking` y `showTypingBubble`.
  - `useSessions`: el poll liviano no traía statuses y el merge pisaba
    busy→idle en cada ciclo ("activo" apagándose solo). Ahora el poll liviano
    consulta `listStatuses` de los dirs visibles (cap 8, prioriza la sesión
    abierta) y `mergeSessionPoll` conserva el status si el dir no se consultó.
  - `useResumeResync` (nuevo, +3 tests): al volver a primer plano tras >2s
    oculto → `reconnect()` del SSE + `refreshSessions(true)` + `loadSelected`
    + `setAwaitingAssistantReply(true)` si el server dice busy. Antes el
    stream podía quedar medio-abierto sin error y el chat parecía parado.
  - `mergeSessionPoll` (+3 tests). Gates: tsc 0; 116 archivos / 1694 tests.
- [2026-09-12] APK 1.0.11 (fix estado activo) publicada:
  `http://100.77.237.102:4848/openher.apk`
  SHA256 `BAC862381720D7806025D5AD9372C0B443E94F7BACEE71D1A7E48ACE59E72C71`
  size 20399356, verificado por red. Servida web `index-M50urf5X.js`.
- [2026-09-12] GESTOR DE MCP en OpenHer (ver + activar/desactivar):
  - Causa: la web solo tenía `listMCPResources` (catálogo de resources, que en
    este server viene vacío); no existía UI de servidores ni de estado. La TUI
    lo maneja con la API v2.
  - `api.ts`: `listMCPServers` (GET /api/mcp → name + status
    connected/pending/disabled/failed/needs_auth + error), `connectMCPServer` /
    `disconnectMCPServer` (POST /api/mcp/:name/connect|disconnect, 204). En v1
    devuelve [] (no existe el endpoint). Tipos en entities/config/model.
  - `MCPBrowser`: sección "Servidores MCP" con dot + estado + error, botón
    Activar/Desactivar (busy por server, refetch al terminar, auto-refresh
    mientras hay pending); la sección de recursos queda abajo. El ítem del menú
    del chat pasó a llamarse "MCP".
  - i18n: 17 keys nuevas en es/en/it/zh + union de i18n.ts. CSS en modals.css.
  - Tests: api.mcp (4) + MCPBrowser (4). Gates: tsc 0; 118 archivos / 1702
    tests; i18n ok. Contrato v2 verificado contra :4098 (GET lista + POST 404
    para server inexistente).
- [2026-09-12] APK 1.0.12 (gestor MCP) publicada:
  `http://100.77.237.102:4848/openher.apk`
  SHA256 `472EB6A3613AF30823A06B8E6E5F7E8869E2405BF35AEAF6402557C17A921203`
  size 20400944, verificado por red. Servida web `index-NC5_re7F.js`.
- [2026-09-12] Consola del desktop + picker con carpeta muerta:
  - `Cannot read properties of null (reading 'setAttribute') at <anonymous>:1:62`:
    era el script de init de WebView2 en `desktop-app/src/main.rs` (corre en
    document-start, cuando `document.documentElement` todavía es null; la
    columna 62 coincide exacto con el `setAttribute`). Ahora usa
    MutationObserver y aplica `data-frameless` en cuanto aparece `<html>`.
    Desktop recompilado con build-desktop.ps1 (exe `9A486A0CEA27379E...`) y
    relanzado desde desktop-app.
  - 500 en `/api/fs/list?location[directory]=G:/Proyectos/elder-plinius`: el
    picker de carpeta abría el dir guardado (proyecto borrado) y el server
    responde 500. `loadDir` ahora devuelve el error y `openNewSessionPicker`
    cae al home del server; limpia la preferencia solo si hubo status HTTP
    (un fallo de red la conserva). 3 tests nuevos en useFolderPicker.test.
  - El log `[sessions] ...` no es error: está detrás de
    `localStorage.debug.sessions=1` (diagnóstico del fix "chat parado").
  - Gates: tsc 0; cargo check 0; 118 archivos / 1705 tests.



