import { memo, useRef, useEffect, useState, Fragment, useMemo } from "react"
import { ChatIcon, ScrollDownIcon, CompressIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { RenderedMessage, SessionView, AgentOption, ServerConfig, FileDiff } from "../types"
import { MessageBubble } from "./MessageBubble"
import { GridSpinner } from "./GridSpinner"

type MessageListProps = {
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
}

export const MessageList = memo(function MessageList({
  messages, pendingIndex, loadingSessionID, selectedID, showTypingBubble, compacting, isWorking, messageScrollSignature, view,
  revert, onRevertToMessage, agents, config, directory, onViewSubagents, onContextMenu, onEditMessage, showTodoButton, onToggleTodos, todosOpen,   highlight, scrollToMessageID, compactTools, minimalistMode, thinkingDefault, onRegenerate, onOpenADEDiff
}: MessageListProps) {
  const t = useT()
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // El footer (modo · modelo · nivel de pensamiento · duración) se muestra solo
  // en el último mensaje assistant COMPLETED, o en un mensaje donde el
  // modelo/plan cambió respecto al anterior (misma regla visual que el TUI).
  // FIX: buscar el último COMPLETED (no el último en general) — durante
  // streaming el nuevo assistant incompleto no roba el footer del anterior.
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
    // Doble rAF: asegura que el DOM (y las imágenes/markdown) hayan hecho layout
    // antes de medir scrollHeight. Sin esto, con 500 mensajes el primer scroll
    // usa altura estimada y no llega al final.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = messagesRef.current
        if (container) {
          container.scrollTo({ top: container.scrollHeight, behavior })
        }
      })
    })
  }

  // Scroll al entrar a la sesión (móvil: cambio de vista, desktop: cambio de selectedID)
  // Fuerza scroll incluso si messages.length no cambió entre cache y red.
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

  // Desktop: selectedID cambia sin que view cambie. Fuerza scroll al cambiar de sesión.
  useEffect(() => {
    if (!selectedID) return
    // Pequeño delay para que los mensajes del cache se pinten antes de medir
    const t = setTimeout(() => scrollToBottom("auto"), 80)
    return () => clearTimeout(t)
  }, [selectedID])

  // Navegación del buscador: centra el mensaje con la coincidencia actual.
  useEffect(() => {
    if (!scrollToMessageID || view !== "detail") return
    const el = messagesRef.current?.querySelector(`[data-message-id="${scrollToMessageID}"]`)
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" })
    }
  }, [scrollToMessageID, view])

  // Durante streaming, seguir al final solo si el usuario no scrolleó hacia arriba.
  // Para mensajes ya en memoria (polling), forzar scroll al final en cada firma nueva
  // aunque isAtBottom sea false brevemente por el IntersectionObserver (evita que se quede arriba al entrar).
  useEffect(() => {
    if (view !== "detail") return
    if (isAtBottom) {
      scrollToBottom("auto")
    } else if (messages.length > 0 && messageScrollSignature) {
      // Si el último mensaje es nuevo (id diferente) y estamos cerca del final, forzar
      const container = messagesRef.current
      if (container && container.scrollHeight - container.scrollTop - container.clientHeight < 400) {
        scrollToBottom("auto")
      }
    }
  }, [messageScrollSignature, isWorking, showTypingBubble])

  return (
    <div className="message-list-root">
      <div className="messages" ref={messagesRef}>
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
            {messages.map((message, index) => (
              <Fragment key={message.info.id}>
                <MessageBubble
                  message={message}
                  queued={pendingIndex !== undefined && index > pendingIndex}
                  revert={revert}
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
                <GridSpinner label={t('detail.waiting')} size={20} />
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
