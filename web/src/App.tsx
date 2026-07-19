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
import { NavBar } from "./components/NavBar"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { SettingsPanel } from "./components/SettingsPanel"
import { SessionList } from "./components/SessionList"
import { ChatView } from "./components/ChatView"
import { BottomSheet } from "./components/BottomSheet"
import { HelpPage } from "./components/HelpPage"
import { ConfirmModal } from "./components/ConfirmModal"
import { FolderPicker } from "./components/FolderPicker"
import type { ViewType, HelpPage as HelpPageType, SessionView } from "./types"
import type { LanguageCode } from "./i18n"
import { formatLimit, extractPath, extractName, extractBranch, isSessionActive, filterByQuery } from "./utils"
import { STORAGE_KEYS } from "./constants"
import { useBackButton } from "./hooks/useBackButton"
import { useNetworkMode } from "./hooks/useNetworkMode"
import { useMemoryCleanup } from "./hooks/useMemoryCleanup"

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

  const {
    composer, setComposer,
    awaitingAssistantReply,
    runtimeError, setRuntimeError,
    renderedMessages, messageScrollSignature,
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
  const [readingMode, setReadingMode] = useState(false)
  const [navBarMode, setNavBarMode] = useState<"header" | "bottom">(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NAVBAR)
    return saved === "header" || saved === "bottom" ? saved : "bottom"
  })

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
      // fallback: create a temporary textarea
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
    } catch {
      // silently fail
    }
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

  const pollInterval = dataMode === "full" ? 3500 : dataMode === "ultra" ? 30000 : dataMode === "miser" ? 60000 : 15000
  usePolling(async () => {
    await refreshSessions()
    if (!selectedSession) return
    if (dataMode === "full" || dataMode === "saver" || isSessionActive(selectedSession)) {
      await loadSelected(selectedSession.id, selectedSession.directory)
    }
  }, pollInterval, [config.host, config.port, config.username, config.password, dataMode, selectedSession?.id, selectedSession?.status])

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

  const handleLanguageChange = useCallback((lang: LanguageCode) => {
    setLanguage(lang)
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang)
  }, [setLanguage])

  const handleSend = useCallback(async (images?: Array<{ base64: string; mime: string }>) => {
    if (!selectedSession) return
    recordPrompt(composer)
    setSessions((prev) => prev.map((s) => s.id === selectedSession.id ? { ...s, status: "busy" } : s))
    const result = await send(selectedSession, activeModel, activeAgentID, commands,
      () => refreshSessions(),
      () => loadSelected(selectedSession.id, selectedSession.directory).then(() => undefined),
      setCommands, setRuntimeError, images)
    if (result === "help") { setHelpPage("commands"); setView("help") }
  }, [selectedSession, activeModel, activeAgentID, commands, send, refreshSessions, loadSelected, setSessions])

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
      if (directory) {
        persistDirectory(directory)
      }
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
    <div className="app-shell" data-navbar={navBarMode}>
      {navBarMode === "header" && (
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
          navBarMode={navBarMode} onNavBarModeChange={(m) => { setNavBarMode(m); localStorage.setItem(STORAGE_KEYS.NAVBAR, m) }} />
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
            onToggleFavorite={toggleFavorite} />
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
            onExportChat={handleExportChat} onSnapshot={handleSnapshot} />
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

      {navBarMode === "bottom" && (
        <NavBar variant="bottom" view={view} onNavigate={handleNavigate}
          hasConfiguredServer={hasConfiguredServer}
          hasSelectedSession={!!selectedSession} />
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
      <ErrorBoundary>
        <AppInner language={language} setLanguage={setLanguage} />
      </ErrorBoundary>
    </I18nProvider>
  )
}
