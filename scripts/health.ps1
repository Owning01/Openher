# health.ps1 - Chequeo rapido: dice que parte esta caida. Uso: .\scripts\health.ps1
$ports = @(4848, 4849, 8765, 4096, 4098, 5173)
foreach ($p in $ports) {
  $c = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($c) { Write-Host "OK   :$p (PID $($c.OwningProcess))" }
  else { Write-Host "CAIDO:$p" }
}
try {
  Invoke-RestMethod 'http://127.0.0.1:4848/shell/fs/drives' -Method Get -TimeoutSec 3 | Out-Null
  Write-Host 'OK   :4848 /shell responde'
} catch {
  Write-Host 'CAIDO:4848 /shell no responde (desktop-app apagado?)'
}
