import { memo, useEffect, useRef } from "react"

export type BrowserPickedElement = {
  outerHTML: string
  innerText: string
  selector: string
  xpath: string
  tag: string
  boundingRect: { x: number; y: number; w: number; h: number }
  url: string
  bx?: number
  by?: number
  source?: { file: string; line: number | null } | null
}

function findSource(el: Element): { file: string; line: number | null } | null {
  try {
    const anyEl = el as any
    const fk = Object.keys(el).find((k) => k.startsWith("__reactFiber$"))
    if (fk) {
      let fib = (el as any)[fk]
      while (fib) {
        if (fib._debugSource) return { file: String(fib._debugSource.fileName), line: fib._debugSource.lineNumber ?? null }
        fib = fib.return
      }
    }
    if (anyEl.__vueParentComponent?.type?.__file) return { file: String(anyEl.__vueParentComponent.type.__file), line: null }
  } catch {}
  return null
}

type Props = {
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  enabled: boolean
  url: string
  onPick: (el: BrowserPickedElement) => void
  onExit: () => void
}

function buildSelector(el: Element): string {
  const parts: string[] = []
  let cur: Element | null = el
  while (cur && cur.tagName.toLowerCase() !== "html" && parts.length < 4) {
    let seg = cur.tagName.toLowerCase()
    if (cur.id) {
      seg += `#${cur.id}`
      parts.unshift(seg)
      break
    }
    if (cur.className && typeof cur.className === "string") {
      const cls = cur.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join(".")
      if (cls) seg += `.${cls}`
    }
    const siblings = cur.parentElement ? Array.from(cur.parentElement.children).filter((c) => c.tagName === cur!.tagName) : []
    if (siblings.length > 1) {
      const idx = siblings.indexOf(cur) + 1
      seg += `:nth-of-type(${idx})`
    }
    parts.unshift(seg)
    cur = cur.parentElement
  }
  return parts.join(" > ")
}

function buildXPath(el: Element): string {
  const segs: string[] = []
  let cur: Element | null = el
  while (cur && cur.nodeType === 1 && segs.length < 6) {
    let idx = 1
    let sib: Element | null = cur.previousElementSibling
    while (sib) {
      if (sib.tagName === cur.tagName) idx++
      sib = sib.previousElementSibling
    }
    segs.unshift(`${cur.tagName.toLowerCase()}[${idx}]`)
    cur = cur.parentElement
  }
  return `/${segs.join("/")}`
}

const INJECT_STYLE_ID = "__opencode-visual-inject-style"
const HIGHLIGHT_ID = "__opencode-visual-highlight"

