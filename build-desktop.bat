@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-desktop.ps1" %*
set "BUILD_RC=%ERRORLEVEL%"
echo.
echo ==========================================
if %BUILD_RC% NEQ 0 (
    echo  BUILD FALLO (codigo %BUILD_RC%). Ver build-desktop.log
) else (
    echo  BUILD OK. Resumen arriba. Detalle en build-desktop.log
)
echo ==========================================
echo.
pause
