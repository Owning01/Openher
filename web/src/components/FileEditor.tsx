import { memo, useState, useEffect, useCallback } from "react"
import { api } from "../api"
import { CloseIcon, SaveIcon } from "../Icons"
import type { ServerConfig } from "../types"

type Props = {
  config: ServerConfig
  path: string
  directory?: string
  onClose: () => void
}

export const FileEditor = memo(function FileEditor({ config, path, directory, onClose }: Props) {
  const [content, setContent] = useState("")
  const [original, setOriginal] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    api.readFile(config, path, directory).then((result) => {
      setContent(result.content)
      setOriginal(result.content)
      setLoading(false)
    }).catch((err) => {
      setError(err.message || "Failed to load file")
      setLoading(false)
    })
  }, [config, path, directory])

  const handleSave = useCallback(async () => {
    if (content === original) return
    setSaving(true)
    setError(null)
    try {
      await api.writeFile(config, path, content, directory)
      setOriginal(content)
      setSaving(false)
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save")
      setSaving(false)
    }
  }, [content, original, config, path, directory, onClose])

  const hasChanges = content !== original

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content file-editor" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="File Editor">
        <div className="modal-header">
          <h3 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{path}</h3>
          <div className="detail-header-actions">
            {hasChanges && (
              <button className="btn-primary compact" onClick={handleSave} disabled={saving}>
                <SaveIcon size={14} /> {saving ? "Saving..." : "Save"}
              </button>
            )}
            <button className="btn-icon btn-secondary compact" onClick={onClose}><CloseIcon size={14} /></button>
          </div>
        </div>
        <div className="modal-body file-editor-body">
          {loading ? (
            <p className="subtle">Loading...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : (
            <textarea
              className="file-editor-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              autoFocus
            />
          )}
        </div>
      </div>
    </div>
  )
})
