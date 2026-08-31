import { memo, useCallback, useRef } from "react"
import { StarIcon, ChevronIcon, CheckIcon } from "../Icons"
import { useT } from "../i18n-context"
import { formatTimeCompact, formatTime } from "../utils"
import { InlineRename } from "./InlineRename"
import type { SessionView } from "../types"

type SessionCardProps = {
  session: SessionView
  isSelected: boolean
  isRenaming: boolean
  renameValue: string
  isFavorite: boolean
  isChild?: boolean
  hasChildren?: boolean
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onOpenParent?: () => void
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
  hasChildren = false, isCollapsed = false, onToggleCollapse, onOpenParent,
  onOpen, onStartRename: _onStartRename, onRenameChange, onRenameConfirm, onRenameCancel,
  onToggleFavorite, onDragStartSession, onContextMenu,
  selectMode = false, isChecked = false, onToggleCheck
}: SessionCardProps) {
  const t = useT()
  const clickTimer = useRef<number | null>(null)

  const handleOpen = useCallback(() => onOpen(session.id, session.directory), [session.id, session.directory, onOpen])
  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite(session.id)
  }, [session.id, onToggleFavorite])

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (selectMode) {
      onToggleCheck?.()
      return
    }
    if (hasChildren && onToggleCollapse) {
      if (clickTimer.current) return
      clickTimer.current = window.setTimeout(() => {
        clickTimer.current = null
        onToggleCollapse()
      }, 220)
      return
    }
    handleOpen()
  }, [selectMode, onToggleCheck, hasChildren, onToggleCollapse, handleOpen])

  const handleCardDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!hasChildren || !onOpenParent) return
    e.stopPropagation()
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current)
      clickTimer.current = null
    }
    onOpenParent()
  }, [hasChildren, onOpenParent])

  return (
    <article
      className={`session-card ${isSelected ? "active" : ""} ${isFavorite ? "is-favorite" : ""} ${isChild ? "is-child-session" : ""} ${hasChildren ? "has-children" : ""} ${selectMode ? "select-mode" : ""} ${isChecked ? "checked" : ""} fade-in`}
      draggable={!!onDragStartSession && !selectMode}
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
      title={session.title}
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
          {hasChildren && (
            <span className={`session-expand-icon${isCollapsed ? "" : " expanded"}`} aria-hidden="true">
              <ChevronIcon size={12} />
            </span>
          )}
          {selectMode ? (
            <span className={`session-checkbox${isChecked ? " checked" : ""}`} aria-hidden="true">
              {isChecked && <CheckIcon size={10} />}
            </span>
          ) : (
            <button
              type="button"
              className="star-btn"
              onClick={handleToggleFavorite}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? t('favorites.remove') : t('favorites.add')}
              title={isFavorite ? t('favorites.remove') : t('favorites.add')}
            >
              <StarIcon size={13} className={isFavorite ? "star-filled" : "star-empty"} />
            </button>
          )}
          {isChild && (
            <span className="subagent-branch-tag" title="Subagente">
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
            <span className="session-title">{session.title}</span>
          )}
        </div>
        <span className="time-label" title={formatTime(session.updated)}>
          {formatTimeCompact(session.updated)}
        </span>
      </div>
    </article>
  )
})
