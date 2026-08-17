import { lazy, Suspense, useEffect, useMemo, useState, useCallback, useRef, memo } from "react"
import { api } from "./api"
import { I18nProvider, useT, normalizeLanguage } from "./i18n-context"
import { languageOptions } from "./i18n"
import { useConfig, canTestConfig } from "./hooks/useConfig"
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
import { useSSE } from "./hooks/useSSE"
import { useOfflineCache } from "./hooks/useOfflineCache"
import { NavBar } from "./components/NavBar"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { SettingsPanel } from "./components/SettingsPanel"
import { SessionList } from "./components/SessionList"
import { ChatView } from "./components/ChatView"
import type { ChatViewProps } from "./components/ChatView"
import { SessionChatPanel } from "./components/SessionChatPanel"
import { BottomSheet } from "./components/BottomSheet"
import { ADEDiffPanel } from "./components/ADEDiffPanel"
import { ConfirmModal } from "./components/ConfirmModal"
import { ErrorModal } from "./components/ErrorModal"
import { ShortcutsModal } from "./components/ShortcutsModal"
import type { ViewType, HelpPage as HelpPageType, SessionView, SSEEvent, StreamState, Question, PermissionRequest, QuestionInfo, FileDiff } from "./types"
import type { LanguageCode } from "./i18n"
import { formatLimit, extractPath, extractName, extractBranch, isSessionActive, filterByQuery } from "./utils"
import { STORAGE_KEYS, QUESTION_POLL_INTERVAL_MS, DEFAULT_STATS_PORT } from "./constants"
import { useBackButton } from "./hooks/useBackButton"
import { useNetworkMode } from "./hooks/useNetworkMode"
import { useMemoryCleanup } from "./hooks/useMemoryCleanup"
import { useBlockedModels } from "./hooks/useBlockedModels"
import { useFeatureFlags } from "./hooks/useFeatureFlags"
import { useProviderManager } from "./hooks/useProviderManager"
import { ThemeVariantProvider } from "./context/themeVariant"
import { useShell } from "./hooks/useShell"
import { useChatSettings } from "./hooks/useChatSettings"
import { usePromptSnippets } from "./hooks/usePromptSnippets"
import { useFileBrowser } from "./hooks/useFileBrowser"
import { useOfflineQueue } from "./hooks/useOfflineQueue"
import { useNotifications } from "./hooks/useNotifications"
import { useDeepLink } from "./hooks/useDeepLink"
import { useIsDesktop } from "./hooks/useIsDesktop"
import { useSSEHandler } from "./hooks/useSSEHandler"
import { FolderIcon, SettingsIcon, ChatIcon, TerminalIcon, LayersIcon, HelpIcon, GithubIcon, StatsIcon, TestIcon } from "./Icons"
import { Capacitor } from "@capacitor/core"
import { Filesystem, Directory } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"
import { useShareReceiver } from "./hooks/useShareReceiver"
import { useServers } from "./hooks/useServers"
import { loadDesktopConfig } from "./desktop"
import type { ShellPanelKind } from "./shell"
import { shell } from "./shell"
import { ShellPanel, ExplorerPanel, StatsPanel, KanbanPanel, DocsPanel, UpdatesPanel, LabsPanel, ConfigPanel, FileEditorPanel } from "./components/shellPanels"
import type { ServerProfile } from "./types"

const DESKTOP_STATE_KEY = "opencode.mobile.desktopState"

function lazyRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((err) => {
      const hasReloaded = sessionStorage.getItem("opencode_chunk_reloaded")
      if (!hasReloaded && String(err).includes("dynamically imported module")) {
        sessionStorage.setItem("opencode_chunk_reloaded", "1")
        window.location.reload()
      }
      throw err
    }),
  )
}

// Componentes pesados o poco frecuentes: se descargan bajo demanda
const ThemePicker = lazyRetry(() => import("./components/ThemePicker").then((m) => ({ default: m.ThemePicker })))
const MCPBrowser = lazyRetry(() => import("./components/MCPBrowser").then((m) => ({ default: m.MCPBrowser })))
const ArchivedList = lazyRetry(() => import("./components/ArchivedList").then((m) => ({ default: m.ArchivedList })))
const FileEditor = lazyRetry(() => import("./components/FileEditor").then((m) => ({ default: m.FileEditor })))
const TerminalView = lazyRetry(() => import("./components/TerminalView").then((m) => ({ default: m.TerminalView })))
const RemoteDesktop = lazyRetry(() => import("./components/RemoteDesktop").then((m) => ({ default: m.RemoteDesktop })))
const ThemeCreator = lazyRetry(() => import("./components/ThemeCreator").then((m) => ({ default: m.ThemeCreator })))
const FavoritesManager = lazyRetry(() => import("./components/FavoritesManager").then((m) => ({ default: m.FavoritesManager })))
const FileBrowser = lazyRetry(() => import("./components/FileBrowser").then((m) => ({ default: m.FileBrowser })))
const HelpPage = lazyRetry(() => import("./components/HelpPage").then((m) => ({ default: m.HelpPage })))
const FolderPicker = lazyRetry(() => import("./components/FolderPicker").then((m) => ({ default: m.FolderPicker })))

type DesktopActivity = "sessions" | "explorer" | "stats" | "kanban" | "docs" | "updates" | "labs" | "config"

type DesktopLayout = {
  cols: number
  rows: number
  sessions: Array<string | null>
  panelKinds: Array<ShellPanelKind | "editor">
  panelEditorPaths?: Record<number, string>
  colSizes: Array<number | null>
  rowSizes: Array<number | null>
}

type DesktopState = {
  layout: DesktopLayout
  sidebarWidth: number
  sidebarCollapsed: boolean
  activity: DesktopActivity
  activePanel?: number
  desktopDiffOpen?: boolean
  desktopDiffWidth?: number
  showTerminal?: boolean
  terminalDocked?: boolean
  terminalHeight?: number
  lastClosedPanel?: { index: number; kind: ShellPanelKind; sessionId: string | null } | null
}

function loadDesktopState(fallbackSessionID: string | null): DesktopState {
  const fallback: DesktopState = {
    layout: { cols: 1, rows: 1, sessions: [fallbackSessionID], panelKinds: ["session"], colSizes: [null], rowSizes: [null] } as DesktopLayout,
    sidebarWidth: 340,
    sidebarCollapsed: false,
    activity: "sessions" as DesktopActivity,
    activePanel: 0,
    desktopDiffOpen: false,
    desktopDiffWidth: 440,
    showTerminal: false,
    terminalDocked: true,
    terminalHeight: 280,
    lastClosedPanel: null
  }
  try {
    const raw = JSON.parse(localStorage.getItem(DESKTOP_STATE_KEY) ?? "null") as Partial<DesktopState> | null
    const layout = raw?.layout
    if (layout && layout.cols >= 1 && layout.rows >= 1 && Array.isArray(layout.sessions) && layout.sessions.length === layout.cols * layout.rows) {
      const total = layout.cols * layout.rows
      const kinds: Array<ShellPanelKind> =
        Array.isArray(layout.panelKinds) && layout.panelKinds.length === total
          ? layout.panelKinds.map((k: any) => (k === "session" || k === "terminal" || k === "explorer" || k === "kanban" || k === "docs" || k === "updates" || k === "stats" || k === "labs" || k === "config" ? k : "session"))
          : new Array(total).fill("session")
      return {
        layout: {
          cols: layout.cols,
          rows: layout.rows,
          sessions: layout.sessions.map((s: any) => (typeof s === "string" ? s : null)),
          panelKinds: kinds,
          colSizes: layout.cols === 1 ? [null] : (Array.isArray(layout.colSizes) && layout.colSizes.length === layout.cols ? layout.colSizes : new Array(layout.cols).fill(null)),
          rowSizes: layout.rows === 1 ? [null] : (Array.isArray(layout.rowSizes) && layout.rowSizes.length === layout.rows ? layout.rowSizes : new Array(layout.rows).fill(null)),
        },
        sidebarWidth: Math.max(200, Math.min(480, raw?.sidebarWidth ?? 340)),
        sidebarCollapsed: !!raw?.sidebarCollapsed,
        activity: (["sessions", "explorer", "stats", "kanban", "docs", "updates", "labs", "config"].includes(raw?.activity ?? "") ? raw!.activity! : "sessions") as DesktopActivity,
        activePanel: typeof raw?.activePanel === "number" ? raw.activePanel : 0,
        desktopDiffOpen: !!raw?.desktopDiffOpen,
        desktopDiffWidth: Math.max(280, Math.min(800, raw?.desktopDiffWidth ?? 440)),
        showTerminal: !!raw?.showTerminal,
        terminalDocked: raw?.terminalDocked !== false,
        terminalHeight: Math.max(140, Math.min(650, raw?.terminalHeight ?? 280)),
        lastClosedPanel: raw?.lastClosedPanel ?? null
      }
    }
  } catch { /* ignore */ }
  return fallback
}

const ShellPanelCell = memo(function ShellPanelCell({
  index,
  kind,
  cwd,
  sessionID,
  active,
  onActivate,
  onClose,
  onOpenSessionDir,
  onSplitSession,
  onSwapPanels,
}: {
  index: number
  kind: Exclude<ShellPanelKind, "session">
  cwd?: string
  sessionID?: string | null
  active: boolean
  onActivate: () => void
  onClose: () => void
  onOpenSessionDir: (dir: string) => void
  onSplitSession: (index: number, dir: "left" | "right" | "top" | "bottom" | "center", specificId?: string) => void
  onSwapPanels: (from: number, to: number) => void
}) {
  const [dropZone, setDropZone] = useState<"left" | "right" | "top" | "bottom" | "center" | null>(null)

  const calcDropZone = (e: React.DragEvent<HTMLDivElement>): "left" | "right" | "top" | "bottom" | "center" => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const w = rect.width
    const h = rect.height
    if (y < h * 0.2) return "top"
    if (y > h * 0.8) return "bottom"
    if (x < w * 0.25) return "left"
    if (x > w * 0.75) return "right"
    return "center"
  }

  return (
    <div
      className={`desktop-shell-cell-wrapper${active ? " active" : ""}`}
      style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column" }}
      onClick={onActivate}
      onDragOver={(e) => {
        e.preventDefault()
        setDropZone(calcDropZone(e))
      }}
      onDragLeave={() => setDropZone(null)}
      onDrop={(e) => {
        e.preventDefault()
        const zone = calcDropZone(e)
        setDropZone(null)
        const raw = e.dataTransfer.getData("text/plain")
        if (raw.startsWith("panel:")) {
          const parts = raw.split(":")
          const fromIdx = Number(parts[1])
          const fromPayload = parts[2]
          if (fromIdx !== index) {
            if (zone === "center") {
              onSwapPanels(fromIdx, index)
            } else {
              onSplitSession(index, zone, fromPayload)
            }
          }
        } else if (raw.startsWith("session:")) {
          const sId = raw.replace("session:", "")
          onSplitSession(index, zone, sId)
        } else {
          onSplitSession(index, zone, raw)
        }
      }}
    >
      {dropZone && (
        <div
          style={{
            position: "absolute",
            zIndex: 100,
            pointerEvents: "none",
            background: "rgba(88, 166, 255, 0.25)",
            border: "2px dashed #58a6ff",
            borderRadius: "var(--radius-md)",
            transition: "all 0.1s ease",
            ...(dropZone === "left"
              ? { inset: "0 50% 0 0" }
              : dropZone === "right"
              ? { inset: "0 0 0 50%" }
              : dropZone === "top"
              ? { inset: "0 0 50% 0" }
              : dropZone === "bottom"
              ? { inset: "50% 0 0 0" }
              : { inset: "0" }),
          }}
        />
      )}
      <button
        type="button"
        className="shell-panel-close"
        title="Cerrar panel"
        aria-label="Cerrar panel"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        ×
      </button>
      <ShellPanel kind={kind} cwd={cwd} sessionID={sessionID} onOpenSessionDir={onOpenSessionDir} />
    </div>
  )
})

