import { memo, useState, useCallback, useMemo, useEffect } from "react"
import { TestIcon, LoadingIcon, EyeIcon, EyeOffIcon, PlusIcon, TrashIcon, CheckIcon, RefreshIcon, PowerIcon, CloseIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { FeatureFlags, ServerConfig, ModelOption, NoticeType, DataMode, ViewType, ProviderInfo,
 ServerProfile, ChatSettings, PromptSnippet, AgentOption } from "../types"
import type { LanguageCode } from "../i18n"
import { describeProfile, isPairProfile } from "../hooks/useServers"
import { ProviderManager } from "./ProviderManager"
import { ChatCustomizer } from "./ChatCustomizer"
import { SnippetManager } from "./SnippetManager"
import { DataUsageModal } from "./DataUsageModal"
import { ThinkingLevels } from "./ThinkingLevels"
import { PairModal } from "./PairModal"
import { PluginSlot } from "../plugins"
import { LedSwitch } from "./LedSwitch"
import { WeatherSettings } from "./WeatherSettings"
import { ExportCacheButton } from "./ExportCacheButton"
import { desktopApi, loadDesktopConfig, saveDesktopConfig, canTestDesktop, type DesktopConfig } from "../desktop"
import { fetchGoUsage, loadGoAccounts, saveGoAccounts, type GoUsage } from "../goUsage"
import { variantsOf } from "../utils/model-utils"
import { useIsDesktop } from "../hooks/useIsDesktop"
import { useAutoOpencode2 } from "../hooks/useAutoOpencode2"
import { useSidebarPrefs, SIDEBAR_ITEM_IDS } from "../hooks/useSidebarPrefs"
import { STORAGE_KEYS } from "../constants"

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
 allPrimaryAgents?: AgentOption[]
 disabledAgents?: Record<string, boolean>
 onToggleAgentEnabled?: (agentId: string) => void
 onOpenFavoritesManager?: () => void
 onOpenArchivedView?: () => void
 onOpenShortcuts?: () => void
 onOpenOpenCodeHub?: () => void
 onClose?: () => void
}

