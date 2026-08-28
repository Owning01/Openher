import { memo, useState, useMemo, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useT } from "../i18n-context"
import { SearchIcon, CloseIcon, CheckIcon, BrainIcon } from "../Icons"
import { modelKey, sameModel, groupModels, variantsOf } from "../utils/model-utils"
import { ThinkingLevels } from "./ThinkingLevels"
import type { ModelOption } from "../types"
import type { VariantGroup } from "../hooks/useAI"

type ModelSelectorModalProps = {
  isOpen: boolean
  onClose: () => void
  activeModelOption: ModelOption | null
  activeModelVariants: ModelOption[]
  selectedVariant: string | null
  onChangeVariant: (variant: string | null) => void
  modelOptions?: ModelOption[]
  onChangeModel?: (key: string, variant?: string | null) => void
  variantGroups?: { recentModels: ModelOption[]; groups: Map<string, VariantGroup> }
}

function formatContext(limit?: number): string {
  if (!limit || limit <= 0) return ""
  if (limit >= 1_000_000) return `${(limit / 1_000_000).toFixed(limit % 1_000_000 === 0 ? 0 : 1)}M`
  if (limit >= 1_000) return `${Math.round(limit / 1_000)}k`
  return `${limit}`
}

export const ModelSelectorModal = memo(function ModelSelectorModal({
  isOpen,
  onClose,
  activeModelOption,
  activeModelVariants,
  selectedVariant,
  onChangeVariant,
  modelOptions = [],
  onChangeModel,
  variantGroups,
}: ModelSelectorModalProps) {
  const t = useT()
  const [search, setSearch] = useState("")
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // Escucha de tecla Escape para cerrar el modal
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  // Autofocus en el buscador al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    } else {
      setSearch("")
    }
  }, [isOpen])

  // Filtrado de modelos — debounce Simple y límite 80 resultados para no trabar UI con 300+ modelos
  const query = search.trim().toLowerCase()
  const allGroups = useMemo(() => groupModels(modelOptions), [modelOptions])

  const filteredGroups = useMemo(() => {
    const list: Array<{ key: string; group: VariantGroup }> = []
    let count = 0
    const LIMIT = 80
    for (const [key, group] of allGroups) {
      if (count >= LIMIT) break
      if (!query) {
        list.push({ key, group })
        count++
        continue
      }
      const matchName = group.base.modelName?.toLowerCase().includes(query)
      const matchProv = group.base.providerName?.toLowerCase().includes(query)
      const matchID = group.base.modelID?.toLowerCase().includes(query)
      if (matchName || matchProv || matchID) {
        list.push({ key, group })
        count++
      }
    }
    return list
  }, [allGroups, query])

  // Modelos recientes que coinciden
  const matchingRecent = useMemo(() => {
    if (!variantGroups?.recentModels?.length) return []
    if (!query) return variantGroups.recentModels
    return variantGroups.recentModels.filter((m) =>
      m.modelName?.toLowerCase().includes(query) ||
      m.providerName?.toLowerCase().includes(query) ||
      m.modelID?.toLowerCase().includes(query)
    )
  }, [variantGroups?.recentModels, query])

  if (!isOpen) return null

  const handleSelectModel = (base: ModelOption) => {
    const key = modelKey(base)
    // Mantener la variante si el nuevo modelo la soporta, o null
    const newVariants = variantsOf(modelOptions, base)
    const hasVariant = newVariants.some((v) => v.variant === selectedVariant)
    const targetVariant = hasVariant ? selectedVariant : null

    if (onChangeModel) {
      onChangeModel(key, targetVariant)
    }
  }

  const handleVariantChange = (_key: string, variant?: string | null) => {
    const next = variant ?? null
    onChangeVariant(next)
  }

  return createPortal(
    <div
      className="modal-backdrop model-selector-backdrop fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="model-selector-title"
      onClick={onClose}
    >
      <div
        className="modal-card model-selector-modal scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="model-selector-header">
          <div className="model-selector-title-wrap">
            <BrainIcon size={18} />
            <h2 id="model-selector-title" className="model-selector-title">
              {t('detail.modelTitle')}
            </h2>
          </div>
          <button
            type="button"
            className="btn-icon compact"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Sección de Thinking / Nivel de pensamiento (Combobox simple integrado) */}
        {activeModelOption && (
          <div className="model-selector-thinking-card">
            <div className="model-selector-active-info">
              <div className="model-selector-active-row">
                <span className="model-selector-active-label">Modelo Activo:</span>
                <strong className="model-selector-active-name">
                  {activeModelOption.modelName ?? t('detail.modelLoading')}
                </strong>
                {activeModelOption.providerName && (
                  <span className="model-provider-badge">
                    {activeModelOption.providerName}
                  </span>
                )}
              </div>
            </div>

            {/* Combobox simple de Thinking */}
            <ThinkingLevels
              base={activeModelOption}
              variants={activeModelVariants}
              activeVariant={selectedVariant}
              onChange={handleVariantChange}
              mode="combobox"
            />
          </div>
        )}

        {/* Buscador de modelos */}
        <div className="model-selector-search-box">
          <SearchIcon size={14} className="model-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            id="model-search"
            className="model-search-input"
            placeholder={t('detail.modelSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="btn-icon compact model-search-clear"
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Lista scrolleable de modelos */}
        <div className="model-selector-list" role="listbox" aria-label={t('detail.modelPanelLabel')}>
          {/* Recientes (si no hay búsqueda activa) */}
          {!query && matchingRecent.length > 0 && (
            <div className="model-group-section">
              <div className="model-group-section-title">
                {t('detail.modelRecent')}
              </div>
              <div className="model-items-grid">
                {matchingRecent.map((m) => {
                  const isCurrent = activeModelOption ? sameModel(m, activeModelOption) : false
                  const contextStr = formatContext(m.contextLimit)
                  return (
                    <button
                      key={`recent-${modelKey(m)}`}
                      type="button"
                      className={`model-option-card${isCurrent ? " active" : ""}`}
                      onClick={() => handleSelectModel(m)}
                      role="option"
                      aria-selected={isCurrent}
                    >
                      <div className="model-option-main">
                        <div className="model-option-name-row">
                          <strong className="model-option-name">{m.modelName}</strong>
                          {isCurrent && <CheckIcon size={14} className="model-selected-check" />}
                        </div>
                        <div className="model-option-meta">
                          <span className="model-option-provider">{m.providerName}</span>
                          {contextStr && (
                            <span className="model-context-chip" title={`Límite de contexto: ${m.contextLimit} tokens`}>
                              {contextStr}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Todos los modelos disponibles agrupados */}
          <div className="model-group-section">
            {!query && matchingRecent.length > 0 && (
              <div className="model-group-section-title">
                {t('detail.modelAll')}
              </div>
            )}

            {filteredGroups.length === 0 ? (
              <div className="model-search-empty">
                {t('detail.modelSearchEmpty')}
              </div>
            ) : (
              <div className="model-items-grid">
                {filteredGroups.map(({ key, group }) => {
                  const m = group.base
                  const isCurrent = activeModelOption ? sameModel(m, activeModelOption) : false
                  const contextStr = formatContext(m.contextLimit)
                  const variantCount = group.variants.length

                  return (
                    <button
                      key={key}
                      type="button"
                      className={`model-option-card${isCurrent ? " active" : ""}`}
                      onClick={() => handleSelectModel(m)}
                      role="option"
                      aria-selected={isCurrent}
                    >
                      <div className="model-option-main">
                        <div className="model-option-name-row">
                          <strong className="model-option-name">{m.modelName}</strong>
                          {isCurrent && <CheckIcon size={14} className="model-selected-check" />}
                        </div>
                        <div className="model-option-meta">
                          <span className="model-option-provider">{m.providerName}</span>
                          {contextStr && (
                            <span className="model-context-chip" title={`Límite de contexto: ${m.contextLimit} tokens`}>
                              {contextStr}
                            </span>
                          )}
                          {variantCount > 0 && (
                            <span className="model-variants-chip" title={`${variantCount} niveles de pensamiento disponibles`}>
                               ${variantCount}
                            </span>
                          )}
                          {m.isDefault && (
                            <span className="model-default-tag">
                              {t('detail.modelDefault')}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="model-selector-footer">
          <span className="model-selector-hint">
            {t('detail.modelHint')}
          </span>
          <button type="button" className="btn-primary compact" onClick={onClose}>
            {t('common.done') || "Listo"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
})
