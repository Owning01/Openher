import { memo, useState, useCallback, useRef } from "react"
import { useT } from "../i18n-context"
import type { ShellType } from "../hooks/useShell"
import { CloseIcon, TrashIcon, TerminalIcon } from "../Icons"
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

const SHELL_OPTIONS: Array<{ id: ShellType; label: string; icon: string }> = [
  { id: "pwsh", label: "PowerShell 7 (pwsh)", icon: "⚡" },
  { id: "powershell", label: "Windows PowerShell", icon: "PS" },
  { id: "cmd", label: "Command Prompt (cmd)", icon: "C:" },
  { id: "bash", label: "Git Bash (bash)", icon: "λ" },
  { id: "wsl", label: "WSL (Linux)", icon: "🐧" },
]

export const TerminalView = memo(function TerminalView({
  sessionID: _sessionID, directory, shell = "pwsh", onShellChange,
  onClear: _onClear, onClose, isDocked = false, onToggleDock,
  height = 280, onResizeHeight
}: Props) {
  const t = useT()
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

  const displayDir = directory ? (directory.split(/[/\\]/).pop() || directory) : "workspace"

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
      <div className="terminal-header-bar">
        <div className="terminal-tabs-group">
          <div className="terminal-tab active">
            <span className="terminal-tab-icon"><TerminalIcon size={13} /></span>
            <span className="terminal-tab-title">{shell.toUpperCase()}</span>
            <span className="terminal-tab-dir" title={directory || "Sin directorio"}>
              ({displayDir})
            </span>
          </div>

          {/* Selector de shell */}
          {onShellChange && (
            <div className="terminal-shell-picker">
              <select
                value={shell}
                onChange={(e) => onShellChange(e.target.value as ShellType)}
                className="terminal-shell-select"
                title="Seleccionar terminal predeterminada"
              >
                {SHELL_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="terminal-actions-group">
          <button
            type="button"
            className="btn-icon compact terminal-action-btn"
            onClick={handleRestart}
            title="Reiniciar sesión de terminal"
            aria-label="Reiniciar terminal"
          >
            <TrashIcon size={13} />
          </button>
          {onToggleDock && (
            <button
              type="button"
              className="btn-icon compact terminal-action-btn"
              onClick={onToggleDock}
              title={isDocked ? "Desacoplar (Ventana flotante)" : "Acoplar al panel inferior"}
              aria-label="Alternar acoplamiento"
            >
              {isDocked ? "⧉" : "⤓"}
            </button>
          )}
          {isDocked && (
            <button
              type="button"
              className="btn-icon compact terminal-action-btn"
              onClick={() => setMaximized((v) => !v)}
              title={maximized ? "Restaurar tamaño" : "Maximizar terminal"}
              aria-label="Maximizar"
            >
              {maximized ? "▼" : "▲"}
            </button>
          )}
          <button
            type="button"
            className="btn-icon compact terminal-action-btn"
            onClick={onClose}
            title="Cerrar terminal"
            aria-label="Cerrar terminal"
          >
            <CloseIcon size={13} />
          </button>
        </div>
      </div>

      {/* Terminal Screen Body (WebGL ConPTY con 0ms de lag) */}
      <div className="terminal-screen" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <TerminalPanel key={`${termKey}-${shell}-${directory}`} cwd={directory} shellName={shell} />
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
