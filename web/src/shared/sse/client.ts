import type { ServerConfig, SSEEvent, StreamState } from "../../types"
import { baseUrl } from "../api/client"
import { resolveApiVersion, unwrapData } from "../api/version"

export function buildSSEUrl(config: ServerConfig, directory?: string, sessionID?: string): string {
  const base = baseUrl(config)
  const version = resolveApiVersion(config)
  const prefix = version === "v2" ? "/api" : ""
  const params = new URLSearchParams()
  if (directory) {
    const key = version === "v2" ? "location[directory]" : "directory"
    params.set(key, directory)
  }
  if (sessionID) params.set("sessionID", sessionID)
  const qs = params.toString()
  return `${base}${prefix}/event${qs ? `?${qs}` : ""}`
}

export function parseSSEChunk(raw: string): SSEEvent | null {
  const trimmed = raw.trim()
  if (!trimmed || trimmed.startsWith(":")) return null
  const lines = trimmed.split("\n")
  let data = ""
  let event = "message"
  for (const line of lines) {
    if (line.startsWith("data:")) data += line.slice(5).trim()
    else if (line.startsWith("event:")) event = line.slice(6).trim()
  }
  if (!data) return null
  try {
    const parsed = JSON.parse(data) as { type?: string; properties?: Record<string, unknown>; id?: string }
    return {
      id: parsed.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: parsed.type ?? event,
      properties: (parsed.properties as Record<string, unknown>) ?? (unwrapData(parsed) as Record<string, unknown>) ?? {},
    }
  } catch {
    return { id: `${Date.now()}`, type: event, properties: { data } }
  }
}

export function shouldReconnect(state: StreamState, attempt: number): boolean {
  if (state === "polling") return false
  return attempt < 5
}

export type SSEClientOptions = {
  config: ServerConfig
  directory?: string
  sessionID?: string
  onEvent: (e: SSEEvent) => void
  onStateChange?: (s: StreamState) => void
}

export function createSSEClient(opts: SSEClientOptions) {
  let es: EventSource | null = null
  let state: StreamState = "polling"
  let attempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  const connect = () => {
    const url = buildSSEUrl(opts.config, opts.directory, opts.sessionID)
    try {
      es = new EventSource(url)
      state = "streaming"
      opts.onStateChange?.(state)
      es.onmessage = (msg) => {
        attempt = 0
        const ev = parseSSEChunk(`data: ${msg.data}\nevent: ${msg.type || "message"}`)
        if (ev) opts.onEvent(ev)
      }
      es.onerror = () => {
        state = "reconnecting"
        opts.onStateChange?.(state)
        es?.close()
        if (shouldReconnect(state, attempt)) {
          const delay = Math.min(500 * Math.pow(1.8, attempt), 10000)
          attempt++
          reconnectTimer = setTimeout(connect, delay)
        } else {
          state = "polling"
          opts.onStateChange?.(state)
        }
      }
    } catch {
      state = "reconnecting"
      opts.onStateChange?.(state)
    }
  }

  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    es?.close()
    es = null
    state = "polling"
    attempt = 0
    opts.onStateChange?.(state)
  }

  const getState = () => state

  return { connect, disconnect, getState, buildUrl: () => buildSSEUrl(opts.config, opts.directory, opts.sessionID) }
}
