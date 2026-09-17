import { memo, useEffect, useRef, useState } from "react"
import type { ServerConfig } from "../../types"
import { useT } from "../../i18n-context"
import { ChatIcon, CheckIcon, CloseIcon, HistoryIcon, PlayIcon, SendIcon, StopCircleIcon } from "../../Icons"
import { Markdown } from "../../components/Markdown"
import type { DebateMessage, DebateState, TeamTimelineItem } from "./debateStore"
import {
  fetchDebateHistory,
  fetchTeamTimeline,
  getDebate,
  hydrateDebateFromFile,
  rehydrateSessionDebates,
  sendDebateControl,
  sendDebateIntervene,
  useActiveDebate,
  useDebatesForSession,
  type DebateHistoryItem,
} from "./debateStore"
import "../../styles/debate.css"

/**
 * Sala de debate por sesión (DEBATE.md §8): drawer en desktop / bottom sheet
 * en mobile. Burbujas estilo WhatsApp, barra de consenso, acta con minorías,
 * timeline simple, input Intervenir + pausa/stop. Los eventos llegan solos
 * vía el store (pluginBus); al abrir se rehidrata con RPC `debate/state`.
 */

const ROLE_COLORS: Record<string, string> = {
  architect: "#6ea8fe",
  pragmatist: "#59d4a0",
  adversary: "#f2777a",
  arbiter: "#e0b15e",
  human: "#58a6ff",
}

function colorOf(role: string): string {
  const hit = ROLE_COLORS[role.toLowerCase()]
  if (hit) return hit
  let h = 0
  for (let i = 0; i < role.length; i++) h = (h * 31 + role.charCodeAt(i)) >>> 0
  return `hsl(${h % 360} 60% 65%)`
}

function initialsOf(role: string): string {
  const clean = role.replace(/^[^a-z0-9]+/i, "")
  return (clean.slice(0, 2) || "?").toUpperCase()
}

