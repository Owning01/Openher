# update-app.ps1 — release GLOBAL de OpenHer (el script de la PC).
#
# Es uno de los DOS scripts de instalacion del proyecto:
#   - scripts\install-apk.ps1: el celular (build/install y publicacion del APK).
#   - scripts\update-app.ps1 (este): release completo de punta a punta.
#
# Hace: bump de version (patch + versionCode), build web + deploy a los web-dist, APK
# (delegada a install-apk.ps1, que la compila y publica el link corto), self-update del
# desktop (openher-desktop.zip) y espejo en GitHub Releases (para actualizar con la PC
# apagada). El bloque `desktop` se agrega al mismo openher-version.json.
#
# Uso: .\scripts\update-app.ps1 -Notes "que cambio en esta version"
#      .\scripts\update-app.ps1 -Notes "..." -SkipDesktop   # solo APK/web
#      .\scripts\update-app.ps1 -Autostart                  # solo registra el arranque de opencode2 (PC)
param(
  [string]$Notes = "",
  [switch]$SkipDesktop,
  [switch]$Autostart
)
# Nota: los comandos nativos (pnpm/gradle) escriben avisos en stderr, que con
# ErrorActionPreference=Stop PowerShell trata como error fatal y aborta el
# script. Se usa Continue y se valida cada paso por $LASTEXITCODE.
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
Import-Module (Join-Path $PSScriptRoot "lib\version.psm1") -Force
Import-Module (Join-Path $PSScriptRoot "lib\webdist.psm1") -Force

