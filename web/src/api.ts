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
  Question,
  QuestionOption,
  ServerConfig,
  ServerProviderConnection,
  ServerProviderList,
  Session,
  SessionStatus,
  MCPServerInfo,
  MCPServerStatus,
  VcsStatus
} from "./types"
type TodoItem = any
import {
  arrayBufferToBase64,
  baseUrl,
  fetchFileBytes,
  request,
  requestRaw,
  requestWithHeaders,
  toServerRelative,
  withDirectory,
  withLimit,
  withProject,
  withLocationDirectory
} from "./shared/api/client"
import { getApiVersion, rememberApiVersion, resolveApiVersion, setHealthProbe, apiPath } from "./shared/api/version"
import {
  mapProviderModels,
  modelWireName,
  toAgentOption,
  toCreateSessionModel,
  toFileEntryV2,
  toMessageEnvelopeV1,
  toModelBody,
  toSessionV1
} from "./shared/api/mappers"
import type { V2Message, V2Session, ConfigProvidersResponse, AgentResponse } from "./shared/api/mappers"
import { getOpencodeClient } from "./shared/api/opencodeClient"
import { recordQuestionSettled } from "./utils/questionStore"

function errorStatus(error: unknown): number | undefined {
  if (!(error instanceof Error)) return undefined
  const cause = error.cause as { status?: unknown } | undefined
  return typeof cause?.status === "number" ? cause.status : undefined
}

// ---------------------------------------------------------------------------
// Formularios de pregunta (server v2)
// Contrato real: GET /form/request → Form.Info[] con id "frm_*",
// metadata.tool {messageID,id:<toolCallID>} y fields[{key,title,description}].
// El callID del tool NO es el formID: hay que resolverlo por metadata.tool.id.
// ---------------------------------------------------------------------------
type RawFormField = {
  key?: string
  title?: string
  description?: string
  type?: string
  options?: unknown
  custom?: boolean
}
type RawFormInfo = {
  id?: string
  sessionID?: string
  title?: string
  questions?: unknown
  metadata?: { kind?: string; tool?: { messageID?: string; id?: string; callID?: string } }
  tool?: { messageID?: string; id?: string; callID?: string }
  fields?: RawFormField[]
}
type ResolvedQuestionForm = {
  formID: string
  sessionID?: string
  fields?: RawFormField[]
  callID?: string
}

async function fetchQuestionForms(config: ServerConfig, directory?: string): Promise<RawFormInfo[]> {
  const raw = await request<unknown>(config, withLocationDirectory("/form/request", directory))
  const items = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)
      ? ((raw as { data: unknown[] }).data)
      : []
  return items as RawFormInfo[]
}

function formToolCallID(form: RawFormInfo): string | undefined {
  const tool = form.metadata?.tool ?? form.tool
  return tool?.id ?? tool?.callID
}

function isFormID(id?: string): boolean {
  return typeof id === "string" && id.startsWith("frm_")
}

/**
 * Resuelve el formID real para un requestID que puede ser un callID de tool
 * (QuestionPrompt inline pasa el callID) o ya un formID (prompt flotante).
 * Devuelve también el callID para marcar settled ambas claves y que tanto el
 * prompt inline como el flotante se enteren del cierre.
 */
async function resolveQuestionForm(
  config: ServerConfig,
  requestID: string,
  directory?: string,
  sessionID?: string,
): Promise<ResolvedQuestionForm | null> {
  try {
    const forms = await fetchQuestionForms(config, directory)
    const match = forms.find((f) => f.id === requestID || formToolCallID(f) === requestID)
    if (match?.id) {
      return {
        formID: match.id,
        sessionID: match.sessionID ?? sessionID,
        fields: Array.isArray(match.fields) ? match.fields : undefined,
        callID: formToolCallID(match),
      }
    }
  } catch (err) {
    // Sin listado no se puede resolver un callID; un frm_ directo aún sirve.
    if (!isFormID(requestID)) throw err
  }
  return isFormID(requestID) ? { formID: requestID, sessionID } : null
}

