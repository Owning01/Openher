import { memo, useEffect, useRef } from "react"
import { RefreshIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { AgentOption, ModelOption } from "../types"

type BottomSheetProps = {
  activeSheet: "ai" | "details" | null
  onClose: () => void
  // AI sheet
  agentOptions: AgentOption[]
  agentLoadError: string | null
  activeAgentID: string
  activeAgent: AgentOption | null
  modelOptions: ModelOption[]
  modelLoadError: string | null
  activeModelOption: ModelOption | null
  filteredModelOptions: ModelOption[]
  modelQuery: string
  isWorking: boolean
  onRefreshAI: () => void
  onChangeAgent: (id: string) => void
  onChangeModel: (key: string) => void
  onModelQueryChange: (query: string) => void
  modelKey: (model: { providerID: string; modelID: string; variant?: string }) => string
  sameModel: (a: { providerID: string; modelID: string; variant?: string } | null | undefined, b: { providerID: string; modelID: string; variant?: string } | null | undefined) => boolean
  agentLabel: (agent: AgentOption) => string
  formatLimit: (value?: number) => string
  // Details sheet
  projectName: string | null
  projectPath: string | null
  vcsBranch: string | null
  projectDashboard: { vcs?: { ahead?: number; behind?: number } | null } | null
  diffFiles: Array<{ additions: number; deletions: number }>
  totalDiffAdditions: number
  totalDiffDeletions: number
  dashboardError: string | null
}

export const BottomSheet = memo(function BottomSheet({
  activeSheet, onClose,
  agentOptions, agentLoadError, activeAgentID, activeAgent, modelOptions, modelLoadError,
  activeModelOption, filteredModelOptions, modelQuery, isWorking,
  onRefreshAI, onChangeAgent, onChangeModel, onModelQueryChange,
  modelKey: mk, sameModel, agentLabel, formatLimit,
  projectName, projectPath, vcsBranch, projectDashboard, diffFiles,
  totalDiffAdditions, totalDiffDeletions, dashboardError
}: BottomSheetProps) {
  const t = useT()
  const sheetRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!activeSheet) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key === "Tab") {
        const sheetEl = sheetRef.current
        if (!sheetEl) return
        const focusables = sheetEl.querySelectorAll<HTMLElement>(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'
        )
        if (focusables.length === 0) return
        const first = focusables[0]!
        const last = focusables[focusables.length - 1]!
        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === last) {
            first.focus()
            e.preventDefault()
          }
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    const sheetEl = sheetRef.current
    if (sheetEl) {
      const focusables = sheetEl.querySelectorAll<HTMLElement>(
        'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'
      )
      if (focusables.length > 0) {
        setTimeout(() => focusables[0]?.focus(), 50)
      }
    }

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, activeSheet])

  if (!activeSheet) return null

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        ref={sheetRef}
        className="bottom-sheet fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div>
            <h3 id="detail-sheet-title">
              {activeSheet === "ai" && t('detail.aiTitle')}
              {activeSheet === "details" && t('detail.sessionDetailsTitle')}
            </h3>
            <p className="subtle">
              {activeSheet === "ai" && t('detail.modelHint')}
              {activeSheet === "details" && t('detail.sessionDetailsHint')}
            </p>
          </div>
          <button type="button" className="btn-secondary compact" onClick={onClose}>
            {t('detail.closeSheet')}
          </button>
        </div>

        {activeSheet === "ai" && (
          <div className="sheet-content">
            <button type="button" className="btn-secondary" onClick={onRefreshAI}>
              <RefreshIcon size={16} />
              {t('detail.refreshAi')}
            </button>
            {agentOptions.length > 0 ? (
              <div className="agent-controls">
                <label htmlFor="agent-select">
                  {t('detail.agentSelectLabel')}
                  <select id="agent-select" value={activeAgentID} onChange={(e) => onChangeAgent(e.target.value)} disabled={isWorking}>
                    {agentOptions.filter((a) => a.mode === "primary" || a.mode === "all").map((agent) => (
                      <option key={agent.id} value={agent.id}>{agentLabel(agent)}</option>
                    ))}
                  </select>
                </label>
                <p className="subtle">
                  {activeAgent?.description || t('detail.agentMode', { mode: activeAgent?.mode ?? 'primary' })}
                </p>
              </div>
            ) : (
              <p className="subtle">{agentLoadError ? t('detail.agentLoadError', { message: agentLoadError }) : t('detail.agentLoading')}</p>
            )}
            {modelOptions.length > 0 ? (
              <div className="model-controls">
                <label htmlFor="model-search">
                  {t('detail.modelSelectLabel')}
                  <input id="model-search" value={modelQuery} onChange={(e) => onModelQueryChange(e.target.value)}
                    placeholder={t('detail.modelSearchPlaceholder')} disabled={isWorking} autoComplete="off" />
                </label>
                <div className="model-option-list" role="listbox" aria-label={t('detail.modelSelectLabel')}>
                  {filteredModelOptions.length > 0 ? (
                    filteredModelOptions.map((option) => {
                      const optionKey = mk(option)
                      const active = activeModelOption ? sameModel(option, activeModelOption) : false
                      return (
                        <button type="button" key={optionKey}
                          className={active ? "model-option active" : "model-option"}
                          onClick={() => onChangeModel(optionKey)} disabled={isWorking}
                          role="option" aria-selected={active}>
                          <span>
                            <strong>{option.modelName}</strong>
                            <small>{option.providerName}{option.variant ? ` · ${option.variant}` : ""}</small>
                          </span>
                          {option.isDefault && <em>{t('detail.modelDefault')}</em>}
                        </button>
                      )
                    })
                  ) : (
                    <p className="subtle model-empty">{t('detail.modelSearchEmpty')}</p>
                  )}
                </div>
                {activeModelOption && (
                  <div className="model-meta">
                    <span>{t('detail.modelProvider', { provider: activeModelOption.providerName })}</span>
                    <span>{t('detail.modelContext', { context: formatLimit(activeModelOption.contextLimit), output: formatLimit(activeModelOption.outputLimit) })}</span>
                    <span>{activeModelOption.tools ? t('detail.modelToolsYes') : t('detail.modelToolsNo')}</span>
                    {activeModelOption.variant && <span>{t('detail.modelVariant', { variant: activeModelOption.variant })}</span>}
                  </div>
                )}
              </div>
            ) : (
              <p className="subtle">{modelLoadError ? t('detail.modelLoadError', { message: modelLoadError }) : t('detail.modelLoading')}</p>
            )}
          </div>
        )}

        {activeSheet === "details" && (
          <div className="sheet-content project-dashboard single-column">
            <div className="dashboard-card">
              <span className="dashboard-label">{t('detail.projectLabel')}</span>
              <strong>{projectName || ""}</strong>
              <small>{projectPath || ""}</small>
            </div>
            <div className="dashboard-card">
              <span className="dashboard-label">{t('detail.vcsLabel')}</span>
              <strong>{vcsBranch || t('detail.unavailable')}</strong>
              {projectDashboard?.vcs && (
                <small>{t('detail.aheadBehind', { ahead: projectDashboard.vcs.ahead ?? 0, behind: projectDashboard.vcs.behind ?? 0 })}</small>
              )}
            </div>
            <div className="dashboard-card">
              <span className="dashboard-label">{t('detail.fileStatusLabel')}</span>
              <strong>{diffFiles.length > 0 ? t('detail.filesCount', { count: diffFiles.length }) : ""}</strong>
              {diffFiles.length > 0 ? (
                <small><span className="positive">+{totalDiffAdditions}</span> <span className="negative">-{totalDiffDeletions}</span></small>
              ) : (
                <small>{dashboardError ? t('detail.dashboardError', { message: dashboardError }) : t('detail.fileStatusSource')}</small>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
})
