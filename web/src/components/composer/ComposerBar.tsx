import { memo, useCallback, useMemo, useRef, useState } from "react"
import { useT } from "../../i18n-context"
import type { AgentOption, ModelOption } from "../../types"
import { PluginSlot } from "../../plugins"
import { ModelSelectorModal } from "../ModelSelectorModal"

type ComposerBarProps = {
  activeModelOption?: ModelOption | null
  activeModelVariants?: ModelOption[]
  selectedVariant?: string | null
  onChangeVariant?: (variant: string | null, sessionID?: string) => void
  modelOptions?: ModelOption[]
  onChangeModel?: (key: string, variant?: string | null, sessionID?: string) => void
  variantGroups?: { recentModels: ModelOption[]; groups: Map<string, any> }
  sessionID?: string
  primaryAgentOptions: AgentOption[]
  activeAgentID: string
  onChangeAgent: (id: string) => void
  disabled: boolean
  /** Contador de contexto ("401.1K (38%)"), al final de la fila. */
  contextLabel?: string | null
  valueLength: number
  charLimit: number
}

/** Fila de metadatos del composer (DEBAJO de la caja de texto, en ambos modos):
    [modo] modelo · contexto, con el agente activo a la derecha. El botón TSL se
    retiró (25-sep). */
export const ComposerBar = memo(function ComposerBar({
  activeModelOption,
  activeModelVariants,
  selectedVariant,
  onChangeVariant,
  modelOptions,
  onChangeModel,
  variantGroups,
  sessionID,
  primaryAgentOptions,
  activeAgentID,
  onChangeAgent,
  disabled,
  contextLabel,
  valueLength,
  charLimit,
}: ComposerBarProps) {
  const t = useT()
  const [showModelMenu, setShowModelMenu] = useState(false)
  const modelMenuRef = useRef<HTMLDivElement | null>(null)
  const modelToggleRef = useRef<HTMLButtonElement | null>(null)

  const primaryVisibleAgents = useMemo(
    () => primaryAgentOptions.filter((a) => !a.hidden && a.mode !== "subagent"),
    [primaryAgentOptions],
  )
  const handleToggleAgent = useCallback(() => {
    const visible = primaryVisibleAgents
    if (visible.length < 2) return
    const curIdx = visible.findIndex((a) => a.id === activeAgentID)
    const next = visible[(curIdx + 1) % visible.length]
    onChangeAgent(next.id)
  }, [primaryVisibleAgents, activeAgentID, onChangeAgent])

  return (
    <div className="composer-bar">
      <div className="composer-bar-left">
        {/* Orden pedido (25-sep): Build (agente) a la IZQUIERDA, antes del
            modelo, que a su vez muestra [modo] modelo, y después el contexto. */}
        {primaryVisibleAgents.length > 1 && (
          <button onClick={handleToggleAgent} disabled={disabled}
            type="button"
            className="agent-toggle"
            title={`Agente activo: ${primaryVisibleAgents.find((a) => a.id === activeAgentID)?.name ?? activeAgentID} (click para cambiar)`}>
            <span>{primaryVisibleAgents.find((a) => a.id === activeAgentID)?.name ?? activeAgentID}</span>
          </button>
        )}
        {activeModelOption && (
          /* shrink 1 + `min-width: 0` (era `flex-shrink: 0`): si la línea no
             entra, el nombre del modelo se recorta con elipsis y el resto de
             la fila queda entero. Medido a 360px: el nombre baja a ~33px y el
             costo se recorta (necesita 131px y dispone de ~102 con TSL + Build
             + 3 botones en la línea) — ver LOADING-STATES.md. */
          <div className="composer-model-wrap" ref={modelMenuRef} style={{ position: "relative", flexShrink: 1, minWidth: 0 }}>
            <button
              ref={modelToggleRef}
              type="button"
              className="composer-model-pill"
              onClick={(e) => {
                e.stopPropagation()
                setShowModelMenu((v) => !v)
              }}
              aria-expanded={showModelMenu}
              aria-haspopup="true"
              title={`${activeModelOption.modelName ?? t('detail.modelLoading')}${activeModelOption.variant ? ` · ${t('detail.modelVariant', { variant: activeModelOption.variant })}` : ""}`}
            >
              <span className="composer-model-name">
                {activeModelOption.modelName ?? t('detail.modelLoading')}
              </span>
              {(selectedVariant ?? activeModelOption.variant) && (
                <span className="composer-model-mode-badge">
                  {selectedVariant ?? activeModelOption.variant}
                </span>
              )}
            </button>
            {showModelMenu && (
              <ModelSelectorModal
                isOpen={showModelMenu}
                onClose={() => {
                  setShowModelMenu(false)
                  modelToggleRef.current?.focus()
                }}
                activeModelOption={activeModelOption}
                activeModelVariants={activeModelVariants ?? []}
                selectedVariant={selectedVariant ?? null}
                onChangeVariant={(v) => onChangeVariant?.(v, sessionID)}
                modelOptions={modelOptions}
                onChangeModel={(key, variant) => {
                  onChangeModel?.(key, variant, sessionID)
                }}
                variantGroups={variantGroups as any}
              />
            )}
          </div>
        )}
        <PluginSlot id="composer.actions" />
        {contextLabel && <span className="context-usage-label">{contextLabel}</span>}
      </div>
      <div className="composer-bar-right">
        {valueLength > 0 && (            <span className={`composer-char-count${charLimit > 0 && valueLength >= charLimit ? " over" : ""}`}
            title={charLimit > 0 ? `${valueLength}/${charLimit}` : `${valueLength} chars`}>
            {charLimit > 0 ? `${valueLength}/${charLimit}` : valueLength}
          </span>
        )}
      </div>
    </div>
  )
})
