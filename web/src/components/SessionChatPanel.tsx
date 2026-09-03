import { memo, useCallback, useEffect, useRef, useState, useMemo, Suspense } from "react"
import { ChatView } from "./ChatView"
import { ErrorModal } from "./ErrorModal"
// Lazy: rompe el borde estático con shellPanels (que arrastra @xterm) para que
// el bundle inicial móvil no descargue terminal/kanban/browser del desktop.
import { SessionStatsPanel } from "./shellPanels"
import { useMessages } from "../hooks/useMessages"
import { useSSE } from "../hooks/useSSE"
import { useSSEHandler } from "../hooks/useSSEHandler"
import { useQuestions } from "../hooks/useQuestions"
import { useOfflineCache } from "../hooks/useOfflineCache"
import { api } from "../api"
import { isSessionActive } from "../utils"
import { parseDragPayload } from "../utils/drag"
import { TabBar } from "./TabBar"
import { usePolling } from "../hooks/usePolling"
import type { ChatViewProps } from "./ChatView"
import type { ServerConfig, DataMode, SessionView, CommandInfo } from "../types"
import type { VisualSelection } from "../hooks/useVisualSelection"
import { formatSelectionForPrompt } from "../hooks/useVisualSelection"
import { keepMessagesThrough } from "../features/chat/domain/message-order"

type Props = {
  session: SessionView
  config: ServerConfig
  dataMode: DataMode
  baseProps: Omit<ChatViewProps, "composer" | "onComposerChange">
  active: boolean
  connectionState: string
  panelIndex: number
  onActivate: () => void
  onClose: () => void
  /** Soltar una sesión (arrastrada desde la lista o desde otro panel) sobre este panel:
      acopla a izquierda, derecha, arriba, abajo o centro. */
  onSplitSession: (index: number, dir: "left" | "right" | "top" | "bottom" | "center", specificId?: string) => void
  onSettled: (sessionID: string, directory: string) => void
  onRefreshSessions: () => Promise<void> | void
  onSetCommands: (commands: CommandInfo[]) => void
  onRecordPrompt: (text: string) => void
  onQueueAction: (action: { type: "command" | "shell" | "prompt"; sessionID: string; directory: string; payload: string; model?: { providerID: string; modelID: string; variant?: string }; agentID?: string; images?: Array<{ base64: string; mime: string }>; options?: { translate?: boolean } }) => Promise<void> | void
  onShellExecute: (cmd: string, sessionID: string, directory: string) => void
  onChangeAgentGlobal: (agentID: string, directory?: string) => void
  onOpenInThisPanel: (sessionID: string, directory: string) => void
  onSwapPanels: (from: number, to: number) => void
  onOpenFile?: (path: string, panelIndex?: number, zone?: "left" | "right" | "top" | "bottom" | "center") => void
  onOpenConnect?: () => void
  onOpenBrowser?: (url: string) => void
  tabStack?: Array<string>
  allSessions?: Array<{ id: string; title?: string; directory: string }>
  busySessionIds?: Set<string>
  onTabSwitch?: (panelIndex: number, tabIndex: number) => void
  onTabClose?: (panelIndex: number, tabIndex: number) => void
  onTabAdd?: (panelIndex: number) => void
  onTabMove?: (panelIndex: number, fromIndex: number, toIndex: number) => void
  onDropTerminal?: (panelIndex: number, targetIndex?: number) => void
  visualSelection?: VisualSelection | null
  visualPromptContext?: string
  onClearVisualSelection?: () => void
  onFocusVisualFile?: (path: string) => void
}

