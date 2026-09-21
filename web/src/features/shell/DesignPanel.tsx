// Panel Open Design / servidor de proyectos locales. Extraído de
// shellPanels.tsx (F4-P3); conducta idéntica, emojis a iconos Lucide.
import { memo, useEffect, useState } from "react"
import { useDialog } from "../../components/DialogProvider"
import { shell } from "../../shell"
import { useDevServer } from "../../hooks/useDevServer"
import { LoadingIcon, PlayIcon, StopCircleIcon, RefreshIcon, PaintIcon } from "../../Icons"

export const DesignPanel = memo(function DesignPanel({ initialUrl }: { initialUrl?: string }) {
  const { alert } = useDialog()
  const [url, setUrl] = useState(() => localStorage.getItem("od.web.url") || initialUrl || "")
  const [iframeKey, setIframeKey] = useState(0)
  const [status, setStatus] = useState<"loading" | "ready" | "offline">("loading")
  const [customInputUrl, setCustomInputUrl] = useState("")
  const [servedProject, setServedProject] = useState<{
    token: string
    directory: string
    entryPoint: string
    htmlFiles: string[]
    packageType: string
  } | null>(() => {
    try {
      const saved = localStorage.getItem("od.served.project")
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const devServer = useDevServer(servedProject?.directory)

  useEffect(() => {
    let cancelled = false
    setStatus("loading")

    if (devServer.status === "running" && devServer.serverUrl) {
      setUrl(devServer.serverUrl)
      setStatus("ready")
      return
    }

    if (servedProject && servedProject.token) {
      const previewUrl = `${window.location.origin}/shell/preview/${servedProject.token}/${servedProject.entryPoint || "index.html"}`
      setUrl(previewUrl)
      setStatus("ready")
      return
    }

    // Consultar al shell el estado real del daemon
    shell.design.status().then((r: any) => {
      if (cancelled) return
      const discovered = r?.url as string | undefined
      const running = !!r?.running
      if (discovered && running) {
        setUrl(discovered)
        try { localStorage.setItem("od.web.url", discovered) } catch {}
        setStatus("ready")
        return
      }
      if (discovered) {
        fetch(discovered, { mode: "no-cors", cache: "no-store" })
          .then(() => { if (!cancelled) { setUrl(discovered); setStatus("ready") } })
          .catch(() => { if (!cancelled) setStatus("offline") })
      } else {
        setStatus("offline")
      }
    }).catch(() => {
      if (cancelled) return
      setStatus("offline")
    })

    const t = window.setTimeout(() => { if (!cancelled) setStatus((s) => (s === "loading" ? "offline" : s)) }, 3000)
    return () => { cancelled = true; window.clearTimeout(t) }
  }, [iframeKey, servedProject, devServer.status, devServer.serverUrl])

  const handlePickAndServe = async () => {
    try {
      const res = await shell.fs.pickFolder()
      if (res?.ok && res.path) {
        setStatus("loading")
        const serveRes = await shell.project.serve(res.path)
        if (serveRes?.ok && serveRes.token) {
          const p = {
            token: serveRes.token,
            directory: serveRes.directory,
            entryPoint: serveRes.entrypoint || "index.html",
            htmlFiles: serveRes.htmlFiles || ["index.html"],
            packageType: serveRes.hasPackageJson ? "node" : "static",
          }
          setServedProject(p)
          try { localStorage.setItem("od.served.project", JSON.stringify(p)) } catch {}
          const pUrl = `${window.location.origin}/shell/preview/${serveRes.token}/${serveRes.entrypoint || "index.html"}`
          setUrl(pUrl)
          setStatus("ready")
          setIframeKey((k) => k + 1)
        }
      }
    } catch (err: any) {
      void alert({ title: "Error", message: "Error al servir proyecto: " + (err?.message || String(err)) })
      setStatus("offline")
    }
  }

  const handleStartDevServer = async () => {
    try {
      setStatus("loading")
      const sUrl = await devServer.startDevServer()
      if (sUrl) {
        setUrl(sUrl)
        setStatus("ready")
        setIframeKey((k) => k + 1)
      }
    } catch (err: any) {
      void alert({ title: "Error", message: "Error al iniciar dev server: " + (err?.message || String(err)) })
      setStatus("offline")
    }
  }

  const handleSwitchHtml = (file: string) => {
    if (!servedProject) return
    const next = { ...servedProject, entryPoint: file }
    setServedProject(next)
    try { localStorage.setItem("od.served.project", JSON.stringify(next)) } catch {}
    setUrl(`${window.location.origin}/shell/preview/${servedProject.token}/${file}`)
    setIframeKey((k) => k + 1)
  }

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let u = customInputUrl.trim()
    if (!u) return
    if (!/^https?:\/\//i.test(u)) u = `http://${u}`
    setUrl(u)
    setStatus("ready")
    setIframeKey((k) => k + 1)
  }

  const handleCloseProject = () => {
    setServedProject(null)
    try { localStorage.removeItem("od.served.project") } catch {}
    setUrl("")
    setStatus("offline")
  }

  const reload = () => setIframeKey((k) => k + 1)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)" }}>
      {/* Header nativo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", borderBottom: "1px solid var(--border)", background: "var(--surface-subtle)", flexShrink: 0, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Open Design</span>
          {servedProject ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)", overflow: "hidden" }}>
              <span style={{ background: "var(--primary-soft)", color: "var(--primary)", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                {servedProject.directory.split(/[\\/]/).pop()}
              </span>
              {servedProject.htmlFiles.length > 1 && (
                <select
                  value={servedProject.entryPoint}
                  onChange={(e) => handleSwitchHtml(e.target.value)}
                  style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, padding: "2px 4px" }}
                >
                  {servedProject.htmlFiles.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Previsualización y diseño interactivo</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {servedProject && devServer.hasDevServer && devServer.status !== "running" && (
            <button className="btn-primary compact" onClick={handleStartDevServer} disabled={devServer.status === "starting"} title="Iniciar servidor dev con hot-reload">
              {devServer.status === "starting"
                ? <><LoadingIcon size={12} /> Levantando...</>
                : <><PlayIcon size={12} /> Iniciar Dev ({devServer.devCommand || "npm run dev"})</>}
            </button>
          )}
          {devServer.status === "running" && (
            <button className="btn-secondary compact" onClick={devServer.stopDevServer} title="Detener dev server">
              <StopCircleIcon size={12} /> Parar Dev
            </button>
          )}
          <button className="btn-secondary compact" onClick={handlePickAndServe} title="Abrir y servir carpeta de proyecto web">
             Abrir Proyecto
          </button>
          {servedProject && (
            <button className="btn-secondary compact" onClick={handleCloseProject} title="Cerrar proyecto actual">
              
            </button>
          )}
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: status === "ready" ? "var(--success)" : status === "offline" ? "var(--danger)" : "var(--muted)", display: "inline-block" }} />
          <button className="btn-secondary compact" onClick={reload} title="Recargar"><RefreshIcon size={12} /></button>
        </div>
      </div>

      {status === "offline" && !url ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--primary-soft)", border: "1px solid var(--primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "var(--primary)" }}>
            <PaintIcon size={26} />
          </div>
          <div style={{ maxWidth: 440 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: "var(--text)" }}>Servidor de Proyectos & Open Design</div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
              Seleccioná una carpeta de proyecto. Si es un proyecto web con Node/Vite o HTML estático, se levantará automáticamente para inspeccionar sus estilos y diseño visual.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <button className="btn-primary" onClick={handlePickAndServe} style={{ padding: "8px 18px", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <span></span>
              <span>Abrir Carpeta de Proyecto</span>
            </button>
            <button className="btn-secondary" onClick={reload} style={{ padding: "8px 14px" }}>
              Reintentar OpenDesign (:3000)
            </button>
          </div>

          <form onSubmit={handleCustomUrlSubmit} style={{ display: "flex", gap: 6, marginTop: 8, maxWidth: 360, width: "100%" }}>
            <input
              type="text"
              placeholder="O ingresá una URL (ej: localhost:5173)"
              value={customInputUrl}
              onChange={(e) => setCustomInputUrl(e.target.value)}
              style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "var(--text)" }}
            />
            <button type="submit" className="btn-secondary compact" style={{ padding: "6px 12px" }}>
              Ir
            </button>
          </form>
        </div>
      ) : (
        <iframe
          key={iframeKey}
          src={url}
          onLoad={() => setStatus("ready")}
          style={{ flex: 1, border: "none", background: "#fff" }}
          title="Open Design Preview"
          allow="clipboard-read; clipboard-write"
        />
      )}
    </div>
  )
})
