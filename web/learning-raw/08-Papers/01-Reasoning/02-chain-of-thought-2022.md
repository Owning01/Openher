# Chain-of-Thought — Razonar paso a paso (Wei et al., 2022)

> **Autores:** Wei, Wang, Schuurmans, Bosma, Ichter, Xia, Chi, Le, Zhou / Google Research
> **Año:** 2022 · **Prioridad:** Imprescindible · **Lectura:** ~18 min
> **Link verificado:** [https://arxiv.org/abs/2201.11903](https://arxiv.org/abs/2201.11903)
> **Categoría Papers:** 01 Reasoning · **Nivel:** avanzado · **Versión:** NeurIPS 2022

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Chain-of-Thought Prompting Elicits Reasoning in Large Language Models (Wei et al., NeurIPS 2022).
> **Link:** https://arxiv.org/abs/2201.11903
> **Relevancia para opencode-remote-android:** es la técnica más barata para que tu agente deje de alucinar en tareas multi-paso (mover archivos, fix de build, análisis de logs) sin tocar pesos. Tu `ThinkingBlock` ya la muestra — ahora hay que forzarla en el prompt.
> **Prioridad:** Imprescindible · **Tiempo:** 18 min

## 1 Introducción — Qué problema resuelve

Los LLMs responden bien a preguntas directas, pero se caen a pedazos en tareas que requieren razonar en varios pasos: matemática de primaria (GSM8K), sentido común (StrategyQA), manipulación simbólica (invertir letras). El prompting estándar —dar ejemplos con pregunta → respuesta final— no alcanza: el modelo salta directo a la respuesta y pifia.

Chain-of-Thought (CoT) propone algo ridículamente simple: en los ejemplos few-shot, **mostrá el razonamiento intermedio paso a paso**, no solo la respuesta. En lugar de `Q → A`, usás `Q → razonamiento → A`. Y para zero-shot, basta agregar *"Let's think step by step"* al final del prompt.

Resultado: sin entrenar nada, solo cambiando el prompt, PaLM 540B pasa de 17.9% a **58.1% en GSM8K**. Es el paper que hizo que todo harness serio separara `reasoning` de `tool_call` en el SSE.

## 2 Ideas clave

### 2.1 Few-shot CoT — Ejemplos con pasos intermedios

Prompt estándar:

```
Q: Roger tiene 5 pelotas. Compra 2 latas de 3 pelotas. ¿Cuántas tiene?
A: 11
```

Prompt CoT:

```
Q: Roger tiene 5 pelotas. Compra 2 latas de 3 pelotas. ¿Cuántas tiene?
A: Roger tenía 5. 2 latas × 3 = 6 pelotas nuevas. 5 + 6 = 11. Respuesta: 11
```

Con 8 ejemplos así, el modelo aprende a descomponer cualquier problema nuevo en sub-pasos que ya vio en pre-training. No es magia: es obligarlo a generar tokens intermedios donde puede apoyarse.

### 2.2 Zero-shot CoT — La frase mágica

Kojima et al. (2022) mostraron que sin ningún ejemplo, basta agregar:

```
Q: Roger tiene 5 pelotas...
A: Let's think step by step.
```

Con solo esa línea, MultiArith sube de **17.7% → 78.7%** y GSM8K de 10.4% → 40.7% (PaLM 540B). Dos líneas de prompt, cero ejemplos.

### 2.3 Solo emerge con escala

CoT **no funciona con modelos chicos**. Con PaLM 8B o 62B la mejora es marginal; recién a partir de ~100B parámetros el salto es dramático. Es una *emergent ability*: el modelo necesita suficiente capacidad para generar razonamiento coherente. Si tu Phi-3 3.8B local no mejora con CoT, no es que lo hiciste mal — es que no tiene escala.

```
PaLM 8B   — GSM8K:  4.1% →  4.8% con CoT  (nada)
PaLM 62B  — GSM8K:  9.6% → 33.0% con CoT  (salto)
PaLM 540B — GSM8K: 17.9% → 58.1% con CoT  (explota)
```

### 2.4 Por qué funciona — Descomposición, no longitud

Ablation clave del paper: si hacés que el modelo genere respuestas *más largas* pero sin razonamiento útil (ej: repetir la pregunta), no mejora. El contenido del paso intermedio importa, no la longitud. CoT funciona porque descompone el problema en sub-tareas que el modelo ya sabe resolver por separado.

## 3 Evidencia / Experimentos

| Benchmark | Tipo | PaLM 540B estándar | PaLM 540B + CoT | Ganancia |
|---|:---:|:---:|:---:|:---:|
| **GSM8K** | Aritmética (8.5k problemas) | 17.9% | **58.1%** | +40.2pp |
| **SVAMP** | Aritmética variada | 38.9% | **74.8%** | +35.9pp |
| **MAWPS** | Word problems | 57.9% | **87.0%** | +29.1pp |
| **AQuA** | Álgebra múltiple choice | 31.9% | **35.8%** | +3.9pp |
| **StrategyQA** | Sentido común | 73.9% | **81.6%** | +7.7pp |
| **Coin flip** | Simbólico | 50.0% | **93.0%** | +43.0pp |
| **Last letters** | Concatenación | 0.2% | **66.0%** | +65.8pp |
| **MultiArith (zero-shot CoT)** | Aritmética | 17.7% | **78.7%** | +61.0pp |

- Evaluado en PaLM 540B, LaMDA 137B, GPT-3 175B, UL2 20B — CoT mejora en todos, pero proporcional a escala.
- Con UL2 20B (más chico) la ganancia en GSM8K es solo ~5pp — confirma la ley de escala.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **Razonamiento intermedio explícito** | Tu `ThinkingBlock` + `footerInfoMap` ya renderizan `reasoning`. Ahora forzá que el agente *siempre* genere `Thought:` antes de cada `Action`. Template en system prompt: `Thought: [3 pasos numerados] → Action: shell.fs.*`. Ver `web/src/shared/api/prompts.ts` o donde armes el system prompt. |
| **Separar reasoning de tool_call en SSE** | En `web/src/shared/sse/handler.ts`, el evento `message.part.delta` trae `part.type`. Tipá `reasoning` separado de `tool_call` / `tool_result`. No los mezcles en un string — el `Thought` debe ser parseable para debug y para el próximo turno ReAct. |
| **Zero-shot CoT para prompts baratos** | En `external_router` (`desktop-app/src/infrastructure/http/external_router.rs`), cuando el agente llama a un plugin externo, anteponé al prompt: `"Pensá paso a paso antes de llamar a fs.read. Numerá tus pasos."` — mejora sin ejemplos few-shot. |
| **CoT + ReAct** | CoT solo razona; ReAct (paper 04) intercala `Thought → Action → Observation`. Tu SSE ya es ReAct — CoT es el `Thought` dentro de cada turno. Usá CoT para que cada `Thought` sea rico, no un "voy a leer el archivo" genérico. |
| **Escala y routing** | Si rutás a Phi-3 3.8B local, no esperes el salto de CoT del paper (necesita 100B+). Para Phi-3, CoT ayuda pero marginal. Reservá CoT pesado para el modelo remoto grande; para local usá PAL (paper 10) o prompts más cortos. |
| **Compaction con CoT** | Cuando compactás historial con `miser/ultra` en IndexedDB v2, no resumas solo la respuesta final — guardá también el `Thought` clave. Si perdés el razonamiento, el próximo turno arranca sin contexto de *por qué* se hizo algo. |

```ts
// web/src/shared/api/prompts.ts — system prompt con CoT forzado
const SYSTEM_COT = `
Sos un agente que razona ANTES de actuar.
Formato obligatorio en cada turno:
Thought: 1) Qué necesito averiguar 2) Qué herramienta usar 3) Qué espero encontrar
Action: shell.fs.* o shell.ptyx.*
Observation: (te la da el harness)
Si no seguís este formato, tu respuesta será rechazada.
`.trim();
```

