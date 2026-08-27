import { useEffect, useMemo, useState, useCallback, useRef, useSyncExternalStore } from "react"
import { useT } from "../i18n-context"
import { useConfig } from "../hooks/useConfig"
import { useTheme } from "../hooks/useTheme"
import { useSessions } from "../hooks/useSessions"
import { modelKey } from "../utils/model-utils"
import { useAI } from "../hooks/useAI"
import { useMessages } from "../hooks/useMessages"
import { useSessionSidecar } from "../hooks/useSessionSidecar"
import { useFolderPicker } from "../hooks/useFolderPicker"
import { useStats } from "../hooks/useStats"
import { useSSE } from "../hooks/useSSE"
import { useOfflineCache } from "../hooks/useOfflineCache"
import { loadShortcutsConfig, type ShortcutItem } from "../shortcuts"
import type { ViewType, HelpPage as HelpPageType, ServerProfile, FileDiff } from "../types"
import type { LanguageCode } from "../i18n"
import { isSessionActive } from "../utils"
import { STORAGE_KEYS } from "../constants"
import { formatBytes } from "../hooks/useMemoryUsage"
import { useBlockedModels } from "../hooks/useBlockedModels"
import { useFeatureFlags } from "../hooks/useFeatureFlags"
import { useProviderManager } from "../hooks/useProviderManager"
import { useShell } from "../hooks/useShell"
import { useChatSettings } from "../hooks/useChatSettings"
import { usePromptSnippets } from "../hooks/usePromptSnippets"
import { useFileBrowser } from "../hooks/useFileBrowser"
import { useOfflineQueue } from "../hooks/useOfflineQueue"
import { useNotifications } from "../hooks/useNotifications"
import { useIsDesktop } from "../hooks/useIsDesktop"
import { useDesktopShortcuts } from "../hooks/useDesktopShortcuts"
import { useQuestions } from "../hooks/useQuestions"
import { useSSEHandler } from "../hooks/useSSEHandler"
import { useServers } from "../hooks/useServers"
import { loadDesktopConfig } from "../desktop"
import { useVisualSelection } from "../hooks/useVisualSelection"
import { pluginHost, tabRegistry } from "../plugins"
import { useVirtualTabs } from "../hooks/useVirtualTabs"
import { useSidebarPrefs } from "../hooks/useSidebarPrefs"
import { useDesktopLayoutState } from "../hooks/useDesktopLayoutState"
import { buildGridTemplate } from "../widgets/desktop-grid/model"
import { useSidebarResize } from "../widgets/sidebar/hooks/useSidebarResize"
import { useUIZoom } from "../hooks/useUIZoom"
import { useProjectInspection } from "../features/project/hooks/useProjectInspection"
import { useAppNavigation } from "../features/navigation/hooks/useAppNavigation"
import { useChatActions } from "../features/chat/hooks/useChatActions"
import { useDesktopGridActions } from "../widgets/desktop-grid/hooks/useDesktopGridActions"
import { useBaseChatProps } from "../features/chat/hooks/useBaseChatProps"
import { useAppModalsState } from "../features/modals/hooks/useAppModalsState"
import { useGlobalKeyShortcuts } from "../features/shortcuts/hooks/useGlobalKeyShortcuts"
import { useHostActions } from "../features/host-actions/hooks/useHostActions"
import { useAppLifecycle } from "../features/app-lifecycle/hooks/useAppLifecycle"

export type UseAppControllerParams = {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
}

