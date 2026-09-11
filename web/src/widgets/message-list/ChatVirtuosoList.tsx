import { memo, useCallback, useEffect, useRef, useState } from "react"
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso"
import { ChatIcon, ScrollDownIcon, CompressIcon } from "../../Icons"
import { useT } from "../../i18n-context"
import type { RenderedMessage, SessionView, AgentOption, ServerConfig, FileDiff } from "../../types"
import { MessageBubble } from "../../components/MessageBubble"
import { GridSpinner } from "../../components/GridSpinner"
import { useMessageMeta } from "./messageMeta"
import { saveChatAnchor, flushChatAnchors, resolveInitialIndex } from "../../shared/lib/chatAnchor"

type ChatVirtuosoListProps = {
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
  onEditMessage?: (messageID: string, text: string) => void
  agents?: AgentOption[]
  config?: ServerConfig
  directory?: string
  onViewSubagents?: (subagentID?: string) => void
  onContextMenu?: (x: number, y: number, messageID: string) => void
  showTodoButton?: boolean
  onToggleTodos?: () => void
  todosOpen?: boolean
  highlight?: string
  scrollToMessageID?: string | null
  revealMessageID?: string | null
  revealNonce?: number
  compactTools?: boolean
  minimalistMode?: boolean
  thinkingDefault?: "auto" | "expanded" | "collapsed"
  onRegenerate?: () => void
  onOpenADEDiff?: (diffs: FileDiff[], file?: string) => void
  outboxActions?: Record<string, { onDelete: () => void; onEdit: () => void; onSendNow: () => void }>
  hasMoreMessages?: boolean
  isLoadingMore?: boolean
  onLoadMoreMessages?: () => void
}

const FIRST_INDEX_BASE = 100000
const SETTLE_QUIET_MS = 450
const SETTLE_MAX_MS = 2000

// Índice base de Virtuoso: solo se mueve al anteponer historial. Si cambiara
// al agregar abajo (streaming), Virtuoso rebasea el mapa y el scroll salta.
export function adjustFirstIndex(
  prevFirst: number,
  prevFirstId: string | undefined,
  messages: Array<{ info: { id: string } }>,
): { first: number; firstId: string | undefined } {
  const cur = messages[0]?.info.id
  if (cur === prevFirstId) return { first: prevFirst, firstId: prevFirstId }
  if (prevFirstId && cur) {
    const keptAt = messages.findIndex((m) => m.info.id === prevFirstId)
    if (keptAt > 0) return { first: prevFirst - keptAt, firstId: cur }
  }
  return { first: FIRST_INDEX_BASE - messages.length, firstId: cur }
}

