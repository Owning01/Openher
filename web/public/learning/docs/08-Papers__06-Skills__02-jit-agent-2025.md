# JIT-Agent — Generar el harness justo a tiempo (Li et al., 2025)

> **Autores:** Li et al.
> **Año:** 2025 · **Prioridad:** Imprescindible · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2608.25593](https://arxiv.org/abs/2608.25593)
> **Categoría Papers:** 06 Skills · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** JIT-Agent: Harness Evolution via Just-in-Time Generation (Li et al., 2025 — preprint).
> **Link:** https://arxiv.org/abs/2608.25593
> **Prioridad:** Imprescindible (formaliza tu JIT)

## 1. Resumen
Harness como artefacto **componible** (memory/planning/action/tool/skill) generado por un **harness-intelligence model** ad-hoc por tarea. En vez de harness fijo, sintetiza el óptimo por intent.

## 2. Ideas
- Harness = \"{memory, planning, action, tool, skill}\" combinables.
- Modelo entrenado para elegir composición óptima según task embedding.
- Eval: supera harness fijo en ToolBench y SWE-bench con menos tokens.

## 3. Aplica a tu external_router
- Hoy haces \"split_cmd + probe TCP\" a mano → JIT generaría config de harness por tarea: para \"captura pantallas\" usa workflow simple, para \"refactor\" usa agentic loop con ToT.
- Entrena un clasificador local (Phi-3) que elija harness óptimo.

## 4. Ejercicio
- Implementa selector \"harnessFor(task): workflow|react|tot\" con heurística y mide tokens vs success.

## 5. Links
- https://arxiv.org/abs/2608.25593

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
