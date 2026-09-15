# OpenHer Team — coordinación multi-agente estilo empresa

Documento de diseño (idea en construcción). Orden de trabajo: documento →
plan → evaluador → constructores. Nada se implementa sin evals que lo
respalden (§9 de `docs/DEBATE.md` vale también aquí).

Relación con lo existente:

- `debate-room` (plugin, fases 1–4) = **sala de decisiones**: cómo el equipo
  dirime una cuestión difícil y produce un acta con disensos.
- Puente Pi (fase 5, `docs/DEBATE.md` §11) = **bus de ejecución**: cómo los
  pares se hablan y delegan (messenger = tablón, intercom = 1:1,
  Pi-to-Pi = pool plano).
- **TEAM (este doc)** = **capa de coordinación persistente**: cómo el equipo
  se descubre, se reparte el trabajo sin pisarse, propone y evalúa
  soluciones, y recuerda lo decidido. Vive encima del bus; usa la sala
  cuando hay que decidir.

## 1. La empresa como modelo

| Empresa | OpenHer Team | Estado |
|---|---|---|
| Organigrama + quién sabe qué | Registry con Agent Cards (capacidades, cwd, modelo, estado) | A diseñar |
| Nadie edita el doc del otro sin avisar | Claims con lease + partición de escritura | A diseñar |
| Reunión / pasillo / email | Bus: `send` (notificar) / `ask` (consultar bloqueante) / feed | Bus en fase 5 |
| Proponer, criticar, votar | Sala de debate + acta + revisión ciega | Existe (fases 1–4) |
| Pizarrón / wiki / actas | Blackboard: estado, decisiones, progreso | A diseñar |
| Jefe / dueño que aprueba | Supervisor humano (`contact_supervisor`, approval) | Parcial (plugin) |
| Roles (dev, QA, arquitecto) | Especialistas con modelo/tools/skills propios | Propuesto (spike pendiente) |

## 2. Descubrimiento (quién hay, qué sabe, en qué está)

Tres mecanismos combinados, de barato a caro:

1. **Registry file-based** (estilo pi-messenger): cada agente registra
   nombre, cwd, modelo, capacidades y latido. Sin daemon; liveness por PID.
   Es la fuente de verdad local.
2. **Presencia viva** (estilo pi-intercom broker): `idle` / `thinking` /
   `tool:<nombre>` publicado automáticamente. Solo sesiones conectadas.
3. **Agent Cards** (estilo A2A): ficha estructurada por agente —
   qué ofrece, a qué precio/costo, con qué auth. Necesaria cuando el equipo
   cruza máquinas u organizaciones; overkill para un solo host.

Regla: en un host, 1+2 bastan. La 3 entra con el puente cross-device.

## 3. Anti-pisadas (que no se pisen)

El problema más duro no es hablar, es **no corromperse el trabajo**.
Capas, de más barata a más fuerte:

1. **Partición de escritura** (primera defensa): al repartir tareas, exigir
   file sets disjuntos. Si dos tareas tocan los mismos archivos, van en
   serie o se re-particionan. Práctica de Claude Code Agent Teams.
2. **Claims con lease** (coordinación explícita): antes de tocar un recurso
   (archivo, tarea, zona), el agente crea un claim atómico
   `{recurso, dueño, tarea, base_SHA, expira}`. Si muere o se cuelga, el
   lease expira y otro lo reclama. Inspiración: `.ai/locks/` + reservas de
   pi-messenger. La adquisición debe ser atómica (O_EXCL / transacción).
3. **Aislamiento por rama** (colisiones físicas imposibles): cada agente
   trabaja sobre snapshot congelado (worktree/rama) y se integra al final.
   Caro pero elimina merges a ciegas (patrón Autonoma).
4. **Mutex semántico** (última milla): antes de aplicar un cambio, verificar
   que la versión base no cambió; si cambió, rebase o re-plan, nunca
   sobreescritura silenciosa (patrón Ninelayer).
5. **Filtro inteligente** (ahorro): el propio LLM distingue conflicto real
   de interferencia irrelevante (un peer que agrega una línea de log a un
   archivo que leíste no invalida tu plan). Idea de CoAgent (2026): no
   todo overlap es conflicto; bloquear de más también cuesta.

Advertencia (Zabriskie, 2026): sin orden causal ni versiones, dos agentes
pueden resolver el mismo bug dos veces o pisarse sin notarlo. El feed
(§5) debe llevar `seq` + causa (`responde_a`, `sobre_base_SHA`) para
reconstruir qué pasó antes de qué.

## 4. Comunicación (dos carriles + tablón)

- **Carril directo** (par a par, estilo intercom): `send` para notificar
  (fire-and-forget), `ask` para consultar bloqueando con timeout. `ask`
  solo cuando sin la respuesta no se puede avanzar; lo demás es `send`.
- **Carril tablón** (uno a todos, estilo messenger): broadcast para
  anuncios (claim tomado, tarea lista, decisión tomada). Barato, sin
  acuse.
