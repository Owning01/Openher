import { memo, useCallback, useRef, useState } from "react"
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
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const offsetRef = useRef(offset)
  offsetRef.current = offset

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return
    if ((e.target as HTMLElement).closest("button, input, textarea, a")) return

    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startOffsetX = offsetRef.current.x
    const startOffsetY = offsetRef.current.y

    document.body.style.userSelect = "none"

    const onPointerMove = (ev: PointerEvent) => {
      setOffset({
        x: startOffsetX + (ev.clientX - startX),
        y: startOffsetY + (ev.clientY - startY),
      })
    }

    const onPointerUp = () => {
      document.body.style.userSelect = ""
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
  }, [])

  const handleApprove = useCallback(() => {
    onApprove(request.requestID)
    onDismiss()
  }, [request.requestID, onApprove, onDismiss])

  const handleReject = useCallback(() => {
    onReject(request.requestID)
    onDismiss()
  }, [request.requestID, onReject, onDismiss])

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t('settings.permissionRequest')}
        style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
      >
        <div onPointerDown={handlePointerDown} style={{ cursor: "grab", touchAction: "none" }} title="Arrastra para mover">
          <ModalHeader title={t('settings.permissionRequest')} onClose={onDismiss} />
        </div>
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
      </div>
    </div>
  )
})
