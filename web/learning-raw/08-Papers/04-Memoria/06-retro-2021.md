# RETRO — Retrieval-Enhanced Transformer (Borgeaud et al., 2021)

> **Versión:** NeurIPS 2022 / arXiv 2112.04426 · **Año:** 2021 · **Autores:** Sebastian Borgeaud, Arthur Mensch, Jordan Hoffmann et al. (DeepMind) · **Link:** [https://arxiv.org/abs/2112.04426](https://arxiv.org/abs/2112.04426) · **Prioridad:** MEDIA P1 — clásico que muestra retrieval dentro del modelo, no fuera

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé el paper original — RETRO es el "qué pasaría si el retrieval fuera parte del Transformer". Todo uso respeta licencias.

---

## 1 Introducción

RAG pone el retrieval **fuera** del modelo: buscás docs, los concatenás al prompt, y el LLM genera. Funciona, pero es un parche: el modelo no fue entrenado para usar retrieval, lo aprende a medias. RETRO hace lo contrario: **mete el retrieval dentro de la arquitectura**, con atención cruzada diferenciable, y lo entrena desde cero (o retrofit).

La idea es chunked: dividí tu input en chunks de 64 tokens. Para cada chunk, recuperá 2 chunks vecinos de una DB de **2 trillones de tokens** (MassiveText) usando retriever BERT congelado. Luego, el Transformer atiende a esos chunks recuperados vía **chunked cross-attention (CCA)** en capas intermedias.

Resultado: RETRO 7.5B **iguala a GPT-3 175B y Gopher 280B** en The Pile con **25× y 37× menos parámetros**. No es magia; es que gran parte de lo que esos gigantes memorizan (Wikipedia, StackOverflow) no necesita estar en pesos si podés recuperarlo.

Para vos, la lección no es "entrená RETRO" (no vas a entrenar 7B). Es **arquitectural**: si algún día entrenás un SLM local para `opencode-remote` (ej: modelo que sugiere fixes de `EPERM`), no lo hagas closed-book; hacelo **retrieval-native** con `opencode.db` como DB, no como prompt.

---

## 2 Ideas clave

### 2.1 Chunked cross-attention (CCA)

El Transformer estándar es `self-attention` sobre el input. RETRO añade `cross-attention` a chunks recuperados:

```
Input: [chunk1 (64t)] [chunk2 (64t)] [chunk3 (64t)] ...

Para chunk i:
  1. Retriever: top-2 chunks de DB que son continuaciones de chunk i
  2. Encoder: BERT pequeño codifica esos 2 chunks → encodings E
  3. CCA: decoder atiende a E en capas 6,9,12,... (cada 3 capas desde 6)
```

| Capa | Operación | Qué atiende |
|---|---|---|
| 1-5 | Self-attention | Solo input previo |
| **6** | **CCA** | Input + 2 chunks recuperados |
| 7-8 | Self-attention | Input + contexto CCA |
| **9** | **CCA** | Re-atención a retrieval |
| ... | ... | ... |

**Fórmula CCA (simplificada):**

```
CCA(Q, K_ret, V_ret) = softmax(Q·K_ret^T / √d) · V_ret
donde K_ret, V_ret vienen del encoder de chunks recuperados
```

Solo 10% de params extra para CCA + encoder. El retriever (BERT) está **congelado** y no se entrena — es el mismo truco que RAG para evitar re-indexar.

### 2.2 Retriever: BERT congelado + SCaNN

No es DPR entrenado. Es **BERT base congelado** que embeddea chunks de 64 tokens. Búsqueda con **SCaNN** (ANN de Google) sobre 2T tokens shardados. Vecinos son **continuaciones**: si tu chunk es `"fsx.rs maneja move_entry"`, el vecino es el chunk siguiente en el doc original (`"con fallback copy+delete si rename falla"`). Esto da coherencia temporal al retrieval.

Para tu caso, el análogo es: chunk = 1 session o 1 file; vecino = siguiente chunk del mismo file/session. No kNN semántico puro sino **kNN de continuación**.

### 2.3 RETROfitting: convertir LLM pre-entrenado en RETRO

No necesitás entrenar desde cero. Podés tomar un Transformer pre-entrenado (ej: tu base 1B) y **añadir CCA + encoder** y fine-tunear con solo **3% de tokens extra** (vs preentrenamiento). El paper muestra que RETROfitted 7B iguala a RETRO-from-scratch en 95% de benchmarks.

```ts
// Analogía para tu SLM local futuro
// 1. Tomá modelo base (ej: Qwen2-0.5B)
// 2. Añadí cross-attention a opencode.db chunks
// 3. Fine-tune 3% tokens (unos 30M) con retrieval activo
// 4. Tenés SLM que "sabe" tu codebase sin memorizarlo
```

### 2.4 Por qué no es solo "RAG con otro nombre"

| Aspecto | RAG | RETRO |
|---|---|---|
| **Dónde está retrieval** | Fuera: pre-prompt | Dentro: cross-attention en capas medias |
| **Entrenamiento** | Retriever + gen joint, pero docs concatenados | End-to-end diferenciable, atención nativa |
| **K** | 5-10 docs | 2 chunks por cada 64 tokens (dense) |
| **Re-index** | Query encoder aprende | Retriever congelado, nunca re-indexa |
| **Ventana** | Limitada por prompt | Ilimitada: cada chunk trae sus vecinos |

RAG es **retrieval-then-generate**; RETRO es **retrieval-during-generation**, token a token.

---

## 3 Evidencia / Experimentos

| Benchmark | Métrica | RETRO 7.5B | GPT-3 175B | Gopher 280B | Jurassic 178B |
|---|---|---|---|---|---|
| **The Pile** | Perplexity ↓ | **12.1** | 12.6 | 12.3 | 13.8 |
| **Wikitext103** | PPL ↓ | **12.5** | 14.3 | 13.5 | — |
| **Curation Corpus** | PPL ↓ | **7.2** | 9.1 | 8.4 | — |
| **Natural Questions** | EM | **45.5** | 33.6 | 38.0 | — |

**Con DB 2T vs sin retrieval:** RETRO 7.5B sin retrieval (ablación) → PPL 13.8 en Pile (+1.7). El retrieval explica **~60% de la ganancia** vs baseline.

**Scaling:** RETRO 172M + retrieval iguala a baseline 1.3B sin retrieval. La curva es: **retrieval vale ~10× params** en PPL. Por eso el paper habla de 25×: no es que 7.5B = 175B en todo, sino en **perplexity sobre corpus con overlap**.

**Gotcha honesto — overlap inflado:** hasta 20% de los chunks de eval aparecen casi idénticos en la DB de 2T (Wikipedia duplicada). Si deduplicás eval vs DB, la ganancia de RETRO cae de 25× a ~8×. No asumas 25× gratis en tu codebase si tu DB no tiene overlap con eval.

**RETROfitting:** con 3% tokens extra, RETROfitted 7B llega a PPL 12.4 vs 12.1 from-scratch. 0.3 de gap por 33× menos cómputo. Muy buen trade-off.

---

## 4 Cómo aplica a opencode-remote-android

No vas a entrenar RETRO 7B. Pero las ideas aplican en 3 niveles, de más a menos ambicioso:

| Nivel | Qué harías | Cuándo |
|---|---|---|
| **Hoy (RAG externo)** | Usa RETRO como inspiración: chunk tu `opencode.db` en 64 tokens, no en sessions enteras; retrieval denso por chunk, no por doc | Ya — cambia `vec_sessions` a `vec_chunks` |
| **Próximo (SLM local 0.5B)** | Fine-tune Qwen2-0.5B con CCA simulado: concat `query + top-2 chunks` y entrena a generar con retrieval; es "RETRO lite" sin arquitectura custom | Si querés sugerencias offline sin server |
| **Futuro (RETRO real)** | Implementa CCA en tu SLM con `opencode.db` como DB 2T (en tu caso 1M tokens, trivial) | Solo si entrenás modelo propio |

```ts
// Nivel Hoy: chunking RETRO-style para tu RAG actual
function chunkSessions(sessions: Session[], chunkSize = 64): Chunk[] {
  // No indexes sessions enteras; chunqueá a 64 tokens (~250 chars)
  return sessions.flatMap(s => {
    const tokens = tokenize(s.text);
    const chunks = [];
    for (let i = 0; i < tokens.length; i += chunkSize) {
      chunks.push({
        id: `${s.id}#${i/chunkSize}`,
        text: tokens.slice(i, i+chunkSize).join(" "),
        nextChunk: tokens.slice(i+chunkSize, i+chunkSize*2).join(" "), // vecino = continuación
        sessionId: s.id,
      });
    }
    return chunks;
  });
}

