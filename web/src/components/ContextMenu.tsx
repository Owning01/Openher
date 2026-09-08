import { Fragment, useCallback, useEffect, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { useOutsideClick } from "../hooks/useOutsideClick"

export type ContextAction = {
  id: string
  label: string
  icon?: ReactNode
  /** Hint de atajo real (solo si el comando tiene binding; jamás inventar). */
  shortcut?: string
  dividerBefore?: boolean
  disabled?: boolean
  danger?: boolean
  onAction: () => void
}

type Props = {
  x: number
  y: number
  actions: ContextAction[]
  onClose: () => void
}

const enabledButtons = (root: HTMLElement | null): HTMLButtonElement[] =>
  root ? Array.from(root.querySelectorAll<HTMLButtonElement>(".context-menu-item:not(:disabled)")) : []

export const ContextMenu = function ContextMenu({ x, y, actions, onClose }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)

  useOutsideClick(ref, onClose)

  // Foco al primer ítem para navegación por teclado inmediata.
  useEffect(() => {
    enabledButtons(ref.current)[0]?.focus()
  }, [])

  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (rect.right > vw) ref.current.style.left = `${Math.max(8, vw - rect.width - 8)}px`
    if (rect.bottom > vh) ref.current.style.top = `${Math.max(8, vh - rect.height - 8)}px`
  }, [x, y])

  const runAction = useCallback((a: ContextAction) => {
    if (a.disabled) return
    a.onAction()
    onClose()
  }, [onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return
    e.preventDefault()
    const btns = enabledButtons(ref.current)
    if (btns.length === 0) return
    const idx = btns.indexOf(document.activeElement as HTMLButtonElement)
    let next = 0
    if (e.key === "ArrowDown") next = idx < 0 ? 0 : (idx + 1) % btns.length
    else if (e.key === "ArrowUp") next = idx < 0 ? btns.length - 1 : (idx - 1 + btns.length) % btns.length
    else if (e.key === "End") next = btns.length - 1
    btns[next]?.focus()
  }, [onClose])

  return createPortal(
    <div
      className="context-menu"
      ref={ref}
      role="menu"
      style={{ left: x, top: y, position: "fixed", zIndex: 99999 }}
      onKeyDown={handleKeyDown}
    >
      {actions.map((a) => (
        <Fragment key={a.id}>
          {a.dividerBefore && <div className="menu-separator" role="separator" />}
          <button
            type="button"
            role="menuitem"
            className={`context-menu-item${a.danger ? " is-danger" : ""}`}
            disabled={a.disabled}
            onClick={() => runAction(a)}
          >
            <span className="context-menu-icon" aria-hidden="true">{a.icon}</span>
            <span className="context-menu-label">{a.label}</span>
            {a.shortcut && <span className="menu-shortcut">{a.shortcut}</span>}
          </button>
        </Fragment>
      ))}
    </div>,
    document.body
  )
}