# Publica el self-update del DESKTOP: zippea openher-desktop.exe + data/web-dist (sin la
# APK) y agrega el bloque `desktop` a openher-version.json. La notebook conectada a un
# server remoto lo detecta y el shell Rust descarga, reemplaza y se relanza solo.
function Publish-Desktop {
  $dist = Join-Path $root "dist-desktop"
  $exe = Join-Path $dist "openher-desktop.exe"
  $webDist = Join-Path $dist "data\web-dist"
  if (-not (Test-Path $exe)) { throw "No existe $exe (corre scripts\build-desktop.ps1 primero)." }
  if (-not (Test-Path (Join-Path $webDist "index.html"))) { throw "No existe $webDist\index.html" }

  # Version publicable: la misma que la APK (build.gradle).
  $av = Get-AppVersion -Root $root
  $versionName = $av.Name
  $versionCode = $av.Code

  $Dest = Get-WebDistTargets -Root $root -RequireExisting
  if ($Dest.Count -eq 0) { throw "No encontre ninguna carpeta data/web-dist para publicar." }

  $zip = Join-Path $env:TEMP ("openher-desktop-" + [guid]::NewGuid().ToString("N").Substring(0, 8) + ".zip")
  try {
    # Zip armado desde memoria leyendo SIEMPRE los archivos originales (nunca una
    # copia fresca en %TEMP%): Defender bloquea de forma intermitente los reads
    # de una copia recien escrita y tambien CreateFromDirectory/tar al leer docs
    # de "learning" con contenido pentest. Leer bytes sueltos y escribirlos en las
    # entries evita esos hooks.
    if (Test-Path $zip) { Remove-Item $zip -Force }
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::Open($zip, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
      foreach ($f in (Get-ChildItem $webDist -Recurse -File)) {
        $name = $f.Name
        if ($name -in @("openher.apk", "openher-version.json", "openher-desktop.zip")) { continue }
        $rel = $f.FullName.Substring($webDist.Length).TrimStart('\').Replace('\', '/')
        $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
        $entry = $archive.CreateEntry("data/web-dist/$rel", [System.IO.Compression.CompressionLevel]::Optimal)
        $stream = $entry.Open()
        try { $stream.Write($bytes, 0, $bytes.Length) } finally { $stream.Dispose() }
      }
      $exeBytes = [System.IO.File]::ReadAllBytes($exe)
      $exeEntry = $archive.CreateEntry("openher-desktop.exe", [System.IO.Compression.CompressionLevel]::Optimal)
      $exeStream = $exeEntry.Open()
      try { $exeStream.Write($exeBytes, 0, $exeBytes.Length) } finally { $exeStream.Dispose() }
    } finally {
      $archive.Dispose()
    }

    $hash = (Get-FileHash $zip -Algorithm SHA256).Hash
    $size = (Get-Item $zip).Length

    foreach ($d in $Dest) {
      Copy-Item $zip (Join-Path $d "openher-desktop.zip") -Force
      $metaPath = Join-Path $d "openher-version.json"
      $obj = [ordered]@{}
      if (Test-Path $metaPath) {
        try {
          $cur = Get-Content $metaPath -Raw | ConvertFrom-Json
          foreach ($p in $cur.PSObject.Properties) { $obj[$p.Name] = $p.Value }
        } catch { }
      }
      $obj["desktop"] = [ordered]@{
        file        = "openher-desktop.zip"
        sha256      = $hash
        size        = $size
        version     = $versionName
        versionCode = [int]$versionCode
      }
      [System.IO.File]::WriteAllText($metaPath, ($obj | ConvertTo-Json -Depth 4), $utf8NoBom)
    }

    Write-Host "Desktop v$versionName ($versionCode) publicado en $($Dest.Count) destino(s)."
    Write-Host "  /openher-desktop.zip  sha256=$hash  size=$size"
    foreach ($d in $Dest) { Write-Host "  -> $d" }
  } finally {
    if (Test-Path $zip) { Remove-Item -Force $zip -ErrorAction SilentlyContinue }
  }
}

# Publica los artefactos ya compilados como GitHub Release para que el celular actualice
# con la PC apagada (el cliente consulta GitHub primero, ver GITHUB_RELEASE_BASE en
# web/src/shell.ts). Toma versionName de build.gradle y sube apk + version.json + zip.
function Publish-Github([string]$NotesText) {
  $versionName = (Get-AppVersion -Root $root).Name
  $tag = "v$versionName"

  $dist = Join-Path $root "dist-desktop\data\web-dist"
  $assets = @(
    (Join-Path $dist "openher.apk"),
    (Join-Path $dist "openher-version.json"),
    (Join-Path $dist "openher-desktop.zip")
  ) | Where-Object { Test-Path $_ }
  if ($assets.Count -lt 2) { throw "Faltan artefactos en $dist (apk + version.json minimo)." }

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
    $notesFinal = if ($NotesText) { $NotesText } else { "v$versionName" }
    gh release create $tag $assets --title "OpenHer v$versionName" --notes $notesFinal
  }
  if ($LASTEXITCODE -ne 0) { throw "gh release fallo ($LASTEXITCODE)" }

  Write-Host ""
  Write-Host "Release $tag publicado en GitHub."
  Write-Host "  version: https://github.com/Owning01/Openher/releases/latest/download/openher-version.json"
  Write-Host "  apk:     https://github.com/Owning01/Openher/releases/latest/download/openher.apk"
}

