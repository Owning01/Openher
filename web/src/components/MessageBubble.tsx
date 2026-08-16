import { memo, useCallback, useState, useMemo, useRef } from "react"
import { PencilIcon, UndoIcon, MenuDotsIcon } from "../Icons"
import { formatTime } from "../utils"
import type { RenderedMessage, SessionView, AgentOption, ServerConfig } from "../types"
import { useT } from "../i18n-context"
import { useOutsideClick } from "../hooks/useOutsideClick"
import ToolPart from "./ToolPart"
import { FileDiffs } from "./FileDiffs"
import { ThinkingBlock } from "./ThinkingBlock"
import { Markdown } from "./Markdown"
import { ImageLightbox } from "./ImageLightbox"

// Compara ids de mensaje (msg_<hexTimestamp+counter>): lexicográfica por
// defecto, con fallback numérico si el server cambia el formato del id.
function messageIdGt(a: string, b: string): boolean {
  const num = (id: string): number | null => {
    const m = id.match(/^msg_([0-9a-f]+)/)
    if (!m) return null
    const n = parseInt(m[1].slice(0, 13), 16)
    return Number.isFinite(n) ? n : null
  }
  const na = num(a)
  const nb = num(b)
  if (na !== null && nb !== null) return na > nb
  return a > b
}

function agentColorIndex(agentName: string | undefined, agents: AgentOption[]): number {
  if (!agentName) return 0
  const idx = agents.findIndex((a) => a.name === agentName || a.id === agentName)
  return idx >= 0 ? idx % 7 : 0
}

