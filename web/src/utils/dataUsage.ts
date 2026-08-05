const STORAGE_KEY = "opencode.datausage.v1"
const MAX_AGE_MS = 31 * 24 * 60 * 60 * 1000

export type DataPeriod = "day" | "week" | "month"
export type NetworkKind = "mobile" | "wifi" | "other"

export type DataUsageEntry = {
  ts: number
  bytes: number
  dir: "up" | "down"
  net: NetworkKind
}

function detectNetwork(): NetworkKind {
  try {
    const conn = (navigator as unknown as { connection?: { type?: string } }).connection
    const type = (conn?.type ?? "").toLowerCase()
    if (type === "cellular" || type === "mobile" || type === "3g" || type === "4g" || type === "5g") return "mobile"
    if (type === "wifi" || type === "ethernet") return "wifi"
    return "other"
  } catch {
    return "other"
  }
}

function readEntries(): DataUsageEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const cutoff = Date.now() - MAX_AGE_MS
    return parsed.filter((e) => typeof e?.ts === "number" && typeof e?.bytes === "number" && cutoff <= e.ts)
  } catch {
    return []
  }
}

function writeEntries(entries: DataUsageEntry[]) {
  try {
    const cutoff = Date.now() - MAX_AGE_MS
    const pruned = entries.filter((e) => cutoff <= e.ts).slice(-5000)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned))
  } catch {
    /* storage full or unavailable — drop telemetry */
  }
}

export function recordDataUsage(bytes: number, dir: "up" | "down") {
  if (!Number.isFinite(bytes) || bytes <= 0) return
  const entries = readEntries()
  entries.push({ ts: Date.now(), bytes: Math.round(bytes), dir, net: detectNetwork() })
  writeEntries(entries)
}

export type NetworkUsage = { up: number; down: number; total: number }

export type DataUsageSummary = {
  day: NetworkUsage & { byNet: Record<NetworkKind, NetworkUsage> }
  week: NetworkUsage & { byNet: Record<NetworkKind, NetworkUsage> }
  month: NetworkUsage & { byNet: Record<NetworkKind, NetworkUsage> }
}

export function getDataUsage(): DataUsageSummary {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const ranges = {
    day: now - dayMs,
    week: now - 7 * dayMs,
    month: now - 30 * dayMs,
  } as const

  const empty = (): NetworkUsage & { byNet: Record<NetworkKind, NetworkUsage> } => ({
    up: 0, down: 0, total: 0,
    byNet: {
      mobile: { up: 0, down: 0, total: 0 },
      wifi: { up: 0, down: 0, total: 0 },
      other: { up: 0, down: 0, total: 0 },
    },
  })

  const totals = { day: empty(), week: empty(), month: empty() }

  for (const e of readEntries()) {
    const net: NetworkKind = e.net === "mobile" || e.net === "wifi" ? e.net : "other"
    for (const period of ["day", "week", "month"] as const) {
      if (e.ts >= ranges[period]) {
        totals[period][e.dir] += e.bytes
        totals[period].byNet[net][e.dir] += e.bytes
      }
    }
  }

  for (const period of ["day", "week", "month"] as const) {
    const p = totals[period]
    p.total = p.up + p.down
    for (const net of ["mobile", "wifi", "other"] as const) {
      p.byNet[net].total = p.byNet[net].up + p.byNet[net].down
    }
  }

  return totals
}

export function resetDataUsage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let unit = units[0]
  for (let i = 1; i < units.length && value >= 1024; i++) {
    value /= 1024
    unit = units[i]
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${unit}`
}
