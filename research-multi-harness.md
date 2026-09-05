# Investigación: Soporte Multi-Harness en opencode-remote-android

**Fecha:** 2026-08-23 · **Autor:** Muse Spark Deep Research  
**Fuentes:** 35+ búsquedas web + análisis estático del repo (architecture.md, CATALOGO.md, shared/api, features/chat, hooks, entities) + docs oficiales de cada harness  
**Alcance:** 13 harnesses/agents server evaluados · Arquitectura propuesta compatible con FSD + hexagonal existente

---

## 1. Executive Summary

- **Oportunidad:** `opencode serve` es el protocolo más cercano y estable para exponer un agente como server remoto, pero la app puede convertirse en **control plane universal** si abstrae `sessions ↔ messages ↔ streaming ↔ tools`. El patrón común es sorprendentemente consistente entre todos los harnesses: todos resuelven el mismo invariante (model + harness + workspace + event loop).
- **Diseño propuesto:** extender `shared/api/version.ts` a un `ServerKind` + `ServerAdapter` factory (`adapters/opencode/`, `adapters/pi/`, `adapters/hermes/`, etc.) detrás de puertos hexagonales `ISessionRepository / IMessageRepository / IEventStream / IFileOps / IPermissionGateway`. La UI (`features/chat`, `MessageList`, `ToolPart`) no cambia: consume solo `entities/*` canónicos.
- **Clasificación de esfuerzo:**
  - **Fácil (semanas):** `opencode` (v1/v2 ya hecho), `pi` (RPC/JSONL muy mapeable), `aider` (one-shot trivial)
  - **Medio (1-2 meses):** `hermes-agent` (OpenAI-compatible REST+SSE), `deepseek-harness` (Cordis plugins, pero protocolo similar), `claude-code` (headless → falta server; requiere wrapper HTTP)
  - **Difícil / no nativo (requiere bridge):** `codex` (MCP stdio), `gemini-cli` (MCP consumer, no server), `continue` (archivado, VS Code extension), `cursor` (editor fork, sin server abierto), `openhands` (REST+WS propio), `swe-agent` (batch/research harness, sin server persistente)
- **Riesgos críticos:** divergencia en streaming (SSE vs WS vs JSONL-RPC), auth heterogénea, file ops incompatibles (v2 ya bloquea `writeFile`), `DB_VERSION` y cache offline merge-only deben mantenerse por adapter, capacidad del desktop Rust shell (ya tiene `/shell/proxy`, `/shell/pty` que pueden reutilizarse como bridge para harnesses stdio).
- **Recomendación:** roadmap en **3 fases**: F1= consolidar OpenCode + añadir Pi como segundo adapter validando la abstracción; F2= Hermes + DeepSeek (OpenAI-compat + plugins); F3= bridge stdio→HTTP para Codex/Gemini y evaluación de OpenHands como "remote workspace harness". No intentar Cursor/Continue como harnesses server: tratarlos como *sources de MCP*.

---

## 2. Qué es cada harness y qué server/protocolo expone

| # | Harness | Qué es (1 frase) | Repo / Estrellas | Licencia | Server / Protocolo nativo | Local vs Cloud | Estado |
|---|---------|------------------|------------------|----------|---------------------------|----------------|--------|
| 1 | **opencode** (`sst/opencode`) | Agente de código open source de SST (TUI + serve + SDK + plugins) | `sst/opencode` · ~?k | MIT | `opencode serve` → REST + SSE en `:4096` (`/global/health`, `/session/*`, `/event`, `/tui/*`). OpenAPI 3.1 en `/doc`. SDK JS/Go/Python generados con Stainless. | Local (self-hosted) | Activo, versión opencode2 (v2 beta) en `:4097` |
| 2 | **pi** (`earendil-works/pi`) | Coding agent minimalista (Mario Zechner): 4 tools (read/write/edit/bash), prompt <1k tokens, extensible vía TS extensions | `earendil-works/pi` · **95.7k ⭐** | MIT | **No HTTP por defecto**. Cuatro modos: `interactive` (TUI), `print`/`--mode json` (JSON lines), **`--mode rpc` (LF-delimited JSONL over stdin/stdout, 26+ comandos bidireccionales)**, **SDK** (`createAgentSession` en `@earendil-works/pi-coding-agent`). HTTP solo si el integrador lo expone. | Local | Muy activo |
| 3 | **hermes-agent** (`NousResearch/hermes-agent`) | Agente self-improving con memoria 3 capas, skills, cron, multi-plataforma (14 messengers) | `NousResearch/hermes-agent` | MIT | `hermes gateway` + **`API Server` OpenAI-compatible** en `:8642` (`POST /v1/chat/completions`, `/v1/responses`, `/v1/runs`, `/v1/models`, SSE streaming con `hermes.tool.progress`, Real SSE con CORS opt-in, idempotency-key). También gateway proxy mode. | Local | Activo |
| 4 | **deepseek-harness** (`deepseek-ai/deepseek-harness`) | Runtime oficial DeepSeek: "Model + Harness = Agent", todo es plugin Cordis | `deepseek-ai/deepseek-harness` · 30k⭐ en 24h | MIT | **`npx @deepseek-ai/dsh web` → Web UI en `:3080`** + headless; plugin-first runtime (models/tools/skills/sessions/sandboxes/storage/loop/UI intercambiables). Protocolo HTTP documentado como developer preview (inestable). Requiere DeepSeek API key. | Local runtime + cloud inference | Developer Preview (2026-08-13) |
| 5 | **claude code** (`anthropics/claude-code`) | CLI oficial Anthropic para coding | `anthropics/claude-code` | Proprietary? MIT wrappers | **Sin server HTTP nativo.** Tres caras: `claude -p` / `--print --output-format json` (headless fire-and-forget), **Claude Agent SDK** (`@anthropic-ai/sdk`), **`claude --task` / `claude mcp`**. Comunidad crea `claude-code-headless-server` (wrapper HTTP experimental). MCP server/client nativo. | Local + cloud (Anthropic API) | Activo |
| 6 | **codex** (`openai/codex`) | CLI coding de OpenAI (GPT) con extensión MCP | `openai/codex` | Apache 2.0 | **MCP server experimental** (`codex mcp-server` → JSON-RPC 2.0 over stdio, line-delimited). Docs MCP: `codex-rs/docs/codex_mcp_interface.md`. Métodos v2: `thread/start`, `turn/start`, `turn/interrupt`, `model/list`. Community wraps como `openai-codex-mcp` / `codex-mcp-server` (npx). No HTTP documentado. | Local | Experimental |
| 7 | **gemini-cli** (`google-gemini/gemini-cli`) | CLI de Google para Gemini (open source) | `google-gemini/gemini-cli` | Apache 2.0 | **Consumidor de MCP, no productor.** `gemini-cli` descubre MCP servers vía `discoverMcpTools()` en `settings.json > mcpServers` (stdio/SSE/streamable HTTP). Ejecuta `DiscoveredMCPTool`. No expone server propio. | Local + cloud (Gemini API) | Activo (transición a Antigravity CLI 2026-06-18) |
| 8 | **aider** (`Aider-AI/aider`) | Pair programming en terminal (39k ⭐): edita repo + git + mapa codebase | `Aider-AI/aider` | Apache 2.0 | **Sin server nativo.** `aider --model openai/...` CLI. Community `aider-mcp-server` (`danielscholl/aider-mcp-server`, Python, `sse`/`stdio`, puerto `8050`, tools `ai_code` + `get_models`). | Local | Activo |
| 9 | **continue** (`continuedev/continue`) | Open source coding agent en VS Code/JetBrains/CLI (Hub + Mission Control) | `continuedev/continue` · 35.6k ⭐ | Apache 2.0 | **Archivado para lectura** (`read-only` 2026): "ya no activamente mantenido". Era extensión IDE, no server headless. Su valor residual es como **MCP consumer** (`config.yaml: mcpServers { stdio/sse/streamable-http }`). Migrado en práctica a Cursor. | IDE / Local | Archivado → no priorizar |
| 10 | **cursor** (`cursor/cursor`) | Fork de VS Code con Agent/Composer (propietario) | Propietario | Proprietary | **Sin server documentado.** Editor + `cursor-agent` background agents (API privada). MCP servers vía `.cursor/mcp.json` (`stdio`/`sse`/`streamable-http`). Community `cursor-background-agent-mcp` (TS, STDIO + HTTP `/manifest`/`/tool-invoke`). | Local / Cloud (propietario) | Activo, cerrado |
| 11 | **openhands** (`All-Hands-AI/OpenHands`, ex OpenDevin) | Agente autónomo de dev en sandbox (82k⭐) con Action Execution API | `All-Hands-AI/OpenHands` · 82k ⭐ | MIT | **`openhands-agent-server`** (`openagents/agent_server`) → **REST + WebSocket** en `:8000` (`/conversations`, `/conversations/{id}/events`, `WS /conversations/{id}/events/socket`, `/docs` OpenAPI, `X-Session-API-Key` auth, webhooks, Workspace abstractions: Local/Remote/Docker/API). Legacy runtime API: bash/IPython/browser sobre Docker sandbox. | Local / Docker / API sandbox | Activo, rebrand a Agent Canvas |
| 12 | **swe-agent** (`SWE-agent/SWE-agent`, Princeton) | Harness de research para SWE-bench (18.8k⭐), ahora recomienda `mini-swe-agent` | `SWE-agent/SWE-agent` | MIT | **Sin server persistente.** Python CLI (`pip install swe-agent`, `swe-agent run --model --repo-path --problem-statement`), batch mode, Docker. **SWE-ReX** (runtime companion) expone FastAPI server (`/api/endpoints` mappando `AbstractRuntime`). `mini-swe-agent` es el sucesor simplificado. | Local / Docker / Browser Codespaces | Activo pero academico/batch |
| 13 | **inflection pi** (Inflection AI) | Modelo/assis Pi (consumer, no harness dev) | Inflection AI | Proprietary | **API de modelos** (`Inflection Chat API` en `layercake.pubwestus3.inf7ks8.com`, OpenAPI, `inflection_3_pi` etc.), **no harness**: es producto consumer (`pi.ai`, iOS/Android/WhatsApp). No relevante como harness server. | Cloud | No harness |

> **Nota terminológica:** "pi (Inflection)" en tu brief no corresponde a un harness; el harness relevante es **Pi (`earendil-works/pi`, formerly `badlogic/pi-mono`)**. Se documenta esa distinción para evitar confusión en el naming (`ServerKind.pi` debe referirse a `earendil-works/pi`, no a `pi.ai`).

---

## 3. Patrón común de API y dónde divergen

### 3.1 Invariante abstracto (consensual)

Todos los harnesses responden a la misma ecuación, explicitada por DeepSeek como ***Model + Harness = Agent***:

