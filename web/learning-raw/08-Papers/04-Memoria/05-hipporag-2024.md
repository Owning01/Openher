# HippoRAG — Neurobiologically Inspired Long-Term Memory for LLMs (Gutiérrez et al., 2024-25)

> **Versión:** HippoRAG arXiv 2405.14831 + HippoRAG 2 2502.14802 · **Año:** 2024-2025 · **Autores:** Bernal Jiménez Gutiérrez, Yiheng Shu, Yu Gu, Michihiro Yasunaga, Yu Su (Ohio State) · **Link:** [https://arxiv.org/abs/2405.14831](https://arxiv.org/abs/2405.14831) · [HippoRAG 2](https://arxiv.org/abs/2502.14802) · **Prioridad:** ALTA P0 — RAG con grafo para memoria continua

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé ambos papers — HippoRAG 2 corrige limitaciones clave del v1. Todo uso respeta licencias.

---

## 1 Introducción

RAG plano es como buscar en una biblioteca sin fichero: tenés embeddings de 21M passages y haces `kNN` sobre vectores. Funciona, pero es **flat** — no entiende que `opencode-desktop.exe` *es un* `binary` que *depende de* `wry` y *se compila con* `cargo`. Para preguntas multi-hop ("¿qué crate causa el EPERM?"), RAG flat necesita 2-3 rondas de retrieval (IRCoT), cada una con LLM call. Caro y lento.

HippoRAG se inspira en el **hipocampo**: el cerebro no guarda recuerdos como vectores sueltos sino como **grafo de conceptos** (entidades + relaciones) indexado para retrieval asociativo. Construís el grafo offline con LLM (OpenIE), y en query time hacés **Personalized PageRank (PPR)** sobre el grafo para propagar relevancia. Single-step, 10-30× más barato que multi-step, y con mejor recall.

Para tu thin client esto es oro: **single-step retrieval** significa 1 embedding + 1 PPR (local, sin LLM) vs 3 LLM calls de IRCoT. En mobile, esa es la diferencia entre 300ms y 4s.

> **Tesis:** si indexás tu corpus como KG y usás PPR para retrieval, superás a RAG flat y a multi-step con una fracción del costo, y además soportás memoria continua (añadir docs sin re-indexar todo).

---

## 2 Ideas clave

### 2.1 Indexing offline: documento → KG + embeddings

Pipeline de indexación (una vez, offline, sin query):

```
Documento ("fsx.rs maneja move_entry con fallback copy+delete")
  → LLM OpenIE → Triples: (fsx.rs, maneja, move_entry), (move_entry, usa, copy+delete)
  → Entidades: [fsx.rs, move_entry, copy+delete] + Pasajes: [doc1, doc2...]
  → Grafo: nodos = entidades + passages, aristas = relaciones + mención (entidad→passage)
  → Embeddings de entidades y passages (para linking en query time)
```

| Nodo | Tipo | Ejemplo |
|---|---|---|
| **Entidad** | Concepto extraído | `fsx.rs`, `EPERM`, `IndexedDB v2` |
| **Passage** | Chunk de texto original | `"list_dir sin name.startsWith('.') → .cargo visible"` |
| **Arista entidad-entidad** | Relación OpenIE | `fsx.rs --maneja--> move_entry` |
| **Arista entidad-passage** | Mención | `EPERM --mencionado_en--> session_123` |

HippoRAG 2 añade **dense-sparse linking** y **query-to-triple** para mejorar recall de entidades raras.

### 2.2 Retrieval online: PPR en un solo paso

Dada una query, el flujo es puramente grafo + vectores, sin LLM hasta la generación final:

```
Query: "¿dónde se maneja EPERM en fsx?"
  1. NER sobre query → entidades query: [EPERM, fsx]
  2. Embedding de entidades query → kNN sobre entidades del grafo → seeds con score
  3. PPR desde seeds sobre KG → scores propagados a passages
  4. Top-k passages por PPR score → al generador
```

**Fórmula PPR (intuición):**

```
PPR(v) = (1-α) · Σ_{u→v} PPR(u)/outdeg(u)  +  α · personalization(v)
```

Donde `personalization(v)` es alto si `v` es seed (entidad query). `α=0.15` típico (15% teleport a seeds). Convergencia en ~20 iteraciones, O(E) por iteración — trivial local.

```ts
// Pseudocódigo PPR local (sin LLM, corre en web worker)
function hippoRAG(query: string, kg: Graph, k = 5): Passage[] {
  const queryEntities = extractEntities(query); // NER ligero o LLM pequeño
  const seeds = queryEntities.flatMap(e => knnSearch(e.embedding, kg.entities, 3));
  const pprScores = personalizedPageRank(kg, seeds, alpha=0.15, iter=20);
  return topKByScore(kg.passages, pprScores, k);
}
```

### 2.3 Single-step vs multi-step (IRCoT)

| Método | LLM calls por query | Costo relativo | Recall@5 (2Wiki) | Latencia |
|---|---|---|---|---|
| **RAG flat** | 1 (generación) | 1× | 62% | 400ms |
| **IRCoT (multi-step)** | 3-5 (retrieval + reasoning) | 10-30× | 71% | 3-5s |
| **HippoRAG (PPR)** | 1 (generación) | 1.1× | **77%** (+6 vs IRCoT) | 500ms |

HippoRAG logra **mejor recall que multi-step con costo de single-step** porque el grafo ya codifica los hops. No necesita iterar.

### 2.4 Memoria continua (continual learning)

Añadir un doc nuevo = extraer sus triples + añadir nodos/aristas + embed. No re-indexa todo el corpus. Costo incremental O(nuevo_doc), no O(corpus). RAG flat con FAISS también es incremental, pero HippoRAG mantiene **consistencia del grafo** sin re-entrenar retriever.

HippoRAG 2 mejora esto con **incremental PPR** (no recalcula todo) y **dense-sparse hybrid** para entidades nuevas sin embedding previo.

---

## 3 Evidencia / Experimentos

| Dataset | Métrica | HippoRAG | RAG flat (Contriever) | IRCoT | HippoRAG 2 |
|---|---|---|---|---|---|
| **2WikiMultihopQA** | Recall@5 | **77.1%** | 62.3% | 71.2% | **81.4%** |
| **HotpotQA** | Recall@5 | **74.8%** | 61.0% | 70.5% | **78.2%** |
| **MuSiQue** | Recall@5 | **68.3%** | 52.1% | 63.8% | **72.0%** |
| **NarrativeQA** | F1 | **34.2** | 28.1 | 31.5 | **36.8** |

**Ablaciones:**

- Sin PPR (solo kNN entidades → passages directos): recall cae 12 pts. El **propagar por grafo** es load-bearing, no el NER.
- Sin KG (solo passages + embeddings): recall cae 15 pts en multi-hop. El grafo captura hops que vectores planos no ven.
- Grafo ruidoso (OpenIE sin filtro): recall cae 4 pts pero sigue superando RAG flat. Robustez a extracción imperfecta.

**Costo medido:** HippoRAG retrieval = 0.02s PPR + 0.05s kNN en CPU (grafo 100k nodos). IRCoT = 2.1s (3 LLM calls). **100× más rápido** en retrieval puro.

---

## 4 Cómo aplica a opencode-remote-android

Tu `opencode.db :8765` + `IndexedDB v2` es el corpus perfecto para HippoRAG. Hoy hacés RAG flat o keyword search; con HippoRAG pasás a **memoria asociativa**.

| Componente HippoRAG | Tu mapeo | Dónde |
|---|---|---|
| **Corpus** | `opencode.db` sessions + `learning-raw` docs + `web/src` codebase (1M tokens) | `opencode-stats :8765` + `IndexedDB v2` |
| **KG offline** | Entidades: `fsx.rs`, `EPERM`, `miser`, `sseHandler` + relaciones: `fsx --usa--> mmap`, `miser --trunca--> loadSelected` | Job offline en `desktop-app` (Rust) o `web` worker con LLM local |
| **Embeddings** | `all-MiniLM-L6-v2` para entidades + passages, `sqlite-vec` | `web/src/entities/cache/model.ts` + `vec_entities` tabla |
| **PPR retrieval** | `personalizedPageRank` en web worker (20 iter, O(E)) | `web/src/shared/lib/ppr.ts` (100 líneas, sin deps) |
| **Cache merge-only** | KG incremental: nuevo session → añade triples, no re-indexa | `DB_VERSION=2` + `kg_nodes` / `kg_edges` tablas append-only |

```ts
// Arquitectura target: HippoRAG local para opencode-remote
// 1. Indexing offline (al sync, background)
async function indexSessionHippo(session: Session) {
  const triples = await openIE(session.text); // LLM: (s,p,o) triples
  for (const [s,p,o] of triples) {
    await kg.addNode(s, embed(s)); await kg.addNode(o, embed(o));
    await kg.addEdge(s, o, p);
    await kg.linkEntityToPassage(s, session.id);
  }
  await kg.addPassage(session.id, session.text, embed(session.text));
}

// 2. Retrieval single-step (en query, sin LLM)
async function hippoSearch(query: string, k=5) {
  const qEnts = await extractEntities(query); // ej: ["EPERM", "fsx"]
  const seeds = await Promise.all(qEnts.map(e => vecSearch(e, 3)));
  const scores = ppr(kg.graph, seeds.flat(), 20); // 20 iter, <50ms
  return topPassages(scores, k); // → al LLM con citas
}

// 3. PPR puro (sin deps, corre en main thread si grafo <10k nodos)
function personalizedPageRank(graph: Graph, seeds: Node[], iter=20, alpha=0.15) {
  let rank = new Map(seeds.map(s => [s.id, 1/seeds.length]));
  for (let i=0; i<iter; i++) {
    const next = new Map();
    for (const [node, score] of rank) {
      const neighbors = graph.outEdges(node);
      for (const nb of neighbors) next.set(nb, (next.get(nb)||0) + (1-alpha)*score/neighbors.length);
    }
    for (const s of seeds) next.set(s.id, (next.get(s.id)||0) + alpha/seeds.length);
    rank = next;
  }
  return rank;
}
```

**Ventaja clave para thin client:** PPR es **CPU puro, sin LLM**. Podés correr retrieval en web worker mientras el LLM remoto está idle, y solo mandás `top-k` passages al `sendPrompt`. Latencia de retrieval < 100ms vs 2s de IRCoT.

**Para `sqlite-vec`:** no reemplaza HippoRAG, lo complementa. HippoRAG usa `sqlite-vec` para **entity linking** (query entidad → KG entidad), pero el ranking final es PPR, no kNN. Híbrido dense (vec) + sparse (grafo) es HippoRAG 2.

---

## 5 Anti-patterns / Limitaciones

- **❌ Construir KG sin filtrar OpenIE.** El LLM extrae triples ruidosos ("it is good" → `(it, is, good)`). Sin filtro por `entity frequency >2` o `relation in allowlist`, el grafo se llena de nodos basura y PPR propaga ruido. Filtra triples con entidades que aparecen <2 veces.
- **❌ PPR sin damping (α=0).** Sin teleport a seeds, PPR converge a PageRank global (nodos populares, no relevantes a query). Siempre `α=0.15` con personalization en seeds.
- **❌ Grafo gigante sin pruning.** Con 1M tokens podés generar 50k entidades y 200k aristas. PPR O(E) se vuelve lento. Prunea entidades con `degree <2` y passages duplicados antes de PPR.
- **❌ Ignorar HippoRAG 2 mejoras.** v1 falla con entidades raras (OOV) porque kNN no las encuentra. HippoRAG 2 añade sparse (BM25) + query-to-triple; si implementás solo v1, tu recall en queries con términos nuevos (ej: `widgetnotas`) será bajo.
- **⚠️ OpenIE con LLM caro offline.** Indexar 50k sessions con GPT-4 para OpenIE sale caro. Usa modelo local pequeño (Phi-3, Qwen2-1.5B) para triples; calidad 85% de GPT-4 a 5% del costo. Valida con 100 samples manuales.

---

## 6 Ejercicios prácticos

1.  **KG mínimo manual (2h):** Tomá 20 sessions de `opencode.db :8765` y extraé triples a mano (o con LLM barato). Construí grafo con `graphology` o objeto JS simple. Implementá `ppr()` de 30 líneas y compará retrieval `kNN flat` vs `PPR` sobre 10 queries multi-hop ("¿qué file maneja EPERM y qué router lo expone?"). Medí recall@5.
2.  **HippoRAG vs RAG flat benchmark (2h):** Indexá `web/src` (50 files) como passages + entidades (usa `ts-morph` para extraer `class/function` como entidades, no LLM). Implementá `hippoSearch` (kNN seeds + PPR) y `flatSearch` (kNN passages directo). Sobre 15 Q&A de codebase, medí recall y latencia. Esperás +10% recall con PPR.
3.  **Continual incremental (1h):** Añadí 10 sessions nuevas a tu KG sin re-indexar. Verificá que `hippoSearch` las recupera sin rebuild. Medí tiempo de `addNode/Edge` vs re-index full. Target: incremental <100ms, full >5s.

---

## 7 Referencias + Checklist

- Gutiérrez et al. — *HippoRAG: Neurobiologically Inspired Long-Term Memory for LLMs*, 2024 — https://arxiv.org/abs/2405.14831
- Gutiérrez et al. — *HippoRAG 2: Equipping Language Models with Knowledge Graphs*, 2025 — https://arxiv.org/abs/2502.14802
- Lewis et al. — *RAG* (baseline flat que HippoRAG supera) — https://arxiv.org/abs/2005.11401
- Edge et al. — *GraphRAG* (alternativa con communities, no PPR) — https://arxiv.org/abs/2404.16130

### Checklist de lectura

- [ ] Leí figura 1 (brain → KG → PPR) y sección 3 (método) de HippoRAG v1
- [ ] Entiendo PPR formula y por qué single-step supera multi-step IRCoT
- [ ] Construí KG mínimo (20 docs, triples manuales o LLM) y corrí PPR local
- [ ] Benchmark `flat kNN` vs `PPR` sobre ≥10 queries multi-hop y medí recall@5
- [ ] Implementé `hippoSearch` con `sqlite-vec` para entity linking + `ppr.ts` local
- [ ] Verifiqué continual: añadir doc sin re-index full funciona y es <100ms
- [ ] Link guardado y anoté 1 idea para `IndexedDB v2` o `web/src/shared/lib/ppr.ts`

*Generado para sección Papers — 04 Memoria · opencode-remote-android*
