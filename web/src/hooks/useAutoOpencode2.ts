import { useState, useEffect, useCallback, useRef } from "react"
import { shell } from "../shell"

const KEY = "opencode.auto_opencode2"
const EVT = "opencode:auto-opencode2-toggle"

/**
 * Arranque automático del servidor OpenHer (:4098) en modo headless.
 *
 * Antes este flag abría una terminal inferior con `opencode2` (PTY); ese path
 * se quitó porque el server debe correr desprendido y sin consola. Ahora el
 * toggle sólo persiste la preferencia en la config del desktop
 * (`opencode2_enabled`, que `ensure_opencode2_running` respeta al iniciar) y,
 * al activarlo, levanta el server headless ahora mismo.
 */
export function useAutoOpencode2(): {
  enabled: boolean
  setEnabled: (v: boolean) => void
  toggle: () => void
} {
  const [enabled, setEnabledState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(KEY) === "1"
    } catch {
      return false
    }
  })

  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    let cancelled = false
    // El server puede venir habilitado por config (opencode2_enabled) aunque el
    // localStorage local no lo sepa (primer arranque / otra máquina).
    Promise.all([
      shell.config.get().catch(() => null),
      shell.opencode2.autostartGet().catch(() => null),
    ]).then(([c, a]) => {
      if (cancelled) return
      const cfg = c as { auto_opencode2?: boolean; opencode2_enabled?: boolean } | null
      const on = Boolean(a?.opencode2_enabled ?? cfg?.opencode2_enabled ?? cfg?.auto_opencode2)
      if (on && !enabledRef.current) {
        setEnabledState(true)
        try { localStorage.setItem(KEY, "1") } catch {}
      }
    })

    const onStorage = (): void => {
      try {
        setEnabledState(localStorage.getItem(KEY) === "1")
      } catch {}
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener(EVT, onStorage as EventListener)
    return () => {
      cancelled = true
      window.removeEventListener("storage", onStorage)
      window.removeEventListener(EVT, onStorage as EventListener)
    }
  }, [])

  const setEnabled = useCallback((v: boolean): void => {
    setEnabledState(v)
    try {
      localStorage.setItem(KEY, v ? "1" : "0")
    } catch {}
    void shell.config
      .patch({ auto_opencode2: v, opencode2_enabled: v } as Parameters<typeof shell.config.patch>[0])
      .catch(() => {})
    void shell.opencode2.autostartSet(v).catch(() => {})
    if (v) void shell.opencode2.ensure().catch(() => {})
    try {
      window.dispatchEvent(new Event(EVT))
    } catch {}
  }, [])

  const toggle = useCallback((): void => {
    setEnabled(!enabledRef.current)
  }, [setEnabled])

  return { enabled, setEnabled, toggle }
}
