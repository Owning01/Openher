# RAG — Retrieval-Augmented Generation (Lewis et al., 2020)

> **Autores:** Lewis et al. / Meta
> **Año:** 2020 · **Prioridad:** Imprescindible · **Lectura:** ~15 min
> **Link verificado:** [https://arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)
> **Categoría Papers:** 04 Memoria · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (Lewis et al., NeurIPS 2020) — Meta AI.
> **Link:** https://arxiv.org/abs/2005.11401
> **Prioridad:** Imprescindible (base)

## 1. Resumen
Combina **retriever denso (DPR)** + generador seq2seq entrenados end-to-end. Para cada query, recupera top-k docs de Wikipedia y condiciona generación. Supera FiD y T5 en Natural Questions, TriviaQA sin memorizar todo.

## 2. Ideas
- **DPR:** dual encoder (query + doc) con ANN (FAISS).
- **Marginalización:** genera respuestas considerando múltiples docs, no solo top-1.
- Entrenamiento conjunto retriever+gen mejora ambos.

## 3. Aplica a opencode-remote
- **opencode-stats crate :8765:** no cargues toda \"opencode.db\" en contexto; haz RAG: query → top-k rows → prompt.
- **open-design docs / informes:** indexa con embeddings y retrievea por intent.

## 4. Ejercicio
- Indexa tus \"learning\" docs con embeddings (local) y responde preguntas via RAG en vez de keyword search.

## 5. Links
- https://arxiv.org/abs/2005.11401

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
