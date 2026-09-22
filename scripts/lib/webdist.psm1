# scripts/lib/webdist.psm1 - Lista unica de destinos data/web-dist + copia segura.
#
# Antes la lista de web-dist estaba repetida en install-apk.ps1 (1 vez) y
# update-app.ps1 (2 veces), y ademas divergia: build-desktop escribe en el
# target-dir de cargo resuelto por desktop-app/.cargo/config.toml, mientras
# install-apk/update-app publicaban a un "X:\Dev\cargo-target" hardcodeado.
# Aca se resuelve el target-dir de cargo de una sola forma y se avisa si un
# destino configurado no existe (antes se salteaba en silencio).

Set-StrictMode -Version Latest

function Get-CargoTargetDir {
  # Target-dir real del crate desktop-app: config del crate > env > cargo metadata.
  param([Parameter(Mandatory)][string]$Root)

  $desktop = Join-Path $Root "desktop-app"
  $cfg = Join-Path $desktop ".cargo\config.toml"
  if (Test-Path $cfg) {
    $m = [regex]::Match((Get-Content $cfg -Raw), '(?m)^\s*target-dir\s*=\s*"([^"]+)"')
    if ($m.Success) {
      $dir = $m.Groups[1].Value.Replace('/', '\')
      if (-not [System.IO.Path]::IsPathRooted($dir)) { $dir = Join-Path $desktop $dir }
      return $dir
    }
  }

  if ($env:CARGO_TARGET_DIR) { return $env:CARGO_TARGET_DIR }

  try {
    Push-Location $desktop
    try {
      $meta = cargo metadata --format-version 1 --no-deps 2>$null | ConvertFrom-Json
      if ($meta.target_directory) { return $meta.target_directory }
    } finally { Pop-Location }
  } catch { }
  return $null
}

function Get-WebDistTargets {
  <#
    Devuelve los destinos data/web-dist configurados que hoy existen.
    -RequireExisting : exige que la carpeta exista (para copiar archivos adentro).
    Sin el switch alcanza con que exista el padre (robocopy crea la carpeta).
  #>
  param(
    [Parameter(Mandatory)][string]$Root,
    [switch]$RequireExisting
  )

  $list = New-Object System.Collections.Generic.List[string]
  $list.Add((Join-Path $Root "desktop-app\data\web-dist"))
  $list.Add((Join-Path $Root "dist-desktop\data\web-dist"))
  $cargo = Get-CargoTargetDir -Root $Root
  if ($cargo) { $list.Add((Join-Path $cargo "release\data\web-dist")) }

  $result = @()
  foreach ($d in $list) {
    $ok = if ($RequireExisting) { Test-Path $d } else { Test-Path (Split-Path -Parent $d) }
    if ($ok) { $result += $d }
    else { Write-Warning "web-dist configurado no existe (se omite): $d" }
  }
  return @($result)
}

function Sync-WebDist {
  <#
    Copia Source -> Destination SIN /MIR y purga por antiguedad.
    Motivo: los bundles llevan hash en el nombre y un cliente vivo (ventana
    abierta con el index anterior) puede pedir chunks viejos por lazy-load.
    /MIR los borra y el panel muere con "Failed to fetch dynamically imported
    module" (MIME text/html por el fallback SPA). Por eso se copia encima y
    solo se borra lo que ya no esta en el origen y supera MaxAgeDays (>2 builds).
    /XF protege los artefactos publicados (APK/zip/version.json).
  #>
  param(
    [Parameter(Mandatory)][string]$Source,
    [Parameter(Mandatory)][string]$Destination,
    [int]$MaxAgeDays = 7,
    [string[]]$Keep = @("openher.apk", "openher-version.json", "openher-desktop.zip")
  )

  if (-not (Test-Path (Join-Path $Source "index.html"))) { throw "Origen sin index.html: $Source" }
  if (-not (Test-Path $Destination)) { New-Item -ItemType Directory -Force -Path $Destination | Out-Null }

  robocopy $Source $Destination /E /XF @Keep /NJH /NJS /NFL /NDL /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy fallo hacia $Destination ($LASTEXITCODE)" }

  $cutoff = (Get-Date).AddDays(-$MaxAgeDays)
  # El path relativo se calcula con el largo del DESTINO (antes usaba el del
  # origen sobre rutas del destino: daba basura y borraba archivos viejos que SI
  # existen en el origen — se comio themes/, icon.png y manifest.webmanifest).
  $destLen = (Resolve-Path -LiteralPath $Destination).Path.TrimEnd('\').Length
  Get-ChildItem $Destination -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -notin $Keep -and $_.LastWriteTime -lt $cutoff
  } | ForEach-Object {
    $rel = $_.FullName.Substring($destLen).TrimStart('\')
    if (-not (Test-Path (Join-Path $Source $rel))) {
      Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
    }
  }
}

Export-ModuleMember -Function Get-CargoTargetDir, Get-WebDistTargets, Sync-WebDist
