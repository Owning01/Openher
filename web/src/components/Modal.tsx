import { type ReactNode } from "react"

type ModalProps = {
  children: ReactNode
  onClose: () => void
  className?: string
}

export function Modal({ children, onClose, className = "" }: ModalProps) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className={`modal-card fade-in${className ? " " + className : ""}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </section>
    </div>
  )
}
