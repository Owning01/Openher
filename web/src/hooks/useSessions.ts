import { useState, useCallback, type MutableRefObject } from "react"
import type { ServerConfig, Session, SessionView, SessionStatus, ModelSelection } from "../types"
import { api } from "../api"

export function modelKey(model: { providerID: string; modelID: string; variant?: string }): string {
  const parts = [model.providerID, model.modelID]
  if (model.variant) parts.push(model.variant)
  return parts.map((p) => encodeURIComponent(p).replace(/%7C/gi, "|")).join("|")
}

export function modelFromKey(value: string | null): { providerID: string; modelID: string; variant?: string } | null {
  if (!value) return null
  const [providerID, modelID, ...rest] = value.split("|").map((part) => decodeURIComponent(part))
  const variant = rest.length > 0 ? rest.join("|") : undefined
  if (!providerID || !modelID) return null
  return { providerID, modelID, variant: variant || undefined }
}

export function sameModel(a: { providerID: string; modelID: string; variant?: string } | null | undefined,
                          b: { providerID: string; modelID: string; variant?: string } | null | undefined): boolean {
  return Boolean(a && b && a.providerID === b.providerID && a.modelID === b.modelID && (a.variant ?? "") === (b.variant ?? ""))
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
  refreshSessionsWithIndicator: () => Promise<void>
  createSession: (directory?: string, model?: ModelSelection) => Promise<SessionView | null>
  deleteSession: (id: string) => Promise<void>
  renameSession: (id: string, title: string, directory: string) => Promise<void>
  startRename: (session: SessionView) => void
  cancelRename: () => void
  setSessionToDelete: (v: SessionView | null) => void
  setSelectedID: (v: string | null) => void
  setSessions: (fn: (prev: SessionView[]) => SessionView[]) => void
  setRenameValue: (v: string) => void
}

export function useSessions(
  config: ServerConfig,
  onLoadSelected: (id: string, dir: string) => Promise<void>,
  backgroundFailureCountRef: MutableRefObject<number>,
  initialSessionLoadRef: MutableRefObject<boolean>
): SessionsActions {
  const [sessions, setSessions] = useState<SessionView[]>([])
  const [selectedID, setSelectedID] = useState<string | null>(null)
  const [loadingSessionID, setLoadingSessionID] = useState<string | null>(null)
  const [refreshingSessions, setRefreshingSessions] = useState(false)
  const [creatingSession, setCreatingSession] = useState(false)

  const [sessionToDelete, setSessionToDelete] = useState<SessionView | null>(null)
  const [renamingSessionID, setRenamingSessionID] = useState<string | null>(null)
  const [renameValue, setRenameValueState] = useState("")

  const selectedSession = sessions.find((s) => s.id === selectedID) ?? null

  const openSession = useCallback(async (id: string, dir: string) => {
    setSelectedID(id)
    setLoadingSessionID(id)
    try {
      await onLoadSelected(id, dir)
    } catch (err) {
      throw err
    }
    setLoadingSessionID((current) => (current === id ? null : current))
  }, [onLoadSelected])

  const refreshSessions = useCallback(async (_silent = false) => {
    if (!config.host || config.port <= 0) return
    try {
      const items = await api.listGlobalSessions(config).catch(() => api.listSessions(config))
      const directories = [...new Set(items.map((s) => s.directory).filter(Boolean))]

      const [sessionLists, statuses] = await Promise.all([
        Promise.all(directories.map((d) => api.listSessions(config, d).catch(() => [] as Session[]))),
        Promise.all(directories.map((d) => api.listStatuses(config, d).catch(() => ({} as Record<string, SessionStatus>))))
      ])
      const scoped = new Map(sessionLists.flat().map((s) => [s.id, s]))
      const allStatuses = new Map<string, SessionStatus>()
      for (const sm of statuses) {
        for (const [id, st] of Object.entries(sm)) {
          if (!allStatuses.has(id)) allStatuses.set(id, st)
        }
      }
      const hydrated = items.map((s) => ({ ...s, ...scoped.get(s.id), project: s.project }))

      const mapped = hydrated
        .map((s) => toSessionView(s as Session, allStatuses.get(s.id)))
        .sort((a, b) => b.updated - a.updated)

      setSessions((current) => {
        const selected = selectedID ? current.find((s) => s.id === selectedID) : null
        if (!selected || mapped.some((s) => s.id === selected.id)) return mapped
        return [selected, ...mapped].sort((a, b) => b.updated - a.updated)
      })

      backgroundFailureCountRef.current = 0
      initialSessionLoadRef.current = false
    } catch {
      backgroundFailureCountRef.current += 1
    }
  }, [config, selectedID, backgroundFailureCountRef, initialSessionLoadRef])

  const refreshSessionsWithIndicator = useCallback(async () => {
    if (refreshingSessions) return
    setRefreshingSessions(true)
    try {
      await refreshSessions()
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
    } finally {
      setCreatingSession(false)
    }
  }, [config, creatingSession])

  const deleteSession = useCallback(async (id: string) => {
    try {
      await api.deleteSession(config, id, sessionToDelete?.directory)
      if (selectedID === id) setSelectedID(null)
      setSessionToDelete(null)
      await refreshSessions()
    } catch (err) {
      throw err
    }
  }, [config, sessionToDelete?.directory, selectedID, refreshSessions])

  const renameSession = useCallback(async (id: string, title: string, directory: string) => {
    if (!title.trim()) return
    try {
      await api.renameSession(config, id, title.trim(), directory)
      setRenamingSessionID(null)
      setRenameValueState("")
      await refreshSessions()
    } catch (err) {
      throw err
    }
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

  return {
    sessions, selectedID, loadingSessionID, refreshingSessions, creatingSession,
    selectedSession, sessionToDelete, renamingSessionID, renameValue, setRenameValue: setRenameValueState,
    openSession, refreshSessions, refreshSessionsWithIndicator, createSession,
    deleteSession, renameSession, startRename, cancelRename,
    setSessionToDelete, setSelectedID, setSessions
  }
}
