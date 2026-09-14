import { memo, useCallback, useEffect, useRef, useState, useMemo } from "react"
import { ChatView } from "./ChatView"
import { ErrorModal } from "./ErrorModal"
// Lazy: rompe el borde estático con shellPanels (que arrastra @xterm) para que
// el bundle inicial móvil no descargue terminal/kanban/browser del desktop.
import { isAbsoluteFsPath } from "./shellPanels"
import { useMessages, claimSharedOutbox, releaseSharedOutbox, holdSharedOutbox, resumeSharedOutbox, isSharedOutboxHeld } from "../hooks/useMessages"
import { useSSE } from "../hooks/useSSE"
import { useSSEHandler } from "../hooks/useSSEHandler"
import { useQuestions } from "../hooks/useQuestions"
import { useOfflineCache } from "../hooks/useOfflineCache"
import { api } from "../api"
import { isSessionActive } from "../utils"
import { openPromptHistory } from "../utils/promptHistory"
import { parseDragPayload } from "../utils/drag"
import { usePolling } from "../hooks/usePolling"
import type { ChatViewProps } from "./ChatView"
import type { ServerConfig, DataMode, SessionView, CommandInfo } from "../types"
import type { VisualSelection } from "../hooks/useVisualSelection"
import { formatSelectionForPrompt } from "../hooks/useVisualSelection"
import { keepMessagesBefore, keepMessagesThrough } from "../features/chat/domain/message-order"
import { DebateRoom } from "../features/debate/DebateRoom"
import { DEBATE_OPEN_EVENT } from "../features/debate/debateStore"

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
  // Guarda anti-deltas tardíos: mientras sigue activo se dropean los deltas
  // en vuelo del stream abortado y se ignora el doble-clic. NO entra en
  // isWorking: la burbuja/ring de "respondiendo" deben apagarse en cuanto el
  // abort se confirma (awaiting=false + sesión idle), no 10s después.
  const [stopping, setStopping] = useState(false)
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

  // ===== Acciones =====
  const refresh = useCallback(() => Promise.resolve(onRefreshSessions()), [onRefreshSessions])

  const panelModelAI = useMemo(() => {
    return baseProps.getModelForSession ? baseProps.getModelForSession(session.id) : null
  }, [baseProps.getModelForSession, session.id])

  const panelModelOption = panelModelAI?.activeModelOption ?? baseProps.activeModelOption
  const panelModelVariants = panelModelAI?.activeModelVariants ?? baseProps.activeModelVariants
  const panelVariant = panelModelAI ? panelModelAI.selectedVariant : baseProps.selectedVariant

  const handleSend = useCallback(async (images?: Array<{ base64: string; mime: string }>, options?: { translate?: boolean }, text?: string, force?: boolean) => {
    if (!config) return
    if (!session) return
    // Un envío manual reanuda el auto-flush (p. ej. después de un Stop).
    if (!force) resumeSharedOutbox(session.id)
    const rawComposer = (typeof text === "string" ? text : composerRef.current).trim() ? (typeof text === "string" ? text : composerRef.current) : ""
    const hasVisual = Boolean(visualPromptContext)
    const currentComposer = hasVisual ? formatSelectionForPrompt(rawComposer, visualPromptContext!) : rawComposer
    if (!currentComposer.trim() && (!images || images.length === 0)) return
    if (!force && (msgs.awaitingAssistantReply || isSessionActive(session))) {
      // Ocupado: a la cola visible en vez de rechazar. Aparece en el chat
      // como pendiente con eliminar / editar / enviar-ahora.
      msgs.enqueueOutbox(session.id, currentComposer, images)
      msgs.setComposer("")
      composerRef.current = ""
      if (hasVisual) onClearVisualSelection?.()
      return true
    }
    if (msgs.isSending) {
      msgs.setRuntimeError("Ya hay un envío en curso — espera un momento")
      return false
    }
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
    stopGenerationRef.current = false
    const revertMsgId = localRevertID ?? session?.revert?.messageID
    let prevMessagesSnapshot: typeof msgs.messages | null = null
    if (revertMsgId) {
      // Snapshot para rollback si el envío falla
      prevMessagesSnapshot = msgs.messages
      msgs.setMessages((prev) => keepMessagesBefore(prev, session.id, revertMsgId))
    }
    setLocalRevertID(null)
    const res = await msgs.send(session, panelModelOption ?? undefined, baseProps.activeAgentID, baseProps.commands,
      refresh,
      () => msgs.loadSelected(session.id, session.directory).then(() => undefined),
      onSetCommands, msgs.setRuntimeError, images,
      sendText, undefined, originalText ?? undefined)
    if (res === "connect") onOpenConnect?.()
    if (res === "newSession") baseProps.onOpenNewSession?.(session.directory)
    if (res === "history" || res === "timeline") openPromptHistory()
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
  }, [msgs, session, config, connectionState, onQueueAction, panelModelOption, baseProps.activeAgentID, baseProps.commands, onRefreshSessions, onSetCommands, localRevertID, onOpenConnect, visualPromptContext, onClearVisualSelection])

  const handleAbort = useCallback(async () => {
    // Doble clic: el flag se pone sincrónico abajo, el segundo llamado sale acá.
    if (stopGenerationRef.current) return
    stopGenerationRef.current = true
    setStopping(true)
    msgs.setAwaitingAssistantReply(false)
    msgs.completionShouldPlayRef.current = false
    // Stop explícito: la cola pendiente NO se auto-envía al quedar libre.
    holdSharedOutbox(session.id)
    // Preguntas del turno abortado: cierre local (sin cancel server-side) para
    // que el modal flotante no reaparezca cuando el poll las reintente.
    dismissSessionQuestions(session.id)
    msgs.setMessages((prev) => {
      return prev.map((m) => {
        if (m.info.sessionID === session.id && m.info.role === "assistant" && !m.info.time.completed) {
          return { ...m, info: { ...m.info, time: { ...m.info.time, completed: Date.now() } } }
        }
        return m
      })
    })
    try {
      await msgs.abortSession(session.id, session.directory)
    } catch (e) {
      // Antes se tragaba en silencio y el server seguía generando ("no para").
      msgs.setRuntimeError(`No se pudo detener la generación: ${(e as Error)?.message ?? String(e)}`)
    }
    msgs.loadSelected(session.id, session.directory).catch(() => undefined)
    onSettled(session.id, session.directory)
    refresh().catch(() => undefined)
    // El flag se apaga al confirmar idle (efecto abajo); timeout de seguridad
    // por si el server nunca reporta (antes: 2s fijos que reabrían el stream).
    setTimeout(() => {
      stopGenerationRef.current = false
      setStopping(false)
    }, 10000)
  }, [msgs, session, refresh, onSettled, dismissSessionQuestions])

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

  // Acciones de la cola visible por id de mensaje pendiente.
  const outboxActions = useMemo(() => {
    const map: Record<string, { onDelete: () => void; onEdit: () => void; onSendNow: () => void }> = {}
    for (const o of msgs.outbox) {
      if (o.sessionID !== session.id) continue
      map[o.id] = {
        onDelete: () => msgs.removeOutbox(o.id),
        onEdit: () => {
          msgs.setComposer(o.text)
          composerRef.current = o.text
          msgs.removeOutbox(o.id)
        },
        onSendNow: () => {
          // Claim: el flush automático (este panel u otra vista de la misma
          // sesión) puede estar enviando este mismo item; sin claim salía doble.
          if (!claimSharedOutbox(o.id)) return
          msgs.removeOutbox(o.id)
          // Acción explícita del usuario: reanuda el auto-flush (si estaba en hold por Stop).
          resumeSharedOutbox(o.sessionID)
          void handleSend(o.images, undefined, o.text, true).then((res) => {
            // Si no pudo salir (otro envío en curso), vuelve a la cola.
            if (res === false) msgs.enqueueOutbox(o.sessionID, o.text, o.images)
          })
        },
      }
    }
    return map
  }, [msgs.outbox, msgs.removeOutbox, msgs.setComposer, msgs.enqueueOutbox, session.id, handleSend])

  // Auto-flush: al quedar libre, sale el pendiente más antiguo.
  // Claim compartido: la cola es por sesión entre todas las instancias, así
  // que otro panel/vista de la misma sesión pudo tomar el item primero.
  //
  // Reglas anti-bucle: no correr con la sesión ocupada (si no `handleSend`
  // re-encola en vez de enviar y cada render duplica), `force=true` para no
  // re-encolar el item que ya salió de la cola, cooldown para fallos repetidos
  // y hold tras Stop explícito.
  const flushingRef = useRef(false)
  const flushLastTryRef = useRef(0)
  useEffect(() => {
    if (isWorking || flushingRef.current) return
    if (isSharedOutboxHeld(session.id)) return
    if (Date.now() - flushLastTryRef.current < 4_000) return
    const next = msgs.outbox.find((o) => o.sessionID === session.id)
    if (!next || !claimSharedOutbox(next.id)) return
    flushLastTryRef.current = Date.now()
    flushingRef.current = true
    void handleSend(next.images, undefined, next.text, true).then((res) => {
      if (res !== false) msgs.removeOutbox(next.id)
      else releaseSharedOutbox(next.id)
    }).catch(() => releaseSharedOutbox(next.id)).finally(() => {
      flushingRef.current = false
    })
  })

  // Higiene del flag visual: stopping ya no entra en isWorking (ver arriba),
  // así que se apaga en cuanto no hay trabajo. El guard stopGenerationRef NO
  // se toca acá: debe sobrevivir unos segundos para dropear deltas tardíos
  // en vuelo; lo apaga el timeout de handleAbort o el próximo handleSend.
  useEffect(() => {
    if (!isWorking && stopping) setStopping(false)
  }, [isWorking, stopping])

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
  useEffect(() => { lastMsgsUpdatedRef.current = 0; lastMsgsFetchAtRef.current = 0 }, [session.id])
  usePolling(async () => {
    // Status real del server primero: es barato (mapa de sesiones activas).
    const st = await api.listStatuses(config, session.directory).catch(() => undefined)
    const real = st?.[session.id]
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
  }, pollInterval, [session.id, session.directory, session.status, session.updated, dataMode, isWorking, isStreamingActive, msgs.awaitingAssistantReply], false)

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
    outboxActions,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    baseProps, session, localRevertID, msgs, streamState, pendingQuestions,
    permissionRequest, handleSend, handleAbort, handleUndo,
    handleRedo, handleCompact, handleRevertToMessage, handleEditMessage,
    handleQuestionReply, handleQuestionReject, handleDismissQuestion,
    clearDismissedQuestions, dismissSessionQuestions,
    handlePermissionApprove, handlePermissionReject, handleDismissPermission, onShellExecute,
    onChangeAgentGlobal, onOpenInThisPanel, onOpenBrowser, outboxActions, panelLoadingID,
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
      style={{ position: "relative", height: "100%", minHeight: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
      onDragOver={(e) => {
        e.preventDefault()
        const zone = calcDropZone(e)
        // Guard anti-tormenta (igual que DesktopGrid): dragover dispara por
        // cada mousemove; solo re-render si la zona realmente cambió.
        setDropZone((prev) => (prev === zone ? prev : zone))
      }}
      onDragLeave={() => setDropZone(null)}
      onDrop={(e) => {
        e.preventDefault()
        // El panel gestiona el drop (split/swap/insert) y frena el bubbling:
        // sin esto el grid lo procesa dos veces (doble split + tab browser basura).
        e.stopPropagation()
        const zone = calcDropZone(e)
        setDropZone(null)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const f = e.dataTransfer.files[0]
          const filePath = (f as any).path || f.name
          if (filePath) {
            // En el webview el File del SO no trae path real (solo el nombre):
            // abrir el editor con un nombre pelado crea tabs basura que 404ean
            // en /shell/fs/read en cada carga. Solo abrir si es absoluta; si
            // no, la ruta cae al composer como texto (igual que payload file).
            // Zona baja → al chat; resto → a la par (split con editor).
            if (isAbsoluteFsPath(filePath) && zone !== "bottom" && onOpenFile) {
              onOpenFile(filePath, panelIndex, zone)
            } else {
              window.dispatchEvent(new CustomEvent("plugin:insert-text", { detail: filePath }))
            }
            return
          }
        }
        const raw = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain")
        if (raw) {
          const payload = parseDragPayload(raw)
          if (payload.kind === "panel") {
            if (zone === "center") {
              if (payload.idx !== panelIndex) onSwapPanels(payload.idx, panelIndex)
            } else {
              // Split con un tab del propio panel también vale (saca el tab
              // a un panel nuevo); handleDockSession reubica el origen.
              onSplitSession(panelIndex, zone, raw)
            }
          } else if (payload.kind === "session") {
            onSplitSession(panelIndex, zone, payload.id)
          } else if (payload.kind === "kind") {
            onSplitSession(panelIndex, zone, raw)
          } else if (payload.kind === "tab") {
            // Ignorar tab suelto
          } else if (payload.kind === "file") {
            // Drop de archivo sobre el chat: solo los archivos usan zonas.
            // Zona baja → la ruta va al chat (agente); resto de zonas →
            // el archivo se abre a la par (split con editor en esa zona).
            if (zone === "bottom" || !onOpenFile) {
              window.dispatchEvent(new CustomEvent("plugin:insert-text", { detail: payload.path }))
            } else {
              onOpenFile(payload.path, panelIndex, zone)
            }
          } else if (payload.kind === "unknown" && raw) {
            // Texto plano sin forma de payload (p. ej. desde el explorador
            // externo): también va al agente en vez de perderse.
            window.dispatchEvent(new CustomEvent("plugin:insert-text", { detail: raw }))
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
