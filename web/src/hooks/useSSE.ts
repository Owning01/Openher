import { useEffect, useRef, useState, useCallback } from "react"
import type { ServerConfig, SSEEvent, StreamState } from "../types"
import { authHeader, onApiVersionChange } from "../api"
import { buildSSEUrl } from "../shared/sse/client"
import { createSSEFrameParser, type ParsedSSEFrame } from "../shared/sse/parser"
import { recordDataUsage } from "../utils/dataUsage"
import { SSE_RECONNECT_BASE_MS, SSE_RECONNECT_MAX_MS, SSE_HEARTBEAT_TIMEOUT_MS, SSE_CONNECT_TIMEOUT_MS } from "../constants"
import { computeBackoff } from "../utils"

export function useSSE(config: ServerConfig | null, onEvent: (event: SSEEvent) => void, directory?: string, sessionID?: string | null) {
  const [streamState, setStreamState] = useState<StreamState>("polling")
  // Re-ejecuta el efecto cuando health() resuelve el dialecto del server:
  // si arrancamos antes de la detección (auto → v1 por default), el
  // subscription evita que el /event de v2 se conecte en loop.
  const [versionTick, setVersionTick] = useState(0)
  useEffect(() => {
    const unsub = onApiVersionChange(() => setVersionTick((n) => n + 1))
    return unsub
  }, [])
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  // El /event del server filtra por instance.directory: sin el directory de la
  // sesión en el query, descarta todos los eventos (solo pasan heartbeats).
  const directoryRef = useRef(directory)
  directoryRef.current = directory

  // Filtro defensivo en el transporte: el server emite eventos de TODAS las
  // sesiones del directorio. El handler (useSSEHandler) filtra por sessionID,
  // pero su closure puede quedar stale ~1 frame al cambiar de sesión — aquí se
  // descartan los eventos de otra sesión con el ref más reciente.
  const sessionIDRef = useRef<string | null | undefined>(sessionID)
  sessionIDRef.current = sessionID

    // Watchdog de heartbeat: 1 SOLO timer permanente por conexión (startHeartbeat
    // abajo, junto a scheduleReconnect). Cada evento solo actualiza un timestamp
    // (touch) — sin clearTimeout/setTimeout por evento (10-30/s durante streaming
    // = GC churn evitable). Si pasa el timeout sin eventos, fuerza reconexión.
    const lastEventAtRef = useRef(0)
    const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const clearHeartbeat = useCallback(() => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current)
        heartbeatTimerRef.current = null
      }
    }, [])

    const touch = useCallback(() => {
      lastEventAtRef.current = Date.now()
    }, [])

    const connect = useCallback(async () => {
      if (!config || !mountedRef.current) return
    // El dialecto resuelve el endpoint: v2 expone SSE en /api/event.
    // resolveApiVersion es sync (cache memoizado por host) — no bloquea el
    // connect() con un health probe. Si el cache está vacío, cae a v1 y se
    // corrige en background cuando el health detecta v2 (onApiVersionChange
    // re-ejecuta el efecto de conexión).

    abortRef.current?.abort()
    clearHeartbeat()
    const abort = new AbortController()
    abortRef.current = abort

    const url = buildSSEUrl(config, directoryRef.current, sessionIDRef.current ?? undefined)

    const headers: Record<string, string> = { Accept: "text/event-stream" }
    if (config.username && config.password) {
      headers.Authorization = authHeader(config)
    }

    try {
      setStreamState("reconnecting")
      // Timeout de conexión: si el servidor no responde en 8s, abortar y reconectar.
      const connectTimer = setTimeout(() => abort.abort(), SSE_CONNECT_TIMEOUT_MS)
      const response = await fetch(url, {
        headers,
        signal: abort.signal,
        cache: "no-store",
      })
      clearTimeout(connectTimer)
      if (!response.ok || !response.body) {
        throw new Error(`SSE HTTP ${response.status}`)
      }

      reconnectAttemptRef.current = 0
      setStreamState("streaming")

      const reader = response.body.getReader()
      readerRef.current = reader
      startHeartbeat(reader)
      const decoder = new TextDecoder()
      // Parser por conexión: buffer fresco, no arrastra frames de la conexión anterior.
      const parseChunk = createSSEFrameParser()

      const dispatch = (event: Partial<SSEEvent>) => {
        if (event.type === "server.heartbeat") return
        if (event.type === "server.instance.disposed") {
          onEventRef.current({ id: String(event.id ?? ""), type: event.type as string, properties: (event.properties as Record<string, unknown>) ?? {} })
          abort.abort()
          try { reader.cancel() } catch {}
          setStreamState("polling")
          return
        }
        if (event.type === "server.connected") {
          onEventRef.current({ id: String(event.id ?? ""), type: event.type as string, properties: (event.properties as Record<string, unknown>) ?? {} })
          return
        }
        if (event.properties) {
          const props = event.properties as Record<string, unknown>
          const visible = sessionIDRef.current
          if (visible) {
            // v2 anida el payload en `data`; v1 en la raíz de properties.
            const nested = (props.data && typeof props.data === "object" ? props.data : null) as Record<string, unknown> | null
            // v1: el sessionID puede vivir dentro de `part` (tool task/subagente).
            const partObj = (props.part && typeof props.part === "object" ? props.part : null) as Record<string, unknown> | null
            // El tool part del SUBAGENTE (task) trae el sessionID de la sesión
            // HIJA en part.sessionID — su tarjeta pertenece al chat del padre,
            // así que NO se filtra por sesión (el resto de eventos ajenos sí).
            // NOTA: SOLO las tarjetas 'task'/'subagent' pertenecen al padre. Las tools internas (read, bash, etc.)
            // pertenecen a la sesión hija y NO deben inyectarse en el chat del padre.
            const isSubagentTaskPart = event.type === "message.part.updated" &&
              !!partObj && (partObj.tool === "task" || partObj.tool === "subagent" || !!(partObj.state as Record<string, unknown>)?.input)
            if (!isSubagentTaskPart) {
              const evtSession = (props.sessionID ?? nested?.sessionID ?? partObj?.sessionID) as string | undefined
              if (typeof evtSession === "string" && evtSession !== visible) return
            }
            onEventRef.current({
              id: String(event.id ?? props.id ?? ""),
              type: event.type as string,
              properties: props,
            })
          }
        }
      }

      const emitFrames = (frames: ParsedSSEFrame[]) => {
        for (const frame of frames) {
          touch()
          dispatch(frame)
        }
      }

      const pump = async () => {
        while (mountedRef.current && !abort.signal.aborted) {
          try {
            const { done, value } = await reader.read()
            if (done) {
              // El server cerró el stream: liberar el reader (fuga) antes de reconectar.
              reader.cancel().catch(() => {})
              break
            }
            recordDataUsage(value.byteLength, "down")
            emitFrames(parseChunk(decoder.decode(value, { stream: true })))
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return
            break
          }
        }
        // Drenar lo que quedó completo en el buffer al cortar la conexión.
        emitFrames(parseChunk(""))
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
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    const attempt = reconnectAttemptRef.current++
    const delay = computeBackoff(SSE_RECONNECT_BASE_MS, SSE_RECONNECT_MAX_MS, attempt)
    reconnectTimerRef.current = setTimeout(() => {
      if (mountedRef.current) connect()
    }, delay)
  }, [connect])

  // Heartbeat: 1 timer por conexión que verifica el timestamp del último evento.
  // Cada 5s checa; si no hubo eventos en SSE_HEARTBEAT_TIMEOUT_MS, reconecta.
  const startHeartbeat = useCallback((reader: ReadableStreamDefaultReader<Uint8Array>) => {
    lastEventAtRef.current = Date.now()
    clearHeartbeat()
    heartbeatTimerRef.current = setInterval(() => {
      if (!mountedRef.current) return
      if (Date.now() - lastEventAtRef.current < SSE_HEARTBEAT_TIMEOUT_MS) return
      abortRef.current?.abort()
      reader.cancel().catch(() => {})
      setStreamState("reconnecting")
      scheduleReconnect()
    }, 5000)
  }, [clearHeartbeat, scheduleReconnect])

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
  }, [Boolean(config), config?.host, config?.port, config?.username, config?.password, clearHeartbeat, connect, directory, versionTick])

  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0
    connect()
  }, [connect])

  return { streamState, reconnect }
}
