import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { api } from "../../api"
import { useMessages } from "../../hooks/useMessages"
import { useSessionSidecar } from "../../hooks/useSessionSidecar"
import { useVisualSelection } from "../../hooks/useVisualSelection"
import { useChatSettings } from "../../hooks/useChatSettings"
import { usePromptSnippets } from "../../hooks/usePromptSnippets"
import { useQuestions } from "../../hooks/useQuestions"
import { useSSEHandler } from "../../hooks/useSSEHandler"
import { useSSE } from "../../hooks/useSSE"
import { useResumeResync } from "../../hooks/useResumeResync"
import { captureRegionToPng } from "../../utils/screenCapture"
import { injectImageToComposer } from "../../stores/composerInjectStore"
import { useAutomationRunner } from "../../hooks/useAutomationRunner"
import { useAppLifecycle } from "../../features/app-lifecycle/hooks/useAppLifecycle"
import { useChatActions } from "../../features/chat/hooks/useChatActions"
import type { HelpPage, FileDiff } from "../../types"
import type { ConnectionRuntime } from "./useConnectionRuntime"
import type { WorkspaceRuntime } from "./useWorkspaceRuntime"

export type UseChatRuntimeParams = {
  conn: ConnectionRuntime
}

/**
 * Núcleo del runtime de chat: mensajes, sidecar (todos/diffs/dashboard),
 * compositor, comandos, selección visual, ajustes de chat y el cargador
 * `onLoadSelected` que consume el runtime de workspace al abrir una sesión.
 */
export function useChatRuntime({ conn }: UseChatRuntimeParams) {
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
    outbox,
    enqueueOutbox,
    removeOutbox,
    clearSession,
    preloadMessages,
    loadSelected,
    send,
    abortSession,
    messages,
    setMessages,
    undoMessage,
    redoMessage,
    compactSession,
    applyDelta,
    applyPart,
    compacting,
    setCompacting,
    getAwaitingBaselineID,
  } = useMessages(conn.config)

  const composerRef = useRef(composer)
  useEffect(() => {
    composerRef.current = composer
  }, [composer])
  // Espejo fresco para el handler SSE: el callback que recibe useSSEHandler se
  // memoiza por sesión, así que un closure sobre el estado quedaba congelado
  // en el valor de apertura del chat y el settled por SSE nunca veía el
  // awaiting real (el panel desktop ya usa ref por lo mismo).
  const awaitingAssistantReplyRef = useRef(awaitingAssistantReply)
  awaitingAssistantReplyRef.current = awaitingAssistantReply
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
  } = useSessionSidecar(conn.config)

  const [commands, setCommands] = useState<
    { name: string; description?: string; source?: "command" | "mcp" | "skill" }[]
  >([])
  const [commandFilter, setCommandFilter] = useState<"all" | "skill">("all")
  const [helpPage, setHelpPage] = useState<HelpPage>("overview")
  const [query, setQuery] = useState("")

  const backgroundFailureCountRef = useRef(0)
  const initialSessionLoadRef = useRef(true)

  const vs = useVisualSelection()
  // Automatizaciones programadas: prompts recurrentes y comandos de terminal.
  useAutomationRunner({ config: conn.config })

  const {
    settings: chatSettings,
    setSetting: setChatSetting,
    resetDefaults: resetChatSettings,
  } = useChatSettings()
  const { snippets: promptSnippets, addSnippet, removeSnippet } = usePromptSnippets()

  const stopGenerationRef = useRef(false)

  const loadSessionRef = useRef(0)

  const onLoadSelected = useCallback(
    async (id: string, dir: string) => {
      const reqId = ++loadSessionRef.current
      clearSession()
      clearSidecar()
      if (conn.flags.offlineCache) {
        try {
          const cached = await conn.getCachedMessages(id)
          if (cached && cached.length > 0 && reqId === loadSessionRef.current) {
            preloadMessages(id, cached)
          }
        } catch {
          /* ignore */
        }
      }
      conn.loadAgents(dir).catch(() => undefined)
      conn.loadModels(dir).catch(() => undefined)
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
      loadTodos,
      clearSession,
      clearSidecar,
      preloadMessages,
      conn.flags.offlineCache,
      conn.getCachedMessages,
      conn.loadAgents,
      conn.loadModels,
    ]
  )

  useEffect(() => {
    if (activeDetailSheet === "ai") {
      conn.loadModels()
    }
  }, [activeDetailSheet, conn.loadModels])

  return {
    composer,
    setComposer,
    handleComposerChange,
    composerRef,
    isSending,
    awaitingAssistantReply,
    setAwaitingAssistantReply,
    awaitingAssistantReplyRef,
    runtimeError,
    setRuntimeError,
    renderedMessages,
    messageScrollSignature,
    completionShouldPlayRef,
    outbox,
    enqueueOutbox,
    removeOutbox,
    clearSession,
    preloadMessages,
    loadSelected,
    send,
    abortSession,
    messages,
    setMessages,
    undoMessage,
    redoMessage,
    compactSession,
    applyDelta,
    applyPart,
    compacting,
    setCompacting,
    getAwaitingBaselineID,
    localRevertID,
    setLocalRevertID,
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
    commands,
    setCommands,
    commandFilter,
    setCommandFilter,
    helpPage,
    setHelpPage,
    query,
    setQuery,
    backgroundFailureCountRef,
    initialSessionLoadRef,
    vs,
    chatSettings,
    setChatSetting,
    resetChatSettings,
    promptSnippets,
    addSnippet,
    removeSnippet,
    stopGenerationRef,
    onLoadSelected,
  }
}

