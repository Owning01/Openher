import { memo, useCallback, useEffect, useRef, useState, useMemo } from "react"
import { ChatView } from "./ChatView"
import { ErrorModal } from "./ErrorModal"
import { useMessages } from "../hooks/useMessages"
import { useSSE } from "../hooks/useSSE"
import { useSSEHandler } from "../hooks/useSSEHandler"
import { api } from "../api"
import { useT } from "../i18n-context"
import { QUESTION_POLL_INTERVAL_MS } from "../constants"
import { basename } from "../utils"
import type { ChatViewProps } from "./ChatView"
import type { ServerConfig, DataMode, SessionView, CommandInfo, Question, PermissionRequest } from "../types"

type Props = {
  session: SessionView
  config: ServerConfig
  dataMode: DataMode
  baseProps: ChatViewProps
  active: boolean
  connectionState: string
  panelIndex: number
  maximized?: boolean
  onRestore?: () => void
  onActivate: () => void
  onSplitRight: () => void
  onSplitBottom: () => void
  onClose: () => void
  onSettled: (sessionID: string, directory: string) => void
  onRefreshSessions: () => Promise<void> | void
  onSetCommands: (commands: CommandInfo[]) => void
  onRecordPrompt: (text: string) => void
  onQueueAction: (action: { type: "command" | "shell" | "prompt"; sessionID: string; directory: string; payload: string }) => Promise<void> | void
  onShellExecute: (cmd: string, sessionID: string, directory: string) => void
  onChangeAgentGlobal: (agentID: string, directory?: string) => void
  onOpenInThisPanel: (sessionID: string, directory: string) => void
  onToggleMaximize: (index: number) => void
  onDropSession: (index: number) => void
  onSwapPanels: (from: number, to: number) => void
}

