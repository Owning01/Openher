import { memo, useRef, useEffect, useLayoutEffect, useState, useMemo, useCallback } from "react"
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
  // Salto desde el historial de prompts (igual que MessageList): id + nonce.
  revealMessageID?: string | null
  revealNonce?: number
  // Cola visible: acciones por id de mensaje pendiente.
  outboxActions?: Record<string, { onDelete: () => void; onEdit: () => void; onSendNow: () => void }>
  compactTools?: boolean
  minimalistMode?: boolean
  thinkingDefault?: "auto" | "expanded" | "collapsed"
  onRegenerate?: () => void
  onOpenADEDiff?: (diffs: FileDiff[], file?: string) => void
  hasMoreMessages?: boolean
  isLoadingMore?: boolean
  onLoadMoreMessages?: () => void
  // virtualizer tuning
  overscan?: number
  estimatedRowHeight?: number
}

const DEFAULT_ESTIMATE = 180
const DEFAULT_OVERSCAN = 2

export const MessageVirtualList = memo(function MessageVirtualList({
  messages, pendingIndex, loadingSessionID, selectedID, showTypingBubble, compacting, isWorking, messageScrollSignature, view,
  revert, onRevertToMessage, agents, config, directory, onViewSubagents, onContextMenu, onEditMessage, showTodoButton, onToggleTodos, todosOpen, highlight, scrollToMessageID, revealMessageID, revealNonce, outboxActions, compactTools, minimalistMode, thinkingDefault, onRegenerate, onOpenADEDiff,
  hasMoreMessages, isLoadingMore, onLoadMoreMessages,
  overscan = DEFAULT_OVERSCAN,
  estimatedRowHeight = DEFAULT_ESTIMATE,
}: MessageVirtualListProps) {
  const t = useT()
  const parentRef = useRef<HTMLDivElement | null>(null)
  const { isAtBottom, setIsAtBottom, isNearBottom, programmaticUntilRef } = useFollowTail(parentRef, { threshold: 120 })
  const atBottomRef = useRef(true)
  useEffect(() => { atBottomRef.current = isAtBottom }, [isAtBottom])

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

  // Ir al final de forma determinista (virtualizer-aware).
  const scrollToEnd = useCallback((behavior: ScrollBehavior = "auto") => {
    if (messages.length === 0) return
    setIsAtBottom(true)
    atBottomRef.current = true
    // Ledger anti-parpadeo (igual que scrollToBottom clásico): los scroll
    // intermedios del settling no voltean isAtBottom a false.
    programmaticUntilRef.current = Date.now() + 150
    const el = parentRef.current
    if (el) {
      if (behavior === "auto") {
        el.scrollTop = el.scrollHeight || 99999999
      }
      el.scrollTo({ top: el.scrollHeight || 99999999, behavior })
    }
    rowVirtualizer.scrollToIndex(messages.length - 1, { align: "end", behavior })
  }, [messages.length, rowVirtualizer, setIsAtBottom, programmaticUntilRef])

  // Entrada a sesión: useMessages fusiona sin limpiar al cambiar de chat, así
  // que el primer render tras el switch trae mensajes STALE de la sesión
  // anterior. Solo se ancla con mensajes FRESCOS (sessionID === selectedID) y
  // por identidad (first/last id), no por longitud: un swap con igual longitud
  // nunca re-disparaba el efecto y el scroll quedaba a mitad (o el follow-tail
  // lo arrastraba abajo con animación visible, o nunca llegaba).
  const firstID = messages.length > 0 ? messages[0]!.info.id : ""
  const lastID = messages.length > 0 ? messages[messages.length - 1]!.info.id : ""
  const msgsSessionID: string | null = messages.length > 0 ? messages[0]!.info.sessionID : null
  const isFresh = messages.length === 0 || msgsSessionID === selectedID
  const needsAnchorRef = useRef(true)
  const [revealed, setRevealed] = useState(false)

  useLayoutEffect(() => {
    if (view !== "detail" || !selectedID || messages.length === 0) return
    if (!isFresh || !needsAnchorRef.current) return
    needsAnchorRef.current = false
    atBottomRef.current = true

    // Anclar el scroll del DOM inmediatamente de forma síncrona
    const el = parentRef.current
    if (el) {
      el.scrollTop = el.scrollHeight || 99999999
    }
    scrollToEnd("auto")
    // Re-afirmar tras la medición real de filas (el primer ancla usa alturas
    // estimadas; al medir, el total crece y el scroll absoluto queda a mitad)
    // e imágenes/bloques que expanden tarde. Solo mientras el usuario no toque.
    let n = 0
    let raf = 0
    const tick = () => {
      if (n++ >= 2 || !atBottomRef.current) return
      scrollToEnd("auto")
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [view, selectedID, firstID, lastID, isFresh, scrollToEnd])

  // Velo anti-parpadeo: el primer paint va oculto (este pasivo corre tras
  // pintar) y se revela en el frame siguiente ya anclado. Ni el stale ni el
  // layout estimado se ven un solo frame.

  useEffect(() => {
    if (revealed || view !== "detail" || !selectedID) return
    if (!isFresh) return
    const raf = requestAnimationFrame(() => setRevealed(true))
    return () => cancelAnimationFrame(raf)
  }, [revealed, view, selectedID, isFresh, firstID, lastID])

  // followTail durante streaming: si estamos al fondo, anclar al último
  // mensaje (scrollToIndex, no scrollHeight estimado). Tolerancia 80px como
  // el MessageList clásico: con 400px era imposible escapar del fondo (cada
  // scroll hacia arriba dentro de la zona te arrastraba de vuelta).
  useEffect(() => {
    if (view !== "detail") return
    // La entrada la gobierna el ancla fresca (stale = quieto).
    if (needsAnchorRef.current) return
    if (isAtBottom) {
      scrollToEnd("auto")
    } else if (messages.length > 0 && messageScrollSignature) {
      if (isNearBottom(80)) {
        scrollToEnd("auto")
      }
    }
  }, [messageScrollSignature, isWorking, showTypingBubble, view, isAtBottom, isNearBottom, scrollToEnd, messages.length])

  // Búsqueda: centrar coincidencia
  useEffect(() => {
    if (!scrollToMessageID || view !== "detail") return
    // Si virtualizado, scrollToIndex es fiable aunque el nodo no esté en DOM
    scrollToMessage(scrollToMessageID)
  }, [scrollToMessageID, view, scrollToMessage])

  // Salto del historial: scrollToIndex + destello (el nodo puede montarse un
  // frame después del scroll, se reintenta una vez).
  const flashedRevealRef = useRef(0)
  useEffect(() => {
    if (!revealMessageID || !revealNonce || flashedRevealRef.current === revealNonce) return
    scrollToMessage(revealMessageID)
    const t = window.setTimeout(() => {
      const wrap = parentRef.current
      if (!wrap) return
      let sel = `[data-message-id="${revealMessageID}"]`
      try {
        sel = `[data-message-id="${CSS.escape(revealMessageID)}"]`
      } catch {
        /* ids generados: el fallback plano vale */
      }
      const el = wrap.querySelector(sel)
      if (!el) return
      flashedRevealRef.current = revealNonce
      el.scrollIntoView({ block: "center", behavior: "smooth" })
      el.classList.remove("msg-flash")
      void (el as HTMLElement).offsetWidth
      el.classList.add("msg-flash")
      window.setTimeout(() => el.classList.remove("msg-flash"), 1800)
    }, 160)
    return () => window.clearTimeout(t)
  })

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
            {hasMoreMessages && (
              <div className="load-previous-wrap">
                <button
                  type="button"
                  className="load-previous-messages-btn"
                  onClick={onLoadMoreMessages}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Cargando mensajes anteriores..." : "↑ Cargar mensajes anteriores"}
                </button>
              </div>
            )}
            {/* Contenedor virtual con bottom alignment */}
            <div
              style={{
                height: `${totalSize + paddingTop}px`,
                width: "100%",
                position: "relative",
                opacity: revealed ? 1 : 0,
                transition: revealed ? "opacity 0.08s ease-out" : "none",
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
                      data-message-id={message.info.id}
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
                        outbox={outboxActions?.[message.info.id]}
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
