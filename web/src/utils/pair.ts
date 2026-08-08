export type PairInfo = {
  host: string
  port: number
  username: string
  password: string
}

function normalize(info: { host: unknown; port?: unknown; username?: unknown; password?: unknown }): PairInfo {
  const port = Number(info.port)
  return {
    host: String(info.host),
    port: Number.isFinite(port) && port > 0 ? port : 4096,
    username: String(info.username ?? "opencode"),
    password: String(info.password ?? "")
  }
}

function parseUrl(text: string): PairInfo | null {
  let s = text.trim()
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = `http://${s}`
  try {
    const u = new URL(s)
    const host = u.hostname
    if (!host) return null
    const port = u.port ? Number(u.port) : 4096
    const username = u.username
      ? decodeURIComponent(u.username)
      : u.searchParams.get("username") ?? u.searchParams.get("user") ?? "opencode"
    const password = u.password
      ? decodeURIComponent(u.password)
      : u.searchParams.get("password") ?? u.searchParams.get("pass") ?? ""
    return normalize({ host, port, username, password })
  } catch {
    return null
  }
}

// Parsea el payload del QR de `opencode service pair` (v2 beta). Acepta JSON
// ({host/url, port, username, password}), una URL con credenciales o query
// params, o texto plano host:port.
export function parsePairPayload(raw: string): PairInfo | null {
  const text = (raw ?? "").trim()
  if (!text) return null

  try {
    const obj = JSON.parse(text)
    if (obj && typeof obj === "object") {
      const url = obj.url ?? obj.uri
      const host = obj.host ?? obj.hostname
      const port = obj.port
      const username = obj.username ?? obj.user
      const password = obj.password ?? obj.pass
      if (host) return normalize({ host, port, username, password })
      if (typeof url === "string") {
        const parsed = parseUrl(url)
        if (parsed) {
          return normalize({ ...parsed, port: port ?? parsed.port, username: username ?? parsed.username, password: password ?? parsed.password })
        }
      }
    }
  } catch { /* no es JSON */ }

  return parseUrl(text)
}
