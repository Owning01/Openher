import { useState, useMemo, useCallback } from "react"
import { useThemeVariant } from "../context/themeVariant"

type ThemePickerProps = {
  onClose: () => void
}

export function ThemePicker({ onClose }: ThemePickerProps) {
  const { themeName, themeNames, setTheme, previewTheme } = useThemeVariant()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(themeName)

  const filtered = useMemo(() => {
    if (!query) return themeNames
    const q = query.toLowerCase()
    return themeNames.filter((n) => n.toLowerCase().includes(q))
  }, [query, themeNames])

  const handleSelect = useCallback((name: string) => {
    setSelected(name)
    previewTheme(name)
  }, [previewTheme])

  const handleApply = useCallback(() => {
    setTheme(selected)
    onClose()
  }, [selected, setTheme, onClose])

  const handleCancel = useCallback(() => {
    previewTheme(themeName)
    onClose()
  }, [themeName, previewTheme, onClose])

  return (
    <div className="theme-picker-overlay" onClick={handleCancel}>
      <div className="theme-picker" onClick={(e) => e.stopPropagation()}>
        <div className="theme-picker-header">
          <input
            className="theme-picker-search"
            placeholder="Search themes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button className="theme-picker-close" onClick={handleCancel}>✕</button>
        </div>
        <div className="theme-picker-list">
          {filtered.map((name) => (
            <button
              key={name}
              className={`theme-picker-item${selected === name ? " active" : ""}${themeName === name ? " current" : ""}`}
              onClick={() => handleSelect(name)}
            >
              <span className="theme-picker-name">{name}</span>
              {themeName === name && <span className="theme-picker-badge">current</span>}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="theme-picker-empty">No themes match "{query}"</div>
          )}
        </div>
        <div className="theme-picker-footer">
          <button className="theme-picker-btn theme-picker-cancel" onClick={handleCancel}>Cancel</button>
          <button className="theme-picker-btn theme-picker-apply" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  )
}
