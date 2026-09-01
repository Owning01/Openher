# AutoGen — Conversación multi-agente (Wu et al., 2023)

> **Autores:** Wu et al. / Microsoft
> **Año:** 2023 · **Prioridad:** Muy recomendado · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2308.08155](https://arxiv.org/abs/2308.08155)
> **Categoría Papers:** 03 Agentes · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation (Wu et al., 2023).
> **Link:** https://arxiv.org/abs/2308.08155 — github.com/microsoft/autogen
> **Prioridad:** Muy recomendado

## 1. Resumen
Framework donde cada agente es **conversable** (LLM + human + tool). Orquesta por chat: Assistant ↔ Executor ↔ User. Resuelve coding, math, QA con menos alucinación que single-agent.

## 2. Ideas
- **Agentes especializados por rol**, no por modelo distinto.
- **Conversación como API:** cada mensaje es acción observable y registrable.
- Reusable: cambia orquestación sin reentrenar.

## 3. Aplica a opencode-remote
- Tus \"subagentTaskPart\" filtrados en \"useSSE.ts\" son AutoGen sin saberlo. Hazlos explícitos: cada subagente con su propia conversación y memoria aislada.
- Usa patrón para \"grupo de sesiones\" (groupedSessions) con shared state pero turnos claros.

## 4. Ejercicio
- Modela \"session → task → subagent\" como AutoGen: cada subagente loguea su propio Thought/Action y el padre solo ve summary.

## 5. Links
- https://arxiv.org/abs/2308.08155

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
