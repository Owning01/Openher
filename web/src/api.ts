import { Capacitor, CapacitorHttp } from "@capacitor/core"
import { computeBackoff } from "./utils"
import { recordDataUsage } from "./utils/dataUsage"
import type {
  AgentOption,
  CommandInfo,
  DiffFile,
  FileStatusEntry,
  FileEntry,
  HealthResponse,
  MessageEnvelope,
  ModelOption,
  ModelSelection,
  ProjectCurrent,
  PathInfo,
  QuestionOption,
  ServerConfig,
  Session,
  SessionStatus,
  TodoItem,
  VcsStatus
} from "./types"

export function toBase64(input: string): string {
  const bytes = new TextEncoder().encode(input)
  const binary = Array.from(bytes).map((b) => String.fromCodePoint(b)).join("")
  return btoa(binary)
}

// ===== Modo híbrido v1/v2 =====
// El server opencode v2 (beta) expone la API bajo el prefijo /api y envuelve
// las respuestas en { data: ... }. v1 usa rutas raíz y arrays planos.
// La versión se detecta una vez por (host, port) en health() y se cachea;
// el usuario también puede forzarla desde Settings.
export type ApiVersion = "auto" | "v1" | "v2"

const detectedVersionCache = new Map<string, "v1" | "v2">()

function versionKey(config: ServerConfig): string {
  return `${config.host.trim()}:${config.port}`
}

export function resolveApiVersion(config: ServerConfig): "v1" | "v2" {
  if (config.apiVersion === "v1" || config.apiVersion === "v2") return config.apiVersion
  return detectedVersionCache.get(versionKey(config)) ?? "v1"
}

export function rememberApiVersion(config: ServerConfig, version: "v1" | "v2") {
  detectedVersionCache.set(versionKey(config), version)
}

function apiPath(config: ServerConfig, path: string): string {
  return resolveApiVersion(config) === "v2" ? `/api${path}` : path
}

// v2 envuelve las respuestas en { data: ... } (y a veces { location, data }).
function unwrapData<T>(raw: T): T {
  if (raw && typeof raw === "object") {
    const candidate = raw as unknown as { data?: unknown }
    if ("data" in candidate) return candidate.data as T
  }
  return raw
}

function authHeader(config: ServerConfig): string {
  return `Basic ${toBase64(`${config.username}:${config.password}`)}`
}

export function baseUrl(config: ServerConfig): string {
  let host = config.host.trim()
  const schemeMatch = host.match(/^(https?):\/\//)
  const scheme = schemeMatch ? schemeMatch[1] : "http"
  if (schemeMatch) host = host.slice(schemeMatch[0].length)
  if (host.includes(":") && !host.startsWith("[")) {
    host = `[${host}]`
  }
  return `${scheme}://${host}:${config.port}`
}

function normalizeSlashes(path: string): string {
  return path.replace(/\\/g, "/")
}

// El server espera paths RELATIVOS al directory (RelativePath). Si la app
// recibe un path absoluto (FileBrowser usa item.absolute), se recorta el
// prefijo del directory para no disparar 500 en /file/content.
function toServerRelative(path: string, directory?: string): string {
  const norm = normalizeSlashes(path)
  if (!directory) return norm
  const normDir = normalizeSlashes(directory).replace(/\/+$/, "")
  if (norm.toLowerCase().startsWith(normDir.toLowerCase())) {
    const rel = norm.slice(normDir.length).replace(/^\/+/, "")
    if (rel) return rel
  }
  return norm
}

function withDirectory(path: string, directory?: string): string {
  if (!directory) return path
  const separator = path.includes("?") ? "&" : "?"
  return `${path}${separator}directory=${encodeURIComponent(normalizeSlashes(directory))}`
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  readTimeout?: number
  // Usa el path tal cual (sin prefijo /api ni unwrap): para probes de
  // detección de versión en modo "auto".
  rawPath?: boolean
}

type ResponseWithHeaders<T> = {
  data: T
  headers: Record<string, string>
}

function responseDetail(body: unknown): string | null {
  if (!body) return null
  if (typeof body === "string") {
    try {
      return responseDetail(JSON.parse(body)) ?? body
    } catch {
      return body
    }
  }
  if (typeof body === "object") {
    const value = body as { data?: { message?: string }; message?: string }
    return value.data?.message ?? value.message ?? JSON.stringify(body)
  }
  return String(body)
}

function normalizeHeaders(headers: Record<string, unknown> | undefined): Record<string, string> {
  if (!headers) return {}
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), Array.isArray(value) ? value.join(", ") : String(value)])
  )
}

