import { memo, useState, useRef, useEffect, type ReactNode } from "react"

type Props = {
  trigger: ReactNode
  children: ReactNode
  align?: "left" | "right"
  width?: number
}

export const DropdownMenu = memo(function DropdownMenu({ trigger, children, align = "right", width = 180 }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [open])

  return (
    <div className="dropdown-menu-wrap" ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div className="dropdown-menu" style={{
          position: "absolute", top: "calc(100% + 6px)", [align]: 0, left: align === "right" ? "auto" : 0,
          zIndex: 99999, display: "flex", flexDirection: "column", width, gap: 2, padding: 4,
          background: "var(--surface-strong, #1a1a20)", border: "1px solid var(--border-strong, #444)",
          borderRadius: "var(--radius-md, 8px)", boxShadow: "0 10px 30px rgba(0,0,0,0.6)"
        }}>
          {children}
        </div>
      )}
    </div>
  )
})

export const DropdownItem = memo(function DropdownItem({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" className="mode-dropdown-item" onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", width: "100%", textAlign: "left",
        padding: "0.45rem 0.75rem", fontSize: "0.78rem", fontWeight: 700, borderRadius: "var(--radius-sm, 4px)",
        border: "none", background: "transparent", color: "var(--text, #fff)", cursor: "pointer", whiteSpace: "nowrap" }}>
      {children}
    </button>
  )
})
