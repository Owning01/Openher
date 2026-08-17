import { memo, useCallback, useEffect, useRef, useState, useMemo } from "react"
import { ChatView } from "./ChatView"
import { ErrorModal } from "./ErrorModal"
import { SessionStatsPanel } from "./shellPanels"
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
  onActivate: () => void
  onClose: () => void
  /** Soltar una sesión (arrastrada desde la lista o desde otro panel) sobre este panel:
      acopla a izquierda, derecha, arriba, abajo o centro. */
  onSplitSession: (index: number, dir: "left" | "right" | "top" | "bottom" | "center", specificId?: string) => void
  onSettled: (sessionID: string, directory: string) => void
  onRefreshSessions: () => Promise<void> | void
  onSetCommands: (commands: CommandInfo[]) => void
  onRecordPrompt: (text: string) => void
  onQueueAction: (action: { type: "command" | "shell" | "prompt"; sessionID: string; directory: string; payload: string }) => Promise<void> | void
  onShellExecute: (cmd: string, sessionID: string, directory: string) => void
  onChangeAgentGlobal: (agentID: string, directory?: string) => void
  onOpenInThisPanel: (sessionID: string, directory: string) => void
  onSwapPanels: (from: number, to: number) => void
}

export const SessionChatPanel = memo(function SessionChatPanel({
  session, config, dataMode, baseProps, active, connectionState, panelIndex,
  onActivate, onClose, onSplitSession, onSettled,
  onRefreshSessions, onSetCommands, onRecordPrompt, onQueueAction,
  onShellExecute, onChangeAgentGlobal, onOpenInThisPanel, onSwapPanels
}: Props) {
  const t = useT()
  const msgs = useMessages(config, dataMode, `composer-${session.id}`)
  const [localRevertID, setLocalRevertID] = useState<string | null>(null)
  const [stopGenerationRef] = useState(() => ({ current: false }))
  const [showStats, setShowStats] = useState(false)

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
    session.directory,
    session.id
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
      await api.questionReply(config, requestID, answers, session.directory, pendingQuestions.find((q) => q.id === requestID)?.sessionID ?? session.id)
      setDismissedQuestions((prev) => new Set(prev).add(requestID))
      setPendingQuestions((prev) => prev.filter((q) => q.id !== requestID))
    } catch { /* ignore */ }
  }, [config, session.directory, session.id, pendingQuestions])

  const handleQuestionReject = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.questionReject(config, requestID, session.directory, pendingQuestions.find((q) => q.id === requestID)?.sessionID ?? session.id)
      setDismissedQuestions((prev) => new Set(prev).add(requestID))
      setPendingQuestions((prev) => prev.filter((q) => q.id !== requestID))
    } catch { /* ignore */ }
  }, [config, session.directory, session.id, pendingQuestions])

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
      await api.permissionReply(config, requestID, true, session.directory, permissionRequest?.sessionID ?? session.id)
    } catch { /* ignore */ }
    setPermissionRequest(null)
  }, [config, session.directory, session.id, permissionRequest])

  const handlePermissionReject = useCallback(async (requestID: string) => {
    if (!config) return
    try {
      await api.permissionReply(config, requestID, false, session.directory, permissionRequest?.sessionID ?? session.id)
    } catch { /* ignore */ }
    setPermissionRequest(null)
  }, [config, session.directory, session.id, permissionRequest])

  // ===== Acciones =====
  const refresh = useCallback(() => Promise.resolve(onRefreshSessions()), [onRefreshSessions])

  const panelModelAI = useMemo(() => {
    return baseProps.getModelForSession ? baseProps.getModelForSession(session.id) : null
  }, [baseProps.getModelForSession, session.id])

  const panelModelOption = panelModelAI?.activeModelOption ?? baseProps.activeModelOption
  const panelModelVariants = panelModelAI?.activeModelVariants ?? baseProps.activeModelVariants
  const panelVariant = panelModelAI ? panelModelAI.selectedVariant : baseProps.selectedVariant

  const handleSend = useCallback(async (images?: Array<{ base64: string; mime: string }>) => {
    if (!config) return
    if (!session) return
    if (!msgs.composer.trim() && (!images || images.length === 0)) return
    if (connectionState === "offline") {
      onQueueAction({ type: "prompt", sessionID: session.id, directory: session.directory, payload: msgs.composer })
      msgs.setComposer("")
      msgs.setRuntimeError("Prompt queued - will send when connection is restored")
      return
    }
    onRecordPrompt(msgs.composer)
    stopGenerationRef.current = false
    const revertMsgId = localRevertID ?? session?.revert?.messageID
    if (revertMsgId) {
      msgs.setMessages((prev) => prev.filter((m) => !m.info.id || m.info.id <= revertMsgId))
    }
    setLocalRevertID(null)
    msgs.send(session, panelModelOption ?? undefined, baseProps.activeAgentID, baseProps.commands,
      refresh,
      () => msgs.loadSelected(session.id, session.directory).then(() => undefined),
      onSetCommands, msgs.setRuntimeError, images)
      .catch(() => undefined)
  }, [msgs, session, config, connectionState, onQueueAction, panelModelOption, baseProps.activeAgentID, baseProps.commands, onRefreshSessions, onSetCommands, onRecordPrompt, localRevertID])

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
      await msgs.compactSession(session.id, session.directory, panelModelOption?.providerID ?? "", panelModelOption?.modelID ?? "", refresh, () => msgs.loadSelected(session.id, session.directory).then(() => undefined))
    } finally {
      msgs.setCompacting(false)
      msgs.setAwaitingAssistantReply(false)
    }
  }, [msgs, session, panelModelOption, refresh])

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
    activeModelOption: panelModelOption,
    activeModelVariants: panelModelVariants,
    selectedVariant: panelVariant,
    onChangeVariant: (variant: string | null) => baseProps.onChangeVariant(variant, session.id),
    messageScrollSignature: msgs.messageScrollSignature,
    compacting: msgs.compacting,
    pendingQuestions,
    permissionRequest,
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
    permissionRequest, handleSend, handleAbort, handleUndo,
    handleRedo, handleCompact, handleRevertToMessage, handleEditMessage,
    handleQuestionReply, handleQuestionReject, handleDismissQuestion,
    handlePermissionApprove, handlePermissionReject, onShellExecute,
    onChangeAgentGlobal, onOpenInThisPanel,
  ])

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
        const raw = e.dataTransfer.getData("text/plain")
        if (raw.startsWith("panel:")) {
          const parts = raw.split(":")
          const fromIdx = Number(parts[1])
          const fromSessionId = parts[2]
          if (fromIdx !== panelIndex) {
            if (zone === "center") {
              onSwapPanels(fromIdx, panelIndex)
            } else {
              onSplitSession(panelIndex, zone, fromSessionId)
            }
          }
        } else if (raw.startsWith("session:")) {
          const sId = raw.replace("session:", "")
          onSplitSession(panelIndex, zone, sId)
        } else {
          onSplitSession(panelIndex, zone)
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
      <div
        className="session-panel-header"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", `panel:${panelIndex}:${session.id}`)
          e.dataTransfer.effectAllowed = "move"
        }}
      >
        <span className="session-panel-title" title={session.directory}>
          {basename(session.directory)}
        </span>
        {busy && !active && <span className="session-panel-busy-dot" title={t('panel.busy')} aria-label={t('panel.busy')} />}
        <span className="session-panel-actions">
          <button
            type="button"
            className="btn-icon compact"
            title={t('shell.kindSessionStats')}
            aria-label={t('shell.kindSessionStats')}
            onClick={(e) => { e.stopPropagation(); setShowStats((v) => !v) }}
          >
            📊
          </button>
          <button
            type="button"
            className="btn-icon compact"
            title={t('panel.close')}
            aria-label={t('panel.close')}
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          >
            ×
          </button>
        </span>
      </div>
      {showStats && (
        <div className="session-stats-overlay">
          <SessionStatsPanel sessionID={session.id} />
        </div>
      )}
      <ChatView {...chatProps} />
      {msgs.runtimeError && <ErrorModal message={msgs.runtimeError} onClose={() => msgs.setRuntimeError(null)} />}
    </div>
  )
})
