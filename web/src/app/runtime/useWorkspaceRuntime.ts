import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useFolderPicker } from "../../hooks/useFolderPicker"
import { useAppNavigation } from "../../features/navigation/hooks/useAppNavigation"
import { useAppModalsState } from "../../features/modals/hooks/useAppModalsState"
import { useGlobalKeyShortcuts } from "../../features/shortcuts/hooks/useGlobalKeyShortcuts"
import { useSessions } from "../../hooks/useSessions"
import { useDesktopLayoutState } from "../../hooks/useDesktopLayoutState"
import { useDesktopGridActions } from "../../widgets/desktop-grid/hooks/useDesktopGridActions"
import { useHostActions } from "../../features/host-actions/hooks/useHostActions"
import { useFileBrowser } from "../../hooks/useFileBrowser"
import { useShell } from "../../hooks/useShell"
import { useProjectInspection } from "../../features/project/hooks/useProjectInspection"
import { useVirtualTabs } from "../../hooks/useVirtualTabs"
import { useSidebarResize } from "../../widgets/sidebar/hooks/useSidebarResize"
import { useDesktopShortcuts } from "../../hooks/useDesktopShortcuts"
import { loadShortcutsConfig, type ShortcutItem } from "../../shortcuts"
import { dirKey } from "../../utils/sessionDirs"
import { isSessionActive } from "../../utils"
import { STORAGE_KEYS } from "../../constants"
import { buildGridTemplate } from "../../widgets/desktop-grid/model"
import { ensureCanvasRegistered } from "../../features/canvas/register"
import { pluginHost } from "../../plugins"
import type { ViewType, SessionView } from "../../types"
import type { ConnectionRuntime } from "./useConnectionRuntime"
import type { ChatRuntime } from "./useChatRuntime"

export type UseWorkspaceRuntimeParams = {
  conn: ConnectionRuntime
  chat: ChatRuntime
}

/**
 * Runtime de workspace/desktop: navegación, sesiones, layout de paneles,
 * grid, tabs, host actions, explorador, shortcuts y diffs de escritorio.
 */
