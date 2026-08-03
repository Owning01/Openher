import { useT } from "../i18n-context"
import type { QueuedPrompt } from "../types"
import { Modal } from "./Modal"

type Props = {
  prompts: QueuedPrompt[]
  onSend: (id: string) => void
  onRemove: (id: string) => void
  onClose: () => void
}

export function QueuedPrompts({ prompts, onSend, onRemove, onClose }: Props) {
  const t = useT()
  return (
    <Modal onClose={onClose} className="queued-modal" aria-labelledby="queued-title">
      <h2 id="queued-title">{t('detail.queuedTitle')}</h2>
      {prompts.length === 0 ? (
        <p className="subtle">{t('detail.queuedEmpty')}</p>
      ) : (
        <div className="queued-list">
          {prompts.map((p) => (
            <div key={p.id} className="queued-item">
              <span className="queued-item-text">{p.text.replace(/\n/g, " ")}</span>
              <div className="queued-item-actions">
                <button className="btn-sm btn-primary" onClick={() => onSend(p.id)}>
                  {t('detail.queuedSend')}
                </button>
                <button className="btn-sm btn-danger" onClick={() => onRemove(p.id)}>
                  {t('detail.queuedRemove')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="modal-actions" style={{ gridTemplateColumns: "1fr" }}>
        <button className="btn-secondary" onClick={onClose}>
          {t('session.cancel')}
        </button>
      </div>
    </Modal>
  )
}
