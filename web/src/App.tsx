import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { api } from "./api"
import { I18nProvider, useT, normalizeLanguage } from "./i18n-context"
import { languageOptions } from "./i18n"
import { useConfig } from "./hooks/useConfig"
import { useTheme } from "./hooks/useTheme"
import { useSessions, modelKey, sameModel } from "./hooks/useSessions"
import { useAI, agentLabel } from "./hooks/useAI"
import { useMessages } from "./hooks/useMessages"
import { usePolling } from "./hooks/usePolling"
import { useCompletionAudio } from "./hooks/useCompletionAudio"
import { useFolderPicker } from "./hooks/useFolderPicker"
import { NavBar } from "./components/NavBar"
import { SettingsPanel } from "./components/SettingsPanel"
import { SessionList } from "./components/SessionList"
import { ChatView } from "./components/ChatView"
import { BottomSheet } from "./components/BottomSheet"
import { HelpPage } from "./components/HelpPage"
import { ConfirmModal } from "./components/ConfirmModal"
import { FolderPicker } from "./components/FolderPicker"
import type { ViewType, HelpPage as HelpPageType, ProjectDashboard, SessionView } from "./types"
import type { LanguageCode } from "./i18n"

const LANGUAGE_STORAGE_KEY = "opencode.remote.language"

