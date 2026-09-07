/**
 * Thin wrapper sobre @opencode-ai/client (beta) que mantiene la lógica
 * existente de resolveShellBase / Tailscale / Basic Auth de opencode-remote-android.
 *
 * Uso:
 *   import { getOpencodeClient } from "./opencodeClient"
 *   const client = await getOpencodeClient(config) // config: ServerConfig
 *   const s = await client.session.create({ location: { directory: "/workspace" } })
 *   for await (const e of client.event.subscribe()) console.log(e.type)
 *
 * Fallback: si @opencode-ai/client no está instalado o baseUrl no resuelve, usa el fetch manual de client.ts
 */
import { OpenCode } from "@opencode-ai/client"
import { Capacitor, CapacitorHttp } from "@capacitor/core"
import type { ServerConfig } from "../../types"
import { baseUrl, authHeader } from "./client"

export type OpencodeClient = ReturnType<typeof OpenCode.make>

let cachedClient: OpencodeClient | null = null
let cachedBaseUrl: string | null = null

/**
 * fetch vía puente nativo (CapacitorHttp): no pasa por el WebView y por eso
 * no le aplica el preflight CORS. En Android (APK) el `fetch` del WebView
 * contra `http://<tailscale-ip>:puerto` falla en POSTs `application/json`
 * (preflight OPTIONS que el server sin --cors no responde), mientras que los
 * GETs sobrevivían por el fallback HTTP de `loadMessages`. Sin esto, desde el
 * celular los chats cargan pero enviar da error.
 * Solo cubre requests unarias (prompt/command/list); el SSE streaming de la
 * app usa su propio `fetch` con fallback a polling, y `event.subscribe` del
 * SDK no se usa en el código.
 */
function nativeFetch(input: string | URL, init?: RequestInit): Promise<Response> {
  const url = String(input)
  const headers: Record<string, string> = {}
  const raw = init?.headers
  if (raw instanceof Headers) {
    raw.forEach((value, key) => { headers[key] = value })
  } else if (Array.isArray(raw)) {
    for (const [key, value] of raw) headers[key] = value
  } else if (raw) {
    Object.assign(headers, raw)
  }
  let data: unknown
  if (init?.body !== undefined) {
    const text = typeof init.body === "string" ? init.body : String(init.body)
    try { data = JSON.parse(text) } catch { data = text }
  }
  return CapacitorHttp.request({
    url,
    method: (init?.method ?? "GET").toUpperCase() as "GET",
    headers,
    data: data as never,
    connectTimeout: 12_000,
    // El prompt puede tardar (red móvil + inferencia): sin timeout amplio el
    // nativo abortaría la espera de la respuesta.
    readTimeout: 180_000,
  }).then((res) => {
    const resHeaders = new Headers()
    for (const [key, value] of Object.entries(res.headers ?? {})) {
      resHeaders.set(key, Array.isArray(value) ? value.join(", ") : String(value))
    }
    if (!resHeaders.has("content-type")) resHeaders.set("content-type", "application/json")
    const text = typeof res.data === "string" ? res.data : JSON.stringify(res.data ?? null)
    const status = res.status
    return {
      status,
      ok: status >= 200 && status < 300,
      headers: resHeaders,
      text: async () => text,
      json: async () => {
        if (typeof res.data === "object" && res.data !== null) return res.data
        return JSON.parse(text || "null")
      },
      arrayBuffer: async () => new TextEncoder().encode(text).buffer as ArrayBuffer,
      body: { cancel: async () => {} },
    } as unknown as Response
  })
}

export async function getOpencodeClient(config: ServerConfig): Promise<OpencodeClient> {
  const url = baseUrl(config)
  if (cachedClient && cachedBaseUrl === url) return cachedClient

  const headers: Record<string, string> = {}
  if (config.username && config.password) {
    headers.Authorization = authHeader(config)
  }

  const client = OpenCode.make({
    baseUrl: url,
    headers,
    // En nativo el SDK debe salir por el puente (sin CORS); en web/desktop se
    // usa el fetch global como antes.
    ...(Capacitor.isNativePlatform() ? { fetch: nativeFetch as typeof fetch } : {}),
  })

  cachedClient = client as unknown as OpencodeClient
  cachedBaseUrl = url
  return cachedClient
}

// Re-export para tests con SDK (embed)
// En vitest, usar @opencode-ai/sdk en vez de client:
//   import { OpenCode } from "@opencode-ai/sdk"
//   await using opencode = await OpenCode.create({ plugins: [acmeShell] })
export { OpenCode }
