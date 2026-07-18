import { memo, useCallback } from "react"
import { PlayIcon, PencilIcon, TrashIcon, SaveIcon, CloseIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { SessionView } from "../types"

function formatTime(epoch: number): string {
  if (epoch == null || epoch <= 0) return "-"
  return new Date(epoch).toLocaleString()
}

type SessionCardProps = {
  session: SessionView
  isSelected: boolean
  isRenaming: boolean
  renameValue: string
  onOpen: (id: string, dir: string) => void
  onStartRename: (session: SessionView) => void
  onRenameChange: (value: string) => void
  onRenameConfirm: (id: string, title: string, dir: string) => void
  onRenameCancel: () => void
  onDelete: (session: SessionView) => void
}

export const SessionCard = memo(function SessionCard({
  session, isSelected, isRenaming, renameValue,
  onOpen, onStartRename, onRenameChange, onRenameConfirm, onRenameCancel, onDelete
}: SessionCardProps) {
  const t = useT()

  const handleOpen = useCallback(() => onOpen(session.id, session.directory), [session.id, session.directory, onOpen])
  const handleDelete = useCallback(() => onDelete(session), [session, onDelete])
  const handleStartRename = useCallback(() => onStartRename(session), [session, onStartRename])
  const handleRenameConfirm = useCallback(() => onRenameConfirm(session.id, renameValue, session.directory), [session.id, renameValue, session.directory, onRenameConfirm])

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
            <h3>{session.title}</h3>
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
