import { memo } from "react"
import { ModalHeader } from "./ModalHeader"
import { useT } from "../i18n-context"

type Props = {
  onClose: () => void
  desktop?: boolean
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

export const ShortcutsModal = memo(function ShortcutsModal({ onClose, desktop }: Props) {
  const t = useT()
  const desktopShortcuts = [
    { key: "Ctrl + 1…9", desc: t('shortcuts.panelFocus') },
    { key: "Ctrl + W", desc: t('shortcuts.closeSplit') },
    { key: "Ctrl + Shift + S", desc: t('shortcuts.splitRight') },
    { key: "Ctrl + Shift + V", desc: t('shortcuts.splitBottom') },
    { key: "Ctrl + M", desc: t('shortcuts.maximize') },
    { key: "Ctrl + B", desc: t('shortcuts.toggleSidebar') },
    { key: "Ctrl + N", desc: t('shortcuts.newSession') },
  ]
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content shortcuts-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t('shortcuts.title')}>
        <ModalHeader title={t('shortcuts.title')} onClose={onClose} />
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
          {desktop && (
            <>
              <h4 className="shortcuts-section-title">{t('shortcuts.desktop')}</h4>
              <table className="shortcuts-table">
                <tbody>
                  {desktopShortcuts.map((s) => (
                    <tr key={s.key}>
                      <td><kbd className="shortcut-key">{s.key}</kbd></td>
                      <td>{s.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  )
})
