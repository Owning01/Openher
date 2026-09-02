# Attention Is All You Need — El Transformer (Vaswani et al., 2017)

> **Autores:** Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin / Google Brain
> **Año:** 2017 · **Prioridad:** Imprescindible · **Lectura:** ~25 min
> **Link verificado:** [https://arxiv.org/abs/1706.03762](https://arxiv.org/abs/1706.03762)
> **Categoría Papers:** 01 Reasoning · **Nivel:** avanzado · **Versión:** NeurIPS 2017

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper original:** Attention Is All You Need (Vaswani et al., NeurIPS 2017) — Google Brain / Google Research.
> **Link:** https://arxiv.org/abs/1706.03762
> **Relevancia para opencode-remote-android:** explica *por qué* existe tu SSE streaming token-a-token, por qué tu context window tiene costo cuadrático y por qué paginás con IndexedDB v2 en lugar de mandar todo el historial.
> **Prioridad:** Imprescindible (fundacional) · **Tiempo:** 25 min

## 1 Introducción — Qué problema resuelve

Antes de 2017, traducción y lenguaje se hacían con RNNs y LSTMs: procesaban token por token, secuencial, sin paralelismo. Entrenar WMT En-De tardaba semanas y escalar era un dolor. Los autores se preguntaron algo brutalmente simple: ¿y si tiramos la recurrencia a la basura y dejamos solo atención?

El Transformer propone exactamente eso: una arquitectura encoder-decoder donde **todo es atención**. Sin convoluciones, sin recurrencia. Solo `Attention(Q,K,V)` + feed-forward + positional encoding. El truco es que al eliminar la secuencialidad, podés paralelizar el entrenamiento en 8 GPUs y terminar en 3.5 días lo que antes llevaba semanas.

Para vos, que mantenés un thin client que consume `opencode serve` vía REST + SSE, este paper explica tres cosas que sufrís a diario: por qué el servidor te *streamea* tokens de a uno (decoder autoregresivo con masked attention), por qué cada token extra en el prompt te duele en latencia y guita, y por qué no podés simplemente mandar 500 mensajes de historial sin truncar.

## 2 Ideas clave

### 2.1 Scaled Dot-Product Attention

La fórmula que cambió todo:

```
Attention(Q, K, V) = softmax(Q · Kᵀ / √dₖ) · V
```

- `Q, K, V` son proyecciones lineales del input (queries, keys, values).
- División por `√dₖ` evita que los dot products se vayan a valores gigantes y saturen el softmax (gradientes muertos).
- Intuición: cada token pregunta "¿a quién le presto atención?" — el softmax le da un peso a cada otro token.

En tu app, cuando el modelo genera el próximo token del `message.part.delta`, está haciendo exactamente esta operación sobre todo el contexto previo.

### 2.2 Multi-Head Attention — 8 cabezas piensan distinto

En lugar de una sola atención, el Transformer proyecta `Q/K/V` en **h = 8** subespacios distintos y hace atención en paralelo:

```
MultiHead(Q,K,V) = Concat(head₁, ..., head₈) · Wᴼ
donde headᵢ = Attention(Q·Wᵢᵟ, K·Wᵢᴷ, V·Wᵢⱽ)
```

Cada head aprende a mirar algo diferente: uno sintaxis, otro correferencia, otro posición relativa. Es como tener 8 filtros especializados. Ablation del paper: sacar multi-head baja **0.9 BLEU** — no es decoración.

### 2.3 Positional Encoding sinusoidal

Sin RNN no hay noción de orden. Solución: sumar al embedding una señal sinusoidal fija:

```
PE(pos, 2i)   = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```

Ventaja: es determinística, no agrega parámetros y —en teoría— permite extrapolar a secuencias más largas que las vistas en training. En la práctica, el encoding original se rompe pasando ~2k tokens sin RoPE/ALiBi (ver limitaciones).

### 2.4 El costo que te persigue: O(n² · d)

Atención es cuadrática en longitud de secuencia `n`. Con `n = 128k` tokens y `d = 512` por head, son ~16 mil millones de operaciones por head, por capa. Por eso:

- Tu `loadSelected` pagina de a 20/100 mensajes, no 500.
- Tu `polling 3.5s` existe — no podés mandar el historial completo en cada request sin fundir latencia.
- `miser/ultra` no es capricho de UX, es física.

### 2.5 Residual + LayerNorm — Entrenar profundo sin morir

Cada sub-capa (atención o FFN) tiene `LayerNorm(x + Sublayer(x))`. El residual deja que el gradiente fluya sin desvanecerse; sin esto, 6 capas ya son inestables.

## 3 Evidencia / Experimentos

| Config | BLEU En-De (WMT14) | BLEU En-Fr | Params | Tiempo (8× P100) |
|--------|:------------------:|:----------:|:------:|:----------------:|
| Transformer base (65M) | **27.3** | 38.1 | 65M | 12h |
| Transformer big (213M) | **28.4** | **41.8** | 213M | 3.5 días |
| Ensemble SOTA previo | 26.30 | 41.0 | — | semanas |
| Sin multi-head (ablation) | 26.4 (−0.9) | — | — | — |
| Sin positional encoding | no converge | — | — | — |

- **WMT 2014 En-De:** 28.4 BLEU supera al mejor ensemble previo por +2.0 con una fracción del tiempo.
- **WMT En-Fr:** 41.8 BLEU (41.0 reportado en abstract, 41.8 con checkpoint promedio).
- **Parsing (WSJ):** también SOTA con mismo modelo, demostrando que no es solo traducción.

El paper no solo gana en métrica: gana en **costo de entrenamiento**. Ese es el argumento que permitió escalar a GPT-3/4 después.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo sufrís / usás en el repo |
|---|---|
| **Decoder autoregresivo + masked attention** | Tu `SSE` (`message.part.delta` con `partID`) es literalmente el loop autoregresivo del decoder: genera token `t+1` atendiendo solo a `1..t`. Por eso llega token-a-token y no en bloque. Ver `web/src/shared/sse/handler.ts`. |
| **Costo O(n²)** | Cada mensaje extra en `useMessages` / `loadSelected` paga cuadrático. Tu paginación `20/100` y `compaction` (`miser/ultra`) son mitigaciones directas. Logueá `tokens² × layers` en `shared/api/client.ts` para decidir cuándo truncar. |
| **Lost-in-the-Middle** | Con contextos largos, el Transformer atiende peor al medio. Solución: reordená — poné lo crítico al inicio o al final del prompt antes de `sendPrompt`. Implementá un reranker BM25 que mueva top-3 relevante a los bordes. |
| **IndexedDB v2 = memoria externa** | Como no podés meter 500 mensajes en contexto (O(n²) te mata), paginás y cacheás merge-only en IndexedDB (`DB_VERSION = 2`). El paper explica por qué no hay alternativa barata sin arquitectura nueva (ver Mamba/FlashAttention más adelante). |
| **Positional encoding → RoPE** | Si usás Phi-3 local (3.8B) vía `desktop-app` Rust sidecar, no esperes que maneje 128k con positional sinusoidal viejo. Necesitás modelos con RoPE/ALiBi. |
| **Routing local vs remoto** | Para `/help` o queries triviales, mandar 4k tokens a GPT-4 remoto paga O(n²) caro. Rutear a Phi-3 local es correcto por física, no solo por costo API. |
| **`ptyx :4849` y `fsx`/`external_router`** | Cada `tool_call` (`shell.ptyx.exec`, `shell.fs.read`, `shell.external.*`) agrega tokens al contexto que pagan O(n²). Por eso tu `external_router.rs` hace `probe` TCP 250ms + `ureq 700ms` y cachea con `OnceLock 1500ms` — evita round-trips que inflan contexto. Batch de `fsx` reads (ver ReWOO paper 11) reduce turnos y tokens. |

```ts
// shared/api/client.ts — estimá costo antes de mandar
function estimateAttentionFlops(tokens: number, layers = 32, d = 4096) {
  // O(n²·d) por capa, aproximado
  return tokens * tokens * d * layers;
}
const flops = estimateAttentionFlops(historyTokens);
if (flops > 1e12) compactHistory("miser"); // ¡triggereá compaction!
```

## 5 Anti-patterns / Limitaciones

- **No creas en "contexto infinito" del vendor.** Aunque te vendan 1M tokens, el costo O(n²) y el efecto Lost-in-Middle (Liu et al. 2023) degradan calidad en el medio del contexto. Medí, no confíes.
- **Positional encoding sinusoidal no extrapola.** El original falla feo pasando ~2k sin RoPE/ALiBi/YARN. Si tu modelo local usa sinusoidal puro, no le pidas 16k.
- **Atención densa sin sparse = latencia SSE alta.** Mandar historial completo sin truncar te da TTFT (time-to-first-token) de segundos. Usá FlashAttention local o paginación agresiva.
- **No confundas atención con comprensión.** El modelo puede atender perfecto y aún alucinar si el prompt es ambiguo. Atención ≠ razonamiento (para eso están CoT/ReAct/ToT).
- **Overhead de multi-head en mobile.** 8 heads × 6 capas es pesado para APK. Si corrés SLM en Android, preferí modelos con GQA (Grouped-Query Attention).

## 6 Ejercicios prácticos (en tu repo)

1. **Mide el costo cuadrático real.** En `web/src/shared/api/client.ts`, logueá `tokens enviados` en cada `sendPrompt` y estimá FLOPs con `tokens² × layers`. Graficá latencia SSE vs tokens (20, 50, 100, 200 mensajes en `loadSelected`). ¿A partir de cuántos tokens la latencia se duplica? ¿Justifica truncar en 100?

2. **Mitigá Lost-in-Middle.** Implementá un reranker BM25 simple en `web/src/features/compact/` que tome el historial, rankee mensajes por relevancia al último user prompt y reordene: top-3 relevante al inicio y al final, resto al medio. Medí si baja alucinación en 10 queries de prueba (ej: preguntá algo del primer mensaje tras 50 turnos).

3. **Tipá tu SSE como decoder.** En `web/src/shared/sse/handler.ts`, definí `type ReActPart = { type: "reasoning" | "tool_call" | "tool_result" }` y mapeá `message.part.delta` a ese tipo. Logueá cuántos tokens de `reasoning` vs `tool_call` genera el modelo por turno. ¿Qué proporción indica que el modelo está "pensando" vs "actuando"?

## 7 Referencias

- **Paper:** Vaswani et al., *Attention Is All You Need*, NeurIPS 2017 — https://arxiv.org/abs/1706.03762 · PDF: https://arxiv.org/pdf/1706.03762
- **Visual obligatorio:** Jay Alammar, *The Illustrated Transformer* — http://jalammar.github.io/illustrated-transformer/
- **Relacionados en esta serie:** CoT (2201.11903), ReAct (2210.03629), FlashAttention-2 (2307.08691), Mamba (2312.00752), Lost in the Middle (2307.03172).
- **Para profundizar:** *Efficient Transformers: A Survey* (Tay et al., 2022) — panorama de mitigaciones O(n²).

---

## Checklist de lectura

- [ ] Leí el abstract y la sección 3 (Model Architecture) del paper original
- [ ] Entiendo por qué `Attention = softmax(QKᵀ/√dₖ)V` y qué hace `√dₖ`
- [ ] Puedo explicar el trade-off O(n²) vs calidad a un colega en 2 minutos
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana (ej: reranker, log de FLOPs)
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 01 Reasoning · opencode-remote-android*
