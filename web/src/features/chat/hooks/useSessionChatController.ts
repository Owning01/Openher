import { useCallback, useMemo, useState } from "react"
import type { Dispatch, MutableRefObject, SetStateAction } from "react"
import { api } from "../../../api"
import { isSessionActive } from "../../../utils"
import { formatSelectionForPrompt } from "../../../hooks/useVisualSelection"
import { claimSharedOutbox, resumeSharedOutbox, useMessages } from "../../../hooks/useMessages"
import { keepMessagesBefore, keepMessagesThrough } from "../domain/message-order"
import { openPromptHistory } from "../../../utils/promptHistory"
import type {
  CommandInfo,
  DataMode,
  FeatureFlags,
  MessageEnvelope,
  ModelOption,
  RenderedMessage,
  ServerConfig,
  SessionView,
} from "../../../types"
import type { OutboxItem } from "../../../stores/outboxStore"

// C3 — Un solo flujo de chat.
//
// `useSessionChatFlow` es la UNICA implementacion de send / stop / revert /
// edit / undo / redo / compact / outboxActions. La consumen:
//   - `useSessionChatController` (desktop: envuelve `useMessages`), y
//   - `useChatActions` (movil: recibe el `useMessages` del runtime por params).
// Las diferencias reales entre los dos caminos no se borran: se declaran con
// `variant` y adapters (`markSession*`, `patchSession`, `onAfterAbort`,
// `resumeOutbox`, `holdOutbox`, `onCommandResult`). Q2 fija esa conducta.

export type SessionChatVariant = "desktop" | "mobile"

export type ChatSendFn = (
  session: SessionView,
  activeModel: ModelOption | undefined,
  activeAgentID: string,
  commands: { name: string }[],
  onRefreshSessions: () => Promise<void>,
  onLoadSelected: () => Promise<void>,
  onSetCommands: (cmds: { name: string }[]) => void,
  onSetRuntimeError: (err: string | null) => void,
  images?: Array<{ base64: string; mime: string }>,
  textOverride?: string,
  onSetRevertID?: (id: string | null) => void,
  translatedFrom?: string,
) => Promise<unknown>

export type UndoRedoFn = (
  sessionID: string,
  directory: string,
  revert: { messageID: string } | undefined,
  onRefreshSessions: () => Promise<void>,
  onLoadSelected: () => Promise<void>,
  onPatchSession?: (patch: { revert?: { messageID: string } }) => void,
  onSetRevertID?: (id: string | null) => void,
) => unknown

export type CompactFn = (
  sessionID: string,
  directory: string,
  providerID: string,
  modelID: string,
  onRefreshSessions: () => Promise<void>,
  onLoadSelected: () => Promise<void>,
) => Promise<void>

export type ChatQueueAction = {
  type: "command" | "shell" | "prompt"
  sessionID: string
  directory: string
  payload: string
  model?: { providerID: string; modelID: string; variant?: string }
  agentID?: string
  images?: Array<{ base64: string; mime: string }>
  options?: { translate?: boolean }
}

