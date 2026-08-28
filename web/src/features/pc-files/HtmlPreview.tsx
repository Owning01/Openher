import { useEffect, useState } from "react"
import { shell } from "../../shell"

type Props = {
  path: string
  onClose: () => void
}

export function HtmlPreview({ path, onClose }: Props) {
  const [mode, setMode] = useState<"preview" | "code">("preview")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [code, setCode] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setPreviewUrl(null)
    setCode("")

    const dir = path.includes("\\") ? path.slice(0, path.lastIndexOf("\\")) : path.slice(0, path.lastIndexOf("/"))
    const fileName = path.split(/[/\\]/).pop() ?? ""

    const load = async () => {
      try {
        const [proj, file] = await Promise.all([
          shell.project.serve(dir || path).catch(() => null),
          shell.fs.read(path).catch(() => null),
        ])
        if (cancelled) return
        if (file) {
          const raw = file as unknown as Record<string, unknown>
          const text = (raw.content as string) ?? (raw.data as string) ?? (raw.text as string) ?? ""
          if (typeof text === "string" && text) setCode(text.slice(0, 200000))
          else if (typeof file === "string") setCode(String(file).slice(0, 200000))
        }
        if (proj?.previewUrl && proj?.token) {
          const token = proj.token
          const preview = `${window.location.origin}/shell/preview/${token}/${encodeURIComponent(fileName)}`
          // Use token preview which injects <base> and serves via mmap
          // Fallback to direct previewUrl if token fails
          setPreviewUrl(preview)
        } else if (proj?.previewUrl) {
          // proj.previewUrl is generic entrypoint, replace with file
          const base = proj.previewUrl.split("/shell/preview/")[0]
          const token = proj.token
          if (token) setPreviewUrl(`${base}/shell/preview/${token}/${encodeURIComponent(fileName)}`)
          else setPreviewUrl(proj.previewUrl)
        } else {
          // Fallback: use srcDoc with code
          setPreviewUrl(null)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [path])

  const fileName = path.split(/[/\\]/).pop() ?? path

  return (
    <div className="pcf-html-preview">
      <div className="pcf-html-preview-header">
        <div className="pcf-html-preview-info">
          <span className="pcf-html-preview-file" title={path}>
            {fileName}
          </span>
          <span className="pcf-html-preview-path" title={path}>
            {path}
          </span>
        </div>
        <div className="pcf-html-preview-actions">
          <div className="pcf-html-tabs">
            <button
              type="button"
              className={`pcf-html-tab ${mode === "preview" ? "active" : ""}`}
              onClick={() => setMode("preview")}
            >
              Vista
            </button>
            <button
              type="button"
              className={`pcf-html-tab ${mode === "code" ? "active" : ""}`}
              onClick={() => setMode("code")}
            >
              Código
            </button>
          </div>
          <button type="button" className="btn-icon compact" onClick={onClose} aria-label="Cerrar visor" title="Cerrar">
            ×
          </button>
        </div>
      </div>
      <div className="pcf-html-preview-body">
        {loading ? (
          <div className="pcf-loading">Cargando…</div>
        ) : error ? (
          <div className="pcf-error">{error}</div>
        ) : mode === "preview" ? (
          previewUrl ? (
            <iframe
              title={`preview-${fileName}`}
              src={previewUrl}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              style={{ width: "100%", height: "100%", border: "none", background: "white" }}
            />
          ) : code ? (
            <iframe
              title={`preview-${fileName}`}
              srcDoc={code}
              sandbox="allow-scripts allow-same-origin"
              style={{ width: "100%", height: "100%", border: "none", background: "white" }}
            />
          ) : (
            <div className="pcf-empty">Sin contenido para vista previa</div>
          )
        ) : (
          <pre className="pcf-code-content" style={{ margin: 0, padding: 12, overflow: "auto", height: "100%" }}>
            {code || "—"}
          </pre>
        )}
      </div>
    </div>
  )
}
