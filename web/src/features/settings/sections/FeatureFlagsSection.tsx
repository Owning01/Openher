// FeatureFlagsSection — lista de feature flags experimentales (F4-P4).
// Extraído de SettingsPanel.tsx sin cambios de conducta.
import { useT } from "../../../i18n-context"
import type { FeatureFlags } from "../../../types"
import { LedSwitch } from "../../../components/LedSwitch"
import { buildFeatureFlags } from "../constants"

type FeatureFlagsSectionProps = {
  flags: FeatureFlags
  onToggleFlag: (key: keyof FeatureFlags) => void
}

export function FeatureFlagsSection({ flags, onToggleFlag }: FeatureFlagsSectionProps) {
  const t = useT()
  const featureFlags = buildFeatureFlags(t)
  return (
    <>
     <p className="settings-group-heading">Feature Flags (Funciones Experimentales)</p>
     {featureFlags.map(({ key, label, desc }) => (
      <div key={key} className="setting-item-row">
       <div className="setting-item-info">
        <span className="setting-item-title">{label}</span>
        <p className="setting-item-desc">{desc}</p>
       </div>
       <div className="setting-item-control">
        <LedSwitch
         label={label}
         checked={flags[key]}
         onChange={() => onToggleFlag(key)}
        />
       </div>
      </div>
     ))}
    </>
  )
}
