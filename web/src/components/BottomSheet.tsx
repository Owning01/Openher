import { memo, useRef, useMemo, useState } from "react"
import { useT } from "../i18n-context"
import { useFocusTrap } from "../hooks/useFocusTrap"
import { modelKey, sameModel } from "../utils/model-utils"
import { api } from "../api"
import type { ModelOption, ServerConfig } from "../types"
import type { VariantGroup } from "../hooks/useAI"

type BottomSheetProps = {
  activeSheet: "ai" | "details" | null
  onClose: () => void
  modelOptions: ModelOption[]
  modelLoadError: string | null
  activeModelOption: ModelOption | null
  variantGroups: { recentModels: ModelOption[]; groups: Map<string, VariantGroup> }
  modelQuery: string
  isWorking: boolean
  onChangeModel: (key: string, variant?: string | null) => void
  onModelQueryChange: (query: string) => void
  selectedVariant: string | null
  formatLimit: (value?: number) => string
  projectName: string | null
  projectPath: string | null
  vcsBranch: string | null
  projectDashboard: { vcs?: { ahead?: number; behind?: number } | null } | null
  diffFiles: Array<{ additions: number; deletions: number }>
  totalDiffAdditions: number
  totalDiffDeletions: number
  dashboardError: string | null
  config?: ServerConfig
  onVariantsChanged?: () => void
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

const REASONING_VARIANTS = new Set(["high", "medium", "low"])

function renderThinkingLevels(
  base: ModelOption,
  variants: ModelOption[],
  activeVariant: string | null,
  onChangeModel: (key: string, variant?: string | null) => void,
  config: ServerConfig | undefined,
  onVariantsChanged: (() => void) | undefined,
  mk: typeof modelKey,
  t: ReturnType<typeof useT>
) {
  const baseKey = mk(base)
  // Los niveles se muestran TAL CUAL vienen de la api (high/medium/low).
  const levels: Array<{ name: string; variant: string | null }> = [
    { name: "none", variant: null },
    { name: "high", variant: "high" },
    { name: "medium", variant: "medium" },
    { name: "low", variant: "low" },
  ]
  const existing = new Set(variants.map((v) => v.variant))

  const pick = async (level: { name: string; variant: string | null }) => {
    if (!level.variant) { onChangeModel(baseKey, null); return }
    if (existing.has(level.variant)) { onChangeModel(baseKey, level.variant); return }
    if (config) {
      try {
        await api.setModelVariant(config, base.providerID, base.modelID, level.variant, { reasoningEffort: level.variant })
      } catch { /* seleccionar igual: el server puede resolver el effort solo */ }
    }
    onChangeModel(baseKey, level.variant)
    onVariantsChanged?.()
  }

  return (
    <div className="thinking-levels">
      <span className="thinking-levels-label">{t('detail.thinkingLevel')}</span>
      <div className="model-variant-pills">
        {levels.map((l) => (
          <button key={l.variant ?? "none"} type="button"
            className={`variant-pill${activeVariant === l.variant ? " active" : ""}`}
            onClick={() => pick(l)}>
            {l.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function ModelGroupRow({
  group, selectedVariant, onChangeModel, isActive,
  mk, t, config, onVariantsChanged
}: {
  group: VariantGroup
  selectedVariant: string | null
  onChangeModel: (key: string, variant?: string | null) => void
  isActive: boolean
  mk: typeof modelKey
  t: ReturnType<typeof useT>
  config?: ServerConfig
  onVariantsChanged?: () => void
}) {
  const { base, variants } = group
  const baseKey = mk(base)
  const activeVariant = isActive ? selectedVariant : null
  const customVariants = variants.filter((v) => !v.variant || !REASONING_VARIANTS.has(v.variant))
  const [expanded, setExpanded] = useState(isActive)

  return (
    <div key={baseKey} className={`model-group${isActive ? " active" : ""}${expanded ? " expanded" : ""}`}>
      <button type="button" className="model-group-row"
        aria-expanded={expanded}
        onClick={() => { setExpanded((v) => !v); onChangeModel(baseKey, activeVariant) }}
        role="option" aria-selected={isActive}>
        <strong>{base.modelName}</strong>
        <small>{base.providerName}</small>
        {base.isDefault && <em>{t('detail.modelDefault')}</em>}
      </button>
      {expanded && (
        <>
          {customVariants.length > 0 && (
            <div className="model-variant-pills">
              <button type="button"
                className={`variant-pill${!activeVariant ? " active" : ""}`}
                onClick={() => onChangeModel(baseKey, null)}>
                Default
              </button>
              {customVariants.map((v) => (
                <button key={v.variant} type="button"
                  className={`variant-pill${activeVariant === v.variant ? " active" : ""}`}
                  onClick={() => onChangeModel(baseKey, v.variant)}>
                  {v.variant}
                </button>
              ))}
            </div>
          )}
          {renderThinkingLevels(base, variants, activeVariant, onChangeModel, config, onVariantsChanged, mk, t)}
        </>
      )}
    </div>
  )
}

function renderGroupedModels(
  options: ModelOption[],
  activeModelOption: ModelOption | null,
  selectedVariant: string | null,
  onChangeModel: (key: string, variant?: string | null) => void,
  _isWorking: boolean,
  mk: typeof modelKey,
  t: ReturnType<typeof useT>,
  providerID: string,
  config?: ServerConfig,
  onVariantsChanged?: () => void
) {
  const groups = new Map<string, VariantGroup>()
  for (const opt of options) {
    const k = mk(opt)
    if (!groups.has(k)) groups.set(k, { base: opt, variants: [] })
    if (opt.variant) groups.get(k)!.variants.push(opt)
  }

  if (providerID !== "opencode") {
    return Array.from(groups.values()).map((g) => {
      const isActive = activeModelOption ? sameModel(g.base, activeModelOption) : false
      return (
        <ModelGroupRow key={mk(g.base)} group={g}
          selectedVariant={selectedVariant} onChangeModel={onChangeModel} isActive={isActive}
          mk={mk} t={t} config={config} onVariantsChanged={onVariantsChanged} />
      )
    })
  }

  const zenGroups: VariantGroup[] = []
  const goGroups: VariantGroup[] = []
  const otherGroups: VariantGroup[] = []

  for (const [, group] of groups) {
    if (isZenModel(group.base.modelID)) zenGroups.push(group)
    else if (isGoModel(group.base.modelID)) goGroups.push(group)
    else otherGroups.push(group)
  }

  return (
    <>
      {zenGroups.length > 0 && (
        <>
          <div className="model-subsection-label">Zen</div>
          {zenGroups.map((g) => {
            const isActive = activeModelOption ? sameModel(g.base, activeModelOption) : false
            return (
              <ModelGroupRow key={mk(g.base)} group={g}
                selectedVariant={selectedVariant} onChangeModel={onChangeModel} isActive={isActive}
                mk={mk} t={t} />
            )
          })}
        </>
      )}
      {goGroups.length > 0 && (
        <>
          <div className="model-subsection-label">Go</div>
          {goGroups.map((g) => {
            const isActive = activeModelOption ? sameModel(g.base, activeModelOption) : false
            return (
              <ModelGroupRow key={mk(g.base)} group={g}
                selectedVariant={selectedVariant} onChangeModel={onChangeModel} isActive={isActive}
                mk={mk} t={t} />
            )
          })}
        </>
      )}
      {otherGroups.map((g) => {
        const isActive = activeModelOption ? sameModel(g.base, activeModelOption) : false
        return (
          <ModelGroupRow key={mk(g.base)} group={g}
            selectedVariant={selectedVariant} onChangeModel={onChangeModel} isActive={isActive}
            mk={mk} t={t} />
        )
      })}
    </>
  )
}

export const BottomSheet = memo(function BottomSheet({
  activeSheet, onClose,
  modelOptions, modelLoadError, activeModelOption, variantGroups,
  modelQuery, isWorking,
  onChangeModel, onModelQueryChange,
  selectedVariant,
  formatLimit,
  projectName, projectPath, vcsBranch, projectDashboard, diffFiles,
  totalDiffAdditions, totalDiffDeletions, dashboardError, config, onVariantsChanged
}: BottomSheetProps) {
  const t = useT()
  const sheetRef = useRef<HTMLElement>(null)
  useFocusTrap(sheetRef, onClose, !!activeSheet)
  const mk = modelKey

  const providerEntries = useMemo(() => {
    const byProvider = new Map<string, ModelOption[]>()
    for (const [, group] of variantGroups.groups) {
      const pid = group.base.providerID || group.base.providerName || "other"
      if (!byProvider.has(pid)) byProvider.set(pid, [])
      byProvider.get(pid)!.push(group.base)
    }
    return Array.from(byProvider.entries())
  }, [variantGroups])

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
                    placeholder={t('detail.modelSearchPlaceholder')} autoComplete="off" />
                </label>
                <div className="model-option-list" role="listbox" aria-label={t('detail.modelSelectLabel')}>
                  {!modelQuery && variantGroups.recentModels.length > 0 && (
                    <>
                      <div className="model-section-label">{t('detail.modelRecent')}</div>
                      {variantGroups.recentModels.map((opt) => {
                        const isActive = activeModelOption ? sameModel(opt, activeModelOption) : false
                        const optKey = mk(opt)
                        return (
                          <button type="button" key={optKey}
                            className={isActive ? "model-option active" : "model-option"}
                            onClick={() => onChangeModel(optKey, opt.variant || null)}
                            role="option" aria-selected={isActive}>
                            <span>
                              <strong>{opt.modelName}</strong>
                              <small>{opt.providerName}{opt.variant ? ` · ${opt.variant}` : ""}</small>
                            </span>
                            {opt.isDefault && <em>{t('detail.modelDefault')}</em>}
                          </button>
                        )
                      })}
                    </>
                  )}
                  {providerEntries.length > 0 ? (
                    <>
                      {providerEntries.map(([providerID, options]) => (
                        <div key={providerID}>
                          <div className="model-section-label">{groupLabel(providerID)}</div>
                          {renderGroupedModels(options, activeModelOption, selectedVariant, onChangeModel, isWorking, mk, t, providerID, config, onVariantsChanged)}
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
                    {selectedVariant && <span>{t('detail.modelVariant', { variant: selectedVariant })}</span>}
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

export default BottomSheet