function serializedSize(value: unknown): number {
  if (value === undefined || value === null) return 0
  if (typeof value === "number" || typeof value === "boolean") return String(value).length
  if (typeof value === "string") return value.length
  try {
    return JSON.stringify(value)?.length ?? 0
  } catch {
    return 0
  }
}

type ConfigProvidersResponse = {
  providers: Array<{
    id: string
    name: string
    models: Record<string, {
      id?: string
      name?: string
      status?: string
      capabilities?: {
        attachment?: boolean
        toolcall?: boolean
        tools?: boolean
      }
      limit?: {
        context?: number
        output?: number
      }
      variants?: Record<string, unknown>
    }>
  }>
  default?: Record<string, string>
}

type AgentResponse = Array<{
  id?: string
  name?: string
  description?: string
  mode: "primary" | "subagent" | "all"
  hidden?: boolean
}>

async function requestWithHeaders<T>(config: ServerConfig, path: string, options: RequestOptions = {}): Promise<ResponseWithHeaders<T>> {
  // En modo auto, si el server es v2 (todavía no detectado) el primer intento
  // con ruta v1 da 404: reintentamos con el prefijo /api y cacheamos el dialecto.
  const autoV2 = !options.rawPath && config.apiVersion !== "v1" && config.apiVersion !== "v2"
  const attempt = (withPrefix: boolean): Promise<ResponseWithHeaders<T>> => {
    const target = `${baseUrl(config)}${withPrefix ? `/api${path}` : options.rawPath ? path : apiPath(config, path)}`
    return requestRaw<T>(config, target, options).catch((err) => {
      if (autoV2 && withPrefix === false && err instanceof Error && /^HTTP 404$/.test(err.message)) {
        rememberApiVersion(config, "v2")
        return attempt(true)
      }
      throw err
    })
  }
  return attempt(false)
}