function buildQuestionAnswer(arr: string[][], fields?: RawFormField[]): Record<string, unknown> {
  const answer: Record<string, unknown> = {}
  if (fields && fields.length > 0) {
    fields.forEach((f, i) => {
      const ans = arr[i] ?? []
      const key = f.key ?? String(i)
      answer[key] = f.type === "multiselect" ? ans : ans.length > 0 ? (ans.length === 1 ? ans[0] : ans) : ""
    })
    return answer
  }
  arr.forEach((ans, i) => {
    answer[String(i)] = ans.length === 1 ? ans[0] : ans
  })
  return answer
}

async function fetchFormFields(
  config: ServerConfig,
  sessionID: string,
  formID: string,
  directory?: string,
): Promise<RawFormField[] | undefined> {
  try {
    const form = await request<{ fields?: RawFormField[] }>(
      config,
      withLocationDirectory(`/session/${encodeURIComponent(sessionID)}/form/${encodeURIComponent(formID)}`, directory),
    )
    if (Array.isArray(form?.fields)) return form.fields
  } catch { /* sigue el fallback global */ }
  if (sessionID !== "global") {
    try {
      const form = await request<{ fields?: RawFormField[] }>(
        config,
        withLocationDirectory(`/session/global/form/${encodeURIComponent(formID)}`, directory),
      )
      if (Array.isArray(form?.fields)) return form.fields
    } catch { /* ignore */ }
  }
  return undefined
}

/** Marca settled el requestID, el formID y el callID conocidos. */
function settleQuestion(
  target: ResolvedQuestionForm | null,
  requestID: string,
  status: "answered" | "rejected",
  answers?: string[][] | Record<string, unknown>,
): void {
  const ids = new Set<string>([requestID, target?.formID, target?.callID].filter((x): x is string => !!x))
  for (const id of ids) recordQuestionSettled(id, status, answers)
}

