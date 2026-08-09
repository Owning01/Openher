# Build del APK (build + copy-dist + gradle) y subida a tmpfiles.org
# Uso: .\deploy-apk.ps1            → hace todo y devuelve el link
#      .\deploy-apk.ps1 -SkipBuild → solo sube el APK ya compilado
param(
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$web = Join-Path $root "web"
$apk = Join-Path $web "android\app\build\outputs\apk\debug\app-debug.apk"

if (-not $SkipBuild) {
  Write-Host "[1/3] npm run build..."
  Push-Location $web
  try {
    npm run build | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "npm build failed" }
  } finally { Pop-Location }

  Write-Host "[2/3] copy-dist a assets/public..."
  python (Join-Path $web "scripts\copy-dist.py") | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "copy-dist failed" }

  Write-Host "[3/3] gradlew assembleDebug (puede tardar varios minutos)..."
  Push-Location (Join-Path $web "android")
  try {
    .\gradlew.bat assembleDebug --console=plain -q
    if ($LASTEXITCODE -ne 0) { throw "gradle build failed" }
  } finally { Pop-Location }
} else {
  Write-Host "SkipBuild: usando APK existente"
}

if (-not (Test-Path $apk)) { throw "APK no encontrado: $apk" }
$sizeMb = [math]::Round((Get-Item $apk).Length / 1MB, 1)
Write-Host "APK: $apk ($sizeMb MB) — subiendo a tmpfiles.org..."

$form = [System.Net.Http.MultipartFormDataContent]::new()
$bytes = [System.Net.Http.ByteArrayContent]::new([IO.File]::ReadAllBytes($apk))
$bytes.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/octet-stream")
$form.Add($bytes, "file", [IO.Path]::GetFileName($apk))
$client = [System.Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromMinutes(10)
try {
  $resp = $client.PostAsync("https://tmpfiles.org/api/v1/upload", $form).Result
  $resp.EnsureSuccessStatusCode() | Out-Null
  $json = $resp.Content.ReadAsStringAsync().Result | ConvertFrom-Json
  if ($json.status -ne "success") { throw "tmpfiles: $($json | ConvertTo-Json -Compress)" }
  $name = [IO.Path]::GetFileName($apk)
  $id = $null
  if ($json.data.id) { $id = $json.data.id }
  elseif ($json.data.url) { $id = ([regex]::Match($json.data.url, "tmpfiles\.org/([^/]+)/")).Groups[1].Value }
  if (-not $id) { throw "tmpfiles: sin id en $($json | ConvertTo-Json -Compress)" }
  Write-Host ""
  Write-Host "LINK: https://tmpfiles.org/dl/$id/$name"
} finally {
  $client.Dispose()
}
