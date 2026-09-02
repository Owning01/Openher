import type {
  CommandInfo,
  DiffFile,
  FileStatusEntry,
  FileEntry,
  HealthResponse,
  MessageEnvelope,
  ModelSelection,
  ProjectCurrent,
  PathInfo,
  QuestionOption,
  ServerConfig,
  ServerProviderList,
  Session,
  SessionStatus,
  VcsStatus
} from "./types"
type TodoItem = any
import {
  arrayBufferToBase64,
  baseUrl,
  fetchFileBytes,
  request,
  requestWithHeaders,
  toServerRelative,
  withDirectory,
  withLocationDirectory
} from "./shared/api/client"
import { getApiVersion, rememberApiVersion, resolveApiVersion, setHealthProbe } from "./shared/api/version"
import {
  mapProviderModels,
  modelWireName,
  toAgentOption,
  toCreateSessionModel,
  toMessageEnvelopeV1,
  toModelBody,
  toSessionV1
} from "./shared/api/mappers"
import type { V2Message, V2Session, ConfigProvidersResponse, AgentResponse } from "./shared/api/mappers"
import { getOpencodeClient } from "./shared/api/opencodeClient"

function errorStatus(error: unknown): number | undefined {
  if (!(error instanceof Error)) return undefined
  const cause = error.cause as { status?: unknown } | undefined
  return typeof cause?.status === "number" ? cause.status : undefined
}

async function syncV2SessionContext(
  client: Awaited<ReturnType<typeof getOpencodeClient>>,
  sessionID: string,
  model?: ModelSelection,
  agentID?: string,
) {
  // En v2 modelo y agente viven en la sesión; no deben viajar como campos
  // inventados dentro de /prompt. Las operaciones son 204 y por eso no
  // generan un segundo prompt ni dependen de una respuesta JSON.
  if (model) {
    await (client as any).session.switchModel({
      sessionID,
      model: { id: model.modelID, providerID: model.providerID, ...(model.variant ? { variant: model.variant } : {}) },
    })
  }
  if (agentID) await (client as any).session.switchAgent({ sessionID, agent: agentID })
}

// Re-exports for compatibilidad — api.ts sigue siendo el entry point público
export { toBase64, authHeader, baseUrl } from "./shared/api/client"
export type { ApiVersion } from "./shared/api/version"
export { resolveApiVersion, getApiVersion, rememberApiVersion, onApiVersionChange, apiPath, unwrapData, detectedVersionCache, detectionPromises, versionKey, versionListeners, ensureVersionDetected, setHealthProbe } from "./shared/api/version"
export type { ConfigProvidersResponse, AgentResponse, V2Session, V2Message } from "./shared/api/mappers"
export { mapProviderModels, toAgentOption, toModelBody, toCreateSessionModel, modelWireName, toSessionV1, toMessageEnvelopeV1 } from "./shared/api/mappers"
export { normalizeSlashes, toServerRelative, withDirectory, withLocationDirectory, fetchFileBytes, arrayBufferToBase64, responseDetail, normalizeHeaders, serializedSize, requestWithHeaders, requestRaw, request } from "./shared/api/client"
export type { RequestOptions, ResponseWithHeaders } from "./shared/api/client"

