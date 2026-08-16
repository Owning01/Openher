import { memo } from "react"
import { createPortal } from "react-dom"
import { ModalHeader } from "./ModalHeader"
import { ChatCustomizer } from "./ChatCustomizer"
import { useT } from "../i18n-context"
import type { ChatSettings } from "../types"

type Props = {
  settings: ChatSettings
  onSettingChange: <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => void
  onReset: () => void
  onClose: () => void
}

// Personalización del chat accesible desde el propio chat (header del panel):
// Settings → Personalización del chat queda disponible en cualquier pantalla.
export const ChatCustomizerModal = memo(function ChatCustomizerModal({ settings, onSettingChange, onReset, onClose }: Props) {
  const t = useT()
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content chat-customizer-modal" onClick={(e) => e.stopPropagation()}>
        <ModalHeader title={t('detail.customizeChat')} onClose={onClose} />
        <div className="chat-customizer-scroll">
          <ChatCustomizer settings={settings} onSettingChange={onSettingChange} onReset={onReset} />
        </div>
      </div>
    </div>,
    document.body
  )
})
