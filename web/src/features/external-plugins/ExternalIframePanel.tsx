import { useEffect, useState, useRef } from "react"
import { shell } from "../../shell"

type Props = { name: string; title: string; url: string; isWidget?: boolean }

export function ExternalIframePanel({ name, title, url: defaultUrl, isWidget }: Props) {
  const [url, setUrl] = useState(defaultUrl)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

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
      if (startedRef.current) return
      startedRef.current = true
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
      // auto-stop al cerrar pestaña (profesional, sin botón)
      shell.external.stop(name).catch(() => {})
    }
  }, [name, defaultUrl, isWidget])

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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)" }}>
      <iframe
        src={url}
        title={title}
        style={{ flex: 1, width: "100%", border: "none", background: "var(--surface)" }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}
