// CustomizationsSection — parámetros de chat y snippets (F4-P4). Extraído de
// SettingsPanel.tsx sin cambios de conducta.
import { useT } from "../../../i18n-context"
import type { ChatSettings, PromptSnippet } from "../../../types"
import { ChatCustomizer } from "../../../components/ChatCustomizer"
import { SnippetManager } from "../../../components/SnippetManager"

type CustomizationsSectionProps = {
  chatSettings: ChatSettings
  onChatSettingChange: <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => void
  onResetChatSettings: () => void
  snippets: PromptSnippet[]
  onAddSnippet: (name: string, text: string) => void
  onRemoveSnippet: (id: string) => void
}

export function CustomizationsSection({
  chatSettings, onChatSettingChange, onResetChatSettings, snippets, onAddSnippet, onRemoveSnippet,
}: CustomizationsSectionProps) {
  const t = useT()
  return (
    <>
     <p className="settings-group-heading">{t('settings.chatCustomization')}</p>
     <div className="setting-item-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <ChatCustomizer
       settings={chatSettings}
       onSettingChange={onChatSettingChange}
       onReset={onResetChatSettings}
      />
     </div>

     <p className="settings-group-heading">{t('settings.snippets')}</p>
     <div className="setting-item-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <SnippetManager snippets={snippets} onAdd={onAddSnippet} onRemove={onRemoveSnippet} />
     </div>
    </>
  )
}
