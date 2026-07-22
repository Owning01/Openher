import { memo, useEffect } from "react"
import { CloseIcon } from "../Icons"

type Props = {
  onClose: () => void
}

const SHORTCUTS = [
  { key: "Enter", desc: "Send message" },
  { key: "Shift + Enter", desc: "New line" },
  { key: "↑ / ↓", desc: "Prompt history" },
  { key: "/", desc: "Slash commands" },
  { key: "@", desc: "Mention agent/file/MCP" },
  { key: "!", desc: "Shell mode" },
  { key: "Escape", desc: "Close modal / Cancel" },
  { key: "Tab", desc: "Navigate focus" },
  { key: "?", desc: "Show this help" },
]

export const ShortcutsModal = memo(function ShortcutsModal({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content shortcuts-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Keyboard Shortcuts">
        <div className="modal-header">
          <h3>Keyboard Shortcuts</h3>
          <button className="btn-icon btn-secondary compact" onClick={onClose}><CloseIcon size={14} /></button>
        </div>
        <div className="modal-body">
          <table className="shortcuts-table">
            <tbody>
              {SHORTCUTS.map((s) => (
                <tr key={s.key}>
                  <td><kbd className="shortcut-key">{s.key}</kbd></td>
                  <td>{s.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
})
