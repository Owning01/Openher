# Gorilla y BFCL — Evaluar tool use de verdad (Berkeley, 2023-25)

> **Autores:** Patil et al. / UC Berkeley
> **Año:** 2023 · **Prioridad:** Imprescindible · **Lectura:** ~18 min
> **Link verificado:** [https://arxiv.org/abs/2305.15334](https://arxiv.org/abs/2305.15334)
> **Categoría Papers:** 02 Harness · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Papers:** Gorilla: Large Language Model Connected with Massive APIs (2305.15334) + BFCL Leaderboard v4 (2025-26).
> **Links:** https://arxiv.org/abs/2305.15334 · https://gorilla.cs.berkeley.edu/leaderboard.html · github.com/ShishirPatil/gorilla
> **Prioridad:** Imprescindible (cómo medir harness)

## 1. Resumen
Gorilla fine-tunea LLaMA-7B sobre 1,600 APIs (TorchHub, TF Hub, HuggingFace) y supera GPT-4 en AST accuracy. BFCL es el benchmark vivo que evalúa tool calls por **AST + ejecución**, no por BLEU. Incluye single, parallel, multi-turn y relevancia.

## 2. Ideas
- **AST eval:** compara árbol sintáctico del call, no texto → evita falsos positivos de "parece que llamó bien".
- **Execution eval:** ejecuta el call en sandbox y verifica efecto.
- **Retriever:** no mete 1,600 APIs en contexto; retrieva top-5 con BM25/dense → ahorra tokens.

## 3. Números
- Gorilla 7B: 62% AST accuracy vs GPT-4 54% en APIs no vistas.
- BFCL v4 state 2026-04-12: Claude 3.5, GPT-4o, Gemini 2.5 top.

## 4. Aplica a tu harness
- **Eval local:** crea BFCL-mini con 10 tools \(shell.fs, shell.git, shell.pty\) y evalúa AST. No confíes en "funciona a ojo".
- **API retriever:** tu \(external_router\) expone 5 plugins × ~5 tools = 25 tools. No los mandes todos en cada turn; retrieva top-k por similitud a intent.
- **Tipado:** usa BFCL metric para validar que \(sendPrompt v2\) no manda \"model\" en body (400).

## 5. Anti-pattern
- Contaminación BFCL v2: datos enterprise filtrados → usa leaderboard live, no snapshot.

## 6. Ejercicio
- Escribe \"web/scripts/bfcl-mini.mjs\" que testeé 10 intents y verifique AST de \(tool_call\). Intégralo en CI.

## 7. Links
- Leaderboard: https://gorilla.cs.berkeley.edu/leaderboard.html

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
