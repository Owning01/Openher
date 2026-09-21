import { useState, useCallback, useMemo, useRef, type MutableRefObject } from "react"
import type { ServerConfig, SessionView, ModelSelection, ConnectionState } from "../types"
import { api } from "../api"
import { STORAGE_KEYS } from "../constants"
import { useLocalStorage } from "./useLocalStorage"
import { toSessionView } from "../entities/session/sessionsPlan"
import { fetchSessionsPlan, planSessionUpdate } from "../entities/session/sessionsPlan"
import { useT } from "../i18n-context"

// Compat: el test de mergeSessionPoll importa desde "./useSessions".
// La implementación vive en entities/session/model (B7).
export { mergeSessionPoll } from "../entities/session/sessionsPlan"

const FAVORITES_KEY = STORAGE_KEYS.FAVORITES

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
  const t = useT()
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
      const { mapped, verifiedKeys, statusFreshKeys } = await fetchSessionsPlan({
        config,
        full,
        getStateDirs: () => sessionsRef.current.map((s) => s.directory).filter(Boolean),
        getSelectedDir: () => sessionsRef.current.find((s) => s.id === selectedID)?.directory,
      })
      setSessions((current) => planSessionUpdate({ current, mapped, full, verifiedKeys, statusFreshKeys, selectedID }))

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
          setConnectionMessage(t('connection.reconnecting'))
        }
      }
    }
  }, [config, selectedID, backgroundFailureCountRef, initialSessionLoadRef, t])

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
          throw new Error(t('error.notProjectFolder', { directory }))
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
  }, [config, creatingSession, t])

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
