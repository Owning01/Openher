import { useState, useCallback, useMemo, useRef, type MutableRefObject } from "react"
import type { ServerConfig, Session, SessionView, SessionStatus, ModelSelection, ConnectionState } from "../types"
import { api } from "../api"
import { STORAGE_KEYS } from "../constants"
import { useLocalStorage } from "./useLocalStorage"
import { getOpencodeClient } from "../shared/api/opencodeClient"
import { toSessionV1 } from "../shared/api/mappers"
import { buildDirPlan, dirKey, keepUncoveredSessions } from "../utils/sessionDirs"

const FAVORITES_KEY = STORAGE_KEYS.FAVORITES

// v2 /session devuelve 50 por defecto. El refresh COMPLETO (carga inicial,
// refresh manual, borrar/renombrar) reconstruye el estado con backfill por
// directorio: N respuestas chicas (una por proyecto) en vez de una sola
// gigante, que en el puente nativo (CapacitorHttp) es frágil.
const BACKFILL_SESSION_LIMIT = 1000

// Unión de directorios vistos por servidor: si el global viene parcial (scope
// del server, límite del API) o /project falla, los proyectos viejos NO
// desaparecen. Persistida en localStorage: antes vivía solo en memoria y un
// reload la perdía, dejando visible únicamente el proyecto del global.
const KNOWN_DIRS_KEY = "opencode.knownSessionDirs"

function loadKnownDirs(serverKey: string): string[] {
  try {
    const all = JSON.parse(localStorage.getItem(KNOWN_DIRS_KEY) || "{}") as Record<string, unknown>
    const arr = all?.[serverKey]
    return Array.isArray(arr) ? arr.filter((d): d is string => typeof d === "string" && !!d) : []
  } catch {
    return []
  }
}

function saveKnownDirs(serverKey: string, dirs: string[]) {
  try {
    const all = JSON.parse(localStorage.getItem(KNOWN_DIRS_KEY) || "{}") as Record<string, unknown>
    all[serverKey] = dirs
    localStorage.setItem(KNOWN_DIRS_KEY, JSON.stringify(all))
  } catch {
    /* storage lleno o bloqueado: el historial en memoria sigue */
  }
}

const knownDirsHistoryRef: { current: { key: string; dirs: string[] } } = {
  current: { key: "", dirs: [] },
}

function toSessionView(session: Session, status?: SessionStatus): SessionView {
  return {
    id: session.id,
    title: session.title,
    directory: session.directory,
    updated: session.time.updated,
    status: status?.type ?? "idle",
    files: session.summary?.files ?? 0,
    additions: session.summary?.additions ?? 0,
    deletions: session.summary?.deletions ?? 0,
    tokens: session.tokens,
    cost: session.cost,
    agent: session.agent,
    parentID: session.parentID,
    revert: session.revert ? { messageID: session.revert.messageID, partID: session.revert.partID } : undefined,
    model: session.model ? { providerID: session.model.providerID, modelID: session.model.id, variant: session.model.variant } : undefined
  }
}

/**
 * Merge de un poll liviano: pisa lo que vino del server y conserva el status
 * local cuando el dir de la sesión no fue consultado en este ciclo. Sin esto,
 * el poll liviano (sin statuses) pisaba busy→idle y el indicador de "activo"
 * del chat y la lista se apagaba solo aunque la sesión siguiera trabajando.
 */
export function mergeSessionPoll(existing: SessionView | undefined, incoming: SessionView, statusFresh: boolean): SessionView {
  return {
    ...existing,
    ...incoming,
    status: statusFresh ? incoming.status : existing?.status ?? incoming.status,
  }
}

function isProjectDirectory(pathInfo: { worktree: string }): boolean {
  return pathInfo.worktree !== "/"
}

