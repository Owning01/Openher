import { GlobeIcon, MonitorIcon } from "../../Icons"
import type { DeviceMode } from "./constants"

// Selector de ancho del viewport (responsive / 375 / 768 / 1280).
export function BrowserDeviceBar({
  deviceMode,
  onSelect,
}: {
  deviceMode: DeviceMode
  onSelect: (mode: DeviceMode) => void
}) {
  return (
    <div className="browser-tune-section">
      <div className="browser-tune-section-title">Modo de dispositivo</div>
      <div className="browser-device-grid">
        <button
          type="button"
          className={`browser-device-btn${deviceMode === "responsive" ? " active" : ""}`}
          onClick={() => onSelect("responsive")}
        >
          <GlobeIcon size={12} /> 100%
        </button>
        <button
          type="button"
          className={`browser-device-btn${deviceMode === "mobile" ? " active" : ""}`}
          onClick={() => onSelect("mobile")}
        >
          <MonitorIcon size={12} /> 375px
        </button>
        <button
          type="button"
          className={`browser-device-btn${deviceMode === "tablet" ? " active" : ""}`}
          onClick={() => onSelect("tablet")}
        >
          <MonitorIcon size={12} /> 768px
        </button>
        <button
          type="button"
          className={`browser-device-btn${deviceMode === "desktop" ? " active" : ""}`}
          onClick={() => onSelect("desktop")}
        >
          <MonitorIcon size={12} /> 1280px
        </button>
      </div>
    </div>
  )
}
