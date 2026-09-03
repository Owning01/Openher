import { memo, useCallback, useState, useMemo, useRef, useEffect } from "react"
import { UndoIcon, MenuDotsIcon, CopyIcon, RefreshIcon, PencilIcon, CompressIcon } from "../Icons"
import { formatTime, isImagePart } from "../utils"
import { getTranslationOriginal } from "../hooks/useMessages"
import type { RenderedMessage, SessionView, AgentOption, ServerConfig, FileDiff } from "../types"
import { useT } from "../i18n-context"
import { useOutsideClick } from "../hooks/useOutsideClick"
import ToolPart from "./ToolPart"
import { FileDiffs } from "./FileDiffs"
import { ThinkingBlock } from "./ThinkingBlock"
import { CollapsibleSection } from "./CollapsibleSection"
import { Markdown } from "./Markdown"
import { ImageLightbox } from "./ImageLightbox"
import { ToolIcon, LoadingIcon } from "../Icons"

/** Etiqueta corta para un tool (igual criterio que ToolPart.shortToolLabel). */
function toolShortLabel(tool?: string): string {
  if (!tool) return ""
  const m = tool.match(/mcp__([^_]+)__(.+)/)
  if (m) return `mcp · ${m[1]} · ${m[2]}`
  return tool
}

/** Extrae el comando + args de un tool part (para el título en vivo). */
function toolRunningLabel(state?: { input?: unknown; tool?: string }): string {
  const inp = state?.input
  if (inp && typeof inp === "object" && "command" in inp) {
    const cmd = (inp as { command?: string }).command
    const args = Array.isArray((inp as { args?: unknown[] }).args)
      ? ((inp as { args?: unknown[] }).args as unknown[]).map(String).join(" ")
      : ""
    const full = args && cmd ? `${cmd} ${args}` : String(cmd ?? "")
    if (full.trim()) return full.trim().slice(0, 60)
  }
  return toolShortLabel(state?.tool)
}

/** Extract base64 image data from a message part (handles both type:image and type:file). */
function getPartImageData(p: { type: string; data?: string; url?: string; mimeType?: string; mime?: string }): string | null {
  if (p.type === "image" && p.data) return p.data
  if (p.type === "file") {
    const mime = p.mime || p.mimeType || ""
    if (!isImagePart({ type: p.type, mimeType: mime })) return null
    if (p.data) return p.data
    if (p.url) {
      if (p.url.startsWith("data:")) return p.url
      return null
    }
  }
  return null
}

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

function calcTokensPerSecond(msg: RenderedMessage): string {
  if (!msg.info.time.completed || !msg.info.time.created) return ""
  const tokens = msg.tokens ?? msg.info.tokens
  let outputTokens = (tokens?.output ?? 0) + (tokens?.reasoning ?? 0)
  if (outputTokens <= 0 && msg.text) {
    outputTokens = Math.round(msg.text.length / 4)
  }
  if (outputTokens <= 0) return ""

  // Duración real de la generación del mensaje del asistente (en ms)
  const genDurationMs = msg.info.time.completed - msg.info.time.created
  if (genDurationMs < 500) return ""

  const tps = (outputTokens / genDurationMs) * 1000
  if (tps < 1 || tps > 300) return ""
  return `${tps.toFixed(1)} tok/s`
}

const TranslationOriginal = memo(function TranslationOriginal({ messageId }: { messageId: string }) {
  const [show, setShow] = useState(false)
  const original = getTranslationOriginal(messageId)
  if (!original) return null
  return (
    <div className="translation-original">
      <button type="button" className="translation-toggle" onClick={() => setShow((v) => !v)}>
        {show ? "hide original" : "ver original"}
      </button>
      {show && (
        <div className="translation-original-text">
          <Markdown text={original} />
        </div>
      )}
    </div>
  )
})

