import { useState, type CSSProperties } from "react"
import { FolderIcon } from "../../Icons"
import { parseDragPayload, isTerminalTabPayload } from "../../utils/drag"

export interface DesktopCellPlaceholderProps {
  index: number
  style: CSSProperties
  onActivate: () => void
  onClose: () => void
  onOpenFile: (path: string, index?: number, zone?: "left" | "right" | "top" | "bottom" | "center") => void
  onSwapPanels: (from: number, to: number) => void
  onDock: (index: number, dir: "left" | "right" | "top" | "bottom" | "center", specificId?: string) => void
  label: string
}

export function DesktopCellPlaceholder(props: DesktopCellPlaceholderProps) {
  const [dragOver, setDragOver] = useState(false)
  const { index } = props

  return (
    <div
      className={`desktop-cell-placeholder${dragOver ? " drag-over" : ""}`}
      style={{ ...props.style, position: "relative" }}
      onClick={props.onActivate}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOver(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const f = e.dataTransfer.files[0]
          const filePath = (f as any).path || f.name
          if (filePath) {
            props.onOpenFile(filePath, index, "center")
            return
          }
        }
        // Solo payloads INTERNOS pueden dockear/cambiar paneles: un
        // `text/plain` suelto es una SELECCIÓN DE TEXTO, no una pestaña.
        // Antes el `else` final hacía onDock con cualquier cosa y rompía la UI.
        const raw = e.dataTransfer.getData("application/x-opencode-path")
        if (!raw) {
          const text = e.dataTransfer.getData("text/plain")
          if (text) window.dispatchEvent(new CustomEvent("plugin:insert-text", { detail: text }))
          return
        }
        if (isTerminalTabPayload(raw)) {
          props.onDock(index, "center", raw)
          return
        }
        const payload = parseDragPayload(raw)
        if (payload.kind === "file") {
          props.onOpenFile(payload.path, index, "center")
        } else if (payload.kind === "panel") {
          if (payload.idx !== index) props.onSwapPanels(payload.idx, index)
        } else if (payload.kind === "session" || payload.kind === "kind" || payload.kind === "tab") {
          props.onDock(index, "center", raw)
        }
        // `unknown` (payload interno sin forma conocida): no es una pestaña.
      }}
    >
      <button
        type="button"
        className="btn-icon compact desktop-cell-close"
        title="Close split"
        aria-label="Close split"
        onClick={(e) => {
          e.stopPropagation()
          props.onClose()
        }}
      >
        ×
      </button>
      <FolderIcon size={48} className="icon-empty-state" />
      <p>{props.label}</p>
    </div>
  )
}