function timeOf(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

function fmtElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "–"
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, "0")}`
}

function tokensOf(m: DebateMessage): number {
  return (m.tokensInEst ?? 0) + (m.tokensOutEst ?? 0)
}

function PauseGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="pause">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}

const Bubble = memo(function Bubble({ msg }: { msg: DebateMessage }) {
  const t = useT()
  const c = colorOf(msg.role)
  const mine = msg.kind === "user"
  const consensus = msg.status === "CONSENSUS_READY" || msg.status === "CONSENSUS"
  const dissent = msg.status === "DISSENTING" || msg.status === "DISSENT"
  const tokens = tokensOf(msg)
  return (
    <div className={`debate-msg${mine ? " mine" : ""}`}>
      {!mine ? (
        <div className="debate-avatar" style={{ background: c }} aria-hidden="true">
          {initialsOf(msg.role)}
        </div>
      ) : null}
      <div className="debate-bubble" style={{ borderLeftColor: c }}>
        <div className="debate-meta">
          <b className="debate-role" style={{ color: c }}>
            {mine ? t("debate.you") : msg.role}
          </b>
          {consensus ? <span className="debate-flag ok">{t("debate.consensusReady")}</span> : null}
          {dissent ? <span className="debate-flag no">{t("debate.dissenting")}</span> : null}
          {typeof msg.confidence === "number" ? (
            <span className="debate-flag dim">{t("debate.confidence", { pct: String(msg.confidence) })}</span>
          ) : null}
          <span className="debate-time">{timeOf(msg.ts)}</span>
        </div>
        {msg.repliesTo ? (
          <div className="debate-reply">{t("debate.repliesTo", { role: msg.repliesTo })}</div>
        ) : null}
        <div className="debate-body message-content"><Markdown text={msg.body} /></div>
        {msg.blockingIssues.length > 0 ? (
          <div className="debate-issues">
            {msg.blockingIssues.map((issue, i) => (
              <span key={i} className="debate-issue">
                {issue}
              </span>
            ))}
          </div>
        ) : null}
        {tokens > 0 ? <div className="debate-tokens">{t("debate.tokensEst", { count: String(tokens) })}</div> : null}
      </div>
    </div>
  )
})

export type DebateRoomProps = {
  config: ServerConfig | null
  originSessionID: string
  onClose?: () => void
  /** Equipo a mostrar (solo lectura, reutiliza el timeline). Opcional. */
  teamID?: string | null
}

export const DebateRoom = memo(function DebateRoom({ config, originSessionID, onClose, teamID }: DebateRoomProps) {
  const t = useT()
  const active = useActiveDebate(originSessionID)
  const all = useDebatesForSession(originSessionID)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [busyControl, setBusyControl] = useState(false)
  /** Rebobinar (solo lectura): muestra el canal hasta este seq. null = en vivo. */
  const [rewindSeq, setRewindSeq] = useState<number | null>(null)
  /** Ver un debate pasado del historial (origen + id reales, no se falsifica). */
  const [viewed, setViewed] = useState<{ origin: string; id: string } | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyItems, setHistoryItems] = useState<DebateHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [teamTimeline, setTeamTimeline] = useState<TeamTimelineItem[]>([])
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    void rehydrateSessionDebates(config, originSessionID)
  }, [config, originSessionID])

  useEffect(() => {
    setRewindSeq(null)
    setViewed(null)
  }, [active?.debateID])

  const viewedDebate = viewed ? getDebate(viewed.origin, viewed.id) : null
  // En vivo = debate activo de esta sesión; si se está viendo uno pasado,
  // se muestra ese (solo lectura).
  const shown = viewedDebate ?? active
  const isPast = !!viewedDebate && viewedDebate.debateID !== active?.debateID
  const directory = active?.directory ?? viewedDebate?.directory ?? all.find((d) => d.directory)?.directory

  useEffect(() => {
    let alive = true
    if (!teamID) {
      setTeamTimeline([])
      return () => {
        alive = false
      }
    }
    void fetchTeamTimeline(config, teamID).then((items) => {
      if (alive) setTeamTimeline(items)
    })
    return () => {
      alive = false
    }
  }, [config, teamID])

  const msgCount = shown?.messages.length ?? 0
  const actaText = shown?.acta?.text ?? ""
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgCount, actaText, shown?.debateID])

  const maxSeq = shown?.maxSeq ?? 0
  const live = rewindSeq === null || rewindSeq >= maxSeq
  const visibleMessages = !shown || live ? (shown?.messages ?? []) : shown.messages.filter((m) => m.seq <= (rewindSeq ?? 0))
  const visibleActa = shown?.acta && (live || shown.acta.seq <= (rewindSeq ?? 0)) ? shown.acta : null

  const openHistory = async () => {
    if (historyOpen) {
      setHistoryOpen(false)
      return
    }
    setHistoryOpen(true)
    if (!directory || historyItems.length > 0) return
    setHistoryLoading(true)
    try {
      setHistoryItems(await fetchDebateHistory(directory))
    } finally {
      setHistoryLoading(false)
    }
  }

  const viewPast = async (item: DebateHistoryItem) => {
    setHistoryOpen(false)
    const known = getDebate(item.originSessionID, item.debateID)
    if (!known && directory) {
      await hydrateDebateFromFile(directory, item.debateID)
    }
    const after = getDebate(item.originSessionID, item.debateID)
    if (after) {
      setViewed({ origin: item.originSessionID, id: item.debateID })
      setRewindSeq(null)
    }
  }

  const onSend = async () => {
    const value = draft.trim()
    if (!active || !value || sending) return
    setSending(true)
    try {
      await sendDebateIntervene(config, active.debateID, value)
      setDraft("")
    } finally {
      setSending(false)
    }
  }

  const onControl = async (action: "pause" | "resume" | "stop") => {
    if (!active || busyControl) return
    setBusyControl(true)
    try {
      await sendDebateControl(config, originSessionID, active.debateID, action)
    } finally {
      setBusyControl(false)
    }
  }

  return (
    <div className="debate-room" role="dialog" aria-label={t("debate.title")}>
      <RoomHeader debate={shown} onClose={onClose} onHistory={directory ? openHistory : undefined} historyOpen={historyOpen} />
      {isPast ? (
        <button type="button" className="debate-backlive" onClick={() => setViewed(null)}>
          {t("debate.viewingPast")} · {t("debate.backToLive")}
        </button>
      ) : null}
      {historyOpen ? (
        <HistoryPanel
          loading={historyLoading}
          items={historyItems}
          currentID={shown?.debateID}
          onPick={(item) => void viewPast(item)}
          onClose={() => setHistoryOpen(false)}
        />
      ) : null}
      {!shown ? (
        <div className="debate-empty">
          <ChatIcon size={22} />
          <p>{t("debate.noDebate")}</p>
        </div>
      ) : (
        <>
          <ConsensusBar debate={shown} />
          {maxSeq > 1 ? (
            <div className="debate-rewind">
              <input
                type="range"
                min={1}
                max={maxSeq}
                value={live ? maxSeq : (rewindSeq ?? maxSeq)}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setRewindSeq(v >= maxSeq ? null : v)
                }}
                aria-label={t("debate.rewind")}
              />
              {!live ? <span className="debate-pill warn">{t("debate.rewind")} · seq {rewindSeq}</span> : null}
            </div>
          ) : null}
          <div className="debate-list" ref={listRef}>
            {visibleMessages.length === 0 ? (
              <div className="debate-empty">
                <p>{t("debate.empty")}</p>
              </div>
            ) : (
              visibleMessages.map((m) => <Bubble key={`${m.seq}`} msg={m} />)
            )}
            {shown.running && !shown.paused && live && !isPast ? (
              <div className="debate-typing" aria-live="polite">
                <span className="debate-typing-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>{t("debate.typing")}</span>
              </div>
            ) : null}
            {visibleActa ? <ActaBlock debate={{ ...shown, acta: visibleActa }} /> : null}
            {shown.error ? <div className="debate-error">{shown.error}</div> : null}
            <Timeline debate={shown} team={teamTimeline} />
          </div>
          {isPast ? null : (
          <div className="debate-footer">
            <div className="debate-controls">
              {shown.paused ? (
                <button type="button" className="btn-icon compact" title={t("debate.resume")} aria-label={t("debate.resume")} disabled={busyControl} onClick={() => void onControl("resume")}>
                  <PlayIcon size={14} />
                </button>
              ) : (
                <button type="button" className="btn-icon compact" title={t("debate.pause")} aria-label={t("debate.pause")} disabled={busyControl || !shown.running} onClick={() => void onControl("pause")}>
                  <PauseGlyph />
                </button>
              )}
              <button type="button" className="btn-icon compact" title={t("debate.stop")} aria-label={t("debate.stop")} disabled={busyControl || !shown.running} onClick={() => void onControl("stop")}>
                <StopCircleIcon size={14} />
              </button>
            </div>
            <input
              className="debate-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  void onSend()
                }
              }}
              placeholder={t("debate.intervenePlaceholder")}
              aria-label={t("debate.send")}
              maxLength={2000}
            />
            <button type="button" className="btn-primary compact" disabled={!draft.trim() || sending} onClick={() => void onSend()}>
              <SendIcon size={14} />
              <span>{t("debate.send")}</span>
            </button>
          </div>
          )}
        </>
      )}
    </div>
  )
})

const HistoryPanel = memo(function HistoryPanel({
  loading,
  items,
  currentID,
  onPick,
  onClose,
}: {
  loading: boolean
  items: DebateHistoryItem[]
  currentID?: string
  onPick: (item: DebateHistoryItem) => void
  onClose: () => void
}) {
  const t = useT()
  return (
    <div className="debate-history" role="dialog" aria-label={t("debate.history")}>
      <div className="debate-history-head">
        <HistoryIcon size={13} />
        <b>{t("debate.history")}</b>
        <button type="button" className="btn-icon compact" title={t("debate.close")} aria-label={t("debate.close")} onClick={onClose}>
          <CloseIcon size={13} />
        </button>
      </div>
      {loading ? (
        <div className="debate-typing"><span>{t("debate.typing")}</span></div>
      ) : items.length === 0 ? (
        <p className="debate-history-empty">{t("debate.historyEmpty")}</p>
      ) : (
        <ul className="debate-history-list">
          {items.map((item) => (
            <li key={item.debateID}>
              <button
                type="button"
                className={`debate-history-item${item.debateID === currentID ? " current" : ""}`}
                onClick={() => onPick(item)}
              >
                <span className="debate-history-topic">{item.topic || item.debateID}</span>
                <span className="debate-history-meta">
                  {item.ts > 0 ? new Date(item.ts).toLocaleString([], { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
                  {` · ${item.turns} turnos`}
                  {item.consensus === true ? ` · ${t("debate.consensusYes")}` : item.consensus === false ? ` · ${t("debate.consensusNo")}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})

