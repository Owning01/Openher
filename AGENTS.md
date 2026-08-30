# AGENTS.md — OpenCode Mobile

Cliente Android/iOS (Capacitor) + escritorio Windows para un server remoto `opencode serve`. Thin client: toda la IA corre en el server; la app solo consume REST + SSE.
> Arquitectura completa: [`architecture.md`](architecture.md)

## Estructura

| Carpeta | Qué es |
|---|---|
| `web/` | **Producto central**: React 19.2 + Vite 8 + TS 5.6 + Capacitor 8 (un frontend para APK Android, IPA iOS y shell de escritorio) |
| `desktop-app/` | Shell Windows en Rust (wry + tiny_http + hyper/tokio + mmap/br + fswatch + simd-json, NO Tauri): sirve `web/dist` en :4848, expone `/shell/*` + WS PTY (:4849) + proxy stats :8765. `infrastructure/http/*_router.rs` |
| `opencode-stats/` | Crate Rust read-only sobre `opencode.db` (:8765, triple-GPU). Tiene su propio `AGENTS.md` — aplicarlo al tocarlo |
| `open-design` (externo) | OpenDesign `nexu-io/open-design` en `G:/proyectos/open-design` (NO vendorizado). Se levanta on-demand como pestaña `◈ Open Design` vía `/shell/design/*` + iframe |
| `external plugins` | 5 proyectos vía `desktop-app/src/infrastructure/http/external_router.rs`: `opendesign` 3000/daemon 3456 (tools-dev), `screenshots` 3002 (Next), `vioeditor` 1420 embed, `informes` 5174 embed, `widgetnotas` widget — `probe()` TCP 250ms + `ureq` 1800/700ms + `cached_probe` 1500ms, `mmap+<base href>` |

Sin `package.json` raíz. JS usa **pnpm 12.0.0** (`web/pnpm-lock.yaml`, binario Rust 39MB `G:\Dev\nodejs-24\node_modules\pnpm\pnpm[.exe]` + `G:\Dev\nodejs-24\pnpm.cmd`=`"%dp0%\node_modules\pnpm\pnpm" %*`, `corepack disable`). Node `~24` (`G:\Dev\nodejs-24\node.exe` v24.20.0; `C:\Dev\nodejs\node.exe`/`G:\Dev\nodejs\node.exe` v26.7 → `tools-dev must run with Node ~24`). `CARGO_HOME=G:\Dev\cargo` (`cargo 1.98`), `PNPM_HOME=G:\cache\pnpm-home` store `C:\Temp\pnpm-store-new\v11`. User PATH debe llevar `G:\Dev\nodejs-24;G:\Dev\nodejs-24\node_modules\.bin;G:\Dev\cargo\bin;G:\Dev\Python311;G:\Dev\bun\bin` al frente (shim roto `G:\cache\pnpm-home\.tools\pnpm\12.0.0\bin\pnpm` causa `""G:\...\pnpm"" no se reconoce`). `G:\Dev\Python311\python.exe` real (`py` es shim Store). Cargo workspace raíz: `desktop-app` + `opencode-stats`.

## REGLAS CRÍTICAS

