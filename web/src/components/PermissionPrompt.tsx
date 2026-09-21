import { memo, useCallback } from "react"
import { Modal } from "./Modal"
import { ModalHeader } from "./ModalHeader"
import { useT } from "../i18n-context"
import type { PermissionRequest } from "../types"

type Props = {
  request: PermissionRequest
  onApprove: (requestID: string) => void
  onReject: (requestID: string) => void
  onDismiss: () => void
}

export const PermissionPrompt = memo(function PermissionPrompt({ request, onApprove, onReject, onDismiss }: Props) {
  const t = useT()

  const handleApprove = useCallback(() => {
    onApprove(request.requestID)
    onDismiss()
  }, [request.requestID, onApprove, onDismiss])

  const handleReject = useCallback(() => {
    onReject(request.requestID)
    onDismiss()
  }, [request.requestID, onReject, onDismiss])

  return (
    <Modal onClose={onDismiss} variant="overlay" label={t('settings.permissionRequest')}>
        <ModalHeader title={t('settings.permissionRequest')} onClose={onDismiss} />
        <div className="modal-body">
          <p className="permission-detail">{request.permission}</p>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={handleReject}>
            {t('settings.permissionDeny')}
          </button>
          <button className="btn btn-primary" onClick={handleApprove}>
            {t('settings.permissionAllow')}
          </button>
        </div>
    </Modal>
  )
})
