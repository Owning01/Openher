import { useEffect, useState } from "react"
import { Capacitor } from "@capacitor/core"

function syncDesktopAttr(v: boolean) {
  if (typeof document === "undefined") return
  document.documentElement.setAttribute("data-desktop", v ? "true" : "false")
}

function getIsDesktopSync(): boolean {
  if (typeof window === "undefined") return false
  // desktop-app (wry) inyecta window.__OPENCODE_DESKTOP__ = true (main.rs:297)
  if ((window as unknown as Record<string, unknown>).__OPENCODE_DESKTOP__) return true
  // APK nativo siempre mobile, aunque el WebView reporte ancho grande en tablets
  try { if (Capacitor.isNativePlatform()) return false } catch {}
  // fallback: por ancho (web dev / preview)
  return window.matchMedia("(min-width: 781px)").matches
}

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(getIsDesktopSync)

  useEffect(() => { syncDesktopAttr(isDesktop) }, [isDesktop])

  useEffect(() => {
    syncDesktopAttr(getIsDesktopSync())
    if ((window as unknown as Record<string, unknown>).__OPENCODE_DESKTOP__) {
      setIsDesktop(true)
      syncDesktopAttr(true)
      return
    }
    try { if (Capacitor.isNativePlatform()) { setIsDesktop(false); syncDesktopAttr(false); return } } catch {}
    const mq = window.matchMedia("(min-width: 781px)")
    const onChange = (e: MediaQueryListEvent) => { setIsDesktop(e.matches); syncDesktopAttr(e.matches) }
    mq.addEventListener("change", onChange)
    const onOffline = () => {
      // offline: el proxy/browser no resolverá; marcar para que BrowserPanel muestre fallback
      try { window.dispatchEvent(new CustomEvent("opencode:offline")) } catch {}
    }
    const onOnline = () => {
      try { window.dispatchEvent(new CustomEvent("opencode:online")) } catch {}
    }
    window.addEventListener("offline", onOffline)
    window.addEventListener("online", onOnline)
    return () => {
      mq.removeEventListener("change", onChange)
      window.removeEventListener("offline", onOffline)
      window.removeEventListener("online", onOnline)
    }
  }, [])

  return isDesktop
}
