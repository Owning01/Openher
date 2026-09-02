# InstructGPT — RLHF para que el modelo siga instrucciones (Ouyang et al., 2022)

> **Autores:** Long Ouyang, Jeff Wu, Xu Jiang, Diogo Almeida, Carroll Wainwright, Pamela Mishkin, Chong Zhang, Sandhini Agarwal, Katarina Slama, Alex Ray, John Schulman, Jacob Hilton, Fraser Kelton, Luke Miller, Maddie Simens, Amanda Askell, Peter Welinder, Paul Christiano, Jan Leike, Ryan Lowe / OpenAI
> **Año:** 2022 · **Versión:** NeurIPS 2022 · **Prioridad:** MEDIA P1 · **Lectura:** ~15 min
> **Link verificado:** [https://arxiv.org/abs/2203.02155](https://arxiv.org/abs/2203.02155)
> **Categoría Papers:** 06 Skills · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Training Language Models to Follow Instructions with Human Feedback (Ouyang et al., NeurIPS 2022) — **InstructGPT / RLHF**.
> **Relevancia para opencode-remote-android:** explica por qué tu agente a veces es verborrágico, por qué prefiere respuestas "útiles" aunque alucine, y por qué el prompt engineering importa más que el pre-training. Es la base de ChatGPT y de todo lo que vino después (DPO, Constitutional AI).

## 1 Introducción — Qué problema resuelve

GPT-3 (175B) era potente pero inútil como asistente: si le decías "explicá cómo funciona `external_router.rs:19`", te completaba con más código o te ignoraba. Sabía de todo pero no sabía **seguir instrucciones** — porque fue entrenado para predecir el próximo token, no para ser útil.

InstructGPT resuelve eso con **tres pasos** que se volvieron el estándar de la industria:

1. **SFT** (Supervised Fine-Tuning): humanos escriben respuestas ideales, el modelo las imita.
2. **Reward Model (RM)**: humanos rankean pares de respuestas, el modelo aprende qué prefiere el humano.
3. **PPO** (RL): el modelo genera respuestas, el RM las puntúa, y PPO lo optimiza para maximizar reward.

Resultado: **InstructGPT 1.3B es preferido sobre GPT-3 175B en 85% de casos** — 130× menos parámetros, pero alineado. Nace ChatGPT.

## 2 Ideas clave

### 2.1 Los tres pasos en detalle

| Paso | Qué se entrena | Datos | Objetivo |
|---|:---|:---|---|
| **1. SFT** | LLM base (GPT-3) | ~13k prompts + respuestas escritas por humanos | Imitar respuestas humanas (cross-entropy) |
| **2. RM** | Reward Model (6B) | ~33k prompts + pares `(y_w, y_l)` rankeados por humanos | Predecir qué respuesta prefiere el humano |
| **3. PPO** | LLM SFT (policy) | ~31k prompts sin labels, RM como juez | Maximizar `reward - KL_penalty` |

```
Base (GPT-3) ──SFT──► SFT model ──PPO (vs RM)──► InstructGPT (RLHF)
                        ▲              │
                        │              ▼
                     Reward Model ◄── Humanos rankean (y_w > y_l)
```

### 2.2 Por qué RL y no solo SFT

SFT solo imita — si el humano escribió respuestas verborrágicas, el modelo será verborrágico. RL con RM permite **generalizar más allá de los ejemplos**: el RM aprende el *criterio* humano ("prefiero respuestas concisas y correctas") y PPO lo optimiza incluso para prompts no vistos.

El paper muestra: **SFT solo < RM + PPO** en win rate vs GPT-3.

### 2.3 El KL penalty — no olvidar lo que sabía

PPO optimiza `reward - β·KL(policy || SFT)`. El término KL evita que el modelo se vuelva un "reward hacker" que genera texto que el RM ama pero que es basura (ej: repetir "respuesta útil" 100 veces). Sin KL, el RM es fácilmente explotable.

### 2.4 InstructGPT es verborrágico por diseño

El RM fue entrenado con humanos que **preferían respuestas largas y detalladas** (parecían más útiles). Resultado: InstructGPT aprendió a ser verborrágico — explica de más, agrega caveats, usa listas largas. Si tu agente responde con 300 tokens cuando bastaban 50, es herencia de RLHF, no bug.

## 3 Evidencia / Experimentos

| Modelo | Tamaño | Win rate vs GPT-3 175B | Helpfulness | Harmlessness |
|---|:---:|:---:|:---:|:---:|
| GPT-3 | 175B | 50% (baseline) | — | — |
| SFT | 1.3B | ~65% | ↑ | — |
| **InstructGPT (RLHF)** | **1.3B** | **85%** | **↑↑** | **↑** |
| InstructGPT | 6B | 87% | ↑↑ | ↑↑ |
| InstructGPT | 175B | 90% | ↑↑↑ | ↑↑ |

- **1.3B RLHF > 175B base:** 130× menos parámetros, pero alineado. El alineamiento vale más que la escala para usefulness.
- **PPO > SFT solo:** +20pp win rate al agregar RM+PPO sobre SFT — justifica el costo de entrenar RM.
- **Trade-off verborragia:** humanos prefieren respuestas largas en eval, pero en producción los usuarios se quejan de verborragia. El paper lo reconoce — es el costo de optimizar para "parece útil".

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **Por qué el agente es verborrágico** | Tu modelo remoto (GPT-4, Claude) es InstructGPT-style: prefiere explicar de más porque su RM fue entrenado así. Si querés respuestas concisas ("solo el patch, sin explicación"), no pelees contra RLHF — usá system prompt explícito: "Responde con solo el diff, sin explicación" + `max_tokens` bajo. |
| **SFT para tu dominio** | Si querés que Phi-3 local siga instrucciones de opencode ("mueve archivo con shell.fs.move"), no hace falta RLHF completo. Con **SFT** sobre 500 ejemplos (instrucción → tool_call correcto) ya mejora mucho. Es el paso 1 del paper, sin RM ni PPO. |
| **Reward Model para tu harness** | Si SFT no alcanza, entrená un RM pequeño (Phi-3 3.8B) que rankee `(tool_call bueno, tool_call malo)` según tu criterio (ej: "prefiero `fs.read` antes que `fs.move` si no conozco el destino"). Luego DPO (paper 09) en lugar de PPO — más simple. |
| **KL penalty como regularización** | Si fine-tuneás Phi-3 con LoRA (paper 06) y notás que se vuelve repetitivo o que olvida conocimiento general, agregá KL contra el base (o bajá `lr` y `epochs`). Es el mismo principio del paper: no optimizar solo para tu dataset. |
| **Constitutional AI (paper 04) como alternativa** | En lugar de RLHF humano (caro), usá RLAIF con constitución (paper 04) — mismos 3 pasos pero con AI labels en lugar de humanos. Para tu harness, es más barato y escalable. |
| **opencode-stats :8765** | Si implementás SFT o RM, logueá `{method: "sft"|"rlhf", win_rate_vs_base, verbosity_tokens, helpfulness}`. Si tu SFT baja verborragia pero también baja `win_rate`, estás en el trade-off del paper — calibrá. |

```python
# SFT simple para Phi-3 — paso 1 de InstructGPT, sin RL
from transformers import AutoModelForCausalLM, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model  # LoRA paper 06

# Dataset: [{"prompt": "Mueve web/src/foo.ts a web/src/bar.ts", "completion": "shell.fs.move(...)"}]
# 500 ejemplos curados por vos (como los 13k del paper, pero para tu dominio)

base = AutoModelForCausalLM.from_pretrained("microsoft/Phi-3-mini-4k-instruct")
lora_config = LoraConfig(r=8, target_modules=["q_proj", "v_proj"], task_type="CAUSAL_LM")
model = get_peft_model(base, lora_config)

# SFT: cross-entropy sobre completions (como el paper paso 1)
args = TrainingArguments(per_device_train_batch_size=4, num_train_epochs=3, learning_rate=2e-4)
trainer = Trainer(model=model, args=args, train_dataset=sft_dataset)
trainer.train()
```

## 5 Anti-patterns / Limitaciones

- **RLHF sin SFT previo diverge.** El paper es claro: PPO directo sobre el base sin SFT es inestable. Si vas a hacer RLHF/DPO, primero SFT — no saltees el paso 1.
- **RM pequeño y ruidoso = PPO inestable.** El paper usa RM 6B; con RM 1B, PPO overfitea al RM y genera reward hacking (texto que el RM ama pero es basura). Si tu RM es Phi-3 3.8B, preferí **DPO** (paper 09) sobre PPO — es más estable con RM chico.
- **Optimizar para "parece útil" ≠ útil.** Humanos en el paper prefirieron respuestas largas aunque no fueran más correctas. Si evaluás tu agente con humanos que premian verborragia, vas a entrenar un agente verborrágico. Definí tu criterio de preferencia explícito (ej: "prefiero patch correcto y conciso sobre explicación larga").
- **PPO es complejo y frágil.** PPO requiere tuning de `kl_coef`, `clip_range`, `value_loss_coef`, y es sensible a seeds. Si no tenés experiencia con RL, no implementes PPO — usá DPO (paper 09) que es un loss de clasificación simple.
- **No confundir InstructGPT con base.** Si evaluás Phi-3 base (sin instruct) en MBPP/HumanEval con prompt de instrucción, va a rendir mal — no fue entrenado para seguir instrucciones. Usá siempre la variante `-instruct` para eval de instrucciones.

## 6 Ejercicios prácticos (en tu repo)

1. **Mide la verborragia de tu modelo remoto.** Tomá 10 prompts de tu harness (ej: "fix probe timeout en external_router.rs:19"), pedí respuesta al remoto y contá tokens de la respuesta vs tokens del patch útil (diff). Calculá `verbosity_ratio = tokens_totales / tokens_patch`. Si ratio >3, tu modelo es InstructGPT-verborrágico — probá system prompt "Responde con solo el diff" y medí de nuevo.

2. **SFT de 100 ejemplos para Phi-3.** Armá 100 pares `(instrucción opencode, tool_call correcto)` (ej: "lista archivos en web/src" → `shell.fs.list_dir("web/src")`). Fine-tuneá Phi-3-mini con LoRA r=8 (paper 06) solo con SFT (paso 1 del paper, sin RM/PPO). Evaluá en 20 intents held-out: ¿cuántos tool_calls ahora son correctos vs base sin SFT?

3. **De SFT a DPO sin PPO.** Tomá los 100 ejemplos SFT y generá pares de preferencia: para cada prompt, creá `y_w` (tool_call correcto) y `y_l` (tool_call incorrecto, ej: path con `..`). Entrená con **DPO** (paper 09) sobre el modelo SFT. Compará `accuracy` SFT solo vs SFT+DPO en 20 tests — ¿DPO mejora sin la complejidad de PPO?

## 7 Referencias

- **Paper:** Ouyang et al., *Training Language Models to Follow Instructions with Human Feedback*, NeurIPS 2022 — https://arxiv.org/abs/2203.02155
- **PPO:** Schulman et al., *Proximal Policy Optimization Algorithms*, 2017 — https://arxiv.org/abs/1707.06347
- **Relacionados en esta serie:** DPO (09) — reemplaza PPO con clasificación; Constitutional AI (04) — RLAIF sin humanos; Self-Instruct (10) — genera datos SFT sintéticos; LoRA (06) / QLoRA (07) — cómo entrenar barato.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 2 (pipeline SFT → RM → PPO) del paper original
- [ ] Entiendo los 3 pasos y por qué PPO necesita KL penalty
- [ ] Sé por qué InstructGPT es verborrágico y cómo mitigarlo con system prompt
- [ ] Anoté 1 dataset SFT de 100 ejemplos para Phi-3 local esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 06 Skills · opencode-remote-android*