export type SessionsActions = {
  sessions: SessionView[]
  selectedID: string | null
  loadingSessionID: string | null
  refreshingSessions: boolean
  creatingSession: boolean
  selectedSession: SessionView | null
  sessionToDelete: SessionView | null
  renamingSessionID: string | null
  renameValue: string
  openSession: (id: string, dir: string) => Promise<void>
  refreshSessions: (silent?: boolean) => Promise<void>
  refreshSessionsWithIndicator: () => Promise<boolean>
  createSession: (directory?: string, model?: ModelSelection) => Promise<SessionView | null>
  deleteSession: (id: string) => Promise<void>
  renameSession: (id: string, title: string, directory: string) => Promise<void>
  startRename: (session: SessionView) => void
  cancelRename: () => void
  setSessionToDelete: (v: SessionView | null) => void
  setSelectedID: (v: string | null) => void
  setSessions: (fn: (prev: SessionView[]) => SessionView[]) => void
  setRenameValue: (v: string) => void
  favorites: Set<string>
  toggleFavorite: (id: string) => void
}

export function useSessions(
  config: ServerConfig,
  onLoadSelected: (id: string, dir: string) => Promise<void>,
  backgroundFailureCountRef: MutableRefObject<number>,
  initialSessionLoadRef: MutableRefObject<boolean>,
  setConnectionState: (state: ConnectionState) => void,
  setConnectionMessage: (msg: string) => void
): SessionsActions {
  const [sessions, setSessions] = useState<SessionView[]>([])
  // Espejo para que refreshSessions consulte los dirs visibles sin entrar en deps
  const sessionsRef = useRef<SessionView[]>([])
  sessionsRef.current = sessions
  const [selectedID, setSelectedID] = useState<string | null>(null)
  const [loadingSessionID, setLoadingSessionID] = useState<string | null>(null)
  const [refreshingSessions, setRefreshingSessions] = useState(false)
  const [creatingSession, setCreatingSession] = useState(false)

  const [sessionToDelete, setSessionToDelete] = useState<SessionView | null>(null)
  const [renamingSessionID, setRenamingSessionID] = useState<string | null>(null)
  const [renameValue, setRenameValueState] = useState("")
  const [favoritesArr, setFavoritesArr] = useLocalStorage<string[]>(FAVORITES_KEY, [])
  const favorites = useMemo(() => new Set(favoritesArr), [favoritesArr])

  const selectedSession = sessions.find((s) => s.id === selectedID) ?? null

  const openSession = useCallback(async (id: string, dir: string) => {
    setSelectedID(id)
    setLoadingSessionID(id)
    try {
      await onLoadSelected(id, dir)
    } finally {
      setLoadingSessionID((current) => (current === id ? null : current))
    }
  }, [onLoadSelected])

  const refreshSessions = useCallback(async (full = false) => {
    if (!config.host || config.port <= 0) return
    try {
      // Intento con client tipado @opencode-ai/client (nuevo), fallback a api manual
      // V2 devuelve V2Session {location:{directory}} → hay que mapear a Session {directory} vía toSessionV1
      const tryTypedList = async (): Promise<Session[]> => {
        try {
          const client = await getOpencodeClient(config)
          // @ts-ignore — client generado, método puede variar según versión beta
          const raw = await (client as any).session?.list?.({ directory: undefined })
          const normalize = (arr: unknown[]): Session[] => {
            // Detección por elemento (no solo arr[0]): arrays mixtos v1/v2
            // no se mapean mal en bloque.
            const out: Session[] = []
            for (const it of arr) {
              const o = it as Record<string, unknown>
              const dir = (o as unknown as { directory?: unknown }).directory
              const isV2 = o && typeof o === "object" && "location" in o && (!("directory" in o) || dir === "" || dir == null)
              if (!isV2) {
                out.push(it as Session)
                continue
              }
              try {
                out.push(toSessionV1(it as unknown as import("../shared/api/mappers").V2Session))
              } catch {
                out.push(it as Session)
              }
            }
            return out
          }
          if (Array.isArray(raw)) return normalize(raw)
          if (raw && Array.isArray((raw as unknown as { data: unknown[] }).data)) return normalize((raw as unknown as { data: unknown[] }).data)
        } catch {
          // fallback silencioso
        }
        return api.listGlobalSessions(config).catch(() => api.listSessions(config))
      }
      const [items, projects] = await Promise.all([
        tryTypedList(),
        // Los dirs de /project solo alimentan el plan de backfill, que corre
        // en full: en polls sería un request extra por intervalo.
        full ? api.listProjects(config).catch(() => []) : Promise.resolve([]),
      ])

      const MAX_KNOWN_DIRS = 150
      // Ámbito por servidor: al cambiar de perfil/host el historial ajeno
      // solo ocuparía slots del cap y ocultaría proyectos locales.
      const serverKey = `${config.host}:${config.port}:${config.username ?? ""}`
      if (knownDirsHistoryRef.current.key !== serverKey) {
        knownDirsHistoryRef.current = { key: serverKey, dirs: loadKnownDirs(serverKey) }
      }
      // Nunca olvidar lo visible: si el global viene parcial, los dirs de la
      // UI actual alimentan el backfill por-dir.
      const stateDirs: string[] = []
      for (const s of sessionsRef.current) if (s.directory) stateDirs.push(s.directory)
      const { query: backfillDirs, history: nextHistory } = buildDirPlan({
        itemDirs: items.map((s) => s.directory).filter((d) => Boolean(d)),
        stateDirs,
        projectDirs: projects.map((p) => p.directory).filter((d) => Boolean(d)),
        historyDirs: knownDirsHistoryRef.current.dirs,
        cap: MAX_KNOWN_DIRS,
      })
      knownDirsHistoryRef.current = { key: serverKey, dirs: nextHistory }
      saveKnownDirs(serverKey, nextHistory)
      // Dirs verificados con éxito: cada backfill por-dir que respondió
      // completo. Un dir que FALLÓ (o vino truncado) queda fuera: en el
      // reemplazo full sus sesiones se conservan (ausencia no prueba borrado).
      const verifiedKeys = new Set<string>()

      const directories = nextHistory
      const chunk = <T>(arr: T[], size: number) => {
        const chunks: T[][] = []
        for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
        return chunks
      }
      const allSessionLists: Session[][] = []
      const allStatusLists: Record<string, SessionStatus>[] = []
      // Reconstrucción COMPLETA solo en full (carga inicial, refresh manual,
      // borrar/renombrar): el global viene recortado a 50 y una respuesta
      // gigante (limit=5000) es frágil en el puente nativo de Android.
      //   1) sesiones por proyecto (v2) → cubre todas, en respuestas acotadas
      //   2) dirs huérfanos del plan → sesiones sin proyecto o de scope raro
      //   3) statuses busy/retry por dir con sesiones
      if (full) {
        const projectIds = [...new Set(projects.map((p) => p.id).filter(Boolean))]
        for (const c of chunk(projectIds, 10)) {
          const lists = await Promise.all(c.map(async (pid) => {
            try {
              const list = await api.listSessionsByProject(config, pid, BACKFILL_SESSION_LIMIT)
              // Truncado por el límite: no verificar, para no descartar las
              // sesiones viejas que ya estaban en la UI.
              if (list.length < BACKFILL_SESSION_LIMIT) {
                for (const s of list) verifiedKeys.add(dirKey(s.directory))
              }
              return list
            } catch {
              // Fallo parcial: sus dirs quedan NO verificados y las sesiones
              // actuales se conservan (ver keepUncoveredSessions).
              return null
            }
          }))
          for (const list of lists) if (list) allSessionLists.push(list)
        }
        const coveredByProjects = new Set(allSessionLists.flat().map((s) => dirKey(s.directory)))
        const orphanDirs = directories.filter((d) => !coveredByProjects.has(dirKey(d)))
        for (const c of chunk(orphanDirs, 10)) {
          const lists = await Promise.all(c.map(async (d) => {
            try {
              const list = await api.listSessions(config, d, BACKFILL_SESSION_LIMIT)
              if (list.length < BACKFILL_SESSION_LIMIT) verifiedKeys.add(dirKey(d))
              return list
            } catch {
              return null
            }
          }))
          for (const list of lists) if (list) allSessionLists.push(list)
        }
      }

      // Status busy/retry por dir: en full, todos los dirs conocidos; en el
      // poll liviano, los visibles (cap 8, priorizando la sesión abierta).
      // Antes el poll liviano no traía statuses y el merge los pisaba con
      // "idle": el "activo" del chat/lista se apagaba solo aunque el server
      // siguiera trabajando.
      const selectedDir = sessionsRef.current.find((s) => s.id === selectedID)?.directory
      const statusDirs: string[] = full
        ? [...new Set([
            ...directories,
            ...items.map((s) => s.directory),
            ...allSessionLists.flat().map((s) => s.directory),
          ].filter((d): d is string => Boolean(d)))]
        : [...new Set([selectedDir, ...stateDirs].filter((d): d is string => Boolean(d)))].slice(0, 8)
      for (const c of chunk(statusDirs, 10)) {
        const st = await Promise.all(c.map((d) => api.listStatuses(config, d).catch(() => ({} as Record<string, SessionStatus>))))
        allStatusLists.push(...st)
      }
      const fetchedStatusDirs = new Set(statusDirs.map((d) => dirKey(d)))

      const allSessionsMap = new Map<string, Session>()
      for (const s of items) if (s.id) allSessionsMap.set(s.id, s as Session)
      for (const s of allSessionLists.flat()) if (s.id) allSessionsMap.set(s.id, s)

      const allStatuses = new Map<string, SessionStatus>()
      for (const sm of allStatusLists) {
        for (const [id, st] of Object.entries(sm)) {
          if (!allStatuses.has(id)) allStatuses.set(id, st)
        }
      }

      const mapped = [...allSessionsMap.values()]
        .map((s) => toSessionView(s, allStatuses.get(s.id)))
        .sort((a, b) => b.updated - a.updated)

      // Diagnóstico "solo 3 proyectos": activar con localStorage.debug.sessions=1
      if (typeof localStorage !== "undefined" && localStorage.getItem("debug.sessions") === "1") {
        const dirCounts = new Map<string, number>()
        for (const s of mapped) if (s.directory) dirCounts.set(s.directory, (dirCounts.get(s.directory) ?? 0) + 1)
        console.info(`[sessions] full=${full} raw=${items.length} projects=${projects.length} dirsCandidatas=${directories.length} backfill=${backfillDirs.length} total=${mapped.length}`, [...dirCounts.entries()].slice(0, 20))
      }

      setSessions((current) => {
        // full=true (delete/rename/crear/refresh manual) => reemplazo, pero
        // solo suelta sesiones de dirs VERIFICADOS (el server informó sobre
        // ellos: la ausencia es borrado real). Lo de dirs con fallo parcial
        // se conserva: antes un backfill caído borraba proyectos enteros de
        // la UI de forma intermitente.
        if (full) {
          const mappedIds = new Set(mapped.map((m) => m.id))
          const kept = keepUncoveredSessions(current, mappedIds, (d) => verifiedKeys.has(dirKey(d)))
          const result = [...mapped, ...kept].sort((a, b) => b.updated - a.updated)
          const selected = selectedID ? result.find((s) => s.id === selectedID) : null
          if (!selected && selectedID) {
            const keep = current.find((s) => s.id === selectedID)
            if (keep) return [keep, ...result].sort((a, b) => b.updated - a.updated)
          }
          return result
        }
        const currentMap = new Map(current.map((s) => [s.id, s]))
        for (const m of mapped) {
          const existing = currentMap.get(m.id)
          currentMap.set(m.id, mergeSessionPoll(existing, m, fetchedStatusDirs.has(dirKey(m.directory))))
        }
        const result = [...currentMap.values()].sort((a, b) => b.updated - a.updated)
        const selected = selectedID ? result.find((s) => s.id === selectedID) : null
        if (!selected || result.some((s) => s.id === selected.id)) return result
        return [selected, ...result].sort((a, b) => b.updated - a.updated)
      })

      backgroundFailureCountRef.current = 0
      initialSessionLoadRef.current = false
      setConnectionState("connected")
      setConnectionMessage("")
    } catch (e) {
      backgroundFailureCountRef.current += 1
      const count = backgroundFailureCountRef.current
      if (initialSessionLoadRef.current) {
        setConnectionState("offline")
        setConnectionMessage((e as Error).message)
      } else {
        if (count >= 3) {
          setConnectionState("offline")
          setConnectionMessage((e as Error).message)
        } else {
          setConnectionState("reconnecting")
          setConnectionMessage("Connection is slow; retrying quietly...")
        }
      }
    }
  }, [config, selectedID, backgroundFailureCountRef, initialSessionLoadRef])

  const refreshSessionsWithIndicator = useCallback(async () => {
    if (refreshingSessions) return false
    setRefreshingSessions(true)
    try {
      await refreshSessions(true)
      return true
    } catch {
      return false
    } finally {
      setRefreshingSessions(false)
    }
  }, [refreshingSessions, refreshSessions])

  const createSession = useCallback(async (directory?: string, model?: ModelSelection) => {
    if (creatingSession) return null
    setCreatingSession(true)
    try {
      if (directory) {
        const pathInfo = await api.loadPath(config, directory)
        if (!isProjectDirectory(pathInfo)) {
          throw new Error(`${directory} is not an OpenHer project folder.`)
        }
      }
      const created = await api.createSession(config, "Mobile session", model, directory)
      const createdView = toSessionView(created)
      setSessions((current) => {
        if (current.some((s) => s.id === created.id)) return current
        return [createdView, ...current].sort((a, b) => b.updated - a.updated)
      })
      setSelectedID(created.id)
      return createdView
    } catch (err) {
      throw err
    } finally {
      setCreatingSession(false)
    }
  }, [config, creatingSession])

  const deleteSession = useCallback(async (id: string) => {
    const dir = sessionToDelete?.directory ?? sessions.find((s) => s.id === id)?.directory
    // optimista: quitar de UI inmediato
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (selectedID === id) setSelectedID(null)
    setSessionToDelete(null)
    try {
      await api.deleteSession(config, id, dir)
    } catch (e) {
      // fallback sin directory si el server responde 404 por mismatch de path
      try {
        await api.deleteSession(config, id, undefined)
      } catch {
        throw e
      }
    }
    await refreshSessions(true)
  }, [config, sessionToDelete?.directory, sessions, selectedID, refreshSessions])

  const renameSession = useCallback(async (id: string, title: string, directory: string) => {
    if (!title.trim()) return
    await api.renameSession(config, id, title.trim(), directory)
    setRenamingSessionID(null)
    setRenameValueState("")
    await refreshSessions(true)
  }, [config, refreshSessions])

  const startRename = useCallback((session: SessionView) => {
    setRenameValueState(session.title)
    setRenamingSessionID(session.id)
    // El foco + selección los hace el propio InlineRename al montar
    // (estilo Windows: escribir directamente reemplaza el título).
  }, [])

  const cancelRename = useCallback(() => {
    setRenamingSessionID(null)
    setRenameValueState("")
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavoritesArr((prev) => {
      if (prev.includes(id)) return prev.filter((fid) => fid !== id)
      return [...prev, id]
    })
  }, [setFavoritesArr])

  return {
    sessions, selectedID, loadingSessionID, refreshingSessions, creatingSession,
    selectedSession, sessionToDelete, renamingSessionID, renameValue, setRenameValue: setRenameValueState,
    openSession, refreshSessions, refreshSessionsWithIndicator, createSession,
    deleteSession, renameSession, startRename, cancelRename,
    setSessionToDelete, setSelectedID, setSessions,
    favorites, toggleFavorite
  }
}
