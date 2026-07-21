import { memo, useCallback } from "react"
import { PlayIcon, PencilIcon, TrashIcon, StarIcon, ShareIcon, SaveIcon, FolderIcon } from "../Icons"
import { useT } from "../i18n-context"
import { formatTime } from "../utils"
import { InlineRename } from "./InlineRename"
import type { SessionView } from "../types"

type SessionCardProps = {
  session: SessionView
  isSelected: boolean
  isRenaming: boolean
  renameValue: string
  isFavorite: boolean
  onOpen: (id: string, dir: string) => void
  onStartRename: (session: SessionView) => void
  onRenameChange: (value: string) => void
  onRenameConfirm: (id: string, title: string, dir: string) => void
  onRenameCancel: () => void
  onDelete: (session: SessionView) => void
  onToggleFavorite: (id: string) => void
  onExportChat?: (session: SessionView) => void
  onSnapshot?: (session: SessionView) => void
}

export const SessionCard = memo(function SessionCard({
  session, isSelected, isRenaming, renameValue, isFavorite,
  onOpen, onStartRename, onRenameChange, onRenameConfirm, onRenameCancel, onDelete,
  onToggleFavorite, onExportChat, onSnapshot
}: SessionCardProps) {
  const t = useT()

  const handleOpen = useCallback(() => onOpen(session.id, session.directory), [session.id, session.directory, onOpen])
  const handleDelete = useCallback(() => onDelete(session), [session, onDelete])
  const handleStartRename = useCallback(() => onStartRename(session), [session, onStartRename])
  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite(session.id)
  }, [session.id, onToggleFavorite])

  return (
    <article className={`session-card ${isSelected ? "active" : ""} ${isFavorite ? "is-favorite" : ""} fade-in`}>
      <div className="session-card-header">
        <div className="session-card-title-group">
          <button className="star-btn" onClick={handleToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
            <StarIcon size={15} className={isFavorite ? "star-filled" : "star-empty"} />
          </button>
          {isRenaming ? (
            <InlineRename value={renameValue} original={session.title}
              onChange={onRenameChange}
              onConfirm={() => onRenameConfirm(session.id, renameValue, session.directory)}
              onCancel={onRenameCancel}
              placeholder={t('session.renamePlaceholder')} />
          ) : (
            <h3 className="session-title">{session.title}</h3>
          )}
        </div>
        <span className={`pill status-pill ${session.status}`}>
          <span className="status-dot"></span>
          {session.status}
        </span>
      </div>

      <div className="session-card-body">
        <div className="session-dir-badge">
          <FolderIcon size={13} />
          <span className="session-dir-text">{session.directory}</span>
        </div>
        {session.model?.modelID && (
          <span className="session-model-badge">
            {session.model.modelID}{session.model.variant ? ` · ${session.model.variant}` : ""}
          </span>
        )}
      </div>

      <div className="session-card-meta">
        <div className="session-stats">
          {session.files > 0 || session.additions > 0 || session.deletions > 0 ? (
            <span className="change-summary">
              <span className="change-files"><strong>{session.files}</strong> files</span>
              <span className="positive">+{session.additions}</span>
              <span className="negative">-{session.deletions}</span>
            </span>
          ) : (
            <span className="subtle">{t('sessions.noFileChanges')}</span>
          )}
          <span className="subtle time-label">{t('sessions.updated', { time: formatTime(session.updated) })}</span>
        </div>
      </div>

      <div className="session-actions">
        <button onClick={(e) => { e.stopPropagation(); handleOpen() }} className="btn-primary session-open-btn">
          <PlayIcon size={15} />
          {t('sessions.open')}
        </button>
        {onExportChat && (
          <button className="btn-secondary compact-action-btn" onClick={(e) => { e.stopPropagation(); onExportChat(session) }} title={t('detail.exportChat') || "Export"}>
            <ShareIcon size={15} />
          </button>
        )}
        {onSnapshot && (
          <button className="btn-secondary compact-action-btn" onClick={(e) => { e.stopPropagation(); onSnapshot(session) }} title={t('detail.snapshot') || "Snapshot"}>
            <SaveIcon size={15} />
          </button>
        )}
        <button className="btn-secondary compact-action-btn" onClick={(e) => { e.stopPropagation(); handleStartRename() }} title={t('session.renameTitle')}>
          <PencilIcon size={15} />
        </button>
        <button className="btn-danger compact-action-btn" onClick={(e) => { e.stopPropagation(); handleDelete() }}>
          <TrashIcon size={15} />
        </button>
      </div>
    </article>
  )
})