## 5 Anti-patterns / Limitaciones

- **CoT alucina si no se verifica.** El modelo puede generar un razonamiento que *suena* lógico pero es falso, y luego concluir con confianza. CoT sin verificación externa (Self-Consistency, PAL con ejecución, Reflexion) es peligroso en tareas críticas. No lo uses solo para reportes PTES sin validar.
- **Costo ×2-3 en tokens.** Cada `Thought` de 100-300 tokens se paga. En conversaciones largas, CoT duplica el contexto. Compensá con compaction inteligente (ver `Effective Context Engineering`).
- **No sirve para tareas triviales.** Para `/help`, `list_dir` o `fs.read` directo, forzar CoT es overhead. Usá workflow determinista — no todo necesita razonar (Anthropic: *Building Effective Agents*).
- **Modelos chicos no despegan.** No insistas con CoT elaborado en Phi-3 3.8B si no ves ganancia. Mejor invertí en PAL (ejecutar código) o en un reranker.
- **Zero-shot CoT en español.** *"Pensemos paso a paso"* funciona, pero el paper evalúa en inglés. Si tu prompt está en español, testeá ambas variantes — a veces el inglés sigue rindiendo mejor incluso con prompt en español.

## 6 Ejercicios prácticos (en tu repo)

1. **Forzá CoT en el system prompt y medí.** Reescribí tu system prompt para obligar `Thought: 1) ... 2) ... 3) ...` antes de cada tool call. Corré 5 tareas de SWE-bench Lite (o 5 fixes reales en `desktop-app`) con y sin CoT. Medí `pass rate` y `turnos hasta éxito`. ¿Cuánto mejora? ¿Cuántos tokens extra pagás?

