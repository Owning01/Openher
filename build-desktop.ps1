<#
.SYNOPSIS
  Compila la aplicación de escritorio (Web + Rust) y empaqueta el ejecutable junto a sus estáticos.
.DESCRIPTION
  Al terminar imprime un resumen verificable (hash + fecha del .exe destino y
  de data/web-dist) y lo deja en build-desktop.log. Si el .exe está en
  ejecución, el propio script lo cierra antes de compilar/copiar (Windows lo
  bloquea y la copia quedaría vieja).
.PARAMETER OutputDir
  Carpeta destino donde se copiarán el .exe y la carpeta data/web-dist. Por defecto: .\dist-desktop
.PARAMETER Run
  Si se especifica, inicia el ejecutable al finalizar la compilación.
.PARAMETER SkipWeb
  Si se especifica, omite el paso de pnpm run build.
.PARAMETER Kill
  Compatibilidad: el script siempre cierra el .exe en ejecución; se conserva
  el flag para no romper invocaciones existentes.
.PARAMETER Pause
  Fuerza la pausa final ("Presione Enter..."). Por defecto solo pausa si se
  lanzó con doble clic (padre = explorer).
.PARAMETER NoPause
  Nunca pausa al final (útil en terminal/CI).
#>
param(
  [string]$OutputDir = "$PSScriptRoot\dist-desktop",
  [switch]$Run,
  [switch]$SkipWeb,
  [switch]$Kill,
  [switch]$Pause,
  [switch]$NoPause
)

$ErrorActionPreference = "Stop"

$logFile = Join-Path $PSScriptRoot "build-desktop.log"
try { Start-Transcript -Path $logFile -Append | Out-Null } catch { }

$buildOk = $false
$phaseStart = Get-Date

function Write-Phase([string]$msg) {
  Write-Host ""
  Write-Host $msg -ForegroundColor Yellow
}

function Get-RunningDesktop {
  return @(Get-Process "opencode-desktop" -ErrorAction SilentlyContinue)
}

function Test-LaunchedFromExplorer {
  try {
    $self = Get-CimInstance Win32_Process -Filter "ProcessId=$PID"
    $parent = Get-Process -Id $self.ParentProcessId -ErrorAction Stop
    return $parent.ProcessName -ieq "explorer"
  } catch { return $false }
}

function Stop-RunningDesktop {
  $running = Get-RunningDesktop
  if ($running.Count -eq 0) { return }
  $pids = ($running | ForEach-Object { $_.Id }) -join ", "
  Write-Host "opencode-desktop.exe en ejecución (PID $pids): se cierra solo para compilar..." -ForegroundColor Yellow
  foreach ($p in $running) {
    try { $p.CloseMainWindow() | Out-Null } catch { }
  }
  $deadline = (Get-Date).AddSeconds(8)
  do {
    Start-Sleep -Milliseconds 500
    $running = Get-RunningDesktop
  } while ($running.Count -gt 0 -and (Get-Date) -lt $deadline)
  foreach ($p in $running) {
    try { Stop-Process -Id $p.Id -Force } catch { }
  }
  Start-Sleep -Milliseconds 500
  $still = Get-RunningDesktop
  if ($still.Count -gt 0) {
    throw "No se pudo cerrar opencode-desktop.exe (PID $(($still | ForEach-Object { $_.Id }) -join ', ')). Ciérrelo a mano y recompile."
  }
}

function Copy-Verified([string]$src, [string]$dst) {
  Copy-Item -Path $src -Destination $dst -Force
  $a = (Get-FileHash -Path $src -Algorithm SHA256).Hash
  $b = (Get-FileHash -Path $dst -Algorithm SHA256).Hash
  if ($a -ne $b) {
    throw "Verificación fallida al copiar a $dst (hash distinto al origen). Cierre opencode-desktop.exe y recompile."
  }
  Write-Host "  -> Copiado y verificado: $dst" -ForegroundColor Green
}

function Clear-DirContents([string]$dir) {
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    return
  }
  # Locks transitorios (indexador/antivirus retienen bundles viejos): reintentar.
  # Si persiste, se avisa y se sigue: los bundles llevan hash en el nombre y los
  # huérfanos no los referencia el nuevo index.html (que sí se verifica hash).
  # El Copy-Item posterior igual sobrescribe todo lo que no esté bloqueado.
  for ($i = 1; $i -le 4; $i++) {
    try {
      Remove-Item (Join-Path $dir "*") -Recurse -Force -ErrorAction Stop
      return
    } catch {
      if ($i -eq 4) {
        Write-Host "  AVISO: no se pudo limpiar $dir ($($_.Exception.Message)). Se continúa." -ForegroundColor Yellow
        return
      }
      Start-Sleep -Milliseconds 1500
    }
  }
}

