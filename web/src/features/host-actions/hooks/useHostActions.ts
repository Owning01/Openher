import { useCallback } from "react"
import { api } from "../../../api"
import { prefetchServerStats } from "../../../hooks/useServerStats"
import { DEFAULT_STATS_PORT } from "../../../constants"
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
  refreshSessions: (force?: boolean) => Promise<any>
  recordSessionCreated: () => void
  navigate: (view: any) => void
  setRuntimeError: (err: string | null) => void
  activePanel: number
  desktopLayout: any
  setDesktopLayout: (updater: any) => void
  tabStacks: string[][]
  setTabStacks: (updater: any) => void
  switchTab: (pIdx: number, tIdx: number) => void
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
  refreshSessions,
  recordSessionCreated,
  navigate,
  setRuntimeError,
  activePanel,
  desktopLayout,
  setDesktopLayout,
  tabStacks,
  setTabStacks,
  switchTab,
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
        'shutdown /r /t 10 /c "OpenCode Mobile: reinicio programado" || shutdown -r +1',
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
      if (selectedID && ids.includes(selectedID)) setSelectedID(null)
      await refreshSessions(true).catch(() => undefined)
    },
    [sessions, config, selectedID, refreshSessions, setSelectedID]
  )

  const handleArchiveMany = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0 || !config) return
      for (const id of ids) {
        const s = sessions.find((x) => x.id === id)
        if (s) await api.sendCommand(config, id, "/archive", "", s.directory).catch(() => undefined)
      }
      await refreshSessions(true).catch(() => undefined)
    },
    [sessions, config, refreshSessions]
  )

  const openSessionInDir = useCallback(
    async (dir: string) => {
      if (!config) return
      try {
        const s = await api.createSession(config, dir)
        if (s) {
          setSessions((prev) => [s as unknown as SessionView, ...prev.filter((x) => x.id !== s.id)])
          recordSessionCreated()
          navigate("detail")
        }
      } catch (err) {
        setRuntimeError((err as Error).message)
      }
    },
    [config, recordSessionCreated, navigate, setRuntimeError, setSessions]
  )

  const openStatsAsTab = useCallback(
    (targetPanel?: number) => {
      if (!config) return
      navigate("detail")
      const idx =
        targetPanel ?? Math.min(activePanel, Math.max(0, desktopLayout.sessions.length - 1))
      const existingPanel = tabStacks?.findIndex((s) => s.includes("__stats__"))
      if (existingPanel !== undefined && existingPanel >= 0) {
        const tabIdx = tabStacks[existingPanel]!.indexOf("__stats__")
        if (tabIdx >= 0) {
          switchTab(existingPanel, tabIdx)
          setActivePanel(existingPanel)
          return
        }
      }
      prefetchServerStats(config, DEFAULT_STATS_PORT)
      setTabStacks((prev: string[][]) => {
        const next = (prev ?? []).map((s) => [...s])
        while (next.length <= idx) next.push([])
        if (!next[idx]!.includes("__stats__")) next[idx]!.push("__stats__")
        return next
      })
      setDesktopLayout((prev: any) => {
        const sessions = [...prev.sessions]
        sessions[idx] = "__stats__"
        return { ...prev, sessions }
      })
      setActivePanel(idx)
    },
    [
      activePanel,
      desktopLayout.sessions.length,
      tabStacks,
      switchTab,
      setActivePanel,
      setTabStacks,
      setDesktopLayout,
      config,
      navigate,
    ]
  )

  const openBrowserAsTab = useCallback(
    (url: string, targetPanel?: number) => {
      navigate("detail")
      const idx =
        targetPanel ?? Math.min(activePanel, Math.max(0, desktopLayout.sessions.length - 1))
      const tabId = `browser:${Date.now()}`
      setDesktopLayout((prev: any) => ({
        ...prev,
        browserTabUrls: { ...(prev.browserTabUrls ?? {}), [tabId]: url },
      }))
      setTabStacks((prev: string[][]) => {
        const next = (prev ?? []).map((s) => [...s])
        while (next.length <= idx) next.push([])
        next[idx]!.push(tabId)
        return next
      })
      setDesktopLayout((prev: any) => {
        const sessions = [...prev.sessions]
        sessions[idx] = tabId
        return { ...prev, sessions }
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
    openStatsAsTab,
    openBrowserAsTab,
    handleOpenBrowser,
  }
}
