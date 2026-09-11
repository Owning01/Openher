# Plan — QuickChat como agente de investigación

**Fecha:** 2026-09-11 · **Estado:** propuesta para aprobar (sin código aún)
**Objetivo:** que QuickChat deje de ser un chat de una sola pasada y pase a ser un **agente**: historial completo enviado al modelo, herramientas, loop de pasos y respuesta final — optimizado para investigación y temas recientes de internet.

**Referencia externa:** Odysseus (PewDiePie) — workspace self-hosted con chat multi-modelo (Ollama/vLLM/llama.cpp/OpenAI-compat), Deep Research multi-paso y Compare. Solo se toman ideas: Odysseus es AGPL-3.0 y no se copia código.

---

## 1. Qué es "agente" acá (definición operativa)

```
historial completo (presupuestado)
   → LLM (con definiciones de herramientas)
   → ¿pidió tools?
       sí → ejecutar tools → anexar resultados (role=tool) → volver al LLM
       no → respuesta final (streaming)
```

Reglas del MVP:

- Máximo de pasos configurable (default 8). Al agotarse: forzar síntesis sin tools.
- Presupuesto de tokens por turno; resultados de tools truncados.
- Abort corta el loop completo (no solo el stream actual).
- Los pasos se muestran en vivo en la burbuja (Buscar / Leer), y las fuentes se acumulan y deduplican.

---

## 2. Estado actual (verificado)

| Pieza | Dónde | Hoy |
|---|---|---|
| UI del panel | `web/src/components/QuickChatPanel.tsx` (647 líneas) | Popover de config, burbujas, composer, TTS, micrófono |
| Orquestación | `web/src/hooks/useQuickChat.ts` (180) | 1 llamada, búsqueda de 1 paso, historial `slice(-8)`, caché de respuestas en localStorage, persistencia `slice(-30)` |
| Providers | `web/src/providers/{types,groq,cerebras,custom,opencodeGo,opencodeLocal,index}.ts` | SSE en Groq/custom-OpenAI/Go; no-stream en Cerebras; Anthropic custom simula stream; opencode-local usa polling |
| Contrato provider | `web/src/providers/types.ts` | `chat(messages, opts)` → `{text, usage}`. **Sin tools, sin tool_calls** |
| Payloads | `web/src/utils/promptCache.ts` | Solo `{role, content:string}`; sin `tool_calls`, sin rol `tool` |
| Búsqueda web | `desktop-app/src/infrastructure/http/search_router.rs` | `/shell/search`: DDG lite, **siempre 3 resultados**, caché 6 h, sin filtro de fecha |
| Lectura de páginas | `shell.proxy.fetch` + strip HTML en `useQuickChat` | 1 página, 3.5 k chars, sin extracción real |
| Search en móvil | — | No existe (shell es desktop); research degrada |

Referencia obligatoria de la auditoría (`Errores/errores.md`): `/shell/proxy` tiene SSRF burlable; cualquier tool `fetch` debe endurecerse.

---

## 3. Arquitectura propuesta

```
web/src/features/quick-chat/            ← completar el esqueleto que ya existe
├── agent/
│   ├── loop.ts          runAgentLoop (puro, testeable, sin React)
│   ├── tools.ts         definiciones + ejecutores (search, read, now)
│   ├── wire.ts          OpenAI/Anthropic: mensajes con tool_calls/tool
│   └── budget.ts        tokens, truncado de resultados, límites
└── domain/              (existente, hoy placeholder)

web/src/components/quickchat/           ← dividir el panel de 647 líneas
├── QuickChatPanel.tsx   (contenedor, < 350 líneas)
├── MessageList.tsx      burbujas + pasos del loop + fuentes
├── Composer.tsx         input + envío/stop
└── ConfigPopover.tsx    provider/model/keys

web/src/providers/       ← extensión del contrato
types.ts                 + tools, toolCalls, capabilities
groq.ts / cerebras.ts / custom.ts / opencodeGo.ts   ← tool calling
```

El loop vive en **web** (no en Rust): funciona con cualquier proveedor tool-capable y en móvil, reutilizando `/shell/search` y `/shell/proxy` cuando hay desktop. `opencode-local` se trata aparte: ese server ya es un agente; se arregla su streaming/reset en vez de envolverlo en un loop cliente.

---

## 4. Catálogo completo de mejoras

### A. Núcleo del agente (MVP)

