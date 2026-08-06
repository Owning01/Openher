import { memo, type ReactNode } from "react"
import { StarIcon, ChatIcon, CloseIcon } from "../Icons"
import { useT } from "../i18n-context"
import { formatTime } from "../utils"
import type { SessionView } from "../types"

// Card compartida de los accesos rápidos (favoritos/activos/recientes).
// Sin fondo de estado: el pill muestra busy/retry cuando corresponde, y la
// sesión idle no lleva ninguna marca visual.
export const QuickAccessCard = memo(function QuickAccessCard({
  session, isFavorite, onOpen, onToggleFavorite, onDismiss, children,
}: {
  session: SessionView
  isFavorite: boolean
  onOpen: (id: string, directory: string) => void
  onToggleFavorite: (id: string) => void
  onDismiss?: (id: string) => void
  children?: ReactNode
}) {
  const t = useT()
  return (
    <div className="quick-access-card" onClick={() => onOpen(session.id, session.directory)} role="button" tabIndex={0}>
      {children}
      <button className="quick-access-star"
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(session.id) }}
        aria-pressed={isFavorite}
        title={isFavorite ? t('favorites.remove') : t('favorites.add')}>
        <StarIcon size={12} className={isFavorite ? "star-filled" : "star-empty"} />
      </button>
      <ChatIcon size={14} />
      <span className="quick-access-title">{session.title}</span>
      <span className="quick-access-time">{formatTime(session.updated)}</span>
      {session.status === "busy" && (
        <span className="pixel-spinner" role="status" aria-label={t('session.statusBusy')} title={t('session.statusBusy')} />
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
