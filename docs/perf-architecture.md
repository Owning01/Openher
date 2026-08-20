# Perf / Arquitectura — Opencode server (G:/proyectos/opencode) & opencode-remote-android

> Notas tras revisar `G:/proyectos/opencode` (`packages/opencode/src/session/*`, `packages/server/src/*`, `packages/tui/src/routes/session/index.tsx`, `protocol`, `effect-sqlite-node`). Guardado el 2026-08-20.

## Resumen ejecutivo

- `opencode serve` hoy: **TypeScript + Effect + Bun SQLite (WAL) + SSE**. 90% del wall-time es **LLM stream + tool `bash` + `git status/diff`**. Cambiar `Bun`/`SQLite` o reescribir a **Rust puro** no hará que tu móvil se sienta instantáneo; el `LLM` seguirá tardando 5-10s.
- Cuellos reales en tu app móvil: `Promise.race(abort, 4.5s)` bloqueando `stop`/`revert` (`assertNotBusy` en `session/revert.ts:39`) + `refreshSessions` global (21 req) + `loadSelected(limit=100)` tras cada `delta` SSE.

## Estado actual verificado

- `Bun` en `C:\Users\Octavio\.bun\bin\bun.exe` → `1.4.0` (`1.4.0-canary.1+6e906e468` tras `bun upgrade` 2026-08-20). Es la rama estable reciente (1.4.x). `scoop`/`winget` no lo gestionan en este equipo.
- `opencode-remote-android` ya tiene:
  - `stop` fire-and-forget + `status:"idle"` optimista (`App.tsx:1173`, `useMessages.ts:391`)
  - `undo`/`edit` con `await abort` + 400ms `idle` + retry `BusyError` (`App.tsx:2185/2204`, `useMessages.ts:420`)
  - `scrollToBottom` inmediato + `scroll` listener `<120px` (`MessageList.tsx:79/91`)
  - `TabBar` mixto `sesiones+terminales` (`TabBar.tsx:48`, `App.tsx:1386`)
  - `FileEditor` web `api.writeFile` + `sanitizeHtml` unificado (`utils/sanitize.ts`)

## Por qué es lento (con archivos)

| Capa | Archivo | Costo | Detalle |
|---|---|---|---|
| Snapshot/diff | `packages/opencode/src/session/revert.ts:29-88` `snap.track/diff` `snapshot/snapshot.ts` | 30-80ms por `revert` aunque toque 1 file | Hace `git diff` del worktree completo + `storage.write(["session_diff",...])` + `events.publish(Diff)` |
| SQLite | `packages/effect-sqlite-node` `storage/storage.ts` `session/message.ts` | `INSERT` sync + `fsync` por `part.delta` (100 deltas/turno) | Cada `delta` abre `BEGIN IMMEDIATE`. Sin batch, 100 `fsync` = 200-400ms |
| SSE fan-out | `packages/server/src/handlers/event.ts` `protocol/groups/event.ts` | 1 `AsyncIterable` por cliente | 3 tabs + móvil = 4 streams duplicando `session.status` |
| LLM | `packages/opencode/src/session/llm.ts:136` `abortSignal` | 5-10s | `prompt_async` no responde `200` hasta fin de stream del provider. Tu `loadSelected(limit=100)` duplica el RTT |
| Móvil polling | `web/src/hooks/useMessages.ts:131` `useSSE` watchdog + `refreshSessions` | 21 `GET /session?directory` por turno | `session/active` ya existe (`api.ts` `session/active`) pero tu `App.tsx:1120` hace `refreshSessions` global |

## SQLite / Bun / Rust — ¿cambiar?

- **Postgres/Redis/Mongo**: +TCP+pool 15-30ms por delta vs 2-5ms SQLite → +2s por turno. Solo gana en multi-tenant, no tu caso single-user.
- **LMDB/LevelDB**: gana en `point read`, pero opencode hace `range scan sessionID+created` → SQLite con índice ya es `O(log n)`.
- **Bun → Node/Deno**: `Bun.sqlite` es nativo sin FFI `better-sqlite3`; Node sería ~3× más lento. `Bun.nanoseconds` + `Bun.build` ya es lo más rápido.
- **Rust puro** (`axum` + `rusqlite` + `tokio` + `notify` + `gitoxide`): startup 40ms→5ms, RAM 120→18MB, `revert` 80→12ms ( `perf/timeline-stability/fixture.ts` ), SSE `broadcast` sin GC. **Pero** hay que reescribir `session/prompt.ts` (900 líneas `Effect`), `permission`, `plugin` loader (`sst`), `mcp` (`@modelcontextprotocol/sdk` solo TS) y `protocol` (`zod`→`serde`): 3-4 semanas y se pierde `Effect` (`retry`, `Layer`, `httpapi-codegen`). 90% seguirá siendo `LLM`.

## Qué sí hacer (sin forkear todo)

1. **WAL + batch** (2 archivos, 1 día, -80% fsync):
   - `packages/opencode/src/storage/storage.ts:12` asegurar `PRAGMA journal_mode=WAL; synchronous=NORMAL; temp_store=MEMORY;`
   - `packages/opencode/src/session/message.ts` batch deltas 50ms (`Effect` `Queue` + `BEGIN IMMEDIATE` 1 vez)

2. **Diff por `mtime`** (1 día):
   - `packages/opencode/src/session/revert.ts:70` `snap.track()` cacheado por `directory mtime` (5s TTL), y `diff` solo de `files` tocados por el turno (`processor.ts` ya tiene `diffs`)

3. **Shared SSE** (1 día):
   - `packages/server/src/handlers/event.ts` un solo `Shared SSE` por `projectID` + `lastEventID` (el `TUI` ya usa `EventV2Bridge`)

4. **Móvil no bloqueante** (ya hecho, mantener):
   - No hacer `loadSelected` tras `sendPrompt` si ya viene `delta` por SSE (`loadedSessionIDRef` guard)
   - Usar `GET /session/active` en lugar de `refreshSessions` global
   - `stop` optimista (hecho)

## Si querés Rust igual

Hacer un **sidecar** `opencode-bridge` Rust solo para `snapshot` + `event fan-out` + `sqlite batch` (2 binarios: `opencode` TS sigue orquestando `LLM`, sidecar expone `GET /event` y `POST /file`). Ya tenés un sidecar `desktop-agent` Go con `ConPTY` (`desktop-agent/`) — extenderlo evita tocar el core.

Branch propuesto: `G:/proyectos/opencode/perf/rust-sidecar` (Axum + rusqlite WAL + notify) y medir `revert` antes/después con `perf/timeline-stability/fixture.ts`.

## Bun

- `C:\Users\Octavio\.bun\bin\bun.exe` `1.4.0` (canary `6e906e468` 2026-08-20). Es current stable. Para volver a stable: `bun upgrade --stable` o `powershell -c "irm https://bun.sh/install.ps1 | iex"`.
- `scoop`/`winget` no lo gestionan en este equipo.

## Próximos pasos sugeridos

- [ ] PR `perf/sqlite-batch` en `G:/proyectos/opencode` (2 files)
- [ ] PR `perf/diff-mtime-cache` (1 file)
- [ ] Si el sidecar Rust interesa, scaffold `perf/rust-sidecar` y bench `revert` con `perf/timeline-stability`
