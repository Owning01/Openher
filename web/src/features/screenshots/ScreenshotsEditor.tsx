import { memo, useEffect, useState } from "react"
import { shell } from "../../shell"

export const ScreenshotsEditor = memo(function ScreenshotsEditor() {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    shell.external.start("screenshots").then(r => {
      if (cancelled) return
      const u = (r as any)?.url || "http://127.0.0.1:3002"
      setUrl(u)
      setLoading(false)
    }).catch(() => {
      if (!cancelled) { setUrl("http://127.0.0.1:3002"); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [])

  if (loading) return <div style={{ padding: 24, color: "var(--muted)" }}>Iniciando editor…</div>
  if (!url) return <div style={{ padding: 24, color: "var(--danger)" }}>No se pudo iniciar Screenshots</div>

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", background: "var(--surface)", fontSize: 12, color: "var(--muted)" }}>
        Integrado en Openher — mismo código de <code>0 screenshots</code> pero cargado on-demand (sin RAM hasta click). Próximo: portar <code>src/lib/*</code> a Vite nativo.
      </div>
      <iframe
        src={url}
        style={{ flex: 1, border: "none", background: "white" }}
        title="Screenshots Editor"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  )
})
