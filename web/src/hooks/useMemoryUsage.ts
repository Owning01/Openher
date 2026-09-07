import { useCallback, useState } from "react"
import { useScheduled } from "./useScheduled"

export interface MemoryInfo {
  jsHeapUsed: number
  jsHeapTotal: number
  /** RSS nativo de los WebView2 propios (renderer + sub-WebView + GPU), vía /shell/mem (solo desktop). */
  webviewRss?: number
  /** RSS nativo del proceso app (host Rust), vía /shell/mem (solo desktop). */
  appRss?: number
}

export function useMemoryUsage(intervalMs = 5000): MemoryInfo | null {
  const [mem, setMem] = useState<MemoryInfo | null>(null)
  const perf = typeof performance !== "undefined" ? (performance as any) : null
  const supported = !!perf?.memory

  const poll = useCallback(() => {
    if (!perf?.memory) return
    try {
      setMem((prev) => ({
        jsHeapUsed: perf.memory.usedJSHeapSize,
        jsHeapTotal: perf.memory.totalJSHeapSize,
        // Conservar el último valor nativo: el fetch es best-effort.
        ...(prev?.webviewRss ? { webviewRss: prev.webviewRss } : {}),
        ...(prev?.appRss ? { appRss: prev.appRss } : {}),
      }));
    } catch { /* ignore */ }
    // RAM del WebView nativo (misma origen en desktop; inexistente en
    // web remota/APK → se ignora en silencio y el chip muestra solo JS).
    fetch("/shell/mem", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j || typeof j.webview_rss !== "number") return
        const webviewRss = j.webview_rss > 0 ? j.webview_rss : undefined
        const appRss = typeof j.app_rss === "number" && j.app_rss > 0 ? j.app_rss : undefined
        if (webviewRss === undefined && appRss === undefined) return
        setMem((prev) =>
          prev ? { ...prev, ...(webviewRss ? { webviewRss } : {}), ...(appRss ? { appRss } : {}) } : prev
        )
      })
      .catch(() => {})
  }, [perf])

  // Reloj central (Plan 3) con poll inmediato.
  useScheduled("memory-usage", intervalMs, poll, { enabled: supported, runOnRegister: true })

  return mem
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}K`
  return `${(bytes / (1024 * 1024)).toFixed(0)}m`
}
