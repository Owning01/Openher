@echo off
REM Quick deploy: build APK + serve via HTTP
REM Usage: deploy-quick.bat [--no-build] [--port 8080]

setlocal
cd /d "%~dp0"

set PORT=8080
set NOBUILD=0

:parse_args
if "%~1"=="" goto :start
if /i "%~1"=="--no-build" set NOBUILD=1& shift & goto :parse_args
if /i "%~1"=="--port" set PORT=%~2& shift & shift & goto :parse_args
shift & goto :parse_args

:start
echo === OpenCode Remote - Quick Deploy ===
echo.

if %NOBUILD%==0 (
    echo [1/4] Building web...
    call npm run build >nul 2>&1
    if errorlevel 1 goto :error

    echo [2/4] Copying to Android...
    call npx cap copy >nul 2>&1

    echo [3/4] Building APK...
    cd android
    call gradlew assembleDebug >nul 2>&1
    if errorlevel 1 goto :error
    cd ..
)

echo [4/4] Starting HTTP server...
echo.

REM Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        if not "%%b"=="127.0.0.1" (
            set IP=%%b
            goto :found_ip
        )
    )
)
:found_ip

set IP=%IP: =%
set URL=http://%IP%:%PORT%/app-debug.apk

echo ========================================
echo   APK ready for download!
echo ========================================
echo.
echo Download URL:
echo   %URL%
echo.
echo On your phone, open the URL above
echo Press Ctrl+C to stop the server
echo.

cd android\app\build\outputs\apk\debug

REM Try Python first, then Node
where python >nul 2>&1
if %errorlevel%==0 (
    python -m http.server %PORT%
    goto :done
)

where npx >nul 2>&1
if %errorlevel%==0 (
    npx http-server -p %PORT% -c-1 --cors
    goto :done
)

echo ERROR: Neither Python nor Node.js found
exit /b 1

:error
echo Build failed!
exit /b 1

:done
