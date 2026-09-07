# 🚫 Anti-Patterns & Known Pitfalls — Base de Errores Documentados

> **Propósito:** Evitar que los agentes gasten tokens y tiempo repitiendo hipótesis o comandos que ya se comprobaron fallidos en este entorno.

---

## 1. Entorno Windows & PowerShell
- **`unlink: Invalid argument` / `EPERM`:** En Windows, los procesos activos bloquean archivos abiertos (`.exe`, bases de datos, temporales).
  * *Acción correcta:* Cerrar o detener el proceso propietario antes de mover, borrar o reescribir:
    ```powershell
    Get-Process <nombre> -ErrorAction SilentlyContinue | Stop-Process -Force
    ```
- **Liberación de Puertos TCP Bloqueados:**
  * *Acción correcta:*
    ```powershell
    Get-NetTCPConnection -LocalPort <puerto> -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
    ```
- **Sintaxis de Shell:** No ejecutar comandos bash (`rm -rf`, `kill -9`, sintaxis POSIX) en PowerShell sin herramientas compatibles. Usar cmdlets de PowerShell o herramientas CLI disponibles en el sistema.

---

## 2. Eficiencia de Tokens & Navegación de Archivos
- **Cero volcados masivos:** Nunca leer árboles completos de directorios (`node_modules`, `dist`, `.git`, `.venv`).
- **Navegación `Index-First`:** Consultar `INDEX.md` o usar `fast-find "<archivo>"` antes de iniciar escaneos recursivos profundos.

---

## 3. CSS / Layout Desktop
- **Parchar solo la hoja:** cambiar `height:auto` → `height:100%` en el panel final NO sirve si algún wrapper intermedio tiene altura `auto` (`height:100%` contra `auto` = `auto`). Verificar la cadena completa (ver skill `flex-height-chain`): todo intermedio con `display:flex; flex-direction:column; overflow:hidden`, hoja con `flex:1; min-height:0`.

---

## 4. TSX / Build (TypeScript 7 nativo)
- **Handlers inline gigantes:** un handler arrow de ~1KB en UNA sola línea dentro de un atributo JSX rompe el parseo TSX (cascada TS2657/TS1005 desde la línea siguiente) aunque llaves/parens balancen. Extraer a `useCallback` nombrado junto a los demás handlers (caso real: `BrowserPanel` tabbar `onDrop` de 1036 chars). Regla: JSX multilínea o callbacks nombrados; jamás lógica de >200 chars en una línea de atributo.

## 5. Drag-and-Drop desktop
- **Extractor de URLs vs payloads internos:** `cleanUrl`/`extractUrlFromDataTransfer` (`utils/urlDrag.ts`) se evalúa ANTES que el split en `DesktopGrid.onDrop`. Su fallback "cualquier `esquema:` es URL" tragaba `panel:0:ses_...`, `plugin:...`, `session:...` y todo split abría un tab de navegador basura. Regla: `isInternalPayload()` primero (ver `urlDrag.test.ts`); los paneles (`SessionChatPanel`) hacen `stopPropagation` para no duplicar el split con el grid.
- **Tormenta de setState en `dragover`:** `dragover` dispara a ~60-300Hz; setear un objeto nuevo (`setGridDragOver({idx,zone})`, `setDragOverIdx(...)`) por evento re-renderiza el grid/barra entera por cada mousemove = lag/delay muy notable al arrastrar tabs. Regla: guardar con ref + comparar (`idx`/`zone`) antes de setear, o updater funcional con bailout (ver `setGridDragOverGuarded` en `DesktopGrid`, `TitleBar.handleBarDragOver`).
- **Splits que resetean tamaños:** `handleDockSession`/`handleOpenFile` hacían `colSizes/rowSizes = new Array(n).fill(null)` al dividir → el resize del usuario se perdía en cada split. Regla: `insertSplitSize()` (`model.ts`) inserta `null` en la posición del split y conserva el resto (ver `model.test.ts`).

## 6. Estado "trabajando" colgado en desktop
- **`session.status` del padre solo cambia vía `onSettled`/`refreshSessions`:** el poll de `SessionChatPanel` solo hacía `loadSelected` (apaga `awaiting` pero NO el `status` busy). Si el evento SSE de fin se pierde, `isWorking` queda en true para siempre — spinner colgado hasta re-entrar. Regla: el poll reconcilia con `api.listStatuses` (server = verdad), igual que el path móvil en `useAppLifecycle`.

## 7. Geometría de ventana envenenada (oversize sin bordes)
- **`save_geometry` guardaba la huella de maximizado como rect normal** (`main.rs`): origen negativo + tamaño fullscreen (`{"x":-7.2,"width":2048,...}`). Al restaurar, el guard de solape la aceptaba y abría una ventana oversize con los bordes fuera de pantalla (imposible redimensionar), titlebar casi invisible (los clics caen en contenido, no en `.titlebar` → no arranca el drag) y repintado fullscreen por paso (lag al mover). Regla: persistir `maximized` como FLAG (`WindowGeometry.maximized`), no guardar nada minimizado, y al restaurar migrar la huella vieja a `set_maximized(true)` en vez de aplicar el rect.

## 8. Resize nativo tragado por el renderer (frameless + WebView2)
- **El `WM_NCHITTEST` se pregunta de la ventana más profunda hacia arriba:** si un descendiente del WebView (proceso `msedgewebview2` hijo, imposible de subclasear desde nuestro exe, o HWND recreado entre barridos) devuelve `HTCLIENT` en el borde, la cadena muere ahí y el padre nunca es consultado — el padre puede devolver `HTLEFT`/`HTBOTTOMRIGHT` perfectos y aún así nada redimensiona. Medido en vivo: padre 8/8 `HT*` ok, hijo profundo `HTCLIENT` en los 4 bordes. Regla: no pelear el hit-test; iniciar resize desde la web con `POST /shell/window/resize?edge=` → `WindowAction::Resize` → `drag_resize_window()` del SO (inmune al hit-test), vía handles `.win-resize-*` (ver `WindowResizeHandles.tsx` + `window_router.rs`).
- **I/O bloqueante en el loop modal de move/size:** `save_geometry` hacía `fsync`+`rename` con reintentos (hasta ~250ms) en el hilo UI dentro de `Moved`/`Resized`, y `Resized` además corría `EnumChildWindows` + re-subclass por evento = arrastre a ~20fps. Regla: persistencia de geometría en hilo aparte (fire-and-forget, throttle 400ms en el hilo UI) y re-parcheo de hijos SOLO en el barrido periódico cada 2s, nunca por evento.