// Retrieval por chunk, no por session
async function retroLiteSearch(query: string, k=4) {
  const qChunk = tokenize(query).slice(-64).join(" "); // últimos 64 tokens de query
  const neighbors = await vecSearch(embed(qChunk), k); // SCaNN / sqlite-vec
  // neighbors son continuaciones, no docs completos → más coherentes
  return neighbors.map(n => n.nextChunk);
}
```

**Para `IndexedDB v2` merge-only:** chunking RETRO-style es compatible: cada `Chunk` es un row con `id = sessionId#idx`. Añadir session nueva = añadir chunks, no re-indexar. `DB_VERSION=2` no cambia.

**Para `opencode.db :8765`:** el endpoint ya te da sessions; chunqueá en el desktop-app antes de indexar, no en el server. Así el thin client hace retrieval fino sin sobrecargar `:8765`.

**Para `sqlite-vec`:** cambia `vec_sessions(embedding)` por `vec_chunks(embedding, sessionId, idx)`. Query por chunk es más preciso que por session entera (una session de 2k tokens tiene 30 chunks; solo 2 son relevantes).

---

## 5 Anti-patterns / Limitaciones

- **❌ Pensar que RETRO reemplaza RAG.** RETRO requiere entrenar modelo con CCA. Si no vas a entrenar, RAG externo es lo correcto. No intentes "simular RETRO" concatenando 2 chunks por cada 64 tokens a mano sin entrenar — el modelo no sabe usarlos.
- **❌ Chunks de 512 tokens.** RETRO usa 64 porque cross-attention es O(n²). Con 512, el encoder se vuelve caro y los vecinos son menos precisos. Mantén 64-128 para RAG lite.
- **❌ Retriever que aprende durante training sin re-indexar.** RETRO congela BERT justamente para no re-indexar 2T cada step. Si entrenás tu retriever y no re-indexás `vec_chunks`, tus embeddings quedan stale.
- **❌ Asumir 25× de ganancia.** El overlap eval-DB infla números. En tu codebase con 0 overlap (código único), esperá 3-5×, no 25×. Medí siempre con deduplicación.
- **⚠️ RETROfitting sin datos de retrieval.** Si fine-tuneás tu SLM con CCA pero tu DB es chica (<100k tokens), el modelo aprende a ignorar retrieval (porque no aporta). Necesitás DB grande y diversa para que CCA sea útil.