export function useAppController({ language, setLanguage }: UseAppControllerParams) {
  const t = useT()

  const {
    config,
    draftConfig,
    setDraftConfig,
    connectedVersion,
    testingConnection,
    connectionState,
    settingsNotice,
    setSettingsNotice,
    hasConfiguredServer,
    canTestDraft,
    testAlreadyPassedForDraft,
    dataMode,
    changeDataMode,
    saveConfig,
    testConnection,
    setConnectionState,
    setConnectionMessage,
  } = useConfig()

  const { theme, setTheme } = useTheme()
  const isDesktop = useIsDesktop()
  useUIZoom()

  const pluginTabs = useSyncExternalStore(
    tabRegistry.subscribe,
    tabRegistry.getSnapshot,
    tabRegistry.getSnapshot
  )
  const handleToggleLightMode = useCallback(() => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light"
    setTheme(isLight ? "dark" : "light")
  }, [setTheme])

  const [quickChatKey] = useState(
    () => localStorage.getItem(STORAGE_KEYS.QUICKCHAT_KEY_CEREBRAS) || ""
  )
  const [quickChatGroqKey] = useState(
    () => localStorage.getItem(STORAGE_KEYS.QUICKCHAT_KEY_GROQ) || ""
  )
  const [quickChatGoKey, setQuickChatGoKey] = useState("")
  const [quickChatCustomKey] = useState(
    () => localStorage.getItem(STORAGE_KEYS.QUICKCHAT_KEY_CUSTOM) || ""
  )
  const [quickChatCustomUrl] = useState(
    () => localStorage.getItem(STORAGE_KEYS.QUICKCHAT_CUSTOM_URL) || "https://api.openai.com/v1"
  )

  useEffect(() => {
    import("../goUsage").then(({ loadGoAccounts }) => {
      loadGoAccounts()
        .then((keys) => setQuickChatGoKey(keys[0] ?? ""))
        .catch(() => {})
    })
  }, [])

  const { prefs: sidebarPrefs } = useSidebarPrefs()

  const {
    composer,
    setComposer,
    isSending,
    awaitingAssistantReply,
    setAwaitingAssistantReply,
    runtimeError,
    setRuntimeError,
    renderedMessages,
    messageScrollSignature,
    completionShouldPlayRef,
    clearSession,
    preloadMessages,
    loadSelected,
    send,
    abortSession,
    setMessages,
    undoMessage,
    redoMessage,
    compactSession,
    applyDelta,
    applyPart,
    compacting,
    setCompacting,
  } = useMessages(config)

  const composerRef = useRef(composer)
  useEffect(() => {
    composerRef.current = composer
  }, [composer])
  const handleComposerChange = useCallback(
    (value: string) => {
      composerRef.current = value
      setComposer(value)
    },
    [setComposer]
  )

  const [localRevertID, setLocalRevertID] = useState<string | null>(null)

  const {
    todos,
    diffFiles,
    projectDashboard,
    dashboardError,
    todosExpanded,
    setTodosExpanded,
    activeDetailSheet,
    setActiveDetailSheet,
    totalDiffAdditions,
    totalDiffDeletions,
    loadTodos,
    loadDiffs,
    loadDashboard,
    clearSidecar,
  } = useSessionSidecar(config)

  const {
    showNewSessionPicker,
    pickerDir,
    pickerItems,
    pickerLoading,
    pickerError,
    setPickerError,
    browseNewSessionDirectory,
    setShowNewSessionPicker,
  } = useFolderPicker(config)

  const { view, navigate, goBack, navStackRef } = useAppNavigation({
    config,
    showNewSessionPicker,
    setShowNewSessionPicker,
    activeDetailSheet,
    setActiveDetailSheet,
    hasConfiguredServer,
  })

  const [commands, setCommands] = useState<
    { name: string; description?: string; source?: "command" | "mcp" | "skill" }[]
  >([])
  const [commandFilter, setCommandFilter] = useState<"all" | "skill">("all")
  const [helpPage, setHelpPage] = useState<HelpPageType>("overview")
  const [query, setQuery] = useState("")

  const backgroundFailureCountRef = useRef(0)
  const initialSessionLoadRef = useRef(true)

  const {
    agentOptions,
    modelOptions,
    modelLoadError,
    modelQuery,
    setModelQuery,
    primaryAgentOptions,
    allPrimaryAgents,
    disabledAgents,
    toggleAgentEnabled,
    activeAgent,
    activeAgentID,
    activeModelOption: globalActiveModelOption,
    activeModel: globalActiveModel,
    variantGroups,
    selectedModelKey,
    selectedVariant: globalSelectedVariant,
    changeVariant,
    activeModelVariants: globalActiveModelVariants,
    getModelForSession,
    loadAgents,
    loadModels,
    changeModel,
    changeAgent,
  } = useAI(config)

  const blockedModels = useBlockedModels(modelOptions)
  const { flags, toggleFlag, setFlag } = useFeatureFlags()
  const vs = useVisualSelection()

  const [shortcuts] = useState<ShortcutItem[]>(() => loadShortcutsConfig())

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

  useGlobalKeyShortcuts({ vs, shortcuts, setShowShortcuts })

  useEffect(() => {
    if (isDesktop) {
      pluginHost.reloadAll().catch((err) => console.error("[Plugins] Error al inicializar:", err))
    }
  }, [isDesktop])

  const filteredVariantGroups = useMemo(() => {
    const bs = blockedModels.blocked
    return {
      recentModels: variantGroups.recentModels.filter((m) => !bs.has(modelKey(m))),
      groups: new Map(Array.from(variantGroups.groups.entries()).filter(([k]) => !bs.has(k))),
    }
  }, [variantGroups, blockedModels.blocked])

  const { stats, recordPrompt, recordSessionCreated, resetStats } = useStats()
  const {
    settings: chatSettings,
    setSetting: setChatSetting,
    resetDefaults: resetChatSettings,
  } = useChatSettings()
  const { snippets: promptSnippets, addSnippet, removeSnippet } = usePromptSnippets()

  const stopGenerationRef = useRef(false)
  const { getCachedMessages, getCachedSessions } = useOfflineCache(flags)

  const loadSessionRef = useRef(0)

  const onLoadSelected = useCallback(
    async (id: string, dir: string) => {
      const reqId = ++loadSessionRef.current
      clearSession()
      clearSidecar()
      if (flags.offlineCache) {
        try {
          const cached = await getCachedMessages(id)
          if (cached && cached.length > 0 && reqId === loadSessionRef.current) {
            preloadMessages(id, cached)
          }
        } catch {
          /* ignore */
        }
      }
      loadAgents(dir).catch(() => undefined)
      loadModels(dir).catch(() => undefined)
      try {
        await loadSelected(id, dir)
      } catch (e) {
        throw e
      }
      if (reqId !== loadSessionRef.current) return
      loadTodos(id, dir)
    },
    [
      loadSelected,
      loadAgents,
      loadModels,
      loadTodos,
      clearSession,
      clearSidecar,
      preloadMessages,
      flags.offlineCache,
      getCachedMessages,
    ]
  )

  useEffect(() => {
    if (activeDetailSheet === "ai") {
      loadModels()
    }
  }, [activeDetailSheet, loadModels])

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
    config,
    onLoadSelected,
    backgroundFailureCountRef,
    initialSessionLoadRef,
    setConnectionState,
    setConnectionMessage
  )

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
    showTerminal,
    setShowTerminal,
    terminalDocked,
    setTerminalDocked,
    terminalHeight,
    setTerminalHeight,
  } = useDesktopLayoutState(isDesktop, selectedSession?.id ?? null)

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
    handleSessionDragStart,
    handleSwapPanels,
    handleDockSession,
    handleOpenFile,
  } = useDesktopGridActions({
    isDesktop,
    desktopLayout,
    desktopLayoutRef,
    setDesktopLayout,
    tabStacks: tabStacks ?? [],
    setTabStacks: setTabStacks as any,
    activePanel,
    setActivePanel,
    setShowTerminal,
    setFileEditorPath,
    setDesktopState,
  })

  const {
    handleShutdownHost,
    handleRestartHost,
    handleDeleteMany,
    handleArchiveMany,
    openSessionInDir,
    openStatsAsTab,
    openBrowserAsTab,
    handleOpenBrowser,
  } = useHostActions({
    config,
    selectedSession,
    setSettingsNotice,
    t,
    sessions,
    setSessions: (updater) => setSessions(updater as any),
    selectedID,
    setSelectedID,
    refreshSessions,
    recordSessionCreated,
    navigate,
    setRuntimeError,
    activePanel,
    desktopLayout,
    setDesktopLayout,
    tabStacks: tabStacks ?? [],
    setTabStacks,
    switchTab,
    setActivePanel,
    isDesktop,
  })

  const openPluginAsTab = useCallback(
    (key: string, targetPanel?: number) => {
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
      tabStacks,
      switchTab,
      setActivePanel,
      setTabStacks,
      setDesktopLayout,
      navigate,
    ]
  )

  const openExternalProject = useCallback(
    (name: string) => {
      navigate("detail")
      openPluginAsTab(`external:${name}`)
    },
    [openPluginAsTab, navigate]
  )

  const handleOpenNewSession = useCallback(async () => {
    const s = await createSession("")
    if (s) {
      recordSessionCreated()
      navigate("detail")
    }
  }, [createSession, recordSessionCreated, navigate])

  const handleCreateSession = useCallback(
    async (dir?: string) => {
      const s = await createSession(dir)
      setShowNewSessionPicker(false)
      if (s) {
        recordSessionCreated()
        navigate("detail")
      }
    },
    [createSession, recordSessionCreated, navigate, setShowNewSessionPicker]
  )

  const fb = useFileBrowser(config, selectedSession?.directory)
  const handleOpenExplorer = useCallback(() => {
    fb.open()
  }, [fb])

  const {
    lines: shellLines,
    running: shellRunning,
    shell: terminalShell,
    setShell: setTerminalShell,
    execute: shellExecute,
    clear: shellClear,
    history: shellHistory,
  } = useShell(config, selectedSession?.directory)

  const {
    providers: providerList,
    connecting: connectingProvider,
    error: providerError,
    connectProvider,
    disconnectProvider,
    addCustomProvider,
  } = useProviderManager(modelOptions, config)

  const {
    profiles: serverProfiles,
    addProfile,
    removeProfile,
    updateProfile,
  } = useServers()

  const [activeServerProfileID, setActiveServerProfileID] = useState<string | null>(() =>
    localStorage.getItem("opencode.mobile.activeServer")
  )

  const applyServerProfile = useCallback(
    (profile: ServerProfile) => {
      setActiveServerProfileID(profile.id)
      localStorage.setItem("opencode.mobile.activeServer", profile.id)
      setDraftConfig(profile.config)
      saveConfig(t)
    },
    [setDraftConfig, saveConfig, t]
  )

  const { enqueue: queueAction, dequeueAll } = useOfflineQueue()
  const { notify } = useNotifications()

  const {
    pendingQuestions,
    permissionRequest,
    handleQuestionReply,
    handleQuestionReject,
    handlePermissionApprove,
    handlePermissionReject,
    handleDismissQuestion,
    handleDismissPermission,
  } = useQuestions({ config, directory: selectedSession?.directory, enabled: true, notify, t })

  const currentSessionAI = useMemo(() => {
    return getModelForSession(selectedSession?.id)
  }, [getModelForSession, selectedSession?.id])

  const activeModelOption = currentSessionAI.activeModelOption ?? globalActiveModelOption
  const activeModel =
    (currentSessionAI.activeModel
      ? {
          providerID: currentSessionAI.activeModel.providerID,
          modelID: currentSessionAI.activeModel.modelID,
          variant: currentSessionAI.activeModel.variant,
        }
      : null) ??
    (globalActiveModel
      ? {
          providerID: globalActiveModel.providerID,
          modelID: globalActiveModel.modelID,
          variant: globalActiveModel.variant,
        }
      : null)
  const activeModelVariants = currentSessionAI.activeModelVariants ?? globalActiveModelVariants
  const selectedVariant = currentSessionAI.selectedVariant ?? globalSelectedVariant

  const sseHandler = useSSEHandler({
    sessionID: selectedSession?.id,
    directory: selectedSession?.directory,
    loadSelected,
    applyDelta,
    applyPart,
    setAwaitingAssistantReply,
    setRuntimeError,
    awaitingRef: () => awaitingAssistantReply,
    onSettled: (sid, dir) => {
      loadSelected(sid, dir)
      refreshSessions()
    },
  })

  const { streamState } = useSSE(config, sseHandler, selectedSession?.directory, selectedSession?.id)

  const { memInfo } = useAppLifecycle({
    config,
    connectionState,
    setConnectionState,
    setConnectionMessage,
    dataMode,
    changeDataMode,
    flags,
    selectedSession,
    sessions,
    setSessions: (updater) => setSessions(updater as any),
    setMessages,
    streamState,
    awaitingAssistantReply,
    setAwaitingAssistantReply,
    completionShouldPlayRef,
    chatSettings,
    refreshSessions,
    loadSelected,
    loadAgents,
    loadModels,
    setCommands,
    getCachedSessions,
    backgroundFailureCountRef,
    initialSessionLoadRef,
    activeDetailSheet,
    loadDiffs,
    loadDashboard,
    dequeueAll,
    navigate,
    openSession,
    setDraftConfig,
    t,
  })

  const settleSession = useCallback(
    async (sessionID: string, dir: string) => {
      try {
        await loadSelected(sessionID, dir)
        await refreshSessions()
      } catch {
        /* silently fail */
      }
    },
    [loadSelected, refreshSessions]
  )

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
    query,
    projectDashboard,
    diffFiles,
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

  const handleLanguageChange = useCallback(
    (lang: LanguageCode) => {
      setLanguage(lang)
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang)
    },
    [setLanguage]
  )

  const {
    handleExportChat,
    handleExportMarkdown,
    handleSnapshot,
    handleSend,
    handleRegenerate,
    handleInsertPrompt,
    handleSendPrompt,
    handleAbort,
    handleRevertToMessage,
    handleEditMessage,
    handleUndo,
    handleRedo,
    handleCompact,
  } = useChatActions({
    selectedSession,
    config,
    connectionState,
    activeModel: activeModel as any,
    activeAgentID,
    commands,
    composerRef,
    setComposer,
    setRuntimeError,
    queueAction,
    recordPrompt,
    stopGenerationRef,
    localRevertID,
    setLocalRevertID,
    setMessages: setMessages as any,
    setSessions: setSessions as any,
    send,
    refreshSessions,
    loadSelected,
    setCommands,
    vs,
    navigate,
    setHelpPage,
    setShowThemePicker,
    setShowConnectSheet,
    renderedMessages,
    awaitingAssistantReply,
    setAwaitingAssistantReply,
    completionShouldPlayRef,
    abortSession,
    settleSession,
    undoMessage,
    redoMessage,
    compactSession,
    setCompacting,
  })

  const [maximizedPanel, setMaximizedPanel] = useState<number | null>(null)
  const shellRef = useRef<HTMLDivElement | null>(null)

  const toggleMaximize = useCallback((index: number) => {
    setMaximizedPanel((prev) => (prev === index ? null : index))
  }, [])

  const gridOptions = useMemo(
    () => ({
      position: sidebarPrefs.position,
      sidebarCollapsed,
      sidebarWidth,
      rightSidebarCollapsed,
      rightSidebarWidth,
      desktopDiffOpen,
      desktopDiffWidth,
    }),
    [
      sidebarPrefs.position,
      sidebarCollapsed,
      sidebarWidth,
      rightSidebarCollapsed,
      rightSidebarWidth,
      desktopDiffOpen,
      desktopDiffWidth,
    ]
  )
  const shellGridStyle = useMemo(
    () => (isDesktop ? buildGridTemplate(gridOptions) : undefined),
    [isDesktop, gridOptions]
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
    isDesktop,
    view,
    shortcuts,
    activePanel,
    tabStacks: tabStacks as any,
    desktopLayout,
    maximizedPanel,
    switchTab,
    closePanel,
    splitPanel,
    toggleMaximize,
    setMaximizedPanel,
    setSidebarCollapsed,
    handleOpenNewSession,
    setDesktopLayout,
    setShowTerminal,
    setActivePanel,
  })

  const handleOpenSession = useCallback(
    async (id: string, dir: string) => {
      navigate("detail")
      if (isDesktop) {
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
        if (flags.offlineCache) {
          const cached = await getCachedMessages(id).catch(() => null)
          if (cached && cached.length > 0) {
            setMessages((prev) => [...prev.filter((m) => m.info.sessionID !== id), ...cached])
          }
        }
      }
    },
    [
      navigate,
      openSession,
      flags.offlineCache,
      getCachedMessages,
      setMessages,
      isDesktop,
      desktopLayout.sessions,
      activePanel,
      openInPanel,
      setActivePanel,
    ]
  )

  const handleTest = useCallback(() => testConnection(t), [testConnection, t])

  const handleOpenGitHub = useCallback(() => {
    window.open("https://github.com/Owning01/Opencode-Mobile", "_system")
  }, [])

  const handleNavigate = useCallback(
    (target: ViewType) => {
      if (target === "sessions") setSelectedProjectDir(null)
      navigate(target)
    },
    [navigate, setSelectedProjectDir]
  )

  const handleOpenADEDiff = useCallback(
    (diffs?: FileDiff[], file?: string) => {
      if (isDesktop) {
        setDesktopDiffData({
          selectedFile: file,
          diffs:
            diffs ??
            (diffFiles.length > 0
              ? diffFiles.map((d) => ({
                  file: d.file,
                  patch: "",
                  additions: d.additions,
                  deletions: d.deletions,
                }))
              : []),
        })
        setDesktopDiffOpen(true)
      }
    },
    [isDesktop, diffFiles, setDesktopDiffOpen, setDesktopDiffData]
  )

  const isSessionRunning = Boolean(selectedSession && isSessionActive(selectedSession))
  const isWorking = awaitingAssistantReply || isSessionRunning

  const baseChatProps = useBaseChatProps({
    selectedSession,
    composer,
    handleComposerChange,
    localRevertID,
    renderedMessages,
    todos,
    todosExpanded,
    setTodosExpanded,
    isSending,
    isWorking,
    awaitingAssistantReply,
    loadingSessionID,
    selectedID,
    messageScrollSignature,
    view,
    dataMode,
    renamingSessionID,
    renameValue,
    commands,
    activeAgent,
    activeAgentID,
    activeModelOption,
    activeModelVariants,
    selectedVariant,
    changeVariant,
    getModelForSession,
    modelOptions,
    changeModel,
    filteredVariantGroups,
    primaryAgentOptions,
    agentOptions,
    changeAgent,
    projectName,
    startRename,
    setRenameValue,
    renameSession,
    cancelRename,
    handleSend,
    handleAbort,
    goBack,
    setActiveDetailSheet,
    recentSessions,
    sessions,
    handleOpenSession,
    readingMode,
    setReadingMode,
    handleExportChat,
    handleExportMarkdown,
    handleSnapshot,
    handleOpenFile,
    navigate,
    setShowThemePicker,
    config,
    connectionState,
    queueAction,
    shellExecute: (cmd, sid, dir) => shellExecute(cmd, sid || "", dir),
    flags,
    toggleFlag,
    setFlag,
    diffFiles,
    handleOpenADEDiff,
    projectDashboard,
    streamState,
    compacting,
    pendingQuestions,
    permissionRequest,
    handleQuestionReply,
    handleQuestionReject,
    handlePermissionApprove,
    handlePermissionReject,
    handleDismissQuestion,
    handleDismissPermission,
    handleRevertToMessage,
    handleEditMessage,
    handleUndo,
    handleRedo,
    handleCompact,
    handleCreateSession,
    fb,
    setShowTerminal,
    setShowMCPBrowser,
    setDesktopCfg,
    loadDesktopConfig,
    setShowRemoteDesktop,
    chatSettings,
    promptSnippets,
    handleRegenerate,
    handleInsertPrompt,
    handleSendPrompt,
    setChatSetting,
    resetChatSettings,
    vs,
  })

  const activeSessionSid = isDesktop
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

  const { handleOpenDesign, handleOpenKanban, handleOpenLearning } = useVirtualTabs({
    isDesktop,
    desktopLayout,
    activePanel,
    tabStacks,
    setTabStacks: setTabStacks as any,
    setDesktopLayout,
    setActivePanel,
    addPanel,
    handleNavigate,
  })

  const handleBrowserVisualPick = useCallback(
    (url: string, el: any) => {
      const isPod = el?.mode === "pod" && Array.isArray(el.members) && el.members.length > 0
      vs.addAnnotation({
        id: typeof el.tmpId === "string" && el.tmpId ? el.tmpId : undefined,
        mode: isPod ? "pod" : "picker",
        members: isPod ? el.members : undefined,
        tag: String(el.tag ?? "div"),
        selector: String(el.selector ?? ""),
        xpath: el.xpath,
        outerHTML: String(el.outerHTML ?? ""),
        innerText: String(el.innerText ?? ""),
        boundingRect: el.boundingRect,
        bx: el.bx,
        by: el.by,
        url,
        source: el.source ?? null,
      } as any)
    },
    [vs]
  )

  const handleToggleInspectTool = useCallback(
    (tool: "picker" | "pod") => {
      if (vs.inspectMode && vs.inspectTool === tool) {
        vs.setInspectMode(false)
        return
      }
      vs.setInspectTool(tool)
      vs.setInspectMode(true)
    },
    [vs]
  )

  return {
    t,
    isDesktop,
    view,
    theme,
    setTheme,
    language,
    handleLanguageChange,
    handleToggleLightMode,
    config,
    draftConfig,
    setDraftConfig,
    handleTest,
    testingConnection,
    canTestDraft,
    testAlreadyPassedForDraft,
    connectedVersion,
    settingsNotice,
    dataMode,
    changeDataMode,
    modelOptions,
    selectedModelKey,
    changeModel,
    modelKey,
    selectedVariant,
    allPrimaryAgents,
    disabledAgents,
    toggleAgentEnabled,
    stats,
    resetStats,
    activeModelOption,
    blockedModels,
    setShowThemePicker,
    setShowThemeCreator,
    flags,
    toggleFlag,
    setFlag,
    providerList,
    connectingProvider,
    providerError,
    connectProvider,
    disconnectProvider,
    addCustomProvider,
    loadModels,
    serverProfiles,
    addProfile,
    updateProfile,
    removeProfile,
    applyServerProfile,
    activeServerProfileID,
    setActiveServerProfileID,
    saveConfig,
    chatSettings,
    setChatSetting,
    resetChatSettings,
    promptSnippets,
    addSnippet,
    removeSnippet,
    handleShutdownHost,
    handleRestartHost,
    handleOpenGitHub,
    setShowFavoritesManager,
    setShowArchivedView,
    setShowShortcuts,
    setShowOpenCodeHub,
    navStackRef,
    goBack,
    helpPage,
    setHelpPage,
    commands,
    setCommands,
    commandFilter,
    setCommandFilter,
    quickChatKey,
    quickChatGroqKey,
    quickChatGoKey,
    quickChatCustomKey,
    quickChatCustomUrl,
    shellRef,
    sidebarPrefs,
    shellGridStyle,
    activity,
    setActivity,
    sidebarCollapsed,
    setSidebarCollapsed,
    showTerminal,
    setShowTerminal,
    tabStacks,
    desktopLayout,
    openStatsAsTab,
    openBrowserAsTab,
    handleOpenBrowser,
    handleOpenKanban,
    rightSidebarCollapsed,
    setRightSidebarCollapsed,
    handleOpenDesign,
    setShowPluginsModal,
    showPluginsModal,
    pluginTabs,
    openPluginAsTab,
    openExternalProject,
    memInfo,
    formatBytes,
    handleOpenLearning,
    handleNavigate,
    currentActiveSession,
    activeSessionDir,
    selectedSession,
    fb,
    startSidebarResize,
    startRightSidebarResize,
    maximizedPanel,
    setMaximizedPanel,
    sessions,
    busySessions,
    connectionState,
    baseChatProps,
    composer,
    handleComposerChange,
    fileEditorPath,
    setFileEditorPath,
    vs,
    setDesktopLayout,
    setActivePanel,
    activePanel,
    removeTab,
    moveTab,
    transferTab,
    addTerminalToPanel,
    closeOthers,
    closeRight,
    closeLeft,
    closeAll,
    closePanel,
    handleDockSession,
    settleSession,
    refreshSessions,
    recordPrompt,
    queueAction,
    shellExecute,
    changeAgent,
    openInPanel,
    handleSwapPanels,
    handleOpenFile,
    setShowConnectSheet,
    openSessionInDir,
    handleToggleInspectTool,
    handleBrowserVisualPick,
    switchTab,
    terminalDocked,
    setTerminalDocked,
    terminalHeight,
    setTerminalHeight,
    shellLines,
    shellRunning,
    terminalShell,
    setTerminalShell,
    shellClear,
    shellHistory,
    desktopDiffOpen,
    setDesktopDiffOpen,
    desktopDiffData,
    diffFiles,
    setDesktopDiffWidth,
    filteredProjects,
    filteredProjectSessions,
    selectedProjectDir,
    setSelectedProjectDir,
    selectedID,
    refreshingSessions,
    creatingSession,
    renamingSessionID,
    renameValue,
    setRenameValue,
    query,
    setQuery,
    activeSessions,
    recentSessions,
    favorites,
    toggleFavorite,
    refreshSessionsWithIndicator,
    handleOpenNewSession,
    handleOpenSession,
    startRename,
    renameSession,
    cancelRename,
    setSessionToDelete,
    sessionToDelete,
    deleteSession,
    dismissRecent,
    handleCreateSession,
    handleOpenExplorer,
    handleSessionDragStart,
    handleDeleteMany,
    handleArchiveMany,
    showNewSessionPicker,
    pickerDir,
    pickerItems,
    pickerLoading,
    pickerError,
    browseNewSessionDirectory,
    setPickerError,
    setShowNewSessionPicker,
    activeDetailSheet,
    setActiveDetailSheet,
    modelLoadError,
    filteredVariantGroups,
    modelQuery,
    setModelQuery,
    projectName,
    projectPath,
    vcsBranch,
    projectDashboard,
    totalDiffAdditions,
    totalDiffDeletions,
    dashboardError,
    showThemePicker,
    showThemeCreator,
    showConnectSheet,
    showMCPBrowser,
    setShowMCPBrowser,
    showArchivedView,
    desktopCfg,
    showShortcuts,
    showFavoritesManager,
    showOpenCodeHub,
    agentOptions,
    activeAgentID,
    runtimeError,
    setRuntimeError,
    showRemoteDesktop,
    setShowRemoteDesktop,
  }
}
