# Tree of Thoughts — Buscar sobre pensamientos (Yao et al., 2023)

> **Autores:** Yao et al. / Princeton
> **Año:** 2023 · **Prioridad:** Muy recomendado · **Lectura:** ~20 min
> **Link verificado:** [https://arxiv.org/abs/2305.10601](https://arxiv.org/abs/2305.10601)
> **Categoría Papers:** 01 Reasoning · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Tree of Thoughts: Deliberate Problem Solving with Large Language Models (Yao et al., NeurIPS 2023).
> **Link:** https://arxiv.org/abs/2305.10601 — github.com/princeton-nlp/tree-of-thought-llm
> **Prioridad:** Muy recomendado

## 1. Resumen
Generaliza CoT a **búsqueda en árbol**: cada nodo = thought parcial, aristas = continuaciones, evaluación heurística (vota o LLM judge) poda ramas. En Game of 24: CoT 4% → ToT 74% (GPT-4). Creative Writing y Mini Crossword también superan CoT.

## 2. Ideas
- **BFS/DFS sobre pensamientos:** explora k candidatos por nivel, guarda mejores b.
- **Evaluador:** otro prompt que puntúa \(thought ~ promising/ impossible\).
- **Backtracking:** si rama falla, vuelve y prueba otra (como humano).

## 3. Cuándo usarlo
- No para chat simple. Sí para **planificación multi-archivo** (refactor, migración).
- Coste 10-50× CoT → úsalo como \(planner\) opcional, no por defecto.

## 4. Aplica a tu thin client
- Para tareas \(kanban\) complejas: genera 3 planes ToT (BFS depth 2) y elige el que pasa \(cargo check\) en simulación.
- Implementa ToT local con Phi-3 barato para explorar planes antes de llamar al modelo caro remoto.

## 5. Limitación
- Sin heurística buena, explota combinatorio. Requiere task-specific prompt evaluator.

## 6. Ejercicio
- Implementa ToT depth=2, branch=3 para "migrar external_router a MCP". Evalúa 9 planes con LLM judge y ejecuta el ganador.

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
