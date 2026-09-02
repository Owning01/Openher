# GraphRAG — From Local to Global: A Graph RAG Approach to Query-Focused Summarization (Edge et al., 2024)

> **Versión:** arXiv 2404.16130 · **Año:** 2024 · **Autores:** Darren Edge, Ha Trinh, Newman Cheng, Joshua Bradley, Alex Chao, Apurva Mody, Steven Truitt, Johan Bjorck (Microsoft Research) · **Link:** [https://arxiv.org/abs/2404.16130](https://arxiv.org/abs/2404.16130) · **Prioridad:** ALTA P1 — para preguntas globales sobre tu codebase

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé el paper original — GraphRAG no compite con RAG/HippoRAG, los complementa. Todo uso respeta licencias.

---

## 1 Introducción

RAG y HippoRAG responden **preguntas específicas**: "¿dónde está `fsx::move_entry`?" → recuperan 5 passages y generan. Pero ¿qué pasa con **preguntas globales** que requieren sintetizar todo el corpus? "¿Cuáles son los patrones de error en `opencode-remote`?" / "¿Qué riesgos tiene `external_router.rs`?" / "¿Cómo se organiza el harness de `desktop-app`?".

Para esas preguntas, RAG flat falla: necesitarías los 100 passages más relevantes, pero el LLM se pierde en el medio (Liu et al.) y no ve el bosque. GraphRAG resuelve esto con **summarization pre-generada**: offline, construye un KG, lo clusteriza en **comunidades** (Leiden), y para cada comunidad genera un **summary** con LLM. En query time, no recuperás passages; recuperás **summaries de comunidades** relevantes. Es `map-reduce` sobre tu codebase.

La ganancia medida: **+20% en comprehensiveness y diversity** vs RAG naive en preguntas globales (evaluado con LLM-as-judge), sin perder en preguntas específicas si combinás ambos.

> **Tesis:** para preguntas globales, no retrievals passages; retrievals summaries pre-computados de comunidades del grafo. Para preguntas específicas, seguí con RAG. El sistema híbrido gana en ambos.

---

## 2 Ideas clave

### 2.1 Pipeline en 4 fases offline

```
1. KG Extraction:  docs → LLM → entidades / relaciones / claims
2. Community Detection: grafo → Leiden clustering → comunidades jerárquicas (L0 hojas, L2 raíz)
3. Summarization: por cada comunidad → LLM genera summary (qué hace, quién participa, temas)
4. Query Time: pregunta → retrieve summaries relevantes → map-reduce → respuesta
```

| Fase | Qué hace | Output |
|---|---|---|
| **Source → KG** | LLM extrae `(entidad, relación, entidad, descripción, claim)` por chunk | Grafo con `entity`, `relationship`, `claim` + embeddings |
| **Leiden** | Clustering jerárquico no solapado, maximiza modularidad | Comunidades C0 (pequeñas, 10 nodos) ... C2 (grandes, 100 nodos) |
| **Summarize** | Por comunidad, LLM resume: "Comunidad 12: manejo de FS (fsx, move_entry, EPERM) — riesgo: fallback no atómico" | `community_report` (título, summary, rank, findings) |
| **Retrieve** | `Local search` (entidades) vs `Global search` (summaries) según tipo de pregunta | Top-k reports o top-k entities+passages |

### 2.2 Dos modos de búsqueda (local vs global)

GraphRAG no es un solo retriever; son **dos**, y elegís según la pregunta:

| Modo | Cuándo | Qué retrieva | Ejemplo query |
|---|---|---|---|
| **Local search** | Pregunta específica sobre entidad | Entidades + relaciones + claims + passages vecinos | "¿dónde se define `fsx::move_entry`?" |
| **Global search** | Pregunta que requiere síntesis | Community summaries rankeadas por relevancia | "¿qué patrones de error hay en el harness?" |

```ts
// Clasificación automática (podés hacerlo con heurística simple)
function routeQuery(q: string): "local" | "global" {
  const globalSignals = ["qué patrones", "resumí", "riesgos", "organización", "temas", "overview"];
  return globalSignals.some(s => q.toLowerCase().includes(s)) ? "global" : "local";
}
```

**Global search es map-reduce:**

```
Query global: "¿riesgos de external_router?"
  → Retrieve top-10 community reports relevantes (por embedding de summary)
  → Map: por cada report, LLM genera respuesta parcial + score relevancia
  → Reduce: LLM combina respuestas parciales rankeadas → respuesta final con comprehensiveness
```

### 2.3 Community summaries como índice

Cada `community_report` tiene estructura fija que el paper muestra que funciona:

```json
{
  "community": 12,
  "level": 1,
  "title": "Manejo de filesystem y errores EPERM",
  "summary": "El módulo fsx centraliza operaciones FS con fallback copy+delete...",
  "rank": 8.5,
  "rating_explanation": "Alta centralidad, 12 relaciones, 3 claims críticos",
  "findings": [
    {"explanation": "move_entry no es atómico si copy falla", "summary": "Riesgo de estado inconsistente"},
    {"explanation": "list_dir expone .cargo/.git", "summary": "Superficie de info sensible"}
  ]
}
```

Estos reports son **el índice** para global search. No buscás en passages; buscás en summaries (10× más densos).

### 2.4 HippoRAG vs GraphRAG — no son lo mismo

| Aspecto | HippoRAG | GraphRAG |
|---|---|---|
| **Grafo** | Entidades + passages, PPR | Entidades + relaciones + claims + comunidades |
| **Retrieval** | PPR single-step → passages | Local (PPR-like) o Global (summaries) |
| **Summaries** | No, passages crudos | Sí, pre-generados por comunidad (offline LLM) |
| **Mejor para** | Multi-hop específico | Preguntas globales / sensemaking |
| **Costo offline** | Bajo (OpenIE) | Alto (LLM por comunidad) |

Los dos usan KG, pero HippoRAG optimiza **recall de passages**, GraphRAG optimiza **comprehensiveness de síntesis**.

---

## 3 Evidencia / Experimentos

Dataset: 1M tokens de podcasts + news, preguntas globales tipo "¿cuáles son los temas principales?" Evaluado con **LLM-as-judge** (GPT-4) en 4 dimensiones, win rate vs baselines.

| Método | Comprehensiveness | Diversity | Empowerment | Overall win vs RAG naive |
|---|---|---|---|---|
| **GraphRAG Global (C2)** | **58%** win | **60%** win | 55% win | **+20%** |
| **GraphRAG Local** | 52% win | 48% win | 51% win | +5% (en globales) |
| **RAG naive (top-10 passages)** | 42% baseline | 40% baseline | 45% baseline | — |
| **RAG + rerank** | 45% | 43% | 46% | +3% |

**En preguntas específicas (factoid):** GraphRAG Local empata con RAG naive (diferencia <2%). La ganancia está en **globales**; en específicas no perdés pero no ganás.

**Ablaciones:**

- Sin comunidades (solo KG flat + PPR): win rate cae 12 pts en globales. El **clustering + summarization** es load-bearing.
- Solo nivel L0 (comunidades chicas): comprehensiveness baja 8 pts vs L1/L2. Necesitás jerarquía para sintetizar.
- Summaries sin `findings` estructurados: diversity cae 10 pts. El formato `findings` obliga al LLM a listar puntos diversos.

**Costo offline:** GraphRAG sobre 1M tokens ≈ $20-40 en LLM calls (extracción + summaries). No es gratis; es inversión que amortizás en cada query global.

---

## 4 Cómo aplica a opencode-remote-android

Tu codebase de 1M tokens (web + desktop-app + opencode-stats) es el caso de uso ideal para GraphRAG global.

| Concepto GraphRAG | Tu mapeo | Dónde |
|---|---|---|
| **Corpus 1M tokens** | `web/src` + `desktop-app/src` + `opencode.db` docs | Fuente para KG |
| **Entidades** | `fsx.rs`, `EPERM`, `miser`, `sseHandler`, `IndexedDB v2`, `opencode.db :8765` | Extraídas por file / session |
| **Comunidades** | Módulos: `infrastructure/http/*_router.rs`, `features/session`, `entities/cache` | Leiden sobre grafo de imports/relaciones |
| **Community reports** | "Módulo FS: riesgo fallback no atómico, expone .cargo" / "Harness SSE: curva en U, miser trunca" | Tabla `community_reports` en IndexedDB v2 o `desktop-app/data` |
| **Global search** | "¿qué deuda técnica tiene el harness?" → top-5 reports → map-reduce | `web/src/shared/lib/graphrag.ts` |
| **Local search** | "¿dónde está `move_entry`?" → HippoRAG/RAG flat (no GraphRAG) | `web/src/shared/lib/ppr.ts` (ya planeado) |
| **Cache merge-only** | Reports se regeneran incremental si file cambia (`fswatch`), no rebuild full | `DB_VERSION=2` + `report_version` por comunidad |

```ts
// Arquitectura híbrida: RAG para local, GraphRAG para global
async function answer(query: string): Promise<string> {
  const mode = routeQuery(query); // "local" | "global"
  if (mode === "local") {
    // HippoRAG / RAG flat — passages
    const passages = await hippoSearch(query, 5);
    return generate(query, passages);
  } else {
    // GraphRAG global — community summaries + map-reduce
    const reports = await globalSearch(query, 10); // top-10 reports por embedding
    const partials = await Promise.all(reports.map(r => mapAnswer(query, r)));
    // Reduce: combina partials rankeadas
    return reduceAnswers(query, partials.sort((a,b) => b.score - a.score));
  }
}

// Indexing offline (una vez, o incremental con fswatch)
async function buildGraphRAG(files: File[]) {
  // 1. KG por file (usa LLM o heurística: imports + entities)
  const kg = await extractKG(files); // ej: (SingleTerminal, usa, pcf-tree)
  // 2. Leiden clustering (usa graphology-leiden o simple modularity)
  const communities = leiden(kg);
  // 3. Summaries por comunidad (LLM call offline)
  for (const comm of communities) {
    const report = await llm.summarize(`Comunidad ${comm.id}: ${comm.nodes.join(", ")}\nDescribe: propósito, riesgos, findings`);
    await db.put("community_reports", report);
  }
}
```

**Para `pcf-tree` + `preview`:** GraphRAG es perfecto para "¿qué hace `pcf-tree` y qué riesgos tiene?" — el global search devuelve el report de la comunidad `pcf-tree + FileRow + usePaneState` en vez de 20 files sueltos.

**Para `opencode.db :8765`:** no hagas GraphRAG sobre sessions individuales (son locales). Hacelo sobre **el codebase**. Las sessions son para RAG local; el repo es para GraphRAG global.

---

## 5 Anti-patterns / Limitaciones

- **❌ Usar GraphRAG para preguntas factoid.** "¿en qué línea está `miser`?" no necesita community summary; necesita passage exacto. Si usás global search para todo, pagás map-reduce caro para respuesta que RAG da en 1 passage. **Routeá** local vs global.
- **❌ Generar summaries sin `findings` estructurados.** El paper muestra que summaries narrativos sin `findings` pierden 10 pts de diversity. Siempre pide al LLM `findings: [{explanation, summary}]` con 3-5 bullets.
- **❌ Rebuild full del KG cada vez que cambia un file.** Con `fswatch` y `DB_VERSION=2` merge-only, solo regenerá la comunidad afectada. Rebuild de 1M tokens son $20 cada vez; incremental son $0.50.
- **❌ Leiden sin jerarquía.** Si solo usás nivel L0 (comunidades chicas), perdés síntesis global. Necesitás L1/L2 para preguntas tipo "¿cómo se organiza todo el harness?" L0 es para "¿qué hace este módulo?"
- **⚠️ LLM-as-judge es ruidoso.** El +20% de GraphRAG se mide con GPT-4 como juez, no con humanos. Tomalo como señal, no como verdad absoluta. Valida con 10 preguntas reales de tu repo y rating manual.
- **⚠️ Costo offline no trivial.** 1M tokens × extracción + summaries ≈ 50-100 LLM calls. Si lo corrés en cada `pnpm build`, te funde. Schedulealo nightly o on-demand.

---

## 6 Ejercicios prácticos

1.  **Comunidades a mano (2h):** Tomá `web/src` y agrupá 30 files en 5 comunidades a mano (por carpeta/imports). Para cada una, escribí un `community_report` (título, summary 100 tokens, 3 findings). Implementá `globalSearch` que rankee reports por BM25 contra query global ("¿qué patrones usa el harness?") y compará vs RAG naive top-10 passages. ¿Cuál es más comprehensivo?
2.  **Router local vs global (1h):** Implementá `routeQuery()` con lista de señales globales. Sobre 20 queries reales de tu uso (10 factoid, 10 globales), medí accuracy de ruteo. Ajustá señales hasta >90% de acierto. Luego implementá `answer()` híbrido que use RAG o GraphRAG según ruteo.
3.  **Map-reduce de summaries (1.5h):** Con tus 5 reports manuales, implementá `mapAnswer` (por cada report, pide al LLM "¿qué dice este report sobre la query?") y `reduceAnswers` (combina partials). Compará latencia y comprehensiveness vs "concatenar 5 reports y pedir 1 LLM call". ¿Vale la pena map-reduce?

---

## 7 Referencias + Checklist

- Edge et al. — *From Local to Global: A Graph RAG Approach to Query-Focused Summarization*, 2024 — https://arxiv.org/abs/2404.16130
- Gutiérrez et al. — *HippoRAG* (contraste: PPR vs communities) — https://arxiv.org/abs/2405.14831
- Microsoft GraphRAG repo — https://github.com/microsoft/graphrag
- Leiden algorithm — Traag et al., 2019 — https://arxiv.org/abs/1810.08473

### Checklist de lectura

- [ ] Leí figura 1 (pipeline 4 fases) y tabla 1 (local vs global) del paper
- [ ] Distingo pregunta local (factoid) vs global (síntesis) y sé rutear
- [ ] Agrupé mi codebase en 5 comunidades y escribí `community_reports` manuales
- [ ] Implementé `globalSearch` (reports) vs `localSearch` (passages) y comparé comprehensiveness
- [ ] Probé map-reduce sobre reports y medí vs concat simple
- [ ] Link guardado y anoté 1 idea para `web/src` o `desktop-app/data` esta semana

*Generado para sección Papers — 04 Memoria · opencode-remote-android*
