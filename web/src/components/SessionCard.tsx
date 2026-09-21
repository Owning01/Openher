import { memo, useCallback, useEffect, useRef } from "react"
import { StarIcon, ChevronIcon, CheckIcon, LoadingIcon } from "../Icons"
import { useT } from "../i18n-context"
import { formatTimeCompact, formatTime, isSessionActive } from "../utils"
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
  onOpen, onStartRename, onRenameChange, onRenameConfirm, onRenameCancel,
  onToggleFavorite, onDragStartSession, onContextMenu,
  selectMode = false, isChecked = false, onToggleCheck
}: SessionCardProps) {
  const t = useT()
  const clickTimer = useRef<number | null>(null)
  const cardRef = useRef<HTMLElement | null>(null)

  // Al entrar en rename (p. ej. desde click derecho con la tarjeta fuera de
  // vista) asegura que el campo quede visible.
  useEffect(() => {
    if (isRenaming) {
      try {
        cardRef.current?.scrollIntoView({ block: "nearest" })
      } catch { /* ignore */ }
    }
  }, [isRenaming])

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
    if (isRenaming) return
    if (!hasChildren || !onOpenParent) return
    e.stopPropagation()
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current)
      clickTimer.current = null
    }
    onOpenParent()
  }, [isRenaming, hasChildren, onOpenParent])

  // Estilo Windows: F2 o segundo click sobre el título de la tarjeta ya
  // seleccionada abre la edición in-place.
  const handleStartRename = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation()
    if (selectMode || isRenaming) return
    onStartRename(session)
  }, [selectMode, isRenaming, onStartRename, session])

  const handleCardKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isRenaming) return
    if (e.key === "F2") {
      e.preventDefault()
      e.stopPropagation()
      if (!selectMode) onStartRename(session)
    } else if (e.key === "Enter" && !selectMode) {
      e.preventDefault()
      handleOpen()
    }
  }, [isRenaming, selectMode, onStartRename, session, handleOpen])

  // Subsesión activa (hija trabajando en el server): spinner chiquito y gris
  // junto al título. Solo hijas: el padre ya tiene sus propios indicadores.
  const childActive = isChild && isSessionActive(session)

  return (
    <article
      ref={cardRef}
      className={`session-card ${isSelected ? "active" : ""} ${isFavorite ? "is-favorite" : ""} ${isChild ? "is-child-session" : ""} ${hasChildren ? "has-children" : ""} ${selectMode ? "select-mode" : ""} ${isChecked ? "checked" : ""}${isRenaming ? " is-renaming" : ""} fade-in`}
      draggable={!!onDragStartSession && !selectMode && !isRenaming}
      tabIndex={0}
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
      onKeyDown={handleCardKeyDown}
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
            <span className="session-title" onClick={isSelected ? handleStartRename : undefined}
              title={isSelected ? t('session.rename') : undefined}>{session.title}</span>
          )}
          {childActive && (
            <span className="session-child-spinner" title={t('panel.busy')} aria-label={t('panel.busy')} role="status">
              <LoadingIcon size={10} />
            </span>
          )}
        </div>
        <span className="time-label" title={formatTime(session.updated)}>
          {formatTimeCompact(session.updated)}
        </span>
      </div>
    </article>
  )
})