export const SessionChatPanel = memo(function SessionChatPanel({
  session, config, dataMode, baseProps, active, connectionState, panelIndex,
  onActivate, onClose: _onClose, onSplitSession, onSettled,
  onRefreshSessions, onSetCommands, onRecordPrompt, onQueueAction,
  onShellExecute, onChangeAgentGlobal, onOpenInThisPanel, onSwapPanels,
  onOpenFile, onOpenConnect, onOpenBrowser,
  tabStack, allSessions, busySessionIds, onTabSwitch, onTabClose, onTabAdd, onTabMove, onDropTerminal,
  visualSelection, visualPromptContext, onClearVisualSelection, onFocusVisualFile
}: Props) {
  const msgs = useMessages(config, dataMode, `composer-${session.id}`)
  const composerRef = useRef(msgs.composer)
  useEffect(() => { composerRef.current = msgs.composer }, [msgs.composer])
  // Copiado de App.tsx: SIN debounce — el Composer ya debouncea para persistencia (300ms).
  // El doble-debounce reseteado por tecla cortaba el prompt (<650ms) al enviar rápido.
  const debouncedSetComposer = useCallback((value: string) => {
    composerRef.current = value
    msgs.setComposer(value)
  }, [msgs.setComposer])
  const { getCachedMessages, cacheMessages } = useOfflineCache(baseProps.flags)
  const [localRevertID, setLocalRevertID] = useState<string | null>(null)
  const [stopGenerationRef] = useState(() => ({ current: false }))
  const [showStats, setShowStats] = useState(false)

  // Sincroniza caché offline tras cada reconciliación exitosa — evita que un revert
  // borrado en el server quede en IndexedDB y se reinyecte vía preload al recargar
  useEffect(() => {
    if (!baseProps.flags.offlineCache) return
    if (msgs.messages.length === 0) return
    cacheMessages(session.id, msgs.messages).catch(() => {})
  }, [msgs.messages, session.id, baseProps.flags.offlineCache, cacheMessages])

  useEffect(() => {
    let cancelled = false
    msgs.clearSession()
    // Cache-first en desktop igual que móvil: pinta historial local de inmediato.
    if (baseProps.flags.offlineCache) {
      getCachedMessages(session.id).then((cached) => {
        if (!cancelled && cached && cached.length > 0) {
          msgs.preloadMessages(session.id, cached)
        }
      }).catch(() => {})
    }
    msgs.loadSelected(session.id, session.directory).catch(() => undefined)
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, session.directory])

  const awaitingReplyRef = useRef(false)
  awaitingReplyRef.current = msgs.awaitingAssistantReply

  const handleSSEEvent = useSSEHandler({
    sessionID: session.id,
    directory: session.directory,
    loadSelected: msgs.loadSelected,
    applyDelta: msgs.applyDelta,
    applyPart: msgs.applyPart,
    setAwaitingAssistantReply: msgs.setAwaitingAssistantReply,
    setRuntimeError: msgs.setRuntimeError,
    awaitingRef: () => awaitingReplyRef.current,
    onSettled,
  })

  const { streamState } = useSSE(
    (dataMode === "full" && baseProps.flags.streamingFull && (active || busySessionIds?.has(session.id))) ? config : null,
    useCallback((event) => {
      if (stopGenerationRef.current) {
        if (event.type === "message.part.delta" || event.type === "message.updated" || event.type === "message.part.updated"
          || event.type === "session.next.text.delta" || event.type === "session.next.reasoning.delta"
          || event.type === "session.next.tool.input.delta") return
      }
      handleSSEEvent(event)
    }, [handleSSEEvent, stopGenerationRef]),
    session.directory,
    session.id
  )

  // ===== Questions & Permissions (DRY via useQuestions) =====
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
    directory: session.directory,
    enabled: Boolean(baseProps.flags.questionAuto || baseProps.flags.permissionUI),
    enabledQuestions: Boolean(baseProps.flags.questionAuto),
    enabledPermissions: Boolean(baseProps.flags.permissionUI),
    fallbackSessionID: session.id,
  })

  // ===== Acciones =====
  const refresh = useCallback(() => Promise.resolve(onRefreshSessions()), [onRefreshSessions])

  const panelModelAI = useMemo(() => {
    return baseProps.getModelForSession ? baseProps.getModelForSession(session.id) : null
  }, [baseProps.getModelForSession, session.id])

  const panelModelOption = panelModelAI?.activeModelOption ?? baseProps.activeModelOption
  const panelModelVariants = panelModelAI?.activeModelVariants ?? baseProps.activeModelVariants
  const panelVariant = panelModelAI ? panelModelAI.selectedVariant : baseProps.selectedVariant

  const handleSend = useCallback(async (images?: Array<{ base64: string; mime: string }>, options?: { translate?: boolean }, text?: string) => {
    if (!config) return
    if (!session) return
    if (msgs.isSending) {
      msgs.setRuntimeError("Ya hay un envío en curso — espera un momento")
      return false
    }
    if (msgs.awaitingAssistantReply || isSessionActive(session)) {
      msgs.setRuntimeError("Espera a que termine la respuesta anterior")
      return false
    }
    const rawComposer = (typeof text === "string" ? text : composerRef.current).trim() ? (typeof text === "string" ? text : composerRef.current) : ""
    const hasVisual = Boolean(visualPromptContext)
    const currentComposer = hasVisual ? formatSelectionForPrompt(rawComposer, visualPromptContext!) : rawComposer
    if (!currentComposer.trim() && (!images || images.length === 0)) return
    if (connectionState === "offline") {
      onQueueAction({
        type: "prompt",
        sessionID: session.id,
        directory: session.directory,
        payload: currentComposer,
        model: panelModelOption ? { providerID: panelModelOption.providerID, modelID: panelModelOption.modelID, variant: panelModelOption.variant } : undefined,
        agentID: baseProps.activeAgentID || undefined,
        images,
        options,
      })
      msgs.setComposer("")
      composerRef.current = ""
      msgs.setRuntimeError("Prompt queued - will send when connection is restored")
      if (hasVisual) onClearVisualSelection?.()
      return
    }
    let sendText = currentComposer
    let originalText: string | null = null
    if (options?.translate && currentComposer.trim()) {
      try {
        const { translateToEnglish } = await import("../utils/translate")
        const translated = await translateToEnglish(currentComposer)
        if (translated !== currentComposer) {
          originalText = currentComposer
          sendText = translated
          msgs.setComposer(translated)
          composerRef.current = translated
        }
      } catch (err) {
        msgs.setRuntimeError(`Translation failed: ${(err as Error).message}`)
        return false
      }
    }
    onRecordPrompt(currentComposer)
    stopGenerationRef.current = false
    const revertMsgId = localRevertID ?? session?.revert?.messageID
    let prevMessagesSnapshot: typeof msgs.messages | null = null
    if (revertMsgId) {
      // Snapshot para rollback si el envío falla
      prevMessagesSnapshot = msgs.messages
      msgs.setMessages((prev) => keepMessagesThrough(prev, session.id, revertMsgId))
    }
    setLocalRevertID(null)
    const res = await msgs.send(session, panelModelOption ?? undefined, baseProps.activeAgentID, baseProps.commands,
      refresh,
      () => msgs.loadSelected(session.id, session.directory).then(() => undefined),
      onSetCommands, msgs.setRuntimeError, images,
      sendText, undefined, originalText ?? undefined)
    if (res === "connect") onOpenConnect?.()
    if (res === false) {
      // Rollback de pruning y restaurar composer original si hubo traducción
      if (prevMessagesSnapshot) msgs.setMessages(prevMessagesSnapshot)
      if (originalText) {
        msgs.setComposer(originalText)
        composerRef.current = originalText
      }
    }
    // Limpiar selección visual siempre para evitar contexto stale duplicado en reintentos
    if (hasVisual) onClearVisualSelection?.()
    return typeof res === "boolean" ? res : true
  }, [msgs, session, config, connectionState, onQueueAction, panelModelOption, baseProps.activeAgentID, baseProps.commands, onRefreshSessions, onSetCommands, onRecordPrompt, localRevertID, onOpenConnect, visualPromptContext, onClearVisualSelection])

  const handleAbort = useCallback(async () => {
    stopGenerationRef.current = true
    msgs.setAwaitingAssistantReply(false)
    msgs.completionShouldPlayRef.current = false
    msgs.setMessages((prev) => {
      return prev.map((m) => {
        if (m.info.sessionID === session.id && m.info.role === "assistant" && !m.info.time.completed) {
          return { ...m, info: { ...m.info, time: { ...m.info.time, completed: Date.now() } } }
        }
        return m
      })
    })
    try { await msgs.abortSession(session.id, session.directory) } catch { /* ignore */ }
    msgs.loadSelected(session.id, session.directory).catch(() => undefined)
    // Refrescar lista de sesiones: sin esto el status "busy" optimista queda
    // clavado y todo envío posterior se bloquea con composer.busy
    refresh().catch(() => undefined)
    setTimeout(() => { stopGenerationRef.current = false }, 2000)
  }, [msgs, session, refresh])

  const handleRevertToMessage = useCallback(async (messageID: string) => {
    try {
      if (msgs.awaitingAssistantReply) {
        await api.abort(config, session.id, session.directory).catch(() => {})
      }
      const target = msgs.renderedMessages.find((m) => m.info.id === messageID)
      // S3: filtro optimista instantáneo — oculta mensajes después del target.
      msgs.setMessages((prev) => keepMessagesThrough(prev, session.id, messageID))
      setLocalRevertID(messageID)
      await api.revert(config, session.id, messageID, session.directory)
      await msgs.loadSelected(session.id, session.directory)
      if (target?.text) msgs.setComposer(target.text)
    } catch (err) {
      setLocalRevertID(null)
      await msgs.loadSelected(session.id, session.directory).catch(() => {})
      msgs.setRuntimeError((err as Error).message)
    }
  }, [msgs, config, session])

  const handleEditMessage = useCallback(async (messageID: string, text: string) => {
    try {
      if (msgs.awaitingAssistantReply) {
        await api.abort(config, session.id, session.directory).catch(() => {})
      }
      msgs.setMessages((prev) => keepMessagesThrough(prev, session.id, messageID))
      setLocalRevertID(messageID)
      await api.revert(config, session.id, messageID, session.directory)
      await msgs.loadSelected(session.id, session.directory)
      msgs.setComposer(text)
    } catch (err) {
      setLocalRevertID(null)
      await msgs.loadSelected(session.id, session.directory).catch(() => {})
      msgs.setRuntimeError((err as Error).message)
    }
  }, [msgs, config, session])

  const handleUndo = useCallback(() => {
    msgs.undoMessage(session.id, session.directory, session.revert, refresh, () => msgs.loadSelected(session.id, session.directory).then(() => undefined), undefined, setLocalRevertID)
  }, [msgs, session, refresh])

  const handleRedo = useCallback(() => {
    msgs.redoMessage(session.id, session.directory, session.revert, refresh, () => msgs.loadSelected(session.id, session.directory).then(() => undefined), undefined, setLocalRevertID)
  }, [msgs, session, refresh])

  const handleCompact = useCallback(async () => {
    await msgs.compactSession(session.id, session.directory, panelModelOption?.providerID ?? "", panelModelOption?.modelID ?? "", refresh, () => msgs.loadSelected(session.id, session.directory).then(() => undefined))
  }, [msgs, session, panelModelOption, refresh])

  const isWorking = useMemo(() => {
    if (msgs.awaitingAssistantReply) return true
    if (isSessionActive(session)) return true
    return false
  }, [msgs.awaitingAssistantReply, session])

  useEffect(() => {
    if (!isWorking && stopGenerationRef.current) stopGenerationRef.current = false
  }, [isWorking])

  // Polling desktop: reconciliación periódica incluso con SSE vivo (reconnect perdido sin replay).
  // Antes hacía `if(isStreamingActive) return` → con SSE vivo nunca hacía fetch y el pull
  // quedaba congelado hasta re-entrar (que fuerza loadSelected). Ahora poll siempre;
  // el merge de useMessages protege el mensaje en curso (awaiting) contra borrado.
  const isStreamingActive = streamState === "streaming"
  const pollInterval = isWorking ? 3000 : dataMode === "full" ? 5000 : dataMode === "ultra" ? 30000 : dataMode === "miser" ? 60000 : 15000
  usePolling(async () => {
    await msgs.loadSelected(session.id, session.directory).catch(() => undefined)
  }, pollInterval, [session.id, session.directory, dataMode, isWorking, isStreamingActive], false)

  const chatProps: ChatViewProps = useMemo(() => ({
    ...baseProps,
    view: "detail",
    selectedSession: session,
    revertID: localRevertID,
    messages: msgs.renderedMessages,
    pendingIndex: msgs.pendingIndex,
    composer: msgs.composer,
    isSending: msgs.isSending,
    isWorking,
    showTypingBubble: isWorking,
    loadingSessionID: null,
    selectedID: session.id,
    activeModelOption: panelModelOption,
    activeModelVariants: panelModelVariants,
    selectedVariant: panelVariant,
    onChangeVariant: (variant: string | null) => baseProps.onChangeVariant(variant, session.id),
    messageScrollSignature: msgs.messageScrollSignature,
    compacting: msgs.compacting,
    pendingQuestions,
    permissionRequest,
    onComposerChange: debouncedSetComposer,
    onSend: handleSend,
    onAbort: handleAbort,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onCompact: handleCompact,
    onRevertToMessage: handleRevertToMessage,
    onEditMessage: handleEditMessage,
    onQuestionReply: handleQuestionReply,
    onQuestionReject: handleQuestionReject,
    onDismissQuestion: handleDismissQuestion,
    onPermissionApprove: handlePermissionApprove,
    onPermissionReject: handlePermissionReject,
    onDismissPermission: handleDismissPermission,
    visualSelection,
    onClearVisualSelection,
    onFocusVisualFile,
    onShellSend: (cmd) => onShellExecute(cmd, session.id, session.directory),
    onChangeAgent: (id) => onChangeAgentGlobal(id, session.directory),
    onBackToSessions: () => undefined,
    onOpenSession: (id, dir) => onOpenInThisPanel(id, dir),
    onOpenBrowser,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    baseProps, session, localRevertID, msgs, streamState, pendingQuestions,
    permissionRequest, handleSend, handleAbort, handleUndo,
    handleRedo, handleCompact, handleRevertToMessage, handleEditMessage,
    handleQuestionReply, handleQuestionReject, handleDismissQuestion,
    handlePermissionApprove, handlePermissionReject, handleDismissPermission, onShellExecute,
    onChangeAgentGlobal, onOpenInThisPanel, onOpenBrowser,
  ])

  const [dropZone, setDropZone] = useState<"left" | "right" | "top" | "bottom" | "center" | null>(null)

  const calcDropZone = (e: React.DragEvent<HTMLDivElement>): "left" | "right" | "top" | "bottom" | "center" => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const w = rect.width
    const h = rect.height
    if (x < w * 0.25) return "left"
    if (x > w * 0.75) return "right"
    if (y < h * 0.25) return "top"
    if (y > h * 0.75) return "bottom"
    return x >= w / 2 ? "right" : "left"
  }

  return (
    <div
      className={`session-panel${active ? " active" : ""}`}
      onClick={onActivate}
      style={{ position: "relative" }}
      onDragOver={(e) => {
        e.preventDefault()
        const zone = calcDropZone(e)
        setDropZone(zone)
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
            onOpenFile?.(filePath, panelIndex, zone)
            return
          }
        }
        const raw = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain")
        if (raw) {
          const payload = parseDragPayload(raw)
          if (payload.kind === "panel") {
            if (payload.idx !== panelIndex) {
              if (zone === "center") {
                onSwapPanels(payload.idx, panelIndex)
              } else {
                onSplitSession(panelIndex, zone, raw)
              }
            }
          } else if (payload.kind === "session") {
            onSplitSession(panelIndex, zone, payload.id)
          } else if (payload.kind === "kind") {
            onSplitSession(panelIndex, zone, raw)
          } else if (payload.kind === "tab") {
            // Ignorar tab suelto
          } else if (payload.kind === "file") {
            onOpenFile?.(payload.path, panelIndex, zone)
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
            border: "2px dashed var(--primary)",
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
      {(tabStack && tabStack.length > 0) ? (
        <TabBar
          tabs={tabStack}
          activeIndex={Math.max(0, tabStack.indexOf(session.id) >= 0 ? tabStack.indexOf(session.id) : tabStack.findIndex((id) => id.startsWith("terminal")) >= 0 ? tabStack.findIndex((id) => id.startsWith("terminal")) : 0)}
          sessions={allSessions ?? []}
          busySessionIds={busySessionIds}
          onSwitch={(i) => onTabSwitch?.(panelIndex, i)}
          onClose={(i) => onTabClose?.(panelIndex, i)}
          onAdd={() => onTabAdd?.(panelIndex)}
          onMoveTab={(from, to) => onTabMove?.(panelIndex, from, to)}
          panelIndex={panelIndex}
          onDropTerminal={onDropTerminal}
          onDropTerminalTab={(raw) => onSplitSession(panelIndex, "center", raw)}
        />
      ) : null}
      {showStats && (
        <div className="session-stats-overlay" onClick={() => setShowStats(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <Suspense fallback={null}>
              <SessionStatsPanel sessionID={session.id} onClose={() => setShowStats(false)} />
            </Suspense>
          </div>
        </div>
      )}
      <ChatView {...chatProps} onOpenSessionStats={() => setShowStats(true)} />
      {msgs.runtimeError && <ErrorModal message={msgs.runtimeError} onClose={() => msgs.setRuntimeError(null)} />}
    </div>
  )
})
