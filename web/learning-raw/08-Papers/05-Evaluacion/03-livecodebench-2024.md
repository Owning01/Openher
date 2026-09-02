# LiveCodeBench — Evaluación sin contaminación, continua y holística (Jain et al., 2024)

> **Autores:** Naman Jain, King Han, Alex Gu, Wen-Ding Li, Fanjia Yan, Tianjun Zhang, Sida Wang, Armando Solar-Lezama, Koushik Sen, Ion Stoica / UC Berkeley + MIT
> **Año:** 2024 · **Versión:** arXiv 2403.07974 (actualizado mensual) · **Prioridad:** ALTA P0 · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2403.07974](https://arxiv.org/abs/2403.07974) · [livecodebench.github.io](https://livecodebench.github.io)
> **Categoría Papers:** 05 Evaluación · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa.

---

> **Paper:** LiveCodeBench: Holistic and Contamination Free Evaluation of Large Language Models for Code (Jain et al., 2024).
> **Relevancia para opencode-remote-android:** es el antídoto contra benchmark hacking. Si SWE-bench y HumanEval son fotos fijas, LiveCodeBench es video en vivo — te dice si tu harness mejora de verdad o solo memorizó.

## 1 Introducción — Qué problema resuelve

HumanEval (164 problemas, 2021) y SWE-bench (2.294 issues, 2023) son **estáticos**. Una vez publicados, entran al training data del próximo modelo. A los 6 meses, un 70% en HumanEval ya no significa "sabe codear" — significa "vio HumanEval". Los autores lo demuestran: algunos modelos rinden 20pp mejor en problemas previos a su cutoff que en problemas posteriores.

LiveCodeBench rompe eso con una idea simple: **scrapear problemas nuevos de competencias reales cada mes** (LeetCode, AtCoder, Codeforces) y evaluar sobre lo que *todavía no existe* cuando el modelo fue entrenado. Si tu harness mejora en LiveCodeBench del mes que viene, es mejora real.

Además es **holístico**: no solo mide generación de código, sino cuatro capacidades que un agente necesita en producción.

## 2 Ideas clave

### 2.1 Tres fuentes vivas, actualización mensual

| Fuente | Tipo de problemas | Por qué importa |
|---|:---|---|
| **LeetCode** | Algoritmos + estructuras de datos, tests ocultos | Volumen, dificultad graduada, similar a entrevistas |
| **AtCoder** | Concursos japoneses, problemas creativos | Variedad de estilos, no solo LeetCode-template |
| **Codeforces** | Competitivo puro, constraints extremos | Mide eficiencia, no solo correctitud |

El pipeline scrapea **~400+ problemas entre May 2023 y May 2024** para el paper, y sigue sumando. Cada release etiqueta los problemas por fecha — podés evaluar "solo posteriores al cutoff de mi modelo".

### 2.2 Cuatro escenarios, no solo "completá la función"

| Escenario | Qué mide | Input → Output |
|---|:---|:---|
| **Code Generation** | Escribir solución desde cero | Enunciado + tests → código que pasa |
| **Self-Repair** | Debuggear con feedback del juez | Código roto + error → fix (iterativo) |
| **Code Execution** | Predecir output sin ejecutar | Código + input → output esperado |
| **Test Output Prediction** | Diseñar tests | Código + spec → casos que cubren edge |

Esto es más cercano a tu harness real: el agente no solo genera código, también **lee un traceback de `cargo test`, propone un fix, y re-ejecuta** vía `ptyx`.

### 2.3 Anti-contaminación por diseño temporal

La gracia está en el **eje temporal**:

```
 cutoff modelo (ej: sep 2023)
        │
────────┼─────────────────────────────────► tiempo
        │   eval vieja (contaminada) │ eval nueva (limpia)
        │   HumanEval, SWE-bench     │ LiveCodeBench post-cutoff
```

Si evaluás solo sobre problemas **posteriores** al cutoff, garantizás que el modelo no los vio. El paper muestra caídas de 15-25pp al pasar de problemas pre-cutoff a post-cutoff en varios modelos — esa caída es la contaminación.

### 2.4 Correlación con Elo humano

Los autores comparan el ranking de LLMs en LiveCodeBench con el Elo de Codeforces de humanos. Correlación alta (Spearman >0.85): el benchmark ordena modelos como los ordenarían competencias reales. No es un proxy raro — es un proxy validado.

## 3 Evidencia / Experimentos

| Modelo | Code Gen (overall) | Self-Repair | Execution | Fecha problemas | Nota |
|---|:---:|:---:|:---:|:---:|---|
| GPT-4 (2023) | ~38% | ~32% | ~45% | May23-May24 mix | Pre-cutoff inflado |
| GPT-4o | ~52% | ~48% | ~58% | May23-May24 | Mejor en post-cutoff que GPT-4 |
| Claude 3.5 Sonnet | ~55% | ~50% | ~60% | May23-May24 | Top 2024 |
| DeepSeek-V3 / o1 | **~60-65%** | ~55% | ~68% | May23-May24 | Líderes 2025 |
| **Caída pre→post cutoff** | **-15 a -25pp** | — | — | Pre sep23 vs post sep23 | Prueba de contaminación |

- Evaluados **40+ LLMs** (open y closed) en los 4 escenarios.
- **Self-Repair** muestra el valor del loop: con 1 intento extra tras ver el error del juez, el pass rate sube ~8-12pp promedio — justifica tu `Reflexion`/`Self-Repair` loop en el harness.
- **Hard split** (problemas difíciles post-cutoff) es donde se separan los líderes: GPT-4 cae a ~12%, o1 se mantiene ~35%.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **Scraper continuo anti-contaminación** | Montá `web/scripts/livecodebench-sync.py` que cada mes baje los problemas nuevos del repo oficial y los guarde en `opencode-stats` (:8765). Tu CI de eval debe correr **solo sobre el slice post-cutoff** de tu modelo remoto (ver `shared/api/version.ts` para detectar dialecto/modelo). |
| **Self-Repair loop** | Es tu `ptyx` (:4849) + `cargo test` + re-prompt. Cuando el agente genera código que falla, no lo descartes — reinyectá el traceback y pedí fix (1-2 iteraciones). El paper prueba que eso vale +10pp. Implementalo en `web/src/shared/sse/handler.ts` como `repairTurn`. |
| **Code Execution sin ejecutar** | No lo uses para tu harness (vos sí podés ejecutar vía `ptyx`). Pero sirve para evaluar si Phi-3 local puede *predecir* output sin correr — si no puede, no lo uses como juez. |
| **Slice temporal para tu eval interna** | Si creás tu propio benchmark interno (20 issues de `desktop-app`), etiquetá cada issue con `created_at`. Al evaluar, filtrá `created_at > model_cutoff`. Así medís generalización, no memorización. |
| **Small model local** | Phi-3 3.8B rinde bajo en LiveCodeBench hard (~10-15%). No lo evalúes ahí para deprimirse — usalo como **generador de tests** (escenario Test Prediction) donde modelos chicos rinden mejor relativo. |
| **opencode-stats :8765** | Logueá cada run como `{date, model, scenario, pass_rate, slice: "pre"|"post", contamination_delta}`. Graficá la curva mensual — si tu harness sube en pre pero no en post, estás overfiteando al dataset viejo. |

```python
# web/scripts/livecodebench-sync.py — esqueleto
import datetime, json, subprocess

CUTOFF = "2024-09-01"  # cutoff de tu modelo remoto

def eval_slice(problems, scenario="generation"):
    passed = 0
    for p in problems:
        # 1. Alimentar enunciado al agente vía opencode :4097
        # 2. Capturar código generado
        # 3. Ejecutar contra tests ocultos vía ptyx / subprocess
        # 4. Contar pass
        pass
    return passed / len(problems)

if __name__ == "__main__":
    all_problems = load_livecodebench()  # del repo oficial
    pre  = [p for p in all_problems if p["date"] < CUTOFF]
    post = [p for p in all_problems if p["date"] >= CUTOFF]
    print(f"Pre-cutoff:  {eval_slice(pre):.1%}")
    print(f"Post-cutoff: {eval_slice(post):.1%}")
    print(f"Delta contaminación: {eval_slice(pre)-eval_slice(post):+.1%}")
```

## 5 Anti-patterns / Limitaciones

- **Scrapear sin respetar ToS.** LeetCode/AtCoder/Codeforces tienen términos de uso. El repo oficial de LiveCodeBench ya maneja el scraping con rate limit y cache — no re-scrapees agresivo desde tu CI. Usá su dataset curado.
- **Evaluar solo el slice viejo y festejar.** Si tu harness da 60% en problemas de 2023 pero 30% en 2025, no mejoraste — memorizaste. El paper insiste: **el número que importa es post-cutoff**.
- **Self-Repair infinito.** El paper permite 1-2 iteraciones de repair. Si dejás al agente reparar 10 veces, inflás el score y quemas tokens. Poné límite (2 repairs) y medí `pass@1` vs `pass@1+repair`.
- **No confundir LiveCodeBench con SWE-bench.** LiveCodeBench mide *algoritmos aislados* (función + tests). SWE-bench mide *repo entero* (navegación, edición multi-archivo). Necesitás ambos: LiveCodeBench para "¿sabe codear?" y SWE-bench para "¿sabe moverse en un codebase?".
- **Costo mensual.** Si corrés 400 problemas × 4 escenarios × 2 modelos, son ~3.200 ejecuciones. No lo corras completo cada semana. Sampleá 50 generation + 20 repair para CI; full solo mensual.

## 6 Ejercicios prácticos (en tu repo)

1. **Medí tu contaminación.** Corré 20 problemas de LiveCodeBench pre-cutoff (ej: jun 2023) y 20 post-cutoff (ej: feb 2025) con tu modelo remoto actual vía `opencode :4097`. Calculá `delta = pre - post`. Si delta >15pp, tu modelo está contaminado en el slice viejo — reportá siempre ambos números separados, no el promedio.

2. **Implementá Self-Repair de 1 iteración.** En tu loop SSE, cuando `cargo test` (vía `ptyx` :4849) falla, capturá el `stderr` y reinyectalo como `Observation: tests failed:\n<traceback>\nFix the code.` Re-evaluá 20 problemas de LiveCodeBench con y sin repair. Medí `+pp` y `tokens extra`. ¿Vale la pena para tu presupuesto?

3. **Dashboard temporal en opencode-stats.** Creá en `:8765` una tabla `livecodebench_runs(date, model, pre_rate, post_rate, delta)` y un endpoint que devuelva la serie mensual. Cada vez que actualizás el harness (ej: mejorás `fsx` o `external_router`), logueá un punto. Si `post_rate` no sube, el cambio no generaliza.

## 7 Referencias

- **Paper:** Jain et al., *LiveCodeBench: Holistic and Contamination Free Evaluation of Large Language Models for Code*, 2024 — https://arxiv.org/abs/2403.07974
- **Repo y leaderboard:** https://livecodebench.github.io · https://github.com/LiveCodeBench/LiveCodeBench
- **Relacionados en esta serie:** HumanEval (04) y MBPP (05) — benchmarks estáticos que LiveCodeBench reemplaza; SWE-bench (01) — repo-level complementario.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (pipeline de scraping temporal) del paper original
- [ ] Entiendo los 4 escenarios (generation, self-repair, execution, test prediction) y por qué importan
- [ ] Sé explicar por qué el slice post-cutoff es el único honesto y cómo calcular el delta de contaminación
- [ ] Anoté 1 idea para `web/scripts/livecodebench-sync.py` + `opencode-stats` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 05 Evaluación · opencode-remote-android*
