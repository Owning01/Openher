import { memo, useState, useRef, useCallback, useEffect } from "react"
import { RefreshIcon, MonitorIcon, LoadingIcon, CloseIcon } from "../Icons"
import { useOutsideClick } from "../hooks/useOutsideClick"

type DeviceMode = "responsive" | "mobile" | "tablet" | "desktop"

const DEVICE_WIDTHS: Record<DeviceMode, string | null> = {
  responsive: null,
  mobile: "375px",
  tablet: "768px",
  desktop: "1280px",
}

const COMMON_PORTS = [
  { port: "5173", label: ":5173 (Vite)" },
  { port: "3000", label: ":3000 (React/Next)" },
  { port: "8080", label: ":8080 (Http)" },
  { port: "8000", label: ":8000 (Python/API)" },
  { port: "4173", label: ":4173 (Preview)" },
  { port: "8765", label: ":8765 (Stats)" },
]

export type BrowserTabItem = {
  id: string
  url: string
  title: string
  history: string[]
  historyIdx: number
}

function getFavicon(url: string) {
  const u = url.toLowerCase()
  if (u.includes("github.com")) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    )
  }
  if (u.includes("youtube.com") || u.includes("youtu.be")) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  }
  if (u.includes("gemini.google.com") || u.includes("google.")) {
    return <span style={{ fontSize: "0.85rem", color: "#38bdf8" }}>✦</span>
  }
  if (u.includes("localhost") || u.includes("127.0.0.1") || u.includes("0.0.0.0")) {
    return <span style={{ fontSize: "0.85rem" }}>🌐</span>
  }
  return <span style={{ fontSize: "0.85rem" }}>🌍</span>
}

function formatDisplayTitle(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return `localhost${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname !== "/" ? parsed.pathname : ""}`
    }
    const path = parsed.pathname.replace(/^\//, "")
    return path ? `${parsed.hostname}/${path.slice(0, 20)}` : parsed.hostname
  } catch {
    return url.replace(/^https?:\/\//, "").slice(0, 25) || "Nueva pestaña"
  }
}

