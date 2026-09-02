# SWE-bench — ¿Pueden los LLMs resolver issues reales de GitHub? (Jimenez et al., 2023)

> **Autores:** Carlos E. Jimenez, John Yang, Alexander Wettig, Shunyu Yao, Karthik Narasimhan, Ofir Press / Princeton + UChicago
> **Año:** 2023 · **Versión:** ICLR 2024 · **Prioridad:** Imprescindible · **Lectura:** ~18 min
> **Link verificado:** [https://arxiv.org/abs/2310.06770](https://arxiv.org/abs/2310.06770) · [swebench.com](https://www.swebench.com) · [github.com/SWE-bench/SWE-bench](https://github.com/SWE-bench/SWE-bench)
> **Categoría Papers:** 05 Evaluación · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** SWE-bench: Can Language Models Resolve Real-World GitHub Issues? (Jimenez et al., ICLR 2024).
> **Relevancia para opencode-remote-android:** es el benchmark que tu harness debe aspirar a correr local. Si tu agente pasa SWE-bench Lite, pasa casi cualquier fix en `desktop-app` o `web/src`.

## 1 Introducción — Qué problema resuelve

Hasta 2023, casi todos los benchmarks de código eran sintéticos: HumanEval (164 funciones chiquitas), MBPP (974 snippets). Un modelo podía sacar 70% ahí y no servir para arreglar un issue real con repo entero, imports rotos, y tests que nadie escribió pensando en IA.

SWE-bench cambia la vara: toma **2.294 issues reales de GitHub** de 12 repos Python populares (django, scikit-learn, matplotlib, etc.), cada uno con su snapshot del repo + el issue text + los tests que fallaban y que el PR humano hizo pasar. La tarea del agente no es completar una función: es **generar un patch que haga que los tests pasen**, clonando el repo y editando donde haga falta.

Es el primer benchmark que evalúa agentes *end-to-end*, no solo LMs con prompt.

## 2 Ideas clave

### 2.1 Cada task es un repo ejecutable, no un prompt

Cada instancia contiene:

| Campo | Qué es |
|---|---|
| `repo` | Snapshot exacto del código en el momento del issue |
| `issue` | Título + descripción del bug/feature (texto real del usuario) |
| `base_commit` | Commit previo al fix humano |
| `FAIL_TO_PASS` | Tests que fallaban antes y pasan después del PR humano |
| `PASS_TO_PASS` | Tests que ya pasaban y no deben romperse (regresión) |

El harness del benchmark clona el repo, aplica el patch del agente, corre los tests relevantes y dictamina `resolved` solo si **todos** los FAIL_TO_PASS pasan y ningún PASS_TO_PASS se rompe.

### 2.2 Métrica brutal: `resolved` (pass/fail), no BLEU ni similitud

No se compara el patch con el humano por texto. Se **ejecuta**. O pasa los tests o no. Esto evita que un patch "parecido" pero roto saque puntaje. Es más caro de evaluar (hay que levantar env), pero es la única métrica honesta.

### 2.3 Tres splits para distintos presupuestos

| Split | Tamaño | Para qué |
|---|:---:|---|
| **Full** | 2.294 | Leaderboard completo, reproducible |
| **Lite** | 300 | Subset curado, balanceado, barato de correr (recomendado para CI) |
| **Verified** | 500 | Filtrado humano: issues claros, tests determinísticos — el gold standard desde 2024 |

Si empezás, usá **Lite** (o Verified). Full es para paper; Lite es para tu `web/scripts/eval-*.py`.

### 2.4 El ACI importa más que el modelo

El salto grande no vino de un LLM más grande, sino de mejores harnesses: SWE-agent (viewer + terminal), OpenHands, Aider. Pasar de "tirar el issue al LLM y esperar un diff" a "darle un terminal + file viewer + loop ReAct" llevó el score de **1.96% (Claude 2 sin harness) → 33% (SWE-agent + GPT-4) → 70%+ (2025, Claude 4 + ACI pulido)**. El harness es el producto.

## 3 Evidencia / Experimentos

| Modelo / Sistema | Harness | Resolved (Full) | Año |
|---|:---:|:---:|:---:|
| Claude 2 | Sin harness (zero-shot patch) | 1.96% | 2023 |
| GPT-4 | Sin harness | 3.4% | 2023 |
| SWE-agent + GPT-4 | Viewer + bash + ReAct | 18.3% → 33% (iterado) | 2024 |
| OpenHands + GPT-4o | Terminal generalista | ~26% (Lite) | 2024 |
| Claude 3.5 Sonnet + SWE-agent | ACI + planning | ~55% (Verified) | 2024 |
| Claude 4 / GPT-5 + harness 2025 | ToT + Reflexion + viewer | **70%+ (Verified)** | 2025 |

- **Contaminación medida:** los autores muestran que si el modelo vio el repo en pre-training, el score se infla. Por eso existe **SWE-bench Live** y por eso debés evaluar también contra un repo privado nunca visto.
- **Costo:** Full = ~$50-150 en API + horas de ejecución. Lite = ~$8-15, 30-45 min. Verified similar a Lite.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **Repo snapshot + issue + tests** | Tu `desktop-app/src/infrastructure/http/*_router.rs` + `web/src` son el "repo". Un harness tipo SWE-bench clonaría `desktop-app` en temp, aplicaría el patch del agente y correría `cargo check && cargo test`. |
| **FAIL_TO_PASS / PASS_TO_PASS** | Modelá tus evals igual: guardá en `opencode-stats` (:8765) los tests que deben pasar tras el fix. No midas "el diff se parece" — medí `cargo test` verde. |
| **Lite para CI diario** | Creá `web/scripts/eval-swe-bench-lite.py` que tome 20 issues de Lite (o 20 issues sintéticos de tu repo) y lance el agente vía `opencode serve` (:4096/:4097) + `ptyx` (:4849). Logueá `resolved` a `opencode-stats` para graficar evolución. |
| **ACI > modelo** | No cambies de modelo remoto si tu harness es pobre. Mejorá primero el viewer (`fsx` + `HtmlPreview` mmap) y el loop ReAct (SSE `message.part.delta` → `tool_call` → `tool_result`). El paper prueba que eso rinde más que subir de GPT-4 a GPT-4o. |
| **Small model local no rinde acá** | Phi-3 3.8B no va a resolver SWE-bench (necesita razonar sobre repo entero). Usalo como **router/clasificador** ("¿este issue es trivial o necesita modelo grande?"), no como solver. |
| **Skills como harness portable** | Cada fix exitoso puede empaquetarse como skill (`SKILL.md` + patch template) en tus 8 `scannedRoots`. Así el próximo issue similar arranca con contexto. |

```python
# web/scripts/eval-swe-bench-lite.py — esqueleto
import subprocess, json, tempfile, pathlib

LITE_IDS = ["django__django-11019", "scikit-learn__scikit-learn-25570"]  # 20 de Lite

def eval_one(instance_id: str) -> bool:
    # 1. Clonar snapshot del benchmark (o tu repo sintético)
    # 2. Lanzar agente opencode vía API :4097 con issue text
    # 3. Capturar patch generado
    # 4. Aplicar patch + correr tests FAIL_TO_PASS
    result = subprocess.run(["pytest", "-k", "test_relevant"], capture_output=True)
    return result.returncode == 0

if __name__ == "__main__":
    results = {i: eval_one(i) for i in LITE_IDS}
    print(json.dumps(results, indent=2))
    print(f"Resolved: {sum(results.values())}/{len(results)}")
```

## 5 Anti-patterns / Limitaciones

- **Memorización de repos públicos.** Si evaluás solo sobre repos que el modelo ya vio (django, flask), el score está inflado 10-20pp. El paper lo advierte: usá Verified + un repo privado de control (ej: un fork interno de `desktop-app` con issues sintéticos no publicados) para medir generalización real.
- **Tests frágiles = falso negativo.** Algunos tests de SWE-bench son flaky (dependen de orden, red, timezone). El split Verified existe justo para filtrar eso. Si corrés Full sin filtrar, vas a perseguir fantasmas.
- **Costo de ejecución.** No corras 2.294 instancias en cada PR. Lite (300) ya tarda 45 min. Para dev local, sampleá 20 y extrapolá. Reservá Full para release.
- **Patch que pasa tests pero rompe semántica.** Pasar FAIL_TO_PASS no garantiza que el fix sea el correcto — puede ser un hack que satisface el test pero no la intención del issue. Por eso SWE-bench Verified incluye revisión humana del criterio.
- **No mide UX del harness.** SWE-bench no evalúa latencia, tokens, ni experiencia del thin client (SSE, IndexedDB, `visibility:hidden` de `DesktopPanelRenderer`). Complementá con métricas de tu `opencode-stats` (:8765) — latencia p50/p95, turnos hasta resolved.

## 6 Ejercicios prácticos (en tu repo)

1. **Corré 5 issues de Lite con tu harness actual.** Levantá `opencode serve` (:4097) + `desktop-app` (:4848/:4849). Tomá 5 instancias de SWE-bench Lite, alimentá el issue text al agente vía tu thin client y capturá el patch. Corré los tests FAIL_TO_PASS. Reportá `pass@1` (cuántos de 5). Repetilo tras mejorar el viewer (ej: agregar `mmap+<base href>` como hace `external_router` para previews) — ¿cuánto sube el resolved?

2. **Armá tu "SWE-bench interno" de 20 issues.** Creá 20 issues sintéticos sobre `desktop-app` (ej: "el `probe()` de `external_router.rs:19` no respeta timeout en Windows", "el `list_dir` de `fsx.rs:43` no muestra dotfiles") con sus tests FAIL_TO_PASS. Guardalos en `web/scripts/eval-internal.json` y hacé que tu script de eval los corra contra el agente. Es tu benchmark privado anti-contaminación.

3. **Instrumentá `opencode-stats` para eval.** Cada run de eval debe emitir a `:8765` un evento `{instance_id, resolved, turns, tokens, latency_ms}`. Graficá `resolved` y `turns` en el tiempo. ¿Tu último cambio en `ptyx` bajó los turnos? Si no medís, no mejorás.

## 7 Referencias

- **Paper:** Jimenez et al., *SWE-bench: Can Language Models Resolve Real-World GitHub Issues?*, ICLR 2024 — https://arxiv.org/abs/2310.06770
- **Leaderboard y dataset:** https://www.swebench.com · https://github.com/SWE-bench/SWE-bench
- **SWE-agent (harness ACI):** https://github.com/SWE-agent/SWE-agent — el viewer que inspiró tu `fsx`/`ptyx`
- **Relacionados en esta serie:** HumanEval (01-04), MBPP (01-05), LiveCodeBench (01-03) — evolución de benchmarks sintéticos → reales → live.

---

## Checklist de lectura

- [ ] Leí el abstract y la sección 3 (SWE-bench dataset construction) del paper original
- [ ] Entiendo la diferencia entre Full / Lite / Verified y cuándo usar cada uno
- [ ] Sé por qué ACI/harness importa más que cambiar de modelo y cómo aplica a `fsx`/`ptyx`
- [ ] Anoté 1 idea para `web/scripts/eval-swe-bench-lite.py` + `opencode-stats` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 05 Evaluación · opencode-remote-android*
