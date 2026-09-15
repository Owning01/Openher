# Releases de OpenHer

## Canales (el celu prueba en este orden)

1. **GitHub Releases** (principal): el celu actualiza con la PC apagada.
   - `https://github.com/Owning01/Openher/releases/latest/download/openher-version.json`
   - `https://github.com/Owning01/Openher/releases/latest/download/openher.apk`
   - `https://github.com/Owning01/Openher/releases/latest/download/openher-desktop.zip`
2. **Shell local `:4848`** (respaldo): `http://<pc>:4848/openher-version.json`.

Lógica en `web/src/shell.ts` (`GITHUB_RELEASE_BASE`, `appVersion` GitHub
primero, `downloadApk` usa la base que ganó). El desktop remoto sigue por
shell (necesita la máquina que compila para builds frescos, pero el zip
también queda en GitHub).

## Publicar

`.\scripts\update-app.ps1 -Notes "..."` hace todo: bump, web, APK, desktop,
canal local **y** espejo GitHub (paso 6, no fatal). Solo GitHub con lo ya
compilado: `.\scripts\publish-github.ps1 -Notes "..."`.

## Corte

La v1.0.20 fue el primer release en GitHub (cliente viejo: solo canal
local). Desde la v1.0.21 el cliente ya consulta GitHub primero: con esa
versión instalada, apagar la PC no frena más las actualizaciones.
