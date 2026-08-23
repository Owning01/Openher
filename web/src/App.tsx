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
import { prefetchServerStats } from "./hooks/useServerStats"
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
import { OpenCodeHubModal } from "./components/OpenCodeHubModal"
import { loadShortcutsConfig, matchesShortcut, type ShortcutItem } from "./shortcuts"
import type { ViewType, HelpPage as HelpPageType, SessionView, SSEEvent, StreamState, FileDiff } from "./types"
import type { LanguageCode } from "./i18n"
import { formatLimit, extractPath, extractName, extractBranch, isSessionActive, filterByQuery } from "./utils"
import { parseDragPayload, parseDockPayload } from "./utils/drag"
import { STORAGE_KEYS, DEFAULT_STATS_PORT } from "./constants"
import { useBackButton } from "./hooks/useBackButton"
import { useNetworkMode } from "./hooks/useNetworkMode"
import { useMemoryCleanup } from "./hooks/useMemoryCleanup"
import { useMemoryUsage, formatBytes } from "./hooks/useMemoryUsage"
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
import { useQuestions } from "./hooks/useQuestions"
import { useSSEHandler } from "./hooks/useSSEHandler"
import { FolderIcon, SettingsIcon, ChatIcon, TerminalIcon, LayersIcon, StatsIcon, GlobeIcon, PencilIcon, BrainIcon } from "./Icons"
import { Capacitor } from "@capacitor/core"
import { Filesystem, Directory } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"
import { useShareReceiver } from "./hooks/useShareReceiver"
import { useServers } from "./hooks/useServers"
import { loadDesktopConfig } from "./desktop"
import type { ShellPanelKind } from "./shell"
import { shell } from "./shell"
import { TabBar } from "./components/TabBar"
import type { ServerProfile } from "./types"
import { useVisualSelection, formatSelectionForPrompt } from "./hooks/useVisualSelection"

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
const ConnectProviderSheet = lazyRetry(() => import("./components/ConnectProviderSheet").then((m) => ({ default: m.ConnectProviderSheet })))
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
const QuickChatPanel = lazyRetry(() => import("./components/QuickChatPanel").then((m) => ({ default: m.QuickChatPanel })))

// Paneles del shell desktop (shellPanels.tsx arrastra @xterm): lazy para que el
// APK móvil no descargue ni parsee terminal/browser/kanban que nunca renderiza.
const ShellPanel = lazyRetry(() => import("./components/shellPanels").then((m) => ({ default: m.ShellPanel })))
const ExplorerPanel = lazyRetry(() => import("./components/shellPanels").then((m) => ({ default: m.ExplorerPanel })))
const StatsPanel = lazyRetry(() => import("./components/shellPanels").then((m) => ({ default: m.StatsPanel })))
const KanbanPanel = lazyRetry(() => import("./components/shellPanels").then((m) => ({ default: m.KanbanPanel })))
const ConfigPanel = lazyRetry(() => import("./components/shellPanels").then((m) => ({ default: m.ConfigPanel })))
const FileEditorPanel = lazyRetry(() => import("./components/shellPanels").then((m) => ({ default: m.FileEditorPanel })))
const BrowserPanel = lazyRetry(() => import("./components/shellPanels").then((m) => ({ default: m.BrowserPanel })))
const DesignPanel = lazyRetry(() => import("./components/shellPanels").then((m) => ({ default: m.DesignPanel })))
const TerminalPanel = lazyRetry(() => import("./components/shellPanels").then((m) => ({ default: m.TerminalPanel })))
const PANEL_SUSPENSE_FALLBACK = (
  <div className="panel-loading" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>Cargando…</div>
)

type DesktopActivity = "sessions" | "explorer" | "stats" | "kanban" | "config" | "quickchat"

type DesktopLayout = {
  cols: number
  rows: number
  sessions: Array<string | null>
  panelKinds: Array<ShellPanelKind | "editor">
  panelIds: Array<string>
  panelEditorPaths?: Record<number, string>
  /** Multi-tab por celda de editor: índice de celda → lista de paths. DRY con tabStacks. */
  panelEditorTabStacks?: Record<number, string[]>
  panelEditorActive?: Record<number, number>
  panelBrowserUrls?: Record<number, string>
  colSizes: Array<number | null>
  rowSizes: Array<number | null>
}

let panelIdCounter = 0
function genPanelId(): string {
  panelIdCounter += 1
  return `panel-${Date.now().toString(36)}-${panelIdCounter}`
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
  tabStacks?: Array<Array<string>>
}

