// Cliente de la API pública de uso de OpenCode Go.
// GET https://opencode.ai/zen/go/v1/usage con Authorization: Bearer <key>.
// Devuelve el % consumido de las cuotas rolling (ventana móvil), semanal y
// mensual, con el instante de reset de cada una.

export type GoUsagePeriod = {
  percent: number
  resetsAt: string
}

export type GoUsage = {
  rolling: GoUsagePeriod | null
  weekly: GoUsagePeriod | null
  monthly: GoUsagePeriod | null
}

const GO_USAGE_URL = "https://opencode.ai/zen/go/v1/usage"
const GO_STORAGE_KEY = "opencode.go.accounts"
const GO_LEGACY_KEY = "opencode.go.apiKey"

export function loadGoAccounts(): string[] {
  try {
    const raw = localStorage.getItem(GO_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((k) => typeof k === "string")
    }
  } catch {
    /* ignore */
  }
  const legacy = localStorage.getItem(GO_LEGACY_KEY)
  if (legacy) {
    localStorage.removeItem(GO_LEGACY_KEY)
    return [legacy]
  }
  return []
}

export function saveGoAccounts(accounts: string[]) {
  try {
    const cleaned = accounts.map((k) => k.trim()).filter(Boolean)
    if (cleaned.length) localStorage.setItem(GO_STORAGE_KEY, JSON.stringify(cleaned))
    else localStorage.removeItem(GO_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export type GoUsageProxy = {
  host: string
  port: number
  username: string
  password: string
}

function toPeriod(raw: unknown): GoUsagePeriod | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as { percent?: unknown; resetsAt?: unknown }
  const percent = typeof r.percent === "number" ? r.percent : Number(r.percent ?? NaN)
  if (!Number.isFinite(percent)) return null
  return {
    percent: Math.round(percent),
    resetsAt: typeof r.resetsAt === "string" ? r.resetsAt : "",
  }
}

function parseUsage(body: { usage?: Record<string, unknown> } | null): GoUsage {
  const u = body?.usage ?? {}
  return {
    rolling: toPeriod(u.rolling),
    weekly: toPeriod(u.weekly),
    monthly: toPeriod(u.monthly),
  }
}

async function fetchJSON(url: string, headers: Record<string, string>): Promise<{ status: number; body: { usage?: Record<string, unknown> } | null }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(url, { headers, signal: controller.signal, cache: "no-store" })
    const body = (await res.json().catch(() => null)) as { usage?: Record<string, unknown> } | null
    return { status: res.status, body }
  } finally {
    clearTimeout(timer)
  }
}

// Consulta el uso de OpenCode Go. El navegador/WebView no puede llamar a la
// API directo (CORS) — si hay proxy (desktop agent con /gousage) va por él,
// y si falla o no hay proxy, intenta directo igual.
export async function fetchGoUsage(apiKey: string, proxy?: GoUsageProxy | null): Promise<GoUsage> {
  const trimmed = apiKey.trim()
  if (proxy && proxy.host.trim() && proxy.port > 0) {
    try {
      const res = await fetchJSON(
        `http://${proxy.host.trim()}:${proxy.port}/gousage?key=${encodeURIComponent(trimmed)}`,
        { Authorization: `Basic ${btoa(`${proxy.username}:${proxy.password}`)}`, Accept: "application/json" },
      )
      if (res.status === 401 || res.status === 403) throw new Error("invalid_key")
      if (res.status >= 200 && res.status < 300) return parseUsage(res.body)
      throw new Error(`HTTP ${res.status}`)
    } catch {
      /* proxy caído o CORS: caer al directo */
    }
  }
  const res = await fetchJSON(GO_USAGE_URL, { Authorization: `Bearer ${trimmed}`, Accept: "application/json" })
  if (res.status === 401 || res.status === 403) throw new Error("invalid_key")
  if (res.status < 200 || res.status >= 300) throw new Error(`HTTP ${res.status}`)
  return parseUsage(res.body)
}
