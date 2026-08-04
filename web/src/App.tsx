import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { api } from "./api"
import { I18nProvider, useT, normalizeLanguage } from "./i18n-context"
import { languageOptions } from "./i18n"
import { useConfig } from "./hooks/useConfig"
import { useTheme } from "./hooks/useTheme"
import { useSessions } from "./hooks/useSessions"
import { modelKey } from "./utils/model-utils"
import { useAI } from "./hooks/useAI"
import { useMessages } from "./hooks/useMessages"
import { useSessionSidecar } from "./hooks/useSessionSidecar"
import { usePolling } from "./hooks/usePolling"
import { useCompletionAudio } from "./hooks/useCompletionAudio"
import { useFolderPicker } from "./hooks/useFolderPicker"
import { useStats } from "./hooks/useStats"
import { StatsView } from "./components/StatsView"
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
import { ErrorModal } from "./components/ErrorModal"
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
import { ThemeVariantProvider } from "./context/themeVariant"
import { ThemePicker } from "./components/ThemePicker"
import { SessionTokenUsage } from "./components/SessionTokenUsage"
import { MCPBrowser } from "./components/MCPBrowser"
import { ArchivedList } from "./components/ArchivedList"
import { ShortcutsModal } from "./components/ShortcutsModal"
import { FileEditor } from "./components/FileEditor"
import { TerminalView } from "./components/TerminalView"
import { ThemeCreator } from "./components/ThemeCreator"
import { ChatCustomizer } from "./components/ChatCustomizer"
import { FavoritesManager } from "./components/FavoritesManager"
import { useShell } from "./hooks/useShell"
import { useChatSettings } from "./hooks/useChatSettings"
import { useFileBrowser } from "./hooks/useFileBrowser"
import { FileBrowser } from "./components/FileBrowser"
import { useOfflineQueue } from "./hooks/useOfflineQueue"
import { useNotifications } from "./hooks/useNotifications"
import { useDeepLink } from "./hooks/useDeepLink"
import { CloseIcon } from "./Icons"
import { RemoteConnect } from "./components/RemoteConnect"
import { useRemoteTunnel } from "./tunnel/useRemoteTunnel"

