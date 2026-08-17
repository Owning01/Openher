import { memo, useState, useCallback, useRef, useEffect } from "react"
import { useT } from "../i18n-context"
import type { ShellType, ShellLine } from "../hooks/useShell"
import { CloseIcon, TrashIcon, TerminalIcon, PlusIcon, SplitIcon, MoreHorizontalIcon, MaximizeIcon, MinimizeIcon, ChevronDownIcon } from "../Icons"

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

const SHELL_OPTIONS: Array<{ id: ShellType; label: string }> = [
  { id: "pwsh", label: "pwsh" },
  { id: "powershell", label: "powershell" },
  { id: "cmd", label: "cmd" },
  { id: "bash", label: "bash" },
  { id: "wsl", label: "wsl" },
]

type TabData = {
  id: string
  title: string
  shell: ShellType
  lines: ShellLine[]
  input: string
  historyIndex: number
}

export const TerminalView = memo(function TerminalView({
  sessionID, directory, shell = "pwsh", onShellChange,
  lines: initialLines = [], running = false, onExecute, onClear, onClose,
  history: sharedHistory = [], isDocked = false, onToggleDock,
  height = 280, onResizeHeight
}: Props) {
  const t = useT()
  const [activeTab, setActiveTab] = useState<"problems" | "output" | "debug" | "terminal" | "ports">("terminal")
  const [maximized, setMaximized] = useState(false)
  const [termTabs, setTermTabs] = useState<TabData[]>([
    {
      id: "term-1",
      title: `${shell} 1`,
      shell,
      lines: initialLines,
      input: "",
      historyIndex: -1,
    },
  ])
  const [activeTabId, setActiveTabId] = useState<string>("term-1")
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dockRef = useRef<HTMLDivElement>(null)

  // Sincronizar initialLines con la pestaña activa
  useEffect(() => {
    if (initialLines.length > 0) {
      setTermTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, lines: initialLines } : t))
      )
    }
  }, [initialLines, activeTabId])

  // Scroll automático al fondo al agregar líneas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [termTabs, activeTabId])

  const activeTabData = termTabs.find((t) => t.id === activeTabId) || termTabs[0]

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

  const handleAddTab = () => {
    setActiveTab("terminal")
    const nextNum = termTabs.length + 1
    const newId = `term-${Date.now()}`
    const newTab: TabData = {
      id: newId,
      title: `${shell} ${nextNum}`,
      shell,
      lines: [],
      input: "",
      historyIndex: -1,
    }
    setTermTabs((prev) => [...prev, newTab])
    setActiveTabId(newId)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleCloseTab = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (termTabs.length <= 1) {
      handleClearActive()
      return
    }
    const nextTabs = termTabs.filter((t) => t.id !== id)
    setTermTabs(nextTabs)
    if (activeTabId === id) {
      setActiveTabId(nextTabs[nextTabs.length - 1].id)
    }
  }

  const handleClearActive = () => {
    if (onClear) onClear()
    setTermTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, lines: [] } : t))
    )
  }

  const handleRestart = () => {
    handleClearActive()
    setTermTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              lines: [
                {
                  id: `sys-${Date.now()}`,
                  text: `[Terminal] Sesión reiniciada (${t.shell.toUpperCase()})`,
                  type: "system",
                  timestamp: Date.now(),
                },
              ],
            }
          : t
      )
    )
  }

  const handleInputChange = (val: string) => {
    setTermTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, input: val } : t))
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const cmd = activeTabData.input.trim()
      if (!cmd) return

      if (cmd.toLowerCase() === "clear" || cmd.toLowerCase() === "cls") {
        handleClearActive()
        handleInputChange("")
        return
      }

      if (onExecute) {
        onExecute(cmd, sessionID, directory)
      } else {
        const inputLine: ShellLine = {
          id: `in-${Date.now()}`,
          text: cmd,
          type: "input",
          cwd: directory,
          shell: activeTabData.shell,
          timestamp: Date.now(),
        }
        setTermTabs((prev) =>
          prev.map((t) =>
            t.id === activeTabId
              ? {
                  ...t,
                  lines: [...t.lines, inputLine],
                  input: "",
                  historyIndex: -1,
                }
              : t
          )
        )
      }

      handleInputChange("")
      setTermTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, historyIndex: -1 } : t))
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (sharedHistory.length === 0) return
      const nextIdx = Math.min(sharedHistory.length - 1, activeTabData.historyIndex + 1)
      setTermTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, historyIndex: nextIdx, input: sharedHistory[nextIdx] ?? t.input }
            : t
        )
      )
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      const nextIdx = activeTabData.historyIndex - 1
      if (nextIdx < 0) {
        setTermTabs((prev) =>
          prev.map((t) =>
            t.id === activeTabId ? { ...t, historyIndex: -1, input: "" } : t
          )
        )
      } else {
        setTermTabs((prev) =>
          prev.map((t) =>
            t.id === activeTabId
              ? { ...t, historyIndex: nextIdx, input: sharedHistory[nextIdx] ?? "" }
              : t
          )
        )
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
      e.preventDefault()
      handleClearActive()
    }
  }

  const displayDir = directory ? directory.split(/[/\\]/).pop() || directory : "raíz"

  const terminalContent = (
    <div
      className={`terminal-container${isDocked ? " is-docked" : " is-modal"}${maximized ? " is-maximized" : ""}`}
      style={isDocked && !maximized ? { height: `${height}px` } : undefined}
      ref={dockRef}
    >
      {isDocked && (
        <div className="terminal-resizer-top" onPointerDown={startResize} title="Redimensionar terminal" />
      )}

      {/* VS Code Style Header Bar */}
      <div
        className="terminal-header-bar"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", "kind:terminal")
          e.dataTransfer.effectAllowed = "move"
        }}
      >
        <div className="terminal-tabs-group">
          <div
            className={`terminal-tab${activeTab === "problems" ? " active" : ""}`}
            onClick={() => setActiveTab("problems")}
          >
            <span>PROBLEMS</span>
          </div>
          <div
            className={`terminal-tab${activeTab === "output" ? " active" : ""}`}
            onClick={() => setActiveTab("output")}
          >
            <span>OUTPUT</span>
          </div>
          <div
            className={`terminal-tab${activeTab === "debug" ? " active" : ""}`}
            onClick={() => setActiveTab("debug")}
          >
            <span>DEBUG CONSOLE</span>
          </div>
          <div
            className={`terminal-tab${activeTab === "terminal" ? " active" : ""}`}
            onClick={() => setActiveTab("terminal")}
          >
            <span className="terminal-status-dot" />
            <span>TERMINAL</span>
          </div>
          <div
            className={`terminal-tab${activeTab === "ports" ? " active" : ""}`}
            onClick={() => setActiveTab("ports")}
          >
            <span>PORTS</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="terminal-actions-group">
          {/* Selector de shell activo */}
          {onShellChange && (
            <div className="terminal-shell-picker">
              <span className="terminal-tab-icon" style={{ marginRight: 4 }}>
                <TerminalIcon size={12} />
              </span>
              <select
                value={activeTabData.shell}
                onChange={(e) => {
                  const newShell = e.target.value as ShellType
                  onShellChange(newShell)
                  setTermTabs((prev) =>
                    prev.map((t) =>
                      t.id === activeTabId
                        ? {
                            ...t,
                            shell: newShell,
                            title: `${newShell} ${t.title.split(" ")[1] || "1"}`,
                          }
                        : t
                    )
                  )
                }}
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
            onClick={handleAddTab}
            title="Nueva terminal (+)"
            aria-label="Nueva terminal"
          >
            <PlusIcon size={13} />
            <span style={{ marginLeft: 1 }}>
              <ChevronDownIcon size={10} />
            </span>
          </button>

          <button
            type="button"
            className="terminal-action-btn"
            onClick={onToggleDock || handleAddTab}
            title={onToggleDock ? "Acoplar / Desacoplar terminal" : "Dividir terminal"}
            aria-label="Dividir terminal"
          >
            <SplitIcon size={13} />
          </button>

          <button
            type="button"
            className="terminal-action-btn"
            onClick={handleClearActive}
            title="Limpiar terminal"
            aria-label="Limpiar terminal"
          >
            <TrashIcon size={13} />
          </button>

          <button
            type="button"
            className="terminal-action-btn"
            onClick={handleRestart}
            title="Reiniciar terminal"
            aria-label="Reiniciar terminal"
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

      {/* Sub-tabs toolbar si hay más de 1 pestaña o cuando está activa la terminal */}
      {activeTab === "terminal" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "#161b22",
            padding: "4px 8px",
            borderBottom: "1px solid #30363d",
            overflowX: "auto",
            flexShrink: 0,
          }}
        >
          {termTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => {
                setActiveTabId(tab.id)
                setTimeout(() => inputRef.current?.focus(), 50)
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 8px",
                borderRadius: 4,
                fontSize: 11,
                cursor: "pointer",
                background: activeTabId === tab.id ? "#21262d" : "transparent",
                color: activeTabId === tab.id ? "#58a6ff" : "#8b949e",
                border: activeTabId === tab.id ? "1px solid #30363d" : "1px solid transparent",
              }}
            >
              <TerminalIcon size={11} />
              <span>{tab.title}</span>
              {termTabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    padding: 0,
                    marginLeft: 2,
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Cerrar terminal"
                >
                  <CloseIcon size={10} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddTab}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: "#8b949e",
              cursor: "pointer",
              padding: "2px 4px",
              borderRadius: 3,
            }}
            title="Nueva terminal"
          >
            <PlusIcon size={12} />
          </button>
        </div>
      )}

      {/* Terminal Screen Body */}
      <div
        className="terminal-screen"
        onClick={() => inputRef.current?.focus()}
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          background: "#0d1117",
          fontFamily: "Consolas, 'Cascadia Mono', monospace",
        }}
      >
        {activeTab === "terminal" ? (
          <>
            <div
              className="terminal-scroll-area"
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {activeTabData.lines.length === 0 && (
                <div className="terminal-banner">
                  <span className="terminal-banner-title">
                    OpenCode Terminal · {SHELL_OPTIONS.find((s) => s.id === activeTabData.shell)?.label ?? activeTabData.shell.toUpperCase()}
                  </span>
                  <span className="terminal-banner-cwd">📁 {directory || "Directorio raíz"}</span>
                  <span className="terminal-banner-hint">
                    Escribe comandos normalmente o usa <kbd>clear</kbd> para limpiar. Historial con <kbd>↑</kbd> <kbd>↓</kbd>.
                  </span>
                </div>
              )}

              {activeTabData.lines.map((line) => (
                <div key={line.id} className={`terminal-row type-${line.type}`}>
                  {line.type === "input" && (
                    <span className="terminal-row-prompt">
                      <span className="prompt-shell">{(line.shell || activeTabData.shell).toUpperCase()}</span>
                      <span className="prompt-path">
                        {line.cwd ? line.cwd.split(/[/\\]/).pop() || line.cwd : displayDir}
                      </span>
                      <span className="prompt-symbol">&gt;</span>
                    </span>
                  )}
                  <span className="terminal-row-text">{line.text}</span>
                </div>
              ))}
            </div>

            {/* Input Prompt Row */}
            <div className="terminal-prompt-line">
              <span className="prompt-shell">{activeTabData.shell.toUpperCase()}</span>
              <span className="prompt-path" title={directory}>
                {displayDir}
              </span>
              <span className="prompt-symbol">&gt;</span>
              <input
                ref={inputRef}
                type="text"
                className="terminal-cmd-input"
                value={activeTabData.input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={running}
                placeholder={running ? "Ejecutando proceso..." : "Escribir comando..."}
                autoFocus
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
            </div>
          </>
        ) : (
          <div
            style={{
              padding: "16px",
              color: "#8b949e",
              fontSize: "12px",
              fontFamily: "monospace",
            }}
          >
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
