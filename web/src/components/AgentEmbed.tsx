import { memo, useEffect, useMemo, useState } from "react"
import { Markdown } from "./Markdown"
import { shell } from "../shell"
import { splitEmbeds, fileUrlToPath } from "../utils/agentEmbed"

// Tope para inlinear: más de 2MB se avisa en vez de meterlo al DOM
const MAX_INLINE_BYTES = 2 * 1024 * 1024

/** Renderiza un <agent-embed src="..."> de la skill generative_ui.
 *  - file://… → se lee vía shell.fs.read y se inyecta como srcDoc
 *  - http(s)://… → iframe directo
 *  Siempre con sandbox="allow-scripts" SIN allow-same-origin: el contenido
 *  NO toca el storage ni el DOM de la app aunque traiga scripts. */
export const AgentEmbed = memo(function AgentEmbed({ src }: { src: string }) {
  const [html, setHtml] = useState<string | null>(src.startsWith("http") ? "" : null)
  const [error, setError] = useState<string | null>(null)
  const [tall, setTall] = useState(false)
  // Recarga manual: el resolve va por src, así que reescribir el mismo
  // archivo no refrescaba la vista (?v=N en el src también la dispara).
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (src.startsWith("http")) return
    let cancelled = false
    const path = fileUrlToPath(src)
    if (!path) {
      setError("Ruta no soportada (usá file://… o https://…)")
      return
    }
    setHtml(null)
    setError(null)
    shell.fs.read(path).then((r) => {
      if (cancelled) return
      if ((r.size ?? 0) > MAX_INLINE_BYTES) {
        setError(`Archivo muy grande (${Math.round(r.size / 1048576)}MB, tope 2MB)`)
        return
      }
      setHtml(r.content ?? "")
    }).catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo cargar la vista")
    })
    return () => {
      cancelled = true
    }
  }, [src, reloadKey])

  return (
    <div className={`agent-embed${tall ? " tall" : ""}`} data-embed-src={src} title="Arrastrá la esquina inferior derecha para redimensionar">
      <div className="agent-embed-bar">
        <span className="agent-embed-label" title={src}>Vista generada</span>
        <span className="agent-embed-actions">
          {!error && html !== null && (
            <button type="button" className="btn-secondary compact" onClick={() => setReloadKey((k) => k + 1)} title="Volver a leer el archivo">
              Recargar
            </button>
          )}
          <button type="button" className="btn-secondary compact" onClick={() => setTall((v) => !v)} title={tall ? "Ver compacta" : "Ampliar"}>
            {tall ? "Compactar" : "Ampliar"}
          </button>
        </span>
      </div>
      {error ? (
        <div className="agent-embed-error" role="alert">{error}</div>
      ) : html === null ? (
        <div className="agent-embed-loading">Cargando vista…</div>
      ) : src.startsWith("http") ? (
        <iframe key={reloadKey} className="agent-embed-frame" src={src} sandbox="allow-scripts" title="Vista generada" loading="lazy" />
      ) : (
        <iframe key={reloadKey} className="agent-embed-frame" srcDoc={html} sandbox="allow-scripts" title="Vista generada" loading="lazy" />
      )}
    </div>
  )
})

/** Markdown que además dibuja los <agent-embed> inline. Sin embeds se
 *  comporta igual que <Markdown> (mismo caché interno). */
export const MarkdownWithEmbeds = memo(function MarkdownWithEmbeds({ text, highlight }: { text: string; highlight?: string }) {
  const parts = useMemo(() => splitEmbeds(text), [text])
  if (parts.length === 1 && parts[0].type === "md") {
    return <Markdown text={text} highlight={highlight} />
  }
  return (
    <>
      {parts.map((p, i) =>
        p.type === "md"
          ? (p.text ? <Markdown key={i} text={p.text} highlight={highlight} /> : null)
          : <AgentEmbed key={i} src={p.src} />
      )}
    </>
  )
})