export const SettingsPanel = memo(function SettingsPanel({
 draftConfig, onChange, onTest,
 testingConnection, canTestDraft, testAlreadyPassedForDraft,
 connectedVersion, settingsNotice, language, onLanguageChange,
 theme, onThemeChange, languageOptions,
 dataMode, onDataModeChange, onNavigate,
 modelOptions, selectedModelKey, onChangeModel, modelKey: mk,
 selectedVariant,
 allPrimaryAgents, disabledAgents, onToggleAgentEnabled,
 stats, onResetStats,
 activeModelOption: _activeModelOption, blockedModels, onOpenThemePicker,
 onOpenThemeCreator,
 flags, onToggleFlag, onSetFlag: _onSetFlag,
 providers, connectingProvider, providerError, onConnectProvider, onDisconnectProvider,
 serverProfiles, onAddServerProfile, onRemoveServerProfile, onUpdateServerProfile: _onUpdateServerProfile, onApplyServerProfile, onAddPairServer, activeServerProfileID,
 chatSettings, onChatSettingChange, onResetChatSettings,
 snippets, onAddSnippet, onRemoveSnippet,
 onShutdownHost, onRestartHost, onOpenGitHub, onOpenFavoritesManager: _onOpenFavoritesManager, onOpenArchivedView: _onOpenArchivedView, onOpenShortcuts, onOpenOpenCodeHub,
 onClose
}: SettingsPanelProps) {
 const t = useT()
 const isDesktop = useIsDesktop()
 const [showShutdownConfirm, setShowShutdownConfirm] = useState(false)
 const [showRestartConfirm, setShowRestartConfirm] = useState(false)
 const [showDataUsage, setShowDataUsage] = useState(false)
 const [showPairModal, setShowPairModal] = useState(false)
 const { enabled: autoOpencode2, setEnabled: setAutoOpencode2 } = useAutoOpencode2()
 const [autostartEnabled, setAutostartEnabled] = useState(false)
 const [startMinimized, setStartMinimized] = useState(false)
 const [minimizeToTray, setMinimizeToTray] = useState(false)
 useEffect(() => {
  if (!isDesktop) return
  import("../shell").then(({ shell }) => {
   shell.autostart.get().then((r) => setAutostartEnabled(!!r.enabled)).catch(() => {})
   shell.config.get().then((c) => {
    setStartMinimized(!!(c as any).start_minimized)
    setMinimizeToTray(!!(c as any).minimize_to_tray)
   }).catch(() => {})
  })
 }, [isDesktop])
 const { prefs: sidebarPrefs, setPosition: setSidebarPosition, toggleItem: toggleSidebarItem } = useSidebarPrefs()
 const [qcProvider, setQcProvider] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.QUICKCHAT_PROVIDER) || "groq")

 // ===== Remote desktop (agente en la PC, puerto default 5901) =====
 const [desktopCfg, setDesktopCfg] = useState<DesktopConfig>(() =>
  loadDesktopConfig() ?? { host: "", port: 5901, username: "opencode", password: "" }
 )
 const [desktopTesting, setDesktopTesting] = useState(false)
 const [desktopNotice, setDesktopNotice] = useState<string | null>(null)
 const [desktopNoticeType, setDesktopNoticeType] = useState<"ok" | "fail">("ok")
 const [showDesktopPass, setShowDesktopPass] = useState(false)
 const [showServerPass, setShowServerPass] = useState(false)
 const [desktopSaved, setDesktopSaved] = useState(false)

 // ===== OpenCode Go (uso vía API pública, varias cuentas) =====
 const [goKeys, setGoKeys] = useState<string[]>([])
 const [goEditing, setGoEditing] = useState<Record<number, boolean>>({})
 const [goUsageMap, setGoUsageMap] = useState<Record<string, GoUsage | null>>({})
 const [goLoadingMap, setGoLoadingMap] = useState<Record<string, boolean>>({})
 const [goErrorMap, setGoErrorMap] = useState<Record<string, string | null>>({})

 const checkGo = useCallback(async (key: string) => {
  const trimmed = key.trim()
  if (!trimmed) return
  const proxy = canTestDesktop(desktopCfg)
   ? { host: desktopCfg.host, port: desktopCfg.port, username: desktopCfg.username, password: desktopCfg.password }
   : undefined
  setGoLoadingMap((m) => ({ ...m, [trimmed]: true }))
  setGoErrorMap((m) => ({ ...m, [trimmed]: null }))
  try {
   const usage = await fetchGoUsage(trimmed, proxy)
   setGoUsageMap((m) => ({ ...m, [trimmed]: usage }))
  } catch (e: any) {
   setGoErrorMap((m) => ({ ...m, [trimmed]: e?.message ?? "Error de red" }))
  } finally {
   setGoLoadingMap((m) => ({ ...m, [trimmed]: false }))
  }
 }, [desktopCfg])

 const updateGoKey = useCallback((index: number, val: string) => {
  setGoKeys((ks) => {
   const next = [...ks]
   next[index] = val
   return next
  })
 }, [])

 const removeGoKey = useCallback((index: number) => {
  setGoKeys((ks) => ks.filter((_, i) => i !== index))
 }, [])

 useEffect(() => {
  loadGoAccounts().then((accounts) => {
   setGoKeys(accounts)
  }).catch(() => {})
 }, [])

 useEffect(() => {
  saveGoAccounts(goKeys).catch(() => {})
 }, [goKeys])

 const testDesktop = useCallback(async () => {
  setDesktopTesting(true)
  setDesktopNotice(null)
  setDesktopSaved(false)
  try {
   const ok = await desktopApi.health(desktopCfg)
   if (ok) {
    setDesktopNotice(t('settings.desktopOk', { os: "Remote Host", v: "1.0" }))
    setDesktopNoticeType("ok")
    saveDesktopConfig(desktopCfg)
    setDesktopSaved(true)
   } else {
    setDesktopNotice(t('settings.desktopFail', { err: "no responde" }))
    setDesktopNoticeType("fail")
   }
  } catch (e: any) {
   setDesktopNotice(t('settings.desktopFail', { err: e?.message || "error de red" }))
   setDesktopNoticeType("fail")
  } finally {
   setDesktopTesting(false)
  }
 }, [desktopCfg, t])

 useEffect(() => {
  if (!onClose) return
  const onKey = (e: KeyboardEvent) => {
   if (e.key === "Escape") onClose()
  }
  window.addEventListener("keydown", onKey)
  return () => window.removeEventListener("keydown", onKey)
 }, [onClose])

 const uniqueModels = useMemo(() => {
  return Array.from(new Map(modelOptions.map((opt) => [mk(opt), opt])).values())
 }, [modelOptions, mk])

 const [blockedSearch, setBlockedSearch] = useState("")
 const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set())
 const [draftProfile, setDraftProfile] = useState<{ name: string; config: ServerConfig } | null>(null)

 const startDraft = useCallback(() => {
  setDraftProfile({ name: "", config: { ...draftConfig } })
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

 type CategoryKey = "servers" | "system" | "appearance" | "models" | "chat" | "remote"
 const [activeCategory, setActiveCategory] = useState<CategoryKey>("servers")
 const [settingsSearch, setSettingsSearch] = useState("")

 const categories: Array<{ id: CategoryKey; label: string; subtitle: string }> = [
  { id: "servers", label: "General", subtitle: "Configure agent execution, queued message delivery, and permissions." },
  { id: "system", label: "Application", subtitle: "Configure application startup, feature flags, sidebar layout, and system tools." },
  { id: "appearance", label: "Appearance", subtitle: "Customize interface themes, font size, language, and default model selection." },
  { id: "models", label: "Models", subtitle: "Configure AI providers, quick chat shortcuts, primary agents, and API keys." },
  { id: "chat", label: "Customizations", subtitle: "Fine-tune chat parameters, thinking behavior, system prompts, and snippets." },
  { id: "remote", label: "Browser", subtitle: "Configure and connect to the remote host desktop agent and browser tools." },
 ]

 const currentCategoryInfo = categories.find((c) => c.id === activeCategory) || categories[0]

 const isSearching = settingsSearch.trim().length > 0
 const showServers = !isDesktop || isSearching || activeCategory === "servers"
 const showModels = !isDesktop || isSearching || activeCategory === "models"
 const showAppearance = !isDesktop || isSearching || activeCategory === "appearance"
 const showChat = !isDesktop || isSearching || activeCategory === "chat"
 const showRemote = !isDesktop || isSearching || activeCategory === "remote"
 const showSystem = !isDesktop || isSearching || activeCategory === "system"

 const panelContent = (
  <section className="panel settings fade-in">
   <div className={isDesktop ? "settings-split-container" : "settings-mobile-container"}>
    {isDesktop && (
     <nav className="settings-sidebar-nav" aria-label="Categorías de ajustes">
      <p className="settings-sidebar-group-title">Settings</p>
      <div className="settings-sidebar-section">
       {categories.map((cat) => (
        <button
         key={cat.id}
         type="button"
         className={`settings-nav-btn${activeCategory === cat.id && !isSearching ? " active" : ""}`}
         onClick={() => {
          setActiveCategory(cat.id)
          setSettingsSearch("")
         }}
        >
         <span className="settings-nav-label">{cat.label}</span>
        </button>
       ))}
      </div>

      <p className="settings-sidebar-group-title">Projects</p>
      <div className="settings-sidebar-section">
       {serverProfiles.length > 0 ? (
        serverProfiles.map((p) => (
         <button
          key={p.id}
          type="button"
          className={`settings-nav-btn${activeServerProfileID === p.id ? " active" : ""}`}
          onClick={() => onApplyServerProfile(p)}
          title={p.name}
         >
          <span className="settings-nav-label">{p.name}</span>
         </button>
        ))
       ) : (
        <>
         <button type="button" className="settings-nav-btn" onClick={() => setActiveCategory("servers")}>
          <span className="settings-nav-label">{draftConfig.host ? draftConfig.host : "opencode-remote-android"}</span>
         </button>
        </>
       )}
      </div>

      <p className="settings-sidebar-group-title">Not in Project</p>
      <div className="settings-sidebar-section">
       <button
        type="button"
        className="settings-nav-btn"
        onClick={() => onNavigate("sessions")}
       >
        <span className="settings-nav-label">Conversations</span>
       </button>
      </div>

      <div className="settings-sidebar-footer">
       {onOpenShortcuts && (
        <button type="button" className="settings-nav-btn" onClick={onOpenShortcuts}>
         <span className="settings-nav-label">Shortcuts</span>
        </button>
       )}
       <button type="button" className="settings-nav-btn" onClick={onOpenGitHub}>
        <span className="settings-nav-label">Provide Feedback</span>
       </button>

       <div
        className="settings-sidebar-user-card"
        onClick={() => setActiveCategory("servers")}
        title={draftConfig.host ? `${draftConfig.username || "user"}@${draftConfig.host}:${draftConfig.port}` : "Usuario OpenCode"}
       >
        <div className="settings-sidebar-user-avatar">
         ⬡
        </div>
        <div className="settings-sidebar-user-info">
         <span className="settings-sidebar-user-name">
          {draftConfig.username || "Octavio Gonzalez"}
         </span>
         <span className="settings-sidebar-user-email">
          {draftConfig.host ? `${draftConfig.username || "user"}@${draftConfig.host}` : "percatorone@gmail.com"}
         </span>
        </div>
       </div>
      </div>
     </nav>
    )}

    <div className="settings-content-pane">
     {/* Header inside the content pane */}
     <div className="settings-pane-header">
      <div className="settings-pane-title-group">
       <h2 className="settings-pane-title">
        {isSearching ? t('sessions.searchPlaceholder') : currentCategoryInfo.label}
       </h2>
       <p className="settings-pane-subtitle">
        {isSearching
         ? `${t('settings.draftHint')}`
         : currentCategoryInfo.subtitle}
       </p>
      </div>

      {onClose && (
       <button
        type="button"
        className="settings-close-x-btn"
        onClick={onClose}
        title={t('panel.close') || "Cerrar"}
        aria-label={t('panel.close') || "Cerrar"}
       >
        <CloseIcon size={14} />
       </button>
      )}
     </div>

     <p className="subtle" style={{ margin: "0 0 var(--space-2) 0", display: "none" }}>{t('settings.draftHint')}</p>

     {/* Notice */}
     {settingsNotice && (
      <div className={`notice ${settingsNotice.type} fade-in`}>
       {settingsNotice.type === 'success' && ' '}
       {settingsNotice.type === 'error' && ' '}
       {settingsNotice.type === 'info' && 'ℹ '}
       <span style={{ whiteSpace: "pre-line" }}>{settingsNotice.text}</span>
      </div>
     )}

     {connectedVersion && testAlreadyPassedForDraft && (
      <div className="notice success fade-in">
       {t('settings.connectedTo', { version: connectedVersion })}
      </div>
     )}

     {/* ===== GENERAL TAB (EXACT ANTIGRAVITY SECTIONS) ===== */}
     {showServers && (
      <>
       <p className="settings-group-heading">Server & Data Connection</p>
       <div className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">Conexión Activa</span>
         <p className="setting-item-desc">
          {draftConfig.host && draftConfig.port > 0 ? `${draftConfig.host}:${draftConfig.port}` : t('settings.hostPlaceholder')}
         </p>
         <span className="setting-item-link">{t('settings.draftHint')}</span>
        </div>
        <div className="setting-item-control">
         <button
          type="button"
          onClick={onTest}
          className="ag-btn-open settings-test-btn"
          disabled={testingConnection || !canTestDraft}
          title={!canTestDraft ? t('settings.testNeedsFields') : testAlreadyPassedForDraft ? t('settings.testAgainTitle') : undefined}
         >
          {testingConnection ? t('settings.testing') : testAlreadyPassedForDraft ? t('settings.testAgain') : t('settings.test')}
         </button>
        </div>
       </div>

       <div className="form-grid" style={{ marginBottom: 12 }}>
        <label className="form-field">
         <span>{t('settings.host')}</span>
         <input name="host" value={draftConfig.host} onChange={(e) => setField("host", e.target.value)} placeholder={t('settings.hostPlaceholder')} inputMode="text" autoCapitalize="off" autoCorrect="off" />
        </label>
        <label className="form-field">
         <span>{t('settings.port')}</span>
         <input name="port" type="number" value={draftConfig.port || 4096} onChange={(e) => setField("port", Number(e.target.value || 4096))} placeholder="4096" inputMode="numeric" />
        </label>
        <label className="form-field">
         <span>{t('settings.username')}</span>
         <input name="username" value={draftConfig.username} onChange={(e) => setField("username", e.target.value)} placeholder="opencode" autoCapitalize="off" autoCorrect="off" />
        </label>
        <label className="form-field">
         <span>{t('settings.password')}</span>
         <div className="password-wrapper" style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input name="password" type={showServerPass ? "text" : "password"} value={draftConfig.password} onChange={(e) => setField("password", e.target.value)} placeholder="••••••••" style={{ flex: 1 }} />
          <button type="button" className="btn-icon btn-ghost password-toggle" onClick={() => setShowServerPass((v) => !v)} tabIndex={-1} aria-label={showServerPass ? "Ocultar" : "Mostrar"}>
           {showServerPass ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
          </button>
         </div>
        </label>
       </div>

       <div className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">{t('settings.apiVersion')}</span>
         <p className="setting-item-desc">{t('settings.apiVersionDesc')}</p>
        </div>
        <div className="setting-item-control">
         <select
          name="apiVersion"
          className="ag-select"
          value={draftConfig.apiVersion ?? "auto"}
          onChange={(e) => setField("apiVersion", e.target.value as "auto" | "v1" | "v2")}
         >
          <option value="auto">{t('settings.apiVersionAuto')}</option>
          <option value="v1">{t('settings.apiVersionV1')}</option>
          <option value="v2">{t('settings.apiVersionV2')}</option>
         </select>
        </div>
       </div>

       <div className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">{t('settings.dataModeTitle')}</span>
         <p className="setting-item-desc">{t('settings.dataModeDesc')}</p>
        </div>
        <div className="setting-item-control">
         <div className="ag-segmented">
          {dataModes.map((opt) => (
           <button
            key={opt.value}
            type="button"
            className={`ag-segmented-btn${dataMode === opt.value ? " active" : ""}`}
            onClick={() => onDataModeChange(opt.value)}
           >
            {opt.label}
           </button>
          ))}
         </div>
        </div>
       </div>

       <div className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">{t('settings.pairTitle')}</span>
         <p className="setting-item-desc">Empareja tu dispositivo escaneando el código QR generado por opencode serve.</p>
        </div>
        <div className="setting-item-control">
         <button type="button" className="ag-btn-open" onClick={() => setShowPairModal(true)}>
          {t('settings.pairScanQr')}
         </button>
        </div>
       </div>

       <div className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">{t('settings.sectionServers')}</span>
         <p className="setting-item-desc">Gestiona múltiples perfiles de conexión HTTP o servidores emparejados.</p>
        </div>
        <div className="setting-item-control">
         <button type="button" className="ag-btn-open" onClick={() => startDraft()}>
          {t('settings.serverAdd')}
         </button>
        </div>
       </div>

       {draftProfile && (
        <div className="setting-item-row" style={{ flexDirection: "column", alignItems: "stretch", background: "#18181c", border: "1px dashed #38383e" }}>
         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="setting-item-title">{t('settings.serverAdd')} (Nuevo Perfil)</span>
          <button type="button" className="btn-icon btn-ghost" onClick={discardDraft}>
           <TrashIcon size={14} />
          </button>
         </div>
         <div className="form-grid" style={{ marginTop: 10 }}>
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
           <input name="username" value={draftProfile.config.username} onChange={(e) => draftField("username", e.target.value)} placeholder="opencode" autoCapitalize="off" autoCorrect="off" />
          </label>
          <label className="form-field">
           <span>{t('settings.password')}</span>
           <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input name="password" type={showServerPass ? "text" : "password"} value={draftProfile.config.password} onChange={(e) => draftField("password", e.target.value)} placeholder="••••••••" style={{ flex: 1 }} />
            <button type="button" className="btn-icon btn-ghost password-toggle" onClick={() => setShowServerPass((v) => !v)} tabIndex={-1}>
             {showServerPass ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
            </button>
           </div>
          </label>
         </div>
         <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button type="button" className="ag-btn-open" onClick={saveDraft} disabled={!draftProfile.config.host.trim() || draftProfile.config.port <= 0}>
           {t('settings.serverAdd')}
          </button>
          <button type="button" className="ag-btn-open" onClick={connectDraft} disabled={!draftProfile.config.host.trim() || draftProfile.config.port <= 0}>
           {t('settings.serverAddAndConnect')}
          </button>
         </div>
        </div>
       )}

       {serverProfiles.filter((p): p is ServerProfile => !!p && !!p.config).map((profile) => (
        <div key={profile.id} className="setting-item-row">
         <div className="setting-item-info">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
           <span className={`server-profile-kind${isPairProfile(profile) ? " pair" : " http"}`}>
            {isPairProfile(profile) ? t('settings.pairKind') : "HTTP"}
           </span>
           <span className="setting-item-title">{profile.name}</span>
          </div>
          <p className="setting-item-desc">{describeProfile(profile)}</p>
         </div>
         <div className="setting-item-control">
          {activeServerProfileID === profile.id ? (
           <span className="server-profile-active"><CheckIcon size={12} /> {t('settings.serverActive')}</span>
          ) : (
           <button type="button" className="ag-btn-open" onClick={() => onApplyServerProfile(profile)}>
            {t('settings.serverUse')}
           </button>
          )}
          <button type="button" className="btn-icon btn-ghost" onClick={() => onRemoveServerProfile(profile.id)}>
           <TrashIcon size={14} />
          </button>
         </div>
        </div>
       ))}
      </>
     )}
   {/* Preferences / Appearance */}
   {showAppearance && (
    <>
     <p className="settings-group-heading">Appearance & Interface</p>
     <div className="setting-item-row">
      <div className="setting-item-info">
       <span className="setting-item-title">{t('settings.language')}</span>
       <p className="setting-item-desc">Selecciona el idioma principal de la aplicación.</p>
      </div>
      <div className="setting-item-control">
       <select
        className="ag-select"
        name="language"
        value={language}
        onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
       >
        {languageOptions.map((option) => (
         <option key={option.code} value={option.code}>{option.label}</option>
        ))}
       </select>
      </div>
     </div>

     <div className="setting-item-row">
      <div className="setting-item-info">
       <span className="setting-item-title">{t('settings.theme')}</span>
       <p className="setting-item-desc">Modo visual (sistema, claro, oscuro o programado).</p>
      </div>
      <div className="setting-item-control">
       <select
        className="ag-select"
        name="theme"
        value={theme}
        onChange={(e) => onThemeChange(e.target.value as "system" | "light" | "dark" | "scheduled")}
       >
        <option value="system">{t('settings.themeSystem')}</option>
        <option value="light">{t('settings.themeLight')}</option>
        <option value="dark">{t('settings.themeDark')}</option>
        <option value="scheduled">{t('settings.themeScheduled')}</option>
       </select>
      </div>
     </div>

     <WeatherSettings />

     {onOpenThemePicker && (
      <div className="setting-item-row">
       <div className="setting-item-info">
        <span className="setting-item-title">{t('settings.visualTheme')}</span>
        <p className="setting-item-desc">Explora y activa paletas de temas visuales predefinidos.</p>
       </div>
       <div className="setting-item-control">
        <button type="button" className="ag-btn-open" onClick={onOpenThemePicker}>
         {t('settings.switchTheme')} (33 temas)
        </button>
        {onOpenThemeCreator && (
         <button type="button" className="ag-btn-open" onClick={onOpenThemeCreator}>
          {t('session.themeCreator')}
         </button>
        )}
       </div>
      </div>
     )}

     <div className="setting-item-row">
      <div className="setting-item-info">
       <span className="setting-item-title">{t('settings.defaultModel')}</span>
       <p className="setting-item-desc">Modelo de lenguaje predeterminado para nuevas conversaciones.</p>
      </div>
      <div className="setting-item-control">
       <select
        className="ag-select"
        value={selectedModelKey || ""}
        onChange={(e) => onChangeModel(e.target.value)}
       >
        {uniqueModels.map((opt) => (
         <option key={mk(opt)} value={mk(opt)}>
          {opt.modelName || opt.modelID} ({opt.providerName})
         </option>
        ))}
       </select>
      </div>
     </div>

     {(() => {
      if (!selectedModelKey) return null
      const selected = uniqueModels.find((opt) => mk(opt) === selectedModelKey)
      if (!selected) return null
      const vars = variantsOf(modelOptions, selected)
      if (vars.length <= 1) return null
      return (
       <div className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">Nivel de Pensamiento (Thinking)</span>
         <p className="setting-item-desc">{selected.modelName || selected.modelID} · {selected.providerName}</p>
        </div>
        <div className="setting-item-control">
         <ThinkingLevels base={selected} variants={vars} activeVariant={selectedVariant} onChange={onChangeModel} hideLabel />
        </div>
       </div>
      )
     })()}
    </>
   )}

   {/* Application Tab */}
   {showSystem && (
    <>
     <p className="settings-group-heading">Startup & Environment</p>
     {isDesktop && (
      <>
       <div className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">Iniciar con Windows</span>
         <p className="setting-item-desc">Abre OpenHer automáticamente al iniciar sesión (registro HKCU\Run).</p>
        </div>
        <div className="setting-item-control">
         <button
          type="button"
          className={`switch-track compact${autostartEnabled ? " active" : ""}`}
          role="switch"
          aria-checked={autostartEnabled}
          onClick={async () => {
           const next = !autostartEnabled
           try {
            const { shell } = await import("../shell")
            await shell.autostart.set(next)
            setAutostartEnabled(next)
           } catch {}
          }}
         >
          <span className="switch-thumb" />
         </button>
        </div>
       </div>
       <div className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">Iniciar minimizado</span>
         <p className="setting-item-desc">Al arrancar (autostart o manual) queda en la bandeja sin abrir ventana.</p>
        </div>
        <div className="setting-item-control">
         <button
          type="button"
          className={`switch-track compact${startMinimized ? " active" : ""}`}
          role="switch"
          aria-checked={startMinimized}
          onClick={async () => {
           const next = !startMinimized
           try {
            const { shell } = await import("../shell")
            await shell.config.patch({ start_minimized: next } as any)
            setStartMinimized(next)
           } catch {}
          }}
         >
          <span className="switch-thumb" />
         </button>
        </div>
       </div>
       <div className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">Minimizar a la bandeja</span>
         <p className="setting-item-desc">Apagado: minimizar va a la barra de tareas. Encendido: se oculta a los iconos chiquitos. Rige tras reiniciar.</p>
        </div>
        <div className="setting-item-control">
         <LedSwitch
          label="Minimizar a la bandeja"
          checked={minimizeToTray}
          onChange={async (next) => {
           try {
            const { shell } = await import("../shell")
            await shell.config.patch({ minimize_to_tray: next } as any)
            setMinimizeToTray(next)
           } catch {}
          }}
         />
        </div>
       </div>
      </>
     )}
     <div className="setting-item-row">
      <div className="setting-item-info">
       <span className="setting-item-title">Abrir opencode2 automáticamente</span>
       <p className="setting-item-desc">Al iniciar la app de escritorio abre la terminal inferior ejecutando <code>opencode2</code> (visible en la app, no consola externa).</p>
      </div>
      <div className="setting-item-control">
       <button
        type="button"
        className={`switch-track compact${autoOpencode2 ? " active" : ""}`}
        role="switch"
        aria-checked={autoOpencode2}
        onClick={() => setAutoOpencode2(!autoOpencode2)}
       >
        <span className="switch-thumb" />
       </button>
      </div>
     </div>

     <p className="settings-group-heading">Navigation & Interface</p>
     <div className="setting-item-row">
      <div className="setting-item-info">
       <span className="setting-item-title">Posición de Barra Lateral</span>
       <p className="setting-item-desc">Ubicación de la barra de navegación en pantalla.</p>
      </div>
      <div className="setting-item-control">
       <div className="ag-segmented">
        {(["left", "top", "right"] as const).map((p) => (
         <button
          key={p}
          type="button"
          className={`ag-segmented-btn${sidebarPrefs.position === p ? " active" : ""}`}
          onClick={() => setSidebarPosition(p)}
         >
          {t(`settings.pos_${p}`)}
         </button>
        ))}
       </div>
      </div>
     </div>

     {SIDEBAR_ITEM_IDS.map((id) => {
      const visible = !sidebarPrefs.hidden.includes(id)
      return (
       <div key={id} className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">{t(`settings.sb_${id}`)}</span>
         <p className="setting-item-desc">Mostrar botón en la barra lateral.</p>
        </div>
        <div className="setting-item-control">
         <button
          type="button"
          className={`switch-track compact${visible ? " active" : ""}`}
          role="switch"
          aria-checked={visible}
          onClick={() => toggleSidebarItem(id)}
         >
          <span className="switch-thumb" />
         </button>
        </div>
       </div>
      )
     })}

     <p className="settings-group-heading">Feature Flags (Funciones Experimentales)</p>
     {featureFlags.map(({ key, label, desc }) => (
      <div key={key} className="setting-item-row">
       <div className="setting-item-info">
        <span className="setting-item-title">{label}</span>
        <p className="setting-item-desc">{desc}</p>
       </div>
       <div className="setting-item-control">
        <button
         type="button"
         className={`switch-track compact${flags[key] ? " active" : ""}`}
         role="switch"
         aria-checked={flags[key]}
         onClick={() => onToggleFlag(key)}
        >
         <span className="switch-thumb" />
        </button>
       </div>
      </div>
     ))}

     {isDesktop && onOpenOpenCodeHub && (
      <>
       <p className="settings-group-heading">OpenCode Hub</p>
       <div className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">OpenCode Hub Oficial</span>
         <p className="setting-item-desc">Visualiza los prompts de sistema de tus agentes, catálogo de skills y opencode.json global.</p>
        </div>
        <div className="setting-item-control">
         <button type="button" className="ag-btn-open" onClick={onOpenOpenCodeHub}>
          Abrir Hub →
         </button>
        </div>
       </div>
      </>
     )}

     <p className="settings-group-heading">Host Control & Maintenance</p>
     <div className="setting-item-row">
      <div className="setting-item-info">
       <span className="setting-item-title">{t('extras.restartHost')}</span>
       <p className="setting-item-desc">{t('extras.restartHostDesc')}</p>
      </div>
      <div className="setting-item-control">
       <button type="button" className="ag-btn-open" onClick={() => setShowRestartConfirm(true)}>
        <span style={{ display: "inline-flex", marginRight: 6 }}><RefreshIcon size={14} /></span>
        {t('extras.restartHost')}
       </button>
      </div>
     </div>

     <div className="setting-item-row">
      <div className="setting-item-info">
       <span className="setting-item-title">{t('extras.shutdownHost')}</span>
       <p className="setting-item-desc">{t('extras.shutdownHostDesc')}</p>
      </div>
      <div className="setting-item-control">
       <button type="button" className="ag-btn-open" onClick={() => setShowShutdownConfirm(true)}>
        {t('extras.shutdownHost')}
       </button>
      </div>
     </div>

     <div className="setting-item-row">
      <div className="setting-item-info">
       <span className="setting-item-title">Exportar chats guardados (.md)</span>
       <p className="setting-item-desc">Descarga todos los mensajes del cache local en un único archivo Markdown.</p>
      </div>
      <div className="setting-item-control">
       <ExportCacheButton small label="Exportar .md" />
      </div>
     </div>

     <div className="setting-item-row">
      <div className="setting-item-info">
       <span className="setting-item-title">{t('settings.stats')}</span>
       <p className="setting-item-desc">{stats.promptsSent} prompts enviados · {stats.sessionsCreated} sesiones creadas.</p>
      </div>
      <div className="setting-item-control">
       <button type="button" className="ag-btn-open" onClick={onResetStats}>
        {t('settings.resetStats')}
       </button>
      </div>
     </div>
    </>
   )}

   {/* Models Tab */}
   {showModels && (
    <>
     <p className="settings-group-heading">AI Providers</p>
     <div className="setting-item-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <ProviderManager
       providers={providers}
       connecting={connectingProvider}
       error={providerError}
       onConnect={onConnectProvider}
       onDisconnect={onDisconnectProvider}
      />
     </div>

     <p className="settings-group-heading">Quick Chat</p>
     <div className="setting-item-row">
      <div className="setting-item-info">
       <span className="setting-item-title">Proveedor Quick Chat</span>
       <p className="setting-item-desc">Modelo rápido para consultas instantáneas.</p>
      </div>
      <div className="setting-item-control">
       <select
        className="ag-select"
        value={qcProvider}
        onChange={e => {
         setQcProvider(e.target.value)
         localStorage.setItem(STORAGE_KEYS.QUICKCHAT_PROVIDER, e.target.value)
        }}
       >
        <option value="groq">{t('quickchat.providerGroq')} (Ultra Rápido)</option>
        <option value="cerebras">{t('quickchat.providerCerebras')}</option>
        <option value="custom">{t('quickchat.providerCustom')}</option>
        {providers.filter(p => p.connected && p.id !== "groq" && p.id !== "cerebras" && p.id !== "custom").map(p => (
         <option key={p.id} value={p.id}>{p.name}</option>
        ))}
       </select>
      </div>
     </div>

     {allPrimaryAgents && allPrimaryAgents.length > 0 && (
      <>
       <p className="settings-group-heading">Agentes Principales</p>
       {allPrimaryAgents.map((agent) => {
        const isDisabled = !!disabledAgents?.[agent.id]
        return (
         <div key={agent.id} className="setting-item-row">
          <div className="setting-item-info">
           <span className="setting-item-title">{agent.name || agent.id}</span>
           <p className="setting-item-desc">{agent.description || `Agente ${agent.id}`}</p>
          </div>
          <div className="setting-item-control">
           <button
            type="button"
            className={`switch-track compact${!isDisabled ? " active" : ""}`}
            role="switch"
            aria-checked={!isDisabled}
            onClick={() => onToggleAgentEnabled?.(agent.id)}
           >
            <span className="switch-thumb" />
           </button>
          </div>
         </div>
        )
       })}
      </>
     )}

     <p className="settings-group-heading">{t('settings.blockedModels')}</p>
     <div className="setting-item-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div className="blocked-search" style={{ marginBottom: 12 }}>
       <input
        placeholder={t('settings.blockedModelsSearch')}
        value={blockedSearch}
        onChange={(e) => setBlockedSearch(e.target.value)}
        className="settings-search-input"
       />
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
        <div key={providerID} className="blocked-group" style={{ marginBottom: 8 }}>
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
              <button
               type="button"
               className={`switch-track compact${blocked ? "" : " active"}`}
               onClick={() => blockedModels.toggleBlocked(key)}
               aria-checked={!blocked}
               role="switch"
              >
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
     </div>

     <p className="settings-group-heading">{t('settings.goTitle')}</p>
     {goKeys.map((key, i) => {
      const trimmed = key.trim()
      const usage = trimmed ? goUsageMap[trimmed] : null
      const loading = trimmed ? goLoadingMap[trimmed] : false
      const error = trimmed ? goErrorMap[trimmed] : null
      return (
       <div key={i} className="setting-item-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
         <span className="setting-item-title">{t('settings.goAccount')} {i + 1}</span>
         <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="ag-btn-open" onClick={() => void checkGo(key)} disabled={loading || !trimmed}>
           {loading ? <LoadingIcon size={14} /> : "Verificar"}
          </button>
          <button type="button" className="btn-icon btn-ghost" onClick={() => removeGoKey(i)}>
           <TrashIcon size={14} />
          </button>
         </div>
        </div>
        <input
         type="password"
         value={goEditing[i] ? key : (key ? "••••••••" : "")}
         onChange={(e) => updateGoKey(i, e.target.value)}
         onFocus={() => setGoEditing((m) => ({ ...m, [i]: true }))}
         onBlur={() => setGoEditing((m) => ({ ...m, [i]: false }))}
         placeholder={t('settings.goApiKeyPlaceholder')}
         className="settings-search-input"
         style={{ marginTop: 8 }}
        />
        {error && <p className="desktop-settings-notice fail" style={{ marginTop: 6 }}>{error}</p>}
        {usage && (
         <div className="go-usage" style={{ marginTop: 8 }}>
          {(["rolling", "weekly", "monthly"] as const).map((k) => {
           const period = usage[k]
           if (!period) return null
           const pct = Math.min(100, Math.max(0, period.percent))
           const tone = pct >= 80 ? "danger" : pct >= 50 ? "warning" : "ok"
           return (
            <div key={k} className="go-period">
             <div className="go-period-head">
              <span className="go-period-label">{t(`settings.goPeriod_${k}`)}</span>
              <span className="go-period-pct">{period.percent}%</span>
             </div>
             <div className="go-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t(`settings.goPeriod_${k}`)}>
              <div className={`go-bar-fill ${tone}`} style={{ width: `${pct}%` }} />
             </div>
            </div>
           )
          })}
         </div>
        )}
       </div>
      )
     })}
     <div style={{ marginTop: 8 }}>
      <button type="button" className="ag-btn-open" onClick={() => setGoKeys((ks) => [...ks, ""])}>
       <span style={{ display: "inline-flex", marginRight: 6 }}><PlusIcon size={14} /></span>
       {t('settings.goAddAccount')}
      </button>
     </div>
    </>
   )}

   {/* Customizations Tab */}
   {showChat && (
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
   )}

   {/* Browser / Remote Desktop Tab */}
   {showRemote && (
    <>
     <p className="settings-group-heading">{t('settings.desktopTitle')}</p>
     <div className="setting-item-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <p className="setting-item-desc" style={{ marginBottom: 12 }}>{t('settings.desktopHint')}</p>
      <div className="desktop-settings-grid">
       <label className="field-label">
        {t('settings.host')}
        <input
         type="text"
         value={desktopCfg.host}
         onChange={(e) => setDesktopCfg((c) => ({ ...c, host: e.target.value }))}
         placeholder="100.101.102.103"
         className="settings-search-input"
        />
       </label>
       <label className="field-label">
        {t('settings.port')}
        <input
         type="number"
         value={desktopCfg.port}
         onChange={(e) => setDesktopCfg((c) => ({ ...c, port: Number(e.target.value) || 0 }))}
         placeholder="5901"
         className="settings-search-input"
        />
       </label>
       <label className="field-label">
        {t('settings.username')}
        <input
         type="text"
         value={desktopCfg.username}
         onChange={(e) => setDesktopCfg((c) => ({ ...c, username: e.target.value }))}
         className="settings-search-input"
        />
       </label>
       <label className="field-label">
        {t('settings.password')}
        <div className="password-wrapper">
         <input
          type={showDesktopPass ? "text" : "password"}
          value={desktopCfg.password}
          onChange={(e) => setDesktopCfg((c) => ({ ...c, password: e.target.value }))}
          className="settings-search-input"
         />
         <button type="button" className="btn-icon btn-ghost password-toggle" onClick={() => setShowDesktopPass((v) => !v)} tabIndex={-1}>
          {showDesktopPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
         </button>
        </div>
       </label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
       <button
        type="button"
        className="ag-btn-open"
        onClick={testDesktop}
        disabled={desktopTesting || !canTestDesktop(desktopCfg)}
       >
        {desktopTesting ? <LoadingIcon size={14} /> : <span style={{ display: "inline-flex", marginRight: 6 }}><TestIcon size={14} /></span>}
        {t('settings.desktopTest')}
       </button>
       {desktopSaved && <span className="desktop-saved-hint">{t('settings.desktopSaved')}</span>}
      </div>
      {desktopNotice && <p className={`desktop-settings-notice ${desktopNoticeType}`} style={{ marginTop: 8 }}>{desktopNotice}</p>}
     </div>
    </>
   )}

   {/* Slots de plugins (secciones adicionales) */}
   <PluginSlot id="settings.section" />
    </div>
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

 if (onClose) {
  return (
   <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content settings-modal-window" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t('nav.settings') || "Configuración"}>
     <div className="settings-modal-body">
      {panelContent}
     </div>
    </div>
   </div>
  )
 }

 return panelContent
})

export default SettingsPanel

