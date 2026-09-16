import { memo, useState, useCallback, type ReactNode } from "react"
import { ChevronIcon } from "../Icons"

type Props = {
  icon?: ReactNode
  title: string
  subtitle?: ReactNode
  filePath?: string
  defaultOpen?: boolean
  /** Modo controlado: si se pasa, el componente no maneja su propio estado. */
  open?: boolean
  onToggle?: () => void
  className?: string
  /** Mantiene los hijos montados al cerrar (solo se ocultan): conserva el
   *  estado interno de cada tool y evita remontar al reabrir. */
  keepMounted?: boolean
  children: ReactNode
}

export const CollapsibleSection = memo(function CollapsibleSection({ icon, title, subtitle, filePath, defaultOpen = false, open: controlledOpen, onToggle: controlledToggle, className, keepMounted = false, children }: Props) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen! : internalOpen

  const handleToggle = useCallback(() => {
    if (isControlled) { controlledToggle?.() }
    else { setInternalOpen((v) => !v) }
  }, [isControlled, controlledToggle])

  return (
    <div className={`collapsible-section${open ? " open" : ""}${className ? " " + className : ""}`}>
      <button className="collapsible-toggle" onClick={handleToggle} aria-expanded={open}>
        {icon && <span className="collapsible-icon">{icon}</span>}
        <span className="collapsible-title">{title}</span>
        {subtitle && <span className="collapsible-subtitle">{subtitle}</span>}
        {filePath && <span className="collapsible-file">{filePath}</span>}
        <span className="collapsible-chevron" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }}>
          <ChevronIcon size={10} />
        </span>
      </button>
      {/* `open` es obligatorio: motion.css colapsa .collapsible-content a
          grid-template-rows 0fr + opacity 0 y solo .open lo revierte. Sin la
          clase, el contenido quedaba montado pero invisible. */}
      {(!open && !keepMounted) ? null : (
        <div className={`collapsible-content${open ? " open" : ""}`}>{children}</div>
      )}
    </div>
  )
})
