import { memo } from "react"
import { useT } from "../i18n-context"
import { modelKey } from "../utils/model-utils"
import type { ModelOption } from "../types"

// Niveles de pensamiento: SOLO los que el server reporta (model.variants) —
// "Default" + los variants reales (high/medium/low existentes y custom).
// Componente único compartido por el picker del chat (BottomSheet) y las
// preferencias (SettingsPanel) para que ambos muestren exactamente lo mismo.
type ThinkingLevelsProps = {
  base: ModelOption
  variants: ModelOption[]
  activeVariant: string | null
  onChange: (key: string, variant?: string | null) => void
  mode?: "combobox" | "pills"
  disabled?: boolean
  hideLabel?: boolean
}

const KNOWN_LEVELS = ["high", "medium", "low"]

export const ThinkingLevels = memo(function ThinkingLevels({
  base, variants, activeVariant, onChange, mode = "pills", disabled, hideLabel
}: ThinkingLevelsProps) {
  const t = useT()
  const baseKey = modelKey(base)
  const existing = new Set(variants.map((v) => v.variant))
  const known = KNOWN_LEVELS.filter((l) => existing.has(l))
  const customs = variants
    .map((v) => v.variant)
    .filter((v): v is string => !!v && !KNOWN_LEVELS.includes(v))

  const pills: Array<{ name: string; variant: string | null }> = [
    { name: "Default (Automático)", variant: null },
    ...known.map((l) => ({ name: l.charAt(0).toUpperCase() + l.slice(1), variant: l })),
    ...customs.map((l) => ({ name: l, variant: l })),
  ]

  if (mode === "combobox") {
    return (
      <div className="thinking-combobox-wrap">
        {!hideLabel && (
          <label className="thinking-levels-label" htmlFor={`thinking-select-${baseKey}`}>
            {t('detail.thinkingLevel')}
          </label>
        )}
        <select
          id={`thinking-select-${baseKey}`}
          className="thinking-combobox"
          disabled={disabled || variants.length === 0}
          value={activeVariant ?? ""}
          onChange={(e) => onChange(baseKey, e.target.value ? e.target.value : null)}
          aria-label={t('detail.thinkingLevel')}
        >
          {variants.length === 0 ? (
            <option value="">{t('detail.noThinkingLevels')}</option>
          ) : (
            pills.map((p) => (
              <option key={p.variant ?? "default"} value={p.variant ?? ""}>
                {p.name}
              </option>
            ))
          )}
        </select>
      </div>
    )
  }

  return (
    <div className="thinking-levels">
      {!hideLabel && <span className="thinking-levels-label">{t('detail.thinkingLevel')}</span>}
      <div className="model-variant-pills">
        {pills.map((p) => (
          <button key={p.variant ?? "default"} type="button"
            className={`variant-pill${activeVariant === p.variant ? " active" : ""}`}
            onClick={() => onChange(baseKey, p.variant)}>
            {p.name}
          </button>
        ))}
      </div>
    </div>
  )
})
