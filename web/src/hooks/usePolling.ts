import { useEffect, useRef } from "react"

export function usePolling(callback: () => void | Promise<void>, intervalMs: number, deps: unknown[] = []) {
  const savedCallback = useRef(callback)
  savedCallback.current = callback

  useEffect(() => {
    let mounted = true

    function isPageVisible() {
      return document.visibilityState === "visible"
    }

    async function tick() {
      if (!mounted || !isPageVisible()) return
      try { await savedCallback.current() } catch { /* polling error swallowed */ }
    }

    tick()
    const id = setInterval(tick, intervalMs)

    const onVisibility = () => {
      if (isPageVisible()) {
        tick()
      }
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      mounted = false
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [intervalMs, ...deps])
}
