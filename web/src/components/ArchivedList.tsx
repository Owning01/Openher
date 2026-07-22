import { memo } from "react"
import { useT } from "../i18n-context"
import { formatTime } from "../utils"
import type { SessionView } from "../types"

type Props = {
  sessions: SessionView[]
  onRestore: (id: string) => void
  onOpen: (id: string, dir: string) => void
  onClose: () => void
}

export const ArchivedList = memo(function ArchivedList({ sessions, onRestore, onOpen, onClose }: Props) {
  const t = useT()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content archived-list" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Archived Sessions">
        <div className="modal-header">
          <h3>{t('settings.sessionArchive')}</h3>
          <button className="btn-icon btn-secondary compact" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="modal-body">
          {sessions.length === 0 ? (
            <p className="subtle">No archived sessions</p>
          ) : (
            <div className="archived-list-items">
              {sessions.map((s) => (
                <div key={s.id} className="archived-item">
                  <div className="archived-item-info">
                    <strong>{s.title}</strong>
                    <span className="subtle">{s.directory} · {formatTime(s.updated)}</span>
                  </div>
                  <div className="archived-item-actions">
                    <button className="btn-secondary compact" onClick={() => onOpen(s.id, s.directory)}>
                      Open
                    </button>
                    <button className="btn-primary compact" onClick={() => onRestore(s.id)}>
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
