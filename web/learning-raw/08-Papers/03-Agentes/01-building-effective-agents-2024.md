# Building Effective Agents — Patrones que sí funcionan (Anthropic, 2024)

> **Autores:** Anthropic Engineering (B. Horowitz et al.)
> **Año:** 2024 · **Prioridad:** Imprescindible · **Lectura:** ~20 min
> **Link verificado:** [https://www.anthropic.com/engineering/building-effective-agents](https://www.anthropic.com/engineering/building-effective-agents)
> **Categoría Papers:** 03 Agentes · **Nivel:** avanzado · **Versión:** Dic 2024 (blog técnico, no arXiv)

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el artículo original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Artículo original:** Building Effective Agents — Anthropic Engineering, diciembre 2024.
> **Link:** https://www.anthropic.com/engineering/building-effective-agents
> **Relevancia para opencode-remote-android:** es el manual anti-humo para tu harness: te dice exactamente cuándo usar workflow determinista y cuándo pagar el costo de un loop agéntico, y por qué tu `external_router`, `ptyx :4849` y `kanban` no deberían ser "un agente genérico que hace todo".
> **Prioridad:** Imprescindible — *si solo leés uno de esta carpeta, que sea este.*

## 1 Introducción — Qué problema resuelve

La industria se obsesionó con "agentes autónomos" que hacen todo con un loop ReAct infinito. Anthropic, después de poner agentes en producción real, llega a la conclusión opuesta: **el patrón más simple que resuelve el caso gana siempre**. Un loop agéntico es caro, difícil de debuggear, latente y frágil. Si podés resolverlo con un workflow determinista, hacelo.

El artículo sistematiza **5 workflows validados en producción** + 1 patrón agéntico de último recurso, con criterios concretos para elegir. No es teoría: son los patrones que usan internamente para coding, research y tool-use con Claude. Para vos, que mantenés un thin client con `opencode serve` + `desktop-app` Rust + 5 plugins externos, este paper te ahorra meses de sobrediseño: te dice qué partes de tu sistema merecen agente y cuáles son un simple pipeline.

## 2 Ideas clave

### 2.1 Los 5 workflows (usá estos primero)

| # | Patrón | Cómo funciona | Cuándo usarlo |
|---|--------|---------------|---------------|
| 1 | **Prompt chaining** | Salida de paso N → entrada de paso N+1. Ej: `extract → rewrite → format`. Cada paso valida antes de pasar al siguiente. | Tareas descomponibles en secuencia fija donde cada sub-tarea es bien definida. |
| 2 | **Routing** | Clasifica el input y deriva a un handler especializado. Ej: `"/help" → docs`, `"debug" → agente code`. | Inputs heterogéneos donde distintos especialistas superan a un generalista. |
| 3 | **Parallelization** | N workers independientes + aggregator que sintetiza. Ej: 3 revisores paralelos que votan, o 5 búsquedas concurrentes. | Sub-tareas independientes que ganan por latencia y por votación/consenso. |
| 4 | **Orchestrator-workers** | Un planner central descompone dinámicamente, despacha workers y sintetiza resultados. | Tareas donde no podés predecir cuántos pasos ni qué workers necesitás hasta runtime. |
| 5 | **Evaluator-optimizer** | Loop `generator → evaluator → feedback → generator` hasta que el evaluator dice "good enough". | Tareas con criterio de calidad claro y evaluable automáticamente (tests, linter, score). |

### 2.2 El loop agéntico — solo si nada de lo anterior alcanza

```
while (!done && steps < max) {
  thought = LLM.razonar(contexto, tools);
  action  = LLM.elegirTool(thought);
  obs     = ejecutar(action); // bash, read, write, ptyx
  contexto.push(thought, action, obs);
}
```

Es ReAct + memoria + tools. Potente pero: cada iteración suma latencia, tokens O(n²), superficie de error y hace el trace casi imposible de reproducir. Anthropic es explícito: **cuanto más agéntico, peor debugging**.

### 2.3 Tres reglas de oro

- **Evaluá antes de complejizar.** Medí con benchmarks reales (BFCL, SWE-bench, tus propios E2E) antes de agregar un paso o un loop. Si no medís, estás adivinando.
- **Trazabilidad > autonomía.** Un workflow con pasos nombrados y outputs validables se debuggea en minutos; un agente que "decide solo" te deja mirando un log de 200 tool calls sin saber dónde se desvió.
- **Paralelizá cuando puedas.** Si dos sub-tareas no dependen entre sí, correrlas en paralelo baja latencia wall-clock y además te da diversidad (voting/self-consistency).

## 3 Evidencia / Experimentos

El artículo no trae un benchmark único con tabla BLEU; su evidencia es **experiencia de producción + ablations internas** y referencias a evaluaciones estándar:

| Afirmación | Evidencia citada / observable |
|---|---|
| Workflows superan a agente genérico en tareas acotadas | Casos internos Anthropic: `routing` para customer support y `prompt chaining` para extracción bajan error vs single-agent loop. |
| Paralelización baja latencia sin perder calidad | `parallelization` con voting (self-consistency) mejora accuracy y reduce p95 latency vs secuencial. |
| Evaluator-optimizer converge en pocas iteraciones | Loop generator-evaluator en tareas de escritura/código converge en 2-4 iteraciones; más iteraciones rinden marginal. |
| Agentic loop es el más caro y frágil | Cada step agrega ~1-3s + tokens acumulados O(n²); debugging requiere replay completo del trace. |

La lección no es un número sino un principio de ingeniería: **medí latencia, costo y tasa de éxito por patrón antes de elegir**. Si tu workflow de 3 pasos resuelve el 90% de los casos, no pagues el 10× de costo por el 10% restante con un agente.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo usás / sufrís en el repo |
|---|---|
| **Prompt chaining** | `screenshots :3002` (capture → annotate → save) no necesita agente. Es un pipeline determinista con 3 pasos validables. Si lo modelaste como agente, simplificalo. |
| **Routing** | Tu `shared/api/version.ts` ya rutea v1 vs v2; extendé el patrón: `"/help" → workflow docs`, `"fix bug" → agentic loop opencode`, `"screenshot" → workflow capture`. Un classifier LLM pequeño (o regex) al inicio ahorra tokens. |
| **Parallelization** | `external_router.rs` con `probe()` TCP 250ms + `ureq 700/1800ms` + `cached_probe OnceLock 1500ms` ya paraleliza health checks. Llevá la idea a `opencode-stats :8765` (triple-GPU): 3 queries paralelas + aggregator. |
| **Orchestrator-workers** | `DesktopPanelRenderer.tsx` que mantiene `plugin:external:*` montados con `visibility:hidden` es orchestrator-workers bien hecho: un orquestador (grid) despacha workers (iframes) y los mantiene vivos para no reiniciar. No mates procesos al cambiar pestaña (tu fix `ExternalIframePanel.tsx:77`). |
| **Evaluator-optimizer** | Para generación multi-archivo: `Engineer genera diff → QA corre cargo check / tsc -b → feedback → fix`. Tu `kanban.json` puede ser el evaluator que decide si la tarjeta avanza de columna. |
| **Agentic loop (último recurso)** | Solo para `opencode serve :4096/:4097` con task de coding abierto ("arreglá este bug sin spec completa"). Ahí sí necesitás ReAct + `ptyx :4849` + `fsx` + `gitx`. Todo lo demás, workflow. |

```ts
// web/src/features/orchestrator/router.ts — routing mínimo antes de pagar agente
type Route = "workflow:capture" | "workflow:docs" | "agent:code" | "agent:research";
function route(input: string): Route {
  if (input.startsWith("/help") || input.startsWith("/docs")) return "workflow:docs";
  if (input.includes("screenshot") || input.includes("capture")) return "workflow:capture";
  if (input.length < 40 && !input.includes("fix") && !input.includes("implement")) return "workflow:docs";
  return "agent:code"; // solo lo complejo paga loop
}
```

## 5 Anti-patterns / Limitaciones

- **El agente genérico que hace todo.** Un solo loop ReAct para screenshots, docs, code y stats es el anti-pattern #1. Cada dominio merece su workflow; el agente genérico alucina, se pierde y es imposible de evaluar.
- **Agregar autonomía sin métrica.** "Le agrego reflexión / planning porque suena bien" sin medir BFCL/SWE-bench o tus E2Es es sobrediseño garantizado. Cada paso debe justificarse con delta medible.
- **Matar workers al cambiar de contexto.** Tu bug histórico `shell.external.stop` en cleanup de `ExternalIframePanel` al cambiar pestaña es exactamente lo que el paper advierte: orquestador que destruye workers pierde estado y paga reinicio. Fix: `visibility:hidden` + `position:absolute`, no unmount.
- **Loop sin límite ni evaluator.** Un `while(true)` agéntico sin `max_steps`, sin `evaluator` y sin `timeout` es un leak de tokens y plata. Siempre definí criterio de parada y presupuesto.
- **Confundir orquestación con chat libre.** Orquestar no es "que los agentes chateen entre sí sin control" (ver AutoGen/MetaGPT). Es descomposición con artefactos tipados y validables.

## 6 Ejercicios prácticos (en tu repo)

1. **Clasificá tus 5 plugins externos en workflow vs agente.** Tomá `external_router.rs:19` (`opendesign :3000/daemon :3456`, `screenshots :3002`, `vioeditor :1420`, `informes :5174`, `widgetnotas`). Para cada uno, decidí: ¿es workflow determinista o necesita loop agéntico? Reescribí `screenshots` como `prompt chaining` de 3 pasos con validación entre pasos y medí p95 latency antes/después.

2. **Implementá routing antes del agente.** En `web/src/shared/api/client.ts`, agregá un classifier previo a `sendPrompt`: si el input matchea `^/(help|docs)` o es < 40 chars sin verbo de acción, rutear a workflow local sin llamar a `opencode serve`. Logueá cuántos requests te ahorrás en una sesión de 20 turnos.

3. **Evaluator-optimizer para `kanban`.** Definí un evaluator que corre `tsc -b && cargo check` tras cada diff generado por el agente. Si falla, el optimizer (mismo LLM con prompt de fix) reintenta hasta 3 veces. Mide tasa de tarjetas que pasan de "Doing" a "Done" sin intervención manual vs loop sin evaluator.

## 7 Referencias

- **Artículo:** Anthropic Engineering, *Building Effective Agents*, Dic 2024 — https://www.anthropic.com/engineering/building-effective-agents
- **Patrones relacionados en esta serie:** ReAct (Yao et al. 2022), Self-Consistency (Wang et al. 2022), AutoGen (Wu et al. 2023), MetaGPT (Hong et al. 2023).
- **Para medir tu harness:** BFCL (Berkeley Function Calling), SWE-bench, GAIA — ver carpeta `05-Evaluacion`.
- **Código en tu repo:** `desktop-app/src/infrastructure/http/external_router.rs`, `web/src/components/ExternalIframePanel.tsx:77`, `web/src/components/DesktopPanelRenderer.tsx:313`.

---

## Checklist de lectura

- [ ] Leí el artículo original completo y entiendo los 5 workflows + cuándo usar loop agéntico
- [ ] Puedo clasificar una tarea nueva en workflow vs agente en < 2 minutos con criterio
- [ ] Identifiqué 1 parte de `desktop-app` o `web/src` que hoy es agente y debería ser workflow (o viceversa)
- [ ] Anoté 1 idea para probar en `external_router` / `kanban` / `ptyx` esta semana
- [ ] Link guardado en favoritos / Zotero

*Generado para sección Papers — 03 Agentes · opencode-remote-android*
