import { useCallback } from "react"
import { api } from "../../../api"
import type { ServerConfig, SessionView } from "../../../types"

export type UseHostActionsParams = {
  config: ServerConfig
  selectedSession: SessionView | null
  setSettingsNotice: (notice: { type: "success" | "error" | "info"; text: string } | null) => void
  t: (key: string, args?: Record<string, any>) => string
  sessions: SessionView[]
  setSessions: (updater: (prev: SessionView[]) => SessionView[]) => void
  selectedID: string | null
  setSelectedID: (id: string | null) => void
  /** Limpia mensajes/sidecar de la vista móvil al borrar/archivar la abierta. */
  onClearSelected?: () => void
  refreshSessions: (force?: boolean) => Promise<any>
  navigate: (view: any) => void
  setRuntimeError: (err: string | null) => void
  activePanel: number
  desktopLayout: any
  setDesktopLayout: (updater: any) => void
  setTabStacks: (updater: any) => void
  setActivePanel: (idx: number | ((prev: number) => number)) => void
  isDesktop: boolean
}

export function useHostActions({
  config,
  selectedSession,
  setSettingsNotice,
  t,
  sessions,
  setSessions,
  selectedID,
  setSelectedID,
  onClearSelected,
  refreshSessions,
  navigate,
  setRuntimeError,
  activePanel,
  desktopLayout,
  setDesktopLayout,
  setTabStacks,
  setActivePanel,
  isDesktop,
}: UseHostActionsParams) {
  const handleShutdownHost = useCallback(() => {
    if (!selectedSession || !config) {
      setSettingsNotice({ type: "error", text: t("extras.shutdownNoSession") })
      return
    }
    api
      .sendShell(
        config,
        selectedSession.id,
        "shutdown /s /t 0 || shutdown -h now",
        selectedSession.directory
      )
      .then(() => {
        setSettingsNotice({ type: "success", text: t("extras.shutdownSent") })
      })
      .catch((err: Error) => {
        setSettingsNotice({
          type: "error",
          text: t("extras.shutdownFailed", { error: err.message }),
        })
      })
  }, [selectedSession, config, t, setSettingsNotice])

  const handleRestartHost = useCallback(() => {
    if (!selectedSession || !config) {
      setSettingsNotice({ type: "error", text: t("extras.shutdownNoSession") })
      return
    }
    api
      .sendShell(
        config,
        selectedSession.id,
        'shutdown /r /t 10 /c "OpenHer: reinicio programado" || shutdown -r +1',
        selectedSession.directory
      )
      .then(() => {
        setSettingsNotice({ type: "success", text: t("extras.restartSent") })
      })
      .catch((err: Error) => {
        setSettingsNotice({
          type: "error",
          text: t("extras.restartFailed", { error: err.message }),
        })
      })
  }, [selectedSession, config, t, setSettingsNotice])

  const handleDeleteMany = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0 || !config) return
      for (const id of ids) {
        const s = sessions.find((x) => x.id === id)
        await api.deleteSession(config, id, s?.directory).catch(() => undefined)
      }
      if (selectedID && ids.includes(selectedID)) {
        setSelectedID(null)
        onClearSelected?.()
      }
      await refreshSessions(true).catch(() => undefined)
    },
    [sessions, config, selectedID, refreshSessions, setSelectedID, onClearSelected]
  )

  const handleArchiveMany = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0 || !config) return
      for (const id of ids) {
        const s = sessions.find((x) => x.id === id)
        if (s) await api.sendCommand(config, id, "/archive", "", s.directory).catch(() => undefined)
      }
      if (selectedID && ids.includes(selectedID)) {
        setSelectedID(null)
        onClearSelected?.()
      }
      await refreshSessions(true).catch(() => undefined)
    },
    [sessions, config, selectedID, setSelectedID, onClearSelected, refreshSessions]
  )

  const openSessionInDir = useCallback(
    async (dir: string) => {
      if (!config) return
      try {
        const s = await api.createSession(config, dir)
        if (s) {
          setSessions((prev) => [s as unknown as SessionView, ...prev.filter((x) => x.id !== s.id)])
          navigate("detail")
        }
      } catch (err) {
        setRuntimeError((err as Error).message)
      }
    },
    [config, navigate, setRuntimeError, setSessions]
  )

  const openBrowserAsTab = useCallback(
    (url: string, targetPanel?: number) => {
      navigate("detail")
      const idx =
        targetPanel ?? Math.min(activePanel, Math.max(0, desktopLayout.sessions.length - 1))
      const tabId = `browser:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
      // Transacción única: evita browserTabUrls huérfano si el segundo setDesktopLayout fallara
      setDesktopLayout((prev: any) => {
        const sessions = [...prev.sessions]
        sessions[idx] = tabId
        return { ...prev, browserTabUrls: { ...(prev.browserTabUrls ?? {}), [tabId]: url }, sessions }
      })
      setTabStacks((prev: string[][]) => {
        const next = (prev ?? []).map((s) => [...s])
        while (next.length <= idx) next.push([])
        next[idx]!.push(tabId)
        return next
      })
      setActivePanel(idx)
    },
    [activePanel, desktopLayout.sessions.length, setDesktopLayout, setTabStacks, setActivePanel, navigate]
  )

  const handleOpenBrowser = useCallback(
    (url: string, targetPanel?: number) => {
      if (isDesktop) {
        openBrowserAsTab(url, targetPanel)
      } else {
        window.open(url, "_blank")
      }
    },
    [isDesktop, openBrowserAsTab]
  )

  return {
    handleShutdownHost,
    handleRestartHost,
    handleDeleteMany,
    handleArchiveMany,
    openSessionInDir,
    openBrowserAsTab,
    handleOpenBrowser,
  }
}