const RoomHeader = memo(function RoomHeader({ debate, onClose, onHistory, historyOpen }: { debate: DebateState | null; onClose?: () => void; onHistory?: () => void; historyOpen?: boolean }) {
  const t = useT()
  const stateKey = !debate ? "" : debate.running ? (debate.paused ? "debate.paused" : "debate.live") : "debate.finished"
  return (
    <div className="debate-header">
      <div className="debate-title" title={debate?.topic || debate?.debateID || ""}>
        {debate?.running ? <span className="debate-dot" aria-hidden="true" /> : null}
        <b>{t("debate.title")}</b>
        {debate?.topic ? <span className="debate-topic">{debate.topic}</span> : null}
      </div>
      <div className="debate-header-right">
        {debate ? <span className="debate-pill">{debate.engine}</span> : null}
        {stateKey ? <span className="debate-pill">{t(stateKey)}</span> : null}
        {onHistory ? (
          <button type="button" className={`btn-icon compact${historyOpen ? " active" : ""}`} title={t("debate.history")} aria-label={t("debate.history")} onClick={onHistory}>
            <HistoryIcon size={14} />
          </button>
        ) : null}
        {onClose ? (
          <button type="button" className="btn-icon compact" title={t("debate.close")} aria-label={t("debate.close")} onClick={onClose}>
            <CloseIcon size={14} />
          </button>
        ) : null}
      </div>
    </div>
  )
})

