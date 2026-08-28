import { useEffect, useMemo, useState } from "react"
import { useT } from "../i18n-context"
import type { ServerConfig } from "../types"
import { useServerStats } from "../hooks/useServerStats"
import { RefreshIcon, LoadingIcon, ArrowLeftIcon } from "../Icons"

const TAB_SCOPE: Record<TabId, string> = {
  resumen: "summary",
  modelo: "modelo",
  proyecto: "proyecto",
  dia: "dia",
  mes: "mes",
  sesiones: "sesiones",
  limites: "limites",
}

type StatsViewProps = {
  config: ServerConfig
  onBack: () => void
}

type Col = {
  key: string
  label: string
  right?: boolean
  fmt?: (r: Record<string, unknown>) => string
  cls?: (r: Record<string, unknown>) => string
}

type TabId = "resumen" | "modelo" | "proyecto" | "dia" | "mes" | "sesiones" | "limites"

const TOKEN_CARDS: Array<{ key: string; label: string; color: string }> = [
  { key: "input", label: "Entrada (input)", color: "#3b82f6" },
  { key: "output", label: "Salida (output)", color: "var(--success)" },
  { key: "reasoning", label: "Razonamiento", color: "#f59e0b" },
  { key: "cache_read", label: "Cache leída", color: "#a855f7" },
  { key: "cache_write", label: "Cache escrita", color: "#06b6d4" }
]

const MODEL_COLORS = ["#3b82f6", "var(--success)", "#f59e0b", "#a855f7", "var(--danger)", "#06b6d4", "#84cc16", "#ec4899", "#eab308", "#64748b"]

function fmtTokens(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return String(Math.round(n))
}

function fmtCost(n: number): string {
  if (!Number.isFinite(n)) return "—"
  if (n >= 100) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
  if (n >= 1) return `$${n.toFixed(2)}`
  return `$${n.toFixed(4)}`
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US")
}

function str(v: unknown): string {
  return v == null ? "—" : String(v)
}

function quotaText(used: number, limit: number | null): string {
  return limit == null ? fmtNum(used) : `${fmtNum(used)} / ${fmtNum(limit)}`
}

function quotaCls(used: number, limit: number | null): string {
  if (limit == null) return ""
  if (used >= limit) return "stats-quota-out"
  if (used / limit >= 0.7) return "stats-quota-warn"
  return ""
}

const COLS: Record<string, Col[]> = {
  modelo: [
    { key: "model", label: "Modelo", right: false },
    { key: "sessions", label: "#Ses", right: true, fmt: (r) => fmtNum(Number(r.sessions)) },
    { key: "requests", label: "Pet.", right: true, fmt: (r) => fmtNum(Number(r.requests ?? 0)) },
    { key: "input", label: "Input", right: true, fmt: (r) => fmtTokens(Number(r.input)) },
    { key: "output", label: "Output", right: true, fmt: (r) => fmtTokens(Number(r.output)) },
    { key: "cache_read", label: "Cache Read", right: true, fmt: (r) => fmtTokens(Number(r.cache_read)) },
    { key: "cache_write", label: "Cache Write", right: true, fmt: (r) => fmtTokens(Number(r.cache_write)) },
    { key: "cost", label: "Costo", right: true, fmt: (r) => fmtCost(Number(r.cost)) },
    { key: "est", label: "Costo est.", right: true, fmt: (r) => str(r.est) }
  ],
  generico: [
    { key: "key", label: "Clave", right: false },
    { key: "sessions", label: "#Ses", right: true, fmt: (r) => fmtNum(Number(r.sessions)) },
    { key: "input", label: "Input", right: true, fmt: (r) => fmtTokens(Number(r.input)) },
    { key: "output", label: "Output", right: true, fmt: (r) => fmtTokens(Number(r.output)) },
    { key: "reasoning", label: "Reasoning", right: true, fmt: (r) => fmtTokens(Number(r.reasoning)) },
    { key: "cache_read", label: "Cache Read", right: true, fmt: (r) => fmtTokens(Number(r.cache_read)) },
    { key: "cache_write", label: "Cache Write", right: true, fmt: (r) => fmtTokens(Number(r.cache_write)) },
    { key: "cost", label: "Costo", right: true, fmt: (r) => fmtCost(Number(r.cost)) }
  ],
  sesiones: [
    { key: "title", label: "Sesión", right: false, fmt: (r) => str(r.title) },
    { key: "model", label: "Modelo", right: false, fmt: (r) => str(r.model) },
    { key: "start", label: "Inicio", right: false, fmt: (r) => str(r.start) },
    { key: "input", label: "Input", right: true, fmt: (r) => fmtTokens(Number(r.input)) },
    { key: "output", label: "Output", right: true, fmt: (r) => fmtTokens(Number(r.output)) },
    { key: "cache_read", label: "Cache Read", right: true, fmt: (r) => fmtTokens(Number(r.cache_read)) },
    { key: "cost", label: "Costo", right: true, fmt: (r) => fmtCost(Number(r.cost)) }
  ],
  uso: [
    { key: "model", label: "Modelo", right: false },
    { key: "u5h", label: "5 h", right: true, fmt: (r) => quotaText(Number(r.u5h), r.l5h == null ? null : Number(r.l5h)), cls: (r) => quotaCls(Number(r.u5h), r.l5h == null ? null : Number(r.l5h)) },
    { key: "l5h", label: "Límite 5 h", right: true, fmt: (r) => r.l5h == null ? "—" : fmtNum(Number(r.l5h)) },
    { key: "u7d", label: "Semana", right: true, fmt: (r) => quotaText(Number(r.u7d), r.l7d == null ? null : Number(r.l7d)), cls: (r) => quotaCls(Number(r.u7d), r.l7d == null ? null : Number(r.l7d)) },
    { key: "l7d", label: "Límite sem.", right: true, fmt: (r) => r.l7d == null ? "—" : fmtNum(Number(r.l7d)) },
    { key: "u30d", label: "Mes", right: true, fmt: (r) => quotaText(Number(r.u30d), r.l30d == null ? null : Number(r.l30d)), cls: (r) => quotaCls(Number(r.u30d), r.l30d == null ? null : Number(r.l30d)) },
    { key: "l30d", label: "Límite mes", right: true, fmt: (r) => r.l30d == null ? "—" : fmtNum(Number(r.l30d)) }
  ],
  precios: [
    { key: "model", label: "Modelo", right: false },
    { key: "in", label: "Entrada", right: true, fmt: (r) => `$${Number(r.in).toFixed(3)}` },
    { key: "out", label: "Salida", right: true, fmt: (r) => `$${Number(r.out).toFixed(2)}` },
    { key: "cr", label: "Cache read", right: true, fmt: (r) => `$${Number(r.cr).toFixed(4)}` },
    { key: "cw", label: "Cache write", right: true, fmt: (r) => (Number(r.cw) ? `$${Number(r.cw).toFixed(3)}` : "—") }
  ]
}

