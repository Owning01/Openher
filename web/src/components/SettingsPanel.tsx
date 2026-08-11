import { memo, useState, useCallback, useMemo, useEffect } from "react"
import { SaveIcon, TestIcon, HelpIcon, LoadingIcon, StatsIcon, EyeIcon, EyeOffIcon, ServerIcon, PlusIcon, TrashIcon, CheckIcon, PowerIcon, GithubIcon, DataIcon, StarIcon, ArchiveIcon, KeyboardIcon, RefreshIcon, CameraIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { FeatureFlags, ServerConfig, ModelOption, NoticeType, DataMode, ViewType, ProviderInfo,
  ServerProfile, ChatSettings, PromptSnippet } from "../types"
import type { LanguageCode } from "../i18n"
import { describeProfile, isPairProfile } from "../hooks/useServers"
import { ProviderManager } from "./ProviderManager"
import { ChatCustomizer } from "./ChatCustomizer"
import { SnippetManager } from "./SnippetManager"
import { SettingsSection } from "./SettingsSection"
import { DataUsageModal } from "./DataUsageModal"
import { ThinkingLevels } from "./ThinkingLevels"
import { PairModal } from "./PairModal"
import { desktopApi, loadDesktopConfig, saveDesktopConfig, canTestDesktop, type DesktopConfig } from "../desktop"
import { getDataUsage, formatBytes } from "../utils/dataUsage"
import { variantsOf } from "../utils/model-utils"

type UsageStats = {
  promptsSent: number
  sessionsCreated: number
  totalTokens?: number
  firstUsed: number
}

type SettingsPanelProps = {
  draftConfig: ServerConfig
  onChange: (config: ServerConfig) => void
  onTest: () => void
  testingConnection: boolean
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
  onChangeModel: (key: string, variant?: string | null) => void
  modelKey: (model: { providerID: string; modelID: string; variant?: string }) => string
  selectedVariant: string | null
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
  onAddServerProfile: (name: string, kind: "http", config: ServerConfig) => ServerProfile | null
  onRemoveServerProfile: (id: string) => void
  onUpdateServerProfile: (id: string, name: string, config: ServerConfig) => void
  onApplyServerProfile: (profile: ServerProfile) => void
  onAddPairServer: (name: string, config: ServerConfig) => void
  activeServerProfileID: string | null
  chatSettings: ChatSettings
  onChatSettingChange: <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => void
  onResetChatSettings: () => void
  snippets: PromptSnippet[]
  onAddSnippet: (name: string, text: string) => void
  onRemoveSnippet: (id: string) => void
  onShutdownHost: () => void
  onRestartHost: () => void
  onOpenGitHub: () => void
  onOpenFavoritesManager?: () => void
  onOpenArchivedView?: () => void
  onOpenShortcuts?: () => void
}

export const SettingsPanel = memo(function SettingsPanel({
  draftConfig, onChange, onTest,
  testingConnection, canTestDraft, testAlreadyPassedForDraft,
  connectedVersion, settingsNotice, language, onLanguageChange,
  theme, onThemeChange, languageOptions,
  dataMode, onDataModeChange, onNavigate,
  modelOptions, selectedModelKey, onChangeModel, modelKey: mk,
  selectedVariant,
  stats, onResetStats,
  activeModelOption, blockedModels, onOpenThemePicker,
  onOpenThemeCreator,
  flags, onToggleFlag,
  providers, connectingProvider, providerError, onConnectProvider, onDisconnectProvider,
  serverProfiles, onAddServerProfile, onRemoveServerProfile, onUpdateServerProfile, onApplyServerProfile, onAddPairServer, activeServerProfileID,
  chatSettings, onChatSettingChange, onResetChatSettings,
  snippets, onAddSnippet, onRemoveSnippet,
  onShutdownHost, onRestartHost, onOpenGitHub, onOpenFavoritesManager, onOpenArchivedView, onOpenShortcuts
}: SettingsPanelProps) {
  const t = useT()
  const [showPassword, setShowPassword] = useState(false)
  const [modelQuery, setModelQuery] = useState("")
  const [showShutdownConfirm, setShowShutdownConfirm] = useState(false)
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  const [showDataUsage, setShowDataUsage] = useState(false)
  const [showPairModal, setShowPairModal] = useState(false)
  // Sección de servidores abierta por defecto: el botón + y los servers visibles.
  const [serversOpen, setServersOpen] = useState(true)

  // ===== Remote desktop (agente en la PC, puerto default 5901) =====
  const [desktopCfg, setDesktopCfg] = useState<DesktopConfig>(() =>
    loadDesktopConfig() ?? { host: "", port: 5901, username: "opencode", password: "" }
  )
  const [desktopTesting, setDesktopTesting] = useState(false)
  const [desktopNotice, setDesktopNotice] = useState<string | null>(null)
  const [desktopNoticeType, setDesktopNoticeType] = useState<"ok" | "fail">("ok")
  const [showDesktopPass, setShowDesktopPass] = useState(false)
  const [desktopSaved, setDesktopSaved] = useState(false)

  const testDesktop = useCallback(async () => {
    setDesktopTesting(true)
    setDesktopNotice(null)
    try {
      const ok = await desktopApi.health(desktopCfg)
      setDesktopNoticeType(ok ? "ok" : "fail")
      setDesktopNotice(ok ? t('settings.desktopTestOk') : t('settings.desktopTestFail'))
    } catch {
      setDesktopNoticeType("fail")
      setDesktopNotice(t('settings.desktopTestFail'))
    } finally {
      setDesktopTesting(false)
    }
  }, [desktopCfg, t])

  // Auto-save (debounced) como el server principal: al pausar la escritura
  // con host+puerto válidos, se persiste solo.
  useEffect(() => {
    if (!canTestDesktop(desktopCfg)) return
    const timer = setTimeout(() => {
      saveDesktopConfig(desktopCfg)
      setDesktopSaved(true)
      setTimeout(() => setDesktopSaved(false), 2000)
    }, 700)
    return () => clearTimeout(timer)
  }, [desktopCfg])

  const uniqueModels = useMemo(() => {
    return Array.from(new Map(modelOptions.map((opt) => [mk(opt), opt])).values())
  }, [modelOptions, mk])

  const filteredModels = useMemo(() => {
    // Solo modelos configurados (no bloqueados en la sección de abajo); el
    // modelo seleccionado se mantiene visible aunque esté bloqueado.
    const visible = uniqueModels.filter((opt) => !blockedModels.isBlocked(mk(opt)) || mk(opt) === selectedModelKey)
    const q = modelQuery.trim().toLowerCase()
    if (!q) return visible
    return visible.filter((opt) =>
      (opt.modelName || opt.modelID).toLowerCase().includes(q) ||
      opt.modelID.toLowerCase().includes(q) ||
      opt.providerName.toLowerCase().includes(q) ||
      opt.providerID.toLowerCase().includes(q)
    )
  }, [uniqueModels, modelQuery, blockedModels, selectedModelKey])
  const [blockedSearch, setBlockedSearch] = useState("")
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set())
  // Draft de "nuevo server": no se persiste hasta Guardar/Conectar. El
  // nombre del perfil expandido se edita aparte de su config.
  const [draftProfile, setDraftProfile] = useState<{ name: string; config: ServerConfig } | null>(null)
  const [draftOpen, setDraftOpen] = useState(false)
  const [profileNameDraft, setProfileNameDraft] = useState("")
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null)
  const [profileDraft, setProfileDraft] = useState<ServerConfig | null>(null)

  const toggleProfile = useCallback((profile: ServerProfile) => {
    setExpandedProfileId((cur) => {
      if (cur === profile.id) return null
      setProfileDraft(profile.config)
      setProfileNameDraft(profile.name)
      return profile.id
    })
  }, [])

  const profileField = useCallback(<K extends keyof ServerConfig>(key: K, value: ServerConfig[K]) => {
    setProfileDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }, [])

  const startDraft = useCallback(() => {
    setDraftProfile({ name: "", config: { ...draftConfig } })
    setDraftOpen(false)
  }, [draftConfig])

  const draftField = useCallback(<K extends keyof ServerConfig>(key: K, value: ServerConfig[K]) => {
    setDraftProfile((d) => (d ? { ...d, config: { ...d.config, [key]: value } } : d))
  }, [])

  const saveDraft = useCallback(() => {
    if (!draftProfile) return
    const profile = onAddServerProfile(draftProfile.name.trim() || t('settings.serverUntitled'), "http", draftProfile.config)
    if (profile) setDraftProfile(null)
  }, [draftProfile, onAddServerProfile, t])

  const connectDraft = useCallback(() => {
    if (!draftProfile) return
    const profile = onAddServerProfile(draftProfile.name.trim() || t('settings.serverUntitled'), "http", draftProfile.config)
    if (profile) {
      setDraftProfile(null)
      onApplyServerProfile(profile)
    }
  }, [draftProfile, onAddServerProfile, onApplyServerProfile, t])

  const discardDraft = useCallback(() => setDraftProfile(null), [])

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
  ]

  return (
    <section className="panel settings fade-in">
      <div className="settings-header">
        <h2>{t('settings.title')}</h2>
        <p className="subtle">
          {draftConfig.host && draftConfig.port > 0 ? `${draftConfig.host}:${draftConfig.port}` : t('settings.hostPlaceholder')}
        </p>
        <button onClick={onTest} className="btn-secondary settings-test-btn" disabled={testingConnection || !canTestDraft}
          title={!canTestDraft ? t('settings.testNeedsFields') : testAlreadyPassedForDraft ? t('settings.testAgainTitle') : undefined}>
          {testingConnection ? (
            <><LoadingIcon size={18} />{t('settings.testing')}</>
          ) : (
            <><TestIcon size={18} />{testAlreadyPassedForDraft ? t('settings.testAgain') : t('settings.test')}</>
          )}
        </button>
        <p className="subtle">{t('settings.draftHint')}</p>
      </div>

      {/* Saved servers + per-server config */}
      <SettingsSection title={t('settings.sectionServers')} icon={<ServerIcon size={14} />}
        open={serversOpen} onToggle={() => setServersOpen((v) => !v)}
        actions={
          <button type="button" className="btn-primary compact server-add-btn"
            onClick={() => { setServersOpen(true); startDraft() }}
            aria-label={t('settings.serverAdd')}>
            <PlusIcon size={14} /> <span>{t('settings.serverAdd')}</span>
          </button>
        }>
        <div className="server-section-header">
          {draftConfig.host && draftConfig.port > 0 ? (
            <p className="server-current-status">
              <span className="server-status-dot" aria-hidden="true" />
              {t('settings.serverConnectedTo')} <code>{`${draftConfig.host}:${draftConfig.port}`}</code>
            </p>
          ) : (
            <p className="server-current-status">{t('settings.serverNoActive')}</p>
          )}
        </div>

        <label className="form-field api-version-field">
          <span>{t('settings.apiVersion')}</span>
          <select name="apiVersion" value={draftConfig.apiVersion ?? "auto"}
            onChange={(e) => setField("apiVersion", e.target.value as "auto" | "v1" | "v2")}>
            <option value="auto">{t('settings.apiVersionAuto')}</option>
            <option value="v1">{t('settings.apiVersionV1')}</option>
            <option value="v2">{t('settings.apiVersionV2')}</option>
          </select>
          <small className="subtle">{t('settings.apiVersionDesc')}</small>
        </label>

        <div className="server-profile-list">
          {draftProfile && (
            <div className={`server-profile draft${draftOpen ? " expanded" : ""}`}>
              <div className="server-profile-row" role="button" tabIndex={0}
                onClick={() => setDraftOpen((v) => !v)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDraftOpen((v) => !v) } }}
                aria-expanded={draftOpen} title={t('settings.editServer')}>
                <span className="server-profile-kind http new">HTTP</span>
                <span className="server-profile-name">{draftProfile.name.trim() || t('settings.serverUntitled')}</span>
                <span className="server-profile-desc">{draftProfile.config.host ? `${draftProfile.config.host}:${draftProfile.config.port}` : t('settings.serverNotConfigured')}</span>
                <span className="settings-chevron" aria-hidden="true">▾</span>
              </div>
              <button type="button" className="btn-icon btn-ghost server-profile-remove"
                onClick={discardDraft}
                aria-label={t('settings.serverRemove')} title={t('settings.serverRemove')}>
                <TrashIcon size={14} />
              </button>
              {draftOpen && (
                <div className="server-profile-config">
                  <div className="form-grid">
                    <label className="form-field">
                      <span>{t('settings.serverName')}</span>
                      <input name="name" value={draftProfile.name}
                        onChange={(e) => setDraftProfile((d) => (d ? { ...d, name: e.target.value } : d))}
                        placeholder={t('settings.serverNamePlaceholder')} />
                    </label>
                    <label className="form-field">
                      <span>{t('settings.host')}</span>
                      <input name="host" value={draftProfile.config.host} onChange={(e) => draftField("host", e.target.value)} placeholder={t('settings.hostPlaceholder')} />
                    </label>
                    <label className="form-field">
                      <span>{t('settings.port')}</span>
                      <input name="port" type="number" value={draftProfile.config.port || 4096} onChange={(e) => draftField("port", Number(e.target.value || 4096))} placeholder="4096" />
                    </label>
                    <label className="form-field">
                      <span>{t('settings.username')}</span>
                      <input name="username" value={draftProfile.config.username} onChange={(e) => draftField("username", e.target.value)} placeholder="opencode" />
                    </label>
                    <label className="form-field">
                      <span>{t('settings.password')}</span>
                      <div className="password-wrapper">
                        <input name="password" type={showPassword ? "text" : "password"} value={draftProfile.config.password} onChange={(e) => draftField("password", e.target.value)} placeholder={t('settings.passwordPlaceholder')} />
                        <button type="button" className="btn-icon btn-ghost password-toggle" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                          {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                        </button>
                      </div>
                    </label>
                  </div>
                  <div className="server-profile-actions">
                    <button type="button" className="btn-primary compact"
                      disabled={!draftProfile.config.host.trim() || draftProfile.config.port <= 0}
                      onClick={saveDraft}>
                      <CheckIcon size={14} /> {t('settings.serverAdd')}
                    </button>
                    <button type="button" className="btn-secondary compact"
                      disabled={!draftProfile.config.host.trim() || draftProfile.config.port <= 0}
                      onClick={connectDraft}>
                      <CheckIcon size={14} /> {t('settings.serverAddAndConnect')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {serverProfiles.map((profile) => (
            <div key={profile.id} className={`server-profile${activeServerProfileID === profile.id ? " active" : ""}${expandedProfileId === profile.id ? " expanded" : ""}`}>
              <div className="server-profile-row" role="button" tabIndex={0}
                onClick={() => toggleProfile(profile)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleProfile(profile) } }}
                aria-expanded={expandedProfileId === profile.id} title={t('settings.editServer')}>
                <span className={`server-profile-kind${isPairProfile(profile) ? " pair" : " http"}`}>
                  {isPairProfile(profile) ? t('settings.pairKind') : "HTTP"}
                </span>
                <span className="server-profile-name">{profile.name}</span>
                <span className="server-profile-desc">{describeProfile(profile)}</span>
                {activeServerProfileID === profile.id ? (
                  <span className="server-profile-active"><CheckIcon size={12} /> {t('settings.serverActive')}</span>
                ) : (
                  <button type="button" className="btn-secondary compact server-use-btn"
                    onClick={(e) => { e.stopPropagation(); onApplyServerProfile(profile) }}
                    title={t('settings.serverUse')}>
                    {t('settings.serverUse')}
                  </button>
                )}
                <span className="settings-chevron" aria-hidden="true">▾</span>
              </div>
              <button type="button" className="btn-icon btn-ghost server-profile-remove"
                onClick={() => onRemoveServerProfile(profile.id)}
                aria-label={t('settings.serverRemove')} title={t('settings.serverRemove')}>
                <TrashIcon size={14} />
              </button>
              {expandedProfileId === profile.id && profileDraft && (
                <div className="server-profile-config">
                  <div className="form-grid">
                    <label className="form-field">
                      <span>{t('settings.serverName')}</span>
                      <input name="name" value={profileNameDraft} onChange={(e) => setProfileNameDraft(e.target.value)} placeholder={t('settings.serverNamePlaceholder')} />
                    </label>
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
                        onUpdateServerProfile(profile.id, profileNameDraft, profileDraft)
                        onApplyServerProfile({ ...profile, name: profileNameDraft, config: profileDraft })
                        setExpandedProfileId(null)
                      }}>
                      <CheckIcon size={14} /> {t('settings.saveAndApply')}
                    </button>
                    <button type="button" className="btn-secondary compact"
                      onClick={() => { onUpdateServerProfile(profile.id, profileNameDraft, profileDraft); setExpandedProfileId(null) }}>
                      <SaveIcon size={14} /> {t('settings.serverSaveOnly')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="pair-service-row">
          <span className="server-profile-kind pair">{t('settings.pairKind')}</span>
          <span className="pair-service-label">{t('settings.pairTitle')}</span>
          <button type="button" className="btn-secondary compact"
            onClick={() => setShowPairModal(true)}>
            <CameraIcon size={14} /> {t('settings.pairScanQr')}
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
        <button type="button" className="btn-secondary extras-btn" onClick={() => setShowDataUsage(true)}>
          <DataIcon size={16} />
          <span>
            <strong>{t('extras.dataUsage')}</strong>
            <small>
              {t('dataUsage.mobile')}: {formatBytes(getDataUsage().month.byNet.mobile.total)} · {t('dataUsage.wifi')}: {formatBytes(getDataUsage().month.byNet.wifi.total)}
            </small>
          </span>
        </button>
      </SettingsSection>

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
            if (!selected) return null
            const vars = variantsOf(modelOptions, selected)
            return (
              <div className="form-field">
                <span className="settings-model-selected">
                  {selected.modelName || selected.modelID} · {selected.providerName}
                </span>
                <ThinkingLevels base={selected} variants={vars} activeVariant={selectedVariant}
                  onChange={onChangeModel} />
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
              <input type="checkbox" className="switch-checkbox"
                checked={flags[key]}
                onChange={() => onToggleFlag(key)} />
            </label>
          ))}
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
                    <small className="subtle">{t('settings.blockedCount', { blocked: blockedCount, total })}</small>
                    <button type="button" className="btn-link" onClick={(e) => { e.stopPropagation(); blockedModels.toggleAllForProvider(providerID, !allBlocked) }}>
                      {allBlocked ? t('settings.blockedShowAll') : t('settings.blockedHideAll')}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="blocked-items">
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
                          aria-checked={!blocked}
                          role="switch">
                          <span className="switch-thumb" />
                        </button>
                      </label>
                    )
                  })}
                    </div>
                  )}
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

      {/* Prompt snippets */}
      <SettingsSection title={t('settings.snippets')}>
        <p className="subtle">{t('settings.snippetsDesc')}</p>
        <SnippetManager snippets={snippets} onAdd={onAddSnippet} onRemove={onRemoveSnippet} />
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
          <button type="button" className="btn-secondary extras-btn" onClick={() => setShowRestartConfirm(true)}>
            <RefreshIcon size={16} />
            <span>
              <strong>{t('extras.restartHost')}</strong>
              <small>{t('extras.restartHostDesc')}</small>
            </span>
          </button>
          <button type="button" className="btn-secondary extras-btn" onClick={onOpenGitHub}>
            <GithubIcon size={16} />
            <span>
              <strong>{t('extras.github')}</strong>
              <small>github.com/Owning01/Opencode-Mobile</small>
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

      <SettingsSection title={t('settings.desktopTitle')}>
        <p className="subtle">{t('settings.desktopHint')}</p>
        <div className="desktop-settings-grid">
          <label className="field-label">
            {t('settings.host')}
            <input
              type="text"
              value={desktopCfg.host}
              onChange={(e) => setDesktopCfg((c) => ({ ...c, host: e.target.value }))}
              placeholder="100.101.102.103"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </label>
          <label className="field-label">
            {t('settings.port')}
            <input
              type="number"
              value={desktopCfg.port}
              onChange={(e) => setDesktopCfg((c) => ({ ...c, port: Number(e.target.value) || 0 }))}
              placeholder="5901"
              inputMode="numeric"
            />
          </label>
          <label className="field-label">
            {t('settings.username')}
            <input
              type="text"
              value={desktopCfg.username}
              onChange={(e) => setDesktopCfg((c) => ({ ...c, username: e.target.value }))}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </label>
          <label className="field-label">
            {t('settings.password')}
            <div className="password-wrapper">
              <input
                type={showDesktopPass ? "text" : "password"}
                value={desktopCfg.password}
                onChange={(e) => setDesktopCfg((c) => ({ ...c, password: e.target.value }))}
              />
              <button type="button" className="btn-icon btn-ghost password-toggle" onClick={() => setShowDesktopPass((v) => !v)} tabIndex={-1}>
                {showDesktopPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
          </label>
        </div>
        <div className="settings-actions">
          <button
            type="button"
            className="btn-secondary compact"
            onClick={testDesktop}
            disabled={desktopTesting || !canTestDesktop(desktopCfg)}
          >
            {desktopTesting ? <LoadingIcon size={14} /> : <TestIcon size={14} />}
            {t('settings.desktopTest')}
          </button>
          {desktopSaved && <span className="desktop-saved-hint">{t('settings.desktopSaved')}</span>}
        </div>
        {desktopNotice && <p className={`desktop-settings-notice ${desktopNoticeType}`}>{desktopNotice}</p>}
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

      {showRestartConfirm && (
        <div className="modal-backdrop" onClick={() => setShowRestartConfirm(false)}>
          <div className="modal-card fade-in" role="dialog" aria-modal="true"
            onClick={(e) => e.stopPropagation()}>
            <h2>{t('extras.restartConfirmTitle')}</h2>
            <p>{t('extras.restartConfirmBody')}</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowRestartConfirm(false)}>
                {t('extras.restartCancel')}
              </button>
              <button className="btn-danger" onClick={() => { setShowRestartConfirm(false); onRestartHost() }}>
                <RefreshIcon size={16} />
                {t('extras.restartConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDataUsage && (
        <DataUsageModal
          onClose={() => setShowDataUsage(false)} />
      )}

      {showPairModal && (
        <PairModal
          onSave={(name, config) => {
            onAddPairServer(name, config)
            setShowPairModal(false)
          }}
          onClose={() => setShowPairModal(false)} />
      )}
    </section>
  )
})

export default SettingsPanel