1. **NUNCA levantar servers/procesos largos desde el chat** (el chat corre conectado al mismo server que administramos): usar `Start-Process` o `.bat` detached (`start-opencode-v2.bat`). Comandos >30s (gradle, cap sync, installs) van detached o con timeout explícito, en pasos separados.
2. **Servers**: opencode v1 en `0.0.0.0:4096` (Basic auth), beta `opencode2` como servicio en `:4097`. La app auto-detecta el dialecto (`shared/api/version.ts`, memoizado por host): v1 rutas raíz; v2 `/api/*` + respuestas `{data:...}` (prompt v2 rechaza model/agent en el body, 400). Desktop: 4848 HTTP + 4849 WS PTY + 4850 hyper static (mmap+br) + 8765 stats.
3. **APK**: `npx cap copy/sync` falla con EPERM → copiar con `python web/scripts/copy-dist.py` (`G:\Dev\Python311\python.exe`) + `gradlew assembleDebug` aparte, o usar `.\deploy-apk.ps1` en raíz (build completo + sube a tmpfiles.org e imprime LINK; `-SkipBuild` = solo subir). `vite emptyOutDir:false` evita `EPERM dist/assets`. Ojo: `deploy-quick.ps1` oculta errores con `Out-Null`.
4. **Plugins externos**: puertos únicos `opendesign 3000/daemon 3456`, `screenshots 3002`, `vioeditor 1420` embed, `informes 5174` embed (mmap). `external_router.rs:19` `split_cmd()` + `CREATE_NO_WINDOW|DETACHED_PROCESS|CREATE_NEW_PROCESS_GROUP` (`0x08000000|0x00000008|0x00000200` null stdio) sin `cmd /c`; `opendesign`/`screenshots` spawn directo `G:\Dev\nodejs-24\node[_hidden].exe` (node_hidden = editbin /SUBSYSTEM:WINDOWS evita WindowsTerminal). `probe()` TCP `connect_timeout 250ms` → true si LISTENING + `ureq 1800ms` para 3000|3002 (`700ms` otros) + `cached_probe OnceLock 1500ms`. `409` si puerto duplicado. `vioeditor`/`informes` `http://127.0.0.1:4848/shell/external/<name>/embed/` mmap con `<base href="/shell/external/<name>/embed/">` inyectado para `/assets/*` (si no → 404 blanco).
5. **OpenCode Hub**: `/shell/opencode/global` (`api.rs:840`) lee rutas robusto: `USERPROFILE || HOME || HOMEDRIVE+HOMEPATH || APPDATA parent` + `APPDATA\opencode\{config,opencode}.json` al frente; skills roots `.agents|.claude|.opencode|.gemini|config + ./skills + APPDATA\opencode\skills` — `scannedRoots` siempre visible aunque no exista (gris suave `rgba(161,161,170,0.95)` `rgba(161,161,170,0.10)`), full path con `title` y ellipsis (antes `slice(-2)` truncaba). Config `Ruta:` y `skill.path` mismo estilo suave; `better-sqlite3@13.0.3` (12.10 crashea `RemoveEnvironmentCleanupHook` en node-v137). `node_hidden.exe` + `Platform/src/process.ts windowsHide:true` requiere `ShowWindow 0` si reaparece.
6. **Pestañas / lifecycle**: `ExternalIframePanel.tsx:77` NO `shell.external.stop` en cleanup (mataba al cambiar pestaña); `DesktopPanelRenderer.tsx:313` mantiene **todos** los `plugin:external:*` del stack montados `position:absolute;visibility:hidden` (como `SingleTerminal.tsx:937`) → no reinicia al volver. `main.rs:39` `kill_all_external()` en `CloseRequested` + `AppEvent::Quit` → `procs.drain()` + `taskkill /F /T /PID` + powershell huérfanos `*open-design*|*0 screenshots*|*tools-dev*`, `sleep 400ms` + `webview=None` flush Cookies.
7. **Archivos**: `fsx.rs:43` `list_dir` sin `name.starts_with(".")` → `.cargo/.git` visibles; `fsx::move_entry` atomic rename fallback copy+delete para `PCFilesPanel.tsx:604` doble-pane `SplitIcon` (`pcf-tree-container flex 1fr|1fr` `usePaneState.ts`), `FileRow draggable application/x-opencode-path` → `shell.fs.move(src,dest)` guards `src==dest|dest.startsWith(src)` + `HtmlPreview.tsx` `previewUrl /shell/preview/{token}/{fileName}` `mmap+<base href>` iframe `sandbox allow-scripts allow-same-origin`.
8. Antes de commit: `tsc -b`, tests y `cargo check` verdes. `build-desktop.ps1:30` fix PATH + `pnpmCmd=Join-Path node24 pnpm.cmd` + `& $pnpmCmd @args` (evita `Invoke-Expression` + espacio `0 screenshots`) + `copy-dist.py` vía `G:\Dev\Python311\python.exe`.

## Comandos

En `web/`: `pnpm run dev` · `pnpm run build` (`tsc -b && vite build` ~14s 732 modules) + `G:\Dev\Python311\python.exe scripts/copy-dist.py` (`failures: none` → `desktop-app/data/web-dist`) · `pnpm test` (vitest, jsdom) · un solo test: `pnpm exec vitest run src/<ruta>/file.test.ts`
Tras tocar `web/src`, dejar verdes además: `test:i18n`, `test:ui`, `test:settings`, `test:model` (+ `check:contrast` si tocás temas).
Rust: `cargo check / build / test / clippy / fmt` desde raíz o `desktop-app/` (`cargo build --release` ~4m `G:\cache\cargo-target\release\opencode-desktop.exe` → `desktop-app/opencode-desktop.exe`) · Desktop: `.\build-desktop.ps1 [-SkipWeb] [-Run]`.
CI real: `codemagic.yaml` — los workflows de `.github/` fueron eliminados.

