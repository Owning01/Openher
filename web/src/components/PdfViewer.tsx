// Visor de PDF bajo demanda para tabs del editor de escritorio.
// pdf.js se importa dinámicamente dentro del efecto: el chunk (y su worker)
// solo se descarga cuando se abre un .pdf por primera vez.

import { memo, useCallback, useEffect, useRef, useState } from "react"
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist"
import { shell } from "../shell"
import { ArrowLeftIcon, FolderIcon } from "../Icons"

// URL del worker como asset local (offline-friendly); no descarga nada hasta renderizar.
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"

type Props = { path: string }

const isPdfPath = (p: string): boolean => /\.pdf$/i.test(p)

export const PdfViewer = memo(function PdfViewer({ path }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const docRef = useRef<PDFDocumentProxy | null>(null)
  const taskRef = useRef<{ cancel: () => void } | null>(null)
  // El loadingTask es dueño del ciclo de vida (doc + worker) en pdf.js v6
  const loadTaskRef = useRef<PDFDocumentLoadingTask | null>(null)

  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  // null = ajustar al ancho del contenedor; number = zoom manual
  const [scaleOverride, setScaleOverride] = useState<number | null>(null)
  const [fitPct, setFitPct] = useState(100)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [reloadTick, setReloadTick] = useState(0)
  // Re-dispara SOLO el render (resize / zoom fit) sin recargar el documento
  const [renderTick, setRenderTick] = useState(0)

  useEffect(() => {
    if (!isPdfPath(path)) return
    let cancelled = false
    let doc: PDFDocumentProxy | null = null

    setStatus("loading")
    setErrorMsg("")
    setScaleOverride(null)
    setPage(1)
    setNumPages(0)
    void loadTaskRef.current?.destroy()
    docRef.current = null
    loadTaskRef.current = null

    ;(async () => {
      try {
        const [blob, pdfjs] = await Promise.all([
          shell.fs.download(path),
          import("pdfjs-dist"),
        ])
        if (cancelled) return
        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
        const data = new Uint8Array(await blob.arrayBuffer())
        const task = pdfjs.getDocument({ data })
        loadTaskRef.current = task
        doc = await task.promise
        if (cancelled) {
          void task.destroy()
          return
        }
        docRef.current = doc
        setNumPages(doc.numPages)
        setStatus("ready")
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err instanceof Error ? err.message : String(err))
        setStatus("error")
      }
    })()

    return () => {
      cancelled = true
      try { taskRef.current?.cancel() } catch {}
      void loadTaskRef.current?.destroy()
      if (docRef.current === doc) docRef.current = null
    }
  }, [path, reloadTick])

  // Render de la página actual (canvas @ devicePixelRatio)
  useEffect(() => {
    if (status !== "ready") return
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const doc = docRef.current
    if (!canvas || !wrap || !doc) return
    let cancelled = false

    const run = async (): Promise<void> => {
      try {
        const p = await doc.getPage(Math.min(Math.max(page, 1), numPages))
        if (cancelled) return
        const base = p.getViewport({ scale: 1 })
        const containerW = Math.max(wrap.clientWidth - 32, 120)
        const scale = scaleOverride ?? Math.max(0.2, containerW / base.width)
        setFitPct(Math.round(scale * 100))
        const dpr = window.devicePixelRatio || 1
        const viewport = p.getViewport({ scale: scale * dpr })
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width = `${Math.floor(viewport.width / dpr)}px`
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`
        const renderTask = p.render({ canvas, canvasContext: ctx, viewport })
        taskRef.current = renderTask
        await renderTask.promise
        if (cancelled) renderTask.cancel()
      } catch (err) {
        // RenderingCancelledException es esperado al cambiar rápido
        if (!cancelled && !(err instanceof Error && err.name === "RenderingCancelledException")) {
          setErrorMsg(err instanceof Error ? err.message : String(err))
          setStatus("error")
        }
      }
    }
    void run()
    return () => { cancelled = true }
  }, [status, page, numPages, scaleOverride, renderTick])

  // Re-fit al redimensionar el contenedor (solo si no hay zoom manual)
  useEffect(() => {
    if (status !== "ready" || scaleOverride !== null) return
    const wrap = wrapRef.current
    if (!wrap || typeof ResizeObserver === "undefined") return
    let first = true
    const ro = new ResizeObserver(() => {
      if (first) { first = false; return }
      setRenderTick((t) => t + 1)
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [status, scaleOverride])

  const zoomIn = useCallback(() => {
    setScaleOverride((s) => {
      const cur = s ?? fitPct / 100
      return Math.min(4, Math.round((cur + 0.15) * 100) / 100)
    })
  }, [fitPct])
  const zoomOut = useCallback(() => {
    setScaleOverride((s) => {
      const cur = s ?? fitPct / 100
      return Math.max(0.25, Math.round((cur - 0.15) * 100) / 100)
    })
  }, [fitPct])
  const zoomReset = useCallback(() => setScaleOverride(null), [])

  const btn = "file-editor-md-btn" as const

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "var(--surface)" }}>
      {/* Barra estilo header de terminal, tokens de la app */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", flexShrink: 0,
        borderBottom: "1px solid var(--border)", background: "var(--surface-subtle)",
      }}>
        <button type="button" className={btn} disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))} title="Página anterior" aria-label="Página anterior">
          <ArrowLeftIcon size={13} />
        </button>
        <span style={{ fontSize: ".8rem", color: "var(--muted-strong)", minWidth: 70, textAlign: "center" }} aria-live="polite">
          {status === "ready" ? `${page} / ${numPages}` : "—"}
        </span>
        <button type="button" className={btn} disabled={page >= numPages}
          onClick={() => setPage((p) => Math.min(numPages, p + 1))}
          title="Página siguiente" aria-label="Página siguiente">
          <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><ArrowLeftIcon size={13} /></span>
        </button>

        <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 4px" }} />

        <button type="button" className={btn} onClick={zoomOut} disabled={status !== "ready"} title="Zoom menos" aria-label="Zoom menos">−</button>
        <button type="button" className={btn} onClick={zoomReset} disabled={status !== "ready"}
          title="Restablecer zoom (ajustar al ancho)" aria-label="Restablecer zoom">
          {scaleOverride ? `${Math.round(scaleOverride * 100)}%` : `${fitPct}%`}
        </button>
        <button type="button" className={btn} onClick={zoomIn} disabled={status !== "ready"} title="Zoom más" aria-label="Zoom más">+</button>

        <span style={{ marginLeft: "auto" }}>
          <button type="button" className={btn} title="Revelar en carpeta" aria-label="Revelar en carpeta"
            onClick={() => { void shell.fs.reveal(path).catch(() => {}) }}>
            <FolderIcon size={13} />
          </button>
        </span>
      </div>

      {/* Área de página */}
      <div ref={wrapRef} role="region" aria-label={`Vista previa de ${path}`}
        style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", justifyContent: "center", padding: 16 }}>
        {status === "loading" && (
          <div style={{ alignSelf: "center", color: "var(--muted)", display: "flex", alignItems: "center", gap: 10 }}>
            Cargando visor PDF…
          </div>
        )}
        {status === "error" && (
          <div style={{ alignSelf: "center", textAlign: "center", color: "var(--danger)", maxWidth: 420 }}>
            <p style={{ marginBottom: 12 }}>No se pudo abrir el PDF: {errorMsg}</p>
            <button type="button" className="btn-secondary compact" onClick={() => setReloadTick((t) => t + 1)}>Reintentar</button>
          </div>
        )}
        <canvas ref={canvasRef} aria-hidden="true"
          style={{ display: status === "ready" ? "block" : "none", boxShadow: "0 4px 18px rgba(0,0,0,.35)", borderRadius: 4, background: "#fff", height: "auto" }} />
      </div>
    </div>
  )
})

export default PdfViewer
