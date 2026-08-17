import { memo, useState, useCallback, useRef } from "react"
import { useT } from "../i18n-context"
import type { ShellType } from "../hooks/useShell"
import { CloseIcon, TrashIcon, TerminalIcon, PlusIcon, SplitIcon, MoreHorizontalIcon, MaximizeIcon, MinimizeIcon, ChevronDownIcon } from "../Icons"
import { TerminalPanel } from "./shellPanels"

type Props = {
  lines?: any[]
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

const SHELL_OPTIONS: Array<{ id: ShellType; label: string }> = [
  { id: "pwsh", label: "pwsh" },
  { id: "powershell", label: "powershell" },
  { id: "cmd", label: "cmd" },
  { id: "bash", label: "bash" },
  { id: "wsl", label: "wsl" },
]

export const TerminalView = memo(function TerminalView({
  sessionID: _sessionID, directory, shell = "pwsh", onShellChange,
  onClear: _onClear, onClose, isDocked = false, onToggleDock,
  height = 280, onResizeHeight
}: Props) {
  const t = useT()
  const [activeTab, setActiveTab] = useState<"problems" | "output" | "debug" | "terminal" | "ports">("terminal")
  const [maximized, setMaximized] = useState(false)
  const [termKey, setTermKey] = useState(0)
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

  const handleRestart = () => {
    setTermKey((k) => k + 1)
  }

  const terminalContent = (
    <div className={`terminal-container${isDocked ? " is-docked" : " is-modal"}${maximized ? " is-maximized" : ""}`}
      style={isDocked && !maximized ? { height: `${height}px` } : undefined}
      ref={dockRef}>
      {isDocked && (
        <div className="terminal-resizer-top" onPointerDown={startResize} title="Redimensionar terminal" />
      )}

      {/* VS Code Style Header Bar */}
      <div className="terminal-header-bar"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", "kind:terminal")
          e.dataTransfer.effectAllowed = "move"
        }}
      >
        <div className="terminal-tabs-group">
          <div className={`terminal-tab${activeTab === "problems" ? " active" : ""}`} onClick={() => setActiveTab("problems")}>
            <span>PROBLEMS</span>
          </div>
          <div className={`terminal-tab${activeTab === "output" ? " active" : ""}`} onClick={() => setActiveTab("output")}>
            <span>OUTPUT</span>
          </div>
          <div className={`terminal-tab${activeTab === "debug" ? " active" : ""}`} onClick={() => setActiveTab("debug")}>
            <span>DEBUG CONSOLE</span>
          </div>
          <div className={`terminal-tab${activeTab === "terminal" ? " active" : ""}`} onClick={() => setActiveTab("terminal")}>
            <span className="terminal-status-dot" />
            <span>TERMINAL</span>
          </div>
          <div className={`terminal-tab${activeTab === "ports" ? " active" : ""}`} onClick={() => setActiveTab("ports")}>
            <span>PORTS</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="terminal-actions-group">
          {/* Selector de shell activo */}
          {onShellChange && (
            <div className="terminal-shell-picker">
              <span className="terminal-tab-icon" style={{ marginRight: 4 }}><TerminalIcon size={12} /></span>
              <select
                value={shell}
                onChange={(e) => onShellChange(e.target.value as ShellType)}
                className="terminal-shell-select"
                title="Seleccionar shell"
              >
                {SHELL_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="terminal-action-btn"
            onClick={handleRestart}
            title="Nueva terminal / Reiniciar"
            aria-label="Nueva terminal"
          >
            <PlusIcon size={13} />
            <span style={{ marginLeft: 1 }}><ChevronDownIcon size={10} /></span>
          </button>

          <button
            type="button"
            className="terminal-action-btn"
            onClick={onToggleDock}
            title="Dividir terminal"
            aria-label="Dividir terminal"
          >
            <SplitIcon size={13} />
          </button>

          <button
            type="button"
            className="terminal-action-btn"
            onClick={handleRestart}
            title="Eliminar terminal"
            aria-label="Eliminar terminal"
          >
            <TrashIcon size={13} />
          </button>

          <button
            type="button"
            className="terminal-action-btn"
            title="Más acciones..."
            aria-label="Más acciones"
          >
            <MoreHorizontalIcon size={13} />
          </button>

          <div className="terminal-separator" />

          {isDocked && (
            <button
              type="button"
              className="terminal-action-btn"
              onClick={() => setMaximized((v) => !v)}
              title={maximized ? "Restaurar panel" : "Maximizar panel"}
              aria-label="Maximizar panel"
            >
              {maximized ? <MinimizeIcon size={13} /> : <MaximizeIcon size={13} />}
            </button>
          )}

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

      {/* Terminal Screen Body (WebGL ConPTY con 0ms de lag) */}
      <div className="terminal-screen" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {activeTab === "terminal" ? (
          <TerminalPanel key={`${termKey}-${shell}-${directory}`} cwd={directory} shellName={shell} hideHeader />
        ) : (
          <div style={{ padding: "16px", color: "#8b949e", fontSize: "12px", fontFamily: "monospace" }}>
            No hay elementos en la vista {activeTab.toUpperCase()}.
          </div>
        )}
      </div>
    </div>
  )

  if (isDocked) {
    return terminalContent
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="terminal-floating-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t('session.terminal')}>
        {terminalContent}
      </div>
    </div>
  )
})

export default TerminalView