export function useWorkspaceRuntime({ conn, chat }: UseWorkspaceRuntimeParams) {
  const {
    showNewSessionPicker,
    pickerDir,
    pickerItems,
    pickerLoading,
    pickerError,
    setPickerError,
    browseNewSessionDirectory,
    setShowNewSessionPicker,
    openNewSessionPicker,
    persistDirectory,
  } = useFolderPicker(conn.config)

  const { view, navigate, goBack, navStackRef } = useAppNavigation({
    config: conn.config,
    showNewSessionPicker,
    setShowNewSessionPicker,
    activeDetailSheet: chat.activeDetailSheet,
    setActiveDetailSheet: chat.setActiveDetailSheet,
    hasConfiguredServer: conn.hasConfiguredServer,
  })

  const {
    showShortcuts,
    setShowShortcuts,
    readingMode,
    setReadingMode,
    showThemePicker,
    setShowThemePicker,
    showThemeCreator,
    setShowThemeCreator,
    showConnectSheet,
    setShowConnectSheet,
    showMCPBrowser,
    setShowMCPBrowser,
    showArchivedView,
    setShowArchivedView,
    showOpenCodeHub,
    setShowOpenCodeHub,
    showFavoritesManager,
    setShowFavoritesManager,
    showRemoteDesktop,
    setShowRemoteDesktop,
    showPluginsModal,
    setShowPluginsModal,
    fileEditorPath,
    setFileEditorPath,
    desktopCfg,
    setDesktopCfg,
    desktopDiffData,
    setDesktopDiffData,
  } = useAppModalsState()

  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => loadShortcutsConfig())

  useEffect(() => {
    const onChange = (e: Event) => {
      const ce = e as CustomEvent<ShortcutItem[]>
      if (ce.detail && Array.isArray(ce.detail)) setShortcuts(ce.detail as ShortcutItem[])
      else setShortcuts(loadShortcutsConfig())
    }
    const onStorage = () => setShortcuts(loadShortcutsConfig())
    window.addEventListener("opencode-shortcuts-changed", onChange as EventListener)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("opencode-shortcuts-changed", onChange as EventListener)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  useGlobalKeyShortcuts({ vs: chat.vs, shortcuts, setShowShortcuts })

  useEffect(() => {
    // Tabs builtin: registro barato (el codigo del panel carga por lazy solo al abrirse)
    ensureCanvasRegistered()
    if (conn.isDesktop) {
      pluginHost.reloadAll().catch((err) => console.error("[Plugins] Error al inicializar:", err))
    }
  }, [conn.isDesktop])

  const {
    sessions,
    selectedID,
    loadingSessionID,
    refreshingSessions,
    creatingSession,
    selectedSession,
    sessionToDelete,
    renamingSessionID,
    renameValue,
    setRenameValue,
    openSession,
    refreshSessions,
    refreshSessionsWithIndicator,
    createSession,
    deleteSession,
    renameSession,
    startRename,
    cancelRename,
    setSessionToDelete,
    setSessions,
    favorites,
    toggleFavorite,
    setSelectedID,
  } = useSessions(
    conn.config,
    chat.onLoadSelected,
    chat.backgroundFailureCountRef,
    chat.initialSessionLoadRef,
    conn.setConnectionState,
    conn.setConnectionMessage
  )

  // Borrar/archivar la sesión abierta no debe dejar un chat huérfano
  // (mensajes visibles sin composer): se limpia el estado de mensajes.
  const clearSelectedChat = useCallback(() => {
    chat.clearSession()
    chat.clearSidecar()
    chat.setLocalRevertID(null)
  }, [chat.clearSession, chat.clearSidecar, chat.setLocalRevertID])

  const handleDeleteSession = useCallback(async (id: string) => {
    const wasSelected = id === selectedID
    await deleteSession(id)
    if (wasSelected) clearSelectedChat()
  }, [deleteSession, selectedID, clearSelectedChat])

  const {
    setDesktopState,
    desktopLayout,
    desktopLayoutRef,
    setDesktopLayout,
    tabStacks,
    setTabStacks,
    activePanel,
    setActivePanel,
    sidebarWidth,
    sidebarCollapsed,
    setSidebarWidth,
    setSidebarCollapsed,
    rightSidebarWidth,
    rightSidebarCollapsed,
    setRightSidebarWidth,
    setRightSidebarCollapsed,
    activity,
    setActivity,
    desktopDiffOpen,
    setDesktopDiffOpen,
    desktopDiffWidth,
    setDesktopDiffWidth,
  } = useDesktopLayoutState(conn.isDesktop, selectedSession?.id ?? null)

  const {
    switchTab,
    removeTab,
    moveTab,
    transferTab,
    addPanel,
    closePanel,
    closeOthers,
    closeRight,
    closeLeft,
    closeAll,
    splitPanel,
    openInPanel,
    addTerminalToPanel,
    detachTab,
    handleSessionDragStart,
    handleSwapPanels,
    handleDockSession,
    handleOpenFile,
  } = useDesktopGridActions({
    isDesktop: conn.isDesktop,
    desktopLayout,
    desktopLayoutRef,
    setDesktopLayout,
    tabStacks: tabStacks ?? [],
    setTabStacks: setTabStacks as any,
    activePanel,
    setActivePanel,
    setFileEditorPath,
    setDesktopState,
  })

  const {
    handleShutdownHost,
    handleRestartHost,
    handleDeleteMany,
    handleArchiveMany,
    openSessionInDir,
    openBrowserAsTab,
    handleOpenBrowser,
  } = useHostActions({
    config: conn.config,
    selectedSession,
    setSettingsNotice: conn.setSettingsNotice,
    t: conn.t,
    sessions,
    setSessions: (updater) => setSessions(updater as any),
    selectedID,
    setSelectedID,
    onClearSelected: clearSelectedChat,
    refreshSessions,
    navigate,
    setRuntimeError: chat.setRuntimeError,
    activePanel,
    desktopLayout,
    setDesktopLayout,
    setTabStacks,
    setActivePanel,
    isDesktop: conn.isDesktop,
  })

  const openPluginAsTab = useCallback(
    (key: string, targetPanel?: number) => {
      // Herramientas integradas que no son tabs de plugin: se abren por su vía.
      if (key === "openher:studio") {
        if (view === "studio") navigate(desktopLayout.sessions.some(Boolean) ? "detail" : "sessions")
        else navigate("studio")
        return
      }
      navigate("detail")
      const idx = targetPanel ?? Math.min(activePanel, Math.max(0, desktopLayout.sessions.length - 1))
      const tabId = `plugin:${key}`
      const existingPanel = tabStacks?.findIndex((s) => s.includes(tabId))
      if (existingPanel !== undefined && existingPanel >= 0) {
        const tabIdx = tabStacks![existingPanel]!.indexOf(tabId)
        if (tabIdx >= 0) {
          switchTab(existingPanel, tabIdx)
          setActivePanel(existingPanel)
          return
        }
      }
      setTabStacks((prev) => {
        const next = (prev ?? []).map((s) => [...s])
        while (next.length <= idx) next.push([])
        if (!next[idx]!.includes(tabId)) next[idx]!.push(tabId)
        return next
      })
      setDesktopLayout((prev) => {
        const sessions = [...prev.sessions]
        sessions[idx] = tabId
        return { ...prev, sessions }
      })
      setActivePanel(idx)
    },
    [
      activePanel,
      desktopLayout.sessions.length,
      desktopLayout.sessions,
      tabStacks,
      switchTab,
      setActivePanel,
      setTabStacks,
      setDesktopLayout,
      navigate,
      view,
      conn.isDesktop,
      setRightSidebarCollapsed,
    ]
  )

  const openExternalProject = useCallback(
    (name: string) => {
      navigate("detail")
      openPluginAsTab(`external:${name}`)
    },
    [openPluginAsTab, navigate]
  )

  const handleOpenNewSession = useCallback(() => {
    // Abre en el proyecto actual (si hay sesión); si no, cursor guardado/server.
    void openNewSessionPicker(selectedSession?.directory)
  }, [openNewSessionPicker, selectedSession?.directory])

  const handleCreateSession = useCallback(
    async (dir?: string) => {
      if (dir) persistDirectory(dir)
      const s = await createSession(dir)
      setShowNewSessionPicker(false)
      if (s) {
        navigate("detail")
      }
    },
    [createSession, navigate, setShowNewSessionPicker, persistDirectory]
  )

  // El Estudio necesita una sesión de agente atada al directorio del proyecto,
  // sin navegar fuera de la vista (a diferencia de handleCreateSession).
  const ensureStudioSession = useCallback(
    async (directory: string): Promise<SessionView | null> => {
      const target = dirKey(directory)
      try {
        const existing = sessions.find((s) => dirKey(s.directory ?? "") === target)
        if (existing) return existing
        return await createSession(directory)
      } catch {
        return null
      }
    },
    [sessions, createSession]
  )

  const fb = useFileBrowser(conn.config, selectedSession?.directory)
  const handleOpenExplorer = useCallback(() => {
    fb.open()
  }, [fb])

  const { execute: shellExecute } = useShell(conn.config, selectedSession?.directory)

  const {
    selectedProjectDir,
    setSelectedProjectDir,
    filteredProjects,
    filteredProjectSessions,
    projectPath,
    projectName,
    vcsBranch,
  } = useProjectInspection({
    sessions,
    query: chat.query,
    projectDashboard: chat.projectDashboard,
    diffFiles: chat.diffFiles,
  })

  const activeSessions = sessions.filter((s) => isSessionActive(s))
  const busySessions = useMemo(() => new Set(activeSessions.map((s) => s.id)), [activeSessions])

  const [dismissedRecentIds, setDismissedRecentIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECENT_DISMISS)
      const arr: string[] = raw ? JSON.parse(raw) : []
      return new Set(arr)
    } catch {
      return new Set()
    }
  })
  const dismissRecent = useCallback((id: string) => {
    setDismissedRecentIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      try {
        localStorage.setItem(STORAGE_KEYS.RECENT_DISMISS, JSON.stringify([...next]))
      } catch {}
      return next
    })
  }, [])

  const recentSessions = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => (b.updated || 0) - (a.updated || 0))
        .filter((s) => !dismissedRecentIds.has(s.id)),
    [sessions, dismissedRecentIds]
  )

  const [maximizedPanel, setMaximizedPanel] = useState<number | null>(null)
  const shellRef = useRef<HTMLDivElement | null>(null)

  const toggleMaximize = useCallback((index: number) => {
    setMaximizedPanel((prev) => (prev === index ? null : index))
  }, [])

  const gridOptions = useMemo(
    () => ({
      position: conn.sidebarPrefs.position,
      sidebarCollapsed,
      sidebarWidth,
      rightSidebarCollapsed,
      rightSidebarWidth,
      desktopDiffOpen,
      desktopDiffWidth,
      narrow: conn.shellNarrow,
      rightOverlay: conn.rightOverlay,
    }),
    [
      conn.sidebarPrefs.position,
      sidebarCollapsed,
      sidebarWidth,
      rightSidebarCollapsed,
      rightSidebarWidth,
      desktopDiffOpen,
      desktopDiffWidth,
      conn.shellNarrow,
      conn.rightOverlay,
    ]
  )
  const shellGridStyle = useMemo(
    () => (conn.isDesktop ? buildGridTemplate(gridOptions) : undefined),
    [conn.isDesktop, gridOptions]
  )

  const { startSidebarResize, startRightSidebarResize } = useSidebarResize({
    shellRef,
    sidebarWidth,
    setSidebarWidth,
    rightSidebarWidth,
    setRightSidebarWidth,
    gridOptions,
  })

  useDesktopShortcuts({
    isDesktop: conn.isDesktop,
    view,
    shortcuts,
    activePanel,
    tabStacks: tabStacks as any,
    desktopLayout,
    maximizedPanel,
    switchTab,
    closePanel,
    removeTab,
    splitPanel,
    toggleMaximize,
    setMaximizedPanel,
    setSidebarCollapsed,
    handleOpenNewSession,
    setDesktopLayout,
    setActivePanel,
    onAddTerminal: addTerminalToPanel,
  })

  const handleOpenSession = useCallback(
    async (id: string, dir: string) => {
      navigate("detail")
      if (conn.isDesktop) {
        const existing = desktopLayout.sessions.indexOf(id)
        if (existing >= 0) {
          setActivePanel(existing)
          return
        }
        openInPanel(activePanel, id)
        return
      }
      try {
        await openSession(id, dir)
      } catch {
        if (conn.flags.offlineCache) {
          const cached = await conn.getCachedMessages(id).catch(() => null)
          if (cached && cached.length > 0) {
            chat.setMessages((prev) => [...prev.filter((m) => m.info.sessionID !== id), ...cached])
          }
        }
      }
    },
    [
      navigate,
      openSession,
      conn.flags.offlineCache,
      conn.getCachedMessages,
      chat.setMessages,
      conn.isDesktop,
      desktopLayout.sessions,
      activePanel,
      openInPanel,
      setActivePanel,
    ]
  )

  const handleNavigate = useCallback(
    (target: ViewType) => {
      if (target === "sessions") setSelectedProjectDir(null)
      navigate(target)
    },
    [navigate, setSelectedProjectDir]
  )

  const activeSessionSid = conn.isDesktop
    ? desktopLayout.sessions[Math.min(activePanel, desktopLayout.sessions.length - 1)]
    : selectedSession?.id
  const currentActiveSession =
    (activeSessionSid ? sessions.find((s) => s.id === activeSessionSid) : null) ??
    selectedSession ??
    (desktopLayout.sessions.find(Boolean)
      ? sessions.find((s) => s.id === desktopLayout.sessions.find(Boolean))
      : null) ??
    sessions[0] ??
    null
  const activeSessionDir =
    currentActiveSession?.directory ??
    selectedSession?.directory ??
    sessions[0]?.directory ??
    undefined

  const { handleOpenKanban, handleOpenLearning } = useVirtualTabs({
    isDesktop: conn.isDesktop,
    desktopLayout,
    activePanel,
    tabStacks,
    setTabStacks: setTabStacks as any,
    setDesktopLayout,
    setActivePanel,
    addPanel,
    handleNavigate,
  })

  return {
    view,
    goBack,
    navigate,
    navStackRef,
    handleNavigate,
    showNewSessionPicker,
    pickerDir,
    pickerItems,
    pickerLoading,
    pickerError,
    setPickerError,
    browseNewSessionDirectory,
    setShowNewSessionPicker,
    openNewSessionPicker,
    persistDirectory,
    setShowThemePicker,
    setShowThemeCreator,
    setShowFavoritesManager,
    setShowArchivedView,
    setShowShortcuts,
    setShowOpenCodeHub,
    setShowMCPBrowser,
    setShowConnectSheet,
    setShowPluginsModal,
    showShortcuts,
    showThemePicker,
    showThemeCreator,
    showConnectSheet,
    showMCPBrowser,
    showArchivedView,
    showFavoritesManager,
    showOpenCodeHub,
    showRemoteDesktop,
    setShowRemoteDesktop,
    showPluginsModal,
    fileEditorPath,
    setFileEditorPath,
    desktopCfg,
    setDesktopCfg,
    desktopDiffData,
    setDesktopDiffData,
    readingMode,
    setReadingMode,
    sessions,
    selectedID,
    loadingSessionID,
    refreshingSessions,
    creatingSession,
    selectedSession,
    sessionToDelete,
    renamingSessionID,
    renameValue,
    setRenameValue,
    openSession,
    refreshSessions,
    refreshSessionsWithIndicator,
    createSession,
    deleteSession,
    renameSession,
    startRename,
    cancelRename,
    setSessionToDelete,
    setSessions,
    favorites,
    toggleFavorite,
    setSelectedID,
    handleDeleteSession,
    setDesktopLayout,
    desktopLayout,
    desktopLayoutRef,
    setDesktopState,
    tabStacks,
    setTabStacks,
    activePanel,
    setActivePanel,
    sidebarWidth,
    sidebarCollapsed,
    setSidebarWidth,
    setSidebarCollapsed,
    rightSidebarWidth,
    rightSidebarCollapsed,
    setRightSidebarWidth,
    setRightSidebarCollapsed,
    activity,
    setActivity,
    desktopDiffOpen,
    setDesktopDiffOpen,
    desktopDiffWidth,
    setDesktopDiffWidth,
    switchTab,
    removeTab,
    moveTab,
    transferTab,
    addPanel,
    closePanel,
    closeOthers,
    closeRight,
    closeLeft,
    closeAll,
    splitPanel,
    openInPanel,
    addTerminalToPanel,
    detachTab,
    handleSessionDragStart,
    handleSwapPanels,
    handleDockSession,
    handleOpenFile,
    handleShutdownHost,
    handleRestartHost,
    handleDeleteMany,
    handleArchiveMany,
    openSessionInDir,
    openBrowserAsTab,
    handleOpenBrowser,
    openPluginAsTab,
    openExternalProject,
    handleOpenNewSession,
    handleCreateSession,
    ensureStudioSession,
    fb,
    handleOpenExplorer,
    shellExecute,
    handleOpenSession,
    selectedProjectDir,
    setSelectedProjectDir,
    filteredProjects,
    filteredProjectSessions,
    projectPath,
    projectName,
    vcsBranch,
    activeSessions,
    busySessions,
    recentSessions,
    dismissRecent,
    shellRef,
    shellGridStyle,
    startSidebarResize,
    startRightSidebarResize,
    maximizedPanel,
    setMaximizedPanel,
    handleOpenKanban,
    handleOpenLearning,
    currentActiveSession,
    activeSessionDir,
  }
}

export type WorkspaceRuntime = ReturnType<typeof useWorkspaceRuntime>
