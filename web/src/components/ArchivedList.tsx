import { memo } from "react"
import { ModalHeader } from "./ModalHeader"
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
        <ModalHeader title={t('settings.sessionArchive')} onClose={onClose} />
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
