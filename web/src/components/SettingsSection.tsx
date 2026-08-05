import { memo, useState, type ReactNode } from "react"

type Props = {
  title: ReactNode
  icon?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}

export const SettingsSection = memo(function SettingsSection({ title, icon, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="settings-card">
      <button
        type="button"
        className="settings-section-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`settings-section-${String(title).replace(/\W+/g, "-")}`}>
        <span className="settings-section-title">
          {icon}
          {title}
        </span>
        <span className={`settings-chevron${open ? " open" : ""}`} aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="settings-section-body" id={`settings-section-${String(title).replace(/\W+/g, "-")}`}>
          {children}
        </div>
      )}
    </div>
  )
})
