# Phi-3 — Small model muy capaz (Abdin et al., 2024)

> **Autores:** Abdin et al. / Microsoft
> **Año:** 2024 · **Prioridad:** Muy recomendado · **Lectura:** ~14 min
> **Link verificado:** [https://arxiv.org/abs/2404.14219](https://arxiv.org/abs/2404.14219)
> **Categoría Papers:** 06 Skills · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Phi-3 Technical Report: A Highly Capable Language Model Locally on Your Phone (Abdin et al., 2024).
> **Link:** https://arxiv.org/abs/2404.14219
> **Prioridad:** Muy recomendado (small orchestrated)

## 1. Resumen
Phi-3-mini 3.8B entrenado en 3.3T tokens (web + synthetic) alcanza calidad cercana a modelos 10× mayor (MMLU 68.8, GSM8K 82.6). Corre local en phone/laptop con 4GB RAM.

## 2. Ideas
- **Data quality > scale:** filtrado agresivo + synthetic reasoning data.
- **Long context:** 128k con Linear RoPE.
- **On-device:** quant 4-bit sin perder mucho.

## 3. Aplica a desktop-app
- **Worker local en Rust sidecar:** clasifica intent \"/help, /status\" y hace routing sin llamar a opencode remoto → ahorra datos y latencia.
- **Guardrails:** Constitutional filter local antes de \"fs.delete\".

## 4. Ejercicio
- Integra Phi-3-mini Q4 en desktop-app (via candle/llama.cpp) y mide latencia vs GPT-4 para 10 intents simples.

## 5. Links
- https://arxiv.org/abs/2404.14219

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
