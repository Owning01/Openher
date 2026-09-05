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
