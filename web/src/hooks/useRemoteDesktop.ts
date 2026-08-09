import { useCallback, useEffect, useRef, useState } from "react"
import { desktopApi, readMJPEGStream, type DesktopConfig, type DesktopInfo, type StreamParams } from "../desktop"

export type DesktopStatus = "idle" | "connecting" | "streaming" | "error"

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Conecta al agente de escritorio: consume el stream MJPEG (blob URLs por
// frame), calcula fps/bytes y mantiene /info fresco para el selector de fuente.
// El error se mantiene visible hasta que llegue el primer frame (no se
// "esconde" en el loop de reintento) — la vista muestra Fallo + Reintentar.
export function useRemoteDesktop(config: DesktopConfig | null, params: StreamParams, enabled: boolean) {
  const [status, setStatus] = useState<DesktopStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [info, setInfo] = useState<DesktopInfo | null>(null)
  const [fps, setFps] = useState(0)
  const [bytes, setBytes] = useState(0)
  const [latency, setLatency] = useState<number | null>(null)
  const [retryNonce, setRetryNonce] = useState(0)

  const infoRef = useRef<DesktopInfo | null>(null)
  const framesRef = useRef(0)
  const bytesRef = useRef(0)
  const statusRef = useRef<DesktopStatus>("idle")
  const imageUrlRef = useRef<string | null>(null)
  statusRef.current = status
  imageUrlRef.current = imageUrl

  const resetStats = useCallback(() => {
    framesRef.current = 0
    bytesRef.current = 0
    setFps(0)
    setBytes(0)
  }, [])

  const retry = useCallback(() => {
    setError(null)
    setRetryNonce((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!config || !enabled) {
      setStatus("idle")
      setError(null)
      setImageUrl(null)
      setInfo(null)
      infoRef.current = null
      resetStats()
      return
    }
    let cancelled = false
    const controller = new AbortController()
    let fpsTimer: ReturnType<typeof setInterval> | null = null

    resetStats()
    setStatus("connecting")

    fpsTimer = setInterval(() => {
      setFps(framesRef.current)
      framesRef.current = 0
    }, 1000)

    const run = async () => {
      while (!cancelled) {
        try {
          if (!infoRef.current) {
            const i = await desktopApi.info(config)
            if (cancelled) return
            infoRef.current = i
            setInfo(i)
          }
          const lastLatency = Date.now()
          await readMJPEGStream(config, params, controller.signal, (url, len) => {
            if (cancelled) {
              URL.revokeObjectURL(url)
              return
            }
            setImageUrl(url)
            setError(null) // primer frame: la conexión quedó establecida
            framesRef.current++
            bytesRef.current += len
            setBytes(bytesRef.current)
            setLatency(Date.now() - lastLatency)
            if (statusRef.current !== "streaming") setStatus("streaming")
          })
          if (cancelled) return
          // EOF sin abort: el server cerró — reconectar.
          throw new Error("stream closed")
        } catch (err) {
          if (cancelled) return
          if ((err as Error)?.name === "AbortError") return
          // El error queda visible; el loop sigue reintentando en segundo plano.
          if (statusRef.current !== "error") setStatus("error")
          setError((err as Error)?.message ?? "connection failed")
          await sleep(2500)
          if (cancelled) return
          setStatus("connecting")
        }
      }
    }

    void run()

    return () => {
      cancelled = true
      controller.abort()
      if (fpsTimer) clearInterval(fpsTimer)
      // Cero residuos al cerrar: revocar el blob del último frame (el stream
      // se corta con el abort — no se recibe ni se guarda nada más).
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current)
        imageUrlRef.current = null
      }
    }
  }, [config, enabled, params.mode, params.hwnd, params.monitor, params.w, params.q, params.fps, resetStats, retryNonce])

  const refreshInfo = useCallback(async () => {
    if (!config) return null
    try {
      const i = await desktopApi.info(config)
      infoRef.current = i
      setInfo(i)
      return i
    } catch {
      return infoRef.current
    }
  }, [config])

  return { status, error, imageUrl, info, fps, bytes, latency, refreshInfo, retry }
}