export type SessionChatFlowDeps = {
  variant: SessionChatVariant
  session: SessionView | null
  config: ServerConfig | null
  connectionState: string
  activeModel: ModelOption | null
  activeAgentID?: string
  commands: CommandInfo[]
  composerRef: MutableRefObject<string>
  setComposer: (value: string) => void
  setRuntimeError: (err: string | null) => void
  stopGenerationRef: MutableRefObject<boolean>
  localRevertID: string | null
  setLocalRevertID: (id: string | null) => void
  /** Mensajes crudos (snapshot del rollback). Solo lo usa la variante desktop. */
  messages: MessageEnvelope[]
  setMessages: Dispatch<SetStateAction<any[]>>
  renderedMessages: RenderedMessage[]
  outbox: OutboxItem[]
  enqueueOutbox: (sessionID: string, text: string, images?: OutboxItem["images"]) => unknown
  removeOutbox: (id: string) => void
  send: ChatSendFn
  abortSession: (sessionID: string, directory: string) => Promise<void>
  awaitingAssistantReply: boolean
  setAwaitingAssistantReply: (value: boolean) => void
  completionShouldPlayRef: MutableRefObject<boolean>
  /** Solo desktop: guard "ya hay un envio en curso". */
  isSending?: boolean
  visualHasSelection: boolean
  visualPromptContext?: string
  clearVisualSelection?: () => void
  resumeOutbox: (sessionID: string) => void
  /** Adapter con el literal pineado en cada consumidor (hold por sesion). */
  holdOutbox: (sessionID: string) => void
  queueAction: (action: ChatQueueAction) => void
  onCommandResult?: (result: string, directory: string) => void
  onAfterAbort?: () => Promise<void> | void
  onSettled?: (sessionID: string, directory: string) => void
  markSessionBusy?: (sessionID: string) => void
  markSessionIdle?: (sessionID: string) => void
  patchSession?: (patch: Record<string, unknown>) => void
  refreshSessions: () => Promise<void>
  loadSelected: (sessionID: string, directory: string) => Promise<void>
  setCommands: (commands: CommandInfo[]) => void
  dismissSessionQuestions?: (sessionID?: string) => void
  undoMessage: UndoRedoFn
  redoMessage: UndoRedoFn
  compactSession: CompactFn
}

/**
 * Nucleo compartido. Devuelve las acciones del chat; el consumidor aporta el
 * `useMessages` y los adapters de su camino.
 */
