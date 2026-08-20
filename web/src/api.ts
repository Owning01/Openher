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
  ServerProviderList,
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
const detectionPromises = new Map<string, Promise<"v1" | "v2">>()

function versionKey(config: ServerConfig): string {
  return `${config.host.trim()}:${config.port}`
}

// En modo "auto", resuelve el dialecto del server ANTES del primer request
// (probe memoizado por host). Evita el patrón v1-404 → retry /api en cada
// request contra un server v2 (ruido en consola) y el /event en loop.
async function ensureVersionDetected(config: ServerConfig): Promise<"v1" | "v2"> {
  if (config.apiVersion === "v1" || config.apiVersion === "v2") return config.apiVersion
  const key = versionKey(config)
  const cached = detectedVersionCache.get(key)
  if (cached) return cached
  let promise = detectionPromises.get(key)
  if (!promise) {
    promise = (async () => {
      try {
        await api.health(config)
      } catch {
        // server caído: el error real lo reporta el request que sigue
      } finally {
        detectionPromises.delete(key)
      }
      return detectedVersionCache.get(key) ?? "v1"
    })()
    detectionPromises.set(key, promise)
  }
  return promise
}

export function resolveApiVersion(config: ServerConfig): "v1" | "v2" {
  if (config.apiVersion === "v1" || config.apiVersion === "v2") return config.apiVersion
  return detectedVersionCache.get(versionKey(config)) ?? "v1"
}

// Versión resuelta con espera: para las branches de api methods. resolveApiVersion
// devuelve "v1" con el cache vacío (arranque) y las rutas v1 quedarían rotas
// aunque requestWithHeaders sí detecte v2 (404 con prefijo /api).
export function getApiVersion(config: ServerConfig): Promise<"v1" | "v2"> {
  return ensureVersionDetected(config)
}

export function rememberApiVersion(config: ServerConfig, version: "v1" | "v2") {
  const key = versionKey(config)
  if (detectedVersionCache.get(key) === version) return
  detectedVersionCache.set(key, version)
  versionListeners.forEach((fn) => fn())
}

