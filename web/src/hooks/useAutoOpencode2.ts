import { useState, useEffect, useCallback, useRef } from "react"
import { shell } from "../shell"
import { setPendingAutoOpencode2 } from "../utils/terminalStore"

const KEY = "opencode.auto_opencode2"
const EVT = "opencode:auto-opencode2-toggle"

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
    shell.config
      .get()
      .then((c) => {
        if (cancelled) return
        if ((c as { auto_opencode2?: boolean })?.auto_opencode2 && !enabledRef.current) {
          setEnabledState(true)
          try {
            localStorage.setItem(KEY, "1")
          } catch {}
        }
      })
      .catch(() => {})

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
    shell.config.patch({ auto_opencode2: v } as Parameters<typeof shell.config.patch>[0]).catch(() => {})
    try {
      window.dispatchEvent(new Event(EVT))
    } catch {}
  }, [])

  const toggle = useCallback((): void => {
    setEnabled(!enabledRef.current)
  }, [setEnabled])

  // Arma el one-shot por sesión: la primera terminal que cree su PTY
  // (shellPanels) consume el pending y ejecuta opencode2. Sin esto el
  // flag enabled nunca se traduce en arranque.
  useEffect(() => {
    if (!enabled) return
    try {
      if (sessionStorage.getItem("opencode.auto_opencode2.pendingDone") === "1") return
      if (sessionStorage.getItem("opencode.auto_opencode2.pending") === "1") return
    } catch {}
    try {
      setPendingAutoOpencode2(true)
    } catch {}
    try {
      sessionStorage.setItem("opencode.auto_opencode2.pendingDone", "1")
    } catch {}
  }, [enabled])

  return { enabled, setEnabled, toggle }
}
