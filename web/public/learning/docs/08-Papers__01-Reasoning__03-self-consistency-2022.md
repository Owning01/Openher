# Self-Consistency — Votar entre múltiples razonamientos (Wang et al., 2022)

> **Autores:** Wang et al. / Google
> **Año:** 2022 · **Prioridad:** Muy recomendado · **Lectura:** ~15 min
> **Link verificado:** [https://arxiv.org/abs/2203.11171](https://arxiv.org/abs/2203.11171)
> **Categoría Papers:** 01 Reasoning · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Self-Consistency Improves Chain of Thought Reasoning in Language Models (Wang et al., ICLR 2023) — Google.
> **Link:** https://arxiv.org/abs/2203.11171
> **Prioridad:** Muy recomendado

## 1. Resumen
En vez de greedy decode (1 camino), samplea **k caminos CoT diversos** (temp 0.7) y elige la respuesta por **mayoría**. GSM8K +17.9 puntos, SVAMP +11, AQuA +12.2. Sin entrenar nada.

## 2. Ideas
- Usa decoding estocástico para explorar razonamientos alternativos.
- Voto mayoritario es más robusto que un solo chain (reduce varianza).
- Compatible con cualquier CoT; mejora con k=5→40 (rendimiento crece logarítmico).

## 3. Aplica a tu proyecto
- Patrón **evaluator-optimizer** (Anthropic): genera 3 resúmenes de \(compact\) y elige mejor → útil para resumir historial largo en \(useMessages\).
- Para reportes PTES: genera 3 versiones del hallazgo y vota.
- Coste ×k → úsalo solo en pasos críticos (no en cada tool call).

## 4. Ejercicio
- Implementa función \(selfConsistentAnswer(prompt, k=3)\) que llame a opencode 3 veces y haga voto. Mide latencia vs calidad en 10 preguntas GAIA-L1.

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
