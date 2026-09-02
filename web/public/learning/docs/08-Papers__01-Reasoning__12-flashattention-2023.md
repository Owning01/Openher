# FlashAttention-2 — Atención 2-4× más rápida sin perder calidad (Dao, 2023)

> **Autores:** Dao, Fu, Ermon, Rudra, Ré / Stanford + Princeton
> **Año:** 2023 · **Prioridad:** MEDIA P1 · **Lectura:** ~14 min
> **Link verificado:** [https://arxiv.org/abs/2307.08691](https://arxiv.org/abs/2307.08691)
> **Categoría Papers:** 01 Reasoning · **Nivel:** intermedio · **Versión:** arXiv 2023-07-17 (FlashAttention-2)

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning (Dao, 2023).
> **Link:** https://arxiv.org/abs/2307.08691 — FlashAttention-1: https://arxiv.org/abs/2205.14135
> **Relevancia para opencode-remote-android:** explica por qué tu context 128k es caro y cómo mitigarlo localmente. Si corrés Phi-3/R1-Distill en `desktop-app` Rust sidecar, FlashAttention es lo que te permite 16k de contexto sin OOM en una GPU modesta. Entenderlo te ayuda a decidir cuándo el bottleneck es cómputo vs memoria.
> **Prioridad:** MEDIA P1 · **Nuevo vs Attention original:** reordena cómputo para SRAM, no cambia la matemática.

## 1 Introducción — Qué problema resuelve

El Transformer (paper 01) es O(n²) en atención — pero el problema práctico no es solo FLOPs, es **memoria**. La atención naive materializa la matriz `QKᵀ` de tamaño `n × n` en HBM (memoria lenta de GPU). Con `n=16k`, son 256M elementos × 2 bytes (FP16) = 512MB solo para esa matriz, por head, por capa. Con 32 heads y 32 capas, OOM garantizado.

FlashAttention-1 (2022) mostró que podés evitar materializar `QKᵀ` usando **tiling + recomputation**: dividís Q,K,V en bloques que entran en SRAM (memoria rápida on-chip, ~20MB), computás atención por bloques y nunca guardás la matriz completa. Resultado: 2-4× más rápido y 10× menos memoria HBM.

FlashAttention-2 (2023) mejora el particionado y paralelismo: 2× más rápido que FA-1 y hasta 4× vs atención naive, con mejor utilización de GPU. Para tu thin client, es la razón por la que un Phi-3 3.8B local puede manejar 16k de contexto en una laptop sin swap.

## 2 Ideas clave

### 2.1 El cuello de botella es HBM, no FLOPs

```
GPU
┌─────────────────────┐
│  SRAM (on-chip)     │  ~20MB,  ~19 TB/s  ← rápido pero chico
│  ┌───────────────┐  │
│  │  HBM (off-chip)│  │  ~40GB, ~1.5 TB/s ← grande pero lento (10× más lento)
│  └───────────────┘  │
└─────────────────────┘

Atención naive:  QKᵀ (n×n) → HBM → softmax → ×V → HBM  (lee/escribe HBM 3×)
FlashAttention:  Q,K,V por bloques → SRAM → softmax parcial → acumula → HBM una vez
```

La atención naive hace **3 pasadas por HBM** (escribir QKᵀ, leer para softmax, escribir output). FlashAttention hace **1 pasada** — de ahí el speedup aunque los FLOPs sean idénticos.

### 2.2 Tiling + Softmax incremental

FlashAttention divide Q en bloques `Br` y K,V en bloques `Bc` que entran en SRAM:

```
Para cada bloque Qᵢ:
  Para cada bloque Kⱼ, Vⱼ:
    Sᵢⱼ = Qᵢ · Kⱼᵀ / √d   (en SRAM, nunca va a HBM)
    mᵢⱼ = max(Sᵢⱼ, m_prev)  (tracking del max para softmax estable)
    Pᵢⱼ = exp(Sᵢⱼ − mᵢⱼ)
    Oᵢ  += Pᵢⱼ · Vⱼ         (acumula output parcial)
  Oᵢ /= sum(Pᵢⱼ)            (normaliza al final)
```

El truco matemático es el **softmax incremental**: podés computar `softmax` por bloques sin tener toda la matriz, trackeando `max` y `sum` parciales y corrigiendo al final. Es exacto — no es aproximación.

### 2.3 FlashAttention-2 — Mejor particionado

FA-2 mejora dos cosas sobre FA-1:

| Mejora | FA-1 | FA-2 |
|---|---|---|
| **Paralelismo** | Paraleliza sobre batch × heads | Además paraleliza sobre **sequence length** (más threads) |
| **Work partitioning** | Cada thread block procesa un head | Distribuye trabajo más uniforme entre SMs |
| **Causal masking** | Branch dentro del loop | Evita cómputo de bloques causally-masked (skip) |
| **Speedup vs naive** | 2-3× | **2-4×** (hasta 2× sobre FA-1) |

Para secuencias largas (16k+), FA-2 logra **~70% de utilización de FLOPs** de la GPU vs ~30% de atención naive — no solo es más rápido, usa mejor el hardware.

### 2.4 Exacto, no aproximado

A diferencia de Sparse Attention o Linformer, FlashAttention es **matemáticamente idéntico** a la atención estándar. Mismos outputs, misma calidad, solo más rápido y con menos memoria. No hay trade-off de accuracy — es puro win de sistemas.

## 3 Evidencia / Experimentos

Benchmarks en A100 40GB, FP16, `d=128`, `n` variable:

| Secuencia (n) | Atención naive | FlashAttention-1 | FlashAttention-2 | Speedup FA-2 vs naive |
|---|:---:|:---:|:---:|:---:|
| 1k | 12 TFLOPs | 28 TFLOPs | **45 TFLOPs** | 3.7× |
| 4k | 8 TFLOPs | 22 TFLOPs | **38 TFLOPs** | 4.7× |
| 8k | OOM | 18 TFLOPs | **35 TFLOPs** | ∞ (naive OOM) |
| 16k | OOM | 15 TFLOPs | **32 TFLOPs** | ∞ |

- **FA-2 es 2× FA-1** en secuencias largas (4k-16k) por mejor paralelismo.
- **4× vs naive** en 1k-4k donde naive aún no hace OOM.
- **Permite 16k en A100 sin OOM** donde naive falla en 8k.
- **BERT training:** 1.3× end-to-end (no solo atención, también FFN y overhead).
- **GPT-2 1.5B training:** 1.5× end-to-end con FA-2 en 8k context.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto FlashAttention | Dónde te impacta en el repo |
|---|---|
| **Context 16k sin OOM local** | Si corrés Phi-3 3.8B o R1-Distill-7B Q4 en `desktop-app` Rust sidecar, FlashAttention (vía `candle` o `llama.cpp` con `flash_attn` feature) es lo que te deja usar 16k de contexto en una GPU modesta (8GB) sin swap. Sin FA, OOM en 4k. Verificá que tu runtime lo tenga habilitado — `llama.cpp` lo trae con `--flash-attn`. |
| **Costo O(n²) no desaparece** | FA no cambia O(n²) — solo lo hace más eficiente en memoria y HBM. Con `n=128k` remoto (GPT-4), seguís pagando cuadrático en FLOPs aunque el server use FA. Tu `loadSelected 20/100` y `compaction miser/ultra` siguen necesarios — FA no te salva de mandar historial gigante. |
| **Latencia SSE y TTFT** | Time-to-first-token (TTFT) depende de procesar todo el prompt (prefill) con atención. FA reduce ese prefill 2-4×, lo que baja el tiempo hasta tu primer `message.part.delta`. Si tu SLM local tiene FA, el primer token llega más rápido. |
| **Decisión de routing local vs remoto** | Para prompts de 8k-16k, un Phi-3 local con FA puede ser competitivo en latencia vs GPT-4 remoto sin FA (o con FA pero con RTT de red). Para 128k, el remoto con FA + infra optimizada gana — no intentes 128k local. |
| **Mamba (paper 13) como alternativa** | Si FA te da 16k eficiente pero necesitás 1M, mirá Mamba (O(n) lineal). FA es el techo del Transformer; Mamba es arquitectura distinta. Para tu thin client actual, FA alcanza — Mamba es futuro. |
| **IndexedDB v2 y `fsx`/`external_router`** | FA no cambia tu `IndexedDB v2` (`DB_VERSION = 2` merge-only) ni tu `fs_router.rs` — FA acelera el modelo, no el harness. Pero al bajar TTFT 2-4×, podés permitirte mandar 20-30 mensajes sin compaction donde antes necesitabas `miser`. Tu `external_router.rs` con `probe 250ms` no se beneficia de FA (es I/O, no atención), pero el `ptyx :4849` sí si el modelo que lo atiende es local con FA. |
| **Verificación en `ptyx :4849`** | Si bencheás SLM local, medí con y sin `--flash-attn` para ver el delta real en tu hardware. El `ptyx` que ejecuta `cargo check` no usa FA, pero el SLM que genera el fix sí. |

```bash
# desktop-app — verificar FlashAttention en llama.cpp / candle
# Con flash-attn habilitado vs sin él:

# Sin FA (naive) — OOM en 8k con 8GB VRAM
llama.cpp --model phi-3-3.8B-Q4.gguf --ctx-size 8192 --prompt "test"

# Con FA — 16k sin OOM, 2-4× más rápido en prefill
llama.cpp --model phi-3-3.8B-Q4.gguf --ctx-size 16384 --flash-attn --prompt "test"

# Benchmark: medí TTFT y tokens/s en ambos
```

## 5 Anti-patterns / Limitaciones

- **FA no hace O(n²) → O(n).** Sigue siendo cuadrático en FLOPs — solo ahorra HBM. Con `n=1M` ni FA te salva; necesitás Mamba o sparse attention. No creas que FA te da contexto infinito.
- **Solo acelera atención, no todo el modelo.** El FFN, embeddings y sampling siguen igual. El speedup end-to-end es 1.3-1.5×, no 4× — el 4× es solo del kernel de atención.
- **Requiere GPU con SRAM suficiente.** En CPU o en mobile sin GPU dedicada, FA no aplica — el bottleneck es distinto. Para APK Android con SLM en CPU, mirá otras optimizaciones (cuantización, speculative decoding).
- **No confundir FA-1 con FA-2.** Si tu runtime dice "flash attention" sin versión, probablemente es FA-1. FA-2 es 2× mejor en secuencias largas — verificá qué versión tenés.
- **Overhead de implementación.** FA requiere kernels CUDA custom (no es solo PyTorch naive). Si usás `candle` en Rust, asegurate que compile con feature `flash-attn` y que tu GPU lo soporte (Ampere+ para FA-2 óptimo).

## 6 Ejercicios prácticos (en tu repo)

1. **Bencheá SLM local con y sin FlashAttention.** Si tenés Phi-3 o R1-Distill corriendo en `desktop-app` vía `llama.cpp` o `candle`, medí: (a) `TTFT` para prompt de 4k tokens con y sin `--flash-attn`, (b) `tokens/s` en prefill, (c) memoria VRAM pico. ¿Se replica el 2-4× del paper en tu hardware? Documentá en `desktop-app/docs/slm-bench.md`.

2. **Estimá el ahorro de FA en tu contexto real.** Tomá una sesión típica de tu app (ej: 50 mensajes, ~8k tokens de historial). Estimá `QKᵀ` size: `n² × heads × layers × 2 bytes`. ¿Cuánto HBM ahorraría FA? ¿Justifica activar `--flash-attn` vs el overhead de compilar el kernel?

3. **Compará FA vs Mamba para contexto largo.** Leé el paper de Mamba (13-mamba-2023.md en esta serie) y compará: para `n=16k`, ¿FA o Mamba gana en tu hardware? Para `n=128k`, ¿cuál es viable? Bosquejá una tabla de decisión `n → arquitectura recomendada` para tu routing local vs remoto.

## 7 Referencias

- **Paper FA-2:** Dao, *FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning*, 2023-07-17 — https://arxiv.org/abs/2307.08691
- **Paper FA-1:** Dao et al., *FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness*, NeurIPS 2022 — https://arxiv.org/abs/2205.14135
- **Base:** Vaswani et al., *Attention Is All You Need* (1706.03762) — paper 01 de esta serie, el O(n²) que FA acelera.
- **Alternativa O(n):** Gu & Dao, *Mamba* (2312.00752) — paper 13, SSM lineal que evita O(n²) por diseño.
- **Implementaciones:** https://github.com/Dao-AILab/flash-attention · `llama.cpp --flash-attn` · `candle` crate con feature `flash-attn`.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (diagrama HBM vs SRAM) del paper original
- [ ] Entiendo por qué FA es exacto (no aproximado) y cómo funciona el softmax incremental por bloques
- [ ] Sé la diferencia entre FA-1 y FA-2 y qué speedup esperar en mi hardware
- [ ] Verifiqué si mi SLM local (llama.cpp/candle) tiene FlashAttention habilitado
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 01 Reasoning · opencode-remote-android*
