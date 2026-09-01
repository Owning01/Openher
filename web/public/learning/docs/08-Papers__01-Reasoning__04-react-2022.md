# ReAct — Razonar y Actuar intercalados (Yao et al., 2022)

> **Autores:** Yao et al. / Princeton + Google
> **Año:** 2022 · **Prioridad:** Imprescindible · **Lectura:** ~22 min
> **Link verificado:** [https://arxiv.org/abs/2210.03629](https://arxiv.org/abs/2210.03629)
> **Categoría Papers:** 01 Reasoning · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** ReAct: Synergizing Reasoning and Acting in Language Models (Yao et al., ICLR 2023).
> **Link:** https://arxiv.org/abs/2210.03629 — GitHub ejemplos HotpotQA/FEVER.
> **Prioridad:** Imprescindible — *el DSL de tu harness.*

## 1. Resumen
ReAct intercala **Thought → Action → Observation** en loop. vs solo razonar (CoT) o solo actuar (Act): ReAct domina HotpotQA y FEVER. En AlfWorld (simulación doméstica) ReAct 34% vs Act 26% success — la razón: el pensamiento guía qué tool usar y la observación corrige el pensamiento.

## 2. Formato exacto
```
Thought: necesito chequear si el archivo existe...
Action: shell.fs.ls({"path": "/"})
Observation: ["web/", "desktop-app/"]
Thought: ahora leo el manifest...
Action: shell.fs.read({"path": "web/public/learning/manifest.json"})
```
Sin Thought explícito, el modelo alucina tool calls.

## 3. Evidencia
- HotpotQA EM 27.4 → 30.1 (ReAct+CoT).
- FEVER accuracy 60.9 → 65.8.
- Human study: ReAct más interpretable y depurable.

## 4. Mapeo a opencode-remote-android
- **Tu SSE ya es ReAct sin saberlo:** \(message.part.delta\) con \(type=reasoning\), \(tool_call\), \(tool_result\). Tipa \(type ReActPart = Thought|Action|Observation\) en \(shared/sse/handler.ts\).
- **Composer:** fuerza template Thought antes de cada \(shell.fs.*\).
- **UI:** muestra Thought colapsable (como tu ThinkingBlock) y Action con status (probe 250ms).
- **MCP:** cada tool debe devolver Observation estructurada (no texto libre) para que el próximo Thought sea útil.

## 5. Anti-pattern
- No uses ReAct para tareas triviales (\(/help\)) — overhead. Usa workflow determinista (Anthropic: Building Effective Agents).

## 6. Ejercicio
- Refactor \(useSSEHandler\) para loguear tripleta ReAct por turno y exponerla en devtools. Mide cuántos turnos ahorras vs Act-only en 5 fixes de \(SWE-bench Lite\).

## 7. Links
- https://arxiv.org/abs/2210.03629 · https://github.com/ysymyth/ReAct

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
