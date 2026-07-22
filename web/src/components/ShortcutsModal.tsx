import { memo } from "react"
import { ModalHeader } from "./ModalHeader"

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
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content shortcuts-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Keyboard Shortcuts">
        <ModalHeader title="Keyboard Shortcuts" onClose={onClose} />
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
