# TaskWeaver — Agente code-first para tareas de datos (Qiao et al., Microsoft 2023)

> **Paper:** TaskWeaver: A Code-First Agent Framework — Qiao et al., Microsoft Research (2023)
> **Versión:** v2 · **Año:** 2023 · **Autores:** Bo Qiao, Liqun Li, Xu Zhang, Shilin He, Yu Kang, Chaoyun Zhang et al. / Microsoft
> **Link:** [https://arxiv.org/abs/2311.17541](https://arxiv.org/abs/2311.17541) · [github.com/microsoft/TaskWeaver](https://github.com/microsoft/TaskWeaver)
> **Prioridad:** MEDIA P1 · **Nivel:** Intermedio · **Lectura:** ~14 min

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa.

---

## 1. Introducción

TaskWeaver propone una tesis distinta a ReAct o HuggingGPT: **en vez de que el agente llame tools vía JSON (`tool_call`), que genere código Python, lo ejecute en sandbox y itere con el traceback si falla**. Los plugins no son endpoints JSON — son funciones Python documentadas que el agente importa y llama como código normal. El resultado supera a ReAct en tareas de datos (análisis tabular, visualización, ETL) por 10%+ porque el código es más expresivo que un `tool_call` atómico.

¿Por qué código en vez de JSON? Un `tool_call` hace una cosa por turno; código puede hacer `read → filter → transform → write` en un solo bloque, con variables intermedias, loops y manejo de errores. Y cuando falla, el traceback de Python es el feedback más rico posible — el agente ve exactamente qué línea explotó y corrige.

Para opencode-remote-android esto es una alternativa concreta a tu `ptyx WS :4849` con shell crudo: en vez de que el agente mande `tool_call: { name: "fs.read", args: { path: "..." } }` y espere un turno por cada operación, podría generar `code: "df = fs.read('data.csv'); df.filter(...).to_preview()"` y ejecutarlo en un sandbox con tus `fsx`/`ptyx` como librería Python/JS.

## 2. Ideas clave

| Idea | Qué significa | Ventaja sobre ReAct JSON |
|---|---|---|
| **Code-first, no tool_call** | El agente genera código que *usa* plugins como funciones, no JSON | Un bloque de código hace N operaciones en 1 turno vs N turnos |
| **Plugins como funciones documentadas** | Cada plugin es `def fs_read(path: str) -> str:` con docstring | El LLM ve la firma + docstring como si fuera una librería |
| **Ejecución en sandbox + traceback** | Corre el código, si falla retorna `stderr` con línea exacta | Feedback más rico que `{"error": "failed"}` |
| **Planner + Executor + Verifier** | Planner genera plan, Code Generator escribe código, Executor corre, Verifier valida | Separación de responsabilidades; cada rol optimizable |
| **Estado persistente entre turnos** | Variables del código previo siguen vivas (como Jupyter) | No re-lee archivos ya cargados; ahorra tokens y latencia |

```
ReAct JSON (N turnos):     tool_call fs.read → obs → tool_call fs.write → obs → tool_call pty.exec → obs
TaskWeaver code (1 turno): code: "content = fs_read('a.csv')\nresult = transform(content)\nfs_write('b.csv', result)\npty_exec('cargo check')"
                           → exec → ok | traceback línea 2 → agente corrige solo esa línea
```

```python
# Plugin TaskWeaver — tu fsx.rs como función Python documentada
def fs_read(path: str, max_lines: int = 200) -> str:
    """
    Lee un archivo del workspace con paginación.
    Args:
        path: Ruta relativa al workspace (ej: "web/src/App.tsx")
        max_lines: Máximo de líneas (default 200)
    Returns:
        Contenido con líneas numeradas + hasMore flag
    """
    return mmap_read(path, max_lines)  # tu hyper :4850 mmap por debajo

# El agente genera:
code = """
content = fs_read("desktop-app/src/api.rs")
# Busca el router hardcodeado
matches = [l for l in content.split("\n") if "external_router" in l]
print(matches)
"""
result = sandbox.exec(code)  # → output o traceback
```

## 3. Evidencia y experimentos

| Benchmark | TaskWeaver (code-first) | ReAct (tool_call) | Delta |
|---|---|---|---|
| **Data tasks (tabular, ETL)** | **supera por 10%+** | baseline | Código compone mejor que calls atómicos |
| **Tareas multi-step con datos** | mejor | — | Variables persistentes evitan re-lecturas |
| **Corrección con traceback** | itera y corrige en 1-2 turnos | requiere N turnos con error genérico | Traceback es feedback superior |

- **Por qué código gana en datos:** filtrar un CSV, agregar una columna y plotear requiere 3-4 tool calls en ReAct pero es un solo bloque Python en TaskWeaver. Menos turnos = menos latencia y menos tokens.
- **Plugins documentados:** la calidad del docstring determina si el agente usa bien la función — mismo hallazgo que HuggingGPT con descripciones.
- **Sandbox:** sin sandbox, `code` puede hacer `os.remove("/")`. TaskWeaver exige contenedor aislado con filesystem virtualizado.

## 4. Cómo aplica a opencode-remote-android

| Concepto TaskWeaver | Mapeo concreto en tu repo |
|---|---|
| **Code-first vs tool_call JSON** | En vez de `tool_call: fs.read` por turno, el agente genera `fs_read("web/src/App.tsx")` como código JS/TS y lo ejecuta en tu `ptyx WS :4849` sandboxeado. Un bloque puede hacer `view→edit→lint` en 1 turno. |
| **Plugins como funciones** | Exponé `fsx.rs` (`read`, `list`, `write`), `scm_router.rs` (`git.status/diff`), `ptyx` (`exec`) como funciones documentadas con firma + docstring, no como endpoints REST dispares (`tiny_http :4848` + `hyper :4850` + `WS :4849`). |
| **Sandbox + traceback** | Tu `ptyx :4849` ya ejecuta comandos; envolvelo con `timeout 10s` + `maxOutput 2000` + captura de `stderr` con línea exacta. Si `cargo check` falla, el traceback dice `api.rs:42: expected ;` — el agente corrige esa línea. |
| **`hyper :4850 mmap+br` + `mmap+<base href>`** | `preview("/shell/preview/{token}/file.html")` como función que retorna HTML con `<base href>` ya inyectado. El agente puede hacer `html = preview("report.html"); assert "<base href" in html` en código. |
| **`external_router.rs:19 split_cmd`** | Cada plugin externo como función: `screenshots_capture(fullPage=True)`, `opendesign_render(path)`. El agente las llama como código, no como HTTP. `split_cmd` + `CREATE_NO_WINDOW` quedan encapsulados. |
| **Estado persistente** | Mantener `cwd` y variables entre ejecuciones de código (como Jupyter) — si el agente hizo `content = fs_read("a.ts")`, no necesita re-leerlo en el siguiente bloque. Ahorra `probe 250ms` y tokens. |

```typescript
// web/src/shared/api/taskweaverPlugins.ts — tus infra como funciones documentadas
export const codePlugins = `
/** Lee archivo paginado con mmap. Retorna líneas numeradas. */
function fs_read(path: string, maxLines?: number): string;
/** Lista directorio. Retorna [{ name, isDir }]. */
function fs_list(path: string): FileEntry[];
/** Ejecuta comando con timeout. Retorna { stdout, stderr, exitCode }. */
function pty_exec(cmd: string, opts?: { cwd?: string, timeout?: number }): ExecResult;
/** Muestra preview con mmap+base href. Retorna HTML. */
function preview(file: string): string;
`;
// Este string va al system prompt — el agente genera código que usa estas funciones
```

> **Regla de oro:** si tu agente necesita 4 turnos para `read→filter→write→check`, tu harness es chatty. TaskWeaver muestra que 1 bloque de código con 4 llamadas + traceback supera 4 tool_calls separados en latencia, tokens y corrección.

## 5. Anti-patterns y limitaciones

| Anti-pattern | Por qué duele | Qué hacer en cambio |
|---|---|---|
| **Un tool_call por turno para todo** | 4 ops = 4 turnos = 4× latencia + tokens | Code-first: 1 bloque con N llamadas + 1 exec |
| **Plugins sin docstring/firma clara** | El agente alucina args o no sabe cuándo usar cada plugin | Función tipada con docstring + ejemplo en system prompt |
| **Exec sin sandbox ni timeout** | `code` puede borrar archivos o colgar el harness | Sandbox + `timeout 10s` + `maxOutput` + allowlist de imports |
| **Error genérico sin traceback** | `{"error": "failed"}` no dice qué línea falló | Retorná `stderr` con file:line + hint, como SWE-agent |
| **Sin estado persistente** | Re-lee el mismo archivo cada turno | Mantener variables/cwd entre execs (Jupyter-like) |

**Limitaciones del paper:**

- **Dominio de datos:** TaskWeaver se evalúa en tareas tabulares/ETL; no en SWE-bench general. Para tu repo Rust/TS, el beneficio de código vs JSON depende de si tus tareas son componibles (sí: `view→edit→lint` lo es).
- **Seguridad del sandbox:** ejecutar código arbitrario del LLM exige aislamiento real (contenedor, filesystem virtualizado). Tu `ptyx :4849` hoy no está sandboxeado — es shell real.
- **No cubre discovery dinámico:** los plugins se declaran estáticos en el prompt; para N plugins dinámicos necesitás MCP (`05-mcp-2024.md`).
- **Overhead de código:** para tareas atómicas ("leé un archivo"), generar código es overkill vs un simple `tool_call`. Usá code-first para multi-step, JSON para single.

## 6. Ejercicios prácticos

### Ejercicio 1 — Comparar code-first vs tool_call (45 min)
1. Tomá una tarea multi-step: "leé `desktop-app/src/api.rs`, encontrá `external_router`, editalo para agregar un log, verificá con `cargo check`".
2. Implementá dos modos: (A) 4× `tool_call` JSON secuenciales, (B) 1 bloque `code` con 4 llamadas + 1 exec.
3. Medí turnos, tokens, latencia y tasa de corrección ante error de lint. Reportá delta.

### Ejercicio 2 — Plugins como funciones documentadas (30 min)
1. Documentá 5 funciones de tu infra (`fs_read`, `fs_list`, `pty_exec`, `preview`, `git_status`) con firma + docstring + ejemplo.
2. Inyectalas como system prompt "librería disponible" y pedí al LLM que genere código que las use.
3. Medí cuántos args alucina vs con descripciones pobres (ver HuggingGPT `07-hugginggpt-2023.md`).

### Ejercicio 3 — Sandbox con traceback (30 min)
1. Envolvé `ptyx WS :4849` con `timeout 10s` + captura de `stderr` con línea exacta + `maxOutput 2000`.
2. Generá código con un error intencional (`fs_read("no_existe.ts")`) y verificá que el traceback permita al agente corregir en el siguiente turno sin re-leer todo.

## 7. Referencias y checklist

- **Paper:** [TaskWeaver — arXiv:2311.17541](https://arxiv.org/abs/2311.17541) · [GitHub microsoft/TaskWeaver](https://github.com/microsoft/TaskWeaver)
- **Relacionados:** `07-hugginggpt-2023.md` (LLM como controlador), `04-swe-agent-aci-2024.md` (ACI con feedback), `05-mcp-2024.md` (discovery dinámico)

### Checklist de lectura

- [ ] Leí abstract + §3 (arquitectura Planner/CodeGen/Executor) del paper original
- [ ] Entiendo por qué código supera tool_call JSON en tareas multi-step componibles
- [ ] Documenté al menos 3 funciones de mi infra como plugins code-first
- [ ] Comparé code-first vs tool_call en una tarea multi-step real
- [ ] Verifiqué que `ptyx :4849` retorna traceback útil ante error
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android · 02 Harness*
