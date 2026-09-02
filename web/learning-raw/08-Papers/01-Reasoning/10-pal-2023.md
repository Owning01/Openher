# PAL — Program-Aided Language Models (Gao et al., 2023)

> **Autores:** Gao, Madaan, Zhou, Alon, Liu, Yang, Callan, Neubig / CMU + Google
> **Año:** 2023 · **Prioridad:** MEDIA P1 · **Lectura:** ~14 min
> **Link verificado:** [https://arxiv.org/abs/2211.10435](https://arxiv.org/abs/2211.10435)
> **Categoría Papers:** 01 Reasoning · **Nivel:** intermedio · **Versión:** arXiv 2022-11-18 (ICLR 2023)

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** PAL: Program-Aided Language Models Can Solve Reasoning Tasks (Gao et al., 2023).
> **Link:** https://arxiv.org/abs/2211.10435
> **Relevancia para opencode-remote-android:** es el patrón "no confíes en el LLM para calcular — hacelo ejecutar código". Tu `ptyx :4849` (WS PTY) es literalmente el intérprete PAL. Cada vez que el modelo debe calcular, contar o transformar datos, obligalo a escribir código y ejecutarlo en `ptyx` en lugar de responder en texto.
> **Prioridad:** MEDIA P1 · **Nuevo vs CoT:** CoT razona en lenguaje natural y calcula "a ojo"; PAL razona escribiendo Python/JS y deja que el intérprete calcule.

## 1 Introducción — Qué problema resuelve

CoT mejora el razonamiento, pero el LLM sigue haciendo aritmética "en la cabeza" — y se equivoca. Ejemplo: con CoT, el modelo escribe `"2 latas × 3 = 6, 5+6=11"` y a veces pone `5+6=12` porque el cálculo es texto generado, no ejecución. En GSM8K con `code-davinci-002`, CoT logra 65% pero PAL sube a **72%** solo por ejecutar el código.

PAL propone: intercalá **lenguaje natural + código ejecutable**. El modelo genera un `Thought` en NL, luego un bloque de código (Python/JS), el harness lo ejecuta y devuelve el resultado como `Observation`. La respuesta final se basa en la ejecución, no en la alucinación del modelo.

Es ReAct donde la tool es siempre un intérprete de código. Y para tu thin client, ya tenés el intérprete: `ptyx :4849`.

## 2 Ideas clave

### 2.1 Pipeline — Pensar, programar, ejecutar, responder

```
Usuario: "Tengo 5 pelotas, compro 2 latas de 3. ¿Cuántas tengo?"

PAL:
  Thought (NL): "Roger tenía 5 pelotas. Compra 2 latas de 3 cada una."
  Code:        initial = 5
               per_can = 3
               cans = 2
               total = initial + cans * per_can
               print(total)
  Exec (ptyx): "11"
  Answer:      "Roger tiene 11 pelotas."
```

El modelo no calcula `5+6` en texto — lo calcula el intérprete. Si el código tiene bug, el intérprete devuelve error y el modelo corrige (loop Reflexion).

### 2.2 Por qué supera a CoT — El intérprete no alucina

| Tarea | CoT (code-davinci-002) | PAL | Ganancia |
|---|:---:|:---:|:---:|
| **GSM8K** | 65.6% | **72.0%** | +6.4pp |
| **SVAMP** | 74.8% | **79.4%** | +4.6pp |
| **ASDiv** | 76.9% | **79.6%** | +2.7pp |
| **Simbólico (coloured objects)** | 73.7% | **95.1%** | +21.4pp |
| **Simbólico (penguins)** | 69.2% | **93.3%** | +24.1pp |
| **Date understanding** | 53.8% | **76.2%** | +22.4pp |

En tareas simbólicas y de fechas, PAL casi duplica a CoT — porque esas tareas requieren manipulación precisa que el texto no da.

### 2.3 PAL es ReAct con tool = intérprete

Si ya entendiste ReAct (paper 04), PAL es un caso particular:

```
ReAct genérico:  Thought → Action(tool arbitraria) → Observation
PAL específico:  Thought(NL) → Action(python_exec) → Observation(resultado)
```

La diferencia es que PAL **fuerza** que toda computación pase por código. ReAct permite `Thought: "5+6=11"` sin ejecutar; PAL exige `print(5+6)` y verifica.

### 2.4 Few-shot con código — Cómo promptear

El prompt few-shot muestra ejemplos con NL + código:

```python
# Q: Olivia tiene $23. Compra 5 bagels a $3 cada uno. ¿Cuánto le queda?
# Thought: Olivia tenía 23, gasta 5*3=15
money_initial = 23
bagels = 5
price = 3
money_spent = bagels * price
money_left = money_initial - money_spent
print(money_left)  # → 8
```

El modelo aprende a generar variables con nombres descriptivos y a usar `print` para el resultado final. El harness extrae el bloque ```python y lo ejecuta.

## 3 Evidencia / Experimentos

Todos con `code-davinci-002` (175B code model), 8-shot:

| Benchmark | Tipo | Direct | CoT | PAL | PAL vs CoT |
|---|:---:|:---:|:---:|:---:|:---:|
| **GSM8K** | Math 8.5k | 19.7% | 65.6% | **72.0%** | +6.4pp |
| **SVAMP** | Math variado | 38.9% | 74.8% | **79.4%** | +4.6pp |
| **ASDiv** | Math | 57.9% | 76.9% | **79.6%** | +2.7pp |
| **GSM-Hard** (números grandes) | Math | 5.0% | 20.6% | **61.2%** | **+40.6pp** |
| **Coloured Objects** | Simbólico | — | 73.7% | **95.1%** | +21.4pp |
| **Penguins** | Simbólico | — | 69.2% | **93.3%** | +24.1pp |
| **Date Understanding** | Temporal | — | 53.8% | **76.2%** | +22.4pp |
| **Object Counting** | Conteo | — | — | **96.7%** | — |

- **GSM-Hard es el headline:** con números grandes (ej: 1,234,567), CoT se derrumba a 20.6% porque no sabe hacer cuentas largas en texto; PAL mantiene 61.2% porque el intérprete sí sabe.
- **Con `text-davinci-003` (no code):** PAL también mejora pero menos (GSM8K 65% → 68%) — PAL brilla más con modelos entrenados en código.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto PAL | Dónde lo aplicás en el repo |
|---|---|
| **`ptyx :4849` como intérprete PAL** | Tu WS PTY (`:4849`) es el `python_exec` de PAL. Cuando el agente deba calcular, contar archivos, parsear JSON o transformar datos, obligalo a generar código y ejecutarlo en `ptyx` en lugar de responder en texto. El harness ya tiene el canal — solo falta el prompt que lo fuerce. |
| **System prompt PAL** | En `web/src/shared/api/prompts.ts`, agregá regla: `"Si necesitás calcular, contar o transformar datos, ESCRIBÍ código Python/JS y ejecútalo vía shell.ptyx.exec. Nunca calcules en texto."` — con 2 ejemplos few-shot NL+code en el prompt. |
| **Contar y medir en `fsx`** | Tareas tipo "¿cuántos TODOs hay en `web/src`?" — CoT alucina el número; PAL hace `grep -r TODO --count` o `python: len(glob(...))` en `ptyx` y devuelve el real. Mapeá `shell.fs.*` + `shell.ptyx.exec` como tools PAL. |
| **Validación con `cargo check` / `tsc -b`** | PAL no es solo aritmética. Para verificar un refactor, el agente genera `cargo check 2>&1 | head -20` en `ptyx` y usa el output como Observation. Es PAL aplicado a verificación — el intérprete es el compilador. |
| **IndexedDB y SSE sin cambios** | PAL no cambia tu `IndexedDB v2` ni tu `shared/sse/handler.ts` — solo cambia *qué* genera el modelo antes de cada `tool_call`. Tipá `PALTurn = { thought: string, code: string, observation: string }` si querés loguearlo. |
| **Combinar con ReAct y Reflexion** | PAL es el `Action` de ReAct cuando la acción es cómputo. Si el código falla (syntax error, ENOENT), Reflexion genera reflexión y reintenta. Pipeline: `Thought(NL) → Code → Exec(ptyx) → Observe → (si fail) Reflect → Retry`. |
| **`external_router` como PAL extendido** | `external_router.rs` expone `probe()` TCP 250ms + `ureq 700/1800ms` — PAL puede orquestarlos vía código: `python: [probe("opendesign", 3000), probe("screenshots", 3002)]` en `ptyx` y decidir qué plugin usar según qué esté UP. Es PAL donde el "intérprete" incluye tus 5 plugins externos, no solo Python. |

```ts
// web/src/shared/api/prompts.ts — prompt PAL few-shot
const PAL_SYSTEM = `
Sos un agente que USA CÓDIGO para calcular. Nunca calcules en texto.

Ejemplo 1:
  Thought: Necesito contar cuántos archivos .ts hay en web/src
  Code: \`\`\`python
  import glob
  files = glob.glob("web/src/**/*.ts", recursive=True)
  print(f"Archivos: {len(files)}")
  print(files[:5])
  \`\`\`
  Observation: (ejecutado en ptyx :4849)

Ejemplo 2:
  Thought: Verifico si el refactor compila
  Code: \`\`\`bash
  cargo check 2>&1 | head -20
  \`\`\`

Regla: si podés calcularlo con código, hacelo. No adivines números.
`.trim();
```

```python
# Ejemplo PAL real en tu repo — contar TODOs
# Thought: Necesito contar TODOs en web/src para priorizar
import pathlib, re
todos = []
for p in pathlib.Path("web/src").rglob("*.ts"):
    for i, line in enumerate(p.read_text().splitlines(), 1):
        if "TODO" in line:
            todos.append(f"{p}:{i}: {line.strip()}")
print(f"Total TODOs: {len(todos)}")
for t in todos[:10]:
    print(t)
# Exec en ptyx :4849 → "Total TODOs: 23" (real, no alucinado)
```

## 5 Anti-patterns / Limitaciones

- **No uses PAL para tareas no computacionales.** Para "resumí este doc" o "¿qué hace este componente?", generar código es overhead. PAL es para cálculo, conteo, transformación y verificación — no para redacción.
- **Código no ejecutado = CoT con sintaxis.** Si el modelo genera ```python pero el harness no lo ejecuta (solo lo muestra), no ganás nada. Asegurate que todo bloque ```python / ```bash se envíe a `ptyx :4849` y la Observation vuelva al modelo.
- **Modelo no-code rinde menos con PAL.** Con `text-davinci-003` la ganancia es menor que con `code-davinci-002`. Si tu modelo remoto no es code-tuned, PAL ayuda pero no tanto. Para Phi-3 local (no code), considerá prompts más simples.
- **Seguridad del intérprete.** Ejecutar código arbitrario del LLM en `ptyx` es riesgo. Tu `ptyx :4849` ya está sandboxeado en `desktop-app`, pero validá que no genere `rm -rf` o `curl | bash`. Poné allowlist de comandos o confirmación para `write`/`delete`.
- **Overhead de few-shot con código.** Los ejemplos PAL son más largos que CoT (NL + código). Para contexto limitado, 2 ejemplos PAL consumen ~800 tokens vs ~400 CoT. Compensá con selección de ejemplos relevantes, no genéricos.

## 6 Ejercicios prácticos (en tu repo)

1. **Forzá PAL en el system prompt y medí en GSM-Hard.** Agregá 2 ejemplos PAL few-shot a tu system prompt (uno de conteo, uno de aritmética con números grandes) y testeá en 10 problemas: 5 con números chicos (CoT debería empatar) y 5 con números grandes (PAL debería ganar). Ejecutá el código en `ptyx :4849` y compará `accuracy` PAL vs CoT puro. ¿Se replica el +40pp en GSM-Hard?

2. **PAL para `fsx` — contar TODOs y medir.** Pedí al agente "¿Cuántos TODOs hay en `web/src` y en qué archivos?" con prompt PAL (obligando a usar `glob` + `grep` en `ptyx`) vs prompt CoT (dejando que estime). Verificá contra `grep -r TODO --count` real. ¿PAL clava el número y CoT alucina? Logueá la diferencia en 5 queries de conteo.

3. **PAL + Reflexion — loop de corrección.** Hacé que el agente genere código con un bug intencional (ej: `import pathlib` mal escrito) y ejecutalo en `ptyx`. Implementá el loop: si `ptyx` devuelve error, generá reflexión (`"El import falló por..."`) y reintentá con código corregido (max 3 trials). ¿Cuántos errores de código se auto-corrigen sin intervención? Guardá las reflexiones en IndexedDB v2.

## 7 Referencias

- **Paper:** Gao et al., *PAL: Program-Aided Language Models Can Solve Reasoning Tasks*, 2022-11-18 — https://arxiv.org/abs/2211.10435
- **Base CoT:** Wei et al., *Chain-of-Thought* (2201.11903) — PAL extiende CoT con ejecución.
- **ReAct:** Yao et al. (2210.03629) — PAL es ReAct con tool = intérprete.
- **GSM-Hard:** Gao et al., dataset de números grandes para evaluar PAL — incluido en el paper.
- **Relacionado:** ReWOO (2305.18323) — también desacopla razonamiento de ejecución, pero sin código.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (diagrama PAL vs CoT) del paper original
- [ ] Entiendo por qué PAL gana especialmente en GSM-Hard y tareas simbólicas
- [ ] Sé cuándo forzar PAL (cálculo/conteo/verificación) vs CoT (redacción/razonamiento)
- [ ] Tengo claro cómo mapear PAL a `ptyx :4849` como intérprete y qué prompt few-shot usar
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 01 Reasoning · opencode-remote-android*
