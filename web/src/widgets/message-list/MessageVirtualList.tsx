import { memo, useRef, useEffect, useState, useMemo, useCallback } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ChatIcon, ScrollDownIcon, CompressIcon } from "../../Icons"
import { useT } from "../../i18n-context"
import type { RenderedMessage, SessionView, AgentOption, ServerConfig, FileDiff } from "../../types"
import { MessageBubble } from "../../components/MessageBubble"
import { GridSpinner } from "../../components/GridSpinner"
import { useFollowTail } from "../../shared/lib/useFollowTail"

type MessageVirtualListProps = {
  messages: RenderedMessage[]
  pendingIndex?: number
  loadingSessionID: string | null
  selectedID: string | null
  showTypingBubble: boolean
  compacting?: boolean
  isWorking: boolean
  messageScrollSignature: string
  view: string
  revert?: SessionView["revert"]
  onRevertToMessage?: (messageID: string) => void
  agents?: AgentOption[]
  config?: ServerConfig
  directory?: string
  onViewSubagents?: (subagentID?: string) => void
  onContextMenu?: (x: number, y: number, messageID: string) => void
  onEditMessage?: (messageID: string, text: string) => void
  showTodoButton?: boolean
  onToggleTodos?: () => void
  todosOpen?: boolean
  highlight?: string
  scrollToMessageID?: string | null
  compactTools?: boolean
  minimalistMode?: boolean
  thinkingDefault?: "auto" | "expanded" | "collapsed"
  onRegenerate?: () => void
  onOpenADEDiff?: (diffs: FileDiff[], file?: string) => void
  // virtualizer tuning
  overscan?: number
  estimatedRowHeight?: number
}

const DEFAULT_ESTIMATE = 180
const DEFAULT_OVERSCAN = 8