| # | Mejora | Detalle | Archivos |
|---|---|---|---|
| A1 | Modelo de mensajes enriquecido | `tool_calls`, rol `tool` con `tool_call_id`, `steps[]` por mensaje; separar mensaje UI de mensaje wire | `providers/types.ts`, `agent/wire.ts` |
| A2 | Loop de agente | `runAgentLoop`: pasos, ejecución de tools (paralelas por paso), reinyección de resultados, corte por pasos/presupuesto, abort | `features/quick-chat/agent/loop.ts` (nuevo) |
| A3 | Tool calling por provider | Groq: `tools` + `tool_choice:auto` + acumulación de deltas de `tool_calls` en SSE. Cerebras: tools en el body no-stream. Custom/Go: OpenAI-compatible stream y no-stream | `providers/*.ts` |
| A4 | Tools v1 | `web_search(query, n, freshness)`, `open_url(url)`, `now()` (fecha actual, para "¿qué salió esta semana?") | `agent/tools.ts` (nuevo) |
| A5 | Rust: búsqueda configurable | `/shell/search?q&n&freshness`: `n` 1–10 (default 5), `freshness=d|w|m|y` → DDG `df`; el parseo deja de cortar en 3 | `search_router.rs` |
| A6 | Prompt de investigación agéntico | Metodología (buscar varios ángulos, leer fuentes, citar, verificar), fecha inyectada, formato de salida | `utils/promptCache.ts` |
| A7 | Tokens reales | `maxTokens` por modo: rápido 500 / agente 2000+. Hoy está hardcodeado en 500 y `QUICKCHAT_MAX_TOKENS` sin usar | providers + `constants.ts` |
| A8 | UI de pasos | Chips en vivo: "Buscando X…", "Leyendo URL…", con resultado colapsable; fuentes agregadas y deduplicadas al pie | `componentes quickchat` |

**Criterio de salida:** "novedades de [tema] de esta semana" → el agente hace ≥2 búsquedas, lee ≥2 páginas, cita URLs y responde; se puede abortar en cualquier paso.

### B. Investigación seria (multi-paso)

| # | Mejora | Detalle |
|---|---|---|
| B1 | Plan visible | El primer paso del agente genera 2–4 subconsultas; la UI las muestra como plan en ejecución |
| B2 | Frescura por defecto | En modo investigación, `freshness=w` (semana) salvo que el usuario pida histórico |
| B3 | Lectura mejorada | Nuevo `/shell/read?url=`: extracción de contenido principal (no solo strip de tags), título, cap 8 k chars, caché 24 h |
| B4 | Citas numeradas | `[1]`, `[2]`… mapeadas a la lista de fuentes; dedupe por URL entre pasos |
| B5 | Bucle de huecos | Si una fuente no responde la pregunta, el prompt indica buscar el hueco restante (sin pasos infinitos) |
| B6 | Stop interoperable | Abort cancela la generación actual y el loop; estado "detenido tras N pasos" |
| B7 | Modo profundo opcional | Toggle "investigación profunda" con más pasos (12) y presupuesto mayor |

### C. Persistencia y sesiones

| # | Mejora | Detalle |
|---|---|---|
| C1 | Conversaciones | Store IndexedDB `quickchat` (ya se crea y nunca se usa): `{id, title, messages, updatedAt}`; lista, renombrar, borrar |
| C2 | Migración | Importar el historial actual de localStorage a una conversación |
| C3 | Historial completo presupuestado | Reemplaza `slice(-8)`: ventana por tokens (system + tool results truncados + turnos), con resumen de lo viejo cuando exceda |
| C4 | Fix "Nuevo chat" con opencode | Borrar `openher.quickchat.sessionId` (hoy la sesión server sigue acumulando) |
| C5 | Export | Conversación a Markdown/JSON (útil para investigación) |
| C6 | Caché coherente | En modo agente, desactivar/condicionar la caché actual (`qc:*`) que ignora el historial |

### D. Providers y local-first (paridad Odysseus)

| # | Mejora | Detalle |
|---|---|---|
| D1 | Capabilities por provider | `{ tools, streaming, vision, maxContext }`; la UI deshabilita el modo agente donde no se soporte |
| D2 | Presets locales | Ollama (`:11434`), LM Studio (`:1234`), vLLM (`:8000`), llama.cpp (`:8080`): detectar, probar y listar modelos con un clic (todo es `/shell/proxy` + `/models`) |
| D3 | Fix fallthrough | `getQuickChatProvider` manda ids desconocidos a Cerebras (bug); los providers "connected" del server no tienen adapter real |
| D4 | Anthropic SSE real | `content_block_delta` (texto y `input_json_delta`), tool use, thinking; hoy simula stream con `res.json()` |
| D5 | opencode-local | Streaming SSE real (no polling 700 ms), cancelación server-side, reset de sesión, render de tool parts y reasoning |
| D6 | Rate limit por key | Los limitadores son arrays globales por módulo, compartidos entre cuentas y paneles |
| D7 | Multi-cuenta Go | `saveGoAccounts([val])` borra las demás cuentas; arreglar |

### E. Configuración y seguridad

