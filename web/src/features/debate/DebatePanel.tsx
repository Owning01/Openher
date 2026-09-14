import { memo, useMemo, useState } from "react"
import type { ServerConfig } from "../../types"
import { useDebateLive, type DebateTurn } from "./useDebateLive"

/**
 * Sala de debate en vivo, al costado de una sesión o desacoplada.
 *
 * Se abre como tab del grid (`plugin:debate:room`) o embebida en cualquier
 * slot. Los turnos llegan por `pluginBus` en tiempo real (SSE del server).
 */

const ROLE_COLORS: Record<string, string> = {
  architect: "#6ea8fe",
  pragmatist: "#59d4a0",
  adversary: "#f2777a",
  arbiter: "#e0b15e",
}

const colorOf = (role: string) => ROLE_COLORS[role] ?? "#a78bfa"
const initials = (role: string) => role.slice(0, 2).toUpperCase()

function Bubble({ turn }: { turn: DebateTurn }) {
  const c = colorOf(turn.role)
  const consensus = turn.status === "CONSENSUS_READY"
  const dissent = turn.status === "DISSENTING"
  return (
    <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
      <div
        style={{
          width: 34,
          height: 34,
          flex: "0 0 34px",
          borderRadius: "50%",
          background: c,
          color: "#0b0d12",
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        {initials(turn.role)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
          <b style={{ color: "var(--fg)" }}>{turn.role}</b>
          <span
            style={{
              fontSize: 10,
              letterSpacing: ".06em",
              padding: "1px 7px",
              borderRadius: 999,
              border: `1px solid ${consensus ? "#1f5a44" : dissent ? "#5a2325" : "var(--border)"}`,
              color: consensus ? "#59d4a0" : dissent ? "#f2777a" : "var(--muted)",
              background: consensus ? "#0e2a20" : dissent ? "#2a1214" : "transparent",
            }}
          >
            {consensus ? "CONSENSO" : dissent ? "DISIENTE" : "—"}
          </span>
          <span style={{ opacity: 0.7 }}>#{turn.index}</span>
        </div>
        {turn.repliesTo ? <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>↳ responde a <b>{turn.repliesTo}</b></div> : null}
        <div style={{ border: "1px solid var(--border)", borderLeft: `3px solid ${c}`, background: "var(--panel)", borderRadius: 10, padding: "10px 12px", fontSize: 13, whiteSpace: "pre-wrap" }}>
          {turn.body}
        </div>
        {turn.blockingIssues && turn.blockingIssues.length > 0 ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {turn.blockingIssues.map((issue, i) => (
              <span key={i} style={{ fontSize: 11, color: "#f2b8b8", background: "#2a1416", border: "1px solid #5a2325", borderRadius: 999, padding: "1px 9px" }}>
                {issue}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export const DebatePanel = memo(function DebatePanel({ config }: { config: ServerConfig | null }) {
  const { debates, active, activeID, setActiveID, start, stop, error } = useDebateLive(config)
  const [topic, setTopic] = useState("")
  const [cache, setCache] = useState<"shared" | "isolated">("shared")
  const ids = useMemo(() => Object.keys(debates), [debates])

  const onStart = () => {
    const value = topic.trim()
    if (!value) return
    void start(value, cache)
    setTopic("")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", gap: 8, padding: "8px 10px", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onStart()}
          placeholder="Tema del debate…"
          style={{ flex: 1, minWidth: 0, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", color: "var(--fg)", fontSize: 13 }}
        />
        <select
          value={cache}
          onChange={(e) => setCache(e.target.value as "shared" | "isolated")}
          title="Motor de caché"
          style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 8px", color: "var(--fg)", fontSize: 12 }}
        >
          <option value="shared">shared</option>
          <option value="isolated">isolated</option>
        </select>
        <button type="button" className="btn-primary compact" onClick={onStart} disabled={!topic.trim()}>
          Debatir
        </button>
        {active?.running ? (
          <button type="button" className="btn-icon compact" title="Detener" onClick={() => activeID && stop(activeID)}>
            ■
          </button>
        ) : null}
      </div>

      {ids.length > 1 ? (
        <div style={{ display: "flex", gap: 6, padding: "6px 10px", overflowX: "auto", borderBottom: "1px solid var(--border)" }}>
          {ids.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveID(id)}
              className={`chip${id === activeID ? " active" : ""}`}
              style={{ fontSize: 11, whiteSpace: "nowrap" }}
            >
              {debates[id].topic || id}
            </button>
          ))}
        </div>
      ) : null}

      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "4px 12px 16px" }}>
        {error ? <div style={{ color: "var(--danger, #ef4444)", fontSize: 12, padding: 8 }}>{error}</div> : null}
        {!active ? (
          <div style={{ color: "var(--muted)", fontSize: 13, padding: 16 }}>
            Escribí un tema y presioná <b>Debatir</b>. Los turnos aparecen acá en vivo (architect / pragmatist / adversary + árbitro).
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "8px 0" }}>
              <span className="pill" style={{ fontSize: 11 }}>caché: {active.cache}</span>
              <span className="pill" style={{ fontSize: 11 }}>
                {active.running ? "en curso" : active.consensus ? "consenso alcanzado" : "sin consenso"}
              </span>
              <span className="pill" style={{ fontSize: 11 }}>{active.turns.length} turnos</span>
            </div>
            {active.turns.map((turn) => (
              <Bubble key={`${turn.index}-${turn.role}`} turn={turn} />
            ))}
            {active.acta ? (
              <>
                <h3 style={{ fontSize: 14, margin: "18px 0 8px" }}>Acta — árbitro</h3>
                <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 14, background: "var(--panel)", whiteSpace: "pre-wrap", fontSize: 13 }}>
                  {active.acta}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
})
