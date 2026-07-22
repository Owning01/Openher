import { memo, useRef, useMemo } from "react"
import { useT } from "../i18n-context"
import { useFocusTrap } from "../hooks/useFocusTrap"
import { modelKey, sameModel } from "../utils/model-utils"
import type { ModelOption } from "../types"

type BottomSheetProps = {
  activeSheet: "ai" | "details" | null
  onClose: () => void
  modelOptions: ModelOption[]
  modelLoadError: string | null
  activeModelOption: ModelOption | null
  groupedModelOptions: { recentModels: ModelOption[]; allGroups: Map<string, ModelOption[]> }
  modelQuery: string
  isWorking: boolean
  onChangeModel: (key: string) => void
  onModelQueryChange: (query: string) => void
  formatLimit: (value?: number) => string
  projectName: string | null
  projectPath: string | null
  vcsBranch: string | null
  projectDashboard: { vcs?: { ahead?: number; behind?: number } | null } | null
  diffFiles: Array<{ additions: number; deletions: number }>
  totalDiffAdditions: number
  totalDiffDeletions: number
  dashboardError: string | null
}

function groupLabel(providerID: string): string {
  if (providerID === "opencode") return "OpenCode"
  return providerID.charAt(0).toUpperCase() + providerID.slice(1)
}

function isZenModel(modelID: string): boolean {
  return modelID.startsWith("zen-") || modelID.includes("/zen-")
}

function isGoModel(modelID: string): boolean {
  return modelID.startsWith("go-") || modelID.includes("/go-")
}

function renderModelOption(option: ModelOption, isActive: boolean, onChange: (key: string) => void, disabled: boolean, mk: typeof modelKey, t: ReturnType<typeof useT>) {
  const optionKey = mk(option)
  return (
    <button type="button" key={optionKey}
      className={isActive ? "model-option active" : "model-option"}
      onClick={() => onChange(optionKey)} disabled={disabled}
      role="option" aria-selected={isActive}>
      <span>
        <strong>{option.modelName}</strong>
        <small>{option.providerName}{option.variant ? ` · ${option.variant}` : ""}</small>
      </span>
      {option.isDefault && <em>{t('detail.modelDefault')}</em>}
    </button>
  )
}

function renderProviderGroup(providerID: string, options: ModelOption[], activeModelOption: ModelOption | null, onChangeModel: (key: string) => void, isWorking: boolean, mk: typeof modelKey, t: ReturnType<typeof useT>) {
  if (providerID !== "opencode") {
    return options.map((opt) => renderModelOption(opt, activeModelOption ? sameModel(opt, activeModelOption) : false, onChangeModel, isWorking, mk, t))
  }
  const zen = options.filter((o) => isZenModel(o.modelID))
  const go = options.filter((o) => isGoModel(o.modelID))
  const other = options.filter((o) => !isZenModel(o.modelID) && !isGoModel(o.modelID))
  return (
    <>
      {zen.length > 0 && (
        <>
          <div className="model-subsection-label">Zen</div>
          {zen.map((opt) => renderModelOption(opt, activeModelOption ? sameModel(opt, activeModelOption) : false, onChangeModel, isWorking, mk, t))}
        </>
      )}
      {go.length > 0 && (
        <>
          <div className="model-subsection-label">Go</div>
          {go.map((opt) => renderModelOption(opt, activeModelOption ? sameModel(opt, activeModelOption) : false, onChangeModel, isWorking, mk, t))}
        </>
      )}
      {other.map((opt) => renderModelOption(opt, activeModelOption ? sameModel(opt, activeModelOption) : false, onChangeModel, isWorking, mk, t))}
    </>
  )
}

export const BottomSheet = memo(function BottomSheet({
  activeSheet, onClose,
  modelOptions, modelLoadError, activeModelOption, groupedModelOptions,
  modelQuery, isWorking,
  onChangeModel, onModelQueryChange, formatLimit,
  projectName, projectPath, vcsBranch, projectDashboard, diffFiles,
  totalDiffAdditions, totalDiffDeletions, dashboardError
}: BottomSheetProps) {
  const t = useT()
  const sheetRef = useRef<HTMLElement>(null)
  useFocusTrap(sheetRef, onClose, !!activeSheet)
  const mk = modelKey

  const providerEntries = useMemo(() => Array.from(groupedModelOptions.allGroups.entries()), [groupedModelOptions])

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
            {modelOptions.length > 0 ? (
              <div className="model-controls">
                <label htmlFor="model-search">
                  {t('detail.modelSelectLabel')}
                  <input id="model-search" value={modelQuery} onChange={(e) => onModelQueryChange(e.target.value)}
                    placeholder={t('detail.modelSearchPlaceholder')} disabled={isWorking} autoComplete="off" />
                </label>
                <div className="model-option-list" role="listbox" aria-label={t('detail.modelSelectLabel')}>
                  {!modelQuery && groupedModelOptions.recentModels.length > 0 && (
                    <>
                      <div className="model-section-label">{t('detail.modelRecent')}</div>
                      {groupedModelOptions.recentModels.map((option) => {
                        const active = activeModelOption ? sameModel(option, activeModelOption) : false
                        return renderModelOption(option, active, onChangeModel, isWorking, mk, t)
                      })}
                    </>
                  )}
                  {providerEntries.length > 0 ? (
                    <>
                      {providerEntries.map(([providerID, options]) => (
                        <div key={providerID}>
                          <div className="model-section-label">{groupLabel(providerID)}</div>
                          {renderProviderGroup(providerID, options, activeModelOption, onChangeModel, isWorking, mk, t)}
                        </div>
                      ))}
                    </>
                  ) : modelQuery ? (
                    <p className="subtle model-empty">{t('detail.modelSearchEmpty')}</p>
                  ) : null}
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
