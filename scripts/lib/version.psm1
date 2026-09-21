# scripts/lib/version.psm1 - Unico lugar que lee/escribe la version publicable.
#
# La version vive en web/android/app/build.gradle (versionName + versionCode) y la
# consumen build-desktop, install-apk y update-app. Antes cada script repetia el
# regex (5 lecturas en 3 archivos) y el bump vivia suelto en update-app.

Set-StrictMode -Version Latest

$script:GradleRel = "web\android\app\build.gradle"

function Get-AppVersion {
  # Lee la version publicable del build.gradle. Falla explicito si no existe.
  param([Parameter(Mandatory)][string]$Root)

  $path = Join-Path $Root $script:GradleRel
  if (-not (Test-Path $path)) { throw "No existe $path" }
  $raw = Get-Content $path -Raw

  $mName = [regex]::Match($raw, 'versionName\s+"([^"]+)"')
  if (-not $mName.Success) { throw "No pude leer versionName de $path" }
  $mCode = [regex]::Match($raw, 'versionCode\s+(\d+)')

  $code = 0
  if ($mCode.Success) { $code = [int]$mCode.Groups[1].Value }

  [pscustomobject]@{ Name = $mName.Groups[1].Value; Code = $code }
}

function Get-NextAppVersion {
  # Siguiente patch + versionCode incrementado, sin escribir nada.
  param([Parameter(Mandatory)][string]$Root)

  $cur = Get-AppVersion -Root $Root
  $parts = @($cur.Name.Split('.'))
  if ($parts.Count -lt 3) { throw "versionName inesperado: $($cur.Name) (se espera x.y.z)" }

  $patch = [int]$parts[2] + 1
  [pscustomobject]@{ Name = "$($parts[0]).$($parts[1]).$patch"; Code = $cur.Code + 1 }
}

function Set-AppVersion {
  # Escribe versionName/versionCode conservando el resto del archivo (solo numeros).
  param(
    [Parameter(Mandatory)][string]$Root,
    [Parameter(Mandatory)][string]$Name,
    [Parameter(Mandatory)][int]$Code
  )

  $path = Join-Path $Root $script:GradleRel
  $raw = Get-Content $path -Raw
  $raw = $raw -replace 'versionCode\s+\d+', "versionCode $Code"
  $raw = $raw -replace 'versionName\s+"[^"]+"', ('versionName "' + $Name + '"')
  Set-Content -Path $path -Value $raw -NoNewline
}

Export-ModuleMember -Function Get-AppVersion, Get-NextAppVersion, Set-AppVersion
