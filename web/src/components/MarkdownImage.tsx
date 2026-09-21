// MarkdownImage — <img> de mensajes con dos extras:
// 1. Rutas locales del PC (C:\foto.png, file://…, /home/…) se cargan por el
//    shell (/shell/fs/download) y se pintan como blob URL: el webview no puede
//    leer el disco por sí solo. Funciona también desde el celular (shell remoto).
// 2. Click → lightbox; error → aviso con la ruta (sin imagen rota).
import { memo, useEffect, useState, type ComponentProps } from "react"
import { shell } from "../shell"
import { localFsPathFromImageSrc } from "../shared/lib/filePaths.ts"
import { ImageLightbox } from "./ImageLightbox"

const MAX_IMAGE_BYTES = 24 * 1024 * 1024

type LoadState =
  | { status: "direct" }
  | { status: "loading" }
  | { status: "ready"; url: string }
  | { status: "error"; message: string }

export const MarkdownImage = memo(function MarkdownImage({ src, alt, title, className, node: _node, ...rest }: ComponentProps<"img"> & { node?: unknown }) {
  const local = typeof src === "string" ? localFsPathFromImageSrc(src) : null
  const [state, setState] = useState<LoadState>(() => (local ? { status: "loading" } : { status: "direct" }))
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    if (!local) {
      setState({ status: "direct" })
      return
    }
    let cancelled = false
    let objectUrl: string | null = null
    setState({ status: "loading" })
    shell.fs
      .download(local)
      .then((blob) => {
        if (cancelled) return
        if (!blob.type.startsWith("image/")) throw new Error("no es una imagen")
        if (blob.size > MAX_IMAGE_BYTES) throw new Error("imagen demasiado grande")
        objectUrl = URL.createObjectURL(blob)
        setState({ status: "ready", url: objectUrl })
      })
      .catch((e) => {
        if (!cancelled) setState({ status: "error", message: e instanceof Error ? e.message : String(e) })
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [local])

  if (local && state.status === "loading") {
    return <span className="md-image-loading" role="status">Cargando imagen…</span>
  }
  if (local && state.status === "error") {
    return (
      <span className="md-image-error" title={`${local}\n${state.message}`}>
        {alt || local} — no se pudo cargar ({state.message})
      </span>
    )
  }
  const finalSrc = local && state.status === "ready" ? state.url : (src as string)
  return (
    <>
      <img
        {...rest}
        src={finalSrc}
        alt={alt ?? ""}
        title={title ?? (local ?? undefined)}
        loading="lazy"
        className={`md-image${className ? ` ${className}` : ""}`}
        onClick={() => setLightbox(true)}
      />
      {lightbox && <ImageLightbox src={finalSrc} onClose={() => setLightbox(false)} />}
    </>
  )
})
