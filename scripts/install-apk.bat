@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-apk.ps1" %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ==========================================
    echo  Hubo un error durante la ejecucion.
    echo ==========================================
    echo.
    pause
)
