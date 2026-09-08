// Visor de PDF ultra-ligero (0 KB de dependencias).
// Usa el motor PDF nativo del navegador / WebView2 mediante <object>/<iframe>
// con URL blob segura y controles de fallback y revelado de archivo.

import { memo, useEffect, useState } from "react"
import { shell } from "../shell"
import { FolderIcon } from "../Icons"

type Props = { path: string }

export const PdfViewer = memo(function PdfViewer({ path }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    let currentUrl: string | null = null

    setStatus("loading")
    setErrorMsg("")

    ;(async () => {
      try {
        const blob = await shell.fs.download(path)
        if (cancelled) return
        // Aseguramos el mime-type application/pdf para que el motor nativo lo interprete correctamente
        const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" })
        currentUrl = URL.createObjectURL(pdfBlob)
        setBlobUrl(currentUrl)
        setStatus("ready")
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err instanceof Error ? err.message : String(err))
        setStatus("error")
      }
    })()

    return () => {
      cancelled = true
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [path, reloadTick])

  const btn = "file-editor-md-btn" as const

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "var(--surface)" }}>
      {/* Barra superior de herramientas */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-subtle)",
        }}
      >
        <span style={{ fontSize: ".8rem", color: "var(--muted-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {path.split(/[/\\]/).pop()}
        </span>

        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {blobUrl && (
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={btn}
              style={{ textDecoration: "none", fontSize: ".75rem", padding: "3px 8px" }}
              title="Abrir en ventana nueva"
            >
              Abrir en ventana
            </a>
          )}
          <button
            type="button"
            className={btn}
            title="Revelar en carpeta"
            aria-label="Revelar en carpeta"
            onClick={() => {
              void shell.fs.reveal(path).catch(() => {})
            }}
          >
            <FolderIcon size={13} />
          </button>
        </span>
      </div>

      {/* Visor nativo con 0 KB de sobrecarga */}
      <div
        role="region"
        aria-label={`Vista previa de ${path}`}
        style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", width: "100%", height: "100%" }}
      >
        {status === "loading" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
            Cargando documento PDF…
          </div>
        )}

        {status === "error" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--danger)", padding: 20, textAlign: "center" }}>
            <p style={{ marginBottom: 12 }}>No se pudo abrir el PDF: {errorMsg}</p>
            <button type="button" className="btn-secondary compact" onClick={() => setReloadTick((t) => t + 1)}>
              Reintentar
            </button>
          </div>
        )}

        {status === "ready" && blobUrl && (
          <object
            data={blobUrl}
            type="application/pdf"
            style={{ width: "100%", height: "100%", border: "none", flex: 1 }}
          >
            <iframe
              src={blobUrl}
              title={path}
              style={{ width: "100%", height: "100%", border: "none" }}
            >
              <div style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
                Tu navegador no soporta visualización incrustada de PDF.{" "}
                <a href={blobUrl} download={path.split(/[/\\]/).pop()} style={{ color: "var(--primary)" }}>
                  Descargar archivo
                </a>
              </div>
            </iframe>
          </object>
        )}
      </div>
    </div>
  )
})

export default PdfViewer
