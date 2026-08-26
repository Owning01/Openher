import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { EXTERNAL_PROJECTS } from "../features/external-plugins/config"

type Props = {
  open: boolean
  onClose: () => void
  onOpenProject: (name: string) => void
}

export function PluginsModal({ open, onClose, onOpenProject }: Props) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)

  // centrar al abrir
  useEffect(() => {
    if (open) {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const w = 420
      const h = 420
      setPos({ x: Math.round((vw - w) / 2), y: Math.round((vh - h) / 2) })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const onHeaderMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
    e.preventDefault()
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      const nx = Math.max(8, Math.min(window.innerWidth - 436, dragRef.current.origX + dx))
      const ny = Math.max(8, Math.min(window.innerHeight - 80, dragRef.current.origY + dy))
      setPos({ x: nx, y: ny })
    }
    const onUp = () => setDragging(false)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [dragging])

  if (!open) return null

  const content = (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.20)", backdropFilter: "blur(2px)" }}
      aria-hidden
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Plugins"
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          width: 420,
          maxWidth: "calc(100vw - 16px)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg, 12px)",
          boxShadow: "var(--shadow-md, 0 8px 30px rgba(0,0,0,0.18))",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface-subtle, var(--surface))",
            cursor: dragging ? "grabbing" : "grab",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--primary-soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontSize: 14 }}>🧩</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", lineHeight: 1 }}>Plugins</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Proyectos externos on-demand</div>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
          {EXTERNAL_PROJECTS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => { onOpenProject(p.name); onClose() }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 12px",
                borderRadius: "var(--radius-md, 10px)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-subtle)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary-soft)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)" }}
            >
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--primary-soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{p.icon}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: 13, color: "var(--text)", lineHeight: 1.2 }}>{p.title}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.description}</span>
                <span style={{ display: "block", fontSize: 10, color: "var(--muted)", opacity: 0.8 }}>{p.dir}</span>
              </span>
              <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600, flexShrink: 0 }}>Abrir →</span>
            </button>
          ))}
        </div>

        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", background: "var(--surface-subtle)", fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}>
          Se inicia automáticamente al abrir y se detiene al cerrar la pestaña.
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
