# Actualiza OpenHer de punta a punta: sube la version (patch + versionCode),
# buildea la web, deploya a los web-dist, compila la APK y publica el link
# corto estable (/openher.apk + openher-version.json). La APK instalada
# detecta la version nueva sola (al abrir o volver a primer plano) y ofrece
# Actualizar; Android solo pide confirmar la instalacion.
#
# Uso: .\scripts\update-app.ps1 -Notes "que cambio en esta version"
#      .\scripts\update-app.ps1 -Notes "..." -SkipDesktop   # solo APK/web
param(
  [string]$Notes = "",
  [switch]$SkipDesktop
)
# Nota: los comandos nativos (pnpm/gradle) escriben avisos en stderr, que con
# ErrorActionPreference=Stop PowerShell trata como error fatal y aborta el
# script. Se usa Continue y se valida cada paso por $LASTEXITCODE.
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot

# 1) Bump de version (patch + versionCode)
$gradlePath = Join-Path $root "web\android\app\build.gradle"
$gradle = Get-Content $gradlePath -Raw
$ver = [regex]::Match($gradle, 'versionName\s+"(\d+)\.(\d+)\.(\d+)"')
if (-not $ver.Success) { throw "No pude leer versionName en $gradlePath" }
$vc = [int][regex]::Match($gradle, 'versionCode\s+(\d+)').Groups[1].Value
$newVn = "$($ver.Groups[1].Value).$($ver.Groups[2].Value).$([int]$ver.Groups[3].Value + 1)"
$newVc = $vc + 1
$gradle = $gradle -replace 'versionCode\s+\d+', "versionCode $newVc"
$gradle = $gradle -replace 'versionName\s+"[^"]+"', ('versionName "' + $newVn + '"')
Set-Content -Path $gradlePath -Value $gradle -NoNewline
Write-Host "Nueva version: $newVn ($newVc)" -ForegroundColor Cyan

# 2) Build web + build-info + deploy a los web-dist
Push-Location (Join-Path $root "web")
try {
  pnpm build
  if ($LASTEXITCODE -ne 0) { throw "pnpm build fallo ($LASTEXITCODE)" }
  $info = @{ builtAt = (Get-Date).ToString("o"); gitHead = "apk-$newVn-auto"; source = "apk-android"; version = $newVn; versionCode = $newVc } | ConvertTo-Json -Compress
  [System.IO.File]::WriteAllText((Join-Path (Get-Location) "dist\build-info.json"), $info, (New-Object System.Text.UTF8Encoding($false)))
  foreach ($dst in @(
    (Join-Path $root "desktop-app\data\web-dist"),
    (Join-Path $root "dist-desktop\data\web-dist"),
    "X:\Dev\cargo-target\release\data\web-dist"
  )) {
    # /MIR limpia chunks viejos (el web-dist acumulaba >100MB de builds
    # anteriores); /XF no toca los artefactos publicados (APK/zip/version).
    if (Test-Path (Split-Path $dst)) {
      robocopy dist $dst /MIR /XF openher.apk openher-version.json openher-desktop.zip /NJH /NJS /NFL /NDL /NP | Out-Null
      if ($LASTEXITCODE -ge 8) { throw "robocopy fallo hacia $dst ($LASTEXITCODE)" }
    }
  }

  # 3) Sync Capacitor + APK
  npx cap sync android
  if ($LASTEXITCODE -ne 0) { throw "cap sync fallo ($LASTEXITCODE)" }
  $env:JAVA_HOME = "G:\Android\Android Studio\jbr"
  $env:ANDROID_HOME = "G:\Android\SDK"
  $env:GRADLE_USER_HOME = "G:\.gradle"
  Push-Location android
  try {
    .\gradlew.bat :app:assembleDebug -q
    if ($LASTEXITCODE -ne 0) { throw "gradle fallo ($LASTEXITCODE)" }
  } finally {
    Pop-Location
  }
} finally {
  Pop-Location
}

# 4) Publicar link corto + JSON de version
$notesFinal = if ($Notes) { $Notes } else { "v$newVn" }
& (Join-Path $root "scripts\publish-apk.ps1") -Notes $notesFinal

# 5) Desktop: compilar Rust y publicar el zip de self-update (notebooks con
#    server remoto). El bloque `desktop` se agrega al mismo openher-version.json.
if (-not $SkipDesktop) {
  Write-Host ""
  Write-Host "Compilando desktop + publicando self-update (openher-desktop.zip)..." -ForegroundColor Yellow
  & (Join-Path $root "build-desktop.ps1") -SkipWeb -NoPause -Run
  if ($LASTEXITCODE -ne 0) { throw "build-desktop fallo ($LASTEXITCODE)" }
  & (Join-Path $root "scripts\publish-desktop.ps1")
  if ($LASTEXITCODE -ne 0) { throw "publish-desktop fallo ($LASTEXITCODE)" }
}

Write-Host ""
Write-Host "Listo v$newVn. El celular la detecta al abrir la app y ofrece Actualizar." -ForegroundColor Green
if (-not $SkipDesktop) {
  Write-Host "La notebook (server remoto) se actualiza sola con openher-desktop.zip." -ForegroundColor Green
}
Write-Host "Link estable: http://100.77.237.102:4848/openher.apk"
