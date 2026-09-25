# check-rules.ps1 - Verifica los presupuestos que SOLO pueden bajar (CONTRIBUTING.md seccion 6).
# Uso:  pnpm run check:rules            -> falla (exit 1) si algun numero subio
#       pnpm run check:rules:update     -> recalibra el presupuesto con lo medido (post-gate)
param([switch]$Update)
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$budgetPath = Join-Path $root 'tasks/rules-budget.json'

function Count-GitGrep([string]$pattern, [string]$path, [switch]$Pcre, [switch]$NoTests, [string[]]$Exclude) {
  $a = @('grep', '--untracked', '-o')
  if ($Pcre) { $a += '-P' }
  $a += @($pattern, '--', $path)
  # Los `any` de mocks en tests no son deuda de produccion: se excluyen de la metrica.
  if ($NoTests) { $a += @(':(exclude)*.test.ts', ':(exclude)*.test.tsx', ':(exclude)*.test.mjs') }
  if ($Exclude) { $a += @($Exclude | ForEach-Object { ":(exclude)$_" }) }
  $out = & git @a 2>$null
  if ($null -eq $out) { return 0 }
  return @($out).Count
}

function Count-Lines([string]$pattern, [string]$path) {
  $out = & git grep --untracked -n $pattern -- $path 2>$null
  if ($null -eq $out) { return 0 }
  return @($out).Count
}

$big = @(Get-ChildItem web/src -Recurse -Include *.ts, *.tsx |
  Where-Object { (Get-Content $_.FullName | Measure-Object -Line).Lines -gt 1000 }).Count

$measured = [ordered]@{
  asAny              = (Count-GitGrep 'as any' 'web/src' -NoTests)
  colonAny           = (Count-GitGrep ':\s*any\b' 'web/src' -Pcre -NoTests)
  # catchVacios: bloques `catch` sin cuerpo en la MISMA linea (patron dominante;
  # los multilinea no entran). racesSinHelper: Promise.race fuera del helper
  # compartido withTimeout (shared/lib/async.ts) — usar el helper.
  catchVacios        = (Count-GitGrep 'catch\s*(\([^)]*\))?\s*\{\s*\}' 'web/src' -Pcre -NoTests)
  racesSinHelper     = (Count-GitGrep 'Promise\.race' 'web/src' -NoTests -Exclude 'web/src/shared/lib/async.ts')
  exportDefault      = (Count-Lines 'export default' 'web/src')
  important          = (Count-GitGrep '!important' 'web/src/styles')
  tsNocheck          = (Count-Lines '@ts-nocheck' 'web/src')
  filesOver1000      = $big
  orphanFiles        = -1
  deletableCssRules  = -1
}

# Metricas opcionales via los scripts locales (si existen): parsea "total: N".
$tmp = Join-Path $env:TEMP 'openher-gate'
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
$deadcode = Join-Path $root 'docs/local/refactor/tools/deadcode.cjs'
$cssdel   = Join-Path $root 'docs/local/refactor/tools/css-deletable.cjs'
function Total-AfterHeader([string]$file, [string]$header) {
  if (-not (Test-Path $file)) { return -1 }
  $lines = Get-Content $file
  $i = ($lines | Select-String -Pattern $header | Select-Object -First 1).LineNumber
  if (-not $i) { return -1 }
  $end = [Math]::Min($i + 4, $lines.Count - 1)
  $m = ($lines[$i..$end] | Select-String -Pattern '^total:\s*(\d+)' | Select-Object -First 1)
  if ($m) { return [int]$m.Matches[0].Groups[1].Value }
  return -1
}
if (Test-Path $deadcode) {
  node $deadcode 2>$null | Out-File (Join-Path $tmp 'rules-deadcode.txt') -Encoding utf8
  $measured.orphanFiles = Total-AfterHeader (Join-Path $tmp 'rules-deadcode.txt') 'ARCHIVOS NUNCA IMPORTADOS'
}
if (Test-Path $cssdel) {
  node $cssdel 2>$null | Out-File (Join-Path $tmp 'rules-css.txt') -Encoding utf8
  $m = Select-String -Path (Join-Path $tmp 'rules-css.txt') -Pattern 'TOTAL:\s*(\d+)' | Select-Object -First 1
  if ($m) { $measured.deletableCssRules = [int]$m.Matches[0].Groups[1].Value }
}

if ($Update) {
  $doc = [ordered]@{
    note     = "Presupuestos que SOLO pueden bajar (ver CONTRIBUTING.md seccion 6). Se recalibran con pnpm run check:rules:update despues de un gate verde."
    measuredAt = (Get-Date -Format 'yyyy-MM-dd HH:mm') + ' (check:rules:update)'
    budget   = $measured
  }
  ($doc | ConvertTo-Json -Depth 4) | Set-Content $budgetPath -Encoding utf8
  Write-Host "Presupuesto recalibrado en tasks/rules-budget.json:"
  $measured.GetEnumerator() | ForEach-Object { Write-Host ("  {0,-20} {1}" -f $_.Key, $_.Value) }
  exit 0
}

$budget = (Get-Content $budgetPath -Raw | ConvertFrom-Json).budget
$fail = 0
Write-Host "Presupuestos (solo pueden bajar)"
Write-Host ("  {0,-20} {1,6} {2,6}   {3}" -f 'metrica', 'tope', 'hoy', 'estado')
foreach ($k in $measured.Keys) {
  $now = $measured[$k]
  if ($now -lt 0) { Write-Host ("  {0,-20} {1,6} {2,6}   (sin medir)" -f $k, '-', '-'); continue }
  $cap = $budget.$k
  if ($null -eq $cap) { $cap = $now }
  $estado = 'ok'
  if ($now -gt $cap) { $estado = "SUBE (+$($now - $cap))"; $fail++ }
  elseif ($now -lt $cap) { $estado = 'bajo (actualizar)' }
  Write-Host ("  {0,-20} {1,6} {2,6}   {3}" -f $k, $cap, $now, $estado)
}
if ($fail -gt 0) {
  Write-Host ""
  Write-Host "FALLA: $fail presupuesto(s) subieron. Ver CONTRIBUTING.md seccion 6." -ForegroundColor Red
  exit 1
}
Write-Host ""
Write-Host "OK: ningun presupuesto subio." -ForegroundColor Green
exit 0
