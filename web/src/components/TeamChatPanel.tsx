import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { loadTeamLog, type TeamMessage } from "../api/team"
import "../styles/team.css"

// Panel "Equipo": bitacora del relevo entre agentes (team-send) en estilo
// chat, sin fondo (solo globitos). Solo lectura; se refresca sola.
// Strings en español a proposito: i18n/en.ts + es.ts estan en WIP de otro
// agente (regla 1); al aterrizar ese WIP se mueven a t().

type SessionRef = { id: string; title?: string }

const T = {
  title: "Equipo",
  empty: "Todavia no hay mensajes entre agentes.",
  error: "No se pudo leer la bitacora del equipo.",
  retry: "Reintentar",
  refresh: "Recargar",
  stale: "No se pudo actualizar; se muestran los ultimos datos",
  loading: "Cargando…",
  readOnly: "team-send · solo lectura",
  feedLabel: "Mensajes entre agentes",
}

const PALETTE = ["#b18cff", "#5ad1a8", "#f2b955", "#5aa9f2", "#f286c1", "#7fd4c1", "#e6a06b", "#9aa4b2"]

/** Normaliza nombres de agente: "anim-lab" y "AnimLAB" son el mismo. */
function normName(s: string): string {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")
}

function colorFor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

function initials(name: string): string {
  const parts = name.trim().split(/[\s_-]+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function dayLabel(ts: number): string {
  const today = startOfDay(Date.now())
  const day = startOfDay(ts)
  if (day === today) return "Hoy"
  if (day === today - 86_400_000) return "Ayer"
  return new Date(ts).toLocaleDateString("es", { day: "2-digit", month: "short" })
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
}

const TICK = (
  <svg className="team-chat-tick" viewBox="0 0 16 11" aria-hidden="true">
    <path d="M1 6.2 3.8 9 9.2 1.6" />
    <path d="M6.4 6.2 9.2 9 15 1.6" />
  </svg>
)

export function TeamChatPanel({
  sessions,
  meId,
  className,
}: {
  sessions?: SessionRef[]
  meId?: string | null
  className?: string
}) {
  const [messages, setMessages] = useState<TeamMessage[] | null>(null)
  const [error, setError] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)
  const seqRef = useRef(0)
  const sigRef = useRef("")

  const refresh = useCallback(async () => {
    const seq = ++seqRef.current
    try {
      const list = await loadTeamLog()
      if (seq !== seqRef.current) return // respuesta vieja: descartar
      const sig = `${list.length}:${list[list.length - 1]?.ts ?? 0}`
      if (sig !== sigRef.current) {
        sigRef.current = sig
        setMessages(list)
      }
      setError(false)
    } catch {
      if (seq === seqRef.current) setError(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
    // Sin polls en segundo plano: el feed solo se actualiza si la ventana se ve.
    const id = setInterval(() => {
      if (!document.hidden) void refresh()
    }, 5000)
    return () => clearInterval(id)
  }, [refresh])

  const titleOf = useCallback(
    (id: string) => (sessions ?? []).find((s) => s.id === id)?.title || id.slice(-6),
    [sessions]
  )
  const meName = useMemo(() => {
    const title = (sessions ?? []).find((s) => s.id === meId)?.title
    return title ? normName(title) : null
  }, [sessions, meId])

  const count = messages?.length ?? 0

  useEffect(() => {
    if (atBottomRef.current && feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [count])

  const rows = useMemo(() => {
    const out: Array<{ key: string; msg: TeamMessage; day: string; first: boolean; last: boolean; isOut: boolean }> = []
    const list = messages ?? []
    for (let i = 0; i < list.length; i++) {
      const m = list[i]
      const prev = list[i - 1]
      const next = list[i + 1]
      const grouped = !!prev && prev.from === m.from && prev.to === m.to
      const last = !next || next.from !== m.from || next.to !== m.to
      out.push({
        key: `${m.ts}|${m.from}|${m.text.slice(0, 16)}`,
        msg: m,
        day: dayLabel(m.ts),
        first: !grouped,
        last,
        isOut: !!meName && normName(m.from) === meName,
      })
    }
    return out
  }, [messages, meName])

  const onScroll = useCallback(() => {
    const el = feedRef.current
    if (!el) return
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  }, [])

  const stale = error && messages !== null

  return (
    <div className={`team-chat${className ? " " + className : ""}`} data-testid="team-chat">
      <div className="team-chat-head">
        <span className="team-chat-title">
          {T.title}
          {count > 0 && <span className="team-chat-badge">{count}</span>}
        </span>
        <button
          type="button"
          className={`team-chat-btn${stale ? " is-stale" : ""}`}
          title={stale ? T.stale : T.refresh}
          aria-label={stale ? T.stale : T.refresh}
          onClick={() => void refresh()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-2.6-6.4" />
            <path d="M21 3v6h-6" />
          </svg>
        </button>
      </div>

      <div
        className="team-chat-feed"
        ref={feedRef}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-label={T.feedLabel}
        tabIndex={0}
      >
        {error && messages === null ? (
          <div className="team-chat-state is-error">
            <div>{T.error}</div>
            <button type="button" className="btn-secondary compact team-chat-retry" onClick={() => void refresh()}>
              {T.retry}
            </button>
          </div>
        ) : messages === null ? (
          <div className="team-chat-state">{T.loading}</div>
        ) : messages.length === 0 ? (
          <div className="team-chat-state">{T.empty}</div>
        ) : (
          rows.map(({ key, msg, day, first, last, isOut }, i) => {
            const showDay = i === 0 || rows[i - 1].day !== day
            const color = colorFor(msg.from)
            return (
              <div key={key}>
                {showDay && (
                  <div className="team-chat-day">
                    <span>{day}</span>
                  </div>
                )}
                <div
                  className={
                    "team-chat-row" +
                    (isOut ? " is-out" : "") +
                    (first ? " is-first" : "") +
                    (last ? " is-last" : "") +
                    (!first ? " is-spacer" : "")
                  }
                >
                  <div className="team-chat-av" style={{ background: color }} aria-hidden="true">
                    {initials(msg.from)}
                  </div>
                  <div className="team-chat-stack">
                    <div className="team-chat-bubble">
                      {!isOut && first && (
                        <div className="team-chat-who" style={{ color }}>
                          {msg.from}
                          <span className="team-chat-to">a {titleOf(msg.to)}</span>
                        </div>
                      )}
                      {isOut && first && <div className="team-chat-who team-chat-to">a {titleOf(msg.to)}</div>}
                      <div className="team-chat-text">
                        {msg.text}
                        <span className="team-chat-meta">
                          {fmtTime(msg.ts)}
                          {isOut && TICK}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="team-chat-foot">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 9h10M7 13h6" />
        </svg>
        {T.readOnly}
      </div>
    </div>
  )
}