export function useSessionChatFlow(deps: SessionChatFlowDeps) {
  const {
    variant, session, config, connectionState, activeModel, activeAgentID, commands,
    composerRef, setComposer, setRuntimeError, stopGenerationRef, localRevertID, setLocalRevertID,
    messages, setMessages, renderedMessages, outbox, enqueueOutbox, removeOutbox,
    send, abortSession, awaitingAssistantReply, setAwaitingAssistantReply, completionShouldPlayRef,
    isSending, visualHasSelection, visualPromptContext, clearVisualSelection,
    resumeOutbox, holdOutbox, queueAction, onCommandResult, onAfterAbort,
    markSessionBusy, markSessionIdle, patchSession, refreshSessions, loadSelected,
    setCommands, dismissSessionQuestions, undoMessage, redoMessage, compactSession,
  } = deps

  const [stopping, setStopping] = useState(false)

  const handleSend = useCallback(async (
    images?: Array<{ base64: string; mime: string }>,
    options?: { translate?: boolean },
    text?: string,
    force?: boolean,
  ) => {
    if (!session) return
    if (!config) return
    // Un envio manual reanuda el auto-flush (p. ej. despues de un Stop).
    if (!force) resumeOutbox(session.id)
    const rawInput = (typeof text === "string" ? text : composerRef.current)
    // El desktop normaliza whitespace a "" antes de armar el prompt visual.
    const raw = variant === "desktop" ? (rawInput.trim() ? rawInput : "") : rawInput
    const hasVisual = variant === "desktop"
      ? Boolean(visualPromptContext)
      : (visualHasSelection && !!visualPromptContext)
    const currentComposer = hasVisual ? formatSelectionForPrompt(raw, visualPromptContext!) : raw
    const isEmpty = !currentComposer.trim() && (!images || images.length === 0)
    if (variant === "desktop" && isEmpty) return

    if (!force && (awaitingAssistantReply || isSessionActive(session))) {
      // Ocupado: a la cola visible en vez de rechazar. El desktop encola el
      // prompt ya formateado; el movil encola el texto crudo (como antes).
      if (isEmpty) return false
      enqueueOutbox(session.id, variant === "desktop" ? currentComposer : raw, images)
      setComposer("")
      composerRef.current = ""
      if (hasVisual) clearVisualSelection?.()
      return true
    }
    if (variant === "desktop" && isSending) {
      setRuntimeError("Ya hay un envio en curso — espera un momento")
      return false
    }
    if (connectionState === "offline") {
      queueAction({
        type: "prompt",
        sessionID: session.id,
        directory: session.directory,
        payload: currentComposer,
        model: activeModel ? { providerID: activeModel.providerID, modelID: activeModel.modelID, variant: activeModel.variant } : undefined,
        agentID: activeAgentID || undefined,
        images,
        options,
      })
      setComposer("")
      composerRef.current = ""
      setRuntimeError("Prompt queued - will send when connection is restored")
      if (hasVisual) clearVisualSelection?.()
      return
    }
    // Desktop formatea primero (y traduce el bloque visual completo); movil
    // traduce el texto crudo y despues agrega el contexto visual. Q2 fija esa
    // diferencia: NO se unifica para no cambiar el payload enviado.
    let sendText = variant === "desktop" ? currentComposer : raw
    let originalText: string | null = null
    if (options?.translate && sendText.trim()) {
      try {
        const { translateToEnglish } = await import("../../../utils/translate")
        const translated = await translateToEnglish(sendText)
        if (translated !== sendText) {
          originalText = sendText
          sendText = translated
          setComposer(translated)
          if (variant === "desktop") composerRef.current = translated
        }
      } catch (err) {
        setRuntimeError(`Translation failed: ${(err as Error).message}`)
        return false
      }
    }
    if (variant === "mobile" && hasVisual) {
      sendText = formatSelectionForPrompt(sendText, visualPromptContext!)
    }
    stopGenerationRef.current = false
    const revertMsgId = localRevertID ?? session.revert?.messageID
    let prevMessagesSnapshot: any[] | null = null
    if (revertMsgId) {
      const sid = session.id
      if (variant === "desktop") {
        prevMessagesSnapshot = messages
        setMessages((prev) => keepMessagesBefore(prev, sid, revertMsgId))
      } else {
        setMessages((prev) => {
          prevMessagesSnapshot = prev
          return keepMessagesBefore(prev, sid, revertMsgId)
        })
      }
    }
    setLocalRevertID(null)
    if (variant === "mobile") markSessionBusy?.(session.id)
    const result = await send(
      session,
      activeModel ?? undefined,
      activeAgentID ?? "",
      commands,
      () => refreshSessions(),
      () => loadSelected(session.id, session.directory).then(() => undefined),
      setCommands,
      setRuntimeError,
      images,
      sendText,
      variant === "mobile" ? setLocalRevertID : undefined,
      originalText ?? undefined,
    )
    if (result === false) {
      // Rollback de pruning y restaurar composer original si hubo traduccion.
      if (prevMessagesSnapshot) setMessages(prevMessagesSnapshot)
      else if (variant === "mobile" && revertMsgId) loadSelected(session.id, session.directory).catch(() => {})
      if (originalText) setComposer(originalText)
      if (variant === "mobile") markSessionIdle?.(session.id)
    } else if (variant === "mobile" && typeof result === "string") {
      // Comando local: el busy optimista no debe quedar pegado.
      markSessionIdle?.(session.id)
    }
    // Limpiar seleccion visual siempre para evitar contexto stale en reintentos.
    if (hasVisual) clearVisualSelection?.()
    if (typeof result === "string") onCommandResult?.(result, session.directory)
    return typeof result === "boolean" ? result : true
  }, [
    variant, session, config, connectionState, activeModel, activeAgentID, commands,
    composerRef, setComposer, setRuntimeError, stopGenerationRef, localRevertID, setLocalRevertID,
    messages, setMessages, renderedMessages, outbox, enqueueOutbox, removeOutbox,
    send, awaitingAssistantReply, completionShouldPlayRef, isSending,
    visualHasSelection, visualPromptContext, clearVisualSelection, resumeOutbox,
    queueAction, onCommandResult, markSessionBusy, markSessionIdle, refreshSessions,
    loadSelected, setCommands,
  ])

  const handleAbort = useCallback(async () => {
    if (!session) return
    // Doble clic: el flag se pone sincronico abajo, el segundo llamado sale aca.
    if (stopGenerationRef.current) return
    stopGenerationRef.current = true
    setStopping(true)
    setAwaitingAssistantReply(false)
    completionShouldPlayRef.current = false
    // Stop explicito: la cola pendiente NO se auto-envia al quedar libre.
    holdOutbox(session.id)
    // Preguntas del turno abortado: cierre local para que el modal no reaparezca.
    dismissSessionQuestions?.(session.id)
    if (variant === "mobile") markSessionIdle?.(session.id)
    setMessages((prev) => prev.map((m) => {
      if (m.info.sessionID === session.id && m.info.role === "assistant" && !m.info.time.completed) {
        return { ...m, info: { ...m.info, time: { ...m.info.time, completed: Date.now() } } }
      }
      return m
    }))
    try {
      await abortSession(session.id, session.directory)
      await onAfterAbort?.()
    } catch (e) {
      // Antes se tragaba en silencio y el server seguia generando ("no para").
      setRuntimeError(`No se pudo detener la generacion: ${(e as Error)?.message ?? String(e)}`)
    } finally {
      // El flag se apaga al confirmar idle (efecto en el consumidor); timeout
      // de seguridad por si el server nunca reporta.
      setTimeout(() => {
        stopGenerationRef.current = false
        setStopping(false)
      }, 10000)
    }
  }, [
    session, variant, stopGenerationRef, setAwaitingAssistantReply, completionShouldPlayRef,
    holdOutbox, dismissSessionQuestions, markSessionIdle, setMessages, abortSession,
    onAfterAbort, setRuntimeError,
  ])

  const handleRevertToMessage = useCallback(async (messageID: string) => {
    if (!session || !config) return
    try {
      if (awaitingAssistantReply) {
        await api.abort(config, session.id, session.directory).catch(() => {})
      }
      const target = renderedMessages.find((m) => m.info.id === messageID)
      if (variant === "desktop") {
        // S3: filtro optimista instantaneo — oculta mensajes despues del target.
        setMessages((prev) => keepMessagesThrough(prev, session.id, messageID))
      }
      setLocalRevertID(messageID)
      await api.revert(config, session.id, messageID, session.directory)
      if (variant === "mobile") {
        // El movil se traga el fallo de recarga; el desktop lo propaga al catch.
        await loadSelected(session.id, session.directory).catch(() => {})
        await refreshSessions().catch(() => {})
      } else {
        await loadSelected(session.id, session.directory)
      }
      if (target?.text) setComposer(target.text)
    } catch (err) {
      setLocalRevertID(null)
      if (variant === "desktop") {
        await loadSelected(session.id, session.directory).catch(() => {})
        setRuntimeError((err as Error).message)
      } else {
        setRuntimeError((err as Error).message)
        await loadSelected(session.id, session.directory).catch(() => {})
      }
    }
  }, [
    session, config, variant, awaitingAssistantReply, renderedMessages, setMessages,
    setLocalRevertID, loadSelected, refreshSessions, setComposer, setRuntimeError,
  ])

  const handleEditMessage = useCallback(async (messageID: string, text: string) => {
    if (!session || !config) return
    try {
      if (awaitingAssistantReply) {
        await api.abort(config, session.id, session.directory).catch(() => {})
      }
      if (variant === "desktop") {
        setMessages((prev) => keepMessagesThrough(prev, session.id, messageID))
      }
      setLocalRevertID(messageID)
      await api.revert(config, session.id, messageID, session.directory)
      if (variant === "mobile") {
        await loadSelected(session.id, session.directory).catch(() => {})
        await refreshSessions().catch(() => {})
      } else {
        await loadSelected(session.id, session.directory)
      }
      setComposer(text)
    } catch (err) {
      setLocalRevertID(null)
      if (variant === "desktop") {
        await loadSelected(session.id, session.directory).catch(() => {})
        setRuntimeError((err as Error).message)
      } else {
        setRuntimeError((err as Error).message)
        await loadSelected(session.id, session.directory).catch(() => {})
      }
    }
  }, [
    session, config, variant, awaitingAssistantReply, setMessages, setLocalRevertID,
    loadSelected, refreshSessions, setComposer, setRuntimeError,
  ])

  const handleUndo = useCallback(() => {
    if (!session) return
    undoMessage(
      session.id,
      session.directory,
      session.revert,
      refreshSessions,
      () => loadSelected(session.id, session.directory).then(() => undefined),
      patchSession as ((patch: { revert?: { messageID: string } }) => void) | undefined,
      setLocalRevertID,
    )
  }, [session, undoMessage, refreshSessions, loadSelected, patchSession, setLocalRevertID])

  const handleRedo = useCallback(() => {
    if (!session) return
    redoMessage(
      session.id,
      session.directory,
      session.revert,
      refreshSessions,
      () => loadSelected(session.id, session.directory).then(() => undefined),
      patchSession as ((patch: { revert?: { messageID: string } }) => void) | undefined,
      setLocalRevertID,
    )
  }, [session, redoMessage, refreshSessions, loadSelected, patchSession, setLocalRevertID])

  const handleCompact = useCallback(async () => {
    if (!session) return
    if (variant === "mobile") {
      if (!activeModel) return
      completionShouldPlayRef.current = true
    }
    await compactSession(
      session.id,
      session.directory,
      activeModel?.providerID ?? "",
      activeModel?.modelID ?? "",
      refreshSessions,
      () => loadSelected(session.id, session.directory).then(() => undefined),
    )
  }, [session, variant, activeModel, completionShouldPlayRef, compactSession, refreshSessions, loadSelected])

  // Acciones de la cola visible por id de mensaje pendiente.
  const outboxActions = useMemo(() => {
    const map: Record<string, { onDelete: () => void; onEdit: () => void; onSendNow: () => void }> = {}
    for (const o of outbox ?? []) {
      if (!session || o.sessionID !== session.id) continue
      map[o.id] = {
        onDelete: () => removeOutbox(o.id),
        onEdit: () => {
          setComposer(o.text)
          composerRef.current = o.text
          removeOutbox(o.id)
        },
        onSendNow: () => {
          // Claim: el flush automatico (este panel u otra vista de la misma
          // sesion) puede estar enviando este mismo item; sin claim salia doble.
          if (!claimSharedOutbox(o.id)) return
          removeOutbox(o.id)
          // Accion explicita del usuario: reanuda el auto-flush (si estaba en hold).
          resumeOutbox(o.sessionID)
          void handleSend(o.images, undefined, o.text, true).then((res) => {
            // Si no pudo salir (otro envio en curso), vuelve a la cola.
            if (res === false) enqueueOutbox(o.sessionID, o.text, o.images)
          })
        },
      }
    }
    return map
  }, [outbox, session, removeOutbox, setComposer, composerRef, handleSend, enqueueOutbox, resumeOutbox])

  return {
    handleSend,
    handleAbort,
    handleRevertToMessage,
    handleEditMessage,
    handleUndo,
    handleRedo,
    handleCompact,
    outboxActions,
    stopping,
    setStopping,
  }
}

