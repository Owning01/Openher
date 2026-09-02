# QLoRA — Fine-tune 65B en una sola GPU de 48GB (Dettmers et al., 2023)

> **Autores:** Tim Dettmers, Artidoro Pagnoni, Ari Holtzman, Luke Zettlemoyer / U. Washington
> **Año:** 2023 · **Versión:** NeurIPS 2023 · **Prioridad:** MEDIA P1 · **Lectura:** ~14 min
> **Link verificado:** [https://arxiv.org/abs/2305.14314](https://arxiv.org/abs/2305.14314) · [github.com/artidoro/qlora](https://github.com/artidoro/qlora)
> **Categoría Papers:** 06 Skills · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa.

---

> **Paper:** QLoRA: Efficient Finetuning of Quantized LLMs (Dettmers et al., NeurIPS 2023).
> **Relevancia para opencode-remote-android:** es el **"LoRA en laptop"**. Si LoRA (paper 06) te pide 16GB VRAM para Phi-3 3.8B, QLoRA te lo baja a 8GB — tu laptop con RTX 4060 ya alcanza. Mismo resultado, mitad de VRAM.

## 1 Introducción — Qué problema resuelve

LoRA (paper 06) es barato en *parámetros* (4M vs 3.8B), pero el **modelo base sigue en FP16/BF16 en VRAM** durante entrenamiento — Phi-3 3.8B son ~7.5GB solo para pesos, más gradientes y optimizer de LoRA. En la práctica, necesitás 16GB VRAM para LoRA de 7B, y ni hablar de 65B (130GB).

QLoRA pregunta: ¿y si **quantizamos el modelo base a 4-bit** y entrenamos LoRA en FP16 sobre ese base quantizado, con un optimizer paginado que no explota si te quedás sin VRAM? Lo hacen y funciona: **fine-tune Llama 65B en una sola GPU de 48GB** con pérdida mínima vs FP16.

Para vos, la traducción es: fine-tune Phi-3 3.8B en tu laptop Windows con 8GB VRAM, sin cloud.

## 2 Ideas clave

### 2.1 Tres trucos que lo hacen posible

| Truco | Qué hace | Por qué importa |
|---|:---|---|
| **4-bit NormalFloat (NF4)** | Quantiza pesos a 4-bit con distribución Normal (óptima para pesos ~N(0,σ)) | 4× menos VRAM que FP16, mejor que INT4 uniforme |
| **Double Quantization** | Quantiza las *constantes* de quantización (overhead de NF4) | Ahorra ~0.37 bits/parámetro extra (~3GB en 65B) |
| **Paged Optimizer** | Si el optimizer se queda sin VRAM, pagina a RAM vía unified memory | No crashea por OOM — degrada elegante |

Juntos: base 4-bit + LoRA FP16 + paged Adam = QLoRA.

### 2.2 NF4 — por qué no INT4 común

Pesos de LLM siguen distribución **Normal** (campana), no uniforme. INT4 uniforme desperdicia bins en colas vacías. NF4 asigna más bins al centro de la campana, donde están la mayoría de pesos:

```
INT4 uniforme:  |---|---|---|---|---|---|---|---|
NF4 Normal:     |--|---|---|---|---|---|--|   (más resolución en el centro)
                -3σ              0              +3σ
```

Resultado: **NF4 a 4-bit ≈ INT8 en calidad**, pero con la mitad de VRAM.

### 2.3 LoRA sobre modelo quantizado — el forward

```
W_q = dequantize(W_NF4) + B·A   # W_NF4 en 4-bit, B·A en FP16
h = W_q · x
     │      │
     │      └─ LoRA FP16 (entrenable, ~4M params)
     └──────── Base 4-bit (congelado, dequantizado on-the-fly)
```

En cada forward, se dequantiza `W_NF4 → BF16` on-the-fly, se suma `B·A`, y se computa. El costo es ~10% más lento que LoRA FP16, pero con **4× menos VRAM**.

### 2.4 VRAM real — números que importan

| Modelo | LoRA FP16 | QLoRA NF4 | Ahorro |
|---|:---:|:---:|:---:|
| Phi-3-mini 3.8B | ~10GB | **~5GB** | 50% |
| Llama 2 7B | ~14GB | **~7GB** | 50% |
| Llama 2 13B | ~26GB | ~13GB | 50% |
| Llama 65B | ~130GB (imposible) | **~48GB** | 63% |

Con QLoRA, Phi-3 3.8B entra en **8GB VRAM** (RTX 4060 laptop) con batch 1-2.

## 3 Evidencia / Experimentos

| Modelo | Método | VRAM | MMLU | GSM8K | HumanEval |
|---|:---:|:---:|:---:|:---:|:---:|
| Llama 65B | Full FT | >780GB | 63.4% | — | — |
| Llama 65B | LoRA FP16 | ~130GB | 63.1% | — | — |
| Llama 65B | **QLoRA NF4** | **48GB** | **63.1%** | — | — |
| Llama 7B | LoRA FP16 | 14GB | 38.8% | — | — |
| Llama 7B | **QLoRA NF4** | **7GB** | **38.4%** | — | — |
| Guanaco 65B (QLoRA) | QLoRA | 48GB | — | — | Chat 99.3% vs ChatGPT (humano) |

- **Pérdida de QLoRA vs LoRA FP16: <0.5pp** en MMLU — indistinguible en la práctica.
- **Guanaco (QLoRA sobre Llama):** fine-tune con 9k ejemplos OASST1 alcanza 99.3% de ChatGPT en eval humana Vicuna — prueba de que QLoRA no degrada calidad conversacional.
- **Double Quant ahorra 3GB en 65B** sin pérdida medible — gratis.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **Fine-tune Phi-3 en laptop 8GB** | Si tu laptop tiene RTX 4060 8GB, LoRA FP16 no entra (10GB). Con QLoRA NF4, sí (5GB). Entrená `lora-opencode` con `bitsandbytes` + `peft` en tu máquina, sin pagar cloud. |
| **NF4 + Double Quant** | En `train-qlora-phi3.py`, usá `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_use_double_quant=True)` — es una línea y te ahorra 2GB. |
| **Paged Optimizer** | Si tu dataset es grande y el optimizer pagina, `paged_adamw_8bit` evita OOM. Úsalo si ves `CUDA out of memory` en el optimizer step, no en el forward. |
| **Un QLoRA por skill (paper 01)** | Igual que LoRA (paper 06), pero con base 4-bit. `phi3-base NF4 (2.2GB) + lora-opencode (16MB) + lora-guard (16MB)` — todo en 8GB VRAM. Switch sin recargar base. |
| **Entrenar en Windows** | `bitsandbytes` en Windows requiere `bitsandbytes-windows` o WSL2. Si no querés pelearte, usá WSL2 + `transformers` + `peft` — es el path probado. O usá `unsloth` que ya trae QLoRA optimizado para Windows. |
| **opencode-stats :8765** | Logueá `{method: "qlora-nf4", vram_gb, vs_lora_fp16_delta, mmlu_delta}` para confirmar que QLoRA no te degrada. Si delta >1pp, revisá `bnb_4bit_compute_dtype` (debe ser `bf16`). |

```python
# train-qlora-phi3.py — QLoRA con HuggingFace
from transformers import AutoModelForCausalLM, BitsAndBytesConfig, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",          # NormalFloat 4-bit (paper)
    bnb_4bit_use_double_quant=True,     # ahorra 0.37 bits/param
    bnb_4bit_compute_dtype="bfloat16",  # compute en BF16
)

base = AutoModelForCausalLM.from_pretrained(
    "microsoft/Phi-3-mini-4k-instruct",
    quantization_config=bnb_config,
    device_map="auto",
)
base = prepare_model_for_kbit_training(base)

lora_config = LoraConfig(r=8, lora_alpha=16, target_modules=["q_proj", "v_proj"], lora_dropout=0.05, task_type="CAUSAL_LM")
model = get_peft_model(base, lora_config)

# Paged optimizer si tenés OOM en optimizer
args = TrainingArguments(optim="paged_adamw_8bit", per_device_train_batch_size=2, gradient_accumulation_steps=4)
```

## 5 Anti-patterns / Limitaciones

- **QLoRA sin NF4 (usar INT4 uniforme).** `bnb_4bit_quant_type="fp4"` es peor que `nf4` para pesos normales. Siempre usá `nf4` — es el default por algo. Si copiás un snippet viejo con `fp4`, cambialo.
- **Batch grande en 8GB.** Con QLoRA en 8GB, `batch=4` te da OOM aunque el modelo entre. Usá `batch=1` + `gradient_accumulation_steps=4` — mismo efecto, menos VRAM pico.
- **Olvidar `prepare_model_for_kbit_training`.** Sin esa línea, las normas y embeddings quedan en 4-bit y el entrenamiento diverge. Siempre llamala antes de `get_peft_model`.
- **QLoRA para dataset gigante.** QLoRA es 10% más lento por forward (dequant on-the-fly). Si tu dataset es 100k ejemplos, ese 10% duele. Para datasets chicos (500-5k, tu caso), es irrelevante.
- **Windows + bitsandbytes sin WSL.** `bitsandbytes` nativo en Windows es frágil. Si ves `libcudart.so not found` o similar, no pierdas 2 horas — pasá a WSL2 o usá `unsloth` que ya resuelve el packaging.

## 6 Ejercicios prácticos (en tu repo)

1. **QLoRA en tu laptop: ¿entra?** Instalá `bitsandbytes` + `peft` + `transformers` (WSL2 si estás en Windows), cargá Phi-3-mini con `load_in_4bit=True, nf4, double_quant` y medí VRAM con `nvidia-smi` vs LoRA FP16. ¿Baja de 10GB a ~5GB? Entrená 10 steps dummy y verificá que no OOM.

2. **QLoRA vs LoRA FP16: ¿pierde calidad?** Entrená el mismo LoRA `r=8` sobre 200 ejemplos opencode con QLoRA (NF4) y con LoRA FP16 (si tenés 16GB VRAM o Colab). Evaluá ambos en 20 issues internos + 50 MBPP sample. ¿Delta <0.5pp como promete el paper? Si delta >2pp, revisá `compute_dtype`.

3. **Paged optimizer a propósito.** Forzá OOM: entrená QLoRA con `batch=8` en 8GB VRAM con `adamw_torch` (sin paged) y confirmá el crash. Luego cambiá a `optim="paged_adamw_8bit"` y verificá que pagina a RAM y completa (más lento, pero completa). Es el safety net del paper — probalo antes de necesitarlo en serio.

## 7 Referencias

- **Paper:** Dettmers et al., *QLoRA: Efficient Finetuning of Quantized LLMs*, NeurIPS 2023 — https://arxiv.org/abs/2305.14314
- **Código:** https://github.com/artidoro/qlora · `bitsandbytes` + HuggingFace `peft`
- **Relacionados en esta serie:** LoRA (06) — base que QLoRA quantiza; Phi-3 (03) — modelo ideal para QLoRA en laptop; Self-Instruct (10) — genera dataset para QLoRA.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (NF4 vs INT4) del paper original
- [ ] Entiendo NF4, Double Quant y Paged Optimizer y cuándo cada uno ahorra VRAM
- [ ] Sé configurar `BitsAndBytesConfig(nf4, double_quant)` + `prepare_model_for_kbit_training`
- [ ] Anoté 1 `train-qlora-phi3.py` para correr en laptop 8GB esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 06 Skills · opencode-remote-android*
