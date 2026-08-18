import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useOutsideClick } from "../hooks/useOutsideClick"

type ContextAction = {
  id: string
  label: string
  icon?: string
  onAction: () => void
}

type Props = {
  x: number
  y: number
  actions: ContextAction[]
  onClose: () => void
}

export const ContextMenu = function ContextMenu({ x, y, actions, onClose }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)

  useOutsideClick(ref, onClose)

  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (rect.right > vw) ref.current.style.left = `${Math.max(8, vw - rect.width - 8)}px`
    if (rect.bottom > vh) ref.current.style.top = `${Math.max(8, vh - rect.height - 8)}px`
  }, [x, y])

  return createPortal(
    <div className="context-menu" ref={ref} style={{ left: x, top: y, position: "fixed", zIndex: 99999 }}>
      {actions.map((a) => (
        <button key={a.id} className="context-menu-item" onClick={() => { a.onAction(); onClose() }}>
          {a.icon && <span className="context-menu-icon">{a.icon}</span>}
          <span>{a.label}</span>
        </button>
      ))}
    </div>,
    document.body
  )
}
