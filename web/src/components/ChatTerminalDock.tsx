// ChatTerminalDock — terminal plegable al pie del chat.
// Reutiliza SingleTerminal (el PTY vive en terminalPtyStore keyed por tabId:
// ocultar desmonta sin matar el proceso y la X lo elimina vía killTerminalPty;
// xterm se descarga diferido (lazy) solo al abrirlo) y el patrón de
// TerminalView: resize por arrastre del borde superior (alto persistido) y
// modo flotante arrastrable desde el header (posición persistida).
import { memo, Suspense, lazy, useCallback, useEffect, useRef, useState } from "react"
import { CloseIcon, ChevronDownIcon, TerminalIcon, MaximizeIcon, MinimizeIcon } from "../Icons"
import { useT } from "../i18n-context"

const SingleTerminal = lazy(() => import("./shellPanels").then((m) => ({ default: m.SingleTerminal })))

type Props = {
  tabId: string
  cwd: string
  onHide: () => void
  onKill: () => void
}

const HEIGHT_KEY = "opencode.chat.term.height"
const FLOAT_POS_KEY = "opencode.chat.term.floatPos"
const MIN_H = 140
const MAX_H = 650
const DEFAULT_H = 240

type FloatPos = { x: number; y: number }

function readHeight(): number {
  try {
    const v = Number(localStorage.getItem(HEIGHT_KEY))
    if (Number.isFinite(v)) return Math.max(MIN_H, Math.min(MAX_H, v))
  } catch {}
  return DEFAULT_H
}

function readFloatPos(): FloatPos | null {
  try {
    const raw = localStorage.getItem(FLOAT_POS_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Partial<FloatPos>
    if (typeof p.x === "number" && typeof p.y === "number") return { x: p.x, y: p.y }
  } catch {}
  return null
}

/** Clamp para restaurar la ventana dentro del viewport aunque cambie la resolución. */
function clampPos(p: FloatPos, w: number): FloatPos {
  return {
    x: Math.max(-w + 80, Math.min(window.innerWidth - 80, p.x)),
    y: Math.max(0, Math.min(window.innerHeight - 40, p.y)),
  }
}

export const ChatTerminalDock = memo(function ChatTerminalDock({ tabId, cwd, onHide, onKill }: Props) {
  const t = useT()
  const [height, setHeight] = useState(readHeight)
  const [floating, setFloating] = useState(false)
  const [floatPos, setFloatPos] = useState<FloatPos | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const floatRef = useRef<HTMLDivElement>(null)
  const floatPosRef = useRef(floatPos)
  floatPosRef.current = floatPos

  const persistHeight = useCallback((h: number) => {
    setHeight(h)
    try {
      localStorage.setItem(HEIGHT_KEY, String(h))
    } catch {}
  }, [])

  // Resize por arrastre del borde superior (DOM directo a 60fps; el
  // ResizeObserver de SingleTerminal re-ajusta xterm solo).
  const startResize = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      const startY = e.clientY
      const target = (floating ? floatRef : boxRef).current
      const startH = target?.offsetHeight ?? height
      let lastH = startH
      document.body.style.userSelect = "none"
      document.body.style.cursor = "row-resize"
      const onMove = (ev: PointerEvent) => {
        lastH = Math.max(MIN_H, Math.min(MAX_H, startH - (ev.clientY - startY)))
        const el = (floating ? floatRef : boxRef).current
        if (el) el.style.height = `${lastH}px`
      }
      const onUp = () => {
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        persistHeight(lastH)
      }
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [floating, height, persistHeight]
  )

  // Ventana flotante: drag libre del header (igual que TerminalView).
  useEffect(() => {
    if (!floating) return
    const modal = floatRef.current
    if (!modal) return
    const bar = modal.querySelector<HTMLElement>(".chat-terminal-dock-head")
    if (!bar) return
    const onMouseDown = (e: MouseEvent): void => {
      if (e.button !== 0) return
      const target = e.target as HTMLElement
      if (target.closest("button")) return
      e.preventDefault()
      let pos =
        floatPosRef.current ??
        (() => {
          const r = modal.getBoundingClientRect()
          return { x: r.left, y: r.top }
        })()
      const offX = e.clientX - pos.x
      const offY = e.clientY - pos.y
      document.body.style.userSelect = "none"
      document.body.style.cursor = "grabbing"
      const onMove = (ev: MouseEvent): void => {
        pos = clampPos({ x: ev.clientX - offX, y: ev.clientY - offY }, modal.offsetWidth)
        modal.style.position = "fixed"
        modal.style.margin = "0"
        modal.style.left = `${pos.x}px`
        modal.style.top = `${pos.y}px`
      }
      const onUp = (): void => {
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
        try {
          localStorage.setItem(FLOAT_POS_KEY, JSON.stringify(pos))
        } catch {}
        setFloatPos(pos)
      }
      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
    }
    bar.addEventListener("mousedown", onMouseDown)
    return () => bar.removeEventListener("mousedown", onMouseDown)
  }, [floating])

  const toggleFloat = useCallback(() => {
    if (!floating) setFloatPos(readFloatPos())
    setFloating((v) => !v)
  }, [floating])

  const dock = (
    <div
      ref={floating ? floatRef : boxRef}
      className={`chat-terminal-dock${floating ? " floating" : ""}`}
      role="region"
      aria-label={t("session.terminal")}
      style={
        floating
          ? {
              height: `${height}px`,
              ...(floatPos
                ? (() => {
                    const p = clampPos(floatPos, 400)
                    return { position: "fixed" as const, margin: 0, left: p.x, top: p.y }
                  })()
                : undefined),
            }
          : { height: `${height}px` }
      }
      onClick={floating ? (e) => e.stopPropagation() : undefined}
    >
      <div className="terminal-dock-resizer" onPointerDown={startResize} title={t("desktop.resizeSidebar")} />
      <div className="chat-terminal-dock-head">
        <span className="chat-terminal-dock-title">
          <TerminalIcon size={13} /> {t("session.terminal")}
        </span>
        <span className="chat-terminal-dock-actions">
          <button
            type="button"
            className="btn-icon compact"
            onClick={toggleFloat}
            title={floating ? t("panel.restore") : t("panel.maximize")}
            aria-label={floating ? t("panel.restore") : t("panel.maximize")}
          >
            {floating ? <MinimizeIcon size={12} /> : <MaximizeIcon size={12} />}
          </button>
          <button
            type="button"
            className="btn-icon compact"
            onClick={onHide}
            title={t("desktop.collapseSidebar")}
            aria-label={t("desktop.collapseSidebar")}
          >
            <ChevronDownIcon size={12} />
          </button>
          <button
            type="button"
            className="btn-icon compact"
            onClick={onKill}
            title={t("panel.close")}
            aria-label={t("panel.close")}
          >
            <CloseIcon size={12} />
          </button>
        </span>
      </div>
      <div className="chat-terminal-dock-body">
        <Suspense fallback={<div className="chat-terminal-dock-loading">…</div>}>
          <SingleTerminal cwd={cwd} tabId={tabId} />
        </Suspense>
      </div>
    </div>
  )

  if (!floating) return dock
  // Flotante: clic fuera vuelve a acoplar (no oculta: la terminal sigue viva).
  return (
    <div className="modal-overlay" onClick={toggleFloat}>
      {dock}
    </div>
  )
})
