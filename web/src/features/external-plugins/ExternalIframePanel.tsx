import { useEffect, useState, useCallback, useRef } from "react"
import { shell } from "../../shell"

type Props = { name: string; title: string; url: string; isWidget?: boolean }

export function ExternalIframePanel({ name, title, url: defaultUrl, isWidget }: Props) {
  const [url, setUrl] = useState(defaultUrl)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(() => {
    try {
      const v = localStorage.getItem(`opencode.plugin.zoom.${name}`)
      const n = v ? parseFloat(v) : 1
      return Number.isFinite(n) ? Math.min(2, Math.max(0.5, n)) : 1
    } catch { return 1 }
  })
  const containerRef = useRef<HTMLDivElement>(null)

  // reset cuando cambia el plugin (evita mostrar URL stale del plugin anterior)
  useEffect(() => {
    setUrl(defaultUrl)
    setStatus("loading")
    setError(null)
  }, [name, defaultUrl])

  useEffect(() => {
    let cancelled = false
    let pollTimer = 0 as any

    const pollReady = async (targetUrl: string) => {
      // poll hasta que el iframe responda o timeout 30s
      for (let i = 0; i < 30; i++) {
        if (cancelled) return
        try {
          const s = await shell.external.status(name)
          if (s?.running) {
            if (!cancelled) {
              setUrl(s.url || targetUrl)
              setStatus("ready")
            }
            return
          }
        } catch {}
        // también probar fetch directo
        try {
          await fetch(targetUrl, { mode: "no-cors", cache: "no-store" })
          if (!cancelled) {
            setStatus("ready")
            return
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 1000))
      }
      if (!cancelled) setStatus("error")
    }

    const start = async () => {
      try {
        // widget_notas no tiene url, solo lanza proceso
        if (isWidget) {
          await shell.external.start(name)
          if (!cancelled) setStatus("ready")
          return
        }
        const res: any = await shell.external.start(name)
        const target = res?.url || defaultUrl
        if (!cancelled) setUrl(target)
        // si ya estaba corriendo, ready inmediato
        if (res?.already) {
          if (!cancelled) setStatus("ready")
          return
        }
        // poll hasta ready
        await pollReady(target)
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || String(e))
          setStatus("error")
        }
      }
    }

    start()

    return () => {
      cancelled = true
      clearTimeout(pollTimer)
      // No auto-stop al cambiar de pestaña: el iframe queda vivo y no se reinicia.
      // El stop se hace solo al cerrar la pestaña (onRemoveTab) o al desmontar el grid.
    }
  }, [name, defaultUrl, isWidget])

  useEffect(() => {
    try { localStorage.setItem(`opencode.plugin.zoom.${name}`, String(zoom)) } catch {}
  }, [name, zoom])

  const clampZoom = useCallback((v: number) => Math.min(2, Math.max(0.5, Math.round(v * 10) / 10)), [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const step = e.deltaY > 0 ? -0.1 : 0.1
      setZoom((z) => clampZoom(z + step))
    }
  }, [clampZoom])

  // evita zoom nativo del WebView2 (Ctrl+rueda) y deja solo nuestro zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault()
    }
    el.addEventListener("wheel", onNativeWheel, { passive: false })
    return () => el.removeEventListener("wheel", onNativeWheel)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key === "0") {
        e.preventDefault()
        setZoom(1)
      } else if (e.key === "+" || e.key === "=" || e.key === "Add") {
        e.preventDefault()
        setZoom((z) => clampZoom(z + 0.1))
      } else if (e.key === "-" || e.key === "Subtract") {
        e.preventDefault()
        setZoom((z) => clampZoom(z - 0.1))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [clampZoom])

  if (isWidget) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--primary-soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "var(--primary)" }}>◈</div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, maxWidth: 360 }}>
          {status === "loading" ? "Lanzando widget nativo..." : status === "ready" ? "Widget en ejecución en ventana independiente." : `Error: ${error || "no se pudo lanzar"}`}
        </div>
        {status === "loading" && <div className="animate-spin" style={{ width: 20, height: 20, border: "2px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%" }} />}
      </div>
    )
  }

  if (status === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--primary-soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "var(--primary)" }}>◈</div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Iniciando dev server...</div>
        <div className="animate-spin" style={{ width: 20, height: 20, border: "2px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%" }} />
        <div style={{ fontSize: 11, color: "var(--muted)", maxWidth: 320 }}>{url}</div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>No se pudo iniciar {title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", maxWidth: 360 }}>{error || url}</div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>Verificá que pnpm/flutter esté instalado y el proyecto exista.</div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)", position: "relative", overflow: "hidden" }}
      title="Ctrl + rueda para zoom"
    >
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", position: "relative", background: "var(--surface)" }}>
        <iframe
          src={url}
          title={title}
          style={{
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`,
            border: "none",
            background: "var(--surface)",
            transform: `scale(${zoom})`,
            transformOrigin: "0 0",
            position: "absolute",
            inset: 0,
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          allow="clipboard-read; clipboard-write"
        />
      </div>
      {/* zoom bar — gris suave, no intrusivo */}
      <div
        style={{
          position: "absolute",
          right: 10,
          bottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(24,24,27,0.92)",
          border: "1px solid rgba(161,161,170,0.18)",
          borderRadius: 8,
          padding: "4px 6px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
          backdropFilter: "blur(6px)",
          zIndex: 5,
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        <button
          type="button"
          onClick={() => setZoom((z) => clampZoom(z - 0.1))}
          disabled={zoom <= 0.5}
          title="Alejar (Ctrl -)"
          style={{
            width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(161,161,170,0.14)",
            background: "rgba(161,161,170,0.10)", color: "rgba(244,244,245,0.95)",
            cursor: zoom <= 0.5 ? "not-allowed" : "pointer", fontSize: 14, lineHeight: 1, opacity: zoom <= 0.5 ? 0.45 : 1,
          }}
        >
          −
        </button>
        <span
          onClick={() => setZoom(1)}
          title="Click para 100% (Ctrl+0)"
          style={{
            minWidth: 44, textAlign: "center", fontSize: 11, fontWeight: 600, fontFamily: "monospace",
            color: "rgba(161,161,170,0.95)", background: "rgba(161,161,170,0.08)",
            border: "1px solid rgba(161,161,170,0.10)", borderRadius: 6, padding: "3px 6px", cursor: "pointer",
          }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoom((z) => clampZoom(z + 0.1))}
          disabled={zoom >= 2}
          title="Acercar (Ctrl +)"
          style={{
            width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(161,161,170,0.14)",
            background: "rgba(161,161,170,0.10)", color: "rgba(244,244,245,0.95)",
            cursor: zoom >= 2 ? "not-allowed" : "pointer", fontSize: 14, lineHeight: 1, opacity: zoom >= 2 ? 0.45 : 1,
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}
