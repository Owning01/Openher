import { memo, useState, useEffect } from "react"
import { api } from "../api"
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
    api.readFile(config, path, directory).then((result) => {
      if (cancelled) return
      if (result.type === "binary") {
        setError("Binary file — cannot display")
        setLoading(false)
        return
      }
      setContent(result.content)
      setLoading(false)
    }).catch((err) => {
      if (cancelled) return
      setError(err instanceof Error ? err.message : "Failed to load file")
      setLoading(false)
    })
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
