import { useState, useCallback, useMemo, type MutableRefObject } from "react"
import type { ServerConfig, Session, SessionView, SessionStatus, ModelSelection, ConnectionState } from "../types"
import { api } from "../api"
import { STORAGE_KEYS } from "../constants"
import { useLocalStorage } from "./useLocalStorage"
import { getOpencodeClient } from "../shared/api/opencodeClient"
import { toSessionV1 } from "../shared/api/mappers"

const FAVORITES_KEY = STORAGE_KEYS.FAVORITES

// Unión persistente de directorios vistos: si /project falla (catch → []) o la
// lista global rota, los proyectos viejos NO desaparecen de la sidebar.
const knownDirsHistoryRef: { current: Set<string> } = { current: new Set<string>() }

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
            if (arr.length === 0) return [] as Session[]
            const first = arr[0] as Record<string, unknown>
            const dir = (first as unknown as { directory?: unknown }).directory
            const hasEmptyDir = dir === "" || dir == null
            const isV2 = first && typeof first === "object" && "location" in first && (!("directory" in first) || hasEmptyDir)
            if (isV2) {
              try {
                return (arr as unknown as import("../shared/api/mappers").V2Session[]).map(toSessionV1)
              } catch {
                return arr as Session[]
              }
            }
            return arr as Session[]
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
        api.listProjects(config).catch(() => []),
      ])

      const knownDirs = new Set<string>(knownDirsHistoryRef.current)
      for (const s of items) if (s.directory) knownDirs.add(s.directory)
      for (const p of projects) if (p.directory) knownDirs.add(p.directory)
      for (const d of knownDirs) knownDirsHistoryRef.current.add(d)

      const directories = [...knownDirs].filter(Boolean)
      const chunk = <T>(arr: T[], size: number) => {
        const chunks: T[][] = []
        for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
        return chunks
      }
      const dirChunks = chunk(directories, 10)
      const allSessionLists: Session[][] = []
      const allStatusLists: Record<string, SessionStatus>[] = []
      for (const c of dirChunks) {
        const [sl, st] = await Promise.all([
          Promise.all(c.map((d) => api.listSessions(config, d).catch(() => [] as Session[]))),
          full ? Promise.all(c.map((d) => api.listStatuses(config, d).catch(() => ({} as Record<string, SessionStatus>)))) : Promise.resolve([]),
        ])
        allSessionLists.push(...sl)
        if (full) allStatusLists.push(...st)
      }

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
        console.info(`[sessions] raw=${items.length} projects=${projects.length} dirsConsultadas=${directories.length} total=${mapped.length}`, [...dirCounts.entries()].slice(0, 20))
      }

      setSessions((current) => {
        const currentMap = new Map(current.map((s) => [s.id, s]))
        for (const m of mapped) {
          const existing = currentMap.get(m.id)
          currentMap.set(m.id, {
            ...existing,
            ...m,
            status: m.status,
          })
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
          throw new Error(`${directory} is not an OpenCode project folder.`)
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
    await api.deleteSession(config, id, sessionToDelete?.directory)
    if (selectedID === id) setSelectedID(null)
    setSessionToDelete(null)
    await refreshSessions(true)
  }, [config, sessionToDelete?.directory, selectedID, refreshSessions])

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
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(".rename-input")
      input?.focus()
      input?.select()
    }, 50)
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
