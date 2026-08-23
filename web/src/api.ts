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

  deleteSession(config: ServerConfig, id: string, directory?: string) {
    return request<boolean>(config, withDirectory(`/session/${id}`, directory), { method: "DELETE" })
  },

  async loadMessages(config: ServerConfig, sessionID: string, directory?: string, limit = 100) {
    const raw = await request<MessageEnvelope[] | V2Message[]>(config, withDirectory(`/session/${sessionID}/message?limit=${limit}`, directory), {
      readTimeout: 12_000,
    })
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
    if ((await getApiVersion(config)) === "v2") {
      let v2Text = text
      if (images && images.length > 0) {
        const imgNote =
          images.length === 1
            ? "[image omitted — v2 doesn't support image parts]"
            : `[${images.length} images omitted — v2 doesn't support image parts]`
        v2Text = text ? `${text}\n\n${imgNote}` : imgNote
      }
      return request<boolean>(config, withDirectory(`/session/${sessionID}/prompt`, directory), {
        method: "POST",
        body: { text: v2Text },
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
    if ((await getApiVersion(config)) === "v2") {
      const body: Record<string, unknown> = { command, arguments: argumentsText }
      if (agentID) body.agent = agentID
      if (model) body.model = { id: model.modelID, providerID: model.providerID, variant: model.variant || undefined }
      return request<MessageEnvelope>(config, withDirectory(`/session/${sessionID}/command`, directory), {
        method: "POST",
        body,
        readTimeout: 300_000,
      })
    }
    return request<MessageEnvelope>(config, withDirectory(`/session/${sessionID}/command`, directory), {
      method: "POST",
      body: { command, arguments: argumentsText, agent: agentID, model: modelWireName(model), variant: model?.variant || undefined },
      readTimeout: 300_000,
    })
  },

  sendShell(config: ServerConfig, sessionID: string, command: string, directory?: string) {
    return request<boolean>(config, withDirectory(`/session/${sessionID}/shell`, directory), {
      method: "POST",
      body: { command },
    })
  },

  async abort(config: ServerConfig, sessionID: string, directory?: string) {
    const isV2 = (await getApiVersion(config)) === "v2"
    const primary = isV2 ? `/session/${sessionID}/interrupt` : `/session/${sessionID}/abort`
    const secondary = isV2 ? `/session/${sessionID}/abort` : `/session/${sessionID}/interrupt`
    try {
      return await request<boolean>(config, withDirectory(primary, directory), {
        method: "POST",
      })
    } catch {
      return await request<boolean>(config, withDirectory(secondary, directory), {
        method: "POST",
      }).catch(() => false)
    }
  },

  async revert(config: ServerConfig, sessionID: string, messageID: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      try {
        return await request<Session>(config, withLocationDirectory(`/session/${sessionID}/revert/stage`, directory), {
          method: "POST",
          body: { messageID, files: true },
        })
      } catch {
        return request<Session>(config, withDirectory(`/session/${sessionID}/revert`, directory), {
          method: "POST",
          body: { messageID },
        })
      }
    }
    return request<Session>(config, withDirectory(`/session/${sessionID}/revert`, directory), {
      method: "POST",
      body: { messageID },
    })
  },

  async unrevert(config: ServerConfig, sessionID: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      return request<Session>(config, withLocationDirectory(`/session/${sessionID}/revert/clear`, directory), {
        method: "POST",
        body: {},
      })
    }
    return request<Session>(config, withDirectory(`/session/${sessionID}/unrevert`, directory), {
      method: "POST",
      body: {},
    })
  },

  async summarize(config: ServerConfig, sessionID: string, providerID: string, modelID: string, directory?: string, auto = false, readTimeout = 300_000) {
    if ((await getApiVersion(config)) === "v2") {
      return request<boolean>(config, withDirectory(`/session/${sessionID}/compact`, directory), {
        method: "POST",
        body: {},
        readTimeout,
      })
    }
    return request<boolean>(config, withDirectory(`/session/${sessionID}/summarize`, directory), {
      method: "POST",
      body: { providerID, modelID, auto },
      readTimeout,
    })
  },

  async questionReply(config: ServerConfig, requestID: string, answers: string[][], directory?: string, sessionID?: string) {
    if ((await getApiVersion(config)) === "v2") {
      if (!sessionID) throw new Error("v2 question reply requires sessionID")
      return request<boolean>(config, withDirectory(`/session/${sessionID}/question/${encodeURIComponent(requestID)}/reply`, directory), {
        method: "POST",
        body: { answers },
      })
    }
    return request<boolean>(config, withDirectory(`/question/${encodeURIComponent(requestID)}/reply`, directory), {
      method: "POST",
      body: { answers },
    })
  },

  async questionReject(config: ServerConfig, requestID: string, directory?: string, sessionID?: string) {
    if ((await getApiVersion(config)) === "v2") {
      if (!sessionID) throw new Error("v2 question reject requires sessionID")
      return request<boolean>(config, withDirectory(`/session/${sessionID}/question/${encodeURIComponent(requestID)}/reject`, directory), {
        method: "POST",
        body: {},
      })
    }
    return request<boolean>(config, withDirectory(`/question/${encodeURIComponent(requestID)}/reject`, directory), {
      method: "POST",
      body: {},
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
    return request<{ requestID: string; permission: string; status: string }[]>(config, withDirectory("/permission", directory))
  },

  async permissionReply(config: ServerConfig, requestID: string, approve: boolean, directory?: string, sessionID?: string) {
    if ((await getApiVersion(config)) === "v2") {
      if (!sessionID) throw new Error("v2 permission reply requires sessionID")
      return request<boolean>(config, withDirectory(`/session/${sessionID}/permission/${encodeURIComponent(requestID)}/reply`, directory), {
        method: "POST",
        body: { reply: approve ? "once" : "reject" },
      })
    }
    return request<boolean>(config, withDirectory(`/permission/${encodeURIComponent(requestID)}/reply`, directory), {
      method: "POST",
      body: { approve },
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

  fetchStats(config: ServerConfig, statsPort: number, since = "", until = "", model = "") {
    const host = config.host.replace(/^https?:\/\//, "").replace(/\/+$/, "")
    const params = new URLSearchParams({ raw: "1" })
    if (since) params.set("since", since)
    if (until) params.set("until", until)
    if (model) params.set("model", model)
    return fetch(`http://${host}:${statsPort}/api/data?${params.toString()}`, {
      cache: "no-store",
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Stats HTTP ${res.status}`)
      const data = await res.json()
      if (data?.error) throw new Error(data.error)
      return data as import("./types").StatsPayload
    })
  },
}

// Wire health probe for version detection (evita ciclo client↔version)
setHealthProbe(api.health)
