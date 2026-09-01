# Toolformer — El modelo aprende a usar tools solo (Schick et al., 2023)

> **Autores:** Schick et al. / Meta
> **Año:** 2023 · **Prioridad:** Imprescindible · **Lectura:** ~20 min
> **Link verificado:** [https://arxiv.org/abs/2302.04761](https://arxiv.org/abs/2302.04761)
> **Categoría Papers:** 02 Harness · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Toolformer: Language Models Can Teach Themselves to Use Tools (Schick et al., NeurIPS 2023) — Meta AI.
> **Link:** https://arxiv.org/abs/2302.04761
> **Prioridad:** Imprescindible (fundacional harness)

## 1. Resumen
Toolformer entrena un LM 6.7B para **decidir cuándo y cómo llamar APIs** sin supervisión humana: genera candidatos con tools, filtra por ganancia de perplexity, y fine-tunea. Con 5 tools (QA, calculadora, wiki search, traductor, calendario) supera GPT-3 175B en tareas que requieren cálculo/búsqueda.

## 2. Ideas clave
- **Self-supervised tool augmentation:** inserta llamadas \"[QA(question)] → answer\" solo si \(perplexity(result) < perplexity(no tool)\).
- **API call como token:** \"<API>calculator(2*3)</API>\" es parte del vocabulario.
- **Sin anotación humana:** el modelo descubre solo que conviene llamar herramienta.

## 3. Evidencia
- En LAMA, QA, math datasets, Toolformer 6.7B supera OPT 66B y GPT-3 175B en tasks con tools.
- Ablation: training sin filtrado por perplexity degrada.

## 4. Mapeo a tu proyecto
- **Tu external_router hardcodeado** (\"if path == /shell/...\") es lo que Toolformer evita: el modelo debería elegir tool via schema, no via if.
- **Tipa tus tools con JSON Schema estricto** en \(shared/api\): Toolformer muestra que schema claro mejora selección.
- Para fine-tune local (Phi-3): usa misma técnica perplexity-filter para enseñarle \(shell.fs.*\) sin anotar.

## 5. Limitaciones
- Solo 5 tools simples; no prueba composición multi-step profunda (ver ToolLLM).
- Fine-tune cada vez que añades tool → costoso. Alternativa moderna: in-context tool docs (MCP).

## 6. Ejercicio
- Añade JSON Schema a \(shell.fs.read\) y mide si el modelo elige mejor entre \"read\" vs \"ls\" con docs de tool en system prompt vs sin docs.

## 7. Links
- https://arxiv.org/abs/2302.04761

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
