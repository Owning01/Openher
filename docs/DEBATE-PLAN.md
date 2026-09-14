# DEBATE — Plan de ejecución

Deriva de `docs/DEBATE.md`. Orden estricto por fases; cada fase tiene dueño
de archivos exclusivo, criterios de aceptación y gates. Reglas: B5 fuera,
C5 experimental, F3 off por defecto, `isolated` default, intervención =
publicar, Pi después.

## Fase 0 — Limpieza UI global (dueño: cliente)

Quitar la sala global sin romper el build. Inventario exhaustivo (grep):
- `web/src/features/debate/register.tsx` + uso en `web/src/hooks/useVirtualTabs.ts`
  (`registerDebateTab`, `DEBATE_TAB_ID`, `handleOpenDebate`).
- `web/src/widgets/activity-bar/ActivityBar.tsx` (item debate).
- `web/src/components/NavBar.tsx` (`view:"debate"`).
- `web/src/pages/mobile-layout/MobileLayoutView.tsx` (bloque debate).
- `web/src/entities/config/model.ts` (`ViewType "debate"`) + su test
  (`model.test.ts`: 8 → 7 ViewTypes) + `barrel.test.ts` si lo cubre.
- `web/src/App.tsx` (`handleOpenDebate`), `web/src/app/useAppController.ts`
  (1164, 1295), `web/src/widgets/desktop-layout/DesktopLayoutView.tsx`
  (39, 172, 336), barrel `types.ts`, claves i18n de debate.
- Mantener `DebatePanel.tsx`/`useDebateLive.ts` hasta Fase 2.

Aceptación: `tsc` 0, tests verdes, y grep 0 de
`plugin:debate:room|view:"debate"|handleOpenDebate|registerDebateTab`.

## Fase 1 — Plugin protocolo v2 (dueño: plugin)

Archivo: `C:\Users\perca\.config\opencode\plugins\debate-room\index.ts`
(backup `.bak` previo; sin imports nuevos; API del harness intacta).

1. Config única `DEBATE_DEFAULTS` = §4 de DEBATE.md + `docs/DEBATE-SCHEMA.json`
   (con `guards.enabled:false`, `participation:"all"`, sin nada de B5).
   **Flip explícito del default**: `cache:"shared"` → `engine:"isolated"`;
   `cache` queda como alias legacy de solo-lectura.
2. **Spike previo obligatorio**: loguear el `ToolContext` real en `execute`
   para confirmar `sessionID`. Si no existe, el tool acepta input explícito
   `originSessionID` (requerido) + validación. Sin procedencia probada no se
   avanza: la aceptación lo exige.
3. `originSessionID` + `directory` a registro y eventos; `seq` monotónico por
   debate **asignado por el plugin y persistido por línea JSONL**.
   **Dual-emit v1+v2 con mismo `seq`** durante 1 versión (compat, ver schema).
4. Eventos v2 + RPC `intervene/pause/resume/stop/state` según schema.
   `state` reconstruye desde `.openher/debates/<id>.jsonl` si el Map no lo
   tiene (`seq=max+1`). Verificar `ctx.session.archive/compact`; si no
   existen, degradar a `interrupt` best-effort **documentado**.
5. `isolated`: cursor por rol (solo deltas) + digest de posturas + ronda ciega
   inicial (C1) + auto-crítica privada (C2) + tope `bodyMaxChars`.
   Cola de intervención + flag `paused` por turno + `deadline` no pausa
   + `stop` siempre vivo (ver `loop_semantics` del schema).
6. `shared`: mismo digest; prohibido reescribir pasado.
7. Resumen rodante cada `rollingSummaryEvery` + adjuntos por referencia.
8. Confianza 0–100 + agregación ponderada + disensos en acta (C3); deber de
   objeción (C4); Progress Ledger + `stallLimit` (C6); corte por estabilidad (C8).
9. `participation:"similarity-filter"` implementado pero inactivo por defecto,
   con métrica de redundancia (C5 experimental). Similitud = **Jaccard sobre
   trigramas de caracteres** del body vs últimos N mensajes; umbral
   `similarityThreshold` (default 0.85).