export const MessageVirtualList = memo(function MessageVirtualList({
  messages, pendingIndex, loadingSessionID, selectedID, showTypingBubble, compacting, isWorking, messageScrollSignature, view,
  revert, onRevertToMessage, agents, config, directory, onViewSubagents, onContextMenu, onEditMessage, showTodoButton, onToggleTodos, todosOpen, highlight, scrollToMessageID, compactTools, minimalistMode, thinkingDefault, onRegenerate, onOpenADEDiff,
  overscan = DEFAULT_OVERSCAN,
  estimatedRowHeight = DEFAULT_ESTIMATE,
}: MessageVirtualListProps) {
  const t = useT()
  const parentRef = useRef<HTMLDivElement | null>(null)
  const { isAtBottom, scrollToBottom, isNearBottom } = useFollowTail(parentRef, { threshold: 120 })

  // Viewport height for bottom alignment (when content < viewport)
  const [viewportH, setViewportH] = useState(0)
  useEffect(() => {
    const el = parentRef.current
    if (!el) return
    const update = () => setViewportH(el.clientHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener("resize", update)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [])

  const footerInfoMap = useMemo(() => {
    const map = new Map<string, boolean>()
    let lastAssistantId: string | null = null
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.info.role === "assistant" && m.info.time.completed) { lastAssistantId = m.info.id; break }
    }
    let prev: { modelID?: string; mode?: string; agent?: string } | null = null
    for (const msg of messages) {
      if (msg.info.role !== "assistant") continue
      const changed = prev !== null && (
        prev.modelID !== msg.info.modelID || prev.mode !== msg.info.mode || prev.agent !== msg.info.agent
      )
      map.set(msg.info.id, msg.info.id === lastAssistantId || changed)
      prev = { modelID: msg.info.modelID, mode: msg.info.mode, agent: msg.info.agent }
    }
    return map
  }, [messages])

  const prevUserTsMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const msg of messages) {
      if (msg.info.role === "user") map.set(msg.info.id, msg.info.time.created)
    }
    return map
  }, [messages])

  const revertIndex = useMemo(() => {
    if (!revert?.messageID) return -1
    return messages.findIndex((m) => m.info.id === revert.messageID)
  }, [messages, revert?.messageID])

  // Virtualizer con medición dinámica (ResizeObserver interno via measureElement ref)
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  const paddingTop = viewportH > 0 && totalSize < viewportH ? viewportH - totalSize : 0

  const scrollToMessage = useCallback((id: string) => {
    const idx = messages.findIndex((m) => m.info.id === id)
    if (idx >= 0) {
      rowVirtualizer.scrollToIndex(idx, { align: "center", behavior: "smooth" })
    }
  }, [messages, rowVirtualizer])

  // Scroll al entrar a sesión / cambio de view
  useEffect(() => {
    if (view !== "detail") return
    scrollToBottom("auto")
  }, [view, scrollToBottom])

  useEffect(() => {
    if (view !== "detail") return
    if (loadingSessionID === selectedID) return
    if (messages.length > 0) scrollToBottom("auto")
  }, [view, loadingSessionID, selectedID, messages.length, scrollToBottom])

  useEffect(() => {
    if (!selectedID) return
    const t = setTimeout(() => scrollToBottom("auto"), 80)
    return () => clearTimeout(t)
  }, [selectedID, scrollToBottom])

  // followTail durante streaming: si estamos al fondo, anclar
  useEffect(() => {
    if (view !== "detail") return
    if (isAtBottom) {
      scrollToBottom("auto")
    } else if (messages.length > 0 && messageScrollSignature) {
      if (isNearBottom(400)) {
        scrollToBottom("auto")
      }
    }
  }, [messageScrollSignature, isWorking, showTypingBubble, view, isAtBottom, isNearBottom, scrollToBottom, messages.length])

  // Búsqueda: centrar coincidencia
  useEffect(() => {
    if (!scrollToMessageID || view !== "detail") return
    // Si virtualizado, scrollToIndex es fiable aunque el nodo no esté en DOM
    scrollToMessage(scrollToMessageID)
  }, [scrollToMessageID, view, scrollToMessage])

  // Cuando el viewport es más alto que el contenido, el paddingTop shift debe aplicarse
  // sin aumentar scrollHeight más allá de viewportH (ver cálculo totalSize+paddingTop).

  return (
    <div className="message-list-root">
      <div className="messages" ref={parentRef}>
        {loadingSessionID && loadingSessionID === selectedID ? (
          <div className="empty-state compact">
            <GridSpinner label={t('detail.loading')} />
            <p aria-hidden="true">{t('detail.loading')}</p>
          </div>
        ) : messages.length === 0 && !showTypingBubble ? (
          <div className="empty-state compact">
            <ChatIcon size={40} className="icon-empty-state" />
            <p>{t('detail.emptyTitle')}</p>
            <p className="subtle">{t('detail.emptyHint')}</p>
          </div>
        ) : (
          <>
            {/* Contenedor virtual con bottom alignment */}
            <div
              style={{
                height: `${totalSize + paddingTop}px`,
                width: "100%",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: paddingTop ? `translateY(${paddingTop}px)` : undefined,
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const message = messages[virtualRow.index]
                  if (!message) return null
                  const actualIndex = virtualRow.index
                  return (
                    <div
                      key={message.info.id}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <MessageBubble
                        message={message}
                        queued={pendingIndex !== undefined && actualIndex > pendingIndex}
                        revert={revert}
                        isReverted={revertIndex >= 0 && actualIndex >= revertIndex}
                        onRevertToMessage={onRevertToMessage}
                        agents={agents}
                        prevUserTs={message.info.parentID ? prevUserTsMap.get(message.info.parentID) : undefined}
                        showModelInfo={footerInfoMap.get(message.info.id) ?? false}
                        config={config}
                        directory={directory}
                        onViewSubagents={onViewSubagents}
                        onContextMenu={onContextMenu}
                        onEditMessage={onEditMessage}
                        showTodoButton={showTodoButton}
                        onToggleTodos={onToggleTodos}
                        todosOpen={todosOpen}
                        highlight={highlight}
                        compactTools={compactTools}
                        minimalistMode={minimalistMode}
                        thinkingDefault={thinkingDefault}
                        onRegenerate={onRegenerate}
                        onOpenADEDiff={onOpenADEDiff}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
            {compacting && (
              <article className="message assistant compacting-bubble fade-in" aria-label="Compacting session">
                <div className="compacting-indicator" aria-hidden="true">
                  <CompressIcon size={18} />
                  <span>Compacting session...</span>
                </div>
              </article>
            )}
            {showTypingBubble && !compacting && (
              <article className="message assistant typing-bubble fade-in" aria-label={t('detail.waiting')}>
                <GridSpinner label={t('detail.waiting')} size={20} />
              </article>
            )}
          </>
        )}
      </div>
      {!isAtBottom && messages.length > 0 && (
        <button className="scroll-to-bottom" onClick={() => {
          // Scroll nativo al final (más fiable que virtualizer cuando totalSize < viewport)
          const el = parentRef.current
          if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
          else rowVirtualizer.scrollToIndex(messages.length - 1, { align: "end", behavior: "smooth" })
        }}
          aria-label="Scroll to bottom" title="Scroll to bottom">
          <ScrollDownIcon size={16} />
        </button>
      )}
    </div>
  )
})
