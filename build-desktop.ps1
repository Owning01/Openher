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
  [switch]$SkipWeb,
  [switch]$SkipPlugins
)

$ErrorActionPreference = "Stop"

try {
  $rootDir = $PSScriptRoot
  $webDir = Join-Path $rootDir "web"
  $desktopAppDir = Join-Path $rootDir "desktop-app"

  Write-Host "==========================================" -ForegroundColor Cyan
  Write-Host "  OpenHer Desktop - Build & Packaging" -ForegroundColor Cyan
  Write-Host "==========================================" -ForegroundColor Cyan

  # PATH fix permanente para esta sesión (Node 24 primero, evita shim roto G:\.pnpm-store\.tools)
  $node24 = "G:\Dev\nodejs-24"
  $pnpmCmd = Join-Path $node24 "pnpm.cmd"
  if (-not (Test-Path $pnpmCmd)) { $pnpmCmd = "pnpm" }
  # Prepend Node24 muy al frente para que cmd/pwsh resuelvan pnpm 12.0.0 correcto
  $env:PATH = "$node24;$node24\node_modules\.bin;$env:PATH"
  # Verificar pnpm 12
  try { $pnpmVer = & $pnpmCmd -v 2>&1 } catch { $pnpmVer = "" }
  if ($LASTEXITCODE -ne 0 -or "$pnpmVer" -notmatch "12\.") {
    Write-Host "  AVISO: pnpm no es 12.x (obtenido: $pnpmVer), se intenta continuar" -ForegroundColor Yellow
  } else {
    Write-Host "  pnpm $pnpmVer (Node $(node -v))" -ForegroundColor DarkGray
  }

  # 1. Compilar Web Frontend (pnpm 12 + Node 24, evita EPERM shim)
  if (-not $SkipWeb) {
    Write-Host "[1/3] Compilando frontend web (pnpm run build)..." -ForegroundColor Yellow
    Push-Location $webDir
    try {
      & $pnpmCmd run build
      if ($LASTEXITCODE -ne 0) { throw "Error al compilar el frontend web (pnpm run build exit $LASTEXITCODE)." }
      # Fallback copy-dist via Python real (evita EPERM cap sync) - scripts está en web/scripts
      $py = "G:\Dev\Python311\python.exe"
      $copyScript = Join-Path $webDir "scripts/copy-dist.py"
      if ((Test-Path $py) -and (Test-Path $copyScript)) {
        & $py $copyScript 2>&1 | Write-Host
        # debe imprimir "failures: none"
      } elseif (Test-Path $copyScript) {
        python $copyScript 2>&1 | Write-Host
      }
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

  # 1.5 Compilar plugins externos en modo producción (path híbrido rápido del shell).
  # Si existen los artifacts (.next/BUILD_ID o dist/index.html) el prewarm del exe
  # sirve con `start --prod` / `vite preview` / `next start` (~0.3s, sin cold dev).
  # open-design exige Node ~24; screenshots/vioeditor/informes usan nodejs-24 también.
  # El vite `emptyOutDir:false` (vite.config.ts:17) evita EPERM en dist/assets.
  if (-not $SkipPlugins) {
    Write-Host "[1.5/3] Compilando plugins externos en producción (Node 24 - pnpm 12)..." -ForegroundColor Yellow
    # $node24/$pnpmCmd ya definidos arriba; asegurar PATH
    $env:PATH = "$node24;$node24\node_modules\.bin;$env:PATH"
    $pluginJobs = @(
      # opendesign usa dev `start` (prewarm) porque `start --prod` cuelga en este entorno; su build prod no se usa.
      @{ Name = "screenshots"; Dir = "G:\Proyectos\0 screenshots"; Cmd = "pnpm build" },
      @{ Name = "vioeditor"; Dir = "G:\Proyectos\17-vioeditor\aplicacion"; Cmd = "pnpm build" },
      @{ Name = "informes"; Dir = "G:\Proyectos\53plataforma-informes"; Cmd = "pnpm build" }
    )
    foreach ($job in $pluginJobs) {
      Write-Host "  -> $($job.Name): $($job.Cmd)" -ForegroundColor DarkGray
      # EPERM fix: vite preview / desktop mmap puede tener dist/assets bloqueado.
      # Con emptyOutDir=false el build no hace rmSync, pero limpiamos si se puede.
      $distPath = Join-Path $job.Dir "dist"
      if (Test-Path $distPath) {
        try {
          # Intentar liberar lock de preview si está corriendo
          try { Invoke-RestMethod -Method Post "http://127.0.0.1:4848/shell/external/$($job.Name)/stop" -TimeoutSec 2 | Out-Null } catch {}
          Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "vite.*preview" } | ForEach-Object { taskkill /F /PID $_.ProcessId 2>$null | Out-Null }
          Start-Sleep -Milliseconds 400
          # No borrar dist si emptyOutDir=false, pero intentar vaciar assets si está libre
          # Si falla, el build continuará y sobrescribirá (emptyOutDir=false evita EPERM fatal)
        } catch {}
      }
      Push-Location $job.Dir
      try {
        # Usar pnpm.cmd directo con args separados (evita Invoke-Expression + espacio en "0 screenshots")
        $cmdArgs = ($job.Cmd -replace "^pnpm\s+", "") -split "\s+"
        & $pnpmCmd @cmdArgs
        if ($LASTEXITCODE -ne 0) {
          Write-Host "     AVISO: build de $($job.Name) falló (exit $LASTEXITCODE). Intentando retry tras liberar lock..." -ForegroundColor Yellow
          try { Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "vite.*preview" } | ForEach-Object { taskkill /F /PID $_.ProcessId 2>$null | Out-Null } } catch {}
          Start-Sleep -Milliseconds 800
          & $pnpmCmd @cmdArgs
          if ($LASTEXITCODE -ne 0) { Write-Host "     AVISO: build de $($job.Name) falló de nuevo (exit $LASTEXITCODE). El prewarm usará dev como fallback." -ForegroundColor Yellow }
          else { Write-Host "     -> $($job.Name) retry OK" -ForegroundColor Green }
        } else {
          Write-Host "     -> $($job.Name) OK" -ForegroundColor Green
        }
      } finally {
        Pop-Location
      }
    }
  } else {
    Write-Host "[1.5/3] Omitiendo build de plugins (-SkipPlugins)..." -ForegroundColor DarkGray
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
