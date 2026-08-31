import { memo, type ReactNode } from "react"
import { StarIcon, CloseIcon } from "../Icons"
import { useT } from "../i18n-context"
import { formatTimeCompact, formatTime } from "../utils"
import type { SessionView } from "../types"
import { GridSpinner } from "./GridSpinner"

// Card compartida de los accesos rápidos (favoritos/activos/recientes).
// Sin fondo de estado: el pill muestra busy/retry cuando corresponde, y la
// sesión idle no lleva ninguna marca visual.
export const QuickAccessCard = memo(function QuickAccessCard({
  session, isFavorite, onOpen, onToggleFavorite, onDismiss, onDragStartSession, onContextMenu, children,
}: {
  session: SessionView
  isFavorite: boolean
  onOpen: (id: string, directory: string) => void
  onToggleFavorite: (id: string) => void
  onDismiss?: (id: string) => void
  onDragStartSession?: (id: string, directory: string) => void
  onContextMenu?: (e: React.MouseEvent, session: SessionView) => void
  children?: ReactNode
}) {
  const t = useT()
  return (
    <div
      className="quick-access-card"
      onClick={() => onOpen(session.id, session.directory)}
      title={session.title}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault()
          e.stopPropagation()
          onContextMenu(e, session)
        }
      }}
      role="button"
      tabIndex={0}
      draggable={!!onDragStartSession}
      onDragStart={(e) => {
        if (!onDragStartSession) return
        e.dataTransfer.setData("text/plain", `session:${session.id}`)
        e.dataTransfer.effectAllowed = "move"
        onDragStartSession(session.id, session.directory)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen(session.id, session.directory)
        }
      }}
    >
      {children}
      <button className="quick-access-star"
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(session.id) }}
        aria-pressed={isFavorite}
        title={isFavorite ? t('favorites.remove') : t('favorites.add')}>
        <StarIcon size={12} className={isFavorite ? "star-filled" : "star-empty"} />
      </button>
      <span className="quick-access-title">{session.title}</span>
      <span className="quick-access-time" title={formatTime(session.updated)}>{formatTimeCompact(session.updated)}</span>
      {session.status === "busy" && (
        <GridSpinner label={t('session.statusBusy')} title={t('session.statusBusy')} />
      )}
      {session.status === "retry" && <span className="pill retry">{t('session.statusRetry')}</span>}
      {onDismiss && (
        <button className="quick-access-dismiss" onClick={(e) => { e.stopPropagation(); onDismiss(session.id) }}
          title={t('sessions.recentDismiss')}>
          <CloseIcon size={12} />
        </button>
      )}
    </div>
  )
})
