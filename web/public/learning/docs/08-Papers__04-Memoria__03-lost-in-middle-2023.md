# Lost in the Middle — Dónde pones la info importa (Liu et al., 2023)

> **Autores:** Liu et al. / Stanford
> **Año:** 2023 · **Prioridad:** Imprescindible · **Lectura:** ~15 min
> **Link verificado:** [https://arxiv.org/abs/2307.03172](https://arxiv.org/abs/2307.03172)
> **Categoría Papers:** 04 Memoria · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Lost in the Middle: How Language Models Use Long Contexts (Liu et al., TACL 2024).
> **Link:** https://arxiv.org/abs/2307.03172
> **Prioridad:** Imprescindible

## 1. Resumen
LLMs tienen **curva en U**: rinden mejor si la info relevante está al **inicio o final** del contexto, peor en el medio. Con 20 docs, accuracy 75% (inicio) → 45% (medio) → 70% (final). Vale para todos los modelos probados.

## 2. Evidencia
- Multi-doc QA, con contexto largo sintético.
- Incluso con 1 doc relevante + 19 distractors, el medio se pierde.
- No lo arregla más contexto; lo empeora.

## 3. Por qué es crítico para vos
- Tu \"miser\" y \"limit 20/100 msgs\" no es feature UX, es necesidad cognitiva.
- **Reordenar por relevancia, no por cronología:** pon top-3 relevante al inicio y al final, resto en medio truncado.
- **Strip tools/thinking** en medio es obligatorio.

## 4. Ejercicio
- Benchmark: 50 Q&A sobre tu repo con info en medio vs inicio/final. Mide accuracy y cambia \"loadSelected\" a rerank BM25.

## 5. Links
- https://arxiv.org/abs/2307.03172

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
