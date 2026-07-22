import { useEffect, useRef, type RefObject } from "react"

const FOCUSABLE_SELECTOR = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'

export function useFocusTrap(ref: RefObject<HTMLElement | null>, onClose: () => void, active = true) {
  const focusedRef = useRef(false)

  useEffect(() => {
    if (!active) {
      focusedRef.current = false
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key === "Tab") {
        const el = ref.current
        if (!el) return
        const focusables = el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        if (focusables.length === 0) return
        const first = focusables[0]!
        const last = focusables[focusables.length - 1]!
        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === last) {
            first.focus()
            e.preventDefault()
          }
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    const el = ref.current
    if (el && !focusedRef.current) {
      const focusables = el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusables.length > 0) {
        focusedRef.current = true
        setTimeout(() => focusables[0]?.focus(), 50)
      }
    }

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, ref, active])
}
