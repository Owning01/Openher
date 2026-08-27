import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useT } from "../i18n-context"
import { TerminalPanel } from "./shellPanels"
import type { ShellType, ShellLine } from "../hooks/useShell"

type Props = {
  lines?: ShellLine[]
  running?: boolean
  sessionID: string
  directory: string
  shell?: ShellType
  onShellChange?: (shell: ShellType) => void
  onExecute?: (command: string, sessionID: string, directory: string) => void
  onClear?: () => void
  onClose: () => void
  history?: string[]
  isDocked?: boolean
  onToggleDock?: () => void
  height?: number
  onResizeHeight?: (height: number) => void
}

// Posición persistida de la ventana flotante (menú contextual > arrastrar header)
const FLOAT_POS_KEY = "opencode.terminal.floatPos"
type FloatPos = { x: number; y: number }

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

export const TerminalView = memo(function TerminalView({
  directory,
  onClose,
  isDocked = false,
  onToggleDock,
  height = 280,
  onResizeHeight,
}: Props) {
  const t = useT()
  const [maximized, setMaximized] = useState(false)
  const dockRef = useRef<HTMLDivElement>(null)
  // Ventana flotante: posición persistida + drag libre del header
  const [floatPos, setFloatPos] = useState<FloatPos | null>(() => (isDocked ? null : readFloatPos()))
  const floatPosRef = useRef(floatPos)
  floatPosRef.current = floatPos
  const floatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isDocked) return
    // Menú contextual > "Centrar ventana": vuelve al centrado por CSS
    const center = (): void => {
      try { localStorage.removeItem(FLOAT_POS_KEY) } catch {}
      setFloatPos(null)
    }
    window.addEventListener("terminal:float-center", center)
    return () => window.removeEventListener("terminal:float-center", center)
  }, [isDocked])

  useEffect(() => {
    if (isDocked || maximized) return
    const modal = floatRef.current
    if (!modal) return
    const bar = modal.querySelector<HTMLElement>(".terminal-header-bar")
    if (!bar) return
    const onMouseDown = (e: MouseEvent): void => {
      if (e.button !== 0) return
      const target = e.target as HTMLElement
      if (target.closest("button, select, input, .terminal-shell-picker, .terminal-zoom-group")) return
      // preventDefault bloquea el dragstart nativo del header (payload de grid)
      e.preventDefault()
      let pos = floatPosRef.current ?? (() => {
        const r = modal.getBoundingClientRect()
        return { x: r.left, y: r.top }
      })()
      const offX = e.clientX - pos.x
      const offY = e.clientY - pos.y
      document.body.style.userSelect = "none"
      document.body.style.cursor = "grabbing"
      modal.style.transition = "none"
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
        try { localStorage.setItem(FLOAT_POS_KEY, JSON.stringify(pos)) } catch {}
        setFloatPos(pos)
      }
      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
    }
    bar.addEventListener("mousedown", onMouseDown)
    return () => bar.removeEventListener("mousedown", onMouseDown)
  }, [isDocked, maximized])

  // Drag resizer para el modo acoplado (DOM directo a 60fps)
  const startResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = height
    let lastH = height
    document.body.style.userSelect = "none"
    document.body.style.cursor = "row-resize"

    const onMove = (ev: PointerEvent) => {
      lastH = Math.max(140, Math.min(650, startH - (ev.clientY - startY)))
      if (dockRef.current) {
        dockRef.current.style.height = `${lastH}px`
      }
    }
    const onUp = () => {
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      if (onResizeHeight) onResizeHeight(lastH)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [height, onResizeHeight])

  const terminalContent = (
    <div
      ref={dockRef}
      className={`terminal-view-container${isDocked ? " docked" : " floating"}${maximized ? " maximized" : ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        height: isDocked ? (maximized ? "calc(100vh - 48px)" : `${height}px`) : "100%",
        width: "100%",
        background: "var(--surface)",
        position: isDocked && maximized ? "fixed" : "relative",
        top: isDocked && maximized ? 48 : undefined,
        left: isDocked && maximized ? 0 : undefined,
        right: isDocked && maximized ? 0 : undefined,
        bottom: isDocked && maximized ? 0 : undefined,
        zIndex: isDocked && maximized ? 9999 : undefined,
      }}
    >
      {/* Resizer Handle solo en modo acoplado */}
      {isDocked && !maximized && (
        <div
          className="terminal-dock-resizer"
          onPointerDown={startResize}
          title="Arrastra para cambiar el alto del panel"
        />
      )}

      {/* Terminal Real con xterm.js y ConPTY */}
      <div style={{ flex: 1, minHeight: 0, position: "relative", width: "100%", height: "100%" }}>
        <TerminalPanel
          cwd={directory}
          panelId="bottom-terminal"
          onToggleDock={onToggleDock}
          isDocked={isDocked}
          isFloating={!isDocked}
          onMaximize={() => setMaximized((v) => !v)}
          maximized={maximized}
          onClose={onClose}
        />
      </div>
    </div>
  )

  if (isDocked) {
    return terminalContent
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={floatRef}
        className="terminal-floating-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t("session.terminal")}
        style={floatPos
          ? (() => {
              const p = clampPos(floatPos, 400)
              return { position: "fixed" as const, margin: 0, left: p.x, top: p.y }
            })()
          : undefined}
      >
        {terminalContent}
      </div>
    </div>
  )
})

export default TerminalView