```
Agent = Model (inference)  +  Harness (tools + memory + workspace + event loop + guardrails)
```

| Capa canónica | Qué representa | Nombres que recibe en cada harness |
|---|---|---|
| **Session / Conversation / Thread / Instance** | Unidad de trabajo persistente (id + cwd + branch + contexto) | `session` (opencode), `session` JSONL file (pi), `conversation` (hermes `/v1/responses` `conversation`), `thread` (codex v2), `conversation` (openhands), `instance` (SWE-ReX) |
| **Message / Entry / Event / Part** | Turn de diálogo con parts tipados (text + tool_call + tool_result + thinking) | `MessageEnvelope {info, parts}` (opencode), entries JSONL con `parentId` (pi), OpenAI `messages[]` (hermes), `Message {info, parts}` (opencode v2 unified), `events[]` discriminated unions (openhands) |
| **Streaming** | Entrega incremental de deltas antes de persistir el message completo | `SSE /event` (opencode), JSONL per-line (pi print/rpc), SSE `hermes.tool.progress` + OpenAI `stream:true` (hermes), SSE `stream: true` (Anthropic Messages), MCP notifications (codex/gemini), WS `/events/socket` (openhands) |
| **Tool Calls** | Invocación/resultado de herramientas con lifecycle `pending → running → completed/failed` | `tool_use / tool_result / state {input, output, error}` (opencode), 4 tools + extensions (pi), `function`/`tool` (hermes OpenAI spec), `tools/list` → `tools/call` (MCP), `actions/observations` (openhands) |
| **Models / Providers / Auth** | Catálogo y credenciales de modelos | `GET /config/providers` + `GET /agent` (opencode), `models.json` + `AuthStorage` (pi), `GET /v1/models` (hermes), `GET /experimental/tool?provider&model` (opencode), `POST /auth/:id` (opencode) |
| **FileOps / Workspace** | Listar/leer/escribir archivos, diffs, VCS | `GET /file`, `/file/content`, `POST /file`, `/file/status`, `/vcs`, `/session/:id/diff` (opencode), `read/write/edit/bash` (pi), tools `read, write, edit, bash, patch, grep` ( глубок generico) |
| **Permissions / Human-in-the-loop** | Gates de aprobación antes de tool side-effect | `POST /permission/:id/reply`, `POST /question/:id/reply` (opencode), approval hooks (pi extensions), `POST /session/:id/permissions/:id` (opencode) |
| **Events bus** | Notificaciones cross-session (status, todos, heartbeats) | `server.heartbeat` cada ~5s, `session.status/idle/completed`, `message.part.delta/updated` (opencode); `server.connected` (opencode) |

### 3.2 Divergencias críticas

