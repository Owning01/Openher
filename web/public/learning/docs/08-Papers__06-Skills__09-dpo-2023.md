# DPO — Direct Preference Optimization, RLHF sin RL (Rafailov et al., 2023)

> **Autores:** Rafael Rafailov, Archit Sharma, Eric Mitchell, Stefano Ermon, Christopher D. Manning, Chelsea Finn / Stanford
> **Año:** 2023 · **Versión:** NeurIPS 2023 · **Prioridad:** MEDIA P1 · **Lectura:** ~14 min
> **Link verificado:** [https://arxiv.org/abs/2305.10557](https://arxiv.org/abs/2305.10557) · [github.com/eric-mitchell/direct-preference-optimization](https://github.com/eric-mitchell/direct-preference-optimization)
> **Categoría Papers:** 06 Skills · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa.

---

> **Paper:** Direct Preference Optimization: Your Language Model is Secretly a Reward Model (Rafailov et al., NeurIPS 2023).
> **Relevancia para opencode-remote-android:** es el **reemplazo simple de PPO**. Si InstructGPT (paper 08) te pide RM + PPO + KL tuning (frágil), DPO te da el mismo resultado con **un loss de clasificación** sobre pares `(bueno, malo)` — 1 GPU, sin RL, sin reward model separado.

## 1 Introducción — Qué problema resuelve

RLHF clásico (InstructGPT, paper 08) funciona pero es un dolor:

1. Entrenás un Reward Model (RM) con pares humanos `(y_w > y_l)`.
2. Corrés PPO contra el RM, con KL penalty, value network, clipping, y 5 hiperparámetros que si tocás mal, diverge.
3. Necesitás infrastructure de RL (rollouts, value estimation) que no es standard en `transformers`.

DPO demuestra que **no necesitás RM ni PPO**: el LLM mismo *es* el RM. Reescribe el objetivo de RLHF como un loss de clasificación directo sobre preferencias, y entrenás con **cross-entropy** común, como si fuera SFT.

Resultado: **misma performance que PPO, con 10× menos código, sin RL, estable**.

## 2 Ideas clave

### 2.1 La intuición — del reward al policy directo

RLHF clásico:

```
Humano: y_w > y_l  →  entreno RM(y)  →  PPO maximiza RM(y) - KL
```

DPO:

```
Humano: y_w > y_l  →  entreno policy directo con loss:
  L = -log σ( β·log(π(y_w)/π_ref(y_w)) - β·log(π(y_l)/π_ref(y_l)) )
```

Donde `π` es tu modelo entrenado, `π_ref` es el modelo SFT congelado, `β` controla qué tanto te alejás del ref (como KL en PPO). Es **logistic regression** sobre el *log-ratio* de probabilidades — si el modelo asigna más proba a `y_w` que a `y_l` (relativo al ref), el loss baja.

### 2.2 No hay Reward Model separado

| Componente | RLHF (PPO) | DPO |
|---|:---:|---|
| **Reward Model** | Sí, 6B entrenado aparte | No — el policy es el RM |
| **Value network** | Sí (para PPO) | No |
| **Rollouts** | Sí (generar respuestas on-policy) | No — solo pares offline |
| **Hiperparámetros RL** | 5+ (kl_coef, clip, value_loss, ...) | 1 (`β`) |
| **Estabilidad** | Frágil, seed-sensitive | Estable, como SFT |

### 2.3 Un solo hiperparámetro: β

`β` controla el trade-off entre seguir preferencias y no alejarse del `π_ref`:

- `β` chico (0.1): el modelo se aleja mucho del ref para satisfacer preferencias — más alineado pero puede olvidar conocimiento.
- `β` grande (0.5): se mantiene cerca del ref — más conservador.

El paper usa `β=0.1` para la mayoría de casos. Para tu Phi-3 local, empezá con `β=0.1` y subí si ves degradación en MMLU.

### 2.4 DPO + LoRA = fine-tune de preferencias en laptop

Como DPO es un loss estándar, lo podés combinar con **LoRA** (paper 06) o **QLoRA** (paper 07) sin cambios:

```
phi3-base (congelado, 4-bit NF4)
  └── LoRA r=8 (entrenable, DPO loss sobre pares y_w/y_l)
```

500 pares de preferencias, 1 GPU, 2 horas — y tu Phi-3 aprende "prefiero respuestas concisas con `fs.read` correcto sobre verborragia".

## 3 Evidencia / Experimentos

| Tarea | PPO (RLHF) | DPO | SFT solo |
|---|:---:|:---:|:---:|
| **TL;DR Summarization** (win rate vs SFT) | 61% | **61%** | 50% |
| **Anthropic HH** (harmlessness) | 59% | **60%** | 50% |
| **IMDb sentiment** | 4.2 reward | 4.3 reward | 3.1 |
| **Stability** | 3/5 seeds divergen | **0/5 divergen** | — |

- **DPO iguala a PPO** en win rate, con cero divergencias — PPO diverge en 60% de seeds sin tuning fino.
- **Sin RM:** DPO no necesita entrenar RM 6B ni correr rollouts — ahorra ~50% de compute vs RLHF completo.
- **Generalización:** DPO entrenado en un dominio (ej: summarization) generaliza a prompts no vistos mejor que PPO con RM pequeño (menos overfitting al RM).

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **Alinear Phi-3 a tu estilo sin PPO** | Generá 500 pares `(y_w, y_l)` donde `y_w` es "respuesta concisa, cita `file:line`, usa `fs.read` correcto" y `y_l` es "respuesta verborrágica o con path `..`". Entrená Phi-3 con DPO + LoRA r=8 — 1 GPU, sin RM, sin PPO. |
| **Constitutional AI con DPO (paper 04)** | Tu `constitution.md` genera pares `(permitido, bloqueado)` — entrená el guard Phi-3 con DPO en lugar de RLAIF+PPO. Es el path recomendado: `constitution → pares → DPO+LoRA` (papers 04+09+06). |
| **Preferencias de harness (paper 02)** | Para JIT-Agent, generá pares `(harness bueno, harness malo)` por tarea (ej: para "captura", `workflow` es `y_w` y `tot` es `y_l`). Entrená el selector con DPO para que prefiera harnesses baratos cuando alcanzan. |
| **Reemplazo de RM** | No entrenes un RM 6B separado — DPO no lo necesita. Tu `π_ref` es Phi-3 SFT (paper 08 paso 1), y DPO lo alinea directo. Ahorrás un modelo entero. |
| **opencode-stats :8765** | Logueá `{method: "dpo", beta, pairs, win_rate_vs_sft, vs_ppo_delta}`. Si DPO con `β=0.1` diverge (pérdida NaN), subí a `β=0.3` — es el único knob. |
| **Validación** | Evaluá DPO con tus 20 issues internos + MBPP-50 sample. Si DPO mejora `win_rate` en tu dominio pero cae en MMLU >3pp, subí `β` o bajá `epochs`. |

```python
# train-dpo-phi3.py — DPO + LoRA, sin PPO ni RM
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import DPOTrainer, DPOConfig  # HuggingFace TRL

# Base SFT (paper 08 paso 1) + QLoRA (paper 07)
bnb_config = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_use_double_quant=True)
base = AutoModelForCausalLM.from_pretrained("microsoft/Phi-3-mini-4k-instruct", quantization_config=bnb_config)
base = prepare_model_for_kbit_training(base)
lora_config = LoraConfig(r=8, lora_alpha=16, target_modules=["q_proj", "v_proj"], task_type="CAUSAL_LM")
model = get_peft_model(base, lora_config)

# Dataset: [{"prompt": "Mueve archivo...", "chosen": "shell.fs.move(correct)", "rejected": "shell.fs.move(con ..)"}]
dpo_config = DPOConfig(beta=0.1, per_device_train_batch_size=2, num_train_epochs=3, learning_rate=5e-5)
trainer = DPOTrainer(model=model, ref_model=None, args=dpo_config, train_dataset=dpo_dataset, processing_class=tokenizer)
trainer.train()
```

## 5 Anti-patterns / Limitaciones

- **DPO sin SFT previo.** Igual que PPO (paper 08), DPO asume que `π_ref` ya es un modelo SFT decente. Si tu `π_ref` es el base sin SFT, DPO va a alinear sobre un modelo que ni siquiera sigue instrucciones — primero SFT con 100-500 ejemplos.
- **Pares ruidosos o inconsistentes.** Si tus pares `(y_w, y_l)` tienen 20% de labels invertidos (humano se equivocó o AI label ruidoso), DPO aprende ruido. Curá los pares: que `y_w` sea claramente mejor que `y_l` según tu constitución, no ambiguo.
- **β muy chico = olvido.** Con `β=0.01`, el modelo se aleja muchísimo del ref para maximizar preferencia y olvida conocimiento general (MMLU cae 10pp). Si ves degradación, subí `β` a 0.3-0.5.
- **DPO no genera datos — los consume.** Necesitás 500+ pares etiquetados. Si no los tenés, generá con **Self-Instruct** (paper 10) o con tu constitución (paper 04) antes de entrenar DPO.
- **DPO ≠ SFT.** No mezcles loss SFT con DPO en el mismo trainer sin entender la interacción. DPO ya incluye el efecto de SFT vía `π_ref` — si agregás SFT loss encima, estás doble-contando. Usá `DPOTrainer` puro o `SFT → DPO` secuencial.

## 6 Ejercicios prácticos (en tu repo)

1. **500 pares y DPO en Phi-3.** Generá 500 pares `(chosen, rejected)` para tu dominio: `chosen` = tool_call correcto + conciso, `rejected` = verborrágico o con path inválido (`..`, `.env`). Entrená Phi-3-mini con DPO+QLoRA (`β=0.1`, `r=8`) y evaluá en 20 issues held-out: ¿cuántos `chosen` ahora prefiere el modelo vs SFT solo? Medí `win_rate`.

2. **SFT vs SFT+DPO.** Entrená Phi-3 con solo SFT (100 ejemplos) y luego SFT+DPO (100 SFT + 500 pares DPO). Evaluá ambos en 20 issues + 50 MBPP sample. ¿DPO aporta +pp sobre SFT? ¿Cuánto cuesta en MMLU (si cae >3pp, subí β)? Es el ablation del paper en tu dominio.

3. **Constitutional DPO para el guard.** Tomá tu `constitution.md` (paper 04) y generá 200 pares `(permitido, bloqueado)` (ej: `shell.fs.read("web/src/foo.ts")` vs `shell.fs.read("/etc/passwd")`). Entrená el guard Phi-3 con DPO y medí `precision`/`recall` vs guard regex vs guard prompting sin entrenar. ¿DPO supera al prompting?

## 7 Referencias

- **Paper:** Rafailov et al., *Direct Preference Optimization*, NeurIPS 2023 — https://arxiv.org/abs/2305.10557
- **Código:** https://github.com/eric-mitchell/direct-preference-optimization · HuggingFace `trl` (`DPOTrainer`)
- **Relacionados en esta serie:** InstructGPT (08) — RLHF con PPO que DPO reemplaza; Constitutional AI (04) — genera pares para DPO; LoRA (06) / QLoRA (07) — entrenar DPO barato; Self-Instruct (10) — generar pares sintéticos.

---

## Checklist de lectura

- [ ] Leí el abstract y la ecuación 7 (loss DPO) del paper original
- [ ] Entiendo por qué DPO no necesita RM ni PPO y qué hace β
- [ ] Sé la secuencia `SFT → DPO+LoRA` y por qué no saltear SFT
- [ ] Anoté 1 dataset de 500 pares + `train-dpo-phi3.py` para probar esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 06 Skills · opencode-remote-android*
