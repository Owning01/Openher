import { memo, useCallback, useEffect, useRef, useState, useMemo } from "react"
import { ChatView } from "./ChatView"
import { ErrorModal } from "./ErrorModal"
import { holdSharedOutbox } from "../hooks/useMessages"
import { api } from "../api"
import { useSSE } from "../hooks/useSSE"
import { useSSEHandler } from "../hooks/useSSEHandler"
import { useQuestions } from "../hooks/useQuestions"
import { useOfflineCache } from "../hooks/useOfflineCache"
import { isSessionActive } from "../utils"
import { usePolling } from "../hooks/usePolling"
import type { ChatViewProps } from "./ChatView"
import type { ServerConfig, DataMode, SessionView, CommandInfo } from "../types"
import type { VisualSelection } from "../hooks/useVisualSelection"
import { DebateRoom } from "../features/debate/DebateRoom"
import { DEBATE_OPEN_EVENT } from "../features/debate/debateStore"
import { useSessionChatController } from "../features/chat/hooks/useSessionChatController"
import { useOutboxFlush } from "../features/chat/hooks/useOutboxFlush"
import { usePanelDrop } from "../features/chat/hooks/usePanelDrop"
import type { OutboxItem } from "../stores/outboxStore"

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
  onRefreshSessions, onSetCommands, onQueueAction,
  onShellExecute, onChangeAgentGlobal, onOpenInThisPanel, onSwapPanels,
  onOpenFile, onOpenConnect, onOpenBrowser,
  busySessionIds,
  visualSelection, visualPromptContext, onClearVisualSelection, onFocusVisualFile
}: Props) {
  const composerRef = useRef("")
  const [localRevertID, setLocalRevertID] = useState<string | null>(null)
  const [stopGenerationRef] = useState(() => ({ current: false }))
  // Carga visible por panel (igual que loadingSessionID móvil): mientras está
  // activo la lista muestra spinner y el velo anti-salto cubre las etapas
  // vacío→caché→fetch. Antes era null siempre y la entrada pintaba 3 etapas
  // visibles (vacío, estimado, fresco) con saltos.
  const [panelLoadingID, setPanelLoadingID] = useState<string | null>(null)
  // Sala de debate por sesión (drawer): la abre el DebateChip del header vía
  // evento `debate:open` solo cuando el origen es esta sesión.
  const [debateOpen, setDebateOpen] = useState(false)
  useEffect(() => { setDebateOpen(false) }, [session.id])
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<{ originSessionID?: string }>).detail?.originSessionID
      if (id && id === session.id) setDebateOpen(true)
    }
    window.addEventListener(DEBATE_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(DEBATE_OPEN_EVENT, onOpen)
  }, [session.id])

  const panelModelAI = useMemo(() => {
    return baseProps.getModelForSession ? baseProps.getModelForSession(session.id) : null
  }, [baseProps.getModelForSession, session.id])

  const panelModelOption = panelModelAI?.activeModelOption ?? baseProps.activeModelOption
  const panelModelVariants = panelModelAI?.activeModelVariants ?? baseProps.activeModelVariants
  const panelVariant = panelModelAI ? panelModelAI.selectedVariant : baseProps.selectedVariant

  const { getCachedMessages, cacheMessages } = useOfflineCache(baseProps.flags)

  // ===== Questions & Permissions (DRY via useQuestions) =====
  const {
    pendingQuestions,
    permissionRequest,
    handleQuestionReply,
    handleQuestionReject,
    handleDismissQuestion,
    clearDismissedQuestions,
    dismissSessionQuestions,
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

  // ===== Acciones: UN solo flujo compartido con el movil (C3) =====
  const controller = useSessionChatController({
    session,
    config,
    dataMode,
    _flags: baseProps.flags,
    connectionState,
    activeModel: panelModelOption ?? null,
    activeAgentID: baseProps.activeAgentID,
    commands: baseProps.commands,
    composerRef,
    stopGenerationRef,
    localRevertID,
    setLocalRevertID,
    visualPromptContext,
    clearVisualSelection: onClearVisualSelection,
    onQueueAction,
    onOpenConnect,
    onOpenNewSession: baseProps.onOpenNewSession,
    onSetCommands,
    onRefreshSessions,
    onSettled,
    onHoldOutbox: () => holdSharedOutbox(session.id),
    dismissSessionQuestions,
  })
  const msgs = controller.msgs
  const isWorking = controller.isWorking

  useEffect(() => { composerRef.current = msgs.composer }, [msgs.composer])
  // Copiado de App.tsx: SIN debounce — el Composer ya debouncea para persistencia (300ms).
  // El doble-debounce reseteado por tecla cortaba el prompt (<650ms) al enviar rápido.
  const debouncedSetComposer = useCallback((value: string) => {
    composerRef.current = value
    msgs.setComposer(value)
  }, [msgs.setComposer])

  // Sincroniza caché offline tras cada reconciliación exitosa — evita que un revert
  // borrado en el server quede en IndexedDB y se reinyecte vía preload al recargar
  useEffect(() => {
    if (!baseProps.flags.offlineCache) return
    if (msgs.messages.length === 0) return
    // Solo la sesión del panel: nunca cachear mensajes ajenos (races) bajo este id.
    const scoped = msgs.messages.filter((m) => !m.info.sessionID || m.info.sessionID === session.id)
    if (scoped.length === 0) return
    cacheMessages(session.id, scoped).catch(() => {})
  }, [msgs.messages, session.id, baseProps.flags.offlineCache, cacheMessages])

  useEffect(() => {
    let cancelled = false
    setPanelLoadingID(session.id)
    msgs.clearSession()
    // Cache-first en desktop igual que móvil: pinta historial local de inmediato.
    if (baseProps.flags.offlineCache) {
      getCachedMessages(session.id).then((cached) => {
        if (!cancelled && cached && cached.length > 0) {
          msgs.preloadMessages(session.id, cached)
        }
      }).catch(() => {})
    }
    msgs.loadSelected(session.id, session.directory).catch(() => undefined).finally(() => {
      if (!cancelled) setPanelLoadingID((c) => (c === session.id ? null : c))
    })
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
    setCompacting: msgs.setCompacting,
    setRuntimeError: msgs.setRuntimeError,
    awaitingRef: () => awaitingReplyRef.current,
    awaitingBaselineIDRef: msgs.getAwaitingBaselineID,
    onSettled,
  })

  const { streamState } = useSSE(
    (dataMode === "full" && baseProps.flags.streamingFull && (active || busySessionIds?.has(session.id))) ? config : null,
    useCallback((event) => {
      if (stopGenerationRef.current) {
        if (event.type === "message.part.delta" || event.type === "message.updated" || event.type === "message.part.updated"
          || event.type === "session.next.text.delta" || event.type === "session.next.reasoning.delta"
          || event.type === "session.next.tool.input.delta"
          || event.type.startsWith("session.text.") || event.type.startsWith("session.reasoning.")
          || event.type === "session.tool.input.delta" || event.type === "session.message.content.updated") return
      }
      handleSSEEvent(event)
    }, [handleSSEEvent, stopGenerationRef]),
    session.directory,
    session.id,
    // Corte del stream sin poll de respaldo en este panel: al reconectar,
    // recargar el historial de ESTA sesión para tapar el hueco (móvil).
    useCallback(() => {
      msgs.loadSelected(session.id, session.directory).catch(() => undefined)
    }, [msgs, session.id, session.directory])
  )

  // Higiene del flag visual: stopping ya no entra en isWorking (ver arriba),
  // así que se apaga en cuanto no hay trabajo. El guard stopGenerationRef NO
  // se toca acá: debe sobrevivir unos segundos para dropear deltas tardíos
  // en vuelo; lo apaga el timeout de handleAbort o el próximo handleSend.
  useEffect(() => {
    if (!isWorking && controller.stopping) controller.setStopping(false)
  }, [isWorking, controller.stopping, controller.setStopping])

  // Polling desktop: reconciliación periódica incluso con SSE vivo (reconnect perdido sin replay).
  // Antes hacía `if(isStreamingActive) return` → con SSE vivo nunca hacía fetch y el pull
  // quedaba congelado hasta re-entrar (que fuerza loadSelected). Ahora poll siempre;
  // el merge de useMessages protege el mensaje en curso (awaiting) contra borrado.
  // Con streaming activo el poll va lento (15s): recargar 200 msgs cada 3s en pleno
  // stream saturaba GC/DOM justo mientras se lee.
  // Además reconcilia el STATUS con el server: `session.status` del padre solo
  // cambia vía onSettled/refreshSessions, así que si el evento SSE de fin se
  // pierde (reconnect sin replay, panel sin suscripción, gate de awaiting),
  // `isWorking` quedaba en true para siempre — spinner "escribiendo" colgado
  // hasta salir y re-entrar. El server (listStatuses) es la verdad, igual que
  // ya hace el path móvil en useAppLifecycle.
  const isStreamingActive = streamState === "streaming"
  const baseInterval = isWorking ? 3000 : dataMode === "full" ? 5000 : dataMode === "ultra" ? 30000 : dataMode === "miser" ? 60000 : 15000
  const pollInterval = isStreamingActive ? Math.max(baseInterval, 15000) : baseInterval
  // Última `updated` reconciliada: evita refetchear el historial completo en
  // cada tick. En sesiones grandes el payload llega a varios MB y recargarlo
  // cada 5s (o cada 3s durante el stream) saturaba la lectura de mensajes.
  const lastMsgsUpdatedRef = useRef(0)
  const lastMsgsFetchAtRef = useRef(0)
  // Gracia de "ausente del mapa": /session/active solo lista sesiones
  // corriendo; al terminar, la sesión DESAPARECE (no pasa a idle) y ningún
  // evento lo anuncia si el SSE perdió el cierre. Sin esto el spinner quedaba
  // para siempre: `idle` exige entrada presente. Solo cuando el estado local
  // tampoco la ve trabajando, y tras 15s seguidos de ausencia (el server tarda
  // ~1-2s en marcar busy tras el envío — no apurar el settled del turno nuevo).
  const absentSinceRef = useRef(0)
  useEffect(() => { lastMsgsUpdatedRef.current = 0; lastMsgsFetchAtRef.current = 0; absentSinceRef.current = 0 }, [session.id])
  usePolling(async () => {
    // Status real del server primero: es barato (mapa de sesiones activas).
    const st = await api.listStatuses(config, session.directory).catch(() => undefined)
    const real = st?.[session.id]
    if (!real) absentSinceRef.current = absentSinceRef.current || Date.now()
    else absentSinceRef.current = 0
    const idle = !!real && real.type !== "busy" && real.type !== "retry"
    const updated = session.updated ?? 0
    const updatedAdvanced = lastMsgsUpdatedRef.current === 0 || updated > lastMsgsUpdatedRef.current
    // Red de tiempo: reconcilia aunque `updated` no cambie (SSE perdido sin replay).
    const stale = Date.now() - lastMsgsFetchAtRef.current >= 20000
    // Refetch del historial cuando el server reporta un cambio real o pasó la
    // red de tiempo. Ya NO se salta con stream activo: si el SSE pierde un
    // evento sin replay, el poll es la única recuperación (antes el chat
    // quedaba congelado hasta salir y volver a entrar). El intervalo durante
    // stream es ≥15s y el umbral de tiempo 20s, así que el costo es acotado.
    if (updatedAdvanced || stale) {
      lastMsgsUpdatedRef.current = updated
      lastMsgsFetchAtRef.current = Date.now()
      await msgs.loadSelected(session.id, session.directory).catch(() => undefined)
    }
    // Solo cuando localmente parece trabajando: en idle no hay nada que reconciliar.
    if (idle && (isSessionActive(session) || msgs.awaitingAssistantReply)) {
      msgs.setAwaitingAssistantReply(false)
      onSettled(session.id, session.directory)
    }
    // Ausencia prolongada del mapa + local idle + esperando respuesta =
    // el cierre se perdió (SSE caído sin replay): reconciliar igual.
    if (!real && !isSessionActive(session) && msgs.awaitingAssistantReply
      && absentSinceRef.current && Date.now() - absentSinceRef.current >= 15000) {
      absentSinceRef.current = 0
      msgs.setAwaitingAssistantReply(false)
      onSettled(session.id, session.directory)
    }
  }, pollInterval, [session.id, session.directory, session.status, session.updated, dataMode, isWorking, isStreamingActive, msgs.awaitingAssistantReply], false)

  // Auto-flush de la cola visible (claim compartido + cooldown 4s + hold):
  // extraído a useOutboxFlush; acá solo se define el envío forzado por item.
  const flushSend = useCallback(
    (next: OutboxItem) => controller.handleSend(next.images, undefined, next.text, true),
    [controller.handleSend],
  )
  useOutboxFlush({
    sessionID: session.id,
    outbox: msgs.outbox,
    isWorking,
    removeOutbox: msgs.removeOutbox,
    sendItem: flushSend,
  })

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
    loadingSessionID: panelLoadingID,
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
    onSend: controller.handleSend,
    onAbort: controller.handleAbort,
    onUndo: controller.handleUndo,
    onRedo: controller.handleRedo,
    onCompact: controller.handleCompact,
    onRevertToMessage: controller.handleRevertToMessage,
    onEditMessage: controller.handleEditMessage,
    onQuestionReply: handleQuestionReply,
    onQuestionReject: handleQuestionReject,
    onDismissQuestion: handleDismissQuestion,
    onReopenQuestions: clearDismissedQuestions,
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
    outboxActions: controller.outboxActions,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    baseProps, session, localRevertID, msgs, streamState, pendingQuestions,
    permissionRequest, controller, onShellExecute,
    onChangeAgentGlobal, onOpenInThisPanel, onOpenBrowser, panelLoadingID,
  ])

  const { dropZone, onDragOver, onDragLeave, onDrop } = usePanelDrop({
    panelIndex,
    onOpenFile,
    onSplitSession,
    onSwapPanels,
  })

  return (
    <div
      className={`session-panel${active ? " active" : ""}`}
      onClick={onActivate}
      style={{ position: "relative", height: "100%", minHeight: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
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
      {/* Sin TabBar interno: las pestañas (sesiones + terminales) viven en la
          franja superior del panel (DesktopPanelRenderer/DesktopGrid). Un
          segundo div.tab-bar aquí duplicaba el header al abrir archivos. */}
      <ChatView {...chatProps} />
      {debateOpen && (
        <div className="debate-drawer" role="complementary" aria-label="Debate">
          <DebateRoom config={config} originSessionID={session.id} onClose={() => setDebateOpen(false)} />
        </div>
      )}
      {msgs.runtimeError && <ErrorModal message={msgs.runtimeError} onClose={() => msgs.setRuntimeError(null)} />}
    </div>
  )
})
