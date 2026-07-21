import { memo } from "react"
import { FolderIcon, CloseIcon, LoadingIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { FileEntry } from "../types"
import { Modal } from "./Modal"

type FileBrowserProps = {
  currentPath: string
  items: FileEntry[]
  loading: boolean
  error: string | null
  onClose: () => void
  onNavigate: (path: string) => void
  onGoUp: () => void
}

export const FileBrowser = memo(function FileBrowser({
  currentPath, items, loading, error, onClose, onNavigate, onGoUp
}: FileBrowserProps) {
  const t = useT()
  return (
    <Modal onClose={onClose} className="file-browser" aria-labelledby="file-browser-title">
      <div className="file-browser-header">
        <h2 id="file-browser-title">{t('sessions.projectDirectoryLabel')}</h2>
        <button className="btn-icon btn-ghost" onClick={onClose} aria-label={t('session.cancel')}>
          <CloseIcon size={16} />
        </button>
      </div>
      <div className="file-browser-path" title={currentPath}>
        <span className="subtle">{currentPath || "\u00a0"}</span>
      </div>
      <div className="folder-list">
        {loading ? (
          <div className="empty-state compact"><LoadingIcon size={28} /><p>{t('sessions.folderPickerLoading')}</p></div>
        ) : (
          <>
            {currentPath && currentPath !== "/" && (
              <button type="button" className="folder-row" onClick={onGoUp}>
                <FolderIcon size={16} />
                <span>..</span>
              </button>
            )}
            {error ? (
              <p className="subtle" style={{ color: "var(--color-error)" }}>{error}</p>
            ) : items.length === 0 ? (
              <p className="subtle">{t('sessions.folderPickerEmpty')}</p>
            ) : items.map((item) => (
              <button key={item.absolute} type="button" className="folder-row"
                onClick={() => item.type === "directory" ? onNavigate(item.absolute) : undefined}
                title={item.type === "file" ? item.absolute : undefined}>
                {item.type === "directory" ? (
                  <FolderIcon size={16} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                )}
                <span>{item.name}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </Modal>
  )
})
