import { memo, useRef, useEffect, useState, Fragment, useMemo } from "react"
import { ChatIcon, ScrollDownIcon, CompressIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { RenderedMessage, SessionView, AgentOption, ServerConfig } from "../types"
import { MessageBubble } from "./MessageBubble"
import { GridSpinner } from "./GridSpinner"

type MessageListProps = {
  messages: RenderedMessage[]
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
  onViewSubagents?: () => void
  onContextMenu?: (x: number, y: number, messageID: string) => void
  onEditMessage?: (messageID: string, text: string) => void
  showTodoButton?: boolean
  onToggleTodos?: () => void
  todosOpen?: boolean
  highlight?: string
  scrollToMessageID?: string | null
  activeVariant?: string
  compactTools?: boolean
  onRegenerate?: () => void
}

export const MessageList = memo(function MessageList({
  messages, loadingSessionID, selectedID, showTypingBubble, compacting, isWorking, messageScrollSignature, view,
  revert, onRevertToMessage, agents, config, directory, onViewSubagents, onContextMenu, onEditMessage, showTodoButton, onToggleTodos, todosOpen, highlight, scrollToMessageID, activeVariant, compactTools, onRegenerate
}: MessageListProps) {
  const t = useT()
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // El footer (modo · modelo · nivel de pensamiento · duración) se muestra solo
  // en el último mensaje assistant, o en un mensaje donde el modelo/plan cambió
  // respecto al anterior (misma regla visual que el TUI).
  const footerInfoMap = useMemo(() => {
    const map = new Map<string, boolean>()
    let lastAssistantId: string | null = null
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.info.role === "assistant") { lastAssistantId = m.info.id; break }
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

  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.info.role === "assistant") return m.info.id
    }
    return null
  }, [messages])

  const prevUserTsMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const msg of messages) {
      if (msg.info.role === "user") map.set(msg.info.id, msg.info.time.created)
    }
    return map
  }, [messages])

  useEffect(() => {
    const el = messagesEndRef.current
    const root = messagesRef.current
    if (!el || !root) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsAtBottom(entry.isIntersecting),
      { root, threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [messages.length, loadingSessionID, selectedID])

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    setIsAtBottom(true)
    requestAnimationFrame(() => {
      const container = messagesRef.current
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior })
      }
    })
  }

  useEffect(() => {
    if (view !== "detail") return
    setIsAtBottom(true)
    scrollToBottom("auto")
  }, [view])

  useEffect(() => {
    if (view !== "detail") return
    if (loadingSessionID === selectedID) return
    if (messages.length > 0) scrollToBottom("auto")
  }, [view, loadingSessionID, selectedID, messages.length])

  // Navegación del buscador: centra el mensaje con la coincidencia actual.
  useEffect(() => {
    if (!scrollToMessageID || view !== "detail") return
    const el = messagesRef.current?.querySelector(`[data-message-id="${scrollToMessageID}"]`)
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" })
    }
  }, [scrollToMessageID, view])

  useEffect(() => {
    if (view !== "detail") return
    if (isAtBottom) {
      scrollToBottom("auto")
    }
  }, [messageScrollSignature, isWorking, showTypingBubble])

  return (
    <div className="message-list-root">
      <div className="messages" ref={messagesRef}>
        {loadingSessionID === selectedID ? (
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
            {messages.map((message) => (
              <Fragment key={message.info.id}>
                <MessageBubble
                  message={message}
                  revert={revert}
                  onRevertToMessage={onRevertToMessage}
                  agents={agents}
                  prevUserTs={message.info.parentID ? prevUserTsMap.get(message.info.parentID) : undefined}
                  showModelInfo={footerInfoMap.get(message.info.id) ?? false}
                  activeVariant={message.info.id === lastAssistantId ? activeVariant : undefined}
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
                  onRegenerate={onRegenerate}
                />
              </Fragment>
            ))}
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
                <div className="typing-dots" aria-hidden="true">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </article>
            )}
            <div ref={messagesEndRef} className="messages-end" aria-hidden="true" />
          </>
        )}
      </div>
      {!isAtBottom && messages.length > 0 && (
        <button className="scroll-to-bottom" onClick={() => scrollToBottom("smooth")}
          aria-label="Scroll to bottom" title="Scroll to bottom">
          <ScrollDownIcon size={16} />
        </button>
      )}
    </div>
  )
})