function AppInner({ language, setLanguage }: { language: LanguageCode; setLanguage: (lang: LanguageCode) => void }) {
  const t = useT()

  const { config, draftConfig, setDraftConfig, connectedVersion, testingConnection,
    connectionState, settingsNotice, setSettingsNotice,
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
    activeAgent, activeAgentID, activeModelOption: globalActiveModelOption, activeModel: globalActiveModel,
    variantGroups, selectedModelKey, selectedVariant: globalSelectedVariant, changeVariant, activeModelVariants: globalActiveModelVariants, getModelForSession, loadAgents, loadModels, changeModel, changeAgent } = useAI(config)
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
    renderedMessages, messageScrollSignature,
    completionShouldPlayRef,
    clearSession, loadSelected, send, abortSession,
    setMessages, undoMessage, redoMessage, compactSession,
    applyDelta, applyPart, compacting, setCompacting, messages
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
    setSessionToDelete, setSessions, favorites, toggleFavorite,
    setSelectedID
  } = useSessions(config, onLoadSelected, backgroundFailureCountRef, initialSessionLoadRef, setConnectionState, setConnectionMessage)

  const currentSessionAI = useMemo(() => {
    return getModelForSession(selectedSession?.id)
  }, [getModelForSession, selectedSession?.id])

  const activeModelOption = currentSessionAI.activeModelOption ?? globalActiveModelOption
  const activeModel = currentSessionAI.activeModel ?? globalActiveModel
  const activeModelVariants = currentSessionAI.activeModelVariants ?? globalActiveModelVariants
  const selectedVariant = currentSessionAI.selectedVariant ?? globalSelectedVariant

  useEffect(() => {
    setLocalRevertID(null)
  }, [selectedSession?.id])

  const {
    showNewSessionPicker, pickerDir,
    pickerItems, pickerLoading, pickerError, setPickerError,
    browseNewSessionDirectory, openNewSessionPicker,
    setShowNewSessionPicker, persistDirectory
  } = useFolderPicker(config)

  const fb = useFileBrowser(config, selectedSession?.directory)

  const { stats, recordPrompt, recordSessionCreated, resetStats } = useStats()
  const { providers: providerList, connecting: connectingProvider, error: providerError, connectProvider, disconnectProvider } = useProviderManager(modelOptions, config)
  const [readingMode, setReadingMode] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  // ===== Feature: MCP Browser =====
  const [showMCPBrowser, setShowMCPBrowser] = useState(false)

  // ===== Feature: Archived View =====
  const [showArchivedView, setShowArchivedView] = useState(false)

  // ===== Feature: File Editor =====
  const [fileEditorPath, setFileEditorPath] = useState<string | null>(null)

  // ===== Feature: ADE Diff Panel (Desktop) =====
  const [desktopDiffOpen, setDesktopDiffOpen] = useState(false)
  const [desktopDiffData, setDesktopDiffData] = useState<{ diffs?: FileDiff[]; selectedFile?: string } | null>(null)
  const [desktopDiffWidth, setDesktopDiffWidth] = useState(520)

  const handleOpenADEDiff = useCallback((diffs?: FileDiff[], file?: string) => {
    setDesktopDiffData({ diffs, selectedFile: file })
    setDesktopDiffOpen(true)
  }, [])

  // ===== Feature: Terminal =====
  const { lines: shellLines, running: shellRunning, execute: shellExecute, clear: shellClear, history: shellHistory, shell: terminalShell, setShell: setTerminalShell } = useShell(config, selectedSession?.directory)
  const [showTerminal, setShowTerminal] = useState(false)
  const [terminalDocked, setTerminalDocked] = useState(true)
  const [terminalHeight, setTerminalHeight] = useState(280)
  const [showRemoteDesktop, setShowRemoteDesktop] = useState(false)
  const [desktopCfg, setDesktopCfg] = useState(() => loadDesktopConfig())

  // ===== Auto-conectar y pre-cargar base de datos de OpenCode Stats =====
  useEffect(() => {
    // 1. Iniciar stats en desktop shell si está disponible
    void shell.stats.status().then((s) => {
      if (!s.running) void shell.stats.start().catch(() => {})
    }).catch(() => {})

    // 2. Pre-cargar datos del servidor de stats si hay config
    if (config?.host) {
      void api.fetchStats(config, DEFAULT_STATS_PORT).catch(() => {})
    }
  }, [config?.host])

  // ===== Feature: Shortcuts =====
  const [showShortcuts, setShowShortcuts] = useState(false)
  const { settings: chatSettings, setSetting: setChatSetting, resetDefaults: resetChatSettings } = useChatSettings()
  const { snippets: promptSnippets, addSnippet, removeSnippet } = usePromptSnippets()

  // ===== Feature: Theme Creator =====
  const [showThemeCreator, setShowThemeCreator] = useState(false)

  // ===== Feature: Favorites Manager =====
  const [showFavoritesManager, setShowFavoritesManager] = useState(false)

  // ===== Feature: Saved servers (profiles) =====
  const { profiles: serverProfiles, addProfile, removeProfile, updateProfile } = useServers()
  const [activeServerProfileID, setActiveServerProfileID] = useState<string | null>(() =>
    localStorage.getItem("opencode.mobile.activeServer") ?? null
  )
  const applyServerProfile = useCallback((profile: ServerProfile) => {
    setDraftConfig(profile.config)
    saveConfig(t)
    setActiveServerProfileID(profile.id)
    localStorage.setItem("opencode.mobile.activeServer", profile.id)
    setSettingsNotice({ type: "success", text: `${t('settings.serverApplied')}: ${profile.name}` })
    setTimeout(() => setSettingsNotice(null), 4000)
  }, [setDraftConfig, saveConfig, t, setSettingsNotice])

  // ===== Feature: Auto-save config (debounced) =====
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!hasDraftChanges) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      if (!canTestConfig(draftConfig)) return
      saveConfig(t)
    }, 700)
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [draftConfig, hasDraftChanges, saveConfig, t])

  // ===== Feature: Share to OpenCode (Android ACTION_SEND) =====
  useShareReceiver((payload) => {
    if (payload.text) setComposer((prev) => prev ? `${prev}\n\n${payload.text}` : payload.text)
    if (!payload.text) setComposer(payload.uri)
    navigate("detail")
  })

  // ===== Feature: Offline Queue =====
  const { enqueue: queueAction, dequeueAll } = useOfflineQueue()

  // ===== Feature: Notifications =====
  const { notify, flags: notifFlags } = useNotifications()

  // ===== Feature: Deep Link =====
  useDeepLink((action) => {
    if (action.kind === "server") {
      const { host, port, username } = action
      if (host) {
        setDraftConfig((prev) => ({ ...prev, host, port: port ?? prev.port, username: username ?? prev.username }))
        navigate("settings")
      }
    } else if (action.kind === "session") {
      if (!action.sessionID) return
      navigate("detail")
      setTimeout(() => {
        const dir = action.directory ?? ""
        const target = sessions.find((s) => s.id === action.sessionID)
        if (target) {
          openSession(target.id, target.directory)
        } else {
          openSession(action.sessionID!, dir)
        }
      }, 300)
    }
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

  const handleSSEEvent = useSSEHandler({
    sessionID: selectedSession?.id,
    directory: selectedSession?.directory,
    loadSelected,
    applyDelta,
    applyPart,
    setAwaitingAssistantReply,
    setRuntimeError,
    awaitingRef: () => awaitingReplyRef.current,
    onSettled: settleSession,
  })

  const stopGenerationRef = useRef(false)

  const { streamState: sseState } = useSSE(
    (dataMode === "full" && flags.streamingFull) ? config : null,
    useCallback((event: SSEEvent) => {
      if (stopGenerationRef.current) {
        // Descartar deltas solo hasta que el server confirme el fin del turno
        // (idle/settled) — entonces se reanuda el streaming de inmediato en vez
        // de esperar el timeout ciego.
        const isSettled = event.type === "session.status" || event.type === "session.idle"
          || (event.type === "message.updated" &&
            (event.properties as Record<string, unknown>)?.message &&
            ((event.properties as Record<string, unknown>).message as { info?: { time?: { completed?: number } } })?.info?.time?.completed)
        if (isSettled) {
          stopGenerationRef.current = false
        } else if (event.type === "message.part.delta" || event.type === "message.updated" || event.type === "message.part.updated"
          || event.type === "session.next.text.delta" || event.type === "session.next.reasoning.delta"
          || event.type === "session.next.tool.input.delta") {
          return
        }
      }
      handleSSEEvent(event)
    }, [handleSSEEvent]),
    selectedSession?.directory,
    selectedSession?.id
  )

  useEffect(() => {
    setStreamState(sseState)
  }, [sseState])

  // Watchdog: si el SSE cae (polling/reconnecting) y awaitingAssistantReply
  // sigue true después de 30s, limpiar el indicador de typing (el server no
  // emitió session.idle, probablemente murió mid-stream).
  useEffect(() => {
    if (!awaitingAssistantReply || sseState === "streaming") return
    const t = setTimeout(() => {
      if (awaitingAssistantReply) setAwaitingAssistantReply(false)
    }, 30_000)
    return () => clearTimeout(t)
  }, [awaitingAssistantReply, sseState])

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
  const notifiedQuestionIDs = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!config || !flags.questionAuto) return
    const poll = async () => {
      try {
        const qs = await api.listPendingQuestions(config, selectedSession?.directory)
        const fresh = qs.filter((q) => !dismissedQuestions.has(q.id))
        setPendingQuestions(fresh)
        if (notifFlags.onQuestion) {
          for (const q of fresh) {
            if (notifiedQuestionIDs.current.has(q.id)) continue
            notifiedQuestionIDs.current.add(q.id)
            notify(t('notification.questionTitle'), (q as { question?: string }).question ?? (q as { questions?: QuestionInfo[] }).questions?.[0]?.question ?? "")
          }
        }
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, QUESTION_POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [config, flags.questionAuto, selectedSession?.directory, dismissedQuestions, notifFlags.onQuestion, notify, t])

  const handleQuestionReply = useCallback(async (requestID: string, answers: string[][]) => {
    if (!config) return
    try {
      await api.questionReply(config, requestID, answers, selectedSession?.directory, pendingQuestions.find((q) => q.id === requestID)?.sessionID)
      setDismissedQuestions((prev) => new Set(prev).add(requestID))
      setPendingQuestions((prev) => prev.filter((q) => q.id !== requestID))
    } catch { /* ignore */ }
  }, [config, selectedSession?.directory, pendingQuestions])

  const handleQuestionReject = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.questionReject(config, requestID, selectedSession?.directory, pendingQuestions.find((q) => q.id === requestID)?.sessionID)
      setDismissedQuestions((prev) => new Set(prev).add(requestID))
      setPendingQuestions((prev) => prev.filter((q) => q.id !== requestID))
    } catch { /* ignore */ }
  }, [config, selectedSession?.directory, pendingQuestions])

  const handleDismissQuestion = useCallback(() => {
    setPendingQuestions((prev) => prev.slice(1))
  }, [])

  // ===== Permissions =====
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null)
  const notifiedPermissionIDs = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!config || !flags.permissionUI) return
    const poll = async () => {
      try {
        const perms = await api.listPermissions(config, selectedSession?.directory)
        const pending = perms.find((p) => p.status === "pending")
        if (pending) setPermissionRequest(pending)
        if (pending && notifFlags.onQuestion && !notifiedPermissionIDs.current.has(pending.requestID)) {
          notifiedPermissionIDs.current.add(pending.requestID)
          notify(t('notification.permissionTitle'), pending.permission ?? "")
        }
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, QUESTION_POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [config, flags.permissionUI, selectedSession?.directory, notifFlags.onQuestion, notify, t])

  const handlePermissionApprove = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.permissionReply(config, requestID, true, selectedSession?.directory, permissionRequest?.sessionID)
      setPermissionRequest(null)
    } catch { /* ignore */ }
  }, [config, selectedSession?.directory, permissionRequest])

  const handlePermissionReject = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.permissionReply(config, requestID, false, selectedSession?.directory, permissionRequest?.sessionID)
      setPermissionRequest(null)
    } catch { /* ignore */ }
  }, [config, selectedSession?.directory, permissionRequest])

  const handleDismissPermission = useCallback(() => {
    setPermissionRequest(null)
  }, [])

  const isSessionRunning = Boolean(selectedSession && isSessionActive(selectedSession))
  const isWorking = awaitingAssistantReply || isSessionRunning
  const showTypingBubble = Boolean(selectedSession) && isWorking

  const buildMarkdown = useCallback((): string | null => {
    if (!selectedSession || renderedMessages.length === 0) return null
    const header = `# ${selectedSession.title}\n\n`
    const body = renderedMessages.map((m) =>
      `## ${m.info.role === "user" ? "User" : "OpenCode"}\n${m.text}\n`
    ).join("\n")
    return header + body
  }, [selectedSession, renderedMessages])

  const handleExportChat = useCallback(() => {
    const full = buildMarkdown()
    if (!full) return
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
  }, [buildMarkdown])

  const handleExportMarkdown = useCallback(async () => {
    const full = buildMarkdown()
    if (!full) return
    const filename = `${(selectedSession?.title ?? "chat").replace(/[^\w\-]+/g, "_")}.md`
    if (Capacitor.isNativePlatform()) {
      try {
        const saved = await Filesystem.writeFile({ path: filename, data: full, directory: Directory.Cache })
        await Share.share({ title: filename, url: saved.uri })
        return
      } catch {
        /* share canceled or write failed — fall through to web download */
      }
    }
    const blob = new Blob([full], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }, [buildMarkdown, selectedSession?.title])

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

  // Todos los recientes (ordenados, sin dismiss): el lazy loading (scroll
  // infinito) vive en SessionList — no limitar acá, o el scroll nunca ve más.
  const recentSessions = useMemo(
    () => [...sessions].sort((a, b) => (b.updated || 0) - (a.updated || 0)).filter((s) => !dismissedRecentIds.has(s.id)),
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

  const pollControl = usePolling(async () => {
    await refreshSessions(true)
    if (connectionStateRef.current === "offline") {
      throw new Error("offline")
    }
    if (!selectedSession) return
    if (dataMode === "full" || dataMode === "saver" || isSessionActive(selectedSession)) {
      const prevUpdated = lastMsgFetchUpdatedRef.current[selectedSession.id]
      // El skip solo es seguro si el SSE está streamando en vivo: si está
      // caído/polling (túnel móvil), hay que fetchear siempre o la respuesta
      // del modelo nunca llega hasta que el turno termina.
      const sseLive = streamState === "streaming"
      const skip = dataMode !== "full" && sseLive && prevUpdated !== undefined && selectedSession.updated <= prevUpdated
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

  useCompletionAudio(awaitingAssistantReply, completionShouldPlayRef, dataMode, chatSettings.completionSound, () => {
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

    // El dialecto v1/v2 se resuelve solo en el primer request (api.ts
    // ensureVersionDetected): aquí no hace falta probe extra. Si el primer
    // refresh falla (server lento en arrancar), el polling se re-programa a
    // ~1s (fail) en vez de esperar el intervalo completo (15-60s).
    refreshSessions(true).catch(() => pollControl.fail())
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

  // La cola de prompts fue eliminada: el envío es directo y el server
  // gestiona la concurrencia (el servidor encola los turnos por sí solo).

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
    recordPrompt(composer)
    stopGenerationRef.current = false
    // Consumir un revert pendiente: el server elimina los mensajes revertidos
    // al recibir el nuevo prompt — el estado local debe descartarlos YA (el
    // merge por id de loadSelected los conservaría y reaparecerían sin revert).
    const revertMsgId = localRevertID ?? selectedSession?.revert?.messageID
    if (revertMsgId) {
      // Filtrar SOLO los mensajes de la sesión activa (nunca tocar el estado
      // de otra sesión que pueda coexistir en el array).
      const sid = selectedSession.id
      setMessages((prev) => prev.filter((m) => m.info.sessionID !== sid || !m.info.id || m.info.id <= revertMsgId))
    }
    setLocalRevertID(null)
    setSessions((prev) => prev.map((s) => s.id === selectedSession.id ? { ...s, status: "busy" } : s))
    const result = await send(selectedSession, activeModel, activeAgentID, commands,
      () => refreshSessions(),
      () => loadSelected(selectedSession.id, selectedSession.directory).then(() => undefined),
      setCommands, setRuntimeError, images)
    if (result === "help") { setHelpPage("commands"); navigate("help") }
    if (result === "themes") { navigate("settings"); setShowThemePicker(true) }
  }, [selectedSession, activeModel, activeAgentID, commands, send, refreshSessions, loadSelected, setSessions, connectionState, composer, queueAction, setRuntimeError, setComposer, localRevertID, setMessages, navigate, setHelpPage, setShowThemePicker])

  const handleRegenerate = useCallback(async () => {
    if (!selectedSession) return
    // Si hay un revert activo, regenerar el último mensaje user VISIBLE.
    const revertMsgId = localRevertID ?? selectedSession?.revert?.messageID
    if (revertMsgId) {
      const sid = selectedSession.id
      setMessages((prev) => prev.filter((m) => m.info.sessionID !== sid || !m.info.id || m.info.id <= revertMsgId))
      setLocalRevertID(null)
    }
    const visible = revertMsgId ? renderedMessages.filter((m) => m.info.id <= revertMsgId) : renderedMessages
    const lastUser = [...visible].reverse().find((m) => m.info.role === "user")
    if (!lastUser?.text) return
    if (lastUser.parts.some((p) => p.type === "image")) return
    if (awaitingAssistantReply) {
      await abortSession(selectedSession.id, selectedSession.directory).catch(() => undefined)
    }
    setAwaitingAssistantReply(false)
    await send(selectedSession, activeModel, activeAgentID, commands,
      () => refreshSessions(),
      () => loadSelected(selectedSession.id, selectedSession.directory).then(() => undefined),
      setCommands, setRuntimeError, undefined, lastUser.text)
  }, [selectedSession, renderedMessages, localRevertID, awaitingAssistantReply, abortSession, send, activeModel, activeAgentID, commands, refreshSessions, loadSelected, setCommands, setRuntimeError, setMessages])

  const handleInsertPrompt = useCallback((text: string) => {
    setComposer(text)
    navigate("detail")
  }, [setComposer, navigate])

  const handleSendPrompt = useCallback(async (text: string) => {
    if (!selectedSession || !text.trim()) return
    if (awaitingAssistantReply) {
      await abortSession(selectedSession.id, selectedSession.directory).catch(() => undefined)
    }
    setAwaitingAssistantReply(false)
    await send(selectedSession, activeModel, activeAgentID, commands,
      () => refreshSessions(),
      () => loadSelected(selectedSession.id, selectedSession.directory).then(() => undefined),
      setCommands, setRuntimeError, undefined, text)
  }, [selectedSession, awaitingAssistantReply, abortSession, send, activeModel, activeAgentID, commands, refreshSessions, loadSelected, setCommands, setRuntimeError])

  const handleAbort = useCallback(async () => {    if (!selectedSession) return
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
    setTimeout(() => { stopGenerationRef.current = false }, 800)
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
  }, [createSession, activeModel, recordSessionCreated, persistDirectory, navigate, onLoadSelected, refreshSessions])

  const isDesktop = useIsDesktop()

  const handleOpenNewSession = useCallback(async () => {
    if (isDesktop) {
      try {
        const res = await shell.fs.pickFolder()
        if (res && res.ok && res.path) {
          await handleCreateSession(res.path)
          return
        }
        if (res && res.ok === false && res.path === null) {
          // El usuario canceló la selección de carpeta
          return
        }
      } catch {
        // En caso de que no esté corriendo bajo el shell exe, fallback a picker
      }
      openNewSessionPicker()
      return
    }
    openNewSessionPicker()
  }, [isDesktop, handleCreateSession, openNewSessionPicker])

  // Zoom general de la interfaz con Ctrl + Ruedita y atajos de teclado (Ctrl + / Ctrl - / Ctrl 0)
  useEffect(() => {
    const ZOOM_KEY = "opencode.mobile.ui_zoom"
    const saved = localStorage.getItem(ZOOM_KEY)
    let currentZoom = saved ? Math.min(2.5, Math.max(0.5, parseFloat(saved))) : 1
    if (currentZoom !== 1 && !isNaN(currentZoom)) {
      (document.documentElement.style as any).zoom = `${currentZoom}`
    }

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY < 0 ? 0.05 : -0.05
        currentZoom = Math.min(2.5, Math.max(0.5, Math.round((currentZoom + delta) * 100) / 100))
        if (Math.abs(currentZoom - 1) < 0.02) currentZoom = 1
        ;(document.documentElement.style as any).zoom = `${currentZoom}`
        localStorage.setItem(ZOOM_KEY, String(currentZoom))
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault()
          currentZoom = Math.min(2.5, Math.round((currentZoom + 0.1) * 10) / 10)
          ;(document.documentElement.style as any).zoom = `${currentZoom}`
          localStorage.setItem(ZOOM_KEY, String(currentZoom))
        } else if (e.key === "-") {
          e.preventDefault()
          currentZoom = Math.max(0.5, Math.round((currentZoom - 0.1) * 10) / 10)
          ;(document.documentElement.style as any).zoom = `${currentZoom}`
          localStorage.setItem(ZOOM_KEY, String(currentZoom))
        } else if (e.key === "0") {
          e.preventDefault()
          currentZoom = 1
          ;(document.documentElement.style as any).zoom = "1"
          localStorage.setItem(ZOOM_KEY, "1")
        }
      }
    }

    window.addEventListener("wheel", handleWheel, { passive: false })
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  // ===== Desktop: grid de paneles (splits) =====
  const [desktopState, setDesktopState] = useState(() => loadDesktopState(selectedSession?.id ?? null))
  const desktopLayout = desktopState.layout
  const setDesktopLayout = useCallback((updater: (prev: DesktopLayout) => DesktopLayout) => {
    setDesktopState((prev) => ({ ...prev, layout: updater(prev.layout) }))
  }, [])
  const sidebarWidth = desktopState.sidebarWidth
  const sidebarCollapsed = desktopState.sidebarCollapsed
  const activity = desktopState.activity
  const setActivity = useCallback((a: DesktopActivity) => setDesktopState((prev) => ({ ...prev, activity: a })), [])
  const setSidebarWidth = useCallback((w: number) => setDesktopState((prev) => ({ ...prev, sidebarWidth: w })), [])
  const setSidebarCollapsed = useCallback((collapsed: boolean | ((v: boolean) => boolean)) => {
    setDesktopState((prev) => ({ ...prev, sidebarCollapsed: typeof collapsed === "function" ? collapsed(prev.sidebarCollapsed) : collapsed }))
  }, [])
  const [activePanel, setActivePanel] = useState(0)
  const [maximizedPanel, setMaximizedPanel] = useState<number | null>(null)
  // Refs para resize fluido: durante el drag se muta el DOM directamente
  // (sin re-render), y el estado se commitea al soltar.
  const gridRef = useRef<HTMLDivElement | null>(null)
  const shellRef = useRef<HTMLDivElement | null>(null)

  // Persistencia del layout + sidebar + paneles (debounced)
  useEffect(() => {
    if (!isDesktop) return
    const id = setTimeout(() => {
      try {
        const fullState: DesktopState = {
          ...desktopState,
          activePanel,
          desktopDiffOpen,
          desktopDiffWidth,
          showTerminal,
          terminalDocked,
          terminalHeight
        }
        localStorage.setItem(DESKTOP_STATE_KEY, JSON.stringify(fullState))
      } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(id)
  }, [desktopState, isDesktop, activePanel, desktopDiffOpen, desktopDiffWidth, showTerminal, terminalDocked, terminalHeight])

  const openInPanel = useCallback((index: number, id: string) => {
    setDesktopLayout((prev) => {
      const existing = prev.sessions.indexOf(id)
      const sessions = [...prev.sessions]
      const panelKinds = [...prev.panelKinds]
      if (existing >= 0 && existing !== index) {
        sessions[existing] = null
      }
      sessions[index] = id
      panelKinds[index] = "session"
      return { ...prev, sessions, panelKinds }
    })
    setActivePanel(index)
  }, [])

  const splitPanel = useCallback((index: number, dir: "right" | "bottom") => {
    setDesktopLayout((prev) => {
      const kindsOf = (r: number, c: number) => prev.panelKinds[r * prev.cols + c] ?? "session"
      if (dir === "right") {
        const cols = prev.cols + 1
        const col = index % prev.cols
        const sessions: Array<string | null> = []
        const panelKinds: Array<ShellPanelKind> = []
        for (let r = 0; r < prev.rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (c <= col) { sessions.push(prev.sessions[r * prev.cols + c] ?? null); panelKinds.push(kindsOf(r, c)) }
            else if (c === col + 1) { sessions.push(null); panelKinds.push("session") }
            else { sessions.push(prev.sessions[r * prev.cols + (c - 1)] ?? null); panelKinds.push(kindsOf(r, c - 1)) }
          }
        }
        const colSizes = [...prev.colSizes]
        colSizes.splice(col + 1, 0, null)
        return { ...prev, cols, sessions, panelKinds, colSizes }
      }
      const rows = prev.rows + 1
      const row = Math.floor(index / prev.cols)
      const sessions: Array<string | null> = []
      const panelKinds: Array<ShellPanelKind> = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < prev.cols; c++) {
          if (r <= row) { sessions.push(prev.sessions[r * prev.cols + c] ?? null); panelKinds.push(kindsOf(r, c)) }
          else if (r === row + 1) { sessions.push(null); panelKinds.push("session") }
          else { sessions.push(prev.sessions[(r - 1) * prev.cols + c] ?? null); panelKinds.push(kindsOf(r - 1, c)) }
        }
      }
      const rowSizes = [...prev.rowSizes]
      rowSizes.splice(row + 1, 0, null)
      return { ...prev, rows, sessions, panelKinds, rowSizes }
    })
  }, [])

  // Agrega un panel nuevo (de cualquier tipo) al grid, expandiendo si está lleno.
  const addPanel = useCallback((kind: ShellPanelKind) => {
    setDesktopLayout((prev) => {
      const total = prev.cols * prev.rows
      const emptySlot = prev.sessions.findIndex((s, i) => s === null && prev.panelKinds[i] === "session")
      if (emptySlot >= 0) {
        const sessions = [...prev.sessions]
        const panelKinds = [...prev.panelKinds]
        panelKinds[emptySlot] = kind
        return { ...prev, sessions, panelKinds }
      }
      let cols = prev.cols
      let rows = prev.rows
      if (cols < 3) cols += 1
      else if (rows < 2) rows += 1
      else cols = 2, rows = 2 // reset visual de 3x1 -> 2x2
      const sessions: Array<string | null> = new Array(cols * rows).fill(null)
      const panelKinds: Array<ShellPanelKind> = new Array(cols * rows).fill("session")
      for (let i = 0; i < Math.min(total, cols * rows); i++) {
        sessions[i] = prev.sessions[i]
        panelKinds[i] = prev.panelKinds[i]
      }
      panelKinds[sessions.length - 1] = kind
      const colSizes = new Array(cols).fill(null)
      const rowSizes = new Array(rows).fill(null)
      prev.colSizes.forEach((s, i) => { if (i < cols) colSizes[i] = s })
      prev.rowSizes.forEach((s, i) => { if (i < rows) rowSizes[i] = s })
      return { ...prev, cols, rows, sessions, panelKinds, colSizes, rowSizes }
    })
    setActivePanel(0)
  }, [])

  // "Abrir sesión aquí" desde el explorador: crea la sesión en el directorio
  // y la abre en el panel activo (como panel de chat).
  const openSessionInDir = useCallback(async (directory: string) => {
    try {
      const created = await createSession(directory, activeModel)
      if (created) {
        recordSessionCreated()
        persistDirectory(directory)
        navigate("detail")
        setDesktopLayout((prev) => {
          const sessions = [...prev.sessions]
          const panelKinds = [...prev.panelKinds]
          const i = Math.min(activePanel, prev.sessions.length - 1)
          sessions[i] = created.id
          panelKinds[i] = "session"
          return { ...prev, sessions, panelKinds }
        })
        await onLoadSelected(created.id, created.directory)
        await refreshSessions()
      }
    } catch { /* ignore */ }
  }, [createSession, activeModel, recordSessionCreated, persistDirectory, navigate, setDesktopLayout, activePanel, onLoadSelected, refreshSessions])

  const closePanel = useCallback((index: number) => {
    setDesktopState((prevState) => {
      const prev = prevState.layout
      const closedInfo = {
        index,
        kind: prev.panelKinds[index] ?? "session",
        sessionId: prev.sessions[index] ?? null
      }

      const remainingIndices = prev.panelKinds.map((_, i) => i).filter((i) => i !== index)
      const activeRemaining = remainingIndices.filter((i) => {
        const k = prev.panelKinds[i]
        const s = prev.sessions[i]
        return !(k === "session" && s === null)
      })

      if (activeRemaining.length <= 1) {
        const targetIdx = activeRemaining[0] ?? remainingIndices[0] ?? 0
        return {
          ...prevState,
          lastClosedPanel: closedInfo,
          layout: {
            ...prev,
            cols: 1,
            rows: 1,
            sessions: [prev.sessions[targetIdx] ?? null],
            panelKinds: [prev.panelKinds[targetIdx] ?? "session"],
            panelEditorPaths: prev.panelEditorPaths?.[targetIdx] ? { 0: prev.panelEditorPaths[targetIdx] } : {},
            colSizes: [null],
            rowSizes: [null],
          }
        }
      }

      let sessions = [...prev.sessions]
      let panelKinds = [...prev.panelKinds]
      sessions[index] = null
      panelKinds[index] = "session"
      let { cols, rows, colSizes, rowSizes } = prev
      const isEmpty = (i: number) => sessions[i] === null && panelKinds[i] === "session"
      let changed = true
      while (changed) {
        changed = false
        for (let r = 0; r < rows; r++) {
          const rowEmpty = sessions.slice(r * cols, r * cols + cols).every((_, i) => isEmpty(r * cols + i))
          if (rowEmpty && rows > 1) {
            sessions = sessions.filter((_, i) => Math.floor(i / cols) !== r)
            panelKinds = panelKinds.filter((_, i) => Math.floor(i / cols) !== r)
            rows -= 1
            rowSizes = rowSizes.filter((_, i) => i !== r)
            changed = true
            break
          }
        }
        if (changed) continue
        for (let c = 0; c < cols; c++) {
          const colEmpty = sessions.filter((_, i) => i % cols === c).every((_, i) => isEmpty(i * cols + c))
          if (colEmpty && cols > 1) {
            sessions = sessions.filter((_, i) => i % cols !== c)
            panelKinds = panelKinds.filter((_, i) => i % cols !== c)
            cols -= 1
            colSizes = colSizes.filter((_, i) => i !== c)
            changed = true
            break
          }
        }
        if (cols === 1) colSizes = [null]
        if (rows === 1) rowSizes = [null]
      }
      return {
        ...prevState,
        lastClosedPanel: closedInfo,
        layout: { ...prev, cols, rows, sessions, panelKinds, colSizes, rowSizes }
      }
    })
    setActivePanel((prev) => (prev >= index ? Math.max(0, prev - 1) : prev))
  }, [])

  const toggleMaximize = useCallback((index: number) => {
    setMaximizedPanel((prev) => (prev === index ? null : index))
  }, [])

  // Drag & drop de sesiones (sidebar → panel) e intercambio de paneles
  const draggedSessionRef = useRef<{ id: string; dir: string } | null>(null)
  const handleSessionDragStart = useCallback((id: string, dir: string) => {
    draggedSessionRef.current = { id, dir }
  }, [])

  // 4-Way Docking: Acopla una sesión o panel en cualquier lado (izq, der, arriba, abajo o centro) sin duplicar
  const handleDockSession = useCallback((index: number, dir: "left" | "right" | "top" | "bottom" | "center", specificId?: string) => {
    const drag = draggedSessionRef.current
    const rawId = specificId || drag?.id
    if (!rawId) return
    draggedSessionRef.current = null

    let targetKind: ShellPanelKind | "editor" = "session"
    let targetSessionId: string | null = null
    let fromIndex: number | null = null

    if (rawId.startsWith("panel:")) {
      const parts = rawId.split(":")
      fromIndex = Number(parts[1])
      const payload = parts[2]
      if (payload.startsWith("kind:")) {
        targetKind = payload.replace("kind:", "") as ShellPanelKind
        targetSessionId = null
      } else if (payload === "terminal" || payload === "explorer" || payload === "kanban" || payload === "docs" || payload === "stats" || payload === "labs") {
        targetKind = payload as ShellPanelKind
        targetSessionId = null
      } else {
        targetKind = "session"
        targetSessionId = payload
      }
    } else if (rawId.startsWith("kind:")) {
      targetKind = rawId.replace("kind:", "") as ShellPanelKind
      targetSessionId = null
    } else if (rawId === "terminal" || rawId === "explorer" || rawId === "kanban" || rawId === "docs" || rawId === "stats" || rawId === "labs") {
      targetKind = rawId as ShellPanelKind
      targetSessionId = null
    } else if (rawId.startsWith("session:")) {
      targetKind = "session"
      targetSessionId = rawId.replace("session:", "")
    } else {
      targetKind = "session"
      targetSessionId = rawId
    }

    if (dir === "center") {
      setDesktopLayout((prev) => {
        const sessions = [...prev.sessions]
        const panelKinds = [...prev.panelKinds]
        if (targetSessionId) {
          const existing = sessions.indexOf(targetSessionId)
          if (existing >= 0 && existing !== index) {
            sessions[existing] = null
          }
        } else if (fromIndex !== null && fromIndex !== index) {
          panelKinds[fromIndex] = "session"
          sessions[fromIndex] = null
        }
        sessions[index] = targetSessionId
        panelKinds[index] = targetKind
        return { ...prev, sessions, panelKinds }
      })
      setActivePanel(index)
      return
    }

    if (dir === "left" || dir === "right") {
      setDesktopLayout((prev) => {
        let baseSessions = [...prev.sessions]
        let baseKinds = [...prev.panelKinds]
        if (targetSessionId) {
          baseSessions = baseSessions.map((s) => (s === targetSessionId ? null : s))
        } else if (fromIndex !== null && fromIndex < baseKinds.length) {
          baseKinds[fromIndex] = "session"
          baseSessions[fromIndex] = null
        }
        const cols = prev.cols + 1
        const col = index % prev.cols
        const sessions: Array<string | null> = []
        const panelKinds: Array<ShellPanelKind | "editor"> = []
        for (let r = 0; r < prev.rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (dir === "right") {
              if (c <= col) {
                sessions.push(baseSessions[r * prev.cols + c] ?? null)
                panelKinds.push(baseKinds[r * prev.cols + c] ?? "session")
              } else if (c === col + 1) {
                sessions.push(r === Math.floor(index / prev.cols) ? targetSessionId : null)
                panelKinds.push(r === Math.floor(index / prev.cols) ? targetKind : "session")
              } else {
                sessions.push(baseSessions[r * prev.cols + (c - 1)] ?? null)
                panelKinds.push(baseKinds[r * prev.cols + (c - 1)] ?? "session")
              }
            } else {
              if (c === col) {
                sessions.push(r === Math.floor(index / prev.cols) ? targetSessionId : null)
                panelKinds.push(r === Math.floor(index / prev.cols) ? targetKind : "session")
              } else if (c < col) {
                sessions.push(baseSessions[r * prev.cols + c] ?? null)
                panelKinds.push(baseKinds[r * prev.cols + c] ?? "session")
              } else {
                sessions.push(baseSessions[r * prev.cols + (c - 1)] ?? null)
                panelKinds.push(baseKinds[r * prev.cols + (c - 1)] ?? "session")
              }
            }
          }
        }
        const colSizes = new Array(cols).fill(null)
        return { ...prev, cols, sessions, panelKinds, colSizes }
      })
      setActivePanel(dir === "right" ? index + 1 : index)
      return
    }

    if (dir === "top" || dir === "bottom") {
      setDesktopLayout((prev) => {
        let baseSessions = [...prev.sessions]
        let baseKinds = [...prev.panelKinds]
        if (targetSessionId) {
          baseSessions = baseSessions.map((s) => (s === targetSessionId ? null : s))
        } else if (fromIndex !== null && fromIndex < baseKinds.length) {
          baseKinds[fromIndex] = "session"
          baseSessions[fromIndex] = null
        }
        const rows = prev.rows + 1
        const row = Math.floor(index / prev.cols)
        const col = index % prev.cols
        const sessions: Array<string | null> = []
        const panelKinds: Array<ShellPanelKind | "editor"> = []
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < prev.cols; c++) {
            if (dir === "bottom") {
              if (r <= row) {
                sessions.push(baseSessions[r * prev.cols + c] ?? null)
                panelKinds.push(baseKinds[r * prev.cols + c] ?? "session")
              } else if (r === row + 1) {
                sessions.push(c === col ? targetSessionId : null)
                panelKinds.push(c === col ? targetKind : "session")
              } else {
                sessions.push(baseSessions[(r - 1) * prev.cols + c] ?? null)
                panelKinds.push(baseKinds[(r - 1) * prev.cols + c] ?? "session")
              }
            } else {
              if (r === row) {
                sessions.push(c === col ? targetSessionId : null)
                panelKinds.push(c === col ? targetKind : "session")
              } else if (r < row) {
                sessions.push(baseSessions[r * prev.cols + c] ?? null)
                panelKinds.push(baseKinds[r * prev.cols + c] ?? "session")
              } else {
                sessions.push(baseSessions[(r - 1) * prev.cols + c] ?? null)
                panelKinds.push(baseKinds[(r - 1) * prev.cols + c] ?? "session")
              }
            }
          }
        }
        const rowSizes = new Array(rows).fill(null)
        return { ...prev, rows, sessions, panelKinds, rowSizes }
      })
      setActivePanel(index)
      return
    }
  }, [])

  const handleSwapPanels = useCallback((from: number, to: number) => {
    if (from === to) return
    setDesktopLayout((prev) => {
      const sessions = [...prev.sessions]
      const panelKinds = [...prev.panelKinds]
      ;[sessions[from], sessions[to]] = [sessions[to], sessions[from]]
      ;[panelKinds[from], panelKinds[to]] = [panelKinds[to], panelKinds[from]]
      return { ...prev, sessions, panelKinds }
    })
  }, [setDesktopLayout])

  const startSidebarResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidth
    let lastW = sidebarWidth
    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"
    const apply = (w: number) => {
      if (shellRef.current) shellRef.current.style.gridTemplateColumns = `48px ${w}px minmax(0, 1fr)${desktopDiffOpen ? ` ${desktopDiffWidth}px` : ""}`
    }
    const onMove = (ev: PointerEvent) => {
      lastW = Math.max(200, Math.min(480, startWidth + (ev.clientX - startX)))
      apply(lastW)
    }
    const onUp = () => {
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      setSidebarWidth(lastW)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [sidebarWidth, setSidebarWidth, desktopDiffOpen, desktopDiffWidth])

  // Atajos de escritorio (splits/sidebar/layouts) — solo desktop
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isDesktop || (view !== "sessions" && view !== "detail") || !(e.ctrlKey || e.metaKey)) return
      const inEditable = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      const k = e.key.toLowerCase()
      if (k === "w") {
        e.preventDefault()
        if (maximizedPanel !== null) { setMaximizedPanel(null); return }
        if (desktopLayout.cols > 1 || desktopLayout.rows > 1 || desktopLayout.sessions.some((s) => s !== null)) {
          closePanel(activePanel)
        }
        return
      }
      if (inEditable) return
      if (e.shiftKey && k === "s") { e.preventDefault(); splitPanel(activePanel, "right"); return }
      if (e.shiftKey && k === "v") { e.preventDefault(); splitPanel(activePanel, "bottom"); return }
      if (k === "m") { e.preventDefault(); if (desktopLayout.sessions[activePanel]) toggleMaximize(activePanel); return }
      if (k === "b") { e.preventDefault(); setSidebarCollapsed((v) => !v); return }
      if (k === "n") { e.preventDefault(); handleOpenNewSession(); return }
      if (!e.shiftKey && /^[1-9]$/.test(k)) {
        const idx = Number(k) - 1
        if (idx < desktopLayout.cols * desktopLayout.rows) { e.preventDefault(); setActivePanel(idx) }
        return
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isDesktop, view, maximizedPanel, desktopLayout.cols, desktopLayout.rows, desktopLayout.sessions, activePanel, closePanel, splitPanel, toggleMaximize, setSidebarCollapsed, handleOpenNewSession])

  const handleOpenSession = useCallback(async (id: string, dir: string) => {
    navigate("detail")
    if (isDesktop) {
      // Regla "activar si ya existe": si la sesión ya está en un panel, se
      // activa ese panel; si no, reemplaza la sesión del panel activo.
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
      // Server inaccesible: restaurar el historial cacheado (nunca mostrar vacío si ya se trabajó)
      if (flags.offlineCache) {
        const cached = await getCachedMessages(id).catch(() => null)
        if (cached && cached.length > 0) {
          setMessages((prev) => [...prev.filter((m) => m.info.sessionID !== id), ...cached])
        }
      }
    }
  }, [navigate, openSession, flags.offlineCache, getCachedMessages, setMessages, isDesktop, desktopLayout.sessions, activePanel, openInPanel])

  const handleTest = useCallback(() => testConnection(t), [testConnection, t])

  const handleShutdownHost = useCallback(() => {
    if (!selectedSession || !config) {
      setSettingsNotice({ type: "error", text: t('extras.shutdownNoSession') })
      return
    }
    // Windows: shutdown /s /t 0 · Linux: fallback shutdown -h now
    api.sendShell(config, selectedSession.id, "shutdown /s /t 0 || shutdown -h now", selectedSession.directory)
      .then(() => {
        setSettingsNotice({ type: "success", text: t('extras.shutdownSent') })
      })
      .catch((err: Error) => {
        setSettingsNotice({ type: "error", text: t('extras.shutdownFailed', { error: err.message }) })
      })
  }, [selectedSession, config, t, setSettingsNotice])

  const handleRestartHost = useCallback(() => {
    if (!selectedSession || !config) {
      setSettingsNotice({ type: "error", text: t('extras.shutdownNoSession') })
      return
    }
    // Windows: shutdown /r /t 10 (delay para que responda el request) · Linux: fallback
    api.sendShell(config, selectedSession.id, 'shutdown /r /t 10 /c "OpenCode Mobile: reinicio programado" || shutdown -r +1', selectedSession.directory)
      .then(() => {
        setSettingsNotice({ type: "success", text: t('extras.restartSent') })
      })
      .catch((err: Error) => {
        setSettingsNotice({ type: "error", text: t('extras.restartFailed', { error: err.message }) })
      })
  }, [selectedSession, config, t, setSettingsNotice])

  const handleOpenGitHub = useCallback(() => {
    window.open("https://github.com/Owning01/Opencode-Mobile", "_system")
  }, [])

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
      const target = renderedMessages.find((m) => m.info.id === messageID)
      await api.revert(config, selectedSession.id, messageID, selectedSession.directory)
      setLocalRevertID(messageID)
      await loadSelected(selectedSession.id, selectedSession.directory)
      await refreshSessions()
      if (target?.text) setComposer(target.text)
    } catch (err) {
      setRuntimeError((err as Error).message)
    }
  }, [selectedSession, config, awaitingAssistantReply, loadSelected, refreshSessions, renderedMessages])

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

  const handleCompact = useCallback(async () => {
    if (!selectedSession || !activeModel) return
    setCompacting(true)
    setAwaitingAssistantReply(true)
    completionShouldPlayRef.current = true
    try {
      await compactSession(selectedSession.id, selectedSession.directory, activeModel.providerID, activeModel.modelID, refreshSessions, () => loadSelected(selectedSession.id, selectedSession.directory))
    } finally {
      setCompacting(false)
      setAwaitingAssistantReply(false)
    }
  }, [selectedSession, activeModel, compactSession, refreshSessions, loadSelected, setCompacting, setAwaitingAssistantReply, completionShouldPlayRef])

  const handleDeleteMany = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return
    for (const id of ids) {
      const s = sessions.find((x) => x.id === id)
      await api.deleteSession(config, id, s?.directory).catch(() => undefined)
    }
    if (selectedID && ids.includes(selectedID)) setSelectedID(null)
    await refreshSessions(true).catch(() => undefined)
  }, [sessions, config, selectedID, refreshSessions, setSelectedID])

  const handleArchiveMany = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return
    for (const id of ids) {
      const s = sessions.find((x) => x.id === id)
      if (s) await api.sendCommand(config, id, "/archive", "", s.directory).catch(() => undefined)
    }
    await refreshSessions(true).catch(() => undefined)
  }, [sessions, config, refreshSessions])

  const sessionsView = (
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
        dataMode={dataMode}
        onSelectProject={setSelectedProjectDir}
        onQueryChange={setQuery}
        onRefresh={refreshSessionsWithIndicator}
        onNewSession={handleOpenNewSession}
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
        onDismissRecent={dismissRecent}
        onNewSessionHere={(dir) => handleCreateSession(dir)}
        onDragStartSession={handleSessionDragStart}
        onDeleteMany={handleDeleteMany}
        onArchiveMany={flags.sessionArchive ? handleArchiveMany : undefined} />
      {showNewSessionPicker && (
        <Suspense fallback={null}>
          <FolderPicker
            pickerDir={pickerDir} pickerItems={pickerItems}
            pickerLoading={pickerLoading} pickerError={pickerError}
            creatingSession={creatingSession}
            projects={sessions.map((s) => s.directory)}
            onBrowse={browseNewSessionDirectory}
            onCreate={async (dir) => {
              try {
                await handleCreateSession(dir)
              } catch (err) {
                setPickerError((err as Error).message)
              }
            }}
            onCreateDefault={() => handleCreateSession("")}
            onClose={() => setShowNewSessionPicker(false)} />
          </Suspense>
      )}
    </>
  )

  // Memoizado: un objeto literal por render re-renderiza todo el árbol del
  // chat (SessionChatPanel/ChatView) con cada setState global.
  const baseChatProps: ChatViewProps = useMemo(() => ({
    selectedSession,
    revertID: localRevertID,
    messages: renderedMessages, todos,
    todosExpanded, composer,
    isWorking, showTypingBubble,
    loadingSessionID, selectedID,
    messageScrollSignature, view,
    dataMode,
    renamingSessionID, renameValue,
    commands,
    activeAgent, activeAgentID,
    activeModelOption,
    activeModelVariants,
    selectedVariant,
    onChangeVariant: (variant: string | null, sessionID?: string) => changeVariant(variant, sessionID ?? selectedSession?.id),
    getModelForSession,
    primaryAgentOptions,
    allAgentOptions: agentOptions,
    onChangeAgent: (id) => changeAgent(id, selectedSession?.directory),
    projectName,
    onStartRename: startRename,
    onRenameChange: setRenameValue,
    onRenameConfirm: renameSession,
    onRenameCancel: cancelRename,
    onComposerChange: setComposer,
    onSend: (imgs) => handleSend(imgs),
    onAbort: handleAbort,
    onTodosToggle: () => setTodosExpanded((v) => !v),
    onBackToSessions: goBack,
    onSheetOpen: setActiveDetailSheet,
    recentSessions, sessions,
    onOpenSession: handleOpenSession,
    readingMode, onToggleReadingMode: () => setReadingMode((v) => !v),
    onExportChat: handleExportChat, onExportMarkdown: handleExportMarkdown, onSnapshot: handleSnapshot,
    onEditFile: (file) => setFileEditorPath(file),
    onOpenSettings: () => navigate("settings"),
    onThemeCommand: () => setShowThemePicker(true),
    config,
    agents: agentOptions,
    onShellSend: (cmd) => {
      if (selectedSession) {
        if (connectionState === "offline") {
          queueAction({ type: "shell", sessionID: selectedSession.id, directory: selectedSession.directory, payload: cmd })
        } else {
          shellExecute(cmd, selectedSession.id, selectedSession.directory)
        }
      }
    },
    flags,
    onToggleFlag: toggleFlag,
    onSetFlag: setFlag,
    diffFiles,
    onOpenADEDiff: handleOpenADEDiff,
    projectDashboard,
    streamState,
    compacting,
    pendingQuestions,
    permissionRequest,
    onQuestionReply: handleQuestionReply,
    onQuestionReject: handleQuestionReject,
    onPermissionApprove: handlePermissionApprove,
    onPermissionReject: handlePermissionReject,
    onDismissQuestion: handleDismissQuestion,
    onDismissPermission: handleDismissPermission,
    onRevertToMessage: handleRevertToMessage,
    onEditMessage: handleEditMessage,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onCompact: handleCompact,
    onForkSession: () => selectedSession && handleCreateSession(selectedSession.directory),
    onOpenFileBrowser: () => selectedSession && fb.open(),
    fileBrowserPath: fb.currentPath,
    onOpenTerminal: () => setShowTerminal(true),
    onOpenMCPBrowser: () => setShowMCPBrowser(true),
    onOpenRemoteDesktop: () => {
      setDesktopCfg(loadDesktopConfig())
      setShowRemoteDesktop(true)
    },
    showTodoButton: chatSettings.showTodoButton,
    snippets: promptSnippets,
    charLimit: chatSettings.composerCharLimit,
    compactTools: chatSettings.compactTools,
    thinkingDefault: chatSettings.thinkingDefault,
    onRegenerate: handleRegenerate,
    onInsertPrompt: handleInsertPrompt,
    onSendPrompt: handleSendPrompt,
    chatSettings,
    onChatSettingChange: setChatSetting,
    onResetChatSettings: resetChatSettings,
  }), [
    selectedSession, localRevertID, renderedMessages, todos, todosExpanded, composer,
    isWorking, showTypingBubble, loadingSessionID, selectedID, messageScrollSignature,
    view, dataMode, renamingSessionID, renameValue, commands,
    activeAgent, activeAgentID, activeModelOption, activeModelVariants, selectedVariant, changeVariant, primaryAgentOptions, changeAgent,
    projectName, startRename, setRenameValue, renameSession, cancelRename, setComposer,
    handleSend, handleAbort, setTodosExpanded, goBack, setActiveDetailSheet,
    recentSessions, sessions, handleOpenSession, readingMode, setReadingMode,
    handleExportChat, handleExportMarkdown, handleSnapshot, setFileEditorPath, navigate,
    setShowThemePicker, config, agentOptions, connectionState, queueAction, shellExecute,
    flags, toggleFlag, setFlag, diffFiles, projectDashboard, streamState, compacting,
    pendingQuestions, permissionRequest, handleQuestionReply, handleQuestionReject,
    handlePermissionApprove, handlePermissionReject, handleDismissQuestion,
    handleDismissPermission, handleRevertToMessage, handleEditMessage, handleUndo,
    handleRedo, handleCompact, handleCreateSession, fb, setShowTerminal,
    setShowMCPBrowser, setShowRemoteDesktop, chatSettings, setChatSetting, resetChatSettings,
    promptSnippets, handleRegenerate, handleInsertPrompt, handleSendPrompt,
  ])

  const activeSessionSid = isDesktop ? desktopLayout.sessions[Math.min(activePanel, desktopLayout.sessions.length - 1)] : selectedSession?.id
  const currentActiveSession = (activeSessionSid ? sessions.find((s) => s.id === activeSessionSid) : null)
    ?? selectedSession
    ?? (desktopLayout.sessions.find(Boolean) ? sessions.find((s) => s.id === desktopLayout.sessions.find(Boolean)) : null)
    ?? sessions[0]
    ?? null
  const activeSessionDir = currentActiveSession?.directory ?? selectedSession?.directory ?? sessions[0]?.directory ?? undefined

  const handleOpenFileFromExplorer = useCallback((filePath: string) => {
    if (isDesktop) {
      const existingEditorIdx = desktopLayout.panelKinds.findIndex((k) => k === "editor")
      if (existingEditorIdx >= 0) {
        setDesktopLayout((prev) => ({
          ...prev,
          panelEditorPaths: { ...(prev.panelEditorPaths ?? {}), [existingEditorIdx]: filePath },
        }))
        setActivePanel(existingEditorIdx)
        return
      }

      const hasActiveSession = desktopLayout.sessions.some(Boolean)
      if (hasActiveSession) {
        if (desktopLayout.cols === 1) {
          setDesktopLayout((prev) => ({
            ...prev,
            cols: 2,
            colSizes: [null, null],
            panelKinds: [prev.panelKinds[0] ?? "session", "editor"],
            panelEditorPaths: { ...(prev.panelEditorPaths ?? {}), 1: filePath },
          }))
          setActivePanel(1)
        } else {
          const targetPanel = activePanel === 0 ? 1 : activePanel
          setDesktopLayout((prev) => ({
            ...prev,
            panelKinds: prev.panelKinds.map((k, idx) => (idx === targetPanel ? "editor" : k)),
            panelEditorPaths: { ...(prev.panelEditorPaths ?? {}), [targetPanel]: filePath },
          }))
          setActivePanel(targetPanel)
        }
      } else {
        setDesktopLayout((prev) => ({
          ...prev,
          cols: 1,
          colSizes: [null],
          panelKinds: ["editor"],
          panelEditorPaths: { ...(prev.panelEditorPaths ?? {}), 0: filePath },
        }))
        setActivePanel(0)
      }
    } else {
      setFileEditorPath(filePath)
    }
  }, [isDesktop, desktopLayout, activePanel])

  const detailView = <ChatView {...baseChatProps} />

  return (
    <div className="app-shell" data-navbar="header" ref={shellRef}
      style={isDesktop ? { gridTemplateColumns: `48px ${sidebarCollapsed ? "0px" : `${sidebarWidth}px`} minmax(0, 1fr)${desktopDiffOpen ? ` ${desktopDiffWidth}px` : ""}` } : undefined}>
      {!isDesktop && view !== "detail" && (
        <NavBar variant="top" view={view} onNavigate={handleNavigate}
          onToggleLightMode={handleToggleLightMode} />
      )}

      {isDesktop && (
        <nav className="app-desktop-activity" aria-label="Actividades">
          <div className="app-desktop-activity-top">
            <button type="button" className={`activity-btn${activity === "sessions" ? " active" : ""}`} title={t('shell.kindSession')} aria-label={t('shell.kindSession')}
              onClick={() => { if (activity === "sessions") setSidebarCollapsed(!sidebarCollapsed); else { setActivity("sessions"); setSidebarCollapsed(false) } }}>
              <ChatIcon size={18} /></button>
            <button type="button" className={`activity-btn${activity === "explorer" ? " active" : ""}`} title={t('shell.kindExplorer')} aria-label={t('shell.kindExplorer')}
              onClick={() => { if (activity === "explorer") setSidebarCollapsed(!sidebarCollapsed); else { setActivity("explorer"); setSidebarCollapsed(false) } }}>
              <FolderIcon size={18} /></button>
            <button type="button" className={`activity-btn${showTerminal ? " active" : ""}`} title={t('session.terminal')} aria-label={t('session.terminal')}
              onClick={() => setShowTerminal((v) => !v)}>
              <TerminalIcon size={18} /></button>
            <button type="button" className={`activity-btn${activity === "stats" ? " active" : ""}`} title={t('shell.kindStats')} aria-label={t('shell.kindStats')}
              onClick={() => {
                addPanel("stats")
              }}>
              <StatsIcon size={18} /></button>
            <button type="button" className={`activity-btn${activity === "kanban" ? " active" : ""}`} title={t('shell.kindKanban')} aria-label={t('shell.kindKanban')}
              onClick={() => { if (activity === "kanban") setSidebarCollapsed(!sidebarCollapsed); else { setActivity("kanban"); setSidebarCollapsed(false) } }}>
              <LayersIcon size={18} /></button>
            <button type="button" className={`activity-btn${activity === "docs" ? " active" : ""}`} title={t('shell.kindDocs')} aria-label={t('shell.kindDocs')}
              onClick={() => { if (activity === "docs") setSidebarCollapsed(!sidebarCollapsed); else { setActivity("docs"); setSidebarCollapsed(false) } }}>
              <HelpIcon size={18} /></button>
            <button type="button" className={`activity-btn${activity === "updates" ? " active" : ""}`} title={t('shell.kindUpdates')} aria-label={t('shell.kindUpdates')}
              onClick={() => { if (activity === "updates") setSidebarCollapsed(!sidebarCollapsed); else { setActivity("updates"); setSidebarCollapsed(false) } }}>
              <GithubIcon size={18} /></button>
            <button type="button" className={`activity-btn${activity === "labs" ? " active" : ""}`} title={t('shell.kindLabs')} aria-label={t('shell.kindLabs')}
              onClick={() => { if (activity === "labs") setSidebarCollapsed(!sidebarCollapsed); else { setActivity("labs"); setSidebarCollapsed(false) } }}>
              <TestIcon size={18} /></button>
          </div>
          <div className="app-desktop-activity-bottom">
            <button type="button" className={`activity-btn${view === "settings" ? " active" : ""}`} title={t('nav.settings') || "Configuración"} aria-label={t('nav.settings') || "Configuración"}
              onClick={() => {
                if (view === "settings") {
                  handleNavigate(desktopLayout.sessions.some(Boolean) ? "detail" : "sessions")
                } else {
                  handleNavigate("settings")
                }
              }}>
              <SettingsIcon size={18} /></button>
            <button type="button" className="activity-btn" title={t('desktop.collapseSidebar')} aria-label={t('desktop.collapseSidebar')}
              onClick={() => setSidebarCollapsed(true)}>«</button>
          </div>
        </nav>
      )}

      {isDesktop && (
        <aside className={`app-desktop-sidebar${sidebarCollapsed ? " collapsed" : ""}`}>
          {sidebarCollapsed ? (
            <div className="desktop-sidebar-rail">
              <button type="button" className="btn-icon compact" title={t('desktop.expandSidebar')} aria-label={t('desktop.expandSidebar')} onClick={() => setSidebarCollapsed(false)}>»</button>
            </div>
          ) : (
            <>
              <div className="desktop-sidebar-header">
                <span className="desktop-sidebar-title">
                  {activity === "sessions" ? "Opencode"
                    : activity === "explorer" ? t('shell.kindExplorer')
                    : activity === "stats" ? t('shell.kindStats')
                    : activity === "kanban" ? t('shell.kindKanban')
                    : activity === "docs" ? t('shell.kindDocs')
                    : activity === "updates" ? t('shell.kindUpdates')
                    : activity === "labs" ? t('shell.kindLabs')
                    : t('shell.kindConfig')}
                </span>
                <span className="desktop-sidebar-actions">
                  <button type="button" className="btn-icon compact" title={t('desktop.collapseSidebar')} aria-label={t('desktop.collapseSidebar')} onClick={() => setSidebarCollapsed(true)}>«</button>
                </span>
              </div>
              <div className="desktop-sidebar-body">
                {activity === "sessions" ? sessionsView
                  : activity === "explorer" ? <ExplorerPanel onOpenSessionDir={openSessionInDir} initialCwd={activeSessionDir} onOpenFile={handleOpenFileFromExplorer} />
                  : activity === "stats" ? <StatsPanel />
                  : activity === "kanban" ? <KanbanPanel />
                  : activity === "docs" ? <DocsPanel />
                  : activity === "updates" ? <UpdatesPanel />
                  : activity === "labs" ? <LabsPanel />
                  : <ConfigPanel />}
              </div>
              <div className="desktop-sidebar-resizer" onPointerDown={startSidebarResize} title={t('desktop.resizeSidebar')} />
            </>
          )}
        </aside>
      )}

      <main className={isDesktop ? "app-desktop-content" : "app-mobile-content"}>
        {view === "sessions" && !isDesktop && sessionsView}

        {isDesktop && (view === "sessions" || view === "detail") && (
          (() => {
            const gridCols: Array<number | null | "handle"> = []
            if (desktopLayout.cols === 1) {
              gridCols.push(null)
            } else {
              desktopLayout.colSizes.forEach((s, i) => {
                if (i > 0) gridCols.push("handle")
                gridCols.push(s)
              })
            }
            const gridRows: Array<number | null | "handle"> = []
            if (desktopLayout.rows === 1) {
              gridRows.push(null)
            } else {
              desktopLayout.rowSizes.forEach((s, i) => {
                if (i > 0) gridRows.push("handle")
                gridRows.push(s)
              })
            }
            const startColResize = (colIndex: number) => (e: React.PointerEvent<HTMLDivElement>) => {
              e.preventDefault()
              const startX = e.clientX
              const startSize = desktopLayout.colSizes[colIndex]
                ?? (e.currentTarget.parentElement!.getBoundingClientRect().width / desktopLayout.cols)
              const sizes = [...desktopLayout.colSizes]
              document.body.style.userSelect = "none"
              document.body.style.cursor = "col-resize"
              const apply = () => {
                if (!gridRef.current) return
                const cols: Array<number | null | "handle"> = []
                sizes.forEach((s, i) => { if (i > 0) cols.push("handle"); cols.push(s) })
                gridRef.current.style.gridTemplateColumns = cols.map((x) => x === "handle" ? "6px" : x ? `${x}px` : "1fr").join(" ")
              }
              const onMove = (ev: PointerEvent) => {
                sizes[colIndex] = Math.max(220, Math.min(900, startSize + (ev.clientX - startX)))
                apply()
              }
              const onUp = () => {
                document.body.style.userSelect = ""
                document.body.style.cursor = ""
                window.removeEventListener("pointermove", onMove)
                window.removeEventListener("pointerup", onUp)
                setDesktopLayout((prev) => ({ ...prev, colSizes: sizes }))
              }
              window.addEventListener("pointermove", onMove)
              window.addEventListener("pointerup", onUp)
            }
            const startRowResize = (rowIndex: number) => (e: React.PointerEvent<HTMLDivElement>) => {
              e.preventDefault()
              const startY = e.clientY
              const startSize = desktopLayout.rowSizes[rowIndex]
                ?? (e.currentTarget.parentElement!.getBoundingClientRect().height / desktopLayout.rows)
              const sizes = [...desktopLayout.rowSizes]
              document.body.style.userSelect = "none"
              document.body.style.cursor = "row-resize"
              const apply = () => {
                if (!gridRef.current) return
                const rows: Array<number | null | "handle"> = []
                sizes.forEach((s, i) => { if (i > 0) rows.push("handle"); rows.push(s) })
                gridRef.current.style.gridTemplateRows = rows.map((x) => x === "handle" ? "6px" : x ? `${x}px` : "1fr").join(" ")
              }
              const onMove = (ev: PointerEvent) => {
                sizes[rowIndex] = Math.max(200, Math.min(800, startSize + (ev.clientY - startY)))
                apply()
              }
              const onUp = () => {
                document.body.style.userSelect = ""
                document.body.style.cursor = ""
                window.removeEventListener("pointermove", onMove)
                window.removeEventListener("pointerup", onUp)
                setDesktopLayout((prev) => ({ ...prev, rowSizes: sizes }))
              }
              window.addEventListener("pointermove", onMove)
              window.addEventListener("pointerup", onUp)
            }
            const cells = Array.from({ length: desktopLayout.cols * desktopLayout.rows }).map((_, i) => {
              const kind = desktopLayout.panelKinds[i] ?? "session"
              const sid = desktopLayout.sessions[i]
              const session = sid ? sessions.find((s) => s.id === sid) ?? null : null
              const col = i % desktopLayout.cols
              const row = Math.floor(i / desktopLayout.cols)
              const placement = { gridColumn: col * 2 + 1, gridRow: row * 2 + 1 }
              // Terminales: arrancan en la ruta de la sesión del panel activo
              // (selectedSession no se setea en desktop; cada panel gestiona
              // su propia sesión).
              const activeSid = desktopLayout.sessions[Math.min(activePanel, desktopLayout.sessions.length - 1)]
              const activeDir = activeSid ? sessions.find((s) => s.id === activeSid)?.directory ?? undefined : undefined
              if (kind === "session") {
                if (!session) {
                  return (
                    <div key={`ph-${i}`} className="desktop-cell-placeholder" style={placement} onClick={() => setActivePanel(i)}>
                      <button type="button" className="btn-icon compact desktop-cell-close"
                        title="Close split" aria-label="Close split"
                        onClick={(e) => { e.stopPropagation(); closePanel(i) }}>×</button>
                      <FolderIcon size={48} className="icon-empty-state" />
                      <p>{t('sessions.selectOne')}</p>
                    </div>
                  )
                }
                return (
                  <div key={`panel-${i}`} style={placement} className="desktop-cell">
                    <SessionChatPanel
                      session={session}
                      config={config!}
                      dataMode={dataMode}
                      baseProps={baseChatProps}
                      active={activePanel === i}
                      connectionState={connectionState}
                      panelIndex={i}
                      onActivate={() => setActivePanel(i)}
                      onClose={() => { closePanel(i); if (maximizedPanel === i) setMaximizedPanel(null) }}
                      onSplitSession={handleDockSession}
                      onSettled={settleSession}
                      onRefreshSessions={refreshSessions}
                      onSetCommands={setCommands}
                      onRecordPrompt={recordPrompt}
                      onQueueAction={queueAction}
                      onShellExecute={shellExecute}
                      onChangeAgentGlobal={changeAgent}
                      onOpenInThisPanel={(id) => openInPanel(i, id)}
                      onSwapPanels={handleSwapPanels} />
                  </div>
                )
              }
              if (kind === "editor") {
                const editorPath = desktopLayout.panelEditorPaths?.[i]
                return (
                  <div key={`panel-${i}`} style={placement} className="desktop-cell" onClick={() => setActivePanel(i)}>
                    <FileEditorPanel
                      path={editorPath || ""}
                      initialCwd={activeSessionDir}
                      onClose={() => closePanel(i)}
                    />
                  </div>
                )
              }
              // Paneles de la shell (terminal, explorador, kanban, docs...)
              return (
                <div key={`panel-${i}`} style={placement} className="desktop-cell" onClick={() => setActivePanel(i)}>
                  <ShellPanelCell
                    index={i}
                    kind={kind}
                    cwd={kind === "terminal" ? activeDir : session?.directory ?? undefined}
                    sessionID={session?.id}
                    active={activePanel === i}
                    onActivate={() => setActivePanel(i)}
                    onClose={() => closePanel(i)}
                    onOpenSessionDir={openSessionInDir}
                    onSplitSession={handleDockSession}
                    onSwapPanels={handleSwapPanels}
                  />
                </div>
              )
            })
            const colHandles = desktopLayout.cols > 1
              ? Array.from({ length: desktopLayout.cols - 1 }).map((_, h) => (
                <div key={`ch-${h}`} className="desktop-resize-col" style={{ gridColumn: h * 2 + 2, gridRow: "1 / -1" }}
                  onPointerDown={startColResize(h)} />
              ))
              : null
            const rowHandles = desktopLayout.rows > 1
              ? Array.from({ length: desktopLayout.rows - 1 }).map((_, h) => (
                <div key={`rh-${h}`} className="desktop-resize-row" style={{ gridRow: h * 2 + 2, gridColumn: "1 / -1" }}
                  onPointerDown={startRowResize(h)} />
              ))
              : null
            const maximizedIndex = maximizedPanel !== null && maximizedPanel < desktopLayout.cols * desktopLayout.rows
              ? maximizedPanel : null
            const maximizedSession = maximizedIndex !== null
              ? sessions.find((s) => s.id === desktopLayout.sessions[maximizedIndex]) ?? null
              : null
            return (
              <div className="desktop-layout-area">
                {maximizedSession && maximizedIndex !== null ? (
                  <div className="desktop-maximized">
                    <SessionChatPanel
                      session={maximizedSession}
                      config={config!}
                      dataMode={dataMode}
                      baseProps={baseChatProps}
                      active={activePanel === maximizedIndex}
                      connectionState={connectionState}
                      panelIndex={maximizedIndex}
                      onActivate={() => setActivePanel(maximizedIndex)}
                      onClose={() => { closePanel(maximizedIndex); setMaximizedPanel(null) }}
                      onSplitSession={handleDockSession}
                      onSettled={settleSession}
                      onRefreshSessions={refreshSessions}
                      onSetCommands={setCommands}
                      onRecordPrompt={recordPrompt}
                      onQueueAction={queueAction}
                      onShellExecute={shellExecute}
                      onChangeAgentGlobal={changeAgent}
                      onOpenInThisPanel={(id) => openInPanel(maximizedIndex, id)}
                      onSwapPanels={handleSwapPanels} />
                  </div>
                ) : (
                  <div className="desktop-grid" ref={gridRef}
                    data-cols={desktopLayout.cols}
                    style={{
                      gridTemplateColumns: gridCols.map((x) => x === "handle" ? "6px" : x ? `${x}px` : "minmax(0, 1fr)").join(" "),
                      gridTemplateRows: gridRows.map((x) => x === "handle" ? "6px" : x ? `${x}px` : "minmax(0, 1fr)").join(" "),
                    }}>
                    {cells}
                    {colHandles}
                    {rowHandles}
                  </div>
                )}
              </div>
            )
          })()
        )}

        {view === "detail" && !isDesktop && detailView}

      {view === "settings" && (
        <SettingsPanel
          draftConfig={draftConfig} onChange={setDraftConfig}
          onTest={handleTest}
          testingConnection={testingConnection}
          canTestDraft={canTestDraft}
          testAlreadyPassedForDraft={testAlreadyPassedForDraft}
          connectedVersion={connectedVersion} settingsNotice={settingsNotice}
          language={language} onLanguageChange={handleLanguageChange}
          theme={theme} onThemeChange={setTheme}
          languageOptions={languageOptions}
          dataMode={dataMode} onDataModeChange={changeDataMode}
          onNavigate={handleNavigate}
          modelOptions={modelOptions} selectedModelKey={selectedModelKey}
          onChangeModel={changeModel} modelKey={modelKey}
          selectedVariant={selectedVariant}
          stats={stats} onResetStats={resetStats}
          activeModelOption={activeModelOption}
          blockedModels={blockedModels}
          onOpenThemePicker={() => setShowThemePicker(true)}
          onOpenThemeCreator={() => setShowThemeCreator(true)}
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
          serverProfiles={serverProfiles}
          onAddServerProfile={(name, _kind, config) => addProfile(name, { config })}
          onAddPairServer={(name, config) => {
            const profile = addProfile(name, { config, kind: "pair" })
            if (profile) {
              setActiveServerProfileID(profile.id)
              localStorage.setItem("opencode.mobile.activeServer", profile.id)
              setDraftConfig(config)
              saveConfig(t)
            }
          }}
          onRemoveServerProfile={(id) => {
            removeProfile(id)
            if (activeServerProfileID === id) {
              setActiveServerProfileID(null)
              localStorage.removeItem("opencode.mobile.activeServer")
            }
          }}
          onUpdateServerProfile={(id, name, config) => updateProfile(id, { name, config })}
          onApplyServerProfile={applyServerProfile}
          activeServerProfileID={activeServerProfileID}
          chatSettings={chatSettings}
          onChatSettingChange={setChatSetting}
          onResetChatSettings={resetChatSettings}
          snippets={promptSnippets}
          onAddSnippet={addSnippet}
          onRemoveSnippet={removeSnippet}
          onShutdownHost={handleShutdownHost}
          onRestartHost={handleRestartHost}
          onOpenGitHub={handleOpenGitHub}
          onOpenFavoritesManager={() => setShowFavoritesManager(true)}
          onOpenArchivedView={() => setShowArchivedView(true)}
          onOpenShortcuts={() => setShowShortcuts(true)}
          onClose={() => {
            if (navStackRef.current.length > 0) goBack()
            else handleNavigate(desktopLayout.sessions.some(Boolean) ? "detail" : "sessions")
          }} />
      )}

      {view === "help" && (
        <Suspense fallback={null}>
          <HelpPage
            helpPage={helpPage}
            onHelpPageChange={setHelpPage}
            commands={commands}
            commandFilter={commandFilter}
            onCommandFilterChange={setCommandFilter} />
        </Suspense>
      )}

        {isDesktop && showTerminal && terminalDocked && (
          <Suspense fallback={null}>
            <TerminalView
              lines={shellLines}
              running={shellRunning}
              sessionID={currentActiveSession?.id || selectedSession?.id || ""}
              directory={activeSessionDir || selectedSession?.directory || ""}
              shell={terminalShell}
              onShellChange={setTerminalShell}
              onExecute={shellExecute}
              onClear={shellClear}
              onClose={() => setShowTerminal(false)}
              history={shellHistory}
              isDocked={true}
              onToggleDock={() => setTerminalDocked(false)}
              height={terminalHeight}
              onResizeHeight={setTerminalHeight}
            />
          </Suspense>
        )}
      </main>

      {isDesktop && desktopDiffOpen && (
        <ADEDiffPanel
          diffs={desktopDiffData?.diffs ?? (diffFiles.length > 0 ? diffFiles.map((d) => ({ file: d.file, patch: "", additions: d.additions, deletions: d.deletions })) : [])}
          files={diffFiles}
          config={config}
          sessionID={selectedSession?.id}
          directory={selectedSession?.directory}
          initialFile={desktopDiffData?.selectedFile}
          onClose={() => setDesktopDiffOpen(false)}
          onEditFile={(file) => setFileEditorPath(file)}
          onResize={(w) => setDesktopDiffWidth(w)}
        />
      )}

      <BottomSheet
        activeSheet={activeDetailSheet}
        onClose={() => setActiveDetailSheet(null)}
        modelOptions={modelOptions}
        modelLoadError={modelLoadError}
        activeModelOption={activeModelOption}
        variantGroups={filteredVariantGroups}
        modelQuery={modelQuery}
        isWorking={isWorking}
        onChangeModel={(key, variant) => changeModel(key, variant, selectedSession?.id)}
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
        dashboardError={dashboardError}
        config={config}
        onVariantsChanged={() => loadModels(selectedSession?.directory).catch(() => undefined)} />

      {sessionToDelete && (
        <ConfirmModal
          session={sessionToDelete}
          onConfirm={(id) => { deleteSession(id).catch(() => undefined) }}
          onCancel={() => setSessionToDelete(null)} />
      )}

      {showThemePicker && (
        <Suspense fallback={null}>
          <ThemePicker onClose={() => setShowThemePicker(false)} />
        </Suspense>
      )}

      {showMCPBrowser && config && <Suspense fallback={null}><MCPBrowser config={config} onClose={() => setShowMCPBrowser(false)} /></Suspense>}

      {showArchivedView && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {fileEditorPath && config && (
        <Suspense fallback={null}>
          <FileEditor
            config={config}
            path={fileEditorPath}
            directory={currentActiveSession?.directory || activeSessionDir || selectedSession?.directory}
            onClose={() => setFileEditorPath(null)}
          />
        </Suspense>
      )}

      {fb.isOpen && (
        <Suspense fallback={null}>
          <FileBrowser
            config={config}
            directory={currentActiveSession?.directory || activeSessionDir || selectedSession?.directory}
            currentPath={fb.currentPath}
            items={fb.items}
            loading={fb.loading}
            error={fb.error}
            onClose={fb.close}
            onNavigate={fb.navigateTo}
            onGoUp={fb.goUp}
            onOpenFile={(path) => { setFileEditorPath(path) }}
          />
        </Suspense>
      )}

      {showTerminal && (!isDesktop || !terminalDocked) && (
        <Suspense fallback={null}>
          <TerminalView
            lines={shellLines}
            running={shellRunning}
            sessionID={currentActiveSession?.id || selectedSession?.id || ""}
            directory={activeSessionDir || selectedSession?.directory || ""}
            shell={terminalShell}
            onShellChange={setTerminalShell}
            onExecute={shellExecute}
            onClear={shellClear}
            onClose={() => setShowTerminal(false)}
            history={shellHistory}
            isDocked={false}
            onToggleDock={() => setTerminalDocked(true)}
          />
        </Suspense>
      )}

      {showRemoteDesktop && (
        <Suspense fallback={null}>
          <RemoteDesktop
            config={desktopCfg}
            dataMode={dataMode}
            onClose={() => setShowRemoteDesktop(false)}
            onOpenSettings={() => navigate("settings")}
          />
        </Suspense>
      )}

          {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} desktop={isDesktop} />}

      <Suspense fallback={null}>
        {showThemeCreator && <ThemeCreator onClose={() => setShowThemeCreator(false)} />}
      </Suspense>

      <Suspense fallback={null}>
        {showFavoritesManager && (
          <FavoritesManager
            favorites={sessions.filter((s) => favorites.has(s.id))}
            onReorder={(ids) => {
              try { localStorage.setItem("opencode.mobile.favoritesOrder", JSON.stringify(ids)) } catch {}
            }}
            onClose={() => setShowFavoritesManager(false)}
          />
        )}
      </Suspense>

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
