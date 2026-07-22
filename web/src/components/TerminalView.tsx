import { memo, useState, useCallback, useRef, useEffect } from "react"
import { ModalHeader } from "./ModalHeader"
import type { ShellLine } from "../hooks/useShell"

type Props = {
  lines: ShellLine[]
  running: boolean
  sessionID: string
  directory: string
  onExecute: (command: string, sessionID: string, directory: string) => void
  onClear: () => void
  onClose: () => void
  history: string[]
}

export const TerminalView = memo(function TerminalView({
  lines, running, sessionID, directory, onExecute, onClear, onClose, history
}: Props) {
  const [input, setInput] = useState("")
  const [histIdx, setHistIdx] = useState(-1)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [lines])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
      const idx = histIdx === -1 ? 0 : Math.min(histIdx + 1, history.length - 1)
      setHistIdx(idx)
      setInput(history[idx])
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (histIdx <= 0) { setHistIdx(-1); setInput(""); return }
      const idx = histIdx - 1
      setHistIdx(idx)
      setInput(history[idx])
      return
    }
  }, [input, running, history, histIdx, onExecute, sessionID, directory])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content terminal-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Terminal">
        <ModalHeader title="Terminal" onClose={onClose}>
          <button className="btn-secondary compact" onClick={onClear}>Clear</button>
        </ModalHeader>
        <div className="terminal-body">
          <div className="terminal-output">
            {lines.length === 0 && <span className="terminal-welcome">Type a command to run in the project shell</span>}
            {lines.map((line, i) => (
              <div key={i} className={`terminal-line terminal-${line.type}`}>
                <pre>{line.text}</pre>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="terminal-input-row">
            <span className="terminal-prompt">$</span>
            <textarea
              ref={inputRef}
              className="terminal-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={running}
              placeholder={running ? "Running..." : "Enter shell command"}
              autoFocus
            />
          </div>
        </div>
      </div>
    </div>
  )
})
