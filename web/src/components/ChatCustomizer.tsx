import { memo } from "react"
import { useT } from "../i18n-context"
import type { ChatSettings } from "../types"
import { LedSwitch } from "./LedSwitch"

type Props = {
  settings: ChatSettings
  onSettingChange: <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => void
  onReset: () => void
}

type BoolKey = {
  [K in keyof ChatSettings]: ChatSettings[K] extends boolean ? K : never
}[keyof ChatSettings]

export const ChatCustomizer = memo(function ChatCustomizer({ settings, onSettingChange, onReset }: Props) {
  const t = useT()
  const SPACING_OPTIONS: Array<{ value: ChatSettings["messageSpacing"]; labelKey: string }> = [
    { value: "compact", labelKey: "settings.chatSpacingCompact" },
    { value: "normal", labelKey: "settings.chatSpacingNormal" },
    { value: "comfortable", labelKey: "settings.chatSpacingComfortable" },
  ]
  const FONT_OPTIONS: Array<{ value: ChatSettings["fontFamily"]; labelKey: string }> = [
    { value: "system", labelKey: "settings.chatFontSystem" },
    { value: "serif", labelKey: "settings.chatFontSerif" },
    { value: "mono", labelKey: "settings.chatFontMono" },
  ]
  const THINKING_DEFAULT_OPTIONS: Array<{ value: ChatSettings["thinkingDefault"]; labelKey: string }> = [
    { value: "auto", labelKey: "settings.chatThinkingAuto" },
    { value: "expanded", labelKey: "settings.chatThinkingExpanded" },
    { value: "collapsed", labelKey: "settings.chatThinkingCollapsed" },
  ]
  const CHECKBOXES: Array<{ key: BoolKey; labelKey: string }> = [
    { key: "showThinking", labelKey: "settings.chatShowThinking" },
    { key: "showToolCalls", labelKey: "settings.chatShowTools" },
    { key: "showTimestamps", labelKey: "settings.chatShowTime" },
    { key: "showTodoButton", labelKey: "settings.chatShowTodo" },
    { key: "showModelInfo", labelKey: "settings.chatShowModelInfo" },
    { key: "showDiffs", labelKey: "settings.chatShowDiffs" },
    { key: "showSubagentHint", labelKey: "settings.chatShowSubagents" },
    { key: "showCompactionCheckpoint", labelKey: "settings.chatShowCompaction" },
    { key: "showImages", labelKey: "settings.chatShowImages" },
    { key: "compactTools", labelKey: "settings.chatCompactTools" },
    { key: "minimalistMode", labelKey: "settings.chatMinimalistMode" },
    { key: "completionSound", labelKey: "settings.chatCompletionSound" },
    { key: "reduceMotion", labelKey: "settings.chatReduceMotion" },
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

      <div className="chat-preview" aria-hidden="true">
        <div className="chat-preview-user">
          <small>14:32</small>
          <p>{t('settings.chatPreviewUser')}</p>
        </div>
        <div className="chat-preview-assistant">
          <p>{t('settings.chatPreviewAssistant')}</p>
          <span className="chat-preview-footer">▣ build · model · 12s</span>
        </div>
      </div>

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

      <label className="setting-row">
        <span>{t('settings.chatBubbleRadius')}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <input type="range" min={4} max={24} value={settings.bubbleRadius}
            onChange={(e) => onSettingChange("bubbleRadius", Number(e.target.value))}
            style={{ flex: 1 }} />
          <span style={{ minWidth: "2em", textAlign: "center", fontSize: "0.85rem", fontFamily: "monospace" }}>
            {settings.bubbleRadius}px
          </span>
        </div>
      </label>

      {/* Ancho del texto: 0 = el mensaje ocupa todo el ancho del chat; el
          valor suma margen a CADA lado del texto (calc(100% - 2*Npx)). */}
      <label className="setting-row">
        <span>{t('settings.chatTextWidth')}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <input type="range" min={0} max={120} step={1} value={settings.desktopGutter}
            onChange={(e) => onSettingChange("desktopGutter", Number(e.target.value))}
            style={{ flex: 1 }} />
          <span style={{ minWidth: "2.4em", textAlign: "center", fontSize: "0.85rem", fontFamily: "monospace" }}>
            {settings.desktopGutter === 0 ? "full" : `${settings.desktopGutter}px`}
          </span>
        </div>
      </label>

      <label className="setting-row">
        <span>{t('settings.chatFontFamily')}</span>
        <div className="toggle-row" style={{ gap: "var(--space-1)" }}>
          {FONT_OPTIONS.map((opt) => (
            <button key={opt.value} type="button"
              className={`toggle-btn${settings.fontFamily === opt.value ? " active" : ""}`}
              onClick={() => onSettingChange("fontFamily", opt.value)}
              aria-pressed={settings.fontFamily === opt.value}>
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </label>

      <label className="setting-row">
        <span>{t('settings.chatCharLimit')}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <input type="range" min={0} max={4000} step={100} value={settings.composerCharLimit}
            onChange={(e) => onSettingChange("composerCharLimit", Number(e.target.value))}
            style={{ flex: 1 }} />
          <span style={{ minWidth: "3em", textAlign: "center", fontSize: "0.85rem", fontFamily: "monospace" }}>
            {settings.composerCharLimit === 0 ? t('settings.chatCharLimitOff') : settings.composerCharLimit}
          </span>
        </div>
      </label>

      <div className="switch-list" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {CHECKBOXES.map(({ key, labelKey }) => (
          <label key={key} className="switch-row">
            <span className="switch-label">
              <strong>{t(labelKey)}</strong>
            </span>
            <LedSwitch
              label={t(labelKey)}
              checked={settings[key]}
              onChange={(next) => onSettingChange(key, next)}
            />
          </label>
        ))}
      </div>

      <label className="setting-row">
        <span>{t('settings.chatThinkingDefault')}</span>
        <div className="toggle-row" style={{ gap: "var(--space-1)" }}>
          {THINKING_DEFAULT_OPTIONS.map((opt) => (
            <button key={opt.value} type="button"
              className={`toggle-btn${settings.thinkingDefault === opt.value ? " active" : ""}`}
              onClick={() => onSettingChange("thinkingDefault", opt.value)}
              aria-pressed={settings.thinkingDefault === opt.value}>
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </label>

      <button type="button" className="btn-secondary compact" onClick={onReset}
        style={{ width: "100%", justifyContent: "center" }}>
        {t('settings.chatReset')}
      </button>
    </div>
  )
})
