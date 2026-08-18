import { memo, useCallback } from "react"
import { StarIcon } from "../Icons"
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
  isChild?: boolean
  onOpen: (id: string, dir: string) => void
  onStartRename: (session: SessionView) => void
  onRenameChange: (value: string) => void
  onRenameConfirm: (id: string, title: string, dir: string) => void
  onRenameCancel: () => void
  onDelete?: (session: SessionView) => void
  onToggleFavorite: (id: string) => void
  onExportChat?: (session: SessionView) => void
  onSnapshot?: (session: SessionView) => void
  onArchive?: (id: string) => void
  onFork?: (session: SessionView) => void
  onDragStartSession?: (id: string, dir: string) => void
  onContextMenu?: (e: React.MouseEvent, session: SessionView) => void
  selectMode?: boolean
  isChecked?: boolean
  onToggleCheck?: () => void
}

export const SessionCard = memo(function SessionCard({
  session, isSelected, isRenaming, renameValue, isFavorite, isChild = false,
  onOpen, onStartRename: _onStartRename, onRenameChange, onRenameConfirm, onRenameCancel,
  onToggleFavorite, onDragStartSession, onContextMenu,
  selectMode = false, isChecked = false, onToggleCheck
}: SessionCardProps) {
  const t = useT()

  const handleOpen = useCallback(() => onOpen(session.id, session.directory), [session.id, session.directory, onOpen])
  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite(session.id)
  }, [session.id, onToggleFavorite])

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (selectMode) onToggleCheck?.()
    else handleOpen()
  }, [selectMode, onToggleCheck, handleOpen])

  return (
    <article
      className={`session-card ${isSelected ? "active" : ""} ${isFavorite ? "is-favorite" : ""} ${isChild ? "is-child-session" : ""} ${selectMode ? "select-mode" : ""} ${isChecked ? "checked" : ""} fade-in`}
      draggable={!!onDragStartSession && !selectMode}
      onClick={handleCardClick}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault()
          e.stopPropagation()
          onContextMenu(e, session)
        }
      }}
      onDragStart={(e) => {
        if (!onDragStartSession) return
        e.dataTransfer.setData("text/plain", `session:${session.id}`)
        e.dataTransfer.effectAllowed = "move"
        onDragStartSession(session.id, session.directory)
      }}
    >
      <div className="session-card-header">
        <div className="session-card-title-group">
          {selectMode ? (
            <span className={`session-checkbox${isChecked ? " checked" : ""}`} aria-hidden="true">
              {isChecked && <span>✓</span>}
            </span>
          ) : (
            <button className="star-btn" onClick={handleToggleFavorite}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? t('favorites.remove') : t('favorites.add')}
              title={isFavorite ? t('favorites.remove') : t('favorites.add')}>
              <StarIcon size={15} className={isFavorite ? "star-filled" : "star-empty"} />
            </button>
          )}
          {isChild && (
            <span className="subagent-branch-tag" title="Subagente" style={{ fontSize: "0.72rem", color: "var(--muted)", opacity: 0.8, marginRight: 2 }}>
              ↳
            </span>
          )}
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
        <span className="subtle time-label" style={{ fontSize: "0.72rem", flexShrink: 0 }}>
          {formatTime(session.updated)}
        </span>
      </div>
    </article>
  )
})
