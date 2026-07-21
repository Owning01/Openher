import { memo, useEffect, useRef } from "react"

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

export const ContextMenu = memo(function ContextMenu({ x, y, actions, onClose }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (rect.right > vw) ref.current.style.left = `${vw - rect.width - 8}px`
    if (rect.bottom > vh) ref.current.style.top = `${vh - rect.height - 8}px`
  }, [])

  return (
    <div className="context-menu" ref={ref} style={{ left: x, top: y }}>
      {actions.map((a) => (
        <button key={a.id} className="context-menu-item" onClick={() => { a.onAction(); onClose() }}>
          {a.icon && <span className="context-menu-icon">{a.icon}</span>}
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  )
})

export default ContextMenu