| Dimensión | Consenso | Divergencia | Implicación para adapter |
|---|---|---|---|
| **Transporte** | Todos exponen *algo* remotamente invocable | opencode=HTTP+S SSE (fetch reader, no EventSource para auth); hermes=HTTP+S SSE; openhands=HTTP + WS; pi=stdio JSONL-RPC (no HTTP); codex=stdio MCP; aider=none (community SSE/stdio); gemini=consumer-only; continue/cursor=IDE | El adapter debe ocultar **SSE vs WS vs JSONL-RPC vs polling** detrás de `IEventStream`. Para stdio harnesses, elegir entre: (a) embeber cliente en `desktop-app` Rust y exponer `GET /shell/harness/:kind/event` (recomendado), o (b) exigir que el usuario corra un bridge HTTP (`pi --mode rpc` ya permite HTTP wrapper community). |
| **Shape de mensajes** | Todos usan "parts/blocks" tipados | opencode v1: `parts[]` con `id/type/text/tool/state/time`; v2: `content[]` mapeado por `toMessageEnvelopeV1`; Anthropic: `content_blocks[]` con `text_delta`/`input_json_delta`; OpenAI: `choices[].delta`; Pi: entries JSONL con `id/parentId/isBranch`; OpenHands: discriminated `action/observation` events | Normalizar a `entities/message/model.ts: MessageEnvelope` como tipo canónico. Mappers obligatorios por adapter. Cuidar `time.completed` vs `status` polling: el merge incremental de `useMessages` ya depende de `time.completed` [architecture §2.5, chat.service `mergeMessages`]. |
| **Sessions persistentes** | Todos tienen sesiones con id | opencode: server-persisted DB (`opencode.db`); pi: archivos JSONL `~/.pi/agent/sessions/<cwd>` con tree+fork; hermes: Redis/file/DB según deployment; openhands: server file store `conversations/{id}/events` | `ISessionRepository.listSessions` debe soportar: `directory` scoping (opencode), cwd-based discovery (pi), conversationId prefix (hermes). Offine cache IndexedDB `DB_VERSION=2` merge-only debe ser por-adapter. |
| **Auth** | Todos auth, pero diferente esquema | opencode: `Basic base64(user:pass)` + `OPENCODE_SERVER_PASSWORD` + `X-Session-API-Key` (openhands); hermes: `Bearer <API_SERVER_KEY>` (obligatoria incluso localhost); pi: `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/OAuth per-provider + `/login`; codex: ChatGPT OAuth o API key; deepseek: DeepSeek API key (OpenAI-compat `base_url`) | Adapter debe declarar `AuthScheme = Basic | Bearer | ApiKey | OAuth | None` y manejar CORS preflight (hermes no habilita CORS by default, opencode requiere `--cors`). `shared/api/client.ts` ya maneja Basic + retry + CapacitorHttp; generalizarlo. |
| **Streaming granularidad** | Streaming es mandatorio en prod | opencode: `message.part.delta` (v1 1.18.x solo deltas) + `message.part.updated` (tipo resuelto con `partTypeCacheRef`); hermes: OpenAI `stream:true` + inline `tool.progress`; Claude Messages: `content_block_delta` 9 tipos; pi: JSONL incremental tokens/tools; openhands: WS actions/observations | La UI actual (`hooks/useSSE.ts` + `shared/sse/parser.ts`) asume SSE con `touch()` heartbeat + watchdog 1 timer permanente + filtro por `sessionID` defensivo. Generalizar a `IEventStream` con `streamState: polling|streaming|reconnecting` ya existente, pero cada adapter traduce sus frames a `SSEEvent {id,type,properties}` canónico. |
| **File ops** | File ops necesarias para sidecar, browser, diff | opencode: REST completo (`/file`, `/file/content`, `/file/status`, `/session/:id/diff/{file}`, `/find/file`, `/find/symbol`); pi: solo `read/write/edit/bash` (sin `find/symbol`); v2: `writeFile` **no soportado** (`throw "not supported on v2"`); hermes: full tools vía OpenAI function spec (incluye `read, write, edit, bash, web`) | Abstraer `IFileOps` con capabilities: `{read, write, list, status, diff, findSymbol, writeFile}`. Deshabilitar UI de edición cuando `adapter.capabilities.fileWrite===false` (como ya se hace para v2). |
| **Permissions** | Solo algunos tienen gates formales | opencode: `permission` + `question` formales (reject/reply); pi: no gates nativos, solo extensions; hermes: approval via gateway policy; openhands: permission delegation; codex/gemini: MCP elicitation | `IPermissionGateway` opcional. Si `!adapter.supportsPermissions`, ocultar `PermissionPrompt/QuestionPrompt` y hacer tools auto-approve con aviso. |
| **SDK ergonomics** | SDKs existen pero en lenguajes diferentes | opencode: `@opencode-ai/sdk` (JS), `sst/opencode-sdk-go`, `opencode-sdk-python` (Stainless); pi: `@earendil-works/pi-coding-agent` (TS SDK + RPC); hermes: `from run_agent import AIAgent` (Python); openhands: `openhands-agent-server` Python REST+WS | Adapter escrito en TS en `web/` debe consumir HTTP; no correr Python SDK en browser. Para pi SDK es ideal (mismo TS), pero en APK no hay Node: usar HTTP bridge. |

---

## 4. Diseño de capa de abstracción / adapters (FSD + hexagonal encajado)

### 4.1 Mapa de la arquitectura actual (relevantísimo)

```
web/src/
├── shared/api/
│   ├── client.ts        ← transporte dual CapacitorHttp|fetch + Basic auth + retry
│   ├── version.ts       ← detective v1/v2 (memoizado por host, promise dedup) ★ EXTENDER
│   └── mappers.ts       ← toSessionV1 / toMessageEnvelopeV1 / mapProviderModels
├── shared/sse/
│   ├── client.ts        ← buildSSEUrl / parseSSEChunk / createSSEClient (EventSource)
│   ├── handler.ts       ← isDeltaEvent / createEventRouter
│   └── parser.ts        ← createSSEFrameParser (LF fan-out, delta buffer)
├── entities/{session,message,config,agent,file,ui}/model.ts  ← tipos canónicos puros
├── features/chat/
│   ├── domain/chat.service.ts     ← mergeMessages / dedupeOptimistic (pura, testeable)
│   ├── application/{ports.ts, load-messages.usecase.ts, send-prompt.usecase.ts}
│   └── infrastructure/{message.api.adapter.ts, message.cache.adapter.ts}
├── hooks/
│   ├── useSSE.ts        ← fetch+reader (no EventSource) con 1-timer heartbeat watchdog + filtro sessionID
│   ├── usePolling.ts    ← backoff exp 1s→60s + jitter 30% + DataMode Full/Saver/Ultra/Miser
│   ├── useMessages.ts   ← ~850 líneas God hook (loadSelected merge incremental por id, optimistic por match texto)
│   ├── useSessions.ts / useConfig / useAI / useSessionSidecar ...
│   └── useOfflineCache.ts ← IndexedDB merge-only DB_VERSION=2 (NUNCA bajar)
└── api.ts               ← facade delegante (1119→636) que será reemplazado por Factory de adapters
```

Reglas FSD operantes (`AGENTS.md`):

- Flujo `app → pages → widgets → features → entities → shared` (entities sin React/fetch).
- PROHIBIDO `fetch/CapacitorHttp` en componentes/hooks → ports + adapters o `shared/api`.
- Ningún archivo >350 líneas (excepto `App.tsx` God debt).
- Rust: prohibido `if path == "/shell/..."` en `api.rs` → routers.
- Domain puro con `.test.ts`.

### 4.2 Arquitectura propuesta

```
                           ┌─────────────────────────────────────────────┐
                           │  Presentation / Pages / Widgets             │
                           │  widgets/chat, pages/settings, shellPanels  │
                           └─────────────────┬───────────────────────────┘
                                             │ consume solo ports + entities
         ┌───────────────────────────────────┼──────────────────────────────┐
         │ Features                          │                              │
         │ features/chat                     │  features/sessions           │
         │  domain/chat.service (merge)      │  features/files              │
         │  application/useCases (send,      │  features/sidecar            │
         │                load, abort)       │                              │
         │   ▲ ports.ts                      │                              │
         └────┼──────────────────────────────┘                              │
              │ IMessageRepository / ISessionRepository / IEventStream /    │
              │ IFileOps / IModelRegistry / IPermissionGateway              │
   ┌──────────┴─────────────────────────────────────────────────────────────┐
   │ shared/harness  (NUEVO: composición + factory + runtime detection)    │
   │                                                                       │
   │  kind.ts          ServerKind = 'opencode'|'opencode-v2'|'pi'        │
   │                   | 'hermes'|'deepseek'|'claude-code'               │
   │                   | 'codex'|'openhands'|'swe-agent'|'aider'|'generic' │
   │                   | CapabilityProfile                                   │
   │  adapter.ts       ServerAdapter interface (ports agregados)            │
   │  factory.ts       createAdapter(kind, config) → ServerAdapter          │
   │  detection.ts     probeHarnesses(config) → kind+capabilities (health)  │
   │  mappers/         *por-adapter* toSession / toMessageEnvelope          │
   │  sse/             *por-adapter* event translators → SSEEvent canónico  │
   │  offline/         cache namespacing por kind (openher:{kind}) │
   └──────────┬─────────────────────────────────────────────────────────────┘
              │ implementan ports
   ┌──────────┴─────────────────────────────────────────────────────────────┐
   │ Infrastructure / Adapters (implementaciones concretas)                  │
   │                                                                       │
   │ adapters/opencode/{client, mapper, sse, files, permissions}.ts        │
   │ adapters/pi/{rpc.client, session-store, mapper, sse-emulator}.ts      │
   │ adapters/hermes/{client, mapper, sse, openai-compat}.ts               │
   │ adapters/deepseek/{client, mapper, cordis-prefs}.ts                   │
   │ adapters/codex/{mcp_stdio.bridge, mapper}.ts   ← vía desktop-app     │
   │ adapters/aider/{client, mcp}.ts                                        │
   │ adapters/openhands/{client, ws}.ts                                     │
   └───────────────────────────────────────────────────────────────────────┘
              │ HTTP / SSE / WS / JSONL-RPC / stdio
   ┌──────────┴─────────────────────────────────────────────────────────────┐
   │ shared/api/client.ts (refactorizado)  → Transport  (pluggable)         │
   │   BasicAuthHandler, BearerHandler, ApiKeyHandler, NoAuth               │
   │   CapacitorHttp | fetch | WS | JSONL-RPC (via desktop shell proxy)     │
   └───────────────────────────────────────────────────────────────────────┘
   ┌──────────┴─────────────────────────────────────────────────────────────┐
   │ desktop-app (Rust) extensible como "harness host"                       │
   │  GET /shell/harness/detect      → proxy health probes multipuerto      │
   │  ANY /shell/harness/:kind/proxy → CORS bypass + auth inject (ya existe│
   │  WS  :4850 /shell/harness/:kind/pty ← PTY bridge para stdio harnesses│
   │ infraestructura/http/{harness_router}.rs (no más if chain en api.rs)   │
   └───────────────────────────────────────────────────────────────────────┘
```

### 4.3 Contratos TypeScript concretos

#### 4.3.1 `shared/harness/kind.ts`

```ts
export type ServerKind =
  | 'opencode'        // opencode serve v1 (/event, /session)
  | 'opencode-v2'     // opencode2 beta  (/api/event, {data:…})
  | 'pi'              // earendil-works/pi  (RPC JSONL bridge)
  | 'hermes'          // NousResearch/hermes-agent (OpenAI-compat)
  | 'deepseek'        // deepseek-ai/dsh  (:3080)
  | 'claude-code'     // local wrapper http sobre claude -p
  | 'codex'           // openai/codex mcp_stdio bridge
  | 'gemini-cli'      // MCP consumer => NO server (capability=false)
  | 'aider'           // community aider-mcp-server (:8050)
  | 'openhands'       // All-Hands-AI agent-server (:8000)
  | 'swe-agent'       // batch harness (read-only trajectories)
  | 'generic-openai'  // fallback: cualquier endpoint OpenAI-compat (/v1/chat/completions, /v1/models)
  | 'generic-mcp'     // fallback MCP stdio bridge
  | 'auto';           // detección automática (probing)

export type CapabilityProfile = {
  sessions: boolean;          // GET/POST /session
  messages: boolean;          // GET /session/:id/message
  streaming: 'sse' | 'ws' | 'jsonl' | 'poll' | false;
  toolCalls: boolean;
  toolStreaming: boolean;      // deltas de tool input
  fileRead: boolean;
  fileWrite: boolean;
  fileStatus: boolean;
  diff: boolean;
  permissions: boolean;        // question/approval gates
  models: boolean;             // provider/model catalog
  authSchemes: Array<'basic'|'bearer'|'apikey'|'oauth'|'none'>;
  offlineCacheSafe: boolean;   // si merge-only IndexedDB es compatible
};

export type HarnessProfile = {
  kind: ServerKind;
  baseUrl: string;            // resuelto por baseUrl(config) + apiPath logic
  version: string;            // health.version
  capabilities: CapabilityProfile;
  apiPrefix: string;           // '' | '/api' | '/v1' | …
  streamingEndpoint: string;   // '/event' | '/api/event' | '/v1/chat/completions' (SSE) | 'ws://…/events/socket'
};
```

#### 4.3.2 `shared/harness/adapter.ts` — interfaz agregadora (extiende ports existentes)

```ts
import type { IMessageRepository, IMessageCache, IEventStream,
               ISessionRepository } from '../../features/chat/application/ports';

export interface IFileOps {
  readFile(path: string, dir?: string): Promise<{type:'text'|'binary'; content:string; encoding?:string}>;
  writeFile?(path: string, content: string, dir?: string): Promise<boolean>;
  listFiles(path: string, dir?: string): Promise<Array<{name:string; path:string; type:'file'|'directory'}>>;
  getStatus?(dir?: string): Promise<unknown>;
  getDiff?(sessionID: string, dir?: string): Promise<Array<{file:string; additions:number; deletions:number}>>;
  findFiles?(query: string, dir?: string): Promise<Array<{path:string}>>;
}

export interface IModelRegistry {
  listModels(dir?: string): Promise<import('../../entities/agent/model').ModelOption[]>;
  listAgents(dir?: string): Promise<import('../../entities/agent/model').AgentOption[]>;
  listCommands?(): Promise<unknown[]>;
}

export interface IPermissionGateway {
  listPending?(dir?: string): Promise<unknown[]>;
  reply?(id: string, approve: boolean, dir?: string, sessionID?: string): Promise<boolean>;
  questionReply?(id: string, answers: string[][], dir?: string, sessionID?:string): Promise<boolean>;
}

export interface ServerAdapter extends IMessageRepository, ISessionRepository, IFileOps, IModelRegistry {
  readonly kind: ServerKind;
  readonly profile: HarnessProfile;
  readonly events: IEventStream;           // streaming canónico (siempre SSEEvent)
  readonly permissions?: IPermissionGateway;
  health(): Promise<{healthy:boolean; version:string}>;
  // mappers internos, no expuestos a UI
  capabilities(): CapabilityProfile;
}
```

> Nota: `IMessageRepository`, `ISessionRepository`, `IEventStream` ya existen en `features/chat/application/ports.ts` (ver lectura §4). Se reutilizan tal cual; solo se añade `IFileOps`/`IModelRegistry`/`IPermissionGateway`. La creación de `ServerAdapter` es un **facade de puertos** similar a `createMessageApiAdapter(config)` ya existente, pero polimórfico por `kind`.

#### 4.3.3 `shared/harness/detection.ts` — reemplazo/superset de `shared/api/version.ts`

Hoy `version.ts` detecta `v1` vs `v2` memoizado por `host:port` + `detectionPromises` dedup + `healthProbe`. La propuesta es **generalizarlo** conservando compatibilidad:

```ts
// Mantener exported API existente intacta para no romper App.tsx:
export { resolveApiVersion, getApiVersion, rememberApiVersion,
         versionKey, detectedVersionCache, detectionPromises, onApiVersionChange, apiPath, unwrapData };

// Añadir:
export const detectedHarnessCache = new Map<string, HarnessProfile>();
export const harnessPromises = new Map<string, Promise<HarnessProfile>>();

export async function detectHarness(config: ServerConfig): Promise<HarnessProfile> {
  const key = `${config.host}:${config.port}`;
  if (detectedHarnessCache.has(key)) return detectedHarnessCache.get(key)!;
  if (harnessPromises.has(key)) return harnessPromises.get(key)!;
  const promise = probeSequence(config); // ver abajo
  harnessPromises.set(key, promise);
  try { const p = await promise; detectedHarnessCache.set(key, p); return p; }
  finally { harnessPromises.delete(key); }
}

// probeSequence prioriza probas baratas y sin auth primero:
async function probeSequence(config: ServerConfig): Promise<HarnessProfile> {
  // 1. opencode health (/global/health → v1 | /api/health → v2) — ya existe, barato
  // 2. openhands (/api/health o GET /docs → OpenHands)
  // 3. pi RPC bridge health (/api/pi/health o WS :pid candado) → si responde JSONL `{"type":"hello"}`
  // 4. hermes OpenAI-compat (GET /v1/models + header Authorization? → hermes-agent)
  // 5. generic-openai fallback (GET /v1/models)
  // 6. deepseek-harness (GET /health o WS :3080)
  // El orden respeta que opencode ya es el default de la app (no regresión).
}
```

**Garantías** ya probadas en `version.ts` que deben mantenerse para harness detection: memo por host, promise dedup, sync resolver `resolveHarnessKind()` (no bloqueante para SSE connect), y `onHarnessChange` listener para re-ejecutar `useSSE` (hoy `versionTick`).

### 4.4 Cómo encaja con hooks/UI existentes (sin duplicar)

| Hook/Component actual | Cambio propuesto | Por qué no rompe |
|---|---|---|
| `hooks/useSSE.ts` (fetch+reader, 1 timer watchdog, filtro sessionID) | Extraer la lógica de transporte a `adapters/{kind}/sse.ts` que implemente `IEventStream` (`subscribe(sessionID, dir, handler): Unsubscribe` + `getState()`/`reconnect()`). `useSSE` se vuelve un thin wrapper que delega a `adapter.events`. | Interfaz `IEventStream` ya existe en `ports.ts`. El watchdog, backoff `computeBackoff(1s→30s)` y `sessionIDRef` defensivo se mantienen dentro de cada `IEventStream` impl, adaptando el wire format. |
| `hooks/usePolling.ts` (backoff 1s→60s + DataMode 4 niveles) | Mantener polling como fallback para adapters con `streaming===false` (aider one-shot, pi print). El `DataMode` recorte de payload sigue aplicando: `stripNonEssential` ya filtra por `DataMode`. | Para adapters con streaming real, polling es solo respaldo (hoy ya `streamActive` lo modula). |
| `hooks/useMessages.ts` (~850) + `features/chat/domain/chat.service.ts` (`mergeMessages`/`dedupeOptimistic`) | Ningún cambio: consumen `IMessageRepository` + `IChatService`. Solo cambian el adapter inyectado. | `mergeMessages` ya es agnóstico al origen (solo espera `MessageEnvelope[]` canónico). Mismo para `loadSelected` merge incremental por `id` + `time.completed`. |
| `hooks/useSessions.ts` | Migrar a `ISessionRepository` via adapter factory. | `listSessions` vs `listGlobalSessions` vs pi `~/.pi/session` se oculta en mapper. |
| `hooks/useAI` / `hooks/useSessionSidecar` / FileBrowser / DiffViewer | Pasar por `IModelRegistry` / `IFileOps`. | UI deshabilita features según `profile.capabilities` (igual que hoy se oculta `writeFile` en v2). |
| `components/ToolPart`, `ThinkingBlock`, `PermissionPrompt`, `QuestionPrompt` | Sin cambios: consumen `RenderedMessage.toolParts`/`thinkingParts` ya normalizados. | Cada adapter mapea su delta (Anthropic `content_block_delta`, OpenAI `function_call`) a `MessageEnvelope.parts[].state`. |
| `useOfflineCache.ts` / IndexedDB | Namespacing por harness: `openher:{kind}:{sessionID}` o stores separados. Nunca bajar `DB_VERSION=2`; merge-only se mantiene. | Evita mezclar shapes de diferentes adapters. |
| `shared/api/client.ts` | Extraer `AuthHandler` + `Transport` strategy: `BasicHandler` (hoy), `BearerHandler` (hermes/openhands), `CapacitorHttp` vs `fetch` vs `WebSocket` vs `JsonlRpcOverHttp` (desktop shell proxy). | Hoy ya tiene dual `CapacitorHttp`/`fetch` + `recordDataUsage` + 1 retry + `x-next-cursor` pagination — se preserva. |
| `desktop-app/src/api.rs` (1370 líneas, `if chain`) | Crear `infrastructure/http/harness_router.rs` (ya scaffold vacío) para `/shell/harness/*`: `{detect, proxy, events, pty}` que tape stdio harnesses (pi RPC, codex MCP). | Hoy `AGENTS.md` prohíbe `if path==` en `api.rs`; este RFC le da contenido real al scaffold. |

### 4.5 Esquema de archivos concreto (paso FSD)

```
web/src/
├── shared/
│   ├── harness/                      # NUEVO módulo compartido
│   │   ├── kind.ts                   # ServerKind + CapabilityProfile
│   │   ├── detection.ts              # detectHarness() (extiende version.ts)
│   │   ├── factory.ts                # createAdapter(config, kind) → ServerAdapter
│   │   ├── adapter.ts                # ServerAdapter interface
│   │   ├── capabilities.ts           # capabilityMatrix: Record<ServerKind, CapabilityProfile>
│   │   └── offline.ts                # namespaced cache helpers (IndexedDB v2 wrapper)
│   ├── api/
│   │   ├── client.ts                 # ← refactorizado: Transport + AuthHandler
│   │   ├── version.ts                # ← mantiene API, delega a detection.ts (compat)
│   │   └── mappers.ts                # ← opencode mappers permanecen, nuevos en adapters/
│   └── sse/
│       ├── client.ts / handler.ts / parser.ts   # permanecen como utils genéricos
│       └── …                                     # adapters los usan
├── entities/
│   └── harness/model.ts             # ServerKind, HarnessProfile, AuthScheme (opcional mirror)
├── features/
│   ├── chat/
│   │   ├── application/
│   │   │   ├── ports.ts              # ← ampliado con IFileOps/IModelRegistry/IPermissionGateway
│   │   │   └── harness.usecase.ts    # selectHarness, switchKind, probe+remember
│   │   └── infrastructure/
│   │       └── harness.adapters.ts   # re-exports factory para DI en hooks
│   ├── sessions/
│   │   └── infrastructure/adapters/  # futuros session adapters (reuso)
│   └── files/
│       └── infrastructure/adapters/  # IFileOps impls delegando a harness adapter
├── adapters/                         # NUEVO nivel (sibling de shared/features, o dentro de shared/harness/adapters)
│   ├── opencode/
│   │   ├── client.ts     # mapeo 1:1 de web/src/api.ts actual
│   │   ├── mapper.ts     # toSessionV1 / toMessageEnvelopeV1 (hoy en shared/api/mappers)
│   │   ├── sse.ts        # traduce /event frames → SSEEvent canónico
│   │   ├── files.ts      # /file/* impl
│   │   └── permissions.ts
│   ├── opencode-v2/
│   │   └── …           # /api/event, /location/*, writeFile Unsupported
│   ├── pi/
│   │   ├── rpc.client.ts # JSONL over WS/HTTP bridge → adapter
│   │   ├── mapper.ts     # JSONL entries {id,parentId} → MessageEnvelope
│   │   ├── sse.ts        # JSONL stream → SSEEvent (emula deltas)
│   │   └── session.ts    # FS JSONL listing → Session[]
│   ├── hermes/
│   │   ├── client.ts     # POST /v1/chat/completions, GET /v1/models (Bearer)
│   │   ├── mapper.ts     # OpenAI messages → MessageEnvelope parts
│   │   └── sse.ts        # OpenAI SSE chunks + hermes.tool.progress → SSEEvent
│   ├── deepseek/
│   ├── codex/            # mcp_stdio.bridge.ts → via desktop-app
│   ├── openhands/
│   │   ├── client.ts
│   │   └── ws.ts
│   ├── aider/
│   └── generic/          # generic-openai + generic-mcp
└── app/providers/
    └── harness.provider.tsx  # React context con ServerAdapter + profile + capabilities (reemplaza uso directo de api.* en App.tsx)
```

> Alternativa discutida: colocar `adapters/` dentro de `shared/harness/adapters/` para respetar FSD `entities → shared` import restrictions. Es preferible esa ubicación para no introducir un layer nuevo fuera de FSD. En el diagrama ASCII se mostró como separado para claridad, pero la implementación puede ser `shared/harness/adapters/{kind}/`.

---

## 5. Qué se necesita para cada harness en específico

### 5.1 OpenCode (sólo reafirmar, baseline)

| Ítem | Detalle | Adapter notes |
|---|---|---|
| Health | `GET /global/health` (v1) vs `/api/health` (v2) | `version.ts` ya probado con `try /global/health → 404 → /api/health` + memo |
| Sessions | `GET /session`, `POST /session {parentID,title}`, `GET /session/status`, `DELETE/PATCH /session/:id` | `listGlobalSessions` con `x-next-cursor` paginado |
| Messages | `GET /session/:id/message?limit=100`, `POST /session/:id/message {parts,model,agent}` (sync wait), `POST .../prompt_async` (204), `POST .../command`, `POST .../shell` | `loadMessages` ya inyecta `sessionID` en `info/parts` |
| Streaming | `GET /event` (v1) o `/api/event` (v2), `?directory=` (v1) vs `?location[directory]=` (v2), header `Accept: text/event-stream`, Authorization `Basic` | `useSSE` → fetch+reader (no EventSource) + watchdog 1 timer + `partTypeCacheRef` |
| Models | `GET /config/providers` (v1), `GET /agent` | `mapProviderModels` + `toAgentOption` |
| File | `/file?path`, `/file/content`, `/file/status`, `/find/*`, `/session/:id/diff/:file` | `readFile/writeFile` ya con `toServerRelative` |
| Permissions | `/permission`, `/question`, `POST .../reply` | Dialogs existentes |
| Auth | `Basic base64(user:pass)` | `authHeader()` + `CapacitorHttp` retry |
| Deltas | `message.part.delta` solo en 1.18.x + `message.part.updated` | Dedupe v1/v2 |

→ **Esfuerzo: 0** (ya implementado; sirve como golden adapter de referencia).

### 5.2 Pi (`earendil-works/pi`)

| Ítem | Detalle |
|---|---|
| Install | `curl -fsSL https://pi.dev/install.sh | sh` (Node 22+), `pi` (interactive) |
| Auth | `export ANTHROPIC_API_KEY=…`, `pi /login` (OAuth para 15+ providers), `~/.pi/agent/auth.json` |
| Sessions | Archivos JSONL `~/.pi/agent/sessions/<cwd-hash>/*.jsonl` con `id/parentId` tree + branching + `pi -c/-r/--fork/--session/--name/--no-session/clone`. Formato documentado en `docs/session-format.md`. |
| Messages | entries JSONL `{"type":"message","role":"user|assistant","content":...}` + tool entries |
| Streaming | **No SSE.** Modo `print` (`pi -p "query"` con stdin merge) y `--mode json` (JSON lines stream), `RPC` (`pi --mode rpc` → LF-delimited JSONL stdin/stdout, comandos `prompt, steer, compact, set_model, bash`, eventos `tokens, tool_execution, compaction, extension_ui_request`). |
| Tools | `[read, bash, edit, write]` (factories `codingTools`, `readOnlyTools`, `allBuiltInTools`) + extensiones npm/git/local (`pi install npm:@foo/bar`, `-e npm:@foo/bar` ephemeral) |
| SDK | `import {createAgentSession} from '@earendil-works/pi-coding-agent'` → `session.prompt("…")`, `AgentSessionRuntime`, `ExtensionAPI` (inject context, RAG, compact) |
| Integration needed | **Bridge HTTP** para que `web` hable con pi sin Node en APK: 3 opciones: (a) `desktop-app` Rust lanza `pi --mode rpc` como child y expone `WS /shell/harness/pi/{sessionID}` (recomendado), (b) community HTTP wrapper (`pi serve` no oficial), (c) usar `SDK` si web corre en Node (desktop WP). Mappers JSONL→`MessageEnvelope` trivial (1:1 fields). |
| Ventaja | SDK 100% TS, 95k ⭐, superpos. con opencode TUI menos friction |

→ **Esfuerzo: Bajo-medio.** Protocolo RPC bien documentado (`docs/rpc.md`), SDK usable, branching files ya resuelve offline cache analogy.

### 5.3 Hermes Agent

| Ítem | Detalle |
|---|---|
| Enable | `~/.hermes/.env: API_SERVER_ENABLED=true, API_SERVER_KEY=secret, API_SERVER_PORT=8642` → `hermes gateway` |
| Endpoints | `POST /v1/chat/completions` (stateless, `stream:true` → SSE), `POST /v1/responses` (stateful, `previous_response_id` o `conversation`), `GET /v1/responses/{id}`, `DELETE …`, `GET /v1/models` (alias `hermes-agent`), `GET /api/model/options`, `GET /v1/capabilities`, `POST /v1/runs` + `/v1/runs/{id}/events` + `/v1/runs/{id}/approval` + `/v1/runs/{id}/stop`, `GET /health` |
| Streaming | OpenAI SSE (`choices[].delta`) + custom `hermes.tool.progress` events inline (ignorables para frontends genéricos) |
| Tools | Todos (terminal, file ops, web, memory, skills) expuestos vía spec OpenAI `tools[]` |
| Auth | `Authorization: Bearer <API_SERVER_KEY>` (obligatoria incluso localhost), `Idempotency-Key` dedup (5 min), security headers (`nosniff`, `no-referrer`) |
| CORS | No habilitado por default; `API_SERVER_CORS_ORIGINS=http://…` (preflight 600s cache). SSE incluye CORS headers. |
| Frontends compatibles | Open WebUI, LobeChat, LibreChat, NextChat, ChatBox, AnythingLLM, Big-AGI, Python SDK `OpenAI(base_url="http://localhost:8642/v1")` |
| Integration | Implementar `generic-openai` adapter abstracto reutilizable para hermes+deepseek-proxy; `HermesAdapter` solo añade `tool.progress` parser + `runs` workflow. Auth Bearer → `shared/api/client.ts` nuevo `BearerHandler`. |
| Trap | Sin file upload (`file`, `input_file`, `file_id` no soportado), images inline sí; gateway proxy mode requiere `GATEWAY_PROXY_URL` |

→ **Esfuerzo: Medio.** Empieza a partir de `generic-openai` base.

### 5.4 DeepSeek Harness (dsh)

| Ítem | Detalle |
|---|---|
| Install | `npx @deepseek-ai/dsh web` (Node 22.19+/24+, pnpm 11.7), alterna `git clone … && pnpm run build && pnpm dsh web` |
| Runtime | Cordis meta-framework: every capability is plugin (`models, tools, skills, sessions, sandboxes, storage, loop, scheduling, UI`). Web UI + trajectorias + plugin registry 1.7k ecosystem. |
| Endpoints | `http://127.0.0.1:3080` (default), Settings → Models requiere DeepSeek API key (o cualquier OpenAI-compat endpoint). APIs **developer preview** (unstable). |
| Model | Dogma `Agent=Model+Harness`; dsh sin model es shell vacía. Model route es plugin: DeepSeek V4-Pro/Flash o cualquier `base_url` OpenAI-compat. |
| Integration | Doc oficial insta `npx …`, source `deepseek-ai/deepseek-harness`. Mismo path que hermes: implementar como `OpenAI-compat + file/plugins extensions`. Evaluar community wrappers (`dsh-plugin` topic). Riesgo: APIs cambiarán antes de stable; condicionar adapter a `CapabilityProfile.offlineCacheSafe=false` hasta freeze. |
| Pricing trap | DeepSeek API anunció subida sustancial 2026-08-17 (cache cost especialmente) — no bloquea adapter pero afecta docs de usuario. |

→ **Esfuerzo: Medio, pero con riesgo de churn.** Esperar SDK estable.

### 5.5 Claude Code

| Ítem | Detalle |
|---|---|
| Headless | `claude -p "prompt" --print [--output-format json]` (stdin piped → `cat README | claude -p "summarize"`), `--max-turns`, wall-clock timeout requerido. JSONL stream → file. |
| SDK | `npm i @anthropic-ai/sdk` → `client.messages.create({model, messages, max_tokens, stream:true})` streaming SSE 9 tipos (`message_start`, `content_block_delta`, `message_stop` etc.), `input_json_delta` para tool calls (concat hasta `content_block_stop`). |
| MCP | Cliente y servidor MCP (ver gemini-cli §, pero Claude Code expone MCP). |
| Server | No oficial; community `chuyun-code/claude-code-headless-server` (Phase 1, HTTP wrapper). No estable. |
| Integration | 2 caminos: (a) Bundlear wrapper headless en `desktop-app`: `spawn claude -p --output-format json` + exponer HTTP (más fiel), (b) usar Anthropic Messages API directamente como `generic-anthropic` adapter (pierde `CLAUDE.md`+ memory del harness, solo model). Recomendado: (a) como `ClaudeCodeHeadlessBridge` detrás de `/shell/harness/claude-code`, con token caps y idempotency prompt header. |

→ **Esfuerzo: Medio-alto.** Necesita bridge; headless UX distinto (fire-and-forget sin sessions persistentes por default).

### 5.6 Codex

| Ítem | Detalle |
|---|---|
| Docs | `codex-rs/docs/codex_mcp_interface.md` — MCP JSON-RPC over stdio (`codex mcp-server` / `codex-mcp-server`) |
| Protocol | `app-server-protocol/src/protocol/{common,v1,v2}.rs`, experimental, change without notice. v2 RPC: `thread/start`, `turn/start`, `turn/interrupt`, `thread/list`, `thread/read`, `model/list` (paginado con `cursor`), `getConversationSummary` legacy. Tipos en `app-server/` |
| Transports | `stdio` line-delimited JSON-RPC 2.0; `inspect` con `npx @modelcontextprotocol/inspector codex mcp-server` (`tools/list` → `codex` + `codex-reply`) |
| MCP | Codex además consume `~/.codex/config.toml: [mcp_servers.*]` y `AGENTS.md: "Always use the … MCP server"` |
| Integration | Desktop shell bridge (`codex mcp-server` child + WS proxy + `WebSocketTracker` ticket similar a `ptyx.rs` ya en desktop). Mapper `thread/turn` → `Session/MessageEnvelope` es natural (`turn` es `message`). Auth: local `codex login`. |

→ **Esfuerzo: Alto** (stdio bridge requerido, spec experimental).

### 5.7 Gemini CLI

| Ítem | Detalle |
|---|---|
| Interés | No es productor server; es **consumidor** de MCP (`discoverMcpTools()` → `mcp-client.ts` → `DiscoveredMCPTool` en `packages/core/src/tools/`). Transports: stdio, SSE, streamable HTTP (`settings.json: mcpServers`). |
| Integration | No adapter como source de sessions; en cambio, **gemini-cli es un sink de tools** (si tu adapter expone MCP tools, gemini-cli podrá consumirlos, no al revés). Para rar control, gemini-cli no aporta server-specific value. |

→ **Esfuerzo: No server.** Tratar como companion/consumer; no en roadmap server.

### 5.8 Aider

| Ítem | Detalle |
|---|---|
| Core | `python -m pip install aider-install`; `aider --model openai/...|anthropic/...|ollama/...` |
| Bridge | `danielscholl/aider-mcp-server` (Python 3.10+, uv, `aider_mcp_server`): tools `ai_code` (one-shot coding task con git validation) + `get_models` (`substring` filter). Transports `sse` (`:8050`) o `stdio`. Env `OPENAI_API_KEY/ANTHROPIC_API_KEY/GEMINI_API_KEY`, `--editor-model gemini/gemini-2.5-pro…`, `--cwd`. Config `.mcp.json: {mcpServers:{aider-mcp-server:{type:stdio, command:uv,…}}}` |
| Integration | Más simple que todos: one-shot `ai_code` → no session streaming, solo request/response. Para app, mapear `sendPrompt → ai_code` (texto único) + polling del diff git. Ideal como *adapter demo* para validar plumbing sin SSE. |

→ **Esfuerzo: Bajo.** Demasiado simple para ser driver de abstracción, pero perfecto para MVP second adapter si Pi RPC parece mucho.

### 5.9 Continue

| Ítem | Detalle |
|---|---|
| Estado | `continuedev/continue` read-only, archived (35.6k ⭐, Apache 2.0). Final 2.0.0 (telemetry removida, auth removida). |
| Former | VS Code/JetBrains extension + CLI + Hub + Mission Control (cloud). `config.yaml`: `models`, `rules`, `context` providers (`@codebase`, `@docs`, `@terminal`, `@git diff`), `mcpServers` (stdio/sse/streamable-http), `prompts`. |
| Integration | No server headless independiente; su lógica vive en extensión host. No adapter sensible. |
| Recomendación | No implementar; documentar como *ex-MCP consumer* y redirigir a Cursor. |

→ **Esfuerzo: Archivado.** No roadmap.

### 5.10 Cursor

| Ítem | Detalle |
|---|---|
| Producto | VS Code fork propietario + `cursor-agent` background agents (API privada, no documentada). MCP en `.cursor/mcp.json` (`stdio/sse/streamable-http`). |
| Bridges | `samuelbalogh/cursor-background-agent-mcp` (TS, SOLID) → tools `launchAgent`, `listAgents`, `listModels`, `addFollowup`, `getAgentConversation`, `getAgentStatus` (STDIO + HTTP `/manifest`, `/tool-invoke`, `/resource`), community wrappers `cursor-agent-api`, `codex-mcp-server` via Cursor. |
| Integration | A menos que Cursor publique API pública de agents, no hay adapter first-party. El community MCP es viable pero inestable y depende de reverse engineering. No recomendar como harness base. Si se quiere, bounding box: solo para equipos que ya pagan Cursor Pro y quieren background agents desde la APK. |

→ **Esfuerzo: Alto + frágil.** Prioridad baja.

### 5.11 OpenHands

| Ítem | Detalle |
|---|---|
| Server | `openhands-agent-server` (`software-agent-sdk`): `REST + WS` en `:8000`, file store `conversations/{id}/events`, OpenAPI en `/docs`, auth `OH_SESSION_API_KEYS_*` → `X-Session-API-Key`, CORS `OH_ALLOW_CORS_ORIGINS_0`, webhooks buffered (10 events, 3 retries 5s), secrets handling (masked, not persisted across restart sin `OH_SECRET_KEY`/stable key), readiness `/ready`, `/server_info`. Endpoints clave: `GET /conversations/search`, `POST /conversations`, `GET|DELETE /conversations/{id}`, `GET|POST /conversations/{id}/events`, `WS …/events/socket`. Event schema: discriminated unions (new `action/observation/tool` variants over time → clients must tolerate unknown discriminators). |
| Workspace | Abstracción `Workspace` (Local vs Remote). `LocalWorkspace` (direct FS), `RemoteWorkspace` (HTTP delegation → `DockerWorkspace` / `APIRemoteWorkspace`), factory `Workspace({working_dir vs host/runtime})`. Runtime client: bash + IPython + Playwright Chromium en sandbox. |
| Integration | Adapter relativamente completo: `REST` para sessions/events + `WS` para streaming real-time (equivalente a nuestro `useSSE` WS branch). Deltas son `action Execution API` (REST dentro del sandbox: bash, python, browser). Mapper `events → MessageEnvelope` exige `OpenAPI` discriminated parsing. Desktop-app ya tiene `ptyx.rs` WebSocket manual (RFC6455) — reutilizable. |

→ **Esfuerzo: Medio-alto.** Specced bien, pero discriminated schema exige defensive coding + versioning.

### 5.12 SWE-agent / SWE-ReX / mini-swe-agent

| Ítem | Detalle |
|---|---|
| Core | `pip install swe-agent` → `swe-agent run --model gpt-4 --repo-path --problem-statement`. Arquitectura Agent-Computer Interface (ACI). |
| Runtime | **SWE-ReX** expone FastAPI server mappando `AbstractRuntime` interface (`/api/endpoints`). No es harness conversacional; es ejecución sandboxed. |
| Batch nature | Diseñado para benchmarks (SWE-bench), trajectories offline + inspector, no sessions interactivas persistentes para APK. `mini-swe-agent` sucesor más simple. |
| Integration | No adapter streaming/sessions; útil como `ToolBundle` (si se quisiera orquestar), pero no como chat harness. Documentar como *research harness* fuera de scope chat UI. |

→ **Esfuerzo: No chat-oriented.** Excluir de roadmap fase 1-3.

### 5.13 Inflection Pi — conclusión

No es harness developer: consumer chat (`pi.ai`). Inflection Chat API es `inflection_3_*` chat completions enterprise (`layercake…`), sin codebase tools. **Exclusión explícita** para evitar ruido de naming con `earendil-works/pi`.

---

## 6. Tabla comparativa resumen (patrón API)

| Dimensión | opencode | pi | hermes | deepseek (dsh) | claude code | codex | aider (mcp) | openhands |
|---|---|---|---|---|---|---|---|---|
| **Sessions** | ✅ REST `GET/POST /session` + `x-next-cursor` | ✅ JSONL files `~/.pi/sessions` + fork/branch | ⚠️ `conversation` (estado en `previous_response_id`) + `runs` | ✅ plugin sessions (preview) | ⚠️ solo TUI local | ✅ `thread/start/list/read` | ❌ one-shot |
| **Messages** | ✅ `MessageEnvelope {info,parts}` | ✅ JSONL `entries` tree | ✅ OpenAI `messages[]` + tool calls | ✅ plugin messages | ✅ `messages.create` raw | ✅ `turn/start` | ✅ `ai_code` prompt |
| **Streaming** | ✅ SSE `/event` (deltas+updated) | ⚠️ JSONL lines / RPC | ✅ OpenAI SSE + `tool.progress` | ✅ web UI stream | ✅ Anthropic SSE (9 events) | ⚠️ MCP notifications | ⚠️ SSE `:8050` |
| **Tools** | ✅ 13+ built-in + MCP | ✅ 4 + extensions | ✅ full agent tools via OpenAI spec | ✅ Cordis plugins | ✅ MCP | ✅ MCP stdio | ✅ 2 tools |
| **File ops** | ✅ full (`file/status/diff/find`) | ✅ 4 primitives | ✅ via openAI tools | ✅ workspace plugins | ✅ via MCP | ✅ via MCP | ⚠️ inside `ai_code` only |
| **Auth** | Basic | API keys/OAuth | Bearer (mandatory) | DeepSeek API key | Anthropic key | ChatGPT OAuth | env keys |
| **Transport** | REST + fetch/Reader SSE | **stdio JSONL-RPC** | REST+S SSE | REST (preview) | CLI headless / SDK | **stdio MCP** | SSE/stdio |
| **Offline cache** | ✅ IndexedDB v2 merge-only | ⚠️ local file ≡ cache | ❌ API-cloud | ❌ local runtime | ❌ | ❌ | ❌ |
| **Estabilidad** | ✅ 1.18.x + v2 beta | ✅ Active (95k⭐) | ✅ MIT active | ⚠️ Preview | ✅ Official | ⚠️ Experimental | ⚠️ Beta |
| **Esfuerzo adapter** | — | **Bajo-medio** | **Medio** | **Medio** | **Medio-alto** | **Alto** | **Bajo** |
| **Relevancia para APK** | ⭐⭐⭐ Baseline | ⭐⭐⭐⭐ Muy alta | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐ | ⭐ |

Leyenda: ✅ nativo completo · ⚠️ parcial/bridge requerido · ❌ no aplicable

---

## 7. Roadmap priorizado (por fases, accionable)

### 7.1 Criterios de priorización

- **Proximidad al patron opencode** (REST+SSE+Basic auth) → menor riesgo.
- **Existencia de server HTTP documentado y estable** (no stdio-only experimental).
- **Stars/community momentum** como proxy de longevidad (pi 95k > aider 3 > codex experimental).
- **Costo de bridge** (stdio→HTTP) y necesidad de cambios en `desktop-app` Rust.
- **Estabilidad** (preview APIs se evitan hasta freeze).

### Fase 0 — Consolidación (1-2 semanas, sin nueva feature user-visible)

> Objetivo: cimentar la abstracción sin romper lo existente.

- [ ] Extraer `IFileOps`/`IModelRegistry`/`IPermissionGateway` en `features/chat/application/ports.ts` (añadir métodos, mantener `IMessageRepository`/`ISessionRepository`/`IEventStream` actuales).
- [ ] Refactorizar `shared/api/client.ts` a `Transport` con `AuthHandler` (Basic sigue siendo default). Mantener 100% backward compat con `request()`/`requestWithHeaders()` re-exportes.
- [ ] Introducir `shared/harness/kind.ts` + `capabilities.ts` sin usarlos aún (solo tipos + `capabilityMatrix`). Tests `.test.ts` con matriz 7 harneses; 0 runtime impact.
- [ ] Añadir `HarnessProvider` (React context) en `app/providers/harness.provider.tsx` wrapping `ServerConfig + detected kind`. Montar en `App.tsx` adelante de `useConfig` sin reemplazar todavía (dual-read, log discrepancies).
- [ ] Métrica de éxito: `pnpm test` + `cargo check` verdes; ningún cambio en `App.tsx` God (>350 rule se mantiene, deuda documentada).

### Fase 1 — Segundo adapter validando abstracción (3-5 semanas) — **PRIORITARIA**

**Target: `pi` (`earendil-works/pi`)**

> Por qué pi primero y no hermes: pi valida el extremo más distinto (stdio JSONL-RPC, 4 tools, branching sessions) y obliga a que la abstracción soporte *non-HTTP* sin caer en happy path OpenAI-compat. Si pi cabe, hermes cabe.

- [ ] `adapters/pi/rpc.client.ts`: cliente WS/HTTP bridge que habla `pi --mode rpc` (LF-delimited JSONL, comandos `prompt/steer/compact/set_model/bash`, eventos `token/tool_execution/compaction`). Implementar 2 transports: `WsRpcTransport` (desktop-app child) + `HttpRpcTransport` (Node wrapper `http://127.0.0.1:3300` community style). Reuso de `desktop-app/src/ptyx.rs` WS handshake (ya hace binary chunked 16KB + ring buffer 2MB).
- [ ] `adapters/pi/mapper.ts`: `PiEntry {id,parentId,type,role,content,tool}` → `MessageEnvelope` (`parts[]` + `info.role/time`). Probar branching: `mergeMessages` debe tolerar gaps de `parentId` sin perder `extraLocal parts`.
- [ ] `adapters/pi/session.ts`: `listSessions()` = scan `~/.pi/agent/sessions` (via bridge `GET /shell/harness/pi/sessions` en Rust) + `createSession` = `spawn pi --session-dir <tmp>` + `rememberApiVersion analogy` con `rememberHarnessKind`.
- [ ] `adapters/pi/sse.ts`: emula SSE events canónicos desde JSONL stream (`token → message.part.delta`, `tool_execution → message.part.updated`, `compaction → message.part.delta type=compaction`).
- [ ] `shared/harness/detection.ts`: extender probe para pi (`GET /shell/harness/pi/health` si desktop || `fetch http://host:pi_port/health` si remote bridge).
- [ ] UI switches: `SettingsPanel > ServerKind selector` (Auto → opencode / pi / auto) reemplazando hoy `ServerVersion Auto/v1/v2` toggle. Mantener fallback interop.
- [ ] Offline: namespacing IndexedDB `openher:pi:*` para no colisionar con opencode stores.
- [ ] Tests: `features/chat/domain/chat.service.test.ts` ya 100% passer; añadir `adapters/pi/mapper.test.ts` (20+ cases: branch, fork, image parts stub) + e2e `harness:detection.test.ts`.
- [ ] Deliverable: usuario puede agregar un `ServerProfile kind=pi` en `hooks/useServers`/`ServerProfileModal` y chatear contra pi remoto con paridad funcional `sendPrompt + loadMessages + streaming`. WriteFile opcional (pi sí soporta, pero detrás de capability gate).

*Fallback rápido:* si RPC bridge resulta caro, usar `aider-mcp-server` como smoke adapter (2h) para validar factory → hermes.

### Fase 2 — Expansión OpenAI-compat + DeepSeek (4-6 semanas)

**Targets: `hermes-agent` + `deepseek-harness` en un solo sprint (comparten base OpenAI-compat)**

- [ ] `adapters/generic-openai/client.ts`: abstract base OpenAI-compat (ejemplo: `POST /v1/chat/completions {model,messages,stream,tools}`, `GET /v1/models`, Bearer auth). `parseSSEChunk` ya genérico en `shared/sse/client.ts` → extender para `data: [DONE]` sentinel + `choices[0].delta.tool_calls[].function.arguments` partial JSON concat (same que `claudeapi.com` doc: `delta.partial_json` until `content_block_stop`).
- [ ] `adapters/hermes/{client,mapper,sse}.ts` sobre generic-openai: añade mapping `hermes.tool.progress` → `SSEEvent type=tool_progress` (render en `ToolPart`), `POST /v1/runs` + `POST .../approval` + `POST .../stop` (para PermissionPrompt). Auth Bearer mandatory + `Idempotency-Key` header pass-through.
- [ ] `adapters/deepseek/client.ts` sobre generic-openai: Cordis plugin prefs passthrough (`models.json` bridge), `GET /health` probe, guard `developer-preview` banner en Settings.
- [ ] Bulk de `capabilities.ts`: `generic-openai` = `{sessions:false, messages:true, streaming:'sse', toolCalls:true, fileRead: limited, fileWrite: false}` (por default cloud endpoint sin workspace).
- [ ] Desktop: `/shell/harness/proxy` CORS bypass para `OPENCODE_SERVER_PASSWORD` vs Bearer (ya existe `ANY /shell/proxy?url=` cap 16MB + CSP stripping).
- [ ] Tests: `generic-openai` contract tests con snapshot de SSE `choices[].delta` → `MessageEnvelope`.

### Fase 3 — Bridges stdio → HTTP para harnesses no nativos (6-10 semanas, opt-in)

**Targets: `codex` (MCP stdio) + `openhands` (WS) + evaluativo `claude-code headless wrapper`**

- [ ] Desktop Rust `infrastructure/http/harness_router.rs` (vaciar deuda `api.rs` if chain): routes `GET /shell/harness/:kind/health`, `POST /shell/harness/:kind/rpc`, `WS /shell/harness/:kind/events`, `POST /shell/harness/:kind/proxy`. Implementar supervisor de child processes (`pi --mode rpc`, `codex mcp-server`, `aider-mcp-server --editor-model …`) con restart + ring buffer (patrón `ptyx.rs` 2MB condvar ya probado).
- [ ] `adapters/codex/mcp_stdio.bridge.ts`: JSON-RPC 2.0 line-delimited over stdio traducido a `IEventStream`. Usar `WebSocketTracker` ticket corto como `app-server-protocol` espera.
- [ ] `adapters/openhands/{client, ws}.ts`: `WS /conversations/{id}/events/socket` → `SSEEvent` mapping con discriminated unions (tolerar `unknown discriminator` sin crash). HTTP `GET /docs` OpenAPI para probe, headers `X-Session-API-Key`.
- [ ] `adapters/claude-code/headless.bridge.ts` (opt-in): wrapper `claude -p --output-format json` detrás de `POST /shell/harness/claude-code/prompt`. No es server persistente → simular sessions con file append + `--max-turns` + token cap. Documentar como *experimental*.
- [ ] UI: capability-driven degradation (`fileWrite=false` → `FileEditor` disabled con tooltip; `permissions=false` → `PermissionPrompt` hidden).
- [ ] Security review: stdio bridges ejecutan código arbitrario → requerir `allowlist` + `read-only` mode (`readOnlyTools`) por default, con toggle explícito en `SettingsPanel`.

### Backlog explícito (no hacer en 2026-H2)

| Item | Razón |
|------|-------|
| `continue` adapter | Repo archivado read-only; no server propio; su lógica ya es MCP consumer. No ROI. |
| `cursor` background agents adapter | API privada no documentada; reverse-engineering frágil. Si se necesita, esperar API oficial de Cursor. |
| `gemini-cli` como harness server | No es server; es consumer. No adapter. |
| `swe-agent` chat UI | Batch/research harness (SWE-bench), no sesiones interactivas streaming; relegate a trayectory viewer futuro. |
| `inflection pi` consumer | No harness; si se quiere chat consumer, usar `generic-openai` con Inflection Chat API como `generic-openai` profile (low priority). |
| Soporte iOS standalone para stdio harnesses | iOS no permite child processes arbitrarios; pi/codex bridges requieren desktop Windows host. Documentar: "harnesses stdio requieren desktop-app como host". |

### Métricas de salida por fase

| Fase | Métrica éxito |
|------|---------------|
| F0 | 0 regressions en `pnpm test:{ui,settings,model,i18n}` + `cargo check`; `ServerKind` types compiles |
| F1 | Usuario con `ServerProfile kind=pi` puede crear session, enviar `prompt`, recibir streaming deltas, ver diffs + file browser contra pi remote host (via desktop bridge) |
| F2 | `hermes` + `deepseek` adapters pasan contract tests con mock SSE; `deepseek` banner preview visible |
| F3 | `codex` bridge e2e local `thread/start → turn/start → WS delta` visible en APK; `openhands` WS events llegan a `useSSE` sin perdidas en 95% casos (chaos test: firewall drop 10s → reconnect) |

---

## 8. Riesgos, trampas y decisiones (heredando architecture.md + nueva evidencia)

### 8.1 Trampas heredadas que se agravan con multi-harness

| # | Trampa (architecture §9) | Agravante multi-harness | Mitigación |
|---|---|---|---|
| 1 | `npx cap copy` EPERM en `app-icon.png` → `python copy-dist.py` | Nuevo: harnesses stdio requieren binaries (`pi`, `codex`, `aider`) en PATH en desktop-host; `pnpm` versions difieren (web 10.32, od-web 10.33, pi mono pnpm 11.7) | Pin `engines.pnpm` por workspace, script `scripts/copy-dist.py` extensible a `copy-harness-bridges.py`; Rust `srvman.rs` verifica binaries con `which` |
| 2 | Server v1 solo `message.part.delta` 1.18.x — no duplicar handlers v2 sin dedupe | Hermès `tool.progress` + Anthropic `content_block_delta` son otras fuentes de delta — riesgo triple dedupe | `createEventRouter` (handler.ts) registra `isDeltaEvent` por `kind` (registry en `capabilities.ts`), no global |
| 3 | Type del evento dentro JSON, no en `event:` line | OpenAI `event: content_block_delta\ndata: {type…}` vs pi JSONL sin `event:` | Parser por adapter: `opencode: createSSEFrameParser`, `hermes: openaiSseParser`, `pi: jsonlLineParser` → todos normalizan a `SSEEvent` |
| 4 | `refreshSessions` traga errores; backoff solo lanzando desde callback `offline` | Cada adapter tiene su lista de errores retryable (hermes 429? `RateLimitError`, openhands `overloaded_error`) | `serializedSize`/`recordDataUsage` ya centralizado; añadir `isRetryable(error, kind)` matrix |
| 5 | No bajar `DB_VERSION=2` (merge-only) | Nuevos harness shapes pueden escribir esquemas diferentes en IndexedDB | Namespacing `DB_VERSION` por harness o prefix keys `openher:${kind}:sessions` manteniendo `DB_VERSION=2` |
| 6 | `deploy-quick.ps1` `Out-Null` oculta errores | `build-desktop.ps1 -SkipWeb -Run` oculta bridge crash (`pi --mode rpc` EOF) | Detach con log file `data/harness-${kind}.log` visible en `window.__OPENCODE_DESKTOP__` bridge health panel |
| 7 | v2 prompt rechaza `model/agent` en body 400 | Hermes exige `model` en cada `chat/completions` body; openhands rechaza `model` en `questionReply` sin `sessionID` | `toModelBody`/`toCreateSessionModel` por adapter; 400 mapped → `responseDetail` humanizable |
| 8 | hover-only fallback `@media (hover:none)` | ToolPart expand/collapse, `PermissionPrompt` deben ser touch-first en APK aun si adapter desktop | Sin cambio: test `test:ui` ya cubre |

### 8.2 Nuevos riesgos introducidos por harness-agnostic

1. **Compatibilidad `DataMode` (Full/Saver/Ultra/Miser) vs tool streaming:** Hoy `stripNonEssential` descarta `tool_parts` no file/shell en modes no-Full. Un adapter con `toolStreaming===true` (hermes `tool.progress`) debe respetar el mismo corte; de lo contrario, Miser consumirá 3× data. Implementar `capabilityAwareStrip(msg, dataMode, kind)` antes de `cacheMessages`.

2. **Estimación de tokens/costo unificada:** Cada harness reporta tokens distinto: opencode (`TokenUsage {input,output,reasoning,cache{read,write}}`), Anthropic (`input_tokens/output_tokens`), OpenAI (`usage: {prompt,completion,total}`), OpenHands (agregados `by_model/project/day`). Mantener `entities/message/model.ts: TokenUsage` canónico y mapper por harness que convierta `usage` del provider. `opencode-stats :8765` es específico a `opencode.db` WAL read-only; no generalizable → nuevos harnesses reportan stats via su adapter `GET /api/data` analog o `statsx` disabled.

3. **Seguridad**: stdio bridges (`codex mcp-server`, `pi --mode rpc`) ejecutan `bash` tool con capacidades completas. Desktop shell hoy no tiene fences para `/shell/pty` más allá de HTTP. Reutilizar `opencode-stats: auth.json`-style secrets + `OPENCODE_SERVER_PASSWORD` gating para `/shell/harness/*` (403 si `OH_SECRET_KEY` no set). Log `api.rs: authorizationLayer` pattern con Effect Layer pero en Rust `state.rs`.

4. **Polling vs SSE vs WS tradeoffs:** `usePolling` hoy acelera cuando SSE vivo (`streamActive` ⇒ polling rápido). Con WS (openhands) hay dual channel (REST + WS). Con JSONL (pi) el stream *es* el RPC. Abstracción `IEventStream` debe exponer `shouldPollFallback(): boolean` por adapter para no duplicar polling donde WS ya es push.

5. **Observability:** Tray de `desktop-app` (Abrir/Salir) + `statsx::ensure :8765` deben incluir `harness health` widget (verde/amarillo/rojo por kind) para que el usuario vea que `pi --mode rpc` murió.

6. **Licencia/distribution:** `od-web/` (OpenDesign vendorizado 12.8k files) ya tensiona tamaño repo (documentado `D13`). Añadir `deepseek-harness` como dependency (si git submodule) empeora. Preferir HTTP bridge externo sobre vendoring; no agregar `od-web`-style hosting para pi/hermes.

7. **iOS capacitor constraints:** APK Gradle `copy-dist.py` step + Xcode `capacitor.config.ts` no corren child stdio harnesses. Documentar: `generic-openai` y `opencode` funcionan en móvil puro; `pi/codex/openhands-local` requieren desktop-host con Tailscale (ya establecido `D6` — Tailscale mesh obvia public ports).

---

## 9. Decisiones arquitectónicas propuestas (ADRs breves)

| # | Decisión | Alternativa descartada | Justificación |
|---|---|---|---|
| D16 | **Harness como capability-profile + adapter factory, no plugin runtime** | Cordis-style todo-es-plugin (deepseek) dentro de web | Web es thin client; hacerlo plugin runtime JS complica auth y offline cache. Factory + ports ya probado con `features/chat` hexagonal (96 tests). |
| D17 | **ServerKind como union string extendible, detección auto con probeSequence** | Enum Rust + compile-time feature flags | JS necesita runtime discovery; `host:port` memo igual que `version.ts` (evita breaking change). |
| D18 | **Bridges stdio alojados en desktop-app Rust, no en web** | Web spawnea child `pi` vía Tauri-like IPC | Web no tiene `child_process` en APK/iOS; desktop ya tiene `tiny_http + wry + ptyx.rs` y proxéa `:4848→:4849→:8765`. Reuso natural. |
| D19 | **IndexedDB namespaced por kind, DB_VERSION permanece 2** | Stores separados por harness | Stores separados requiere migración DB_VERSION=3 y riesgo de recreación bug (§2.4 bug corrupta DB sin stores). Namespacing por key prefix es no-destructivo. |
| D20 | **generic-openai como adapter base reutilizable** | Adapter por endpoint duplicado (hermes≠deepseek) | 8 de 13 harneses exponen OpenAI-compat como façade (hermes, deepseek, openrouter, etc.). Base reduce duplication. |
| D21 | **No reimplementar protocolos MCP/A2A en web** | Exponer MCP client directamente en UI | MCP es *extension* layer (tools/resources/prompts). La UI de chat no necesita hablar MCP; necesita que el harness ya hable MCP y exponga results como `tool_result` parts. Harness bridges resuelven retrocompat. |

---

## 10. Próximos pasos accionables (checklist propietario)

Para que otro agente (o vos) pueda retomar sin releer todo:

### Inmediatos (no code, solo validar supuestos)

- [ ] Confirmar naming final: `ServerKind.pi` = `earendil-works/pi` (no Inflection Pi). Actualizar `hooks/useServers` display name en `ServerProfileModal` para evitar confusión usuario.
- [ ] Auditar `desktop-app/src/api.rs` 1370 lines y planear split a `infrastructure/http/{health_router, harness_router, fs_router, pty_router}.rs` (inversión que desbloquea bridges). Estimación: 1-2 días.
- [ ] Probar manualmente: lanzar `npx @deepseek-ai/dsh web` local + sniff OpenAPI (`/doc`) para confirmar endpoints antes de sketchear adapter deepseek (nuestra evidencia es de docs secondary, no de spec directo).
- [ ] Probar `hermes gateway --help` + `GET /v1/models` con key dummy para confirmar error `401` shape y ajustar `BearerHandler`.

### Corto plazo (F0-F1 code)

- [ ] **PR F0-A:** `shared/harness/kind.ts + capabilities.ts + harness.provider.tsx` (solo types, no runtime switch). Label `refactor`.
- [ ] **PR F0-B:** `shared/api/client.ts → Transport/AuthHandler` refactor (internal only, API pública intacta). Tests `client.test.ts` verdes.
- [ ] **PR F1 (pi smoke):** `adapters/pi/*` + `desktop-app: pty bridge` + `SettingsPanel kind selector`. Feature flag `harnessPi` (13 flags → 14) default `false`.

### Mediano plazo (F2-F3)

- [ ] **PR F2-A:** `adapters/generic-openai` + `adapters/hermes`. Flag `harnessHermes`.
- [ ] **PR F2-B:** `adapters/deepseek` (depende de stable spec check).
- [ ] **PR F3:** `harness_router.rs` + `adapters/codex + openhands + claude-code-headless`. Flags separados.

### Documentación

- [ ] Actualizar `architecture.md §2.2/§2.3` y `AGENTS.md` REGLAS CRÍTICAS con `ServerKind` y `/shell/harness/*` contracts.
- [ ] Actualizar `docs/perf-architecture.md` con costo de polling por harness y `DataMode` aware strip.
- [ ] Añadir `docs/harness-bridge.md` (runbook para `pi --mode rpc` y `codex mcp-server` en desktop-host).

---

## 11. Fuentes verificadas (selección)

| # | Fuente | Qué valida | Confianza |
|---|---|---|---|
| 1 | `opencode.ai/docs/server/` (live 2026-08-23) + `deepwiki sst/opencode/2.6 HTTP Server and API` | Tabla de APIs `/global/health`, `/session/*`, `/file/*`, `/mcp`, `/tui/*`, `/event` + Effect HttpApi architecture + OpenAPI 3.1 `/doc` | Alta (oficial + source) |
| 2 | `earendil-works/pi` README + `packages/coding-agent` docs + `pi.dev` + `docs/rpc.md` | Four tools/modes, sessions JSONL tree, 15+ providers, SDK `createAgentSession`, RPC 26+ cmds, Extensions npm | Alta (repo oficial 95k⭐) |
| 3 | `NousResearch/hermes-agent` `api-server.md` (`website/docs/user-guide/features/api-server.md`) + `hermes-agent.nousresearch.com/docs/user-guide/features/api-server` | `API_SERVER_ENABLED`, `/v1/chat/completions`, `/v1/responses`, `/v1/runs/{id}/approval/stop`, `/v1/models`, SSE + `tool.progress`, Bearer + idempotency + CORS | Alta (official) |
| 4 | `deepseek-ai/deepseek-harness` GitHub + `deepseekharness.io` + `deepseek.com/harness/en/` + `harness-list.com` | `npx @deepseek-ai/dsh web` `:3080`, Cordis everything-is-plugin, developer preview 2026-08-13, MIT, 30k⭐, Node 22.19+ | Alta |
| 5 | `google-gemini/gemini-cli` `docs/tools/mcp-server.md` + `geminicli.com/docs/tools/mcp-server` | `discoverMcpTools()` stdio/SSE/streamable HTTP, `DiscoveredMCPTool`, transition Antigravity 2026-06-18 | Alta |
| 6 | `openai/codex` `codex-rs/docs/codex_mcp_interface.md` + `developers.openai.com/codex/mcp` | `codex mcp-server` JSON-RPC stdio, `thread/*` + `turn/*` + `model/list` v2, experimental | Alta |
| 7 | `continuedev/continue` `github.com/continuedev/continue` (35.6k⭐, read-only) + `aiwiki.ai/wiki/continue_dev` + `docs.continue.dev` | Archivado 2.0.0, VS Code/JetBrains/CLI, `config.yaml/mcpServers`, bought by Cursor | Alta |
| 8 | `All-Hands-AI/OpenHands` `software-agent-sdk/openhands-agent-server` + `docs.openhands.dev/sdk/arch/agent-server` + `deepwiki All-Hands-AI/OpenHands` | `openhands-agent-server` REST+WS `:8000`, `/conversations/{id}/events/socket`, `X-Session-API-Key`, Workspace abstraction, event discriminated unions | Media-alta |
| 9 | `danielscholl/aider-mcp-server` README + `mcp.so` + `deepwiki disler/aider-mcp-server` | `sse` (`:8050`)/stdio, tools `ai_code`+`get_models`, env keys, `--editor-model` gemini | Media |
| 10 | `samuelbalogh/cursor-background-agent-mcp` + `fast.io/resources/cursor-mcp-server-setup` + `cursor.com/docs/cli/mcp` | `.cursor/mcp.json` stdio/sse/streamable-http, tools `launchAgent`/`listAgents`/`listModels`, `STDIO` + `HTTP /manifest` | Media (community) |
| 11 | `SWE-agent/SWE-agent` `swe-agent.com` + `SWE-ReX deepwiki/5.1-api-endpoints` | `pip install swe-agent`, `swe-agent run`, SWE-ReX `AbstractRuntime` FastAPI, `mini-swe-agent` sucesor | Alta |
| 12 | `architecture.md` (repo) 399 lines + `CATALOGO.md` 719 lines + `web/src/shared/api/{client,version,mappers}` + `features/chat {domain,ports,infrastructure}` | Validación de FSD + hex actual, SSE watchdog, DB_VERSION=2, App.tsx God debt | Alta (primary source) |
| 13 | `github.com/api-evangelist/inflection` (Pi) | Inflection Chat API `layercake.pubwestus3…`, no harness developer | Media (tertiary profile) |

> **Gaps explícitos (info faltante/no verificada en ventana de research):**
> - OpenAPI spec completa de `deepseek-harness/dsh` preview: no expuesta en npm registry scrape; URL `/doc` no confirmada por fetch directo.
> - Operativas finas de `pi` RPC auth cuando `pi` corre sobre provider OAuth vs api-key (headers diferencia).
> - Community wrappers `claude-code-headless-server` contrato HTTP exacto (solo Phase-1 README spied).
> - Pricing/entitlement effect en generic OpenAI `usage` field mapping (cada provider reporta tokens distinto; falta sample real `deepseek` response).
> - Estado de `Antigravity CLI` post 2026-06-18 (sustituto de gemini-cli) — fuera de scope pero puede redefinir harness Gemini.

---

## 12. Anexo — ASCII detallado de flujo runtime (ejemplo pi via desktop bridge)

```
[APK/Android]                [Desktop Windows :4848]                 [pi harness]
      │                              │                                   │
      │  HTTPS (Tailscale)           │  child process                    │
      ├─ POST /shell/harness/pi/prompt {sessionID, text} ──────────►│spawn pi --mode rpc
      │  Authorization: Bearer ***    │  stdin: JSONL {type:"prompt",  │pi-agent-core loop
      │                              │           model, tools, content} │  read/write/edit/bash
      │  ┌ IndexedDB cache            │            │                     │     ▲
      │  │ openher:pi:sessions│  WS :4850  │  stdout: JSONL        │     │ tools
      │  └──────────────────┐         │ /events  ◄─┼──── {type:"token",   │     │
      │                     │ merge   │            │    delta:"hello"}    ◄─────┘
      │                     │ only     │            │  {type:"tool", name:"read"…}
      │  SSEEvent canonical◄─┼─────────┼────────────┼──────────────────────┘
      │  {id,type,props}   │         │  ringBuf 2MB condvar (ptyx.rs)     │
      │  message.part.delta│         │  normalized to                     │
      │  message.part.updated         │  SSEEvent {type:"message.part.delta", props:{partID,delta}}
      │                              │                                   │
      │  GET /shell/harness/pi/sessions  (scans ~/.pi/agent/sessions)     │
      │  PATCH /shell/harness/pi/model  (set provider via models.json)    │
```

---

## 13. Glosario rápido

| Término | Definición en este informe |
|---|---|
| **Harness** | Capa de runtime que convierte LLM → agente: tools, sessions, workspace, event loop, guardrails (ReAct). |
| **Adapter** | Implementación de `ServerAdapter` (ports) que mapea el wire protocol del harness a `MessageEnvelope`/`Session` canónicos. |
| **ServerKind** | Discriminator unión string para cada harness (`opencode`, `pi`, `hermes`, …). |
| **CapabilityProfile** | Matriz booleana de features que cada harness soporta; gatea UI y cache. |
| **Probe / Detection** | Health probing para auto-detectar `kind` por `host:port` (superset de `version.ts`). |
| **Bridge** | Proceso host (desktop-app Rust) que envuelve harness stdio (pi RPC, codex MCP) y lo expone como HTTP/WS. |
| **Generic-OpenAI** | Adapter base para endpoints `/v1/chat/completions` + `/v1/models` (hermes, deepseek-proxy, generic). |
| **SSE / WS / JSONL** | Transportes de streaming: Server-Sent Events (opencode/hermes), WebSocket (openhands), JSONL lines (pi). |

---

*Fin del informe. Propuesta lista para revisión técnica y apertura de RFC en `opencode-remote-android`. Para lectura complementaria: `architecture.md §2-3`, `web/src/shared/api/*`, `web/src/features/chat/*`, `desktop-app/src/ptyx.rs`.*
