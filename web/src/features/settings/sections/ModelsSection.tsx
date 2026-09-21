// ModelsSection — proveedores de IA, agentes, modelos bloqueados y cuentas Go
// (F4-P4). Extraído de SettingsPanel.tsx sin cambios de conducta.
import { useState } from "react"
import { LoadingIcon, PlusIcon, TrashIcon } from "../../../Icons"
import { useT } from "../../../i18n-context"
import type { AgentOption, ModelOption, ProviderInfo } from "../../../types"
import type { DesktopConfig } from "../../../desktop"
import { ProviderManager } from "../../../components/ProviderManager"
import { GoUsagePanel } from "../../../components/GoUsagePanel"
import { LedSwitch } from "../../../components/LedSwitch"
import { useGoAccounts } from "../useGoAccounts"
import type { BlockedModelsApi } from "../types"

type ModelsSectionProps = {
  providers: ProviderInfo[]
  connectingProvider: string | null
  providerError: string | null
  onConnectProvider: (providerID: string, apiKey: string) => void
  onDisconnectProvider: (providerID: string) => void
  allPrimaryAgents?: AgentOption[]
  disabledAgents?: Record<string, boolean>
  onToggleAgentEnabled?: (agentId: string) => void
  modelOptions: ModelOption[]
  modelKey: (model: { providerID: string; modelID: string; variant?: string }) => string
  blockedModels: BlockedModelsApi
  desktopCfg: DesktopConfig
}

export function ModelsSection({
  providers, connectingProvider, providerError, onConnectProvider, onDisconnectProvider,
  allPrimaryAgents, disabledAgents, onToggleAgentEnabled,
  modelOptions, modelKey: mk, blockedModels, desktopCfg,
}: ModelsSectionProps) {
  const t = useT()
  const { goKeys, goEditing, setGoEditing, goUsageMap, goLoadingMap, goErrorMap, checkGo, updateGoKey, removeGoKey, addGoKey } = useGoAccounts(desktopCfg)
  const [blockedSearch, setBlockedSearch] = useState("")
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set())

  const toggleProvider = (providerID: string) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev)
      if (next.has(providerID)) next.delete(providerID)
      else next.add(providerID)
      return next
    })
  }

  return (
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

      <p className="settings-group-heading">{t('go.title')}</p>
      <GoUsagePanel />

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
           <LedSwitch
            label={agent.name || agent.id}
            checked={!isDisabled}
            onChange={() => onToggleAgentEnabled?.(agent.id)}
           />
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
              <LedSwitch
               label={opt.modelName}
               checked={!blocked}
               onChange={() => blockedModels.toggleBlocked(key)}
              />
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
      <button type="button" className="ag-btn-open" onClick={addGoKey}>
       <span style={{ display: "inline-flex", marginRight: 6 }}><PlusIcon size={14} /></span>
       {t('settings.goAddAccount')}
      </button>
     </div>
    </>
  )
}