export type SessionChatFlow = ReturnType<typeof useSessionChatFlow>

export type SessionChatControllerParams = {
  session: SessionView
  config: ServerConfig
  dataMode: DataMode
  /** Reservado por la firma del plan; el panel ya lo usa para sus propias flags. */
  _flags?: FeatureFlags
  connectionState: string
  activeModel: ModelOption | null
  activeAgentID: string
  commands: CommandInfo[]
  composerRef: MutableRefObject<string>
  stopGenerationRef: MutableRefObject<boolean>
  localRevertID: string | null
  setLocalRevertID: (id: string | null) => void
  visualPromptContext?: string
  clearVisualSelection?: () => void
  onQueueAction: (action: ChatQueueAction) => Promise<void> | void
  onOpenConnect?: () => void
  onOpenNewSession?: (directory?: string) => void
  onSetCommands: (commands: CommandInfo[]) => void
  onRefreshSessions: () => Promise<void> | void
  onSettled: (sessionID: string, directory: string) => void
  /** Adapter con el literal `holdSharedOutbox(session.id)` en el panel. */
  onHoldOutbox: (sessionID: string) => void
  dismissSessionQuestions?: (sessionID?: string) => void
}

/**
 * C3: hook de desktop sobre `useMessages`. Reemplaza el bloque de acciones que
 * vivia inline en SessionChatPanel y comparte `useSessionChatFlow` con el movil.
 */
