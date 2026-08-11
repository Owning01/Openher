import { memo, useCallback } from "react"
import { CloseIcon } from "../Icons"
import { useT } from "../i18n-context"
import { PROMPT_PRESETS } from "../promptPresets"

type Props = {
  onInsert: (text: string) => void
  onSend: (text: string) => void
  onClose: () => void
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement("textarea")
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand("copy")
    document.body.removeChild(ta)
  }
}

export const PromptPresetSheet = memo(function PromptPresetSheet({ onInsert, onSend, onClose }: Props) {
  const t = useT()

  const handleCopy = useCallback((text: string) => {
    copyText(text)
  }, [])

  return (
    <div className="prompt-sheet-backdrop" onClick={onClose}>
      <div className="prompt-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-sheet-header">
          <strong>{t('chat.prompts')}</strong>
          <button type="button" className="btn-icon btn-ghost compact" onClick={onClose}
            aria-label={t('image.close')} title={t('image.close')}>
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="prompt-sheet-list">
          {PROMPT_PRESETS.map((preset) => (
            <div key={preset.id} className="prompt-preset-row">
              <div className="prompt-preset-info">
                <strong>{t(preset.nameKey)}</strong>
                <small>{t(preset.textKey)}</small>
              </div>
              <div className="prompt-preset-actions">
                <button type="button" className="btn-secondary compact"
                  onClick={() => handleCopy(t(preset.textKey))}
                  title={t('chat.copyText')} aria-label={t('chat.copyText')}>📋</button>
                <button type="button" className="btn-secondary compact"
                  onClick={() => { onInsert(t(preset.textKey)) }}
                  title={t('chat.insertPrompt')} aria-label={t('chat.insertPrompt')}>↩</button>
                <button type="button" className="btn-primary compact"
                  onClick={() => { onSend(t(preset.textKey)) }}
                  title={t('chat.sendPrompt')} aria-label={t('chat.sendPrompt')}>→</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