async function requestRaw<T>(config: ServerConfig, target: string, options: RequestOptions = {}): Promise<ResponseWithHeaders<T>> {

  const headers: Record<string, string> = {
    Accept: "application/json"
  }
  if (config.username && config.password) {
    headers.Authorization = authHeader(config)
  }
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json"
  }

  const method = options.method ?? "GET"
  const timeout = options.readTimeout ?? 30_000
  const maxRetries = 1
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (Capacitor.isNativePlatform()) {
        const response = await CapacitorHttp.request({
          url: target,
          method,
          headers,
          data: options.body,
          connectTimeout: 12_000,
          readTimeout: timeout
        })

        if (response.status >= 400) {
          throw new Error(responseDetail(response.data) || `HTTP ${response.status}`)
        }

        const responseHeaders = normalizeHeaders(response.headers)
        recordDataUsage(serializedSize(options.body), "up")
        recordDataUsage(serializedSize(response.data), "down")
        if (response.status === 204) return { data: true as T, headers: responseHeaders }
        return { data: unwrapData(response.data as T), headers: responseHeaders }
      }

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)
      let response: Response
      try {
        response = await fetch(target, {
          method,
          headers,
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          signal: controller.signal
        })
      } finally {
        clearTimeout(timer)
      }

      if (!response.ok) {
        let detail = `HTTP ${response.status}`
        try {
          const clone = response.clone()
          const body = await clone.json()
          detail = responseDetail(body) ?? detail
        } catch {
          const text = await response.text()
          if (text) detail = text
        }
        throw new Error(detail)
      }

      const responseHeaders = normalizeHeaders(Object.fromEntries(response.headers.entries()))
      recordDataUsage(serializedSize(options.body), "up")
      recordDataUsage(serializedSize(response.headers.get("content-length")), "down")
      if (response.status === 204) return { data: true as T, headers: responseHeaders }
      const json = (await response.json()) as T
      recordDataUsage(serializedSize(json), "down")
      return { data: unwrapData(json), headers: responseHeaders }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, computeBackoff(1_000, 10_000, attempt)))
      }
    }
  }

  const errorObj = lastError ?? new Error("Unknown error")
  const isNetworkError = errorObj.message.startsWith("Network error") || errorObj.name === "AbortError"
  if (!isNetworkError) throw errorObj

  const corsHint = config.username && config.password
    ? " Browser mode + Basic Auth may be blocked by CORS preflight; use APK/native mode or disable auth temporarily for browser debugging."
    : ""
  throw new Error(
    `Network error: cannot reach ${target}. Check server hostname/port, Windows firewall, and CORS (--cors).${corsHint}`
  )
}

async function request<T>(config: ServerConfig, path: string, options: RequestOptions = {}): Promise<T> {
  return (await requestWithHeaders<T>(config, path, options)).data
}

function toAgentOption(agent: AgentResponse[number]): AgentOption {
  const id = agent.id || agent.name || ""
  return {
    id,
    name: agent.name || id,
    description: agent.description,
    mode: agent.mode,
    hidden: agent.hidden
  }
}

function toModelBody(model?: ModelSelection) {
  if (!model) return undefined
  return { providerID: model.providerID, modelID: model.modelID }
}

function toCreateSessionModel(model?: ModelSelection) {
  if (!model) return undefined
  return { providerID: model.providerID, id: model.modelID, variant: model.variant || undefined }
}

function modelWireName(model?: ModelSelection) {
  if (!model) return undefined
  return `${model.providerID}/${model.modelID}`
}

// ===== Mappers v2 → tipos v1 =====
// El server v2 (beta) devuelve sesiones con location.directory, model anidado
// y mensajes con content[] en vez de parts[].

type V2Session = {
  id: string
  title?: string
  location?: { directory?: string }
  time?: { created?: number; updated?: number }
  tokens?: import("./types").TokenUsage
  cost?: number
  agent?: string
  model?: { id?: string; providerID?: string; variant?: string }
  revert?: import("./types").Session["revert"]
  parentID?: string
}

function toSessionV1(raw: V2Session): Session {
  return {
    id: raw.id,
    title: raw.title ?? "",
    directory: raw.location?.directory ?? "",
    time: {
      created: raw.time?.created ?? 0,
      updated: raw.time?.updated ?? 0
    },
    tokens: raw.tokens,
    cost: raw.cost,
    agent: raw.agent,
    model: raw.model?.id
      ? { id: raw.model.id, providerID: raw.model.providerID ?? "", variant: raw.model.variant }
      : undefined,
    revert: raw.revert,
    parentID: raw.parentID
  }
}

type V2Message = {
  id: string
  sessionID?: string
  time?: { created?: number; completed?: number }
  type?: string
  agent?: string
  parentID?: string
  model?: { id?: string; providerID?: string }
  finish?: string
  tokens?: import("./types").TokenUsage
  cost?: number
  content?: Array<{
    id?: string
    type?: string
    text?: string
    data?: string
    mimeType?: string
    name?: string
    state?: unknown
    time?: { created?: number; completed?: number }
  }>
}

