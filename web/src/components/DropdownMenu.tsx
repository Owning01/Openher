import { memo, useState, useRef, useEffect, type CSSProperties, type ReactNode } from "react"
import { useOutsideClick } from "../hooks/useOutsideClick"

type Props = {
  trigger: ReactNode | ((open: boolean) => ReactNode)
  children: ReactNode
  align?: "left" | "right"
  width?: number
  /** Clases extra del panel (permite conservar el skin del consumidor). */
  className?: string
  /** Clases del contenedor que delimita el "click afuera". */
  wrapClassName?: string
  /** Estilo del contenedor (por defecto: relative + inline-flex). */
  wrapStyle?: CSSProperties
}

export const DropdownMenu = memo(function DropdownMenu({
  trigger, children, align = "right", width = 180, className, wrapClassName, wrapStyle
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useOutsideClick(ref, () => setOpen(false), open)

  useEffect(() => {
    if (!open) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [open])

  return (
    <div
      className={`dropdown-menu-wrap${wrapClassName ? ` ${wrapClassName}` : ""}`}
      ref={ref}
      style={wrapStyle ?? { position: "relative", display: "inline-flex" }}
    >
      <div onClick={() => setOpen((v) => !v)}>{typeof trigger === "function" ? trigger(open) : trigger}</div>
      {open && (
        <div
          className={`dropdown-menu${className ? ` ${className}` : ""}`}
          onClick={(e) => {
            const btn = (e.target as Element).closest("button") as HTMLButtonElement | null
            if (btn && !btn.disabled) setOpen(false)
          }}
          style={{
            position: "absolute", top: "calc(100% + 6px)", [align]: 0, left: align === "right" ? "auto" : 0,
            zIndex: 99999, display: "flex", flexDirection: "column", width, gap: 2, padding: 4,
            background: "var(--surface-strong, #1a1a20)", border: "1px solid var(--border-strong, #444)",
            borderRadius: "var(--radius-md, 8px)", boxShadow: "0 10px 30px rgba(0,0,0,0.6)"
          }}
        >
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