const ConsensusBar = memo(function ConsensusBar({ debate }: { debate: DebateState }) {
  const t = useT()
  const pct = Math.max(0, Math.min(100, Math.round(debate.status.consensusPct)))
  const turns = debate.status.turns > 0 ? debate.status.turns : debate.messages.length
  const totalTokens = debate.messages.reduce((acc, m) => acc + tokensOf(m), 0)
  const first = debate.messages[0]?.ts
  const last = debate.messages[debate.messages.length - 1]?.ts ?? first
  const elapsed = first !== undefined && last !== undefined ? fmtElapsed(last - first) : "–"
  return (
    <div className="debate-bar">
      <div className="debate-bar-top">
        <span className="debate-bar-label">{t("debate.consensusLabel")}</span>
        <b>{pct}%</b>
      </div>
      <div className="debate-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="debate-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="debate-bar-meta">
        <span className="debate-pill">{t("debate.turnsCount", { count: String(turns) })}</span>
        {debate.status.stalled ? <span className="debate-pill warn">{t("debate.stalled")}</span> : null}
        {debate.paused ? <span className="debate-pill warn">{t("debate.paused")}</span> : null}
        {debate.status.budgetUsedPct !== undefined ? (
          <span className="debate-pill">{t("debate.budget", { pct: String(Math.round(debate.status.budgetUsedPct)) })}</span>
        ) : null}
        {totalTokens > 0 ? <span className="debate-pill">{t("debate.tokensEst", { count: String(totalTokens) })}</span> : null}
        <span className="debate-pill">{t("debate.elapsed", { time: elapsed })}</span>
      </div>
    </div>
  )
})

const ActaBlock = memo(function ActaBlock({ debate }: { debate: DebateState }) {
  const t = useT()
  const acta = debate.acta
  if (!acta) return null
  return (
    <section className="debate-acta" aria-label={t("debate.actaTitle")}>
      <div className="debate-acta-head">
        <CheckIcon size={14} />
        <b>{t("debate.actaTitle")}</b>
        <span className={`debate-flag${acta.consensus ? " ok" : " no"}`}>
          {acta.consensus ? t("debate.consensusYes") : t("debate.consensusNo")}
        </span>
        {typeof acta.confidence === "number" ? (
          <span className="debate-flag dim">{t("debate.actaConfidence", { pct: String(acta.confidence) })}</span>
        ) : null}
      </div>
      <div className="debate-body message-content"><Markdown text={acta.text} /></div>
      {acta.minorities.length > 0 ? (
        <div className="debate-minorities">
          <span className="debate-minorities-label">{t("debate.minorities")}</span>
          {acta.minorities.map((m, i) => (
            <div key={i} className="debate-minority message-content">
              <Markdown text={m} />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
})

const Timeline = memo(function Timeline({ debate, team }: { debate: DebateState; team: TeamTimelineItem[] }) {
  const t = useT()
  const items: Array<{ key: string; label: string; ts?: number; team?: boolean }> = [
    { key: "start", label: t("debate.tlStart"), ts: debate.messages[0]?.ts },
  ]
  for (const m of debate.messages) {
    if (m.kind === "user") items.push({ key: `i-${m.seq}`, label: `${t("debate.tlIntervention")}: ${m.body.slice(0, 80)}`, ts: m.ts })
  }
  if (typeof debate.status.stalls === "number" && debate.status.stalls > 0) {
    items.push({ key: "stalls", label: `${t("debate.tlStall")}: ${debate.status.stalls}` })
  }
  if (debate.acta) items.push({ key: "acta", label: t("debate.tlActa"), ts: debate.acta.ts })
  if (debate.done) items.push({ key: "done", label: t("debate.tlDone", { reason: debate.done.reason }) })
  for (const e of team) {
    items.push({ key: `team-${e.seq}-${e.kind}`, label: `${t("debate.teamTimeline")}: ${e.label.slice(0, 100)}`, team: true })
  }
  if (items.length <= 1 && team.length === 0) return null
  return (
    <details className="debate-timeline">
      <summary>
        <HistoryIcon size={13} />
        <span>
          {t("debate.timeline")} · {items.length}
        </span>
      </summary>
      <ol>
        {items.map((it) => (
          <li key={it.key} className={it.team ? "debate-tl-team" : undefined}>
            <span className="debate-tl-label">{it.label}</span>
            {it.ts !== undefined ? <span className="debate-time">{timeOf(it.ts)}</span> : null}
          </li>
        ))}
      </ol>
    </details>
  )
})
