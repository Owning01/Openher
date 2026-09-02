# Llama 2 — Open foundation 7-70B que democratizó los LLMs (Touvron et al., 2023)

> **Autores:** Hugo Touvron, Louis Martin, Kevin Stone, Peter Albert, Amjad Almahairi, Yasmine Babaei, Nikolay Bashlykov, Soumya Batra, Prajjwal Bhargava, Shruti Bhosale, Dan Bikel, Lukas Blecher, Cristian Canton Ferrer, Moya Chen, Guillem Cucurull, David Esiobu, Jude Fernandes, Jeremy Fu, Wenyin Fu, Brian Fuller, Cynthia Gao, Vedanuj Goswami, Naman Goyal, Anthony Hartshorn, Saghar Hosseini, Rui Hou, Hakan Inan, Marcin Kardas, Viktor Kerkez, Madian Khabsa, Isabel Kloumann, Artem Korenev, Punit Singh Koura, Marie-Anne Lachaux, Thibaut Lavril, Jenya Lee, Diana Liskovich, Yinghai Lu, Yuning Mao, Xavier Martinet, Todor Mihaylov, Pushkar Mishra, Igor Molybog, Yixin Nie, Andrew Poulton, Jeremy Reizenstein, Rashi Rungta, Kalyan Saladi, Alan Schelten, Ruan Silva, Eric Michael Smith, Ranjan Subramanian, Xiaoqing Ellen Tan, Binh Tang, Ross Taylor, Adina Williams, Jian Xiang Kuan, Puxin Xu, Zheng Yan, Iliyan Zarov, Yuchen Zhang, Angela Fan, Melanie Kambadur, Sharan Narang, Aurelien Rodriguez, Robert Stojnic, Sergey Edunov, Thomas Scialom / Meta
> **Año:** 2023 · **Versión:** arXiv 2307.09288 · **Prioridad:** MEDIA P1 · **Lectura:** ~14 min
> **Link verificado:** [https://arxiv.org/abs/2307.09288](https://arxiv.org/abs/2307.09288) · [huggingface.co/meta-llama/Llama-2-7b-hf](https://huggingface.co/meta-llama/Llama-2-7b-hf)
> **Categoría Papers:** 06 Skills · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa.

---

> **Paper:** Llama 2: Open Foundation and Fine-Tuned Chat Models (Touvron et al., 2023).
> **Relevancia para opencode-remote-android:** es el **modelo open que hizo posible todo lo demás** — Phi-3 (03) destila de él, Code Llama deriva de él, LoRA/QLoRA (06/07) se probaron sobre él, y tu Phi-3 local es su heredero. Entender Llama 2 es entender el trade-off 7B vs 70B para local vs remoto.

## 1 Introducción — Qué problema resuelve

Hasta mediados de 2023, los LLMs potentes eran cerrados: GPT-3/4 (OpenAI), PaLM (Google), Claude (Anthropic) — ninguno liberaba pesos. La comunidad open tenía GPT-J 6B, GPT-NeoX 20B, pero con gap grande vs cerrados. Investigar, fine-tunear o correr local era privilegio de pocos.

Llama 2 rompe eso: **Meta libera pesos open (licencia comercial permisiva) en 7B, 13B y 70B**, pre-entrenados en **2T tokens** (40% más que Llama 1), con variantes **Chat** fine-tuneadas con SFT + RLHF (papers 08/09) que superan a GPT-3.5 en varios benchmarks. De la noche a la mañana, cualquiera con una GPU podía correr un modelo decente local y fine-tunearlo con LoRA.

Para tu repo, Llama 2 es el **baseline histórico**: si entendés por qué 7B rinde X y 70B rinde Y, entendés por qué Phi-3 3.8B (2024) con data sintética puede superar a Llama 2 7B con menos parámetros.

## 2 Ideas clave

### 2.1 Tres tamaños, un trade-off claro

| Modelo | Parámetros | VRAM FP16 | VRAM Q4 | MMLU | GSM8K | HumanEval |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Llama 2 7B** | 7B | ~14GB | ~4GB | 45.3% | 14.6% | 12.8% |
| **Llama 2 13B** | 13B | ~26GB | ~8GB | 54.8% | 28.7% | 18.3% |
| **Llama 2 70B** | 70B | ~140GB | ~40GB | **68.9%** | **56.8%** | **29.9%** |
| Llama 2-Chat 70B | 70B + RLHF | ~140GB | ~40GB | 62.6%* | — | — |

*MMLU baja levemente en Chat por alineamiento (trade-off helpfulness vs knowledge).

**Lectura para tu repo:**

- **7B Q4 (~4GB)** cabe en tu `desktop-app` sidecar (como Phi-3-mini), pero rinde **peor** que Phi-3 3.8B (MMLU 45% vs 68% Phi-3) — Phi-3 con data sintética lo supera con la mitad de parámetros.
- **70B** es el que compite con GPT-3.5, pero no corre local sin 2×4090 o quant agresivo. Es modelo remoto, no local.

### 2.2 2T tokens + RLHF — qué cambió vs Llama 1

| Aspecto | Llama 1 | Llama 2 |
|---|:---|---|
| Tokens | 1.4T | **2T** (+40%) |
| Contexto | 2k | **4k** |
| Licencia | Research-only | **Comercial permisiva** |
| Chat | No | **SFT + RLHF + rejection sampling** |
| Safety | No | **RLHF harmlessness + red teaming** |

El salto de 1.4T → 2T + mejor filtrado de datos explica gran parte de la mejora. No es arquitectura nueva — es **más datos, mejor curados, más contexto**.

### 2.3 Llama 2-Chat — SFT + RLHF + rejection sampling

El pipeline de alineamiento (papers 08/09) aplicado a Llama 2:

```
Llama 2 base (2T pre-train)
  → SFT (27k ejemplos humanos)
  → Reward Model (human preferences)
  → Rejection Sampling (genera k respuestas, RM elige la mejor, SFT sobre esa)
  → PPO (RLHF iterativo, 2 iteraciones)
  → Llama 2-Chat
```

Rejection sampling es el truco extra: antes de PPO, generan 10 respuestas por prompt, rankean con RM y fine-tunean sobre la mejor — es como DPO (paper 09) pero con sampling.

### 2.4 Base de todo el ecosistema open

```
Llama 2 7B/70B
  ├── Code Llama (fine-tune en código, base de tu eval HumanEval/MBPP)
  ├── Phi-3 (Microsoft, destila de Llama 2 + sintético, 3.8B supera 7B)
  ├── Alpaca/Vicuña (Self-Instruct paper 10 sobre Llama)
  ├── Guanaco (QLoRA paper 07 sobre Llama 65B)
  └── Tu Phi-3 local (heredero, corre en desktop-app sidecar)
```

## 3 Evidencia / Experimentos

| Benchmark | Llama 2 7B | Llama 2 13B | Llama 2 70B | GPT-3.5 | GPT-4 |
|---|:---:|:---:|:---:|:---:|:---:|
| **MMLU** | 45.3% | 54.8% | **68.9%** | 70.0% | 86.4% |
| **GSM8K** | 14.6% | 28.7% | **56.8%** | 57.1% | 92.0% |
| **HumanEval** | 12.8% | 18.3% | **29.9%** | 48.1% | 67.0% |
| **BBH** | 32.6% | 39.4% | **51.2%** | — | — |
| **Chat eval (human)** | — | — | **36% win vs ChatGPT** | 50% | — |

- **70B ≈ GPT-3.5** en MMLU/GSM8K — por primera vez un open empata con un cerrado comercial.
- **7B << 70B:** el gap 7B→70B es **+23pp MMLU** — la escala importa, pero Phi-3 3.8B (2024) cierra ese gap con data sintética (MMLU 68% con 3.8B vs 45% Llama 2 7B).
- **Chat 70B:** en eval humana es preferido 36% vs ChatGPT — no lo supera, pero es competitivo open.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **Trade-off 7B vs 70B → Phi-3 3.8B** | No uses Llama 2 7B local — Phi-3 3.8B (paper 03) rinde **+23pp MMLU** con la mitad de parámetros y cabe en 3GB Q4 vs 4GB. Llama 2 7B es obsoleto para tu caso. Si necesitás 7B, usa Phi-3-small 7B o Mistral 7B. |
| **70B como remoto vs Phi-3 local** | Si tu remoto es Llama 2 70B (self-hosted) vs GPT-4/Claude API, el trade-off es costo vs calidad: 70B open es gratis pero rinde ~GPT-3.5, no GPT-4. Para SWE-bench/GAIA, preferí GPT-4/Claude remoto + Phi-3 local como router (paper 03). |
| **SFT + RLHF pipeline** | Si fine-tuneás Phi-3 local, el pipeline es el mismo: `base → SFT (500 ejemplos) → DPO (500 pares, paper 09)` en lugar de PPO. Es Llama 2-Chat simplificado con DPO. |
| **2T tokens → data quality** | La lección de Llama 2 es "más tokens, mejor filtrados". Para tu dataset sintético (Self-Instruct paper 10), no generes 52k basura — generá 500 bien filtrados (ROUGE-L 0.7). Calidad > cantidad, como Phi-3 demuestra. |
| **Licencia comercial** | Llama 2 (y Phi-3) tienen licencia comercial permisiva — podés distribuir `desktop-app` con Phi-3 Q4 bundled sin pagar API. Si usás GPT-4 remoto, pagás por token; con Llama 2/Phi-3 local, el costo es VRAM. |
| **opencode-stats :8765** | Si comparás modelos, logueá `{model: "llama2-7b"|"phi3-3.8b"|"gpt-4", benchmark, score, vram_gb, cost_per_1k}`. Así ves el Pareto: Phi-3 3.8B domina a Llama 2 7B en todo (score y VRAM). |

```python
# Comparativa rápida para decidir modelo local
# web/scripts/bench-local-models.py
MODELS = {
    "phi3-mini-3.8B-Q4": {"vram_gb": 3, "mmlu": 68.8, "humaneval": 58.0, "cost": 0},
    "llama2-7B-Q4":      {"vram_gb": 4, "mmlu": 45.3, "humaneval": 12.8, "cost": 0},
    "llama2-70B-Q4":     {"vram_gb": 40,"mmlu": 68.9, "humaneval": 29.9, "cost": 0},
    "gpt-4-remote":      {"vram_gb": 0, "mmlu": 86.4, "humaneval": 67.0, "cost": 0.03},  # $/1k tokens
}

for name, m in MODELS.items():
    score_per_vram = m["mmlu"] / max(m["vram_gb"], 1)
    print(f"{name:20s} MMLU {m['mmlu']:4.1f}% | VRAM {m['vram_gb']:3d}GB | score/VRAM {score_per_vram:4.1f}")
# phi3-mini domina en score/VRAM
```

## 5 Anti-patterns / Limitaciones

- **Usar Llama 2 7B en 2025.** Phi-3 3.8B lo supera en todo con menos VRAM. Llama 2 7B solo tiene sentido si necesitás reproducir un paper de 2023. Para producción, Phi-3-mini es estrictamente mejor.
- **70B sin quant en laptop.** Llama 2 70B FP16 son 140GB — no entra en tu laptop ni en una 4090. Si lo querés local, necesitás Q4 (40GB) + 2 GPUs o `llama.cpp` con offload a RAM (lento). Para tu thin client, 70B es remoto, no local.
- **Llama 2 base sin Chat para instrucciones.** Si evaluás Llama 2 base (sin SFT/RLHF) con prompts de instrucción ("mueve el archivo..."), va a completar con más texto en lugar de obedecer. Usá siempre `Llama-2-7b-chat-hf` para tasks de agente.
- **Cutoff 2023.** Llama 2 no sabe de Agent Skills (2025), JIT-Agent (2025) ni de tu `external_router`. No le preguntes por specs nuevas — no las vio. Para conocimiento reciente, necesitás RAG o modelo con cutoff 2025.
- **Safety de Llama 2-Chat no es tu guard.** El RLHF de Llama 2 es para harmlessness general (no generar odio), no para tu constitución (no borrar fuera de workspace). Necesitás tu propio guard (paper 04) aunque uses Llama 2-Chat.

## 6 Ejercicios prácticos (en tu repo)

1. **Phi-3 vs Llama 2 7B en tu dominio.** Corré `eval-mbpp.py` (paper 05) con 50 problemas sobre Phi-3-mini Q4 y Llama 2 7B Q4 (ambos vía `llama.cpp` local). Compará `pass@1` y VRAM. ¿Phi-3 supera a Llama 2 7B como predice el paper? Si sí, desinstalá Llama 2 7B y quedate con Phi-3.

2. **Pipeline SFT → DPO sobre Phi-3 (Llama 2-Chat simplificado).** Replicá el pipeline de Llama 2-Chat pero con DPO: `phi3-base → SFT (200 ejemplos opencode) → DPO (200 pares chosen/rejected)`. Evaluá en 20 issues internos antes y después de cada paso. ¿SFT solo ya mejora? ¿DPO aporta +pp? Es Llama 2-Chat en miniatura.

3. **Costo local vs remoto.** Calculá para 1k requests/mes: `costo_phi3_local = 0 (VRAM) + electricidad` vs `costo_gpt4 = 1k × avg_tokens × $0.03/1k`. Graficá en `opencode-stats` el Pareto `score vs cost`. ¿En qué % de requests Phi-3 local es suficiente (router dice trivial) y cuánto ahorrás?

## 7 Referencias

- **Paper:** Touvron et al., *Llama 2: Open Foundation and Fine-Tuned Chat Models*, 2023 — https://arxiv.org/abs/2307.09288
- **Modelos:** https://huggingface.co/meta-llama/Llama-2-7b-hf · Llama-2-7b-chat-hf · Code Llama
- **Relacionados en esta serie:** Phi-3 (03) — heredero que supera a Llama 2 7B; LoRA (06) / QLoRA (07) — fine-tune de Llama/Phi-3; InstructGPT (08) / DPO (09) — pipeline SFT+RLHF que Llama 2-Chat usa; Self-Instruct (10) — genera datos SFT.

---

## Checklist de lectura

- [ ] Leí el abstract y la tabla 4 (Llama 2 vs GPT-3.5) del paper original
- [ ] Entiendo el trade-off 7B vs 70B y por qué Phi-3 3.8B domina a Llama 2 7B en 2025
- [ ] Sé el pipeline `base → SFT → RM → PPO` de Llama 2-Chat y su simplificación con DPO
- [ ] Anoté 1 comparativa `bench-local-models.py` para decidir modelo local esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 06 Skills · opencode-remote-android*
