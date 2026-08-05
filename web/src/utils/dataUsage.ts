const STORAGE_KEY = "opencode.datausage.v1"
const MAX_AGE_MS = 31 * 24 * 60 * 60 * 1000

export type DataPeriod = "day" | "week" | "month"

export type DataUsageEntry = {
  ts: number
  bytes: number
  dir: "up" | "down"
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
  entries.push({ ts: Date.now(), bytes: Math.round(bytes), dir })
  writeEntries(entries)
}

export type DataUsageSummary = {
  day: { up: number; down: number; total: number }
  week: { up: number; down: number; total: number }
  month: { up: number; down: number; total: number }
}

export function getDataUsage(): DataUsageSummary {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const ranges = {
    day: now - dayMs,
    week: now - 7 * dayMs,
    month: now - 30 * dayMs,
  } as const

  const totals = { day: { up: 0, down: 0 }, week: { up: 0, down: 0 }, month: { up: 0, down: 0 } }

  for (const e of readEntries()) {
    for (const period of ["day", "week", "month"] as const) {
      if (e.ts >= ranges[period]) {
        totals[period][e.dir] += e.bytes
      }
    }
  }

  return {
    day: { ...totals.day, total: totals.day.up + totals.day.down },
    week: { ...totals.week, total: totals.week.up + totals.week.down },
    month: { ...totals.month, total: totals.month.up + totals.month.down },
  }
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
