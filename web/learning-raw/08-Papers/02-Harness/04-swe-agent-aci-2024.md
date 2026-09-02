# SWE-agent — El ACI importa más que el modelo (Yang et al., 2024)

> **Paper:** SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering — Yang et al., Princeton / NeurIPS 2024
> **Versión:** v1 · **Año:** 2024 · **Autores:** John Yang, Carlos E. Jimenez, Alexander Wettig, Shunyu Yao et al. / Princeton
> **Link:** [https://arxiv.org/abs/2405.15793](https://arxiv.org/abs/2405.15793) · [github.com/SWE-agent/SWE-agent](https://github.com/SWE-agent/SWE-agent)
> **Prioridad:** Imprescindible — *directo a tu desktop-app* · **Nivel:** Avanzado · **Lectura:** ~22 min

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa.

---

## 1. Introducción

La tesis de SWE-agent es provocadora y está respaldada por números: el cuello de botella para que un agente resuelva issues reales no es el LLM, es el **ACI (Agent-Computer Interface)** — cómo el agente ve archivos, edita código, busca en el repo y recibe feedback. Con el mismo Claude 2, pasar de un ACI "bash crudo" a un ACI bien diseñado lleva el pass rate en SWE-bench Lite de **1.96% a 18%**. Con GPT-4 llega a 23%, SOTA 2024 sin cambiar el modelo.

¿Qué es un buen ACI? No es "darle una terminal y que se arregle". Es un set acotado de herramientas con **viewer paginado, edición con lint inmediato, búsqueda con ripgrep y observaciones estructuradas**. Cada acción devuelve éxito/error + sugerencia, no un dump de 10k líneas. El paper hace ablations que cuantifican cuánto aporta cada pieza — y es mucho.

Para opencode-remote-android esto pega de lleno: hoy tu `ptyx.rs WS :4849` es shell crudo, tu `fsx.rs` es `read/list` básico. SWE-agent te muestra cómo rediseñar ese ACI para que el agente no se pierda, no haga `rm -rf` y no se ahogue en output.

## 2. Ideas clave

| Componente ACI | Qué hace | Por qué multiplica el rendimiento |
|---|---|---|
| **Viewer con líneas numeradas** | `view file L1-100` con números, paginado 100 líneas | El agente referencia líneas exactas; no parsea `cat` gigante |
| **Edit con lint inmediato** | Aplica patch y devuelve error de `cargo check` / linter al instante | Feedback cerrado: el agente corrige en el siguiente turno, no 5 turnos después |
| **Search acotado** | `search "pattern"` vía ripgrep, con ranking | Evita `grep -r` artesanal que inunda el contexto |
| **Bash limitado** | 6-8 tools, no shell infinito | Menos superficie de error, más predecible para el modelo |
| **Observación estructurada** | Cada tool retorna `{ status, output, hint }` | El agente sabe si falló y qué probar después |

```
ACI malo (bash crudo):  agente → "cat app.tsx" → 3.600 líneas → contexto explotado → alucina
ACI bueno (SWE-agent):  agente → view App.tsx L1-100 → 100 líneas numeradas → edit L42 → lint ok → run
```

```python
# Pseudocódigo del loop SWE-agent
state = {"view": viewer, "edit": editor_with_lint, "search": ripgrep, "bash": limited_bash}
while not done:
    action = llm.choose_action(state.observation)  # solo 6-8 opciones tipadas
    result = execute(action)                        # retorna {status, output, hint}
    if result.status == "lint_error":
        state.observation = f"Lint failed at {result.line}: {result.hint}"
    else:
        state.observation = result.output[:MAX_LINES]  # truncado + paginado
```

**Principio de diseño:** cada tool debe ser **acotada, tipada y con feedback inmediato**. Si tu tool puede devolver 10k líneas sin paginar, está mal diseñada.

## 3. Evidencia y experimentos

| Configuración (mismo Claude 2) | SWE-bench Lite | Delta | Qué se quitó |
|---|---|---|---|
| **SWE-agent full ACI** | **18.0%** | — | — |
| Bash baseline (shell crudo) | 6.8% | -11.2 | Todo el ACI |
| Sin viewer numerado | ~10% | **-8** | Viewer paginado |
| Sin edit con lint | ~13% | **-5** | Validación inmediata |
| Con GPT-4 + full ACI | **23%** | +5 | Mejor modelo, mismo ACI |

- **SWE-bench Lite:** 300 issues reales de GitHub con tests. No es toy benchmark — es código de producción.
- **Generalización:** el mismo ACI mejora tanto Claude 2 como GPT-4. El efecto es del ACI, no del modelo.
- **Costo:** el ACI bueno *reduce* tokens porque pagina y limita output; el bash crudo *aumenta* tokens con dumps gigantes.

## 4. Cómo aplica a opencode-remote-android

Tu `desktop-app` Rust es el ACI de tu agente. Hoy está a mitad de camino: tenés `fsx.rs`, `ptyx.rs`, `scm_router.rs`, pero sin paginación, sin lint y con shell crudo en `:4849`. SWE-agent te da el blueprint.

| Concepto SWE-agent | Mapeo concreto en tu repo |
|---|---|
| **Viewer paginado** | Reemplazá `fs.read` que devuelve todo el archivo por `view(path, startLine, limit=100)` que retorna líneas numeradas + `hasMore`. Tu `mmap` en `hyper :4850` ya pagina; exponelo como tool. |
| **Edit con lint** | `edit(path, patch)` debe correr `cargo check` / `tsc -b` antes de confirmar y retornar `{ ok, lintErrors }`. Hoy tu `fsx::write` no valida — el agente cree que anduvo y falla 3 turnos después. |
| **Search con ripgrep** | Añadí `search(pattern, path?)` que use `ripgrep` (ya lo tenés en `fswatch::global`) y retorne top-20 matches con file:line, no todo el repo. |
| **Bash limitado** | Tu `ptyx WS :4849` hoy es shell infinito. Envolvelo: `pty.exec(cmd, timeout=10s, maxOutput=2000)` con truncado + hint "output truncado, usá view para inspeccionar". |
| **Observación estructurada** | Cada tool en `tiny_http :4848` debe retornar `{ status: "ok"|"error", output, hint }` consistente. Hoy cada router retorna formato distinto — unificá. |
| **external_router.rs:19 split_cmd** | No expongas `split_cmd` como tool; exponé `view/edit/search` que *usan* `split_cmd` internamente. El agente no debe construir comandos shell crudos. |
| **Probe 250ms + cached_probe 1500ms** | SWE-agent limita tools a 6-8; tu `probe TCP 250ms` + `cached_probe 1500ms` decide qué plugins external están vivos antes de exponerlos como tools del ACI. No ofrezcas `screenshots :3002` si el probe falla. |
| **mmap + `<base href>`** | `previewUrl /shell/preview/{token}/{file}` ya es ACI visual: el agente puede "ver" el resultado renderizado. Mantené `<base href="/shell/external/<name>/embed/">` inyectado para que `/assets/*` no dé 404. |

```typescript
// shared/api/aci.ts — ACI tipado estilo SWE-agent para tu app
export const aciTools = [
  {
    name: "view",
    description: "Muestra archivo paginado con líneas numeradas. Usar SIEMPRE antes de editar.",
    parameters: { type: "object", properties: {
      path: { type: "string" }, startLine: { type: "number", default: 1 }, limit: { type: "number", default: 100 }
    }, required: ["path"] }
  },
  {
    name: "edit",
    description: "Aplica patch y valida con cargo check / tsc. Retorna lint errors si falla.",
    parameters: { type: "object", properties: {
      path: { type: "string" }, patch: { type: "string", description: "Diff unificado o reemplazo por líneas" }
    }, required: ["path", "patch"] }
  },
  {
    name: "search",
    description: "Busca patrón con ripgrep. Retorna top-20 file:line.",
    parameters: { type: "object", properties: {
      pattern: { type: "string" }, path: { type: "string" }
    }, required: ["pattern"] }
  },
] as const;
```

```rust
// desktop-app/src/infrastructure/http/fsx.rs — idea de validación en edit
pub fn edit_with_lint(path: &str, patch: &str) -> Result<EditResult, String> {
    apply_patch(path, patch)?;
    let lint = std::process::Command::new("cargo").args(["check"]).output()?;
    if !lint.status.success() {
        rollback(path)?; // opcional: no dejar archivo roto
        return Ok(EditResult::LintError { details: String::from_utf8_lossy(&lint.stderr).to_string() });
    }
    Ok(EditResult::Ok)
}
```

> **Regla de oro:** si tu agente puede pedir `cat` de 3.600 líneas o ejecutar `rm -rf` sin guardrail, tu ACI está roto. SWE-agent demuestra que 6-8 tools bien diseñadas > shell infinito.

## 5. Anti-patterns y limitaciones

| Anti-pattern | Por qué duele | Qué hacer en cambio |
|---|---|---|
| **Terminal cruda sin límites** | Output 10k líneas, `rm -rf`, loops infinitos | `pty.exec` con `timeout`, `maxOutput`, truncado + hint |
| **`cat` sin paginación** | Explota contexto, el agente alucina líneas | `view` paginado 100 líneas con números |
| **Edit sin validación** | El agente cree que anduvo, falla 3 turnos después | `edit` que retorna lint inmediato |
| **20 tools sin priorizar** | El modelo se distrae, sube hallucination | 6-8 tools core + retriever para el resto |
| **Observaciones sin estructura** | El agente no distingue éxito de error | `{ status, output, hint }` consistente en todos los routers |

**Limitaciones del paper:**

- SWE-bench Lite son issues Python; generalización a Rust/TS requiere validar que `cargo check` como lint aporta similar a `flake8`.
- El ACI óptimo depende del repo — 100 líneas de ventana puede ser poco para archivos gigantes como tu `App.tsx` (~3.600 líneas, deuda técnica reconocida).
- No cubre multi-agente ni observabilidad (ver `08-Observabilidad/01-otel-readiness-2026.md`).

## 6. Ejercicios prácticos

### Ejercicio 1 — Viewer paginado (40 min)
1. Implementá `view(path, startLine, limit)` en `fsx.rs` que retorne líneas numeradas + `hasMore` + `totalLines`.
2. Reemplazá un flujo `fs.read` completo por `view` paginado en tu agente y medí tokens ahorrados + accuracy en 5 issues.

### Ejercicio 2 — Edit con lint (60 min)
1. Implementá `edit_with_lint` que aplique patch, corra `cargo check` o `tsc -b` y retorne `LintError` estructurado si falla.
2. Corré 5 issues de SWE-bench Lite (o 5 tasks locales) con ACI `view+edit+lint` vs `read+write` crudo. Medí pass rate.

### Ejercicio 3 — Limitar ptyx (20 min)
1. Envolvé `ptyx WS :4849` con `timeout 10s` + `maxOutput 2000 chars` + truncado con hint.
2. Verificá que un `cargo test` largo no cuelgue el harness y que el agente reciba "output truncado, usá view".

## 7. Referencias y checklist

- **Paper:** [SWE-agent — arXiv:2405.15793](https://arxiv.org/abs/2405.15793) · [GitHub SWE-agent](https://github.com/SWE-agent/SWE-agent) · [SWE-bench](https://www.swebench.com/)
- **Relacionados:** `01-toolformer-2023.md` (tool use), `06-dspy-2023.md` (compilar harness), `08-Observabilidad/01-otel-readiness-2026.md` (trazar ACI)

### Checklist de lectura

- [ ] Leí abstract + §3 (diseño ACI) + ablations del paper original
- [ ] Entiendo por qué viewer numerado (-8 pts sin él) y lint (-5) son los mayores aportes
- [ ] Implementé `view` paginado o `edit` con lint en `desktop-app`
- [ ] Medí pass rate con ACI mejorado vs bash crudo en al menos 3 tareas
- [ ] Anoté 1 mejora de ACI para `ptyx.rs` o `fsx.rs` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android · 02 Harness*
