# DEBATE — Documento maestro del sistema

> El debate **no es MCP**. Es un **plugin de OpenCode** que vive en
> `~/.config/opencode/plugins/debate-room/` y registra un `tool`, un `command`
> y un RPC con eventos en vivo. Este documento describe el sistema completo
> (protocolo, configuración, tokens, calidad, UI, evals) de forma reutilizable
> en cualquier proyecto. Reglas vigentes: **B5 excluido**, **C5 solo
> experimental**, **F3 apagado por defecto**.

## 1. Qué es y qué no es

- **Qué es**: charla estructurada de agentes por **consenso** (no por rondas),
  invocada por el agente desde el chat de una sesión. El plugin crea sesiones
  privadas por rol, las hace hablar por turnos y devuelve el **acta del árbitro**.
- **Qué no es**: no es MCP (no expone tools a modelos externos), no es un chat
  global, no es una pestaña de la app. **Pertenece a la sesión que lo invocó**
  y solo ahí se visualiza.

## 2. Arquitectura

```
Chat de la sesión S (proyecto P)
  │  agente ejecuta tool "debate" { topic, ...config }
  ▼
Plugin debate-room (harness OpenCode)
  │  originSessionID = S (del ToolContext / command context)
  │  crea sesiones privadas por rol (isolated) o un canal (shared)
  ▼
Canal append-only del debate D  ── archivo .openher/debates/<D>.jsonl
  │  eventos RPC en vivo (todos llevan originSessionID + seq)
  ▼
Cliente: store keyed por S → D → estado (dedupe por seq)
  ▼
UI: chip en el header del chat S → drawer (desktop) / bottom sheet (mobile)
    burbujas estilo WhatsApp + input Intervenir + pausa/stop
```

**Invariantes**:
1. Todo evento de debate lleva `originSessionID` + `directory` + `seq`.
2. El canal es **append-only**: nunca se reescribe el pasado (KV-cache).
3. El cliente **filtra por sesión**: un debate solo existe en su chat de origen.
4. Las sesiones de los agentes son **privadas y archivadas** al terminar.

## 3. Protocolo de eventos v2

Sobre (envelope): `{ debateID, originSessionID, directory, seq, ts }`.
`seq` es monotónico por debate; el cliente descarta `seq` repetido o viejo.

| Evento | Dirección | Campos | Notas |
|---|---|---|---|
| `started` | plugin → UI | `topic, engine, roles` | Crea el debate en el store de S |
| `message` | plugin → UI | `role, body, status, confidence, repliesTo, blockingIssues, tokens{in,out}` | Reemplaza al viejo `turn`; `role:"human"` para intervenciones |
| `status` | plugin → UI | `turns, consensusPct, stalled, budget{usedPct}` | Barra de progreso/consenso |
| `artifact` | plugin → UI | `kind:"acta", text, consensus, minorities[], confidence` | Acta inmutable (A2A) |
| `done` | plugin → UI | `consensus, turns, reason` | `reason`: consensus\|stability\|budget\|stopped\|error |
| `error` | plugin → UI | `message` | — |
| `state` | RPC req/res | — | Snapshot completo para rehidratar al abrir/crash |
| `intervene` | UI → plugin | `text` | Publica mensaje `kind:"user"` en el canal |
| `pause` / `resume` / `stop` | UI → plugin | — | Control del loop |

Compatibilidad: durante 1 versión el plugin hace **dual-emit v1+v2 con el
mismo `seq`** (`turn`+`message`, `acta`+`artifact`, `cache` como alias de
`engine`). Clientes viejos siguen funcionando; el contrato congelado vive en
`docs/DEBATE-SCHEMA.json` y solo cambia por addendum versionado.

## 4. Sección de configuración (único lugar de verdad)

Toda la configuración del debate vive en **una sola sección** (input del tool
+ defaults del plugin). Nada de flags sueltos por el código.

