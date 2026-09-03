# install-apk.ps1 — Buildea la web + APK debug y lo instala en el celular conectado.
#
# Uso:
#   .\install-apk.ps1                  # todo: web build + cap sync + gradle + install + launch
#   .\install-apk.ps1 -SkipWebBuild    # reusa web/dist (util si tsc esta roto por otro cambio)
#   .\install-apk.ps1 -Release         # assembleRelease (requiere keystore: ver web/android/app/build.gradle)
#   .\install-apk.ps1 -Device R5CX...  # serial si hay varios celulares
#   .\install-apk.ps1 -NoLaunch        # no abrir la app tras instalar
#   .\install-apk.ps1 -CheckOnly       # solo verifica herramientas y dispositivos
#
# Requisitos (con autodeteccion): node, pnpm, JDK (jbr de Android Studio), Android SDK, adb.

param(
  [switch]$SkipWebBuild,
  [switch]$Release,
  [string]$Device = "",
  [switch]$NoLaunch,
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$AppId = "com.gbro.opencode"

function Find-Exe($names, $fallbacks) {
  foreach ($n in $names) {
    $c = Get-Command $n -ErrorAction SilentlyContinue
    if ($c) { return $c.Source }
  }
  foreach ($f in $fallbacks) {
    if ($f -and (Test-Path $f)) { return $f }
  }
  return $null
}

# --- resolucion de herramientas ---
$Node = Find-Exe @("node") @("C:\Dev\nodejs\node.exe", "G:\Dev\nodejs-24\node.exe")
$Pnpm = Find-Exe @("pnpm") @("G:\Dev\nodejs-24\pnpm.cmd", "G:\Dev\nodejs-24\pnpm.ps1")
if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
  $Jbr = "G:\Android\Android Studio\jbr"
  if (Test-Path (Join-Path $Jbr "bin\java.exe")) { $env:JAVA_HOME = $Jbr }
}
$Java = Find-Exe @("java") @((Join-Path $env:JAVA_HOME "bin\java.exe"))
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = "G:\Android\SDK" }
if (-not $env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME }
$Adb = Find-Exe @("adb") @("G:\scrcpy\adb.exe", (Join-Path $env:ANDROID_HOME "platform-tools\adb.exe"))

Write-Host "== Herramientas =="
Write-Host " node : $Node"
Write-Host " pnpm : $Pnpm"
Write-Host " java : $Java (JAVA_HOME=$env:JAVA_HOME)"
Write-Host " adb  : $Adb"
Write-Host " sdk  : $env:ANDROID_HOME"

$missing = @()
if (-not $Node) { $missing += "node" }
if (-not $Pnpm) { $missing += "pnpm" }
if (-not $Java) { $missing += "JDK (JAVA_HOME)" }
if (-not $Adb) { $missing += "adb" }
if (-not (Test-Path (Join-Path $env:ANDROID_HOME "platform-tools"))) { $missing += "Android SDK platform-tools" }
if ($missing.Count -gt 0) { throw "Falta: $($missing -join ', ')" }

# --- dispositivo ---
& $Adb start-server | Out-Null
Write-Host "== Dispositivos =="
& $Adb devices -l
$serials = & $Adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "\tdevice$" } | ForEach-Object { ($_ -split "\t")[0] }
if (-not $serials -or $serials.Count -eq 0) {
  throw "No hay celular conectado (adb devices vacio). Activa depuracion USB y acepta la huella RSA en el telefono."
}
if ($Device) {
  if ($serials -notcontains $Device) { throw "El serial $Device no esta conectado. Conectados: $($serials -join ', ')" }
  $Serial = $Device
} elseif ($serials.Count -gt 1) {
  throw "Hay varios celulares ($($serials -join ', ')). Pasa -Device <serial>."
} else {
  $Serial = $serials[0]
}
Write-Host "Usando: $Serial"
if ($CheckOnly) { Write-Host "Check OK."; exit 0 }

# --- 1. build web ---
if (-not $SkipWebBuild) {
  Write-Host "== [1/5] pnpm install (si falta node_modules) =="
  if (-not (Test-Path (Join-Path $Root "web\node_modules"))) {
    & $Pnpm --dir (Join-Path $Root "web") install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) { throw "pnpm install fallo" }
  }
  Write-Host "== [2/5] pnpm build (tsc + vite) =="
  & $Pnpm --dir (Join-Path $Root "web") build
  if ($LASTEXITCODE -ne 0) { throw "pnpm build fallo (revisa tsc). Tip: -SkipWebBuild reusa web/dist." }
} else {
  Write-Host "== [1-2/5] web build omitido (-SkipWebBuild), usando web/dist existente =="
  if (-not (Test-Path (Join-Path $Root "web\dist\index.html"))) { throw "web/dist no existe; corre sin -SkipWebBuild." }
}

# --- 2. cap sync ---
Write-Host "== [3/5] cap sync android =="
Push-Location (Join-Path $Root "web")
try {
  & $Pnpm exec cap sync android
  if ($LASTEXITCODE -ne 0) { throw "cap sync fallo" }
} finally { Pop-Location }

# --- 3. gradle ---
$Task = if ($Release) { "assembleRelease" } else { "assembleDebug" }
Write-Host "== [4/5] gradlew $Task (puede tardar varios minutos la primera vez) =="
Push-Location (Join-Path $Root "web\android")
try {
  & .\gradlew.bat $Task
  if ($LASTEXITCODE -ne 0) { throw "gradlew $Task fallo" }
} finally { Pop-Location }

# --- 4. APK mas nuevo ---
$Flavor = if ($Release) { "release" } else { "debug" }
$Apk = Get-ChildItem (Join-Path $Root "web\android\app\build\outputs\apk\$Flavor\*.apk") |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $Apk) { throw "No se encontro APK en outputs/apk/$Flavor" }
Write-Host "APK: $($Apk.FullName) ($([math]::Round($Apk.Length / 1MB, 1)) MB, $($Apk.LastWriteTime))"

# --- 5. install + launch ---
Write-Host "== [5/5] adb install -r en $Serial =="
& $Adb -s $Serial install -r $Apk.FullName
if ($LASTEXITCODE -ne 0) { throw "adb install fallo" }

if (-not $Release) {
  Copy-Item $Apk.FullName (Join-Path $Root "OpenHer-debug.apk") -Force
  Write-Host "Copia actualizada: OpenHer-debug.apk"
}
if (-not $NoLaunch) {
  & $Adb -s $Serial shell monkey -p $AppId -c android.intent.category.LAUNCHER 1 | Out-Null
  Write-Host "App lanzada."
}
Write-Host "LISTO."
