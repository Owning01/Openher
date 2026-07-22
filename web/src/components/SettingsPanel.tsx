import { memo, useState } from "react"
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
  selectedVariant: string | null
  onChangeVariant: (variant: string | null) => void
  stats: UsageStats
  onResetStats: () => void
  activeModelOption: ModelOption | null
  blockedModels: { isBlocked: (key: string) => boolean; toggleBlocked: (key: string) => void; toggleAllForProvider: (providerID: string, block: boolean) => void; providerBlockedCount: (providerID: string) => number; blockedCount: number }
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
  selectedVariant, onChangeVariant,
  stats, onResetStats,
  activeModelOption, blockedModels, onOpenThemePicker,
  flags, onToggleFlag, onSetFlag,
  providers, connectingProvider, providerError, onConnectProvider, onDisconnectProvider
}: SettingsPanelProps) {
  const t = useT()
  const [blockedSearch, setBlockedSearch] = useState("")

  const setField = (field: keyof ServerConfig, value: string | number) => {
    onChange({ ...draftConfig, [field]: value })
  }

  const dataModes = [
    { value: "full" as const, label: "Full", desc: "3.5s · ~35 KB/min · SSE + audio · datos completos" },
    { value: "saver" as const, label: "Balance", desc: "15s · ~10 KB/min · payload completo · con audio" },
    { value: "ultra" as const, label: "Reducido", desc: "30s · ~3.6 KB/min · sin audio · datos esenciales" },
    { value: "miser" as const, label: "Mínimo", desc: "60s · ~1.8 KB/min · solo texto · sin notificaciones" }
  ]

  const featureFlags = [
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
  ]

  return (
    <section className="panel settings fade-in">
      <div className="settings-header">
        <h2>{t('settings.title')}</h2>
        <p className="subtle">
          {draftConfig.host && draftConfig.port > 0 ? `${draftConfig.host}:${draftConfig.port}` : t('settings.hostPlaceholder')}
        </p>
        <p className="subtle">{t('settings.draftHint')}</p>
      </div>

      {/* Server config */}
      <div className="settings-card">
        <h3 className="settings-section-title">Servidor</h3>
        <div className="form-grid">
          <label className="form-field">
            <span>{t('settings.host')}</span>
            <input value={draftConfig.host} onChange={(e) => setField("host", e.target.value)} placeholder={t('settings.hostPlaceholder')} />
          </label>
          <label className="form-field">
            <span>{t('settings.port')}</span>
            <input type="number" value={draftConfig.port || 4096} onChange={(e) => setField("port", Number(e.target.value || 4096))} placeholder="4096" />
          </label>
          <label className="form-field">
            <span>{t('settings.username')}</span>
            <input value={draftConfig.username} onChange={(e) => setField("username", e.target.value)} placeholder="opencode" />
          </label>
          <label className="form-field">
            <span>{t('settings.password')}</span>
            <input type="password" value={draftConfig.password} onChange={(e) => setField("password", e.target.value)} placeholder={t('settings.passwordPlaceholder')} />
          </label>
        </div>
      </div>

      {/* Actions row */}
      <div className="settings-actions">
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

      {/* Notice */}
      {settingsNotice && (
        <div className={`notice ${settingsNotice.type} fade-in`}>
          {settingsNotice.type === 'success' && '✓ '}
          {settingsNotice.type === 'error' && '✗ '}
          {settingsNotice.type === 'info' && 'ℹ '}
          <span style={{ whiteSpace: "pre-line" }}>{settingsNotice.text}</span>
        </div>
      )}

      {connectedVersion && testAlreadyPassedForDraft && (
        <div className="notice success fade-in">
          <TestIcon size={16} />
          {t('settings.connectedTo', { version: connectedVersion })}
        </div>
      )}

      {/* Preferences */}
      <div className="settings-card">
        <h3 className="settings-section-title">Preferencias</h3>
        <div className="form-grid">
          <label className="form-field">
            <span>{t('settings.language')}</span>
            <select value={language} onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}>
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>{t('settings.theme')}</span>
            <select value={theme} onChange={(e) => onThemeChange(e.target.value as "system" | "light" | "dark" | "scheduled")}>
              <option value="system">{t('settings.themeSystem')}</option>
              <option value="light">{t('settings.themeLight')}</option>
              <option value="dark">{t('settings.themeDark')}</option>
              <option value="scheduled">{t('settings.themeScheduled')}</option>
            </select>
          </label>
          <label className="form-field">
            <span>{t('settings.defaultModel')}</span>
            <select value={selectedModelKey ?? ""}
              onChange={(e) => { const v = e.target.value; if (v) onChangeModel(v) }}>
              <option value="" disabled>{modelOptions.length === 0 ? t('detail.modelLoading') : t('settings.selectModel')}</option>
              {Array.from(new Map(modelOptions.map((opt) => [mk(opt), opt])).values()).map((opt) => (
                <option key={mk(opt)} value={mk(opt)}>
                  {opt.modelName || opt.modelID} — {opt.providerName}
                </option>
              ))}
            </select>
          </label>
          {(() => {
            if (!selectedModelKey) return null
            const vars = modelOptions.filter((opt) => mk(opt) === selectedModelKey && opt.variant)
            if (vars.length === 0) return null
            return (
              <div className="form-field">
                <span>Variante</span>
                <div className="model-variant-pills">
                  <button type="button"
                    className={`variant-pill${!selectedVariant ? " active" : ""}`}
                    onClick={() => onChangeVariant(null)}>
                    Default
                  </button>
                  {vars.map((v) => (
                    <button key={v.variant} type="button"
                      className={`variant-pill${selectedVariant === v.variant ? " active" : ""}`}
                      onClick={() => onChangeVariant(v.variant ?? null)}>
                      {v.variant}
                    </button>
                  ))}
                </div>
              </div>
            )
          })()}
          {onOpenThemePicker && (
            <div className="form-field">
              <span>Tema visual</span>
              <button type="button" className="btn-secondary" onClick={onOpenThemePicker}>
                <span>Switch theme</span>
                <span className="badge">33 temas</span>
              </button>
              {activeModelOption && (
                <small className="model-active-name">{activeModelOption.modelName}{activeModelOption.variant ? ` · ${activeModelOption.variant}` : ""}</small>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Data mode */}
      <div className="settings-card">
        <h3 className="settings-section-title">Data mode</h3>
        <p className="subtle">Controls network polling frequency and automatic data loading.</p>
        <div className="data-mode-grid">
          {dataModes.map((opt) => (
            <button key={opt.value}
              className={`data-mode-card${dataMode === opt.value ? " active" : ""}`}
              onClick={() => onDataModeChange(opt.value)}
              aria-pressed={dataMode === opt.value}>
              <strong>{opt.label}</strong>
              <small>{opt.desc}</small>
            </button>
          ))}
        </div>
      </div>

      {/* Feature flags */}
      <div className="settings-card">
        <h3 className="settings-section-title">{t('settings.featureFlags')}</h3>
        <p className="subtle">{t('settings.featureFlagsDesc')}</p>
        <div className="switch-list">
          {featureFlags.map(({ key, label, desc }) => (
            <label key={key} className="switch-row">
              <span className="switch-label">
                <strong>{label}</strong>
                <small>{desc}</small>
              </span>
              <button type="button"
                className={`switch-track${flags[key] ? " active" : ""}`}
                onClick={() => onToggleFlag(key)}
                aria-pressed={flags[key]}
                role="switch">
                <span className="switch-thumb" />
              </button>
            </label>
          ))}
          {flags.autoSummarize && (
            <label className="switch-row">
              <span className="switch-label">
                <strong>{t('settings.autoSummarizeThreshold')}</strong>
              </span>
              <input type="number" className="switch-input" value={flags.autoSummarizeThreshold}
                onChange={(e) => onSetFlag("autoSummarizeThreshold", Number(e.target.value))}
                min={1000} step={1000} />
            </label>
          )}
        </div>
      </div>

      {/* Providers */}
      <div className="settings-card">
        <h3 className="settings-section-title">{t('settings.providers')}</h3>
        <p className="subtle">{t('settings.providersDesc')}</p>
        <ProviderManager
          providers={providers}
          connecting={connectingProvider}
          error={providerError}
          onConnect={onConnectProvider}
          onDisconnect={onDisconnectProvider}
        />
      </div>

      {/* Blocked models */}
      <div className="settings-card">
        <h3 className="settings-section-title">{t('settings.blockedModels')}</h3>
        <p className="subtle">{t('settings.blockedModelsHint')}</p>
        {modelOptions.length === 0 ? (
          <p className="subtle">{t('detail.modelLoading')}</p>
        ) : (
          <>
            <div className="blocked-search">
              <input placeholder={t('settings.blockedModelsSearch')}
                value={blockedSearch}
                onChange={(e) => setBlockedSearch(e.target.value)} />
            </div>
            {Array.from(new Set(modelOptions.map((o) => o.providerID))).map((providerID) => {
              const providerModels = modelOptions.filter((o) => o.providerID === providerID)
              const filtered = blockedSearch
                ? providerModels.filter((o) => (o.modelName ?? "").toLowerCase().includes(blockedSearch.toLowerCase()))
                : providerModels
              if (filtered.length === 0) return null
              const total = providerModels.length
              const blockedCount = providerModels.filter((o) => blockedModels.isBlocked(mk(o))).length
              const allBlocked = blockedCount === total
              return (
                <div key={providerID} className="blocked-group">
                  <div className="blocked-group-header">
                    <strong>{providerID}</strong>
                    <small className="subtle">{blockedCount}/{total} ocultos</small>
                    <button type="button" className="btn-link" onClick={() => blockedModels.toggleAllForProvider(providerID, !allBlocked)}>
                      {allBlocked ? "Mostrar todos" : "Ocultar todos"}
                    </button>
                  </div>
                  {filtered.map((opt) => {
                    const key = mk(opt)
                    const blocked = blockedModels.isBlocked(key)
                    return (
                      <label key={key} className={`blocked-item${blocked ? " blocked" : ""}`} data-label={`${opt.modelName} ${opt.providerName}`}>
                        <span className="blocked-item-name">{opt.modelName}</span>
                        {opt.variant && <small className="blocked-item-variant">{opt.variant}</small>}
                        <button type="button"
                          className={`switch-track compact${blocked ? "" : " active"}`}
                          onClick={() => blockedModels.toggleBlocked(key)}
                          aria-pressed={!blocked}
                          role="switch">
                          <span className="switch-thumb" />
                        </button>
                      </label>
                    )
                  })}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Stats */}
      <div className="settings-card">
        <h3 className="settings-section-title"><StatsIcon size={14} /> {t('settings.stats')}</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{stats.promptsSent}</span>
            <span className="stat-label">{t('settings.statsPrompts')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.sessionsCreated}</span>
            <span className="stat-label">{t('settings.statsSessions')}</span>
          </div>
        </div>
        <button type="button" className="btn-secondary compact" onClick={onResetStats}>
          {t('settings.resetStats')}
        </button>
      </div>

      <div className="settings-footer">
        <button type="button" className="btn-secondary" onClick={() => onNavigate("help")}>
          <HelpIcon size={16} />
          {t('nav.help')}
        </button>
      </div>
    </section>
  )
})

export default SettingsPanel
