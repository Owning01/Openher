import { useEffect, useRef } from "react"
import { POLL_BACKOFF_BASE_MS, POLL_BACKOFF_MAX_MS, POLL_BACKOFF_JITTER, POLL_MAX_RETRIES } from "../constants"
import { computeBackoff } from "../utils"

export type PollingControl = {
  pause: () => void
  resume: () => void
  fail: () => void
  succeed: () => void
}

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
  const busyRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onVisibilityRef = useRef<(() => void) | null>(null)
  const controlRef = useRef<PollingControl>({ pause: () => {}, resume: () => {}, fail: () => {}, succeed: () => {} })

  useEffect(() => {
    let mounted = true
    pausedRef.current = false
    failCountRef.current = 0
    busyRef.current = false

    function isPageVisible() {
      return document.visibilityState === "visible"
    }

    function computeDelay(): number {
      return computeBackoff(POLL_BACKOFF_BASE_MS, POLL_BACKOFF_MAX_MS, failCountRef.current, POLL_BACKOFF_JITTER)
    }

    async function tick() {
      // Anti-solapamiento: si el tick anterior (fetch de sesiones + mensajes)
      // sigue en vuelo, descartar este — evita 2-3 fetches concurrentes
      // cuando el server tarda más que el intervalo.
      if (!mounted || !isPageVisible() || pausedRef.current || busyRef.current) return
      busyRef.current = true
      try {
        await savedCallback.current()
        if (streamActive) failCountRef.current = 0
        else if (failCountRef.current > 0) failCountRef.current = Math.max(0, failCountRef.current - 1)
      } catch (e) {
        failCountRef.current++
        console.warn("poll error", failCountRef.current, e)
      } finally {
        busyRef.current = false
      }
    }

    function schedule() {
      if (!mounted) return
      const delay = streamActive ? intervalMs : (failCountRef.current > 0 ? computeDelay() : intervalMs)
      timerRef.current = setInterval(tick, delay)
    }

    schedule()

    const onVisibility = () => {
      if (isPageVisible()) tick()
    }
    document.addEventListener("visibilitychange", onVisibility)
    onVisibilityRef.current = onVisibility

    controlRef.current = {
      pause: () => { pausedRef.current = true },
      resume: () => {
        pausedRef.current = false
        failCountRef.current = 0
        if (timerRef.current) {
          clearInterval(timerRef.current)
          schedule()
        }
      },
      fail: () => {
        failCountRef.current = Math.min(failCountRef.current + 1, POLL_MAX_RETRIES)
        if (timerRef.current) {
          clearInterval(timerRef.current)
          schedule()
        }
      },
      succeed: () => {
        failCountRef.current = 0
      }
    }

    return () => {
      mounted = false
      if (timerRef.current) clearInterval(timerRef.current)
      if (onVisibilityRef.current) document.removeEventListener("visibilitychange", onVisibilityRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, streamActive, ...deps])

  return {
    pause: () => controlRef.current.pause(),
    resume: () => controlRef.current.resume(),
    fail: () => controlRef.current.fail(),
    succeed: () => controlRef.current.succeed()
  }
}
