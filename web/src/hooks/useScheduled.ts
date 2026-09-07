import { useEffect, useRef } from "react"
import { scheduler } from "../utils/scheduler"

/**
 * Registra una tarea en el scheduler central (Plan 3).
 * Reemplazo drop-in de `useEffect(() => { const id = setInterval(fn, ms) ... })`.
 */
export function useScheduled(
  key: string,
  intervalMs: number,
  fn: () => void | Promise<void>,
  opts: { onlyWhenVisible?: boolean; runOnRegister?: boolean; enabled?: boolean } = {},
) {
  const fnRef = useRef(fn)
  fnRef.current = fn
  const { onlyWhenVisible, runOnRegister, enabled = true } = opts

  useEffect(() => {
    if (!enabled) return
    scheduler.register(key, intervalMs, () => fnRef.current(), { onlyWhenVisible, runOnRegister })
    return () => scheduler.unregister(key)
  }, [key, intervalMs, onlyWhenVisible, runOnRegister, enabled])
}
