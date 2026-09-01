# ToolLLM — Dominar 16k APIs reales (Qin et al., 2023)

> **Autores:** Qin et al. / Tsinghua
> **Año:** 2023 · **Prioridad:** Muy recomendado · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2307.16789](https://arxiv.org/abs/2307.16789)
> **Categoría Papers:** 02 Harness · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** ToolLLM: Facilitating Large Language Models to Master 16000+ Real-world APIs (Qin et al., ICLR 2024).
> **Link:** https://arxiv.org/abs/2307.16789 — ToolBench benchmark.
> **Prioridad:** Muy recomendado

## 1. Resumen
ToolBench reúne 16k APIs de RapidAPI, genera diálogos multi-step con ChatGPT, y entrena ToolLLaMA con **DFS decision tree** (explora, backtrackea si falla). ToolLLaMA supera GPT-4 en success rate multi-step y ToolEval (pass + win rate).

## 2. Ideas
- **DFS en vez de ReAct lineal:** si tool falla, hace backtrack y prueba otra rama — como ToT pero en espacio de APIs.
- **Neural retriever:** dado intent, retrievea APIs relevantes (no todas).
- **ToolEval:** evalúa no solo si resolvió, sino eficiencia de camino.

## 3. Aplica a tu app
- Tus 5 plugins son como RapidAPI: si \"screenshots 3002\" falla, tu harness debería probar fallback (probe cache 1500ms + reintento).
- Implementa retriever simple (BM25) en \(shared/api\) para seleccionar qué tools describir en system prompt por turno → ahorra 2-3k tokens.

## 4. Ejercicio
- Mide tokens de system prompt con 25 tools vs con retriever top-5. Grafica ahorro vs accuracy en 20 tareas.

## 5. Links
- https://arxiv.org/abs/2307.16789

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