```ts
debate: {
  // Motor y roles
  engine: "isolated" | "shared"          // default "isolated" (flip explícito desde "shared")
  cache: string                          // alias legacy de solo-lectura (compat v1), no usar en código nuevo
  roles: string[]                        // default ["architect","pragmatist","adversary"]
  arbiter: string                        // default "arbiter"
  maxTurns: number                       // default 9, min 3, max 30 (invariante de seguridad)
  maxMinutes: number                     // default 12 (deadline duro)
  files: string[]                        // adjuntos iniciales (por referencia)
  filesBudgetChars: number               // default 24000 (presupuesto global de adjuntos)

  // Tokens (ver §5)
  bodyMaxChars: number                   // default 1200 (tope de cuerpo por turno)
  postureDigest: boolean                 // default true (1 línea por rol)
  privateSelfCritique: boolean           // default true (auto-crítica privada, C2)
  rollingSummaryEvery: number            // default 6 (resumen rodante cada N turnos)

  // Calidad (ver §6)
  blindFirstRound: boolean               // default true (ronda ciega inicial, C1)
  confidence: boolean                    // default true (0–100 + agregación ponderada, C3)
  objectionDuty: boolean                 // default true (deber de objeción, C4)
  stabilityStop: boolean                 // default true (corte por estabilidad, no por rondas)
  stallLimit: number                     // default 3 (re-plan tras N estancamientos)

  // Participación selectiva (C5 — EXPERIMENTAL, default "all")
  participation: "all" | "similarity-filter"
  similarityThreshold: number            // default 0.85 (solo con similarity-filter)

  // Guardrails F3 — APAGADOS POR DEFECTO (ver §10)
  guards: {
    enabled: boolean                     // default false
    maxTotalTokens?: number
    maxCostUSD?: number
    loopKill?: boolean
    labMode?: boolean                    // loguea todo pero no aplica nada
  }

  // Humano (ver §7)
  interveneMode: "publish"               // fijo por ahora: publicar en el canal
  approval: "watch"                      // "watch" | "publish" | "auto-apply" (delegación gradual)
}
```

**Explícitamente fuera**: B5 (Chain of Draft, trailer compacto). El trailer de
estado sigue siendo el JSON completo de una línea; el parseo tolerante se mantiene.

## 5. Estrategia de tokens

1. **Prefijo congelado + append-only** (Manus): charter + roles + archivos al
   inicio, jamás modificados. Métrica: **KV-cache hit %** por debate.
   Tokens sin API de usage del harness se estiman como `ceil(chars/4)` y se
   etiquetan **estimados** en UI y reportes.
2. **Solo deltas**: cada rol recibe mensajes nuevos desde su cursor + digest de
   posturas (`rol · status · objeción principal · concesión`).
3. **Tope de cuerpo** (`bodyMaxChars`) + rationale corto: elimina el crecimiento
   cuadrático del contexto.
4. **Resumen rodante** cada N turnos: lo viejo se resume a `.md`, el contexto
   activo guarda puntero + resumen. Salidas grandes → path, no contenido.
5. **Enrutado de modelos** (opt-in): roles secundarios con modelo barato,
   árbitro con el fuerte. Requiere eval antes de ser default.
6. **Presupuesto con circuit breaker** (solo si `guards.enabled`): aviso al 80%,
   cierre forzado con acta "condicionada por presupuesto" al 100%.

## 6. Calidad del debate

- **C1**: primera ronda ciega (respuestas en paralelo, después se ven).
- **C2**: auto-crítica privada antes de publicar (default on).
- **C3**: confianza 0–100 por turno; el árbitro agrega ponderando
  `confianza × evidencia`; los disensos **se registran**, no se borran.
- **C4**: deber de objeción + detector de conformidad (cambio de postura sin
  evidencia nueva = voto débil, se pide justificar).
- **C6**: Progress Ledger del árbitro (`¿avanzamos? ¿loop? ¿qué falta?`);
  al 3er estancamiento se re-plantea (con aprobación según `approval`).
- **C8**: no se fuerza consenso; corte por estabilidad + acta con
  mayorías y minorías.
- **C5 (experimental)**: filtro de redundancia por similitud antes de publicar
  al canal; default `participation:"all"`. Entra al default solo con eval
  (ahorro ≥30% sin degradar >2%, ver §9).

## 7. Humano en el loop

- La intervención entra al canal como mensaje tipado `kind:"user"`, visible
  para todos; el próximo turno de cada rol la considera (`interveneMode:"publish"`).
- Se registra si fue leída/respondida (marca de lectura por rol).
- `INTERRUPT` estándar para pedir aprobación (plan re-planteado, acta final).
- `approval` es un dial de confianza: `watch` → `publish` → `auto-apply`.
- Cerrar la vista **no pierde nada**: `state` rehidrata; timeline permite
  rebobinar (time travel) para auditar.

## 8. UI visual reutilizable (válida para cualquier proyecto)

