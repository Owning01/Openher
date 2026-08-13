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
// Clave maestra AES-GCM que cifra las keys de Go en localStorage. Separada de
// los datos: un robo del storage (backup/XSS simple) obtiene ciphertext sin
// la clave. Limitación conocida: sin plugin nativo (Keystore) la clave maestra
// persiste en el mismo storage — es ofuscación robusta, no HSM.
const GO_MASTER_KEY = "opencode.go.master"
const GO_ENC_PREFIX = "goenc:"

async function getGoMasterKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(GO_MASTER_KEY)
  if (stored) {
    try {
      const raw = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0))
      return await crypto.subtle.importKey("raw", raw, "AES-GCM", true, ["encrypt", "decrypt"])
    } catch {
      /* clave corrupta: regenerar */
    }
  }
  // extractable: true es OBLIGATORIO — exportKey falla con keys no extraíbles.
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
  const raw = await crypto.subtle.exportKey("raw", key)
  localStorage.setItem(GO_MASTER_KEY, btoa(String.fromCharCode(...new Uint8Array(raw))))
  return key
}

function isEncryptedGoKey(value: string): boolean {
  return value.startsWith(GO_ENC_PREFIX)
}

async function encryptGoKey(plain: string): Promise<string> {
  const key = await getGoMasterKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain))
  const combined = new Uint8Array(iv.length + enc.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(enc), iv.length)
  return GO_ENC_PREFIX + btoa(String.fromCharCode(...combined))
}

async function decryptGoKey(stored: string): Promise<string> {
  const key = await getGoMasterKey()
  const combined = Uint8Array.from(atob(stored.slice(GO_ENC_PREFIX.length)), (c) => c.charCodeAt(0))
  const iv = combined.subarray(0, 12)
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, combined.subarray(12))
  return new TextDecoder().decode(dec)
}

// Carga las keys de Go: descifra y migra formatos viejos (plaintext).
export async function loadGoAccounts(): Promise<string[]> {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(GO_STORAGE_KEY)
  } catch { /* ignore */ }
  const out: string[] = []
  let sawPlain = false
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          if (typeof entry !== "string") continue
          if (isEncryptedGoKey(entry)) {
            try { out.push(await decryptGoKey(entry)) } catch { /* key ilegible: descartar */ }
          } else {
            sawPlain = true
            out.push(entry)
          }
        }
      }
    } catch { /* storage corrupto: reiniciar */ }
  }
  if (out.length === 0) {
    const legacy = localStorage.getItem(GO_LEGACY_KEY)
    if (legacy) {
      localStorage.removeItem(GO_LEGACY_KEY)
      sawPlain = true
      out.push(legacy)
    }
  }
  // Migración: keys en plaintext → re-guardar cifradas.
  if (sawPlain && out.length > 0) await saveGoAccounts(out)
  return out
}

// Guarda las keys de Go cifradas (AES-GCM, clave maestra aparte).
export async function saveGoAccounts(accounts: string[]) {
  try {
    const cleaned = accounts.map((k) => k.trim()).filter(Boolean)
    if (cleaned.length) {
      const encrypted = await Promise.all(cleaned.map((k) => isEncryptedGoKey(k) ? k : encryptGoKey(k)))
      localStorage.setItem(GO_STORAGE_KEY, JSON.stringify(encrypted))
    } else {
      localStorage.removeItem(GO_STORAGE_KEY)
    }
  } catch (err) {
    console.error("[goUsage] saveGoAccounts:", err)
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

async function fetchJSON(url: string, headers: Record<string, string>, body?: string): Promise<{ status: number; body: { usage?: Record<string, unknown> } | null }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(url, {
      headers,
      body,
      method: body ? "POST" : "GET",
      signal: controller.signal,
      cache: "no-store",
    })
    const bodyJson = (await res.json().catch(() => null)) as { usage?: Record<string, unknown> } | null
    return { status: res.status, body: bodyJson }
  } finally {
    clearTimeout(timer)
  }
}

// Consulta el uso de OpenCode Go. El navegador/WebView no puede llamar a la
// API directo (CORS) — si hay proxy (desktop agent con /gousage) va por él,
// y si falla o no hay proxy, intenta directo igual.
// Seguridad: la key NUNCA va en la URL — el proxy la recibe en el body (POST)
// y el directo usa el header Authorization.
export async function fetchGoUsage(apiKey: string, proxy?: GoUsageProxy | null): Promise<GoUsage> {
  const trimmed = apiKey.trim()
  if (proxy && proxy.host.trim() && proxy.port > 0) {
    try {
      const res = await fetchJSON(
        `http://${proxy.host.trim()}:${proxy.port}/gousage`,
        {
          Authorization: `Basic ${btoa(`${proxy.username}:${proxy.password}`)}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        JSON.stringify({ key: trimmed }),
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