10. Intervención → mensaje `kind:"user"` + evento `role:"human"`.
11. Guards F3 implementados como checks + `labMode` solo-log (apagados por
    defecto según schema).

Aceptación: `node --check` del archivo (vía transpilación ligera o carga del
plugin en opencode con log `[debate-room] activo`); `debate.start` manual por
RPC emite eventos con `originSessionID`+`seq` **por ambos paths (tool y
command)**; cliente viejo sigue recibiendo v1; `state` rehidrata tras matar el
proceso; `docs/DEBATE-SCHEMA.json` validado (un script compara claves del
plugin contra el schema). Gate Fase 1 → Fase 2: schema congelado.

## Fase 2 — Cliente: store + sala por sesión (dueño: cliente)

Archivos nuevos: `web/src/features/debate/debateStore.ts` (zustand,
key `originSessionID → debateID → estado`, dedupe por `seq`),
`web/src/features/debate/DebateRoom.tsx` (sala reutilizable),
`web/src/features/debate/DebateChip.tsx` (chip del header).
Edits: `ChatView.tsx` (chip en `.detail-header-actions` solo si la sesión
tiene debate), `SessionChatPanel.tsx` (drawer) / mobile sheet vía `BottomSheet`,
i18n ES/EN + CSS, iconos Lucide, cero emojis.
Fix duplicación: precedencia `p.sessionID ?? p.data.sessionID ??
d.originSessionID ?? deps.sessionID` (mantiene fallback de heartbeat/status)
+ **idempotencia en el store por `(debateID, seq)`**; test: 2 paneles montados,
1 evento → 1 entrada con `originSessionID` correcto.
Borrar `DebatePanel.tsx`/`useDebateLive.ts`/`register.tsx` al final.

Aceptación: debate visible solo en su chat; chip aparece/desaparece;
drawer + sheet; intervenir publica y se ve como "tú"; `tsc` 0,
`test:i18n` OK, tests nuevos del store (dedupe, filtro por sesión, rehidratado).

## Fase 3 — Evals + métricas (dueño: evals)

Archivos nuevos: `scripts/debate-eval/cases.json` (20 dilemas),
`run.mjs` (matriz A/B por RPC, 3 corridas, métricas: calidad ciega diferida,
tokens/rol, cache-hit aprox, latencia, turnos, cascadas, stalls),
`report.mjs` (tabla markdown), `REVISAR.md` (plantilla de nota ciega).
Docs: criterio de adopción (§9) aplicado a C5 y a enrutado de modelos.

Aceptación: `run.mjs --dry-run` OK; matriz A/B completa (mismo tema+config,
3 corridas, reporte de varianza, revisión ciega con plantilla) genera reporte;
sin "misma semilla" en ningún lado.

## Fase 4 — Endurecer y documentar (dueño: cliente+plugin)

- OTel GenAI: spans `invoke_agent` (debate) → `chat` (turno por rol) →
  `execute_tool` (lectura de adjuntos); atributos `gen_ai.usage.*_est`,
  `debate.id`, `debate.seq`, `termination_reason`.
- Timeline/replay en la sala: hitos (inicio, turnos, intervenciones, stalls,
  acta) desde el JSONL; rebobinar = filtrar por `seq` (solo lectura).
- Dial `approval`: `watch` (default, solo mirar) | `publish` (intervenir) |
  `auto-apply` (aplica el acta al chat origen; requiere confirmación explícita
  en config, nunca default).
- `Registro de implementación` en DEBATE.md completo, verificación visual en
  desktop + mobile.

## Orden de constructores

1. Plugin (Fase 1) → 2. Cliente (Fase 0+2) → 3. Evals (Fase 3) → 4. Fase 4.
El 2 puede arrancar su Fase 0 en paralelo al 1 (archivos disjuntos).
Gates por constructor: `tsc` 0 + tests del área + `test:i18n` si toca UI.
Prohibido: B5, activar C5 por defecto, activar F3, tabs/vistas globales nuevas.
