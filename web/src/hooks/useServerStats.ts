import { useCallback, useState } from "react"
import type { ServerConfig, StatsPayload } from "../types"
import { api } from "../api"
import { STORAGE_KEYS, DEFAULT_STATS_PORT } from "../constants"

let globalCachedStats: StatsPayload | null = null
let globalStatsLoadedAt = 0

export function getCachedServerStats(): StatsPayload | null {
  if (globalCachedStats) return globalCachedStats
  try {
    const raw = localStorage.getItem("opencode.stats.cache")
    if (raw) {
      globalCachedStats = JSON.parse(raw)
      return globalCachedStats
    }
  } catch {}
  return null
}

export function setCachedServerStats(data: StatsPayload) {
  globalCachedStats = data
  globalStatsLoadedAt = Date.now()
  try {
    localStorage.setItem("opencode.stats.cache", JSON.stringify(data))
  } catch {}
}

export async function prefetchServerStats(config: ServerConfig, statsPort = DEFAULT_STATS_PORT): Promise<StatsPayload | null> {
  if (!config?.host) return null
  try {
    const payload = await api.fetchStats(config, statsPort, "", "", "", "summary")
    if (payload) {
      setCachedServerStats(payload as StatsPayload)
      return payload as StatsPayload
    }
  } catch {}
  return null
}

function loadPort(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS_PORT)
    const n = raw ? Number(raw) : NaN
    return Number.isFinite(n) && n > 0 ? Math.round(n) : DEFAULT_STATS_PORT
  } catch {
    return DEFAULT_STATS_PORT
  }
}

function dateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function useServerStats(config: ServerConfig | null) {
  const [statsPort, setStatsPortState] = useState<number>(loadPort)
  const [since, setSince] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return dateStr(d)
  })
  const [until, setUntil] = useState(() => dateStr(new Date()))
  const [model, setModel] = useState("")
  const [data, setData] = useState<StatsPayload | null>(getCachedServerStats)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedAt, setLoadedAt] = useState<number>(() => globalStatsLoadedAt)

  const setStatsPort = useCallback((port: number) => {
    const n = Number.isFinite(port) && port > 0 ? Math.round(port) : DEFAULT_STATS_PORT
    setStatsPortState(n)
    try { localStorage.setItem(STORAGE_KEYS.STATS_PORT, String(n)) } catch {}
  }, [])

  // Fetch por scope (summary es 1-2s, sin scan de peticiones). Se mergea al payload existente
  // para que cada pestaña abra instantáneo y solo pague su scope cuando se abre (bajo demanda).
  // Local primero: funciona sin config.host en desktop (lee opencode.db local vía /shell/stats/proxy).
  const fetchScope = useCallback(async (scope: string = "summary", opts?: { since?: string; until?: string; model?: string }) => {
    const isLocalHost = typeof window !== "undefined" && (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
    if (!config?.host && !isLocalHost) {
      setError("Sin servidor configurado")
      return null
    }
    // Config dummy para tryLocal (host no usado local), si no hay config usar localhost
    const cfg = config ?? { host: "http://127.0.0.1", port: 4096, username: "", password: "" } as unknown as ServerConfig
    setLoading(true)
    setError(null)
    try {
      const payload = await api.fetchStats(
        cfg,
        statsPort,
        opts?.since ?? since,
        opts?.until ?? until,
        opts?.model ?? model,
        scope
      )
      // Merge shallow: cada scope aporta sus keys (SCOPE_KEYS en payload.rs). Conservar lo ya cacheado.
      setData((prev) => {
        const merged = (prev ? { ...prev, ...payload } : payload) as StatsPayload
        setCachedServerStats(merged)
        return merged
      })
      setLoadedAt(Date.now())
      return payload as StatsPayload
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [config, statsPort, since, until, model])

  const refresh = useCallback(async (opts?: { since?: string; until?: string; model?: string; scope?: string; silent?: boolean }) => {
    const scope = opts?.scope ?? "summary"
    return fetchScope(scope, opts)
  }, [fetchScope])

  const applyFilters = useCallback((s: string, u: string, m: string) => {
    setSince(s)
    setUntil(u)
    setModel(m)
    // Al cambiar filtros, descartar cache y recargar summary (el resto se recargará bajo demanda)
    globalCachedStats = null
    try { localStorage.removeItem("opencode.stats.cache") } catch {}
    setData(null)
    void fetchScope("summary", { since: s, until: u, model: m })
  }, [fetchScope])

  // Sin auto-fetch ni polling: el stats se abre bajo demanda (StatsView monta y pide summary).
  // Se mantiene compat: si hay cache, se muestra instantáneo sin fetch.

  return {
    data, loading, error, loadedAt,
    statsPort, setStatsPort,
    since, until, model,
    setSince, setUntil, setModel,
    refresh, fetchScope, applyFilters
  }
}
