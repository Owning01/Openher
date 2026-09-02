# LoRA — Low-Rank Adaptation, fine-tune barato sin tocar el modelo base (Hu et al., 2021)

> **Autores:** Edward J. Hu, Yelong Shen, Phillip Wallis, Zeyuan Allen-Zhu, Yuanzhi Li, Shean Wang, Lu Wang, Weizhu Chen / Microsoft Research
> **Año:** 2021 · **Versión:** ICLR 2022 · **Prioridad:** ALTA P0 · **Lectura:** ~15 min
> **Link verificado:** [https://arxiv.org/abs/2106.09685](https://arxiv.org/abs/2106.09685) · [github.com/microsoft/LoRA](https://github.com/microsoft/LoRA)
> **Categoría Papers:** 06 Skills · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** LoRA: Low-Rank Adaptation of Large Language Models (Hu et al., ICLR 2022).
> **Relevancia para opencode-remote-android:** es cómo vas a **fine-tunear Phi-3 3.8B** para tu dominio (opencode tasks, `fsx`/`ptyx`, constitución) sin necesitar un cluster. LoRA te baja el costo de fine-tune de "imposible en laptop" a "una GPU, una noche".

## 1 Introducción — Qué problema resuelve

Fine-tunear un LLM completo es carísimo: GPT-3 175B tiene 175B parámetros — actualizarlos todos requiere 350GB+ de VRAM solo para optimizer states (Adam), sin contar activaciones. En la práctica, nadie fine-tunea 175B en una laptop.

Pero los autores observan algo: cuando fine-tuneás, la **actualización** `ΔW` tiene rango bajo — no necesitás 175B grados de libertad, con unos pocos miles alcanza. LoRA congela `W` original y entrena solo una descomposición de rango bajo `ΔW = B·A` donde `B` y `A` son chiquitas.

Resultado: **10.000× menos parámetros entrenables**, sin latencia extra en inferencia (se puede mergear `W + B·A`), y podés tener **un LoRA por tarea** intercambiable sin copiar el modelo.

## 2 Ideas clave

### 2.1 La descomposición de rango bajo

Para cada matriz de pesos `W ∈ ℝ^{d×k}` (ej: `d=4096, k=4096` en atención):

```
W' = W + ΔW = W + B·A
     │         │   │
     │         │   └─ A ∈ ℝ^{r×k}  (r=8, chiquita)
     │         └───── B ∈ ℝ^{d×r}  (r=8, chiquita)
     └─────────────── W congelada (no se toca)
```

- `r` (rank) es el hiperparámetro clave: `r=8` típico, `r=16` si necesitás más capacidad.
- Parámetros entrenables por capa: `d·r + r·k = 2·d·r` (si `d=k`) vs `d·k` originales.
- Para GPT-3 175B con `r=8`, son **~4M parámetros** vs 175B — 10.000× menos.

### 2.2 Dónde aplicar LoRA — solo atención basta

El paper prueba aplicar LoRA a distintas matrices:

| Matrices con LoRA | Parámetros | WikiSQL | MNLI | Ventaja |
|---|:---:|:---:|:---:|---|
| Solo `W_q, W_v` | 4M | 73.4% | 91.7% | **Mejor trade-off** |
| `W_q, W_k, W_v, W_o` | 8M | 73.6% | 91.6% | Marginal extra |
| Solo `W_q` | 2M | 72.8% | 91.5% | Peor |
| All + FFN | 20M | 73.8% | 91.8% | No justifica |

**Conclusión:** aplicar LoRA solo a `W_q` y `W_v` (query y value de atención) ya da 99% del beneficio. No hace falta tocar FFN.

### 2.3 Sin latencia extra — merge en inferencia

Durante entrenamiento: `h = W·x + B·A·x` (dos matmuls chiquitas extra).

En inferencia, podés **mergear**: `W_merged = W + B·A` y hacer un solo `W_merged·x` — **cero overhead**. O mantener `B·A` separado y switchear LoRAs por tarea sin recargar el modelo base (útil para tener `lora-opencode` y `lora-constitutional` intercambiables).

### 2.4 Un LoRA por tarea, un modelo base

```
phi3-base (3.8B, congelado, 2.2GB Q4)
  ├── lora-opencode (4M, ~16MB) — para tasks de opencode
  ├── lora-constitutional (4M, ~16MB) — como guard
  └── lora-screenshots (4M, ~16MB) — para capture DSL
```

Switch en runtime sin recargar base — ideal para tu `phi_sidecar.rs`.

## 3 Evidencia / Experimentos

| Modelo | Método | Parámetros entrenables | WikiSQL | MNLI | SAMSum |
|---|:---:|:---:|:---:|:---:|:---:|
| GPT-3 175B | Full fine-tune | 175B | 73.0% | 89.5% | — |
| GPT-3 175B | **LoRA r=8 (W_q,W_v)** | **4M** | **73.4%** | **91.7%** | — |
| GPT-3 175B | Adapter | 40M | 71.8% | 90.4% | — |
| GPT-3 175B | Prefix-tuning | 1M | 72.9% | 90.1% | — |
| GPT-2 Medium | LoRA r=4 | 0.3M | — | 91.7% | 53.8 R1 |

- **LoRA iguala o supera full fine-tune** con 10.000× menos parámetros — no es aproximación, es mejor (menos overfitting).
- **Rank no necesita ser grande:** `r=8` ya satura; `r=64` no mejora significativamente (tabla 7 del paper). No gastes VRAM en `r` alto.
- **Scaling:** a mayor modelo, LoRA gana más — en 175B la brecha con full es mínima; en 1B, fine-tune completo puede ser mejor.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **Fine-tune Phi-3 3.8B para tu dominio** | Dataset: 500-1k ejemplos de tasks opencode (`fs.read`, `ptyx exec`, `probe` + constitución). Entrená LoRA `r=8` solo en `W_q,W_v` con 1 GPU (16GB VRAM alcanza). Costo: ~2-4hs en una 4090, ~$2 en cloud. Sin LoRA, necesitarías 4× A100. |
| **Un LoRA por skill** | Cada skill que requiera adaptación (ej: `probe-guard`, `screenshots DSL`) puede tener su LoRA de 16MB. El `phi_sidecar.rs` carga el base una vez y switchea LoRA según `skill` activo (paper 01 + 02). |
| **Merge para producción, separado para dev** | En `desktop-app` release, mergeá `W + B·A` para cero overhead. En dev, mantené separado para iterar rápido (cambiás LoRA sin recompilar). |
| **LoRA + QLoRA (paper 07)** | Si no tenés 16GB VRAM, usá QLoRA: base en 4-bit + LoRA en FP16. Así fine-tuneás Phi-3 3.8B en 8GB VRAM (laptop con 4060). |
| **opencode-stats :8765** | Logueá `{lora_name, rank, dataset_size, eval_pass_rate, vs_base_delta}` por cada LoRA. Si `lora-opencode r=8` no supera al base en tu eval interna (20 issues), subí a `r=16` o agregá datos. |
| **Validación con eval** | Evaluá cada LoRA con `eval-mbpp.py` / `eval-humaneval.py` (papers 04/05) + tu benchmark interno de 20 issues. Si LoRA mejora en tu dominio pero cae en MMLU >5pp, está overfiteando — bajá `r` o agregá regularización. |

```python
# train-lora-phi3.py — esqueleto con HuggingFace PEFT
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM, TrainingArguments, Trainer

base = AutoModelForCausalLM.from_pretrained("microsoft/Phi-3-mini-4k-instruct", load_in_8bit=True)
config = LoraConfig(
    r=8,                      # rank — 8 basta (paper tabla 7)
    lora_alpha=16,            # scaling: alpha/r = 2
    target_modules=["q_proj", "v_proj"],  # solo W_q, W_v (paper)
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)
model = get_peft_model(base, config)
print(f"Trainable: {model.print_trainable_parameters()}")  # ~4M vs 3.8B

# Dataset: [{"instruction": "mueve archivo con shell.fs.move", "output": "..."}]
# Trainer con TrainingArguments (lr=2e-4, epochs=3, batch=4)
```

## 5 Anti-patterns / Limitaciones

- **r=64 porque "más es mejor".** El paper prueba que `r=8` satura; `r=64` da +0.2pp con 8× más parámetros y más overfitting. Empezá con `r=8`, subí solo si tu eval interna muestra underfitting.
- **LoRA en todas las capas sin motivo.** Aplicar LoRA a `q,k,v,o` + FFN duplica parámetros sin ganancia (tabla del paper). Mantené `W_q,W_v` y ahorrá VRAM.
- **Dataset chico sin validación.** Con 50 ejemplos y LoRA r=8, overfiteás en 1 epoch. Necesitás 500+ ejemplos y split train/val. Si no tenés 500, usá **Self-Instruct** (paper 10) para sintetizar.
- **Merge y olvidar el base.** Si mergeás `W + B·A` y perdés `B·A` separado, no podés switchear por tarea. Guardá siempre el adapter suelto (`adapter_model.bin` ~16MB) además del merged.
- **LoRA no es magia para Phi-3.** Si tu dataset es ruidoso o tu eval es HumanEval contaminado, LoRA va a memorizar ruido. Curá el dataset (como MBPP sanitized) y evaluá en post-cutoff (LiveCodeBench) para medir generalización real.

## 6 Ejercicios prácticos (en tu repo)

1. **Entrená LoRA r=8 para tu dominio.** Armá 200 ejemplos sintéticos (instrucción + respuesta) de tasks opencode (ej: "lista archivos en web/src con fsx", "verifica puerto 3000 con probe"). Entrená LoRA `r=8, target=q_proj,v_proj` sobre Phi-3-mini con `peft` en 1 GPU o Colab. Evaluá con 20 issues internos: ¿supera al base sin LoRA? Logueá `delta` en `opencode-stats`.

2. **Ablation de rank.** Entrená tres LoRAs con `r=4, 8, 16` sobre el mismo dataset (200 ejemplos). Evaluá cada uno en tu benchmark interno (20 issues) + MBPP-100 sample. Graficá `pass_rate vs r`. ¿Satura en 8 como predice el paper? ¿Tu dominio necesita más rank que WikiSQL?

3. **Switch de LoRAs por skill.** Entrená dos LoRAs: `lora-fs` (tasks de filesystem) y `lora-guard` (constitutional). En `phi_sidecar.rs`, cargá el base una vez y switcheá adapter según `skill` activo (paper 01). Medí latencia de switch (<50ms si mantenés ambos en RAM) y si cada LoRA rinde mejor en su dominio que un LoRA único.

## 7 Referencias

- **Paper:** Hu et al., *LoRA: Low-Rank Adaptation of Large Language Models*, ICLR 2022 — https://arxiv.org/abs/2106.09685
- **Código:** https://github.com/microsoft/LoRA · HuggingFace PEFT: `peft` library
- **Relacionados en esta serie:** QLoRA (07) — LoRA sobre modelo quantizado (8GB VRAM); Phi-3 (03) — base ideal para LoRA; DPO (09) — entrenar LoRA con preferencias sin PPO; Self-Instruct (10) — generar dataset para LoRA.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (descomposición B·A) del paper original
- [ ] Entiendo por qué `r=8` en `W_q,W_v` es el sweet spot y por qué no hace falta más
- [ ] Sé la diferencia entre merge (cero overhead) y adapter separado (switch por tarea)
- [ ] Anoté 1 dataset + config LoRA para entrenar en `train-lora-phi3.py` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 06 Skills · opencode-remote-android*
