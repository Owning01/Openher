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
  const target = `${baseUrl(config)}${path}`

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
        return { data: response.data as T, headers: responseHeaders }
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
          const body = await response.json()
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
      return { data: json, headers: responseHeaders }
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

export const api = {
  health(config: ServerConfig) {
    return request<HealthResponse>(config, "/global/health")
  },

  listSessions(config: ServerConfig, directory?: string) {
    return request<Session[]>(config, withDirectory("/session", directory))
  },

  async listGlobalSessions(config: ServerConfig) {
    const sessions: Session[] = []
    let cursor: string | undefined
    let pages = 0
    const MAX_PAGES = 100
    do {
      if (++pages > MAX_PAGES) break
      const path = cursor ? `/experimental/session?cursor=${encodeURIComponent(cursor)}` : "/experimental/session"
      const response = await requestWithHeaders<Session[]>(config, path)
      sessions.push(...response.data)
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

  loadMessages(config: ServerConfig, sessionID: string, directory?: string, limit = 100) {
    return request<MessageEnvelope[]>(config, withDirectory(`/session/${sessionID}/message?limit=${limit}`, directory))
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
