import { memo, useCallback } from "react"
import { PlayIcon, PencilIcon, TrashIcon, SaveIcon, CloseIcon, StarIcon } from "../Icons"
import { useT } from "../i18n-context"
import { formatTime } from "../utils"
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
}

export const SessionCard = memo(function SessionCard({
  session, isSelected, isRenaming, renameValue, isFavorite,
  onOpen, onStartRename, onRenameChange, onRenameConfirm, onRenameCancel, onDelete,
  onToggleFavorite
}: SessionCardProps) {
  const t = useT()

  const handleOpen = useCallback(() => onOpen(session.id, session.directory), [session.id, session.directory, onOpen])
  const handleDelete = useCallback(() => onDelete(session), [session, onDelete])
  const handleStartRename = useCallback(() => onStartRename(session), [session, onStartRename])
  const handleRenameConfirm = useCallback(() => onRenameConfirm(session.id, renameValue, session.directory), [session.id, renameValue, session.directory, onRenameConfirm])
  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite(session.id)
  }, [session.id, onToggleFavorite])

  return (
    <article className={`session-card ${isSelected ? "active" : ""} fade-in`}>
      <div className="session-card-main">
        <div className="session-card-info">
          {isRenaming ? (
            <div className="rename-inline" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
              <input value={renameValue}
                onChange={(e) => onRenameChange(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === "Enter") { e.preventDefault(); handleRenameConfirm() }
                  else if (e.key === "Escape") onRenameCancel()
                }}
                onBlur={() => { if (renameValue === session.title || !renameValue.trim()) onRenameCancel() }}
                placeholder={t('session.renamePlaceholder')} className="rename-input" autoComplete="off" />
              <button className="btn-primary compact" onClick={(e) => { e.stopPropagation(); handleRenameConfirm() }}
                onMouseDown={(e) => e.preventDefault()} title={t('session.renameConfirm')}>
                <SaveIcon size={14} />
              </button>
              <button className="btn-secondary compact" onClick={(e) => { e.stopPropagation(); onRenameCancel() }} title={t('session.cancel')}>
                <CloseIcon size={14} />
              </button>
            </div>
          ) : (
            <div className="session-card-title-row">
              <button className="star-btn" onClick={handleToggleFavorite}
                aria-pressed={isFavorite}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                <StarIcon size={14} className={isFavorite ? "star-filled" : "star-empty"} />
              </button>
              <h3>{session.title}</h3>
              <span className={`session-type-badge ${session.model ? "agent" : "user"}`}>
                {session.model ? "AI" : "ME"}
              </span>
            </div>
          )}
          <p>{session.directory}</p>
          <span className={`pill ${session.status}`}>{session.status}</span>
        </div>
      </div>
      <div className="session-stats">
        {session.files > 0 || session.additions > 0 || session.deletions > 0 ? (
          <span className="change-summary">
            <strong>{session.files}</strong> files
            <strong className="positive">+{session.additions}</strong>
            <strong className="negative">-{session.deletions}</strong>
          </span>
        ) : (
          <span className="subtle">{t('sessions.noFileChanges')}</span>
        )}
        <span className="subtle">{t('sessions.updated', { time: formatTime(session.updated) })}</span>
        {session.model?.modelID && (
          <span className="session-model-badge">{session.model.modelID}{session.model.variant ? ` · ${session.model.variant}` : ""}</span>
        )}
      </div>
      <div className="session-actions">
        <button onClick={(e) => { e.stopPropagation(); handleOpen() }} className="btn-primary">
          <PlayIcon size={16} />
          {t('sessions.open')}
        </button>
        <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); handleStartRename() }} title={t('session.renameTitle')}>
          <PencilIcon size={16} />
          {t('session.renameTitle')}
        </button>
        <button className="btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete() }}>
          <TrashIcon size={16} />
          {t('sessions.delete')}
        </button>
      </div>
    </article>
  )
})