function formatLimit(value?: number): string {
  if (!value) return "-"
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

function pickString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

function extractPath(dashboard: ProjectDashboard | null): string | null {
  const project = dashboard?.project
  if (!project) return null
  return pickString(project.path) ?? pickString(project.directory) ?? pickString(project.root) ?? null
}

function extractName(dashboard: ProjectDashboard | null): string | null {
  const project = dashboard?.project
  if (!project) return null
  const name = pickString(project.name)
  if (name) return name
  const path = extractPath(dashboard)
  return path ? path.split("/").filter(Boolean).pop() ?? path : null
}

function extractBranch(dashboard: ProjectDashboard | null): string | null {
  const vcs = dashboard?.vcs
  if (!vcs) return null
  return pickString(vcs.branch) ?? pickString(vcs.status) ?? null
}

function AppInner({ language, setLanguage }: { language: LanguageCode; setLanguage: (lang: LanguageCode) => void }) {
  const t = useT()

  const { config, draftConfig, setDraftConfig, connectedVersion, testingConnection,
    connectionState, connectionMessage, settingsNotice,
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
    showModelChip, loadAgents, loadModels, changeModel, changeAgent } = useAI(config)

  const {
    todos, diffFiles, projectDashboard, dashboardError, composer, setComposer,
    awaitingAssistantReply, setAwaitingAssistantReply,
    runtimeError, setRuntimeError, todosExpanded, setTodosExpanded,
    activeDetailSheet, setActiveDetailSheet,
    renderedMessages, messageScrollSignature, assistantResponseSignature,
    totalDiffAdditions, totalDiffDeletions,
    awaitingAssistantBaselineRef, completionShouldPlayRef,
    loadSelected, send, abortSession
  } = useMessages(config)

  const loadSessionRef = useRef(0)

  const onLoadSelected = useCallback(async (id: string, dir: string) => {
    const reqId = ++loadSessionRef.current
    await loadSelected(id, dir)
    if (reqId !== loadSessionRef.current) return
    await Promise.all([loadAgents(dir), loadModels(dir)])
  }, [loadSelected, loadAgents, loadModels])

  const {
    sessions, selectedID, loadingSessionID, refreshingSessions, creatingSession,
    selectedSession, sessionToDelete, renamingSessionID, renameValue, setRenameValue,
    openSession, refreshSessions, refreshSessionsWithIndicator, createSession,
    deleteSession, renameSession, startRename, cancelRename,
    setSessionToDelete
  } = useSessions(config, onLoadSelected, backgroundFailureCountRef, initialSessionLoadRef)

  const {
    showNewSessionPicker, pickerPath,
    pickerItems, pickerLoading, pickerError,
    browseNewSessionDirectory, openNewSessionPicker,
    setShowNewSessionPicker
  } = useFolderPicker(config)

  const isSessionRunning = Boolean(selectedSession && ["busy", "retry"].includes(selectedSession.status))
  const isWorking = awaitingAssistantReply || isSessionRunning
  const showTypingBubble = Boolean(selectedSession) && isWorking

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

  const activeSessions = sessions.filter((s) => ["busy", "retry"].includes(s.status))
  const recentSessions = useMemo(() => [...sessions].sort((a, b) => (b.updated || 0) - (a.updated || 0)).slice(0, 5), [sessions])

  const filteredProjects = useMemo(() => {
    if (!query.trim()) return projects
    const q = query.toLowerCase()
    return projects.filter(([dir, sessionsList]) =>
      dir.toLowerCase().includes(q) || sessionsList.some((s) => s.title.toLowerCase().includes(q))
    )
  }, [projects, query])

  const filteredProjectSessions = useMemo(() => {
    if (!query.trim()) return projectSessions
    const q = query.toLowerCase()
    return projectSessions.filter((s) => s.title.toLowerCase().includes(q) || s.directory.toLowerCase().includes(q))
  }, [projectSessions, query])
  const connectionStatusText = connectionMessage || (
    connectionState === "connecting" ? t('connection.connecting') :
    connectionState === "reconnecting" ? t('connection.reconnecting') :
    connectionState === "connected" ? t('connection.connected') :
    connectionState === "offline" ? t('connection.offline') : ""
  )

  const projectPath = extractPath(projectDashboard)
  const projectName = extractName(projectDashboard)
  const vcsBranch = extractBranch(projectDashboard)

  const pollInterval = dataMode === "full" ? 3500 : dataMode === "ultra" ? 30000 : 15000
  usePolling(async () => {
    await refreshSessions(dataMode !== "full")
    if (selectedSession && (dataMode === "ultra" || selectedSession.status === "busy" || selectedSession.status === "retry")) {
      await loadSelected(selectedSession.id, selectedSession.directory)
    }
  }, pollInterval, [config.host, config.port, config.username, config.password, dataMode, selectedSession?.id, selectedSession?.status])

  useCompletionAudio(awaitingAssistantReply, completionShouldPlayRef, dataMode, () => {
    if (selectedSession && dataMode !== "ultra") {
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

  useEffect(() => {
    if (!hasConfiguredServer) setView("settings")
  }, [hasConfiguredServer])

  useEffect(() => {
    if (!awaitingAssistantReply) return
    if (assistantResponseSignature && assistantResponseSignature !== awaitingAssistantBaselineRef.current) {
      setAwaitingAssistantReply(false)
    }
  }, [assistantResponseSignature, awaitingAssistantReply])

  const handleLanguageChange = useCallback((lang: LanguageCode) => {
    setLanguage(lang)
  }, [setLanguage])

  const handleSend = useCallback(async () => {
    if (!selectedSession) return
    const result = await send(selectedSession, activeModel, activeAgentID, commands,
      () => refreshSessions(),
      () => loadSelected(selectedSession.id, selectedSession.directory).then(() => undefined),
      setCommands, setRuntimeError)
    if (result === "help") { setHelpPage("commands"); setView("help") }
  }, [selectedSession, activeModel, activeAgentID, commands, send, refreshSessions, loadSelected])

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
      setShowNewSessionPicker(false)
      setView("detail")
      await onLoadSelected(created.id, created.directory)
      await refreshSessions()
    }
  }, [createSession, activeModel, onLoadSelected, refreshSessions])

  const handleOpenSession = useCallback(async (id: string, dir: string) => {
    await openSession(id, dir)
    setView("detail")
  }, [openSession])

  const handleBackFromDetail = useCallback(() => {
    setView("sessions")
  }, [])

  const handleTest = useCallback(() => testConnection(t), [testConnection, t])
  const handleCloseSheet = useCallback(() => setActiveDetailSheet(null), [])

  const handleNavigate = useCallback((target: ViewType) => {
    if (target === "sessions") setSelectedProjectDir(null)
    setView(target)
  }, [])

  return (
    <div className="app-shell">
      <NavBar variant="top" view={view} onNavigate={handleNavigate}
        hasConfiguredServer={hasConfiguredServer}
        hasSelectedSession={!!selectedSession}
        hostLabel={hasConfiguredServer ? `${config.host}:${config.port}` : t('settings.title')} />

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
          onNavigate={handleNavigate} />
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
            connectionState={connectionState} connectionStatusText={connectionStatusText}
            query={query} activeSessions={activeSessions} recentSessions={recentSessions}
            runtimeError={runtimeError}
            onSelectProject={setSelectedProjectDir}
            onQueryChange={setQuery}
            onRefresh={refreshSessionsWithIndicator}
            onNewSession={openNewSessionPicker}
            onOpen={handleOpenSession}
            onStartRename={startRename}
            onRenameChange={setRenameValue}
            onRenameConfirm={renameSession}
            onRenameCancel={cancelRename}
            onDelete={setSessionToDelete} />
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
            onSend={handleSend}
            onAbort={handleAbort}
            onTodosToggle={() => setTodosExpanded((v) => !v)}
            onBackToSessions={handleBackFromDetail}
            onSheetOpen={setActiveDetailSheet}
            recentSessions={recentSessions} activeSessions={activeSessions}
            onOpenSession={handleOpenSession} />
          <BottomSheet
            activeSheet={activeDetailSheet}
            onClose={handleCloseSheet}
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
          onConfirm={deleteSession}
          onCancel={() => setSessionToDelete(null)} />
      )}

      <NavBar variant="bottom" view={view} onNavigate={handleNavigate}
        hasConfiguredServer={hasConfiguredServer}
        hasSelectedSession={!!selectedSession} />
    </div>
  )
}

export default function App() {
  const [language, setLanguage] = useState<LanguageCode>(() =>
    normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'es')
  )
  return (
    <I18nProvider language={language}>
      <AppInner language={language} setLanguage={setLanguage} />
    </I18nProvider>
  )
}
