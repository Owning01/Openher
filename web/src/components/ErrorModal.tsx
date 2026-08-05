import { Modal } from "./Modal"
import { useT } from "../i18n-context"

type ErrorModalProps = {
  message: string
  onClose: () => void
}

export function ErrorModal({ message, onClose }: ErrorModalProps) {
  const t = useT()
  return (
    <Modal onClose={onClose} aria-labelledby="error-modal-title" aria-describedby="error-modal-message">
      <h2 id="error-modal-title">{t('error.title')}</h2>
      <p id="error-modal-message" className="subtle">{message}</p>
      <div className="modal-actions" style={{ gridTemplateColumns: "1fr" }}>
        <button className="btn-primary" onClick={onClose}>
          {t('error.close')}
        </button>
      </div>
    </Modal>
  )
}
