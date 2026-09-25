import { memo, useCallback, useRef, useEffect, useLayoutEffect, useState, Fragment, useMemo } from "react"
import { ChatIcon, ScrollDownIcon, CompressIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { RenderedMessage, SessionView, AgentOption, ServerConfig, FileDiff } from "../types"
import { MessageBubble } from "./MessageBubble"
import { buildTurnActivity } from "../utils/turnActivity"
import { ConfirmDialog } from "../features/settings/ConfirmDialog"
import "../styles/chat-pin.css"
import { useFollowTail, resolveSessionEntry, anchorScrollToSaved } from "../shared/lib/useFollowTail"
import { sliceLastUserTurns } from "../utils/messageShape"

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
  busySessionIds?: ReadonlySet<string>
  onContextMenu?: (x: number, y: number, messageID: string) => void
  onEditMessage?: (messageID: string, text: string) => void
  showTodoButton?: boolean
  onToggleTodos?: () => void
  todosOpen?: boolean
  highlight?: string
  scrollToMessageID?: string | null
  // Salto desde el historial de prompts: id objetivo + nonce (repite clics
  // sobre el mismo id). MessageList expande visibleCount hasta incluirlo y
  // hace scroll + destello. Separado de scrollToMessageID (buscador).
  revealMessageID?: string | null
  revealNonce?: number
  compactTools?: boolean
  minimalistMode?: boolean
  thinkingDefault?: "auto" | "expanded" | "collapsed"
  onRegenerate?: () => void
  onOpenADEDiff?: (diffs: FileDiff[], file?: string) => void
  // Cola visible: acciones por id de mensaje pendiente (eliminar/editar/enviar).
  outboxActions?: Record<string, { onDelete: () => void; onEdit: () => void; onSendNow: () => void; disabled?: boolean; canAct?: () => boolean }>
}

