# Publica la APK más reciente en un link corto estable (/openher.apk) y escribe
# openher-version.json (version, versionCode, sha256, tamano, changelog) junto a
# los estaticos que sirve el desktop en :4848. Asi el celular siempre baja la
# ultima sin cambiar links.
#
# Uso:
#   .\scripts\publish-apk.ps1
#   .\scripts\publish-apk.ps1 -Apk ruta\app-debug.apk -Notes "cambios de la version"
param(
  [string]$Apk = "",
  [string]$Notes = "",
  [string[]]$Dest = @()
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

if (-not $Apk) { $Apk = Join-Path $root "web\android\app\build\outputs\apk\debug\app-debug.apk" }
if (-not (Test-Path $Apk)) { throw "No existe la APK: $Apk" }

$gradle = Get-Content (Join-Path $root "web\android\app\build.gradle") -Raw
$versionName = [regex]::Match($gradle, 'versionName\s+"([^"]+)"').Groups[1].Value
$versionCode = [regex]::Match($gradle, 'versionCode\s+(\d+)').Groups[1].Value
if (-not $versionName) { throw "No pude leer versionName de web/android/app/build.gradle" }

$hash = (Get-FileHash $Apk -Algorithm SHA256).Hash
$size = (Get-Item $Apk).Length
$builtAt = (Get-Date).ToString("o")

# Destinos: los mismos web-dist que usa build-desktop.ps1 (solo los que existen).
if ($Dest.Count -eq 0) {
  $Dest = @(
    (Join-Path $root "desktop-app\data\web-dist"),
    (Join-Path $root "dist-desktop\data\web-dist"),
    "X:\Dev\cargo-target\release\data\web-dist"
  ) | Where-Object { Test-Path $_ }
}
if ($Dest.Count -eq 0) { throw "No encontre ninguna carpeta data/web-dist para publicar." }

$meta = [ordered]@{
  name        = "OpenHer"
  version     = $versionName
  versionCode = [int]$versionCode
  file        = "openher.apk"
  sha256      = $hash
  size        = $size
  builtAt     = $builtAt
  notes       = $Notes
} | ConvertTo-Json -Depth 3
$utf8 = New-Object System.Text.UTF8Encoding($false)

foreach ($d in $Dest) {
  Copy-Item $Apk (Join-Path $d "openher.apk") -Force
  [System.IO.File]::WriteAllText((Join-Path $d "openher-version.json"), $meta, $utf8)
}

Write-Host "APK v$versionName ($versionCode) publicada en $($Dest.Count) destino(s)."
Write-Host "  /openher.apk  sha256=$hash  size=$size"
Write-Host "  /openher-version.json  (version + hash + changelog)"
foreach ($d in $Dest) { Write-Host "  -> $d" }