function loadDesktopState(fallbackSessionID: string | null): DesktopState {
  const fallback: DesktopState = {
    layout: { cols: 1, rows: 1, sessions: [fallbackSessionID], panelKinds: ["session"], panelIds: [genPanelId()], colSizes: [null], rowSizes: [null] } as DesktopLayout,
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
      const kinds: Array<ShellPanelKind | "editor"> =
        Array.isArray(layout.panelKinds) && layout.panelKinds.length === total
          ? layout.panelKinds.map((k: any) => (k === "session" || k === "editor" || k === "terminal" || k === "explorer" || k === "kanban" || k === "stats" || k === "config" || k === "browser" || k === "doc" || k === "quickchat" ? k : "session"))
          : new Array(total).fill("session")
      // Migrate old flat sessions to tab stacks
      const tabStacks: Array<Array<string>> = layout.sessions.map((s: any) => {
        if (Array.isArray(s)) return s.filter((x: any) => typeof x === "string")
        return typeof s === "string" ? [s] : []
      })
      const rawTabStacks = raw?.tabStacks
      const finalTabStacks: Array<Array<string>> = Array.isArray(rawTabStacks) && rawTabStacks.length === total
        ? rawTabStacks.map((s: any) => Array.isArray(s) ? s.filter((x: any) => typeof x === "string") : [])
        : tabStacks
      // Stable panel ids: preserve persisted ids, else generate fresh ones
      const rawPanelIds = (layout as any).panelIds
      const panelIds: Array<string> = Array.isArray(rawPanelIds) && rawPanelIds.length === total
        ? rawPanelIds.map((p: any) => (typeof p === "string" ? p : genPanelId()))
        : new Array(total).fill(null).map(() => genPanelId())
      // Migrar editor single-path → tabStacks (DRY, sin perder datos)
      const rawEditorPaths = (layout as any).panelEditorPaths as Record<string, string> | undefined
      const rawEditorTabStacks = (layout as any).panelEditorTabStacks as Record<string, string[]> | undefined
      const rawEditorActive = (layout as any).panelEditorActive as Record<string, number> | undefined
      const editorTabStacks: Record<number, string[]> = {}
      const editorActive: Record<number, number> = {}
      if (rawEditorTabStacks && typeof rawEditorTabStacks === "object") {
        for (const [k, v] of Object.entries(rawEditorTabStacks)) {
          if (Array.isArray(v)) editorTabStacks[Number(k)] = v.filter((s: any) => typeof s === "string")
        }
      }
      if (rawEditorActive && typeof rawEditorActive === "object") {
        for (const [k, v] of Object.entries(rawEditorActive)) editorActive[Number(k)] = Number(v) || 0
      }
      if (rawEditorPaths && typeof rawEditorPaths === "object") {
        for (const [k, path] of Object.entries(rawEditorPaths)) {
          const idx = Number(k)
          if (!editorTabStacks[idx] && typeof path === "string") {
            editorTabStacks[idx] = [path]
            editorActive[idx] = 0
          }
        }
      }
      // Normalizar índices fuera de rango tras resize
      for (const k of Object.keys(editorTabStacks)) {
        if (Number(k) >= total) { delete editorTabStacks[Number(k)]; delete editorActive[Number(k)] }
      }
      return {
        layout: {
          cols: layout.cols,
          rows: layout.rows,
          sessions: layout.sessions.map((s: any) => (typeof s === "string" ? s : null)),
          panelKinds: kinds as Array<ShellPanelKind | "editor">,
          panelIds,
          panelEditorTabStacks: editorTabStacks,
          panelEditorActive: editorActive,
          // compat: mantener panelEditorPaths para lectores que aún lo usan
          panelEditorPaths: rawEditorPaths,
          panelBrowserUrls: (layout as any).panelBrowserUrls,
          colSizes: layout.cols === 1 ? [null] : (Array.isArray(layout.colSizes) && layout.colSizes.length === layout.cols ? layout.colSizes : new Array(layout.cols).fill(null)),
          rowSizes: layout.rows === 1 ? [null] : (Array.isArray(layout.rowSizes) && layout.rowSizes.length === layout.rows ? layout.rowSizes : new Array(layout.rows).fill(null)),
        },
        tabStacks: finalTabStacks,
        sidebarWidth: Math.max(200, Math.min(480, raw?.sidebarWidth ?? 340)),
        sidebarCollapsed: !!raw?.sidebarCollapsed,
        activity: (["sessions", "explorer", "stats", "kanban", "config", "design"].includes(raw?.activity ?? "") ? raw!.activity! : "sessions") as DesktopActivity,
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
  panelId,
  kind,
  cwd,
  sessionID,
  active,
  onActivate,
  onClose,
  onOpenSessionDir,
  onSplitSession,
  onSwapPanels,
  onOpenFile,
}: {
  index: number
  panelId: string
  kind: Exclude<ShellPanelKind, "session">
  cwd?: string
  sessionID?: string | null
  active: boolean
  onActivate: () => void
  onClose: () => void
  onOpenSessionDir: (dir: string) => void
  onSplitSession: (index: number, dir: "left" | "right" | "top" | "bottom" | "center", specificId?: string) => void
  onSwapPanels: (from: number, to: number) => void
  onOpenFile?: (path: string, index?: number, zone?: "left" | "right" | "top" | "bottom" | "center") => void
}) {
  const [dropZone, setDropZone] = useState<"left" | "right" | "top" | "bottom" | "center" | null>(null)

  const calcDropZone = (e: React.DragEvent<HTMLDivElement>): "left" | "right" | "top" | "bottom" | "center" => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const w = rect.width
    const h = rect.height
    if (y < h * 0.15) return "top"
    if (y > h * 0.85) return "bottom"
    if (x < w * 0.15) return "left"
    if (x > w * 0.85) return "right"
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
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const f = e.dataTransfer.files[0]
          const filePath = (f as any).path || f.name
          if (filePath) {
            onOpenFile?.(filePath, index, zone)
            return
          }
        }
        const raw = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain")
        if (raw) {
          const payload = parseDragPayload(raw)
          if (payload.kind === "panel") {
            if (payload.idx !== index) {
              if (zone === "center") {
                onSwapPanels(payload.idx, index)
              } else {
                onSplitSession(index, zone, raw)
              }
            }
          } else if (payload.kind === "session") {
            onSplitSession(index, zone, payload.id)
          } else if (payload.kind === "kind") {
            onSplitSession(index, zone, raw)
          } else if (payload.kind === "tab") {
            // Ignorar tab suelto
          } else if (payload.kind === "file") {
            onOpenFile?.(payload.path, index, zone)
          }
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
      <Suspense fallback={PANEL_SUSPENSE_FALLBACK}>
        <ShellPanel kind={kind} cwd={cwd} sessionID={sessionID} onOpenSessionDir={onOpenSessionDir} onOpenFile={(p) => onOpenFile?.(p, index, "center")} panelIndex={index} panelId={panelId} />
      </Suspense>
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
  const isDesktop = useIsDesktop()
  const handleToggleLightMode = useCallback(() => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light"
    setTheme(isLight ? "dark" : "light")
  }, [setTheme])
  const [quickChatKey, setQuickChatKey] = useState("")
  const [quickChatGroqKey, setQuickChatGroqKey] = useState("")
  const [quickChatGoKey, setQuickChatGoKey] = useState("")
  useEffect(() => {
    import("./goUsage").then(({ loadGoAccounts }) => {
      loadGoAccounts().then(keys => setQuickChatGoKey(keys[0] ?? "")).catch(() => {})
    })
    import("./shell").then(({ shell }) => {
      shell.config.get().then(c => {
        setQuickChatKey((c as any)?.cerebras_api_key ?? "")
        setQuickChatGroqKey((c as any)?.groq_api_key ?? "")
      }).catch(() => {})
    })
  }, [])
  // Recargar keys cuando QuickChatPanel guarda (sin reload) — fix "no se guarda"
  useEffect(() => {
    const reloadKeys = () => {
      import("./goUsage").then(({ loadGoAccounts }) => {
        loadGoAccounts().then(keys => setQuickChatGoKey(keys[0] ?? "")).catch(() => {})
      })
      import("./shell").then(({ shell }) => {
        shell.config.get().then(c => {
          setQuickChatKey((c as any)?.cerebras_api_key ?? "")
          setQuickChatGroqKey((c as any)?.groq_api_key ?? "")
        }).catch(() => {})
      })
    }
    window.addEventListener("quickchat:key-saved", reloadKeys)
    return () => window.removeEventListener("quickchat:key-saved", reloadKeys)
  }, [])
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
  const vs = useVisualSelection()

  // Atajo global Ctrl+Shift+C (o Cmd+Shift+C) para modo selección; Esc limpia
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey
      if (isMod && e.shiftKey && e.key.toLowerCase() === "c" && !e.altKey) {
        e.preventDefault()
        vs.toggleInspect()
      } else if (e.key === "Escape" && vs.hasSelection) {
        // Esc limpia selección si está activa, si no deja pasar al handler global
        if (!vs.inspectMode) {
          // solo limpiar si no está en inspectMode (inspectMode ya maneja Esc)
          // evitar conflicto con modales: solo si no hay modal abierto
          const hasModal = document.querySelector(".modal, .modal-dropdown")
          if (!hasModal) {
            vs.clear()
          }
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [vs])

  const filteredVariantGroups = useMemo(() => {
    const bs = blockedModels.blocked
    return {
      recentModels: variantGroups.recentModels.filter((m) => !bs.has(modelKey(m))),
      groups: new Map(Array.from(variantGroups.groups.entries()).filter(([k]) => !bs.has(k)))
    }
  }, [variantGroups, blockedModels.blocked])

  const {
    composer, setComposer,
    isSending,
    awaitingAssistantReply, setAwaitingAssistantReply,
    runtimeError, setRuntimeError,
    renderedMessages, messageScrollSignature, pendingIndex,
    completionShouldPlayRef,
    clearSession, preloadMessages, loadSelected, send, abortSession,
    setMessages, undoMessage, redoMessage, compactSession,
    applyDelta, applyPart, compacting, setCompacting, messages
  } = useMessages(config)
  const composerRef = useRef(composer)
  useEffect(() => { composerRef.current = composer }, [composer])
  const composerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // SIN debounce en el padre: el Composer ya empuja con su propio ciclo
  // (800ms tras pausa / send / clear), así que esto solo corre ~1 vez por
  // pausa de tipeo. El doble-debounce reseteado por tecla era la causa del
  // prompt cortado al enviar rápido.
  const handleComposerChange = useCallback((value: string) => {
    if (composerDebounceRef.current) {
      clearTimeout(composerDebounceRef.current)
      composerDebounceRef.current = null
    }
    composerRef.current = value
    setComposer(value)
  }, [setComposer])
  useEffect(() => () => {
    if (composerDebounceRef.current) clearTimeout(composerDebounceRef.current)
  }, [])

  const {
    todos, diffFiles, projectDashboard, dashboardError,
    todosExpanded, setTodosExpanded,
    activeDetailSheet, setActiveDetailSheet,
    totalDiffAdditions, totalDiffDeletions,
    loadTodos, loadDiffs, loadDashboard, clearSidecar
  } = useSessionSidecar(config)

  const { cacheSessions, getCachedSessions, cacheMessages, getCachedMessages } = useOfflineCache(flags)

  const loadSessionRef = useRef(0)

  const onLoadSelected = useCallback(async (id: string, dir: string) => {
    const reqId = ++loadSessionRef.current
    clearSession()
    clearSidecar()
    // Cache-first: pinta historial local de inmediato sin esperar red (móvil y desktop).
    // En v1 fijo no hay overhead de versión; el fetch de red mergea después.
    if (flags.offlineCache) {
      try {
        const cached = await getCachedMessages(id)
        if (cached && cached.length > 0 && reqId === loadSessionRef.current) {
          preloadMessages(id, cached)
        }
      } catch { /* ignore — fallback a red */ }
    }
    // Agents/models no bloquean el chat; se precargan en background.
    loadAgents(dir).catch(() => undefined)
    loadModels(dir).catch(() => undefined)
    try {
      await loadSelected(id, dir)
    } catch (e) {
      // Si la red falla pero ya se pintó cache, no vaciar.
      throw e
    }
    if (reqId !== loadSessionRef.current) return
    loadTodos(id, dir)
  }, [loadSelected, loadAgents, loadModels, loadTodos, clearSession, clearSidecar, preloadMessages, flags.offlineCache, getCachedMessages])

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
  const { providers: providerList, connecting: connectingProvider, error: providerError, connectProvider, disconnectProvider, addCustomProvider } = useProviderManager(modelOptions, config)
  const [readingMode, setReadingMode] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [showConnectSheet, setShowConnectSheet] = useState(false)
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

    // 2. Pre-cargar base de datos de stats en segundo plano (memoria + caché)
    if (config?.host) {
      void prefetchServerStats(config, DEFAULT_STATS_PORT)
    }
  }, [config?.host])

  // ===== Feature: Shortcuts =====
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => loadShortcutsConfig())
  useEffect(() => {
    const update = () => setShortcuts(loadShortcutsConfig())
    window.addEventListener("opencode-shortcuts-changed", update)
    return () => window.removeEventListener("opencode-shortcuts-changed", update)
  }, [])
  const { settings: chatSettings, setSetting: setChatSetting, resetDefaults: resetChatSettings } = useChatSettings()
  const { snippets: promptSnippets, addSnippet, removeSnippet } = usePromptSnippets()

  // ===== Feature: Theme Creator =====
  const [showThemeCreator, setShowThemeCreator] = useState(false)

  // ===== Feature: Favorites Manager =====
  const [showFavoritesManager, setShowFavoritesManager] = useState(false)
  const [showOpenCodeHub, setShowOpenCodeHub] = useState(false)

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
    let active = true
    dequeueAll().then((actions) => {
      if (!active) return
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
    return () => { active = false }
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

  // Watchdog: si el SSE cae (reconnecting) y awaitingAssistantReply
  // sigue true después de 30s, limpiar el indicador de typing (el server no
  // emitió session.idle, probablemente murió mid-stream).
  // BUG 2 fix: solo armar cuando SSE está en "reconnecting" (no en "polling"
  // que es el estado por defecto en modos saver/ultra donde SSE no está
  // habilitado — el watchdog se disparaba a los 30s aunque el server siga
  // generando, causando "se cancela automáticamente").
  useEffect(() => {
    if (!awaitingAssistantReply || sseState !== "reconnecting") return
    const t = setTimeout(() => {
      if (awaitingAssistantReply) setAwaitingAssistantReply(false)
    }, 30_000)
    return () => clearTimeout(t)
  }, [awaitingAssistantReply, sseState])

  // ===== Offline cache: persistencia de sesiones =====
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

  // ===== Questions & Permissions =====
  const {
    pendingQuestions,
    permissionRequest,
    handleQuestionReply,
    handleQuestionReject,
    handleDismissQuestion,
    handlePermissionApprove,
    handlePermissionReject,
    handleDismissPermission,
  } = useQuestions({
    config,
    directory: selectedSession?.directory,
    enabled: flags.questionAuto || flags.permissionUI,
    notify,
    t,
  })

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

  // Poll rápido durante turnos activos (sin SSE en modos saver/ultra/miser):
  // 3s cuando el server está generando O se está esperando respuesta, intervalo normal en idle.
  const baseInterval = dataMode === "full" ? (isStreamingActive ? 5000 : 3500) : dataMode === "ultra" ? 30000 : dataMode === "miser" ? 60000 : 15000
  const isActivePoll = Boolean(selectedSession && (isSessionActive(selectedSession) || awaitingAssistantReply))
  const pollInterval = isActivePoll ? Math.min(baseInterval, 3000) : baseInterval

  const pollControl = usePolling(async () => {
    // Full refresh (per-directory hydration) solo en modo full SIN SSE activo.
    // Cuando SSE streama en vivo, los deltas ya llegan por /event — el refresh
    // pesado solo satura el túnel y compite con el stream.
    // En saver/ultra/miser: light refresh (1 request) para ahorrar datos.
    const sseLive = streamState === "streaming"
    if (dataMode === "full" && !sseLive) {
      await refreshSessions(true)
    } else if (dataMode !== "full") {
      await refreshSessions(false)
    }
    if (connectionStateRef.current === "offline") {
      throw new Error("offline")
    }
    if (!selectedSession) return
    if (dataMode === "full" || dataMode === "saver" || isSessionActive(selectedSession)) {
      const prevUpdated = lastMsgFetchUpdatedRef.current[selectedSession.id]
      // El skip solo es seguro si el SSE está streamando en vivo: si está
      // caído/polling (túnel móvil), hay que fetchear siempre o la respuesta
      // del modelo nunca llega hasta que el turno termina.
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
  }, pollInterval, [config.host, config.port, config.username, config.password, dataMode, streamState, selectedSession?.id, selectedSession?.status, isStreamingActive, awaitingAssistantReply], isStreamingActive)

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
  const memInfo = useMemoryUsage(5000)

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
      const showSc = shortcuts.find((s) => s.id === "show_shortcuts" && s.enabled)
      if (showSc && matchesShortcut(e, showSc.keys) && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setShowShortcuts(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [shortcuts])

  const handleLanguageChange = useCallback((lang: LanguageCode) => {
    setLanguage(lang)
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang)
  }, [setLanguage])

  const handleSend = useCallback(async (images?: Array<{ base64: string; mime: string }>, options?: { translate?: boolean }, text?: string) => {
    if (!selectedSession) return
    // El texto SIEMPRE llega explícito desde el sender (localValueRef del
    // Composer); composerRef es solo fallback defensivo.
    const composerText = text ?? composerRef.current
    if (connectionState === "offline") {
      queueAction({ type: "prompt", sessionID: selectedSession.id, directory: selectedSession.directory, payload: composerText })
      setComposer("")
      setRuntimeError("Prompt queued - will send when connection is restored")
      return
    }
    let textToSend = composerText
    let originalText: string | null = null
    if (options?.translate && composerText.trim()) {
      try {
        const { translateToEnglish } = await import("./utils/translate")
        const translated = await translateToEnglish(composerText)
        if (translated !== composerText) {
          originalText = composerText
          textToSend = translated
          setComposer(translated)
        }
      } catch (err) {
        setRuntimeError(`Translation failed: ${(err as Error).message}`)
        return
      }
    }
    // Scropear prompt a zona seleccionada visualmente (si existe)
    const hadVisualSelection = vs.hasSelection && !!vs.promptContext
    if (hadVisualSelection) {
      textToSend = formatSelectionForPrompt(textToSend, vs.promptContext)
    }
    recordPrompt(textToSend)
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
      setCommands, setRuntimeError, images, textToSend, setLocalRevertID, originalText ?? undefined)
    if (hadVisualSelection && result !== false) {
      vs.clear()
      vs.clearAnnotations()
    }
    if (result === "help") { setHelpPage("commands"); navigate("help") }
    if (result === "themes") { navigate("settings"); setShowThemePicker(true) }
    if (result === "connect") setShowConnectSheet(true)
    return typeof result === "boolean" ? result : true
    // Primitivos, no el objeto `vs` (identidad nueva por render → invalidaba
    // handleSend → baseChatProps → todo el árbol del chat por keystroke).
  }, [selectedSession, activeModel, activeAgentID, commands, send, refreshSessions, loadSelected, setSessions, connectionState, queueAction, setRuntimeError, setComposer, localRevertID, setMessages, navigate, setHelpPage, setShowThemePicker, setShowConnectSheet, vs.hasSelection, vs.promptContext, vs.clear])

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
      // BUG 4 fix: abortSession tiene un race de 4s que puede dejar el HTTP
      // abort en vuelo cuando ya se envió el nuevo prompt → el server cancela
      // el mensaje recién enviado. Llamamos api.abort directamente.
      completionShouldPlayRef.current = false
      await api.abort(config, selectedSession.id, selectedSession.directory).catch(() => undefined)
    }
    setAwaitingAssistantReply(false)
    await send(selectedSession, activeModel, activeAgentID, commands,
      () => refreshSessions(),
      () => loadSelected(selectedSession.id, selectedSession.directory).then(() => undefined),
      setCommands, setRuntimeError, undefined, lastUser.text, setLocalRevertID)
  }, [selectedSession, renderedMessages, localRevertID, awaitingAssistantReply, config, send, activeModel, activeAgentID, commands, refreshSessions, loadSelected, setCommands, setRuntimeError, setMessages])

  const handleInsertPrompt = useCallback((text: string) => {
    setComposer(text)
    navigate("detail")
  }, [setComposer, navigate])

  const handleSendPrompt = useCallback(async (text: string) => {
    if (!selectedSession || !text.trim()) return
    if (awaitingAssistantReply) {
      completionShouldPlayRef.current = false
      await api.abort(config, selectedSession.id, selectedSession.directory).catch(() => undefined)
    }
    setAwaitingAssistantReply(false)
    await send(selectedSession, activeModel, activeAgentID, commands,
      () => refreshSessions(),
      () => loadSelected(selectedSession.id, selectedSession.directory).then(() => undefined),
      setCommands, setRuntimeError, undefined, text, setLocalRevertID)
  }, [selectedSession, awaitingAssistantReply, config, send, activeModel, activeAgentID, commands, refreshSessions, loadSelected, setCommands, setRuntimeError])

  const handleAbort = useCallback(async () => {
    if (!selectedSession) return
    stopGenerationRef.current = true
    setAwaitingAssistantReply(false)
    completionShouldPlayRef.current = false
    setSessions((prev) => prev.map((s) => s.id === selectedSession.id ? { ...s, status: "idle" as const } : s))
    setMessages((prev) => {
      return prev.map((m) => {
        if (m.info.sessionID === selectedSession.id && m.info.role === "assistant" && !m.info.time.completed) {
          return { ...m, info: { ...m.info, time: { ...m.info.time, completed: Date.now() } } }
        }
        return m
      })
    })
    const sid = selectedSession.id
    const dir = selectedSession.directory
    abortSession(sid, dir).catch(() => {})
    loadSelected(sid, dir).catch(() => undefined)
    settleSession(sid, dir).catch(() => undefined)
    setTimeout(() => { stopGenerationRef.current = false }, 400)
  }, [selectedSession, abortSession, loadSelected, settleSession, setAwaitingAssistantReply, setSessions, setMessages])

  // Zoom general de la interfaz con Ctrl + Ruedita y atajos de teclado (Ctrl + / Ctrl - / Ctrl 0)
  useEffect(() => {
    const ZOOM_KEY = "opencode.mobile.ui_zoom"
    const saved = localStorage.getItem(ZOOM_KEY)
    let currentZoom = saved ? Math.min(2.0, Math.max(0.7, parseFloat(saved))) : 1

    const applyZoom = (z: number) => {
      // Limpiar cualquier propiedad zoom antigua que desborde el viewport
      try { (document.documentElement.style as any).zoom = "" } catch {}
      const basePx = Math.round(16 * z * 10) / 10
      document.documentElement.style.fontSize = `${basePx}px`
      document.documentElement.style.setProperty("--ui-scale", `${z}`)
    }

    applyZoom(currentZoom)

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY < 0 ? 0.05 : -0.05
        currentZoom = Math.min(2.0, Math.max(0.7, Math.round((currentZoom + delta) * 100) / 100))
        if (Math.abs(currentZoom - 1) < 0.02) currentZoom = 1
        applyZoom(currentZoom)
        localStorage.setItem(ZOOM_KEY, String(currentZoom))
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault()
          currentZoom = Math.min(2.0, Math.round((currentZoom + 0.1) * 10) / 10)
          applyZoom(currentZoom)
          localStorage.setItem(ZOOM_KEY, String(currentZoom))
        } else if (e.key === "-") {
          e.preventDefault()
          currentZoom = Math.max(0.7, Math.round((currentZoom - 0.1) * 10) / 10)
          applyZoom(currentZoom)
          localStorage.setItem(ZOOM_KEY, String(currentZoom))
        } else if (e.key === "0") {
          e.preventDefault()
          currentZoom = 1
          applyZoom(1)
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
  const desktopLayoutRef = useRef(desktopLayout)
  desktopLayoutRef.current = desktopLayout
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
  const [explorerCwd, setExplorerCwd] = useState<string | undefined>(undefined)
  const handleOpenExplorer = useCallback((dir: string) => {
    setExplorerCwd(dir)
    setActivity("explorer")
    setSidebarCollapsed(false)
  }, [setActivity, setSidebarCollapsed])

  // Tab stacks: tracks all open session IDs per panel (for tab bar)
  const tabStacks = desktopState.tabStacks
  const setTabStacks = useCallback((updater: (prev: Array<Array<string>>) => Array<Array<string>>) => {
    setDesktopState((prev) => ({ ...prev, tabStacks: updater(prev.tabStacks ?? []) }))
  }, [])

  const removeTab = useCallback((panelIndex: number, tabIndex: number) => {
    const tabId = tabStacks?.[panelIndex]?.[tabIndex]
    const wasActive = tabId ? desktopLayout.sessions[panelIndex] === tabId : false
    setTabStacks((prev) => {
      const next = prev.map((s) => [...s])
      if (!next[panelIndex]) return next
      next[panelIndex] = next[panelIndex].filter((_, i) => i !== tabIndex)
      return next
    })
    if (wasActive) {
      setDesktopLayout((prev) => {
        const sessions = [...prev.sessions]
        const remaining = tabStacks?.[panelIndex]?.filter((_, i) => i !== tabIndex) ?? []
        // Si quedaba otro tab, activar el siguiente; si no, limpiar celda
        sessions[panelIndex] = remaining.length > 0 ? remaining[Math.min(tabIndex, remaining.length - 1)] ?? null : null
        return { ...prev, sessions }
      })
    }
  }, [setTabStacks, tabStacks, desktopLayout.sessions])

  const moveTab = useCallback((panelIndex: number, fromIndex: number, toIndex: number) => {
    setTabStacks((prev) => {
      const next = prev.map((s) => [...s])
      if (!next[panelIndex]) return next
      const stack = [...next[panelIndex]]
      if (fromIndex < 0 || fromIndex >= stack.length || toIndex < 0 || toIndex >= stack.length) return next
      const [moved] = stack.splice(fromIndex, 1)
      stack.splice(toIndex, 0, moved)
      next[panelIndex] = stack
      return next
    })
  }, [setTabStacks])
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
    // Register in tab stack
    setTabStacks((prev) => {
      const next = prev.map((s) => [...s])
      while (next.length <= index) next.push([])
      // Remove from other panels ONLY — keep order within this panel intact
      // so switching tabs doesn't move the clicked tab to the end of the bar.
      for (let i = 0; i < next.length; i++) {
        if (i !== index) next[i] = next[i].filter((sid) => sid !== id)
      }
      if (!next[index]) next[index] = []
      if (!next[index].includes(id)) {
        next[index] = [...next[index], id]
      }
      return next
    })
    setActivePanel(index)
  }, [setTabStacks])

  const handleCreateSession = useCallback(async (directory?: string) => {
    const created = await createSession(directory, activeModel)
    if (created) {
      recordSessionCreated()
      setShowNewSessionPicker(false)
      if (directory) persistDirectory(directory)
      if (isDesktop) {
        setDesktopLayout((prev) => {
          const sessions = [...prev.sessions]
          const panelKinds = [...prev.panelKinds]
          const i = Math.min(activePanel, Math.max(0, prev.sessions.length - 1))
          sessions[i] = created.id
          panelKinds[i] = "session"
          return { ...prev, sessions, panelKinds }
        })
        setTabStacks((prev) => {
          const next = (prev ?? []).map((s) => [...s])
          const i = Math.min(activePanel, Math.max(0, next.length - 1))
          while (next.length <= i) next.push([])
          if (!next[i]) next[i] = []
          if (!next[i].includes(created.id)) next[i] = [...next[i], created.id]
          return next
        })
      } else {
        navigate("detail")
      }
      await onLoadSelected(created.id, created.directory)
      await refreshSessions()
    }
  }, [createSession, activeModel, recordSessionCreated, persistDirectory, isDesktop, setDesktopLayout, setTabStacks, activePanel, navigate, onLoadSelected, refreshSessions])

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

  const switchTab = useCallback((panelIndex: number, tabIndex: number) => {
    const stack = tabStacks?.[panelIndex]
    if (!stack || tabIndex < 0 || tabIndex >= stack.length) return
    const id = stack[tabIndex]
    if (id.startsWith("terminal")) {
      setDesktopLayout((prev) => {
        const sessions = [...prev.sessions]
        sessions[panelIndex] = id
        return { ...prev, sessions }
      })
      setActivePanel(panelIndex)
      return
    }
    openInPanel(panelIndex, id)
  }, [tabStacks, openInPanel])

  const addTerminalToPanel = useCallback((panelIndex: number, _targetIndex?: number) => {
    const terminalId = `terminal:${Date.now()}`
    setTabStacks((prev) => {
      const next = prev.map((s) => [...s])
      while (next.length <= panelIndex) next.push([])
      if (!next[panelIndex]) next[panelIndex] = []
      for (let i = 0; i < next.length; i++) {
        if (i !== panelIndex) next[i] = next[i].filter((tid) => tid !== terminalId)
      }
      next[panelIndex] = [...next[panelIndex], terminalId]
      return next
    })
    setDesktopLayout((prev) => {
      const sessions = [...prev.sessions]
      while (sessions.length <= panelIndex) sessions.push(null)
      sessions[panelIndex] = terminalId
      return { ...prev, sessions }
    })
    setActivePanel(panelIndex)
  }, [setTabStacks])

  const splitPanel = useCallback((index: number, dir: "right" | "bottom") => {
    setDesktopLayout((prev) => {
      const kindsOf = (r: number, c: number) => prev.panelKinds[r * prev.cols + c] ?? "session"
      if (dir === "right") {
        const cols = prev.cols + 1
        const col = index % prev.cols
        const sessions: Array<string | null> = []
        const panelKinds: Array<ShellPanelKind> = []
        const panelIds: Array<string> = []
        for (let r = 0; r < prev.rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (c <= col) { sessions.push(prev.sessions[r * prev.cols + c] ?? null); panelKinds.push(kindsOf(r, c)); panelIds.push(prev.panelIds[r * prev.cols + c]) }
            else if (c === col + 1) { sessions.push(null); panelKinds.push("session"); panelIds.push(genPanelId()) }
            else { sessions.push(prev.sessions[r * prev.cols + (c - 1)] ?? null); panelKinds.push(kindsOf(r, c - 1)); panelIds.push(prev.panelIds[r * prev.cols + (c - 1)]) }
          }
        }
        const colSizes = [...prev.colSizes]
        colSizes.splice(col + 1, 0, null)
        return { ...prev, cols, sessions, panelKinds, panelIds, colSizes }
      }
      const rows = prev.rows + 1
      const row = Math.floor(index / prev.cols)
      const sessions: Array<string | null> = []
      const panelKinds: Array<ShellPanelKind> = []
      const panelIds: Array<string> = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < prev.cols; c++) {
          if (r <= row) { sessions.push(prev.sessions[r * prev.cols + c] ?? null); panelKinds.push(kindsOf(r, c)); panelIds.push(prev.panelIds[r * prev.cols + c]) }
          else if (r === row + 1) { sessions.push(null); panelKinds.push("session"); panelIds.push(genPanelId()) }
          else { sessions.push(prev.sessions[(r - 1) * prev.cols + c] ?? null); panelKinds.push(kindsOf(r - 1, c)); panelIds.push(prev.panelIds[(r - 1) * prev.cols + c]) }
        }
      }
      const rowSizes = [...prev.rowSizes]
      rowSizes.splice(row + 1, 0, null)
      return { ...prev, rows, sessions, panelKinds, panelIds, rowSizes }
    })
  }, [])

  // Agrega un panel nuevo (de cualquier tipo) al grid, expandiendo si está lleno.
  // Singleton para stats: no abrir más de 1 vez (el botón lo cierra).
  const addPanel = useCallback((kind: ShellPanelKind) => {
    setDesktopLayout((prev) => {
      if (kind === "stats" && prev.panelKinds.includes("stats")) return prev
      const total = prev.cols * prev.rows
      const emptySlot = prev.sessions.findIndex((s, i) => s === null && prev.panelKinds[i] === "session")
      if (emptySlot >= 0) {
        const sessions = [...prev.sessions]
        const panelKinds = [...prev.panelKinds]
        const panelIds = [...prev.panelIds]
        panelKinds[emptySlot] = kind
        return { ...prev, sessions, panelKinds, panelIds }
      }
      let cols = prev.cols
      let rows = prev.rows
      if (cols < 3) cols += 1
      else if (rows < 2) rows += 1
      else cols = 2, rows = 2 // reset visual de 3x1 -> 2x2
      const sessions: Array<string | null> = new Array(cols * rows).fill(null)
      const panelKinds: Array<ShellPanelKind> = new Array(cols * rows).fill("session")
      const panelIds: Array<string> = new Array(cols * rows).fill(null).map(() => genPanelId())
      for (let i = 0; i < Math.min(total, cols * rows); i++) {
        sessions[i] = prev.sessions[i]
        panelKinds[i] = prev.panelKinds[i]
        panelIds[i] = prev.panelIds[i]
      }
      panelKinds[sessions.length - 1] = kind
      const colSizes = new Array(cols).fill(null)
      const rowSizes = new Array(rows).fill(null)
      prev.colSizes.forEach((s, i) => { if (i < cols) colSizes[i] = s })
      prev.rowSizes.forEach((s, i) => { if (i < rows) rowSizes[i] = s })
      return { ...prev, cols, rows, sessions, panelKinds, panelIds, colSizes, rowSizes }
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

      if (activeRemaining.length === 0) {
        return {
          ...prevState,
          lastClosedPanel: closedInfo,
          layout: {
            ...prev,
            cols: 1,
            rows: 1,
            sessions: [null],
            panelKinds: ["session"],
            panelIds: [genPanelId()],
            panelEditorPaths: {},
            panelEditorTabStacks: {},
            panelEditorActive: {},
            colSizes: [null],
            rowSizes: [null],
          }
        }
      }

      if (activeRemaining.length === 1) {
        const targetIdx = activeRemaining[0]
        const tabStacksForSingle: Record<number, string[]> = prev.panelEditorTabStacks?.[targetIdx] ? { 0: prev.panelEditorTabStacks[targetIdx] } : {}
        const activeForSingle: Record<number, number> = prev.panelEditorActive?.[targetIdx] != null ? { 0: prev.panelEditorActive[targetIdx]! } : {}
        return {
          ...prevState,
          lastClosedPanel: closedInfo,
          layout: {
            ...prev,
            cols: 1,
            rows: 1,
            sessions: [prev.sessions[targetIdx] ?? null],
            panelKinds: [prev.panelKinds[targetIdx] ?? "session"],
            panelIds: [prev.panelIds[targetIdx]],
            panelEditorPaths: prev.panelEditorPaths?.[targetIdx] ? { 0: prev.panelEditorPaths[targetIdx] } : {},
            panelEditorTabStacks: tabStacksForSingle,
            panelEditorActive: activeForSingle,
            colSizes: [null],
            rowSizes: [null],
          }
        }
      }

      let sessions = [...prev.sessions]
      let panelKinds = [...prev.panelKinds]
      let panelIds = [...prev.panelIds]
      const panelEditorPaths = { ...prev.panelEditorPaths } as Record<number, string>
      const panelEditorTabStacks = { ...prev.panelEditorTabStacks } as Record<number, string[]>
      const panelEditorActive = { ...prev.panelEditorActive } as Record<number, number>
      delete panelEditorPaths[index]
      delete panelEditorTabStacks[index]
      delete panelEditorActive[index]
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
            panelIds = panelIds.filter((_, i) => Math.floor(i / cols) !== r)
            rows -= 1
            rowSizes = rowSizes.filter((_, i) => i !== r)
            changed = true
            break
          }
        }
        if (changed) continue
        // Find all empty columns at once (checking against original grid before any removal)
        const emptyCols: number[] = []
        for (let c = 0; c < cols; c++) {
          const colEmpty = Array.from({ length: rows }, (_, r) => r * cols + c).every((i) => isEmpty(i))
          if (colEmpty) emptyCols.push(c)
        }
        if (emptyCols.length > 0 && cols > emptyCols.length) {
          const removeSet = new Set(emptyCols)
          sessions = sessions.filter((_, i) => !removeSet.has(i % cols))
          panelKinds = panelKinds.filter((_, i) => !removeSet.has(i % cols))
          panelIds = panelIds.filter((_, i) => !removeSet.has(i % cols))
          cols -= emptyCols.length
          colSizes = colSizes.filter((_, i) => !removeSet.has(i))
          changed = true
        }
        if (cols === 1) colSizes = [null]
        if (rows === 1) rowSizes = [null]
      }
      return {
        ...prevState,
        lastClosedPanel: closedInfo,
        layout: { ...prev, cols, rows, sessions, panelKinds, panelIds, panelEditorPaths, panelEditorTabStacks, panelEditorActive, colSizes, rowSizes }
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

    const dock = parseDockPayload(rawId)
    let targetKind = dock.targetKind as ShellPanelKind | "editor"
    let targetSessionId = dock.targetSessionId
    let fromIndex = dock.fromIndex

    if (dir === "center") {
      setDesktopLayout((prev) => {
        const sessions = [...prev.sessions]
        const panelKinds = [...prev.panelKinds]
        const panelIds = [...prev.panelIds]
        if (targetSessionId) {
          // Moving a session: remove from source
          const existing = sessions.indexOf(targetSessionId)
          if (existing >= 0 && existing !== index) {
            const rem = tabStacks?.[existing]?.filter((sid) => sid !== targetSessionId) ?? []
            sessions[existing] = rem.length > 0 ? rem[0] : null
            if (rem.length === 0) panelKinds[existing] = "session"
            panelIds[existing] = genPanelId()
          }
        } else if (fromIndex !== null && fromIndex !== index) {
          // Moving a non-session panel (terminal, explorer, etc.): mover identidad
          // para que React preserve la instancia y su estado (tabs + pty).
          const movedId = panelIds[fromIndex]
          panelKinds[fromIndex] = "session"
          sessions[fromIndex] = null
          panelIds[fromIndex] = genPanelId()
          panelIds[index] = movedId
        } else if (targetKind !== "session") {
          // Moving by kind: find and clear existing
          const existing = panelKinds.indexOf(targetKind)
          if (existing >= 0 && existing !== index) {
            const movedId = panelIds[existing]
            panelKinds[existing] = "session"
            sessions[existing] = null
            panelIds[existing] = genPanelId()
            panelIds[index] = movedId
          }
        }
        sessions[index] = targetSessionId
        panelKinds[index] = targetKind
        return { ...prev, sessions, panelKinds, panelIds }
      })
      setTabStacks((prev) => {
        const next = (prev ?? []).map((s) => [...s])
        while (next.length <= Math.max(index, fromIndex ?? index)) next.push([])
        if (targetSessionId) {
          for (let i = 0; i < next.length; i++) {
            if (i !== index) next[i] = next[i].filter((sid) => sid !== targetSessionId)
          }
          if (!next[index].includes(targetSessionId)) {
            next[index] = [...next[index], targetSessionId]
          }
        } else if (fromIndex !== null && fromIndex !== index) {
          next[index] = next[fromIndex] ?? []
          next[fromIndex] = []
        }
        return next
      })
      setActivePanel(index)
      return
    }

    if (dir === "left" || dir === "right") {
      setDesktopLayout((prev) => {
        let baseSessions = [...prev.sessions]
        let baseKinds = [...prev.panelKinds]
        let baseIds = [...prev.panelIds]
        let movedId: string | null = null
        if (targetSessionId) {
          baseSessions = baseSessions.map((s, pIdx) => {
            if (s === targetSessionId) {
              const rem = tabStacks?.[pIdx]?.filter((sid) => sid !== targetSessionId) ?? []
              return rem.length > 0 ? rem[0] : null
            }
            return s
          })
        } else if (fromIndex !== null && fromIndex < baseKinds.length) {
          baseKinds[fromIndex] = "session"
          baseSessions[fromIndex] = null
          movedId = baseIds[fromIndex]
          baseIds[fromIndex] = ""  // clear id so copy doesn't reuse it
        } else if (targetKind !== "session") {
          const existing = baseKinds.indexOf(targetKind)
          if (existing >= 0) {
            baseKinds[existing] = "session"
            baseSessions[existing] = null
            movedId = baseIds[existing]
            baseIds[existing] = ""
          }
        }
        const cols = prev.cols + 1
        const col = index % prev.cols
        const sessions: Array<string | null> = []
        const panelKinds: Array<ShellPanelKind | "editor"> = []
        const panelIds: Array<string> = []
        for (let r = 0; r < prev.rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (dir === "right") {
              if (c <= col) {
                sessions.push(baseSessions[r * prev.cols + c] ?? null)
                panelKinds.push(baseKinds[r * prev.cols + c] ?? "session")
                panelIds.push(baseIds[r * prev.cols + c] || genPanelId())
              } else if (c === col + 1) {
                const isTarget = r === Math.floor(index / prev.cols)
                sessions.push(isTarget ? targetSessionId : null)
                panelKinds.push(isTarget ? targetKind : "session")
                panelIds.push(isTarget ? (movedId ?? genPanelId()) : genPanelId())
              } else {
                sessions.push(baseSessions[r * prev.cols + (c - 1)] ?? null)
                panelKinds.push(baseKinds[r * prev.cols + (c - 1)] ?? "session")
                panelIds.push(baseIds[r * prev.cols + (c - 1)] || genPanelId())
              }
            } else {
              if (c === col) {
                const isTarget = r === Math.floor(index / prev.cols)
                sessions.push(isTarget ? targetSessionId : null)
                panelKinds.push(isTarget ? targetKind : "session")
                panelIds.push(isTarget ? (movedId ?? genPanelId()) : genPanelId())
              } else if (c < col) {
                sessions.push(baseSessions[r * prev.cols + c] ?? null)
                panelKinds.push(baseKinds[r * prev.cols + c] ?? "session")
                panelIds.push(baseIds[r * prev.cols + c] || genPanelId())
              } else {
                sessions.push(baseSessions[r * prev.cols + (c - 1)] ?? null)
                panelKinds.push(baseKinds[r * prev.cols + (c - 1)] ?? "session")
                panelIds.push(baseIds[r * prev.cols + (c - 1)] || genPanelId())
              }
            }
          }
        }
        const colSizes = new Array(cols).fill(null)
        return { ...prev, cols, sessions, panelKinds, panelIds, colSizes }
      })
      if (targetSessionId) {
        setTabStacks((prev) => {
          const prevCols = desktopLayoutRef.current.cols
          const prevRows = desktopLayoutRef.current.rows
          const filtered = prev.map((s) => s.filter((sid) => sid !== targetSessionId))
          const cols = prevCols + 1
          const col = index % prevCols
          const newStacks: Array<Array<string>> = []
          for (let r = 0; r < prevRows; r++) {
            for (let c = 0; c < cols; c++) {
              if (dir === "right") {
                if (c <= col) {
                  newStacks.push(filtered[r * prevCols + c] ?? [])
                } else if (c === col + 1) {
                  const isTarget = r === Math.floor(index / prevCols)
                  newStacks.push(isTarget ? [targetSessionId] : [])
                } else {
                  newStacks.push(filtered[r * prevCols + (c - 1)] ?? [])
                }
              } else {
                if (c === col) {
                  const isTarget = r === Math.floor(index / prevCols)
                  newStacks.push(isTarget ? [targetSessionId] : [])
                } else if (c < col) {
                  newStacks.push(filtered[r * prevCols + c] ?? [])
                } else {
                  newStacks.push(filtered[r * prevCols + (c - 1)] ?? [])
                }
              }
            }
          }
          return newStacks
        })
      }
      setActivePanel(dir === "right" ? index + 1 : index)
      return
    }

    if (dir === "top" || dir === "bottom") {
      setDesktopLayout((prev) => {
        let baseSessions = [...prev.sessions]
        let baseKinds = [...prev.panelKinds]
        let baseIds = [...prev.panelIds]
        let movedId: string | null = null
        if (targetSessionId) {
          baseSessions = baseSessions.map((s, pIdx) => {
            if (s === targetSessionId) {
              const rem = tabStacks?.[pIdx]?.filter((sid) => sid !== targetSessionId) ?? []
              return rem.length > 0 ? rem[0] : null
            }
            return s
          })
        } else if (fromIndex !== null && fromIndex < baseKinds.length) {
          baseKinds[fromIndex] = "session"
          baseSessions[fromIndex] = null
          movedId = baseIds[fromIndex]
          baseIds[fromIndex] = ""
        } else if (targetKind !== "session") {
          const existing = baseKinds.indexOf(targetKind)
          if (existing >= 0) {
            baseKinds[existing] = "session"
            baseSessions[existing] = null
            movedId = baseIds[existing]
            baseIds[existing] = ""
          }
        }
        const rows = prev.rows + 1
        const row = Math.floor(index / prev.cols)
        const col = index % prev.cols
        const sessions: Array<string | null> = []
        const panelKinds: Array<ShellPanelKind | "editor"> = []
        const panelIds: Array<string> = []
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < prev.cols; c++) {
            if (dir === "bottom") {
              if (r <= row) {
                sessions.push(baseSessions[r * prev.cols + c] ?? null)
                panelKinds.push(baseKinds[r * prev.cols + c] ?? "session")
                panelIds.push(baseIds[r * prev.cols + c] || genPanelId())
              } else if (r === row + 1) {
                const isTarget = c === col
                sessions.push(isTarget ? targetSessionId : null)
                panelKinds.push(isTarget ? targetKind : "session")
                panelIds.push(isTarget ? (movedId ?? genPanelId()) : genPanelId())
              } else {
                sessions.push(baseSessions[(r - 1) * prev.cols + c] ?? null)
                panelKinds.push(baseKinds[(r - 1) * prev.cols + c] ?? "session")
                panelIds.push(baseIds[(r - 1) * prev.cols + c] || genPanelId())
              }
            } else {
              if (r === row) {
                const isTarget = c === col
                sessions.push(isTarget ? targetSessionId : null)
                panelKinds.push(isTarget ? targetKind : "session")
                panelIds.push(isTarget ? (movedId ?? genPanelId()) : genPanelId())
              } else if (r < row) {
                sessions.push(baseSessions[r * prev.cols + c] ?? null)
                panelKinds.push(baseKinds[r * prev.cols + c] ?? "session")
                panelIds.push(baseIds[r * prev.cols + c] || genPanelId())
              } else {
                sessions.push(baseSessions[(r - 1) * prev.cols + c] ?? null)
                panelKinds.push(baseKinds[(r - 1) * prev.cols + c] ?? "session")
                panelIds.push(baseIds[(r - 1) * prev.cols + c] || genPanelId())
              }
            }
          }
        }
        const rowSizes = new Array(rows).fill(null)
        return { ...prev, rows, sessions, panelKinds, panelIds, rowSizes }
      })
      if (targetSessionId) {
        setTabStacks((prev) => {
          const prevCols = desktopLayoutRef.current.cols
          const prevRows = desktopLayoutRef.current.rows
          const filtered = prev.map((s) => s.filter((sid) => sid !== targetSessionId))
          const rows = prevRows + 1
          const row = Math.floor(index / prevCols)
          const col = index % prevCols
          const newStacks: Array<Array<string>> = []
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < prevCols; c++) {
              if (dir === "bottom") {
                if (r <= row) {
                  newStacks.push(filtered[r * prevCols + c] ?? [])
                } else if (r === row + 1) {
                  const isTarget = c === col
                  newStacks.push(isTarget ? [targetSessionId] : [])
                } else {
                  newStacks.push(filtered[(r - 1) * prevCols + c] ?? [])
                }
              } else {
                if (r === row) {
                  const isTarget = c === col
                  newStacks.push(isTarget ? [targetSessionId] : [])
                } else if (r < row) {
                  newStacks.push(filtered[r * prevCols + c] ?? [])
                } else {
                  newStacks.push(filtered[(r - 1) * prevCols + c] ?? [])
                }
              }
            }
          }
          return newStacks
        })
      }
      setActivePanel(index)
      return
    }
  }, [tabStacks, setTabStacks])

  const handleSwapPanels = useCallback((from: number, to: number) => {
    if (from === to) return
    setDesktopLayout((prev) => {
      const sessions = [...prev.sessions]
      const panelKinds = [...prev.panelKinds]
      const panelIds = [...prev.panelIds]
      ;[sessions[from], sessions[to]] = [sessions[to], sessions[from]]
      ;[panelKinds[from], panelKinds[to]] = [panelKinds[to], panelKinds[from]]
      ;[panelIds[from], panelIds[to]] = [panelIds[to], panelIds[from]]
      return { ...prev, sessions, panelKinds, panelIds }
    })
    setTabStacks((prev) => {
      const next = (prev ?? []).map((s) => [...s])
      while (next.length <= Math.max(from, to)) next.push([])
      ;[next[from], next[to]] = [next[to] ?? [], next[from] ?? []]
      return next
    })
    setActivePanel(to)
  }, [setDesktopLayout, setTabStacks])

  const startSidebarResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // No bloquear la scrollbar nativa: el resizer de 4px ocupa el borde derecho
    // [right-4, right], la scrollbar ocupa [right-12, right]. Dejar 8px centrales
    // [right-12, right-4] para scroll; el borde de 4px sigue siendo draggable.
    const sidebarEl = (e.currentTarget as HTMLElement).closest(".app-desktop-sidebar") as HTMLElement | null
    const scrollEl = (sidebarEl?.querySelector(".desktop-sidebar-body") ?? sidebarEl?.querySelector(".panel.sessions")) as HTMLElement | null
    if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight) {
      const r = scrollEl.getBoundingClientRect()
      if (e.clientX >= r.right - 14 && e.clientX < r.right - 4 && e.clientY >= r.top && e.clientY <= r.bottom) return
    }
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
    let committed = false
    const onUp = () => {
      if (committed) return
      committed = true
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      setSidebarWidth(lastW)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [sidebarWidth, setSidebarWidth, desktopDiffOpen, desktopDiffWidth])

  // Atajos de escritorio (splits/sidebar/layouts/tabs) — solo desktop
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isDesktop || (view !== "sessions" && view !== "detail") || !(e.ctrlKey || e.metaKey)) return

      // 1. Tab switching in the column/panel that was clicked last (activePanel)
      const nextTabSc = shortcuts.find((s) => s.id === "switch_tab_next" && s.enabled)
      const prevTabSc = shortcuts.find((s) => s.id === "switch_tab_prev" && s.enabled)

      if (nextTabSc && matchesShortcut(e, nextTabSc.keys)) {
        e.preventDefault()
        e.stopPropagation()
        const stack = tabStacks?.[activePanel]
        if (stack && stack.length > 1) {
          const currentId = desktopLayout.sessions[activePanel]
          const currentIdx = currentId ? stack.indexOf(currentId) : 0
          const nextIdx = (currentIdx + 1) % stack.length
          switchTab(activePanel, nextIdx)
        }
        return
      }

      if (prevTabSc && matchesShortcut(e, prevTabSc.keys)) {
        e.preventDefault()
        e.stopPropagation()
        const stack = tabStacks?.[activePanel]
        if (stack && stack.length > 1) {
          const currentId = desktopLayout.sessions[activePanel]
          const currentIdx = currentId ? stack.indexOf(currentId) : 0
          const prevIdx = (currentIdx - 1 + stack.length) % stack.length
          switchTab(activePanel, prevIdx)
        }
        return
      }

      const inEditable = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement

      // 2. Close split
      const closeSc = shortcuts.find((s) => s.id === "close_split" && s.enabled)
      if (closeSc && matchesShortcut(e, closeSc.keys)) {
        e.preventDefault()
        if (maximizedPanel !== null) { setMaximizedPanel(null); return }
        if (desktopLayout.cols > 1 || desktopLayout.rows > 1 || desktopLayout.sessions.some((s) => s !== null)) {
          closePanel(activePanel)
        }
        return
      }

      if (inEditable) return

      // 3. Split right
      const splitRightSc = shortcuts.find((s) => s.id === "split_right" && s.enabled)
      if (splitRightSc && matchesShortcut(e, splitRightSc.keys)) {
        e.preventDefault()
        splitPanel(activePanel, "right")
        return
      }

      // 4. Split bottom
      const splitBottomSc = shortcuts.find((s) => s.id === "split_bottom" && s.enabled)
      if (splitBottomSc && matchesShortcut(e, splitBottomSc.keys)) {
        e.preventDefault()
        splitPanel(activePanel, "bottom")
        return
      }

      // 5. Maximize / restore
      const maxSc = shortcuts.find((s) => s.id === "maximize_panel" && s.enabled)
      if (maxSc && matchesShortcut(e, maxSc.keys)) {
        e.preventDefault()
        if (desktopLayout.sessions[activePanel]) toggleMaximize(activePanel)
        return
      }

      // 6. Toggle sidebar
      const sidebarSc = shortcuts.find((s) => s.id === "toggle_sidebar" && s.enabled)
      if (sidebarSc && matchesShortcut(e, sidebarSc.keys)) {
        e.preventDefault()
        setSidebarCollapsed((v) => !v)
        return
      }

      // 7. New session
      const newSessSc = shortcuts.find((s) => s.id === "new_session" && s.enabled)
      if (newSessSc && matchesShortcut(e, newSessSc.keys)) {
        e.preventDefault()
        handleOpenNewSession()
        return
      }

      const newTermSc = shortcuts.find((s) => s.id === "new_terminal" && s.enabled)
      if (newTermSc && matchesShortcut(e, newTermSc.keys)) {
        e.preventDefault()
        e.stopPropagation()
        if (isDesktop) {
          // Convertir el panel activo a terminal
          setDesktopLayout((prev) => {
            const panelKinds = [...prev.panelKinds]
            panelKinds[activePanel] = "terminal"
            return { ...prev, panelKinds }
          })
        } else {
          // En mobile: abrir terminal inferior
          setShowTerminal(true)
        }
        return
      }

      const k = e.key.toLowerCase()
      if (!e.shiftKey && /^[1-9]$/.test(k)) {
        const idx = Number(k) - 1
        if (idx < desktopLayout.cols * desktopLayout.rows) { e.preventDefault(); setActivePanel(idx) }
        return
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isDesktop, view, maximizedPanel, desktopLayout.cols, desktopLayout.rows, desktopLayout.sessions, activePanel, tabStacks, switchTab, closePanel, splitPanel, toggleMaximize, setSidebarCollapsed, handleOpenNewSession, shortcuts])

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
        await Promise.race([
          api.abort(config, selectedSession.id, selectedSession.directory).catch(() => {}),
          new Promise((r) => setTimeout(r, 2500)),
        ])
        await new Promise((r) => setTimeout(r, 400))
      }
      const target = renderedMessages.find((m) => m.info.id === messageID)
      // S3: filtro optimista instantáneo.
      const sid = selectedSession.id
      setMessages((prev) => prev.filter((m) => m.info.sessionID !== sid || !m.info.id || m.info.id <= messageID))
      setLocalRevertID(messageID)
      let ok = false
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await api.revert(config, sid, messageID, selectedSession.directory)
          ok = true
          break
        } catch (err: any) {
          const msg = String(err?.message ?? "")
          if (/busy/i.test(msg) && attempt < 2) {
            await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
            continue
          }
          throw err
        }
      }
      if (!ok) {
        await loadSelected(sid, selectedSession.directory).catch(() => {})
        return
      }
      await loadSelected(sid, selectedSession.directory).catch(() => {})
      if (target?.text) setComposer(target.text)
    } catch (err) {
      setRuntimeError((err as Error).message)
      await loadSelected(selectedSession.id, selectedSession.directory).catch(() => {})
    }
  }, [selectedSession, config, awaitingAssistantReply, loadSelected, renderedMessages, setMessages])

  const handleEditMessage = useCallback(async (messageID: string, text: string) => {
    if (!selectedSession) return
    try {
      if (awaitingAssistantReply) {
        await Promise.race([
          api.abort(config, selectedSession.id, selectedSession.directory).catch(() => {}),
          new Promise((r) => setTimeout(r, 2500)),
        ])
        await new Promise((r) => setTimeout(r, 400))
      }
      const sid = selectedSession.id
      // Para editar: revertir ANTES del mensaje elegido (no incluirlo),
      // así el reenvío corregido lo reemplaza y no duplica.
      const prevId = [...messages]
        .filter((m) => m.info.sessionID === sid && m.info.id < messageID)
        .pop()?.info.id ?? null
      const revertTarget = prevId ?? messageID
      // Filtro local instantáneo: excluir el mensaje editado ( < messageID)
      setMessages((prev) => prev.filter((m) => m.info.sessionID !== sid || !m.info.id || m.info.id < messageID))
      setLocalRevertID(revertTarget)
      let ok = false
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await api.revert(config, sid, revertTarget, selectedSession.directory)
          ok = true
          break
        } catch (err: any) {
          const msg = String(err?.message ?? "")
          if (/busy/i.test(msg) && attempt < 2) {
            await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
            continue
          }
          throw err
        }
      }
      if (!ok) {
        await loadSelected(sid, selectedSession.directory).catch(() => {})
        return
      }
      await loadSelected(sid, selectedSession.directory).catch(() => {})
      setComposer(text)
    } catch (err) {
      setRuntimeError((err as Error).message)
      await loadSelected(selectedSession.id, selectedSession.directory).catch(() => {})
    }
  }, [selectedSession, config, awaitingAssistantReply, loadSelected, setMessages, messages])
  const handleUndo = useCallback(() => {
    if (!selectedSession) return
    // S3+S5: patch local instantáneo — el undo se siente en ~0ms.
    const patchSession = (patch: Record<string, unknown>) => {
      setSessions((prev) => prev.map((s) => s.id === selectedSession.id ? { ...s, ...patch } : s))
    }
    undoMessage(selectedSession.id, selectedSession.directory, selectedSession.revert, refreshSessions, () => loadSelected(selectedSession.id, selectedSession.directory), patchSession, setLocalRevertID)
  }, [selectedSession, undoMessage, refreshSessions, loadSelected, setSessions])

  const handleRedo = useCallback(() => {
    if (!selectedSession) return
    setLocalRevertID(null)
    const patchSession = (patch: Record<string, unknown>) => {
      setSessions((prev) => prev.map((s) => s.id === selectedSession.id ? { ...s, ...patch } : s))
    }
    redoMessage(selectedSession.id, selectedSession.directory, refreshSessions, () => loadSelected(selectedSession.id, selectedSession.directory), patchSession)
  }, [selectedSession, redoMessage, refreshSessions, loadSelected, setSessions])

  const handleCompact = useCallback(async () => {
    if (!selectedSession || !activeModel) return
    setCompacting(true, selectedSession.id)
    setAwaitingAssistantReply(true)
    completionShouldPlayRef.current = true
    try {
      await compactSession(selectedSession.id, selectedSession.directory, activeModel.providerID, activeModel.modelID, refreshSessions, () => loadSelected(selectedSession.id, selectedSession.directory))
    } finally {
      setCompacting(false, selectedSession.id)
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
        onOpenExplorer={handleOpenExplorer}
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

  const handleOpenFile = useCallback((filePath: string, targetIndex?: number, zone?: "left" | "right" | "top" | "bottom" | "center") => {
    if (!isDesktop) {
      setFileEditorPath(filePath)
      return
    }

    setDesktopLayout((prev) => {
      // 1. Si se especificó targetIndex y zone:
      if (targetIndex != null && zone) {
        if (zone === "center") {
          const panelKinds = [...prev.panelKinds]
          panelKinds[targetIndex] = "editor"
          const prevTabs = prev.panelEditorTabStacks?.[targetIndex] ?? (prev.panelEditorPaths?.[targetIndex] ? [prev.panelEditorPaths[targetIndex]] : [])
          const isSameEditor = prev.panelKinds[targetIndex] === "editor"
          const nextTabs = isSameEditor ? (prevTabs.includes(filePath) ? prevTabs : [...prevTabs, filePath]) : [filePath]
          const nextActive = nextTabs.indexOf(filePath)
          return {
            ...prev,
            panelKinds,
            panelEditorTabStacks: { ...prev.panelEditorTabStacks, [targetIndex]: nextTabs },
            panelEditorActive: { ...prev.panelEditorActive, [targetIndex]: nextActive },
            panelEditorPaths: { ...prev.panelEditorPaths, [targetIndex]: filePath },
          }
        }
        if (zone === "left" || zone === "right") {
          const cols = prev.cols + 1
          const col = targetIndex % prev.cols
          const insertCol = zone === "left" ? col : col + 1
          const sessions: Array<string | null> = []
          const panelKinds: Array<ShellPanelKind | "editor"> = []
          const panelIds: Array<string> = []
          const panelEditorPaths: Record<number, string> = {}
          const panelEditorTabStacks: Record<number, string[]> = {}
          const panelEditorActive: Record<number, number> = {}
          for (let r = 0; r < prev.rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (c < insertCol) {
                const oldIdx = r * prev.cols + c
                sessions.push(prev.sessions[oldIdx] ?? null)
                panelKinds.push(prev.panelKinds[oldIdx] ?? "session")
                panelIds.push(prev.panelIds[oldIdx] ?? genPanelId())
                if (prev.panelEditorPaths?.[oldIdx]) panelEditorPaths[sessions.length - 1] = prev.panelEditorPaths[oldIdx]
                if (prev.panelEditorTabStacks?.[oldIdx]) panelEditorTabStacks[sessions.length - 1] = prev.panelEditorTabStacks[oldIdx]
                if (prev.panelEditorActive?.[oldIdx] != null) panelEditorActive[sessions.length - 1] = prev.panelEditorActive[oldIdx]!
              } else if (c === insertCol) {
                sessions.push(null)
                panelKinds.push("editor")
                panelIds.push(genPanelId())
                panelEditorPaths[sessions.length - 1] = filePath
                panelEditorTabStacks[sessions.length - 1] = [filePath]
                panelEditorActive[sessions.length - 1] = 0
              } else {
                const oldIdx = r * prev.cols + (c - 1)
                sessions.push(prev.sessions[oldIdx] ?? null)
                panelKinds.push(prev.panelKinds[oldIdx] ?? "session")
                panelIds.push(prev.panelIds[oldIdx] ?? genPanelId())
                if (prev.panelEditorPaths?.[oldIdx]) panelEditorPaths[sessions.length - 1] = prev.panelEditorPaths[oldIdx]
                if (prev.panelEditorTabStacks?.[oldIdx]) panelEditorTabStacks[sessions.length - 1] = prev.panelEditorTabStacks[oldIdx]
                if (prev.panelEditorActive?.[oldIdx] != null) panelEditorActive[sessions.length - 1] = prev.panelEditorActive[oldIdx]!
              }
            }
          }
          return { ...prev, cols, sessions, panelKinds, panelIds, panelEditorPaths, panelEditorTabStacks, panelEditorActive, colSizes: new Array(cols).fill(null) }
        }
      }

      // 2. Si ya hay un editor abierto, agregar pestaña (VS Code: no reemplaza)
      const existingEditorIdx = prev.panelKinds.indexOf("editor")
      if (existingEditorIdx >= 0) {
        const prevTabs = prev.panelEditorTabStacks?.[existingEditorIdx] ?? (prev.panelEditorPaths?.[existingEditorIdx] ? [prev.panelEditorPaths[existingEditorIdx]] : [])
        const nextTabs = prevTabs.includes(filePath) ? prevTabs : [...prevTabs, filePath]
        const nextActive = nextTabs.indexOf(filePath)
        return {
          ...prev,
          panelEditorTabStacks: { ...prev.panelEditorTabStacks, [existingEditorIdx]: nextTabs },
          panelEditorActive: { ...prev.panelEditorActive, [existingEditorIdx]: nextActive },
          panelEditorPaths: { ...prev.panelEditorPaths, [existingEditorIdx]: filePath },
        }
      }

      // 3. Si tenemos 1 solo panel (el chat), colocar editor a la izquierda (col 0) y chat a la derecha (col 1)
      if (prev.cols === 1 && prev.rows === 1) {
        const curSessionId = prev.sessions[0] ?? selectedSession?.id ?? null
        return {
          ...prev,
          cols: 2,
          rows: 1,
          colSizes: [null, null],
          rowSizes: [null],
          panelKinds: ["editor", "session"],
          sessions: [null, curSessionId],
          panelIds: [genPanelId(), prev.panelIds[0] ?? genPanelId()],
          panelEditorPaths: { 0: filePath },
          panelEditorTabStacks: { 0: [filePath] },
          panelEditorActive: { 0: 0 },
        }
      }

      // 4. Si tenemos Explorador en col 0 y Chat en col 1 (2 cols):
      // Col 0: Explorador | Col 1: Editor (centro) | Col 2: Chat (derecha)
      const explorerIdx = prev.panelKinds.indexOf("explorer")
      const chatIdx = prev.panelKinds.indexOf("session")
      if (explorerIdx === 0 && chatIdx === 1 && prev.cols === 2) {
        const curSessionId = prev.sessions[1] ?? selectedSession?.id ?? null
        return {
          ...prev,
          cols: 3,
          rows: 1,
          colSizes: [null, null, null],
          rowSizes: [null],
          panelKinds: ["explorer", "editor", "session"],
          sessions: [null, null, curSessionId],
          panelIds: [prev.panelIds[0] ?? genPanelId(), genPanelId(), prev.panelIds[1] ?? genPanelId()],
          panelEditorPaths: { 1: filePath },
          panelEditorTabStacks: { 1: [filePath] },
          panelEditorActive: { 1: 0 },
        }
      }

      // 5. Si hay un panel activo que no sea el chat, abrir el editor allí
      const activeKind = prev.panelKinds[activePanel]
      if (activeKind !== "session") {
        const panelKinds = [...prev.panelKinds]
        panelKinds[activePanel] = "editor"
        const prevTabs = prev.panelEditorTabStacks?.[activePanel] ?? (prev.panelEditorPaths?.[activePanel] ? [prev.panelEditorPaths[activePanel]] : [])
        const nextTabs = prevTabs.includes(filePath) ? prevTabs : [...prevTabs, filePath]
        // si ya era editor, preserva tabs; si no, nuevo tab único
        const tabs = prev.panelKinds[activePanel] === "editor" ? nextTabs : [filePath]
        const active = tabs.indexOf(filePath)
        return {
          ...prev,
          panelKinds,
          panelEditorTabStacks: { ...prev.panelEditorTabStacks, [activePanel]: tabs },
          panelEditorActive: { ...prev.panelEditorActive, [activePanel]: active },
          panelEditorPaths: {
            ...prev.panelEditorPaths,
            [activePanel]: filePath,
          }
        }
      }

      // 6. Colocar editor en posición activa a la izquierda del chat
      const cols = prev.cols + 1
      const col = activePanel % prev.cols
      const sessions: Array<string | null> = []
      const panelKinds: Array<ShellPanelKind | "editor"> = []
      const panelIds: Array<string> = []
      const panelEditorPaths: Record<number, string> = {}
      const panelEditorTabStacks: Record<number, string[]> = {}
      const panelEditorActive: Record<number, number> = {}

      for (let r = 0; r < prev.rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (c < col) {
            const oldIdx = r * prev.cols + c
            sessions.push(prev.sessions[oldIdx] ?? null)
            panelKinds.push(prev.panelKinds[oldIdx] ?? "session")
            panelIds.push(prev.panelIds[oldIdx] ?? genPanelId())
            if (prev.panelEditorPaths?.[oldIdx]) panelEditorPaths[sessions.length - 1] = prev.panelEditorPaths[oldIdx]
            if (prev.panelEditorTabStacks?.[oldIdx]) panelEditorTabStacks[sessions.length - 1] = prev.panelEditorTabStacks[oldIdx]
            if (prev.panelEditorActive?.[oldIdx] != null) panelEditorActive[sessions.length - 1] = prev.panelEditorActive[oldIdx]!
          } else if (c === col) {
            sessions.push(null)
            panelKinds.push("editor")
            panelIds.push(genPanelId())
            panelEditorPaths[sessions.length - 1] = filePath
            panelEditorTabStacks[sessions.length - 1] = [filePath]
            panelEditorActive[sessions.length - 1] = 0
          } else {
            const oldIdx = r * prev.cols + (c - 1)
            sessions.push(prev.sessions[oldIdx] ?? null)
            panelKinds.push(prev.panelKinds[oldIdx] ?? "session")
            panelIds.push(prev.panelIds[oldIdx] ?? genPanelId())
            if (prev.panelEditorPaths?.[oldIdx]) panelEditorPaths[sessions.length - 1] = prev.panelEditorPaths[oldIdx]
            if (prev.panelEditorTabStacks?.[oldIdx]) panelEditorTabStacks[sessions.length - 1] = prev.panelEditorTabStacks[oldIdx]
            if (prev.panelEditorActive?.[oldIdx] != null) panelEditorActive[sessions.length - 1] = prev.panelEditorActive[oldIdx]!
          }
        }
      }

      return {
        ...prev,
        cols,
        sessions,
        panelKinds,
        panelIds,
        panelEditorPaths,
        panelEditorTabStacks,
        panelEditorActive,
        colSizes: new Array(cols).fill(null),
      }
    })
  }, [isDesktop, selectedSession?.id, activePanel])

  const handleEditorTabSelect = useCallback((panelIdx: number, path: string) => {
    setDesktopLayout((prev) => {
      const tabs = prev.panelEditorTabStacks?.[panelIdx] ?? (prev.panelEditorPaths?.[panelIdx] ? [prev.panelEditorPaths[panelIdx]] : [])
      const active = tabs.indexOf(path)
      if (active === -1) return prev
      return { ...prev, panelEditorActive: { ...prev.panelEditorActive, [panelIdx]: active }, panelEditorPaths: { ...prev.panelEditorPaths, [panelIdx]: path } }
    })
    setActivePanel(panelIdx)
  }, [])

  const handleEditorTabClose = useCallback((panelIdx: number, path: string) => {
    const tabs = desktopLayout.panelEditorTabStacks?.[panelIdx] ?? (desktopLayout.panelEditorPaths?.[panelIdx] ? [desktopLayout.panelEditorPaths[panelIdx]] : [])
    if (tabs.length <= 1) {
      closePanel(panelIdx)
      return
    }
    setDesktopLayout((prev) => {
      const prevTabs = [...(prev.panelEditorTabStacks?.[panelIdx] ?? [])]
      const idx = prevTabs.indexOf(path)
      if (idx === -1) return prev
      const nextTabs = prevTabs.filter((t) => t !== path)
      const prevActive = prev.panelEditorActive?.[panelIdx] ?? 0
      let nextActive = prevActive
      if (idx < prevActive) nextActive = prevActive - 1
      else if (idx === prevActive) nextActive = Math.min(prevActive, nextTabs.length - 1)
      const nextActivePath = nextTabs[nextActive]
      return {
        ...prev,
        panelEditorTabStacks: { ...prev.panelEditorTabStacks, [panelIdx]: nextTabs },
        panelEditorActive: { ...prev.panelEditorActive, [panelIdx]: nextActive },
        panelEditorPaths: nextActivePath ? { ...prev.panelEditorPaths, [panelIdx]: nextActivePath } : prev.panelEditorPaths,
      }
    })
  }, [desktopLayout.panelEditorTabStacks, desktopLayout.panelEditorPaths, closePanel])

  // Memoizado: un objeto literal por render re-renderiza todo el árbol del
  // chat (SessionChatPanel/ChatView) con cada setState global.
  // composer/onComposerChange se pasan aparte para no invalidar el memo en cada keystroke.
  // Referencia ESTABLE de los mensajes de la sesión visible: sin esto, el
  // .filter() dentro de baseChatProps creaba un array nuevo en cada recompute
  // y derrotaba el memo de MessageList/MessageBubble (lag de teclado/stream).
  const visibleRenderedMessages = useMemo(
    () => (selectedSession ? renderedMessages.filter((m) => m.info.sessionID === selectedSession.id) : renderedMessages),
    [renderedMessages, selectedSession]
  )

  const baseChatProps: Omit<ChatViewProps, 'composer' | 'onComposerChange'> = useMemo(() => ({
    selectedSession,
    revertID: localRevertID,
    // Cinturón y tiradores: cualquier raza de switch residual NUNCA cruza
    // la frontera de render (contaminación entre chats).
    messages: visibleRenderedMessages,
    pendingIndex, todos,
    todosExpanded,
    isWorking, showTypingBubble, isSending,
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
    onSend: (imgs, opts, text) => handleSend(imgs, opts, text),
    onAbort: handleAbort,
    onTodosToggle: () => setTodosExpanded((v) => !v),
    onBackToSessions: goBack,
    onSheetOpen: setActiveDetailSheet,
    recentSessions, sessions,
    onOpenSession: handleOpenSession,
    readingMode, onToggleReadingMode: () => setReadingMode((v) => !v),
    onExportChat: handleExportChat, onExportMarkdown: handleExportMarkdown, onSnapshot: handleSnapshot,
    onEditFile: (file) => handleOpenFile(file),
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
    minimalistMode: chatSettings.minimalistMode,
    thinkingDefault: chatSettings.thinkingDefault,
    onRegenerate: handleRegenerate,
    onInsertPrompt: handleInsertPrompt,
    onSendPrompt: handleSendPrompt,
    chatSettings,
    onChatSettingChange: setChatSetting,
    onResetChatSettings: resetChatSettings,
    visualSelection: vs.selection,
    onClearVisualSelection: vs.clear,
    onFocusVisualFile: (path: string) => handleOpenFile(path),
  }), [
    selectedSession, localRevertID, renderedMessages, todos, todosExpanded,
    isWorking, showTypingBubble, loadingSessionID, selectedID, messageScrollSignature,
    view, dataMode, renamingSessionID, renameValue, commands,
    activeAgent, activeAgentID, activeModelOption, activeModelVariants, selectedVariant, changeVariant, primaryAgentOptions, changeAgent,
    projectName, startRename, setRenameValue, renameSession, cancelRename,
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
    visibleRenderedMessages, vs.selection, vs.clear, handleOpenFile,
  ])

  const activeSessionSid = isDesktop ? desktopLayout.sessions[Math.min(activePanel, desktopLayout.sessions.length - 1)] : selectedSession?.id
  const currentActiveSession = (activeSessionSid ? sessions.find((s) => s.id === activeSessionSid) : null)
    ?? selectedSession
    ?? (desktopLayout.sessions.find(Boolean) ? sessions.find((s) => s.id === desktopLayout.sessions.find(Boolean)) : null)
    ?? sessions[0]
    ?? null
  const activeSessionDir = currentActiveSession?.directory ?? selectedSession?.directory ?? sessions[0]?.directory ?? undefined

  // DRY: reutiliza handleOpenFile (que ya gestiona tabs VS Code) en vez de duplicar lógica
  const handleOpenFileFromExplorer = useCallback((filePath: string) => {
    handleOpenFile(filePath)
  }, [handleOpenFile])

  const handleOpenBrowser = useCallback((url: string) => {
    if (isDesktop) {
      const existingBrowserIdx = desktopLayout.panelKinds.findIndex((k) => k === "browser")
      if (existingBrowserIdx >= 0) {
        setDesktopLayout((prev) => ({
          ...prev,
          panelBrowserUrls: { ...(prev.panelBrowserUrls ?? {}), [existingBrowserIdx]: url },
        }))
        setActivePanel(existingBrowserIdx)
        return
      }

      const hasActiveSession = desktopLayout.sessions.some(Boolean)
      if (hasActiveSession) {
        if (desktopLayout.cols === 1) {
          setDesktopLayout((prev) => ({
            ...prev,
            cols: 2,
            colSizes: [null, null],
            panelKinds: [prev.panelKinds[0] ?? "session", "browser"],
            panelBrowserUrls: { ...(prev.panelBrowserUrls ?? {}), 1: url },
          }))
          setActivePanel(1)
        } else {
          const targetPanel = activePanel === 0 ? 1 : activePanel
          setDesktopLayout((prev) => ({
            ...prev,
            panelKinds: prev.panelKinds.map((k, idx) => (idx === targetPanel ? "browser" : k)),
            panelBrowserUrls: { ...(prev.panelBrowserUrls ?? {}), [targetPanel]: url },
          }))
          setActivePanel(targetPanel)
        }
      } else {
        setDesktopLayout((prev) => ({
          ...prev,
          cols: 1,
          colSizes: [null],
          panelKinds: ["browser"],
          panelBrowserUrls: { ...(prev.panelBrowserUrls ?? {}), 0: url },
        }))
        setActivePanel(0)
      }
    } else {
      window.open(url, "_blank")
    }
  }, [isDesktop, desktopLayout, activePanel])

  const handleOpenDesign = useCallback(() => {
    if (!isDesktop) return
    const existingPanelIdx = desktopLayout.panelKinds.findIndex((k) => k === "design")
    if (existingPanelIdx >= 0) {
      setActivePanel(existingPanelIdx)
      return
    }
    // Si ya hay un tab __design__ en algún panel de sesiones, enfocarlo
    const designTabPanelIdx = tabStacks?.findIndex((stack) => stack.includes("__design__"))
    if (designTabPanelIdx !== undefined && designTabPanelIdx >= 0) {
      setActivePanel(designTabPanelIdx)
      setDesktopLayout((prev) => {
        const sessions = [...prev.sessions]
        sessions[designTabPanelIdx] = "__design__"
        const panelKinds = [...prev.panelKinds] as Array<ShellPanelKind | "editor">
        panelKinds[designTabPanelIdx] = "session"
        return { ...prev, sessions, panelKinds }
      })
      return
    }
    const hasSession = desktopLayout.sessions.some(Boolean)
    if (hasSession) {
      const targetIdx = Math.min(activePanel, desktopLayout.cols * desktopLayout.rows - 1)
      // Abrir como pestaña más dentro de las pestañas de sesiones (si hay sesión abierta)
      setTabStacks((prev) => {
        const next = (prev ?? []).map((s) => [...s])
        while (next.length <= targetIdx) next.push([])
        if (!next[targetIdx].includes("__design__")) next[targetIdx] = [...next[targetIdx], "__design__"]
        return next
      })
      setDesktopLayout((prev) => {
        const sessions = [...prev.sessions]
        sessions[targetIdx] = "__design__"
        const panelKinds = [...prev.panelKinds] as Array<ShellPanelKind | "editor">
        panelKinds[targetIdx] = "session"
        return { ...prev, sessions, panelKinds }
      })
      setActivePanel(targetIdx)
      return
    }
    addPanel("design")
  }, [isDesktop, desktopLayout, activePanel, tabStacks, addPanel, setTabStacks, setDesktopLayout])

  const handleOpenKanban = useCallback(() => {
    if (!isDesktop) return
    const existingPanelIdx = desktopLayout.panelKinds.findIndex((k) => k === "kanban")
    if (existingPanelIdx >= 0) {
      setActivePanel(existingPanelIdx)
      return
    }
    const kanbanTabPanelIdx = tabStacks?.findIndex((stack) => stack.includes("__kanban__"))
    if (kanbanTabPanelIdx !== undefined && kanbanTabPanelIdx >= 0) {
      setActivePanel(kanbanTabPanelIdx)
      setDesktopLayout((prev) => {
        const sessions = [...prev.sessions]
        sessions[kanbanTabPanelIdx] = "__kanban__"
        const panelKinds = [...prev.panelKinds] as Array<ShellPanelKind | "editor">
        panelKinds[kanbanTabPanelIdx] = "session"
        return { ...prev, sessions, panelKinds }
      })
      return
    }
    const hasSession = desktopLayout.sessions.some(Boolean)
    if (hasSession) {
      const targetIdx = Math.min(activePanel, desktopLayout.cols * desktopLayout.rows - 1)
      setTabStacks((prev) => {
        const next = (prev ?? []).map((s) => [...s])
        while (next.length <= targetIdx) next.push([])
        if (!next[targetIdx].includes("__kanban__")) next[targetIdx] = [...next[targetIdx], "__kanban__"]
        return next
      })
      setDesktopLayout((prev) => {
        const sessions = [...prev.sessions]
        sessions[targetIdx] = "__kanban__"
        const panelKinds = [...prev.panelKinds] as Array<ShellPanelKind | "editor">
        panelKinds[targetIdx] = "session"
        return { ...prev, sessions, panelKinds }
      })
      setActivePanel(targetIdx)
      return
    }
    addPanel("kanban")
  }, [isDesktop, desktopLayout, activePanel, tabStacks, addPanel, setTabStacks, setDesktopLayout])

  const handleVisualSelect = useCallback((filePath: string, payload: { selectedText: string; lineStart: number | null; lineEnd: number | null; surroundingContext: string; boundingRect?: { x: number; y: number; w: number; h: number } }) => {
    const fileName = filePath.split(/[/\\]/).pop() || filePath
    vs.select({
      filePath,
      fileName,
      lineStart: payload.lineStart,
      lineEnd: payload.lineEnd,
      selectedText: payload.selectedText,
      surroundingContext: payload.surroundingContext,
      boundingRect: payload.boundingRect,
    })
  }, [vs])

  const handleBrowserVisualPick = useCallback((url: string, el: any) => {
    // Zonas múltiples: cada interacción agrega una anotación (badge en la página).
    // picker = 1 elemento · pod = área arrastrada con members[]
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
  }, [vs])

  const handleToggleInspectTool = useCallback((tool: "picker" | "pod") => {
    if (vs.inspectMode && vs.inspectTool === tool) {
      vs.setInspectMode(false)
      return
    }
    vs.setInspectTool(tool)
    vs.setInspectMode(true)
  }, [vs])

  const detailView = <ChatView {...baseChatProps} composer={composer} onComposerChange={handleComposerChange} onOpenBrowser={handleOpenBrowser} />

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
            <button type="button" className={`activity-btn${desktopLayout.panelKinds.includes("stats" as any) || activity === "stats" ? " active" : ""}`} title={t('shell.kindStats')} aria-label={t('shell.kindStats')}
              onClick={() => {
                const idx = desktopLayout.panelKinds.indexOf("stats" as any)
                if (idx >= 0) {
                  closePanel(idx)
                } else {
                  addPanel("stats")
                }
              }}>
              <StatsIcon size={18} /></button>
            <button type="button" className="activity-btn" title="Navegador Web / Localhost" aria-label="Navegador Web"
              onClick={() => {
                handleOpenBrowser("http://localhost:5173")
              }}>
              <GlobeIcon size={18} /></button>
            <button type="button" className={`activity-btn${(tabStacks?.some((s) => s.includes("__kanban__")) || desktopLayout.sessions.includes("__kanban__") || desktopLayout.panelKinds.includes("kanban" as any) ? " active" : "")}`} title={t('shell.kindKanban')} aria-label={t('shell.kindKanban')}
              onClick={handleOpenKanban}>
              <LayersIcon size={18} /></button>
            <button type="button" className={`activity-btn${activity === "quickchat" ? " active" : ""}`} title={t('quickchat.title')} aria-label={t('quickchat.title')}
              onClick={() => { if (activity === "quickchat") setSidebarCollapsed(!sidebarCollapsed); else { setActivity("quickchat"); setSidebarCollapsed(false) } }}>
              <BrainIcon size={18} /></button>
            <button type="button" className={`activity-btn${(tabStacks?.some((s) => s.includes("__design__")) || desktopLayout.sessions.includes("__design__") || desktopLayout.panelKinds.includes("design" as any) ? " active" : "")}`} title="Open Design" aria-label="Open Design"
              onClick={handleOpenDesign}>
              <PencilIcon size={18} /></button>
          </div>
          <div className="app-desktop-activity-bottom">
            {memInfo && (
              <div className="activity-ram-chip" title={`JS Heap: ${formatBytes(memInfo.jsHeapUsed)} / ${formatBytes(memInfo.jsHeapTotal)}`}>
                {formatBytes(memInfo.jsHeapUsed)}
              </div>
            )}
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
                    : activity === "quickchat" ? t('quickchat.title')
                    : t('shell.kindConfig')}
                </span>
                <span className="desktop-sidebar-actions">
                  <button type="button" className="btn-icon compact" title={t('desktop.collapseSidebar')} aria-label={t('desktop.collapseSidebar')} onClick={() => setSidebarCollapsed(true)}>«</button>
                </span>
              </div>
              <div className="desktop-sidebar-body">
                <Suspense fallback={PANEL_SUSPENSE_FALLBACK}>
                  {activity === "sessions" ? sessionsView
                    : activity === "explorer" ? <ExplorerPanel onOpenSessionDir={openSessionInDir} initialCwd={explorerCwd || activeSessionDir} onOpenFile={handleOpenFileFromExplorer} />
                    : activity === "stats" ? <StatsPanel />
                    : activity === "quickchat" ? <QuickChatPanel cerebrasKey={quickChatKey} groqKey={quickChatGroqKey} goKey={quickChatGoKey} config={config} modelOptions={modelOptions} providers={providerList} onOpenSettings={() => handleNavigate("settings")} />
                    : <ConfigPanel />}
                </Suspense>
              </div>
              <div className="desktop-sidebar-resizer" onPointerDown={startSidebarResize} title={t('desktop.resizeSidebar')} />
            </>
          )}
        </aside>
      )}

      <main className={isDesktop ? "app-desktop-content" : "app-mobile-content"}>
        {view === "sessions" && !isDesktop && sessionsView}

        {isDesktop && (view === "sessions" || view === "detail" || view === "settings" || view === "help") && (
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
                gridRef.current.style.gridTemplateColumns = cols.map((x) => x === "handle" ? "4px" : x ? `${x}px` : "1fr").join(" ")
              }
              const onMove = (ev: PointerEvent) => {
                sizes[colIndex] = Math.max(220, Math.min(900, startSize + (ev.clientX - startX)))
                apply()
              }
              let committed = false
              const onUp = () => {
                if (committed) return
                committed = true
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
                gridRef.current.style.gridTemplateRows = rows.map((x) => x === "handle" ? "4px" : x ? `${x}px` : "1fr").join(" ")
              }
              const onMove = (ev: PointerEvent) => {
                sizes[rowIndex] = Math.max(200, Math.min(800, startSize + (ev.clientY - startY)))
                apply()
              }
              let committed = false
              const onUp = () => {
                if (committed) return
                committed = true
                document.body.style.userSelect = ""
                document.body.style.cursor = ""
                window.removeEventListener("pointermove", onMove)
                window.removeEventListener("pointerup", onUp)
                setDesktopLayout((prev) => ({ ...prev, rowSizes: sizes }))
              }
              window.addEventListener("pointermove", onMove)
              window.addEventListener("pointerup", onUp)
            }
            const busySessions = new Set(sessions.filter((s) => s.status === "busy" || s.status === "retry").map((s) => s.id))
            const cells = Array.from({ length: desktopLayout.cols * desktopLayout.rows }).map((_, i) => {
              const kind = desktopLayout.panelKinds[i] ?? "session"
              const sid = desktopLayout.sessions[i]
              const session = sid ? sessions.find((s) => s.id === sid) ?? null : null
              const panelId = desktopLayout.panelIds?.[i] ?? `panel-${i}`
              const col = i % desktopLayout.cols
              const row = Math.floor(i / desktopLayout.cols)
              const placement = { gridColumn: col * 2 + 1, gridRow: row * 2 + 1 }
              // Terminales: arrancan en la ruta de la sesión del panel activo
              // (selectedSession no se setea en desktop; cada panel gestiona
              // su propia sesión).
              const activeSid = desktopLayout.sessions[Math.min(activePanel, desktopLayout.sessions.length - 1)]
              const activeDir = activeSid ? sessions.find((s) => s.id === activeSid)?.directory ?? undefined : undefined
                if (kind === "session") {
                  if (sid === "__design__") {
                    const stack = tabStacks?.[i] ?? ["__design__"]
                    const allWithDesign = [...sessions, { id: "__design__", title: "Open Design", directory: "" } as any]
                    return (
                      <div key={panelId} style={placement} className="desktop-cell">
                        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                          <TabBar tabs={stack} activeIndex={stack.indexOf("__design__")} sessions={allWithDesign} busySessionIds={busySessions} onSwitch={(idx) => {
                            const tabId = stack[idx]
                            if (tabId === "__design__") {
                              setDesktopLayout((prev) => {
                                const sessions = [...prev.sessions]
                                sessions[i] = "__design__"
                                return { ...prev, sessions }
                              })
                              setActivePanel(i)
                            } else {
                              switchTab(i, idx)
                            }
                          }} onClose={(idx) => {
                            const tabId = stack[idx]
                            if (tabId === "__design__") {
                              setTabStacks((prev) => {
                                const next = (prev ?? []).map((s) => [...s])
                                if (next[i]) next[i] = next[i].filter((id) => id !== "__design__")
                                return next
                              })
                              const nextStack = (tabStacks?.[i] ?? []).filter((id) => id !== "__design__")
                              const nextSid = nextStack[0] ?? null
                              setDesktopLayout((prev) => {
                                const sessions = [...prev.sessions]
                                sessions[i] = nextSid
                                return { ...prev, sessions }
                              })
                            } else {
                              removeTab(i, idx)
                            }
                          }} onAdd={() => {}} onMoveTab={(from, to) => moveTab(i, from, to)} />
                          <div style={{ flex: 1, minHeight: 0 }}>
                            <Suspense fallback={PANEL_SUSPENSE_FALLBACK}>
                              <DesignPanel />
                            </Suspense>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  if (sid === "__kanban__") {
                    const stack = tabStacks?.[i] ?? ["__kanban__"]
                    const allWithKanban = [...sessions, { id: "__kanban__", title: "Kanban", directory: "" } as any]
                    return (
                      <div key={panelId} style={placement} className="desktop-cell">
                        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                          <TabBar tabs={stack} activeIndex={stack.indexOf("__kanban__")} sessions={allWithKanban} busySessionIds={busySessions} onSwitch={(idx) => {
                            const tabId = stack[idx]
                            if (tabId === "__kanban__") {
                              setDesktopLayout((prev) => {
                                const sessions = [...prev.sessions]
                                sessions[i] = "__kanban__"
                                return { ...prev, sessions }
                              })
                              setActivePanel(i)
                            } else {
                              switchTab(i, idx)
                            }
                          }} onClose={(idx) => {
                            const tabId = stack[idx]
                            if (tabId === "__kanban__") {
                              setTabStacks((prev) => {
                                const next = (prev ?? []).map((s) => [...s])
                                if (next[i]) next[i] = next[i].filter((id) => id !== "__kanban__")
                                return next
                              })
                              const nextStack = (tabStacks?.[i] ?? []).filter((id) => id !== "__kanban__")
                              const nextSid = nextStack[0] ?? null
                              setDesktopLayout((prev) => {
                                const sessions = [...prev.sessions]
                                sessions[i] = nextSid
                                return { ...prev, sessions }
                              })
                            } else {
                              removeTab(i, idx)
                            }
                          }} onAdd={() => {}} onMoveTab={(from, to) => moveTab(i, from, to)} />
                          <div style={{ flex: 1, minHeight: 0 }}>
                            <Suspense fallback={PANEL_SUSPENSE_FALLBACK}>
                              <KanbanPanel />
                            </Suspense>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  // Si el tab activo es un terminal (compartido en el mismo tabset), renderizar TerminalPanel
                if (sid && sid.startsWith("terminal")) {
                  const termCwd = activeDir || activeSessionDir || selectedSession?.directory || sessions[0]?.directory
                  const tStack = tabStacks?.[i] ?? [sid]
                  const tActiveIdx = Math.max(0, tStack.indexOf(sid))
                  return (
                    <div key={panelId} style={placement} className="desktop-cell">
                      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        <TabBar
                          tabs={tStack}
                          activeIndex={tActiveIdx}
                          sessions={sessions}
                          busySessionIds={busySessions}
                          onSwitch={(idx) => switchTab(i, idx)}
                          onClose={(idx) => removeTab(i, idx)}
                          onAdd={() => addTerminalToPanel(i)}
                          onMoveTab={(from, to) => moveTab(i, from, to)}
                          panelIndex={i}
                          onDropTerminal={addTerminalToPanel}
                        />
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <Suspense fallback={PANEL_SUSPENSE_FALLBACK}>
                            <TerminalPanel cwd={termCwd} panelId={`${panelId}-term`} />
                          </Suspense>
                        </div>
                      </div>
                    </div>
                  )
                }
                if (!session) {
                  return (
                    <div key={panelId} className="desktop-cell-placeholder" style={placement} onClick={() => setActivePanel(i)}>
                      <button type="button" className="btn-icon compact desktop-cell-close"
                        title="Close split" aria-label="Close split"
                        onClick={(e) => { e.stopPropagation(); closePanel(i) }}>×</button>
                      <FolderIcon size={48} className="icon-empty-state" />
                      <p>{t('sessions.selectOne')}</p>
                    </div>
                  )
                }
                return (
                  <div key={panelId} style={placement} className="desktop-cell">
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
                      onSwapPanels={handleSwapPanels}
                      onOpenFile={handleOpenFile}
                      onOpenConnect={() => setShowConnectSheet(true)}
                      onOpenBrowser={handleOpenBrowser}
                      tabStack={tabStacks?.[i] ?? (session ? [session.id] : [])}
                      allSessions={(() => {
                        const stack = tabStacks?.[i] ?? (session ? [session.id] : [])
                        const extra: any[] = []
                        if (stack.includes("__design__")) extra.push({ id: "__design__", title: "Open Design", directory: "" })
                        if (stack.includes("__kanban__")) extra.push({ id: "__kanban__", title: "Kanban", directory: "" })
                        return extra.length ? [...sessions, ...extra] : sessions
                      })()}
                      busySessionIds={busySessions}
                      onTabSwitch={(panelIdx, tabIdx) => {
                        const stack = tabStacks?.[panelIdx] ?? []
                        const tabId = stack[tabIdx] ?? (tabIdx === 0 && session ? session.id : undefined)
                        if (tabId === "__design__" || tabId === "__kanban__") {
                          setDesktopLayout((prev) => {
                            const sessions = [...prev.sessions]
                            sessions[panelIdx] = tabId
                            return { ...prev, sessions }
                          })
                          setActivePanel(panelIdx)
                        } else {
                          switchTab(panelIdx, tabIdx)
                        }
                      }}
                      onTabClose={(panelIdx, tabIdx) => {
                        const stack = tabStacks?.[panelIdx] ?? []
                        const tabId = stack[tabIdx]
                        if (tabId === "__design__" || tabId === "__kanban__") {
                          setTabStacks((prev) => {
                            const next = (prev ?? []).map((s) => [...s])
                            if (next[panelIdx]) next[panelIdx] = next[panelIdx].filter((id) => id !== tabId)
                            return next
                          })
                        } else {
                          removeTab(panelIdx, tabIdx)
                        }
                      }}
                      onTabAdd={() => {}} // TODO: open session picker
                      onTabMove={(from, to) => moveTab(i, from, to)}
                      onDropTerminal={addTerminalToPanel}
                      visualSelection={vs.selection}
                      visualPromptContext={vs.promptContext}
                      onClearVisualSelection={vs.clear}
                      onFocusVisualFile={handleOpenFile}
                    />
                  </div>
                )
              }
              if (kind === "editor") {
                const editorTabs = desktopLayout.panelEditorTabStacks?.[i] ?? (desktopLayout.panelEditorPaths?.[i] ? [desktopLayout.panelEditorPaths[i]] : [])
                const editorActiveIdx = desktopLayout.panelEditorActive?.[i] ?? 0
                const editorPath = editorTabs[editorActiveIdx] ?? desktopLayout.panelEditorPaths?.[i] ?? ""
                return (
                  <div key={panelId} style={placement} className="desktop-cell" onClick={() => setActivePanel(i)}>
                    <Suspense fallback={PANEL_SUSPENSE_FALLBACK}>
                      <FileEditorPanel
                        path={editorPath}
                        tabs={editorTabs}
                        activePath={editorPath}
                        initialCwd={activeSessionDir}
                        onTabSelect={(p) => handleEditorTabSelect(i, p)}
                        onTabClose={(p) => handleEditorTabClose(i, p)}
                        onClose={() => closePanel(i)}
                        visualSelection={vs.selection}
                        inspectMode={vs.inspectMode}
                        onVisualSelect={(payload) => handleVisualSelect(editorPath, payload)}
                        onVisualClear={vs.clear}
                        onToggleInspect={vs.toggleInspect}
                      />
                    </Suspense>
                  </div>
                )
              }
              if (kind === "browser") {
                const browserUrl = desktopLayout.panelBrowserUrls?.[i] || "http://localhost:5173"
                return (
                  <div key={panelId} style={placement} className="desktop-cell" onClick={() => setActivePanel(i)}>
                    <Suspense fallback={<div className="panel-loading" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>Cargando navegador...</div>}>
                      <BrowserPanel
                        initialUrl={browserUrl}
                        onClose={() => closePanel(i)}
                        visualSelection={vs.selection}
                        inspectMode={vs.inspectMode}
                        onVisualPick={(el) => handleBrowserVisualPick(browserUrl, el)}
                        onToggleInspect={vs.toggleInspect}
                        onClearVisual={vs.clearAnnotations}
                        annotations={vs.annotations}
                        onAnnotationComment={vs.setAnnotationComment}
                        onRemoveAnnotation={vs.removeAnnotation}
                        onAnnotationStyle={vs.setAnnotationStyle}
                        onAnnotationStyleBefore={vs.setAnnotationStyleBefore}
                        inspectTool={vs.inspectTool}
                        onToggleInspectTool={handleToggleInspectTool}
                      />
                    </Suspense>
                  </div>
                )
              }
              if (kind === "quickchat") {
                return (
                  <div key={panelId} style={placement} className="desktop-cell" onClick={() => setActivePanel(i)}>
                    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 6px", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                        <span>{t('quickchat.title')}</span>
                        <button className="btn-icon compact" onClick={() => closePanel(i)} aria-label={t('panel.close')}>×</button>
                      </div>
                      <div style={{ flex: 1, minHeight: 0 }}>
                        <QuickChatPanel cerebrasKey={quickChatKey} groqKey={quickChatGroqKey} goKey={quickChatGoKey} config={config} modelOptions={modelOptions} providers={providerList} onOpenSettings={() => handleNavigate("settings")} />
                      </div>
                    </div>
                  </div>
                )
              }
              // Paneles de la shell (terminal, explorador, kanban, docs...)
              return (
                <div key={panelId} style={placement} className="desktop-cell" onClick={() => setActivePanel(i)}>
                  <ShellPanelCell
                    index={i}
                    panelId={panelId}
                    kind={kind}
                    cwd={kind === "terminal" ? (activeDir || activeSessionDir || selectedSession?.directory || sessions[0]?.directory) : (session?.directory || activeSessionDir || selectedSession?.directory || sessions[0]?.directory)}
                    sessionID={session?.id}
                    active={activePanel === i}
                    onActivate={() => setActivePanel(i)}
                    onClose={() => closePanel(i)}
                    onOpenSessionDir={openSessionInDir}
                    onSplitSession={handleDockSession}
                    onSwapPanels={handleSwapPanels}
                    onOpenFile={handleOpenFile}
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
                      onSwapPanels={handleSwapPanels}
                      onOpenFile={handleOpenFile}
                      onOpenConnect={() => setShowConnectSheet(true)}
                      onOpenBrowser={handleOpenBrowser}
                      tabStack={tabStacks?.[maximizedIndex]?.length ? tabStacks[maximizedIndex] : (maximizedSession ? [maximizedSession.id] : [])}
                      allSessions={sessions}
                      busySessionIds={busySessions}
                      onTabSwitch={switchTab}
                      onTabClose={removeTab}
                      onTabAdd={() => {}}
                      onTabMove={(from, to) => moveTab(maximizedIndex, from, to)}
                      visualSelection={vs.selection}
                      visualPromptContext={vs.promptContext}
                      onClearVisualSelection={vs.clear}
                      onFocusVisualFile={handleOpenFile} />
                  </div>
                ) : (
                  <div className="desktop-grid" ref={gridRef}
                    data-cols={desktopLayout.cols}
                    style={{
                      gridTemplateColumns: gridCols.map((x) => x === "handle" ? "4px" : x ? `${x}px` : "minmax(0, 1fr)").join(" "),
                      gridTemplateRows: gridRows.map((x) => x === "handle" ? "4px" : x ? `${x}px` : "minmax(0, 1fr)").join(" "),
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
        <div className={`settings-view${isDesktop ? " settings-overlay" : ""}`}>
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
            connectProvider(pid, key).then((ok) => { if (ok) loadModels().catch(() => undefined) })
          }}
          onDisconnectProvider={(pid) => { disconnectProvider(pid).then(() => loadModels().catch(() => undefined)) }}
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
          onOpenOpenCodeHub={() => setShowOpenCodeHub(true)}
          onClose={() => {
            if (navStackRef.current.length > 0) goBack()
            else handleNavigate(desktopLayout.sessions.some(Boolean) ? "detail" : "sessions")
          }} />
        </div>
      )}

      {view === "help" && (
        <div className={`help-view${isDesktop ? " settings-overlay" : ""}`}>
        <Suspense fallback={null}>
          <HelpPage
            helpPage={helpPage}
            onHelpPageChange={setHelpPage}
            commands={commands}
            commandFilter={commandFilter}
            onCommandFilterChange={setCommandFilter} />
        </Suspense>
        </div>
      )}

      {view === "quickchat" && (
        <div className={`quickchat-view${isDesktop ? " settings-overlay" : ""}`} style={{ height: isDesktop ? "100%" : "calc(100dvh - 56px)", display: "flex", flexDirection: "column" }}>
          <Suspense fallback={null}>
            <QuickChatPanel cerebrasKey={quickChatKey} groqKey={quickChatGroqKey} goKey={quickChatGoKey} config={config} modelOptions={modelOptions} providers={providerList} onOpenSettings={() => handleNavigate("settings")} />
          </Suspense>
        </div>
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

      {showConnectSheet && config && (
        <Suspense fallback={null}>
          <ConnectProviderSheet
            config={config}
            onClose={() => setShowConnectSheet(false)}
            onConnect={connectProvider}
            onDisconnect={disconnectProvider}
            onAddCustom={addCustomProvider}
            onConnected={() => loadModels().catch(() => undefined)}
          />
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

            <OpenCodeHubModal
        isOpen={showOpenCodeHub}
        onClose={() => setShowOpenCodeHub(false)}
        agents={agentOptions}
        activeAgentID={activeAgentID}
        onSelectAgent={(id) => changeAgent(id, selectedSession?.directory)}
        serverConfig={config}
      />

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