export const MessageList = memo(function MessageList({
  messages, pendingIndex, loadingSessionID, selectedID, showTypingBubble, compacting, isWorking, messageScrollSignature, view,
  revert, onRevertToMessage, agents, config, directory, onViewSubagents, busySessionIds, onContextMenu, onEditMessage, showTodoButton, onToggleTodos, todosOpen,   highlight, scrollToMessageID, revealMessageID, revealNonce, compactTools, minimalistMode, thinkingDefault, onRegenerate, onOpenADEDiff, outboxActions
}: MessageListProps) {
  const t = useT()
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  // Frescura ANTES del hook: la memoria de scroll solo puede escribirse cuando
  // la lista muestra mensajes de la sesión seleccionada. El primer render tras
  // cambiar de chat trae mensajes STALE de la sesión anterior; guardar su
  // geometría bajo la sesión nueva envenenaba la memoria y la próxima entrada
  // clavaba arriba (dist guardada mayor que el contenido cargado).
  const msgsSessionID: string | null = messages.length > 0 ? messages[0]!.info.sessionID : null
  const isFresh = messages.length === 0 || msgsSessionID === selectedID
  const settledRef = useRef(false)
  const touchedRef = useRef(false)
  // Puerta: false hasta asentarse (incluye el tramo stale y el velo).
  const persistGateRef = useRef(false)
  const { isAtBottom, setIsAtBottom, scrollToBottom, isNearBottom, resetSavedPosition } = useFollowTail(messagesRef, { persistKey: selectedID, canPersistRef: persistGateRef })
  // ui-regression anchor: scrollTo({ top: container.scrollHeight — logic lives in useFollowTail

  const INITIAL_PAGE_SIZE = 40
  // Ventana inicial: sesiones enormes (DB de GB) sin virtualización colgaban
  // el renderer. 40 burbujas al inicio; el resto bajo demanda. El tope real es
  // messages.length (límite del server: 200), así que un salto explícito puede
  // mostrar más sin que el botón "Cargar anteriores" encoja la ventana.
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE)
  // El botón de editar mensaje pide confirmación: handleEditMessage revierte la
  // sesión hasta ese mensaje (aborta la respuesta en curso) y carga el texto en
  // el compositor; un click accidental era destructivo.
  const [editConfirm, setEditConfirm] = useState<{ messageID: string; text: string } | null>(null)
  const requestEditMessage = useCallback((messageID: string, text: string) => {
    setEditConfirm({ messageID, text })
  }, [])

  const initializedSessionRef = useRef<string | null>(null)
  useEffect(() => {
    if (!selectedID) return
    if (initializedSessionRef.current !== selectedID && messages.length > 0 && isFresh) {
      initializedSessionRef.current = selectedID
      const turnsSlice = sliceLastUserTurns(messages, 3)
      setVisibleCount(Math.max(INITIAL_PAGE_SIZE, turnsSlice.length))
    }
  }, [selectedID, messages, isFresh])

  const prevMessagesCountRef = useRef(messages.length)
  useEffect(() => {
    const prevCount = prevMessagesCountRef.current
    prevMessagesCountRef.current = messages.length
    if (initializedSessionRef.current === selectedID && messages.length > prevCount) {
      const added = messages.length - prevCount
      setVisibleCount((prev) => prev + added)
    }
  }, [messages.length, selectedID])

  const expandScrollAnchorRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null)

  const handleLoadEarlier = useCallback(() => {
    const el = messagesRef.current
    if (el) {
      expandScrollAnchorRef.current = {
        scrollHeight: el.scrollHeight,
        scrollTop: el.scrollTop,
      }
    }
    setVisibleCount((prev) => Math.min(Math.max(prev, INITIAL_PAGE_SIZE) + INITIAL_PAGE_SIZE, messages.length))
  }, [messages.length])

  useLayoutEffect(() => {
    const anchor = expandScrollAnchorRef.current
    if (!anchor) return
    expandScrollAnchorRef.current = null
    const el = messagesRef.current
    if (!el) return
    const delta = el.scrollHeight - anchor.scrollHeight
    if (delta > 0) {
      el.scrollTop = anchor.scrollTop + delta
    }
  }, [visibleCount])

  useEffect(() => {
    if (!scrollToMessageID) return
    const idx = messages.findIndex((m) => m.info.id === scrollToMessageID)
    // Ventana justa hasta el objetivo (cubre >MAX_VISIBLE); si el id ya no
    // existe (revert/borrado), expandir al tope para no dejarlo oculto.
    setVisibleCount((prev) => Math.max(prev, idx >= 0 ? messages.length - idx : messages.length))
  }, [scrollToMessageID, messages.length])

  // Salto del historial: expande hasta incluir el objetivo y luego scroll +
  // destello (repite por nonce aunque el id sea el mismo). El scroll corre en
  // un efecto separado que reintenta tras renderizar la ventana expandida.
  const flashedRevealRef = useRef(0)
  useEffect(() => {
    if (!revealMessageID) return
    const idx = messages.findIndex((m) => m.info.id === revealMessageID)
    if (idx < 0) return
    const needed = messages.length - idx
    setVisibleCount((prev) => Math.max(prev, needed))
  }, [revealMessageID, revealNonce, messages])

  useEffect(() => {
    if (!revealMessageID || !revealNonce || flashedRevealRef.current === revealNonce) return
    const wrap = messagesRef.current
    if (!wrap) return
    let sel = `[data-message-id="${revealMessageID}"]`
    try {
      sel = `[data-message-id="${CSS.escape(revealMessageID)}"]`
    } catch {
      /* ids generados: el fallback plano vale */
    }
    const el = wrap.querySelector(sel)
    // Aún no renderizado (ventana recién expandida): el efecto re-corre al
    // cambiar visibleMessages y lo captura entonces.
    if (!el) return
    flashedRevealRef.current = revealNonce
    el.scrollIntoView({ block: "center", behavior: "smooth" })
    el.classList.remove("msg-flash")
    void (el as HTMLElement).offsetWidth
    el.classList.add("msg-flash")
    window.setTimeout(() => el.classList.remove("msg-flash"), 1800)
    // Deps explícitas (antes corría en CADA render y re-disparaba el smooth
    // en pleno streaming): reintenta al expandirse la ventana o crecer el chat.
  }, [revealMessageID, revealNonce, visibleCount, messages.length])

  const visibleMessages = useMemo(() => {
    if (messages.length <= visibleCount) return messages
    return messages.slice(messages.length - visibleCount)
  }, [messages, visibleCount])

  // Agrupación por TURNO para el pin del prompt: `.turn-group` le da al mensaje
  // del usuario un contenedor propio donde `position: sticky` se pega y se
  // suelta solo cuando llega el turno siguiente (el swap sale gratis, sin JS).
  // El grupo es un flex column igual que `.messages`, así los mensajes siguen
  // siendo flex items (el `align-self: flex-end` del usuario queda intacto) y
  // los márgenes entre mensajes no cambian.
  const turnGroups = useMemo(() => {
    const base = messages.length - visibleMessages.length
    const groups: Array<{ key: string; rows: Array<{ message: RenderedMessage; actualIndex: number }> }> = []
    visibleMessages.forEach((message, index) => {
      if (message.info.role === "user" || groups.length === 0) {
        groups.push({ key: message.info.id, rows: [] })
      }
      groups[groups.length - 1]!.rows.push({ message, actualIndex: base + index })
    })
    return groups
  }, [visibleMessages, messages.length])

  // Actividad por TURNO: un prompt genera varios mensajes del asistente; la
  // caja (pensamiento + herramientas + diffs) se agrupa en el primero de ellos.
  const turnActivity = useMemo(() => {
    const visibleIDs = new Set(visibleMessages.map((m) => m.info.id))
    return buildTurnActivity(messages, visibleIDs)
  }, [messages, visibleMessages])

  // Turno EN CURSO: es el único cuya caja "Working" se pega (debajo del prompt).
  // En los turnos cerrados la caja vuelve al flujo normal.
  const activeGroupKey = useMemo(() => {
    for (const group of turnGroups) {
      for (const row of group.rows) {
        if (turnActivity.box.get(row.message.info.id)?.working) return group.key
      }
    }
    return null
  }, [turnGroups, turnActivity])

  // `--pin-h`: alto real del prompt pegado. La caja del turno activo se apoya
  // exactamente debajo con `top: var(--pin-h)`; el alto del globito depende del
  // texto, así que se mide (y se re-mide si el texto cambia de alto).
  const pinGroupRef = useRef<HTMLDivElement | null>(null)
  useLayoutEffect(() => {
    const group = pinGroupRef.current
    if (!group) return
    const user = group.querySelector<HTMLElement>(":scope > .message.user")
    if (!user) return
    const apply = () => {
      group.style.setProperty("--pin-h", `${Math.round(user.getBoundingClientRect().height)}px`)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(user)
    return () => ro.disconnect()
  }, [activeGroupKey])

  // Header del mensaje del usuario (fecha/hora + acciones): oculto por defecto,
  // se revela al CLICKEAR el mensaje y se oculta al clickear afuera. Sin estado
  // por mensaje: una clase en el elemento, delegada desde el contenedor.
  useEffect(() => {
    const root = messagesRef.current
    if (!root) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null
      const msg = (target?.closest?.(".message.user") as HTMLElement | null) ?? null
      root.querySelectorAll<HTMLElement>(".message.user.header-shown").forEach((el) => {
        if (el !== msg) el.classList.remove("header-shown")
      })
      if (msg && root.contains(msg)) msg.classList.toggle("header-shown")
    }
    root.addEventListener("click", onClick)
    return () => root.removeEventListener("click", onClick)
  }, [])

  // Tope de 200px SOLO cuando el prompt esta pegado: el scroller avisa con una
  // banda fina arriba del area visible (IntersectionObserver, sin tocar el scroll).
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return
    const root = messagesRef.current
    if (!root) return
    const scroller = root.closest<HTMLElement>(".messages") ?? root
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const group = (entry.target as HTMLElement).closest<HTMLElement>(".turn-group")
        if (group) group.classList.toggle("turn-group-stuck", entry.isIntersecting)
      }
    }, { root: scroller, rootMargin: "0px 0px -99% 0px", threshold: 0 })
    root.querySelectorAll(".turn-group > .message.user").forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [messages])

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

  // v2 no manda parentID en el mensaje del asistente: el inicio del turno es
  // el mensaje user ANTERIOR POR ORDEN. Con parentID el mapa nunca matcheaba y
  // el tiempo mostraba `completed - assistant.created` (4.1s) en vez del total
  // desde tu mensaje (4.5s; en turnos con tools la diferencia es de minutos).
  const prevUserTsByIndex = useMemo(() => {
    const out: Array<number | undefined> = []
    let lastUserTs: number | undefined
    for (const msg of messages) {
      out.push(lastUserTs)
      if (msg.info.role === "user") lastUserTs = msg.info.time.created
    }
    return out
  }, [messages])

  const revertIndex = useMemo(() => {
    if (!revert?.messageID) return -1
    return messages.findIndex((m) => m.info.id === revert.messageID)
  }, [messages, revert?.messageID])



  // Entrada a sesión: igual que la virtual — useMessages fusiona sin limpiar
  // al cambiar de chat y el primer render trae mensajes STALE de la sesión
  // anterior. Solo se ancla con mensajes FRESCOS y por identidad de
  // contenido, no por longitud (un swap con igual longitud no re-disparaba).
  // (msgsSessionID/isFresh se calculan antes de useFollowTail.)
  const firstID = messages.length > 0 ? messages[0]!.info.id : ""
  const lastID = messages.length > 0 ? messages[messages.length - 1]!.info.id : ""
  const needsAnchorRef = useRef(true)
  // Asentamiento (igual que la virtual): el velo se levanta solo con el scroll
  // clavado al fondo y scrollHeight estable 3 frames (o timeout ~750ms), para
  // que imágenes/fuentes tardías y etapas caché→fetch no produzcan el "scroll
  // rápido desde arriba" visible. Los auto-scrolls esperan a settledRef.
  const atBottomMirrorRef = useRef(true)
  useEffect(() => { atBottomMirrorRef.current = isAtBottom }, [isAtBottom])
  const [revealed, setRevealed] = useState(false)
  const isFreshRef = useRef(isFresh)
  isFreshRef.current = isFresh
  // Objetivo de entrada (una sola resolución por montaje): fondo, o retorno
  // al punto guardado por mensaje/distancia.
  const entryTargetRef = useRef<{ mode: "bottom" } | { mode: "at"; dist: number; mid?: string; moff?: number } | null>(null)

  // Cap duro anti "chat negro": el loop de asentamiento se reinicia con cada
  // tanda de merges de mensajes (el fetch llega en ráfagas) y su presupuesto
  // de frames se resetea, dejando el velo opaco hasta que el chat se aquieta.
  // Este deadline es por montaje y NO depende de re-renders: pasado el plazo,
  // el contenido fresco se muestra sí o sí (con su ancla aplicada).
  const REVEAL_HARD_CAP_MS = 1200
  useEffect(() => {
    let timer = 0
    const tryReveal = () => {
      if (settledRef.current) return
      if (!isFreshRef.current) {
        // Datos stale: no mostrar el chat equivocado; reintentar el cap.
        timer = window.setTimeout(tryReveal, REVEAL_HARD_CAP_MS)
        return
      }
      settledRef.current = true
      persistGateRef.current = true
      const el = messagesRef.current
      const target = entryTargetRef.current
      if (el) {
        if (!target || target.mode === "bottom") {
          try {
            el.scrollTop = el.scrollHeight
          } catch {
            /* detached */
          }
        } else if (!anchorScrollToSaved(el, target)) {
          try {
            el.scrollTop = el.scrollHeight
          } catch {
            /* detached */
          }
        }
      }
      setRevealed(true)
    }
    timer = window.setTimeout(tryReveal, REVEAL_HARD_CAP_MS)
    return () => window.clearTimeout(timer)
  }, [])

  // Interrupción del usuario: aborta el clavado, nunca pelear con la mano.
  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    const interrupt = () => { touchedRef.current = true }
    el.addEventListener("wheel", interrupt, { passive: true })
    el.addEventListener("touchstart", interrupt, { passive: true })
    el.addEventListener("pointerdown", interrupt, { passive: true })
    return () => {
      el.removeEventListener("wheel", interrupt)
      el.removeEventListener("touchstart", interrupt)
      el.removeEventListener("pointerdown", interrupt)
    }
  }, [])

  // Pegamento post-asentamiento: <img>/<iframe> que expanden tarde re-clavan
  // solo si el usuario sigue al fondo (evento "load" en captura).
  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    const onLateLoad = () => {
      if (settledRef.current && !touchedRef.current && atBottomMirrorRef.current) {
        try {
          el.scrollTop = el.scrollHeight
        } catch {
          /* detached */
        }
      }
    }
    el.addEventListener("load", onLateLoad, true)
    return () => el.removeEventListener("load", onLateLoad, true)
  }, [])

  // Scroll síncrono al entrar con mensajes frescos, antes del paint (sin animación ni saltos visibles)
  // Retorno donde lo dejaste (por mensaje, inmune a streaming entre medias) si
  // te habías quedado a mitad; si estabas al fondo, siempre abajo — válido
  // incluso tras cambiar de conversación y volver (per-sesión, <2h).
  useLayoutEffect(() => {
    if (view !== "detail" || !selectedID || messages.length === 0) return
    // Rama del spinner: sin DOM de mensajes; anclar acá deja el scroll arriba
    // al montar la lista real.
    if (loadingSessionID === selectedID) return
    if (!isFresh || !needsAnchorRef.current) return
    if (!entryTargetRef.current) {
      const r = resolveSessionEntry(selectedID)
      entryTargetRef.current = r.kind === "return" ? { mode: "at", dist: r.dist, mid: r.mid, moff: r.moff } : { mode: "bottom" }
    }
    const target = entryTargetRef.current
    // Ancla por mensaje: debe existir en los datos cargados. Si no está (p.
    // ej. memoria envenenada de un montaje stale o historial más viejo que la
    // ventana), degradar a entrada por FONDO — jamás clavar arriba.
    if (target.mode === "at" && target.mid) {
      const idx = messages.findIndex((m) => m.info.id === target.mid)
      if (idx < 0) {
        entryTargetRef.current = { mode: "bottom" }
      } else {
        // Fuera de la ventana paginada (visibleCount=40): expandir antes de
        // anclar; el nodo no existe en DOM y el fallback por distancia sería
        // impreciso tras crecimiento del chat.
        const needed = messages.length - idx
        if (needed > visibleCount) {
          setVisibleCount((prev) => Math.max(prev, needed))
          // Dejar que la ventana se expanda y reintentar ancla en el próximo frame
          // (needsAnchor sigue false, pero el veil se encargará del ancla con ventana ya expandida).
          // Marcar atBottom falso para que el botón no parpadee.
          setIsAtBottom(false)
          return
        }
      }
    }
    needsAnchorRef.current = false
    const el = messagesRef.current
    if (entryTargetRef.current.mode === "at" && el) {
      // Ancla por mensaje (inmune al streaming que creció abajo en ausencia).
      const t2 = entryTargetRef.current as { mode: "at"; dist: number; mid?: string; moff?: number }
      if (!anchorScrollToSaved(el, t2)) {
        // Distancia guardada irrepresentable (memoria vieja): fondo.
        entryTargetRef.current = { mode: "bottom" }
        el.scrollTop = el.scrollHeight
        setIsAtBottom(true)
        resetSavedPosition()
      } else {
        const d = el.scrollHeight - el.scrollTop - el.clientHeight
        setIsAtBottom(d <= 2)
      }
    } else {
      if (el) {
        el.scrollTop = el.scrollHeight
      }
      setIsAtBottom(true)
      resetSavedPosition()
      scrollToBottom("auto")
    }
  }, [view, selectedID, loadingSessionID, firstID, lastID, isFresh, scrollToBottom, setIsAtBottom, resetSavedPosition, visibleCount, messages])

  // Fusión que antepone historial (fetch/poll tras preload, confirmación de
  // envío): firstID cambia con lastID igual y el scrollHeight crece hacia
  // ARRIBA. Si el usuario está al fondo, re-clavar en LAYOUT (antes del
  // paint): el follow-effect corre en useEffect y pintaba 1 frame a mitad del
  // chat antes de volver abajo ("salto a un mensaje donde yo no estaba").
  const prevFirstIDRef = useRef(firstID)
  useLayoutEffect(() => {
    if (prevFirstIDRef.current === firstID) return
    prevFirstIDRef.current = firstID
    if (!settledRef.current || touchedRef.current) return
    if (view !== "detail" || loadingSessionID === selectedID) return
    if (messages.length === 0) return
    const el = messagesRef.current
    if (el && atBottomMirrorRef.current) {
      try {
        el.scrollTop = el.scrollHeight
      } catch {
        /* detached */
      }
    }
  }, [firstID, view, loadingSessionID, selectedID, messages.length])

  // Velo anti-parpadeo con asentamiento: revela solo clavado al fondo (o
  // ancla a mitad estable) + scrollHeight estable, o por timeout. Re-corre si
  // los mensajes cambian a mitad (fetch tras preload), todavía oculto.
  useEffect(() => {
    if (revealed || view !== "detail" || !selectedID) return
    if (!isFresh) return
    if (loadingSessionID === selectedID) return
    if (messages.length === 0) {
      settledRef.current = true
      persistGateRef.current = true
      setRevealed(true)
      return
    }
    let frames = 0
    let stable = 0
    let lastH = -1
    let raf = 0
    const step = () => {
      if (touchedRef.current) {
        settledRef.current = true
        persistGateRef.current = true
        setRevealed(true)
        return
      }
      const el = messagesRef.current
      const target = entryTargetRef.current
      if (el) {
        if (!target || target.mode === "bottom") {
          try {
            el.scrollTop = el.scrollHeight
          } catch {
            /* detached */
          }
        } else {
          // Si el mensaje ancla quedó fuera de la ventana paginada, expandir
          // antes de anclar; si no, fallback por distancia sería impreciso.
          if (target.mid) {
            const idx = messages.findIndex((m) => m.info.id === target.mid)
            if (idx < 0) {
              // Ancla irresoluble (memoria vieja): fondo, nunca arriba.
              entryTargetRef.current = { mode: "bottom" }
              raf = requestAnimationFrame(step)
              return
            }
            const needed = messages.length - idx
            if (needed > visibleCount) {
              setVisibleCount((prev) => Math.max(prev, needed))
              // Reintentar tras expandir (el efecto re-corre al cambiar visibleCount)
              raf = requestAnimationFrame(step)
              return
            }
          }
          if (!anchorScrollToSaved(el, target)) {
            entryTargetRef.current = { mode: "bottom" }
            el.scrollTop = el.scrollHeight
            resetSavedPosition()
          }
        }
      }
      const h = el?.scrollHeight ?? 0
      if (h === lastH) stable++
      else {
        stable = 0
        lastH = h
      }
      const dist = el ? el.scrollHeight - el.scrollTop - el.clientHeight : 0
      frames++
      const cur = entryTargetRef.current
      const onTarget = !cur || cur.mode === "bottom" ? dist <= 2 : true
      if ((stable >= 3 && onTarget) || frames >= 45) {
        settledRef.current = true
        persistGateRef.current = true
        setRevealed(true)
        return
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [revealed, view, selectedID, loadingSessionID, isFresh, firstID, lastID, messages.length, visibleCount, messages, resetSavedPosition])

  useEffect(() => {
    if (view !== "detail") return
    if (loadingSessionID === selectedID) return
    // La entrada la gobierna el ancla fresca + asentamiento (stale = quieto,
    // settling = oculto).
    if (needsAnchorRef.current || !settledRef.current) return
    if (messages.length > 0) {
      if (isAtBottom || isNearBottom(80)) scrollToBottom("auto")
    }
  }, [view, loadingSessionID, selectedID, messages.length, isAtBottom, isNearBottom, scrollToBottom])

  // Navegación del buscador: centra el mensaje con la coincidencia actual.
  // Re-corre al crecer visibleMessages: el objetivo puede entrar al DOM un
  // render después de expandir la ventana.
  useEffect(() => {
    if (!scrollToMessageID || view !== "detail") return
    let sel = `[data-message-id="${scrollToMessageID}"]`
    try {
      sel = `[data-message-id="${CSS.escape(scrollToMessageID)}"]`
    } catch {
      /* ids generados: el fallback plano vale */
    }
    const el = messagesRef.current?.querySelector(sel)
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" })
    }
  }, [scrollToMessageID, view, visibleCount, messages.length])

  // Durante streaming, seguir solo si está abajo o muy cerca (80px); no robar lectura arriba.
  useEffect(() => {
    if (view !== "detail") return
    // La entrada la gobierna el ancla fresca + asentamiento (stale = quieto,
    // settling = oculto).
    if (needsAnchorRef.current || !settledRef.current) return
    if (isAtBottom) {
      scrollToBottom("auto")
    } else if (messages.length > 0 && messageScrollSignature) {
      if (isNearBottom(80)) {
        scrollToBottom("auto")
      }
    }
  }, [messageScrollSignature, isWorking, showTypingBubble, view, isAtBottom, isNearBottom, scrollToBottom, messages.length])

  // Carga visible: spinner de la sesión (loading activo) o datos stale de otra
  // sesión todavía montados. Antes ese tramo quedaba con el velo (opacity 0)
  // y se veía "chat vacío en negro" durante segundos al cambiar de chat.
  const showSessionLoading =
    (loadingSessionID !== null && loadingSessionID === selectedID) ||
    (!isFresh && messages.length > 0)

  // La caja de actividad en marcha ya trae su propio spinner: la burbuja de
  // "escribiendo" solo aparece cuando todavía no hay caja trabajando (turno
  // recién arrancado sin mensajes). Sin esto había dos spinners a la vez.
  const hasWorkingActivity = [...turnActivity.box.values()].some((a) => a.working)

  return (
    <div className="message-list-root">
      <div className="messages" ref={messagesRef} style={{ opacity: revealed || showSessionLoading ? 1 : 0 }}>
        {showSessionLoading ? (
          // Sin spinner (pedido explícito): queda el texto, que ahora es el
          // que anuncia el estado a lectores de pantalla.
          <div className="empty-state compact">
            <p role="status">{t('detail.loading')}</p>
          </div>
        ) : messages.length === 0 && !showTypingBubble ? (
          <div className="empty-state compact">
            <ChatIcon size={40} className="icon-empty-state" />
            <p>{t('detail.emptyTitle')}</p>
            <p className="subtle">{t('detail.emptyHint')}</p>
          </div>
        ) : (
          <>
            {messages.length > visibleCount && (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <button
                  type="button"
                  className="btn-secondary compact load-earlier-btn"
                  style={{ fontSize: "0.75rem", padding: "4px 14px", borderRadius: "14px" }}
                  onClick={handleLoadEarlier}
                >
                  {t('detail.loadEarlier', { count: Math.min(INITIAL_PAGE_SIZE, messages.length - visibleCount), remaining: messages.length - visibleCount })}
                </button>
              </div>
            )}
            {turnGroups.map((group) => (
              <div
                key={group.key}
                ref={activeGroupKey === group.key ? pinGroupRef : undefined}
                className={`turn-group${activeGroupKey === group.key ? " turn-group-active" : ""}`}
                data-turn-group={group.key}
              >
                {group.rows.map(({ message, actualIndex }) => (
                  <Fragment key={message.info.id}>
                    {turnActivity.swallowed.has(message.info.id) ? null : <MessageBubble
                      message={message}
                      queued={pendingIndex !== undefined && actualIndex > pendingIndex}
                      outbox={outboxActions?.[message.info.id] ? { ...outboxActions[message.info.id], count: Object.keys(outboxActions).length } : null}
                      revert={revert}
                      isReverted={revertIndex >= 0 && actualIndex >= revertIndex}
                      onRevertToMessage={onRevertToMessage}
                      agents={agents}
                      prevUserTs={prevUserTsByIndex[actualIndex]}
                      showModelInfo={footerInfoMap.get(message.info.id) ?? false}
                      config={config}
                      directory={directory}
                      onViewSubagents={onViewSubagents}
                      busySessionIds={busySessionIds}
                      onContextMenu={onContextMenu}
                      onEditMessage={onEditMessage ? requestEditMessage : undefined}
                      showTodoButton={showTodoButton}
                      onToggleTodos={onToggleTodos}
                      todosOpen={todosOpen}
                      highlight={highlight}
                      compactTools={compactTools}
                      minimalistMode={minimalistMode}
                      thinkingDefault={thinkingDefault}
                      turnActivity={turnActivity.box.get(message.info.id) ?? null}
                      absorbActivity={turnActivity.absorbed.has(message.info.id)}
                      onRegenerate={onRegenerate}
                      onOpenADEDiff={onOpenADEDiff}
                    />}
                  </Fragment>
                ))}
              </div>
            ))}
            {compacting && (
              <article className="message assistant compacting-bubble fade-in" aria-label={t('session.compacting')}>
                <div className="compacting-indicator" aria-hidden="true">
                  <CompressIcon size={18} />
                  <span>{t('session.compacting')}</span>
                </div>
              </article>
            )}
            {showTypingBubble && !compacting && !hasWorkingActivity && (
              <article className="message assistant typing-bubble fade-in" aria-label={t('detail.waiting')} />
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
      {editConfirm && onEditMessage && (
        <ConfirmDialog
          title={t('detail.queuedEdit') || "Editar mensaje"}
          body={t('detail.editConfirmBody') || "Se revierte la sesión hasta este mensaje y el texto se carga en el compositor."}
          cancelText={t('common.cancel') || "Cancelar"}
          confirmText={t('common.confirm') || "Confirmar"}
          onCancel={() => setEditConfirm(null)}
          onConfirm={() => {
            const pending = editConfirm
            setEditConfirm(null)
            onEditMessage(pending.messageID, pending.text)
          }}
        />
      )}
    </div>
  )
})
