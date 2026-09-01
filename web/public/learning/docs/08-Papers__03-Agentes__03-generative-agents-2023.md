# Generative Agents — Memoria, reflexión y comportamiento emergente (Park et al., 2023)

> **Autores:** Park et al. / Stanford
> **Año:** 2023 · **Prioridad:** Muy recomendado · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2304.03442](https://arxiv.org/abs/2304.03442)
> **Categoría Papers:** 03 Agentes · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Generative Agents: Interactive Simulacra of Human Behavior (Park et al., UIST 2023).
> **Link:** https://arxiv.org/abs/2304.03442
> **Prioridad:** Muy recomendado (blueprint memoria)

## 1. Resumen
25 agentes en un pueblo simulado (The Sims con LLM) con **memory stream** (log de eventos + retrieved + reflection). Cada mañana planifican, actúan, conversan y emergen fiestas, chismes y coordinación sin script.

## 2. Memoria
- **Memory stream:** cada observación es objeto con timestamp, embedding, importancia.
- **Retrieval:** por recencia + relevancia + importancia (score combinado).
- **Reflection:** cada noche, el agente resume "¿qué aprendí de hoy?" y guarda como memoria de alto nivel.
- **Planning:** plan del día descompuesto en sub-tareas horarias.

## 3. Aplica a IndexedDB v2
- Tu \"cacheMessages merge-only\" es memory stream primitivo → evoluciona a retrieval por embedding, no cronológico.
- Implementa reflexión nocturna: resume sesión larga y guarda como memoria compacta para próxima sesión.
- Usa importancia (¿el mensaje contiene error/éxito?) para priorizar qué mantener en contexto.

## 4. Ejercicio
- Añade campo \"importance\" a mensajes (heurística: si contiene \"error\"/\"success\" → alta). Retrieval top-k por score combinado.

## 5. Links
- https://arxiv.org/abs/2304.03442

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
