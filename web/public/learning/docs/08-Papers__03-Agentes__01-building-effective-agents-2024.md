# Building Effective Agents — Patrones que sí funcionan (Anthropic, 2024)

> **Autores:** Anthropic Engineering
> **Año:** 2024 · **Prioridad:** Imprescindible · **Lectura:** ~20 min
> **Link verificado:** [https://www.anthropic.com/engineering/building-effective-agents](https://www.anthropic.com/engineering/building-effective-agents)
> **Categoría Papers:** 03 Agentes · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Artículo:** Building Effective Agents (Anthropic Eng, dic 2024) — https://www.anthropic.com/engineering/building-effective-agents
> **Prioridad:** Imprescindible — *manual para no sobrediseñar harness*

## 1. Tesis
No construyas "agente genérico". Usa el patrón más simple que resuelva el caso. 5 workflows validados + cuándo sí usar loop agéntico.

## 2. Los 5 patrones
1. **Prompt chaining:** salida de uno entra al siguiente (ej. extract → rewrite → format). Determinista.
2. **Routing:** clasifica input y deriva a especialista (ej. \"/help\" → workflow, \"debug\" → agente).
3. **Parallelization:** n workers independientes + aggregator (ej. 3 reseñas paralelas).
4. **Orchestrator-workers:** planner descompone, workers ejecutan, planner sintetiza.
5. **Evaluator-optimizer:** generator → evaluator → loop hasta \"good enough\" (ej. Self-Consistency).

Solo si ninguno alcanza, usa **Agentic loop** (ReAct + memoria).

## 3. Reglas de oro
- **Evalúa primero:** mide con BFCL/SWE-bench antes de añadir complejidad.
- **Cuanto más agéntico, peor debugging.** Prefiere workflow trazable.
- **Paraleliza cuando puedas:** baja latencia y coste.

## 4. Mapeo a tu proyecto
- **Audita desktop-app:** 
  - \"screenshots 3002\" → no necesita agente, es workflow (capture → annotate → save).
  - \"opencode\" → sí necesita agentic loop (coding task abierto).
  - \"external_router\" → orchestrator-workers: 1 worker por plugin externo, orquestador que reparte.
- **No mates procesos al cambiar pestaña** (tu fix ExternalIframePanel) es orchestrator-workers bien hecho.

## 5. Ejercicio
- Clasifica tus 5 plugins externos en workflow vs agente. Reescribe uno como workflow determinista y mide latencia.

## 6. Links
- https://www.anthropic.com/engineering/building-effective-agents

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
