import { memo } from "react"
import { TrashIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { SessionView } from "../types"
import { Modal } from "./Modal"

type ConfirmModalProps = {
  session: SessionView
  onConfirm: (id: string) => void | Promise<void>
  onCancel: () => void
}

export const ConfirmModal = memo(function ConfirmModal({ session, onConfirm, onCancel }: ConfirmModalProps) {
  const t = useT()
  return (
    <Modal onClose={onCancel}>
      <h2 id="delete-session-title">{t('session.deleteTitle')}</h2>
      <p>
        {t('session.deleteBodyPrefix')} <strong>{session.title}</strong>.
      </p>
      <p className="subtle">{session.directory}</p>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel}>
          {t('session.cancel')}
        </button>
        <button className="btn-danger" onClick={() => onConfirm(session.id)}>
          <TrashIcon size={16} />
          {t('session.deleteConfirm')}
        </button>
      </div>
    </Modal>
  )
})
