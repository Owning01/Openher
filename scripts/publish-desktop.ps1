# Publica el self-update del DESKTOP: zippea openher-desktop.exe + data/web-dist
# (sin la APK, que no hace falta en la notebook) y agrega el bloque `desktop`
# a openher-version.json junto a la APK. La notebook conectada a un server
# remoto lo detecta y el shell Rust descarga, reemplaza y se relanza solo.
#
# Uso:
#   .\scripts\publish-desktop.ps1
#   .\scripts\publish-desktop.ps1 -Dist dist-desktop -Dest "desktop-app\data\web-dist"
param(
  [string]$Dist = "",
  [string[]]$Dest = @()
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

if (-not $Dist) { $Dist = Join-Path $root "dist-desktop" }
$exe = Join-Path $Dist "openher-desktop.exe"
$webDist = Join-Path $Dist "data\web-dist"
if (-not (Test-Path $exe)) { throw "No existe $exe (corre build-desktop.ps1 primero)." }
if (-not (Test-Path (Join-Path $webDist "index.html"))) { throw "No existe $webDist\index.html" }

# Versión publicable: la misma que la APK (build.gradle).
$gradle = Get-Content (Join-Path $root "web\android\app\build.gradle") -Raw
$versionName = [regex]::Match($gradle, 'versionName\s+"([^"]+)"').Groups[1].Value
$versionCode = [regex]::Match($gradle, 'versionCode\s+(\d+)').Groups[1].Value
if (-not $versionName) { throw "No pude leer versionName de web/android/app/build.gradle" }

if ($Dest.Count -eq 0) {
  $Dest = @(
    (Join-Path $root "desktop-app\data\web-dist"),
    (Join-Path $root "dist-desktop\data\web-dist")
  ) | Where-Object { Test-Path $_ }
}
if ($Dest.Count -eq 0) { throw "No encontre ninguna carpeta data/web-dist para publicar." }

$zip = Join-Path $env:TEMP ("openher-desktop-" + [guid]::NewGuid().ToString("N").Substring(0, 8) + ".zip")
try {
  # Zip armado desde memoria leyendo SIEMPRE los archivos originales (nunca una
  # copia fresca en %TEMP%): Defender bloquea de forma intermitente los reads
  # de una copia recién escrita y bloquea también CreateFromDirectory/tar al
  # leer docs de "learning" con contenido pentest dentro de la creación de un
  # comprimido. Leer bytes sueltos y escribirlos en las entries evita esos hooks.
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
    [System.IO.File]::WriteAllText($metaPath, ($obj | ConvertTo-Json -Depth 4), (New-Object System.Text.UTF8Encoding($false)))
  }

  Write-Host "Desktop v$versionName ($versionCode) publicado en $($Dest.Count) destino(s)."
  Write-Host "  /openher-desktop.zip  sha256=$hash  size=$size"
  foreach ($d in $Dest) { Write-Host "  -> $d" }
} finally {
  if (Test-Path $zip) { Remove-Item -Force $zip -ErrorAction SilentlyContinue }
}
