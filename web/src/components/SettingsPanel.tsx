import { memo } from "react"
import { SaveIcon, TestIcon, HelpIcon, LoadingIcon, StatsIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { FeatureFlags, ServerConfig, ModelOption, NoticeType, DataMode, ViewType, ProviderInfo } from "../types"
import type { LanguageCode } from "../i18n"
import { ProviderManager } from "./ProviderManager"

type UsageStats = {
  promptsSent: number
  sessionsCreated: number
  totalTokens?: number
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
  blockedModels: { isBlocked: (key: string) => boolean; toggleBlocked: (key: string) => void; blockedCount: number }
  onOpenThemePicker?: () => void
  flags: FeatureFlags
  onToggleFlag: (key: keyof FeatureFlags) => void
  onSetFlag: <K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) => void
  providers: ProviderInfo[]
  connectingProvider: string | null
  providerError: string | null
  onConnectProvider: (providerID: string, apiKey: string) => void
  onDisconnectProvider: (providerID: string) => void
}

export const SettingsPanel = memo(function SettingsPanel({
  draftConfig, onChange, onSave, onTest,
  testingConnection, hasDraftChanges, canTestDraft, testAlreadyPassedForDraft,
  connectedVersion, settingsNotice, language, onLanguageChange,
  theme, onThemeChange, languageOptions,
  dataMode, onDataModeChange, onNavigate,
  modelOptions, selectedModelKey, onChangeModel, modelKey: mk,
  stats, onResetStats,
  navBarMode, onNavBarModeChange,
  blockedModels, onOpenThemePicker,
  flags, onToggleFlag, onSetFlag,
  providers, connectingProvider, providerError, onConnectProvider, onDisconnectProvider
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
          <input id="port" type="number" value={draftConfig.port || 4096} onChange={(e) => setField("port", Number(e.target.value || 4096))} placeholder="4096" />
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
            { value: "full" as const, label: "Full", desc: "Streaming SSE en tiempo real · 3.5s poll · audio · datos completos" },
            { value: "saver" as const, label: "Balance", desc: "15s poll · datos completos · audio · recomendado para WiFi" },
            { value: "ultra" as const, label: "Reducido", desc: "30s poll · sin audio · datos esenciales · apto para 4G" },
            { value: "miser" as const, label: "Mínimo", desc: "60s poll · solo texto · sin notificaciones · para datos móviles limitados" }
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
          <span style={{ whiteSpace: "pre-line" }}>{settingsNotice.text}</span>
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
            onClick={() => onNavBarModeChange("bottom")}
            aria-pressed={navBarMode === "bottom"}>
            {t('settings.navBarBottom')}
          </button>
          <button type="button" className={`toggle-btn${navBarMode === "header" ? " active" : ""}`}
            onClick={() => onNavBarModeChange("header")}
            aria-pressed={navBarMode === "header"}>
            {t('settings.navBarHeader')}
          </button>
        </div>
      </div>

      {onOpenThemePicker && (
        <div className="setting-group">
          <h4 className="quick-access-label">Theme</h4>
          <button type="button" className="btn-secondary compact" onClick={onOpenThemePicker}
            style={{ width: "100%", textAlign: "left" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "space-between", width: "100%" }}>
              <span>Switch theme</span>
              <span style={{ opacity: 0.5, fontSize: "0.75rem" }}>33 themes</span>
            </span>
          </button>
        </div>
      )}

      <div className="setting-group">
        <h4 className="quick-access-label">{t('settings.featureFlags')}</h4>
        <p className="subtle">{t('settings.featureFlagsDesc')}</p>
        {([
          { key: "fileBrowser" as const, label: t('settings.fileBrowser'), desc: t('settings.fileBrowserDesc') },
          { key: "inlineDiff" as const, label: t('settings.inlineDiff'), desc: t('settings.inlineDiffDesc') },
          { key: "contextMenu" as const, label: t('settings.contextMenu'), desc: t('settings.contextMenuDesc') },
          { key: "planBreakdown" as const, label: t('settings.planBreakdown'), desc: t('settings.planBreakdownDesc') },
          { key: "gitOps" as const, label: t('settings.gitOps'), desc: t('settings.gitOpsDesc') },
          { key: "mcpConfig" as const, label: t('settings.mcpConfig'), desc: t('settings.mcpConfigDesc') },
          { key: "sessionArchive" as const, label: t('settings.sessionArchive'), desc: t('settings.sessionArchiveDesc') },
          { key: "autoSummarize" as const, label: t('settings.autoSummarize'), desc: t('settings.autoSummarizeDesc') },
          { key: "streamingFull" as const, label: t('settings.streamingFull'), desc: t('settings.streamingFullDesc') },
          { key: "offlineCache" as const, label: t('settings.offlineCache'), desc: t('settings.offlineCacheDesc') },
          { key: "questionAuto" as const, label: t('settings.questionAuto'), desc: t('settings.questionAutoDesc') },
          { key: "permissionUI" as const, label: t('settings.permissionUI'), desc: t('settings.permissionUIDesc') },
        ]).map(({ key, label, desc }) => (
          <label key={key} className="toggle-row">
            <span>
              <strong>{label}</strong>
              <small className="subtle">{desc}</small>
            </span>
            <button type="button"
              className={`toggle-btn${flags[key] ? " active" : ""}`}
              onClick={() => onToggleFlag(key)}
              aria-pressed={flags[key]}>
            </button>
          </label>
        ))}
        {flags.autoSummarize && (
          <label className="setting-row">
            <span>{t('settings.autoSummarizeThreshold')}</span>
            <input type="number" value={flags.autoSummarizeThreshold}
              onChange={(e) => onSetFlag("autoSummarizeThreshold", Number(e.target.value))}
              min={1000} step={1000} />
          </label>
        )}
      </div>

      <div className="setting-group">
        <h4 className="quick-access-label">{t('settings.providers')}</h4>
        <p className="subtle">{t('settings.providersDesc')}</p>
        <ProviderManager
          providers={providers}
          connecting={connectingProvider}
          error={providerError}
          onConnect={onConnectProvider}
          onDisconnect={onDisconnectProvider}
        />
      </div>

      <div className="setting-group">
        <p className="subtle">{t('settings.blockedModelsHint')}</p>
        <div className="blocked-model-list">
          {modelOptions.length === 0 ? (
            <p className="subtle">{t('detail.modelLoading')}</p>
          ) : modelOptions.length > 30 ? (
            <div className="blocked-model-search">
              <input placeholder={t('settings.blockedModelsSearch')}
                onChange={(e) => {
                  const q = e.target.value.toLowerCase()
                  const cards = document.querySelectorAll<HTMLElement>(".blocked-model-item")
                  for (const card of cards) {
                    const label = card.getAttribute("data-label")?.toLowerCase() ?? ""
                    card.style.display = label.includes(q) ? "" : "none"
                  }
                }} />
            </div>
          ) : null}
          {modelOptions.map((opt) => {
            const key = mk(opt)
            const blocked = blockedModels.isBlocked(key)
            return (
              <label key={key} className={`blocked-model-item${blocked ? " blocked" : ""}`} data-label={`${opt.modelName} ${opt.providerName}`}>
                <input type="checkbox" checked={blocked} onChange={() => blockedModels.toggleBlocked(key)} />
                <span>{opt.modelName}</span>
                <small>{opt.providerName}{opt.variant ? ` · ${opt.variant}` : ""}</small>
              </label>
            )
          })}
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
