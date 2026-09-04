# Windows Take Ownership (dueño absoluto de datos)

## Alcance seguro
- Solo perfil (`C:\Users\<u>`) + discos de datos. NUNCA `C:\Windows`, `Program Files`, raíz `C:` (son de TrustedInstaller; romper servicing).

## Procedimiento (elevar vía tarea `schtasks /ru SYSTEM`, no `sudo` para jobs largos: mueren sin aviso)
1. `Checkpoint-Computer` (restore point) + `icacls <dir> /save backup.acl` (solo raíz).
2. Por item: `icacls <p> /setowner <user> /T /C /Q` y LUEGO `icacls <p> /grant <user>:F /T /C /Q` (separados: combinados da "Parámetro no válido").
3. NO usar `takeown /D Y` en Windows español (quiere `/D S`); como SYSTEM es innecesario: `icacls /setowner` basta.

## Trampas (todas verificadas 2026-09-03)
- `icacls /T` sigue symlinks pnpm (`node_modules/@scope/* -> ..\..\.`) en loop INFINITO. No borrar links (rompe build); declarar hecho por muestreo si el dueño ya es el usuario.
- `DumpStack.log.tmp`, `dedicateddump.sys`, `pagefile.sys`: cuelgan `icacls` para siempre. Watchdog: `Start-Process -PassThru` + `WaitForExit(1200000)`, `Kill()` si timeout.
- Verificación final: owner nivel-1 de cada raíz; sobrantes típicos OK: núcleos de Windows dormidos en otros discos + dumps bloqueados por kernel.
