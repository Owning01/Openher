import { memo, useState, useCallback, type ReactNode } from "react"

type Props = {
  icon: string
  title: string
  subtitle?: string
  filePath?: string
  defaultOpen?: boolean
  children: ReactNode
  onToggle?: (open: boolean) => void
}

export const CollapsibleSection = memo(function CollapsibleSection({ icon, title, subtitle, filePath, defaultOpen = false, children, onToggle }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  const handleToggle = useCallback(() => {
    setOpen((v) => {
      const next = !v
      onToggle?.(next)
      return next
    })
  }, [onToggle])

  return (
    <div className={`collapsible-section${open ? " open" : ""}`}>
      <button className="collapsible-toggle" onClick={handleToggle} aria-expanded={open}>
        <span className="collapsible-icon">{icon}</span>
        <span className="collapsible-title">{title}</span>
        {subtitle && <span className="collapsible-subtitle">{subtitle}</span>}
        {filePath && <span className="collapsible-file">{filePath}</span>}
        <span className="collapsible-chevron">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="collapsible-content">{children}</div>}
    </div>
  )
})
