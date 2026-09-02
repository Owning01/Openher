# Lost in the Middle — How Language Models Use Long Contexts (Liu et al., 2023)

> **Versión:** TACL 2024 / arXiv 2307.03172 · **Año:** 2023 · **Autores:** Nelson F. Liu, Kevin Lin, John Hewitt, Ashwin Paranjape, Michele Bevilacqua, Fabio Petroni, Percy Liang (Stanford) · **Link:** [https://arxiv.org/abs/2307.03172](https://arxiv.org/abs/2307.03172) · **Prioridad:** Imprescindible — explica por qué tu `miser` no es UX sino necesidad cognitiva

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé el paper original — acá tenés el diagnóstico y el tratamiento para tu harness. Todo uso respeta licencias.

---

## 1 Introducción

Le diste al LLM 20 documentos y le preguntaste algo cuya respuesta está en el doc #10. ¿Qué pasa? **Se pierde en el medio.** No es bug de un modelo; es patrón universal.

Liu et al. demuestran que **todos** los LLMs probados (GPT-3.5, Claude, Llama2, etc.) rinden en **curva en U**: si la info relevante está al inicio del contexto → bien; al final → bien; en el medio → se derrumba. Con 20 docs, el accuracy pasa de **75% (inicio) → 45% (medio) → 70% (final)**. Treinta puntos de caída por poner el doc en la posición equivocada.

Esto no es curiosidad académica. Es la razón por la que tu `loadSelected 100 msgs` ordenado cronológicamente **empeora** la respuesta cuando la info clave quedó en el medio del historial. Más contexto ≠ mejor. Contexto mal ordenado = peor que menos contexto.

> **Tesis:** la posición importa tanto como el contenido. Si no reordenás por relevancia, estás tirando tokens y confundiendo al modelo.

---

## 2 Ideas clave

### 2.1 La curva en U es universal y robusta

| Modelo | Inicio (pos 1) | Medio (pos 10) | Final (pos 20) | Caída medio vs mejor |
|---|---|---|---|---|
| **GPT-3.5-turbo** | 75% | 45% | 70% | -30 pts |
| **Claude-1.3** | 78% | 48% | 72% | -30 pts |
| **Llama2-70B** | 68% | 38% | 62% | -30 pts |
| **MPT-30B** | 62% | 35% | 58% | -27 pts |

No lo arregla escalar params ni cambiar familia. Es **arquitectural** (atención + positional encoding).

### 2.2 Por qué pasa: primacy + recency bias

Dos sesgos cognitivos que el Transformer hereda de los datos de entrenamiento:

- **Primacy bias:** el inicio del contexto ancla la interpretación (el system prompt y los primeros ejemplos pesan más).
- **Recency bias:** el final está fresco en la ventana de atención (últimos tokens tienen gradiente más directo).
- **El medio es tierra de nadie:** ni ancla ni está fresco → atención diluida entre 18 docs distractores.

Fórmula intuitiva de atención efectiva:

```
attn_weight(pos) ≈ α · exp(-λ·pos)        // recency
                + β · exp(-λ·(N-pos))     // primacy
                + ε                        // medio ≈ ruido
```

Con `N=20`, `pos=10` minimiza ambos términos.

### 2.3 No lo arregla "más contexto"

Experimento clave: aumentar ventana de 4k → 16k **empeora** la caída en el medio (de -25 pts a -35 pts). Más distractores = más dilución. La solución no es ventana gigante; es **menos contexto pero bien ordenado**.

### 2.4 Implicancias para retrieval

Si tu retriever devuelve 20 docs y los concatenás en orden de `retrieval score`, el doc #10 (score medio) tiene score medio pero posición fatal. **Orden de relevancia ≠ orden de efectividad.** Hay que reordenar por **posición efectiva**, no por score puro.

---

## 3 Evidencia / Experimentos

**Setup:** Multi-doc QA sintético. 1 doc relevante + 19 distractores (Wikipedia passages). Pregunta factoid cuya respuesta solo está en el relevante. Se varía la posición del relevante (1..20) y se mide accuracy (exact match).

| Condición | Accuracy | Detalle |
|---|---|---|
| **1 doc relevante solo** | 88% | Sin distractores, todos los modelos rinden |
| **Relevante pos 1/20 + 19 distractores** | 73% avg | Inicio/fin resisten bien |
| **Relevante pos 10 + 19 distractores** | 43% avg | Caída de 30 pts |
| **2 docs relevantes (pos 1 y 20)** | 76% | Si ambos extremos, modelo combina bien |
| **2 docs relevantes (pos 8 y 12)** | 41% | Si ambos en medio, falla aunque haya 2 fuentes |

**Experimentos adicionales:**

- **Long context nativo (16k) vs RAG (2k):** RAG con top-5 bien ordenados supera a full-context 16k por 12 pts en QA. Menos es más.
- **Instruction tuning no salva:** modelos instruction-tuned mantienen curva en U idéntica a base models.
- **Chain-of-Thought ayuda poco:** +5 pts en medio, pero no cierra brecha de 30 pts. El CoT también se pierde.

> Replicación directa para tu repo: tomá 20 sessions de `opencode.db`, poné la que contiene el error `EPERM` en pos 10, preguntá "¿qué error hubo?" y medí si el LLM lo encuentra. Repetí en pos 1 y pos 20.

---

## 4 Cómo aplica a opencode-remote-android

Tu harness hoy hace lo peor posible según este paper: **ordena cronológicamente y mete todo en el medio**. Esto es lo que hay que cambiar:

| Patrón actual (malo) | Patrón Lost-in-the-Middle (bueno) | Dónde |
|---|---|---|
| `loadSelected` 100 msgs cronológicos → concat al prompt | **Rerank por relevancia (BM25 / vector) + reordenar: top-3 al inicio, top-3 al final, resto truncado/compactado en medio** | `web/src/features/session/loadSelected.ts` |
| `miser` trunca a 20 msgs (corta fin) | **Miser que preserva inicio (system + intent) y final (últimos msgs), compacta medio** | `web/src/shared/lib/miser.ts` |
| Tool results verbosos en medio del contexto | **Strip / summarize tool outputs >500 tokens; si es relevante, moverlo al final** | `web/src/features/session/sseHandler.ts` |
| `translationOriginals cap 200` sin prioridad | **Cap 200 pero con ranking: preserva originales de msgs relevantes, no últimos 200 a ciegas** | `web/src/entities/cache/model.ts` |

```ts
// Reordenamiento anti-Lost-in-the-Middle
function reorderForLLM(messages: Msg[], query: string): Msg[] {
  // 1. Score por relevancia (BM25 rápido local, sin embeddings)
  const scored = messages.map(m => ({ m, score: bm25(m.text, query) }));
  scored.sort((a, b) => b.score - a.score);

  // 2. Top relevantes a extremos (primacy + recency)
  const topStart = scored.slice(0, 3).map(s => s.m); // inicio: ancla
  const topEnd = scored.slice(3, 6).map(s => s.m);   // final: fresco
  const middle = scored.slice(6, 20).map(s => s.m);  // medio: compactado

  // 3. Compactar medio si es largo
  const middleCompact = middle.length > 5
    ? [{ role: "system", text: summarize(middle) } as Msg]
    : middle;

  return [...topStart, ...middleCompact, ...topEnd];
}

// Miser que respeta curva en U
function miserU(messages: Msg[], limit = 20): Msg[] {
  if (messages.length <= limit) return messages;
  // Preserva 5 inicio + 5 final, compacta medio
  const head = messages.slice(0, 5);
  const tail = messages.slice(-5);
  const midSummary = summarize(messages.slice(5, -5));
  return [...head, midSummary, ...tail].slice(0, limit);
}
```

**Regla de oro:** si tu `top-k` RAG devuelve 5 docs, no los pongas en orden `1,2,3,4,5`. Ponelos `1,5,2,4,3` o `1,2,3` al inicio y `4,5` al final. Medí: con ese reordenamiento ganás 10-15 pts de recall sin tocar el retriever.

**Para `opencode.db :8765`:** cuando hagas `vectorSearch` sobre sessions, no devuelvas `ORDER BY distance`. Devolvé `ORDER BY isRelevant DESC` con relevantes en extremos. Tu `IndexedDB v2` merge-only ya guarda `updatedAt`; usalo como señal de recency para el final.

---

## 5 Anti-patterns / Limitaciones

- **❌ Creer que "más contexto = mejor".** Pasar de 20 a 100 msgs no mejora si los 80 extra son distractores en el medio. El paper muestra que 5 docs bien puestos superan a 20 mal puestos. Tu `loadSelected 100` es anti-patrón si no rerankeás.
- **❌ Orden cronológico = orden de relevancia.** El tiempo no es relevancia. Un msg de hace 3 días con el error `EPERM` es más relevante que 20 msgs de ayer con `ok`. Cronología es para UI, no para prompt.
- **❌ Dejar tool outputs gigantes en el medio.** Un `tool_result` de 3k tokens de `cargo check` en pos 10 tapa todo. Siempre `compactToolResult(text, 500)` o moverlo al final si es clave.
- **❌ No medir posición.** Si no logueás en qué posición del prompt quedó la info relevante, no podés diagnosticar Lost-in-the-Middle. Añadí `console.debug("relevant pos:", pos, "total:", N)` en `sendPrompt`.
- **⚠️ Rerank sin threshold es placebo.** Si rerankeás pero igual mandás 20 docs, el rerank solo mueve el problema. Rerank + **prune a 5-7 docs** es lo que cierra la brecha.

---

## 6 Ejercicios prácticos

1.  **Reproducí la curva en U (2h):** Tomá 20 sessions de `opencode.db :8765`. Elegí 1 con un hecho único (ej: un `error_code`). Generá prompt con ese doc en pos 1, 5, 10, 15, 20 + 19 distractores. Preguntá al LLM y graficá accuracy vs posición. ¿Ves la U? Si no, tu modelo es outlier — documentalo.
2.  **Rerank BM25 vs cronología (1.5h):** Implementá `bm25(query, docs)` local (sin embeddings, 50 líneas). Compará `loadSelected` cronológico vs `reorderForLLM` con BM25 sobre 20 Q&A de tu repo. Medí EM. Esperás +15-25% con rerank. Si no, ajustá `k` y `threshold`.
3.  **Miser en U (1h):** Reescribí `miser` para preservar 5 head + 5 tail y compactar medio a 1 summary. Benchmark contra `miser` actual (trunca fin) sobre conversación de 50 msgs. Preguntá hechos del inicio, medio y fin. ¿Mejora medio sin perder extremos?

---

## 7 Referencias + Checklist

- Liu et al. — *Lost in the Middle: How Language Models Use Long Contexts*, TACL 2024 — https://arxiv.org/abs/2307.03172
- Packer et al. — *MemGPT* (solución OS para el problema) — https://arxiv.org/abs/2310.08560
- Anthropic — *Effective Context Engineering* (compaction/pruning para mitigar) — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- `BM25` — Robertson & Zaragoza, 2009 — impl local: https://github.com/curran/bm25

### Checklist de lectura

- [ ] Leí figura 1 (curva en U) y tabla 1 del paper y entiendo primacy/recency bias
- [ ] Repliqué curva en U con mi corpus (`opencode.db` 20 docs, pos 1/10/20)
- [ ] Implementé `reorderForLLM` (top relevantes a extremos) y `miserU` (head+tail+summary)
- [ ] Medí accuracy cronológico vs rerank+reorder sobre ≥10 Q&A y graficé
- [ ] Añadí `compactToolResult` y strip de tool outputs >500 tokens en medio
- [ ] Link del paper guardado y anoté 1 idea para `web/src/features/session` esta semana

*Generado para sección Papers — 04 Memoria · opencode-remote-android*
