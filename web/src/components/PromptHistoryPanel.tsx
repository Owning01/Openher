import { memo, useCallback, useEffect, useRef, useState } from "react"
import { CloseIcon, MaximizeIcon, PanelLeftIcon, SearchIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { PromptEntry } from "../utils/promptHistory"

// Historial/timeline de prompts: flotante arrastrable + redimensionable, o
// acoplado a izquierda/derecha (columna que deja sitio al texto del chat).
// Sin store: los prompts derivan de los mensajes y el layout persiste en
// localStorage. Drag/resize por DOM directo a 60fps (patrón ChatTerminalDock).

export type PromptHistoryPlacement = "floating" | "left" | "right"

type Layout = {
  placement: PromptHistoryPlacement
  x: number | null
  y: number | null
  w: number
  h: number
}

const LAYOUT_KEY = "opencode.promptHistory.layout"
const MIN_W = 240
const MIN_H = 200
const MIN_DOCK_W = 220
const MAX_DOCK_W = 560
const DEFAULT_W = 320
const DEFAULT_H = 440

function readLayout(): Layout {
  const fallback: Layout = { placement: "floating", x: null, y: null, w: DEFAULT_W, h: DEFAULT_H }
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (!raw) return fallback
    const p = JSON.parse(raw) as Partial<Layout>
    return {
      placement: p.placement === "left" || p.placement === "right" ? p.placement : "floating",
      x: typeof p.x === "number" ? p.x : null,
      y: typeof p.y === "number" ? p.y : null,
      w: typeof p.w === "number" ? Math.max(MIN_W, Math.min(720, p.w)) : DEFAULT_W,
      h: typeof p.h === "number" ? Math.max(MIN_H, Math.min(900, p.h)) : DEFAULT_H,
    }
  } catch {
    return fallback
  }
}

export function usePromptHistoryLayout() {
  const [layout, setLayout] = useState<Layout>(readLayout)
  const patch = useCallback((next: Partial<Layout>) => {
    setLayout((prev) => {
      const merged = { ...prev, ...next }
      try {
        localStorage.setItem(LAYOUT_KEY, JSON.stringify(merged))
      } catch {}
      return merged
    })
  }, [])
  const setPlacement = useCallback((placement: PromptHistoryPlacement) => patch({ placement }), [patch])
  return { layout, patch, setPlacement }
}

export type PromptHistoryLayout = ReturnType<typeof usePromptHistoryLayout>

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function defaultPos(w: number, h: number): { x: number; y: number } {
  return {
    x: Math.max(8, window.innerWidth - w - 24),
    y: clamp(120, 8, Math.max(8, window.innerHeight - h - 24)),
  }
}

