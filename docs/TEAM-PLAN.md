# TEAM — Plan de ejecución

Deriva de `docs/TEAM.md`. Orden estricto por fases; cada fase tiene dueño
de archivos exclusivo, criterios de aceptación y gates. Reglas: nada sin
spike previo, nada sin evals, equipo mínimo (3) hasta tener dato, topología
fijada por trabajo, feed append-only siempre.

Dependencias: usa la sala de `debate-room` (fases 1–4 de DEBATE-PLAN) para
el paso juzgar, y el bus del puente Pi (fase 5) para el transporte. TEAM no
reimplementa ni lo uno ni lo otro: solo registry, claims, feed/blackboard
y el ciclo.

## Relación con el bus (fase 5 del puente) — modo interino declarado

El bus fase 5 no existe todavía (`DEBATE.md`: no se implementa hasta
fases 1–4 con evals). TEAM arranca en **modo interino file-based sin bus**;
cuando llegue el bus, el transporte se muda y los archivos quedan como
persistencia. Mapeo `team/*` vs `messenger/*` (qué se reúsa, qué no):

| Necesidad TEAM | messenger (fase 5) | Interino (Fases 1–3) | Al llegar el bus |
|---|---|---|---|
| Registry + liveness | registry + PID checks | `team/registry.jsonl` + heartbeat (spike F0.2) | Se adopta registry/messenger; se tira el heartbeat propio |
| Claims / reservas | file reservations | `team/claims/` con lease (Fase 2) | Se adopta si cubre lease+TTL; si no, se mantiene |
| Feed / broadcast | `feed.jsonl` + broadcast | `team/feed.jsonl` (Fase 3) | Mismo formato: se fusiona, no se reescribe |
| 1:1 send/ask | intercom `send`/`ask` | Spike F0.5 define el transporte interino | Se adopta intercom |

Gate: el spike F0.5 dictamina si el harness da wake cross-sesión sin bus.
Si da rojo, TEAM recorta `ask` a polling cada 15 s (no se aborta el plan;
se registra el recorte en `docs/TEAM.md` §10).

## Fase 0 — Spikes de viabilidad (dueño: harness)

Ubicación decidida por defecto: módulo `team/` separado dentro del dir del
plugin (`team/registry.ts`, `team/claims.ts`, `team/feed.ts`,
`team/blackboard.ts`, `team/roles.ts`, `team/rpc.ts`); no se toca
`debate-room/index.ts` salvo un import. El spike F0.7 lo confirma o lo
cambia **antes** del gate F0→F1, y la decisión queda escrita en `TEAM.md` §10.

Spikes (script PASS/FAIL cada uno, en `scripts/team-eval/spikes/`):

1. Adquisición atómica de claims: crear archivo con O_EXCL desde el plugin;
   20 intentos concurrentes → exactamente 1 gana, 19 denegados.
2. Liveness: dictamina **heartbeat de sesión vs PID**. Prueba listar
   sesiones vivas y detectar 1 muerta a propósito en ≤30 s. Su resultado
   corrige `TEAM.md` §2 si hace falta.
3. Append-only feed: JSONL por equipo con `seq` monotónico, rehidratación
   tras matar el proceso (igual que `state` del debate).
4. Agent-bound sessions: confirmar `create({agent})` + campos de agent
   (modelo/tools/prompt) — pendiente del hilo de especialistas.
5. Delivery cross-sesión (el riesgo mayor): desde el plugin, crear 2
   sesiones, N=10 `send` + `ask` con timeout=60 s entre ellas; PASS si
   entrega 10/10 y p50 ≤30 s. Si el harness no da wake, fallback
   declarado: polling cada 15 s (ver modo interino arriba).
6. TTL-race + `base_SHA`: claim con `ttl=5 s`; 2 reclamos dentro de una
   ventana ≤100 ms tras expirar → 1 gana. `base_SHA`: git SHA si hay
   repo; si no, hash del árbol (`mtime`+tamaño solo como último recurso).
   Orden declarado, sin disyunciones abiertas.
7. Aislamiento por rama: medir setup de worktree (segundos) + costo de
   integración; decide si la capa 3 de `TEAM.md` §3 entra o se difiere
   (umbral: setup ≤60 s y merge limpio en prueba).

Política de rojo: cada spike en rojo se registra con una de tres
salidas — aborta la fase que lo necesita / recorta el diseño (declarado
arriba o en §10) / cambia el diseño (nueva decisión escrita). "No se
diseña" solo no alcanza.

Aceptación: 7 scripts en verde o con salida declarada. Gate Fase 0 →
Fase 1: capacidades probadas + ubicación del módulo escrita.

## Fase 1 — Registry + presencia (dueño: plugin)

