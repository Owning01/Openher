# health.ps1 - Chequeo rapido: dice que parte esta caida y quien la sirve.
# Uso: .\scripts\health.ps1
#
# Antes solo miraba si el puerto estaba abierto (cualquier proceso). Ahora valida
# contenido: un dummy en el puerto no alcanza para dar OK. No rompe si no hay
# servidores: reporta CAIDO.

$ErrorActionPreference = "Continue"

function Get-PortOwner([int]$Port) {
  $c = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $c) { return $null }
  $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
  $name = if ($p) { $p.ProcessName } else { "?" }
  [pscustomobject]@{ Pid = $c.OwningProcess; Name = $name }
}

function Test-JsonBody([string]$Content) {
  if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
  try { $null = $Content | ConvertFrom-Json; return $true } catch { return $false }
}

function Test-Endpoint([string]$Name, [string]$Url, [switch]$Json) {
  try {
    $r = Invoke-WebRequest $Url -UseBasicParsing -TimeoutSec 4
    if ($Json -and -not (Test-JsonBody $r.Content)) {
      Write-Host "CAIDO $Name responde pero el contenido no es JSON ($Url)"
      return
    }
    Write-Host "OK    $Name ($Url)"
  } catch {
    $code = $null
    if ($_.Exception.Response) { $code = $_.Exception.Response.StatusCode.value__ }
    if ($code -in @(200, 401)) { Write-Host "OK    $Name (auth $code)"; return }
    Write-Host "CAIDO $Name : $($_.Exception.Message)"
  }
}

$ports = @(4848, 4849, 4096, 4098, 5173, 8765)
foreach ($p in $ports) {
  $owner = Get-PortOwner $p
  if ($owner) { Write-Host ("OK    :{0} PID {1} ({2})" -f $p, $owner.Pid, $owner.Name) }
  else { Write-Host ("CAIDO :{0}" -f $p) }
}

Write-Host ""
Test-Endpoint "shell   :4848 /shell/fs/drives" "http://127.0.0.1:4848/shell/fs/drives" -Json
Test-Endpoint "opencode:4098 /session" "http://127.0.0.1:4098/session" -Json
Test-Endpoint "stats   :8765 /api/data?raw=1" "http://127.0.0.1:8765/api/data?raw=1" -Json