/** 404/409: el form ya no existe (respondido/cancelado) → cierre local válido. */
function isResolvedFormError(error: unknown): boolean {
  const status = errorStatus(error)
  return status === 404 || status === 409
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
export { normalizeSlashes, toServerRelative, withDirectory, withLimit, withProject, withLocationDirectory, fetchFileBytes, arrayBufferToBase64, responseDetail, normalizeHeaders, serializedSize, requestWithHeaders, requestRaw, request } from "./shared/api/client"
export type { RequestOptions, ResponseWithHeaders } from "./shared/api/client"

// Variante del SDK que resolvió message.list por host (ver loadMessages):
// evita re-probar variantes fallidas en cada apertura de sesión.
const messageVariantCache = new Map<string, number>()

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

  async listSessions(config: ServerConfig, directory?: string, limit?: number, project?: string) {
    // Límite y filtro por proyecto solo aplican a v2 (v1 pagina con
    // /experimental/session y filtra por directory).
    const version = await getApiVersion(config)
    let path = withDirectory("/session", directory)
    if (version === "v2") path = withProject(withLimit(path, limit), project)
    const raw = await request<Session[] | V2Session[]>(config, path)
    if (version === "v2") {
      return (raw as V2Session[]).map(toSessionV1)
    }
    return raw as Session[]
  },

  // v2 EXPLÍCITO (path /api/...): no depende de la versión detectada. Un
  // perfil con apiVersion v1 forzada contra un server v2 igual lista todas
  // las sesiones del proyecto, sin la respuesta gigante del global.
  async listSessionsByProject(config: ServerConfig, project: string, limit?: number) {
    const path = `/api${withProject(withLimit("/session", limit), project)}`
    const raw = await request<V2Session[]>(config, path, { rawPath: true })
    return (raw as V2Session[]).map(toSessionV1)
  },

  async listGlobalSessions(config: ServerConfig, limit?: number) {
    if ((await getApiVersion(config)) === "v2") {
      // v2: /session sin directory devuelve SOLO 50 por defecto. Con limit
      // alto el snapshot es completo (la paginación por cursor de v2 no está
      // disponible: InvalidCursorError).
      return api.listSessions(config, undefined, limit)
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
    // v2 devuelve `canonical` (no directory/worktree): sin este fallback el
    // backfill por-dir no tenía proyectos que consultar y el sidebar podía
    // quedarse con un solo proyecto.
    const parse = (raw: unknown) => {
      if (!Array.isArray(raw)) return []
      return (raw as Array<{ id?: string; directory?: string; name?: string; worktree?: string; canonical?: string }>)
        .map((p) => {
          const directory = p.directory || p.worktree || p.canonical || ""
          return {
            id: p.id || directory,
            directory,
            name: p.name || (directory ? directory.split(/[\/\\]/).filter(Boolean).pop() : undefined),
          }
        })
        .filter((p) => Boolean(p.directory))
    }
    try {
      const out = parse(await request(config, "/project"))
      if (out.length > 0) return out
    } catch {
      /* sigue el fallback v2 explícito */
    }
    try {
      // Perfil con apiVersion v1 forzada: el path v1 puede ser el fallback
      // SPA. Se prueba el endpoint v2 explícito y, si responde, se corrige
      // la versión recordada para el resto de la app.
      const out = parse(await request(config, "/api/project", { rawPath: true }))
      if (out.length > 0) rememberApiVersion(config, "v2")
      return out
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

  // v2 experimental: desacopla los subagentes sincrónicos que bloquean la
  // sesión y los continúa en background (equivalente a Ctrl+B de la TUI).
  // Devuelve true si promovió alguno; el server luego emite
  // `metadata.background` en los parts vía SSE y el chat pinta los chips.
  async promoteSessionBackground(config: ServerConfig, sessionID: string, directory?: string) {
    return request<boolean>(
      config,
      withDirectory(`/experimental/session/${encodeURIComponent(sessionID)}/background`, directory),
      { method: "POST", body: {}, retryable: false }
    )
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
      return raw.map((e) => toFileEntryV2(directory, e))
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
      const list = Array.isArray(raw)
        ? (raw as Array<{
            id?: string
            name?: string
            authMethods?: unknown
            connections?: Array<{ type?: string; id?: string; label?: string; name?: string }>
          }>)
        : []
      // v2 modela CADA cuenta como una conexión: `credential` (con id+label) o
      // `env`. Se conservan todas para poder listar y quitar cuentas sueltas
      // de un mismo proveedor (antes se aplanaba a una lista de ids).
      const all = list.map((p) => {
        const connections: ServerProviderConnection[] = (p.connections ?? [])
          .map((c) =>
            c.type === "env"
              ? ({ type: "env" as const, name: c.name ?? "" } satisfies ServerProviderConnection)
              : ({ type: "credential" as const, id: c.id ?? "", label: c.label ?? "" } satisfies ServerProviderConnection),
          )
          .filter((c) => (c.type === "env" ? !!c.name : !!c.id))
        return {
          id: p.id ?? "",
          name: p.name ?? p.id ?? "",
          source: "config" as const,
          env: [] as string[],
          models: {} as Record<string, unknown>,
          connections,
        }
      })
      return {
        all,
        default: {} as Record<string, string>,
        connected: all.filter((p) => p.connections && p.connections.length > 0).map((p) => p.id),
      }
    }
    return request<ServerProviderList>(config, withDirectory("/provider", directory))
  },

  async setProviderAuth(config: ServerConfig, providerID: string, key: string, directory?: string, label?: string) {
    if ((await getApiVersion(config)) === "v2") {
      const body: Record<string, unknown> = { key }
      const clean = label?.trim()
      if (clean) body.label = clean
      return request<boolean>(config, withLocationDirectory(`/integration/${providerID}/connect/key`, directory), {
        method: "POST",
        body,
      })
    }
    return request<boolean>(config, withDirectory(`/auth/${providerID}`, directory), {
      method: "PUT",
      body: { type: "api", key },
    })
  },

  async removeProviderAuth(config: ServerConfig, providerID: string, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      // No existe un endpoint `integration/disconnect`: se quitan una por una
      // todas las credenciales del proveedor (DELETE /api/credential/:id).
      const raw = await request<unknown>(config, withLocationDirectory(`/integration/${providerID}`, directory))
      const conns = (raw as { connections?: Array<{ type?: string; id?: string }> } | null)?.connections ?? []
      let removed = false
      for (const c of conns) {
        if (c.type !== "credential" || !c.id) continue
        await request(config, withLocationDirectory(`/credential/${encodeURIComponent(c.id)}`, directory), { method: "DELETE" })
        removed = true
      }
      return removed
    }
    return request<boolean>(config, withDirectory(`/auth/${providerID}`, directory), { method: "DELETE" })
  },

  /** v2: quita una cuenta concreta (credencial) de un proveedor. */
  async removeProviderCredential(config: ServerConfig, credentialID: string, directory?: string) {
    return request<boolean>(config, withLocationDirectory(`/credential/${encodeURIComponent(credentialID)}`, directory), {
      method: "DELETE",
    })
  },

  /** v2: marca una cuenta concreta como la activa del proveedor. */
  async activateProviderCredential(config: ServerConfig, credentialID: string, directory?: string) {
    return request<boolean>(config, withLocationDirectory(`/credential/${encodeURIComponent(credentialID)}/activate`, directory), {
      method: "POST",
    })
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
      // Probar múltiples variantes del client — el nombre exacto varía entre betas v2.
      // Caché por host de la variante que funcionó: la primera apertura prueba
      // en orden, las siguientes van directo (evita N llamadas fallidas por open).
      const variantKey = `${config.host}:${config.port}`
      const startAt = messageVariantCache.get(variantKey) ?? 0
      let res: unknown
      let hitIndex = -1
      const tryCall = async (fn: unknown, args: unknown) => {
        if (typeof fn !== "function") return undefined
        try { return await (fn as any)(args) } catch { return undefined }
      }
      // En v2, client.message.list({ sessionID }) consulta /api/session/:id/message (historial persistente real)
      // NUNCA consultar session.context primero: /context devuelve solo el prompt context activo para inferencia,
      // que tras un abort o entre turnos omite mensajes de usuario no completados o devuelve solo metadata sin texto.
      const variants = [
        (client as any).message?.list,
        (client as any).session?.messages,
        (client as any).session?.getMessages,
        (client as any).message?.listMessages,
        (client as any).session?.context,
      ]
      for (let i = 0; i < variants.length && !res; i++) {
        const idx = (startAt + i) % variants.length
        res = await tryCall(variants[idx], { sessionID, limit: safeLimit })
        if (res) hitIndex = idx
      }
      if (hitIndex >= 0) messageVariantCache.set(variantKey, hitIndex)
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
      const files = images?.map((img) => ({
        uri: `data:${img.mime};base64,${img.base64.includes(",") ? img.base64.split(",")[1] : img.base64}`,
        name: `clipboard.${img.mime.split("/")[1] || "png"}`,
      }))
      try {
        const client = await getOpencodeClient(config)
        await syncV2SessionContext(client, sessionID, model, agentID)
        const res = await (client as any).session.prompt({ sessionID, text, files })
        return (res ?? true) as boolean
      } catch {
        // Fallback HTTP directo (CapacitorHttp en nativo, sin CORS): el SDK
        // usa fetch del WebView y en Android por Tailscale el POST puede caer
        // por preflight aunque los GETs funcionen (tenían su propio fallback).
        return request<boolean>(config, apiPath(config, `/session/${sessionID}/prompt`), {
          method: "POST",
          body: { text, files },
          readTimeout: 180_000,
          retryable: false,
        })
      }
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
      try {
        const client = await getOpencodeClient(config)
        await syncV2SessionContext(client, sessionID, model, agentID)
        const res = await (client as any).session.command({ sessionID, command, text: argumentsText })
        if (res) {
          try { return toMessageEnvelopeV1(res as V2Message) } catch { return res as MessageEnvelope }
        }
        return true as unknown as MessageEnvelope
      } catch {
        // Mismo fallback sin-CORS que sendPrompt (ver arriba).
        await request<boolean>(config, apiPath(config, `/session/${sessionID}/command`), {
          method: "POST",
          body: { command, text: argumentsText },
          readTimeout: 300_000,
          retryable: false,
        })
        return true as unknown as MessageEnvelope
      }
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
    const forced = config.apiVersion
    const failures: string[] = []
    const note = (e: unknown) => {
      failures.push(e instanceof Error ? e.message : String(e))
    }
    // Interrupt crudo v2 (sin SDK): cubre SDK roto o versión sin detectar.
    // El prefijo /api va explícito porque request() no lo agrega sin detección.
    const rawV2Interrupt = async () => {
      const target = `${baseUrl(config)}/api${withDirectory(`/session/${sessionID}/interrupt`, directory)}`
      const res = await requestRaw<{ interrupted?: boolean } | boolean>(config, target, {
        method: "POST",
        retryable: false,
      })
      const data = res.data as { interrupted?: boolean } | boolean
      return typeof data === "boolean" ? data : (data?.interrupted ?? true)
    }
    if (forced !== "v1") {
      let version: "v1" | "v2" = "v1"
      try {
        version = await getApiVersion(config)
      } catch (e) {
        note(e)
      }
      if (version === "v2") {
        try {
          const client = await getOpencodeClient(config)
          const res = await (client as any).session.interrupt({ sessionID })
          return (res as any)?.interrupted ?? true
        } catch (e) {
          note(e)
        }
        // El SDK falló: reintentar por path crudo antes de rendirse.
        try {
          return await rawV2Interrupt()
        } catch (e) {
          note(e)
        }
        if (forced === "v2") {
          throw new Error(`No se pudo detener la sesión (${failures.join(" | ")})`)
        }
        // auto: caer a la rama v1 por compatibilidad con servers viejos
      }
    }
    const primary = `/session/${sessionID}/abort`
    const secondary = `/session/${sessionID}/interrupt`
    try {
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
    } catch (error) {
      // auto sin versión detectada: el server puede ser v2 (rutas bajo /api) —
      // último intento por el path crudo antes de informar el fallo real.
      if (forced !== "v1" && forced !== "v2") {
        try {
          return await rawV2Interrupt()
        } catch (e) {
          note(e)
        }
      } else {
        note(error)
      }
      throw new Error(`No se pudo detener la sesión en :${config.port} (${failures.join(" | ") || "sin respuesta del servidor"})`)
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

  async questionReply(
    config: ServerConfig,
    requestID: string,
    answers: string[][] | Record<string, unknown>,
    directory?: string,
    sessionID?: string,
  ) {
    const version = await getApiVersion(config)
    if (version === "v2") {
      let form: ResolvedQuestionForm | null = null
      try {
        form = await resolveQuestionForm(config, requestID, directory, sessionID)
      } catch (err) {
        // Server v2 sin /form/request (híbrido viejo): probar endpoint legacy.
        if (!isResolvedFormError(err)) throw err
        form = null
      }

      if (form) {
        const sid = form.sessionID ?? sessionID ?? "global"
        let answerRecord: Record<string, unknown>
        if (!Array.isArray(answers) && typeof answers === "object" && answers !== null) {
          answerRecord = answers as Record<string, unknown>
        } else {
          const arr = Array.isArray(answers) ? answers : []
          const fields = form.fields && form.fields.length > 0
            ? form.fields
            : await fetchFormFields(config, sid, form.formID, directory)
          answerRecord = buildQuestionAnswer(arr, fields)
        }
        try {
          const res = await request<boolean>(
            config,
            withLocationDirectory(`/session/${encodeURIComponent(sid)}/form/${encodeURIComponent(form.formID)}/reply`, directory),
            {
              method: "POST",
              body: { answer: answerRecord },
              retryable: false,
            },
          )
          settleQuestion(form, requestID, "answered", answers)
          return res
        } catch (err) {
          if (isResolvedFormError(err)) {
            settleQuestion(form, requestID, "answered", answers)
            return true
          }
          // 400 (p. ej. Unknown form field): propaga el detalle para feedback.
          throw err
        }
      }

      // Sin form resoluble: compat con endpoint de sesión del shape viejo.
      const sid = sessionID ?? "global"
      try {
        const res = await request<boolean>(
          config,
          withDirectory(`/session/${encodeURIComponent(sid)}/question/${encodeURIComponent(requestID)}/reply`, directory),
          {
            method: "POST",
            body: { answers: Array.isArray(answers) ? answers : [] },
            retryable: false,
          },
        )
        settleQuestion(null, requestID, "answered", answers)
        return res
      } catch (err) {
        if (!isResolvedFormError(err) && !/404|not found/i.test(String(err))) throw err
        // La pregunta ya no existe: cerrar localmente en vez de botón muerto.
        settleQuestion(null, requestID, "answered", answers)
        return true
      }
    }

    // v1: endpoint global existente.
    const res = await request<boolean>(config, withDirectory(`/question/${encodeURIComponent(requestID)}/reply`, directory), {
      method: "POST",
      body: { answers: Array.isArray(answers) ? answers : [] },
      retryable: false,
    })
    settleQuestion(null, requestID, "answered", answers)
    return res
  },

  async questionReject(config: ServerConfig, requestID: string, directory?: string, sessionID?: string) {
    const version = await getApiVersion(config)
    if (version === "v2") {
      let form: ResolvedQuestionForm | null = null
      try {
        form = await resolveQuestionForm(config, requestID, directory, sessionID)
      } catch (err) {
        if (!isResolvedFormError(err)) throw err
        form = null
      }

      if (form) {
        const sid = form.sessionID ?? sessionID ?? "global"
        try {
          const res = await request<boolean>(
            config,
            withLocationDirectory(`/session/${encodeURIComponent(sid)}/form/${encodeURIComponent(form.formID)}/cancel`, directory),
            {
              method: "POST",
              body: {},
              retryable: false,
            },
          )
          settleQuestion(form, requestID, "rejected")
          return res
        } catch (err) {
          if (isResolvedFormError(err)) {
            settleQuestion(form, requestID, "rejected")
            return true
          }
          throw err
        }
      }

      const sid = sessionID ?? "global"
      try {
        const res = await request<boolean>(
          config,
          withDirectory(`/session/${encodeURIComponent(sid)}/question/${encodeURIComponent(requestID)}/reject`, directory),
          {
            method: "POST",
            body: {},
            retryable: false,
          },
        )
        settleQuestion(null, requestID, "rejected")
        return res
      } catch (err) {
        if (!isResolvedFormError(err) && !/404|not found/i.test(String(err))) throw err
        settleQuestion(null, requestID, "rejected")
        return true
      }
    }

    // v1: endpoint global existente.
    const res = await request<boolean>(config, withDirectory(`/question/${encodeURIComponent(requestID)}/reject`, directory), {
      method: "POST",
      body: {},
      retryable: false,
    })
    settleQuestion(null, requestID, "rejected")
    return res
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

  async listMCPResources(config: ServerConfig, directory?: string) {
    type MCPItem = { id: string; name: string; description?: string }
    // McpResource real: {server, name, uri, description?, mimeType?} (sin id).
    const mapResource = (r: unknown): MCPItem | null => {
      if (!r || typeof r !== "object") return null
      const o = r as { uri?: unknown; id?: unknown; name?: unknown; server?: unknown; description?: unknown }
      const id = o.uri ?? o.id ?? o.name ?? ""
      const name = o.name ?? o.server ?? o.id ?? ""
      if (!id && !name) return null
      return {
        id: String(id),
        name: String(name),
        description: typeof o.description === "string" ? o.description : typeof o.server === "string" ? o.server : undefined,
      }
    }
    const keep = (xs: unknown[]): MCPItem[] =>
      xs.map(mapResource).filter((x): x is MCPItem => x !== null)
    if ((await getApiVersion(config)) === "v2") {
      const raw = await request<unknown>(config, withLocationDirectory("/mcp/resource", directory))
      if (Array.isArray(raw)) return keep(raw)
      if (raw && typeof raw === "object") {
        const wrapped = (raw as { resources?: unknown; data?: unknown }).resources ?? (raw as { data?: unknown }).data
        if (Array.isArray(wrapped)) return keep(wrapped)
      }
      return []
    }
    const path = withDirectory("/experimental/resource", directory)
    return request<unknown>(config, path).then((raw) => {
      if (Array.isArray(raw)) return keep(raw)
      if (raw && typeof raw === "object") {
        const wrapped = (raw as { resources?: unknown; data?: unknown }).resources ?? (raw as { data?: unknown }).data
        if (Array.isArray(wrapped)) return keep(wrapped)
        if (Array.isArray((raw as { servers?: unknown }).servers)) {
          return (raw as { servers: Array<{ id?: string; name?: string; description?: string }> }).servers
            .filter((s) => s.id || s.name)
            .map((s) => ({ id: s.id ?? s.name ?? "", name: s.name ?? s.id ?? "", description: s.description }))
        }
      }
      return []
    })
  },

  /**
   * v2: servidores MCP con estado real (connected / disabled / failed / …).
   * El endpoint es GET /api/mcp; en v1 no existe (devuelve []).
   */
  async listMCPServers(config: ServerConfig, directory?: string): Promise<MCPServerInfo[]> {
    if ((await getApiVersion(config)) !== "v2") return []
    const raw = await request<unknown>(config, withLocationDirectory("/mcp", directory))
    if (!Array.isArray(raw)) return []
    const valid: MCPServerStatus[] = ["connected", "pending", "disabled", "failed", "needs_auth"]
    const out: MCPServerInfo[] = []
    for (const item of raw) {
      if (!item || typeof item !== "object") continue
      const o = item as { name?: unknown; status?: unknown }
      if (typeof o.name !== "string" || !o.name) continue
      const st = (o.status && typeof o.status === "object" ? o.status : {}) as { status?: unknown; error?: unknown }
      const status = valid.includes(st.status as MCPServerStatus) ? (st.status as MCPServerStatus) : "disabled"
      out.push({ name: o.name, status, error: typeof st.error === "string" ? st.error : undefined })
    }
    return out
  },

  /** v2: activa/conecta un server MCP (POST /api/mcp/:name/connect, 204). */
  async connectMCPServer(config: ServerConfig, name: string, directory?: string): Promise<void> {
    await request(config, withLocationDirectory(`/mcp/${encodeURIComponent(name)}/connect`, directory), { method: "POST" })
  },

  /** v2: desactiva/desconecta un server MCP (POST /api/mcp/:name/disconnect, 204). */
  async disconnectMCPServer(config: ServerConfig, name: string, directory?: string): Promise<void> {
    await request(config, withLocationDirectory(`/mcp/${encodeURIComponent(name)}/disconnect`, directory), { method: "POST" })
  },

  async listSkills(config: ServerConfig, directory?: string) {
    if ((await getApiVersion(config)) === "v2") {
      return request<{ id: string; name: string; description?: string }[]>(config, withLocationDirectory("/skill", directory))
    }
    return request<{ id: string; name: string; description?: string }[]>(config, "/skill")
  },

  async listPendingQuestions(config: ServerConfig, directory?: string): Promise<Question[]> {
    if ((await getApiVersion(config)) === "v2") {
      try {
        return (await fetchQuestionForms(config, directory)).map((q) => {
          const tool = q.metadata?.tool ?? q.tool
          let questions: { question: string; header?: string; options: QuestionOption[]; multiple?: boolean; custom?: boolean; key?: string }[] = []
          if (Array.isArray(q.questions)) {
            questions = q.questions as typeof questions
          } else if (Array.isArray(q.fields)) {
            questions = q.fields.map((f) => ({
              // Contrato real: description = pregunta completa, title = header corto.
              question: f.description || f.title || f.key || "",
              header: f.title || f.key || "",
              options: Array.isArray(f.options)
                ? f.options.map((opt: any) => ({
                    label: opt.label || opt.value || "",
                    description: opt.description,
                  }))
                : [],
              multiple: f.type === "multiselect",
              custom: f.custom !== false,
              key: f.key,
            }))
          }
          return {
            id: q.id ?? "",
            sessionID: q.sessionID,
            questions,
            tool: tool
              ? { messageID: tool.messageID ?? "", callID: tool.id ?? tool.callID ?? "" }
              : undefined,
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
      let sid = sessionID
      if (!sid) {
        try {
          const perms = await api.listPermissions(config, directory)
          const found = perms.find((p) => p.requestID === requestID)
          if (found?.sessionID) sid = found.sessionID
        } catch { /* ignore */ }
      }
      if (!sid) sid = "global"
      return request<boolean>(config, withDirectory(`/session/${encodeURIComponent(sid)}/permission/${encodeURIComponent(requestID)}/reply`, directory), {
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
}

// Wire health probe for version detection (evita ciclo client↔version)
setHealthProbe(api.health)
