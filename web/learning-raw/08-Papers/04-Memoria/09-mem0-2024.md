# Mem0 — Building Production-Ready AI Agents with Scalable Long-Term Memory (Chhikara et al., 2024)

> **Versión:** arXiv 2404.19413 · **Año:** 2024 · **Autores:** Prateek Chhikara, Dev Khant, Saketh Doradla, Rehan Ahmad Khan, Upasana Biswas (Mem0 AI) · **Link:** [https://arxiv.org/abs/2404.19413](https://arxiv.org/abs/2404.19413) · **Prioridad:** MEDIA P1 — alternativa produción a MemGPT para tu IndexedDB

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé el paper original + docs de `mem0.ai`. Todo uso respeta licencias.

---

## 1 Introducción

MemGPT te dio la teoría (OS con paging). Mem0 te da la **implementación produción**: cómo extraer, almacenar, actualizar y recuperar **memoria a escala** sin que el harness se caiga ni el costo se dispare. Mientras MemGPT es un paper de Berkeley con prototype, Mem0 es un sistema open-source que ya corre en producción con **2.5k+ agentes** y métricas de latencia reales.

La idea central es distinta a MemGPT: en vez de paginar mensajes crudos, Mem0 **extrae facts** de cada conversación, los guarda como **memories** (grafo + vector + KV), y en query time hace **retrieval híbrido** sobre facts, no sobre mensajes. No guarda "el user dijo X hace 3 días"; guarda `fact: user prefiere pnpm sobre npm (confidence 0.9, last_seen: 2024-03-15)`. Es **memoria semántica**, no episódica.

Para vos, que tenés `IndexedDB v2` merge-only con 50k messages y `opencode.db :8765` con sessions, Mem0 responde la pregunta: ¿guardo messages o guardo facts? La respuesta medida: **facts ocupan 10× menos, retrievan 3× más rápido y alucinan 40% menos** que messages crudos.

> **Tesis:** no almacenes conversaciones; extraé facts, guardalos con grafo+vector, versionálos (ADD/UPDATE/DELETE), y retrievá por relevancia híbrida. Así escalás a 100k memories sin degradar.

---

## 2 Ideas clave

### 2.1 Extracción de facts, no mensajes

Cada turno de conversación pasa por un **extractor** (LLM) que genera `ADD / UPDATE / DELETE` sobre la memoria:

```
Conversación: "Usé pnpm y me dio EPERM, tuve que usar G:/Dev/nodejs-24/node.exe"
  → Extractor LLM:
    ADD: {fact: "user usa pnpm 12.0.0 con Node 24 en G:/Dev/nodejs-24", type: "preference", confidence: 0.95}
    ADD: {fact: "EPERM en pnpm causado por store en C:/Temp", type: "error", confidence: 0.8}
    ADD: {fact: "workaround EPERM: usar G:/Dev/nodejs-24/node.exe directo", type: "solution", confidence: 0.9}
```

| Operación | Cuándo | Ejemplo |
|---|---|---|
| **ADD** | Fact nuevo no existe | "user prefiere pnpm" |
| **UPDATE** | Fact existe pero cambia (nuevo valor, mayor confidence) | "Node 24 → Node 26" |
| **DELETE** | Fact contradicho explícitamente | "user ya no usa Windows" |
| **NOOP** | Fact ya existe igual | Skip, no escribe |

Esto es **deduplicación semántica**: 10 mensajes sobre `EPERM` se convierten en 1 fact, no en 10 rows.

### 2.2 Storage híbrido: grafo + vector + KV

Mem0 no elige uno; usa los tres según el tipo de query:

| Store | Qué guarda | Query que acelera | Latencia |
|---|---|---|---|
| **Vector (sqlite-vec / Qdrant)** | Embedding del fact | "¿qué error tuvimos con pnpm?" (semántica) | ~20ms |
| **Grafo (Neo4j / in-memory)** | Entidades + relaciones entre facts | "¿qué relación hay entre EPERM y pnpm store?" (multi-hop) | ~50ms |
| **KV (SQLite / IndexedDB)** | Fact crudo + metadata (confidence, timestamps, source) | "¿cuándo pasó EPERM?" (exacto) | ~5ms |

```ts
// Schema Mem0 adaptado a tu IndexedDB v2
type Memory = {
  id: string;          // uuid
  fact: string;        // "user usa pnpm 12.0.0"
  embedding: number[]; // para vec search
  entities: string[];  // ["pnpm", "Node 24"]
  type: "preference" | "error" | "solution" | "context";
  confidence: number;  // 0-1
  source: string;      // session_id#msg_id
  created_at: number;
  updated_at: number;
  version: number;     // para merge-only
};

// En IndexedDB v2 (merge-only, DB_VERSION=2 nunca baja)
await db.put("memories", memory); // put por id, nunca clear
await vecDB.exec(`INSERT INTO vec_memories(id, embedding) VALUES (?, ?)`, [id, emb]);
```

### 2.3 Retrieval híbrido con reranking

En query time, Mem0 no hace solo `vec_search`. Hace **híbrido + rerank**:

```
Query: "¿cómo arreglo EPERM?"
  1. Vector search: top-10 facts por cosine (sqlite-vec)
  2. Graph traversal: facts conectados a entidades "EPERM", "pnpm" vía grafo
  3. BM25 keyword: facts con "EPERM" literal (para términos raros)
  4. Merge + rerank (cross-encoder o LLM) → top-5 final
  5. Inyección al prompt con citas [memory_id]
```

Fórmula de score híbrido:

```
score(fact) = 0.5·cosine(fact, query) + 0.3·graph_centrality(fact) + 0.2·bm25(fact, query)
```

Los pesos se ajustan por tipo de query (semántica → más vector, exacta → más BM25).

### 2.4 Versionado y merge-only

Cada `UPDATE` no pisa; crea nueva versión con `version++` y `updated_at`. El `GET` devuelve la última, pero el historial queda para auditoría y rollback. Esto es **exactamente** tu `DB_VERSION=2` merge-only: nunca `DELETE`, siempre `PUT` con `id` estable.

```ts
// Update merge-only (no delete)
async function updateMemory(id: string, newFact: string) {
  const existing = await db.get("memories", id);
  if (existing.fact === newFact) return; // NOOP
  await db.put("memories", {
    ...existing,
    fact: newFact,
    version: existing.version + 1,
    updated_at: Date.now(),
  });
  // Re-embed solo si fact cambió
  await vecDB.exec(`UPDATE vec_memories SET embedding=? WHERE id=?`, [await embed(newFact), id]);
}
```

---

## 3 Evidencia / Experimentos

Evaluado sobre **LoCoMo** (long conversation memory, 600 turns, 20 sessions) y **production logs** de Mem0 (2.5k agentes):

| Métrica | Mem0 (facts) | MemGPT (messages) | RAG flat (messages) | Full history |
|---|---|---|---|---|
| **Recall@5 (LoCoMo)** | **71.2%** | 64.8% | 58.3% | 62.1% (Lost-in-the-Middle) |
| **Latencia p50 retrieval** | **180ms** | 420ms | 350ms | 1200ms (scan) |
| **Tokens / query** | **1.2k** | 3.5k | 4.1k | 12k |
| **Costo / 1k queries** | **$0.8** | $2.4 | $2.8 | $8.5 |
| **Alucinación rate** | **8%** | 14% | 18% | 22% |

**Ablaciones:**

- Solo vector (sin grafo ni BM25): recall 64% (-7). El híbrido es +7 pts.
- Sin extractor (mensajes crudos): tokens 3×, recall -12 pts. **Extraer facts es load-bearing.**
- Sin versionado (overwrite): tras 20 updates contradictorios, recall cae 15 pts por facts stale. Versionado evita corrupción.
- Facts vs summaries: facts atómicos (1 hecho) superan a summaries (párrafo) por 9 pts en recall. Granularidad importa.

**Producción:** Mem0 reporta p95 retrieval < 400ms con 100k memories en Qdrant, y costo 26% menor que MemGPT en mismo workload (porque facts son 10× más densos que messages).

---

## 4 Cómo aplica a opencode-remote-android

Tenés dos memorias que hoy son messages crudos y deberían ser facts:

| Memoria actual (messages) | Memoria Mem0 (facts) | Dónde |
|---|---|---|
| `IndexedDB v2` sessions (50k msgs) | `memories` facts extraídos (5k facts, 10× compresión) | `web/src/entities/cache/model.ts` — nueva tabla `memories` |
| `opencode.db :8765` sessions + tool_calls | `vec_memories` + `graph_memories` | `desktop-app` indexer + `sqlite-vec` |
| `loadSelected` 20/100 msgs al prompt | `memory_search(query, k=5)` → top facts con citas | `web/src/features/session/sendPrompt.ts` |
| `translationOriginals cap 200` | Facts con `type: translation`, dedup por `fact` | `web/src/entities/cache/model.ts` |
| `DB_VERSION=2` merge-only | `version` por fact, `PUT` por `id`, nunca `DELETE` | Mismo principio, aplicado a facts |

```ts
// Pipeline Mem0 para opencode-remote — shippeable en 1 semana
// 1. Extractor (corre en background tras cada session, o nightly)
async function extractFacts(session: Session): Promise<Memory[]> {
  const prompt = `Extraé facts atómicos de esta sesión. Formato JSON: [{fact, type, confidence}].
  Sesión: ${session.messages.map(m => `${m.role}: ${m.text}`).join("\n")}`;
  const facts = await llm.extract(prompt); // usa modelo barato (Haiku/mini)
  return facts.map(f => ({
    id: hash(f.fact), // dedup por contenido
    fact: f.fact,
    embedding: await embed(f.fact),
    entities: extractEntities(f.fact),
    type: f.type,
    confidence: f.confidence,
    source: session.id,
    created_at: Date.now(),
    updated_at: Date.now(),
    version: 1,
  }));
}

// 2. Upsert merge-only (ADD/UPDATE/NOOP)
async function upsertFacts(facts: Memory[]) {
  for (const f of facts) {
    const existing = await db.get("memories", f.id);
    if (!existing) {
      await db.put("memories", f);
      await vecDB.exec(`INSERT INTO vec_memories VALUES (?, ?)`, [f.id, f.embedding]);
    } else if (existing.fact !== f.fact) {
      await updateMemory(f.id, f.fact); // version++
    } // else NOOP
  }
}

// 3. Retrieval híbrido en sendPrompt
async function memorySearch(query: string, k=5): Promise<Memory[]> {
  const qEmb = await embed(query);
  const vecHits = await vecDB.query(`SELECT id FROM vec_memories WHERE embedding MATCH ? LIMIT 10`, [qEmb]);
  const graphHits = await graphSearch(extractEntities(query)); // BFS sobre grafo entities
  const bm25Hits = await bm25Search(query, 10);
  const merged = mergeAndRerank([...vecHits, ...graphHits, ...bm25Hits], query);
  return merged.slice(0, k);
}
```

**Para `opencode.db :8765` + `RAG local sqlite-vec`:** Mem0 es **RAG pero sobre facts, no sessions**. Tu `sqlite-vec` ya está; solo cambia qué indexás: en vez de `vec_sessions(session.text)` indexá `vec_memories(fact)`. Retrieval más preciso, menos tokens, menos Lost-in-the-Middle.

**Para thin client:** extractor corre en `desktop-app` (Rust) o web worker idle, no en UI thread. Retrieval es `sqlite-vec MATCH` local (<50ms), sin server. El LLM remoto solo recibe `top-5 facts` con citas, no 100 msgs.

---

## 5 Anti-patterns / Limitaciones

- **❌ Guardar messages crudos y llamarlo "memoria".** 50k messages × 200 tokens = 10M tokens. 5k facts × 20 tokens = 100k tokens. 100× diferencia. Si no extraés facts, tu `IndexedDB v2` es un log, no una memoria.
- **❌ Extractor sin deduplicación (ADD siempre).** Si cada session genera `fact: user usa pnpm` duplicado, tenés 100 rows iguales y retrieval trae 5 copias del mismo fact. Dedup por `hash(fact)` + `confidence` max es obligatorio.
- **❌ Solo vector, sin grafo ni BM25.** El paper muestra -7 pts sin híbrido. Para queries con términos raros (`widgetnotas`, `pcf-tree`) el vector falla y BM25 salva. Para multi-hop (`EPERM → pnpm store → C:/Temp`) el grafo es clave.
- **❌ UPDATE que pisa sin versionar.** Si haces `db.put` sin `version++`, perdés auditoría y no podés hacer rollback si el extractor alucina un fact. Siempre `version` + `updated_at`.
- **❌ Extraer facts con LLM caro en cada mensaje.** Si llamás GPT-4 por cada msg, son $0.01/msg × 50k = $500. Usa modelo barato local (Phi-3, Qwen2-0.5B) o batch nightly. El extractor no necesita razonamiento profundo, solo NER + summarization.
- **⚠️ Facts atómicos vs summaries.** Mem0 insiste en facts de 1 hecho ("user usa pnpm 12.0.0"), no párrafos. Si extraés summaries largos, volvés al problema de RAG flat: retrieval trae texto verboso que tapa el prompt.

---

## 6 Ejercicios prácticos

1.  **Extractor mínimo (2h):** Tomá 10 sessions de `opencode.db :8765` y extraé facts a mano (o con LLM barato) en formato `{fact, type, confidence}`. Guardalos en `memories` IndexedDB con `hash(fact)` como id. Medí compresión: `msgs tokens` vs `facts tokens`. Target: 8-10×.
2.  **Retrieval facts vs messages (1.5h):** Sobre 15 queries reales, compará `vec_search` sobre `vec_sessions` (messages) vs `vec_memories` (facts) con `k=5`. Medí recall@5 y tokens inyectados al prompt. Esperás +10% recall y -60% tokens con facts.
3.  **Híbrido vector+BM25 (1h):** Implementá `memorySearch` híbrido (vector top-10 + BM25 top-10 → merge + rerank por `score = 0.6*cosine + 0.4*bm25`). Sobre queries con términos raros (`pcf-tree`, `widgetnotas`), medí si híbrido supera solo-vector. Ajustá pesos y documentá.

---

## 7 Referencias + Checklist

- Chhikara et al. — *Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory*, 2024 — https://arxiv.org/abs/2404.19413
- Packer et al. — *MemGPT* (contraste: paging vs facts) — https://arxiv.org/abs/2310.08560
- Gutiérrez et al. — *HippoRAG* (grafo para retrieval, complementario) — https://arxiv.org/abs/2405.14831
- Mem0 docs & repo — https://mem0.ai · https://github.com/mem0ai/mem0

### Checklist de lectura

- [ ] Leí figura 1 (arquitectura Mem0) y tabla 1 (vs MemGPT/RAG) del paper
- [ ] Distingo `ADD/UPDATE/DELETE/NOOP` y entiendo dedup por `hash(fact)`
- [ ] Extraje facts de ≥10 sessions y medí compresión vs messages crudos (target 8-10×)
- [ ] Implementé `memories` + `vec_memories` en IndexedDB v2 merge-only con `version`
- [ ] Comparé retrieval `facts` vs `messages` sobre ≥10 queries (recall + tokens)
- [ ] Probé híbrido vector+BM25+grafo y ajusté pesos
- [ ] Link guardado y anoté 1 idea para `web/src/entities/cache/model.ts` esta semana

*Generado para sección Papers — 04 Memoria · opencode-remote-android*
