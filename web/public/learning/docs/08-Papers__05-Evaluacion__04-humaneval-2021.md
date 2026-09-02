# HumanEval — 164 problemas Python hand-written que fundaron el eval de código (Chen et al., 2021)

> **Autores:** Mark Chen, Jerry Tworek, Heewoo Jun, Qiming Yuan, Henrique Ponde de Oliveira Pinto, Jared Kaplan, Harri Edwards, Yuri Burda, Nicholas Joseph, Greg Brockman, Alex Ray, Raul Puri, Gretchen Krueger, Michael Petrov, Heidy Khlaaf, Girish Sastry, Pamela Mishkin, Brooke Chan, Scott Gray, Nick Ryder, Mikhail Pavlov, Alethea Power, Lukasz Kaiser, Mohammad Bavarian, Clemens Winter, Philippe Tillet, Felipe Petroski Such, Dave Cummings, Matthias Plappert, Fotios Chantzis, Elizabeth Barnes, Ariel Herbert-Voss, William Hebgen Guss, Alex Nichol, Alex Paino, Nikolas Tezak, Jie Tang, Igor Babuschkin, Suchir Balaji, Shantanu Jain, William Saunders, Christopher Hesse, Andrew N. Carr, Jan Leike, Josh Achiam, Vedant Misra, Evan Morikawa, Alec Radford, Matthew Knight, Miles Brundage, Mira Murati, Katie Mayer, Peter Welinder, Bob McGrew, Dario Amodei, Sam McCandlish, Ilya Sutskever, Wojciech Zaremba / OpenAI
> **Año:** 2021 · **Versión:** arXiv 2107.03374 (Codex) · **Prioridad:** ALTA P0 · **Lectura:** ~14 min
> **Link verificado:** [https://arxiv.org/abs/2107.03374](https://arxiv.org/abs/2107.03374) · [github.com/openai/human-eval](https://github.com/openai/human-eval)
> **Categoría Papers:** 05 Evaluación · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa.

---

> **Paper:** Evaluating Large Language Models Trained on Code (Chen et al., 2021) — el paper de **Codex**.
> **Relevancia para opencode-remote-android:** es el "hola mundo" del eval de código. Si tu Phi-3 local no pasa HumanEval, no intentes SWE-bench. 164 problemas, 5 minutos, te dice si el modelo sabe codear lo básico.

## 1 Introducción — Qué problema resuelve

Antes de 2021, evaluar código era un desastre: BLEU sobre snippets, tests ruidosos, datasets scrapeados sin curar. Nadie sabía si GPT-3 sabía programar porque no había benchmark decente.

HumanEval propone algo minimalista y brutal: **164 problemas escritos a mano** por humanos, cada uno con **firma + docstring + tests ocultos** (promedio 7.7 tests por problema). El modelo ve solo la firma y el docstring, genera el cuerpo, y se evalúa ejecutando los tests. No hay grises: **pass o fail**.

El paper introduce Codex (fine-tune de GPT-3 en 54M repos) y demuestra que **pre-entrenar en código importa**: Codex 12B saca **28.8% pass@1** donde GPT-3 12B saca **0%** en el mismo prompt. Nace el eval de código moderno y de paso nace Copilot.

## 2 Ideas clave

### 2.1 Formato minimalista: firma + docstring → cuerpo

Cada problema es una función Python autocontenida:

```python
def has_close_elements(numbers: List[float], threshold: float) -> bool:
    """ Chequea si algún par de números está a distancia < threshold.
    >>> has_close_elements([1.0, 2.0, 3.0], 0.5)
    False
    >>> has_close_elements([1.0, 2.8, 3.0], 0.3)
    True
    """
    # <- el modelo genera desde acá
```

El docstring incluye 2-3 doctests de ejemplo, pero los **tests de evaluación son ocultos** y más exigentes (edge cases, performance). El modelo no los ve.

### 2.2 Métrica `pass@k` — muestreo, no greedy único

Como la generación es estocástica (temperature >0), el paper define:

- **`pass@1`**: de `n` muestras, ¿qué fracción pasa al menos 1? (estimador insesgado, no solo greedy)
- **`pass@10` / `pass@100`**: si generás 10 o 100 intentos, ¿al menos uno pasa?

Esto importa para tu harness: un agente que puede reintentar (Self-Repair) debe medirse con `pass@k`, no solo greedy. HumanEval te da el baseline `pass@1` barato; luego medís cuánto ganás con reintentos.

| k | Codex 12B | GPT-3 12B | Gap |
|---|:---:|:---:|:---:|
| pass@1 | **28.8%** | 0.0% | +28.8pp |
| pass@10 | 46.8% | — | — |
| pass@100 | **72.3%** | — | — |

Con 100 intentos, Codex resuelve 3 de cada 4 problemas — el modelo *sabe* la solución, solo necesita muestreo.

### 2.3 Hand-written, no scrapeado

A diferencia de MBPP (crowd-sourced) o LiveCodeBench (scrapeado), HumanEval fue **escrito por 3 autores** con control de calidad. Cada problema fue revisado para no tener ambigüedad ni leaks de GitHub. Eso lo hace pequeño (164) pero de alta señal: si fallás acá, fallás en lo básico.

### 2.4 Base de todo lo que vino después

HumanEval es el ancestro directo de:

- **MBPP** (974 problemas, mismo formato, más volumen)
- **LiveCodeBench** (scraping continuo, anti-contaminación)
- **SWE-bench** (de función aislada → repo entero)
- **EvalPlus / HumanEval+** (80× más tests, detecta falsos positivos del HumanEval original)

## 3 Evidencia / Experimentos

| Modelo | Tamaño | pass@1 | pass@10 | pass@100 |
|---|:---:|:---:|:---:|:---:|
| GPT-3 (sin code pre-train) | 12B | 0.0% | — | — |
| Codex | 12B | **28.8%** | 46.8% | 72.3% |
| Codex | 2.5B | 21.4% | — | — |
| Codex | 300M | 13.2% | — | — |
| GPT-J 6B (code) | 6B | 11.6% | — | — |
| GPT-NeoX 20B | 20B | 15.4% | — | — |
| **Phi-3-mini 3.8B (2024)** | 3.8B | **~60%** | — | — |
| **GPT-4 / Claude 3.5** | — | **~85-90%** | — | — |

- **Ley de escala:** pass@1 crece log-lineal con parámetros y con datos de código. Pero Phi-3 3.8B (2024) supera a Codex 12B (2021) — la calidad de datos sintéticos compensa escala.
- **EvalPlus (2023):** al expandir los tests 80×, el pass@1 de varios modelos cae **10-15pp** — HumanEval original tenía falsos positivos (soluciones que pasaban los 7 tests pero fallaban en edge). Si tu eval da muy alto, probá HumanEval+.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **Baseline de 5 minutos** | Antes de correr SWE-bench (45 min, caro), corré HumanEval (164 problemas, 5 min, barato) sobre tu modelo remoto y sobre Phi-3 local. Si Phi-3 saca <30% pass@1, no lo uses como solver — usalo como router/clasificador. |
| **pass@k y reintentos** | Tu harness con `ptyx` + Self-Repair es `pass@k` con `k = 1 + repairs`. Medí `pass@1` (greedy) vs `pass@1 + 1 repair` (reinyectar traceback). El paper te da el marco para reportar ambos. |
| **Docstring → código** | Tus skills (`SKILL.md` frontmatter + scripts) son docstrings para el agente. Si el docstring es ambiguo, el agente falla igual que en HumanEval. Escribí `SKILL.md` con firma clara + ejemplos (como HumanEval) — no con prosa vaga. |
| **Tests ocultos** | No le muestres al agente los tests de evaluación. En tu `web/scripts/eval-humaneval.py`, separá `prompt` (firma+docstring) de `tests` (ocultos). Si el agente ve los tests, los hardcodea. |
| **opencode-stats :8765** | Logueá `{model, pass@1, pass@10, eval: "humaneval"}` por cada cambio de harness. HumanEval es tu "termómetro diario" — barato, rápido, comparable entre modelos. SWE-bench es tu "resonancia mensual". |
| **Small model local** | Phi-3-mini Q4 (4GB RAM) puede correr HumanEval local sin red. Integralo en `desktop-app` como sidecar (candle/llama.cpp) para evaluar offline y decidir si vale la pena llamar al remoto. |

```python
# web/scripts/eval-humaneval.py — esqueleto
from human_eval.data import write_jsonl, read_problem
from human_eval.execution import check_correctness
import subprocess, json

def eval_pass_at_k(problems, k=1, model="remote"):
    passed = 0
    for p in problems:
        prompt = p["prompt"]  # firma + docstring, SIN tests
        # Llamar a tu modelo vía opencode :4097 o Phi-3 local
        completion = call_model(prompt, model=model)
        # Ejecutar contra tests ocultos (no mostrar al modelo)
        result = check_correctness(p, completion, timeout=3.0)
        passed += int(result["passed"])
        log_to_stats({"model": model, "problem": p["task_id"], "passed": result["passed"]})
    return passed / len(problems)

if __name__ == "__main__":
    problems = list(read_problem("HumanEval.jsonl"))
    print(f"pass@1 remote: {eval_pass_at_k(problems, model='remote'):.1%}")
    print(f"pass@1 phi3:   {eval_pass_at_k(problems, model='phi3'):.1%}")
```

## 5 Anti-patterns / Limitaciones

- **Memorización total.** HumanEval lleva 4 años público. Todo modelo serio lo vio en training. Un 85% en 2025 no significa "sabe codear" — significa "memorizó 164 funciones". **Nunca uses HumanEval solo.** Complementá con LiveCodeBench post-cutoff y con tu benchmark interno privado.
- **Falsos positivos.** HumanEval original tiene pocos tests (7.7 promedio). Soluciones que pasan pueden fallar en edge. Si necesitás rigor, usá **HumanEval+** (EvalPlus, 80× tests) — el paper de EvalPlus muestra caídas de 10-15pp.
- **Solo Python, solo función aislada.** No mide navegación de repo, edición multi-archivo, ni uso de tools — para eso está SWE-bench. No extrapoles "90% HumanEval → buen agente de repo".
- **pass@k mal estimado.** El estimador insesgado de `pass@k` requiere `n >> k` muestras. Si generás `n=10` y reportás `pass@100`, el número es basura. Generá `n=20` para `pass@1`/`pass@10` honesto.
- **Temperature y sampling.** HumanEval con `temperature=0` (greedy) da `pass@1` determinista pero subestima `pass@k`. Con `temperature=0.8` y `n=20` medís mejor el potencial con reintentos. Reportá siempre la temperatura.

## 6 Ejercicios prácticos (en tu repo)

1. **Baseline de 5 minutos.** Cloná `github.com/openai/human-eval`, corré `web/scripts/eval-humaneval.py` con tu modelo remoto (vía `:4097`) y con Phi-3 local (si lo tenés en `desktop-app` sidecar). Reportá `pass@1` de ambos. Si Phi-3 <30% y remoto >70%, ya sabés tu política de routing: Phi-3 clasifica, remoto resuelve.

2. **HumanEval+ para cazar falsos positivos.** Tomá los 164 problemas, evaluá con tu modelo y luego re-evaluá los que pasaron con **EvalPlus** (`github.com/evalplus/evalplus`, `evalplus --dataset humaneval`). ¿Cuántos "pasados" caen al agregar 80× tests? Esos son tus falsos positivos — el agente generó código que parece bien pero no lo es.

3. **De pass@1 a pass@1+repair.** Elegí 20 problemas que tu modelo falla en greedy. Reinyectá el traceback del test fallido como `Observation` y pedí fix (1 iteración, como en LiveCodeBench Self-Repair). Medí cuántos de esos 20 ahora pasan. Ese `+pp` es el valor de tu loop `ptyx` + Reflexion — justifica si vale el token extra.

## 7 Referencias

- **Paper:** Chen et al., *Evaluating Large Language Models Trained on Code*, 2021 — https://arxiv.org/abs/2107.03374
- **Dataset y harness:** https://github.com/openai/human-eval
- **EvalPlus (HumanEval+):** https://github.com/evalplus/evalplus — 80× tests, caza falsos positivos
- **Relacionados en esta serie:** MBPP (05) — mismo formato, más volumen; LiveCodeBench (03) — anti-contaminación; SWE-bench (01) — de función a repo entero.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 2 (ejemplo de problema HumanEval) del paper original
- [ ] Entiendo `pass@k` y por qué `pass@1` greedy subestima el potencial con reintentos
- [ ] Sé por qué HumanEval está contaminado en 2025 y con qué complementarlo (LiveCodeBench post-cutoff, EvalPlus)
- [ ] Anoté 1 script `eval-humaneval.py` para correr como termómetro diario en `opencode-stats`
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 05 Evaluación · opencode-remote-android*
