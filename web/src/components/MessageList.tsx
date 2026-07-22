import { memo, useRef, useEffect, useState, Fragment, useMemo } from "react"
import { LoadingIcon, ChatIcon, ScrollDownIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { RenderedMessage, SessionView, AgentOption, ServerConfig } from "../types"
import { Markdown } from "./Markdown"
import { MessageBubble } from "./MessageBubble"

type MessageListProps = {
  messages: RenderedMessage[]
  loadingSessionID: string | null
  selectedID: string | null
  showTypingBubble: boolean
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
}

function reasoningSummary(text: string): { title: string | null; body: string } {
  const content = text.trim()
  const match = content.match(/^\*\*([^*\n]+)\*\*(?:\r?\n\r?\n|$)/)
  if (!match) return { title: null, body: content }
  return { title: match[1].trim(), body: content.slice(match[0].length).trimEnd() }
}

function extractThinkingText(text: string): string {
  return text.replace("[REDACTED]", "").trim()
}

const ThinkingToggle = memo(function ThinkingToggle({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const content = extractThinkingText(text)
  const summary = reasoningSummary(content)

  if (!content) return null

  return (
    <div className="thinking-insert">
      <button className="thinking-insert-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="thinking-insert-icon">{open ? "−" : "+"}</span>
        <span className="thinking-insert-label">{summary.title || "Thought"}</span>
      </button>
      {open && (
        <div className="thinking-insert-body">
          <Markdown text={summary.body || content} />
        </div>
      )}
    </div>
  )
})

export const MessageList = memo(function MessageList({
  messages, loadingSessionID, selectedID, showTypingBubble, isWorking, messageScrollSignature, view,
  revert, onRevertToMessage, agents, config, directory, onViewSubagents, onContextMenu
}: MessageListProps) {
  const t = useT()
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const prevUserTsMap = useMemo(() => {
    const map = new Map<string, number>()
    let last = 0
    for (const msg of messages) {
      if (msg.info.role === "user") last = msg.info.time.created
      else map.set(msg.info.id, last)
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
  }, [messages.length])

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    setIsAtBottom(true)
    requestAnimationFrame(() => {
      const container = messagesRef.current
      const end = messagesEndRef.current
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior })
      }
      end?.scrollIntoView({ block: "end", behavior })
    })
  }

  useEffect(() => {
    if (view !== "detail") return
    setIsAtBottom(true)
    scrollToBottom("auto")
  }, [view])

  useEffect(() => {
    if (view !== "detail") return
    if (messages.length > 0) scrollToBottom("auto")
  }, [messages.length])

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
            <LoadingIcon size={32} />
            <p>{t('detail.loading')}</p>
          </div>
        ) : messages.length === 0 && !showTypingBubble ? (
          <div className="empty-state compact">
            <ChatIcon size={40} className="icon-empty-state" />
            <p>{t('detail.emptyTitle')}</p>
            <p className="subtle">{t('detail.emptyHint')}</p>
          </div>
        ) : (
          <>
            {messages.map((message, i) => (
              <Fragment key={message.info.id}>
                {message.info.role === "assistant" && message.thinkingParts.length > 0 && i > 0 && messages[i - 1].info.role === "user" && (
                  <div className="thinking-insert-group">
                    {message.thinkingParts.map((tp) => (
                      <ThinkingToggle key={tp.id} text={tp.text} />
                    ))}
                  </div>
                )}
                <MessageBubble
                  message={message}
                  revert={revert}
                  onRevertToMessage={onRevertToMessage}
                  agents={agents}
                  prevUserTs={prevUserTsMap.get(message.info.id)}
                  config={config}
                  directory={directory}
                  onViewSubagents={onViewSubagents}
                  onContextMenu={onContextMenu}
                />
              </Fragment>
            ))}
            {showTypingBubble && (
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
