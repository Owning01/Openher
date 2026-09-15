# Publica los artefactos ya compilados como GitHub Release para que el
# celular actualice con la PC apagada (el cliente consulta GitHub primero,
# ver GITHUB_RELEASE_BASE en web/src/shell.ts).
#
# Uso:
#   .\scripts\publish-github.ps1
#   .\scripts\publish-github.ps1 -Notes "cambios de la version"
#
# Toma versionName/versionCode de web/android/app/build.gradle y sube:
# openher.apk + openher-version.json + openher-desktop.zip
# Links estables resultantes:
#   https://github.com/Owning01/Openher/releases/latest/download/openher-version.json
#   https://github.com/Owning01/Openher/releases/latest/download/openher.apk
param(
  [string]$Notes = ""
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$gradle = Get-Content (Join-Path $root "web\android\app\build.gradle") -Raw
$versionName = [regex]::Match($gradle, 'versionName\s+"([^"]+)"').Groups[1].Value
if (-not $versionName) { throw "No pude leer versionName de web/android/app/build.gradle" }
$tag = "v$versionName"

$dist = Join-Path $root "dist-desktop\data\web-dist"
$assets = @(
  (Join-Path $dist "openher.apk"),
  (Join-Path $dist "openher-version.json"),
  (Join-Path $dist "openher-desktop.zip")
) | Where-Object { Test-Path $_ }
if ($assets.Count -lt 2) { throw "Faltan artefactos en $dist (apk + version.json mínimo)." }

$existing = ""
try {
  $existing = (gh release view $tag --json tagName 2>$null | ConvertFrom-Json).tagName
} catch {
  $existing = ""
}
if ($existing -eq $tag) {
  Write-Host "El release $tag ya existe: subo/actualizo assets (--clobber)."
  gh release upload $tag $assets --clobber
} else {
  $notesFinal = if ($Notes) { $Notes } else { "v$versionName" }
  gh release create $tag $assets --title "OpenHer v$versionName" --notes $notesFinal
}
if ($LASTEXITCODE -ne 0) { throw "gh release falló ($LASTEXITCODE)" }

Write-Host ""
Write-Host "Release $tag publicado en GitHub."
Write-Host "  version: https://github.com/Owning01/Openher/releases/latest/download/openher-version.json"
Write-Host "  apk:     https://github.com/Owning01/Openher/releases/latest/download/openher.apk"
