# OpenHands (OpenDevin) — Plataforma para agentes generalistas (Wang et al., 2024)

> **Autores:** Wang et al. / All Hands AI
> **Año:** 2024 · **Prioridad:** Muy recomendado · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2407.16741](https://arxiv.org/abs/2407.16741)
> **Categoría Papers:** 03 Agentes · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** OpenHands: An Open Platform for AI Code Agents as Software Developers (Wang et al., 2024).
> **Link:** https://arxiv.org/abs/2407.16741 — github.com/OpenHands/openhands
> **Prioridad:** Muy recomendado

## 1. Resumen
Plataforma que da al LLM **bash + browser + editor** en Docker sandbox y evalúa en 15 benchmarks (SWE-bench, GAIA, etc.). Demuestra que sandbox + runtime + observability son tan críticos como el modelo.

## 2. Ideas
- **Runtime Docker por sesión:** aisla efectos, permite rollback.
- **Event stream:** cada acción es evento tipado (no texto).
- **Eval unificada:** mismo harness para 15 tasks → compara justo.

## 3. Aplica a desktop-app
- Tu \"WS PTY :4849 + fsx + gitx\" es runtime sin sandbox → añade Docker o al menos \"dry-run\" mode.
- Usa event stream tipado (ReAct) en vez de log de terminal crudo.
- Replica su eval harness para medir tu ACI vs OpenHands en SWE-bench.

## 4. Ejercicio
- Dockeriza tu \"ptyx\" y mide si el agente hace menos daños (rm -rf) vs host directo.

## 5. Links
- https://arxiv.org/abs/2407.16741

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
