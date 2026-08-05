import { memo, useCallback, useState } from "react"
import { PlayIcon, PencilIcon, TrashIcon, StarIcon, ShareIcon, SaveIcon, ArchiveIcon, ForkIcon, ChevronIcon } from "../Icons"
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
  onArchive?: (id: string) => void
  onFork?: (session: SessionView) => void
}

export const SessionCard = memo(function SessionCard({
  session, isSelected, isRenaming, renameValue, isFavorite,
  onOpen, onStartRename, onRenameChange, onRenameConfirm, onRenameCancel, onDelete,
  onToggleFavorite, onExportChat, onSnapshot, onArchive, onFork
}: SessionCardProps) {
  const t = useT()
  const [actionsOpen, setActionsOpen] = useState(false)

  const handleOpen = useCallback(() => onOpen(session.id, session.directory), [session.id, session.directory, onOpen])
  const handleDelete = useCallback(() => onDelete(session), [session, onDelete])
  const handleStartRename = useCallback(() => onStartRename(session), [session, onStartRename])
  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite(session.id)
  }, [session.id, onToggleFavorite])

  const toggleActions = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setActionsOpen((v) => !v)
  }, [])

  return (
    <article className={`session-card ${isSelected ? "active" : ""} ${isFavorite ? "is-favorite" : ""} ${actionsOpen ? "actions-open" : ""} fade-in`}>
      <div className="session-card-header" onClick={toggleActions} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActionsOpen((v) => !v) } }}>
        <div className="session-card-title-group">
          <button className="star-btn" onClick={handleToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? t('favorites.remove') : t('favorites.add')}
            title={isFavorite ? t('favorites.remove') : t('favorites.add')}>
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
        <ChevronIcon size={14} className={`session-card-chevron${actionsOpen ? " open" : ""}`} />
      </div>

      <div className="session-card-body" onClick={toggleActions}>
      </div>

      {actionsOpen && (
        <div className="session-card-meta">
          <div className="session-stats">
            <span className="subtle time-label">{t('sessions.updated', { time: formatTime(session.updated) })}</span>
          </div>
        </div>
      )}

      {actionsOpen && (
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
        {onArchive && (
          <button className="btn-icon compact" onClick={(e) => { e.stopPropagation(); onArchive(session.id) }}
            title={t('detail.archive')} aria-label={t('detail.archive')}>
            <ArchiveIcon size={14} />
          </button>
        )}
        {onFork && (
          <button className="btn-secondary compact-action-btn" onClick={(e) => { e.stopPropagation(); onFork(session) }} title={t('session.fork') || "Fork"} aria-label={t('session.fork') || "Fork"}>
            <ForkIcon size={14} />
          </button>
        )}
        <button className="btn-icon compact" onClick={(e) => { e.stopPropagation(); handleStartRename() }} title={t('session.renameTitle')} aria-label={t('session.renameTitle')}>
          <PencilIcon size={15} />
        </button>
        <button className="btn-icon compact session-delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete() }} title={t('session.deleteTitle')} aria-label={t('session.deleteTitle')}>
          <TrashIcon size={15} />
        </button>
      </div>
      )}
    </article>
  )
})
