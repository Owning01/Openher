import { memo } from "react"
import { FolderIcon, CloseIcon, LoadingIcon, FileIcon } from "../Icons"
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
                  <FileIcon size={16} />
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
