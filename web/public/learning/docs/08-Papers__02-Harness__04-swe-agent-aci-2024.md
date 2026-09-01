# SWE-agent: El ACI importa más que el modelo (Yang et al., 2024)

> **Autores:** Yang et al. / Princeton
> **Año:** 2024 · **Prioridad:** Imprescindible · **Lectura:** ~22 min
> **Link verificado:** [https://arxiv.org/abs/2405.15793](https://arxiv.org/abs/2405.15793)
> **Categoría Papers:** 02 Harness · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering (Yang et al., NeurIPS 2024).
> **Link:** https://arxiv.org/abs/2405.15793 — github.com/SWE-agent/SWE-agent
> **Prioridad:** Imprescindible — *directo a tu desktop-app*

## 1. Tesis
El cuello no es el LLM, es el **ACI** (cómo el agente ve/edita archivos, navega repo, recibe feedback). Con ACI bien diseñado (viewer con líneas, edit linted, búsqueda), Claude 2 pasa de 1.96% → 18% en SWE-bench sin cambiar modelo.

## 2. ACI diseñado
- **Viewer:** \"view file L1-100 con números\" — no \"cat\" gigante.
- **Edit:** aplica patch y devuelve lint error inmediato (no silent).
- **Search/Bash:** herramientas acotadas, no shell crudo infinito.
- **Feedback:** cada acción devuelve observación estructurada (éxito/error + sugerencia).

## 3. Resultados
- SWE-bench Lite: SWE-agent 18.0% vs bash baseline 6.8% (mismo Claude 2).
- Con GPT-4: 23% → SOTA 2024.
- Ablation: quitar viewer numerado −8 puntos; quitar lint −5.

## 4. Mapeo a opencode-remote-android
- **Tu \"ptyx.rs WS :4849\" hoy es shell crudo → rediseña:** 
  - \"view\" con paginación 100 líneas, \"open→read→edit→lint→run\" loop.
  - \"edit\" que valida \"cargo check\" antes de aplicar y retorna error parsing.
- **fsx.rs:** añade \"search\" con ripgrep y \"diff\" preview.
- **No copies bash infinito:** limita herramientas a 6-8 bien diseñadas (SWE-agent lo demuestra).

## 5. Anti-pattern
- Dar terminal sin guardrails → el agente rm -rf o se pierde en output 10k líneas.

## 6. Ejercicio
- Corre 5 issues de SWE-bench Lite con tu ACI actual vs ACI SWE-agent (viewer+edit). Mide pass rate y tokens.

## 7. Links
- https://arxiv.org/abs/2405.15793

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