Principio: **el debate vive donde se invocó**. Componentes:

1. **Chip en el header del chat origen**: `Debate · N turnos · consenso X%`
   (con dot pulsante si está activo). Solo visible si esa sesión tiene debate
   activo/reciente. Click → abre la sala.
2. **Sala**: drawer lateral dentro del panel de sesión (desktop) / bottom
   sheet full-height (mobile). Nunca pestaña global.
3. **Burbuja por mensaje**: avatar (iniciales) + nombre del rol + color fijo
   por rol + hora + cita `repliesTo` + chips (`CONSENSO`/`DISIENTE`/confianza)
   + `blockingIssues` como pills + marca "tú" para intervenciones propias.
4. **Presencia**: "escribiendo…" por rol, quién trabaja ahora.
5. **Barra de consenso**: % + stall/budget; tokens y tiempo por turno y total.
6. **Acta**: bloque diferenciado con veredicto, trade-offs, salvaguardas, plan,
   minorías y confianza; botón aprobar según `approval`.
7. **Input Intervenir** + pausa/stop. Iconografía Lucide/SVG, cero emojis,
   i18n ES/EN.

Mapeo a cualquier stack: chip = badge en header; sala = drawer/sheet;
burbuja = mensaje con autor; barra = progress; acta = artefacto. Los eventos
del §3 alimentan todo sin lógica ad-hoc.

## 9. Observabilidad y evaluación

- Trazas con convención **OpenTelemetry GenAI** (`invoke_agent → chat →
  execute_tool`, `gen_ai.usage.*`, `termination_reason`).
- **Set dorado**: 20–50 dilemas reales del proyecto, resultado bueno acordado,
  revisión **ciega**.
- Métricas por corrida: calidad del acta (ciega + nota humana), consenso,
  tokens totales/por rol, KV-cache hit, latencia, turnos, tasa de cascada de
  error, intervenciones.
- **A/B mismo tema y config, 3 corridas** (sin semilla del harness: se reporta
  varianza): isolated vs shared; con/sin filtro;
  rondas vs estabilidad; con/sin confianza; con/sin intervención.
- **Criterio de adopción**: una técnica entra al default solo con mejora de
  calidad o ahorro ≥30% de tokens sin degradar >2%.

## 10. Guardrails F3 (apagados por defecto)

`guards.enabled:false` = sin topes de tokens/costo, sin loop-kill, sin lab-mode.
Activarlos es opt-in explícito por debate o global. Implementación: checks
antes de cada turno (`maxTotalTokens`, `maxCostUSD` estimado) + `loopKill`
corta con acta + `labMode` solo loguea (no aplica el acta al chat origen).
`maxTurns`/`maxMinutes` **no** son guardrails: son invariantes del protocolo
(siempre activos). Semántica del loop: flag `paused` chequeado por turno,
`deadline` no pausa, `stop` siempre vivo, intervenciones en cola con `seq`
propio (ver `docs/DEBATE-SCHEMA.json`).

## 11. Puente Pi (fase 5, diseño)

Bus peer-to-peer estilo Pi (`send`/`wait`, registry file-based, `feed.jsonl`,
liveness por PID) sobre socket local + JSON-RPC; `contact_supervisor` para
aprobación del dueño; `cwd` como guard. Un harness externo entra como par más
o como supervisor. No se implementa hasta que las fases 1–4 estén con evals.

## 12. Anti-patrones (no hacer)

1. Forzar consenso como corte. 2. Historial completo por turno. 3. Reescribir
   el pasado del canal. 4. Contexto gigante compartido. 5. Más de ~5 roles.
6. "Todos dijeron CONSENSUS" sin confianza/disensos. 7. CoT crudo en la UI.
8. Adoptar mejoras sin evals A/B.

## 13. Fuentes

Talk Isn't Always Cheap (ICML MAS 2025) · S²-MAD (NAACL 2025) · CortexDebate
(ACL Findings 2025) · Adaptive Stability Detection (NeurIPS 2025) · The Cost
of Consensus (2026) · Free-MAD (ACL Findings 2026) · MultiAgentBench (ACL
2025) · Anthropic multi-agent research · Manus context engineering ·
Magentic-One · AG-UI · A2A · MCP Apps · AutoGen HITL · LangGraph interrupts ·
Pi intercom/messenger · OTel GenAI.

## 14. Registro de implementación

