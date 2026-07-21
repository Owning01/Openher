import { memo } from "react"
import type { DataMode } from "../types"
import { useT } from "../i18n-context"

type DataModeSwitcherProps = {
  mode: DataMode
  onChange: (mode: DataMode) => void
}

const MODE_OPTIONS: DataMode[] = ["full", "saver", "ultra", "miser"]

export const DataModeSwitcher = memo(function DataModeSwitcher({ mode, onChange }: DataModeSwitcherProps) {
  const t = useT()
  return (
    <div className="mode-switcher">
      <span className="mode-label">{t('settings.mode')}:</span>
      {MODE_OPTIONS.map((m) => (
        <button key={m} className={`mode-btn${mode === m ? " active" : ""}`}
          onClick={() => onChange(m)}
          aria-pressed={mode === m}>
          {m === "full" ? "Full" : m === "saver" ? "Saver" : m === "ultra" ? "ULTRA" : "Miser"}
        </button>
      ))}
    </div>
  )
})
