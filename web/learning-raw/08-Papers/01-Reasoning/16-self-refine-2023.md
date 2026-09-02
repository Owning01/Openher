# Self-Refine — Iterar con feedback propio sin tools externas (Madaan et al., 2023)

> **Autores:** Madaan, Tandon, Gupta, Hallinan, Gao, Wiegreffe, Alon, Dziri, Prabhumoye, Yang, Gupta, Rajagopal, Bergstrom, Clark, Neubig / AllenAI + CMU
> **Año:** 2023 · **Prioridad:** MEDIA P1 · **Lectura:** ~13 min
> **Link verificado:** [https://arxiv.org/abs/2303.17651](https://arxiv.org/abs/2303.17651)
> **Categoría Papers:** 01 Reasoning · **Nivel:** intermedio · **Versión:** NeurIPS 2023

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Self-Refine: Iterative Refinement with Self-Feedback (Madaan et al., NeurIPS 2023).
> **Link:** https://arxiv.org/abs/2303.17651
> **Relevancia para opencode-remote-android:** es el loop más barato para mejorar outputs sin llamar tools externas ni reentrenar: el mismo LLM genera → se critica → se corrige, iterando 2-3 veces. Ideal como *pre-procesamiento* antes de llamar a `ptyx :4849` o `fsx` — pule el código/plan en texto antes de ejecutarlo, ahorrando round-trips caros.
> **Prioridad:** MEDIA P1 · **Nuevo vs Reflexion:** Reflexion itera *entre* trials con memoria persistida y evaluator externo; Self-Refine itera *dentro* de un trial con feedback del mismo LLM, sin tools.

## 1 Introducción — Qué problema resuelve

Los LLMs generan una respuesta y la entregan, aunque tenga errores obvios que el mismo modelo podría detectar si se le pidiera revisar. Ejemplo: genera una función con un off-by-one, pero si le preguntás "¿qué falla en este código?" lo identifica y lo corrige.

Self-Refine explota esto con un loop de 3 roles del **mismo LLM**:

1. **Generate:** produce output inicial (código, texto, plan).
2. **Feedback:** critica su propio output ("línea 3: índice fuera de rango, debería ser `n-1`").
3. **Refine:** genera versión mejorada usando el feedback.

Repite Feedback → Refine 2-3 veces o hasta que el feedback diga "está bien". Sin tools externas, sin `cargo check`, sin retriever — solo el LLM hablándose a sí mismo. Resultado: **+20% en code, math y diálogo** con el mismo modelo.

Para tu thin client, Self-Refine es el filtro barato antes del caro: pule el `tool_call` en texto (sin ejecutar) y solo llama a `ptyx :4849` cuando el self-feedback dice "ok".

## 2 Ideas clave

### 2.1 Loop de 3 prompts — Mismo modelo, 3 roles

```
Input: "Escribí una función que invierta un string"

Generate:  "def reverse(s): return s[::-1]"  (o con bug)
     ↓
Feedback:  "El código es correcto pero no maneja None. Además, falta docstring."
     ↓
Refine:    "def reverse(s):\n    if s is None: return None\n    return s[::-1]"
     ↓
Feedback:  "Ahora está bien. No hay más issues."
     ↓
Stop → output final
```

Cada rol es un prompt distinto al mismo LLM:

- **Generate prompt:** `"Task: {task}\nGenerá una solución."`
- **Feedback prompt:** `"Task: {task}\nOutput: {output}\nDame feedback constructivo: ¿qué está mal o puede mejorar? Sé específico."`
- **Refine prompt:** `"Task: {task}\nOutput: {output}\nFeedback: {feedback}\nGenerá una versión mejorada que incorpore el feedback."`

### 2.2 Sin herramientas externas — Puro LLM

A diferencia de Reflexion (que necesita `cargo check` como evaluator) o PAL (que ejecuta código), Self-Refine no llama a nada externo. El feedback es **generado por el mismo LLM** — no verificado. Esto lo hace:

- **Barato:** 3 llamadas LLM sin I/O de tools, sin `ptyx` RTT, sin `polling 3.5s`.
- **Ruidoso:** el feedback puede ser incorrecto — el LLM puede criticar algo que está bien o no ver un bug real.

Por eso Self-Refine funciona mejor para pulir estilo/claridad/completitud que para corregir bugs lógicos profundos.

### 2.3 Cuándo parar — Feedback dice "está bien" o max iters

Criterios de parada:

- El feedback contiene "no hay más issues" / "está correcto" (el LLM cree que está bien).
- `max_iters = 3` alcanzado (evita loop infinito).
- El output no cambia entre iteraciones (converge).

El paper usa `max_iters = 3` — más iteraciones dan rendimientos decrecientes y a veces degradan (el LLM empieza a sobre-corregir).

### 2.4 Self-Refine vs Reflexion — Complementarios, no rivales

| Aspecto | Self-Refine | Reflexion |
|---|:---:|:---:|
| **Cuándo itera** | Dentro de un trial (antes de ejecutar) | Entre trials (después de fallar) |
| **Feedback de** | Mismo LLM (sin tools) | Evaluator externo (`cargo check`, tests) |
| **Memoria** | No (cada refine es independiente) | Sí (IndexedDB episódica) |
| **Costo** | 3× LLM calls, sin I/O | 1× LLM + 1× tool por trial |
| **Para qué** | Pulir output antes de ejecutar | Corregir tras fallar en ejecución |

Pipeline ideal: `Self-Refine (pulir) → Exec(ptyx) → si FAIL → Reflexion (corregir con memoria)`.

## 3 Evidencia / Experimentos

Todos con GPT-3.5 / ChatGPT, `max_iters = 3`:

| Tarea | Direct (1 gen) | Self-Refine (3 iters) | Ganancia |
|---|:---:|:---:|:---:|
| **Code optimization** (HumanEval) | 27.2% | **32.1%** | +4.9pp |
| **Code readability** (human pref) | 30.1% | **43.2%** | +13.1pp |
| **Math reasoning** (GSM8K) | 45.2% | **52.8%** | +7.6pp |
| **Dialogue response** (human pref) | 35.4% | **48.7%** | +13.3pp |
| **Sentiment reversal** | 68.1% | **78.4%** | +10.3pp |
| **Acronym generation** | 62.4% | **74.8%** | +12.4pp |

- **+20% promedio** en preferencia humana para diálogo y readability — donde el LLM es buen crítico de sí mismo.
- **+5-8pp en code/math** — menos, porque el LLM no siempre detecta bugs lógicos sin ejecutar.
- **Ablation sin feedback:** solo re-generar sin feedback (generate → generate) no mejora — el feedback es esencial.
- **Iteraciones:** iter 1 → +10pp, iter 2 → +5pp, iter 3 → +2pp — rendimientos decrecientes claros.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto Self-Refine | Dónde lo aplicás en el repo |
|---|---|
| **Pulir `tool_call` antes de `ptyx :4849`** | Antes de ejecutar `shell.fs.write` o `shell.ptyx.exec`, hacé Self-Refine local con Phi-3 barato: `Generate(code) → Feedback("¿qué puede fallar?") → Refine(code)`. Solo llamás a `ptyx :4849` con el código refinado. Ahorra 1 RTT si el código inicial tenía un bug obvio que el self-feedback detecta. |
| **Phi-3 local para Self-Refine barato** | No uses GPT-4 remoto para Self-Refine — es desperdicio. Usá Phi-3 3.8B o R1-Distill-1.5B local en `desktop-app` sidecar para el loop Generate→Feedback→Refine (3 calls baratas), y solo el output final va al modelo grande o a `ptyx`. |
| **Pre-filtro para `external_router`** | Antes de llamar a un plugin externo (`opendesign 3000`, `screenshots 3002`) con `probe 250ms`, Self-Refine puede pulir los parámetros del `tool_call` (ej: path correcto, formato JSON válido) sin pagar el `ureq 1800ms` de un call fallido. |
| **Combinar con Reflexion para pipeline completo** | `Self-Refine (3 iters, sin tools) → Exec(ptyx) → si FAIL → Reflexion (con evaluator + memoria IndexedDB) → Retry`. Self-Refine reduce la tasa de FAIL inicial; Reflexion maneja los FAIL que quedan con feedback verificado. |
| **IndexedDB — no necesita memoria** | Self-Refine no persiste nada entre calls — es intra-trial. No toques `IndexedDB v2` para esto. Guardá solo el output final refinado como mensaje en la sesión, no los intermedios. |
| **SSE — Self-Refine es invisible al usuario** | El loop Generate→Feedback→Refine ocurre antes de emitir `message.part.delta`. El usuario solo ve el `tool_call` final refinado, no los borradores. Si querés debug, logueá los intermedios en `console.debug` pero no en SSE. |

```ts
// web/src/shared/api/selfRefine.ts — loop intra-trial barato
async function selfRefine(
  task: string,
  maxIters = 3,
  llm = callLocalSLM // Phi-3 local, barato
): Promise<string> {
  let output = await llm(`Task: ${task}\nGenerá una solución.`);
  for (let i = 0; i < maxIters; i++) {
    const feedback = await llm(
      `Task: ${task}\nOutput:\n${output}\n\nDame feedback constructivo y específico: ¿qué está mal o puede mejorar? Si está bien, decí "OK".`
    );
    if (feedback.trim().toLowerCase().includes("ok") || feedback.includes("está bien")) break;
    const refined = await llm(
      `Task: ${task}\nOutput:\n${output}\nFeedback:\n${feedback}\n\nGenerá una versión mejorada que incorpore el feedback.`
    );
    if (refined.trim() === output.trim()) break; // converge
    output = refined;
  }
  return output;
}

// Uso: pule el código antes de ptyx
const code = await selfRefine("Escribí fs.write para crear manifest.json con...", 2);
await callTool("shell.ptyx.exec", { command: code }); // solo el refinado
```

## 5 Anti-patterns / Limitaciones

- **Feedback alucinado.** El LLM puede generar feedback incorrecto ("esta línea está mal" cuando está bien) y el refine empeora el output. Self-Refine sin verificación externa es riesgoso para bugs lógicos — usalo para pulir estilo/completitud, no para corregir lógica crítica. Para lógica, PAL (ejecutar) o Reflexion (evaluator) son superiores.
- **Sobre-refinamiento.** Con `max_iters > 3`, el LLM empieza a hacer cambios innecesarios y a veces degrada. El paper muestra que iter 3 aporta solo +2pp — no hagas 5 iters.
- **No reemplaza ejecución.** Si podés verificar con `cargo check` o `tsc -b` en `ptyx :4849`, hacelo — es verdad externa vs opinión del LLM. Self-Refine es para cuando ejecutar es caro o no tenés evaluator (ej: redacción, diseño de plan).
- **Costo 3× LLM calls.** Aunque sean con Phi-3 local barato, son 3 calls. Para tareas triviales (`list_dir`, `fs.read` simple), es overhead — usá Self-Refine solo para generación de código/planes no triviales.
- **Mismo modelo para los 3 roles.** Si usás GPT-4 para Generate y Phi-3 para Feedback, el feedback será peor que el output — no tiene sentido. Usá el mismo modelo (o uno de capacidad similar) para los 3 roles.

## 6 Ejercicios prácticos (en tu repo)

1. **Implementá Self-Refine para pulir `tool_call` y medí.** Creá `web/src/shared/api/selfRefine.ts` con `maxIters=2` usando Phi-3 local (o GPT-3.5 si no tenés local). Para 10 tareas de generación de código (ej: "escribí un handler para `fs_router.rs`"), compará `direct (1 gen) → exec ptyx` vs `self-refine (2 iters) → exec ptyx` en `pass rate` de `cargo check` y `tokens usados`. ¿Self-Refine reduce FAIL inicial?

2. **Pipeline Self-Refine → Exec → Reflexion.** Armá el pipeline completo: `Self-Refine (2 iters, Phi-3 local) → Exec(ptyx :4849) → si FAIL → Reflexion (feedback de ptyx + memoria IndexedDB) → Retry (max 2)`. Medí en 10 tareas con bug intencional: ¿cuántas se resuelven en Self-Refine sin llegar a Reflexion? ¿Cuántas necesitan Reflexion? Documentá la tasa por etapa.

3. **Detectá sobre-refinamiento.** Corré Self-Refine con `maxIters=5` en 5 tareas y calificá cada iteración 1-5 (¿mejora, igual o empeora?). ¿A partir de qué iter el output empieza a degradar o a hacer cambios cosméticos? Validá que `maxIters=3` sea el sweet spot del paper en tu dominio.

## 7 Referencias

- **Paper:** Madaan et al., *Self-Refine: Iterative Refinement with Self-Feedback*, NeurIPS 2023 — https://arxiv.org/abs/2303.17651
- **Relacionado Reflexion:** Shinn et al. (2303.11366) — paper 06, iteración *entre* trials con evaluator externo vs Self-Refine *intra*-trial.
- **Base CoT:** Wei et al. (2201.11903) — paper 02, el razonamiento que Self-Refine pule.
- **Orca:** Mukherjee et al. (2306.02707) — paper 15, destilación con traces vs Self-Refine sin traces.
- **Patrón harness:** Anthropic, *Building Effective Agents* — Self-Refine como *evaluator-optimizer* intra-trial.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (diagrama Generate→Feedback→Refine) del paper original
- [ ] Entiendo la diferencia entre Self-Refine (intra-trial, sin tools) y Reflexion (inter-trial, con evaluator)
- [ ] Sé cuándo usar Self-Refine (pulir antes de ejecutar) vs PAL/Reflexion (verificar con ejecución)
- [ ] Tengo claro por qué `maxIters=3` y por qué más iters puede degradar
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 01 Reasoning · opencode-remote-android*