---

## 6 Ejercicios prácticos

1.  **Chunking 64 vs doc-level (1.5h):** Indexá 50 sessions de `opencode.db` de dos formas: (a) 1 embedding por session, (b) N embeddings por chunks de 64 tokens. Sobre 15 queries, medí recall@5 de (a) vs (b). Esperás que (b) gane en queries específicas ("¿línea exacta del fallback?") y empate en generales.
2.  **RETRO lite con concat (2h):** Simulá CCA concatenando `query + top-2 chunks` como contexto para un LLM pequeño local (Qwen2-0.5B via `transformers.js` o API). Compará vs `query solo` y vs `query + top-1 session entera` sobre 10 Q&A. ¿Mejora chunks pequeños?
3.  **Medí overlap (1h):** Calculá qué % de tus eval queries tienen respuesta literal en `opencode.db` (substring match). Si es >20%, tu benchmark está inflado estilo RETRO. Deduplicá y re-medí EM para tener número honesto.

---

## 7 Referencias + Checklist

- Borgeaud et al. — *Improving Language Models by Retrieving from Trillions of Tokens (RETRO)*, ICML 2022 — https://arxiv.org/abs/2112.04426
- Lewis et al. — *RAG* (contraste: retrieval fuera vs dentro) — https://arxiv.org/abs/2005.11401
- Izacard et al. — *FiD* (otra forma de retrieval externo) — https://arxiv.org/abs/2007.01282
- SCaNN — https://github.com/google-research/google-research/tree/master/scann

### Checklist de lectura

- [ ] Leí figura 1 (arquitectura CCA) y entiendo chunked cross-attention vs self-attention
- [ ] Distingo RAG (retrieval fuera) vs RETRO (retrieval dentro, diferenciable)
- [ ] Chunqueé mi corpus a 64 tokens y comparé recall vs doc-level sobre ≥10 queries
- [ ] Entiendo RETROfitting (3% tokens extra) y cuándo aplica a mi SLM local
- [ ] Medí overlap eval vs DB y ajusté expectativa de ganancia (no 25× ciego)
- [ ] Link guardado y anoté 1 idea para `vec_chunks` o SLM local esta semana

*Generado para sección Papers — 04 Memoria · opencode-remote-android*
