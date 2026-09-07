import { useEffect, useRef, useCallback } from "react"
import { POLL_BACKOFF_BASE_MS, POLL_BACKOFF_MAX_MS, POLL_BACKOFF_JITTER, POLL_MAX_RETRIES } from "../constants"
import { computeBackoff } from "../utils"
import { scheduler } from "../utils/scheduler"

export type PollingControl = {
  pause: () => void
  resume: () => void
  fail: () => void
  succeed: () => void
}

let pollKeyCounter = 0

export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  deps: unknown[] = [],
  streamActive = false
): PollingControl {
  const savedCallback = useRef(callback)
  savedCallback.current = callback
  const failCountRef = useRef(0)
  const pausedRef = useRef(false)
  const keyRef = useRef("")
  if (!keyRef.current) keyRef.current = `polling-${++pollKeyCounter}`
  const paramsRef = useRef({ intervalMs, streamActive })
  paramsRef.current = { intervalMs, streamActive }

  const computeDelay = useCallback((): number => {
    const { intervalMs: base, streamActive: streaming } = paramsRef.current
    if (streaming) return base
    if (failCountRef.current > 0) {
      return computeBackoff(POLL_BACKOFF_BASE_MS, POLL_BACKOFF_MAX_MS, failCountRef.current, POLL_BACKOFF_JITTER)
    }
    return base
  }, [])

  // Tick estable (solo refs): el scheduler lo invoca; anti-solapamiento y
  // pausa en hidden los pone el scheduler central. Sin timer propio.
  const tick = useCallback(async () => {
    if (pausedRef.current) return
    try {
      await savedCallback.current()
      failCountRef.current = 0
    } catch (e) {
      failCountRef.current++
      console.warn("poll error", failCountRef.current, e)
      // Backoff solo después de 2+ fallos consecutivos, igual que antes.
      if (!paramsRef.current.streamActive && failCountRef.current >= 2) {
        scheduler.register(keyRef.current, computeDelay(), tick)
      }
    }
  }, [computeDelay])

  useEffect(() => {
    const key = keyRef.current
    pausedRef.current = false
    failCountRef.current = 0
    scheduler.register(key, intervalMs, tick)
    return () => scheduler.unregister(key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, streamActive, tick, ...deps])

  const pause = useCallback(() => { pausedRef.current = true }, [])
  const resume = useCallback(() => {
    pausedRef.current = false
    failCountRef.current = 0
    scheduler.register(keyRef.current, paramsRef.current.intervalMs, tick)
  }, [tick])
  const fail = useCallback(() => {
    failCountRef.current = Math.min(failCountRef.current + 1, POLL_MAX_RETRIES)
    scheduler.register(keyRef.current, computeDelay(), tick)
  }, [computeDelay, tick])
  const succeed = useCallback(() => {
    failCountRef.current = 0
  }, [])

  return { pause, resume, fail, succeed }
}
