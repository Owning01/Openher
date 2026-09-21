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
  tslEnabled: boolean
  onToggleTsl: () => void
  contextLabel?: string | null
  valueLength: number
  charLimit: number
}

/** Barra inferior del composer: modelo, agente activo, TSL, plugins y contador. */
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
  tslEnabled,
  onToggleTsl,
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
  const agentColorIdx = useMemo(() => {
    const idx = primaryVisibleAgents.findIndex((a) => a.id === activeAgentID)
    return idx >= 0 ? idx % 7 : 0
  }, [primaryVisibleAgents, activeAgentID])
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
        {activeModelOption && (
          <div className="composer-model-wrap" ref={modelMenuRef} style={{ position: "relative", flexShrink: 0 }}>
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
        {primaryVisibleAgents.length > 1 && (
          <button onClick={handleToggleAgent} disabled={disabled}
            className="agent-toggle"
            title={`Agente activo: ${primaryVisibleAgents.find((a) => a.id === activeAgentID)?.name ?? activeAgentID} (click para cambiar)`}
            style={{ color: `var(--agent-${agentColorIdx})`, border: "none", outline: "none", background: "transparent", padding: "0 4px" } as React.CSSProperties}>
            <span>{primaryVisibleAgents.find((a) => a.id === activeAgentID)?.name ?? activeAgentID}</span>
          </button>
        )}
        <button
          type="button"
          onClick={onToggleTsl}
          disabled={disabled}
          className="composer-tsl-btn"
          style={{ color: tslEnabled ? "var(--primary)" : undefined }}
          title={tslEnabled ? "Translate ES→EN (active)" : "Translate ES→EN"}
          aria-pressed={tslEnabled}
        >
          TSL
        </button>
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
