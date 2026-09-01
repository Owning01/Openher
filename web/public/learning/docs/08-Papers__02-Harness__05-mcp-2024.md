# Model Context Protocol — El LSP de los tools (Anthropic, 2024-25)

> **Autores:** Anthropic + Survey Hou
> **Año:** 2024 · **Prioridad:** Muy recomendado · **Lectura:** ~18 min
> **Link verificado:** [https://arxiv.org/abs/2503.23278](https://arxiv.org/abs/2503.23278)
> **Categoría Papers:** 02 Harness · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Spec:** Model Context Protocol (Anthropic nov 2024, donated a Linux Foundation dic 2025) — https://modelcontextprotocol.io
> **Survey:** Hou et al. 2503.23278 — 16 amenazas de seguridad.
> **Prioridad:** Muy recomendado (futuro de external_router)

## 1. Resumen
MCP es estándar abierto tipo LSP para **discovery y invocación bidireccional** de tools: servers exponen \"tools/resources/prompts\", clients negocian capabilities, permisos y auditing. Reemplaza probe TCP hardcodeado.

## 2. Cómo funciona
- **Handshake:** client \"initialize\" → server responde con tools list + schemas JSON.
- **Invocation:** \"tools/call\" con args validados por schema.
- **Resources:** servers exponen docs/context (como tu \"learning\" o \"opencode.db\").
- **Sampling:** server puede pedir al client que llame a otro LLM (para subagentes).

## 3. Por qué importa
- Hoy haces \"probe TCP 250ms + ureq 1800ms\" por plugin → frágil, sin schema, sin permiso.
- MCP da discovery dinámico, validación, allowlist, logs. Escala a N plugins sin código nuevo.

## 4. Aplica a tu app
- Migra \"external_router.rs\" a MCP: cada plugin (opendesign, screenshots, vioeditor) corre como MCP server.
- Implementa allowlist: no auto-discover todo; pide consentimiento para \"shell.fs.delete\".
- Usa MCP resources para exponer \"opencode-stats :8765\" como data source.

## 5. Riesgos (Hou 2503.23278)
- Tool squatting, prompt injection vía resource, exfiltr vía tool result. Implementa validación y sandbox.

## 6. Ejercicio
- Prototipa un MCP server en Rust para \"shell.fs.list\" y haz que opencode lo liste dinámicamente.

## 7. Links
- https://modelcontextprotocol.io/specification/2025-11-25/index
- https://arxiv.org/abs/2503.23278

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
