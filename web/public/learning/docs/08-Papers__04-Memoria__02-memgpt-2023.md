# MemGPT — LLMs como Sistema Operativo (Packer et al., 2023)

> **Autores:** Packer et al. / Berkeley
> **Año:** 2023 · **Prioridad:** Imprescindible · **Lectura:** ~20 min
> **Link verificado:** [https://arxiv.org/abs/2310.08560](https://arxiv.org/abs/2310.08560)
> **Categoría Papers:** 04 Memoria · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** MemGPT: Towards LLMs as Operating Systems (Packer et al., 2023).
> **Link:** https://arxiv.org/abs/2310.08560
> **Prioridad:** Imprescindible — *blueprint de tu caché offline*

## 1. Resumen
Trata el context window como **RAM** y el resto como **disco**: jerarquía \"main context\" (system + FIFO) + \"external memory\" (recall) + \"archival\" (search). Con paginación e interrupts, el LLM pide \"recall\" explícito y maneja contexto "infinito" sin perder coherencia.

## 2. Jerarquía
- **Main:** últimos 30 msgs + system (hot).
- **Queue:** pending tasks (interrupts).
- **Archival:** long-term (IndexedDB + vector DB).
- **Interrupts:** el sistema notifica \"memoria llena → compacta\" o \"usuario pide algo del pasado → recall\".

## 3. Mapeo a tu app
- **IndexedDB v2 = archival:** tu \"loadSelected 500/100 msgs\" es RAM vs disco.
- **Implementa MemoryManager:** si context > threshold, pagina y expone \"search_memory(query)\" como tool.
- **Interrupts:** cuando \"time.updated\" no avanza, notifica al modelo que debe paginar, no hacer polling.

## 4. Ejercicio
- Añade tool \"memory.search\" que haga vector search sobre IndexedDB y mide si reduce tokens 40%.

## 5. Links
- https://arxiv.org/abs/2310.08560

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
