import { memo } from "react"
import { CloseIcon } from "../Icons"
import type { ChatSettings } from "../types"

type Props = {
  settings: ChatSettings
  onSettingChange: <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => void
  onReset: () => void
  onClose: () => void
}

const SPACING_OPTIONS: Array<{ value: ChatSettings["messageSpacing"]; label: string }> = [
  { value: "compact", label: "Compacto" },
  { value: "normal", label: "Normal" },
  { value: "comfortable", label: "Cómodo" },
]

export const ChatCustomizer = memo(function ChatCustomizer({ settings, onSettingChange, onReset, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Personalizar chat"
        style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h3>Personalizar Chat</h3>
          <button className="btn-icon btn-secondary compact" onClick={onClose}><CloseIcon size={14} /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <label className="setting-row">
            <span>Tamaño de letra</span>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <input type="range" min={10} max={24} value={settings.fontSize}
                onChange={(e) => onSettingChange("fontSize", Number(e.target.value))}
                style={{ flex: 1 }} />
              <span style={{ minWidth: "2em", textAlign: "center", fontSize: "0.85rem", fontFamily: "monospace" }}>
                {settings.fontSize}px
              </span>
            </div>
          </label>

          <label className="setting-row">
            <span>Espaciado</span>
            <div className="toggle-row" style={{ gap: "var(--space-1)" }}>
              {SPACING_OPTIONS.map((opt) => (
                <button key={opt.value} type="button"
                  className={`toggle-btn${settings.messageSpacing === opt.value ? " active" : ""}`}
                  onClick={() => onSettingChange("messageSpacing", opt.value)}
                  aria-pressed={settings.messageSpacing === opt.value}>
                  {opt.label}
                </button>
              ))}
            </div>
          </label>

          <div className="toggle-row" style={{ flexDirection: "column", gap: "var(--space-3)" }}>
            <label className="toggle-row" style={{ width: "100%" }}>
              <span>Mostrar razonamiento</span>
              <button type="button" className={`toggle-btn${settings.showThinking ? " active" : ""}`}
                onClick={() => onSettingChange("showThinking", !settings.showThinking)}
                aria-pressed={settings.showThinking}>
                {settings.showThinking ? "Activado" : "Desactivado"}
              </button>
            </label>
            <label className="toggle-row" style={{ width: "100%" }}>
              <span>Mostrar herramientas (tools)</span>
              <button type="button" className={`toggle-btn${settings.showToolCalls ? " active" : ""}`}
                onClick={() => onSettingChange("showToolCalls", !settings.showToolCalls)}
                aria-pressed={settings.showToolCalls}>
                {settings.showToolCalls ? "Activado" : "Desactivado"}
              </button>
            </label>
            <label className="toggle-row" style={{ width: "100%" }}>
              <span>Mostrar hora</span>
              <button type="button" className={`toggle-btn${settings.showTimestamps ? " active" : ""}`}
                onClick={() => onSettingChange("showTimestamps", !settings.showTimestamps)}
                aria-pressed={settings.showTimestamps}>
                {settings.showTimestamps ? "Activado" : "Desactivado"}
              </button>
            </label>
          </div>

          <button type="button" className="btn-secondary compact" onClick={onReset}
            style={{ width: "100%", justifyContent: "center" }}>
            Restaurar valores por defecto
          </button>
        </div>
      </div>
    </div>
  )
})
