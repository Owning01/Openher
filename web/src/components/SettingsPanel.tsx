import { memo, useState, useEffect } from "react"
import { EyeIcon, EyeOffIcon, TrashIcon, CheckIcon, RefreshIcon, PowerIcon, CloseIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { FeatureFlags, ServerConfig, ModelOption, NoticeType, DataMode, ViewType, ProviderInfo,
 ServerProfile, ChatSettings, PromptSnippet, AgentOption } from "../types"
import type { LanguageCode } from "../i18n"
import { describeProfile, isPairProfile } from "../hooks/useServers"
import { DefaultModelPicker } from "./DefaultModelPicker"
import { Modal } from "./Modal"
import { PairModal } from "./PairModal"
import { PluginSlot } from "../plugins"
import { LedSwitch } from "./LedSwitch"
import { Opencode2Button } from "../features/opencode2/Opencode2Button"
import { ExportCacheButton } from "./ExportCacheButton"
import { variantsOf } from "../utils/model-utils"
import { useIsDesktop } from "../hooks/useIsDesktop"
import { useAutoOpencode2 } from "../hooks/useAutoOpencode2"
import { useSidebarPrefs } from "../hooks/useSidebarPrefs"
import { BuildStamp } from "./BuildStamp"
import { shell } from "../shell"
import { CATEGORIES, buildDataModes, type CategoryKey } from "../features/settings/constants"
import { ConfirmDialog } from "../features/settings/ConfirmDialog"
import type { BlockedModelsApi } from "../features/settings/types"
import { useSettingsDraft } from "../features/settings/useSettingsDraft"
import { useRemoteDesktopConfig } from "../features/settings/useRemoteDesktopConfig"
import { ModelsSection } from "../features/settings/sections/ModelsSection"
import { CustomizationsSection } from "../features/settings/sections/CustomizationsSection"
import { BrowserSection } from "../features/settings/sections/BrowserSection"
import { AppearanceSection } from "../features/settings/sections/AppearanceSection"
import { SidebarSection } from "../features/settings/sections/SidebarSection"
import { FeatureFlagsSection } from "../features/settings/sections/FeatureFlagsSection"
import { AutomationsSection } from "../features/settings/sections/AutomationsSection"
import { RunsSection } from "../features/settings/sections/RunsSection"

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
 activeModelOption: ModelOption | null
 blockedModels: BlockedModelsApi
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
 const [showPairModal, setShowPairModal] = useState(false)
 const { enabled: autoOpencode2, setEnabled: setAutoOpencode2 } = useAutoOpencode2()
 const [autostartEnabled, setAutostartEnabled] = useState(false)
 const [startMinimized, setStartMinimized] = useState(false)
 const [minimizeToTray, setMinimizeToTray] = useState(false)
 useEffect(() => {
  if (!isDesktop) return
  shell.autostart.get().then((r) => setAutostartEnabled(!!r.enabled)).catch(() => {})
  shell.config.get().then((c) => {
   setStartMinimized(!!(c as any).start_minimized)
   setMinimizeToTray(!!(c as any).minimize_to_tray)
  }).catch(() => {})
 }, [isDesktop])
 const { prefs: sidebarPrefs, setPosition: setSidebarPosition, toggleItem: toggleSidebarItem } = useSidebarPrefs()

 // ===== Remote desktop (agente en la PC, puerto default 5901) =====
 const remote = useRemoteDesktopConfig()

 // ===== Perfil de conexión en borrador, modelos únicos y contraseña =====
 const { uniqueModels, draftProfile, startDraft, draftField, saveDraft, connectDraft, setDraftName, discardDraft, showServerPass, toggleServerPass, setField } =
  useSettingsDraft({ draftConfig, onChange, mk, modelOptions, onAddServerProfile, onApplyServerProfile })

 const dataModes = buildDataModes(t)

 const [activeCategory, setActiveCategory] = useState<CategoryKey>("servers")

 // Variantes del modelo seleccionado para el selector de nivel de pensamiento.
 // Se derivan aquí (el contenedor es dueño del modelo) y AppearanceSection pinta.
 const selected = uniqueModels.find((opt) => mk(opt) === selectedModelKey)
 const thinkingVariants = selectedModelKey && selected ? variantsOf(modelOptions, selected) : []

 const currentCategoryInfo = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0]

 const showServers = !isDesktop || activeCategory === "servers"
 const showModels = !isDesktop || activeCategory === "models"
 const showAppearance = !isDesktop || activeCategory === "appearance"
 const showChat = !isDesktop || activeCategory === "chat"
 const showRemote = !isDesktop || activeCategory === "remote"
 const showSystem = !isDesktop || activeCategory === "system"

 const panelContent = (
  <section className="panel settings fade-in">
   <div className={isDesktop ? "settings-split-container" : "settings-mobile-container"}>
    {isDesktop && (
     <nav className="settings-sidebar-nav" aria-label="Categorías de ajustes">
      <p className="settings-sidebar-group-title">Settings</p>
      <div className="settings-sidebar-section">
       {CATEGORIES.map((cat) => (
        <button
         key={cat.id}
         type="button"
         className={`settings-nav-btn${activeCategory === cat.id ? " active" : ""}`}
         onClick={() => setActiveCategory(cat.id)}
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
          <span className="settings-nav-label">{draftConfig.host ? draftConfig.host : "openher"}</span>
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
       <BuildStamp />

       <div
        className="settings-sidebar-user-card"
        onClick={() => setActiveCategory("servers")}
        title={draftConfig.host ? `${draftConfig.username || "user"}@${draftConfig.host}:${draftConfig.port}` : "Usuario OpenHer"}
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
        {currentCategoryInfo.label}
       </h2>
       <p className="settings-pane-subtitle">
        {currentCategoryInfo.subtitle}
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
          <button type="button" className="btn-icon btn-ghost password-toggle" onClick={toggleServerPass} tabIndex={-1} aria-label={showServerPass ? "Ocultar" : "Mostrar"}>
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

       <p className="settings-group-heading">{t('settings.defaultModel')}</p>
       <div className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">{t('settings.defaultModel')}</span>
         <p className="setting-item-desc">Modelo de lenguaje predeterminado para nuevas conversaciones.</p>
        </div>
        <div className="setting-item-control">
         <DefaultModelPicker
          modelOptions={uniqueModels}
          selectedModelKey={selectedModelKey}
          onChangeModel={onChangeModel}
          modelKey={mk}
          isBlocked={blockedModels.isBlocked}
         />
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
        <div className="setting-item-row" style={{ flexDirection: "column", alignItems: "stretch", background: "var(--surface-subtle)", border: "1px dashed var(--border-strong)" }}>
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
            onChange={(e) => setDraftName(e.target.value)}
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
            <button type="button" className="btn-icon btn-ghost password-toggle" onClick={toggleServerPass} tabIndex={-1}>
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
    <AppearanceSection
     language={language}
     onLanguageChange={onLanguageChange}
     languageOptions={languageOptions}
     theme={theme}
     onThemeChange={onThemeChange}
     onOpenThemePicker={onOpenThemePicker}
     onOpenThemeCreator={onOpenThemeCreator}
     uniqueModels={uniqueModels}
     selectedModelKey={selectedModelKey}
     onChangeModel={onChangeModel}
     modelKey={mk}
     selected={selected}
     thinkingVariants={thinkingVariants}
     selectedVariant={selectedVariant}
    />
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
          <LedSwitch
           label="Iniciar con Windows"
           checked={autostartEnabled}
           onChange={async (next) => {
            try {
             await shell.autostart.set(next)
             setAutostartEnabled(next)
            } catch {}
           }}
          />
        </div>
       </div>
       <div className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">Servidor OpenHer (headless)</span>
         <p className="setting-item-desc">Un clic levanta :4098 en background y lo deja arrancando solo con Windows, sin consola ni ventana.</p>
        </div>
        <div className="setting-item-control" style={{ display: "flex", gap: 8, alignItems: "center" }}>
         <Opencode2Button />
        </div>
       </div>
       <div className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">Iniciar minimizado</span>
         <p className="setting-item-desc">Al arrancar (autostart o manual) queda en la bandeja sin abrir ventana.</p>
        </div>
        <div className="setting-item-control">
         <LedSwitch
          label="Iniciar minimizado"
          checked={startMinimized}
          onChange={async (next) => {
           try {
            await shell.config.patch({ start_minimized: next } as any)
            setStartMinimized(next)
           } catch {}
          }}
         />
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
       <span className="setting-item-title">Servidor OpenHer headless automático</span>
       <p className="setting-item-desc">Al iniciar la app de escritorio arranca el servidor <code>opencode2</code> en segundo plano: sin consola y sobrevive al cierre de la ventana.</p>
      </div>
      <div className="setting-item-control">
       <LedSwitch
        label="Servidor OpenHer headless automático"
        checked={autoOpencode2}
        onChange={(next) => setAutoOpencode2(next)}
       />
      </div>
     </div>

     <SidebarSection
      position={sidebarPrefs.position}
      hidden={sidebarPrefs.hidden}
      onSetPosition={setSidebarPosition}
      onToggleItem={toggleSidebarItem}
     />

     <FeatureFlagsSection flags={flags} onToggleFlag={onToggleFlag} />
    <AutomationsSection />
    <RunsSection config={draftConfig} />

     {isDesktop && onOpenOpenCodeHub && (
      <>
       <p className="settings-group-heading">OpenHer Hub</p>
       <div className="setting-item-row">
        <div className="setting-item-info">
         <span className="setting-item-title">OpenHer Hub Oficial</span>
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
    </>
   )}

   {/* Models Tab */}
   {showModels && (
    <ModelsSection
     providers={providers}
     connectingProvider={connectingProvider}
     providerError={providerError}
     onConnectProvider={onConnectProvider}
     onDisconnectProvider={onDisconnectProvider}
     allPrimaryAgents={allPrimaryAgents}
     disabledAgents={disabledAgents}
     onToggleAgentEnabled={onToggleAgentEnabled}
     modelOptions={modelOptions}
     modelKey={mk}
     blockedModels={blockedModels}
     desktopCfg={remote.desktopCfg}
    />
   )}

   {/* Customizations Tab */}
   {showChat && (
    <CustomizationsSection
     chatSettings={chatSettings}
     onChatSettingChange={onChatSettingChange}
     onResetChatSettings={onResetChatSettings}
     snippets={snippets}
     onAddSnippet={onAddSnippet}
     onRemoveSnippet={onRemoveSnippet}
    />
   )}

   {/* Browser / Remote Desktop Tab */}
   {showRemote && <BrowserSection remote={remote} />}

   {/* Slots de plugins (secciones adicionales) */}
   <PluginSlot id="settings.section" />
    </div>
   </div>

   {showShutdownConfirm && (
    <ConfirmDialog
     title={t('extras.shutdownConfirmTitle')}
     body={t('extras.shutdownConfirmBody')}
     cancelText={t('extras.shutdownCancel')}
     confirmText={t('extras.shutdownConfirm')}
     confirmIcon={<PowerIcon size={16} />}
     onCancel={() => setShowShutdownConfirm(false)}
     onConfirm={() => { setShowShutdownConfirm(false); onShutdownHost() }}
    />
   )}

   {showRestartConfirm && (
    <ConfirmDialog
     title={t('extras.restartConfirmTitle')}
     body={t('extras.restartConfirmBody')}
     cancelText={t('extras.restartCancel')}
     confirmText={t('extras.restartConfirm')}
     confirmIcon={<RefreshIcon size={16} />}
     onCancel={() => setShowRestartConfirm(false)}
     onConfirm={() => { setShowRestartConfirm(false); onRestartHost() }}
    />
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
   <Modal onClose={onClose} variant="overlay" className="settings-modal-window" label={t('nav.settings') || "Configuración"}>
    <div className="settings-modal-body">
     {panelContent}
    </div>
   </Modal>
  )
 }

 return panelContent
})

export default SettingsPanel
