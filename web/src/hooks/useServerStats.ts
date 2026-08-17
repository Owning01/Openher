import { useCallback, useEffect, useState } from "react"
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
    const payload = await api.fetchStats(config, statsPort)
    if (payload) {
      setCachedServerStats(payload)
      return payload
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

  const refresh = useCallback(async (opts?: { since?: string; until?: string; model?: string; silent?: boolean }) => {
    if (!config?.host) {
      setError("Sin servidor configurado")
      setLoading(false)
      return
    }
    if (!opts?.silent && !data) {
      setLoading(true)
    }
    setError(null)
    try {
      const payload = await api.fetchStats(
        config,
        statsPort,
        opts?.since ?? since,
        opts?.until ?? until,
        opts?.model ?? model
      )
      setCachedServerStats(payload)
      setData(payload)
      setLoadedAt(Date.now())
    } catch (err) {
      if (!data) {
        setError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      setLoading(false)
    }
  }, [config, statsPort, since, until, model, data])

  const applyFilters = useCallback((s: string, u: string, m: string) => {
    setSince(s)
    setUntil(u)
    setModel(m)
    void refresh({ since: s, until: u, model: m })
  }, [refresh])

  useEffect(() => {
    if (config?.host) {
      void refresh({ silent: !!data })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.host, config?.port, statsPort])

  useEffect(() => {
    if (!config?.host) return
    const id = setInterval(() => { void refresh({ silent: true }) }, 30_000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.host, statsPort])

  return {
    data, loading, error, loadedAt,
    statsPort, setStatsPort,
    since, until, model,
    setSince, setUntil, setModel,
    refresh, applyFilters
  }
}