Archivos: `team/registry.ts` (nuevo), `team/rpc.ts` (nuevo: `team/register`,
`team/list`, `team/heartbeat`, `team/leave`). Prohibido tocar
`debate-room/index.ts` salvo el import de `team/rpc.ts`.

1. Registro file-based: `{nombre, cwd, modelo, capacidades, latido, estado}`
   en `team/registry.jsonl`. Alta/baja explícita + limpieza de muertos por
   liveness (mecanismo según spike F0.2).
2. Presencia viva: `idle/thinking/tool:<nombre>` publicado automáticamente.
3. Agent Cards diferidas a cross-device: solo el formato queda definido
   en `team/roles.ts` (tipos), sin exigirlo.

Aceptación (script `scripts/team-eval/spikes/f1.sh`): 3 sesiones registran
vía RPC; se mata 1 a propósito; `team/list` la deja de mostrar en ≤30 s;
las otras 2 siguen. Grep: 0 fantasmas (comparar `list` contra sesiones
vivas reales). Prohibido: daemon propio (registry = archivos + proceso
del plugin).

## Fase 2 — Claims con lease (dueño: plugin)

Archivos: `team/claims.ts` (nuevo). Prohibido tocar registry y sala.

1. `team/claim {recurso, tarea, base_SHA, ttl}` atómico (O_EXCL);
   `team/release`, `team/renew`. Default `ttl=300 s`. Expiración
   automática; claim muerto = liberado. Primario designado (regla
   1-hecho→1-store): `team/claims/<id>.json` es el store del claim; el
   feed solo lleva evento link `{type:"claim", ref:<id>}` sin duplicar
   contenido.
2. Partición de escritura: el coordinator asigna file sets disjuntos; si
   hay overlap, serie o re-partición. El `claim` advierte overlap contra
   claims vivos (no lo prohíbe: hay casos legítimos en serie).
3. Mutex semántico al integrar: verificar `base_SHA` antes de aplicar;
   si cambió, rebase o re-plan, nunca sobreescritura silenciosa.
4. Métrica: `claims_denied` (colisiones evitadas) + `claims_expired`.
5. Aislamiento por rama (capa 3 de `TEAM.md` §3): **diferido por defecto**.
   Entra solo si el spike F0.7 lo justifica (setup ≤60 s y merge limpio en
   prueba); si no, queda prohibido hasta Fase 5 con dato.
6. Filtro inteligente (idea CoAgent): **no-hacer hasta Fase 5**. Hoy es
   frase sin mecanismo; bloquear de más es el default seguro.

Aceptación (script `scripts/team-eval/spikes/f2.sh`): N=20 reclamos
concurrentes al mismo recurso → exactamente 1 gana, 19 denegados;
claim con `ttl=5 s` de agente muerto → otro reclama OK a los ≤10 s;
prueba de estrés de integración → 0 sobreescrituras silenciosas
(contar aplicaciones con `base_SHA` vieja: debe dar 0).

## Fase 3 — Feed + blackboard (dueño: plugin)

Archivos: `team/feed.ts`, `team/blackboard.ts` (nuevos). Prohibido tocar
claims, registry y sala. Regla de enrutado (`TEAM.md` §4): 1 hecho → 1
store primario + links; el acta final vive en el JSONL de la sala y se
linkea desde el blackboard.

1. `team/feed.jsonl` por equipo: todo evento con `seq` + causa
   (`responde_a`, `sobre_base_SHA`). Append-only; reescribir = bug.
2. Blackboard: estado del objetivo, decisiones (links a actas), progreso
   (Progress Ledger). Namespaces por rol, TTL default 24 h a hechos,
   escritura firmada (rol + tarea).
3. RPC: `team/post`, `team/read` (filtro por namespace/tema obligatorio),
   digest para no inyectar el tablón entero.

Aceptación (script `scripts/team-eval/spikes/f3.sh`): matar el proceso y
rehidratar equipo completo solo desde archivos (`team/state` reconstruye
igual que `debate/state`); `team/read` sin filtro → error (nunca el
tablón entero); `read` con filtro devuelve ≤50 entradas o digest ≤2000
chars; hecho con TTL vencido no aparece.

## Fase 4 — Ciclo proponer→evaluar + roles (dueño: plugin)

Archivos: `team/roles.ts` (prompts + tipos, nuevo), `team/rpc.ts` (suma
`team/veto`, `team/escalate`), `team/feed.ts` (suma `toTimelineEvents()`).
Cliente: reutilización de solo lectura del timeline de DEBATE Fase 4
(`web/src/features/debate/DebateRoom.tsx`, sin componente nuevo, sin
timeline propio). Adaptador: `toTimelineEvents()` mapea claims (vía links
`ref`), vetos, eventos feed y actas linkeadas a props `{seq, kind, label}`
que el timeline ya renderiza; nada que no mapee se muestra. Prohibido:
timeline nuevo, duplicar la sala.