export function useSessionChatController(params: SessionChatControllerParams) {
  const {
    session, config, dataMode, connectionState, activeModel, activeAgentID, commands,
    composerRef, stopGenerationRef, localRevertID, setLocalRevertID,
    visualPromptContext, clearVisualSelection, onQueueAction, onOpenConnect,
    onOpenNewSession, onSetCommands, onRefreshSessions, onSettled, onHoldOutbox,
    dismissSessionQuestions,
  } = params
  const msgs = useMessages(config, dataMode, `composer-${session.id}`)
  const refresh = useCallback(() => Promise.resolve(onRefreshSessions()), [onRefreshSessions])
  const loadSelected = useCallback(
    (sessionID: string, directory: string) => msgs.loadSelected(sessionID, directory),
    [msgs.loadSelected],
  )

  const flow = useSessionChatFlow({
    variant: "desktop",
    session,
    config,
    connectionState,
    activeModel,
    activeAgentID,
    commands,
    composerRef,
    setComposer: msgs.setComposer,
    setRuntimeError: msgs.setRuntimeError,
    stopGenerationRef,
    localRevertID,
    setLocalRevertID,
    messages: msgs.messages,
    setMessages: msgs.setMessages,
    renderedMessages: msgs.renderedMessages,
    outbox: msgs.outbox,
    enqueueOutbox: msgs.enqueueOutbox,
    removeOutbox: msgs.removeOutbox,
    send: msgs.send,
    abortSession: msgs.abortSession,
    awaitingAssistantReply: msgs.awaitingAssistantReply,
    setAwaitingAssistantReply: msgs.setAwaitingAssistantReply,
    completionShouldPlayRef: msgs.completionShouldPlayRef,
    isSending: msgs.isSending,
    visualHasSelection: Boolean(visualPromptContext),
    visualPromptContext,
    clearVisualSelection,
    resumeOutbox: resumeSharedOutbox,
    holdOutbox: onHoldOutbox,
    queueAction: onQueueAction,
    onCommandResult: (result, directory) => {
      if (result === "connect") onOpenConnect?.()
      else if (result === "newSession") onOpenNewSession?.(directory)
      else if (result === "history" || result === "timeline") openPromptHistory()
    },
    onAfterAbort: async () => {
      msgs.loadSelected(session.id, session.directory).catch(() => undefined)
      onSettled(session.id, session.directory)
      refresh().catch(() => undefined)
    },
    refreshSessions: refresh,
    loadSelected,
    setCommands: onSetCommands,
    dismissSessionQuestions,
    undoMessage: msgs.undoMessage as UndoRedoFn,
    redoMessage: msgs.redoMessage as UndoRedoFn,
    compactSession: msgs.compactSession as CompactFn,
  } satisfies SessionChatFlowDeps)

  const isWorking = useMemo(
    () => msgs.awaitingAssistantReply || isSessionActive(session),
    [msgs.awaitingAssistantReply, session],
  )

  return { msgs, isWorking, ...flow }
}

export type SessionChatController = ReturnType<typeof useSessionChatController>
