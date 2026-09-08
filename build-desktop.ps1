<#
.SYNOPSIS
  Compila la aplicación de escritorio (Web + Rust) y empaqueta el ejecutable junto a sus estáticos.
.PARAMETER OutputDir
  Carpeta destino donde se copiarán el .exe y la carpeta data/web-dist. Por defecto: .\dist-desktop
.PARAMETER Run
  Si se especifica, inicia el ejecutable al finalizar la compilación.
.PARAMETER SkipWeb
  Si se especifica, omite el paso de pnpm run build.
#>
param(
  [string]$OutputDir = "$PSScriptRoot\dist-desktop",
  [switch]$Run,
  [switch]$SkipWeb
)

$ErrorActionPreference = "Stop"

try {
  $rootDir = $PSScriptRoot
  $webDir = Join-Path $rootDir "web"
  $desktopAppDir = Join-Path $rootDir "desktop-app"

  Write-Host "==========================================" -ForegroundColor Cyan
  Write-Host "  OpenHer Desktop - Build & Packaging" -ForegroundColor Cyan
  Write-Host "==========================================" -ForegroundColor Cyan

  # Fail-fast: con el .exe abierto Windows lo bloquea y la copia quedaría vieja.
  # Se revalida después de compilar (pudo abrirse durante el build).
  $runningNow = Get-Process "opencode-desktop" -ErrorAction SilentlyContinue
  if ($runningNow) {
    $pidsNow = ($runningNow | ForEach-Object { $_.Id }) -join ", "
    throw "opencode-desktop.exe está en ejecución (PID $pidsNow). Ciérrelo antes de compilar."
  }

  # PATH y resolución de pnpm
  $node24 = "G:\Dev\nodejs-24"
  $pnpmCmd = Join-Path $node24 "pnpm.cmd"
  if (-not (Test-Path $pnpmCmd)) { $pnpmCmd = "pnpm" }
  $env:PATH = "$node24;$node24\node_modules\.bin;$env:PATH"

  # 1. Compilar Web Frontend
  if (-not $SkipWeb) {
    Write-Host "[1/2] Compilando frontend web (pnpm run build)..." -ForegroundColor Yellow
    Push-Location $webDir
    try {
      & $pnpmCmd run build
      if ($LASTEXITCODE -ne 0) { throw "Error al compilar el frontend web (pnpm run build exit $LASTEXITCODE)." }
      
      $copyScript = Join-Path $webDir "scripts\copy-dist.py"
      if (Test-Path $copyScript) {
        python $copyScript 2>&1 | Write-Host
      }
    } finally {
      Pop-Location
    }
  } else {
    Write-Host "[1/2] Omitiendo compilación web (-SkipWeb)..." -ForegroundColor DarkGray
  }

  $webDist = Join-Path $webDir "dist"
  if (-not (Test-Path (Join-Path $webDist "index.html"))) {
    throw "No se encontró $webDist\index.html. Ejecute sin -SkipWeb primero."
  }

  # 2. Compilar binario de Rust en Release
  Write-Host "[2/2] Compilando binario Rust en Release (cargo build --release)..." -ForegroundColor Yellow
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

  # El .exe en ejecución queda bloqueado por Windows y Copy-Item falla.
  # Antes se avisaba (o silenciaba) y se imprimía ÉXITO igual: fail-fast.
  $running = Get-Process "opencode-desktop" -ErrorAction SilentlyContinue
  if ($running) {
    $pids = ($running | ForEach-Object { $_.Id }) -join ", "
    throw "opencode-desktop.exe está en ejecución (PID $pids). Ciérrelo antes de compilar: con el .exe abierto Windows lo bloquea y la copia queda vieja."
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

  # 3. Empaquetar y copiar a la carpeta destino
  Write-Host "Empaquetando en $OutputDir..." -ForegroundColor Yellow

  # Asegurar directorios de destino
  $destDataWebDist = Join-Path $OutputDir "data\web-dist"
  New-Item -ItemType Directory -Force -Path $destDataWebDist | Out-Null

  # Copiar ejecutable al OutputDir (error fatal si falla o no verifica)
  $destExe = Join-Path $OutputDir "opencode-desktop.exe"
  Copy-Verified $targetExe $destExe

  # Copiar ejecutable también a desktop-app/ (mismo criterio)
  $devExe = Join-Path $desktopAppDir "opencode-desktop.exe"
  if ($devExe -ne $targetExe) {
    Copy-Verified $targetExe $devExe
  }

  # Copiar data/web-dist a OutputDir
  Copy-Item -Path "$webDist\*" -Destination $destDataWebDist -Recurse -Force
  Write-Host "  -> Copiado estáticos: $destDataWebDist" -ForegroundColor Green

  # También copiar a desktop-app/data/web-dist
  $sourceDataWebDist = Join-Path $desktopAppDir "data\web-dist"
  New-Item -ItemType Directory -Force -Path $sourceDataWebDist | Out-Null
  Copy-Item -Path "$webDist\*" -Destination $sourceDataWebDist -Recurse -Force

  if ($targetDir) {
    $targetReleaseWebDist = Join-Path $targetDir "release\data\web-dist"
    New-Item -ItemType Directory -Force -Path $targetReleaseWebDist | Out-Null
    Copy-Item -Path "$webDist\*" -Destination $targetReleaseWebDist -Recurse -Force
  }

  Write-Host "==========================================" -ForegroundColor Green
  Write-Host "  BUILD Y EMPAQUETADO EXITOSO!" -ForegroundColor Green
  Write-Host "  Carpeta lista para usar:" -ForegroundColor White
  Write-Host "  $OutputDir" -ForegroundColor Cyan
  Write-Host "  Ejecutable:" -ForegroundColor White
  Write-Host "  $destExe" -ForegroundColor Cyan
  Write-Host "==========================================" -ForegroundColor Green

  if ($Run) {
    Write-Host "Iniciando $destExe..." -ForegroundColor Yellow
    Start-Process -FilePath $destExe -WorkingDirectory $OutputDir
  }
} catch {
  Write-Host ""
  Write-Host "==========================================" -ForegroundColor Red
  Write-Host "  ERROR DURANTE LA COMPILACION:" -ForegroundColor Red
  Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "==========================================" -ForegroundColor Red
  Write-Host ""
  Write-Host "Presione Enter para continuar..." -ForegroundColor Yellow
  try {
    [void][System.Console]::ReadLine()
  } catch {
    Start-Sleep -Seconds 5
  }
  exit 1
}
