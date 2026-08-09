import { memo, useState, type ReactNode } from "react"

type Props = {
  title: ReactNode
  icon?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  /** Acciones siempre visibles (p.ej. botón +) a la derecha del título. */
  actions?: ReactNode
  /** Modo controlado: open/onToggle reemplazan el estado interno. */
  open?: boolean
  onToggle?: () => void
}

export const SettingsSection = memo(function SettingsSection({ title, icon, children, defaultOpen = false, actions, open, onToggle }: Props) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = open ?? internalOpen
  const toggle = onToggle ?? (() => setInternalOpen((v) => !v))
  return (
    <div className="settings-card">
      <div className="settings-section-header">
        <button
          type="button"
          className="settings-section-toggle"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-controls={`settings-section-${String(title).replace(/\W+/g, "-")}`}>
          <span className="settings-section-title">
            {icon}
            {title}
          </span>
          <span className={`settings-chevron${isOpen ? " open" : ""}`} aria-hidden="true">▾</span>
        </button>
        {actions && (
          <div className="settings-section-actions" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      {isOpen && (
        <div className="settings-section-body" id={`settings-section-${String(title).replace(/\W+/g, "-")}`}>
          {children}
        </div>
      )}
    </div>
  )
})
