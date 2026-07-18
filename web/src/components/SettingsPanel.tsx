import { memo } from "react"
import { SaveIcon, TestIcon, HelpIcon, LoadingIcon, StatsIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { ServerConfig, ModelOption, NoticeType, DataMode, ViewType } from "../types"
import type { LanguageCode } from "../i18n"

type UsageStats = {
  promptsSent: number
  sessionsCreated: number
  totalTokens: number
  firstUsed: number
}

type SettingsPanelProps = {
  draftConfig: ServerConfig
  onChange: (config: ServerConfig) => void
  onSave: () => void
  onTest: () => void
  testingConnection: boolean
  hasDraftChanges: boolean
  canTestDraft: boolean
  testAlreadyPassedForDraft: boolean
  connectedVersion: string
  settingsNotice: { type: NoticeType; text: string } | null
  language: LanguageCode
  onLanguageChange: (lang: LanguageCode) => void
  theme: string
  onThemeChange: (theme: "system" | "light" | "dark" | "scheduled") => void
  languageOptions: Array<{ code: LanguageCode; label: string }>
  dataMode: DataMode
  onDataModeChange: (mode: DataMode) => void
  onNavigate: (view: ViewType) => void
  modelOptions: ModelOption[]
  selectedModelKey: string | null
  onChangeModel: (key: string) => void
  modelKey: (model: { providerID: string; modelID: string; variant?: string }) => string
  stats: UsageStats
  onResetStats: () => void
  navBarMode: "header" | "bottom"
  onNavBarModeChange: (mode: "header" | "bottom") => void
}

export const SettingsPanel = memo(function SettingsPanel({
  draftConfig, onChange, onSave, onTest,
  testingConnection, hasDraftChanges, canTestDraft, testAlreadyPassedForDraft,
  connectedVersion, settingsNotice, language, onLanguageChange,
  theme, onThemeChange, languageOptions,
  dataMode, onDataModeChange, onNavigate,
  modelOptions, selectedModelKey, onChangeModel, modelKey: mk,
  stats, onResetStats,
  navBarMode, onNavBarModeChange
}: SettingsPanelProps) {
  const t = useT()

  const setField = (field: keyof ServerConfig, value: string | number) => {
    onChange({ ...draftConfig, [field]: value })
  }

  return (
    <section className="panel settings fade-in">
      <div className="section-heading">
        <div>
          <h2>{t('settings.title')}</h2>
          <p className="subtle">
            {draftConfig.host && draftConfig.port > 0 ? `${draftConfig.host}:${draftConfig.port}` : t('settings.hostPlaceholder')}
          </p>
          <p className="subtle">{t('settings.draftHint')}</p>
        </div>
      </div>

      <div className="form-grid">
        <label htmlFor="language">
          {t('settings.language')}
          <select id="language" value={language} onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}>
            {languageOptions.map((option) => (
              <option key={option.code} value={option.code}>{option.label}</option>
            ))}
          </select>
        </label>

        <label htmlFor="theme">
          {t('settings.theme')}
          <select id="theme" value={theme} onChange={(e) => onThemeChange(e.target.value as "system" | "light" | "dark" | "scheduled")}>
            <option value="system">{t('settings.themeSystem')}</option>
            <option value="light">{t('settings.themeLight')}</option>
            <option value="dark">{t('settings.themeDark')}</option>
            <option value="scheduled">{t('settings.themeScheduled')}</option>
          </select>
        </label>

        <label htmlFor="model">
          {t('settings.defaultModel')}
          <select id="model" value={selectedModelKey ?? ""}
            onChange={(e) => { const v = e.target.value; if (v) onChangeModel(v) }}>
            <option value="" disabled>{modelOptions.length === 0 ? t('detail.modelLoading') : t('settings.selectModel')}</option>
            {modelOptions.map((opt) => (
              <option key={mk(opt)} value={mk(opt)}>
                {opt.modelName || opt.modelID}{opt.variant ? ` (${opt.variant})` : ""} — {opt.providerName}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="host">
          {t('settings.host')}
          <input id="host" value={draftConfig.host} onChange={(e) => setField("host", e.target.value)} placeholder={t('settings.hostPlaceholder')} />
        </label>

        <label htmlFor="port">
          {t('settings.port')}
          <input id="port" type="number" value={draftConfig.port} onChange={(e) => setField("port", Number(e.target.value || 0))} placeholder="4096" />
        </label>

        <label htmlFor="username">
          {t('settings.username')}
          <input id="username" value={draftConfig.username} onChange={(e) => setField("username", e.target.value)} placeholder="opencode" />
        </label>

        <label htmlFor="password">
          {t('settings.password')}
          <input id="password" type="password" value={draftConfig.password} onChange={(e) => setField("password", e.target.value)} placeholder={t('settings.passwordPlaceholder')} />
        </label>
      </div>

      <fieldset className="data-mode-group">
        <legend>Data mode</legend>
        <p className="subtle">Controls network polling frequency and automatic data loading.</p>
        <div className="data-mode-options">
          {([
            { value: "full" as const, label: "Full", desc: "Real-time, high data usage" },
            { value: "saver" as const, label: "Saver", desc: "Balance (default)" },
            { value: "miser" as const, label: "Miser", desc: "60s poll, no background load" },
            { value: "ultra" as const, label: "ULTRA", desc: "30s, no audio, manual refresh" }
          ]).map((opt) => (
            <label key={opt.value} className={`data-mode-option ${dataMode === opt.value ? "active" : ""}`}>
              <input type="radio" name="dataMode" value={opt.value}
                checked={dataMode === opt.value}
                onChange={() => onDataModeChange(opt.value)} />
              <strong>{opt.label}</strong>
              <small>{opt.desc}</small>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="actions">
        <button onClick={onSave} disabled={testingConnection || !hasDraftChanges} className="btn-primary">
          <SaveIcon size={18} />
          {hasDraftChanges ? t('settings.save') : t('settings.savedButton')}
        </button>
        <button onClick={onTest} className="btn-secondary" disabled={testingConnection || !canTestDraft || testAlreadyPassedForDraft}
          title={!canTestDraft ? t('settings.testNeedsFields') : testAlreadyPassedForDraft ? t('settings.testAlreadyPassed') : undefined}>
          {testingConnection ? (
            <><LoadingIcon size={18} />{t('settings.testing')}</>
          ) : (
            <><TestIcon size={18} />{testAlreadyPassedForDraft ? t('settings.testOk') : t('settings.test')}</>
          )}
        </button>
      </div>

      {settingsNotice && (
        <div className={`notice ${settingsNotice.type} fade-in`}>
          {settingsNotice.type === 'success' && '✓ '}
          {settingsNotice.type === 'error' && '✗ '}
          {settingsNotice.type === 'info' && 'ℹ '}
          {settingsNotice.text}
        </div>
      )}

      <div className="connection-help">
        <span>{canTestDraft ? t('settings.readyToTest') : t('settings.testNeedsFields')}</span>
        <span>{hasDraftChanges ? t('settings.unsavedChanges') : t('settings.noUnsavedChanges')}</span>
      </div>

      {connectedVersion && testAlreadyPassedForDraft && (
        <div className="notice success fade-in">
          <TestIcon size={16} />
          {t('settings.connectedTo', { version: connectedVersion })}
        </div>
      )}

      <div className="stats-section">
        <h4 className="quick-access-label"><StatsIcon size={14} /> {t('settings.stats')}</h4>
        <div className="stats-grid">
          <span>{t('settings.statsPrompts')}: {stats.promptsSent}</span>
          <span>{t('settings.statsSessions')}: {stats.sessionsCreated}</span>
          <span>{t('settings.statsTokens')}: ~{stats.totalTokens.toLocaleString()}</span>
        </div>
        <button type="button" className="btn-secondary compact" onClick={onResetStats}
          style={{ marginTop: 'var(--space-2)' }}>
          {t('settings.resetStats')}
        </button>
      </div>

      <div className="setting-group">
        <h4 className="quick-access-label">{t('settings.navBarPosition')}</h4>
        <div className="toggle-row">
          <button type="button" className={`toggle-btn${navBarMode === "bottom" ? " active" : ""}`}
            onClick={() => onNavBarModeChange("bottom")}>
            {t('settings.navBarBottom')}
          </button>
          <button type="button" className={`toggle-btn${navBarMode === "header" ? " active" : ""}`}
            onClick={() => onNavBarModeChange("header")}>
            {t('settings.navBarHeader')}
          </button>
        </div>
      </div>

      <div className="settings-help">
        <button type="button" className="btn-secondary" onClick={() => onNavigate("help")}>
          <HelpIcon size={16} />
          {t('nav.help')}
        </button>
      </div>
    </section>
  )
})
