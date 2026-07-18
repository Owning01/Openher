# Deploy APK con túnel público (funciona sin WiFi)
# Usa localtunnel (npm) - no requiere instalación
#
# Uso:
#   .\deploy-quick.ps1              # Local (misma red)
#   .\deploy-quick.ps1 -Tunnel      # Público (cualquier red)
#   .\deploy-quick.ps1 -NoBuild     # Saltar build

param(
    [switch]$NoBuild,
    [switch]$Tunnel,
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"
$webDir = $PSScriptRoot

function Get-LocalIP {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | 
           Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -ne "127.0.0.1" } | 
           Select-Object -First 1).IPAddress
    return $ip
}

Write-Host "=== OpenCode Mobile - Quick Deploy ===" -ForegroundColor Green

# Build si es necesario
if (-not $NoBuild) {
    Write-Host "`n[1/4] Building web..." -ForegroundColor Cyan
    Set-Location $webDir
    npm run build 2>&1 | Out-Null
    
    Write-Host "[2/4] Copying to Android..." -ForegroundColor Cyan
    npx cap copy 2>&1 | Out-Null
    
    Write-Host "[3/4] Building APK..." -ForegroundColor Cyan
    Set-Location "$webDir\android"
    .\gradlew assembleDebug 2>&1 | Out-Null
}

$apkPath = "$webDir\android\app\build\outputs\apk\debug\app-debug.apk"
$serveDir = "$webDir\android\app\build\outputs\apk\debug"

if (-not (Test-Path $apkPath)) {
    Write-Host "ERROR: APK not found at $apkPath" -ForegroundColor Red
    exit 1
}

Set-Location $serveDir

if ($Tunnel) {
    Write-Host "[4/4] Starting public tunnel..." -ForegroundColor Cyan
    Write-Host "`nThis creates a public URL (works from any network)" -ForegroundColor Yellow
    
    # Start HTTP server in background
    $serverProcess = Start-Process -FilePath "npx" -ArgumentList "http-server", "-p", $Port, "-c-1", "--cors", "-s" -PassThru -NoNewWindow
    
    Start-Sleep -Seconds 2
    
    # Start localtunnel
    Write-Host "`nStarting localtunnel (this may take a moment)..." -ForegroundColor Cyan
    $tunnelProcess = Start-Process -FilePath "npx" -ArgumentList "localtunnel", "--port", $Port -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\lt-output.txt"
    
    Start-Sleep -Seconds 5
    
    # Read tunnel URL
    $tunnelUrl = ""
    if (Test-Path "$env:TEMP\lt-output.txt") {
        $output = Get-Content "$env:TEMP\lt-output.txt" -Raw
        if ($output -match "https://[^\s]+\.loca\.lt") {
            $tunnelUrl = $matches[0]
        }
    }
    
    if ($tunnelUrl) {
        $downloadUrl = "$tunnelUrl/app-debug.apk"
        
        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "  APK ready for download!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "`nPublic URL (send this to your phone):" -ForegroundColor White
        Write-Host "  $downloadUrl" -ForegroundColor Yellow
        Write-Host "`nNote: First visit may show a confirmation page" -ForegroundColor Gray
        Write-Host "`nPress Ctrl+C to stop" -ForegroundColor Gray
        
        # Keep alive
        try {
            while ($true) {
                Start-Sleep -Seconds 10
                if ($serverProcess.HasExited -or $tunnelProcess.HasExited) { break }
            }
        } finally {
            $serverProcess | Stop-Process -ErrorAction SilentlyContinue
            $tunnelProcess | Stop-Process -ErrorAction SilentlyContinue
            Remove-Item "$env:TEMP\lt-output.txt" -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "`nERROR: Could not get tunnel URL" -ForegroundColor Red
        Write-Host "Check if localtunnel is working: npx localtunnel --help" -ForegroundColor Yellow
        $serverProcess | Stop-Process -ErrorAction SilentlyContinue
        exit 1
    }
} else {
    Write-Host "[4/4] Starting local server..." -ForegroundColor Cyan
    
    $localIP = Get-LocalIP
    $downloadUrl = "http://${localIP}:${Port}/app-debug.apk"
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  APK ready for download!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nLocal URL (same WiFi only):" -ForegroundColor White
    Write-Host "  $downloadUrl" -ForegroundColor Yellow
    Write-Host "`nNot on same WiFi? Use:" -ForegroundColor Cyan
    Write-Host "  .\deploy-quick.ps1 -Tunnel" -ForegroundColor Yellow
    Write-Host "`nPress Ctrl+C to stop" -ForegroundColor Gray
    
    if (Get-Command python -ErrorAction SilentlyContinue) {
        python -m http.server $Port
    } else {
        npx http-server -p $Port -c-1 --cors
    }
}