export const BrowserPanel = memo(function BrowserPanel({
  initialUrl = "http://localhost:5173",
  onClose,
}: {
  initialUrl?: string
  onClose?: () => void
}) {
  const [tabs, setTabs] = useState<BrowserTabItem[]>(() => [
    {
      id: "tab-1",
      url: initialUrl,
      title: formatDisplayTitle(initialUrl),
      history: [initialUrl],
      historyIdx: 0,
    },
  ])
  const [activeTabId, setActiveTabId] = useState<string>("tab-1")
  const [inputUrl, setInputUrl] = useState(initialUrl)
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("responsive")
  const [showTuneDropdown, setShowTuneDropdown] = useState(false)
  const [hasError, setHasError] = useState(false)

  const dropdownRef = useRef<HTMLDivElement | null>(null)
  useOutsideClick(dropdownRef, () => setShowTuneDropdown(false), showTuneDropdown)

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]

  useEffect(() => {
    if (activeTab) {
      setInputUrl(activeTab.url)
      setHasError(false)
    }
  }, [activeTabId, activeTab])

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

  const navigateTab = useCallback((newUrl: string) => {
    const norm = normalizeUrl(newUrl)
    setInputUrl(norm)
    setLoading(true)
    setHasError(false)

    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t
        const nextHist = t.history.slice(0, t.historyIdx + 1)
        nextHist.push(norm)
        return {
          ...t,
          url: norm,
          title: formatDisplayTitle(norm),
          history: nextHist,
          historyIdx: nextHist.length - 1,
        }
      })
    )
    setReloadKey((k) => k + 1)
  }, [activeTabId])

  const handleAddTab = () => {
    const newId = `tab-${Date.now().toString(36)}`
    const defaultUrl = "http://localhost:5173"
    const newTab: BrowserTabItem = {
      id: newId,
      url: defaultUrl,
      title: formatDisplayTitle(defaultUrl),
      history: [defaultUrl],
      historyIdx: 0,
    }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newId)
  }

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (tabs.length === 1) {
      if (onClose) onClose()
      return
    }
    const idx = tabs.findIndex((t) => t.id === id)
    const nextTabs = tabs.filter((t) => t.id !== id)
    setTabs(nextTabs)
    if (activeTabId === id) {
      const nextActive = nextTabs[Math.max(0, idx - 1)]
      if (nextActive) setActiveTabId(nextActive.id)
    }
  }

  const handleBack = () => {
    if (!activeTab || activeTab.historyIdx <= 0) return
    const prevIdx = activeTab.historyIdx - 1
    const prevUrl = activeTab.history[prevIdx]
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, url: prevUrl, historyIdx: prevIdx, title: formatDisplayTitle(prevUrl) } : t))
    )
    setInputUrl(prevUrl)
    setReloadKey((k) => k + 1)
  }

  const handleForward = () => {
    if (!activeTab || activeTab.historyIdx >= activeTab.history.length - 1) return
    const nextIdx = activeTab.historyIdx + 1
    const nextUrl = activeTab.history[nextIdx]
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, url: nextUrl, historyIdx: nextIdx, title: formatDisplayTitle(nextUrl) } : t))
    )
    setInputUrl(nextUrl)
    setReloadKey((k) => k + 1)
  }

  const handleReload = () => {
    setLoading(true)
    setHasError(false)
    setReloadKey((k) => k + 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      navigateTab(inputUrl)
    }
  }

  const handleOpenExternal = () => {
    if (activeTab?.url) {
      window.open(activeTab.url, "_blank", "noopener,noreferrer")
    }
  }

  const targetWidth = DEVICE_WIDTHS[deviceMode]
  const currentSrc = activeTab?.url || "about:blank"

  return (
    <div className="browser-shell">
      {/* 1. Chrome-like Tab Bar on Top (Preserves tabs styling) */}
      <div className="browser-tabbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          return (
            <div
              key={tab.id}
              className={`browser-tab${isActive ? " active" : ""}`}
              onClick={() => setActiveTabId(tab.id)}
              title={tab.url}
            >
              <span className="browser-tab-icon">{getFavicon(tab.url)}</span>
              <span className="browser-tab-title">{tab.title}</span>
              <button
                type="button"
                className="browser-tab-close"
                onClick={(e) => handleCloseTab(e, tab.id)}
                title="Cerrar pestaña"
                aria-label="Cerrar pestaña"
              >
                ×
              </button>
            </div>
          )
        })}

        <button
          type="button"
          className="browser-tab-new"
          onClick={handleAddTab}
          title="Nueva pestaña"
          aria-label="Nueva pestaña"
        >
          +
        </button>
      </div>

      {/* 2. Navigation Toolbar (Clean, no background, no border on buttons/input) */}
      <div className="browser-toolbar">
        <div className="browser-nav-actions">
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleBack}
            disabled={!activeTab || activeTab.historyIdx <= 0}
            title="Atrás"
            aria-label="Atrás"
          >
            ←
          </button>
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleForward}
            disabled={!activeTab || activeTab.historyIdx >= activeTab.history.length - 1}
            title="Adelante"
            aria-label="Adelante"
          >
            →
          </button>
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleReload}
            title="Recargar página"
            aria-label="Recargar"
          >
            <RefreshIcon size={14} />
          </button>
        </div>

        {/* 3. Address Bar (Clean Input without background/border) */}
        <div className="browser-omnibox" ref={dropdownRef}>
          <button
            type="button"
            className={`browser-tune-btn${showTuneDropdown ? " active" : ""}`}
            onClick={() => setShowTuneDropdown((v) => !v)}
            title="Configuración de puertos y resolución"
            aria-label="Configuración"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          <input
            type="text"
            className="browser-omnibox-input"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Introduce una URL o selecciona un puerto..."
          />

          {loading && <LoadingIcon size={14} className="browser-loading-spinner" />}

          {/* Config Dropdown */}
          {showTuneDropdown && (
            <div className="browser-tune-dropdown">
              <div className="browser-tune-section">
                <div className="browser-tune-section-title">Puertos locales rápidos</div>
                <div className="browser-ports-grid">
                  {COMMON_PORTS.map((p) => {
                    const isActive = activeTab?.url.includes(`:${p.port}`)
                    return (
                      <button
                        key={p.port}
                        type="button"
                        className={`browser-port-btn${isActive ? " active" : ""}`}
                        onClick={() => {
                          navigateTab(`http://localhost:${p.port}`)
                          setShowTuneDropdown(false)
                        }}
                      >
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="browser-tune-section">
                <div className="browser-tune-section-title">Modo de dispositivo</div>
                <div className="browser-device-grid">
                  <button
                    type="button"
                    className={`browser-device-btn${deviceMode === "responsive" ? " active" : ""}`}
                    onClick={() => { setDeviceMode("responsive"); setShowTuneDropdown(false) }}
                  >
                    100%
                  </button>
                  <button
                    type="button"
                    className={`browser-device-btn${deviceMode === "mobile" ? " active" : ""}`}
                    onClick={() => { setDeviceMode("mobile"); setShowTuneDropdown(false) }}
                  >
                    📱 375px
                  </button>
                  <button
                    type="button"
                    className={`browser-device-btn${deviceMode === "tablet" ? " active" : ""}`}
                    onClick={() => { setDeviceMode("tablet"); setShowTuneDropdown(false) }}
                  >
                    💻 768px
                  </button>
                  <button
                    type="button"
                    className={`browser-device-btn${deviceMode === "desktop" ? " active" : ""}`}
                    onClick={() => { setDeviceMode("desktop"); setShowTuneDropdown(false) }}
                  >
                    🖥️ 1280px
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="browser-omnibox-actions">
            <button
              type="button"
              className="browser-tune-btn"
              onClick={handleOpenExternal}
              title="Abrir en navegador externo (Chrome/Edge)"
              aria-label="Abrir en navegador externo"
            >
              <MonitorIcon size={14} />
            </button>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            className="browser-nav-btn"
            onClick={onClose}
            title="Cerrar panel de navegador"
            aria-label="Cerrar"
          >
            <CloseIcon size={14} />
          </button>
        )}
      </div>

      {/* 4. Web Viewport */}
      <div className="browser-viewport-container">
        {hasError ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text)", maxWidth: "460px", margin: "auto" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>⚠️</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem" }}>No se pudo conectar con la página</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "20px" }}>
              Si es un servidor local, verifica que el dev server esté ejecutándose (botón <strong>▶ Run Web</strong> en el chat). Si es un sitio web externo protegido, ábrelo en el navegador externo.
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <button type="button" className="btn-primary compact" onClick={handleReload}>
                Reintentar
              </button>
              <button type="button" className="btn-secondary compact" onClick={handleOpenExternal}>
                Abrir en Chrome / Edge
              </button>
            </div>
          </div>
        ) : (
          <iframe
            key={reloadKey}
            src={currentSrc}
            title="Vista previa web"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-pointer-lock allow-top-navigation-by-user-activation"
            allow="clipboard-read; clipboard-write; geolocation; microphone; camera; midi; encrypted-media"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false)
              setHasError(true)
            }}
            className="browser-iframe-element"
            style={{
              width: targetWidth || "100%",
              boxShadow: targetWidth ? "0 4px 24px rgba(0,0,0,0.3)" : "none",
            }}
          />
        )}
      </div>
    </div>
  )
})