export const SessionChatPanel = memo(function SessionChatPanel({
  session, config, dataMode, baseProps, active, connectionState, panelIndex,
  maximized, onRestore,
  onActivate, onSplitRight, onSplitBottom, onClose, onSettled,
  onRefreshSessions, onSetCommands, onRecordPrompt, onQueueAction,
  onShellExecute, onChangeAgentGlobal, onOpenInThisPanel,
  onToggleMaximize, onDropSession, onSwapPanels
}: Props) {
  const t = useT()
  const msgs = useMessages(config, dataMode, `composer-${session.id}`)
  const [localRevertID, setLocalRevertID] = useState<string | null>(null)
  const [stopGenerationRef] = useState(() => ({ current: false }))

  useEffect(() => {
    msgs.clearSession()
    msgs.loadSelected(session.id, session.directory).catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, session.directory])

  const busy = msgs.awaitingAssistantReply

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
    (dataMode === "full" && baseProps.flags.streamingFull) ? config : null,
    useCallback((event) => {
      if (stopGenerationRef.current) {
        if (event.type === "message.part.delta" || event.type === "message.updated" || event.type === "message.part.updated"
          || event.type === "session.next.text.delta" || event.type === "session.next.reasoning.delta"
          || event.type === "session.next.tool.input.delta") return
      }
      handleSSEEvent(event)
    }, [handleSSEEvent, stopGenerationRef]),
    session.directory
  )

  // ===== Questions (por panel/directorio) =====
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([])
  const [dismissedQuestions, setDismissedQuestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!config || !baseProps.flags.questionAuto) return
    const poll = async () => {
      try {
        const qs = await api.listPendingQuestions(config, session.directory)
        setPendingQuestions(qs.filter((q) => !dismissedQuestions.has(q.id)))
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, QUESTION_POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [config, baseProps.flags.questionAuto, session.directory, dismissedQuestions])

  const handleQuestionReply = useCallback(async (requestID: string, answers: string[][]) => {
    if (!config) return
    try {
      await api.questionReply(config, requestID, answers, session.directory)
      setDismissedQuestions((prev) => new Set(prev).add(requestID))
      setPendingQuestions((prev) => prev.filter((q) => q.id !== requestID))
    } catch { /* ignore */ }
  }, [config, session.directory])

  const handleQuestionReject = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.questionReject(config, requestID, session.directory)
      setDismissedQuestions((prev) => new Set(prev).add(requestID))
      setPendingQuestions((prev) => prev.filter((q) => q.id !== requestID))
    } catch { /* ignore */ }
  }, [config, session.directory])

  const handleDismissQuestion = useCallback(() => {
    setPendingQuestions((prev) => prev.slice(1))
  }, [])

  // ===== Permissions =====
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null)

  useEffect(() => {
    if (!config || !baseProps.flags.permissionUI) return
    let cancelled = false
    const poll = async () => {
      try {
        const perms = await api.listPermissions(config, session.directory)
        if (!cancelled) setPermissionRequest(perms?.[0] ?? null)
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, QUESTION_POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [config, baseProps.flags.permissionUI, session.directory])

  const handlePermissionApprove = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.permissionReply(config, requestID, true, session.directory)
    } catch { /* ignore */ }
    setPermissionRequest(null)
  }, [config, session.directory])

  const handlePermissionReject = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.permissionReply(config, requestID, false, session.directory)
    } catch { /* ignore */ }
    setPermissionRequest(null)
  }, [config, session.directory])

  // ===== Acciones =====
  const refresh = useCallback(() => Promise.resolve(onRefreshSessions()), [onRefreshSessions])

  const handleSend = useCallback(async (images?: Array<{ base64: string; mime: string }>) => {
    if (!msgs.composer) return
    if (connectionState === "offline") {
      onQueueAction({ type: "prompt", sessionID: session.id, directory: session.directory, payload: msgs.composer })
      msgs.setComposer("")
      msgs.setRuntimeError("Prompt queued - will send when connection is restored")
      return
    }
    if (baseProps.flags.promptQueue && msgs.awaitingAssistantReply) {
      msgs.queuePrompt(msgs.composer, images)
      msgs.setComposer("")
      return
    }
    onRecordPrompt(msgs.composer)
    stopGenerationRef.current = false
    setLocalRevertID(null)
    msgs.send(session, baseProps.activeModelOption ?? undefined, baseProps.activeAgentID, baseProps.commands,
      refresh,
      () => msgs.loadSelected(session.id, session.directory).then(() => undefined),
      onSetCommands, msgs.setRuntimeError, images)
      .catch(() => undefined)
  }, [msgs, session, connectionState, onQueueAction, baseProps.flags.promptQueue, baseProps.activeModelOption, baseProps.activeAgentID, baseProps.commands, onRefreshSessions, onSetCommands, onRecordPrompt])

  const handleAbort = useCallback(async () => {
    stopGenerationRef.current = true
    try { await msgs.abortSession(session.id, session.directory) } catch { /* ignore */ }
  }, [msgs, session])

  const handleRevertToMessage = useCallback(async (messageID: string) => {
    try {
      if (msgs.awaitingAssistantReply) {
        await api.abort(config, session.id, session.directory)
      }
      const target = msgs.renderedMessages.find((m) => m.info.id === messageID)
      await api.revert(config, session.id, messageID, session.directory)
      setLocalRevertID(messageID)
      await msgs.loadSelected(session.id, session.directory)
      onRefreshSessions()
      if (target?.text) msgs.setComposer(target.text)
    } catch (err) {
      msgs.setRuntimeError((err as Error).message)
    }
  }, [msgs, config, session, onRefreshSessions])

  const handleEditMessage = useCallback(async (messageID: string, text: string) => {
    try {
      if (msgs.awaitingAssistantReply) {
        await api.abort(config, session.id, session.directory)
      }
      await api.revert(config, session.id, messageID, session.directory)
      setLocalRevertID(messageID)
      await msgs.loadSelected(session.id, session.directory)
      onRefreshSessions()
      msgs.setComposer(text)
    } catch (err) {
      msgs.setRuntimeError((err as Error).message)
    }
  }, [msgs, config, session, onRefreshSessions])

  const handleUndo = useCallback(() => {
    msgs.undoMessage(session.id, session.directory, undefined, refresh, () => msgs.loadSelected(session.id, session.directory).then(() => undefined))
  }, [msgs, session, refresh])

  const handleRedo = useCallback(() => {
    setLocalRevertID(null)
    msgs.redoMessage(session.id, session.directory, refresh, () => msgs.loadSelected(session.id, session.directory).then(() => undefined))
  }, [msgs, session, refresh])

  const handleCompact = useCallback(async () => {
    msgs.setCompacting(true)
    msgs.setAwaitingAssistantReply(true)
    try {
      await msgs.compactSession(session.id, session.directory, baseProps.activeModelOption?.providerID ?? "", baseProps.activeModelOption?.modelID ?? "", refresh, () => msgs.loadSelected(session.id, session.directory).then(() => undefined))
    } finally {
      msgs.setCompacting(false)
      msgs.setAwaitingAssistantReply(false)
    }
  }, [msgs, session, baseProps.activeModelOption, refresh])

  const handleSendQueued = useCallback((id: string) => {
    const qp = msgs.queuedPrompts.find((p) => p.id === id)
    if (!qp) return
    msgs.removeQueued(id)
    onRecordPrompt(qp.text)
    stopGenerationRef.current = false
    setLocalRevertID(null)
    msgs.send(session, baseProps.activeModelOption ?? undefined, baseProps.activeAgentID, baseProps.commands,
      refresh,
      () => msgs.loadSelected(session.id, session.directory).then(() => undefined),
      onSetCommands, msgs.setRuntimeError, qp.images, qp.text)
      .catch(() => undefined)
  }, [msgs, session, baseProps.activeModelOption, baseProps.activeAgentID, baseProps.commands, onRefreshSessions, onSetCommands, onRecordPrompt])

  const chatProps: ChatViewProps = useMemo(() => ({
    ...baseProps,
    view: "detail",
    selectedSession: session,
    revertID: localRevertID,
    messages: msgs.renderedMessages,
    composer: msgs.composer,
    isWorking: msgs.awaitingAssistantReply,
    showTypingBubble: msgs.awaitingAssistantReply,
    loadingSessionID: null,
    selectedID: session.id,
    messageScrollSignature: msgs.messageScrollSignature,
    compacting: msgs.compacting,
    pendingQuestions,
    permissionRequest,
    queuedPrompts: msgs.queuedPrompts,
    onRemoveQueued: msgs.removeQueued,
    onSendQueued: handleSendQueued,
    onComposerChange: msgs.setComposer,
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
    onDismissPermission: () => setPermissionRequest(null),
    onShellSend: (cmd) => onShellExecute(cmd, session.id, session.directory),
    onChangeAgent: (id) => onChangeAgentGlobal(id, session.directory),
    onBackToSessions: () => undefined,
    onOpenSession: (id, dir) => onOpenInThisPanel(id, dir),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    baseProps, session, localRevertID, msgs, streamState, pendingQuestions,
    permissionRequest, handleSendQueued, handleSend, handleAbort, handleUndo,
    handleRedo, handleCompact, handleRevertToMessage, handleEditMessage,
    handleQuestionReply, handleQuestionReject, handleDismissQuestion,
    handlePermissionApprove, handlePermissionReject, onShellExecute,
    onChangeAgentGlobal, onOpenInThisPanel,
  ])

  return (
    <div className={`session-panel${active ? " active" : ""}`} onClick={onActivate}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onDropSession(panelIndex) }}>
      <div className="session-panel-header" draggable
        onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(panelIndex)); e.dataTransfer.effectAllowed = "move" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation()
          const raw = e.dataTransfer.getData("text/plain")
          if (/^\d+$/.test(raw)) onSwapPanels(Number(raw), panelIndex)
        }}
        onDoubleClick={() => onToggleMaximize(panelIndex)}>
        <span className="session-panel-title" title={session.directory}>
          {basename(session.directory)}
        </span>
        {busy && !active && <span className="session-panel-busy-dot" title={t('panel.busy')} aria-label={t('panel.busy')} />}
        <span className="session-panel-actions">
          {maximized ? (
            <button type="button" className="btn-icon compact" title={t('panel.restore')} aria-label={t('panel.restore')} onClick={(e) => { e.stopPropagation(); onRestore?.() }}>⤢</button>
          ) : (
            <>
              <button type="button" className="btn-icon compact" title={t('panel.splitRight')} aria-label={t('panel.splitRight')} onClick={(e) => { e.stopPropagation(); onSplitRight() }}>⫸</button>
              <button type="button" className="btn-icon compact" title={t('panel.splitBottom')} aria-label={t('panel.splitBottom')} onClick={(e) => { e.stopPropagation(); onSplitBottom() }}>⫯</button>
              <button type="button" className="btn-icon compact" title={t('panel.maximize')} aria-label={t('panel.maximize')} onClick={(e) => { e.stopPropagation(); onToggleMaximize(panelIndex) }}>⛶</button>
            </>
          )}
          <button type="button" className="btn-icon compact" title={t('panel.close')} aria-label={t('panel.close')} onClick={(e) => { e.stopPropagation(); onClose() }}>×</button>
        </span>
      </div>
      <ChatView {...chatProps} />
      {msgs.runtimeError && <ErrorModal message={msgs.runtimeError} onClose={() => msgs.setRuntimeError(null)} />}
    </div>
  )
})
