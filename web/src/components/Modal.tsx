import { type CSSProperties, type ReactNode, type RefObject, useRef } from "react"
import { useFocusTrap } from "../hooks/useFocusTrap"

type ModalProps = {
  children: ReactNode
  onClose: () => void
  className?: string
  // "card" (default): .modal-backdrop/.modal-card. "overlay": .modal-overlay/.modal-content
  // — el cascarón que usan los modales históricos; permite migrarlos sin tocar clases.
  variant?: "card" | "overlay"
  // variant "overlay": nombre accesible y extras del contenedor.
  label?: string
  style?: CSSProperties
  overlayStyle?: CSSProperties
  contentRef?: RefObject<HTMLDivElement | null>
  // Por defecto "modal-content"; se reemplaza en ventanas flotantes (terminal).
  contentClassName?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}

export function Modal({
  children,
  onClose,
  className = "",
  variant = "card",
  label,
  style,
  overlayStyle,
  contentRef,
  contentClassName = "modal-content",
  ...props
}: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  // focus trap + Esc + aria-modal para las dos variantes (antes solo la card).
  useFocusTrap(contentRef ?? ref, onClose)

  if (variant === "overlay") {
    return (
      <div className="modal-overlay" style={overlayStyle} onClick={onClose}>
        <div
          ref={contentRef ?? ref}
          className={`${contentClassName}${className ? " " + className : ""}`}
          style={style}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          aria-labelledby={props["aria-labelledby"]}
          aria-describedby={props["aria-describedby"]}
        >
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={ref}
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
