import { memo, useState } from "react"
import { useT } from "../i18n-context"
import { Modal } from "./Modal"

type ExportMarkdownDialogProps = {
  defaultPath: string
  busy: boolean
  onConfirm: (path: string) => void
  onCancel: () => void
}

export const ExportMarkdownDialog = memo(function ExportMarkdownDialog({ defaultPath, busy, onConfirm, onCancel }: ExportMarkdownDialogProps) {
  const t = useT()
  const [path, setPath] = useState(defaultPath)
  const canSave = path.trim().length > 0 && !busy
  return (
    <Modal onClose={onCancel} aria-labelledby="export-md-title">
      <h2 id="export-md-title">{t('session.exportMd')}</h2>
      <label htmlFor="export-md-path" className="subtle">{t('session.exportMdPath')}</label>
      <input
        id="export-md-path"
        className="input"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && canSave) onConfirm(path.trim()) }}
        autoComplete="off"
        spellCheck={false}
        autoFocus
      />
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={busy}>
          {t('common.cancel')}
        </button>
        <button className="btn-primary" onClick={() => onConfirm(path.trim())} disabled={!canSave}>
          {busy ? "…" : t('session.exportMdSave')}
        </button>
      </div>
    </Modal>
  )
})
