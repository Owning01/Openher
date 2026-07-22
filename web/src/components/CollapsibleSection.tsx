import { memo, useState, useCallback, type ReactNode } from "react"
import { ChevronIcon } from "../Icons"

type Props = {
  icon: ReactNode
  title: string
  subtitle?: string
  filePath?: string
  defaultOpen?: boolean
  children: ReactNode
}

export const CollapsibleSection = memo(function CollapsibleSection({ icon, title, subtitle, filePath, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  const handleToggle = useCallback(() => setOpen((v) => !v), [])

  return (
    <div className={`collapsible-section${open ? " open" : ""}`}>
      <button className="collapsible-toggle" onClick={handleToggle} aria-expanded={open}>
        <span className="collapsible-icon">{icon}</span>
        <span className="collapsible-title">{title}</span>
        {subtitle && <span className="collapsible-subtitle">{subtitle}</span>}
        {filePath && <span className="collapsible-file">{filePath}</span>}
        <span className="collapsible-chevron" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }}>
          <ChevronIcon size={10} />
        </span>
      </button>
      {open && <div className="collapsible-content">{children}</div>}
    </div>
  )
})