function injectIntoDoc(doc: Document, onPick: (el: BrowserPickedElement) => void, onExit: () => void, url: string): () => void {
  // style
  if (!doc.getElementById(INJECT_STYLE_ID)) {
    const style = doc.createElement("style")
    style.id = INJECT_STYLE_ID
    style.textContent = `
      .__opencode-hover { outline: 2px solid #58a6ff !important; outline-offset: 1px !important; cursor: crosshair !important; }
      #${HIGHLIGHT_ID} { position: fixed; pointer-events: none; border: 2px dashed #58a6ff; background: rgba(88,166,255,0.12); z-index: 2147483647; border-radius: 6px; transition: all 60ms ease; }
    `
    doc.head.appendChild(style)
  }

  let highlight = doc.getElementById(HIGHLIGHT_ID) as HTMLDivElement | null
  if (!highlight) {
    highlight = doc.createElement("div")
    highlight.id = HIGHLIGHT_ID
    doc.body.appendChild(highlight)
  }

  let current: Element | null = null

  const updateHighlight = (el: Element | null) => {
    if (!highlight) return
    if (!el) {
      highlight.style.display = "none"
      return
    }
    const r = el.getBoundingClientRect()
    highlight.style.display = "block"
    highlight.style.left = `${r.left}px`
    highlight.style.top = `${r.top}px`
    highlight.style.width = `${r.width}px`
    highlight.style.height = `${r.height}px`
  }

  const onMouseOver = (e: MouseEvent) => {
    const target = e.target as Element
    if (!target || target.id === HIGHLIGHT_ID) return
    if (current) current.classList.remove("__opencode-hover")
    current = target
    current.classList.add("__opencode-hover")
    updateHighlight(current)
  }

  const onMouseOut = (e: MouseEvent) => {
    const target = e.target as Element
    if (target === current) {
      target.classList.remove("__opencode-hover")
      current = null
      updateHighlight(null)
    }
  }

  const onClick = (e: MouseEvent) => {
    const target = e.target as Element
    if (!target || target.id === HIGHLIGHT_ID) return
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    const rect = target.getBoundingClientRect()
    const outerHTML = target.outerHTML.slice(0, 4000)
    const innerText = (target as HTMLElement).innerText?.slice(0, 500) ?? target.textContent?.slice(0, 500) ?? ""
    const selector = buildSelector(target)
    const xpath = buildXPath(target)
    const tag = target.tagName.toLowerCase()
    // limpiar
    if (current) current.classList.remove("__opencode-hover")
    current = null
    updateHighlight(null)
    onPick({ outerHTML, innerText, selector, xpath, tag, boundingRect: { x: rect.left, y: rect.top, w: rect.width, h: rect.height }, url, bx: rect.left + (window.scrollX || 0), by: rect.top + (window.scrollY || 0), source: findSource(target) })
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      onExit()
    }
  }

  doc.addEventListener("mouseover", onMouseOver, true)
  doc.addEventListener("mouseout", onMouseOut, true)
  doc.addEventListener("click", onClick, true)
  doc.addEventListener("keydown", onKey, true)
  // overlay hint
  const hint = doc.createElement("div")
  hint.id = "__opencode-hint"
  hint.textContent = "◈ Modo selección — clic en cualquier botón/cuadrado/zona • Esc para salir"
  hint.style.cssText = "position:fixed;top:8px;left:50%;transform:translateX(-50%);background:#58a6ff;color:white;padding:6px 12px;border-radius:999px;font:600 12px system-ui;z-index:2147483647;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,0.25)"
  doc.body.appendChild(hint)

  return () => {
    doc.removeEventListener("mouseover", onMouseOver, true)
    doc.removeEventListener("mouseout", onMouseOut, true)
    doc.removeEventListener("click", onClick, true)
    doc.removeEventListener("keydown", onKey, true)
    if (current) current.classList.remove("__opencode-hover")
    const h = doc.getElementById("__opencode-hint")
    if (h) h.remove()
    const hl = doc.getElementById(HIGHLIGHT_ID)
    if (hl) hl.style.display = "none"
  }
}

export const BrowserVisualOverlay = memo(function BrowserVisualOverlay({ iframeRef, enabled, url, onPick, onExit }: Props) {
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!enabled) {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      return
    }
    const iframe = iframeRef.current
    if (!iframe) return

    let cancelled = false
    const tryInject = () => {
      if (cancelled) return
      try {
        const doc = iframe.contentDocument
        if (!doc || !doc.body) {
          window.setTimeout(tryInject, 400)
          return
        }
        // solo same-origin (proxy) permite acceso; si es cross-origin, catch y avisa
        // test access
        void doc.body.innerHTML
        cleanupRef.current = injectIntoDoc(doc, onPick, onExit, url)
      } catch {
        // cross-origin (localhost sin proxy): mostrar aviso en overlay host
        // no podemos inyectar, pero mantenemos enabled para reintentar tras navegación
      }
    }

    // esperar load
    const onLoad = () => window.setTimeout(tryInject, 300)
    iframe.addEventListener("load", onLoad)
    // intentar ya (si ya cargó)
    window.setTimeout(tryInject, 600)

    return () => {
      cancelled = true
      iframe.removeEventListener("load", onLoad)
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [enabled, iframeRef, onPick, onExit, url])

  // Atajo Esc en host también sale
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [enabled, onExit])

  return null
})