export const ChatVirtuosoList = memo(function ChatVirtuosoList({
  messages, pendingIndex, loadingSessionID, selectedID, showTypingBubble, compacting,
  isWorking: _isWorking, messageScrollSignature: _sig, view, revert,
  onRevertToMessage, onEditMessage, agents, config, directory, onViewSubagents,
  onContextMenu, showTodoButton, onToggleTodos, todosOpen, highlight,
  scrollToMessageID, revealMessageID, revealNonce, compactTools, minimalistMode,
  thinkingDefault, onRegenerate, onOpenADEDiff, outboxActions,
  hasMoreMessages, isLoadingMore, onLoadMoreMessages,
}: ChatVirtuosoListProps) {
  const t = useT()
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [atBottom, setAtBottom] = useState(true)
  const atBottomRef = useRef(true)
  const [revealed, setRevealed] = useState(false)
  const settledRef = useRef(false)
  const entryAnchorRef = useRef<null | { mode: "bottom" } | { mode: "at"; rel: number }>(null)
  const settleTimerRef = useRef(0)
  const maxTimerRef = useRef(0)
  const maxAttemptsRef = useRef(0)

  // Altura real del contenedor. Con layout colapsado (WebView minimizado,
  // panel oculto, arranque con geometría 0) Virtuoso no puede medir ni
  // anclar: ni se guarda ancla (envenenaría la memoria compartida por sesión
  // desde una instancia invisible) ni se da por asentado.
  const hasHeight = useCallback(() => {
    const el = rootRef.current
    return !!el && el.clientHeight > 0
  }, [])

  const waitForHeight = useCallback((fn: () => void, tries = 120) => {
    if (hasHeight()) {
      fn()
      return
    }
    if (tries <= 0) {
      fn()
      return
    }
    requestAnimationFrame(() => waitForHeight(fn, tries - 1))
  }, [hasHeight])

  const { footerInfoMap, prevUserTsMap, revertIndex } = useMessageMeta(
    messages, revert?.messageID ?? null,
  )

  const [firstState, setFirstState] = useState(() => ({
    first: FIRST_INDEX_BASE - messages.length,
    firstId: messages[0]?.info.id as string | undefined,
  }))
  const adj = adjustFirstIndex(firstState.first, firstState.firstId, messages)
  if (adj.first !== firstState.first || adj.firstId !== firstState.firstId) {
    setFirstState(adj)
  }
  const firstItemIndex = firstState.first
  const toRel = useCallback((abs: number) => abs - firstItemIndex, [firstItemIndex])

  const firstID = messages.length > 0 ? messages[0]!.info.id : ""
  const lastID = messages.length > 0 ? messages[messages.length - 1]!.info.id : ""
  const msgsSessionID: string | null = messages.length > 0 ? messages[0]!.info.sessionID : null
  const isFresh = messages.length === 0 || msgsSessionID === selectedID
  const needsAnchorRef = useRef(true)
  const sawLoadingRef = useRef(false)
  const touchedRef = useRef(false)
  // Clavado al fondo: true desde que NOSOTROS lo llevamos abajo (entrada,
  // restauración) hasta que ÉL scrollea a mano. Mientras siga true, cualquier
  // deriva (medición tardía de imágenes, crecimiento del stream) se re-clava
  // sin importar su tamaño; followOutput solo cubre cambios de datos y el
  // atBottom interno se pierde con derivas de medición. Nunca pelear con la
  // mano: el primer wheel/touch/pointerdown lo apaga.
  const pinningRef = useRef(false)

  const liveRef = useRef({ messages, firstItemIndex })
  liveRef.current = { messages, firstItemIndex }

  // Trazado de scroll para diagnóstico en el .exe (F12 → __scrolldbg.dump()):
  // solo números de scroll, sin texto de mensajes. Ring de 150 eventos.
  type DbgEvt = [t: number, kind: string, st: number, dist: number, extra: string]
  const dbgRef = useRef<DbgEvt[]>([])
  const dbg = useCallback((kind: string, extra = "") => {
    try {
      const sc = rootRef.current?.querySelector("[data-virtuoso-scroller]")
      const st = sc ? Math.round(sc.scrollTop) : -1
      const dist = sc ? Math.round(sc.scrollHeight - sc.scrollTop - sc.clientHeight) : -1
      dbgRef.current.push([Date.now(), kind, st, dist, extra])
      if (dbgRef.current.length > 150) {
        dbgRef.current.splice(0, dbgRef.current.length - 150)
      }
    } catch {
      /* detached */
    }
  }, [])

  useEffect(() => {
    try {
      const w = window as unknown as Record<string, unknown>
      w.__scrolldbg = {
        dump: () => JSON.stringify({ sid: selectedID, log: dbgRef.current }),
        clear: () => {
          dbgRef.current = []
        },
      }
    } catch {
      /* noop */
    }
  }, [selectedID])

  const markSettled = useCallback(() => {
    window.clearTimeout(settleTimerRef.current)
    window.clearTimeout(maxTimerRef.current)
    // Sin layout no hay nada que asentar: re-armar (acotado) en vez de
    // revelar arriba. El arranque minimizado del .exe entraba por acá.
    if (!hasHeight()) {
      if (maxAttemptsRef.current++ < 10) {
        maxTimerRef.current = window.setTimeout(markSettledRef.current, SETTLE_MAX_MS)
      }
      return
    }
    if (!settledRef.current) {
      settledRef.current = true
      dbg("settled")
      setRevealed(true)
    }
  }, [hasHeight, dbg])

  const markSettledRef = useRef(markSettled)
  markSettledRef.current = markSettled

  // Cap duro anti "chat negro": si el asentamiento no llegó por eventos (los
  // re-runs del efecto de entrada cancelan sus timers), revelar por reloj una
  // sola vez por montaje. markSettled respeta layout colapsado (re-arma).
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!settledRef.current) markSettledRef.current()
    }, 1500)
    return () => window.clearTimeout(t)
  }, [])

  // Pin al fondo 100% nativo: scrollToIndex calculaba con alturas estimadas
  // y su resolución asíncrona pisaba el ajuste posterior, quedando ~240px
  // arriba de forma estable. El máximo nativo es exacto y se mantiene
  // (verificado en runtime); Virtuoso sincroniza su estado interno con el
  // evento scroll. Se repite en rAF por si el commit va detrás.
  const pinToEnd = useCallback(() => {
    const { messages: m } = liveRef.current
    if (m.length === 0) return
    dbg("pin")
    const sc = rootRef.current?.querySelector("[data-virtuoso-scroller]")
    if (!sc) return
    try {
      sc.scrollTop = sc.scrollHeight
    } catch {
      /* detached */
    }
    requestAnimationFrame(() => {
      try {
        const el = rootRef.current?.querySelector("[data-virtuoso-scroller]")
        if (el) el.scrollTop = el.scrollHeight
      } catch {
        /* detached */
      }
    })
  }, [dbg])

  const pinToIndex = useCallback((rel: number) => {
    const { firstItemIndex: f } = liveRef.current
    try {
      virtuosoRef.current?.scrollToIndex({ index: f + rel, align: "start", behavior: "auto" })
    } catch {
      /* midiendo */
    }
  }, [])

  const pokeSettle = useCallback(() => {
    if (!hasHeight()) return
    window.clearTimeout(settleTimerRef.current)
    settleTimerRef.current = window.setTimeout(() => {
      settledRef.current = true
      setRevealed(true)
    }, SETTLE_QUIET_MS)
  }, [hasHeight])

  const handleTotalHeight = useCallback(() => {
    if (!hasHeight()) return
    const a = entryAnchorRef.current
    if (!settledRef.current && a) {
      if (a.mode === "bottom") pinToEnd()
      else pinToIndex(a.rel)
      pokeSettle()
      return
    }
    if (pinningRef.current && !touchedRef.current) pinToEnd()
  }, [pinToEnd, pinToIndex, pokeSettle, hasHeight])

  const persistTop = useCallback(
    (startAbs: number) => {
      if (!selectedID || !hasHeight()) return
      // Solo persistir posiciones ya asentadas: durante la entrada/stale el
      // virtualizador reporta rangos transitorios (índice 0 al medir) y
      // guardarlos dejaba la próxima entrada clavada arriba.
      if (!settledRef.current) return
      if (atBottomRef.current) saveChatAnchor(selectedID, { kind: "bottom" })
      else {
        const { messages: m, firstItemIndex: f } = liveRef.current
        const id = m[startAbs - f]?.info.id
        saveChatAnchor(selectedID, id ? { kind: "at", messageId: id } : { kind: "bottom" })
      }
    },
    [selectedID, hasHeight],
  )

  const handleAtBottom = useCallback(
    (bottom: boolean) => {
      if (!hasHeight()) return
      if (bottom !== atBottomRef.current) dbg(bottom ? "atBot:1" : "atBot:0")
      atBottomRef.current = bottom
      setAtBottom(bottom)
      if (!selectedID) return
      // Pre-asentamiento: solo estado, sin memoria (entrada en curso).
      if (!settledRef.current) return
      saveChatAnchor(selectedID, { kind: "bottom" })
      if (!bottom) {
        virtuosoRef.current?.getState((s) => {
          const start = (s as unknown as { startIndex?: number }).startIndex
          if (typeof start === "number") persistTop(start)
        })
      }
    },
    [selectedID, persistTop, hasHeight, dbg],
  )

  useEffect(() => {
    if (!selectedID) return
    const onHide = () => {
      if (atBottomRef.current) saveChatAnchor(selectedID, { kind: "bottom" })
      else {
        virtuosoRef.current?.getState((s) => {
          const start = (s as unknown as { startIndex?: number }).startIndex
          if (typeof start === "number") persistTop(start)
        })
      }
      flushChatAnchors()
    }
    const onVis = () => {
      if (document.hidden) onHide()
      else if (needsAnchorRef.current === false && settledRef.current) {
        // Doble rAF: deja que el drenaje del batch SSE (useMessages, también
        // en visibilitychange) comitee primero; si no, el ancla se calcula
        // sobre el array pre-drenaje y queda un mensaje arriba del fondo.
        // Y con layout aún colapsado se espera: restaurar a ciegas clava arriba.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            waitForHeight(() => {
              const { messages: m } = liveRef.current
              const rel = resolveInitialIndex(m, selectedID)
              if (rel === undefined) return
              if (touchedRef.current) return
              dbg("vis-restore")
              if (rel === m.length - 1) {
                pinningRef.current = true
                pinToEnd()
                // Fijar memoria en fondo: sin esto un ancla stale a mitad
                // sobrevivía y la próxima entrada restauraba arriba.
                saveChatAnchor(selectedID, { kind: "bottom" })
              } else pinToIndex(rel)
            })
          })
        })
      }
    }
    document.addEventListener("visibilitychange", onVis)
    window.addEventListener("pagehide", onHide)
    return () => {
      onHide()
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener("pagehide", onHide)
    }
  }, [selectedID, persistTop, pinToEnd, pinToIndex])

  useEffect(() => {
    if (view !== "detail" || !selectedID) return
    if (loadingSessionID === selectedID) {
      sawLoadingRef.current = true
      return
    }
    if (!isFresh || messages.length === 0) return
    if (!needsAnchorRef.current) return
    needsAnchorRef.current = false
    maxAttemptsRef.current = 0
    // Con layout colapsado (WebView minimizado al arrancar) el ancla no puede
    // medirse: se espera al layout real en vez de clavar arriba.
    waitForHeight(() => {
      const rel = resolveInitialIndex(liveRef.current.messages, selectedID)
      entryAnchorRef.current = rel === undefined || rel === liveRef.current.messages.length - 1
        ? { mode: "bottom" }
        : { mode: "at", rel }
      const a = entryAnchorRef.current
      dbg(a.mode === "bottom" ? "entry:bottom" : "entry:at")
      if (a.mode === "bottom") {
        pinningRef.current = true
        pinToEnd()
        saveChatAnchor(selectedID, { kind: "bottom" })
      } else pinToIndex(a.rel)
      pokeSettle()
      maxTimerRef.current = window.setTimeout(markSettledRef.current, SETTLE_MAX_MS)
    })
    return () => window.clearTimeout(maxTimerRef.current)
  }, [revealed, view, selectedID, isFresh, loadingSessionID, firstID, lastID, messages.length,
    pinToEnd, pinToIndex, pokeSettle, waitForHeight])

  // Vacío genuino: terminó la carga y no hay mensajes (chat nuevo). Sin esto
  // el velo quedaría opaco para siempre; con carga aún por empezar se espera.
  useEffect(() => {
    if (revealed || view !== "detail" || !selectedID) return
    if (!isFresh || loadingSessionID === selectedID || messages.length > 0) return
    if (!sawLoadingRef.current) return
    needsAnchorRef.current = false
    settledRef.current = true
    setRevealed(true)
  }, [revealed, view, selectedID, isFresh, loadingSessionID, messages.length])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const interrupt = () => {
      if (!touchedRef.current) dbg("touch")
      touchedRef.current = true
      pinningRef.current = false
      markSettled()
    }
    // El scroll por teclado (foco en la lista) también es mano del usuario:
    // sin esto, Espacio/AvPág lo devuelve abajo el intervalo.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "ArrowDown" ||
        e.key === "PageUp" || e.key === "PageDown" || e.key === "Home" || e.key === "End") {
        interrupt()
      }
    }
    el.addEventListener("wheel", interrupt, { passive: true })
    el.addEventListener("touchstart", interrupt, { passive: true })
    el.addEventListener("pointerdown", interrupt, { passive: true })
    el.addEventListener("keydown", onKey)
    return () => {
      el.removeEventListener("wheel", interrupt)
      el.removeEventListener("touchstart", interrupt)
      el.removeEventListener("pointerdown", interrupt)
      el.removeEventListener("keydown", onKey)
    }
  }, [markSettled])

  // Red de seguridad de convergencia: mientras el clavado siga activo y el
  // usuario no haya tocado, re-clava cada 500ms si deriva >80px. Cubre los
  // huecos entre eventos (deltas que no cambian altura, medición perezosa):
  // la entrada en sesión pesada con stream tardaba ~10s en converger solo
  // con eventos. Se apaga solo con mano del usuario o al desmontar; llegar
  // abajo lo vuelve no-op (asignar el mismo scrollTop no dispara scroll).
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!pinningRef.current || touchedRef.current) return
      const sc = rootRef.current?.querySelector("[data-virtuoso-scroller]")
      if (!sc || sc.clientHeight === 0) return
      try {
        if (sc.scrollHeight - sc.scrollTop - sc.clientHeight > 80) {
          dbg("ival-pin")
          sc.scrollTop = sc.scrollHeight
        }
      } catch {
        /* detached */
      }
    }, 500)
    return () => window.clearInterval(id)
  }, [dbg])

  // Pegamento post-asentamiento: <img>/<iframe> que expanden tarde (más allá
  // de la ventana de settle) re-clavan solo si NOSOTROS lo dejamos abajo y el
  // usuario no tocó desde entonces (pinningRef), sin importar cuánto derivó:
  // followOutput solo reacciona a cambios de datos y el atBottom interno se
  // pierde con derivas puras de medición.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onLateLoad = () => {
      if (settledRef.current && pinningRef.current && !touchedRef.current) {
        const sc = el.querySelector("[data-virtuoso-scroller]")
        if (sc) {
          try {
            sc.scrollTop = sc.scrollHeight
          } catch {
            /* detached */
          }
        }
      }
    }
    el.addEventListener("load", onLateLoad, true)
    return () => el.removeEventListener("load", onLateLoad, true)
  }, [])

  useEffect(() => {
    if (!pinningRef.current || touchedRef.current || !settledRef.current) return
    if (view !== "detail" || !selectedID) return
    pinToEnd()
  }, [messages.length, view, selectedID, pinToEnd])

  useEffect(() => {
    if (!scrollToMessageID || view !== "detail" || !settledRef.current) return
    const rel = liveRef.current.messages.findIndex((m) => m.info.id === scrollToMessageID)
    if (rel < 0) return
    pinningRef.current = false
    pinToIndex(rel)
  }, [scrollToMessageID, view, messages, pinToIndex])

  const flashedRevealRef = useRef(0)
  useEffect(() => {
    if (!revealMessageID || !revealNonce || flashedRevealRef.current === revealNonce) return
    const rel = liveRef.current.messages.findIndex((m) => m.info.id === revealMessageID)
    if (rel < 0) return
    pinningRef.current = false
    pinToIndex(rel)
    const timer = window.setTimeout(() => {
      const wrap = rootRef.current
      if (!wrap) return
      let sel = `[data-message-id="${revealMessageID}"]`
      try {
        sel = `[data-message-id="${CSS.escape(revealMessageID)}"]`
      } catch {
        /* fallback plano */
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
    return () => window.clearTimeout(timer)
  }, [revealMessageID, revealNonce, messages, pinToIndex])

  const scrollToEnd = useCallback(
    (smooth = false) => {
      const { messages: m } = liveRef.current
      if (m.length === 0) return
      const sc = rootRef.current?.querySelector("[data-virtuoso-scroller]")
      if (!sc) return
      try {
        sc.scrollTo({ top: sc.scrollHeight, behavior: smooth ? "smooth" : "auto" })
      } catch {
        /* noop */
      }
    },
    [],
  )

  if (loadingSessionID && loadingSessionID === selectedID) {
    return (
      <div className="message-list-root">
        <div className="messages" style={{ opacity: 1 }}>
          <div className="empty-state compact">
            <GridSpinner label={t("detail.loading")} />
            <p aria-hidden="true">{t("detail.loading")}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="message-list-root" ref={rootRef}>
      <div className="messages-virtuoso" style={{ flex: 1, minHeight: 0, opacity: revealed ? 1 : 0 }}>
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          firstItemIndex={firstItemIndex}
          alignToBottom
          followOutput={(isAtBottom) => (isAtBottom ? "auto" : false)}
          atBottomThreshold={80}
          atBottomStateChange={handleAtBottom}
          rangeChanged={({ startIndex }) => persistTop(startIndex)}
          totalListHeightChanged={handleTotalHeight}
          overscan={400}
          increaseViewportBy={600}
          computeItemKey={(_index, item) => (item as RenderedMessage)?.info?.id ?? _index}
          components={{
            Header: hasMoreMessages
              ? () => (
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
              )
              : undefined,
            Footer: () => (
              <>
                {compacting && (
                  <article className="message assistant compacting-bubble fade-in" aria-label="Compacting session">
                    <div className="compacting-indicator" aria-hidden="true">
                      <CompressIcon size={18} />
                      <span>Compacting session...</span>
                    </div>
                  </article>
                )}
                {showTypingBubble && !compacting && (
                  <article className="message assistant typing-bubble fade-in" aria-label={t("detail.waiting")}>
                    <GridSpinner label={t("detail.waiting")} size={20} />
                  </article>
                )}
              </>
            ),
            EmptyPlaceholder: () => (
              <div className="empty-state compact">
                <ChatIcon size={40} className="icon-empty-state" />
                <p>{t("detail.emptyTitle")}</p>
                <p className="subtle">{t("detail.emptyHint")}</p>
              </div>
            ),
          }}
          itemContent={(index, message) => {
            const msg = message as RenderedMessage
            if (!msg) return <div />
            const rel = toRel(index)
            return (
              <div data-index={rel} data-message-id={msg.info.id}>
                <MessageBubble
                  message={msg}
                  queued={pendingIndex !== undefined && rel > pendingIndex}
                  outbox={outboxActions?.[msg.info.id]}
                  revert={revert}
                  isReverted={revertIndex >= 0 && rel >= revertIndex}
                  onRevertToMessage={onRevertToMessage}
                  agents={agents}
                  prevUserTs={msg.info.parentID ? prevUserTsMap.get(msg.info.parentID) : undefined}
                  showModelInfo={footerInfoMap.get(msg.info.id) ?? false}
                  config={config}
                  directory={directory}
                  onViewSubagents={onViewSubagents}
                  onContextMenu={onContextMenu}
                  onEditMessage={onEditMessage}
                  showTodoButton={showTodoButton ?? false}
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
          }}
        />
      </div>
      {!atBottom && messages.length > 0 && (
        <button
          className="scroll-to-bottom"
          onClick={() => scrollToEnd(true)}
          aria-label="Scroll to bottom"
          title="Scroll to bottom"
        >
          <ScrollDownIcon size={16} />
        </button>
      )}
    </div>
  )
})
