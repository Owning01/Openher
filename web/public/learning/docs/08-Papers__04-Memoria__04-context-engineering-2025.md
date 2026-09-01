# Effective Context Engineering — Compaction, isolation, pruning (Anthropic, 2025)

> **Autores:** Anthropic Eng
> **Año:** 2025 · **Prioridad:** Imprescindible · **Lectura:** ~18 min
> **Link verificado:** [https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
> **Categoría Papers:** 04 Memoria · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper/Guía:** Effective Context Engineering for AI Agents (Anthropic, 2025) + survey Context Engineering 2602.12430.
> **Link:** https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
> **Prioridad:** Imprescindible

## 1. Framework
4 técnicas para mantener contexto útil a lo largo de tareas largas:
- **Compaction:** resumir tool outputs >4k tokens a 200.
- **Isolation:** subagentes con contexto propio (no heredan todo).
- **Pruning:** remover tool results viejos irrelevantes.
- **Whitelisting:** solo exponer al subagente lo que necesita.

## 2. Mapeo a tu SSE handler
- No concatenar todo el historial en cada \"sendPrompt\". Compacta \"tool_result\" verbosos.
- Subagentes (\"subagentTaskPart\") con contexto aislado → menos \"context rot\".
- Implementa \"translationOriginals cap 200\" bien (ya lo haces, formalízalo).

## 3. Ejercicio
- Añade función \"compactToolResult(text, 4000)\" que resuma si excede y mide tokens ahorrados.

## 4. Links
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- https://arxiv.org/abs/2602.12430

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