// Hooks que dependen del dialecto (p.ej. useSSE) se suscriben para re-evaluarse
// cuando la detección de health() resuelve la versión del server.
const versionListeners = new Set<() => void>()
export function onApiVersionChange(listener: () => void): () => void {
  versionListeners.add(listener)
  return () => { versionListeners.delete(listener) }
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

export function authHeader(config: { username: string; password: string }): string {
  return `Basic ${toBase64(`${config.username}:${config.password}`)}`
}

export function baseUrl(config: { host: string; port: number }): string {
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

// v2 scopea por location (deepObject): ?location[directory]=...
function withLocationDirectory(path: string, directory?: string): string {
  if (!directory) return path
  const separator = path.includes("?") ? "&" : "?"
  return `${path}${separator}location[directory]=${encodeURIComponent(normalizeSlashes(directory))}`
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT"
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

// Lee bytes de un recurso binario (fs/read v2): fetch en web, CapacitorHttp
// con responseType blob (base64) en nativo.
async function fetchFileBytes(config: ServerConfig, target: string): Promise<Uint8Array> {
  const headers: Record<string, string> = {}
  if (config.username && config.password) headers.Authorization = authHeader(config)
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.request({
      url: target, method: "GET", headers,
      responseType: "blob",
      connectTimeout: 12_000,
      readTimeout: 30_000
    })
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
    const b64 = String(res.data ?? "").split(",").pop() ?? ""
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  }
  const res = await fetch(target, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
}

function arrayBufferToBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
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
  if (typeof value === "number") return value
  if (typeof value === "boolean") return 4
  if (typeof value === "string") return value.length
  return 0
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

function mapProviderModels(response: ConfigProvidersResponse): ModelOption[] {
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
}

async function requestWithHeaders<T>(config: ServerConfig, path: string, options: RequestOptions = {}): Promise<ResponseWithHeaders<T>> {
  const autoV2 = !options.rawPath && config.apiVersion !== "v1" && config.apiVersion !== "v2"
  if (autoV2) {
    const version = await ensureVersionDetected(config)
    if (version === "v2") {
      return requestRaw<T>(config, `${baseUrl(config)}/api${path}`, options)
    }
    // v1 confirmado: sin retry con /api ante un 404 real.
    return requestRaw<T>(config, `${baseUrl(config)}${path}`, options)
  }
  // En modo auto, si el server es v2 (todavía no detectado) el primer intento
  // con ruta v1 da 404: reintentamos con el prefijo /api y cacheamos el dialecto.
  return requestRaw<T>(config, `${baseUrl(config)}${apiPath(config, path)}`, options)
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
      const contentLength = Number(response.headers.get("content-length"))
      if (contentLength > 0) recordDataUsage(contentLength, "down")
      if (response.status === 204) return { data: true as T, headers: responseHeaders }
      const json = (await response.json()) as T
      // Medir solo si content-length no estaba disponible (evita JSON.stringify).
      if (!contentLength) recordDataUsage(serializedSize(json), "down")
      return { data: unwrapData(json), headers: responseHeaders }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      // Reintentar SOLO errores de red/timeout: los HTTP (4xx/5xx) son
      // determinísticos — reintentarlos duplica la latencia sin beneficio.
      const retryable = lastError instanceof TypeError || lastError.name === "AbortError"
        || /network|timeout|fetch failed|ERR_/i.test(lastError.message)
      if (!retryable) break
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
      sessionID: raw.sessionID,
      type: c.type ?? "text",
      text: c.text,
      data: c.data,
      mimeType: c.mimeType,
      callID: c.id,
      tool: c.name,
      state: c.state as MessageEnvelope["parts"][number]["state"],
      // v2 usa {created, completed}; el app espera {start, end} — sin end el
      // ThinkingBlock cree que el reasoning sigue streamando (spinner eterno).
      time: c.time ? { start: c.time.created, end: c.time.completed } : undefined
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
    if ((await getApiVersion(config)) === "v2") {
      return (raw as V2Session[]).map(toSessionV1)
    }
    return raw as Session[]
  },

  async listGlobalSessions(config: ServerConfig) {
    if ((await getApiVersion(config)) === "v2") {
      // v2 no tiene /experimental/session: /api/session YA es el listado global.
      return api.listSessions(config)
    }
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

  async listStatuses(config: ServerConfig, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: /session/active devuelve { sesID: SessionStatus.Info } con type
      // "busy" | "idle" | "retry" directo (nightlies viejos usaban "running").
      // Los ausentes están idle. Scoping con location (deepObject).
      const raw = await request<Record<string, { type?: string }>>(config, withLocationDirectory("/session/active", directory))
      const out: Record<string, SessionStatus> = {}
      for (const [id, st] of Object.entries(raw)) {
        const t = st?.type
        out[id] = { type: t === "running" || t === "busy" ? "busy" : t === "retry" ? "retry" : "idle" }
      }
      return out
    }
    return request<Record<string, SessionStatus>>(config, withDirectory("/session/status", directory))
  },

  async loadPath(config: ServerConfig, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: /location → Location.Info { directory, workspaceID?, project }.
      const loc = await request<{ directory?: string; workspaceID?: string; project?: { id?: string; directory?: string } }>(
        config, withLocationDirectory("/location", directory))
      const dir = loc.directory ?? loc.project?.directory ?? ""
      return { home: dir, state: dir, config: dir, worktree: dir, directory: dir }
    }
    return request<PathInfo>(config, withDirectory("/path", directory))
  },

  async listFiles(config: ServerConfig, path: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: /fs/list devuelve { location, data: FileSystemEntry[] } — sin
      // name/absolute: se derivan del path relativo.
      const rel = path.replace(/\\/g, "/").replace(/^[A-Za-z]:\/?/, "").replace(/^\/+/, "")
      const basePath = withLocationDirectory("/fs/list", directory)
      const sep = basePath.includes("?") ? "&" : "?"
      const raw = await request<Array<{ path?: string; type?: string }>>(config,
        `${basePath}${rel ? `${sep}path=${encodeURIComponent(rel)}` : ""}`)
      return raw.map((e) => ({
        name: (e.path ?? "").split("/").pop() ?? "",
        path: e.path ?? "",
        absolute: e.path ?? "",
        type: (e.type === "directory" ? "directory" : "file") as "file" | "directory",
      }))
    }
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
    if ((await getApiVersion(config)) === "v2") {
      // v2 no tiene /config/providers: /model devuelve Model.Info[] (plano)
      // + /model/default. Se reagrupa por provider para el mapping común.
      const [raw, def] = await Promise.all([
        request<unknown>(config, withLocationDirectory("/model", directory)),
        request<unknown>(config, withLocationDirectory("/model/default", directory)).catch(() => null),
      ])
      const models = Array.isArray(raw) ? raw as Array<{
        id?: string
        modelID?: string
        providerID?: string
        name?: string
        status?: string
        enabled?: boolean
        capabilities?: { tools?: boolean; input?: string[] }
        limit?: { context?: number; output?: number }
        variants?: Array<{ id?: string }>
      }> : []
      const defaultModel = (def ?? null) as { providerID?: string; modelID?: string; id?: string } | null
      const providers = new Map<string, ConfigProvidersResponse["providers"][number]>()
      for (const m of models) {
        if (m.enabled === false || m.status === "deprecated" || !m.providerID || !m.modelID) continue
        let provider = providers.get(m.providerID)
        if (!provider) {
          provider = { id: m.providerID, name: m.providerID, models: {} }
          providers.set(m.providerID, provider)
        }
        provider.models[m.modelID] = {
          id: m.id ?? m.modelID,
          name: m.name ?? m.modelID,
          status: m.status,
          capabilities: {
            tools: m.capabilities?.tools,
            toolcall: m.capabilities?.tools,
            attachment: m.capabilities?.input?.includes("image"),
          },
          limit: m.limit ? { context: m.limit.context, output: m.limit.output } : undefined,
          variants: Object.fromEntries((m.variants ?? []).map((v) => [v.id ?? "", { id: v.id }])),
        }
      }
      return mapProviderModels({
        providers: [...providers.values()],
        default: defaultModel ? { [defaultModel.providerID ?? ""]: defaultModel.modelID ?? defaultModel.id ?? "" } : {},
      })
    }
    const response = await request<ConfigProvidersResponse>(config, withDirectory("/config/providers", directory))
    return mapProviderModels(response)
  },

  // Proveedores y credenciales (comando /connect):
  // v1: PUT/DELETE /auth/:providerID + GET /provider. v2 (beta):
  // /api/integration/:id/connect/key + GET /api/integration.
  async loadProviders(config: ServerConfig, directory?: string) {
    const v2 = (await getApiVersion(config)) === "v2"
    if (v2) {
      const raw = await request<unknown>(config, withLocationDirectory("/integration", directory))
      const list = Array.isArray(raw) ? raw as Array<{ id?: string; name?: string; authMethods?: unknown }> : []
      return {
        all: list.map((p) => ({
          id: p.id ?? "",
          name: p.name ?? p.id ?? "",
          source: "config" as const,
          env: [],
          models: {},
        })),
        default: {} as Record<string, string>,
        connected: [] as string[],
      }
    }
    return request<ServerProviderList>(config, withDirectory("/provider", directory))
  },

  async setProviderAuth(config: ServerConfig, providerID: string, key: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      return request<boolean>(config, withLocationDirectory(`/integration/${providerID}/connect/key`, directory), {
        method: "POST",
        body: { key },
      })
    }
    return request<boolean>(config, withDirectory(`/auth/${providerID}`, directory), {
      method: "PUT",
      body: { type: "api", key },
    })
  },

  async removeProviderAuth(config: ServerConfig, providerID: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      return request<boolean>(config, withLocationDirectory(`/integration/${providerID}/disconnect`, directory), { method: "DELETE" })
    }
    return request<boolean>(config, withDirectory(`/auth/${providerID}`, directory), { method: "DELETE" })
  },

  // Provider custom (OpenAI-compatible): escribe la definición del provider en
  // el archivo de config del server vía PATCH /config (npm @ai-sdk/openai-compatible).
  async addCustomProvider(
    config: ServerConfig,
    providerID: string,
    name: string,
    baseURL: string,
    models: string[],
  ) {
    const modelsObj: Record<string, { name: string }> = {}
    for (const m of models) {
      const id = m.trim()
      if (id) modelsObj[id] = { name: id }
    }
    return request<unknown>(config, "/config", {
      method: "PATCH",
      body: {
        provider: {
          [providerID]: {
            npm: "@ai-sdk/openai-compatible",
            name,
            options: { baseURL },
            models: modelsObj,
          },
        },
      },
    })
  },

  async createSession(config: ServerConfig, title?: string, model?: ModelSelection, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: body { id?, agent?, model: ModelRef, location: LocationRef } — sin
      // title (el título lo pone el primer prompt) y el directory va en body.
      const body: Record<string, unknown> = {}
      const m = toCreateSessionModel(model)
      if (m) body.model = m
      if (directory) body.location = { directory }
      const raw = await request<Session | V2Session>(config, "/session", { method: "POST", body })
      return toSessionV1(raw as V2Session)
    }
    return request<Session>(config, withDirectory("/session", directory), { method: "POST", body: { title, model: toCreateSessionModel(model) } })
  },

  async renameSession(config: ServerConfig, id: string, title: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: POST /session/{id}/rename con { title } (no acepta PATCH).
      return request<Session>(config, withDirectory(`/session/${id}/rename`, directory), { method: "POST", body: { title } })
    }
    return request<Session>(config, withDirectory(`/session/${id}`, directory), { method: "PATCH", body: { title } })
  },

  deleteSession(config: ServerConfig, id: string, directory?: string) {
    return request<boolean>(config, withDirectory(`/session/${id}`, directory), { method: "DELETE" })
  },

  async loadMessages(config: ServerConfig, sessionID: string, directory?: string, limit = 100) {
    // readTimeout acotado: mensajes deben llegar rápido; 12s evita 30s de pantalla vacía en caída.
    const raw = await request<MessageEnvelope[] | V2Message[]>(config, withDirectory(`/session/${sessionID}/message?limit=${limit}`, directory), { readTimeout: 12_000 })
    const list = resolveApiVersion(config) === "v2"
      ? (raw as V2Message[]).map(toMessageEnvelopeV1)
      : raw as MessageEnvelope[]
    return (list ?? []).map((m) => ({
      ...m,
      info: {
        ...m.info,
        sessionID: m.info?.sessionID || sessionID,
      },
      parts: (m.parts ?? []).map((p) => ({
        ...p,
        sessionID: p.sessionID ?? m.info?.sessionID ?? sessionID,
      })),
    }))
  },

  async loadTodo(config: ServerConfig, sessionID: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2 no expone /todo todavía: degradar vacío (sin 404 por poll).
      return []
    }
    return request<TodoItem[]>(config, withDirectory(`/session/${sessionID}/todo`, directory))
  },

  async loadDiff(config: ServerConfig, sessionID: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: /vcs/diff (diff del worktree) con VcsFileDiff[] {file,patch,additions,deletions}.
      const raw = await request<unknown>(config, withLocationDirectory("/vcs/diff", directory))
      if (!Array.isArray(raw)) return []
      return raw.map((d) => {
        const item = d as { file?: string; additions?: number; deletions?: number }
        return { file: item.file ?? "", additions: item.additions ?? 0, deletions: item.deletions ?? 0 }
      })
    }
    return request<DiffFile[]>(config, withDirectory(`/session/${sessionID}/diff`, directory))
  },

  loadProjectCurrent(config: ServerConfig, directory?: string) {
    return request<ProjectCurrent>(config, withDirectory("/project/current", directory))
  },

  loadVcs(config: ServerConfig, directory?: string) {
    return request<VcsStatus>(config, withDirectory("/vcs", directory))
  },

  async loadFileStatus(config: ServerConfig, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: /vcs/status con VcsFileStatus[] — misma forma tolerante que v1.
      const raw = await request<unknown>(config, withLocationDirectory("/vcs/status", directory))
      return (Array.isArray(raw) ? raw : []) as FileStatusEntry[]
    }
    return request<FileStatusEntry[] | Record<string, FileStatusEntry>>(config, withDirectory("/file/status", directory))
  },

  async sendPrompt(config: ServerConfig, sessionID: string, text: string, directory?: string, model?: ModelSelection, agentID?: string, images?: Array<{ base64: string; mime: string }>) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: el schema solo acepta parts type text|file|agent|subtask —
      // "image" no existe y el server rechaza con 400. Las imágenes se
      // omiten con un placeholder en el texto para que el usuario sepa
      // que se perdieron.
      let v2Text = text
      if (images && images.length > 0) {
        const imgNote = images.length === 1
          ? "[image omitted — v2 doesn't support image parts]"
          : `[${images.length} images omitted — v2 doesn't support image parts]`
        v2Text = text ? `${text}\n\n${imgNote}` : imgNote
      }
      return request<boolean>(config, withDirectory(`/session/${sessionID}/prompt`, directory), {
        method: "POST",
        body: { text: v2Text }
      })
    }
    const parts: Array<{ type: string; text?: string; data?: string; mimeType?: string; mime?: string; url?: string; filename?: string }> = []
    if (text) {
      parts.push({ type: "text", text })
    } else if (images && images.length > 0) {
      parts.push({ type: "text", text: "(image)" })
    }
    if (images) {
      for (const img of images) {
        // El server acepta type:"file" con url:data:<mime>;base64,<raw>
        // (formato del TUI). type:"image" no existe en el schema.
        const raw = img.base64.includes(",") ? img.base64.split(",")[1] : img.base64
        parts.push({
          type: "file",
          mime: img.mime,
          filename: `clipboard.${img.mime.split("/")[1] || "png"}`,
          url: `data:${img.mime};base64,${raw}`,
        })
      }
    }
    return request<boolean>(config, withDirectory(`/session/${sessionID}/prompt_async`, directory), {
      method: "POST",
      body: { parts, model: toModelBody(model), agent: agentID, variant: model?.variant || undefined }
    })
  },

  async sendCommand(config: ServerConfig, sessionID: string, command: string, argumentsText: string, directory?: string, model?: ModelSelection, agentID?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: model va como Model.Ref {id, providerID, variant} — sin variant suelto.
      const body: Record<string, unknown> = { command, arguments: argumentsText }
      if (agentID) body.agent = agentID
      if (model) body.model = { id: model.modelID, providerID: model.providerID, variant: model.variant || undefined }
      return request<MessageEnvelope>(config, withDirectory(`/session/${sessionID}/command`, directory), {
        method: "POST",
        body,
        readTimeout: 300_000
      })
    }
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

  async abort(config: ServerConfig, sessionID: string, directory?: string) {
    // v2 no expone /abort: usa /interrupt.
    const path = (await getApiVersion(config)) === "v2"
      ? `/session/${sessionID}/interrupt`
      : `/session/${sessionID}/abort`
    return request<boolean>(config, withDirectory(path, directory), {
      method: "POST",
      body: {}
    })
  },

  async revert(config: ServerConfig, sessionID: string, messageID: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: revert en dos pasos — stage (mueve el boundary y aplica files) + commit.
      await request<unknown>(config, withDirectory(`/session/${sessionID}/revert/stage`, directory), {
        method: "POST",
        body: { messageID, files: true }
      })
      return request<Session>(config, withDirectory(`/session/${sessionID}/revert/commit`, directory), {
        method: "POST",
        body: {}
      })
    }
    return request<Session>(config, withDirectory(`/session/${sessionID}/revert`, directory), {
      method: "POST",
      body: { messageID }
    })
  },

  async unrevert(config: ServerConfig, sessionID: string, directory?: string) {
    const path = (await getApiVersion(config)) === "v2"
      ? `/session/${sessionID}/revert/clear`
      : `/session/${sessionID}/unrevert`
    return request<Session>(config, withDirectory(path, directory), {
      method: "POST",
      body: {}
    })
  },

  async summarize(config: ServerConfig, sessionID: string, providerID: string, modelID: string, directory?: string, auto = false, readTimeout = 300_000) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: /compact sin payload (usa el modelo de la sesión).
      return request<boolean>(config, withDirectory(`/session/${sessionID}/compact`, directory), {
        method: "POST",
        body: {},
        readTimeout
      })
    }
    return request<boolean>(config, withDirectory(`/session/${sessionID}/summarize`, directory), {
      method: "POST",
      body: { providerID, modelID, auto },
      readTimeout
    })
  },

  async questionReply(config: ServerConfig, requestID: string, answers: string[][], directory?: string, sessionID?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: reply por-sesión; sin sessionID no hay path válido.
      if (!sessionID) throw new Error("v2 question reply requires sessionID")
      return request<boolean>(config, withDirectory(`/session/${sessionID}/question/${encodeURIComponent(requestID)}/reply`, directory), {
        method: "POST",
        body: { answers }
      })
    }
    return request<boolean>(config, withDirectory(`/question/${encodeURIComponent(requestID)}/reply`, directory), {
      method: "POST",
      body: { answers }
    })
  },

  async questionReject(config: ServerConfig, requestID: string, directory?: string, sessionID?: string) {
    if ((await getApiVersion(config)) === "v2") {
      if (!sessionID) throw new Error("v2 question reject requires sessionID")
      return request<boolean>(config, withDirectory(`/session/${sessionID}/question/${encodeURIComponent(requestID)}/reject`, directory), {
        method: "POST",
        body: {}
      })
    }
    return request<boolean>(config, withDirectory(`/question/${encodeURIComponent(requestID)}/reject`, directory), {
      method: "POST",
      body: {}
    })
  },

  async findFiles(config: ServerConfig, query: string, directory?: string, limit = 20) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: /fs/find devuelve FileSystemEntry[] ({path,type}) ya tipado.
      const basePath = withLocationDirectory("/fs/find", directory)
      const sep = basePath.includes("?") ? "&" : "?"
      const raw = await request<Array<{ path?: string; type?: string }>>(config,
        `${basePath}${sep}query=${encodeURIComponent(query)}&type=file&limit=${limit}`)
      return raw.map((e) => ({ path: e.path ?? "", type: (e.type === "directory" ? "directory" : "file") as "file" | "directory" }))
    }
    // El server devuelve string[] (paths relativos), no {path,type}[].
    return request<string[]>(config,
      withDirectory(`/find/file?query=${encodeURIComponent(query)}&limit=${limit}`, directory))
      .then((paths) => paths.map((p) => ({ path: p, type: "file" as const })))
  },

  async listMCPResources(config: ServerConfig) {
    // v2: /mcp/resource; v1: /experimental/resource. Mismo parseo tolerante.
    const path = (await getApiVersion(config)) === "v2" ? "/mcp/resource" : "/experimental/resource"
    return request<unknown>(config, path).then((raw) => {
      // El server devuelve un RECORD { [key]: { name, uri, description?, client } };
      // versiones viejas devuelven array o { resources: [...] } — parseo tolerante.
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

  async listPendingQuestions(config: ServerConfig, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: /question/request devuelve { location, data: Question.Request[] } —
      // el unwrap de {data} lo hace request(); acá mapeamos a la forma v1.
      return request<unknown>(config, withLocationDirectory("/question/request", directory)).then((raw) => {
        if (!Array.isArray(raw)) return []
        return raw.map((q) => {
          const item = q as { id: string; sessionID?: string; questions?: unknown[]; tool?: { messageID: string; id: string } }
          return {
            id: item.id,
            sessionID: item.sessionID,
            questions: Array.isArray(item.questions)
              ? (item.questions as { question: string; header?: string; options: QuestionOption[]; multiple?: boolean; custom?: boolean }[])
              : [],
            tool: item.tool ? { messageID: item.tool.messageID, callID: item.tool.id } : undefined,
          }
        })
      })
    }
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

  async listPermissions(config: ServerConfig, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: /permission/request → Permission.Request[] { id, sessionID, action,
      // resources, ... } — todos los listados son "pending".
      return request<unknown>(config, withLocationDirectory("/permission/request", directory)).then((raw) => {
        if (!Array.isArray(raw)) return []
        return raw.map((p) => {
          const item = p as { id: string; sessionID?: string; action: string }
          return { requestID: item.id, permission: item.action, status: "pending", sessionID: item.sessionID }
        })
      })
    }
    return request<{ requestID: string; permission: string; status: string }[]>(config, withDirectory("/permission", directory))
  },

  async permissionReply(config: ServerConfig, requestID: string, approve: boolean, directory?: string, sessionID?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: reply por-sesión con { reply: "once" | "always" | "reject" }.
      if (!sessionID) throw new Error("v2 permission reply requires sessionID")
      return request<boolean>(config, withDirectory(`/session/${sessionID}/permission/${encodeURIComponent(requestID)}/reply`, directory), {
        method: "POST",
        body: { reply: approve ? "once" : "reject" }
      })
    }
    return request<boolean>(config, withDirectory(`/permission/${encodeURIComponent(requestID)}/reply`, directory), {
      method: "POST",
      body: { approve }
    })
  },

  async fetchDiffContent(config: ServerConfig, sessionID: string, file: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2 no expone diff por archivo: probar /vcs/diff/raw y degradar a vacío.
      const raw = await request<{ content?: string }>(config,
        withLocationDirectory(`/vcs/diff/raw?file=${encodeURIComponent(file)}`, directory))
        .catch(() => null)
      return { content: raw?.content ?? "" }
    }
    return request<{ content: string }>(config, withDirectory(`/session/${sessionID}/diff/${encodeURIComponent(file)}`, directory))
  },

  async readFile(config: ServerConfig, path: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: /fs/read/<path relativo> devuelve el archivo crudo (blob).
      const rel = toServerRelative(path, directory).split("/").map(encodeURIComponent).join("/")
      const target = `${baseUrl(config)}/api/fs/read/${rel}${withLocationDirectory("", directory)}`
      const bytes = await fetchFileBytes(config, target)
      const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes)
      if (!text.includes("\uFFFD")) return { type: "text" as const, content: text }
      return { type: "binary" as const, content: arrayBufferToBase64(bytes), encoding: "base64" }
    }
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

  async writeFile(config: ServerConfig, path: string, content: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // v2 no expone escritura de archivos (solo fs/list/read/find).
      throw new Error("File writing is not supported on v2 servers yet")
    }
    return request<boolean>(config, withDirectory("/file", directory), {
      method: "POST",
      body: { path: toServerRelative(path, directory), content }
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