1. Divergir: N=3 propuestas en ronda ciega (reúsa C1 del debate), una por
   specialist con sesión agent-bound (según F0.4); prompt en
   `team/roles.ts#specialist`; cada propuesta tagged `{autor, base_SHA}`.
2. Criticar: adversario + deber de objeción (reúsa C4).
3. Juzgar: sala de debate con rúbrica; salidas: gana / fusiona / más
   evidencia / escala a humano. Disenso minoritario al acta.
4. Registrar: acta corta linkeada en blackboard (qué, por qué, qué se
   descartó, quién disiente).
5. Roles (correlato de `TEAM.md` §6, nada sin fase):
   - Coordinator: prompt en `team/roles.ts#coordinator`; descompone en
     tareas con file sets disjuntos; **no ejecuta** (check: 0 tool calls
     de escritura en prueba).
   - Reviewer: `team/veto {motivo}` bloquea la integración; el veto
     exige motivo escrito (sin motivo → rechazado).
   - Arbiter: dirige la sala; es el árbitro del debate existente.
   - Supervisor (humano): `team/escalate` ≡ `contact_supervisor`;
     approval `watch` default (solo mira), `publish` para intervenir.
   - Specialist (correlato de `TEAM.md` §6): vive en su sesión agent-bound,
     prompt `team/roles.ts#specialist`, propone en Divergir y ejecuta su
     tarea con su claim; sin RPC propio salvo `team/post` al blackboard.
6. Topología fijada por trabajo: `team/create {topology:
   hierarchy|flat|debate|blackboard}` inmutable a mitad (hierarchy =
   ejecuta con coordinator; flat = pares; debate = el equipo dirime en
   sala; blackboard = aporte asíncrono). Cambiarla = cerrar equipo y abrir
   otro; los cambios a mitad son fuente de loops.

Aceptación: caso T-D1 (decisión con 2 soluciones rivales, nombrado en
`scripts/team-eval/cases.json`; prefijo T-D = decisión, T-E = ejecución
de Fase 5, sin colisiones) produce acta con campos `ganador`, `motivo`,
`descartado`, `disenso` verificables por grep; 1 veto con motivo bloquea
y 1 sin motivo es rechazado; `team/create` con cambio de topología a
mitad → error; el timeline de T-D1 renderiza claim+veto+acta (test: los 3
`kind` presentes vía `toTimelineEvents()` + conteo en cliente).

## Fase 5 — Evals + adopción (dueño: evals)

Harness `scripts/team-eval/` (molde: `scripts/debate-eval/`; el esqueleto
puede arrancar en paralelo a Fase 2 pero sin prejuzgar el diseño: solo
harness + 1 caso seco):

- Casos: M=6 tareas paralelizables con overlap real (las que duelen), en
  `scripts/team-eval/cases.json` (T-E1 a T-E6; T-D1 es el caso de decisión
  de Fase 4, prefijos distintos).
- Celdas: single-agent vs equipo 3 jerarquía vs equipo 3 plano.
  Matriz: 6 tareas × 3 celdas × 3 corridas = 54 ejecuciones.
- Métricas: tiempo, tokens reales + costo (misma base o n/c, patrón
  Tier 1), `claims_denied` cruzado con retrabajo real, calidad ciega del
  entregable.
- Revisión ciega: rúbrica + anonimización reutilizando `blind-set.mjs` y
  `REVISAR.md` (mapping sellado, notas 1–5 por acta).
- Reporte con media ± std, min/max por celda (patrón `report.mjs`).
- Criterio §9 exacto (`DEBATE.md`): el equipo entra al default solo con
  mejora de calidad o **ahorro ≥30% de tokens** sin degradar >2% (+
  revisión ciega). Sin nota ciega: INCONCLUSO, no se adopta.

Aceptación: 54/54 ejecuciones + `results.json` + `report.md` + notas
ciegas volcadas. Sin esto, TEAM no sale del lab.

## Orden de constructores

1. Spikes harness (Fase 0) → 2. Plugin registry+claims (Fases 1–2) → 3. Feed/
   blackboard (Fase 3) → 4. Ciclo + roles, plugin (Fase 4) → 5. Evals (Fase 5).
El 5 (evals) puede arrancar su esqueleto en paralelo al 2 (archivos
disjuntos, sin prejuzgar el diseño). Gates por constructor: tests del área
+ archivos del área.
Prohibido: daemon propio, reescribir el feed, claims sin TTL, equipo >3
sin dato de Fase 5, tabs/vistas globales nuevas, timeline nuevo o duplicar
la sala (Fase 4-cliente reutiliza el de DEBATE), ramas por defecto sin dato
del spike F0.7, filtro inteligente CoAgent antes de Fase 5, mezclar juicio y
ejecución en un solo protocolo.
