import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { api } from "./api"
import { I18nProvider, useT, normalizeLanguage } from "./i18n-context"
import { languageOptions } from "./i18n"
import { useConfig } from "./hooks/useConfig"
import { useTheme } from "./hooks/useTheme"
import { useSessions, modelKey, sameModel } from "./hooks/useSessions"
import { useAI, agentLabel } from "./hooks/useAI"
import { useMessages } from "./hooks/useMessages"
import { useSessionSidecar } from "./hooks/useSessionSidecar"
import { usePolling } from "./hooks/usePolling"
import { useCompletionAudio } from "./hooks/useCompletionAudio"
import { useFolderPicker } from "./hooks/useFolderPicker"
import { useStats } from "./hooks/useStats"
import { useSSE } from "./hooks/useSSE"
import { useOfflineCache } from "./hooks/useOfflineCache"
import { NavBar } from "./components/NavBar"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { SettingsPanel } from "./components/SettingsPanel"
import { SessionList } from "./components/SessionList"
import { ChatView } from "./components/ChatView"
import { BottomSheet } from "./components/BottomSheet"
import { HelpPage } from "./components/HelpPage"
import { ConfirmModal } from "./components/ConfirmModal"
import { FolderPicker } from "./components/FolderPicker"
import type { ViewType, HelpPage as HelpPageType, SessionView, SSEEvent, StreamState, Question, PermissionRequest } from "./types"
import type { LanguageCode } from "./i18n"
import { formatLimit, extractPath, extractName, extractBranch, isSessionActive, filterByQuery } from "./utils"
import { STORAGE_KEYS, QUESTION_POLL_INTERVAL_MS } from "./constants"
import { useBackButton } from "./hooks/useBackButton"
import { useNetworkMode } from "./hooks/useNetworkMode"
import { useMemoryCleanup } from "./hooks/useMemoryCleanup"
import { useBlockedModels } from "./hooks/useBlockedModels"
import { useFeatureFlags } from "./hooks/useFeatureFlags"
import { useProviderManager } from "./hooks/useProviderManager"
import { useAutoSummarize } from "./hooks/useAutoSummarize"
import { ThemeVariantProvider } from "./context/themeVariant"
import { ThemePicker } from "./components/ThemePicker"
import { SessionTokenUsage } from "./components/SessionTokenUsage"
import { MCPBrowser } from "./components/MCPBrowser"
import { ArchivedList } from "./components/ArchivedList"
import { ShortcutsModal } from "./components/ShortcutsModal"
import { FileEditor } from "./components/FileEditor"
import { TerminalView } from "./components/TerminalView"
import { ThemeCreator } from "./components/ThemeCreator"
import { FavoritesManager } from "./components/FavoritesManager"
import { useShell } from "./hooks/useShell"
import { useOfflineQueue } from "./hooks/useOfflineQueue"
import { useNotifications, loadNotificationFlags } from "./hooks/useNotifications"
import { useDeepLink } from "./hooks/useDeepLink"
import type { NotificationFlags } from "./hooks/useNotifications"
import { CloseIcon } from "./Icons"