function formatTime(created: number): string {
  if (!created) return ""
  try {
    return new Date(created).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

function previewOf(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 180)
}

type Props = {
  prompts: PromptEntry[]
  layout: PromptHistoryLayout
  onJump: (messageID: string) => void
  onClose: () => void
}

export const PromptHistoryPanel = memo(function PromptHistoryPanel({ prompts, layout, onJump, onClose }: Props) {
  const t = useT()
  const { layout: l, patch, setPlacement } = layout
  const [query, setQuery] = useState("")
  const boxRef = useRef<HTMLElement | null>(null)

  const q = query.trim().toLowerCase()
  const filtered = q ? prompts.filter((p) => p.text.toLowerCase().includes(q)) : prompts

  // Escape cierra (el panel no roba foco al abrir: el chat sigue escribible).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  // Drag del header en modo flotante (DOM directo; commit al soltar).
  const startDrag = useCallback((e: React.PointerEvent) => {
    if (l.placement !== "floating") return
    const target = e.target as HTMLElement
    if (target.closest("button, input")) return
    e.preventDefault()
    const el = boxRef.current
    if (!el) return
    const base = l.x === null || l.y === null ? defaultPos(l.w, l.h) : { x: l.x, y: l.y }
    const offX = e.clientX - base.x
    const offY = e.clientY - base.y
    let pos = base
    el.style.left = `${base.x}px`
    el.style.top = `${base.y}px`
    document.body.style.userSelect = "none"
    document.body.style.cursor = "grabbing"
    const onMove = (ev: PointerEvent) => {
      pos = {
        x: clamp(ev.clientX - offX, -l.w + 80, window.innerWidth - 80),
        y: clamp(ev.clientY - offY, 0, window.innerHeight - 40),
      }
      el.style.left = `${pos.x}px`
      el.style.top = `${pos.y}px`
    }
    const onUp = () => {
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      patch({ x: pos.x, y: pos.y })
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [l, patch])

  // Resize esquina SE en flotante (DOM directo; commit al soltar).
  const startResize = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const el = boxRef.current
    if (!el) return
    const startX = e.clientX
    const startY = e.clientY
    const startW = el.offsetWidth
    const startH = el.offsetHeight
    let w = startW
    let h = startH
    document.body.style.userSelect = "none"
    document.body.style.cursor = "nwse-resize"
    const onMove = (ev: PointerEvent) => {
      w = clamp(startW + (ev.clientX - startX), MIN_W, window.innerWidth - 16)
      h = clamp(startH + (ev.clientY - startY), MIN_H, window.innerHeight - 16)
      el.style.width = `${w}px`
      el.style.height = `${h}px`
    }
    const onUp = () => {
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      patch({ w, h })
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [patch])

  // Resize del borde interior en acoplado (ancho de columna).
  const startEdgeResize = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const el = boxRef.current
    if (!el) return
    const startX = e.clientX
    const startW = el.offsetWidth
    const dir = l.placement === "left" ? 1 : -1
    let w = startW
    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"
    const onMove = (ev: PointerEvent) => {
      w = clamp(startW + dir * (ev.clientX - startX), MIN_DOCK_W, Math.min(MAX_DOCK_W, window.innerWidth - 200))
      el.style.width = `${w}px`
    }
    const onUp = () => {
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      patch({ w })
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [l.placement, patch])

  const floating = l.placement === "floating"
  const pos = floating
    ? (l.x === null || l.y === null ? defaultPos(l.w, l.h) : { x: l.x, y: l.y })
    : null

  return (
    <section
      ref={boxRef}
      role="dialog"
      aria-label={t("session.promptHistory")}
      className={`prompt-history${floating ? " floating" : l.placement === "left" ? " docked-left" : " docked-right"}`}
      style={floating
        ? { left: pos!.x, top: pos!.y, width: l.w, height: l.h }
        : { width: l.w }}
    >
      <header
        className={`ph-head${floating ? " draggable" : ""}`}
        onPointerDown={floating ? startDrag : undefined}
      >
        <span className="ph-title">{t("session.promptHistory")} ({filtered.length}/{prompts.length})</span>
        <span className="ph-actions">
          <button
            type="button" className={`btn-icon compact${l.placement === "left" ? " active" : ""}`}
            onClick={() => setPlacement("left")}
            title={t("session.promptHistoryDockLeft")} aria-label={t("session.promptHistoryDockLeft")}
            aria-pressed={l.placement === "left"}
          >
            <PanelLeftIcon size={13} />
          </button>
          <button
            type="button" className={`btn-icon compact${l.placement === "right" ? " active" : ""}`}
            onClick={() => setPlacement("right")}
            title={t("session.promptHistoryDockRight")} aria-label={t("session.promptHistoryDockRight")}
            aria-pressed={l.placement === "right"}
          >
            <span style={{ display: "inline-flex", transform: "scaleX(-1)" }}>
              <PanelLeftIcon size={13} />
            </span>
          </button>
          <button
            type="button" className={`btn-icon compact${floating ? " active" : ""}`}
            onClick={() => setPlacement("floating")}
            title={t("session.promptHistoryFloat")} aria-label={t("session.promptHistoryFloat")}
            aria-pressed={floating}
          >
            <MaximizeIcon size={13} />
          </button>
          <button
            type="button" className="btn-icon compact"
            onClick={onClose}
            title={t("panel.close")} aria-label={t("panel.close")}
          >
            <CloseIcon size={13} />
          </button>
        </span>
      </header>
      <div className="ph-search">
        <SearchIcon size={13} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("session.promptHistorySearch")}
          aria-label={t("session.promptHistorySearch")}
        />
      </div>
      <div className="ph-items" role="list">
        {filtered.length === 0 && (
          <div className="ph-empty">{t("session.promptHistoryEmpty")}</div>
        )}
        {filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            role="listitem"
            className="ph-item"
            onClick={() => onJump(p.id)}
            title={p.text}
          >
            <span className="ph-item-top">
              <span className="ph-item-num">#{p.n}</span>
              {formatTime(p.created) && <span className="ph-item-time">{formatTime(p.created)}</span>}
            </span>
            <span className="ph-item-preview">{previewOf(p.text)}</span>
          </button>
        ))}
      </div>
      {floating && <div className="ph-resizer" onPointerDown={startResize} aria-hidden="true" />}
      {!floating && <div className="ph-edge" onPointerDown={startEdgeResize} aria-hidden="true" />}
    </section>
  )
})
