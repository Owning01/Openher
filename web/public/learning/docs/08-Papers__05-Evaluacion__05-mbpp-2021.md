# MBPP — 974 problemas Python básicos para filtro rápido (Austin et al., 2021)

> **Autores:** Jacob Austin, Augustus Odena, Maxwell Nye, Maarten Bosma, Henryk Michalewski, David Dohan, Ellen Jiang, Carrie Cai, Michael Terry, Quoc Le, Charles Sutton / Google Research
> **Año:** 2021 · **Versión:** arXiv 2108.07732 · **Prioridad:** MEDIA P1 · **Lectura:** ~13 min
> **Link verificado:** [https://arxiv.org/abs/2108.07732](https://arxiv.org/abs/2108.07732) · [github.com/google-research/google-research/tree/master/mbpp](https://github.com/google-research/google-research/tree/master/mbpp)
> **Categoría Papers:** 05 Evaluación · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa.

---

> **Paper:** Program Synthesis with Large Language Models (Austin et al., 2021) — el paper de **MBPP**.
> **Relevancia para opencode-remote-android:** es tu filtro barato. 974 problemas entry-level, 3 tests cada uno, más volumen que HumanEval. Si tu Phi-3 local no pasa MBPP, no lo mandes a SWE-bench.

## 1 Introducción — Qué problema resuelve

HumanEval (164 problemas, hand-written, alta calidad) es excelente pero chico. Con 164 puntos, el intervalo de confianza es ancho: 70% vs 75% puede ser ruido. Además, HumanEval cubre un rango medio de dificultad — no te dice si el modelo falla en lo más básico.

MBPP (Mostly Basic Python Programming) aporta lo complementario: **974 tareas entry-level** — loops, condicionales, strings, dicts, cosas que un humano resuelve en 2 minutos. Fueron **crowd-sourced** (workers escriben problema + descripción en inglés + 3 tests), luego curadas. Cada problema es una función con **1 frase de spec en inglés** + **3 asserts**.

El paper evalúa el trade-off clave para tu harness: **few-shot vs fine-tuning**, y muestra que con 3 ejemplos few-shot, un modelo grande ya rinde decente sin entrenar.

## 2 Ideas clave

### 2.1 Formato ultra-simple: 1 frase + 3 tests

```python
# Problema MBPP típico
def similar_elements(test_tup1, test_tup2):
    """ Escribe una función que devuelva los elementos comunes de dos tuplas.
    >>> similar_elements((3, 4, 5, 6), (5, 7, 4, 10))
    (4, 5)
    """
    # <- el modelo genera acá (tupla, set, lo que sea que pase los 3 tests)

# Tests ocultos (3 por problema, no mostrados al modelo en eval few-shot)
assert similar_elements((3,4,5,6), (5,7,4,10)) == (4,5)
assert similar_elements((1,2), (3,4)) == ()
assert similar_elements((1,1,1), (1,1,1)) == (1,)  # o similar, depende del curado
```

A diferencia de HumanEval (docstring rico + firma), MBPP da **menos contexto** — solo una frase. Mide si el modelo entiende inglés coloquial y lo traduce a código, no si sigue una firma tipada.

### 2.2 974 problemas = mejor estadística que HumanEval

| Benchmark | # Problemas | Tests/problema | Fuente | Dificultad |
|---|:---:|:---:|---|---|
| **HumanEval** | 164 | ~7.7 | Hand-written (3 autores) | Media |
| **MBPP** | **974** | 3 | Crowd-sourced + curado | **Entry-level** |
| LiveCodeBench | 400+ (crece mensual) | ocultos | LeetCode/AtCoder/CF | Media-Alta |

Con 974 puntos, la diferencia de 2pp ya es significativa. Ideal para comparar dos variantes de tu harness sin ruido.

### 2.3 Few-shot es el modo de eval

El paper reporta tres modos:

| Modo | Qué ve el modelo | Resultado (137B LaMDA) |
|---|:---|:---:|
| **Zero-shot** | Solo la spec en inglés | ~15% |
| **Few-shot (3 ejemplos)** | 3 problemas resueltos + spec nueva | **~45%** |
| **Fine-tuned en MBPP** | Entrenado en 374 problemas, testeado en 500 | ~55% |

La lección: **3 ejemplos few-shot valen casi tanto como fine-tunear**. Para tu harness, esto significa que un buen prompt con 2-3 ejemplos de `fsx`/`ptyx` puede rendir más que un LoRA caro.

### 2.4 MBPP sanitizado (MBPP+ / MBPP-500)

El dataset original tiene ruido (tests ambiguos, specs vagas). La comunidad curó:

- **MBPP-500**: subset de 500 problemas bien formados (usado por EvalPlus).
- **MBPP sanitized**: 427 problemas con tests verificados.
- **EvalPlus MBPP+**: 35× más tests por problema (de 3 → ~100), caza falsos positivos como en HumanEval+.

Si tu `pass@1` en MBPP original es sospechosamente alto (>75%), probá MBPP+ — suele caer 10-12pp.

## 3 Evidencia / Experimentos

| Modelo | Tamaño | Few-shot (3) pass@1 | Fine-tuned pass@1 |
|---|:---:|:---:|:---:|
| LaMDA | 137B | ~45% | 55% |
| Codex 12B | 12B | ~47% | — |
| GPT-3 175B | 175B | ~45% | — |
| PaLM 540B | 540B | ~60% | — |
| **Phi-3-mini 3.8B (2024)** | 3.8B | **~55-60%** | — |
| **GPT-4 / Claude 3.5** | — | **~80-85%** | — |

- **MBPP vs HumanEval:** correlación ~0.85 entre ambos, pero MBPP tiene techo más alto (problemas más fáciles). Un modelo que saca 85% en MBPP puede sacar 70% en HumanEval — no son intercambiables.
- **EvalPlus MBPP+ (2023):** al expandir de 3 a ~100 tests, el pass@1 cae **~10-12pp** promedio — confirma que 3 tests dejan pasar soluciones rotas.
- **Curva de dificultad:** MBPP entry-level → HumanEval medio → LiveCodeBench hard. Tu Phi-3 local debería pasar MBPP (>50%) antes de intentar HumanEval.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **Filtro rápido pre-SWE-bench** | Corré MBPP (974 probs, 3 tests, ~10 min) como **gate** antes de SWE-bench Lite (300 issues, 45 min). Si Phi-3 saca <40% en MBPP, no lo uses como solver — ruteá directo al remoto. Ahorrás 35 min de eval inútil. |
| **Few-shot > fine-tune** | Antes de entrenar un LoRA para tu dominio (opencode tasks), probá 3 ejemplos few-shot en el prompt del agente (`web/src/shared/api/prompts.ts`). El paper prueba que 3 ejemplos bien elegidos rinden casi como fine-tune, sin GPU. |
| **Volumen para A/B testing** | Con 974 puntos, podés comparar dos variantes de harness (ej: `external_router` con/sin cache) y detectar +2pp con significancia. Con HumanEval (164) necesitás +5pp para estar seguro. Usá MBPP para micro-optimizaciones. |
| **opencode-stats :8765** | Logueá `{model, dataset: "mbpp", pass@1, sanitized: true/false, evalplus: true/false}` separado de HumanEval. No promedies MBPP con HumanEval — son escalas distintas. |
| **Small model local** | MBPP es el benchmark ideal para Phi-3 3.8B local: problemas chicos, 3 tests, corre en 4GB RAM sin red. Integralo en `desktop-app` sidecar para eval offline instantánea. Si Phi-3 pasa MBPP, podés confiarle tasks entry-level sin llamar al remoto. |
| **Skills como few-shot** | Cada skill (`SKILL.md` + scripts) es un ejemplo few-shot para el agente. El paper valida que 3 ejemplos curados bastan — curá 3 skills de referencia (ej: `fs.read`, `ptyx exec`, `external probe`) y usalas como few-shot en el system prompt. |

```python
# web/scripts/eval-mbpp.py — esqueleto
import json, subprocess
from pathlib import Path

def eval_mbpp(problems, model="remote", few_shot=3):
    passed = 0
    for p in problems:
        # few_shot=3: anteponer 3 ejemplos resueltos al prompt
        prompt = build_few_shot_prompt(p, k=few_shot)
        completion = call_model(prompt, model=model)  # via :4097 o phi3 local
        # 3 tests ocultos por problema
        ok = run_tests(completion, p["test_list"])  # ptyx o subprocess
        passed += int(ok)
    return passed / len(problems)

if __name__ == "__main__":
    problems = json.loads(Path("mbpp.jsonl").read_text().splitlines())
    print(f"MBPP pass@1 (remote, 3-shot): {eval_mbpp(problems, 'remote'):.1%}")
    print(f"MBPP pass@1 (phi3, 3-shot):   {eval_mbpp(problems, 'phi3'):.1%}")
    # Si phi3 <40%, no lo uses como solver
```

## 5 Anti-patterns / Limitaciones

- **3 tests no alcanzan.** Con solo 3 asserts, muchas soluciones incorrectas pasan por casualidad (falso positivo). El paper lo admite. Si reportás MBPP sin aclarar si es sanitized o EvalPlus, el número está inflado. Siempre reportá `MBPP (sanitized, 3 tests)` vs `MBPP+ (100 tests)` separado.
- **Crowd-sourced = ruido.** Algunos problemas MBPP tienen specs ambiguas ("escribí una función que haga X" sin aclarar edge cases) o tests inconsistentes. No persigas el 100% — el techo humano estimado es ~95%, no 100%.
- **Solo Python, solo entry-level.** MBPP no mide repo navigation, multi-archivo, ni tool-use. Un 85% en MBPP no implica que el agente pueda fixear `desktop-app/src/infrastructure/http/external_router.rs`. Para eso necesitás SWE-bench.
- **Contaminación total.** MBPP es de 2021 y está en todo training set. Un 80% en 2025 no es señal de calidad — es memorización. Usalo como **filtro negativo** ("si no pasa MBPP, no sirve") no como **filtro positivo** ("pasó MBPP, entonces sirve").
- **No confundir MBPP con HumanEval.** MBPP es más fácil y más ruidoso. No promedies ambos ni compares `pass@1` entre ellos. Reportalos siempre separados con su `n` y su variante (sanitized/EvalPlus).

## 6 Ejercicios prácticos (en tu repo)

1. **Gate de 10 minutos.** Corré `web/scripts/eval-mbpp.py` con `few_shot=3` sobre Phi-3 local y sobre tu modelo remoto. Si Phi-3 saca >50%, habilitalo como solver para tasks entry-level (ej: `list_dir`, `fs.read` simples). Si saca <40%, configuralo solo como router/clasificador. Documentá el umbral en `web/src/shared/api/model-router.ts`.

2. **Few-shot vs fine-tune en tu dominio.** Elegí 20 tasks de tu repo (ej: "mover archivo con `shell.fs.move`", "probar puerto con `probe`"). Evaluá dos variantes: (a) prompt con 3 ejemplos few-shot de tasks similares, (b) prompt zero-shot. Medí `pass@1` en MBPP-500 con ambas variantes. ¿Cuánto ganás con few-shot? ¿Justifica un LoRA o con few-shot alcanza?

3. **Caza falsos positivos con EvalPlus.** Corré MBPP original (3 tests) y luego re-evaluá los mismos completions con `evalplus --dataset mbpp` (35× tests). Reportá `pass@1 (3 tests)` vs `pass@1 (MBPP+)`. La diferencia son tus falsos positivos. Si es >10pp, tu harness genera código que *parece* bien pero no lo es — agregá más tests a tu eval interna.

## 7 Referencias

- **Paper:** Austin et al., *Program Synthesis with Large Language Models*, 2021 — https://arxiv.org/abs/2108.07732
- **Dataset:** https://github.com/google-research/google-research/tree/master/mbpp
- **EvalPlus (MBPP+):** https://github.com/evalplus/evalplus — 35× tests, sanitized splits
- **Relacionados en esta serie:** HumanEval (04) — mismo formato, hand-written; LiveCodeBench (03) — anti-contaminación; SWE-bench (01) — de función a repo.

---

## Checklist de lectura

- [ ] Leí el abstract y la tabla 2 (few-shot vs fine-tuned) del paper original
- [ ] Entiendo por qué MBPP es filtro rápido (974 probs, 3 tests) y no benchmark final
- [ ] Sé la diferencia entre MBPP original / sanitized / MBPP+ y por qué reportarlos separado
- [ ] Anoté 1 gate `eval-mbpp.py` para decidir routing Phi-3 vs remoto esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 05 Evaluación · opencode-remote-android*