function AppInner({ language, setLanguage }: { language: LanguageCode; setLanguage: (lang: LanguageCode) => void }) {
  const t = useT()

  const { config, draftConfig, setDraftConfig, connectedVersion, testingConnection,
    connectionState, settingsNotice,
    hasConfiguredServer, hasDraftChanges, canTestDraft, testAlreadyPassedForDraft,
    dataMode, changeDataMode,
    saveConfig, testConnection, setConnectionState, setConnectionMessage } = useConfig()

  const { theme, setTheme } = useTheme()
  const handleToggleLightMode = useCallback(() => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light"
    setTheme(isLight ? "dark" : "light")
  }, [setTheme])
  const [localRevertID, setLocalRevertID] = useState<string | null>(null)

  const [view, setView] = useState<ViewType>(() => config.host && config.port > 0 ? "sessions" : "settings")
  const navStackRef = useRef<ViewType[]>(["sessions"])

  const navigate = useCallback((target: ViewType) => {
    if (target === view) return
    navStackRef.current = [...navStackRef.current, view]
    setView(target)
  }, [view])

  const goBack = useCallback(() => {
    if (navStackRef.current.length === 0) return
    const last = navStackRef.current[navStackRef.current.length - 1]
    navStackRef.current = navStackRef.current.slice(0, -1)
    setView(last)
  }, [])

  const [commands, setCommands] = useState<{ name: string; description?: string; source?: "command" | "mcp" | "skill" }[]>([])
  const [commandFilter, setCommandFilter] = useState<"all" | "skill">("all")
  const [helpPage, setHelpPage] = useState<HelpPageType>("overview")
  const [query, setQuery] = useState("")

  const backgroundFailureCountRef = useRef(0)
  const initialSessionLoadRef = useRef(true)

  const { agentOptions, modelOptions, modelLoadError,
    modelQuery, setModelQuery, primaryAgentOptions,
    activeAgent, activeAgentID, activeModelOption, activeModel,
    variantGroups, selectedModelKey, selectedVariant, showModelChip, loadAgents, loadModels, changeModel, changeVariant, changeAgent } = useAI(config)
  const blockedModels = useBlockedModels(modelOptions)
  const { flags, toggleFlag, setFlag } = useFeatureFlags()

  const filteredVariantGroups = useMemo(() => {
    const bs = blockedModels.blocked
    return {
      recentModels: variantGroups.recentModels.filter((m) => !bs.has(modelKey(m))),
      groups: new Map(Array.from(variantGroups.groups.entries()).filter(([k]) => !bs.has(k)))
    }
  }, [variantGroups, blockedModels.blocked])

  const {
    composer, setComposer,
    awaitingAssistantReply, setAwaitingAssistantReply,
    runtimeError, setRuntimeError,
    queuedPrompts, setQueuedPrompts, queuePrompt, removeQueued,
    renderedMessages, messageScrollSignature,
    toolMessage, completionShouldPlayRef,
    clearSession, loadSelected, send, abortSession,
    setMessages, undoMessage, redoMessage, compactSession,
    applyDelta, applyPart, compacting, messages
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

  // Auto-refresh models when AI sheet opens
  useEffect(() => {
    if (activeDetailSheet === "ai") {
      loadModels()
    }
  }, [activeDetailSheet, loadModels])

  const {
    sessions, selectedID, loadingSessionID, refreshingSessions, creatingSession,
    selectedSession, sessionToDelete, renamingSessionID, renameValue, setRenameValue,
    openSession, refreshSessions, refreshSessionsWithIndicator, createSession,
    deleteSession, renameSession, startRename, cancelRename,
    setSessionToDelete, setSessions, favorites, toggleFavorite
  } = useSessions(config, onLoadSelected, backgroundFailureCountRef, initialSessionLoadRef, setConnectionState, setConnectionMessage)

  useEffect(() => {
    setLocalRevertID(null)
  }, [selectedSession?.id])

  const {
    showNewSessionPicker, pickerPath,
    pickerItems, pickerLoading, pickerError,
    browseNewSessionDirectory, openNewSessionPicker,
    setShowNewSessionPicker, persistDirectory
  } = useFolderPicker(config)

  const fb = useFileBrowser(config, selectedSession?.directory)

  const { stats, recordPrompt, recordSessionCreated, resetStats } = useStats()
  const { providers: providerList, connecting: connectingProvider, error: providerError, connectProvider, disconnectProvider } = useProviderManager(modelOptions, config)
  const [readingMode, setReadingMode] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [tokenStatsOpen, setTokenStatsOpen] = useState(false)
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
  const [showChatCustomizer, setShowChatCustomizer] = useState(false)
  const { settings: chatSettings, setSetting: setChatSetting, resetDefaults: resetChatSettings } = useChatSettings()

  // ===== Feature: Theme Creator =====
  const [showThemeCreator, setShowThemeCreator] = useState(false)

  // ===== Feature: Favorites Manager =====
  const [showFavoritesManager, setShowFavoritesManager] = useState(false)

  // ===== Feature: Remote Tunnel =====
  const { tunnelConfig, status: tunnelStatus, error: tunnelError, connect, disconnect } = useRemoteTunnel()
  const [showRemoteConnect, setShowRemoteConnect] = useState(false)

  // ===== Feature: Offline Queue =====
  const { enqueue: queueAction, dequeueAll } = useOfflineQueue()

  // ===== Feature: Notifications =====
  const { notify, flags: notifFlags } = useNotifications()

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

  // Notify on completion (transición awaiting → false, no en el primer delta)
  const wasAwaitingRef = useRef(false)
  const awaitingReplyRef = useRef(false)
  useEffect(() => {
    awaitingReplyRef.current = awaitingAssistantReply
  }, [awaitingAssistantReply])
  useEffect(() => {
    if (awaitingAssistantReply) {
      wasAwaitingRef.current = true
      return
    }
    if (wasAwaitingRef.current) {
      wasAwaitingRef.current = false
      if (notifFlags.onCompletion) {
        notify(t('notification.completionTitle'), t('notification.completionBody'))
      }
    }
  }, [awaitingAssistantReply, notifFlags.onCompletion, notify, t])

  // ===== SSE Streaming =====

  // Ahorro de datos (modos no-full): si session.time.updated no cambió desde el
  // último fetch, el contenido no cambió (verificado: updated solo avanza al
  // completar turnos) → saltear el fetch de mensajes.
  const lastMsgFetchUpdatedRef = useRef<Record<string, number>>({})

  const settleSession = useCallback(async (sessionID: string, dir: string) => {
    if (dataMode === "full") {
      await refreshSessions(true)
    } else {
      await refreshSessions()
      api.listStatuses(config, dir).then((statuses) => {
        const st = statuses?.[sessionID]
        setSessions((prev) => prev.map((s) => s.id === sessionID ? { ...s, status: st?.type ?? "idle" } : s))
      }).catch(() => undefined)
      const upd = selectedSession?.updated ?? 0
      if (upd > 0) lastMsgFetchUpdatedRef.current[sessionID] = upd
    }
  }, [dataMode, refreshSessions, config, setSessions, selectedSession?.updated])
  const [streamState, setStreamState] = useState<StreamState>("polling")
  const partTypeCacheRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    partTypeCacheRef.current.clear()
  }, [selectedSession?.id])

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    const p = event.properties as Record<string, unknown>
    const type = event.type
    if (type === "server.connected" || type === "server.heartbeat") return

    if (type === "message.part.updated") {
      const part = p.part as { id?: string; type?: string } | undefined
      if (part?.id && part.type) partTypeCacheRef.current.set(part.id, part.type)
      const sessionID = p.sessionID as string | undefined
      const messageID = p.messageID as string | undefined
      if (sessionID && messageID && part?.id && sessionID === selectedSession?.id) {
        const fullPart = p.part as { id?: string; type?: string; text?: string; tool?: string; callID?: string; state?: unknown } | undefined
        applyPart(sessionID, messageID, {
          id: fullPart?.id ?? "",
          type: fullPart?.type,
          text: fullPart?.text,
          tool: fullPart?.tool,
          callID: fullPart?.callID,
          state: fullPart?.state,
        })
      }
      return
    }

    if (type === "message.part.delta") {
      const sessionID = p.sessionID as string | undefined
      const messageID = p.messageID as string | undefined
      const partID = p.partID as string | undefined
      const hasDelta = typeof p.delta === "string"
      const text = (hasDelta ? p.delta : p.text ?? "") as string
      const cachedType = partID ? partTypeCacheRef.current.get(partID) : undefined
      const partType = cachedType ?? (p.type ?? p.partType ?? "text") as string
      if (sessionID && messageID && partID && text && sessionID === selectedSession?.id) {
        applyDelta(sessionID, messageID, partID, text, !hasDelta, partType)
      }
      return
    }

    if (type === "session.next.text.delta" || type === "session.next.reasoning.delta" ||
        type === "session.next.text.ended" || type === "session.next.reasoning.ended" ||
        type === "session.next.tool.input.delta") {
      const sessionID = p.sessionID as string | undefined
      if (!sessionID || sessionID !== selectedSession?.id) return
      const assistantMessageID = p.assistantMessageID as string | undefined
      const partID = (p.textID ?? p.reasoningID ?? p.callID) as string | undefined
      const partType = type.startsWith("session.next.reasoning") ? "reasoning"
        : type === "session.next.tool.input.delta" ? "tool"
        : "text"
      const hasDelta = typeof p.delta === "string"
      const text = (hasDelta ? p.delta : p.text ?? "") as string
      if (assistantMessageID && partID && text) {
        applyDelta(sessionID, assistantMessageID, partID, text, !hasDelta, partType)
      }
      return
    }

    if (type === "session.next.compaction.delta" || type === "session.next.compaction.ended") {
      const sessionID = p.sessionID as string | undefined
      const messageID = p.messageID as string | undefined
      if (sessionID && messageID && sessionID === selectedSession?.id) {
        if (type === "session.next.compaction.delta") {
          const text = p.text as string | undefined
          if (text) applyDelta(sessionID, messageID, messageID, text, true, "compaction")
        } else {
          loadSelected(sessionID, selectedSession.directory)
        }
      }
      return
    }

    if (type === "session.next.step.failed" || type === "session.next.retried") {
      setAwaitingAssistantReply(false)
      return
    }

    if (type === "message.updated" || type === "message.part.updated") {
      if (type === "message.updated") {
        const sessionID = p.sessionID as string | undefined
        if (sessionID && sessionID === selectedSession?.id) {
          const rawMsg = p.message as { info?: { time?: { completed?: number } } } | undefined
          if (rawMsg?.info?.time?.completed && awaitingReplyRef.current) {
            setAwaitingAssistantReply(false)
            settleSession(sessionID, selectedSession.directory)
          }
        }
      }
      return
    }

    if (type === "session.status") {
      const sessionID = p.sessionID as string | undefined
      const rawStatus = p.status as unknown
      const statusType = typeof rawStatus === "string"
        ? rawStatus
        : (rawStatus as { type?: string } | undefined)?.type
      if (sessionID && sessionID === selectedSession?.id && statusType === "idle") {
        setAwaitingAssistantReply(false)
        loadSelected(sessionID, selectedSession.directory)
        settleSession(sessionID, selectedSession.directory)
      }
      return
    }

    if (type === "session.idle") {
      const sessionID = p.sessionID as string | undefined
      if (sessionID && sessionID === selectedSession?.id) {
        setAwaitingAssistantReply(false)
        loadSelected(sessionID, selectedSession.directory)
        settleSession(sessionID, selectedSession.directory)
      }
      return
    }

    if (type === "session.error") {
      const msg = (p.message ?? p.text ?? "") as string
      if (msg) setRuntimeError(msg)
      setAwaitingAssistantReply(false)
    }
  }, [selectedSession?.id, selectedSession?.directory, loadSelected, applyDelta, applyPart, setAwaitingAssistantReply, setRuntimeError, refreshSessions, settleSession])

  const stopGenerationRef = useRef(false)

  const { streamState: sseState } = useSSE(
    (dataMode === "full" && flags.streamingFull) ? config : null,
    useCallback((event: SSEEvent) => {
      if (stopGenerationRef.current) {
        if (event.type === "message.part.delta" || event.type === "message.updated" || event.type === "message.part.updated"
          || event.type === "session.next.text.delta" || event.type === "session.next.reasoning.delta"
          || event.type === "session.next.tool.input.delta") return
      }
      handleSSEEvent(event)
    }, [handleSSEEvent])
  )

  useEffect(() => {
    setStreamState(sseState)
  }, [sseState])

  // ===== Offline cache =====
  const { cacheSessions, getCachedSessions, cacheMessages, getCachedMessages } = useOfflineCache(flags)

  useEffect(() => {
    if (sessions.length > 0) {
      cacheSessions(sessions as unknown as import("./types").Session[])
    }
  }, [sessions, cacheSessions])

  // Caché con debounce: escribe solo cuando el estado real cambió (evita
  // re-encriptar todo el historial en cada delta/merge).
  const cacheTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cacheSignatureRef = useRef("")

  useEffect(() => {
    if (!flags.offlineCache || !selectedSession || messages.length === 0) return
    const last = messages[messages.length - 1]
    const signature = `${selectedSession.id}|${messages.length}|${last?.info.id ?? ""}|${last?.info.time.completed ?? ""}`
    if (signature === cacheSignatureRef.current) return
    cacheSignatureRef.current = signature
    const sessionID = selectedSession.id
    const snapshot = messages
    if (cacheTimerRef.current) clearTimeout(cacheTimerRef.current)
    cacheTimerRef.current = setTimeout(() => {
      cacheMessages(sessionID, snapshot).catch(() => {})
    }, 2500)
  }, [selectedSession?.id, messages, flags.offlineCache, cacheMessages])

  useEffect(() => () => {
    if (cacheTimerRef.current) clearTimeout(cacheTimerRef.current)
  }, [])

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

  const [dismissedRecentIds, setDismissedRecentIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECENT_DISMISS)
      const arr: string[] = raw ? JSON.parse(raw) : []
      return new Set(arr)
    } catch { return new Set() }
  })
  const dismissRecent = useCallback((id: string) => {
    setDismissedRecentIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      try { localStorage.setItem(STORAGE_KEYS.RECENT_DISMISS, JSON.stringify([...next])) } catch {}
      return next
    })
  }, [])

  const recentSessions = useMemo(
    () => [...sessions].sort((a, b) => (b.updated || 0) - (a.updated || 0)).filter((s) => !dismissedRecentIds.has(s.id)).slice(0, 5),
    [sessions, dismissedRecentIds]
  )

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

  const connectionStateRef = useRef(connectionState)
  useEffect(() => {
    connectionStateRef.current = connectionState
  }, [connectionState])

  const pollInterval = dataMode === "full" ? (isStreamingActive ? 5000 : 3500) : dataMode === "ultra" ? 30000 : dataMode === "miser" ? 60000 : 15000

  usePolling(async () => {
    await refreshSessions()
    if (connectionStateRef.current === "offline") {
      throw new Error("offline")
    }
    if (!selectedSession) return
    if (dataMode === "full" || dataMode === "saver" || isSessionActive(selectedSession)) {
      const prevUpdated = lastMsgFetchUpdatedRef.current[selectedSession.id]
      const skip = dataMode !== "full" && prevUpdated !== undefined && selectedSession.updated <= prevUpdated
      if (!skip) {
        await loadSelected(selectedSession.id, selectedSession.directory)
        lastMsgFetchUpdatedRef.current[selectedSession.id] = selectedSession.updated
      }
    }
    if (selectedSession && !isSessionActive(selectedSession) && awaitingAssistantReply) {
      setAwaitingAssistantReply(false)
    }
    if (selectedSession && isSessionActive(selectedSession) && !awaitingAssistantReply) {
      const st = await api.listStatuses(config, selectedSession.directory).catch(() => undefined)
      const real = st?.[selectedSession.id]
      if (real && real.type !== "busy" && real.type !== "retry") {
        setSessions((prev) => prev.map((s) => s.id === selectedSession.id ? { ...s, status: "idle" } : s))
      }
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
      if (sessions.length > 0) return
      const cached = await getCachedSessions()
      if (cached.length > 0) {
        setSessions(() => cached as any)
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

  // Auto-drain queue when assistant finishes replying
  const prevAwaitingRef = useRef(awaitingAssistantReply)
  useEffect(() => {
    if (!flags.promptQueue || flags.promptQueueMode !== "auto") {
      prevAwaitingRef.current = awaitingAssistantReply
      return
    }
    if (!awaitingAssistantReply && prevAwaitingRef.current && queuedPrompts.length > 0 && selectedSession) {
      const next = queuedPrompts[0]
      setQueuedPrompts((prev) => prev.slice(1))
      recordPrompt(next.text)
      send(selectedSession, activeModel, activeAgentID, commands,
        () => refreshSessions(),
        () => loadSelected(selectedSession.id, selectedSession.directory).then(() => undefined),
        setCommands, setRuntimeError, next.images, next.text).catch(() => {})
    }
    prevAwaitingRef.current = awaitingAssistantReply
  }, [awaitingAssistantReply])

  useBackButton({
    view, showNewSessionPicker, activeDetailSheet,
    onClosePicker: () => setShowNewSessionPicker(false),
    onCloseSheet: () => setActiveDetailSheet(null),
    onBackToSessions: goBack
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
    if (flags.promptQueue && awaitingAssistantReply) {
      queuePrompt(composer, images)
      setComposer("")
      return
    }
    recordPrompt(composer)
    stopGenerationRef.current = false
    setSessions((prev) => prev.map((s) => s.id === selectedSession.id ? { ...s, status: "busy" } : s))
    const result = await send(selectedSession, activeModel, activeAgentID, commands,
      () => refreshSessions(),
      () => loadSelected(selectedSession.id, selectedSession.directory).then(() => undefined),
      setCommands, setRuntimeError, images)
    if (result === "help") { setHelpPage("commands"); navigate("help") }
  }, [selectedSession, activeModel, activeAgentID, commands, send, refreshSessions, loadSelected, setSessions, connectionState, composer, queueAction, setRuntimeError, setComposer, flags.promptQueue, awaitingAssistantReply, queuePrompt])

  const handleAbort = useCallback(async () => {
    if (!selectedSession) return
    stopGenerationRef.current = true
    setAwaitingAssistantReply(false)
    const sid = selectedSession.id
    const dir = selectedSession.directory
    try {
      await Promise.race([
        abortSession(sid, dir),
        new Promise((resolve) => setTimeout(resolve, 4500))
      ])
    } catch { /* ignore */ }
    await loadSelected(sid, dir).catch(() => undefined)
    await settleSession(sid, dir).catch(() => undefined)
    setTimeout(() => { stopGenerationRef.current = false }, 2000)
  }, [selectedSession, abortSession, loadSelected, settleSession])

  const handleCreateSession = useCallback(async (directory?: string) => {
    const created = await createSession(directory, activeModel)
    if (created) {
      recordSessionCreated()
      setShowNewSessionPicker(false)
      if (directory) persistDirectory(directory)
      navigate("detail")
      await onLoadSelected(created.id, created.directory)
      await refreshSessions()
    }
  }, [createSession, activeModel, onLoadSelected, refreshSessions, persistDirectory])

  const handleOpenSession = useCallback(async (id: string, dir: string) => {
    navigate("detail")
    try {
      await openSession(id, dir)
    } catch {
      // Server inaccesible: restaurar el historial cacheado (nunca mostrar vacío si ya se trabajó)
      if (flags.offlineCache) {
        const cached = await getCachedMessages(id).catch(() => null)
        if (cached && cached.length > 0) {
          setMessages((prev) => [...prev.filter((m) => m.info.sessionID !== id), ...cached])
        }
      }
    }
  }, [navigate, openSession, flags.offlineCache, getCachedMessages, setMessages])

  const handleTest = useCallback(() => testConnection(t), [testConnection, t])

  const handleNavigate = useCallback((target: ViewType) => {
    if (target === "sessions") setSelectedProjectDir(null)
    navigate(target)
  }, [navigate])

  const handleRevertToMessage = useCallback(async (messageID: string) => {
    if (!selectedSession) return
    try {
      if (awaitingAssistantReply) {
        await api.abort(config, selectedSession.id, selectedSession.directory)
      }
      await api.revert(config, selectedSession.id, messageID, selectedSession.directory)
      setLocalRevertID(messageID)
      await loadSelected(selectedSession.id, selectedSession.directory)
      await refreshSessions()
    } catch (err) {
      setRuntimeError((err as Error).message)
    }
  }, [selectedSession, config, awaitingAssistantReply, loadSelected, refreshSessions])

  const handleEditMessage = useCallback(async (messageID: string, text: string) => {
    if (!selectedSession) return
    try {
      if (awaitingAssistantReply) {
        await api.abort(config, selectedSession.id, selectedSession.directory)
      }
      await api.revert(config, selectedSession.id, messageID, selectedSession.directory)
      setLocalRevertID(messageID)
      await loadSelected(selectedSession.id, selectedSession.directory)
      await refreshSessions()
      setComposer(text)
    } catch (err) {
      setRuntimeError((err as Error).message)
    }
  }, [selectedSession, config, awaitingAssistantReply, loadSelected, refreshSessions])

  const handleUndo = useCallback(() => {
    if (!selectedSession) return
    undoMessage(selectedSession.id, selectedSession.directory, selectedSession.revert, refreshSessions, () => loadSelected(selectedSession.id, selectedSession.directory))
  }, [selectedSession, undoMessage, refreshSessions, loadSelected])

  const handleRedo = useCallback(() => {
    if (!selectedSession) return
    setLocalRevertID(null)
    redoMessage(selectedSession.id, selectedSession.directory, refreshSessions, () => loadSelected(selectedSession.id, selectedSession.directory))
  }, [selectedSession, redoMessage, refreshSessions, loadSelected])

  const handleCompact = useCallback(() => {
    if (!selectedSession || !activeModel) return
    compactSession(selectedSession.id, selectedSession.directory, activeModel.providerID, activeModel.modelID, refreshSessions, () => loadSelected(selectedSession.id, selectedSession.directory))
  }, [selectedSession, activeModel, compactSession, refreshSessions, loadSelected])

  return (
    <div className="app-shell" data-navbar="header">
      {view !== "detail" && (
        <NavBar variant="top" view={view} onNavigate={handleNavigate}
          hasConfiguredServer={hasConfiguredServer}
          hasSelectedSession={!!selectedSession}
          onToggleLightMode={handleToggleLightMode} />
      )}

      {view === "settings" && (
        <SettingsPanel
          draftConfig={draftConfig} onChange={setDraftConfig}
          onSave={() => saveConfig(t)} onTest={handleTest}
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
          selectedVariant={selectedVariant} onChangeVariant={changeVariant}
          stats={stats} onResetStats={resetStats}
          activeModelOption={activeModelOption}
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
          onDisconnectProvider={disconnectProvider}
          onOpenRemoteConnect={() => setShowRemoteConnect(true)} />
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
            onFork={(s) => handleCreateSession(s.directory)}
            onSearchMessages={() => setQuery("search:")}
            onOpenArchivedView={() => setShowArchivedView(true)}
            onOpenThemeCreator={() => setShowThemeCreator(true)}
            onOpenFavoritesManager={() => setShowFavoritesManager(true)}
            onDismissRecent={dismissRecent}
            onNewSessionHere={(dir) => handleCreateSession(dir)} />
          {showNewSessionPicker && (
            <FolderPicker
              pickerPath={pickerPath} pickerItems={pickerItems}
              pickerLoading={pickerLoading} pickerError={pickerError}
              creatingSession={creatingSession}
              projects={sessions.map((s) => s.directory)}
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
            revertID={localRevertID}
            messages={renderedMessages} todos={todos}
            todosExpanded={todosExpanded} composer={composer}
            isWorking={isWorking} showTypingBubble={showTypingBubble}
            loadingSessionID={loadingSessionID} selectedID={selectedID}
            messageScrollSignature={messageScrollSignature} view={view}
            dataMode={dataMode}             toolMessage={toolMessage}
            renamingSessionID={renamingSessionID} renameValue={renameValue}
            showModelChip={showModelChip}
            commands={commands}
            activeAgent={activeAgent} activeAgentID={activeAgentID}
            activeModelOption={activeModelOption}
            primaryAgentOptions={primaryAgentOptions}
            onChangeAgent={(id) => changeAgent(id, selectedSession?.directory)}
            projectName={projectName}
            onStartRename={startRename}
            onRenameChange={setRenameValue}
            onRenameConfirm={renameSession}
            onRenameCancel={cancelRename}
            onComposerChange={setComposer}
            onSend={(imgs) => handleSend(imgs)}
            onAbort={handleAbort}
            onTodosToggle={() => setTodosExpanded((v) => !v)}
            onBackToSessions={goBack}
            onSheetOpen={setActiveDetailSheet}
            recentSessions={recentSessions} activeSessions={activeSessions}
            onOpenSession={handleOpenSession}
            readingMode={readingMode} onToggleReadingMode={() => setReadingMode((v) => !v)}
            onExportChat={handleExportChat} onSnapshot={handleSnapshot}
            onOpenSettings={() => navigate("settings")}
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
            compacting={compacting}
            pendingQuestions={pendingQuestions}
            permissionRequest={permissionRequest}
            onQuestionReply={handleQuestionReply}
            onQuestionReject={handleQuestionReject}
            onPermissionApprove={handlePermissionApprove}
            onPermissionReject={handlePermissionReject}
            onDismissQuestion={handleDismissQuestion}
            onDismissPermission={handleDismissPermission}
            onRevertToMessage={handleRevertToMessage}
            onEditMessage={handleEditMessage}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onCompact={handleCompact}
            onForkSession={() => selectedSession && handleCreateSession(selectedSession.directory)}
            onOpenFileBrowser={() => selectedSession && fb.open(selectedSession.directory)}
            fileBrowserPath={fb.currentPath}
            onOpenTerminal={() => setShowTerminal(true)}
            onOpenMCPBrowser={() => setShowMCPBrowser(true)}
            onOpenArchivedView={() => setShowArchivedView(true)}
            onOpenThemeCreator={() => setShowThemeCreator(true)}
            onOpenFavoritesManager={() => setShowFavoritesManager(true)}
            onOpenShortcuts={() => setShowShortcuts(true)}
            onOpenChatCustomizer={() => setShowChatCustomizer(true)}
            showTodoButton={chatSettings.showTodoButton}
            queuedPrompts={queuedPrompts}
            onRemoveQueued={removeQueued} />
          <BottomSheet
            activeSheet={activeDetailSheet}
            onClose={() => setActiveDetailSheet(null)}
            modelOptions={modelOptions}
            modelLoadError={modelLoadError}
            activeModelOption={activeModelOption}
            variantGroups={filteredVariantGroups}
            modelQuery={modelQuery}
            isWorking={isWorking}
            onChangeModel={changeModel}
            onModelQueryChange={setModelQuery}
            selectedVariant={selectedVariant}
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
          onCommandFilterChange={setCommandFilter} />
      )}

      {view === "stats" && config && (
        <StatsView config={config} onBack={goBack} />
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

      {fb.isOpen && (
        <FileBrowser
          currentPath={fb.currentPath}
          items={fb.items}
          loading={fb.loading}
          error={fb.error}
          onClose={fb.close}
          onNavigate={fb.navigateTo}
          onGoUp={fb.goUp}
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

      {showChatCustomizer && (
        <ChatCustomizer
          settings={chatSettings}
          onSettingChange={setChatSetting}
          onReset={resetChatSettings}
          onClose={() => setShowChatCustomizer(false)}
        />
      )}

      {showRemoteConnect && (
        <div className="modal-overlay" onClick={() => setShowRemoteConnect(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <RemoteConnect
              status={tunnelStatus}
              error={tunnelError}
              savedConfig={tunnelConfig}
              onConnect={connect}
              onDisconnect={disconnect}
              onClose={() => setShowRemoteConnect(false)}
            />
          </div>
        </div>
      )}

      {runtimeError && (
        <ErrorModal message={runtimeError} onClose={() => setRuntimeError(null)} />
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