## Arquitectura esencial

- **SSE**: el type real del evento va DENTRO del JSON (`{id,type,properties}`), nunca en la línea `event:`. Server v1 1.18.x emite SOLO `message.part.delta` (partID); v2 emite `session.next.*` con body anidado en `data`.
- **Datos**: cache IndexedDB merge-only, `DB_VERSION = 2` NUNCA bajar, restauración offline; el server ignora `since`. `loadSelected` hace merge incremental por id SIEMPRE; el mensaje optimista NO se remueve tras el send (lo confirma `loadSelected` por match de texto).
- **Shell / HTTP**: `main.rs:39` `split_cmd` + `web_dist_dir` + prewarm staggered `opendesign` direct `node_hidden tools-dev.mjs`, `screenshots` direct `next start` (prod si `.next\BUILD_ID` existe `Ready 261ms`); `fswatch::global`, `hyper :4850` mmap+br estáticos (`api.rs:801` preview `serve_file_mmap` `common.rs:128` `parse_json_simd`), `cargo metadata target_directory G:\cache\cargo-target`, `state.rs data_dir exe.parent/data` `ShellConfig auto_opencode2`.
- **Frontend**: `ExternalIframePanel.tsx:6` `useEffect [name,defaultUrl] setUrl/setStatus` sin `startedRef` (evita URL stale), `pollReady 30x1s` `shell.external.status`; `EXTERNAL_PROJECTS` 5; `DesktopPanelRenderer.tsx:162` EXTERNAL_PROJECTS url correcto; `DesktopGrid` col/resizer; `useDesktopGridActions removeTab` colapsa filas/columnas.
- **FSD en migración**: `types.ts` es barrel → tipos nuevos van en `entities/<domain>/model.ts`. `App.tsx` (~3.600 líneas) sigue siendo el God Component; `app/`, `pages/`, `widgets/` son placeholders.
- `refreshSessions` traga errores internamente; el backoff se dispara lanzando desde el callback cuando `connectionState === "offline"`.

## FSD + Hexagonal (violación = rechazo PR)

1. Flujo unidireccional `app → pages → widgets → features → entities → shared`; entities sin React/fetch.
2. PROHIBIDO `fetch/CapacitorHttp` en componentes/hooks → ports + infrastructure/adapters o `shared/api`.
3. Ningún archivo >350 líneas (App.tsx es deuda técnica reconocida, no precedente).
4. Rust: PROHIBIDO cadena `if path == "/shell/..."` en `api.rs` → routers en `infrastructure/http/*_router.rs` (ya `scm_router.rs` + `external_router.rs` + `fs_router.rs` etc.).
5. Todo domain/application puro lleva `.test.ts`.

## Convenciones y trampas

named exports + `import type` · keys i18n nuevas SOLO en `en.ts`/`es.ts` (`it`/`zh` caen al inglés por fallback) · switches con `role="switch"` usan `aria-checked` · elementos hover-only llevan fallback `@media (hover: none), (pointer: coarse)` · conventional commits, cuerpo en español. `vite emptyOutDir:false` · `%SystemDrive%/` en raíz es basura generada — ignorar · keystore Play Store externo, NO commiteado (`PLAY-STORE.md`) · server upstream opencode: guía del checkout local en `OPENCODE-REPO.md` (repo aparte). Ventana: `X CloseRequested→event_loop.exit()`; `— Resized+is_minimized()→set_visible(false)` bandeja.

## OpenCode Hub & Desktop recientes

- `desktop-app/src/api.rs:840` `/shell/opencode/global` + `web/src/components/OpenCodeHubModal.tsx` hub Agentes/Skills/Config: `scannedRoots` 8 (`~/.agents/skills`, `~/.claude/skills`, `~/.opencode/skills`, `~/.gemini/*`, `~/.config/skills`, `./skills`, `APPDATA\opencode\skills`) siempre visibles `rgba(161,161,170,0.95)` `rgba(161,161,170,0.10)` `title` ellipsis.
- `pnpm 12.0.0` Rust binary + `G:\Dev\nodejs-24\node.exe v24.20.0` + `cargo 1.98` verificado `where pnpm G:\Dev\nodejs-24\pnpm.cmd`.
- `health {"app":"opencode-desktop","dist":true,"ws_port":4849}` `data/config.json server_ports [4096,4097,4098] auto_opencode2`.