function StatsTable({ cols, rows, empty }: { cols: Col[]; rows: Record<string, unknown>[]; empty: string }) {
  if (rows.length === 0) {
    return <p className="subtle stats-empty">{empty}</p>
  }
  return (
    <div className="stats-table-wrap">
      <table className="stats-table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} className={c.right ? "stats-num" : ""}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {cols.map((c) => {
                const value = c.fmt ? c.fmt(r) : str(r[c.key])
                return (
                  <td key={c.key} className={`${c.right ? "stats-num" : ""}${c.cls ? ` ${c.cls(r)}` : ""}`}>
                    {value}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function StatsView({ config, onBack }: StatsViewProps) {
  const t = useT()
  const { data, loading, error, since, until, model, setSince, setUntil, setModel, refresh, fetchScope, applyFilters } = useServerStats(config)
  const [tab, setTab] = useState<TabId>("resumen")
  const [copied, setCopied] = useState(false)

  // Abrir bajo demanda: solo summary al montar (1-2s, sin scan de peticiones). El resto se pide al cambiar de pestaña.
  useEffect(() => {
    if (!data) {
      void fetchScope("summary").catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Al cambiar de pestaña, traer su scope si aún no está en data (merge local).
  useEffect(() => {
    const scope = TAB_SCOPE[tab]
    if (scope === "summary") return
    const hasData = (() => {
      if (!data) return false
      const d = data as unknown as Record<string, unknown>
      if (tab === "modelo" && Array.isArray(d.by_model) && (d.by_model as unknown[]).length > 0) return true
      if (tab === "proyecto" && Array.isArray(d.by_project) && (d.by_project as unknown[]).length > 0) return true
      if (tab === "dia" && Array.isArray(d.by_day) && (d.by_day as unknown[]).length > 0) return true
      if (tab === "mes" && Array.isArray(d.by_month) && (d.by_month as unknown[]).length > 0) return true
      if (tab === "sesiones" && Array.isArray(d.sessions) && (d.sessions as unknown[]).length > 0) return true
      if (tab === "limites" && Array.isArray(d.limits) && (d.limits as unknown[]).length > 0) return true
      return false
    })()
    if (!hasData) {
      void fetchScope(scope).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "resumen", label: t('stats.tabOverview') },
    { id: "modelo", label: t('stats.tabModel') },
    { id: "proyecto", label: t('stats.tabProject') },
    { id: "dia", label: t('stats.tabDay') },
    { id: "mes", label: t('stats.tabMonth') },
    { id: "sesiones", label: t('stats.tabSessions') },
    { id: "limites", label: t('stats.tabLimits') }
  ]

  const maxDayCost = useMemo(() => {
    if (!data?.days?.length) return 1
    return Math.max(...(data.days as Array<{ cost: number }>).map((d: { cost: number }) => d.cost), 1)
  }, [data])

  const modelChart = useMemo(() => {
    if (!data?.models_chart) return []
    const chart = data.models_chart as Array<{ model: string; cost: number }>
    const top = chart.slice(0, 6)
    const other = chart.slice(6).reduce((acc: number, m: { cost: number }) => acc + m.cost, 0)
    if (other > 0) top.push({ model: "Otros", cost: other })
    return top
  }, [data])

  const maxModelCost = useMemo(() => Math.max(...modelChart.map((m: { cost: number }) => m.cost), 1), [modelChart])

  const handleApply = () => {
    applyFilters(since, until, model)
  }

  const isLocal = typeof window !== "undefined" && (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")

  return (
    <section className="panel stats-view fade-in">
      <div className="stats-topbar">
        <button className="btn-icon btn-secondary compact" onClick={onBack} aria-label={t('detail.backToSessions')}>
          <ArrowLeftIcon size={16} />
        </button>
        <h2>{t('stats.title')}</h2>
        <div className="stats-topbar-actions">
          <button className="btn-secondary compact" onClick={() => void refresh({ scope: TAB_SCOPE[tab] } as unknown as Record<string, unknown>)} disabled={loading}>
            {loading ? <LoadingIcon size={14} className="animate-spin" /> : <RefreshIcon size={14} />}
            {t('stats.refresh')}
          </button>
        </div>
      </div>

      <div className="stats-filters">
        <label className="form-field">
          <span>{t('stats.filterSince')}</span>
          <input type="date" value={since} onChange={(e) => setSince(e.target.value)} />
        </label>
        <label className="form-field">
          <span>{t('stats.filterUntil')}</span>
          <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
        </label>
        <label className="form-field">
          <span>{t('stats.filterModel')}</span>
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-5.6-luna" />
        </label>
        <button className="btn-primary compact stats-apply" onClick={handleApply}>{t('stats.apply')}</button>
      </div>

      {isLocal && data?.meta && (
        <p className="subtle" style={{ fontSize: "0.75rem", margin: "6px 0 0" }}>Local · {String((data.meta as unknown as { db: string }).db)} · {fmtNum((data.meta as unknown as { sessions: number }).sessions)} sesiones</p>
      )}

      {error && (
        <div className="notice error fade-in">
          <span>{t('stats.error')}: {error}</span>
        </div>
      )}

      {error && !data && (
        <div className="stats-setup fade-in">
          <strong>{t('stats.setupTitle')}</strong>
          <p className="subtle">{t('stats.setupHint')}</p>
          <div className="stats-setup-row">
            <code className="stats-setup-cmd">{isLocal ? "Reiniciá OpenHer Desktop (el stats se levanta solo en :8765)" : "Abrí Stats en Desktop para lectura local rápida"}</code>
            <button type="button" className="btn-secondary compact" onClick={() => {
              const cmd = isLocal ? "Reiniciá OpenHer Desktop" : "Stats local solo en Desktop"
              void navigator.clipboard.writeText(cmd).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }).catch(() => {})
            }}>
              {copied ? t('stats.setupCopied') : t('stats.setupCopy')}
            </button>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="stats-loading">
          <LoadingIcon size={18} className="animate-spin" />
          {t('stats.loading')}
        </div>
      )}

      {!loading && !data && !error && (
        <p className="subtle stats-empty">{t('stats.empty')}</p>
      )}

      {data && (
        <>
          <p className="stats-meta">
            {t('stats.metaLine', {
              sessions: fmtNum((data.meta as unknown as { sessions: number }).sessions),
              models: fmtNum((data.meta as unknown as { models: number }).models),
              since: String((data.meta as unknown as { since: string }).since),
              until: String((data.meta as unknown as { until: string }).until),
              avg: fmtCost(Number((data.meta as unknown as { avg_cost: number }).avg_cost)),
              db: String((data.meta as unknown as { db: string }).db)
            })}
          </p>

          <div className="stats-tabs">
            {tabs.map((tb) => (
              <button key={tb.id} className={`stats-tab${tab === tb.id ? " active" : ""}`}
                onClick={() => setTab(tb.id)}>
                {tb.label}
              </button>
            ))}
          </div>

          {tab === "resumen" && (
            <>
              <div className="stats-cards">
                {TOKEN_CARDS.map((c) => (
                  <div key={c.key} className="stat-item stats-token-card" style={{ borderLeft: `4px solid ${c.color}` }}>
                    <span className="stat-value">{fmtTokens(Number((data.totals as unknown as Record<string, number>)[c.key] ?? 0))}</span>
                    <span className="stat-label">{c.label}</span>
                  </div>
                ))}
                <div className="stat-item stats-token-card" style={{ borderLeft: "4px solid var(--danger)" }}>
                  <span className="stat-value">{fmtCost(Number((data as unknown as { cost: number }).cost ?? 0))}</span>
                  <span className="stat-label">{t('stats.cost')}</span>
                  <small className="subtle">{t('stats.estCost')}: {fmtCost(Number((data as unknown as { est_total: number }).est_total ?? 0))}</small>
                </div>
              </div>

              <div className="stats-highlights">
                <div className="stats-highlight">
                  <span className="stat-label">{t('stats.mostExpensive')}</span>
                  <span className="stats-highlight-value">{fmtCost(Number((data.stats as unknown as { mas_cara: { cost: number } }).mas_cara?.cost ?? 0))}</span>
                  <span className="stats-highlight-sub">«{String((data.stats as unknown as { mas_cara: { title: string } }).mas_cara?.title ?? "—")}» · {String((data.stats as unknown as { mas_cara: { model: string } }).mas_cara?.model ?? "—")}</span>
                </div>
                <div className="stats-highlight">
                  <span className="stat-label">{t('stats.mostTokens')}</span>
                  <span className="stats-highlight-sub">«{String((data.stats as unknown as { mas_tokens: { title: string } }).mas_tokens?.title ?? "—")}» · {String((data.stats as unknown as { mas_tokens: { model: string } }).mas_tokens?.model ?? "—")}</span>
                </div>
                <div className="stats-highlight">
                  <span className="stat-label">{t('stats.avgInput')}</span>
                  <span className="stats-highlight-value">{fmtTokens(Number((data.stats as unknown as { input_medio: number }).input_medio ?? 0))}</span>
                </div>
              </div>

              {(data.days as Array<{ day: string; cost: number }>)?.length > 0 && (
                <div className="stats-chart">
                  <h3 className="settings-section-title">{t('stats.costPerDay')}</h3>
                  <div className="stats-bar-days">
                    {(data.days as Array<{ day: string; cost: number }>).map((d: { day: string; cost: number }) => (
                      <div key={d.day} className="stats-bar-day" title={`${d.day}: ${fmtCost(d.cost)}`}>
                        <div className="stats-bar-day-fill" style={{ height: `${Math.max((d.cost / maxDayCost) * 100, 2)}%`, background: "#3b82f6" }} />
                        <span className="stats-bar-day-label">{d.day.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modelChart.length > 0 && (
                <div className="stats-chart">
                  <h3 className="settings-section-title">{t('stats.costPerModel')}</h3>
                  <div className="stats-model-bars">
                    {modelChart.map((m: { model: string; cost: number }, i: number) => (
                      <div key={m.model} className="stats-model-row">
                        <span className="stats-model-name">{m.model}</span>
                        <div className="stats-model-track">
                          <div className="stats-model-fill"
                            style={{ width: `${(m.cost / maxModelCost) * 100}%`, background: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                        </div>
                        <span className="stats-model-cost">{fmtCost(m.cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "modelo" && <StatsTable cols={COLS.modelo} rows={(data.by_model ?? []) as unknown as Record<string, unknown>[]} empty={t('stats.empty')} />}
          {tab === "proyecto" && <StatsTable cols={COLS.generico} rows={(data.by_project ?? []) as unknown as Record<string, unknown>[]} empty={t('stats.empty')} />}
          {tab === "dia" && <StatsTable cols={COLS.generico} rows={(data.by_day ?? []) as unknown as Record<string, unknown>[]} empty={t('stats.empty')} />}
          {tab === "mes" && <StatsTable cols={COLS.generico} rows={(data.by_month ?? []) as unknown as Record<string, unknown>[]} empty={t('stats.empty')} />}
          {tab === "sesiones" && <StatsTable cols={COLS.sesiones} rows={(data.sessions ?? []) as unknown as Record<string, unknown>[]} empty={t('stats.empty')} />}
          {tab === "limites" && (
            <>
              <StatsTable cols={COLS.uso} rows={(data.limits ?? []) as unknown as Record<string, unknown>[]} empty={t('stats.empty')} />
              <h3 className="settings-section-title stats-prices-title">{t('stats.prices')}</h3>
              <StatsTable cols={COLS.precios} rows={(data.prices ?? []) as unknown as Record<string, unknown>[]} empty={t('stats.empty')} />
            </>
          )}
          {loading && <p className="subtle" style={{ textAlign: "center", marginTop: 12 }}><LoadingIcon size={14} className="animate-spin" /> Cargando {tab}…</p>}
        </>
      )}
    </section>
  )
}
