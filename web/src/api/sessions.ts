import type { ModelSelection, ServerConfig, Session, SessionStatus } from "../types"
import { request, requestWithHeaders, withDirectory, withLocationDirectory, withLimit, withProject } from "../shared/api/client"
import { getApiVersion, rememberApiVersion, resolveApiVersion } from "../shared/api/version"
import { toCreateSessionModel, toSessionV1 } from "../shared/api/mappers"
import type { V2Session } from "../shared/api/mappers"
import { pickV2 } from "./versionDispatch"

const listSessions = async (config: ServerConfig, directory?: string, limit?: number, project?: string) => {
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
}

// v2 EXPLÍCITO (path /api/...): no depende de la versión detectada. Un
// perfil con apiVersion v1 forzada contra un server v2 igual lista todas las
// sesiones del proyecto, sin la respuesta gigante del global.
const listSessionsByProject = async (config: ServerConfig, project: string, limit?: number) => {
  const path = `/api${withProject(withLimit("/session", limit), project)}`
  const raw = await request<V2Session[]>(config, path, { rawPath: true })
  return (raw as V2Session[]).map(toSessionV1)
}

const listGlobalSessions = async (config: ServerConfig, limit?: number) => {
  if ((await getApiVersion(config)) === "v2") {
    // v2: /session sin directory devuelve SOLO 50 por defecto. Con limit
    // alto el snapshot es completo (la paginación por cursor de v2 no está
    // disponible: InvalidCursorError).
    return listSessions(config, undefined, limit)
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
}

const listProjects = async (config: ServerConfig): Promise<Array<{ id: string; directory: string; name?: string }>> => {
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
}

const listStatuses = (config: ServerConfig, directory?: string) =>
  pickV2(
    config,
    () => request<Record<string, SessionStatus>>(config, withDirectory("/session/status", directory)),
    async () => {
      const raw = await request<Record<string, { type?: string }>>(config, withLocationDirectory("/session/active", directory))
      const out: Record<string, SessionStatus> = {}
      for (const [id, st] of Object.entries(raw)) {
        const t = st?.type
        out[id] = { type: t === "running" || t === "busy" ? "busy" : t === "retry" ? "retry" : "idle" }
      }
      return out
    },
  )

// v2 experimental: desacopla los subagentes sincrónicos que bloquean la
// sesión y los continúa en background (equivalente a Ctrl+B de la TUI).
// Devuelve true si promovió alguno; el server luego emite
// `metadata.background` en los parts vía SSE y el chat pinta los chips.
const promoteSessionBackground = (config: ServerConfig, sessionID: string, directory?: string) =>
  request<boolean>(
    config,
    withDirectory(`/experimental/session/${encodeURIComponent(sessionID)}/background`, directory),
    { method: "POST", body: {}, retryable: false },
  )

const createSession = (config: ServerConfig, title?: string, model?: ModelSelection, directory?: string) =>
  pickV2(
    config,
    () => request<Session>(config, withDirectory("/session", directory), { method: "POST", body: { title, model: toCreateSessionModel(model) } }),
    async () => {
      const body: Record<string, unknown> = {}
      const m = toCreateSessionModel(model)
      if (m) body.model = m
      if (directory) body.location = { directory }
      const raw = await request<Session | V2Session>(config, "/session", { method: "POST", body })
      return toSessionV1(raw as V2Session)
    },
  )

const renameSession = (config: ServerConfig, id: string, title: string, directory?: string) =>
  pickV2(
    config,
    () => request<Session>(config, withDirectory(`/session/${id}`, directory), { method: "PATCH", body: { title } }),
    () => request<Session>(config, withDirectory(`/session/${id}/rename`, directory), { method: "POST", body: { title } }),
  )

const deleteSession = async (config: ServerConfig, id: string, directory?: string) => {
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
}

export const sessionsApi = {
  listSessions,
  listSessionsByProject,
  listGlobalSessions,
  listProjects,
  listStatuses,
  promoteSessionBackground,
  createSession,
  renameSession,
  deleteSession,
}