export type ChatRuntime = ReturnType<typeof useChatRuntime>

export type UseChatActionsRuntimeParams = {
  conn: ConnectionRuntime
  chat: ChatRuntime
  ws: WorkspaceRuntime
}

/**
 * Segunda mitad del runtime de chat: depende de workspace (sesión abierta,
 * navegación, layout desktop) y aporta modelo activo resuelto, preguntas,
 * SSE, ciclo de vida de la app y todas las acciones del chat.
 */
export function useChatActionsRuntime({ conn, chat, ws }: UseChatActionsRuntimeParams) {
  const currentSessionAI = useMemo(() => {
    return conn.getModelForSession(ws.selectedSession?.id)
  }, [conn.getModelForSession, ws.selectedSession?.id])

  const activeModelOption = currentSessionAI.activeModelOption ?? conn.globalActiveModelOption
  const activeModel =
    (currentSessionAI.activeModel
      ? {
          providerID: currentSessionAI.activeModel.providerID,
          modelID: currentSessionAI.activeModel.modelID,
          variant: currentSessionAI.activeModel.variant,
        }
      : null) ??
    (conn.globalActiveModel
      ? {
          providerID: conn.globalActiveModel.providerID,
          modelID: conn.globalActiveModel.modelID,
          variant: conn.globalActiveModel.variant,
        }
      : null)
  const activeModelVariants = currentSessionAI.activeModelVariants ?? conn.globalActiveModelVariants
  const selectedVariant = currentSessionAI.selectedVariant ?? conn.globalSelectedVariant

  const {
    pendingQuestions,
    permissionRequest,
    handleQuestionReply,
    handleQuestionReject,
    handlePermissionApprove,
    handlePermissionReject,
    handleDismissQuestion,
    clearDismissedQuestions,
    dismissSessionQuestions,
    handleDismissPermission,
  } = useQuestions({
    config: conn.config,
    directory: ws.selectedSession?.directory,
    fallbackSessionID: ws.selectedSession?.id,
    enabled: true,
    notify: conn.notify,
    t: conn.t,
  })

  const sseHandler = useSSEHandler({
    sessionID: ws.selectedSession?.id,
    directory: ws.selectedSession?.directory,
    loadSelected: chat.loadSelected,
    applyDelta: chat.applyDelta,
    applyPart: chat.applyPart,
    setAwaitingAssistantReply: chat.setAwaitingAssistantReply,
    setCompacting: chat.setCompacting,
    setRuntimeError: chat.setRuntimeError,
    awaitingRef: () => chat.awaitingAssistantReplyRef.current,
    awaitingBaselineIDRef: chat.getAwaitingBaselineID,
    onSettled: (sid, dir) => {
      ws.setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, status: "idle" as const } : s)))
      chat.loadSelected(sid, dir)
      ws.refreshSessions(true)
    },
  })

  // Stop real en la vista principal: mientras el flag sigue activo se dropean
  // los deltas en vuelo (igual que SessionChatPanel); sin esto el texto
  // seguía creciendo tras el clic aunque el server ya hubiera parado.
  const sseHandlerGuarded = useCallback((event: Parameters<typeof sseHandler>[0]) => {
    if (chat.stopGenerationRef.current) {
      if (event.type === "message.part.delta" || event.type === "message.updated" || event.type === "message.part.updated"
        || event.type === "session.next.text.delta" || event.type === "session.next.reasoning.delta"
        || event.type === "session.next.tool.input.delta"
        || event.type.startsWith("session.text.") || event.type.startsWith("session.reasoning.")
        || event.type === "session.tool.input.delta" || event.type === "session.message.content.updated") return
    }
    sseHandler(event)
  }, [sseHandler, chat.stopGenerationRef])

  const { streamState, reconnect } = useSSE(
    conn.config,
    sseHandlerGuarded,
    ws.selectedSession?.directory,
    ws.selectedSession?.id
  )

  // Al volver de segundo plano (Android suspende el WebView), el stream SSE
  // puede quedar medio-abierto: sin error, sin eventos, y el chat se ve
  // "parado" aunque el poll traiga mensajes. Reconectar y reconciliar contra
  // el server (status real de la sesión) al volver a primer plano.
  const resumeSessionRef = useRef(ws.selectedSession)
  resumeSessionRef.current = ws.selectedSession
  useResumeResync(() => {
    reconnect()
    ws.refreshSessions(true).catch(() => undefined)
    const s = resumeSessionRef.current
    if (!s) return
    chat.loadSelected(s.id, s.directory).catch(() => undefined)
    api
      .listStatuses(conn.config, s.directory)
      .then((st) => {
        const real = st?.[s.id]
        if (real && (real.type === "busy" || real.type === "retry")) chat.setAwaitingAssistantReply(true)
      })
      .catch(() => undefined)
  })

  const { memInfo } = useAppLifecycle({
    config: conn.config,
    connectionState: conn.connectionState,
    setConnectionState: conn.setConnectionState,
    setConnectionMessage: conn.setConnectionMessage,
    dataMode: conn.dataMode,
    changeDataMode: conn.changeDataMode,
    flags: conn.flags,
    selectedSession: ws.selectedSession,
    sessions: ws.sessions,
    setSessions: (updater) => ws.setSessions(updater as any),
    setMessages: chat.setMessages,
    streamState,
    awaitingAssistantReply: chat.awaitingAssistantReply,
    setAwaitingAssistantReply: chat.setAwaitingAssistantReply,
    completionShouldPlayRef: chat.completionShouldPlayRef,
    chatSettings: chat.chatSettings,
    refreshSessions: ws.refreshSessions,
    loadSelected: chat.loadSelected,
    loadAgents: conn.loadAgents,
    loadModels: conn.loadModels,
    setCommands: chat.setCommands,
    getCachedSessions: conn.getCachedSessions,
    backgroundFailureCountRef: chat.backgroundFailureCountRef,
    initialSessionLoadRef: chat.initialSessionLoadRef,
    activeDetailSheet: chat.activeDetailSheet,
    loadDiffs: chat.loadDiffs,
    loadDashboard: chat.loadDashboard,
    listPending: conn.listPending,
    ackQueuedAction: conn.ackQueuedAction,
    markQueuedActionFailed: conn.markQueuedActionFailed,
    navigate: ws.navigate,
    openSession: ws.openSession,
    setDraftConfig: conn.setDraftConfig,
    t: conn.t,
  })

  const settleSession = useCallback(
    async (sessionID: string, dir: string) => {
      try {
        ws.setSessions((prev) => prev.map((s) => (s.id === sessionID ? { ...s, status: "idle" as const } : s)))
        await chat.loadSelected(sessionID, dir)
        await ws.refreshSessions(true)
      } catch {
        /* silently fail */
      }
    },
    [chat.loadSelected, ws.refreshSessions, ws.setSessions]
  )

  // Sincroniza caché offline tras cada reconciliación — evita que mensajes borrados vía revert
  // queden en IndexedDB y se reinyecten en el próximo preload (causaba reenvío del borrado).
  useEffect(() => {
    if (!conn.flags.offlineCache) return
    if (!ws.selectedSession?.id) return
    if (chat.messages.length === 0) return
    const filtered = chat.messages.filter((m: any) => m.info.sessionID === ws.selectedSession!.id)
    if (filtered.length === 0) return
    conn.cacheMessages(ws.selectedSession.id, filtered).catch(() => {})
  }, [chat.messages, ws.selectedSession?.id, conn.flags.offlineCache, conn.cacheMessages])

  const {
    handleExportChat,
    getExportDefaultPath,
    exportMarkdownTo,
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
    outboxActions,
  } = useChatActions({
    selectedSession: ws.selectedSession,
    config: conn.config,
    connectionState: conn.connectionState,
    activeModel: activeModel as any,
    activeAgentID: conn.activeAgentID,
    commands: chat.commands,
    composerRef: chat.composerRef,
    setComposer: chat.setComposer,
    setRuntimeError: chat.setRuntimeError,
    queueAction: conn.queueAction,
    stopGenerationRef: chat.stopGenerationRef,
    localRevertID: chat.localRevertID,
    setLocalRevertID: chat.setLocalRevertID,
    setMessages: chat.setMessages as any,
    setSessions: ws.setSessions as any,
    send: chat.send,
    refreshSessions: ws.refreshSessions,
    loadSelected: chat.loadSelected,
    setCommands: chat.setCommands,
    vs: chat.vs,
    navigate: ws.navigate,
    setHelpPage: chat.setHelpPage,
    setShowThemePicker: ws.setShowThemePicker,
    setShowConnectSheet: ws.setShowConnectSheet,
    onNewSession: ws.handleOpenNewSession,
    renderedMessages: chat.renderedMessages,
    awaitingAssistantReply: chat.awaitingAssistantReply,
    setAwaitingAssistantReply: chat.setAwaitingAssistantReply,
    outbox: chat.outbox,
    enqueueOutbox: chat.enqueueOutbox,
    removeOutbox: chat.removeOutbox,
    completionShouldPlayRef: chat.completionShouldPlayRef,
    abortSession: chat.abortSession,
    settleSession,
    undoMessage: chat.undoMessage,
    redoMessage: chat.redoMessage,
    compactSession: chat.compactSession,
    setCompacting: chat.setCompacting,
    dismissSessionQuestions,
  })

  const handleOpenADEDiff = useCallback(
    (diffs?: FileDiff[], file?: string) => {
      if (conn.isDesktop) {
        ws.setDesktopDiffData({
          selectedFile: file,
          diffs:
            diffs ??
            (chat.diffFiles.length > 0
              ? chat.diffFiles.map((d) => ({
                  file: d.file,
                  patch: "",
                  additions: d.additions,
                  deletions: d.deletions,
                }))
              : []),
        })
        ws.setDesktopDiffOpen(true)
      }
    },
    [conn.isDesktop, chat.diffFiles, ws.setDesktopDiffOpen, ws.setDesktopDiffData]
  )

  const handleBrowserVisualPick = useCallback(
    (url: string, el: any) => {
      const isPod = el?.mode === "pod" && Array.isArray(el.members) && el.members.length > 0
      chat.vs.addAnnotation({
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
        computed: el.computed && typeof el.computed === "object" ? el.computed : undefined,
      } as any)
      // Design Mode: la captura de la zona va al composer (texto + imagen).
      // Se dispara y se olvida: si el BitBlt falla, la anotación sigue igual.
      // El rect de la página viene en SUS CSS px (con zoom propio): se pasa a
      // CSS px de la app antes de pedir la captura.
      const vr = el?.viewRect
      const br = el?.boundingRect
      if (vr && br) {
        const pageDpr = typeof el?.dpr === "number" && el.dpr > 0 ? el.dpr : 1
        const appDpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
        const scale = pageDpr / appDpr
        void captureRegionToPng(
          { x: vr.x + br.x * scale, y: vr.y + br.y * scale, w: br.w * scale, h: br.h * scale },
          12
        ).then((shot) => {
          if (shot) injectImageToComposer(shot)
        })
      }
    },
    [chat.vs]
  )

  const handleToggleInspectTool = useCallback(
    (tool: "picker" | "pod") => {
      if (chat.vs.inspectMode && chat.vs.inspectTool === tool) {
        chat.vs.setInspectMode(false)
        return
      }
      chat.vs.setInspectTool(tool)
      chat.vs.setInspectMode(true)
    },
    [chat.vs]
  )

  return {
    activeModelOption,
    activeModel,
    activeModelVariants,
    selectedVariant,
    pendingQuestions,
    permissionRequest,
    handleQuestionReply,
    handleQuestionReject,
    handlePermissionApprove,
    handlePermissionReject,
    handleDismissQuestion,
    clearDismissedQuestions,
    handleDismissPermission,
    streamState,
    memInfo,
    settleSession,
    handleExportChat,
    getExportDefaultPath,
    exportMarkdownTo,
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
    outboxActions,
    handleOpenADEDiff,
    handleBrowserVisualPick,
    handleToggleInspectTool,
  }
}

export type ChatActionsRuntime = ReturnType<typeof useChatActionsRuntime>
