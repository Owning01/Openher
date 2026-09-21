import { useEffect, useState, type RefObject } from "react"

export type SelectionCopy = { x: number; y: number; text: string }

// Copiar selección: aparece solo cuando hay texto seleccionado dentro del chat;
// cualquier scroll lo oculta. Throttled + RAF para no bloquear typing.
export function useSelectionCopy(wrapRef: RefObject<HTMLDivElement | null>) {
  const [selectionCopy, setSelectionCopy] = useState<SelectionCopy | null>(null)

  useEffect(() => {
    let raf: number | null = null
    let lastText = ""
    const update = () => {
      if (raf !== null) return
      raf = requestAnimationFrame(() => {
        raf = null
        const sel = window.getSelection()
        const wrap = wrapRef.current
        if (!sel || sel.isCollapsed || !wrap || !sel.anchorNode || !wrap.contains(sel.anchorNode)) {
          if (lastText !== "") { lastText = ""; setSelectionCopy(null) }
          return
        }
        const text = sel.toString().trim()
        if (!text) {
          if (lastText !== "") { lastText = ""; setSelectionCopy(null) }
          return
        }
        if (text === lastText) return
        const rect = sel.getRangeAt(0).getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) {
          if (lastText !== "") { lastText = ""; setSelectionCopy(null) }
          return
        }
        lastText = text
        const vw = window.innerWidth
        const btnW = 140
        const x = Math.min(Math.max(rect.left + rect.width / 2 - btnW / 2, 8), vw - btnW - 8)
        const y = rect.top - 42
        setSelectionCopy({ x, y, text })
      })
    }
    const hide = () => {
      if (raf !== null) { cancelAnimationFrame(raf); raf = null }
      if (lastText !== "") { lastText = ""; setSelectionCopy(null) }
    }
    document.addEventListener("selectionchange", update)
    document.addEventListener("scroll", hide, true)
    return () => {
      if (raf !== null) cancelAnimationFrame(raf)
      document.removeEventListener("selectionchange", update)
      document.removeEventListener("scroll", hide, true)
    }
  }, [wrapRef])

  return { selectionCopy, setSelectionCopy }
}
