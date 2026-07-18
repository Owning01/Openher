import { memo, lazy, Suspense, useRef, useEffect } from "react"
import { LoadingIcon, ChatIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { RenderedMessage } from "../types"

const MessageBubble = lazy(() => import("./MessageBubble"))

type MessageListProps = {
  messages: RenderedMessage[]
  loadingSessionID: string | null
  selectedID: string | null
  showTypingBubble: boolean
  isWorking: boolean
  messageScrollSignature: string
  view: string
}

export const MessageList = memo(function MessageList({
  messages, loadingSessionID, selectedID, showTypingBubble, isWorking, messageScrollSignature, view
}: MessageListProps) {
  const t = useT()
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
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
    scrollToBottom("auto")
  }, [view, messageScrollSignature, isWorking, showTypingBubble])

  return (
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
          {messages.map((message) => (
            <Suspense fallback={null} key={message.info.id}>
              <MessageBubble message={message} />
            </Suspense>
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
  )
})
