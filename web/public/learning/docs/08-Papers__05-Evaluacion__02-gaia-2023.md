# GAIA — Preguntas simples para humanos, difíciles para IA (Mialon et al., 2023)

> **Autores:** Mialon et al. / Meta+HuggingFace
> **Año:** 2023 · **Prioridad:** Muy recomendado · **Lectura:** ~15 min
> **Link verificado:** [https://arxiv.org/abs/2311.12983](https://arxiv.org/abs/2311.12983)
> **Categoría Papers:** 05 Evaluacion · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** GAIA: a benchmark for General AI Assistants (Mialon et al., ICLR 2024).
> **Link:** https://arxiv.org/abs/2311.12983 — huggingface.co/spaces/gaia-benchmark/leaderboard
> **Prioridad:** Muy recomendado (test de robustez tool-use)

## 1. Resumen
466 preguntas que requieren **browse + multi-modal + tool use + razonamiento** (ej. "¿Cuál fue el cambio % de precio de X entre fecha A y B según PDF Y?"). Humanos 92%, GPT-4 plugins 15% (2023), 2025 agents ~50%.

## 2. Niveles
- L1: 1-2 tools, 1 página.
- L2: multi-step, combinar fuentes.
- L3: investigación profunda, planning.

## 3. Aplica a thin client
- ¿Puede tu agente vía \"shell/proxy + shell/browser\" responder GAIA L1? Mide tool-use en wild.
- Úsalo para validar \"external_router\" + \"ptyx\" no solo coding sino research.

## 4. Ejercicio
- Ejecuta 10 GAIA-L1 con tu harness y reporta accuracy. Identifica fallos de browsing vs reasoning.

## 5. Links
- https://arxiv.org/abs/2311.12983

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
