# Mamba — State Space Model lineal sin atención (Gu & Dao, 2023)

> **Autores:** Gu, Dao / Princeton + Carnegie Mellon
> **Año:** 2023 · **Prioridad:** MEDIA P1 · **Lectura:** ~14 min
> **Link verificado:** [https://arxiv.org/abs/2312.00752](https://arxiv.org/abs/2312.00752)
> **Categoría Papers:** 01 Reasoning · **Nivel:** intermedio · **Versión:** arXiv 2023-12-01

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Mamba: Linear-Time Sequence Modeling with Selective State Spaces (Gu & Dao, 2023).
> **Link:** https://arxiv.org/abs/2312.00752 — Código: https://github.com/state-spaces/mamba
> **Relevancia para opencode-remote-android:** es la primera arquitectura que rompe el O(n²) del Transformer (paper 01) por diseño, no por optimización. Si tu thin client algún día necesita 1M de contexto sin fundir memoria, Mamba (o híbridos como Jamba) es el futuro. Hoy es vigilancia tecnológica — entendé cuándo FA (paper 12) alcanza y cuándo necesitarás Mamba.
> **Prioridad:** MEDIA P1 · **Nuevo vs Transformer:** O(n) lineal con estado selectivo vs O(n²) atención densa.

## 1 Introducción — Qué problema resuelve

El Transformer es O(n²) — FlashAttention (paper 12) lo hace más eficiente pero no cambia la complejidad. Con `n=128k` pagás 16B ops por head; con `n=1M` es impagable incluso con FA. Los State Space Models (SSMs) clásicos (S4, H3) son O(n) lineales pero no pueden hacer *selective copying* — no distinguen qué parte de la secuencia importa y qué ignorar, algo que la atención hace naturalmente.

Mamba propone **SSM selectivo**: los parámetros del SSM (`Δ, B, C`) dependen del input — el modelo aprende a *seleccionar* qué recordar y qué olvidar según el contenido. Es como atención pero con estado recurrente O(n) y un algoritmo hardware-aware (parallel scan) que lo hace 5× más rápido que Transformer en inferencia.

Resultado: Mamba iguala o supera al Transformer en 2k-8k y lo supera en secuencias largas (16k+), con **5× throughput** y contexto **1M** demostrado. Para tu thin client, significa que el día que necesites historial de 1M sin compaction, Mamba evita tu bottleneck O(n²) de raíz.

## 2 Ideas clave

### 2.1 SSM clásico — Recurrencia lineal O(n)

Un SSM mapea secuencia `x(t)` a `y(t)` vía estado latente `h(t)`:

```
h'(t) = A·h(t) + B·x(t)      (evolución del estado)
y(t)  = C·h(t)               (output)

Discretizado (con step Δ):
  hₖ = Ā·hₖ₋₁ + B̄·xₖ
  yₖ = C·hₖ
```

- `A, B, C, Δ` son parámetros. En S4 clásico son **fijos** (no dependen de `xₖ`) — por eso no puede seleccionar.
- Complejidad O(n): cada token actualiza `hₖ` con una operación matricial fija, sin atender a todos los tokens previos.
- Problema: como `B, C, Δ` son fijos, el SSM no puede ignorar tokens irrelevantes — todo entra al estado por igual.

### 2.2 Selección — Hacer que B, C, Δ dependan del input

Mamba hace **selectivos** a `B, C, Δ`:

```
Bₖ = Linear_B(xₖ)     ← depende del token actual
Cₖ = Linear_C(xₖ)     ← depende del token actual
Δₖ = softplus(Linear_Δ(xₖ))  ← step size adaptativo
```

- Si `xₖ` es irrelevante (ej: token de relleno), `Δₖ` se hace chico → `hₖ` casi no cambia (olvida).
- Si `xₖ` es importante (ej: nombre de variable), `Δₖ` grande → `hₖ` se actualiza fuerte (recuerda).
- Esto le da a Mamba la capacidad de *selective copying* que antes solo tenía atención: puede copiar un token visto hace 10k posiciones si es relevante, e ignorar el resto.

### 2.3 Hardware-aware — Parallel scan en SRAM

SSM selectivo es recurrente (hₖ depende de hₖ₋₁) — naive sería secuencial y lento. Mamba usa **parallel scan** (associative scan) que paraleliza la recurrencia en GPU:

- Reordena cómputo para SRAM (como FlashAttention) — no materializa estados intermedios en HBM.
- Usa kernel fusionado: discretización + scan + output en un solo kernel CUDA.
- Resultado: **5× throughput** vs Transformer en inferencia para n=2k-8k, y escala lineal a 1M.

### 2.4 Mamba vs Transformer — Cuándo gana cada uno

| Aspecto | Transformer + FA | Mamba |
|---|:---:|:---:|
| **Complejidad** | O(n²) | **O(n) lineal** |
| **Contexto 2k-8k** | SOTA | **Empata o supera** |
| **Contexto 16k-1M** | OOM / lento | **Gana claro** |
| **Throughput (2k)** | 1× | **5×** |
| **Selective copying** | Nativo (atención) | **Ahora sí (selectivo)** |
| **Ecosistema** | Maduro (GPT-4, etc.) | Joven (Jamba, Codestral Mamba) |

## 3 Evidencia / Experimentos

| Benchmark | Transformer 1.3B | Mamba 1.3B | Mamba 2.8B |
|---|:---:|:---:|:---:|
| **LAMBADA** (ppl) | 16.7 | **10.2** | **8.1** |
| **HellaSwag** | 45.2% | **55.6%** | **59.1%** |
| **PIQA** | 71.1% | **74.2%** | **75.8%** |
| **WinoGrande** | 58.3% | **60.9%** | **63.4%** |
| **OpenBookQA** | 36.4% | **40.1%** | **44.2%** |
| **Throughput (2k, tok/s)** | 1× | **5×** | — |
| **Contexto máximo demo** | 8k (OOM en 16k sin FA) | **1M** | **1M** |

- **Supera Transformer 1.3B en todos los benchmarks** de lenguaje con mismos parámetros y datos.
- **5× throughput** en generación autoregresiva (el caso de tu SSE `message.part.delta`).
- **Selective Copying task sintético:** Mamba 99.8% vs Transformer 90.2% vs S4 0% — demuestra que la selección funciona.
- **1M context:** demo con 1M tokens sin degradación — impensable con Transformer O(n²).

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto Mamba | Dónde te impacta en el repo |
|---|---|
| **O(n) vs O(n²) — fin del bottleneck de historial** | Hoy paginás con `loadSelected 20/100` y compactás con `miser/ultra` porque O(n²) te mata. Con Mamba 1M, podrías mandar 500 mensajes sin truncar y el costo crece lineal, no cuadrático. Tu `IndexedDB v2` seguiría útil como cache, pero no como paginación obligatoria por OOM. |
| **Throughput 5× en SSE streaming** | Tu `message.part.delta` token-a-token es generación autoregresiva — exactamente donde Mamba es 5× más rápido. Si el server remoto usara Mamba, tu SSE llegaría 5× más rápido. Hoy el server es Transformer, pero vigilá si `opencode serve` adopta Mamba/Jamba. |
| **Vigilancia: Jamba, Codestral Mamba, Mamba-2** | No migres hoy — el ecosistema Transformer (GPT-4, R1, Phi-3) es más maduro. Pero seguí: **Jamba** (AI21, híbrido Transformer+Mamba 52B), **Codestral Mamba** (Mistral, code), **Mamba-2** (2024, 2× más rápido que Mamba-1). Cuando alguno supere a GPT-4 en code, evaluá routing. |
| **SLM local con Mamba** | Si corrés SLM en `desktop-app` Rust sidecar, un Mamba-1.3B local con 1M context podría reemplazar a Phi-3 3.8B con 4k context para tareas de historial largo. Menos VRAM, más contexto, más rápido. Buscá `mamba.rs` o `candle` con soporte Mamba. |
| **Híbrido Transformer+Mamba** | Jamba intercala capas Transformer (para calidad) y Mamba (para eficiencia). Es el futuro probable: no Mamba puro, sino híbrido. Para tu harness, el modelo remoto podría ser híbrido sin que cambies nada — solo notás más contexto y menos latencia. |
| **IndexedDB y ptyx sin cambios** | Mamba no cambia tu `ptyx :4849`, `fsx`, `external_router` ni `shared/sse/handler.ts` — solo cambia el costo del contexto. Tu harness es agnóstico a la arquitectura del modelo. |

```
┌──────────────────────────────────────────────────────┐
│  Decisión de arquitectura según contexto necesario   │
│                                                      │
│  n < 4k    → Transformer + FA (hoy, maduro)          │
│  4k < n < 32k → Transformer + FA-2 (ok con FA)      │
│  32k < n < 1M → Mamba / Jamba (futuro, O(n))        │
│  n > 1M    → Mamba puro o híbrido + retrieval       │
│                                                      │
│  Tu thin client hoy: n ~ 8k con compaction → FA ok  │
│  Si quitás compaction: n ~ 50k → Mamba gana          │
└──────────────────────────────────────────────────────┘
```

## 5 Anti-patterns / Limitaciones

- **Ecosistema joven.** Mamba no tiene el tooling de Transformer (no hay GPT-4-Mamba, ni R1-Mamba). Si migrás hoy, perdés calidad en code/reasoning vs GPT-4. Esperá a que un Mamba supere a Transformer en tu benchmark antes de migrar.
- **No es drop-in replacement.** Mamba tiene API distinta (estado recurrente vs KV-cache). Tu `opencode serve` no puede cambiar a Mamba sin reentrenar — no es solo cambiar un flag.
- **Híbridos son el futuro, no Mamba puro.** Mamba puro pierde levemente en tareas que requieren atención densa (ej: retrieval preciso en 2k). Jamba (híbrido) combina lo mejor — no apuestes solo a Mamba puro.
- **No resuelve Lost-in-the-Middle.** O(n) no significa que atienda bien a todo el contexto — Mamba también puede degradar en el medio si no está bien entrenado. Seguís necesitando reranking y compaction inteligente.
- **No confundir con Mamba-2.** Mamba-2 (2024) es 2× más rápido que Mamba-1 con SSD (State Space Duality). Si ves benchmarks de Mamba, verificá versión — Mamba-2 es el relevante para deploy.

## 6 Ejercicios prácticos (en tu repo)

1. **Compará costo O(n²) vs O(n) para tu contexto real.** Tomá una sesión típica (ej: 50 mensajes, ~8k tokens). Calculá FLOPs Transformer: `n² × layers × d` vs Mamba: `n × layers × d × state_size`. ¿A partir de qué `n` Mamba gana por >2×? Graficá `n=1k, 4k, 16k, 64k, 1M` y marcá dónde tu thin client cruza el umbral.

2. **Probá un Mamba local si existe.** Buscá un checkpoint Mamba-1.3B o Codestral Mamba en HuggingFace y correlo en `desktop-app` vía `candle` o `mamba.rs` si hay soporte. Bencheá `tokens/s` y `TTFT` para 4k context vs Phi-3 3.8B. ¿Se replica el 5× throughput? Documentá en `desktop-app/docs/slm-bench.md`.

3. **Diseñá el plan de migración a híbrido.** Bosquejá en `web/docs/architecture-future.md`: si `opencode serve` ofreciera un modelo Jamba 52B híbrido con 256k context, ¿qué cambiarías en tu harness? ¿Podrías eliminar `compaction miser/ultra`? ¿Qué parte de `IndexedDB v2` seguiría necesaria como cache vs paginación obligatoria? Estimá ahorro de código.

## 7 Referencias

- **Paper:** Gu & Dao, *Mamba: Linear-Time Sequence Modeling with Selective State Spaces*, 2023-12-01 — https://arxiv.org/abs/2312.00752
- **Mamba-2:** Dao & Gu, *Transformers are SSMs: Generalized Models and Efficient Algorithms Through Structured State Space Duality*, 2024-05-31 — https://arxiv.org/abs/2405.21060
- **Híbrido:** Lieber et al., *Jamba: A Hybrid Transformer-Mamba Language Model*, AI21 2024 — https://arxiv.org/abs/2403.19887
- **Code:** Codestral Mamba (Mistral) — https://mistral.ai/news/codestral-mamba/
- **Base SSM:** Gu et al., *Efficiently Modeling Long Sequences with Structured State Spaces* (S4, 2111.00396) — predecesor no-selectivo.
- **Relacionados:** FlashAttention-2 (2307.08691) — paper 12, optimización O(n²) vs Mamba O(n); Attention Is All You Need (1706.03762) — paper 01, el O(n²) que Mamba rompe.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (diagrama SSM selectivo) del paper original
- [ ] Entiendo por qué SSM clásico no puede hacer selective copying y cómo Mamba lo resuelve con B,C,Δ selectivos
- [ ] Sé la diferencia entre O(n²) Transformer, O(n²)+FA y O(n) Mamba y cuándo cada uno gana
- [ ] Tengo mapeados Jamba / Codestral Mamba / Mamba-2 como modelos a vigilar
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 01 Reasoning · opencode-remote-android*
