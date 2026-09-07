import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useScheduled } from "../../hooks/useScheduled"

const SCREENSHOTS_URL = "http://127.0.0.1:3002"

export const ScreenshotsEditor = memo(function ScreenshotsEditor() {
  const [status, setStatus] = useState<"checking" | "ready" | "offline">("checking")

  const probe = useCallback(async () => {
    try {
      const r = await fetch(SCREENSHOTS_URL, { method: "HEAD", cache: "no-store" })
      if (r.ok) setStatus("ready")
      else setStatus((prev) => (prev === "checking" ? "offline" : prev))
    } catch {
      setStatus((prev) => (prev === "checking" ? "offline" : prev))
    }
  }, [])

  // Reloj central (Plan 3): el probe inmediato lo hace el effect de abajo al
  // cambiar status; el scheduler solo reintenta mientras no esté ready.
  useScheduled("screenshots-probe", 3000, probe, { enabled: status !== "ready" })

  useEffect(() => {
    if (status === "ready") return
    let cancelled = false
    fetch(SCREENSHOTS_URL, { method: "HEAD", cache: "no-store" })
      .then(r => { if (!cancelled) setStatus(r.ok ? "ready" : "offline") })
      .catch(() => { if (!cancelled) setStatus("offline") })
    return () => { cancelled = true }
  }, [status])

  if (status === "checking") return <div style={{ padding: 24, color: "var(--muted)" }}>Verificando 0 screenshots en {SCREENSHOTS_URL}…</div>
  if (status === "offline") return (
    <div style={{ padding: 24 }}>
      <div style={{ color: "var(--danger)", marginBottom: 12 }}>0 screenshots no responde en {SCREENSHOTS_URL}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>Ejecuta en <code>G:\Proyectos\0 screenshots</code>: <code>pnpm dev</code> (Next dev, sin pasar por plugins). Ya no usa <code>/shell/external</code>.</div>
      <button onClick={() => setStatus("checking")} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer" }}>Reintentar</button>
    </div>
  )

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "6px 12px", borderBottom: "1px solid var(--border)", background: "var(--surface)", fontSize: 11, color: "var(--muted)" }}>
        0 screenshots standalone — <code>{SCREENSHOTS_URL}</code> (fuera de plugins, sin RAM del desktop hasta abrir)
      </div>
      <iframe src={SCREENSHOTS_URL} style={{ flex: 1, border: "none", background: "white" }} title="Screenshots Editor" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
    </div>
  )
})