function toMessageEnvelopeV1(raw: V2Message): MessageEnvelope {
  const content = raw.content ?? []
  return {
    info: {
      id: raw.id,
      role: raw.type ?? "assistant",
      sessionID: raw.sessionID ?? "",
      time: { created: raw.time?.created ?? 0, completed: raw.time?.completed },
      agent: raw.agent,
      parentID: raw.parentID,
      modelID: raw.model?.id,
      providerID: raw.model?.providerID,
      finish: raw.finish,
      tokens: raw.tokens,
      cost: raw.cost
    },
    parts: content.map((c, index) => ({
      id: c.id ?? `${raw.id}_part_${index}`,
      type: c.type ?? "text",
      text: c.text,
      data: c.data,
      mimeType: c.mimeType,
      callID: c.id,
      tool: c.name,
      state: c.state as MessageEnvelope["parts"][number]["state"],
      time: c.time
    }))
  }
}

export const api = {
  // Health con detección de versión: en "auto" prueba la ruta v1 y si no
  // existe reintenta con el prefijo /api del v2. Cachea el dialecto detectado.
  async health(config: ServerConfig): Promise<HealthResponse> {
    const forced = config.apiVersion
    if (forced === "v1") {
      return (await requestWithHeaders<HealthResponse>(config, "/global/health", { rawPath: true })).data
    }
    if (forced === "v2") {
      const data = (await requestWithHeaders<HealthResponse>(config, "/api/health", { rawPath: true })).data
      rememberApiVersion(config, "v2")
      return data
    }
    try {
      const data = (await requestWithHeaders<HealthResponse>(config, "/global/health", { rawPath: true })).data
      rememberApiVersion(config, "v1")
      return data
    } catch (err) {
      if (!(err instanceof Error) || !/404|not found/i.test(err.message)) throw err
      const data = (await requestWithHeaders<HealthResponse>(config, "/api/health", { rawPath: true })).data
      rememberApiVersion(config, "v2")
      return data
    }
  },

  async listSessions(config: ServerConfig, directory?: string) {
    const raw = await request<Session[] | V2Session[]>(config, withDirectory("/session", directory))
    if (resolveApiVersion(config) === "v2") {
      return (raw as V2Session[]).map(toSessionV1)
    }
    return raw as Session[]
  },

  async listGlobalSessions(config: ServerConfig) {
    const sessions: Session[] = []
    let cursor: string | undefined
    let pages = 0
    const MAX_PAGES = 100
    do {
      if (++pages > MAX_PAGES) break
      const path = cursor ? `/experimental/session?cursor=${encodeURIComponent(cursor)}` : "/experimental/session"
      const response = await requestWithHeaders<Session[] | V2Session[]>(config, path)
      const batch = resolveApiVersion(config) === "v2"
        ? (response.data as V2Session[]).map(toSessionV1)
        : response.data as Session[]
      sessions.push(...batch)
      cursor = response.headers["x-next-cursor"]
    } while (cursor)
    return sessions
  },

  listStatuses(config: ServerConfig, directory?: string) {
    return request<Record<string, SessionStatus>>(config, withDirectory("/session/status", directory))
  },

  loadPath(config: ServerConfig, directory?: string) {
    return request<PathInfo>(config, withDirectory("/path", directory))
  },

  listFiles(config: ServerConfig, path: string, directory?: string) {
    // El server 1.18.12 usa RelativePath.make: SOLO acepta rutas relativas al
    // project directory ("" = raíz). Las absolutas de Windows fallan con 500.
    const rel = path.replace(/\\/g, "/").replace(/^[A-Za-z]:\/?/, "").replace(/^\/+/, "")
    return request<FileEntry[]>(config, withDirectory(`/file?path=${encodeURIComponent(rel)}`, directory))
  },

  listCommands(config: ServerConfig) {
    return request<CommandInfo[]>(config, "/command")
  },

  async listAgents(config: ServerConfig, directory?: string) {
    const agents = await request<AgentResponse>(config, withDirectory("/agent", directory))
    return agents.map(toAgentOption).filter((agent) => agent.id && !agent.hidden)
  },

  async listModels(config: ServerConfig, directory?: string) {
    const response = await request<ConfigProvidersResponse>(config, withDirectory("/config/providers", directory))
    return response.providers.flatMap((provider) => {
      const defaultModel = response.default?.[provider.id]
      return Object.entries(provider.models).flatMap(([modelID, model]) => {
        const base: ModelOption = {
          providerID: provider.id,
          providerName: provider.name || provider.id,
          modelID: model.id || modelID,
          modelName: model.name || model.id || modelID,
          status: model.status,
          contextLimit: model.limit?.context,
          outputLimit: model.limit?.output,
          tools: Boolean(model.capabilities?.toolcall || model.capabilities?.tools),
          attachments: Boolean(model.capabilities?.attachment),
          isDefault: defaultModel === modelID
        }
        const variantIDs = Object.keys(model.variants ?? {})
        return [
          base,
          ...variantIDs.map((variant) => ({ ...base, variant, isDefault: false }))
        ]
      })
    })
  },

  createSession(config: ServerConfig, title?: string, model?: ModelSelection, directory?: string) {
    return request<Session>(config, withDirectory("/session", directory), { method: "POST", body: { title, model: toCreateSessionModel(model) } })
  },

  renameSession(config: ServerConfig, id: string, title: string, directory?: string) {
    return request<Session>(config, withDirectory(`/session/${id}`, directory), { method: "PATCH", body: { title } })
  },

  deleteSession(config: ServerConfig, id: string, directory?: string) {
    return request<boolean>(config, withDirectory(`/session/${id}`, directory), { method: "DELETE" })
  },

  async loadMessages(config: ServerConfig, sessionID: string, directory?: string, limit = 100) {
    const raw = await request<MessageEnvelope[] | V2Message[]>(config, withDirectory(`/session/${sessionID}/message?limit=${limit}`, directory))
    if (resolveApiVersion(config) === "v2") {
      return (raw as V2Message[]).map(toMessageEnvelopeV1)
    }
    return raw as MessageEnvelope[]
  },

  loadTodo(config: ServerConfig, sessionID: string, directory?: string) {
    return request<TodoItem[]>(config, withDirectory(`/session/${sessionID}/todo`, directory))
  },

  loadDiff(config: ServerConfig, sessionID: string, directory?: string) {
    return request<DiffFile[]>(config, withDirectory(`/session/${sessionID}/diff`, directory))
  },

  loadProjectCurrent(config: ServerConfig, directory?: string) {
    return request<ProjectCurrent>(config, withDirectory("/project/current", directory))
  },

  loadVcs(config: ServerConfig, directory?: string) {
    return request<VcsStatus>(config, withDirectory("/vcs", directory))
  },

  loadFileStatus(config: ServerConfig, directory?: string) {
    return request<FileStatusEntry[] | Record<string, FileStatusEntry>>(config, withDirectory("/file/status", directory))
  },

  sendPrompt(config: ServerConfig, sessionID: string, text: string, directory?: string, model?: ModelSelection, agentID?: string, images?: Array<{ base64: string; mime: string }>) {
    if (resolveApiVersion(config) === "v2") {
      // v2 (beta): prompt directo { text }; las imágenes aún no están mapeadas.
      const body: Record<string, unknown> = { text }
      if (model) body.model = { providerID: model.providerID, id: model.modelID, variant: model.variant || undefined }
      if (agentID) body.agent = agentID
      return request<boolean>(config, withDirectory(`/session/${sessionID}/prompt`, directory), {
        method: "POST",
        body
      })
    }
    const parts: Array<{ type: string; text?: string; data?: string; mimeType?: string }> = []
    if (text) parts.push({ type: "text", text })
    if (images) {
      for (const img of images) {
        parts.push({ type: "image", data: img.base64, mimeType: img.mime })
      }
    }
    return request<boolean>(config, withDirectory(`/session/${sessionID}/prompt_async`, directory), {
      method: "POST",
      body: { parts, model: toModelBody(model), agent: agentID, variant: model?.variant || undefined }
    })
  },

  sendCommand(config: ServerConfig, sessionID: string, command: string, argumentsText: string, directory?: string, model?: ModelSelection, agentID?: string) {
    return request<MessageEnvelope>(config, withDirectory(`/session/${sessionID}/command`, directory), {
      method: "POST",
      body: { command, arguments: argumentsText, agent: agentID, model: modelWireName(model), variant: model?.variant || undefined },
      readTimeout: 300_000
    })
  },

  sendShell(config: ServerConfig, sessionID: string, command: string, directory?: string) {
    return request<boolean>(config, withDirectory(`/session/${sessionID}/shell`, directory), {
      method: "POST",
      body: { command },
    })
  },

  abort(config: ServerConfig, sessionID: string, directory?: string) {
    return request<boolean>(config, withDirectory(`/session/${sessionID}/abort`, directory), {
      method: "POST",
      body: {}
    })
  },

  revert(config: ServerConfig, sessionID: string, messageID: string, directory?: string) {
    return request<Session>(config, withDirectory(`/session/${sessionID}/revert`, directory), {
      method: "POST",
      body: { messageID }
    })
  },

  unrevert(config: ServerConfig, sessionID: string, directory?: string) {
    return request<Session>(config, withDirectory(`/session/${sessionID}/unrevert`, directory), {
      method: "POST",
      body: {}
    })
  },

  summarize(config: ServerConfig, sessionID: string, providerID: string, modelID: string, directory?: string, auto = false, readTimeout = 300_000) {
    return request<boolean>(config, withDirectory(`/session/${sessionID}/summarize`, directory), {
      method: "POST",
      body: { providerID, modelID, auto },
      readTimeout
    })
  },

  questionReply(config: ServerConfig, requestID: string, answers: string[][], directory?: string) {
    return request<boolean>(config, withDirectory(`/question/${encodeURIComponent(requestID)}/reply`, directory), {
      method: "POST",
      body: { answers }
    })
  },

  questionReject(config: ServerConfig, requestID: string, directory?: string) {
    return request<boolean>(config, withDirectory(`/question/${encodeURIComponent(requestID)}/reject`, directory), {
      method: "POST",
      body: {}
    })
  },

  findFiles(config: ServerConfig, query: string, directory?: string, limit = 20) {
    // El server devuelve string[] (paths relativos), no {path,type}[].
    return request<string[]>(config,
      withDirectory(`/find/file?query=${encodeURIComponent(query)}&limit=${limit}`, directory))
      .then((paths) => paths.map((p) => ({ path: p, type: "file" as const })))
  },

  listMCPResources(config: ServerConfig) {
    // El server devuelve un RECORD { [key]: { name, uri, description?, client } };
    // versiones viejas devuelven array o { resources: [...] } — parseo tolerante.
    return request<unknown>(config, "/experimental/resource").then((raw) => {
      if (Array.isArray(raw)) return raw as { id: string; name: string; description?: string }[]
      if (raw && typeof raw === "object") {
        const entries = Object.entries(raw as Record<string, unknown>)
        const isRecord = entries.length > 0 && entries.every(([, v]) =>
          v !== null && typeof v === "object" && "uri" in (v as object))
        if (isRecord) {
          return entries.map(([k, v]) => {
            const r = v as { name?: string; description?: string; client?: string }
            return { id: r.client ?? k, name: r.name ?? k, description: r.description }
          })
        }
        const wrapped = (raw as { resources?: unknown; data?: unknown }).resources ?? (raw as { data?: unknown }).data
        if (Array.isArray(wrapped)) return wrapped as { id: string; name: string; description?: string }[]
        if (Array.isArray((raw as { servers?: unknown }).servers)) {
          return (raw as { servers: Array<{ id?: string; name?: string; description?: string }> }).servers
            .filter((s) => s.id || s.name)
            .map((s) => ({ id: s.id ?? s.name ?? "", name: s.name ?? s.id ?? "", description: s.description }))
        }
      }
      return []
    })
  },

  listSkills(config: ServerConfig) {
    return request<{ id: string; name: string; description?: string }[]>(config, "/skill")
  },

  listPendingQuestions(config: ServerConfig, directory?: string) {
    // El server moderno devuelve QuestionRequest[]: { id, sessionID, questions:
    // [{ question, header, options, multiple, custom }], tool }. Servers viejos
    // mandaban { id, question, status } — parseo tolerante.
    return request<unknown>(config, withDirectory("/question", directory)).then((raw) => {
      if (!Array.isArray(raw)) return []
      return raw.map((q) => {
        const item = q as { id: string; question?: string; status?: string; sessionID?: string; questions?: unknown[]; tool?: { messageID: string; callID: string } }
        if (Array.isArray(item.questions)) {
          return {
            id: item.id,
            sessionID: item.sessionID,
            questions: item.questions as { question: string; header?: string; options: QuestionOption[]; multiple?: boolean; custom?: boolean }[],
            tool: item.tool,
          }
        }
        return {
          id: item.id,
          question: item.question,
          status: item.status,
          questions: item.question ? [{ question: item.question, header: "", options: [] }] : [],
        }
      })
    })
  },

  listPermissions(config: ServerConfig, directory?: string) {
    return request<{ requestID: string; permission: string; status: string }[]>(config, withDirectory("/permission", directory))
  },

  permissionReply(config: ServerConfig, requestID: string, approve: boolean, directory?: string) {
    return request<boolean>(config, withDirectory(`/permission/${encodeURIComponent(requestID)}/reply`, directory), {
      method: "POST",
      body: { approve }
    })
  },

  fetchDiffContent(config: ServerConfig, sessionID: string, file: string, directory?: string) {
    return request<{ content: string }>(config, withDirectory(`/session/${sessionID}/diff/${encodeURIComponent(file)}`, directory))
  },

  readFile(config: ServerConfig, path: string, directory?: string) {
    // El read real del server es /file/content (con path relativo al directory);
    // /file es el LIST y explota con paths absolutos (500).
    return request<{ type: "text" | "binary"; content: string; encoding?: string }>(config,
      withDirectory(`/file/content?path=${encodeURIComponent(toServerRelative(path, directory))}`, directory))
  },

  setModelVariant(config: ServerConfig, providerID: string, modelID: string, variantName: string, options: Record<string, unknown>, directory?: string) {
    return request<unknown>(config, withDirectory("/config", directory), {
      method: "PATCH",
      body: {
        provider: {
          [providerID]: {
            models: {
              [modelID]: {
                variants: { [variantName]: options }
              }
            }
          }
        }
      }
    })
  },

  writeFile(config: ServerConfig, path: string, content: string, directory?: string) {
    return request<boolean>(config, withDirectory("/file", directory), {
      method: "POST",
      body: { path: normalizeSlashes(path), content }
    })
  },

  fetchStats(config: ServerConfig, statsPort: number, since = "", until = "", model = "") {
    const host = config.host.replace(/^https?:\/\//, "").replace(/\/+$/, "")
    const params = new URLSearchParams({ raw: "1" })
    if (since) params.set("since", since)
    if (until) params.set("until", until)
    if (model) params.set("model", model)
    return fetch(`http://${host}:${statsPort}/api/data?${params.toString()}`, {
      cache: "no-store"
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Stats HTTP ${res.status}`)
      const data = await res.json()
      if (data?.error) throw new Error(data.error)
      return data as import("./types").StatsPayload
    })
  },
}
