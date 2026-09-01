# Chain-of-Thought — Razonar paso a paso (Wei et al., 2022)

> **Autores:** Wei et al. / Google
> **Año:** 2022 · **Prioridad:** Imprescindible · **Lectura:** ~18 min
> **Link verificado:** [https://arxiv.org/abs/2201.11903](https://arxiv.org/abs/2201.11903)
> **Categoría Papers:** 01 Reasoning · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Chain-of-Thought Prompting Elicits Reasoning in Large Language Models (Wei et al., NeurIPS 2022) — Google Research.
> **Link:** https://arxiv.org/abs/2201.11903
> **Prioridad:** Imprescindible · **Tiempo:** 18 min

## 1. Resumen
Añadir ejemplos con **razonamiento intermedio explícito** (no solo respuesta final) dispara rendimiento en tareas de aritmética, sentido común y simbólicas. Con PaLM 540B: GSM8K 17.9% → 58.1% solo con CoT. Frase mágica zero-shot: *"Let's think step by step"*.

## 2. Ideas clave
- **Few-shot CoT:** 8 ejemplos con pasos intermedios supera few-shot estándar en 3 benchmarks.
- **Zero-shot CoT:** solo añadir *"Let's think step by step"* sube MultiArith 17.7% → 78.7% (sin ejemplos).
- **Escalabilidad:** solo emerge con modelos >100B; <10B apenas mejora (scaling law).
- **Por qué funciona:** obliga al modelo a descomponer problema en sub-pasos que ya vio en pre-training.

## 3. Evidencia
- GSM8K, SVAMP, MAWPS, AQuA, StrategyQA, coin flip, last letter concatenation — CoT gana en todos con escala.
- Ablation: respuestas más largas sin razonamiento no ayudan; el contenido del paso intermedio sí.

## 4. Aplica a tu harness
- Tu \(ThinkingBlock\) + \(footerInfoMap\) ya muestran razonamiento; hazlo **obligatorio en prompts** de agente: template \(Thought: ...\).
- Para \(opencode-remote\) SSE: separa \(part.type=reasoning\) de \(part.type=tool_call\). No mezcles.
- Úsalo en prompts de \(external_router\): pide al modelo explicar plan antes de llamar \(fs.read\).

## 5. Limitaciones
- Alucina si los pasos son largos sin verificación (ver Self-Consistency, Reflexion).
- Coste tokens ×2-3. Compensa con compaction (Effective Context Engineering).

## 6. Ejercicio
- Reescribe tu prompt de sistema para forzar CoT: "Piensa en 3 pasos numerados antes de actuar". Mide pass rate en 5 tareas SWE-bench Lite vs sin CoT.

## 7. Links
- https://arxiv.org/abs/2201.11903 · Blog Google.

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
