import { memo, useState, useCallback, useMemo } from "react"
import { SaveIcon, TestIcon, HelpIcon, LoadingIcon, StatsIcon, EyeIcon, EyeOffIcon, ServerIcon, PlusIcon, TrashIcon, CheckIcon, PowerIcon, GithubIcon, DataIcon, StarIcon, ArchiveIcon, KeyboardIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { FeatureFlags, ServerConfig, ModelOption, NoticeType, DataMode, ViewType, ProviderInfo, ServerProfile, ChatSettings } from "../types"
import type { LanguageCode } from "../i18n"
import { describeProfile } from "../hooks/useServers"
import { ProviderManager } from "./ProviderManager"
import { ChatCustomizer } from "./ChatCustomizer"
import { SettingsSection } from "./SettingsSection"
import { DataUsageModal } from "./DataUsageModal"
import { getDataUsage, formatBytes } from "../utils/dataUsage"

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
  onOpenThemeCreator?: () => void
  flags: FeatureFlags
  onToggleFlag: (key: keyof FeatureFlags) => void
  onSetFlag: <K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) => void
  providers: ProviderInfo[]
  connectingProvider: string | null
  providerError: string | null
  onConnectProvider: (providerID: string, apiKey: string) => void
  onDisconnectProvider: (providerID: string) => void
  serverProfiles: ServerProfile[]
  onAddServerProfile: (name: string, kind: "http") => void
  onRemoveServerProfile: (id: string) => void
  onUpdateServerProfile: (id: string, name: string, config: ServerConfig) => void
  onApplyServerProfile: (profile: ServerProfile) => void
  activeServerProfileID: string | null
  chatSettings: ChatSettings
  onChatSettingChange: <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => void
  onResetChatSettings: () => void
  onShutdownHost: () => void
  onOpenGitHub: () => void
  onOpenFavoritesManager?: () => void
  onOpenArchivedView?: () => void
  onOpenShortcuts?: () => void
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
  onOpenThemeCreator,
  flags, onToggleFlag, onSetFlag,
  providers, connectingProvider, providerError, onConnectProvider, onDisconnectProvider,
  serverProfiles, onAddServerProfile, onRemoveServerProfile, onUpdateServerProfile, onApplyServerProfile, activeServerProfileID,
  chatSettings, onChatSettingChange, onResetChatSettings,
  onShutdownHost, onOpenGitHub, onOpenFavoritesManager, onOpenArchivedView, onOpenShortcuts
}: SettingsPanelProps) {
  const t = useT()
  const [showPassword, setShowPassword] = useState(false)
  const [modelQuery, setModelQuery] = useState("")
  const [showShutdownConfirm, setShowShutdownConfirm] = useState(false)
  const [showDataUsage, setShowDataUsage] = useState(false)

  const uniqueModels = useMemo(() => {
    return Array.from(new Map(modelOptions.map((opt) => [mk(opt), opt])).values())
  }, [modelOptions, mk])

  const filteredModels = useMemo(() => {
    const q = modelQuery.trim().toLowerCase()
    if (!q) return uniqueModels
    return uniqueModels.filter((opt) =>
      (opt.modelName || opt.modelID).toLowerCase().includes(q) ||
      opt.modelID.toLowerCase().includes(q) ||
      opt.providerName.toLowerCase().includes(q) ||
      opt.providerID.toLowerCase().includes(q)
    )
  }, [uniqueModels, modelQuery])
  const [blockedSearch, setBlockedSearch] = useState("")
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set())
  const [newProfileName, setNewProfileName] = useState("")
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null)
  const [profileDraft, setProfileDraft] = useState<ServerConfig | null>(null)
  const [expandedCurrent, setExpandedCurrent] = useState(false)

  const toggleProfile = useCallback((profile: ServerProfile) => {
    setExpandedProfileId((cur) => {
      if (cur === profile.id) return null
      setProfileDraft(profile.config)
      return profile.id
    })
  }, [])

  const profileField = useCallback(<K extends keyof ServerConfig>(key: K, value: ServerConfig[K]) => {
    setProfileDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }, [])

  const toggleProvider = useCallback((providerID: string) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev)
      if (next.has(providerID)) next.delete(providerID)
      else next.add(providerID)
      return next
    })
  }, [])

  const setField = (field: keyof ServerConfig, value: string | number) => {
    onChange({ ...draftConfig, [field]: value })
  }

  const dataModes = [
    { value: "full" as const, label: "Full", desc: t('settings.modeFullDesc') },
    { value: "saver" as const, label: t('settings.modeSaver'), desc: t('settings.modeSaverDesc') },
    { value: "ultra" as const, label: t('settings.modeUltra'), desc: t('settings.modeUltraDesc') },
    { value: "miser" as const, label: t('settings.modeMiser'), desc: t('settings.modeMiserDesc') }
  ]

  const featureFlags = [
    { key: "fileBrowser" as const, label: t('settings.fileBrowser'), desc: t('settings.fileBrowserDesc') },
    { key: "inlineDiff" as const, label: t('settings.inlineDiff'), desc: t('settings.inlineDiffDesc') },
    { key: "contextMenu" as const, label: t('settings.contextMenu'), desc: t('settings.contextMenuDesc') },
    { key: "planBreakdown" as const, label: t('settings.planBreakdown'), desc: t('settings.planBreakdownDesc') },
    { key: "gitOps" as const, label: t('settings.gitOps'), desc: t('settings.gitOpsDesc') },
    { key: "mcpConfig" as const, label: t('settings.mcpConfig'), desc: t('settings.mcpConfigDesc') },
    { key: "sessionArchive" as const, label: t('settings.sessionArchive'), desc: t('settings.sessionArchiveDesc') },
    { key: "streamingFull" as const, label: t('settings.streamingFull'), desc: t('settings.streamingFullDesc') },
    { key: "offlineCache" as const, label: t('settings.offlineCache'), desc: t('settings.offlineCacheDesc') },
    { key: "questionAuto" as const, label: t('settings.questionAuto'), desc: t('settings.questionAutoDesc') },
    { key: "permissionUI" as const, label: t('settings.permissionUI'), desc: t('settings.permissionUIDesc') },
    { key: "promptQueue" as const, label: t('settings.promptQueue'), desc: t('settings.promptQueueDesc') },
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

      {/* Saved servers + per-server config */}
      <SettingsSection title={t('settings.sectionServers')} icon={<ServerIcon size={14} />}>
        <p className="subtle">{t('settings.sectionServersDesc')}</p>

        {/* Current server (active, not saved as profile) */}
        <div className={`server-profile${expandedCurrent ? " expanded" : ""}`}>
          <button type="button" className="server-profile-row" onClick={() => setExpandedCurrent((v) => !v)}
            aria-expanded={expandedCurrent}>
            <span className="server-profile-kind http">HTTP</span>
            <span className="server-profile-name">{t('settings.serverCurrent')}</span>
            <span className="server-profile-desc">{describeProfile({ id: "current", name: "", config: draftConfig })}</span>
            <span className="settings-chevron" aria-hidden="true">▾</span>
          </button>
          {expandedCurrent && (
            <div className="server-profile-config">
              <div className="form-grid">
                <label className="form-field">
                  <span>{t('settings.host')}</span>
                  <input name="host" value={draftConfig.host} onChange={(e) => setField("host", e.target.value)} placeholder={t('settings.hostPlaceholder')} />
                </label>
                <label className="form-field">
                  <span>{t('settings.port')}</span>
                  <input name="port" type="number" value={draftConfig.port || 4096} onChange={(e) => setField("port", Number(e.target.value || 4096))} placeholder="4096" />
                </label>
                <label className="form-field">
                  <span>{t('settings.username')}</span>
                  <input name="username" value={draftConfig.username} onChange={(e) => setField("username", e.target.value)} placeholder="opencode" />
                </label>
                <label className="form-field">
                  <span>{t('settings.password')}</span>
                  <div className="password-wrapper">
                    <input name="password" type={showPassword ? "text" : "password"} value={draftConfig.password} onChange={(e) => setField("password", e.target.value)} placeholder={t('settings.passwordPlaceholder')} />
                    <button type="button" className="btn-icon btn-ghost password-toggle" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                      {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {serverProfiles.length > 0 && (
          <div className="server-profile-list">
            {serverProfiles.map((profile) => (
              <div key={profile.id} className={`server-profile${activeServerProfileID === profile.id ? " active" : ""}${expandedProfileId === profile.id ? " expanded" : ""}`}>
                <button type="button" className="server-profile-row" onClick={() => toggleProfile(profile)}
                  aria-expanded={expandedProfileId === profile.id}>
                  <span className="server-profile-kind http">HTTP</span>
                  <span className="server-profile-name">{profile.name}</span>
                  <span className="server-profile-desc">{describeProfile(profile)}</span>
                  {activeServerProfileID === profile.id ? (
                    <span className="server-profile-active"><CheckIcon size={12} /> {t('settings.serverActive')}</span>
                  ) : null}
                  <span className="settings-chevron" aria-hidden="true">▾</span>
                </button>
                <button type="button" className="btn-icon btn-ghost server-profile-remove"
                  onClick={() => onRemoveServerProfile(profile.id)}
                  aria-label={t('settings.serverRemove')} title={t('settings.serverRemove')}>
                  <TrashIcon size={14} />
                </button>
                {expandedProfileId === profile.id && profileDraft && (
                  <div className="server-profile-config">
                    <div className="form-grid">
                      <label className="form-field">
                        <span>{t('settings.host')}</span>
                        <input name="host" value={profileDraft.host} onChange={(e) => profileField("host", e.target.value)} placeholder={t('settings.hostPlaceholder')} />
                      </label>
                      <label className="form-field">
                        <span>{t('settings.port')}</span>
                        <input name="port" type="number" value={profileDraft.port || 4096} onChange={(e) => profileField("port", Number(e.target.value || 4096))} placeholder="4096" />
                      </label>
                      <label className="form-field">
                        <span>{t('settings.username')}</span>
                        <input name="username" value={profileDraft.username} onChange={(e) => profileField("username", e.target.value)} placeholder="opencode" />
                      </label>
                      <label className="form-field">
                        <span>{t('settings.password')}</span>
                        <div className="password-wrapper">
                          <input name="password" type={showPassword ? "text" : "password"} value={profileDraft.password} onChange={(e) => profileField("password", e.target.value)} placeholder={t('settings.passwordPlaceholder')} />
                          <button type="button" className="btn-icon btn-ghost password-toggle" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                            {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                          </button>
                        </div>
                      </label>
                    </div>
                    <div className="server-profile-actions">
                      <button type="button" className="btn-primary compact"
                        onClick={() => {
                          onUpdateServerProfile(profile.id, profile.name, profileDraft)
                          onApplyServerProfile({ ...profile, config: profileDraft })
                          setExpandedProfileId(null)
                        }}>
                        <CheckIcon size={14} /> {t('settings.serverApplyAndSave')}
                      </button>
                      <button type="button" className="btn-secondary compact"
                        onClick={() => { onUpdateServerProfile(profile.id, profile.name, profileDraft); setExpandedProfileId(null) }}>
                        <SaveIcon size={14} /> {t('settings.serverSaveOnly')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="server-profile-add">
          <input
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            placeholder={t('settings.serverNamePlaceholder')}
          />
          <button type="button" className="btn-secondary compact"
            disabled={!newProfileName.trim()}
            onClick={() => { onAddServerProfile(newProfileName.trim(), "http"); setNewProfileName("") }}>
            <PlusIcon size={14} /> {t('settings.serverSaveHttp')}
          </button>
        </div>
      </SettingsSection>

      {/* Data mode */}
      <SettingsSection title={t('settings.dataModeTitle')}>
        <p className="subtle">{t('settings.dataModeDesc')}</p>
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
      </SettingsSection>

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
      <SettingsSection title={t('settings.sectionPreferences')}>
        <div className="form-grid">
          <label className="form-field">
            <span>{t('settings.language')}</span>
            <select name="language" value={language} onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}>
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>{t('settings.theme')}</span>
            <select name="theme" value={theme} onChange={(e) => onThemeChange(e.target.value as "system" | "light" | "dark" | "scheduled")}>
              <option value="system">{t('settings.themeSystem')}</option>
              <option value="light">{t('settings.themeLight')}</option>
              <option value="dark">{t('settings.themeDark')}</option>
              <option value="scheduled">{t('settings.themeScheduled')}</option>
            </select>
          </label>
          <div className="form-field">
            <span>{t('settings.defaultModel')}</span>
            <input name="modelSearch" value={modelQuery} onChange={(e) => setModelQuery(e.target.value)}
              placeholder={t('detail.modelSearchPlaceholder')} autoComplete="off" />
            <div className="settings-model-list" role="listbox" aria-label={t('settings.defaultModel')}>
              {filteredModels.length === 0 ? (
                <p className="subtle model-empty">{t('detail.modelSearchEmpty')}</p>
              ) : (
                filteredModels.map((opt) => {
                  const key = mk(opt)
                  const isSelected = key === selectedModelKey
                  return (
                    <button key={key} type="button"
                      className={`settings-model-item${isSelected ? " active" : ""}`}
                      onClick={() => onChangeModel(key)}
                      role="option" aria-selected={isSelected}>
                      <span className="settings-model-name">{opt.modelName || opt.modelID}</span>
                      <span className="settings-model-provider">{opt.providerName}</span>
                      {isSelected && <CheckIcon size={14} className="settings-model-check" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
          {(() => {
            if (!selectedModelKey) return null
            const selected = uniqueModels.find((opt) => mk(opt) === selectedModelKey)
            const vars = modelOptions.filter((opt) => mk(opt) === selectedModelKey && opt.variant)
            if (vars.length === 0) return null
            return (
              <div className="form-field">
                {selected && (
                  <span className="settings-model-selected">
                    {selected.modelName || selected.modelID} · {selected.providerName}
                  </span>
                )}
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
              <span>{t('settings.visualTheme')}</span>
              <button type="button" className="btn-secondary" onClick={onOpenThemePicker}>
                <span>{t('settings.switchTheme')}</span>
                <span className="badge">33 temas</span>
              </button>
              {onOpenThemeCreator && (
                <button type="button" className="theme-creator-btn" onClick={onOpenThemeCreator}>
                  <span>{t('session.themeCreator')}</span>
                </button>
              )}
              {activeModelOption && (
                <small className="model-active-name">{activeModelOption.modelName}{activeModelOption.variant ? ` · ${activeModelOption.variant}` : ""}</small>
              )}
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Feature flags */}
      <SettingsSection title={t('settings.featureFlags')}>
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
                aria-checked={flags[key]}
                role="switch">
                <span className="switch-thumb" />
              </button>
            </label>
          ))}
          {flags.promptQueue && (
            <label className="switch-row">
              <span className="switch-label">
                <strong>{t('settings.promptQueueMode')}</strong>
                <small>{t('settings.promptQueueModeDesc')}</small>
              </span>
              <select name="promptQueueMode" value={flags.promptQueueMode}
                onChange={(e) => onSetFlag("promptQueueMode", e.target.value as "manual" | "auto")}
                className="switch-input" style={{ width: "auto", minWidth: 100 }}>
                <option value="auto">{t('settings.promptQueueModeAuto')}</option>
                <option value="manual">{t('settings.promptQueueModeManual')}</option>
              </select>
            </label>
          )}
        </div>
      </SettingsSection>

      {/* Providers */}
      <SettingsSection title={t('settings.providers')}>
        <p className="subtle">{t('settings.providersDesc')}</p>
        <ProviderManager
          providers={providers}
          connecting={connectingProvider}
          error={providerError}
          onConnect={onConnectProvider}
          onDisconnect={onDisconnectProvider}
        />
      </SettingsSection>

      {/* Blocked models */}
      <SettingsSection title={t('settings.blockedModels')}>
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
              const isExpanded = expandedProviders.has(providerID) || blockedSearch.length > 0
              return (
                <div key={providerID} className="blocked-group">
                  <div className="blocked-group-header" onClick={() => toggleProvider(providerID)} role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleProvider(providerID) } }}>
                    <span className="blocked-chevron">{isExpanded ? "▼" : "▶"}</span>
                    <strong>{providerID}</strong>
                    <small className="subtle">{blockedCount}/{total} ocultos</small>
                    <button type="button" className="btn-link" onClick={(e) => { e.stopPropagation(); blockedModels.toggleAllForProvider(providerID, !allBlocked) }}>
                      {allBlocked ? "Mostrar todos" : "Ocultar todos"}
                    </button>
                  </div>
                  {isExpanded && filtered.map((opt) => {
                    const key = mk(opt)
                    const blocked = blockedModels.isBlocked(key)
                    return (
                      <label key={key} className={`blocked-item${blocked ? " blocked" : ""}`} data-label={`${opt.modelName} ${opt.providerName}`}>
                        <span className="blocked-item-name">{opt.modelName}</span>
                        {opt.variant && <small className="blocked-item-variant">{opt.variant}</small>}
                        <button type="button"
                          className={`switch-track compact${blocked ? "" : " active"}`}
                          onClick={() => blockedModels.toggleBlocked(key)}
                          aria-checked={!blocked}
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
      </SettingsSection>

      {/* Chat customization */}
      <SettingsSection title={t('settings.chatCustomization')}>
        <p className="subtle">{t('settings.chatCustomizationDesc')}</p>
        <ChatCustomizer
          settings={chatSettings}
          onSettingChange={onChatSettingChange}
          onReset={onResetChatSettings} />
      </SettingsSection>

      {/* Extras */}
      <SettingsSection title={t('settings.extras')}>
        <p className="subtle">{t('settings.extrasDesc')}</p>
        <div className="settings-extras-list">
          <button type="button" className="btn-secondary extras-btn" onClick={() => setShowShutdownConfirm(true)}>
            <PowerIcon size={16} />
            <span>
              <strong>{t('extras.shutdownHost')}</strong>
              <small>{t('extras.shutdownHostDesc')}</small>
            </span>
          </button>
          <button type="button" className="btn-secondary extras-btn" onClick={onOpenGitHub}>
            <GithubIcon size={16} />
            <span>
              <strong>{t('extras.github')}</strong>
              <small>github.com/Owning01/Opencode-Mobile</small>
            </span>
          </button>
          <button type="button" className="btn-secondary extras-btn" onClick={() => setShowDataUsage(true)}>
            <DataIcon size={16} />
            <span>
              <strong>{t('extras.dataUsage')}</strong>
              <small>{formatBytes(getDataUsage().month.total)} · {t('dataUsage.month')}</small>
            </span>
          </button>
          {onOpenFavoritesManager && (
            <button type="button" className="btn-secondary extras-btn" onClick={onOpenFavoritesManager}>
              <StarIcon size={16} />
              <span>
                <strong>{t('favorites.manage')}</strong>
                <small>{t('favorites.manageDesc')}</small>
              </span>
            </button>
          )}
          {onOpenArchivedView && (
            <button type="button" className="btn-secondary extras-btn" onClick={onOpenArchivedView}>
              <ArchiveIcon size={16} />
              <span>
                <strong>{t('session.archived')}</strong>
                <small>{t('session.archivedDesc')}</small>
              </span>
            </button>
          )}
          {onOpenShortcuts && (
            <button type="button" className="btn-secondary extras-btn" onClick={onOpenShortcuts}>
              <KeyboardIcon size={16} />
              <span>
                <strong>{t('session.shortcuts')}</strong>
                <small>{t('session.shortcutsDesc')}</small>
              </span>
            </button>
          )}
        </div>
      </SettingsSection>

      {/* Stats */}
      <SettingsSection title={t('settings.stats')} icon={<StatsIcon size={14} />}>
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
        <div className="settings-actions">
          <button type="button" className="btn-secondary compact" onClick={onResetStats}>
            {t('settings.resetStats')}
          </button>
        </div>
      </SettingsSection>

      <div className="settings-footer">
        <button type="button" className="btn-secondary" onClick={() => onNavigate("help")}>
          <HelpIcon size={16} />
          {t('nav.help')}
        </button>
      </div>

      {showShutdownConfirm && (
        <div className="modal-backdrop" onClick={() => setShowShutdownConfirm(false)}>
          <div className="modal-card fade-in" role="dialog" aria-modal="true"
            onClick={(e) => e.stopPropagation()}>
            <h2>{t('extras.shutdownConfirmTitle')}</h2>
            <p>{t('extras.shutdownConfirmBody')}</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowShutdownConfirm(false)}>
                {t('extras.shutdownCancel')}
              </button>
              <button className="btn-danger" onClick={() => { setShowShutdownConfirm(false); onShutdownHost() }}>
                <PowerIcon size={16} />
                {t('extras.shutdownConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDataUsage && (
        <DataUsageModal
          onClose={() => setShowDataUsage(false)} />
      )}
    </section>
  )
})

export default SettingsPanel
