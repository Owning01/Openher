import { memo } from "react"
import { PlusIcon, FolderIcon, LoadingIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { FileEntry } from "../types"
import { Modal } from "./Modal"

type FolderPickerProps = {
  pickerPath: string
  pickerItems: FileEntry[]
  pickerLoading: boolean
  pickerError: string | null
  creatingSession: boolean
  onBrowse: (path: string) => void
  onCreate: (path: string) => void
  onCreateDefault: () => void
  onClose: () => void
}

function parentDirectory(path: string): string | null {
  if (!path || path === "/") return null
  const normalized = path.replace(/[\\/]+$/, "").replace(/\\/g, "/")
  const index = normalized.lastIndexOf("/")
  if (index <= 0) return "/"
  return normalized.slice(0, index)
}

export const FolderPicker = memo(function FolderPicker({
  pickerPath, pickerItems, pickerLoading, pickerError, creatingSession,
  onBrowse, onCreate, onCreateDefault, onClose
}: FolderPickerProps) {
  const t = useT()
  return (
    <Modal onClose={onClose} className="folder-picker" aria-labelledby="new-session-title">
      <h2 id="new-session-title">{t('sessions.newSessionTitle')}</h2>
        <p className="subtle">{t('sessions.projectDirectoryDefault')}</p>
        <div className="folder-picker-current">
          <span>{t('sessions.projectDirectoryLabel')}</span>
          <strong>{pickerPath || t('detail.loadingProject')}</strong>
        </div>
        <div className="inline-actions">
          <button type="button" className="btn-secondary" onClick={onCreateDefault} disabled={creatingSession}>
            {t('sessions.useServerDefault')}
          </button>
          <button type="button" className="btn-primary" onClick={() => onCreate(pickerPath)} disabled={creatingSession || !pickerPath}>
            {creatingSession ? <LoadingIcon size={16} /> : <PlusIcon size={16} />}
            {t('sessions.useThisFolder')}
          </button>
        </div>
        {pickerError && <div className="error fade-in">✗ {pickerError}</div>}
        <div className="folder-list">
          {pickerLoading ? (
            <div className="empty-state compact"><LoadingIcon size={28} /><p>{t('sessions.folderPickerLoading')}</p></div>
          ) : (
            <>
              {parentDirectory(pickerPath) && (
                <button type="button" className="folder-row" onClick={() => { const p = parentDirectory(pickerPath); if (p) onBrowse(p) }}>
                  <FolderIcon size={16} />
                  <span>{t('sessions.parentFolder')}</span>
                </button>
              )}
              {pickerItems.length === 0 ? (
                <p className="subtle">{t('sessions.folderPickerEmpty')}</p>
              ) : pickerItems.map((item) => (
                <button key={item.absolute} type="button" className="folder-row" onClick={() => onBrowse(item.absolute)}>
                  <FolderIcon size={16} />
                  <span>{item.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            {t('session.cancel')}
          </button>
        </div>
    </Modal>
  )
})
