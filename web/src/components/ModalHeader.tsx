import { memo, type ReactNode } from "react"
import { CloseIcon } from "../Icons"

type Props = {
  title: string
  onClose: () => void
  children?: ReactNode
}

export const ModalHeader = memo(function ModalHeader({ title, onClose, children }: Props) {
  return (
    <div className="modal-header">
      <h3>{title}</h3>
      <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
        {children}
        <button className="btn-icon btn-secondary compact" onClick={onClose}><CloseIcon size={14} /></button>
      </div>
    </div>
  )
})