export const api = {
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
    // auto: v2 primero porque v2 devuelve 200 text/html en /global/health (fallback SPA) en vez de 404,
    // lo que rompería la detección si probamos v1 primero y el parser JSON lanza "Unexpected token '<'".
    try {
      const data = (await requestWithHeaders<HealthResponse>(config, "/api/health", { rawPath: true })).data
      rememberApiVersion(config, "v2")
      return data
    } catch (err) {
      if (!(err instanceof Error) || !/404|not found|Unexpected token|<!doctype|is not valid JSON/i.test(err.message)) throw err
      const data = (await requestWithHeaders<HealthResponse>(config, "/global/health", { rawPath: true })).data
      rememberApiVersion(config, "v1")
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
      const batch = resolveApiVersion(config) === "v2" ? (response.data as V2Session[]).map(toSessionV1) : (response.data as Session[])
      sessions.push(...batch)
      cursor = response.headers["x-next-cursor"]
    } while (cursor)
    return sessions
  },

  async listProjects(config: ServerConfig): Promise<Array<{ id: string; directory: string; name?: string }>> {
    try {
      if ((await getApiVersion(config)) === "v2") {
        const raw = await request<Array<{ id?: string; directory?: string; name?: string; worktree?: string }>>(config, "/project")
        if (Array.isArray(raw)) {
          return raw.map((p) => ({
            id: p.id || p.directory || p.worktree || "",
            directory: p.directory || p.worktree || "",
            name: p.name || (p.directory ? p.directory.split(/[\/\\]/).filter(Boolean).pop() : undefined),
          })).filter((p) => Boolean(p.directory))
        }
        return []
      }
      const raw = await request<Array<{ id?: string; directory?: string; name?: string; worktree?: string }>>(config, "/project")
      if (Array.isArray(raw)) {
        return raw.map((p) => ({
          id: p.id || p.directory || p.worktree || "",
          directory: p.directory || p.worktree || "",
          name: p.name || (p.worktree ? p.worktree.split(/[\/\\]/).filter(Boolean).pop() : undefined),
        })).filter((p) => Boolean(p.directory))
      }
      return []
    } catch {
      return []
    }
  },

  async listStatuses(config: ServerConfig, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
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
      const loc = await request<{ directory?: string; workspaceID?: string; project?: { id?: string; directory?: string } }>(
        config,
        withLocationDirectory("/location", directory),
      )
      const dir = loc.directory ?? loc.project?.directory ?? ""
      return { home: dir, state: dir, config: dir, worktree: dir, directory: dir }
    }
    return request<PathInfo>(config, withDirectory("/path", directory))
  },

  async listFiles(config: ServerConfig, path: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      const rel = path.replace(/\\/g, "/").replace(/^[A-Za-z]:\/?/, "").replace(/^\/+/, "")
      const basePath = withLocationDirectory("/fs/list", directory)
      const sep = basePath.includes("?") ? "&" : "?"
      const raw = await request<Array<{ path?: string; type?: string }>>(config, `${basePath}${rel ? `${sep}path=${encodeURIComponent(rel)}` : ""}`)
      return raw.map((e) => ({
        name: (e.path ?? "").split("/").pop() ?? "",
        path: e.path ?? "",
        absolute: e.path ?? "",
        type: (e.type === "directory" ? "directory" : "file") as "file" | "directory",
      }))
    }
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
      const [raw, def] = await Promise.all([
        request<unknown>(config, withLocationDirectory("/model", directory)),
        request<unknown>(config, withLocationDirectory("/model/default", directory)).catch(() => null),
      ])
      const models = Array.isArray(raw)
        ? (raw as Array<{
            id?: string
            modelID?: string
            providerID?: string
            name?: string
            status?: string
            enabled?: boolean
            capabilities?: { tools?: boolean; input?: string[] }
            limit?: { context?: number; output?: number }
            variants?: Array<{ id?: string }>
          }>)
        : []
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

  async loadProviders(config: ServerConfig, directory?: string) {
    const v2 = (await getApiVersion(config)) === "v2"
    if (v2) {
      const raw = await request<unknown>(config, withLocationDirectory("/integration", directory))
      const list = Array.isArray(raw) ? (raw as Array<{ id?: string; name?: string; authMethods?: unknown }>) : []
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

  async addCustomProvider(config: ServerConfig, providerID: string, name: string, baseURL: string, models: string[]) {
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

  loadRawConfig(config: ServerConfig, directory?: string) {
    return request<unknown>(config, withDirectory("/config", directory))
  },

  saveRawConfig(config: ServerConfig, rawBody: Record<string, unknown>, directory?: string) {
    return request<unknown>(config, withDirectory("/config", directory), {
      method: "PATCH",
      body: rawBody,
    })
  },

  async createSession(config: ServerConfig, title?: string, model?: ModelSelection, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
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
      return request<Session>(config, withDirectory(`/session/${id}/rename`, directory), { method: "POST", body: { title } })
    }
    return request<Session>(config, withDirectory(`/session/${id}`, directory), { method: "PATCH", body: { title } })
  },

  async deleteSession(config: ServerConfig, id: string, directory?: string) {
    const attempt = async (dir?: string) => {
      const path = withDirectory(`/session/${id}`, dir)
      try {
        await request<boolean>(config, path, { method: "DELETE" })
        return true as boolean
      } catch (e) {
        const msg = String((e as Error).message || e)
        if (msg.includes("Unexpected token") || msg.includes("is not valid JSON") || msg.includes("JSON")) return true as boolean
        throw e
      }
    }
    try {
      return await attempt(directory)
    } catch (e) {
      if (directory) {
        try { return await attempt(undefined) } catch { /* ignore */ }
      }
      throw e
    }
  },

  async loadMessages(config: ServerConfig, sessionID: string, directory?: string, limit = 100) {
    const safeLimit = Math.min(limit, 200)
    try {
      const client = await getOpencodeClient(config)
      // Probar múltiples variantes del client — el nombre exacto varía entre betas v2
      let res: unknown
      const tryCall = async (fn: unknown, args: unknown) => {
        if (typeof fn !== "function") return undefined
        try { return await (fn as any)(args) } catch { return undefined }
      }
      res = await tryCall((client as any).session?.context, { sessionID })
      if (!res) res = await tryCall((client as any).session?.messages, { sessionID, limit: safeLimit })
      if (!res) res = await tryCall((client as any).session?.getMessages, { sessionID, limit: safeLimit })
      if (!res) res = await tryCall((client as any).message?.list, { sessionID, limit: safeLimit })
      if (!res) res = await tryCall((client as any).message?.listMessages, { sessionID, limit: safeLimit })
      const rawList: unknown = Array.isArray(res) ? res : (res as any)?.data ?? res
      if (Array.isArray(rawList)) {
        const mapped = (rawList as any[]).map((m: any) => {
          if (m && typeof m === "object" && "info" in m && "parts" in m) return m as MessageEnvelope
          try {
            return toMessageEnvelopeV1(m as V2Message)
          } catch {
            // naive mapping for SessionMessageInfo
            const text = m?.text ?? m?.content ?? ""
            return {
              info: {
                id: m?.id ?? `${sessionID}_${Math.random()}`,
                role: m?.type ?? "assistant",
                sessionID: m?.sessionID ?? sessionID,
                time: { created: m?.time?.created ?? Date.now() },
                agent: m?.agent,
                modelID: m?.model?.id,
                providerID: m?.model?.providerID,
              },
              parts: [{ id: `${m?.id ?? "part"}_0`, sessionID, type: "text", text: typeof text === "string" ? text : "" }],
            } as MessageEnvelope
          }
        }) as MessageEnvelope[]
        if (mapped && mapped.length > 0) {
          return mapped.map((mm) => ({
            ...mm,
            info: { ...mm.info, sessionID: mm.info?.sessionID || sessionID },
            parts: (mm.parts ?? []).map((p) => ({ ...p, sessionID: (p as any).sessionID ?? mm.info?.sessionID ?? sessionID })),
          }))
        }
        // Si el client devolvió array vacío, no retornar — dejar que el fallback HTTP lo intente (puede tener datos con otro dialecto)
        if (Array.isArray(rawList) && rawList.length === 0) {
          // continuar a HTTP fallback
        } else if (mapped) {
          return mapped.map((mm) => ({
            ...mm,
            info: { ...mm.info, sessionID: mm.info?.sessionID || sessionID },
            parts: (mm.parts ?? []).map((p) => ({ ...p, sessionID: (p as any).sessionID ?? mm.info?.sessionID ?? sessionID })),
          }))
        }
      }
    } catch {}
    // HTTP fallback: probar v1 path primero, luego v2 alternativo si 404
    let raw: MessageEnvelope[] | V2Message[] | null = null
    try {
      raw = await request<MessageEnvelope[] | V2Message[]>(config, withDirectory(`/session/${sessionID}/message?limit=${safeLimit}`, directory), {
        readTimeout: 12_000,
      })
    } catch (e) {
      const msg = String((e as Error).message || "")
      if (/404|not found/i.test(msg)) {
        try {
          raw = await request<MessageEnvelope[] | V2Message[]>(config, withLocationDirectory(`/session/${sessionID}/message?limit=${safeLimit}`, directory), {
            readTimeout: 12_000,
          })
        } catch {}
      }
      if (!raw) throw e
    }
    const list = resolveApiVersion(config) === "v2" ? (raw as V2Message[]).map(toMessageEnvelopeV1) : (raw as MessageEnvelope[])
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
      return []
    }
    return request<TodoItem[]>(config, withDirectory(`/session/${sessionID}/todo`, directory))
  },

  async loadDiff(config: ServerConfig, sessionID: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
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
      const raw = await request<unknown>(config, withLocationDirectory("/vcs/status", directory))
      return (Array.isArray(raw) ? raw : []) as FileStatusEntry[]
    }
    return request<FileStatusEntry[] | Record<string, FileStatusEntry>>(config, withDirectory("/file/status", directory))
  },

  async sendPrompt(
    config: ServerConfig,
    sessionID: string,
    text: string,
    directory?: string,
    model?: ModelSelection,
    agentID?: string,
    images?: Array<{ base64: string; mime: string }>,
  ) {
    const version = await getApiVersion(config)
    if (version === "v2") {
      const client = await getOpencodeClient(config)
      await syncV2SessionContext(client, sessionID, model, agentID)
      const res = await (client as any).session.prompt({
        sessionID,
        text,
        files: images?.map((img) => ({
          uri: `data:${img.mime};base64,${img.base64.includes(",") ? img.base64.split(",")[1] : img.base64}`,
          name: `clipboard.${img.mime.split("/")[1] || "png"}`,
        })),
      })
      return (res ?? true) as boolean
    }
    const parts: Array<{ type: string; text?: string; data?: string; mimeType?: string; mime?: string; url?: string; filename?: string }> = []
    if (text) {
      parts.push({ type: "text", text })
    } else if (images && images.length > 0) {
      parts.push({ type: "text", text: "(image)" })
    }
    if (images) {
      for (const img of images) {
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
      body: { parts, model: toModelBody(model), agent: agentID, variant: model?.variant || undefined },
      retryable: false,
    })
  },

  async sendCommand(
    config: ServerConfig,
    sessionID: string,
    command: string,
    argumentsText: string,
    directory?: string,
    model?: ModelSelection,
    agentID?: string,
  ) {
    const version = await getApiVersion(config)
    if (version === "v2") {
      const client = await getOpencodeClient(config)
      await syncV2SessionContext(client, sessionID, model, agentID)
      const res = await (client as any).session.command({ sessionID, command, text: argumentsText })
      if (res) {
        try { return toMessageEnvelopeV1(res as V2Message) } catch { return res as MessageEnvelope }
      }
      return true as unknown as MessageEnvelope
    }
    return request<MessageEnvelope>(config, withDirectory(`/session/${sessionID}/command`, directory), {
      method: "POST",
      body: { command, arguments: argumentsText, agent: agentID, model: modelWireName(model), variant: model?.variant || undefined },
      readTimeout: 300_000,
      retryable: false,
    })
  },

  sendShell(config: ServerConfig, sessionID: string, command: string, directory?: string) {
    return request<boolean>(config, withDirectory(`/session/${sessionID}/shell`, directory), {
      method: "POST",
      body: { command },
      retryable: false,
    })
  },

  async abort(config: ServerConfig, sessionID: string, directory?: string) {
    const version = await getApiVersion(config)
    if (version === "v2") {
      const client = await getOpencodeClient(config)
      const res = await (client as any).session.interrupt({ sessionID })
      return (res as any)?.interrupted ?? true
    }
    const primary = `/session/${sessionID}/abort`
    const secondary = `/session/${sessionID}/interrupt`
    try {
      return await request<boolean>(config, withDirectory(primary, directory), {
        method: "POST",
        retryable: false,
      })
    } catch (error) {
      if (errorStatus(error) !== 404) throw error
      return await request<boolean>(config, withDirectory(secondary, directory), {
        method: "POST",
        retryable: false,
      })
    }
  },

  async revert(config: ServerConfig, sessionID: string, messageID: string, directory?: string) {
    const version = await getApiVersion(config)
    if (version === "v2") {
      const client = await getOpencodeClient(config)
      const res = await (client as any).session.revert.stage({ sessionID, messageID })
      try {
        return toSessionV1(res as V2Session)
      } catch {
        return res as unknown as Session
      }
    }
    return request<Session>(config, withDirectory(`/session/${sessionID}/revert`, directory), {
      method: "POST",
      body: { messageID },
      retryable: false,
    })
  },

  async unrevert(config: ServerConfig, sessionID: string, directory?: string) {
    const version = await getApiVersion(config)
    if (version === "v2") {
      const client = await getOpencodeClient(config)
      const res = await (client as any).session.revert.clear({ sessionID })
      try {
        return toSessionV1(res as V2Session)
      } catch {
        return res as unknown as Session
      }
    }
    return request<Session>(config, withDirectory(`/session/${sessionID}/unrevert`, directory), {
      method: "POST",
      body: {},
      retryable: false,
    })
  },

  async summarize(config: ServerConfig, sessionID: string, providerID: string, modelID: string, directory?: string, auto = false, readTimeout = 300_000) {
    const version = await getApiVersion(config)
    if (version === "v2") {
      const client = await getOpencodeClient(config)
      const res = await (client as any).session.compact({ sessionID })
      return (res ?? true) as boolean
    }
    return request<boolean>(config, withDirectory(`/session/${sessionID}/summarize`, directory), {
      method: "POST",
      body: { providerID, modelID, auto },
      readTimeout,
      retryable: false,
    })
  },

  async questionReply(config: ServerConfig, requestID: string, answers: string[][], directory?: string, sessionID?: string) {
    if ((await getApiVersion(config)) === "v2") {
      if (!sessionID) throw new Error("v2 question reply requires sessionID")
      return request<boolean>(config, withDirectory(`/session/${sessionID}/question/${encodeURIComponent(requestID)}/reply`, directory), {
        method: "POST",
        body: { answers },
        retryable: false,
      })
    }
    return request<boolean>(config, withDirectory(`/question/${encodeURIComponent(requestID)}/reply`, directory), {
      method: "POST",
      body: { answers },
      retryable: false,
    })
  },

  async questionReject(config: ServerConfig, requestID: string, directory?: string, sessionID?: string) {
    if ((await getApiVersion(config)) === "v2") {
      if (!sessionID) throw new Error("v2 question reject requires sessionID")
      return request<boolean>(config, withDirectory(`/session/${sessionID}/question/${encodeURIComponent(requestID)}/reject`, directory), {
        method: "POST",
        body: {},
        retryable: false,
      })
    }
    return request<boolean>(config, withDirectory(`/question/${encodeURIComponent(requestID)}/reject`, directory), {
      method: "POST",
      body: {},
      retryable: false,
    })
  },

  async findFiles(config: ServerConfig, query: string, directory?: string, limit = 20) {
    if ((await getApiVersion(config)) === "v2") {
      const basePath = withLocationDirectory("/fs/find", directory)
      const sep = basePath.includes("?") ? "&" : "?"
      const raw = await request<Array<{ path?: string; type?: string }>>(config, `${basePath}${sep}query=${encodeURIComponent(query)}&type=file&limit=${limit}`)
      return raw.map((e) => ({ path: e.path ?? "", type: (e.type === "directory" ? "directory" : "file") as "file" | "directory" }))
    }
    return request<string[]>(config, withDirectory(`/find/file?query=${encodeURIComponent(query)}&limit=${limit}`, directory)).then((paths) =>
      paths.map((p) => ({ path: p, type: "file" as const })),
    )
  },

  async listMCPResources(config: ServerConfig) {
    const path = (await getApiVersion(config)) === "v2" ? "/mcp/resource" : "/experimental/resource"
    return request<unknown>(config, path).then((raw) => {
      if (Array.isArray(raw)) return raw as { id: string; name: string; description?: string }[]
      if (raw && typeof raw === "object") {
        const entries = Object.entries(raw as Record<string, unknown>)
        const isRecord =
          entries.length > 0 && entries.every(([, v]) => v !== null && typeof v === "object" && "uri" in (v as object))
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
      try {
        const raw = await request<unknown>(config, withLocationDirectory("/form/request", directory))
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
      } catch {
        return []
      }
    }
    return request<unknown>(config, withDirectory("/question", directory)).then((raw) => {
      if (!Array.isArray(raw)) return []
      return raw.map((q) => {
        const item = q as {
          id: string
          question?: string
          status?: string
          sessionID?: string
          questions?: unknown[]
          tool?: { messageID: string; callID: string }
        }
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
      return request<unknown>(config, withLocationDirectory("/permission/request", directory)).then((raw) => {
        if (!Array.isArray(raw)) return []
        return raw.map((p) => {
          const item = p as { id: string; sessionID?: string; action: string }
          return { requestID: item.id, permission: item.action, status: "pending", sessionID: item.sessionID }
        })
      })
    }
    return request<{ requestID: string; permission: string; status: string; sessionID?: string }[]>(config, withDirectory("/permission", directory))
  },

  async permissionReply(config: ServerConfig, requestID: string, approve: boolean, directory?: string, sessionID?: string) {
    if ((await getApiVersion(config)) === "v2") {
      if (!sessionID) throw new Error("v2 permission reply requires sessionID")
      return request<boolean>(config, withDirectory(`/session/${sessionID}/permission/${encodeURIComponent(requestID)}/reply`, directory), {
        method: "POST",
        body: { reply: approve ? "once" : "reject" },
        retryable: false,
      })
    }
    return request<boolean>(config, withDirectory(`/permission/${encodeURIComponent(requestID)}/reply`, directory), {
      method: "POST",
      body: { approve },
      retryable: false,
    })
  },

  async fetchDiffContent(config: ServerConfig, sessionID: string, file: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      const raw = await request<{ content?: string }>(config, withLocationDirectory(`/vcs/diff/raw?file=${encodeURIComponent(file)}`, directory)).catch(
        () => null,
      )
      return { content: raw?.content ?? "" }
    }
    return request<{ content: string }>(config, withDirectory(`/session/${sessionID}/diff/${encodeURIComponent(file)}`, directory))
  },

  async readFile(config: ServerConfig, path: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      const rel = toServerRelative(path, directory).split("/").map(encodeURIComponent).join("/")
      const target = `${baseUrl(config)}/api/fs/read/${rel}${withLocationDirectory("", directory)}`
      const bytes = await fetchFileBytes(config, target)
      const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes)
      if (!text.includes("\uFFFD")) return { type: "text" as const, content: text }
      return { type: "binary" as const, content: arrayBufferToBase64(bytes), encoding: "base64" }
    }
    return request<{ type: "text" | "binary"; content: string; encoding?: string }>(
      config,
      withDirectory(`/file/content?path=${encodeURIComponent(toServerRelative(path, directory))}`, directory),
    )
  },

  setModelVariant(config: ServerConfig, providerID: string, modelID: string, variantName: string, options: Record<string, unknown>, directory?: string) {
    return request<unknown>(config, withDirectory("/config", directory), {
      method: "PATCH",
      body: {
        provider: {
          [providerID]: {
            models: {
              [modelID]: {
                variants: { [variantName]: options },
              },
            },
          },
        },
      },
    })
  },

  async writeFile(config: ServerConfig, path: string, content: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      throw new Error("File writing is not supported on v2 servers yet")
    }
    return request<boolean>(config, withDirectory("/file", directory), {
      method: "POST",
      body: { path: toServerRelative(path, directory), content },
    })
  },

  async fetchStats(config: ServerConfig, statsPort: number, since = "", until = "", model = "", scope = "summary") {
    const params = new URLSearchParams({ raw: "1" })
    if (since) params.set("since", since)
    if (until) params.set("until", until)
    if (model) params.set("model", model)
    if (scope) params.set("scope", scope)
    const qs = params.toString()
    // Local primero (desktop shell proxy) — rápido, sin CORS, lee opencode.db local.
    // El proxy Rust en desktop-app/src/api.rs:544 → http://127.0.0.1:8765/api/{rest}
    const tryLocal = async (): Promise<import("./types").StatsPayload> => {
      // Asegurar que el server de stats esté levantado (idempotente) — no bloquea, el proxy espera 15s
      try { await fetch("/shell/stats/start", { method: "POST", cache: "no-store" }) } catch {}
      const url = `/shell/stats/proxy/data?${qs}`
      // Reintento corto para el arranque del thread de stats (primer hit puede ser 502 mientras levanta)
      for (let attempt = 0; attempt < 2; attempt++) {
        const ctl = new AbortController()
        const t = setTimeout(() => ctl.abort(), 12000)
        try {
          const res = await fetch(url, { cache: "no-store", signal: ctl.signal })
          if (!res.ok) throw new Error(`Stats HTTP ${res.status}`)
          const data = await res.json()
          if ((data as any)?.error) throw new Error((data as any).error)
          return data as import("./types").StatsPayload
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          const isRetryable = /502|AbortError|Failed to fetch|NetworkError/i.test(msg) && attempt === 0
          if (isRetryable) {
            await new Promise((r) => setTimeout(r, 600))
            continue
          }
          throw e
        } finally { clearTimeout(t) }
      }
      throw new Error("Stats local no disponible")
    }
    const tryRemote = async (): Promise<import("./types").StatsPayload> => {
      const host = config.host.replace(/^https?:\/\//, "").replace(/\/+$/, "")
      const url = `http://${host}:${statsPort}/api/data?${qs}`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) throw new Error(`Stats HTTP ${res.status}`)
      const data = await res.json()
      if ((data as any)?.error) throw new Error((data as any).error)
      return data as import("./types").StatsPayload
    }
    // Intentar local (mismo origen) — si estamos en desktop (127.0.0.1:4848) funciona; en mobile falla rápido y cae a remote.
    try {
      return await tryLocal()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      // Si es 404 (no hay proxy, no estamos en desktop) → fallback remoto
      // Si es 502 stats unavailable → también fallback
      const isLocalNotAvailable = /404|502|Failed to fetch|Load failed|NetworkError|AbortError/i.test(msg)
      if (isLocalNotAvailable) {
        return await tryRemote()
      }
      throw e
    }
  },
}

// Wire health probe for version detection (evita ciclo client↔version)
setHealthProbe(api.health)
