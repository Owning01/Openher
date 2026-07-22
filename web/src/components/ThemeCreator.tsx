import { memo, useState, useCallback } from "react"
import { ModalHeader } from "./ModalHeader"

const COLOR_SLOTS = [
  ["background", "Background"],
  ["backgroundPanel", "Panel"],
  ["backgroundElement", "Element"],
  ["border", "Border"],
  ["text", "Text"],
  ["textMuted", "Muted"],
  ["primary", "Primary"],
  ["secondary", "Secondary"],
  ["accent", "Accent"],
  ["warning", "Warning"],
  ["success", "Success"],
  ["error", "Error"],
  ["info", "Info"],
] as const

const DARK_DEFAULTS: Record<string, string> = {
  background: "#0a0a0f",
  backgroundPanel: "#14141a",
  backgroundElement: "#1e1e26",
  border: "#2a2a35",
  text: "#eeeeee",
  textMuted: "#888899",
  primary: "#6c8cff",
  secondary: "#5a5a6e",
  accent: "#f0c060",
  warning: "#f5a742",
  success: "#4caf7d",
  error: "#e55545",
  info: "#5ba3e6",
}

type Props = {
  onClose: () => void
}

export const ThemeCreator = memo(function ThemeCreator({ onClose }: Props) {
  const [colors, setColors] = useState<Record<string, string>>({ ...DARK_DEFAULTS })
  const [themeName, setThemeName] = useState("my-theme")

  const setColor = useCallback((slot: string, value: string) => {
    setColors((prev) => ({ ...prev, [slot]: value }))
  }, [])

  const exportJSON = useCallback(() => {
    const theme = {
      defs: {},
      theme: Object.fromEntries(
        Object.entries(colors).map(([k, v]) => [k, { dark: v }])
      ),
    }
    const json = JSON.stringify(theme, null, 2)
    navigator.clipboard.writeText(json).catch(() => {})
  }, [colors])

  const applyPreview = useCallback(() => {
    const root = document.documentElement
    const map: Record<string, string> = {
      background: "--bg", backgroundPanel: "--surface", backgroundElement: "--surface-strong",
      border: "--border", text: "--text", textMuted: "--muted",
      primary: "--primary", secondary: "--secondary", accent: "--accent",
      warning: "--warning", success: "--success", error: "--danger", info: "--info",
    }
    for (const [slot, cssVar] of Object.entries(map)) {
      if (colors[slot]) root.style.setProperty(cssVar, colors[slot])
    }
  }, [colors])

  const resetPreview = useCallback(() => {
    const root = document.documentElement
    const vars = ["--bg", "--surface", "--surface-strong", "--border", "--text", "--muted",
      "--primary", "--secondary", "--accent", "--warning", "--success", "--danger", "--info"]
    for (const v of vars) root.style.removeProperty(v)
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content theme-creator" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Theme Creator">
        <ModalHeader title="Theme Creator" onClose={onClose} />
        <div className="modal-body">
          <label className="setting-row">
            <span>Theme name</span>
            <input value={themeName} onChange={(e) => setThemeName(e.target.value)} />
          </label>
          <div className="theme-color-grid">
            {COLOR_SLOTS.map(([slot, label]) => (
              <label key={slot} className="theme-color-item">
                <span>{label}</span>
                <div className="theme-color-input-row">
                  <input
                    type="color"
                    value={colors[slot] || "#000000"}
                    onChange={(e) => setColor(slot, e.target.value)}
                  />
                  <input
                    type="text"
                    value={colors[slot] || ""}
                    onChange={(e) => setColor(slot, e.target.value)}
                    className="theme-color-hex"
                  />
                </div>
              </label>
            ))}
          </div>
          <div className="modal-actions">
            <button className="btn-primary compact" onClick={exportJSON}>Copy JSON</button>
            <button className="btn-secondary compact" onMouseEnter={applyPreview} onMouseLeave={resetPreview}>Preview</button>
          </div>
        </div>
      </div>
    </div>
  )
})
