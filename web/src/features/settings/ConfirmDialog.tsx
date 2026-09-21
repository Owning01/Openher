// ConfirmDialog — modal de confirmación reutilizable (F4-P4): unifica los dos
// modales gemelos de shutdown/restart de SettingsPanel. P5: usa el <Modal>
// compartido (focus trap + Esc + aria-modal) conservando el cascarón card.
import type { ReactNode } from "react"
import { Modal } from "../../components/Modal"

type ConfirmDialogProps = {
  title: string
  body: string
  cancelText: string
  confirmText: string
  confirmIcon?: ReactNode
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({ title, body, cancelText, confirmText, confirmIcon, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <Modal onClose={onCancel}>
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            {confirmIcon}
            {confirmText}
          </button>
        </div>
    </Modal>
  )
}