# Registra el arranque automatico headless de opencode2 (:4098) con Windows: crea
# HKCU\...\Run\OpenHer2Server apuntando al desktop headless (--ensure-opencode2-and-exit),
# corrige data/config.json (puerto 4098, enabled true, server_ports) y lo levanta ahora.
function Register-Autostart {
  $ErrorActionPreference = "Stop"   # el registro de Windows debe abortar si falla, como el script original
  $desktopAppDir = Join-Path $root "desktop-app"
  $exeCandidates = @(
    (Join-Path $root "dist-desktop\openher-desktop.exe"),
    (Join-Path $desktopAppDir "openher-desktop.exe")
  )
  $exe = $exeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $exe) { throw "No se encontro openher-desktop.exe (dist-desktop\ o desktop-app\). Compile con .\scripts\build-desktop.ps1 primero." }

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
  if (-not $op2) { Write-Warning "No se encontro opencode2.exe; el ensure lo descubrira al arrancar." }

  # 1. Registro principal: desktop headless (sin consola). Funciona tras rebuild con --ensure-opencode2-and-exit.
  $runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
  $headlessCmd = "`"$exe`" --ensure-opencode2-and-exit"
  Set-ItemProperty -Path $runKey -Name "OpenHer2Server" -Value $headlessCmd
  Write-Host "  -> HKCU Run OpenHer2Server = $headlessCmd" -ForegroundColor Green

  # 2. Corrige configs (desktop-app/data + dist-desktop/data si existen)
  $cfgPaths = @(
    (Join-Path $desktopAppDir "data\config.json"),
    (Join-Path $root "dist-desktop\data\config.json")
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
        [System.IO.File]::WriteAllText($cfgPath, ($cfg | ConvertTo-Json -Depth 10), $utf8NoBom)
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
    else { Write-Warning ":4098 no respondio tras 8s. Revise service.json (port 4098) y ejecute '$op2 serve --service'." }
  } else {
    Write-Warning "Server detenido y sin binario para levantarlo."
  }

  Write-Host ""
  Write-Host "Listo. Al reiniciar Windows, OpenHer2Server levanta :4098 en background sin consola." -ForegroundColor Cyan
  Write-Host "Verificar: reg query HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v OpenHer2Server" -ForegroundColor DarkGray
}

if ($Autostart) {
  Register-Autostart
  exit 0
}

# 1) Bump de version (patch + versionCode)
$next = Get-NextAppVersion -Root $root
Set-AppVersion -Root $root -Name $next.Name -Code $next.Code
$newVn = $next.Name
$newVc = $next.Code
Write-Host "Nueva version: $newVn ($newVc)" -ForegroundColor Cyan

$notesFinal = if ($Notes) { $Notes } else { "v$newVn" }

# 2) Build web + build-info + deploy a los web-dist
Push-Location (Join-Path $root "web")
try {
  pnpm build
  if ($LASTEXITCODE -ne 0) { throw "pnpm build fallo ($LASTEXITCODE)" }
  $info = @{ builtAt = (Get-Date).ToString("o"); gitHead = "apk-$newVn-auto"; source = "apk-android"; version = $newVn; versionCode = $newVc } | ConvertTo-Json -Compress
  [System.IO.File]::WriteAllText((Join-Path (Get-Location) "dist\build-info.json"), $info, $utf8NoBom)
  $builtDist = Join-Path $root "web\dist"
  foreach ($dst in (Get-WebDistTargets -Root $root)) {
    Sync-WebDist -Source $builtDist -Destination $dst
    Write-Host "  -> publicado: $dst" -ForegroundColor DarkGray
  }
} finally {
  Pop-Location
}

# 3) APK: cap sync + gradle + publicacion del link corto (delegado a install-apk.ps1)
Write-Host ""
Write-Host "Compilando y publicando la APK..." -ForegroundColor Yellow
& (Join-Path $root "scripts\install-apk.ps1") -SkipWebBuild -NoInstall -Publish -Notes $notesFinal
if ($LASTEXITCODE -ne 0) { throw "install-apk fallo ($LASTEXITCODE)" }

# 4) Desktop: compilar Rust y publicar el zip de self-update (notebooks con server remoto).
if (-not $SkipDesktop) {
  Write-Host ""
  Write-Host "Compilando desktop + publicando self-update (openher-desktop.zip)..." -ForegroundColor Yellow
  & (Join-Path $root "scripts\build-desktop.ps1") -SkipWeb -NoPause -Run
  if ($LASTEXITCODE -ne 0) { throw "build-desktop fallo ($LASTEXITCODE)" }
  Publish-Desktop
}

Write-Host ""
Write-Host "Listo v$newVn. El celular la detecta al abrir la app y ofrece Actualizar." -ForegroundColor Green
if (-not $SkipDesktop) {
  Write-Host "La notebook (server remoto) se actualiza sola con openher-desktop.zip." -ForegroundColor Green
}
Write-Host "Link estable: http://100.77.237.102:4848/openher.apk"

# 5) Espejo en GitHub Releases (el celu actualiza con la PC apagada).
# No fatal: el canal local ya quedo publicado arriba.
Write-Host ""
Write-Host "Publicando espejo en GitHub Releases..." -ForegroundColor Yellow
try {
  Publish-Github $notesFinal
} catch {
  Write-Host "Aviso: no se pudo publicar en GitHub ($_.Exception.Message). El canal local sigue vigente." -ForegroundColor Yellow
}
