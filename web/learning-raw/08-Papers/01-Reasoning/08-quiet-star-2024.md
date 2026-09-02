# Quiet-STaR — Pensar antes de cada token (Zelikman et al., 2024)

> **Autores:** Zelikman, Harik, Shao, Jayasiri, Haber, Goodman / Stanford
> **Año:** 2024 · **Prioridad:** MEDIA P1 · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2403.09629](https://arxiv.org/abs/2403.09629)
> **Categoría Papers:** 01 Reasoning · **Nivel:** intermedio · **Versión:** arXiv 2024-03-14

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Quiet-STaR: Language Models Can Teach Themselves to Think Before Speaking (Zelikman, Harik, Shao et al., 2024).
> **Link:** https://arxiv.org/abs/2403.09629
> **Relevancia para opencode-remote-android:** propone que el razonamiento no sea solo a nivel de oración (CoT) sino **antes de cada token**. No lo vas a usar en streaming SSE directo por costo, pero la idea de *internal thoughts* latentes es clave para entender hacia dónde va el pre-training (y para destilar un Phi-3 local más inteligente offline).
> **Prioridad:** MEDIA P1 · **Nuevo vs CoT:** CoT razona a nivel de frase con prompt; Quiet-STaR razona a nivel de token, latente, sin labels.

## 1 Introducción — Qué problema resuelve

CoT hace que el modelo razone generando oraciones intermedias visibles ("primero calculo X, luego Y"). Pero ¿y si el razonamiento útil ocurre a una escala más fina — antes de cada token? Los humanos no solo planean frases; también eligen cada palabra con micro-razonamiento implícito.

Quiet-STaR lleva esto al extremo: **antes de generar cada token real, el modelo genera 16 "thoughts" latentes** (secuencia de ~12 tokens de razonamiento interno no supervisado), los usa para predecir mejor el siguiente token, y **solo aprende de los thoughts que mejoran la perplexity**. Sin labels de razonamiento humano, sin SFT — solo REINFORCE sobre si el thought ayudó a predecir.

Resultado: Mistral 7B sube de 5.9% a **10.9% en GSM8K** y +4% en CommonsenseQA, solo por aprender a "pensar antes de hablar" a nivel de token. Es STaR (Self-Taught Reasoner) llevado a granularidad máxima, pero silencioso (quiet) porque los thoughts no se ven en el output final.

## 2 Ideas clave

### 2.1 Think tokens antes de cada token real

```
Token real a predecir: "11"
  Thought latente: "<thought> 5 + 6 = ... need to add ... </thought>"
  → predicción con thought: P("11" | context + thought) = 0.82
  → predicción sin thought:  P("11" | context)          = 0.45
  → reward = log(0.82) − log(0.45) > 0  → refuerza este thought
```

Flujo por cada posición `t`:

1. Genera `k=16` thoughts candidatos (cada uno ~12 tokens, con `temperature`).
2. Para cada thought, calcula cuánto mejora la probabilidad del token real `x_t`.
3. Reward = `log P(x_t | thought) − log P(x_t | no thought)` — si el thought ayuda, reward positivo.
4. Entrena con **REINFORCE** (policy gradient) solo sobre thoughts con reward > 0, más un loss de NLL estándar.

### 2.2 Sin supervisión de razonamiento

A diferencia de CoT (que necesita ejemplos con pasos) o STaR (que necesita respuestas correctas), Quiet-STaR no necesita labels de *cómo* razonar. El único criterio es: ¿este thought me ayudó a predecir el próximo token del corpus? Si sí, lo refuerzo. Los rationales **emergen** para minimizar perplexity, no para copiar CoT humano. Es auto-supervisado puro.

### 2.3 Paralelización — No es secuencial como CoT

CoT genera razonamiento token por token de forma autoregresiva (lento). Quiet-STaR genera thoughts para **todos los tokens en paralelo** en un batch: cada posición `t` tiene sus 16 thoughts independientes. Esto permite entrenar sobre secuencias largas sin el cuello de botella secuencial de CoT, aunque el costo total sigue siendo alto (16× overhead).

### 2.4 Quiet — Los thoughts no se emiten

En inferencia, los thoughts son **latentes**: el modelo los genera internamente pero no los muestra al usuario. El output final son solo los tokens reales, pero *mejor elegidos* gracias al razonamiento interno. Por eso "quiet" — piensa en silencio.

Para tu harness, esto significa que Quiet-STaR no te da un `ThinkingBlock` visible como CoT/R1. Es mejora de calidad invisible, no de interpretabilidad.

## 3 Evidencia / Experimentos

| Benchmark | Mistral 7B base | Mistral 7B + Quiet-STaR | Ganancia |
|---|:---:|:---:|:---:|
| **GSM8K** | 5.9% | **10.9%** | +5.0pp (casi duplica) |
| **CommonsenseQA** | 36.3% | **40.3%** | +4.0pp |
| **OpenBookQA** | — | + mejora | — |
| **Perplexity (corpus)** | baseline | **− mejora** | baja perplexity general |

- **GSM8K 5.9% → 10.9% (Mistral 7B):** sin CoT prompt, sin few-shot — solo pre-training con Quiet-STaR. Para un 7B es significativo (aunque lejos del 58% de CoT con 540B).
- **CommonsenseQA +4%:** muestra que no es solo matemática — el micro-razonamiento ayuda en sentido común.
- **Ablation:** sin REINFORCE (solo NLL), no mejora — el reward de perplexity es esencial.
- **Costo:** 16 thoughts × 12 tokens = 192 tokens latentes por cada token real — overhead **10-50×** en training. En inferencia, si mantuvieras los thoughts, también pagás ese overhead.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto Quiet-STaR | Dónde lo aplicás (o no) en el repo |
|---|---|
| **Razonamiento token-level latente** | No lo uses en **streaming SSE** (`message.part.delta`) — el overhead 16× por token te mata la latencia y el costo. Quiet-STaR es técnica de *pre-training*, no de prompting en inferencia. |
| **Pre-training de Phi-3 local** | La aplicación real: fine-tuneá tu Phi-3 3.8B local **offline** con Quiet-STaR sobre corpus de tu dominio (código Rust, docs del repo, issues). El modelo aprende a razonar internamente sin que tengas que escribir CoT examples. Luego desplegalo en `desktop-app` Rust sidecar sin overhead de thoughts en inferencia (podés destilar los thoughts o simplemente usar el modelo mejorado). |
| **Destilación de thoughts** | Alternativa: entrená con Quiet-STaR offline, luego generá traces con thoughts visibles y destilá a un modelo que use CoT explícito (como R1 destila long CoT). Es el pipeline: Quiet-STaR (pre-train) → traces → SFT CoT (deploy). |
| **Comparación con R1** | R1 (paper 07) hace RL a nivel de *respuesta* con reward binario (correcto/incorrecto). Quiet-STaR hace RL a nivel de *token* con reward de perplexity. R1 es más directo para tareas con respuesta verificable (math, code); Quiet-STaR es más general pero más caro y menos interpretable. |
| **IndexedDB y SSE sin cambios** | Como los thoughts son latentes, tu `IndexedDB v2` y `shared/sse/handler.ts` no necesitan cambios para Quiet-STaR. La mejora es invisible en el harness — simplemente el modelo local responde mejor. |
| **Cuándo NO usarlo** | No intentes implementar Quiet-STaR en el thin client en vivo. Es research de pre-training que requiere cluster y corpus grande. Consumilo como *modelo ya entrenado* si alguien libera un Phi-3-Quiet-STaR, no como técnica que implementás vos. |

```
┌─────────────────────────────────────────────────┐
│  Quiet-STaR: dónde entra en tu stack            │
│                                                 │
│  Training (offline, cluster):                   │
│    Phi-3 3.8B + Quiet-STaR → Phi-3* mejorado    │
│         │                                       │
│         ▼                                       │
│  Deploy (tu thin client):                       │
│    Phi-3* en desktop-app sidecar :4850          │
│    → SSE normal, sin overhead, mejor calidad    │
│    → No cambia ptyx :4849 / fsx / IndexedDB     │
└─────────────────────────────────────────────────┘
```

## 5 Anti-patterns / Limitaciones

- **Overhead 10-50× inviable en mobile/APK.** 16 thoughts × 12 tokens por cada token real es impagable en streaming SSE con `polling 3.5s` y contexto limitado. No lo corras en inferencia directa — usalo solo como técnica de pre-training offline.
- **No es interpretable.** Los thoughts son latentes y no se emiten. A diferencia de CoT/R1 donde ves el `<think>`, acá no podés auditar *qué* pensó el modelo. Para debugging de harness, CoT/ReAct siguen siendo superiores.
- **Requiere corpus grande y REINFORCE estable.** Entrenar Quiet-STaR necesita miles de steps con 16 samples por token — es caro y el REINFORCE puede ser inestable sin buen baseline. No lo implementes desde cero sin experiencia en RL.
- **Ganancia modesta vs costo.** Duplicar GSM8K de 5.9% a 10.9% en 7B suena bien, pero CoT con el mismo 7B y buen prompt puede dar más. El ROI de Quiet-STaR solo se justifica si lo hace el pre-training base, no como fine-tuning puntual.
- **No reemplaza CoT/ReAct en harness.** Quiet-STaR mejora el modelo base; CoT/ReAct mejoran el *uso* del modelo. Son complementarios. Incluso con un modelo Quiet-STaR, seguís necesitando `Thought → Action → Observation` en tu SSE para tareas multi-paso.
- **`external_router` no se beneficia.** Quiet-STaR es mejora del modelo base, no del harness. Tu `external_router.rs` con `probe 250ms` + `cached_probe OnceLock 1500ms` sigue siendo I/O puro — no hay razonamiento token-level que acelere un TCP connect. No mezcles capas.

## 6 Ejercicios prácticos (en tu repo)

1. **Compará modelo base vs Quiet-STaR (si existe).** Si encontrás un checkpoint Mistral-7B-Quiet-STaR o similar en HuggingFace, bajalo y bencheá en 20 problemas GSM8K sample vs Mistral 7B base (mismo prompt, sin CoT). ¿Se replica el +5pp del paper? Medí también latencia — ¿el modelo Quiet-STaR es más lento en inferencia si emite thoughts?

2. **Simulá la intuición de Quiet-STaR con CoT denso.** Como no podés correr Quiet-STaR real, simulá su idea: para una tarea de código, pedí al modelo que genere un *micro-thought* de 1 oración antes de cada línea de código (prompt: "Antes de cada línea, escribí un comentario de 5 palabras explicando qué hace"). Compará calidad vs CoT normal (un bloque de razonamiento al inicio). ¿El razonamiento por-línea ayuda?

3. **Diseñá el pipeline de destilación.** Bosquejá en `desktop-app/docs/slm-pipeline.md` cómo harías: (a) fine-tunear Phi-3 3.8B con Quiet-STaR offline sobre tu corpus (código del repo + docs), (b) generar traces con thoughts visibles, (c) destilar a un modelo deployable Q4 para `desktop-app` sidecar. Estimá corpus necesario, GPU horas y ganancia esperada. ¿Justifica vs usar R1-Distill directo?

## 7 Referencias

- **Paper:** Zelikman et al., *Quiet-STaR: Language Models Can Teach Themselves to Think Before Speaking*, 2024-03-14 — https://arxiv.org/abs/2403.09629
- **Base STaR:** Zelikman et al., *STaR: Bootstrapping Reasoning With Reasoning* (2203.14465) — el predecesor a nivel de oración.
- **Relacionado:** DeepSeek-R1 (2501.12948) — RL para razonamiento a nivel de respuesta vs token.
- **Contexto:** Wei et al., *Chain-of-Thought* (2201.11903) — razonamiento a nivel de frase con prompt.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (diagrama de think tokens por posición) del paper original
- [ ] Entiendo la diferencia entre razonamiento token-level (Quiet-STaR) y sentence-level (CoT)
- [ ] Sé por qué el reward es `log P(con thought) − log P(sin thought)` y cómo se entrena con REINFORCE
- [ ] Tengo claro que es técnica de pre-training offline, no de prompting en SSE
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 01 Reasoning · opencode-remote-android*
