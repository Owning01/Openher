import { memo, useCallback, useState, useMemo, useRef, useEffect } from "react"
import { UndoIcon, MenuDotsIcon, CopyIcon, RefreshIcon, PencilIcon, CompressIcon, TrashIcon, ChevronDownIcon, ArrowRightIcon } from "../Icons"
import { formatTime, isImagePart } from "../utils"
import { getTranslationOriginal } from "../hooks/useMessages"
import { messageAuthorFrom } from "../entities/message/author"
import type { RenderedMessage, SessionView, AgentOption, ServerConfig, FileDiff } from "../types"
import { useT } from "../i18n-context"
import { useOutsideClick } from "../hooks/useOutsideClick"
import ToolPart from "./ToolPart"
import { FileDiffs } from "./FileDiffs"
import { ThinkingBlock } from "./ThinkingBlock"
import { ShimmerText } from "./ShimmerText"
import { CollapsibleSection } from "./CollapsibleSection"
import { Markdown } from "./Markdown"
import { MarkdownWithEmbeds } from "./AgentEmbed"
import { ImageLightbox } from "./ImageLightbox"
import { ToolIcon, InfoIcon } from "../Icons"
import { formatDurationMs, type TurnActivity } from "../utils/turnActivity"
import { splitActivityByComponent, subagentLabel } from "../utils/turnComponents"
import { subagentBackground } from "../utils/subagentBackground"
import { isAssistantMessage, isUserMessage, messageRole, getSubagentResultInfo } from "../utils/messageShape"

