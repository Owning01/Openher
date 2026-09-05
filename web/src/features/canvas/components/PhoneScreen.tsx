import { useRef } from "react"
import type { CanvasPart, CanvasScreen } from "../model/canvasTypes"
import { defaultPartHeight, screenSizeOf } from "../model/canvasTypes"

type Props = {
  screen: CanvasScreen
  parts: CanvasPart[]
  maxWidth?: number
  mode: "edit" | "preview"
  selectedId?: string | null
  onSelect?: (partId: string | null) => void
  onMove?: (partId: string, x: number, y: number, commit: boolean) => void
  onTap?: (part: CanvasPart) => void
}

const DRAGGABLE_EXCLUDE = new Set(["topAppBar", "bottomNav"])

function PartBody({ part }: { part: CanvasPart }) {
  const h = defaultPartHeight(part.kind)
  switch (part.kind) {
    case "topAppBar":
      return (
        <div className="m3e-bar m3e-bar-top">
          <span aria-hidden>{part.icon ?? "="}</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{part.label || "Titulo"}</span>
        </div>
      )
    case "bottomNav":
      return (
        <div className="m3e-bar m3e-bar-bottom">
          <span>Inicio</span><span>Buscar</span><span>Ajustes</span>
        </div>
      )
    case "button":
      return <div className={`m3e-btn m3e-btn-${part.variant ?? "filled"}`}>{part.icon ? <span aria-hidden>{part.icon}</span> : null}{part.label}</div>
    case "chip":
      return <div className="m3e-chip">{part.label}</div>
    case "text":
      return <div className="m3e-text" style={{ fontSize: 28, fontWeight: 600 }}>{part.label}</div>
    case "card":
      return (
        <div className="m3e-card">
          <div style={{ fontSize: 17, fontWeight: 600 }}>{part.label}</div>
          <div style={{ fontSize: 14, color: "var(--m3-on-variant)", marginTop: 4 }}>Descripcion de la tarjeta</div>
        </div>
      )
    case "listItem":
      return (
        <div className="m3e-list">
          <span aria-hidden style={{ fontSize: 22 }}>*</span>
          <span style={{ fontSize: 16 }}>{part.label}</span>
        </div>
      )
    case "switch":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, height: h }}>
          <span style={{ fontSize: 16 }}>{part.label}</span>
          <span style={{ marginLeft: "auto" }} className={`m3e-switch-track${part.checked ? " on" : ""}`}>
            <span className="m3e-switch-thumb" />
          </span>
        </div>
      )
    case "textField":
      return <div className="m3e-field">{part.label}</div>
    case "divider":
      return <div className="m3e-divider" />
    case "fab":
      return <div className="m3e-fab">{part.icon ?? "+"}</div>
    case "searchBar":
      return <div className="m3e-search">? {part.label}</div>
  }
}

export function PhoneScreen({ screen, parts, maxWidth = 300, mode, selectedId, onSelect, onMove, onTap }: Props) {
  const { w: sw, h: sh } = screenSizeOf(screen)
  const scale = Math.min(1, maxWidth / sw)
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null)

  return (
    <div className="m3e-scope">
      <div className="m3e-phone" style={{ width: sw * scale + 20 }}>
        <div className="m3e-screen" style={{ width: sw * scale, height: sh * scale }}>
          <div style={{ width: sw, height: sh, transform: `scale(${scale})`, transformOrigin: "top left", position: "relative" }}>
            {mode === "edit" ? (
              <div
                style={{ position: "absolute", inset: 0 }}
                onClick={() => onSelect?.(null)}
              />
            ) : null}
            {parts.map((p) => {
              const h = defaultPartHeight(p.kind)
              const w = p.w ?? sw
              const draggable = mode === "edit" && !DRAGGABLE_EXCLUDE.has(p.kind)
              return (
                <div
                  key={p.id}
                  className={`m3e-part${selectedId === p.id ? " m3e-selected" : ""}${mode === "preview" && p.action ? " m3e-tappable" : ""}`}
                  style={{
                    left: p.x,
                    top: p.y,
                    width: w,
                    height: h,
                    cursor: mode === "edit" ? (draggable ? "grab" : "default") : p.action ? "pointer" : "default",
                    touchAction: "none",
                  }}
                  onPointerDown={(e) => {
                    if (mode !== "edit" || !draggable) return
                    onSelect?.(p.id)
                    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
                    dragRef.current = { id: p.id, startX: e.clientX, startY: e.clientY, origX: p.x, origY: p.y, moved: false }
                  }}
                  onPointerMove={(e) => {
                    const d = dragRef.current
                    if (!d || d.id !== p.id || !onMove) return
                    const dx = (e.clientX - d.startX) / scale
                    const dy = (e.clientY - d.startY) / scale
                    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 3) return
                    d.moved = true
                    onMove(p.id, d.origX + dx, d.origY + dy, false)
                  }}
                  onPointerUp={() => {
                    const d = dragRef.current
                    dragRef.current = null
                    if (d && d.id === p.id && d.moved && onMove) onMove(p.id, p.x, p.y, true)
                  }}
                  onClick={(e) => {
                    if (mode === "preview") {
                      if (p.action) onTap?.(p)
                    } else {
                      e.stopPropagation()
                      onSelect?.(p.id)
                    }
                  }}
                >
                  <PartBody part={p} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
