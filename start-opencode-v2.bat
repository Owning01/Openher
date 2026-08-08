@echo off
setlocal
title OpenCode v2 Server (4097)
rem ============================================================
rem  OpenCode v2 (opencode2) - server background en :4097
rem  Doble clic para iniciar. Config: hostname 0.0.0.0,
rem  port 4097, password "octavio" (username fijo: opencode).
rem ============================================================

where opencode2 >nul 2>&1
if errorlevel 1 (
  echo opencode2 no esta en PATH. Instalalo con:
  echo   pnpm add -g @opencode-ai/cli
  pause
  exit /b 1
)

rem --- asegurar config del servicio ---
for /f "delims=" %%v in ('opencode2 service get 2^>nul ^| findstr /c:"\"port\": 4097"') do set PORT_OK=1
if not defined PORT_OK (
  echo Configurando port 4097...
  opencode2 service set port 4097
)
for /f "delims=" %%v in ('opencode2 service get 2^>nul ^| findstr /c:"\"hostname\": \"0.0.0.0\""') do set HOST_OK=1
if not defined HOST_OK (
  echo Configurando hostname 0.0.0.0...
  opencode2 service set hostname 0.0.0.0
)
opencode2 service set password octavio >nul 2>&1

rem --- arrancar (no bloquea; el daemon corre por fuera) ---
echo Iniciando OpenCode v2 en http://0.0.0.0:4097 ...
opencode2 service start
echo.
echo Server levantado. Credenciales:
echo   URL:      http://IP-DE-ESTA-PC:4097
echo   Username: opencode
echo   Password: octavio
echo.
echo Si el server ya estaba corriendo, este script no hace nada.
timeout /t 5 >nul
exit /b 0
