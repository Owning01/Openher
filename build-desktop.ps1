<#
.SYNOPSIS
  Compila la aplicación de escritorio (Web + Rust) y empaqueta el ejecutable junto a sus estáticos.
.PARAMETER OutputDir
  Carpeta destino donde se copiarán el .exe y la carpeta data/web-dist. Por defecto: .\dist-desktop
.PARAMETER Run
  Si se especifica, inicia el ejecutable al finalizar la compilación.
.PARAMETER SkipWeb
  Si se especifica, omite el paso de npm run build.
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

  # 1. Compilar Web Frontend
  if (-not $SkipWeb) {
    Write-Host "[1/3] Compilando frontend web (npm run build)..." -ForegroundColor Yellow
    Push-Location $webDir
    try {
      npm run build
      if ($LASTEXITCODE -ne 0) { throw "Error al compilar el frontend web." }
    } finally {
      Pop-Location
    }
  } else {
    Write-Host "[1/3] Omitiendo compilación web (-SkipWeb)..." -ForegroundColor DarkGray
  }

  $webDist = Join-Path $webDir "dist"
  if (-not (Test-Path (Join-Path $webDist "index.html"))) {
    throw "No se encontró $webDist\index.html. Ejecute sin -SkipWeb primero."
  }

  # 2. Compilar binario de Rust en Release
  Write-Host "[2/3] Compilando binario Rust en Release (cargo build --release)..." -ForegroundColor Yellow
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

  # 3. Empaquetar y copiar a la carpeta destino
  Write-Host "[3/3] Empaquetando en $OutputDir..." -ForegroundColor Yellow

  # Asegurar directorios de destino
  $destDataWebDist = Join-Path $OutputDir "data\web-dist"
  New-Item -ItemType Directory -Force -Path $destDataWebDist | Out-Null

  # Copiar ejecutable al OutputDir
  $destExe = Join-Path $OutputDir "opencode-desktop.exe"
  try {
    Copy-Item -Path $targetExe -Destination $destExe -Force
    Write-Host "  -> Copiado: $destExe" -ForegroundColor Green
  } catch {
    Write-Host "  -> AVISO: $destExe está en uso por un proceso activo." -ForegroundColor Yellow
  }

  # Copiar ejecutable también a desktop-app/ si no está en uso
  $devExe = Join-Path $desktopAppDir "opencode-desktop.exe"
  if ($devExe -ne $targetExe) {
    try {
      Copy-Item -Path $targetExe -Destination $devExe -Force
    } catch {
      # Ignorar si está abierto en ejecución
    }
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