/** Extract base64 image data from a message part (handles both type:image and type:file). */
function getPartImageData(p: { type: string; data?: string; url?: string; mimeType?: string; mime?: string }): string | null {
  const url = p.url ?? ""
  // Solo renderizable en el browser: data: o http(s). Paths locales del
  // server (C:\…, /tmp/…) no cargan en el webview y se ignoran.
  const renderableUrl = url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://") ? url : ""
  // Algunos servers devuelven el base64 crudo (sin prefijo data:): se compone
  // con el mime del part para que el <img> lo cargue.
  const dataUrl = (p.data ?? "").startsWith("data:")
    ? (p.data as string)
    : p.data
      ? `data:${p.mimeType ?? p.mime ?? "image/png"};base64,${p.data}`
      : ""
  if (p.type === "image") {
    if (dataUrl) return dataUrl
    if (renderableUrl) return renderableUrl
    return null
  }
  if (p.type === "file") {
    const mime = p.mime || p.mimeType || ""
    if (!isImagePart({ type: p.type, mimeType: mime })) return null
    if (dataUrl) return dataUrl
    if (renderableUrl) return renderableUrl
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

export function calcDuration(msg: RenderedMessage, prevUserTs: number | undefined): string {  if (!msg.info.time.completed) return ""
  const finish = msg.info.finish
  if (!finish || finish === "tool-calls" || finish === "unknown") return ""
  const start = prevUserTs ?? msg.info.time.created
  const dur = msg.info.time.completed - start
  return formatDurationMs(dur)
}

export function calcTokensPerSecond(msg: RenderedMessage): string {
  if (!msg.info.time.completed || !msg.info.time.created) return ""
  const tokens = msg.tokens ?? msg.info.tokens
  let outputTokens = (tokens?.output ?? 0) + (tokens?.reasoning ?? 0)
  if (outputTokens <= 0 && msg.text) {
    outputTokens = Math.round(msg.text.length / 4)
  }
  if (outputTokens <= 0) return ""

  // Duración real de la generación del mensaje del asistente (en ms)
  const streamEnd = msg.info.time.streamed ?? msg.info.time.completed
  const genDurationMs = streamEnd - msg.info.time.created
  if (genDurationMs < 500) return ""

  const tps = (outputTokens / genDurationMs) * 1000
  if (tps < 1 || tps > 300) return ""
  return `${tps.toFixed(1)} tok/s`
}

const TranslationOriginal = memo(function TranslationOriginal({ messageId }: { messageId: string }) {
  const t = useT()
  const [show, setShow] = useState(false)
  const original = getTranslationOriginal(messageId)
  if (!original) return null
  return (
    <div className="translation-original">
      <button type="button" className="translation-toggle" onClick={() => setShow((v) => !v)}>
        {show ? t('detail.hideOriginal') : t('detail.showOriginal')}
      </button>
      {show && (
        <div className="translation-original-text">
          <Markdown text={original} />
        </div>
      )}
    </div>
  )
})

export const MessageBubble = memo(function MessageBubble({ message, queued, revert, isReverted: isRevertedProp, onRevertToMessage, onEditMessage, agents: _agents, prevUserTs, showModelInfo, config, directory, onViewSubagents, busySessionIds: _busySessionIds, onContextMenu, showTodoButton: _showTodoButton, onToggleTodos: _onToggleTodos, todosOpen: _todosOpen,   highlight, compactTools, minimalistMode = false, thinkingDefault = "auto", turnActivity, absorbActivity, onRegenerate, onOpenADEDiff, outbox }: {
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
  busySessionIds?: ReadonlySet<string>
  onContextMenu?: (x: number, y: number, messageID: string) => void
  showTodoButton?: boolean
  onToggleTodos?: () => void
  todosOpen?: boolean
  highlight?: string
  compactTools?: boolean
  minimalistMode?: boolean
  thinkingDefault?: "auto" | "expanded" | "collapsed"
  /** Actividad agregada del turno: la dibuja el primer mensaje del turno. */
  turnActivity?: TurnActivity | null
  /** Su actividad vive en la caja del turno: este mensaje no dibuja caja. */
  absorbActivity?: boolean
  onRegenerate?: () => void
  onOpenADEDiff?: (diffs: FileDiff[], file?: string) => void
  // Pendiente de la cola visible: el mensaje está en el chat sin enviarse.
  outbox?: { onDelete: () => void; onEdit: () => void; onSendNow: () => void; disabled?: boolean; canAct?: () => boolean; count?: number } | null
}) {
  const t = useT()
  const [showConfirm, setShowConfirm] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const moreWrapRef = useRef<HTMLSpanElement | null>(null)
  useOutsideClick(moreWrapRef, () => setMoreOpen(false), moreOpen)
  const [outboxCollapsed, setOutboxCollapsed] = useState(false)
  const activeOutbox = (outbox && isUserMessage(message)) ? outbox : null
  const isOutbox = Boolean(activeOutbox)
  const outboxCount = activeOutbox?.count ?? 1

  // Mensaje revertido: calculado por posición ordinal o fallback por ID
  const isReverted = isRevertedProp ?? (revert ? messageIdGt(message.info.id, revert.messageID) : false)
  const isRevertPoint = revert && message.info.id === revert.messageID

  // Mensaje de compactación: el server lo emite con role "compaction" (v2
  // nativo). Para estilos/layout se trata como assistant + modificador
  // "compaction": sin esto caía en `.message.compaction` sin CSS y el resumen
  // se veía como tarjeta plana sin estilo.
  const isCompaction = message.hasCompaction || messageRole(message) === "compaction"
  const isAssistant = isAssistantMessage(message) || isCompaction
  // Reporte de subagente inyectado por el server (rol synthetic): tarjeta
  // propia con rótulo — nunca burbuja de usuario ni volcado con tags crudos.
  const subagentInfo = useMemo(() => getSubagentResultInfo(message), [message])
  // Mensaje mandado por OTRO agente a esta sesión (viene con metadata.from):
  // globo de otro color + etiqueta "de: <nombre>".
  const authorFrom = isUserMessage(message) ? messageAuthorFrom(message.info) : null
  const [compactionOpen, setCompactionOpen] = useState(true)

  const duration = useMemo(() => calcDuration(message, prevUserTs), [message, prevUserTs])

  const tokensPerSecond = useMemo(
    () => calcTokensPerSecond(message),
    [message],
  )

  // Turno en curso (el agente sigue generando) vs terminado.
  const isWorkingTurn = !message.info.time.completed && !message.info.finish
  // Mensaje de usuario que viene envuelto en <subagent>…</subagent> (contenido
  // acoplado de un subagente, 25-sep): se muestra en un bloque con alto máximo
  // y scroll interno, en vez de una burbuja que crece sin límite.
  const userSubagentBlock = useMemo(() => {
    if (!isUserMessage(message) || !message.text) return null
    const m = /^\s*<subagent>([\s\S]*)<\/subagent>\s*$/.exec(message.text)
    return m ? m[1] : null
  }, [message])
  // Caja de actividad: agrupa pensamiento + herramientas + diffs de TODO el
  // turno (un prompt genera varios mensajes del asistente). El mensaje dueño
  // recibe el agregado; los demás no dibujan caja. Sin agregado (uso suelto del
  // componente) cae en la actividad de este mensaje.
  const activity: TurnActivity | null = useMemo(
    () => absorbActivity
      ? null
      : (turnActivity ?? {
          thinkingParts: message.thinkingParts ?? [],
          toolParts: message.toolParts,
          summaryDiffs: message.summaryDiffs ?? [],
          intermediateTexts: [],
          working: isWorkingTurn,
        }),
    [absorbActivity, turnActivity, message.thinkingParts, message.toolParts, message.summaryDiffs, isWorkingTurn],
  )
  const activityWorking = !!activity?.working
  // Se abre sola mientras trabaja, se acopla a una línea al terminar y se
  // reabre con un clic. `thinkingDefault: "expanded"` la deja abierta siempre.
  const [activityOpen, setActivityOpen] = useState(activityWorking || thinkingDefault === "expanded")
  useEffect(() => {
    if (!activityWorking && thinkingDefault !== "expanded") setActivityOpen(false)
  }, [activityWorking, thinkingDefault])

  const activityRef = useRef<HTMLDivElement | null>(null)
  // Seguir el fondo de la caja solo si el usuario ya está ahí: antes cada delta
  // la clavaba abajo y no se podía leer un tool anterior con el turno corriendo.
  const activityFollowRef = useRef(true)
  // El usuario la está tocando/usando (pointer/touch o foco adentro): mientras
  // dure, no se la mueve aunque esté al fondo (pedido del humano).
  const activityTouchedRef = useRef(false)
  useEffect(() => {
    const body = activityRef.current?.querySelector(".collapsible-content")
    if (!(body instanceof HTMLElement)) return
    const onScroll = () => {
      // Margen chico: el auto-scroll deja dist=0, así que seguir sigue solo.
      activityFollowRef.current = body.scrollHeight - body.scrollTop - body.clientHeight <= 24
    }
    const onDown = () => { activityTouchedRef.current = true }
    const onUp = () => { activityTouchedRef.current = false }
    const onFocusIn = () => { activityTouchedRef.current = true }
    const onFocusOut = () => { activityTouchedRef.current = false }
    onScroll()
    body.addEventListener("scroll", onScroll, { passive: true })
    body.addEventListener("pointerdown", onDown, { passive: true })
    // pointerup/pointercancel en window: con mouse, soltar fuera del cuerpo no
    // emite el evento en el body y el flag quedaría pegado (la caja dejaría de
    // seguir el resto del turno).
    window.addEventListener("pointerup", onUp, { passive: true })
    window.addEventListener("pointercancel", onUp, { passive: true })
    body.addEventListener("focusin", onFocusIn)
    body.addEventListener("focusout", onFocusOut)
    return () => {
      body.removeEventListener("scroll", onScroll)
      body.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      body.removeEventListener("focusin", onFocusIn)
      body.removeEventListener("focusout", onFocusOut)
    }
  }, [activityOpen])
  // Firma del contenido (pensamiento creciendo / tools apareciendo / textos
  // intermedios llegando): mientras el turno está en curso, la caja baja sola
  // al último renglón — pero solo si el usuario no scrolleó hacia arriba
  // (activityFollowRef) ni la está tocando (activityTouchedRef). Los textos
  // intermedios cuentan: son el contenido que más crece durante el turno.
  const activityTick = useMemo(() => activity
    ? `${activity.toolParts.length}:${activity.thinkingParts.reduce((n, p) => n + (p.text?.length ?? 0), 0)}:${activity.intermediateTexts.reduce((n, t) => n + (t.text?.length ?? 0), 0)}:${activity.toolParts.filter((tp) => !tp.state?.status || tp.state?.status === "running" || tp.state?.status === "pending").length}`
    : "", [activity])
  useEffect(() => {
    if (!activityWorking || !activityOpen) return
    if (!activityFollowRef.current || activityTouchedRef.current) return
    const body = activityRef.current?.querySelector(".collapsible-content")
    if (body instanceof HTMLElement) body.scrollTop = body.scrollHeight
  }, [activityTick, activityWorking, activityOpen])

  const handleConfirmUndo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowConfirm(false)
    if (isUserMessage(message) && onRevertToMessage) {
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

  // Intercalado real de parts: si hay segments, el texto y los tools se
  // renderizan en su orden original en el cuerpo (y no en el bloque de
  // actividad). El catálogo y la compactación conservan su layout propio.
  // Texto de la tarjeta de aviso: normalmente message.text, pero si algún
  // camino lo dejó vacío y los parts siguen intactos se reconstruye desde
  // ellos — expandir nunca debe mostrar vacío.
  const noticeText = message.noticeKind
    ? (message.text ||
      message.parts
        .filter((p) => p.type === "text" || p.type === "compaction" || p.type === "reasoning" || p.type === "thinking" || p.type === undefined)
        .map((p) => p.text ?? "")
        .join("\n\n")
        .trim())
    : ""
  const hasSegments = !isCompaction && !message.isToolCatalog && (message.segments?.length ?? 0) > 0

  // Imagenes renderizables del mensaje: getPartImageData decodifica data URLs y
  // es puro, asi que se calcula una sola vez por cambio de parts (antes se
  // llamaba 2-3 veces por part en cada render).
  const imageParts = useMemo(
    () => message.parts.flatMap((p) => {
      const src = getPartImageData(p)
      return src ? [{ id: p.id, src }] : []
    }),
    [message.parts],
  )

  // Absorbido por la caja del turno: si no le queda nada propio que mostrar
  // (ni texto, ni error, ni aviso, ni imágenes, ni footer, ni punto de
  // revert), no se monta el <article> vacío — era el hueco fantasma de ~8px +
  // margen entre mensajes.
  if (absorbActivity && !isRevertPoint && !showConfirm && !lightboxSrc && !outbox && !message.info.error && !message.hasCompaction && !(message.noticeKind && noticeText) && !(message.text?.trim()) && imageParts.length === 0 && !(isAssistant && showModelInfo && ((message.turnMode || message.info.mode) || message.info.modelID || duration || tokensPerSecond || message.info.finish === "aborted"))) {
    return null
  }

  return (
    <>
      {isRevertPoint && (
        <div className="revert-separator">
          <UndoIcon size={12} />
          <span>{t('detail.reverted')}</span>
        </div>
      )}
      <article
        className={`message ${isCompaction ? "assistant compaction" : message.info.role} fade-in${isReverted ? " revert-hidden" : ""}${showConfirm ? " confirming-undo" : ""}${authorFrom ? " from-agent" : ""}${isOutbox ? " outbox-queued" : ""}${message.noticeKind ? " server-notice" : ""}`}
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
        {isUserMessage(message) && !isOutbox && (
          <header>
            <span className="message-title-group">
              {queued && (
                <span className="msg-queued-badge" data-queued>{t('session.queued')}</span>
              )}
              {authorFrom && (
                <span className="msg-from-badge" title={authorFrom}>{t('chat.fromAgent', { name: authorFrom })}</span>
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
          if (!activity) return null
          const hasThinking = activity.thinkingParts.length > 0
          const hasTools = activity.toolParts.length > 0
          const hasDiffs = activity.summaryDiffs.length > 0
          const hasTexts = activity.intermediateTexts.length > 0
          // Sin nada que agrupar no hay caja (la compactación pura tiene su
          // propia tarjeta estilada más abajo).
          if (!hasThinking && !hasTools && !hasDiffs && !hasTexts) return null

          // Pensamiento acoplado adentro de la caja: una línea ("Pensó 12s" o
          // "Pensando…") que se despliega a mano. Solo arranca abierto si el
          // usuario lo pidió en ajustes (thinkingDefault "expanded").
          const thinkingEl = hasThinking ? (
            <div className="thinking-block">
              <ThinkingBlock
                key={thinkingDefault}
                parts={activity.thinkingParts}
                defaultOpen={thinkingDefault === "expanded"}
              />
            </div>
          ) : null

          // Actividad POR COMPONENTE (25-sep): cada fila resume lo que hizo un
          // componente (agente principal o subagente) y al desacoplarla muestra
          // TODO su detalle. Las tarjetas de subagente no van acá: se pintan
          // fuera de la caja (abajo), en el chat.
          const activityParts = hasTools ? splitActivityByComponent(activity.toolParts) : null

          const toolsEl = activityParts && activityParts.components.length > 0 ? (
            <div className="turn-components">
              {activityParts.components.map((c) => (
                <CollapsibleSection
                  key={c.key}
                  className="turn-component"
                  // El principal no lleva etiqueta: la caja ya se titula
                  // "Working" y una fila que diga "main" no aporta nada. Su fila
                  // ES el resumen; la de un subagente, su nombre + su resumen.
                  title={
                    <span className="turn-component-head">
                      {c.label ? <span className="turn-component-title">{c.label}</span> : null}
                      <span className="turn-component-summary">{c.summary}</span>
                    </span>
                  }
                  defaultOpen={false}
                >
                  <div className="tool-parts">
                    {c.parts.map((tp) => (
                      <ToolPart
                        key={tp.id}
                        part={tp}
                        config={config}
                        directory={directory}
                        sessionID={message.info.sessionID}
                        compact={compactTools || message.dataMode === "ultra" || message.dataMode === "miser"}
                      />
                    ))}
                  </div>
                </CollapsibleSection>
              ))}
            </div>
          ) : null

          // Tarjetas de subagente: AFUERA de la caja, en el chat, con el mismo
          // tamaño que una tool pero en gris y sin icono (pedido 25-sep).
          const subagentsEl = activityParts && activityParts.subagentParts.length > 0 ? (
            <div className="subagent-rows">
              {activityParts.subagentParts.map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  className="tool-part subagent-row"
                  onClick={() => {
                    const child = subagentBackground(tp).childSessionID
                    if (child) onViewSubagents?.(child)
                  }}
                  title={subagentLabel(tp)}
                >
                  <span className="subagent-row-label">{subagentLabel(tp)}</span>
                </button>
              ))}
            </div>
          ) : null

          const diffsEl = hasDiffs ? (
            <FileDiffs diffs={activity.summaryDiffs} onOpenADEDiff={onOpenADEDiff} />
          ) : null

          // Título fijo de la caja (pedido explícito): siempre "Working", esté
          // el turno en curso o terminado. Mientras corre, el texto lleva el
          // shimmer `ldg-text-shimmer-wave` (porte de anim-lab) y sin ícono.
          const title = activity.working ? <ShimmerText text="Working" /> : "Working"
          const subtitle = null

          return (
            <>
            <div className={`activity-box activity-box-${activity.working ? "working" : "completed"}`} ref={activityRef}>
              <CollapsibleSection
                title={title}
                subtitle={subtitle}
                open={activityOpen}
                onToggle={() => setActivityOpen((v) => !v)}
                keepMounted
              >
                {thinkingEl}
                {toolsEl}
                {hasTexts && activity.intermediateTexts.map((it) => (
                  <div key={it.id} className="message-content activity-text">
                    <MarkdownWithEmbeds text={it.text} highlight={highlight} />
                  </div>
                ))}
                {diffsEl}
              </CollapsibleSection>
            </div>
            {subagentsEl}
            </>
          )
        })()
        }

        {(message.noticeKind && (noticeText || message.text)) ? (
          <div className="tool-catalog-card">
            <CollapsibleSection
              icon={<InfoIcon size={13} className="tool-catalog-icon" />}
              title={
                message.noticeKind === "skills" ? (
                  <span className="tool-catalog-title">
                    <span className="tool-catalog-verb">Skills</span>
                    <span className="tool-catalog-dot">·</span>
                    <span className="tool-catalog-target">{t('detail.noticeServer')}</span>
                  </span>
                ) : message.noticeKind === "shell" ? (
                  <span className="tool-catalog-title">
                    <span className="tool-catalog-verb">Shell</span>
                    <span className="tool-catalog-dot">·</span>
                    <span className="tool-catalog-target">{t('detail.outputServer')}</span>
                  </span>
                ) : (
                  <span className="tool-catalog-title">
                    <span className="tool-catalog-verb">Code Mode</span>
                    <span className="tool-catalog-dot">·</span>
                    <span className="tool-catalog-target">{t('detail.toolCatalog')}</span>
                  </span>
                )
              }
              defaultOpen={false}
            >
              <div className="tool-catalog-body">
                <pre className="tool-part-pre">{noticeText || message.text}</pre>
              </div>
            </CollapsibleSection>
          </div>
        ) : isCompaction && message.text ? (
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
                <MarkdownWithEmbeds text={message.text} highlight={highlight} />
              </div>
            )}
          </div>
        ) : subagentInfo ? (
          <div className="subagent-result-card">
            <div className="subagent-result-head">
              <ToolIcon size={13} />
              <span className="subagent-result-title">
                {t('toolpart.subagent')}
                {subagentInfo.tag.description || subagentInfo.agent ? ` · ${subagentInfo.tag.description || subagentInfo.agent}` : ""}
              </span>
              {subagentInfo.tag.state ? (
                <span className="subagent-result-state">{subagentInfo.tag.state}</span>
              ) : null}
              {subagentInfo.childID && onViewSubagents ? (
                <button
                  type="button"
                  className="btn-link subagent-result-open"
                  onClick={() => onViewSubagents(subagentInfo.childID)}
                >
                  {t('toolpart.viewSubagent')}
                </button>
              ) : null}
            </div>
            {message.text ? (
              <div className="message-content">
                <MarkdownWithEmbeds text={message.text} highlight={highlight} />
              </div>
            ) : null}
          </div>
        ) : userSubagentBlock !== null ? (
          /* Contenido de subagente acoplado (25-sep): alto máximo + scroll. */
          <div className="message-content subagent-attached">
            <MarkdownWithEmbeds text={userSubagentBlock} highlight={highlight} />
          </div>
        ) : activeOutbox ? (
          <div className="outbox-card">
            <button
              type="button"
              className="outbox-header"
              onClick={() => setOutboxCollapsed((c) => !c)}
              aria-expanded={!outboxCollapsed}
            >
              <div className="outbox-header-left">
                <span className="outbox-title">{t('detail.queuedTitle')}</span>
                <span className="outbox-count-badge">{outboxCount}</span>
                <span className="outbox-subtitle">{t('detail.queuedSubtitle')}</span>
              </div>
              <span
                className={`outbox-chevron-btn ${outboxCollapsed ? "is-collapsed" : ""}`}
                aria-hidden="true"
              >
                <ChevronDownIcon size={15} />
              </span>
            </button>
            {!outboxCollapsed && (
              <div className="outbox-body">
                <div className="outbox-content">
                  {message.text && (
                    <MarkdownWithEmbeds text={message.text} highlight={highlight} />
                  )}
                </div>
                <div className="outbox-actions" role="group" aria-label={t('detail.queuedTitle')}>
                  <button
                    type="button"
                    className="outbox-action-btn outbox-btn"
                    disabled={activeOutbox.disabled}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (activeOutbox.canAct && !activeOutbox.canAct()) return
                      activeOutbox.onSendNow()
                    }}
                    title={t('detail.queuedSend')}
                    aria-label={t('detail.queuedSend')}
                  >
                    <ArrowRightIcon size={14} />
                  </button>
                  <button
                    type="button"
                    className="outbox-action-btn outbox-btn"
                    disabled={activeOutbox.disabled}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (activeOutbox.canAct && !activeOutbox.canAct()) return
                      activeOutbox.onEdit()
                    }}
                    title={t('detail.queuedEdit')}
                    aria-label={t('detail.queuedEdit')}
                  >
                    <PencilIcon size={14} />
                  </button>
                  <button
                    type="button"
                    className="outbox-action-btn outbox-btn delete"
                    disabled={activeOutbox.disabled}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (activeOutbox.canAct && !activeOutbox.canAct()) return
                      activeOutbox.onDelete()
                    }}
                    title={t('detail.queuedRemove')}
                    aria-label={t('detail.queuedRemove')}
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : hasSegments ? (
          <div className="message-segments">
            {/* Solo textos: las herramientas viven en la caja de actividad. */}
            {message.segments!.filter((seg) => seg.kind === "text").map((seg) => (
              <div key={seg.id} className="message-content">
                {!message.info.time.completed && seg.text.length > 800 ? (
                  <pre className="md-plain-stream">{seg.text}</pre>
                ) : (
                  <MarkdownWithEmbeds text={seg.text} highlight={highlight} />
                )}
              </div>
            ))}
          </div>
        ) : message.text && (
          <div className="message-content">
            {!message.info.time.completed && message.text.length > 800 ? (
              <pre className="md-plain-stream">{message.text}</pre>
            ) : (
              <MarkdownWithEmbeds text={message.text} highlight={highlight} />
            )}
          </div>
        )}

        {message.info.error && (
          <div className="message-error" role="alert" title={message.info.error.message || undefined}>
            <strong>{message.info.error.name || "Server error"}</strong>
            {message.info.error.message && <span>{message.info.error.message}</span>}
          </div>
        )}

        <TranslationOriginal messageId={message.info.id} />

        {imageParts.map(({ id, src }) => (
          <div key={id} className="message-image-wrap">
            <img src={src} alt="" className="message-image" loading="lazy"
              tabIndex={0} title={t('image.expand')}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setLightboxSrc(src)
                }
              }}
              onClick={() => setLightboxSrc(src)} />
          </div>
        ))}

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
              <span className="msg-footer-tps" title={t('detail.tokensPerSecond')}>
                {" "}· {tokensPerSecond}
              </span>
            )}
            {message.info.finish === "aborted" && (
              <span className="msg-footer-interrupted"> · {t('detail.interrupted')}</span>
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

        {/* La caja de actividad ya trae el marcador adentro; esto solo aplica a
            mensajes sin nada que agrupar (compactación suelta). */}
        {!minimalistMode && message.hasCompaction && !isCompaction && <div className="compaction-checkpoint" />}
      </article>

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  )
})

export default MessageBubble