try {
  $rootDir = $PSScriptRoot
  $webDir = Join-Path $rootDir "web"
  $desktopAppDir = Join-Path $rootDir "desktop-app"

  Write-Host "==========================================" -ForegroundColor Cyan
  Write-Host "  OpenHer Desktop - Build & Packaging" -ForegroundColor Cyan
  Write-Host "==========================================" -ForegroundColor Cyan
  try {
    $head = (git -C $rootDir rev-parse --short HEAD 2>$null)
    if ($head) { Write-Host "  git HEAD: $head" -ForegroundColor DarkGray }
  } catch { }
  Write-Host "  Log: $logFile" -ForegroundColor DarkGray

  # El .exe abierto bloquea la copia en Windows: el propio script lo cierra
  # (elegante primero, forzado si no responde). Se revalida antes de copiar
  # por si se reabrió durante el build.
  Stop-RunningDesktop

  # PATH y resolución de pnpm
  $node24 = "G:\Dev\nodejs-24"
  $pnpmCmd = Join-Path $node24 "pnpm.cmd"
  if (-not (Test-Path $pnpmCmd)) { $pnpmCmd = "pnpm" }
  $env:PATH = "$node24;$node24\node_modules\.bin;$env:PATH"

  # 1. Compilar Web Frontend
  $t1 = Get-Date
  if (-not $SkipWeb) {
    Write-Phase "[1/2] Compilando frontend web (pnpm run build)..."
    Push-Location $webDir
    try {
      & $pnpmCmd run build
      if ($LASTEXITCODE -ne 0) { throw "Error al compilar el frontend web (pnpm run build exit $LASTEXITCODE)." }

      $copyScript = Join-Path $webDir "scripts\copy-dist.py"
      if (Test-Path $copyScript) {
        python $copyScript 2>&1 | Write-Host
        if ($LASTEXITCODE -ne 0) { throw "Error en scripts/copy-dist.py (exit $LASTEXITCODE)." }
      }
    } finally {
      Pop-Location
    }
  } else {
    Write-Phase "[1/2] Omitiendo compilación web (-SkipWeb)..."
  }
  Write-Host "  (web: $([math]::Round(((Get-Date) - $t1).TotalSeconds, 1))s)" -ForegroundColor DarkGray

  $webDist = Join-Path $webDir "dist"
  $webIndex = Join-Path $webDist "index.html"
  if (-not (Test-Path $webIndex)) {
    throw "No se encontró $webIndex. Ejecute sin -SkipWeb primero."
  }

  # Sello de build: permite comprobar en disco qué compilación sirve el .exe.
  try {
    $headFull = (git -C $rootDir rev-parse --short HEAD 2>$null)
  } catch { $headFull = $null }
  $buildInfo = [ordered]@{
    builtAt  = (Get-Date).ToString("o")
    gitHead  = $headFull
    source   = "build-desktop.ps1"
  }
  ($buildInfo | ConvertTo-Json) | Out-File -FilePath (Join-Path $webDist "build-info.json") -Encoding utf8

  # 2. Compilar binario de Rust en Release
  $t2 = Get-Date
  Write-Phase "[2/2] Compilando binario Rust en Release (cargo build --release)..."
  Push-Location $desktopAppDir
  try {
    cargo build --release
    if ($LASTEXITCODE -ne 0) { throw "Error al compilar el proyecto Rust." }

    # Detectar dinámicamente el directorio target de cargo
    $targetDir = $null
    try {
      $metadataJson = cargo metadata --format-version 1 --no-deps | ConvertFrom-Json
      $targetDir = $metadataJson.target_directory
    } catch {
      $targetDir = $null
    }
  } finally {
    Pop-Location
  }
  Write-Host "  (rust: $([math]::Round(((Get-Date) - $t2).TotalSeconds, 1))s)" -ForegroundColor DarkGray

  # Localizar el .exe compilado
  $candidates = @(
    $(if ($targetDir) { Join-Path $targetDir "release\opencode-desktop.exe" }),
    (Join-Path $desktopAppDir "target\release\opencode-desktop.exe"),
    "G:\.cargo-target\release\opencode-desktop.exe",
    (Join-Path $desktopAppDir "opencode-desktop.exe")
  )

  $targetExe = $null
  foreach ($cand in $candidates) {
    if ($cand -and (Test-Path $cand)) {
      $targetExe = $cand
      break
    }
  }

  if (-not $targetExe) {
    throw "No se encontró el ejecutable generado en ninguna de las rutas: $($candidates -join ', ')"
  }

  Write-Host "  -> Binario origen: $targetExe" -ForegroundColor DarkGray

  # El .exe en ejecución queda bloqueado por Windows y Copy-Item falla:
  # revalidar por si se reabrió durante el build (el script lo cierra solo).
  Stop-RunningDesktop

  # 3. Empaquetar y copiar a la carpeta destino
  Write-Phase "[3/3] Empaquetando en $OutputDir..."

  # Asegurar directorios de destino (limpios: sin bundles viejos huérfanos)
  $destDataWebDist = Join-Path $OutputDir "data\web-dist"
  Clear-DirContents $destDataWebDist

  # Copiar ejecutable al OutputDir (error fatal si falla o no verifica)
  $destExe = Join-Path $OutputDir "opencode-desktop.exe"
  Copy-Verified $targetExe $destExe

  # Copiar ejecutable también a desktop-app/ (mismo criterio)
  $devExe = Join-Path $desktopAppDir "opencode-desktop.exe"
  if ($devExe -ne $targetExe) {
    Copy-Verified $targetExe $devExe
  }

  # Copiar data/web-dist a OutputDir (+ verificar index.html byte a byte)
  Copy-Item -Path "$webDist\*" -Destination $destDataWebDist -Recurse -Force
  $srcIdxHash = (Get-FileHash -Path $webIndex -Algorithm SHA256).Hash
  $dstIdxHash = (Get-FileHash -Path (Join-Path $destDataWebDist "index.html") -Algorithm SHA256).Hash
  if ($srcIdxHash -ne $dstIdxHash) { throw "Verificación fallida de index.html en $destDataWebDist." }
  Write-Host "  -> Copiado estáticos: $destDataWebDist" -ForegroundColor Green

  # También copiar a desktop-app/data/web-dist
  $sourceDataWebDist = Join-Path $desktopAppDir "data\web-dist"
  Clear-DirContents $sourceDataWebDist
  Copy-Item -Path "$webDist\*" -Destination $sourceDataWebDist -Recurse -Force

  if ($targetDir) {
    $targetReleaseWebDist = Join-Path $targetDir "release\data\web-dist"
    Clear-DirContents $targetReleaseWebDist
    Copy-Item -Path "$webDist\*" -Destination $targetReleaseWebDist -Recurse -Force
  }

  $buildOk = $true

  # Resumen verificable: qué quedó, dónde, y de cuándo es.
  $destHash = (Get-FileHash -Path $destExe -Algorithm SHA256).Hash.Substring(0, 16)
  $destTime = (Get-Item $destExe).LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
  $idxTime = (Get-Item $webIndex).LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
  $total = [math]::Round(((Get-Date) - $phaseStart).TotalSeconds, 1)
  Write-Host ""
  Write-Host "==========================================" -ForegroundColor Green
  Write-Host "  RESULTADO: BUILD OK (${total}s)" -ForegroundColor Green
  Write-Host "  Exe destino : $destExe" -ForegroundColor White
  Write-Host "  Exe sha256  : $destHash... ($destTime)" -ForegroundColor White
  Write-Host "  Web index   : $($srcIdxHash.Substring(0, 16))... ($idxTime)" -ForegroundColor White
  Write-Host "  (Si el .exe no cambió su hash es porque no hubo cambios Rust;" -ForegroundColor DarkGray
  Write-Host "   lo que actualiza la UI es data/web-dist de arriba.)" -ForegroundColor DarkGray
  Write-Host "==========================================" -ForegroundColor Green

  if ($Run) {
    Write-Host "Iniciando $destExe..." -ForegroundColor Yellow
    Start-Process -FilePath $destExe -WorkingDirectory $OutputDir
  }
} catch {
  Write-Host ""
  Write-Host "==========================================" -ForegroundColor Red
  Write-Host "  RESULTADO: BUILD FALLO" -ForegroundColor Red
  Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "  Detalle completo en: $logFile" -ForegroundColor Red
  Write-Host "==========================================" -ForegroundColor Red
} finally {
  try { Stop-Transcript | Out-Null } catch { }
  $pause = if ($NoPause) { $false } elseif ($Pause) { $true } else { Test-LaunchedFromExplorer }
  if ($pause) {
    Write-Host ""
    try {
      Read-Host "Presione Enter para cerrar"
    } catch {
      Start-Sleep -Seconds 5
    }
  }
}

if ($buildOk) { exit 0 } else { exit 1 }
