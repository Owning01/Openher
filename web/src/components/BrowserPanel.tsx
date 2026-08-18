import { memo, useState, useRef, useCallback, useEffect } from "react"
import { RefreshIcon, MonitorIcon, LoadingIcon } from "../Icons"

type DeviceMode = "responsive" | "mobile" | "tablet" | "desktop"

const DEVICE_WIDTHS: Record<DeviceMode, string | null> = {
  responsive: null,
  mobile: "375px",
  tablet: "768px",
  desktop: "1280px",
}

const COMMON_PORTS = ["5173", "3000", "8080", "8000", "4173", "8765"]

export const BrowserPanel = memo(function BrowserPanel({
  initialUrl = "http://localhost:5173",
  onClose,
}: {
  initialUrl?: string
  onClose?: () => void
}) {
  const [url, setUrl] = useState(initialUrl)
  const [inputUrl, setInputUrl] = useState(initialUrl)
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("responsive")
  const [history, setHistory] = useState<string[]>([initialUrl])
  const [historyIdx, setHistoryIdx] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (initialUrl && initialUrl !== url) {
      setUrl(initialUrl)
      setInputUrl(initialUrl)
      setHistory((prev) => [...prev, initialUrl])
      setHistoryIdx((prev) => prev + 1)
      setReloadKey((k) => k + 1)
    }
  }, [initialUrl])

  const normalizeUrl = (raw: string): string => {
    let u = raw.trim()
    if (!u) return "http://localhost:5173"
    if (/^\d{2,5}$/.test(u)) {
      return `http://localhost:${u}`
    }
    if (!/^https?:\/\//i.test(u)) {
      if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?(\/.*)?$/i.test(u)) {
        return `http://${u}`
      }
      return `https://${u}`
    }
    return u
  }

  const navigateTo = useCallback((newUrl: string) => {
    const norm = normalizeUrl(newUrl)
    setUrl(norm)
    setInputUrl(norm)
    setLoading(true)
    setHistory((prev) => {
      const next = prev.slice(0, historyIdx + 1)
      next.push(norm)
      return next
    })
    setHistoryIdx((prev) => prev + 1)
    setReloadKey((k) => k + 1)
  }, [historyIdx])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      navigateTo(inputUrl)
    }
  }

  const handleBack = () => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1
      const prevUrl = history[prevIdx]
      setHistoryIdx(prevIdx)
      setUrl(prevUrl)
      setInputUrl(prevUrl)
      setReloadKey((k) => k + 1)
    }
  }

  const handleForward = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1
      const nextUrl = history[nextIdx]
      setHistoryIdx(nextIdx)
      setUrl(nextUrl)
      setInputUrl(nextUrl)
      setReloadKey((k) => k + 1)
    }
  }

  const handleReload = () => {
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  const handleOpenExternal = () => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const targetWidth = DEVICE_WIDTHS[deviceMode]

  return (
    <div className="browser-panel" style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "var(--surface)", overflow: "hidden" }}>
      <div className="browser-toolbar" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)", flexShrink: 0 }}>
        <button
          type="button"
          className="btn-icon compact"
          onClick={handleBack}
          disabled={historyIdx <= 0}
          title="Atrás"
          aria-label="Atrás"
        >
          ←
        </button>
        <button
          type="button"
          className="btn-icon compact"
          onClick={handleForward}
          disabled={historyIdx >= history.length - 1}
          title="Adelante"
          aria-label="Adelante"
        >
          →
        </button>
        <button
          type="button"
          className="btn-icon compact"
          onClick={handleReload}
          title="Recargar página"
          aria-label="Recargar"
        >
          <RefreshIcon size={14} />
        </button>

        <div className="browser-url-bar" style={{ display: "flex", flex: 1, alignItems: "center", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "0 8px", minWidth: 0 }}>
          <span style={{ color: "var(--muted)", marginRight: 6, fontSize: "0.75rem", userSelect: "none" }}>🌐</span>
          <input
            type="text"
            className="browser-url-input"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="http://localhost:5173 o URL..."
            style={{ flex: 1, border: "none", background: "transparent", color: "var(--text)", fontSize: "0.8rem", outline: "none", height: "26px", minWidth: 0 }}
          />
          {loading && <LoadingIcon size={13} className="browser-loading-spinner" />}
        </div>

        {/* Quick ports */}
        <div className="browser-quick-ports" style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
          {COMMON_PORTS.map((p) => {
            const isActive = url.includes(`:${p}`)
            return (
              <button
                key={p}
                type="button"
                className={`browser-port-chip${isActive ? " active" : ""}`}
                onClick={() => navigateTo(`http://localhost:${p}`)}
                title={`Probar localhost:${p}`}
                style={{
                  fontSize: "0.65rem",
                  padding: "2px 5px",
                  borderRadius: "var(--radius-sm)",
                  border: isActive ? "1px solid var(--primary)" : "1px solid var(--border)",
                  background: isActive ? "var(--primary-soft)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--muted)",
                  cursor: "pointer",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                :{p}
              </button>
            )
          })}
        </div>

        {/* Device Mode Toggle */}
        <div className="browser-device-toggle" style={{ display: "flex", gap: "2px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "1px", background: "var(--bg)", flexShrink: 0 }}>
          <button
            type="button"
            className={`btn-icon compact${deviceMode === "responsive" ? " active" : ""}`}
            onClick={() => setDeviceMode("responsive")}
            title="100% Responsive"
            style={{ fontSize: "0.7rem", padding: "2px 6px", height: "22px", minWidth: "22px", background: deviceMode === "responsive" ? "var(--surface-3)" : "transparent" }}
          >
            Full
          </button>
          <button
            type="button"
            className={`btn-icon compact${deviceMode === "mobile" ? " active" : ""}`}
            onClick={() => setDeviceMode("mobile")}
            title="Móvil (375px)"
            style={{ fontSize: "0.7rem", padding: "2px 6px", height: "22px", minWidth: "22px", background: deviceMode === "mobile" ? "var(--surface-3)" : "transparent" }}
          >
            📱
          </button>
          <button
            type="button"
            className={`btn-icon compact${deviceMode === "tablet" ? " active" : ""}`}
            onClick={() => setDeviceMode("tablet")}
            title="Tablet (768px)"
            style={{ fontSize: "0.7rem", padding: "2px 6px", height: "22px", minWidth: "22px", background: deviceMode === "tablet" ? "var(--surface-3)" : "transparent" }}
          >
            💻
          </button>
        </div>

        <button
          type="button"
          className="btn-icon compact"
          onClick={handleOpenExternal}
          title="Abrir en navegador externo"
          aria-label="Abrir en navegador externo"
        >
          <MonitorIcon size={14} />
        </button>

        {onClose && (
          <button
            type="button"
            className="btn-icon compact"
            onClick={onClose}
            title="Cerrar navegador"
            aria-label="Cerrar navegador"
          >
            ×
          </button>
        )}
      </div>

      <div
        className="browser-viewport"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "stretch",
          background: "var(--bg)",
          overflow: "auto",
          position: "relative",
        }}
      >
        <iframe
          key={reloadKey}
          ref={iframeRef}
          src={url}
          title="Vista previa web / navegador"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-pointer-lock"
          allow="clipboard-read; clipboard-write; geolocation; microphone; camera; midi"
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
          style={{
            border: targetWidth ? "1px solid var(--border)" : "none",
            width: targetWidth || "100%",
            height: "100%",
            background: "#ffffff",
            boxShadow: targetWidth ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
            transition: "width 0.2s ease",
          }}
        />
      </div>
    </div>
  )
})
