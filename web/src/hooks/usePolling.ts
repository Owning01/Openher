import { useEffect, useRef } from "react"
import { POLL_BACKOFF_BASE_MS, POLL_BACKOFF_MAX_MS, POLL_BACKOFF_JITTER, POLL_MAX_RETRIES } from "../constants"

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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onVisibilityRef = useRef<(() => void) | null>(null)
  const controlRef = useRef<PollingControl>({ pause: () => {}, resume: () => {}, fail: () => {}, succeed: () => {} })

  useEffect(() => {
    let mounted = true
    pausedRef.current = false
    failCountRef.current = 0

    function isPageVisible() {
      return document.visibilityState === "visible"
    }

    function computeDelay(): number {
      const base = Math.min(
        POLL_BACKOFF_BASE_MS * Math.pow(2, failCountRef.current),
        POLL_BACKOFF_MAX_MS
      )
      const jitter = base * POLL_BACKOFF_JITTER * Math.random()
      return Math.round(base + jitter)
    }

    async function tick() {
      if (!mounted || !isPageVisible() || pausedRef.current) return
      try {
        await savedCallback.current()
        if (streamActive) failCountRef.current = 0
        else if (failCountRef.current > 0) failCountRef.current = Math.max(0, failCountRef.current - 1)
      } catch (e) {
        failCountRef.current++
        console.warn("poll error", failCountRef.current, e)
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
