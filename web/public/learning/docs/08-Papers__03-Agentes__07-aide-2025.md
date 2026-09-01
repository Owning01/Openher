# AIDE — Búsqueda en árbol de soluciones (Jiang et al., 2025)

> **Autores:** Jiang et al. / Weco AI
> **Año:** 2025 · **Prioridad:** Complementario · **Lectura:** ~14 min
> **Link verificado:** [https://arxiv.org/abs/2502.13138](https://arxiv.org/abs/2502.13138)
> **Categoría Papers:** 03 Agentes · **Nivel:** intro

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** AIDE: AI-Driven Exploration in the Space of Code (Jiang et al., 2025).
> **Link:** https://arxiv.org/abs/2502.13138
> **Prioridad:** Complementario

## 1. Resumen
Formula ML/code como **búsqueda en árbol** donde cada nodo es una solución ejecutable (código). Operador stateless \"f(node) → new code\" propone mejora, se evalúa y se expande el mejor. Sin historial infinito, solo árbol.

## 2. Idea
- No appendear chat; proponer parches sobre nodos existentes.
- Evaluación automática (tests) decide qué rama podar.

## 3. Aplica a tu terminal
- Para \"opencode-stats\" o generación de informes: en vez de ReAct lineal, mantén árbol de intentos y muestra al usuario las 3 mejores ramas.
- Útil para \"ptyx\" con múltiples intentos de fix.

## 4. Links
- https://arxiv.org/abs/2502.13138

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
