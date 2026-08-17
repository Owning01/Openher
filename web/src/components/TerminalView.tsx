import { memo, useCallback, useRef, useState } from "react"
import { useT } from "../i18n-context"
import { TerminalPanel } from "./shellPanels"
import { CloseIcon, MaximizeIcon, MinimizeIcon, SplitIcon } from "../Icons"
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
        background: "#0d1117",
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
        <TerminalPanel cwd={directory} />

        {/* Botones de control de ventana (dock, maximize, close) */}
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 8,
            display: "flex",
            alignItems: "center",
            gap: 4,
            zIndex: 10,
          }}
        >
          {onToggleDock && (
            <button
              type="button"
              className="terminal-action-btn"
              onClick={onToggleDock}
              title={isDocked ? "Desacoplar terminal" : "Acoplar abajo"}
              aria-label={isDocked ? "Desacoplar terminal" : "Acoplar abajo"}
            >
              <SplitIcon size={12} />
            </button>
          )}

          <button
            type="button"
            className="terminal-action-btn"
            onClick={() => setMaximized((v) => !v)}
            title={maximized ? "Restaurar tamaño" : "Maximizar"}
            aria-label={maximized ? "Restaurar tamaño" : "Maximizar"}
          >
            {maximized ? <MinimizeIcon size={12} /> : <MaximizeIcon size={12} />}
          </button>

          <button
            type="button"
            className="terminal-action-btn"
            onClick={onClose}
            title="Cerrar panel"
            aria-label="Cerrar panel"
          >
            <CloseIcon size={13} />
          </button>
        </div>
      </div>
    </div>
  )

  if (isDocked) {
    return terminalContent
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="terminal-floating-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t("session.terminal")}
      >
        {terminalContent}
      </div>
    </div>
  )
})

export default TerminalView
