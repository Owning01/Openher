# Speculative Decoding — Acelerar inferencia 2-3× sin perder calidad (Leviathan et al., 2023)

> **Autores:** Leviathan, Kalman, Matias / Google Research
> **Año:** 2023 · **Prioridad:** MEDIA P1 · **Lectura:** ~13 min
> **Link verificado:** [https://arxiv.org/abs/2211.17192](https://arxiv.org/abs/2211.17192)
> **Categoría Papers:** 01 Reasoning · **Nivel:** intermedio · **Versión:** ICML 2023

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Fast Inference from Transformers via Speculative Decoding (Leviathan, Kalman, Matias, ICML 2023).
> **Link:** https://arxiv.org/abs/2211.17192 — Paper paralelo: Chen et al., *Accelerating Large Language Model Decoding with Speculative Sampling* (2302.01318).
> **Relevancia para opencode-remote-android:** es la técnica más directa para acelerar tu SLM local (Phi-3, R1-Distill) en `desktop-app` Rust sidecar sin cambiar modelo ni perder calidad. Draft pequeño propone k tokens, target grande verifica en paralelo — 2-3× speedup en tu `message.part.delta` streaming.
> **Prioridad:** MEDIA P1 · **Idea en una línea:** draftear barato, verificar caro en paralelo.

## 1 Introducción — Qué problema resuelve

La inferencia autoregresiva es secuencial: para generar 100 tokens, hacés 100 forward passes del modelo grande, uno por token, sin paralelismo. Cada forward es caro (671B params en R1, 7B en tu SLM local) y la GPU queda subutilizada esperando el próximo token.

Speculative Decoding rompe la secuencialidad: usás un **draft model pequeño y rápido** (ej: 1B) para proponer `k=4` tokens de una, y luego el **target model grande** (ej: 7B) verifica los 4 en **un solo forward paralelo**. Si el target acepta los 4, generaste 4 tokens con 1 forward del grande + 4 del chico (barato). Si rechaza en el token 2, te quedás con 1 token verificado + 1 corregido.

Resultado: **2-3× speedup** sin cambiar un bit de la distribución del target — la calidad es idéntica a generar con el grande solo. Es como tener un asistente que escribe borradores y un editor que corrige en lote.

## 2 Ideas clave

### 2.1 Draft + Verify — Dos modelos, un pipeline

```
Draft (1B, rápido):   propone [tok₁, tok₂, tok₃, tok₄]  (4 forwards baratos)
Target (7B, potente): verifica los 4 en 1 forward paralelo
  → compara P_target(tokᵢ) vs P_draft(tokᵢ) para cada i
  → acepta tok₁, tok₂ (target coincide)
  → rechaza tok₃ (target prefiere otro) → samplea corrección
  → descarta tok₄
  → output: [tok₁, tok₂, tok_corr]  (3 tokens con 1 forward del grande)
```

Sin speculative: 3 forwards del 7B. Con speculative: 4 forwards del 1B + 1 del 7B. Como el 1B es ~7× más rápido, el total es ~2-3× más rápido.

### 2.2 Criterio de aceptación — Sin pérdida de calidad

Para cada token propuesto `xᵢ`, se acepta con probabilidad:

```
p_accept = min(1, P_target(xᵢ) / P_draft(xᵢ))
```

- Si `P_target ≥ P_draft`, siempre se acepta (el grande está de acuerdo).
- Si `P_target < P_draft`, se acepta con prob `P_target/P_draft` (a veces el chico propone algo que el grande no haría).
- Si se rechaza, se samplea del residual `max(0, P_target − P_draft)` — garantiza que la distribución final es **idéntica** a samplear del target directamente.

Esto es clave: speculative decoding es **exacto**, no aproximado. Mismos outputs que sin él, solo más rápido. Verificado matemáticamente en el paper.

### 2.3 Speedup depende de acceptance rate

| Acceptance rate (α) | k (draft len) | Speedup esperado |
|---|:---:|:---:|
| 0.8 (draft bueno) | 4 | **2.5-3×** |
| 0.6 (draft medio) | 4 | **1.8-2×** |
| 0.4 (draft malo) | 4 | ~1.2× (casi no gana) |
| 0.8 | 8 | **3×** (pero más rechazos) |

El draft debe ser **buen imitador** del target. Si usás un draft aleatorio, α≈0 y no hay speedup. Por eso el paper recomienda draft del **mismo familia** (ej: Qwen-1.5B draftea para Qwen-7B) o destilado del target.

### 2.4 Alternativa sin draft model — Self-speculative

Si no tenés un draft pequeño, podés usar **el mismo target con early exit** (capas intermedias) o **n-gram lookup** (cache de tokens previos) como draft. Menos efectivo pero sin modelo extra. Para tu thin client, el caso natural es `R1-Distill-1.5B draftea para R1-Distill-7B`.

## 3 Evidencia / Experimentos

| Modelo | Draft | k | Speedup (wall-clock) | Calidad |
|---|:---|:---:|:---:|:---:|
| **LaMDA 137B** | LaMDA 8B | 4 | **2.1×** | idéntica |
| **T5-XXL 11B** | T5-small 60M | 4 | **3.4×** | idéntica |
| **T5-XXL 11B** | T5-base 220M | 4 | **2.6×** | idéntica |
| **GPT-like 97M** (demo) | 6M | 4 | **2.0×** | idéntica |

- **T5-XXL con T5-small:** 3.4× speedup — el caso extremo donde draft es 180× más chico.
- **LaMDA 137B con 8B:** 2.1× — más realista para tu caso (7B target, 1.5B draft).
- **Ablation k:** con `k=2`, speedup ~1.5×; con `k=8`, ~2.5× pero más varianza — `k=4` es el sweet spot.
- **Paper paralelo (Chen et al.):** confirma 2-3× con speculative sampling en GPT-3 175B.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto Speculative | Dónde lo aplicás en el repo |
|---|---|
| **Draft 1.5B + Target 7B local** | Tu `desktop-app` Rust sidecar corre SLM local. En lugar de un solo Phi-3 3.8B, corré **Qwen-1.5B (draft) + Qwen-7B (target)**. El 1.5B propone 4 tokens, el 7B verifica en 1 forward. Para streaming SSE `message.part.delta`, el usuario ve tokens 2-3× más rápido. |
| **`llama.cpp` con speculative** | `llama.cpp` soporta `--draft-model` desde 2024. Config: `llama.cpp --model qwen-7B-Q4.gguf --draft-model qwen-1.5B-Q4.gguf --draft-min 2 --draft-max 8`. Verificá que tu build de `llama.cpp` lo incluya. |
| **SSE streaming y TTFT** | Con speculative, el primer token no es más rápido (necesitás el primer draft+verify), pero los siguientes 3 llegan en el tiempo de 1. Para tu `ThinkingBlock` con long CoT (R1 genera 10k tokens), el speedup es masivo — el `<think>` se streamea 2× más rápido. |
| **Costo VRAM — dos modelos** | Necesitás VRAM para ambos: 7B Q4 (~4GB) + 1.5B Q4 (~1GB) = ~5GB. En una laptop con 8GB VRAM, entra. En APK Android, no — ahí usá solo el 1.5B sin speculative. |
| **Fallback sin draft en mobile** | En Android APK, donde no hay VRAM para dos modelos, deshabilitá speculative y usá solo el draft (1.5B) como modelo principal. Es el trade-off: velocidad (speculative en desktop) vs memoria (solo chico en mobile). |
| **Combinar con FlashAttention** | FA (paper 12) acelera el forward del target (prefill/verify); speculative reduce cuántos forwards del target necesitás. Son complementarios: FA 2× + speculative 2× = potencial 4× combinado en prefill largo. |
| **`ptyx :4849`, `fsx`, `IndexedDB v2` y `external_router`** | Speculative no cambia tu `ptyx :4849` (ejecuta el código ya generado, no acelera su generación directamente), pero al generar el `tool_call` 2-3× más rápido, el `ptyx` recibe el comando antes. Tu `IndexedDB v2` (`DB_VERSION = 2` merge-only) cachea sesiones — con speculative, el `loadSelected` trae historial más rápido porque el modelo lo genera antes. `fsx` y `external_router` (`probe 250ms`) son I/O bound, no se benefician de speculative (es optimización de decode del LLM). |

```bash
# desktop-app — speculative decoding con llama.cpp
# Requiere build con LLAMA_SPECULATIVE

# Sin speculative (baseline):
llama.cpp --model qwen-7B-Q4.gguf --ctx-size 4096 --prompt "Explicá qué hace fs_router.rs"

# Con speculative (draft 1.5B → target 7B):
llama.cpp --model qwen-7B-Q4.gguf \
          --draft-model qwen-1.5B-Q4.gguf \
          --draft-min 2 --draft-max 8 \
          --ctx-size 4096 \
          --prompt "Explicá qué hace fs_router.rs"
# Medí tokens/s en ambos — esperá 2-3× con buen draft
```

```rust
// desktop-app/src/infrastructure/slm_router.rs — bosquejo con speculative
struct SpeculativeSLM {
    draft: LlamaModel,   // Qwen-1.5B Q4, rápido
    target: LlamaModel,  // Qwen-7B Q4, potente
}

impl SpeculativeSLM {
    async fn generate(&self, prompt: &str, max_tokens: usize) -> String {
        // llama.cpp maneja draft+verify internamente si --draft-model está activo
        // o implementá el loop: draft k tokens → target verify → accept/reject
        self.target.generate_with_draft(&self.draft, prompt, max_tokens).await
    }
}
```

## 5 Anti-patterns / Limitaciones

- **Draft malo = sin speedup.** Si tu draft es de otra familia (ej: Phi-3 draftea para Qwen-7B), el acceptance rate cae a ~0.3 y no ganás nada. Usá draft de la **misma familia** y, si podés, destilado del target.
- **k muy grande no ayuda.** Con `k=16`, proponés muchos tokens pero la mayoría se rechazan — desperdiciás forwards del draft. `k=4` es el sweet spot empírico; `k=8` solo si tu draft es muy bueno (α>0.8).
- **VRAM doble en desktop.** Dos modelos en VRAM pueden hacer OOM si tu GPU es chica (4GB). En ese caso, usá speculative con draft en CPU y target en GPU, o bajá a Q4 más agresivo.
- **No aplica a prefills largos sin generación.** Si tu tarea es clasificar o rerankear (1 token de output), speculative no ayuda — solo acelera generación de múltiples tokens. Para tu `loadSelected` o `compact`, no hay ganancia.
- **No confundir con quantization.** Speculative es ortogonal a Q4/Q8 — podés tener ambos. Pero si tu target ya es Q4 muy agresivo y el draft también, el acceptance puede bajar porque ambos son ruidosos.

## 6 Ejercicios prácticos (en tu repo)

1. **Bencheá speculative vs no-speculative en desktop.** Si tenés `llama.cpp` con `--draft-model`, medí `tokens/s` para Qwen-7B solo vs Qwen-7B + Qwen-1.5B draft con `k=4` en 3 prompts (corto 100 tokens, medio 500, largo 2000 con long CoT). ¿Se replica el 2-3×? Medí también `acceptance rate` si `llama.cpp` lo loguea.

2. **Probá draft de distinta familia y medí α.** Corré Qwen-1.5B drafteando para Qwen-7B (misma familia) vs Phi-3-1.5B drafteando para Qwen-7B (distinta familia) con el mismo target y `k=4`. Medí speedup en ambos. ¿Cuánto cae α con draft de otra familia? Documentá en `desktop-app/docs/slm-bench.md`.

3. **Speculative + FlashAttention combinados.** Si tu `llama.cpp`/`candle` soporta ambos (`--flash-attn` + `--draft-model`), medí: (a) solo FA, (b) solo speculative, (c) ambos. ¿Los speedups se suman? Para un prompt de 4k context + 1k generación, ¿cuál aporta más — FA (prefill) o speculative (decode)?

## 7 Referencias

- **Paper principal:** Leviathan et al., *Fast Inference from Transformers via Speculative Decoding*, ICML 2023 — https://arxiv.org/abs/2211.17192
- **Paper paralelo:** Chen et al., *Accelerating Large Language Model Decoding with Speculative Sampling*, 2023-02-08 — https://arxiv.org/abs/2302.01318
- **Implementación:** https://github.com/ggerganov/llama.cpp — flag `--draft-model` para speculative decoding.
- **Relacionados:** FlashAttention-2 (2307.08691) — paper 12, complementario (acelera forward); Mamba (2312.00752) — paper 13, alternativa O(n) que también acelera decode pero por arquitectura.
- **Base:** Vaswani et al., *Attention Is All You Need* (1706.03762) — paper 01, el O(n²) que speculative evita parcialmente reutilizando forwards.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (diagrama draft→verify) del paper original
- [ ] Entiendo el criterio `min(1, P_target/P_draft)` y por qué es exacto (sin pérdida de calidad)
- [ ] Sé qué speedup esperar según acceptance rate y por qué el draft debe ser de la misma familia
- [ ] Verifiqué si mi `llama.cpp`/`candle` soporta `--draft-model` y con qué modelos
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 01 Reasoning · opencode-remote-android*
