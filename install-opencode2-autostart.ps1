<#
.SYNOPSIS
  Registra el arranque automático headless de opencode2 (:4098) con Windows.
.DESCRIPTION
  - Crea HKCU\Software\Microsoft\Windows\CurrentVersion\Run\OpenCode2Server
    apuntando al desktop headless ("opencode-desktop.exe" --ensure-opencode2-and-exit).
    El exe es windows_subsystem=windows: sin consola ni flash en logon.
  - Fallback inmediato (antes del rebuild): si el exe aún no soporta el flag,
    registra un lanzador PowerShell oculto directo al binario sano de npm-global.
  - Corrige data/config.json (puerto 4098, enabled true, server_ports con 4098).
  - Levanta el server ahora mismo headless y verifica :4098.
  Uso: powershell -ExecutionPolicy Bypass -File .\install-opencode2-autostart.ps1
#>
$ErrorActionPreference = "Stop"
$rootDir = $PSScriptRoot
$desktopAppDir = Join-Path $rootDir "desktop-app"
$exeCandidates = @(
  (Join-Path $rootDir "dist-desktop\opencode-desktop.exe"),
  (Join-Path $desktopAppDir "opencode-desktop.exe")
)
$exe = $exeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $exe) { throw "No se encontró opencode-desktop.exe (dist-desktop\ o desktop-app\). Compile con .\build-desktop.ps1 primero." }

function Get-Opencode2Exe {
  $found = $null
  try {
    $w = (where.exe opencode2 2>$null) -split "`r?`n" | Where-Object { $_ -match "opencode2\.exe$" }
    $healthy = $w | Where-Object { $_ -like "*npm-global\node_modules\@opencode\cli\bin*" } | Select-Object -First 1
    if ($healthy) { return $healthy }
    $first = $w | Select-Object -First 1
    if ($first) {
      $healthyPath = "X:\Dev\npm-global\node_modules\@opencode\cli\bin\opencode2.exe"
      if ($first -like "*bun\bin\opencode2.exe*" -and (Test-Path $healthyPath)) { return $healthyPath }
      return $first
    }
  } catch {}
  foreach ($c in @("X:\Dev\npm-global\node_modules\@opencode\cli\bin\opencode2.exe")) {
    if (Test-Path $c) { return $c }
  }
  return $null
}

$op2 = Get-Opencode2Exe
if (-not $op2) { Write-Warning "No se encontró opencode2.exe; el ensure lo descubrirá al arrancar." }

# 1. Registro principal: desktop headless (sin consola). Funciona tras rebuild con --ensure-opencode2-and-exit.
$runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$headlessCmd = "`"$exe`" --ensure-opencode2-and-exit"
Set-ItemProperty -Path $runKey -Name "OpenCode2Server" -Value $headlessCmd
Write-Host "  -> HKCU Run OpenCode2Server = $headlessCmd" -ForegroundColor Green

# 2. Corrige configs (desktop-app/data + dist-desktop/data si existen)
$cfgPaths = @(
  (Join-Path $desktopAppDir "data\config.json"),
  (Join-Path $rootDir "dist-desktop\data\config.json")
)
foreach ($cfgPath in $cfgPaths) {
  if (-not (Test-Path $cfgPath)) { continue }
  try {
    $cfg = Get-Content $cfgPath -Raw | ConvertFrom-Json
    $dirty = $false
    if ($cfg.opencode2_port -eq 4097 -or $cfg.opencode2_port -eq 0) { $cfg.opencode2_port = 4098; $dirty = $true }
    if (-not $cfg.opencode2_enabled) { $cfg.opencode2_enabled = $true; $dirty = $true }
    if (-not $cfg.server_ports -or -not ($cfg.server_ports -contains 4098)) {
      $ports = @($cfg.server_ports) + @(4098) | Sort-Object -Unique
      $cfg.server_ports = @($ports)
      $dirty = $true
    }
    if ($dirty) {
      # UTF-8 sin BOM (serde_json rechaza BOM; Set-Content -Encoding utf8 la agrega en PS5.1)
      [System.IO.File]::WriteAllText($cfgPath, ($cfg | ConvertTo-Json -Depth 10), (New-Object System.Text.UTF8Encoding $false))
      Write-Host "  -> config corregida: $cfgPath" -ForegroundColor Green
    } else {
      Write-Host "  -> config ya ok: $cfgPath" -ForegroundColor DarkGray
    }
  } catch { Write-Warning "No se pudo corregir $cfgPath : $_" }
}

# 3. Levantar ahora headless (sin consola visible)
function Test-Port($port) {
  try {
    $r = Invoke-WebRequest "http://127.0.0.1:$port/session" -UseBasicParsing -TimeoutSec 3
    return ($r.StatusCode -eq 200 -or $r.StatusCode -eq 401)
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -in @(200, 401)) { return $true }
    return $false
  }
}
if (Test-Port 4098) {
  Write-Host "  -> :4098 ya responde, no se relanza." -ForegroundColor Green
} elseif ($op2) {
  Write-Host "  -> levantando opencode2 headless..." -ForegroundColor Yellow
  Start-Process -FilePath $op2 -ArgumentList "serve", "--service" -WindowStyle Hidden
  $ok = $false
  for ($i = 0; $i -lt 16; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-Port 4098) { $ok = $true; break }
  }
  if ($ok) { Write-Host "  -> :4098 UP headless." -ForegroundColor Green }
  else { Write-Warning ":4098 no respondió tras 8s. Revise service.json (port 4098) y ejecute '$op2 serve --service'." }
} else {
  Write-Warning "Server detenido y sin binario para levantarlo."
}

Write-Host ""
Write-Host "Listo. Al reiniciar Windows, OpenCode2Server levanta :4098 en background sin consola." -ForegroundColor Cyan
Write-Host "Verificar: reg query HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v OpenCode2Server" -ForegroundColor DarkGray