### Fase 1 — Plugin protocolo v2 (plugin, 2026-09-14)

Archivo: `C:\Users\perca\.config\opencode\plugins\debate-room\index.ts`
(542 → 1400 líneas; backup en `index.ts.bak`). Constructor: subagente worker
(reporte de handoff perdido; verificado por el titular).
- Spike `logSpike` del ToolContext real + `resolveOrigin`: contexto primero,
  input explícito `originSessionID` (requerido si falta) + validación.
- `DEBATE_DEFAULTS` según schema: `engine:"isolated"`, `cache` alias legacy,
  `guards.enabled:false`, `participation:"all"`, sin B5 (trailer JSON completo).
- Envelope `{debateID, originSessionID, directory, seq, ts}` en todo evento;
  `seq` asignado por el plugin y persistido por línea en
  `.openher/debates/<id>.jsonl`. Dual-emit v1+v2 con mismo `seq`.
- RPC `start/stop/state/intervene/pause/resume` + `state` que reconstruye
  desde JSONL (`seq=max+1`); `archive/compact` degradados a `interrupt`
  best-effort documentado en el header.
- isolated: cursor por rol, digest de posturas, ronda ciega (C1), auto-crítica
  privada (C2), `bodyMaxChars`; shared con digest. Resumen rodante,
  adjuntos por referencia. Confianza 0–100 + disensos en acta (C3), deber de
  objeción (C4), Progress Ledger + `stallLimit` (C6), corte por estabilidad
  (C8). `similarity-filter` (Jaccard trigramas, 0.85) inactivo por defecto +
  métrica de redundancia. Guards como checks + `labMode` solo-log (off).
  Cola de intervención, `paused` por turno, `deadline` no pausa, `stop` vivo.

Verificar:
```powershell
node --check C:\Users\perca\.config\opencode\plugins\debate-room\index.ts
node scripts/debate-schema-check.mjs
```
Gates OK 2026-09-14: `node --check` 0, schema-check OK.
Pendiente (requiere reiniciar el server opencode, no hacerlo en caliente):
carga con `[debate-room] activo` en el log + `debate.start` manual por RPC
por ambos paths + `state` tras reinicio.

### Fase 0 — Limpieza UI global (cliente, 2026-09-14)
- Borrados: `web/src/features/debate/register.tsx`, `DebatePanel.tsx`,
  `useDebateLive.ts` (sala global por tab + hook sin filtro por sesión).
- Quitados: registro del tab (`useVirtualTabs.ts`: `registerDebateTab`,
  `DEBATE_TAB_ID`, `handleOpenDebate`), botón ActivityBar (`data-item="debate"`
  + drag `plugin:debate:room`), item NavBar (`view:"debate"`), bloque mobile
  (`MobileLayoutView.tsx`), `ViewType "debate"` (`entities/config/model.ts` +
  test 8→7 ViewTypes), hilos en `App.tsx`/`useAppController.ts`/
  `DesktopLayoutView.tsx`. No había claves i18n huérfanas de debate.
- Verificación: `npx tsc -b` en `web/` 0 errores; grep 0 de
  `plugin:debate:room|view:"debate"|handleOpenDebate|registerDebateTab`;
  suite vitest completa verde.

### Fase 2 — Cliente: store + sala por sesión (cliente, 2026-09-14)
- Nuevos:
  - `web/src/features/debate/debateStore.ts` — store externo keyed
    `originSessionID → debateID → estado`, dedupe por `(debateID, seq)`
    (absorbe dual-emit v1+v2 con mismo seq y re-emit multi-panel),
    suscripción singleton a `pluginBus`, hidratación best-effort vía RPC
    `debate/state` al abrir, RPC `intervene/pause/resume/stop`, evento DOM
    `debate:open`. **Desvío reportado**: en vez de zustand se usó
    `useSyncExternalStore` (stdlib React 19, misma semántica) porque añadir
    la dependencia obligaba a tocar `package.json`/`pnpm-lock.yaml`, fuera
    de los archivos exclusivos de la fase.
  - `web/src/features/debate/DebateChip.tsx` — chip del header
    (`Debate · N turnos · consenso X%`, dot pulsante si activo); null si la
    sesión no tiene debate.
  - `web/src/features/debate/DebateRoom.tsx` — sala reutilizable: burbujas
    WhatsApp (avatar+nombre+color por rol, hora, repliesTo, chips
    CONSENSO/DISIENTE/confianza, pills de blockingIssues, "tú" para
    intervenciones), typing, barra de consenso (%, turnos, stall, budget,
    tokens est., tiempo), acta con minorías y confianza, timeline simple en
    `<details>`, input Intervenir + pausa/reanudar/stop. Iconos SVG del repo,
    cero emojis, strings por i18n.
  - `web/src/styles/debate.css` — estilos del chip/sala/drawer/sheet
    (importado desde los componentes, sin tocar `styles.css`).
  - `web/src/features/debate/debateStore.test.ts` — 12 tests: dedupe,
    dual-emit v1+v2, filtro por sesión, rehidratado, RPC (state/intervene/
    pause/resume, fallo 404 del plugin viejo), 2 paneles × 1 evento →
    1 entrada con `originSessionID` correcto (vía `useSSEHandler` real).