- **Blackboard** (indirecta asíncrona, Redis/JumpCloud/OpenLayer): espacio
  compartido donde los agentes publican hallazgos parciales y leen los de
  otros sin mensajes directos. Ideal para contribuciones incrementales de
  especialistas (diagnóstico médico, research). Reglas: namespaces por rol
  (nadie pisa el espacio ajeno), TTL a los hechos (lo viejo expira en vez
  de envenenar), cada escritura firmada (rol + tarea) para auditar.
- **Feed del equipo** (`feed.jsonl` append-only, jamas reescrito): todo lo
  relevante queda registrado con `seq`. Es la memoria auditable y la base
  de las actas.

Tope anti-reunionitis: 3–5 agentes, `maxTurns` acotado, corte por
estabilidad. El chatter escala cuadrático; cada mensaje debe mover la
tarea o no se envía.

## 5. Proponer y evaluar soluciones (el núcleo empresa)

Ciclo en cuatro pasos, siempre en este orden:

1. **Divergir** (proponer): cada especialista propone por su cuenta, ideal
   con ronda ciega (sin ver a los otros primero) para no anclar. N
   propuestas, no una.
2. **Criticar** (romper): adversario + deber de objeción. La crítica va a
   la propuesta, nunca al proponente. Se buscan contraejemplos, no
   paráfrasis.
3. **Juzgar** (elegir): la sala de debate con rúbrica + revisión ciega
   humana cuando importa (patrón `REVISAR.md`). Salidas posibles: gana una,
   se fusionan (hibridan), se pide más evidencia, se escala al humano.
   El disenso minoritario queda en el acta: perder también informa.
4. **Decidir y registrar**: acta corta (qué, por qué, qué se descartó y
   por qué, quién disiente) → al blackboard como decisión. Las decisiones
   se revisitan solo con evidencia nueva, no por insistencia.

## 6. Roles (plantilla mínima)

- **Coordinator**: descompone el objetivo en tareas con file sets
  disjuntos, asigna, integra. No ejecuta.
- **Specialist × N**: ejecuta su tarea en su claim. Modelos/tools
  distintos según tema (ver idea de agentes especialistas).
- **Reviewer/QA**: revisa con roles invertidos (pregunta antes de
  corregir — *communicative dehallucination* de ChatDev). Puede vetar la
  integración con motivo escrito.
- **Arbiter**: dirige la sala cuando hay que elegir entre soluciones.
- **Supervisor (humano)**: aprueba cambios de contrato
  (`contact_supervisor`, approval watch/publish). Dueño final.

Empieza con 3 (coordinator + 2 specialists, uno hace de reviewer). Crece
solo con dato de evals.

## 7. Topologías: cuál cuándo

| Situación | Topología | Por qué |
|---|---|---|
| Ejecución rutinaria, tareas claras | Jerarquía (coordinator → specialists) | Mínimo chatter, máxima velocidad |
| Exploración / integración entre partes | Pool plano (pares) | Sin pérdida por parafraseo del jefe |
| Decisión difícil / soluciones rivales | Sala de debate | Robustez, acta con disensos |
| Especialistas aportando por goteo | Blackboard | Asíncrono, sin reuniones |

Híbrido por fase es lo normal: jerarquía para ejecutar, plano para
integrar, sala para decidir. Fijar la topología por adelantado para cada
trabajo; cambiarla a mitad es fuente de loops.

## 8. Anti-patrones (no hacer)

1. Reuniones sin fin (loops sin `maxTurns` ni estados terminales).
2. Consenso forzado como corte (el disenso es información).
3. Claims sin expiración (un agente muerto bloquea al equipo).
4. Reescribir el feed (rompe causalidad y auditoría).
5. Contexto gigante compartido (cada agente, lo justo — 20% rinde más
   que 40% mezclado).
6. Jerarquía que filtra ideas (si todo pasa por el jefe, parafrasea y
   pierde).
7. Adoptar roles/topologías sin A/B (regla §9).

## 9. Fuentes (para este doc)

Pi intercom/messenger READMEs · Pi-to-Pi/IndyDevDan · A2A spec + Linux
Foundation 1.0 · Fractal (A2A×AutoGen×CrewAI) · Microsoft Agent Framework
1.0 (sucesor AutoGen) · ChatDev + communicative dehallucination · CoAgent
(2026, control de concurrencia semántico) · Zabriskie (distributed
systems problem, 2026) · Galileo (ACLs/TTL en memoria compartida) ·
Claude Code shared task list + worktrees · Autonoma (branch isolation) ·
Ninelayer (agentic mutex) · Blackboard: Redis, JumpCloud, OpenLayer,
Schepis (2025), arXiv 2510.01285, CA-MCP (2026) · REVISAR.md (revisión
ciega, harness propio).

## 10. Registro

- 2026-09-15: idea inicial (pedido del dueño: equipo-empresa que se
  descubre, no se pisa, propone y evalúa). Doc creado, sin implementar.
- Siguiente: plan por fases (TEAM-PLAN.md) → evaluador → spike registry
  + claims → A/B contra ejecución single-agent.