| # | Mejora | Detalle |
|---|---|---|
| E1 | Keys cifradas | Groq/Cerebras/Custom en claro; usar el patrón AES-GCM de `goUsage.ts` |
| E2 | Máscara en Rust | `GET /shell/config` devuelve las keys sin enmascarar; enmascarar o no exponerlas |
| E3 | Proxy endurecido | SSRF del `/shell/proxy` (hallazgo de auditoría): allowlist de esquemas, bloqueo de rangos privados para URLs de página (los endpoints locales de D2 son localhost legítimo y van por otra ruta) |
| E4 | Ajustes por panel | maxTokens, pasos, presupuesto y "recientes" editables; hoy no hay UI de esos valores |

### F. Calidad y mantenimiento

| # | Mejora | Detalle |
|---|---|---|
| F1 | Tests del loop | Con `@deepseek-ai/dsh-llm-mock-server` (ya es devDependency): secuencia `tool_call_success`, corte de red, abort, tope de pasos |
| F2 | Tests de tools | search/read con fixtures; dedupe de fuentes |
| F3 | Tests de providers faltantes | `custom`, `opencodeGo`, `opencodeLocal` (hoy solo Groq y Cerebras tienen tests) |
| F4 | Rust tests | `n`/`freshness` del router de búsqueda |
| F5 | i18n y emojis | Quitar emojis y strings hardcodeadas del panel (regla AGENTS); claves nuevas para pasos/fuentes |
| F6 | Flag de feature | `quickchatAgent` en `openher.featureFlags` para volver al modo simple si algo falla |
| F7 | Split del panel | `QuickChatPanel.tsx` de 647 líneas → contenedor + lista + composer + config |

### G. Extras estilo Odysseus (después del MVP)

| # | Mejora | Detalle |
|---|---|---|
| G1 | Compare | 2–3 modelos en paralelo sobre la misma pregunta, lado a lado, con síntesis opcional |
| G2 | Memoria local | Notas/fuentes guardadas + recuperación por keywords; embeddings locales en fase posterior |
| G3 | Más tools | Wikipedia, arXiv, GitHub, clima, Hacker News (todo vía endpoints del shell con caché) |
| G4 | Research a documento | Guardar el reporte como nota/documento del workspace |
| G5 | Tools para los agentes del server | Exponer `/shell/search|read` como tool MCP para que opencode/dsh también investiguen |
| G6 | Móvil | Búsqueda sin shell: `CapacitorHttp` directo + parseo en JS, o vía server |

---

## 5. Fases y esfuerzo (1 dev)

| Fase | Contenido | Días | Entrega |
|---|---|---|---|
| **F0** | A1–A8 + F5 parcial + F1/F2 | 4–6 | Agente mínimo usable: loop + 3 tools + pasos en UI, con tests |
| **F1** | B1–B7 + A5/B3 (Rust) | 3–4 | Investigación multi-paso con citas y frescura |
| **F2** | C1–C6 + E4 | 3–4 | Conversaciones persistentes, historial completo, export |
| **F3** | D1–D7 + E1–E3 + F3/F4 | 4–6 | Providers parejos, local-first, seguridad |
| **F4** | G1–G6 + F6/F7 | según | Extras y deuda |

**Total MVP (F0–F2): ~10–14 días.**

---

## 6. Decisiones abiertas

1. **Provider default del agente:** Groq (más rápido) / Cerebras GPT-OSS 120B (más capaz) / Ollama local (privado).
2. **Resultados por búsqueda:** 5 (recomendado) u 8.
3. **Frescura por defecto en investigación:** semana (recomendado) o mes.
4. **Pasos máximos:** 8 (recomendado) o 12.
5. **Persistencia:** IndexedDB con lista de conversaciones (recomendado) o seguir en localStorage con tope mayor.
6. **Loop siempre activo o solo en Modo Investigación:** recomendado solo en investigación + toggle "Agente" manual.
7. **¿`web_search` sale de `/shell/search` (desktop only) y en móvil se degrada?** Aceptar por ahora; G6 lo resuelve después.

---

## 7. Riesgos

| Riesgo | Mitigación |
|---|---|
| Rate limits con loops (varias llamadas por pregunta) | Caché de resultados de tools, backoff, presupuesto de pasos, provider con más cuota |
| Modelos que no soportan tools bien | `capabilities.tools` + fallback a búsqueda de 1 paso |
| Contexto inflado por páginas largas | Truncado por resultado + presupuesto + resumen de turnos viejos |
| SSRF al leer URLs arbitrarias | Hardening E3 antes de exponer `open_url` |
| Costo/tiempo en móvil | Degradación explícita y aviso en UI |
| Regresión del modo rápido | Flag F6 + tests de contrato existentes |

---

## 8. Fuera de alcance (por ahora)

- Reemplazar el chat principal por QuickChat.
- Integrar dsh/opencode como motor del loop cliente (ya hay investigación aparte: `docs/research-dsh-integration.md`).
- Embeddings/RAG pesado y Cookbook de modelos (Odysseus lo resuelve con ChromaDB/llmfit; acá se prioriza liviano).
- Multi-usuario/telemetría.
