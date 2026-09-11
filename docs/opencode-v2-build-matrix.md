# OpenCode V2 — Matriz de Conocimiento Unificada para Build

> **Documento maestro** generado el 2026-08-27 — combina 4 fuentes oficiales de `opencode.ai/v2/docs/build` en un solo artefacto enorme, listo para guiar el desarrollo de `opencode-remote-android`.
> Fuentes: `/build` (intro) · `/build/plugins` · `/build/client` · `/build/sdk` · Advertencia beta: API V2 puede cambiar antes de stable.

---

## Índice

1. [Mapa mental — qué camino elegir](#1-mapa-mental--qué-camino-elegir)
2. [Matriz comparativa Plugin vs Client vs SDK](#2-matriz-comparativa-plugin-vs-client-vs-sdk)
3. [Plugins — referencia completa](#3-plugins--referencia-completa)
4. [Client — `@opencode-ai/client`](#4-client--opencode-aiclient)
5. [SDK — `@opencode-ai/sdk` (embed)](#5-sdk--opencode-aisdk-embed)
6. [Patrones transversales (Transforms, Reload, Lifecycle, Storage)](#6-patrones-transversales)
7. [Hooks — intersección de operaciones vivas](#7-hooks--intersección-de-operaciones-vivas)
8. [Matriz de decisión para `opencode-remote-android`](#8-matriz-de-decisión-para-opencode-remote-android)
9. [Checklist de implementación y riesgos beta](#9-checklist-de-implementación-y-riesgos-beta)
10. [Apéndice — Snippets canónicos listos para copiar](#10-apéndice--snippets-canónicos)

---

## 1. Mapa mental — qué camino elegir

```
opencode.ai/v2/docs/build
├─ Extender OpenCode (mantener TUI/desktop) ──►  /build/plugins  → Plugin.define()
├─ Correr como servidor (tu UI/workflow) ──────►  /build/client  → OpenCode.make({baseUrl})
└─ Embedir dentro de tu app (sin HTTP) ───────►  /build/sdk     → OpenCode.create() + await using
```

**Regla de oro:**
- ¿Quieres añadir tools/integraciones/commands/agents sin reescribir OpenCode? **Plugin**
- ¿Quieres tu propia interfaz (ej. `opencode-remote-android` thin client) conectada por red? **Client**
- ¿Quieres producto developer completamente custom, sin hop de red, con control total? **SDK**

Los tres usan **mismo contrato HTTP** y tipos generados desde la referencia `/api`.

---

## 2. Matriz comparativa Plugin vs Client vs SDK

| Dimensión | **Plugin** (`@opencode-ai/plugin`) | **Client** (`@opencode-ai/client`) | **SDK** (`@opencode-ai/sdk`) |
|---|---|---|---|
| **Instalación** | `plugins: ["pkg", "./local.ts"]` en `opencode.jsonc` · auto-load `.opencode/plugins/` | `bun add @opencode-ai/client@beta` | `bun add @opencode-ai/sdk@dev` |
| **Dónde corre** | Dentro del proceso OpenCode (mismo servidor que TUI) | Fuera, habla por HTTP a `http://localhost:4096` | Dentro de tu proceso Node, router en memoria, sin listener HTTP |
| **Crea sesiones** | `ctx.session.create/prompt/generate/command/synthetic` | `client.session.create/prompt` | `opencode.sessions.create/prompt` (alias) |
| **Streaming** | `for await (const e of ctx.event.subscribe())` | `for await (const e of client.event.subscribe())` | `for await (const e of opencode.events.subscribe())` |
| **Customización** | Transforms (`catalog`, `agent`, `tool`, `mcp`, etc.) + Hooks | No transforma, consume | `OpenCode.create({plugins:[...]})` + `opencode.plugin(p)` post-start |
| **Headers/Auth** | Hereda del server | `OpenCode.make({headers, fetch})` + `Service.headers(endpoint)` | No aplica (en memoria) |
| **Service local** | N/A | `Service.ensure/discover/stop` (`@opencode-ai/client/service`) | N/A |
| **Ciclo de vida** | `setup(ctx) → cleanup` + `ctx.*.reload()` | Tu app gestiona `AbortSignal` | `await using opencode = await OpenCode.create()` o `await opencode.close()` |
| **Beta** | Sí (`beta`) | Sí (`beta`) | Sí (`dev` preview) |
| **Uso ideal para nosotros** | Añadir tools `read`/`write` custom, transformar models, exponer endpoint para Android | **Thin client Android/Capacitor ya usa esto** (REST+SSE) | Prototipar sin levantar `opencode serve` externo (tests, desktop shell Rust si quisiéramos embed) |

> **Nota para `opencode-remote-android`:** Hoy somos **Client puro** (thin client: toda la IA en `opencode serve`, app consume REST+SSE). Un plugin `acme` podría exponer `/shell/*` enriquecido sin tocar el upstream, y el SDK serviría para tests E2E sin levantar proceso.

---

## 3. Plugins — referencia completa

### 3.1 Carga

```jsonc // opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "opencode-acme-plugin",
    "opencode-acme-plugin@1.2.0",
    "@acme/opencode-plugin",
    "./plugins/local.ts",
    "../shared/plugin.ts",
    "/absolute/path/plugin.ts",
    "file:///home/me/plugins/local.ts",
    { "package": "@acme/opencode-plugin", "options": { "agent": "reviewer", "strict": true } }
  ]
}
```

- `.opencode/plugins/*.ts` → auto-load
- `plugins` → paquetes publicados, rutas relativas/absolutas, `file://`, o forma objeto con `options`

### 3.2 Esqueleto mínimo

```ts // .opencode/plugins/example.ts
import { Plugin } from "@opencode-ai/plugin"
export default Plugin.define({
  id: "example",
  async setup(ctx) {
    await ctx.storage.set("loaded", true)
  },
})
```

### 3.3 Lifecycle + Context

```ts
export default Plugin.define({
  id: "example",
  setup(ctx) {
    console.log(`loaded in OpenCode ${ctx.app.version}`)
    console.log(ctx.location.directory, ctx.location.project.canonical)
    console.log(ctx.options.strict) // ← desde opencode.jsonc {options}
    return () => console.log("unloaded") // cleanup
  },
})
```

- `ctx` = **server client ampliado** (mismos inputs/outputs que `@opencode-ai/client` + métodos plugin-only: transforms, hooks, reload, registrations, `ctx.options`)
- `ctx.location` = `{ directory, workspaceID?, project: {id, directory, canonical} }` — ubicación de *esta* instancia del plugin

### 3.4 Transforms — patrón central

> Cada `transform` se apila; `reload()` re-ejecuta todas en orden.

```ts
// Añade modelo
await ctx.catalog.transform((catalog) => {
  catalog.model.update("acme", "reasoner", (m) => {
    m.name = "Acme Reasoner"
    m.cost = [{ input: 2, output: 12, cache: { read: 0.2, write: 2 } }]
  })
})

// Filtra por presupuesto (ve lo que añadió el plugin anterior)
await ctx.catalog.transform((catalog) => {
  for (const p of catalog.provider.list())
    for (const m of p.models.values())
      if (m.cost.some(t => t.output > 20)) catalog.model.remove(m.providerID, m.id)
})
```

Con `reload` dinámico:

```ts
let models = await loadFromSource()
await ctx.catalog.transform((c) => { for (const it of models) c.model.update(it.providerID, it.id, m => { m.name = it.name }) })
const refresh = async () => { models = await loadFromSource(); await ctx.catalog.reload() }
const timer = setInterval(() => void refresh().catch(console.error), 60_000)
return () => clearInterval(timer)
```

### 3.5 API por dominio (referencia rápida)

#### Agent
```ts
await ctx.agent.list(); await ctx.agent.get({ agentID: "build" })
await ctx.agent.transform(d => { d.default("build"); d.update("build", a => a.description = "..."); d.remove("legacy") })
await ctx.agent.reload()
```
Draft: `list/get/default/update/remove` · `Registration.dispose()`

#### Catalog
```ts
await ctx.catalog.provider.list(); await ctx.catalog.model.list()
await ctx.catalog.transform(c => {
  c.provider.update("anthropic", p => p.name = "Anthropic")
  c.model.update("anthropic","claude-sonnet-4-5", m => m.name = "Claude Sonnet 4.5")
  c.model.default.set("anthropic","claude-sonnet-4-5"); c.model.remove("anthropic","legacy")
})
await ctx.catalog.reload()
```

#### Commands
```ts
await ctx.command.list()
await ctx.command.transform(d => d.add({
  name: "security-review", description: "Review changes",
  execute: async ({ sessionID, prompt, delivery }) =>
    ctx.session.prompt({ ...prompt, sessionID, text: `Review...\n\n${prompt.text}`, delivery })
}))
```

#### Integrations
```ts
await ctx.integration.list(); await ctx.integration.get({ integrationID: "github" })
await ctx.integration.connection.active("github")
await ctx.integration.connect.key({ integrationID: "github", key: process.env.GITHUB_TOKEN! })
const att = await ctx.integration.oauth.connect({ integrationID:"github", methodID:"oauth" })
await ctx.integration.transform(d => {
  d.update("acme", i => i.name = "Acme")
  d.method.update({ integrationID:"acme", method:{ id:"cli", type:"command", label:"Sign in", command:["acme","login"] }})
})
```

#### MCP — solo vía transforms
```ts
await ctx.mcp.list()
await ctx.mcp.transform(d => {
  d.set("docs", { type:"remote", url:"https://mcp.example.com" })
  d.update("docs", s => s.disabled = false)
  d.remove("legacy")
})
await ctx.mcp.reload() // disabled:true desconecta, false reconecta
```

#### Plugins / References / Skills / Storage / etc.
```ts
await ctx.plugin.list()
await ctx.reference.transform(d => { d.add("handbook", { type:"local", path:"/workspace/docs/handbook" }); d.remove("legacy") })
await ctx.skill.transform(d => d.add({ id:"review", name:"Review", description:"...", location:"/ws/.opencode/skills/review.md", content:"..." }))
await ctx.storage.set("settings", { strict:true }); await ctx.storage.get("settings"); await ctx.storage.scan({ prefix:"cache/", limit:100 })
await ctx.generate.text({ model:{ providerID:"anthropic", id:"claude-sonnet-4-6" }, prompt:"Review..." })
await ctx.permission.list({ sessionID }); await ctx.permission.reply({ sessionID, requestID, reply:"once" })
```

#### Sessions (más usado)
```ts
const s = await ctx.session.create({ title:"Review" })
await ctx.session.get({ sessionID }); await ctx.session.context({ sessionID })
await ctx.session.switchAgent({ sessionID, agent:"build" })
await ctx.session.switchModel({ sessionID, model:{ providerID:"anthropic", id:"claude-sonnet-4-5" } })
await ctx.session.prompt({ sessionID, text:"Review the current changes" })
await ctx.session.generate({ sessionID, prompt:"Summarize" })
await ctx.session.command({ sessionID, command:"review", arguments:"--staged" })
await ctx.session.synthetic({ sessionID, text:"Deployment completed" })
await ctx.session.rename({ sessionID, title:"Review" }); await ctx.session.interrupt({ sessionID, continue:false }); await ctx.session.wait({ sessionID })
```

#### Tools — segunda joya del plugin
```ts
const reg = await ctx.tool.transform(draft => {
  draft.add({
    name:"greeting", description:"Create a greeting",
    input:{ type:"object", properties:{ name:{type:"string"}}, required:["name"], additionalProperties:false },
    options:{ namespace:"acme", codemode:true },
    execute: async (input, tool) => { await tool.progress({ status:"greeting" }); return { content:`Hello ${(input as any).name}!` } }
  })
})
await ctx.tool.reload() // repite transforms en orden, no rerun setup
await reg.dispose() // quita su transform y rebuild
// list/get/update/remove con effective name (acme_greeting, _ por namespace)
await ctx.tool.transform(d => { d.update("acme_greeting", t => t.description = "..."); d.remove("acme_obsolete") })
```

#### VCS / Websearch / Events
```ts
await ctx.vcs.get(); await ctx.vcs.status(); await ctx.vcs.diff({ mode:"working", context:3 })
await ctx.vcs.transform(d => { d.add({ id:"custom", name:"Custom VCS", info: async()=>({branch:{current:"feature"}}), status: async()=>..., diff: async()=>... }); d.default.set("custom") })
await ctx.websearch.query({ query:"OpenCode plugins", providerID:"internal" })
await ctx.websearch.transform(d => d.add({ id:"internal", name:"Internal", execute: async ({query},{signal}) => fetch(...)}))
for await (const e of ctx.event.subscribe({ signal: controller.signal })) console.log(e.type)
```

### 3.6 Publicar plugin

```json // package.json mínimo
{ "name":"opencode-acme-plugin", "version":"1.0.0", "type":"module", "exports":{".":"./src/index.ts"}, "dependencies":{ "@opencode-ai/plugin":"beta" } }
```
Testear instalado, no solo linkeado; al cambiar V2 entrypoints, publicar update compatible.

---

## 4. Client — `@opencode-ai/client`

### 4.1 Install & make
```sh
bun add @opencode-ai/client@beta
```
```ts
import { OpenCode } from "@opencode-ai/client"
const client = OpenCode.make({ baseUrl:"http://localhost:4096" })
const s = await client.session.create({ location:{ directory:"/workspace" }})
await client.session.prompt({ sessionID: s.id, text:"Review the current changes" })
```

### 4.2 Headers / fetch custom / per-request
```ts
const client = OpenCode.make({
  baseUrl:"https://opencode.example.com",
  headers:{ authorization:`Bearer ${process.env.OPENCODE_TOKEN}` },
})
await client.session.list(undefined, { signal: AbortSignal.timeout(10_000) })
```

### 4.3 Streaming
```ts
for await (const event of client.event.subscribe()) console.log(event.type)
```

### 4.4 Service local (Node, no browser)
```ts
import { OpenCode } from "@opencode-ai/client"
import { Service } from "@opencode-ai/client/service"
const endpoint = await Service.ensure() // o discover() / stop()
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) })
await client.health.get()
// con opciones:
await Service.ensure({
  file:"/var/run/opencode/service.json",
  version: v => v.startsWith("2."),
  command:["opencode","serve","--service"],
  onStart(reason, prevVersion){ console.log(reason, prevVersion) }
})
```

> **Mapeo actual del proyecto:** `web/src/shared/api/client.ts` ya envuelve `fetch` con `resolveShellBase()` + `Authorization: Basic` + `GET/POST` helpers. Migrar a `@opencode-ai/client` eliminaría mappers manuales `shared/api/version.ts` (dialecto v1/v2) pero requiere alinear `baseUrl` dinámico (Tailscale) y SSE `type inside JSON`.

---

## 5. SDK — `@opencode-ai/sdk` (embed)

```sh
bun add @opencode-ai/sdk@dev
```

```ts
import { OpenCode } from "@opencode-ai/sdk"
await using opencode = await OpenCode.create() // o await opencode.close()
const s = await opencode.sessions.create({ location:{ directory:"/workspace" }})
await opencode.sessions.prompt({ sessionID: s.id, text:"Review the current changes" })
for await (const e of opencode.events.subscribe()) console.log(e.type)
```

- **Sin HTTP**: ruta por router en memoria, mismos tipos/errores/streams que client
- **Aliases conveniencia:** `opencode.sessions` (`client.session`) y `opencode.events` (`client.event`)
- **Plugins embebidos:**
```ts
import { Plugin } from "@opencode-ai/plugin"
const plugin = Plugin.define({ id:"customize-agent", async setup(ctx){ await ctx.agent.transform(a => a.update("build", ag => ag.description = "Builds features...")) }})
await using opencode = await OpenCode.create({ plugins:[plugin] })
await opencode.plugin(plugin) // post-start
```

> **Cuándo usarlo aquí:** Para `web` tests sin levantar `opencode serve` externo, o para un futuro `desktop-app` que embeba el server Rust actual en memoria en vez de `tiny_http` + `wry`.

---

## 6. Patrones transversales

| Patrón | Plugin (`ctx.*`) | Client | SDK | Nota |
|---|---|---|---|---|
| **Transform + Reload** | `ctx.catalog/agent/command/tool/mcp.transform` + `reload()` | — | `opencode.plugin(p)` | `reload` re-ejecuta transforms en orden; no rerun `setup` |
| **Registration.dispose()** | Quita *solo* ese transform y rebuild | — | — | Idempotente, también al unload plugin |
| **Storage** | `ctx.storage.get/set/remove/scan` (prefijo + paginación) | — | — | JSON durable scoping plugin |
| **Lifecycle** | `setup` → `return cleanup` | `AbortSignal` por request | `await using` | En plugin, `controller.abort()` para `event.subscribe` |
| **Location** | `ctx.location.{directory, project.canonical}` | `location:{directory}` en `session.create` | idem | Plugin ve su propia location, no la de cada sesión |
| **Options** | `ctx.options` desde `opencode.jsonc {package, options}` | `headers` en `make` | `plugins:[...]` en `create` | Tipar `ctx.options.strict` manualmente |

---

## 7. Hooks — intersección de operaciones vivas

> `await ctx.*.hook(event, cb)` → `Registration` con `dispose()`. Múltiples plugins pueden enganchar el mismo hook; corren en orden de registro y ven cambios previos.

### Session — `prompt` (pre-admisión)
```ts
await ctx.session.hook("prompt", (event) => {
  event.prompt.text = event.prompt.text.replaceAll("company-secret","[redacted]")
  event.prompt.files ??= []; event.prompt.files.push({ uri:"file:///project/policy.md" })
  event.metadata = { ...event.metadata, source:"company-policy" }
  event.delivery = "queue" // "steer" por defecto
  // si reescribes texto, actualiza mention offsets de attachments
})
```
- Mutable draft: `text/files/agents/skills/metadata/delivery`; `sessionID/messageID` readonly
- Corre *antes* de skill resolution y de inbox durable; también para `session.prompt` vía `command`
- **No** corre para `synthetic/shell/compaction`; no se puede scoping por `providerID`
- Retry-safe: reintentos de mismo ID no re-ejecutan hook con payload retried

### Session — `context` (pre-dispatch al modelo)
```ts
await ctx.session.hook("context", (event) => {
  event.system.push({ text:"Keep review focused." })
  delete event.tools.write
  event.generation.temperature = 0.2
  event.generation.maxTokens = 8_000 // = maxTokens semántico
})
// provider-specific:
await ctx.session.hook("context", e => e.providerOptions.reasoningEffort = "high", { providerID:"openai" })
```
- `generation/providerOptions` empiezan vacíos por invocación; precedence: `hook overrides > model defaults > route defaults`; `providerOptions` merge recursivo, `delete`/`undefined` fallback a default

### Session — `model.request` / `http.request` / `http.response`
```ts
await ctx.session.hook("model.request", e => e.headers["x-plugin"]="review", { providerID:"anthropic" })
await ctx.session.hook("http.request", e => e.request.headers.set("x-session-id", e.sessionID))
await ctx.session.hook("http.response", e => {
  e.response = new Response(e.response.body, { status:e.response.status, headers:{...Object.fromEntries(e.response.headers), "x-plugin":"review"} })
})
// bodies son streams one-shot: clonar antes de leer
```

### Permission — `evaluate` (post-reglas, pre-prompt)
```ts
await ctx.permission.hook("evaluate", async (event) => {
  if (event.action === "read") return
  const review = await ctx.generate.text({ model:{ providerID:"anthropic", id:"claude-sonnet-4-6" }, prompt: buildSafetyPrompt(event) })
  event.effect = parseDecision(review.text).effect // "allow"|"ask"|"deny"
  event.message = parseDecision(review.text).reason
})
// deny configurado es final y no invoca hook; hook solo para allow/ask
```

### Shell — `create.before`
```ts
await ctx.shell.hook("create.before", e => { e.timeout = Math.min(e.timeout, 60_000); e.env.COMPANY_ENV="development" })
```

### Tool — `execute.before` / `execute.after`
```ts
await ctx.tool.hook("execute.before", e => { if (e.tool==="read") console.log(e.input) })
await ctx.tool.hook("execute.after", e => {
  if (e.status==="completed") e.result = { ...e.result, metadata:{ observed:true } }
  if (e.status==="error") console.error(e.error.message)
})
```

---

## 8. Matriz de decisión para `opencode-remote-android`

| Necesidad del proyecto | Camino recomendado | Por qué |
|---|---|---|
| **Exponer `/shell/*` (explorer, pty, kanban, docs, stats) sin forkear upstream** | Plugin `acme-shell` que registra tools `shell_fs_*` + `ctx.shell.hook` + `ctx.tool.transform` | Mantiene `opencode serve` stock, añade solo lo que necesita Android/desktop |
| **Thin client Android (Capacitor)** | Client (`@opencode-ai/client`) adaptado a `resolveShellBase()` + `shellAuthHeader` actual | Ya es la arquitectura (REST+SSE); el client generado evita mappers `version.ts` manuales |
| **Tests E2E / preview sin levantar proceso** | SDK (`OpenCode.create` en `vitest` con `await using`) | Sin `tiny_http :4096`, sin Tailscale, mismo contrato |
| **Transformar catálogo de models para modo ahorro** | Plugin `ctx.catalog.transform` + `catalog.model.remove` por `cost.output > 20` | Reutiliza patrón de `model-budget.ts` |
| **Añadir comando `/security-review`** | Plugin `ctx.command.transform` con `ctx.session.prompt` | No tocar `web` |
| **MCP docs remoto** | Plugin `ctx.mcp.transform` `set("docs", {type:"remote", url})` | Evita `cap sync` con creds |
| **Persistencia de plugin** | `ctx.storage` | Reemplaza `localStorage` para settings de plugin |

**Orden sugerido de adopción:**
1. **Client tipado** — envolver `shared/api/client.ts` con `OpenCode.make` (manteniendo `shellRemoteOverride`/`deriveShellBaseFromServer`)
2. **Plugin `acme-shell`** — migrar `desktop-app/src` handlers `shell/*` a `ctx.tool.transform` + `ctx.shell.hook`
3. **SDK en tests** — `web/vitest.setup.ts` con `OpenCode.create({plugins:[acme]})` para no depender de `:4096`

---

## 9. Checklist de implementación y riesgos beta

- [ ] **Versionado:** V2 es `beta`/`dev` — fijar `beta`/`dev` exacto en `web/package.json` y testear instalado, no linkeado
- [ ] **Compat:** `version` predicate en `Service.ensure({ version: v=>v.startsWith("2.") })` para desktop shell
- [ ] **Transforms:** Siempre `await transform` antes de `reload`; `dispose` al unload para no dejar overrides huérfanos
- [ ] **SSE:** `type` va *dentro* del JSON (`{id,type,properties}`), nunca en línea `event:` — ya está en `architecture.md`
- [ ] **Imágenes v2:** `resolveApiVersion()==="v2"` descarta `images` (server las ignora) — mantener guard en `useMessages.ts:707`
- [ ] **Storage:** `scan` con `prefix` + `after` cursor — no asumir `list` trae todo
- [ ] **Hooks retry-safe:** `prompt` puede correr >1 vez antes de commit; no hacer side-effects no idempotentes
- [ ] **ProviderOptions:** usar nombres semánticos (`reasoningEffort`, `maxTokens`) no body HTTP raw; scoping por `providerID`

---

## 10. Apéndice — Snippets canónicos listos para copiar

### Plugin completo de ejemplo (tools + catalog + storage + hook)

```ts
import { Plugin } from "@opencode-ai/plugin"
export default Plugin.define({
  id: "acme",
  async setup(ctx) {
    await ctx.storage.set("loaded", Date.now())
    await ctx.catalog.transform(c => c.model.update("anthropic","claude-sonnet-4-5", m => m.name = "Sonnet 4.5 acme"))
    const reg = await ctx.tool.transform(d => d.add({
      name:"acme_hello", description:"Hello",
      input:{ type:"object", properties:{ name:{type:"string"}}, required:["name"] },
      execute: async (input) => ({ content:`Hello ${(input as any).name}` })
    }))
    await ctx.session.hook("prompt", e => { e.prompt.text = e.prompt.text.trim() })
    return async () => { await reg.dispose(); await ctx.storage.remove("loaded") }
  }
})
```

### Client con Service + streaming

```ts
import { OpenCode } from "@opencode-ai/client"
import { Service } from "@opencode-ai/client/service"
const endpoint = await Service.ensure()
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) })
for await (const e of client.event.subscribe()) console.log(e.type)
const s = await client.session.create({ location:{ directory:"/workspace" }})
await client.session.prompt({ sessionID: s.id, text:"Hola" })
```

### SDK con plugin

```ts
import { OpenCode } from "@opencode-ai/sdk"
import { Plugin } from "@opencode-ai/plugin"
const p = Plugin.define({ id:"x", async setup(ctx){ await ctx.agent.transform(a => a.default("build")) }})
await using opencode = await OpenCode.create({ plugins:[p] })
await opencode.sessions.prompt({ sessionID:(await opencode.sessions.create({ location:{ directory:"/workspace" }})).id, text:"Hola" })
```

---

> **Próximo paso para este repo:** Migrar `web/src/shell.ts` (`shell.fs.*`, `shell.pty.*`, `shell.kanban.*`) a un **plugin `acme-shell`** (`ctx.tool.transform` + `ctx.shell.hook("create.before")`) y consumirlo desde `web/src/shared/api/client.ts` vía `OpenCode.make` — así `desktop-app/src/api.rs` se reduce a proxy y el dialecto `v1/v2` vive en un solo lugar.
