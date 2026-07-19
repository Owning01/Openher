import { type ReactNode, useRef } from "react"
import { useFocusTrap } from "../hooks/useFocusTrap"

type ModalProps = {
  children: ReactNode
  onClose: () => void
  className?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}

export function Modal({ children, onClose, className = "", ...props }: ModalProps) {
  const modalRef = useRef<HTMLElement>(null)
  useFocusTrap(modalRef, onClose)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={modalRef}
        className={`modal-card fade-in${className ? " " + className : ""}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        aria-labelledby={props["aria-labelledby"]}
        aria-describedby={props["aria-describedby"]}
      >
        {children}
      </section>
    </div>
  )
}
