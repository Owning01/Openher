import { memo } from "react"
import { useT } from "../i18n-context"
import type { ChatSettings } from "../types"

type Props = {
  settings: ChatSettings
  onSettingChange: <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => void
  onReset: () => void
}

export const ChatCustomizer = memo(function ChatCustomizer({ settings, onSettingChange, onReset }: Props) {
  const t = useT()
  const SPACING_OPTIONS: Array<{ value: ChatSettings["messageSpacing"]; labelKey: string }> = [
    { value: "compact", labelKey: "settings.chatSpacingCompact" },
    { value: "normal", labelKey: "settings.chatSpacingNormal" },
    { value: "comfortable", labelKey: "settings.chatSpacingComfortable" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <label className="setting-row">
        <span>{t('settings.chatFontSize')}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <input type="range" min={10} max={24} value={settings.fontSize}
            onChange={(e) => onSettingChange("fontSize", Number(e.target.value))}
            style={{ flex: 1 }} />
          <span style={{ minWidth: "2em", textAlign: "center", fontSize: "0.85rem", fontFamily: "monospace" }}>
            {settings.fontSize}px
          </span>
        </div>
      </label>

      <label className="setting-row">
        <span>{t('settings.chatSpacing')}</span>
        <div className="toggle-row" style={{ gap: "var(--space-1)" }}>
          {SPACING_OPTIONS.map((opt) => (
            <button key={opt.value} type="button"
              className={`toggle-btn${settings.messageSpacing === opt.value ? " active" : ""}`}
              onClick={() => onSettingChange("messageSpacing", opt.value)}
              aria-pressed={settings.messageSpacing === opt.value}>
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </label>

      <div className="toggle-row" style={{ flexDirection: "column", gap: "var(--space-3)" }}>
        <label className="toggle-row" style={{ width: "100%" }}>
          <span>{t('settings.chatShowThinking')}</span>
          <button type="button" className={`toggle-btn${settings.showThinking ? " active" : ""}`}
            onClick={() => onSettingChange("showThinking", !settings.showThinking)}
            aria-pressed={settings.showThinking}>
            {settings.showThinking ? t('settings.enabled') : t('settings.disabled')}
          </button>
        </label>
        <label className="toggle-row" style={{ width: "100%" }}>
          <span>{t('settings.chatShowTools')}</span>
          <button type="button" className={`toggle-btn${settings.showToolCalls ? " active" : ""}`}
            onClick={() => onSettingChange("showToolCalls", !settings.showToolCalls)}
            aria-pressed={settings.showToolCalls}>
            {settings.showToolCalls ? t('settings.enabled') : t('settings.disabled')}
          </button>
        </label>
        <label className="toggle-row" style={{ width: "100%" }}>
          <span>{t('settings.chatShowTime')}</span>
          <button type="button" className={`toggle-btn${settings.showTimestamps ? " active" : ""}`}
            onClick={() => onSettingChange("showTimestamps", !settings.showTimestamps)}
            aria-pressed={settings.showTimestamps}>
            {settings.showTimestamps ? t('settings.enabled') : t('settings.disabled')}
          </button>
        </label>
        <label className="toggle-row" style={{ width: "100%" }}>
          <span>{t('settings.chatShowTodo')}</span>
          <button type="button" className={`toggle-btn${settings.showTodoButton ? " active" : ""}`}
            onClick={() => onSettingChange("showTodoButton", !settings.showTodoButton)}
            aria-pressed={settings.showTodoButton}>
            {settings.showTodoButton ? t('settings.enabled') : t('settings.disabled')}
          </button>
        </label>
      </div>

      <button type="button" className="btn-secondary compact" onClick={onReset}
        style={{ width: "100%", justifyContent: "center" }}>
        {t('settings.chatReset')}
      </button>
    </div>
  )
})
