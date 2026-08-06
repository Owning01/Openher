import { useEffect, useRef, useState, useCallback } from "react"
import type { ServerConfig, SSEEvent, StreamState } from "../types"
import { toBase64 } from "../api"
import { recordDataUsage } from "../utils/dataUsage"
import { SSE_RECONNECT_BASE_MS, SSE_RECONNECT_MAX_MS, SSE_HEARTBEAT_TIMEOUT_MS } from "../constants"
import { computeBackoff } from "../utils"

export function useSSE(config: ServerConfig | null, onEvent: (event: SSEEvent) => void, directory?: string) {
  const [streamState, setStreamState] = useState<StreamState>("polling")
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  // El /event del server filtra por instance.directory: sin el directory de la
  // sesión en el query, descarta todos los eventos (solo pasan heartbeats).
  const directoryRef = useRef(directory)
  directoryRef.current = directory

  const clearHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearTimeout(heartbeatTimerRef.current)
      heartbeatTimerRef.current = null
    }
  }, [])

  const connect = useCallback(async () => {
    if (!config || !mountedRef.current) return

    abortRef.current?.abort()
    clearHeartbeat()
    const abort = new AbortController()
    abortRef.current = abort

    let host = config.host.trim()
    const schemeMatch = host.match(/^(https?):\/\//)
    const scheme = schemeMatch ? schemeMatch[1] : "http"
    if (schemeMatch) host = host.slice(schemeMatch[0].length)
    if (host.includes(":") && !host.startsWith("[")) host = `[${host}]`
    let url = `${scheme}://${host}:${config.port}/event`
    const dir = directoryRef.current
    if (dir) {
      url += `?directory=${encodeURIComponent(dir.replace(/\\/g, "/"))}`
    }

    const headers: Record<string, string> = { Accept: "text/event-stream" }
    if (config.username && config.password) {
      headers.Authorization = `Basic ${toBase64(`${config.username}:${config.password}`)}`
    }

    // Refresca el watchdog con cualquier evento; el timeout fuerza reconexión.
    const resetHeartbeat = (reader: ReadableStreamDefaultReader<Uint8Array>) => {
      clearHeartbeat()
      heartbeatTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return
        abortRef.current?.abort()
        reader.cancel().catch(() => {})
        setStreamState("reconnecting")
        scheduleReconnect()
      }, SSE_HEARTBEAT_TIMEOUT_MS)
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

      const dispatch = (event: Partial<SSEEvent>) => {
        if (event.type === "server.heartbeat") return
        if (event.properties) {
          const props = event.properties as Record<string, unknown>
          onEventRef.current({
            id: String(event.id ?? props.id ?? ""),
            type: event.type as string,
            properties: props,
          })
        }
      }

      const processBuffer = () => {
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        let currentEvent: Partial<SSEEvent> = {}
        for (const rawLine of lines) {
          const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine
          if (line.startsWith("event: ")) {
            currentEvent.type = line.slice(7).trim()
          } else if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6)) as {
                id?: string
                type?: string
                properties?: Record<string, unknown>
              }
              currentEvent.type = parsed.type ?? currentEvent.type
              currentEvent.properties = parsed.properties ?? (parsed as unknown as Record<string, unknown>)
              if (parsed.id) currentEvent.id = parsed.id
            } catch {
              currentEvent.properties = { raw: line.slice(6) }
            }
          } else if (line === "" && currentEvent.type) {
            resetHeartbeat(reader)
            dispatch(currentEvent)
            currentEvent = {}
          }
        }
        if (currentEvent.type) {
          resetHeartbeat(reader)
          dispatch(currentEvent)
        }
      }

      const pump = async () => {
        while (mountedRef.current && !abort.signal.aborted) {
          try {
            const { done, value } = await reader.read()
            if (done) break
            recordDataUsage(value.byteLength, "down")
            buffer += decoder.decode(value, { stream: true })
            processBuffer()
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return
            break
          }
        }
        processBuffer()
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
    const delay = computeBackoff(SSE_RECONNECT_BASE_MS, SSE_RECONNECT_MAX_MS, attempt)
    reconnectTimerRef.current = setTimeout(() => {
      if (mountedRef.current) connect()
    }, delay)
  }, [connect])

  useEffect(() => {
    mountedRef.current = true
    const enabled = Boolean(config)
    if (enabled) {
      const timeout = setTimeout(() => connect(), 500)
      return () => {
        mountedRef.current = false
        clearTimeout(timeout)
        clearHeartbeat()
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
        try { abortRef.current?.abort() } catch { /* ignore */ }
        try { readerRef.current?.cancel()?.catch(() => {}) } catch { /* ignore */ }
      }
    }
    return () => { mountedRef.current = false }
  }, [Boolean(config), config?.host, config?.port, config?.username, config?.password, clearHeartbeat, connect, directoryRef.current])

  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0
    connect()
  }, [connect])

  return { streamState, reconnect }
}
