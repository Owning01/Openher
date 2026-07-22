import { useEffect, useRef, useState, useCallback } from "react"
import type { ServerConfig, SSEEvent, StreamState } from "../types"
import { toBase64 } from "../api"
import { SSE_RECONNECT_BASE_MS, SSE_RECONNECT_MAX_MS, SSE_HEARTBEAT_TIMEOUT_MS } from "../constants"

export function useSSE(config: ServerConfig | null, onEvent: (event: SSEEvent) => void) {
  const [streamState, setStreamState] = useState<StreamState>("polling")
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  const clearHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearTimeout(heartbeatTimerRef.current)
      heartbeatTimerRef.current = null
    }
  }, [])

  const connect = useCallback(async () => {
    if (!config || !mountedRef.current) return

    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort

    let host = config.host.trim()
    const schemeMatch = host.match(/^(https?):\/\//)
    const scheme = schemeMatch ? schemeMatch[1] : "http"
    if (schemeMatch) host = host.slice(schemeMatch[0].length)
    if (host.includes(":") && !host.startsWith("[")) host = `[${host}]`
    const url = `${scheme}://${host}:${config.port}/event`

    const headers: Record<string, string> = { Accept: "text/event-stream" }
    if (config.username && config.password) {
      headers.Authorization = `Basic ${toBase64(`${config.username}:${config.password}`)}`
    }

    try {
      setStreamState("reconnecting")
      const response = await fetch(url, {
        headers,
        signal: abort.signal,
        cache: "no-store",
      })
      if (!response.ok || !response.body) {
        throw new Error(`SSE HTTP ${response.status}`)
      }

      reconnectAttemptRef.current = 0
      setStreamState("streaming")

      const reader = response.body.getReader()
      readerRef.current = reader
      const decoder = new TextDecoder()
      let buffer = ""

      const pump = async () => {
        while (mountedRef.current && !abort.signal.aborted) {
          try {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() ?? ""

            let currentEvent: Partial<SSEEvent> = {}
            for (const line of lines) {
              if (line.startsWith("event: ")) {
                currentEvent.type = line.slice(7).trim()
              } else if (line.startsWith("data: ")) {
                try {
                  currentEvent.properties = JSON.parse(line.slice(6))
                } catch {
                  currentEvent.properties = { raw: line.slice(6) }
                }
              } else if (line === "" && currentEvent.type) {
                if (currentEvent.type === "server.heartbeat") {
                  clearHeartbeat()
                  heartbeatTimerRef.current = setTimeout(() => {
                    if (mountedRef.current) {
                      reader.cancel()
                      setStreamState("reconnecting")
                      scheduleReconnect()
                    }
                  }, SSE_HEARTBEAT_TIMEOUT_MS)
                } else if (currentEvent.properties) {
                  onEventRef.current({
                    id: String(currentEvent.properties.id ?? ""),
                    type: currentEvent.type,
                    properties: currentEvent.properties as Record<string, unknown>,
                  })
                }
                currentEvent = {}
              }
            }
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return
            break
          }
        }
      }

      await pump()
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
    }

    if (mountedRef.current && !abort.signal.aborted) {
      setStreamState("polling")
      scheduleReconnect()
    }
  }, [config])

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return
    const attempt = reconnectAttemptRef.current++
    const delay = Math.min(
      SSE_RECONNECT_BASE_MS * Math.pow(2, attempt),
      SSE_RECONNECT_MAX_MS
    )
    const jitter = delay * (0.5 + Math.random() * 0.5)
    reconnectTimerRef.current = setTimeout(() => {
      if (mountedRef.current) connect()
    }, jitter)
  }, [connect])

  useEffect(() => {
    mountedRef.current = true
    if (config) {
      const timeout = setTimeout(() => connect(), 500)
      return () => {
        mountedRef.current = false
        clearTimeout(timeout)
        clearHeartbeat()
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
        abortRef.current?.abort()
        readerRef.current?.cancel()
      }
    }
    return () => { mountedRef.current = false }
  }, [config?.host, config?.port, config?.username, config?.password])

  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0
    connect()
  }, [connect])

  return { streamState, reconnect }
}
