# MetaGPT — SOPs en vez de chat libre (Hong et al., 2023)

> **Autores:** Hong et al. / DeepWisdom
> **Año:** 2023 · **Prioridad:** Muy recomendado · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2308.00352](https://arxiv.org/abs/2308.00352)
> **Categoría Papers:** 03 Agentes · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** MetaGPT: Meta Programming for Multi-Agent Collaborative Framework (Hong et al., ICLR 2024).
> **Link:** https://arxiv.org/abs/2308.00352
> **Prioridad:** Muy recomendado

## 1. Resumen
Simula **empresa de software** con Product Manager → Architect → Engineer → QA, cada uno produce artefactos estructurados (PRD, diagrama, código, test) en vez de chatear libre. Supera single-agent en HumanEval y MBPP.

## 2. Por qué importa
Chat libre multi-agente alucina y diverge. SOPs (Standard Operating Procedures) con **artefactos tipados** mantienen coherencia.

## 3. Aplica a tu kanban
- Para generación multi-archivo: define SOP \"Spec → Design → Code → Test → Review\" y haz que cada subagente produzca artefacto validable (no texto libre).
- Tu \"kanban.json\" puede ser el PRD vivo.

## 4. Ejercicio
- Implementa SOP simple para \"añadir feature\": agente PM escribe spec.md, Architect propone files, Engineer genera diff, QA corre tests. Mide vs single-agent.

## 5. Links
- https://arxiv.org/abs/2308.00352

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
