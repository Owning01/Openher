# SWE-bench — ¿Pueden los LLMs resolver issues reales? (Jimenez et al., 2023)

> **Autores:** Jimenez et al. / Princeton
> **Año:** 2023 · **Prioridad:** Imprescindible · **Lectura:** ~18 min
> **Link verificado:** [https://arxiv.org/abs/2310.06770](https://arxiv.org/abs/2310.06770)
> **Categoría Papers:** 05 Evaluacion · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** SWE-bench: Can Language Models Resolve Real-world GitHub Issues? (Jimenez et al., ICLR 2024).
> **Link:** https://arxiv.org/abs/2310.06770 — github.com/SWE-bench/SWE-bench — swebench.com
> **Prioridad:** Imprescindible — *el benchmark que tu harness debe aspirar*

## 1. Resumen
2,294 issues reales de GitHub (12 repos Python) con test fail→pass. Evalúa si el agente genera patch que hace pasar tests ocultos. De 1.96% (Claude 2) → 70%+ (2025 agents con ACI+SWE-agent).

## 2. Diseño
- Cada task = issue + repo snapshot + tests que fallan.
- Métrica: \"resolved\" si patch pasa todos los tests relevantes (no BLEU).
- Lite = 300 issues balanceados, Verified = 500 curados humanos.

## 3. Gotchas
- **Inflado:** muchos agentes memorizan repos. Usa Lite + repo privado no visto para medir real.
- No confíes en full 2,294 si el modelo vio los repos en pre-training.

## 4. Aplica a tu proyecto
- **Monta SWE-bench Lite local** con tu \"desktop-app ACI\" (fsx+ptyx) y mide si cambios en external_router rompen capacidad.
- Script \"web/scripts/eval-swe-bench.py\" que lance \"desktop-app + opencode2\" contra 20 issues.

## 5. Ejercicio
- Corre 5 issues con tu harness actual y reporta pass@1. Repite tras mejorar viewer (SWE-agent).

## 6. Links
- https://arxiv.org/abs/2310.06770

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
