# DeepSeek-R1 — Razonar con RL puro, sin SFT (DeepSeek-AI, 2025)

> **Autores:** DeepSeek-AI Team (Guo, Zhang, Zhu et al.) — DeepSeek
> **Año:** 2025 · **Prioridad:** ALTA P0 · **Lectura:** ~22 min
> **Link verificado:** [https://arxiv.org/abs/2501.12948](https://arxiv.org/abs/2501.12948)
> **Categoría Papers:** 01 Reasoning · **Nivel:** avanzado · **Versión:** arXiv preprint 2025-01-22

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Preprint sin peer review al momento de escribir, pero con artefactos open (traces, destilados en HuggingFace).

---

> **Paper:** DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning (DeepSeek-AI, 2025).
> **Link:** https://arxiv.org/abs/2501.12948 — Destilados: https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B
> **Relevancia para opencode-remote-android:** cambia el juego: demuestra que el razonamiento largo (long CoT 10k+ tokens con self-reflection) puede emerger solo con RL, sin demos humanas. Para tu thin client, la lección práctica es **destilar** esos traces a SLMs locales (Qwen 1.5B–7B) en lugar de entrenar RL vos.
> **Prioridad:** ALTA P0 · **Nuevo vs baseline:** CoT/ToT/Reflexion usan *prompting*; R1 usa *training* con RL puro (GRPO).

## 1 Introducción — Qué problema resuelve

Hasta 2024, todo lo que sabíamos para mejorar razonamiento era prompting: CoT, ToT, Reflexion, Self-Consistency — trucos para exprimir un modelo ya entrenado. Pero ¿puede el razonamiento *emerger* del entrenamiento mismo, sin que un humano escriba ejemplos de "cómo pensar"?

DeepSeek-R1 responde que sí. Entrenan **DeepSeek-V3-Base** (671B MoE) solo con **RL** (sin SFT supervisado) usando recompensa binaria (correcto/incorrecto) + formato (`<think>` tags). Sin mostrarle un solo ejemplo de CoT humano, el modelo espontáneamente aprende a generar *long CoT* de 10k+ tokens con comportamientos que nadie programó: **self-reflection** ("esperá, esto está mal"), **verification** ("verifico el paso 2"), **exploración de alternativas** ("probemos otro enfoque").

Luego destilan esos traces a modelos chicos (1.5B–70B) que superan a GPT-4o en MATH con una fracción del costo. Para vos, la implicancia es directa: no entrenes RL — **destilá**.

## 2 Ideas clave

### 2.1 GRPO — Group Relative Policy Optimization

El algoritmo estrella, variante de PPO sin critic:

```
Para cada prompt, sampleá G = 64 respuestas del policy actual.
Para cada respuesta i, calculá reward rᵢ = accuracy (0/1) + formato (0/1).
Ventaja relativa: Aᵢ = (rᵢ − mean(r)) / std(r)   ← dentro del grupo, no global
Loss:  GRPO = E[ min( ratio·Aᵢ, clip(ratio)·Aᵢ ) ] − β·KL(π || π_ref)
```

- **Sin critic network:** PPO necesita un value model separado (~mismo tamaño que el policy). GRPO lo elimina calculando baseline dentro del grupo de 64 samples — ahorra memoria y cómputo.
- **Recompensa binaria:** `accuracy_reward = 1` si la respuesta final es correcta (verificada con regex/rules), `0` si no. `format_reward = 1` si usa `<think>...</think>` correctamente. Sin reward model aprendido — solo reglas.
- **KL penalty:** evita que el policy se aleje demasiado del modelo base (`β` pequeño).

### 2.2 R1-Zero — RL puro sin SFT cold-start

El experimento más radical: **R1-Zero** parte de `DeepSeek-V3-Base` (sin SFT) y entrena solo con GRPO durante ~10k steps × 64 samples = 640k rollouts.

Observaciones durante training:

- Long CoT crece de ~1k → 10k+ tokens espontáneamente — el modelo "aprende a pensar más".
- Emergen patrones de self-reflection y verification sin haberlos visto en datos.
- Pero R1-Zero tiene problemas: mezcla idiomas, formato inconsistente, legibilidad baja.

Por eso el R1 final añade **600k ejemplos SFT cold-start** (traces curados de R1-Zero + datos generales) antes del RL — estabiliza formato y legibilidad sin perder capacidad de razonamiento.

### 2.3 Distilación — La receta para thin client

800k traces de R1 (671B) → fine-tuning supervisado de modelos pequeños:

| Modelo destilado | MATH-500 | AIME 2024 | vs |
|---|:---:|:---:|:---|
| R1-Distill-Qwen-1.5B | **83.9%** | 28.9% | supera GPT-4o (74% MATH) |
| R1-Distill-Qwen-7B | **92.8%** | 55.5% | cerca de o1 |
| R1-Distill-Llama-8B | 89.1% | 50.4% | — |
| R1-Distill-Qwen-32B | **94.3%** | **72.6%** | supera o1-mini |
| R1 671B | **97.3%** | **79.8%** | supera o1 (96.4% / 79.2%) |

Un modelo de **1.5B destilado supera a GPT-4o** en MATH. Esa es la oportunidad para tu thin client.

### 2.4 Long CoT y el tag `<think>`

R1 fuerza estructura:

```
<think>
El usuario pide migrar api.rs. Primero analizo qué endpoints quedan...
Si muevo /shell/fs/* a fs_router.rs, debo verificar que split_cmd siga...
Alternativa: ¿y si el path tiene espacios? Probemos...
</think>

Respuesta final: migré los endpoints, verifiqué con cargo check...
```

El `format_reward` obliga a usar `<think>` — en inferencia podés separar `reasoning` (dentro de `<think>`) de `answer` (fuera) y mapearlo directo a tu SSE `part.type`.

## 3 Evidencia / Experimentos

| Benchmark | R1 671B | o1 (OpenAI) | GPT-4o | R1-Distill-7B | R1-Distill-1.5B |
|---|:---:|:---:|:---:|:---:|:---:|
| **MATH-500** | **97.3%** | 96.4% | 74.6% | 92.8% | 83.9% |
| **AIME 2024** | **79.8%** | 79.2% | 9.3% | 55.5% | 28.9% |
| **Codeforces** (rating) | **2029** | 1891 | — | — | — |
| **GPQA Diamond** | **71.5%** | 75.7% | 49.9% | 49.1% | 33.8% |
| **LiveCodeBench** | **65.9%** | 63.4% | 32.9% | 37.6% | — |
| **MMLU** | 90.8% | 91.8% | 87.2% | — | — |

- **6/6 reasoning benchmarks:** R1 supera o empata con o1, el modelo de razonamiento de OpenAI.
- **Destilación brutal:** Qwen-32B destilado (72.6% AIME) supera a o1-mini con 1/20 de parámetros.
- **Long CoT observado:** de 1k → 10k+ tokens durante RL — el modelo aprende a asignar más cómputo a problemas difíciles.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto R1 | Dónde lo aplicás en el repo |
|---|---|
| **No entrenes RL, destilá** | No tenés GPU para 640k rollouts GRPO. Bajá `DeepSeek-R1-Distill-Qwen-7B` (o 1.5B para mobile) de HuggingFace, cuantizá a Q4 con `llama.cpp` y correlo como sidecar Rust en `desktop-app` (`:4850` o nuevo puerto). Costo: ~4GB VRAM para 7B Q4. |
| **Routing local vs remoto** | Para razonamiento pesado (plan ToT, Reflexion, análisis de logs), rutear a R1-Distill-7B local es 10-50× más barato que llamar GPT-4/o1 remoto. Para `/help` o `list_dir`, ni siquiera necesitás R1 — Phi-3 alcanza. Definí umbral: `if (taskComplexity > threshold) → R1-Distill else Phi-3`. |
| **Tag `<think>` → SSE `reasoning`** | R1 ya separa `<think>...</think>` de la respuesta. En `web/src/shared/sse/handler.ts`, parseá ese tag y mapeá a `part.type = "reasoning"` vs `"answer"`. Tu `ThinkingBlock` muestra el `<think>` colapsable; el `tool_call` va aparte. Es ReAct nativo. |
| **Long CoT y contexto** | R1 genera 10k+ tokens de razonamiento — eso es O(n²) pesado (ver Attention paper). En tu thin client, no mandes ese CoT completo como historial. Compactá con `miser` o truncá el `<think>` a los últimos 2k tokens antes de `loadSelected`. |
| **IndexedDB como cache de traces** | Guardá traces R1 (thought + answer) en IndexedDB v2 para few-shot futuros. Si el destilado local resuelve bien un tipo de tarea, guardá el trace como ejemplo para Self-Consistency o ToT sin re-llamar. |
| **Evaluación antes de desplegar** | Bencheá tu destilado local en LiveCodeBench y MATH-500 sample antes de confiarle tareas. El paper da números — replicá 20 problemas y verificá que tu Q4 no degrade >5pp vs FP16. |
| **`fsx` / `ptyx :4849` + `external_router`** | R1-Distill local no reemplaza tu `ptyx :4849` ni `fsx` — los complementa: R1 genera el plan/razonamiento (`<think>`), `ptyx` lo ejecuta y `fs_router.rs` verifica. Para `external_router` (`probe 250ms` + `ureq 700ms`), no uses R1 para decidir si un plugin está UP — el `probe` TCP es verdad externa más barata que un CoT de 2k tokens. |

```rust
// desktop-app/src/infrastructure/slm_router.rs — bosquejo sidecar R1-Distill
// Ejecuta R1-Distill-Qwen-7B Q4 vía llama.cpp y expone /shell/slm/reason
use llama_cpp::LlamaModel;

async fn handle_reason(prompt: String) -> String {
    let output = slm.generate(&format!(
        "<think>\nPensá paso a paso sobre: {prompt}\n</think>\n"
    ), 4096).await;
    // Parsea <think>...</think> y resto
    parse_think_tags(&output)
}
```

```ts
// web/src/shared/sse/handler.ts — parsear <think> de R1
function parseR1Output(raw: string): { reasoning: string; answer: string } {
  const m = raw.match(/<think>([\s\S]*?)<\/think>\s*([\s\S]*)/);
  return m ? { reasoning: m[1].trim(), answer: m[2].trim() } : { reasoning: "", answer: raw };
}
```

## 5 Anti-patterns / Limitaciones

- **Overthinking — 30k tokens para problema trivial.** R1 a veces genera razonamiento larguísimo incluso para `2+2`. En producción necesitás `length penalty` o `max_think_tokens = 2048` para no quemar latencia y costo. No dejes CoT ilimitado.
- **Costo RL inviable en thin client.** 10k steps × 64 samples con modelo 671B es cluster-scale. Ni lo intentes. Tu ventaja es destilar, no entrenar.
- **Preprint sin peer review.** Los números son impresionantes pero no pasaron revisión independiente. Los traces destilados sí son open y verificables — bencheá vos antes de confiar ciegamente.
- **Mezcla de idiomas en R1-Zero.** Sin SFT cold-start, el modelo mezcla chino/inglés. Usá siempre R1 (con cold-start) o los destilados, no R1-Zero crudo.
- **Long CoT ≠ siempre mejor.** Para tareas de tu harness (`fs.move`, `ptyx` exec), un CoT de 10k tokens es desperdicio. R1 brilla en math/code complejo; para CRUD de archivos, un prompt corto con ReAct lineal gana en latencia.
- **Cuantización degrada.** Q4 de 7B pierde ~2-5pp vs FP16. Medí antes de desplegar en APK — si tu destilado Q4 cae mucho, probá Q5_K_M o subí a 14B.

## 6 Ejercicios prácticos (en tu repo)

1. **Corre R1-Distill-Qwen-1.5B Q4 local y bencheá.** Bajá el modelo de HuggingFace, cargalo con `llama.cpp` o `candle` en `desktop-app`, y medí: (a) MATH-500 sample (20 problemas), (b) latencia p50/p95 para 512 tokens, (c) vs GPT-4 remoto en los mismos 20 problemas. ¿A partir de qué complejidad justifica el local? Definí el umbral de routing.

2. **Parseá `<think>` en el SSE handler.** Modificá `web/src/shared/sse/handler.ts` para detectar `<think>...</think>` en la respuesta del modelo (cuando uses R1-Distill) y separarlo en `ThinkingBlock` colapsable vs respuesta final. Logueá longitud del `<think>` por tarea — ¿cuándo hace overthinking?

3. **Destilación casera para tu dominio.** Generá 200 traces con GPT-4 o R1-671B remoto para tareas específicas de tu repo (ej: "migrar endpoint X", "fix de `cargo check` error Y") con formato `<think>...</think>`. Fine-tuneá Qwen-1.5B local con esos traces (LoRA, 1 epoch) y medí si supera al base en esas tareas. ¿Vale la pena vs usar el destilado genérico?

## 7 Referencias

- **Paper:** DeepSeek-AI, *DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning*, 2025-01-22 — https://arxiv.org/abs/2501.12948
- **Destilados:** https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B · 7B · 32B · Llama-8B/70B
- **Base:** DeepSeek-V3 (671B MoE) — https://arxiv.org/abs/2412.19437
- **Algoritmo GRPO:** Shao et al., *DeepSeekMath* (2402.03300) — introducción de GRPO.
- **Relacionados:** Quiet-STaR (2403.09629) — otro enfoque de razonamiento sin SFT; Orca (2306.02707) — destilación previa con GPT-4 traces.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (evolución de long CoT durante RL) del paper original
- [ ] Entiendo GRPO: por qué no necesita critic y cómo calcula ventaja relativa en el grupo
- [ ] Sé la diferencia entre R1-Zero (solo RL) y R1 (SFT cold-start + RL) y por qué importa
- [ ] Bajé o tengo plan para probar R1-Distill-Qwen-1.5B/7B Q4 en `desktop-app`
- [ ] Link del paper y del destilado guardados en favoritos / Zotero

*Generado para sección Papers — 01 Reasoning · opencode-remote-android*