2. **Separá reasoning en el SSE handler.** En `web/src/shared/sse/handler.ts`, parseá `message.part.delta` y separá `type: "reasoning"` vs `"tool_call"`. Renderizá el `reasoning` en `ThinkingBlock` colapsable y el `tool_call` con badge de estado (como `probe 250ms` de `external_router`). Logueá proporción reasoning/tool por sesión — ¿cuándo el modelo razona de más sin actuar?

3. **Zero-shot CoT vs few-shot CoT.** Armá dos variantes del prompt para una tarea de `fsx` multi-paso (ej: "encontrá todos los TODOs en `web/src` y proponé un plan de fix"): una con solo *"Pensá paso a paso"* y otra con 2 ejemplos few-shot con razonamiento. Medí calidad del plan y tokens usados. ¿Justifica few-shot el costo extra?

## 7 Referencias

- **Paper:** Wei et al., *Chain-of-Thought Prompting Elicits Reasoning in Large Language Models*, NeurIPS 2022 — https://arxiv.org/abs/2201.11903
- **Zero-shot:** Kojima et al., *Large Language Models are Zero-Shot Reasoners* (2205.11916) — la frase *"Let's think step by step"*.
- **Relacionados en esta serie:** Self-Consistency (2203.11171), ReAct (2210.03629), Tree-of-Thoughts (2305.10601), Reflexion (2303.11366).
- **Guía práctica:** Anthropic, *Building Effective Agents* — cuándo usar CoT vs workflow determinista.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (ejemplo CoT vs estándar) del paper original
- [ ] Entiendo la diferencia entre few-shot CoT y zero-shot CoT y cuándo usar cada uno
- [ ] Sé por qué CoT solo emerge con modelos >100B y qué implica para Phi-3 local
- [ ] Anoté 1 idea para probar en `web/src/shared/api/prompts.ts` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 01 Reasoning · opencode-remote-android*
