import { memo, useState, useCallback, useRef, useEffect } from "react"
import { useT } from "../i18n-context"
import type { ShellLine, ShellType } from "../hooks/useShell"
import { CloseIcon, TrashIcon, TerminalIcon } from "../Icons"

type Props = {
  lines: ShellLine[]
  running: boolean
  sessionID: string
  directory: string
  shell?: ShellType
  onShellChange?: (shell: ShellType) => void
  onExecute: (command: string, sessionID: string, directory: string) => void
  onClear: () => void
  onClose: () => void
  history: string[]
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
  lines, running, sessionID, directory, shell = "pwsh", onShellChange,
  onExecute, onClear, onClose, history, isDocked = false, onToggleDock,
  height = 280, onResizeHeight
}: Props) {
  const t = useT()
  const [input, setInput] = useState("")
  const [histIdx, setHistIdx] = useState(-1)
  const [maximized, setMaximized] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [lines])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const cmd = input.trim()
      if (!cmd || running) return
      onExecute(cmd, sessionID, directory)
      setInput("")
      setHistIdx(-1)
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (history.length === 0) return
      const nextIdx = histIdx === -1 ? 0 : Math.min(histIdx + 1, history.length - 1)
      setHistIdx(nextIdx)
      setInput(history[nextIdx] || "")
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (histIdx <= 0) {
        setHistIdx(-1)
        setInput("")
        return
      }
      const nextIdx = histIdx - 1
      setHistIdx(nextIdx)
      setInput(history[nextIdx] || "")
      return
    }
    if (e.key === "c" && e.ctrlKey && !input) {
      // Ctrl+C clear input
      setInput("")
    }
  }, [input, running, history, histIdx, onExecute, sessionID, directory])

  // Drag resizer para el modo acoplado (docked)
  const startResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = height

    const onMove = (ev: PointerEvent) => {
      const nextH = Math.max(140, Math.min(650, startH - (ev.clientY - startY)))
      if (onResizeHeight) onResizeHeight(nextH)
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [height, onResizeHeight])

  const displayDir = directory ? (directory.split(/[/\\]/).pop() || directory) : "workspace"

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
          {running && (
            <span className="terminal-running-badge">
              <span className="terminal-running-dot" />
              <span>Ejecutando...</span>
            </span>
          )}
          <button
            type="button"
            className="btn-icon compact terminal-action-btn"
            onClick={onClear}
            title="Limpiar terminal (Ctrl+L / clear)"
            aria-label="Limpiar terminal"
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

      {/* Terminal Screen Body */}
      <div className="terminal-screen" onClick={() => inputRef.current?.focus()}>
        <div className="terminal-scroll-area">
          {lines.length === 0 && (
            <div className="terminal-banner">
              <span className="terminal-banner-title">
                OpenCode Terminal · {SHELL_OPTIONS.find((s) => s.id === shell)?.label ?? shell.toUpperCase()}
              </span>
              <span className="terminal-banner-cwd">📁 {directory || "Directorio raíz"}</span>
              <span className="terminal-banner-hint">
                Tip: Escribe comandos normalmente o usa <kbd>clear</kbd> para limpiar. Flechas <kbd>↑</kbd> <kbd>↓</kbd> para historial.
              </span>
            </div>
          )}

          {lines.map((line) => (
            <div key={line.id} className={`terminal-row type-${line.type}`}>
              {line.type === "input" && (
                <span className="terminal-row-prompt">
                  <span className="prompt-shell">{line.shell?.toUpperCase() || "PS"}</span>
                  <span className="prompt-path">{line.cwd ? (line.cwd.split(/[/\\]/).pop() || line.cwd) : ""}</span>
                  <span className="prompt-symbol">&gt;</span>
                </span>
              )}
              <span className="terminal-row-text">{line.text}</span>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input Prompt Row */}
        <div className="terminal-prompt-line">
          <span className="prompt-shell">{shell.toUpperCase()}</span>
          <span className="prompt-path" title={directory}>{displayDir}</span>
          <span className="prompt-symbol">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            className="terminal-cmd-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={running}
            placeholder={running ? "Ejecutando proceso..." : "Escribir comando..."}
            autoFocus
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>
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
