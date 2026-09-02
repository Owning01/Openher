# Toolformer — El modelo se enseña solo a usar herramientas (Schick et al., 2023)

> **Paper:** Toolformer: Language Models Can Teach Themselves to Use Tools — Schick et al., Meta AI (NeurIPS 2023)
> **Versión:** v2 · **Año:** 2023 · **Autores:** Timo Schick, Jane Dwivedi-Yu, Roberto Dessì et al. / Meta AI
> **Link:** [https://arxiv.org/abs/2302.04761](https://arxiv.org/abs/2302.04761) · **Prioridad:** Imprescindible (fundacional harness)
> **Categoría:** 02 Harness · **Nivel:** Avanzado · **Lectura:** ~20 min

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

## 1. Introducción

Toolformer responde una pregunta incómoda del 2023: ¿hace falta anotar a mano cuándo un LLM debe llamar una API, o puede aprenderlo solo? La respuesta es que sí puede, sin un solo ejemplo etiquetado por humanos.

La idea central es brutamente simple y por eso funciona: el modelo genera candidatos de llamadas a herramientas en texto no anotado, las ejecuta, y se queda solo con las que **bajan la perplejidad** del token siguiente. Si `calculator(24*18)` hace que el modelo prediga mejor la continuación, se conserva; si no aporta, se descarta. Con ese dataset auto-filtrado hace fine-tuning y el resultado es un GPT-J 6.7B que decide solo cuándo invocar 5 herramientas — QA, calculadora, búsqueda en Wikipedia, traductor y calendario — y supera a GPT-3 175B en tareas que requieren cálculo o búsqueda factual.

Para opencode-remote-android esto es fundacional: valida que un harness no necesita una cadena de `if path == "/shell/fs/read"` hardcodeada. El modelo puede aprender a elegir la tool correcta si le das un schema claro y un criterio de utilidad medible.

## 2. Ideas clave

| Idea | Qué significa | Por qué importa |
|---|---|---|
| **Self-supervised augmentation** | Inserta candidatos `<API>tool(args) → result</API>` en texto y filtra por ganancia de perplejidad | Cero anotación humana; escala a cualquier corpus |
| **API call como token** | La llamada es parte del vocabulario: `<API>calculator(2*3)</API>` se muestrea como texto | No requiere arquitectura especial, solo fine-tuning |
| **Filtro por perplexity delta** | Conserva el ejemplo solo si `PPL(con_tool) < PPL(sin_tool) - τ` | Elimina llamadas inútiles o alucinadas |
| **Decisión + ejecución + continuación** | El modelo genera la llamada, espera el resultado y sigue generando | Patrón ReAct antes de ReAct, pero aprendido |

```python
# Pseudocódigo del pipeline de Toolformer
for doc in corpus:
    for pos in candidate_positions(doc):
        call = lm.sample_api_call(doc[:pos])          # ej: "calculator(325/5)"
        result = execute(call)                         # ej: "65"
        if perplexity(doc[pos:] | call, result) < perplexity(doc[pos:]) - tau:
            dataset.append(doc[:pos] + f"<API>{call}</API> → {result}" + doc[pos:])
finetune(lm, dataset)
```

**Flujo de decisión aprendido:**

```
prompt → ¿me sirve una tool? → NO → genero token normal
                          → SÍ → genero <API>tool(args)</API> → inyecto resultado → continúo
```

## 3. Evidencia y experimentos

| Benchmark | Toolformer 6.7B | OPT 66B | GPT-3 175B | Comentario |
|---|---|---|---|---|
| LAMA (factual) | **superior** | inferior | inferior | Wikipedia search aporta conocimiento |
| QA con calculadora | **supera** | — | — | Cálculo exacto vs estimación |
| Traducción (MLQA) | competitivo | — | superior s/ finetune | Traductor externo ayuda |
| Ablation sin filtro PPL | cae fuerte | — | — | Sin filtro aprende ruido |

- **Ablation clave:** entrenar con todos los candidatos sin filtrar por perplejidad degrada el rendimiento por debajo del baseline sin tools. El filtro es el diferencial, no el volumen de datos.
- **Costo:** un solo fine-tuning sobre GPT-J 6.7B; no requiere RL ni anotadores. Reentrenar al agregar una tool nueva sí tiene costo — limitación que motiva MCP y tool docs in-context (ver `05-mcp-2024.md`).

## 4. Cómo aplica a opencode-remote-android

Tu arquitectura actual es el anti-Toolformer: `desktop-app/src/infrastructure/http/external_router.rs:19` usa `split_cmd()` + `if` por plugin y `probe()` TCP `connect_timeout 250ms` + `ureq 1800/700ms` + `cached_probe 1500ms`. Toolformer te dice: tipá las tools y dejá que el modelo elija.

| Concepto Toolformer | Mapeo concreto en tu repo |
|---|---|
| **Schema estricto de tool** | Definí `shared/api/tools.ts` con JSON Schema para `shell.fs.read`, `shell.fs.list`, `shell.pty.exec`, `shell.git.*`. El modelo elige por schema, no por `if path`. |
| **Perplexity filter → quality filter** | Para fine-tune local (Phi-3 / Qwen 7B) que use `shell.fs.*`, generá candidatos y filtrá por: ¿el resultado de la tool hizo que el siguiente `cargo check` pase? Es tu señal de utilidad. |
| **5 tools → 25 tools** | Hoy tenés ~25 tools (5 plugins × ~5 ops). No las mandes todas en el system prompt; combiná con retriever estilo Gorilla/ToolLLM (ver `02` y `03`). |
| **tiny_http :4848 / hyper :4850 / WS ptyx :4849** | Exponé cada puerto como tool tipada: `pty.exec(cmd, cwd)` → `stdout+exitCode`, `fs.read(path)` → `mmap+base href` ya resuelto. El modelo no debe saber de puertos, solo de tools. |
| **mmap + `<base href>`** | Análogo a "inyectar resultado de tool y continuar": el resultado de `fs.read` ya viene con base href inyectado para `/assets/*`; el modelo consume el contenido sin preocuparse del transporte. |

```typescript
// shared/api/tools.ts — schema que Toolformer necesita para elegir bien
export const shellFsRead = {
  name: "shell.fs.read",
  description: "Lee un archivo del workspace. Usar para inspeccionar código antes de editar.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Ruta relativa al workspace, ej: web/src/App.tsx" },
      maxLines: { type: "number", description: "Máximo de líneas (default 200, pagina con offset)" }
    },
    required: ["path"]
  }
} as const;
```

> **Regla de oro:** si tenés que agregar un `if` nuevo cada vez que sumás un plugin externo, tu harness está acoplado. Toolformer + MCP desacoplan: el modelo ve schemas, el router solo valida y ejecuta.

## 5. Anti-patterns y limitaciones

| Anti-pattern | Por qué duele | Qué hacer en cambio |
|---|---|---|
| **Tool hardcodeada en prompt** ("siempre usá calculator para math") | El modelo no aprende a decidir; falla fuera del caso feliz | Dejá que el filtro de utilidad decida; documentá la tool y medí |
| **Agregar tools sin re-filtrar dataset** | Llamadas ruidosas contaminan el fine-tuning | Re-ejecutá el pipeline de filtrado por PPL al agregar tool |
| **Mandar 25 tools en cada turno** | Explota contexto, sube costo, confunde al modelo | Retriever top-k (BM25/dense) + MCP discovery dinámico |
| **Fine-tuning por cada plugin nuevo** | Costoso y lento en tu desktop-app Rust | Preferí tool docs in-context (MCP `tools/list`) para plugins volátiles |

**Limitaciones del paper:**

- Solo 5 tools simples y atómicas; no evalúa composición multi-step profunda ni backtracking (ver ToolLLM `03-toollm-2023.md`).
- Fine-tuning completo cada vez que cambia el set de tools — inviable si tus 5 plugins externos cambian seguido.
- No mide seguridad: una tool con descripción maliciosa envenena el dataset (ver `07-Seguridad/01-mcptox-2025.md`).

## 6. Ejercicios prácticos

### Ejercicio 1 — Schema vs no-schema (30 min)
1. Definí `shell.fs.read` y `shell.fs.list` con JSON Schema estricto en `shared/api`.
2. Armá 20 prompts tipo "mostrá el contenido de X" / "listá archivos de Y".
3. Medí accuracy de selección con schema en system prompt vs sin schema. Reportá delta y tokens extra.

### Ejercicio 2 — Filtro de utilidad a lo Toolformer (60 min)
1. Generá 50 candidatos de llamadas `shell.fs.read` sobre tu repo usando un SLM local.
2. Ejecutalas y conservá solo las que hacen que el siguiente paso (ej: `cargo check` o respuesta del agente) mejore. Es tu `τ` casero.
3. Fine-tuneá o few-shot con el subset filtrado y compará vs usar todos los candidatos.

### Ejercicio 3 — Costo de contexto (20 min)
1. Medí tokens de system prompt con 25 tools inline vs retriever top-5.
2. Graficá ahorro vs accuracy en 20 tareas reales de tu app. Decidí el `k` óptimo.

## 7. Referencias y checklist

- **Paper:** [Toolformer — arXiv:2302.04761](https://arxiv.org/abs/2302.04761)
- **Código:** [lucidrains/toolformer-pytorch](https://github.com/lucidrains/toolformer-pytorch) (reimplementación comunitaria)
- **Relacionados en este repo:** `02-gorilla-bfcl-2023.md` (evaluación AST), `03-toollm-2023.md` (multi-step DFS), `05-mcp-2024.md` (discovery dinámico sin fine-tune)

### Checklist de lectura

- [ ] Leí abstract + §3 (método de filtrado por perplexity) del paper original
- [ ] Entiendo por qué el filtro por PPL es el diferencial, no el volumen de datos
- [ ] Tipé al menos 2 tools de `shell.*` con JSON Schema en `shared/api`
- [ ] Medí accuracy con y sin schema en 10+ intents
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android · 02 Harness*
