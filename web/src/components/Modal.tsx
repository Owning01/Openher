import { type ReactNode, useEffect, useRef } from "react"

type ModalProps = {
  children: ReactNode
  onClose: () => void
  className?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}

export function Modal({ children, onClose, className = "", ...props }: ModalProps) {
  const modalRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key === "Tab") {
        const modalEl = modalRef.current
        if (!modalEl) return
        const focusables = modalEl.querySelectorAll<HTMLElement>(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'
        )
        if (focusables.length === 0) return
        const first = focusables[0]!
        const last = focusables[focusables.length - 1]!
        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === last) {
            first.focus()
            e.preventDefault()
          }
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    const modalEl = modalRef.current
    if (modalEl) {
      const focusables = modalEl.querySelectorAll<HTMLElement>(
        'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'
      )
      if (focusables.length > 0) {
        setTimeout(() => focusables[0]?.focus(), 50)
      }
    }

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

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