function AppInner({ language, setLanguage }: { language: LanguageCode; setLanguage: (lang: LanguageCode) => void }) {
  const t = useT()

  const { config, draftConfig, setDraftConfig, connectedVersion, testingConnection,
    connectionState, settingsNotice,
    hasConfiguredServer, hasDraftChanges, canTestDraft, testAlreadyPassedForDraft,
    dataMode, changeDataMode,
    saveConfig, testConnection, setConnectionState, setConnectionMessage } = useConfig()

  const { theme, setTheme } = useTheme()
  const [view, setView] = useState<ViewType>(() => config.host && config.port > 0 ? "sessions" : "settings")

  const [commands, setCommands] = useState<{ name: string; description?: string; source?: "command" | "mcp" | "skill" }[]>([])
  const [commandFilter, setCommandFilter] = useState<"all" | "skill">("all")
  const [helpPage, setHelpPage] = useState<HelpPageType>("overview")
  const [query, setQuery] = useState("")

  const backgroundFailureCountRef = useRef(0)
  const initialSessionLoadRef = useRef(true)

  const { agentOptions, agentLoadError, modelOptions, modelLoadError,
    modelQuery, setModelQuery, primaryAgentOptions,
    activeAgent, activeAgentID, activeModelOption, activeModel, filteredModelOptions,
    selectedModelKey, showModelChip, loadAgents, loadModels, changeModel, changeAgent } = useAI(config)
  const blockedModels = useBlockedModels(modelOptions)
  const { flags, toggleFlag, setFlag } = useFeatureFlags()

  const {
    composer, setComposer,
    awaitingAssistantReply,
    runtimeError, setRuntimeError,
    renderedMessages, messageScrollSignature, assistantResponseSignature,
    toolMessage, completionShouldPlayRef,
    clearSession, loadSelected, send, abortSession,
    setMessages
  } = useMessages(config)

  const {
    todos, diffFiles, projectDashboard, dashboardError,
    todosExpanded, setTodosExpanded,
    activeDetailSheet, setActiveDetailSheet,
    totalDiffAdditions, totalDiffDeletions,
    loadTodos, loadDiffs, loadDashboard, clearSidecar
  } = useSessionSidecar(config)

  const loadSessionRef = useRef(0)

  const onLoadSelected = useCallback(async (id: string, dir: string) => {
    const reqId = ++loadSessionRef.current
    clearSession()
    clearSidecar()
    await Promise.all([
      loadSelected(id, dir),
      loadAgents(dir).catch(() => undefined),
      loadModels(dir).catch(() => undefined)
    ])
    if (reqId !== loadSessionRef.current) return
    loadTodos(id, dir)
  }, [loadSelected, loadAgents, loadModels, loadTodos, clearSession, clearSidecar])

  const {
    sessions, selectedID, loadingSessionID, refreshingSessions, creatingSession,
    selectedSession, sessionToDelete, renamingSessionID, renameValue, setRenameValue,
    openSession, refreshSessions, refreshSessionsWithIndicator, createSession,
    deleteSession, renameSession, startRename, cancelRename,
    setSessionToDelete, setSessions, favorites, toggleFavorite
  } = useSessions(config, onLoadSelected, backgroundFailureCountRef, initialSessionLoadRef, setConnectionState, setConnectionMessage)

  const {
    showNewSessionPicker, pickerPath,
    pickerItems, pickerLoading, pickerError,
    browseNewSessionDirectory, openNewSessionPicker,
    setShowNewSessionPicker, persistDirectory
  } = useFolderPicker(config)

  const { stats, recordPrompt, recordSessionCreated, resetStats } = useStats()
  const { providers: providerList, connecting: connectingProvider, error: providerError, connectProvider, disconnectProvider } = useProviderManager(modelOptions, config)
  useAutoSummarize(
    config,
    selectedSession?.id ?? null,
    selectedSession?.directory ?? "",
    flags.autoSummarize,
    flags.autoSummarizeThreshold,
    assistantResponseSignature,
    loadSelected ? (() => loadSelected(selectedSession!.id, selectedSession!.directory)) : undefined,
    activeModel?.providerID,
    activeModel?.modelID
  )
  const [readingMode, setReadingMode] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [tokenStatsOpen, setTokenStatsOpen] = useState(false)
  const [navBarMode, setNavBarMode] = useState<"header" | "bottom">(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NAVBAR)
    return saved === "header" || saved === "bottom" ? saved : "bottom"
  })

  // ===== Feature: MCP Browser =====
  const [showMCPBrowser, setShowMCPBrowser] = useState(false)

  // ===== Feature: Archived View =====
  const [showArchivedView, setShowArchivedView] = useState(false)

  // ===== Feature: File Editor =====
  const [fileEditorPath, setFileEditorPath] = useState<string | null>(null)

  // ===== Feature: Terminal =====
  const { lines: shellLines, running: shellRunning, execute: shellExecute, clear: shellClear, history: shellHistory } = useShell(config)
  const [showTerminal, setShowTerminal] = useState(false)

  // ===== Feature: Shortcuts =====
  const [showShortcuts, setShowShortcuts] = useState(false)

  // ===== Feature: Theme Creator =====
  const [showThemeCreator, setShowThemeCreator] = useState(false)

  // ===== Feature: Favorites Manager =====
  const [showFavoritesManager, setShowFavoritesManager] = useState(false)

  // ===== Feature: Offline Queue =====
  const { enqueue: queueAction, dequeueAll } = useOfflineQueue()

  // ===== Feature: Notifications =====
  const [notifFlags] = useState<NotificationFlags>(() => loadNotificationFlags())
  const { notify } = useNotifications()

  // ===== Feature: Deep Link =====
  useDeepLink((partial) => {
    setDraftConfig((prev) => ({ ...prev, ...partial }))
  })

  // Replay offline queue when connected
  useEffect(() => {
    if (connectionState !== "connected" || !config || !selectedSession) return
    dequeueAll().then((actions) => {
      for (const a of actions) {
        if (a.type === "prompt") {
          api.sendPrompt(config, a.sessionID, a.payload, a.directory).catch(() => {})
        } else if (a.type === "command") {
          api.sendCommand(config, a.sessionID, a.payload, "", a.directory).catch(() => {})
        } else if (a.type === "shell") {
          api.sendShell(config, a.sessionID, a.payload, a.directory).catch(() => {})
        }
      }
    })
  }, [connectionState, config, selectedSession, dequeueAll])

  // Notify on completion
  useEffect(() => {
    if (!notifFlags.onCompletion || !awaitingAssistantReply) return
    const prev = assistantResponseSignature
    if (prev) {
      notify(t('notification.completionTitle'), t('notification.completionBody'))
    }
  }, [assistantResponseSignature])

  // ===== SSE Streaming =====
  const [streamState, setStreamState] = useState<StreamState>("polling")

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    const { type } = event
    if (type === "server.connected" || type === "server.heartbeat") return
    if (type === "message.updated" || type === "message.part.updated" || type === "message.part.delta") {
      const eventSessionID = (event.properties as { sessionID?: string }).sessionID
      if (eventSessionID && eventSessionID === selectedSession?.id) {
        loadSelected(eventSessionID, selectedSession.directory)
      }
    }
  }, [selectedSession?.id, selectedSession?.directory, loadSelected])

  const { streamState: sseState } = useSSE(
    (dataMode === "full" && flags.streamingFull) ? config : null,
    handleSSEEvent
  )

  useEffect(() => {
    setStreamState(sseState)
  }, [sseState])

  // ===== Offline cache =====
  const { cacheSessions, getCachedSessions, cacheMessages } = useOfflineCache(flags)

  useEffect(() => {
    if (flags.offlineCache && sessions.length > 0) {
      cacheSessions(sessions as any)
    }
  }, [sessions, flags.offlineCache, cacheSessions])

  useEffect(() => {
    if (flags.offlineCache && selectedSession && renderedMessages.length > 0) {
      const msgs = renderedMessages.map((rm) => ({
        info: rm.info,
        parts: rm.parts,
      }))
      cacheMessages(selectedSession.id, msgs as any).catch(() => {})
    }
  }, [selectedSession?.id, renderedMessages.length, flags.offlineCache, cacheMessages])

  // ===== Questions =====
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([])
  const [dismissedQuestions, setDismissedQuestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!config || !flags.questionAuto) return
    const poll = async () => {
      try {
        const qs = await api.listPendingQuestions(config, selectedSession?.directory)
        setPendingQuestions(qs.filter((q) => !dismissedQuestions.has(q.id)))
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, QUESTION_POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [config, flags.questionAuto, selectedSession?.directory, dismissedQuestions])

  const handleQuestionReply = useCallback(async (requestID: string, answers: string[][]) => {
    if (!config) return
    try {
      await api.questionReply(config, requestID, answers, selectedSession?.directory)
      setDismissedQuestions((prev) => new Set(prev).add(requestID))
      setPendingQuestions((prev) => prev.filter((q) => q.id !== requestID))
    } catch { /* ignore */ }
  }, [config, selectedSession?.directory])

  const handleQuestionReject = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.questionReject(config, requestID, selectedSession?.directory)
      setDismissedQuestions((prev) => new Set(prev).add(requestID))
      setPendingQuestions((prev) => prev.filter((q) => q.id !== requestID))
    } catch { /* ignore */ }
  }, [config, selectedSession?.directory])

  const handleDismissQuestion = useCallback(() => {
    setPendingQuestions((prev) => prev.slice(1))
  }, [])

  // ===== Permissions =====
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null)

  useEffect(() => {
    if (!config || !flags.permissionUI) return
    const poll = async () => {
      try {
        const perms = await api.listPermissions(config, selectedSession?.directory)
        const pending = perms.find((p) => p.status === "pending")
        if (pending) setPermissionRequest(pending)
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, QUESTION_POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [config, flags.permissionUI, selectedSession?.directory])

  const handlePermissionApprove = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.permissionReply(config, requestID, true, selectedSession?.directory)
      setPermissionRequest(null)
    } catch { /* ignore */ }
  }, [config, selectedSession?.directory])

  const handlePermissionReject = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.permissionReply(config, requestID, false, selectedSession?.directory)
      setPermissionRequest(null)
    } catch { /* ignore */ }
  }, [config, selectedSession?.directory])

  const handleDismissPermission = useCallback(() => {
    setPermissionRequest(null)
  }, [])

  const isSessionRunning = Boolean(selectedSession && isSessionActive(selectedSession))
  const isWorking = awaitingAssistantReply || isSessionRunning
  const showTypingBubble = Boolean(selectedSession) && isWorking

  const handleExportChat = useCallback(() => {
    if (!selectedSession || renderedMessages.length === 0) return
    const header = `# ${selectedSession.title}\n\n`
    const body = renderedMessages.map((m) =>
      `## ${m.info.role === "user" ? "User" : "OpenCode"}\n${m.text}\n`
    ).join("\n")
    const full = header + body
    navigator.clipboard.writeText(full).then(() => {
      setRuntimeError(null)
    }).catch(() => {
      const ta = document.createElement("textarea")
      ta.value = full
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    })
  }, [selectedSession, renderedMessages])

  const handleSnapshot = useCallback(() => {
    if (!selectedSession) return
    const snapshot = {
      id: selectedSession.id,
      title: selectedSession.title,
      directory: selectedSession.directory,
      time: Date.now(),
      messages: renderedMessages.length
    }
    try {
      const key = `opencode.snapshot.${selectedSession.id}`
      localStorage.setItem(key, JSON.stringify(snapshot))
      setRuntimeError(null)
    } catch { /* silently fail */ }
  }, [selectedSession, renderedMessages])

  // Group sessions by directory for project-based navigation
  const groupedSessions = useMemo(() => {
    const map = new Map<string, SessionView[]>()
    for (const s of sessions) {
      const dir = s.directory || "/"
      const list = map.get(dir) || []
      list.push(s)
      map.set(dir, list)
    }
    return map
  }, [sessions])
  const projects = useMemo(() => [...groupedSessions.entries()].sort(([, aSessions], [, bSessions]) => {
    const aMax = Math.max(...aSessions.map((s) => s.updated || 0))
    const bMax = Math.max(...bSessions.map((s) => s.updated || 0))
    return bMax - aMax
  }), [groupedSessions])
  const [selectedProjectDir, setSelectedProjectDir] = useState<string | null>(null)
  const projectSessions = selectedProjectDir ? groupedSessions.get(selectedProjectDir) ?? [] : []

  const activeSessions = sessions.filter((s) => isSessionActive(s))
  const recentSessions = useMemo(() => [...sessions].sort((a, b) => (b.updated || 0) - (a.updated || 0)).slice(0, 5), [sessions])

  const filteredProjects = useMemo(() => {
    return filterByQuery(projects, query, ([dir, sessionsList]) => [dir, ...sessionsList.map((s) => s.title)])
  }, [projects, query])

  const filteredProjectSessions = useMemo(() => {
    return filterByQuery(projectSessions, query, (s) => [s.title, s.directory])
  }, [projectSessions, query])

  const projectPath = extractPath(projectDashboard)
  const projectName = extractName(projectDashboard)
  const vcsBranch = extractBranch(projectDashboard)

  const isStreaming = streamState === "streaming" && dataMode === "full" && flags.streamingFull
  const isStreamingActive = isStreaming && !!selectedSession

  const pollInterval = dataMode === "full" ? (isStreamingActive ? 5000 : 3500) : dataMode === "ultra" ? 30000 : dataMode === "miser" ? 60000 : 15000
  usePolling(async () => {
    await refreshSessions()
    if (!selectedSession) return
    if (dataMode === "full" || dataMode === "saver" || isSessionActive(selectedSession)) {
      await loadSelected(selectedSession.id, selectedSession.directory)
    }
  }, pollInterval, [config.host, config.port, config.username, config.password, dataMode, selectedSession?.id, selectedSession?.status, isStreamingActive], isStreamingActive)

  useCompletionAudio(awaitingAssistantReply, completionShouldPlayRef, dataMode, () => {
    if (selectedSession && dataMode !== "ultra" && dataMode !== "miser") {
      loadSelected(selectedSession.id, selectedSession.directory)
      refreshSessions(true)
    }
  })

  useEffect(() => {
    let cancelled = false
    if (!config.host || config.port <= 0) {
      setConnectionState("idle")
      setConnectionMessage("")
      return
    }
    setConnectionState("connecting")
    setConnectionMessage(t('connection.connecting'))
    backgroundFailureCountRef.current = 0
    initialSessionLoadRef.current = true

    const loadFromCache = async () => {
      if (flags.offlineCache) {
        const cached = await getCachedSessions()
        if (cached.length > 0 && sessions.length === 0) {
          setSessions(cached as any)
        }
      }
    }
    loadFromCache()

    refreshSessions(true).catch(() => undefined)
    loadAgents()
    loadModels()
    if (dataMode === "full") {
      api.listCommands(config).then((cmds) => { if (!cancelled) setCommands(cmds) }).catch(() => setCommands([]))
    }
    return () => { cancelled = true }
  }, [config.host, config.port, config.username, config.password, dataMode])

  useMemoryCleanup(selectedSession?.id ?? null, setMessages)

  useEffect(() => {
    if (!hasConfiguredServer) setView("settings")
  }, [hasConfiguredServer])

  useEffect(() => {
    if (activeDetailSheet !== "details" || !selectedSession) return
    loadDiffs(selectedSession.id, selectedSession.directory)
    loadDashboard(selectedSession.directory)
  }, [activeDetailSheet, selectedSession?.id, selectedSession?.directory])

  useBackButton({
    view, showNewSessionPicker, activeDetailSheet,
    onClosePicker: () => setShowNewSessionPicker(false),
    onCloseSheet: () => setActiveDetailSheet(null),
    onBackToSessions: () => setView("sessions")
  })

  useNetworkMode(changeDataMode)

  // Global ? key for shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setShowShortcuts(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const handleLanguageChange = useCallback((lang: LanguageCode) => {
    setLanguage(lang)
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang)
  }, [setLanguage])

  const handleSend = useCallback(async (images?: Array<{ base64: string; mime: string }>) => {
    if (!selectedSession) return
    if (connectionState === "offline") {
      queueAction({ type: "prompt", sessionID: selectedSession.id, directory: selectedSession.directory, payload: composer })
      setComposer("")
      setRuntimeError("Prompt queued - will send when connection is restored")
      return
    }
    recordPrompt(composer)
    setSessions((prev) => prev.map((s) => s.id === selectedSession.id ? { ...s, status: "busy" } : s))
    const result = await send(selectedSession, activeModel, activeAgentID, commands,
      () => refreshSessions(),
      () => loadSelected(selectedSession.id, selectedSession.directory).then(() => undefined),
      setCommands, setRuntimeError, images)
    if (result === "help") { setHelpPage("commands"); setView("help") }
  }, [selectedSession, activeModel, activeAgentID, commands, send, refreshSessions, loadSelected, setSessions, connectionState, composer, queueAction, setRuntimeError, setComposer])

  const handleAbort = useCallback(async () => {
    if (!selectedSession) return
    await abortSession(selectedSession.id, selectedSession.directory)
    if (selectedSession) {
      await loadSelected(selectedSession.id, selectedSession.directory)
      await refreshSessions()
    }
  }, [selectedSession, abortSession, loadSelected, refreshSessions])

  const handleCreateSession = useCallback(async (directory?: string) => {
    const created = await createSession(directory, activeModel)
    if (created) {
      recordSessionCreated()
      setShowNewSessionPicker(false)
      if (directory) persistDirectory(directory)
      setView("detail")
      await onLoadSelected(created.id, created.directory)
      await refreshSessions()
    }
  }, [createSession, activeModel, onLoadSelected, refreshSessions, persistDirectory])

  const handleOpenSession = useCallback((id: string, dir: string) => {
    setView("detail")
    openSession(id, dir).catch(() => undefined)
  }, [openSession])

  const handleTest = useCallback(() => testConnection(t), [testConnection, t])

  const handleNavigate = useCallback((target: ViewType) => {
    if (target === "sessions") setSelectedProjectDir(null)
    setView(target)
  }, [])

  return (
    <div className="app-shell" data-navbar="header">
      {view !== "detail" && (
        <NavBar variant="top" view={view} onNavigate={handleNavigate}
          hasConfiguredServer={hasConfiguredServer}
          hasSelectedSession={!!selectedSession} />
      )}

      {view === "settings" && (
        <SettingsPanel
          draftConfig={draftConfig} onChange={setDraftConfig}
          onSave={saveConfig} onTest={handleTest}
          testingConnection={testingConnection}
          hasDraftChanges={hasDraftChanges} canTestDraft={canTestDraft}
          testAlreadyPassedForDraft={testAlreadyPassedForDraft}
          connectedVersion={connectedVersion} settingsNotice={settingsNotice}
          language={language} onLanguageChange={handleLanguageChange}
          theme={theme} onThemeChange={setTheme}
          languageOptions={languageOptions}
          dataMode={dataMode} onDataModeChange={changeDataMode}
          onNavigate={handleNavigate}
          modelOptions={modelOptions} selectedModelKey={selectedModelKey}
          onChangeModel={changeModel} modelKey={modelKey}
          stats={stats} onResetStats={resetStats}
          navBarMode={navBarMode} onNavBarModeChange={(m) => { setNavBarMode(m); localStorage.setItem(STORAGE_KEYS.NAVBAR, m) }}
          blockedModels={blockedModels}
          onOpenThemePicker={() => setShowThemePicker(true)}
          flags={flags}
          onToggleFlag={toggleFlag}
          onSetFlag={setFlag}
          providers={providerList}
          connectingProvider={connectingProvider}
          providerError={providerError}
          onConnectProvider={(pid, key) => {
            if (!selectedSession) return
            connectProvider(pid, key, selectedSession.id, selectedSession.directory)
          }}
          onDisconnectProvider={disconnectProvider} />
      )}

      {view === "sessions" && (
        <>
          <SessionList
            projects={filteredProjects} projectSessions={filteredProjectSessions}
            selectedProjectDir={selectedProjectDir}
            sessions={sessions}
            selectedID={selectedID}
            refreshingSessions={refreshingSessions} creatingSession={creatingSession}
            renamingSessionID={renamingSessionID} renameValue={renameValue}
            connectionState={connectionState}
            query={query} activeSessions={activeSessions} recentSessions={recentSessions}
            runtimeError={runtimeError}
            favorites={favorites}
            dataMode={dataMode} onDataModeChange={changeDataMode}
            onSelectProject={setSelectedProjectDir}
            onQueryChange={setQuery}
            onRefresh={refreshSessionsWithIndicator}
            onNewSession={openNewSessionPicker}
            onOpen={handleOpenSession}
            onStartRename={startRename}
            onRenameChange={setRenameValue}
            onRenameConfirm={renameSession}
            onRenameCancel={cancelRename}
            onDelete={setSessionToDelete}
            onToggleFavorite={toggleFavorite}
            onArchive={flags.sessionArchive ? (id) => {
              const s = sessions.find(s => s.id === id)
              if (s) api.sendCommand(config, id, "/archive", "", s.directory).catch(() => {})
            } : undefined}
            onFork={(s) => handleCreateSession(s.directory)} />
          {showNewSessionPicker && (
            <FolderPicker
              pickerPath={pickerPath} pickerItems={pickerItems}
              pickerLoading={pickerLoading} pickerError={pickerError}
              creatingSession={creatingSession}
              onBrowse={browseNewSessionDirectory}
              onCreate={handleCreateSession}
              onCreateDefault={() => handleCreateSession("")}
              onClose={() => setShowNewSessionPicker(false)} />
          )}
        </>
      )}

      {view === "detail" && (
        <>
          <ChatView
            selectedSession={selectedSession}
            messages={renderedMessages} todos={todos}
            todosExpanded={todosExpanded} composer={composer}
            isWorking={isWorking} showTypingBubble={showTypingBubble}
            loadingSessionID={loadingSessionID} selectedID={selectedID}
            messageScrollSignature={messageScrollSignature} view={view}
            dataMode={dataMode} toolMessage={toolMessage}
            runtimeError={runtimeError}
            renamingSessionID={renamingSessionID} renameValue={renameValue}
            showModelChip={showModelChip}
            commands={commands}
            activeAgent={activeAgent} activeAgentID={activeAgentID}
            activeModelOption={activeModelOption}
            primaryAgentOptions={primaryAgentOptions}
            onChangeAgent={changeAgent}
            projectName={projectName}
            onStartRename={startRename}
            onRenameChange={setRenameValue}
            onRenameConfirm={renameSession}
            onRenameCancel={cancelRename}
            onComposerChange={setComposer}
            onSend={(imgs) => handleSend(imgs)}
            onAbort={handleAbort}
            onTodosToggle={() => setTodosExpanded((v) => !v)}
            onBackToSessions={() => setView("sessions")}
            onSheetOpen={setActiveDetailSheet}
            recentSessions={recentSessions} activeSessions={activeSessions}
            onOpenSession={handleOpenSession}
            readingMode={readingMode} onToggleReadingMode={() => setReadingMode((v) => !v)}
            onExportChat={handleExportChat} onSnapshot={handleSnapshot}
            onOpenSettings={() => setView("settings")}
            onThemeCommand={() => setShowThemePicker(true)}
            onToggleTokenStats={() => setTokenStatsOpen((v) => !v)}
            config={config}
            agents={agentOptions}
            onShellSend={(cmd) => {
              if (selectedSession) {
                if (connectionState === "offline") {
                  queueAction({ type: "shell", sessionID: selectedSession.id, directory: selectedSession.directory, payload: cmd })
                } else {
                  shellExecute(cmd, selectedSession.id, selectedSession.directory)
                }
              }
            }}
            flags={flags}
            onToggleFlag={toggleFlag}
            onSetFlag={setFlag}
            diffFiles={diffFiles}
            projectDashboard={projectDashboard}
            streamState={streamState}
            pendingQuestions={pendingQuestions}
            permissionRequest={permissionRequest}
            onQuestionReply={handleQuestionReply}
            onQuestionReject={handleQuestionReject}
            onPermissionApprove={handlePermissionApprove}
            onPermissionReject={handlePermissionReject}
            onDismissQuestion={handleDismissQuestion}
            onDismissPermission={handleDismissPermission}
            onForkSession={() => selectedSession && handleCreateSession(selectedSession.directory)}
            onOpenTerminal={() => setShowTerminal(true)}
            onOpenMCPBrowser={() => setShowMCPBrowser(true)}
            onOpenArchivedView={() => setShowArchivedView(true)}
            onOpenThemeCreator={() => setShowThemeCreator(true)}
            onOpenFavoritesManager={() => setShowFavoritesManager(true)}
            onOpenShortcuts={() => setShowShortcuts(true)} />
          <BottomSheet
            activeSheet={activeDetailSheet}
            onClose={() => setActiveDetailSheet(null)}
            agentOptions={agentOptions}
            agentLoadError={agentLoadError}
            activeAgentID={activeAgentID}
            activeAgent={activeAgent}
            modelOptions={modelOptions}
            modelLoadError={modelLoadError}
            activeModelOption={activeModelOption}
            filteredModelOptions={filteredModelOptions}
            recentModels={modelOptions.slice(0, 3)}
            modelQuery={modelQuery}
            isWorking={isWorking}
            onRefreshAI={() => { loadAgents(); loadModels() }}
            onChangeAgent={changeAgent}
            onChangeModel={changeModel}
            onModelQueryChange={setModelQuery}
            modelKey={modelKey}
            sameModel={sameModel}
            agentLabel={agentLabel}
            formatLimit={formatLimit}
            projectName={projectName}
            projectPath={projectPath}
            vcsBranch={vcsBranch}
            projectDashboard={projectDashboard}
            diffFiles={diffFiles}
            totalDiffAdditions={totalDiffAdditions}
            totalDiffDeletions={totalDiffDeletions}
            dashboardError={dashboardError} />
        </>
      )}

      {view === "help" && (
        <HelpPage
          helpPage={helpPage}
          onHelpPageChange={setHelpPage}
          commands={commands}
          commandFilter={commandFilter}
          onCommandFilterChange={setCommandFilter}
          runtimeError={runtimeError} />
      )}

      {sessionToDelete && (
        <ConfirmModal
          session={sessionToDelete}
          onConfirm={(id) => { deleteSession(id).catch(() => undefined) }}
          onCancel={() => setSessionToDelete(null)} />
      )}

      {showThemePicker && (
        <ThemePicker onClose={() => setShowThemePicker(false)} />
      )}

      {tokenStatsOpen && selectedSession?.tokens && (
        <div className="modal-overlay" onClick={() => setTokenStatsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Token Stats</h3>
              <button className="btn-icon btn-secondary compact" onClick={() => setTokenStatsOpen(false)}>
                <CloseIcon size={14} />
              </button>
            </div>
            <SessionTokenUsage tokens={selectedSession.tokens} cost={selectedSession.cost} />
          </div>
        </div>
      )}

      {showMCPBrowser && config && <MCPBrowser config={config} onClose={() => setShowMCPBrowser(false)} />}

      {showArchivedView && (
        <ArchivedList
          sessions={sessions.filter((s) => s.status === "archived")}
          onRestore={(id) => {
            const s = sessions.find((x) => x.id === id)
            if (s) api.sendCommand(config, id, "/unarchive", "", s.directory).catch(() => {})
            setShowArchivedView(false)
          }}
          onOpen={(id, dir) => { setShowArchivedView(false); handleOpenSession(id, dir) }}
          onClose={() => setShowArchivedView(false)}
        />
      )}

      {fileEditorPath && config && (
        <FileEditor
          config={config}
          path={fileEditorPath}
          directory={selectedSession?.directory}
          onClose={() => setFileEditorPath(null)}
        />
      )}

      {showTerminal && selectedSession && (
        <TerminalView
          lines={shellLines}
          running={shellRunning}
          sessionID={selectedSession.id}
          directory={selectedSession.directory}
          onExecute={shellExecute}
          onClear={shellClear}
          onClose={() => setShowTerminal(false)}
          history={shellHistory}
        />
      )}

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {showThemeCreator && <ThemeCreator onClose={() => setShowThemeCreator(false)} />}

      {showFavoritesManager && (
        <FavoritesManager
          favorites={sessions.filter((s) => favorites.has(s.id))}
          onReorder={(ids) => {
            try { localStorage.setItem("opencode.mobile.favoritesOrder", JSON.stringify(ids)) } catch {}
          }}
          onClose={() => setShowFavoritesManager(false)}
        />
      )}
    </div>
  )
}

export default function App() {
  const [language, setLanguage] = useState<LanguageCode>(() =>
    normalizeLanguage(localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'es')
  )
  return (
    <I18nProvider language={language}>
      <ThemeVariantProvider>
        <ErrorBoundary>
          <AppInner language={language} setLanguage={setLanguage} />
        </ErrorBoundary>
      </ThemeVariantProvider>
    </I18nProvider>
  )
}
