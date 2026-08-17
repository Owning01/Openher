import { memo, useState, useEffect } from "react"
import { api } from "../api"
import { shell } from "../shell"
import { ModalHeader } from "./ModalHeader"
import { useT } from "../i18n-context"
import { basename } from "../utils"
import type { ServerConfig } from "../types"

type Props = {
  config: ServerConfig
  path: string
  directory?: string
  onClose: () => void
}

export const FileEditor = memo(function FileEditor({ config, path, directory, onClose }: Props) {
  const t = useT()
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const load = async () => {
      // Si la ruta es absoluta o estamos en desktop, probamos leer vía shell nativo primero
      if (typeof window !== "undefined" && (window as any).__OPENCODE_DESKTOP__) {
        try {
          const r = await shell.fs.read(path)
          if (!cancelled) {
            setContent(r.content)
            setLoading(false)
            return
          }
        } catch {
          // Si falla shell.fs.read, cae al endpoint del servidor
        }
      }

      try {
        const result = await api.readFile(config, path, directory)
        if (cancelled) return
        if (result.type === "binary") {
          setError("Binary file — cannot display")
          setLoading(false)
          return
        }
        setContent(result.content)
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        // Intento de rescate con shell.fs.read si api.readFile falló (por paths absolutos de Windows)
        try {
          const r = await shell.fs.read(path)
          if (!cancelled) {
            setContent(r.content)
            setLoading(false)
            return
          }
        } catch {
          // ignora
        }
        setError(err instanceof Error ? err.message : "Failed to load file")
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [config, path, directory])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content file-editor" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="File Editor">
        <ModalHeader title={basename(path)} titleTooltip={path} onClose={onClose}>
          <span className="file-editor-readonly">{t('fileEditor.readOnly')}</span>
        </ModalHeader>
        <div className="modal-body file-editor-body">
          {loading ? (
            <p className="subtle">{t('fileEditor.loading')}</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : (
            <textarea
              className="file-editor-textarea"
              value={content}
              readOnly
              spellCheck={false}
              autoFocus
            />
          )}
        </div>
      </div>
    </div>
  )
})
