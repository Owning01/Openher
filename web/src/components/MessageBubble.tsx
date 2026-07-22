import { memo, useCallback, useState, useMemo, useRef } from "react"
import { UndoIcon } from "../Icons"
import { formatTime } from "../utils"
import type { RenderedMessage, SessionView, AgentOption, ServerConfig } from "../types"
import { useT } from "../i18n-context"
import ToolPart from "./ToolPart"
import { ThinkingBlock } from "./ThinkingBlock"
import { Markdown } from "./Markdown"
import { isTaskTool } from "../utils/toolMeta"

function agentColorIndex(agentName: string | undefined, agents: AgentOption[]): number {
  if (!agentName) return 0
  const idx = agents.findIndex((a) => a.name === agentName || a.id === agentName)
  return idx >= 0 ? idx % 7 : 0
}

function calcDuration(msg: RenderedMessage, prevUserTs: number): string {
  const end = msg.info.time.completed ?? Date.now()
  const start = msg.info.time.created
  const dur = end - Math.max(start, prevUserTs)
  if (dur < 1000) return "<1s"
  if (dur < 60000) return `${Math.round(dur / 1000)}s`
  return `${Math.floor(dur / 60000)}m ${Math.round((dur % 60000) / 1000)}s`
}

export const MessageBubble = memo(function MessageBubble({ message, revert, onRevertToMessage, agents, prevUserTs, config, directory, onViewSubagents, onContextMenu }: {
  message: RenderedMessage
  revert?: SessionView["revert"]
  onRevertToMessage?: (messageID: string) => void
  agents?: AgentOption[]
  prevUserTs?: number
  config?: ServerConfig
  directory?: string
  onViewSubagents?: () => void
  onContextMenu?: (x: number, y: number, messageID: string) => void
}) {
  const t = useT()
  const [showConfirm, setShowConfirm] = useState(false)
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const msgParts = message.info.id.split("-")
  const msgTs = msgParts.length >= 2 ? Number(msgParts[msgParts.length - 2]) : 0
  const msgIdNum = message.info.time.created ? Number(message.info.time.created) : msgTs
  const revParts = revert ? revert.messageID.split("-") : []
  const revertIdNum = revert && revParts.length >= 2 ? Number(revParts[revParts.length - 2]) : 0
  const isReverted = revert && msgIdNum >= revertIdNum
  const isRevertPoint = revert && message.info.id === revert.messageID

  const isAssistant = message.info.role === "assistant"

  const hasSubagentTasks = useMemo(
    () => message.toolParts.some((tp) => !!(tp.type === "tool_use" && isTaskTool(tp.text ?? ""))),
    [message.toolParts],
  )

  const agentIdx = useMemo(
    () => agentColorIndex(message.info.agent ?? message.info.providerID, agents ?? []),
    [message.info.agent, message.info.providerID, agents],
  )

  const duration = useMemo(
    () => calcDuration(message, prevUserTs ?? message.info.time.created),
    [message, prevUserTs],
  )

  const handleClick = useCallback(() => {
    if (message.info.role === "user" && onRevertToMessage) {
      setShowConfirm(true)
    }
  }, [message.info.role, message.info.id, onRevertToMessage])

  const handleConfirmUndo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowConfirm(false)
    if (message.info.role === "user" && onRevertToMessage) {
      onRevertToMessage(message.info.id)
    }
  }, [message.info.role, message.info.id, onRevertToMessage])

  const handleCancelUndo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowConfirm(false)
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!onContextMenu) return
    e.preventDefault()
    onContextMenu(e.clientX, e.clientY, message.info.id)
  }, [onContextMenu, message.info.id])

  const isUserClickable = message.info.role === "user" && onRevertToMessage && !showConfirm

  return (
    <>
      {isRevertPoint && (
        <div className="revert-separator">
          <UndoIcon size={12} />
          <span>{t('detail.reverted')}</span>
        </div>
      )}
      <article
        className={`message ${message.info.role} fade-in${isReverted ? " revert-hidden" : ""}${isUserClickable ? " clickable" : ""}${showConfirm ? " confirming-undo" : ""}`}
        onClick={isUserClickable ? handleClick : undefined}
        role={isUserClickable ? "button" : undefined}
        tabIndex={isUserClickable ? 0 : undefined}
        onKeyDown={isUserClickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick() } } : undefined}
        title={isUserClickable ? t('detail.revertToHere') : undefined}
        onContextMenu={handleContextMenu}
        onTouchEnd={() => {
          if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current)
            touchTimerRef.current = null
          }
        }}
        onTouchStart={(e) => {
          touchTimerRef.current = setTimeout(() => {
            const touch = e.changedTouches[0]
            handleContextMenu({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} } as React.MouseEvent)
          }, 500)
        }}
      >
        {message.info.role === "user" && (
          <header>
            <strong>{t('detail.you')}</strong>
            <small>{formatTime(message.info.time.created)}</small>
          </header>
        )}

        {message.text && !showConfirm && (
          <div className="message-content">
            <Markdown text={message.text} />
          </div>
        )}

        {showConfirm && (
          <div className="undo-confirm">
            <span className="undo-confirm-text">Undo this message?</span>
            <div className="undo-confirm-actions">
              <button className="undo-confirm-yes" onClick={handleConfirmUndo}>Yes</button>
              <button className="undo-confirm-no" onClick={handleCancelUndo}>No</button>
            </div>
          </div>
        )}

        {message.thinkingParts && message.thinkingParts.length > 0 && !showConfirm && (
          <ThinkingBlock parts={message.thinkingParts} duration={duration} />
        )}
        {message.toolParts.length > 0 && !showConfirm && (
          <div className="tool-parts">
            {message.toolParts.map((tp) => (
              <ToolPart key={tp.id} part={tp} config={config} directory={directory} onViewSubagents={onViewSubagents} />
            ))}
          </div>
        )}

        {isAssistant && (
          <div className="message-footer">
            <span className="msg-agent-dot" style={{ color: `var(--agent-${agentIdx})` }}>▣</span>
            <span className="msg-footer-mode">{message.info.mode ?? "chat"}</span>
            {message.info.modelID && <span className="msg-footer-model"> · {message.info.modelID}</span>}
            <span className="msg-footer-duration"> · {duration}</span>
            {message.info.finish === "aborted" && (
              <span className="msg-footer-interrupted"> · interrupted</span>
            )}
          </div>
        )}

        {hasSubagentTasks && onViewSubagents && (
          <button className="subagent-hint" onClick={onViewSubagents}>
            ↳ view subagents
          </button>
        )}

        {message.hasCompaction && <div className="compaction-checkpoint" />}
      </article>
    </>
  )
})

export default MessageBubble