function calcDuration(msg: RenderedMessage, prevUserTs: number | undefined): string {
  if (!msg.info.time.completed) return ""
  const finish = msg.info.finish
  if (!finish || finish === "tool-calls" || finish === "unknown") return ""
  const start = prevUserTs ?? msg.info.time.created
  const dur = msg.info.time.completed - start
  if (dur < 0) return ""
  if (dur < 1000) return `${dur}ms`
  if (dur < 60000) return `${(dur / 1000).toFixed(1)}s`
  if (dur < 3600000) return `${Math.floor(dur / 60000)}m ${Math.floor((dur % 60000) / 1000)}s`
  const hours = Math.floor(dur / 3600000)
  const minutes = Math.floor((dur % 3600000) / 60000)
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

export const MessageBubble = memo(function MessageBubble({ message, revert, onRevertToMessage, onEditMessage, agents, prevUserTs, showModelInfo, activeVariant, config, directory, onViewSubagents, onContextMenu, showTodoButton, onToggleTodos, todosOpen, highlight, compactTools, thinkingDefault = "auto", onRegenerate }: {
  message: RenderedMessage
  revert?: SessionView["revert"]
  onRevertToMessage?: (messageID: string) => void
  onEditMessage?: (messageID: string, text: string) => void
  agents?: AgentOption[]
  prevUserTs?: number
  showModelInfo?: boolean
  activeVariant?: string
  config?: ServerConfig
  directory?: string
  onViewSubagents?: (subagentID?: string) => void
  onContextMenu?: (x: number, y: number, messageID: string) => void
  showTodoButton?: boolean
  onToggleTodos?: () => void
  todosOpen?: boolean
  highlight?: string
  compactTools?: boolean
  thinkingDefault?: "auto" | "expanded" | "collapsed"
  onRegenerate?: () => void
}) {
  const t = useT()
  const [showConfirm, setShowConfirm] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const moreWrapRef = useRef<HTMLSpanElement | null>(null)
  useOutsideClick(moreWrapRef, () => setMoreOpen(false), moreOpen)

  // Los IDs del server son msg_<hexTimestamp+counter> (monotónicos): la
  // comparación lexicográfica es equivalente a la de orden temporal.
  const isReverted = revert ? messageIdGt(message.info.id, revert.messageID) : false
  const isRevertPoint = revert && message.info.id === revert.messageID

  const isAssistant = message.info.role === "assistant"

  const agentIdx = useMemo(
    () => agentColorIndex(message.info.agent ?? message.info.providerID, agents ?? []),
    [message.info.agent, message.info.providerID, agents],
  )

  const duration = useMemo(
    () => calcDuration(message, prevUserTs),
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

  const handleCopyText = useCallback(async () => {
    const text = message.text
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setMoreOpen(false)
  }, [message.text])

  const handleRegenerate = useCallback(() => {
    setMoreOpen(false)
    onRegenerate?.()
  }, [onRegenerate])

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
        className={`message ${message.info.role} fade-in${(isReverted || isRevertPoint) ? " revert-hidden" : ""}${isUserClickable ? " clickable" : ""}${showConfirm ? " confirming-undo" : ""}`}
        data-message-id={message.info.id}
        data-mode={message.turnMode || undefined}
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
        onTouchMove={() => {
          // Cualquier movimiento = scroll/gesto: cancela el long-press
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
            <div className="header-actions">
              <small>{formatTime(message.info.time.created)}</small>
              {onEditMessage && (
                <button className="btn-icon btn-ghost edit-msg-btn" onClick={(e) => { e.stopPropagation(); onEditMessage(message.info.id, message.text) }} title="Edit message" aria-label="Edit message">
                  <PencilIcon size={14} />
                </button>
              )}
            </div>
          </header>
        )}

        {message.text && !showConfirm && (
          <div className="message-content">
            {/* Durante el streaming el texto cambia en cada delta: parsear
                markdown por delta es O(n²) en mensajes largos. Pre-wrap plano
                mientras streamea (y supera el umbral) — el markdown se parsea
                UNA vez cuando el turno se completa. */}
            {!message.info.time.completed && message.text.length > 2000 ? (
              <pre className="md-plain-stream">{message.text}</pre>
            ) : (
              <Markdown text={message.text} highlight={highlight} />
            )}
          </div>
        )}

        {message.parts.filter((p) => p.type === "image" && p.data).map((p) => (
          <img key={p.id} src={p.data} alt="" className="message-image" loading="lazy"
            onClick={() => setLightboxSrc(p.data ?? null)} />
        ))}

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
          <div className="thinking-block">
            <ThinkingBlock
              key={thinkingDefault}
              parts={message.thinkingParts}
              duration={duration}
              defaultOpen={thinkingDefault === "expanded" || (thinkingDefault === "auto" && message.thinkingParts.some((p) => !p.time?.end))}
            />
          </div>
        )}
        {message.toolParts.length > 0 && !showConfirm && (
          <div className="tool-parts">
            {message.toolParts.map((tp) => (
              <ToolPart
                key={tp.id}
                part={tp}
                config={config}
                directory={directory}
                onViewSubagents={onViewSubagents}
                compact={compactTools || message.dataMode === "ultra" || message.dataMode === "miser"}
              />
            ))}
          </div>
        )}

        {message.summaryDiffs && message.summaryDiffs.length > 0 && !showConfirm && (
          <FileDiffs diffs={message.summaryDiffs} />
        )}

        {isAssistant && showModelInfo && ((message.turnMode || message.info.mode) || message.info.modelID || activeVariant || duration || message.info.finish === "aborted") && (
          <div className="message-footer">
            <span className="msg-agent-dot" style={{ color: `var(--agent-${agentIdx})` }}>▣</span>
            {(message.turnMode || message.info.mode) && (
              <span className="msg-footer-mode">{message.turnMode || message.info.mode}</span>
            )}
            {message.info.modelID && <span className="msg-footer-model"> · {message.info.modelID}</span>}
            {activeVariant && <span className="msg-footer-variant"> · {activeVariant}</span>}
            {duration && <span className="msg-footer-duration"> · {duration}</span>}
            {message.info.finish === "aborted" && (
              <span className="msg-footer-interrupted"> · interrupted</span>
            )}
            <span className="msg-footer-spacer" />
            <span className="msg-more-wrap" ref={moreWrapRef}>
              <button type="button" className="btn-icon btn-ghost msg-more-btn"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-label={t('chat.moreActions')}
                title={t('chat.moreActions')}>
                <MenuDotsIcon size={13} />
              </button>
              {moreOpen && (
                <div className="msg-more-dropdown fade-in">
                  <button type="button" className="overflow-item" onClick={handleCopyText} disabled={!message.text}>
                    <span>📋</span> {t('chat.copyText')}
                  </button>
                  {onRegenerate && (
                    <button type="button" className="overflow-item" onClick={handleRegenerate}>
                      <span>↻</span> {t('chat.regenerate')}
                    </button>
                  )}
                </div>
              )}
            </span>
          </div>
        )}

        {showTodoButton && onToggleTodos && (
          <div className="msg-tasks-row">
            <button
              className={`btn-icon msg-tasks-btn${todosOpen ? " active" : ""}`}
              onClick={(e) => { e.stopPropagation(); onToggleTodos() }}
              aria-pressed={!!todosOpen}
              title="Tareas del agente">
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M2 3h8M2 6h8M2 9h5" />
              </svg>
            </button>
          </div>
        )}

        {message.hasCompaction && <div className="compaction-checkpoint" />}
      </article>

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  )
})

export default MessageBubble
