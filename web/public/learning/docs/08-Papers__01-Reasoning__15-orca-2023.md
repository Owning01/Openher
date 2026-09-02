# Orca — Imitación progresiva de GPT-4 con explanation traces (Mukherjee et al., 2023)

> **Autores:** Mukherjee, Mitra, Jawahar, Agarwal, Palangi, Awadallah / Microsoft Research
> **Año:** 2023 · **Prioridad:** MEDIA P1 · **Lectura:** ~13 min
> **Link verificado:** [https://arxiv.org/abs/2306.02707](https://arxiv.org/abs/2306.02707)
> **Categoría Papers:** 01 Reasoning · **Nivel:** intermedio · **Versión:** arXiv 2023-06-14 (Orca-1) · Orca-2: 2311.11045

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados. Orca usa traces de GPT-4 — verificá términos de uso de OpenAI antes de replicar.

---

> **Paper:** Orca: Progressive Learning from Complex Explanation Traces of GPT-4 (Mukherjee et al., 2023).
> **Link:** https://arxiv.org/abs/2306.02707 — Orca-2: https://arxiv.org/abs/2311.11045
> **Relevancia para opencode-remote-android:** es la receta más citada para **destilar un SLM local** que supere a modelos 2× más grandes. Si querés que tu Phi-3/R1-Distill local rinda como GPT-4 en tu dominio (code, reasoning, tool use), Orca te dice cómo: no destiles respuestas, destilá *explicaciones paso a paso* de GPT-4.
> **Prioridad:** MEDIA P1 · **Nuevo vs destilación clásica:** no imita solo outputs, imita *traces* con razonamiento.

## 1 Introducción — Qué problema resuelve

La destilación clásica entrena un modelo chico para imitar las respuestas finales de uno grande: GPT-4 dice "11", el chico aprende a decir "11". Funciona, pero el chico no aprende *cómo* llegó GPT-4 a "11" — solo memoriza el resultado. En tareas de razonamiento, eso no alcanza: Vicuna 13B (destilado de ChatGPT sin explanations) rinde la mitad que Orca 13B.

Orca propone **progressive learning from explanation traces**: pedí a GPT-4 que no solo responda, sino que explique paso a paso *cómo* razona, y entrená al chico con esos traces completos (input → explanation trace → answer). El chico aprende el proceso, no solo el producto.

Resultado: **Orca 13B supera a Vicuna 13B por +100% en AGIEval** y casi empata con ChatGPT, con los mismos 13B parámetros. La diferencia es puro dato de entrenamiento — no arquitectura.

## 2 Ideas clave

### 2.1 Explanation traces — No solo la respuesta, el camino

Destilación clásica (Vicuna):

```
Input:  "Roger tiene 5 pelotas, compra 2 latas de 3. ¿Cuántas?"
Target: "11"   ← solo la respuesta
```

Orca:

```
Input:  "Roger tiene 5 pelotas, compra 2 latas de 3. ¿Cuántas?"
Target: "Roger tenía 5 pelotas.
         Cada lata tiene 3 pelotas, así que 2 latas = 2×3 = 6 pelotas nuevas.
         Total = 5 + 6 = 11.
         Respuesta: 11"   ← razonamiento + respuesta
```

El prompt a GPT-4 para generar traces incluye: *"Explicá paso a paso tu razonamiento antes de dar la respuesta final. Sé detallado."* — con 3 system prompts distintos para diversidad.

### 2.2 Progressive learning — De fácil a difícil

Orca no entrena con todos los traces mezclados. Usa currículum:

1. **Stage 1:** traces de **ChatGPT** (5M) — más simples, respuestas directas con explicación básica. El chico aprende a seguir instrucciones y explicar.
2. **Stage 2:** traces de **GPT-4** (1M) — más complejos, razonamiento profundo, casos edge. El chico refina con el mejor profesor.

Es como escuela: primero maestro bueno (ChatGPT), luego maestro excelente (GPT-4). Entrenar directo con GPT-4 sin pasar por ChatGPT rinde peor — el salto es muy grande.

### 2.3 5M traces — Escala del dataset

| Fuente | Cantidad | Tipo |
|---|:---:|:---|
| **FLAN-v2** (via ChatGPT) | ~3M | Instruction tuning con explanations |
| **ChatGPT self-instruct** | ~2M | Queries sintéticas con traces |
| **GPT-4 traces** | ~1M | Queries complejas con explanations detalladas |
| **Total** | **~5M + 1M** | |

El dataset base es FLAN-v2 (colección de 1,400+ tasks) — Orca lo re-etiqueta pidiendo a GPT-4/ChatGPT que agreguen explanations. No es data nueva, es *re-explicación* de data existente.

### 2.4 Orca-2 — Enseñar a razonar con estrategias

Orca-2 (Nov 2023) va más allá: no solo imita traces, enseña **estrategias de razonamiento** (CoT, ReAct, PAL) explícitamente. El prompt a GPT-4 incluye: *"Resolvé este problema usando [estrategia]. Explicá qué estrategia elegís y por qué."* — el chico aprende a *elegir* cómo razonar, no solo a copiar un estilo.

## 3 Evidencia / Experimentos

| Benchmark | Vicuna 13B | Orca 13B | ChatGPT | GPT-4 | Orca vs Vicuna |
|---|:---:|:---:|:---:|:---:|:---:|
| **AGIEval** (exams) | 24.1% | **48.9%** | 53.0% | 68.4% | **+103%** |
| **BBH** (hard reasoning) | 30.2% | **45.1%** | 49.1% | 68.2% | +49% |
| **GSM8K** | 12.3% | **38.4%** | 45.2% | 56.8% | +212% |
| **SAT** | 28.4% | **54.1%** | 58.2% | 71.3% | +90% |
| **LSAT** | 21.1% | **33.4%** | 38.4% | 52.1% | +58% |
| **WMT En-De** (BLEU) | 18.2 | **24.1** | 25.3 | 28.4 | +32% |

- **AGIEval +103%:** Orca duplica a Vicuna con mismos 13B — solo por explanation traces.
- **Casi ChatGPT:** Orca 13B empata con ChatGPT en AGIEval (48.9% vs 53.0%) con 1/10 de parámetros de GPT-3.5.
- **Orca-2 13B** supera a Orca-1 en reasoning: BBH 45.1% → 51.3%, GSM8K 38.4% → 47.2%.
- **Ablation sin explanations:** entrenar Orca solo con respuestas (sin traces) cae a ~Vicuna — las explanations son el diferencial.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto Orca | Dónde lo aplicás en el repo |
|---|---|
| **Destilar tu harness con traces** | Tenés el caso perfecto: generá 500-1000 traces con GPT-4 remoto para tareas de tu repo (ej: "migrar endpoint X", "fix cargo check error Y", "resumir sesión de 50 mensajes") con prompt que pida explanation trace paso a paso. Fine-tuneá Phi-3 3.8B o Qwen-7B local con esos traces (LoRA, 1-3 epochs). El SLM local aprende tu dominio. |
| **Prompt para generar traces** | Usá el template Orca para pedir traces a GPT-4: `"Resolvé esta tarea paso a paso. Explicá tu razonamiento en 3-5 pasos numerados antes de dar la respuesta/solución. Sé específico con archivos y comandos."` — con 2-3 ejemplos few-shot de tu repo. Cada trace son ~300-500 tokens de explanation + answer. |
| **Progressive: ChatGPT → GPT-4** | Si no tenés presupuesto para 1M traces GPT-4, empezá con 2k traces de GPT-3.5/ChatGPT barato para stage 1, luego 500 traces de GPT-4 para stage 2. El paper muestra que el orden importa — no mezcles. |
| **Orca-2: enseñar estrategias** | Para tu SLM, no solo destiles traces genéricos — enseñá *cuándo* usar cada estrategia: CoT para math, ReAct para multi-step con tools, PAL para cálculo. Prompt: `"Elegí la mejor estrategia (CoT/ReAct/PAL) para esta tarea y explicá por qué antes de resolver."` |
| **`ptyx :4849` como verificador** | A diferencia de Orca original (que no verifica traces), vos podés ejecutar cada trace en `ptyx` y filtrar solo los que pasan `cargo check` / `tsc -b`. Dataset limpio = mejor destilación. Guardá traces verificados en IndexedDB v2 o en `web/docs/traces/` para fine-tuning. |
| **Comparar con R1-Distill** | R1-Distill (paper 07) también destila traces pero con RL + long CoT de 10k tokens. Orca es más simple (SFT con explanations de 500 tokens) y más barato. Para tu repo, probá ambos: Orca-style para tareas generales, R1-style para reasoning pesado (math/code). |

```python
# scripts/generate_orca_traces.py — generar dataset Orca-style para tu repo
import openai

PROMPT_ORCA = """Sos un experto en opencode-remote-android.
Tarea: {task}
Instrucciones: Resolvé paso a paso. Numerá tu razonamiento en 3-5 pasos,
explicá qué archivos tocás y por qué, y da la solución final.
Formato:
Razonamiento:
1. ...
2. ...
3. ...
Solución:
```"""

tasks = [
    "Migrá el endpoint /shell/fs/move de api.rs a fs_router.rs",
    "Fix: cargo check falla por missing import en external_router.rs",
    "Resumí esta sesión de 30 mensajes preservando decisiones clave",
    # ... 500-1000 tasks de tu backlog
]

for task in tasks:
    trace = openai.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": PROMPT_ORCA.format(task=task)}],
        temperature=0.7,
    )
    # Verifica en ptyx :4849 si aplica, guarda solo si pasa
    save_trace(task, trace.choices[0].message.content)
```

## 5 Anti-patterns / Limitaciones

- **Traces sin verificación = basura destilada.** Si GPT-4 genera un trace con un fix que no compila y lo destilás igual, el chico aprende a generar fixes rotos. Filtrá traces ejecutando en `ptyx :4849` (`cargo check`, `tsc -b`) y descartá los que fallan. Orca original no hace esto — vos sí podés y debés.
- **No destiles respuestas sin explanations.** El paper demuestra que sin traces, Orca cae a Vicuna. Si tu dataset son solo pares `input → output` sin razonamiento, no esperes el +100% — necesitás el `explanation trace` intermedio.
- **Términos de uso de OpenAI.** Generar 1M traces con GPT-4 para entrenar un competidor puede violar ToS de OpenAI (revisá sección de non-compete). Para uso interno en tu thin client no es problema, pero si publicás el modelo destilado, verificá licencia.
- **Progressive importa — no mezcles.** Entrenar con ChatGPT + GPT-4 mezclados rinde peor que secuencial (ChatGPT primero, GPT-4 después). Respetá el currículum.
- **Orca no enseña tool use.** Los traces Orca son texto — no incluyen `tool_call`/`tool_result`. Para tu harness ReAct, necesitás traces con tool use (ver paper de Toolformer o generar traces ReAct con `Thought→Action→Observation`). Orca solo cubre reasoning en texto.

## 6 Ejercicios prácticos (en tu repo)

1. **Generá 50 traces Orca-style y fine-tuneá.** Elegí 50 tareas reales de tu repo (fixes, migraciones, resúmenes). Generá traces con GPT-4 usando el prompt Orca (3-5 pasos + solución), verificá cada uno en `ptyx :4849` y quedate con los que pasan. Fine-tuneá Qwen-1.5B o Phi-3 con LoRA (1 epoch, lr 2e-5) y bencheá en 10 tareas held-out vs base. ¿Mejora?

2. **Compará Orca vs R1-Distill en tu dominio.** Para las mismas 50 tareas, generá traces Orca (explanation 500 tokens) y traces R1 (long CoT 2k+ tokens con `<think>`). Fine-tuneá dos LoRAs separados y compará en 10 tareas de reasoning pesado vs 10 triviales. ¿R1 gana en pesado y Orca en general como predice el paper?

3. **Progressive vs mezclado.** Dividí tus 50 traces en 30 ChatGPT (baratos) + 20 GPT-4 (caros). Entrená variante A: 30 ChatGPT → 20 GPT-4 secuencial (Orca progressive) y variante B: 50 mezclados. Bencheá ambas en AGIEval sample o en tus 10 held-out. ¿Progressive gana como dice el paper?

## 7 Referencias

- **Paper Orca-1:** Mukherjee et al., *Orca: Progressive Learning from Complex Explanation Traces of GPT-4*, 2023-06-14 — https://arxiv.org/abs/2306.02707
- **Paper Orca-2:** Mitra et al., *Orca 2: Teaching Small Language Models How to Reason*, 2023-11-18 — https://arxiv.org/abs/2311.11045
- **Dataset FLAN-v2:** Longpre et al., 2023 — base de 1,400+ tasks que Orca re-etiqueta.
- **Relacionados:** DeepSeek-R1 (2501.12948) — paper 07, destilación con RL + long CoT vs Orca SFT; Self-Refine (2303.17651) — paper 16, refinamiento sin traces externos.
- **Tool use:** Schick et al., *Toolformer* (2302.04761) — para traces con `tool_call` que Orca no cubre.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (diagrama progressive ChatGPT→GPT-4) del paper original
- [ ] Entiendo por qué explanation traces duplican a Vicuna con mismos parámetros
- [ ] Sé la diferencia entre Orca-1 (imitar traces) y Orca-2 (enseñar estrategias)
- [ ] Tengo un plan para generar 50-100 traces de mi dominio y fine-tunear un SLM local
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 01 Reasoning · opencode-remote-android*