- Edits mínimos: `ChatView.tsx` (solo chip en `.detail-header-actions`),
  `SessionChatPanel.tsx` (solo drawer `.debate-drawer` + listener
  `debate:open` filtrado por sesión), `MobileLayoutView.tsx` (solo bottom
  sheet reutilizando `.sheet-backdrop`/`.bottom-sheet` existentes — el
  componente `BottomSheet.tsx` no se tocó: sus props son cerradas a
  `"ai"|"details"`), `useSSEHandler.ts` (solo precedencia
  `p.sessionID ?? p.data.sessionID ?? d.originSessionID ?? deps.sessionID`,
  con fallback de directory), `es.ts`/`en.ts` (solo claves `debate.*`;
  it/zh caen al EN por diseño del loader).
- Verificación: `npx tsc -b` 0 errores; `pnpm run test:i18n` OK; vitest
  completo 126 archivos / 1745 tests verdes. Visual: abrir un debate desde
  el agente en la sesión S → aparece el chip solo en S → click abre drawer
  (desktop) / sheet (mobile); intervenir publica y se ve como "tú".
  _(Los constructores anotan acá qué hizo cada fase, archivos y cómo verificar.)_

### Fase 3 — Evals + métricas (2026-09-14)

Archivos nuevos (dueño: evals, no se tocó ningún otro):
- `scripts/debate-eval/cases.json` — 20 dilemas (8 arquitectura, 6 bugs,
  6 producto) con `goodOutcome` acordado; solo D20 pide guards explícito.
- `scripts/debate-eval/run.mjs` — matriz A/B por RPC `debate/start`:
  A-isolated (baseline) vs B-shared, C-similarity (C5 a comparar),
  D-rondas (sin estabilidad), E-sin-confianza, F-intervención simulada;
  3 corridas por celda; métricas consenso, tokens `ceil(chars/4)` estimados
  total/por rol, latencia, turnos, stalls, cascadas (postura sin evidencia
  nueva), intervenciones; varianza por celda (media ± std, min/max).
  Flags `--dry-run` (sin server) y `--limit N` (corridas cortas).
- `scripts/debate-eval/report.mjs` — tabla markdown + veredicto §9
  (`--blind blind.json` opcional para notas ciegas).
- `scripts/debate-eval/REVISAR.md` — plantilla de nota ciega (juez sin mapeo).
- Reglas: B5 excluido, C5 default `all`, guards/F3 off salvo D20 (labMode).

Verificar (gate OK 2026-09-14, 360/360 simuladas, reporte válido):
```powershell
node scripts/debate-eval/run.mjs --dry-run --out scripts/debate-eval/out
node scripts/debate-eval/report.mjs --in scripts/debate-eval/out/results.json --out scripts/debate-eval/out/report.md
```
Matriz real (no corrida aquí: el plugin activo es v1, solo `topic/cache/
maxTurns/roles/files`; el RPC v2 con `engine/participation/confidence` llega
con Fase 1 — `run.mjs` reintenta en modo compat y deja todo listo):
```powershell
$env:OPENCODE_URL="http://127.0.0.1:4096"
node scripts/debate-eval/run.mjs --cases D01,D09,D15 --limit 18 --out scripts/debate-eval/out
```
Costo estimado: ~8k–25k tokens (est.) por debate → matriz completa
(20×6×3=360 debates) ~3M–9M tokens y varias horas (2–6 min/debate,
secuencial); empezar con `--limit 6–18`. Veredicto actual: INCONCLUSO
(falta revisión ciega); C5 y enrutado de modelos requieren §9 con notas reales.