export const MessageBubble = memo(function MessageBubble({ message, queued, revert, isReverted: isRevertedProp, onRevertToMessage, onEditMessage, agents: _agents, prevUserTs, showModelInfo, config, directory, onViewSubagents, onContextMenu, showTodoButton: _showTodoButton, onToggleTodos: _onToggleTodos, todosOpen: _todosOpen,   highlight, compactTools, minimalistMode = false, thinkingDefault = "auto", onRegenerate, onOpenADEDiff }: {
  message: RenderedMessage
  queued?: boolean
  revert?: SessionView["revert"]
  isReverted?: boolean
  onRevertToMessage?: (messageID: string) => void
  onEditMessage?: (messageID: string, text: string) => void
  agents?: AgentOption[]
  prevUserTs?: number
  showModelInfo?: boolean
  config?: ServerConfig
  directory?: string
  onViewSubagents?: (subagentID?: string) => void
  onContextMenu?: (x: number, y: number, messageID: string) => void
  showTodoButton?: boolean
  onToggleTodos?: () => void
  todosOpen?: boolean
  highlight?: string
  compactTools?: boolean
  minimalistMode?: boolean
  thinkingDefault?: "auto" | "expanded" | "collapsed"
  onRegenerate?: () => void
  onOpenADEDiff?: (diffs: FileDiff[], file?: string) => void
}) {
  const t = useT()
  const [showConfirm, setShowConfirm] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const moreWrapRef = useRef<HTMLSpanElement | null>(null)
  useOutsideClick(moreWrapRef, () => setMoreOpen(false), moreOpen)

  // Mensaje revertido: calculado por posición ordinal o fallback por ID
  const isReverted = isRevertedProp ?? (revert ? messageIdGt(message.info.id, revert.messageID) : false)
  const isRevertPoint = revert && message.info.id === revert.messageID

  // Mensaje de compactación: el server lo emite con role "compaction" (v2
  // nativo). Para estilos/layout se trata como assistant + modificador
  // "compaction": sin esto caía en `.message.compaction` sin CSS y el resumen
  // se veía como tarjeta plana sin estilo.
  const isCompaction = message.hasCompaction || (message.info as unknown as { role?: string }).role === "compaction"
  const isAssistant = message.info.role === "assistant" || isCompaction
  const [compactionOpen, setCompactionOpen] = useState(true)

  const duration = useMemo(
    () => calcDuration(message, prevUserTs),
    [message, prevUserTs],
  )

  const tokensPerSecond = useMemo(
    () => calcTokensPerSecond(message),
    [message],
  )

  // Turno en curso (el agente sigue generando) vs terminado.
  const isWorkingTurn = !message.info.time.completed && !message.info.finish
  // El box de actividad se abre solo mientras trabaja y se colapsa al terminar.
  const [activityOpen, setActivityOpen] = useState(isWorkingTurn)
  useEffect(() => { if (!isWorkingTurn) setActivityOpen(false) }, [isWorkingTurn])

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

  return (
    <>
      {isRevertPoint && (
        <div className="revert-separator">
          <UndoIcon size={12} />
          <span>{t('detail.reverted')}</span>
        </div>
      )}
      <article
        className={`message ${isCompaction ? "assistant compaction" : message.info.role} fade-in${isReverted ? " revert-hidden" : ""}${showConfirm ? " confirming-undo" : ""}`}
        data-message-id={message.info.id}
        data-mode={message.turnMode || undefined}
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
            <span className="message-title-group">
              {queued && (
                <span className="msg-queued-badge" data-queued>{t('session.queued')}</span>
              )}
            </span>
            <div className="header-actions">
              <small>{formatTime(message.info.time.created)}</small>
              {onEditMessage && (
                <button type="button" className="btn-icon btn-ghost edit-msg-btn" onClick={(e) => { e.stopPropagation(); onEditMessage(message.info.id, message.text) }} title="Edit message" aria-label="Edit message">
                  <PencilIcon size={14} />
                </button>
              )}
              {onRevertToMessage && (
                <button
                  type="button"
                  className="btn-icon btn-ghost revert-msg-btn"
                  onClick={(e) => { e.stopPropagation(); setShowConfirm((v) => !v) }}
                  title={t('detail.revertToHere')}
                  aria-label={t('detail.revertToHere')}
                >
                  <UndoIcon size={13} />
                </button>
              )}
            </div>
          </header>
        )}

        {(() => {
          const hasThinking = !!message.thinkingParts && message.thinkingParts.length > 0
          const hasTools = message.toolParts.length > 0
          const hasDiffs = !!message.summaryDiffs && message.summaryDiffs.length > 0
          // Compact puro (solo resumen, sin thinking/tools/diffs): no ocupa el
          // activity-box; el resumen vive en su propia tarjeta estilada abajo.
          if (isCompaction && !hasThinking && !hasTools && !hasDiffs) return null
          const hasActivity = hasThinking || hasTools || hasDiffs || message.hasCompaction
          if (!hasActivity) return null

          const thinkingEl = hasThinking ? (
            <div className="thinking-block">
              <ThinkingBlock
                key={thinkingDefault}
                parts={message.thinkingParts}
                duration={duration}
                defaultOpen={thinkingDefault === "expanded" || (thinkingDefault === "auto" && message.thinkingParts.some((p) => !p.time?.end))}
              />
            </div>
          ) : null

          const toolsEl = hasTools ? (
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
          ) : null

          const diffsEl = hasDiffs ? (
            <FileDiffs diffs={message.summaryDiffs!} onOpenADEDiff={onOpenADEDiff} />
          ) : null

          // Modo minimalista: el box agrupa thinking + tools + diffs SOLO
          // cuando hay thinking. Si solo hay tools (sin thinking), se
          // renderizan inline como en el modo normal — evita la repetición
          // de una caja "tool" en cada mensaje.
          if (minimalistMode && hasThinking) {
            const thinkingStreaming = message.thinkingParts.some((p) => !p.time?.end)
            const toolRunning = hasTools && message.toolParts.some((tp) => !tp.state?.status || tp.state?.status === "running" || tp.state?.status === "pending")
            const isStreaming = thinkingStreaming || toolRunning

            // --- Título en vivo mientras el agente trabaja (acción actual) ---
            let liveTitle: string
            if (thinkingStreaming) {
              liveTitle = t('detail.thinking')
            } else if (toolRunning) {
              const running = message.toolParts.find((tp) => !tp.state?.status || tp.state?.status === "running" || tp.state?.status === "pending")
              liveTitle = running ? toolRunningLabel(running.state ?? { tool: running.tool }) : t('detail.thinking')
            } else {
              liveTitle = t('detail.thinking')
            }

            // --- Título tenue para el turno completado ---
            // Nombres reales de los tools (bash, edit, read, etc.).
            const toolNames = message.toolParts
              .map((tp) => toolShortLabel(tp.tool))
              .filter(Boolean)
            const toolSummary = toolNames.length <= 2
              ? toolNames.join(" · ")
              : `${toolNames.slice(0, 2).join(" · ")} +${toolNames.length - 2}`
            const completedParts: string[] = []
            if (hasTools && toolSummary) completedParts.push(toolSummary)
            if (message.hasCompaction) completedParts.push(t('detail.activityCompaction'))
            const completedTitle = completedParts.join(" · ") || t('detail.thought')

            const title = isWorkingTurn ? liveTitle : completedTitle
            const subtitle = isWorkingTurn
              ? <span className="thinking-streaming"><LoadingIcon size={12} className="animate-spin" />{isStreaming ? (thinkingStreaming ? t('detail.thinking') : t('detail.working')) : t('detail.working')}</span>
              : null

            return (
              <div className={`activity-box activity-box-${isWorkingTurn ? "working" : "completed"}`}>
                <CollapsibleSection
                  icon={isWorkingTurn ? <ToolIcon size={14} /> : undefined}
                  title={title}
                  subtitle={subtitle}
                  open={activityOpen}
                  onToggle={() => setActivityOpen((v) => !v)}
                >
                  {thinkingEl}
                  {toolsEl}
                  {diffsEl}
                  {message.hasCompaction && <div className="compaction-checkpoint" />}
                </CollapsibleSection>
              </div>
            )
          }

          return (
            <>
              {thinkingEl}
              {toolsEl}
              {diffsEl}
            </>
          )
        })()
        }

        {isCompaction && message.text ? (
          <div className="compaction-card">
            <button
              type="button"
              className="compaction-toggle"
              onClick={() => setCompactionOpen((v) => !v)}
              aria-expanded={compactionOpen}
            >
              <CompressIcon size={14} />
              <span className="compaction-title">{t('detail.activityCompaction') || "Resumen de contexto"}</span>
              <span className="compaction-chevron" aria-hidden="true">{compactionOpen ? "▾" : "▸"}</span>
              <small className="compaction-hint">{formatTime(message.info.time.created)}</small>
            </button>
            {compactionOpen && (
              <div className="message-content compaction-body">
                <Markdown text={message.text} highlight={highlight} />
              </div>
            )}
            <div className="compaction-checkpoint" />
          </div>
        ) : message.text && (
          <div className="message-content">
            {!message.info.time.completed && message.text.length > 800 ? (
              <pre className="md-plain-stream">{message.text}</pre>
            ) : (
              <Markdown text={message.text} highlight={highlight} />
            )}
          </div>
        )}

        {message.info.error && (
          <div className="message-error" role="alert">
            <strong>{message.info.error.name || "Server error"}</strong>
            {message.info.error.message && <span>{message.info.error.message}</span>}
          </div>
        )}

        <TranslationOriginal messageId={message.info.id} />

        {message.parts.filter((p) => !!getPartImageData(p)).map((p) => {
          const src = getPartImageData(p)
          if (!src) return null
          return (
            <div key={p.id} className="message-image-wrap">
              <img src={src} alt="" className="message-image" loading="lazy"
                onClick={() => setLightboxSrc(src)} />
            </div>
          )
        })}

        {showConfirm && (
          <div className="undo-confirm">
            <span className="undo-confirm-text">{t('detail.revertToHere')}?</span>
            <div className="undo-confirm-actions">
              <button type="button" className="undo-confirm-yes" onClick={handleConfirmUndo}>{t('session.undo')}</button>
              <button type="button" className="undo-confirm-no" onClick={handleCancelUndo}>{t('session.cancel')}</button>
            </div>
          </div>
        )}

        {isAssistant && showModelInfo && ((message.turnMode || message.info.mode) || message.info.modelID || duration || tokensPerSecond || message.info.finish === "aborted") && (
          <div className="message-footer">
            {(message.turnMode || message.info.mode) && (
              <span className="msg-footer-mode">{message.turnMode || message.info.mode}</span>
            )}
            {message.info.modelID && <span className="msg-footer-model"> · {message.info.modelID}</span>}
            {duration && <span className="msg-footer-duration"> · {duration}</span>}
            {tokensPerSecond && (
              <span className="msg-footer-tps" title="Velocidad de generación de tokens">
                {" "}· {tokensPerSecond}
              </span>
            )}
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
                    <CopyIcon size={13} /> {t('chat.copyText')}
                  </button>
                  {onRegenerate && (
                    <button type="button" className="overflow-item" onClick={handleRegenerate}>
                      <RefreshIcon size={13} /> {t('chat.regenerate')}
                    </button>
                  )}
                </div>
              )}
            </span>
          </div>
        )}

        {!minimalistMode && message.hasCompaction && !isCompaction && <div className="compaction-checkpoint" />}
      </article>

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  )
})

export default MessageBubble
