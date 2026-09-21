import type { RefObject } from "react"
import {
  CheckIcon, ChevronIcon, CloseIcon, FolderIcon, GlobeIcon, KeyboardIcon,
  LoadingIcon, MonitorIcon, PipIcon, RefreshIcon, SearchIcon,
} from "../../Icons"
import type { VisualSelection } from "../../hooks/useVisualSelection"
import type { InspectTool } from "../../components/browserOverlayScript"
import { COMMON_PORTS, type DeviceMode } from "./constants"
import { BrowserDeviceBar } from "./BrowserDeviceBar"
import { BrowserHistoryMenu } from "./BrowserHistoryMenu"
import { loadHistory } from "./storage"
import type { BrowserBookmark, BrowserTabItem } from "./types"

type Nav = {
  back: () => void
  forward: () => void
  reload: () => void
  home: () => void
  openProject: () => void
}

type Omnibox = {
  value: string
  setValue: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  homeUrl: string
  isSecure: boolean
  inputRef: RefObject<HTMLInputElement | null>
}

type History = {
  containerRef: RefObject<HTMLDivElement | null>
  show: boolean
  setShow: (v: boolean) => void
  bookmarks: BrowserBookmark[]
  suggestions: string[]
  suggestIdx: number
  navigate: (url: string) => void
  clearSuggestions: () => void
}

type Tune = {
  open: boolean
  toggle: () => void
  close: () => void
  dropdownRef: RefObject<HTMLDivElement | null>
  deviceMode: DeviceMode
  setDeviceMode: (m: DeviceMode) => void
  profile: { data_dir: string; webview_dir: string; downloads_dir: string } | null
}

type Inspect = {
  mode?: boolean
  tool: InspectTool
  onToggle?: () => void
  onToggleTool?: (tool: InspectTool) => void
  visualSelection?: VisualSelection | null
  onClearVisual?: () => void
}

export type BrowserToolbarProps = {
  activeTab?: BrowserTabItem
  nav: Nav
  omnibox: Omnibox
  history: History
  tune: Tune
  zoom: { level: number; apply: (next: number) => void }
  find: { open: boolean; toggle: () => void }
  inspect: Inspect
  loading: boolean
  isBookmarked: boolean
  toggleBookmark: () => void
  copyUrl: () => void
  pip: () => void
  minimal: boolean
  toggleMinimal: () => void
  openExternal: () => void
  onClose?: () => void
}

// Barra de navegación Chrome-like: acciones, omnibox + dropdown, favorito/zoom/find
// /PiP/inspect y cierre del panel.
export function BrowserToolbar({
  activeTab,
  nav,
  omnibox,
  history,
  tune,
  zoom,
  find,
  inspect,
  loading,
  isBookmarked,
  toggleBookmark,
  copyUrl,
  pip,
  minimal,
  toggleMinimal,
  openExternal,
  onClose,
}: BrowserToolbarProps) {
  return (
    <div className="browser-toolbar">
      <div className="browser-nav-actions">
        <button
          type="button"
          className="browser-nav-btn"
          onClick={nav.back}
          disabled={!activeTab || activeTab.historyIdx <= 0}
          title="Atrás"
          aria-label="Atrás"
        >
          <span style={{ transform: "rotate(90deg)", display: "inline-flex" }}><ChevronIcon size={14} /></span>
        </button>
        <button
          type="button"
          className="browser-nav-btn"
          onClick={nav.forward}
          disabled={!activeTab || activeTab.historyIdx >= activeTab.history.length - 1}
          title="Adelante"
          aria-label="Adelante"
        >
          <span style={{ transform: "rotate(-90deg)", display: "inline-flex" }}><ChevronIcon size={14} /></span>
        </button>
        <button
          type="button"
          className="browser-nav-btn"
          onClick={nav.reload}
          title="Recargar página"
          aria-label="Recargar"
        >
          <RefreshIcon size={14} />
        </button>
        <button type="button" className="browser-nav-btn" onClick={nav.home} title="Inicio (Google)" aria-label="Inicio">
          <GlobeIcon size={14} />
        </button>
        <button
          type="button"
          className="browser-open-project-btn"
          onClick={nav.openProject}
          title="Abrir carpeta de proyecto para diseñar y auto-servir en OpenDesign"
          aria-label="Abrir proyecto para diseño"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 8px",
            background: "var(--primary-soft)",
            border: "1px solid var(--primary-soft)",
            borderRadius: "6px",
            color: "var(--primary)",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            marginLeft: "4px",
            whiteSpace: "nowrap",
          }}
        >
          <FolderIcon size={13} />
          <span>Abrir Proyecto Web</span>
        </button>
      </div>

      {/* 3. Address Bar — omnibox chrome-like con search, candado, fav, tabs */}
      <div className="browser-omnibox" ref={tune.dropdownRef} style={{ flex: 1 }}>
        <button
          type="button"
          className={`browser-tune-btn${tune.open ? " active" : ""}`}
          onClick={tune.toggle}
          title="Configuración de puertos y resolución"
          aria-label="Configuración"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <span className={omnibox.isSecure ? "browser-addr-lock" : "browser-addr-warn"} title={omnibox.isSecure ? "Conexión segura (HTTPS)" : "No seguro (HTTP)"} style={{ display: "inline-flex", flexShrink: 0, color: omnibox.isSecure ? "var(--success)" : "var(--warning)" }}>
          {omnibox.isSecure ? <CheckIcon size={12} /> : <CloseIcon size={12} />}
        </span>
        <div style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
          <input
            type="text"
            className="browser-omnibox-input"
            ref={omnibox.inputRef}
            value={omnibox.value}
            onChange={(e) => { omnibox.setValue(e.target.value); if (e.target.value.trim().length >= 1) history.setShow(true) }}
            onFocus={() => { if (omnibox.value.trim() === "" || omnibox.value === omnibox.homeUrl) history.setShow(true); else if (loadHistory().length > 0) history.setShow(true) }}
            onKeyDown={omnibox.onKeyDown}
            placeholder="Buscá en Google o escribí una URL"
          />
          {omnibox.value && (
            <button type="button" onClick={() => omnibox.setValue("")} title="Borrar" aria-label="Borrar" style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "0 4px", display: "inline-flex" }}><CloseIcon size={10} /></button>
          )}
          <BrowserHistoryMenu
            containerRef={history.containerRef}
            inputUrl={omnibox.value}
            bookmarks={history.bookmarks}
            showHistory={history.show}
            suggestions={history.suggestions}
            suggestIdx={history.suggestIdx}
            onNavigate={history.navigate}
            onCloseHistory={() => history.setShow(false)}
            onClearSuggestions={history.clearSuggestions}
          />
        </div>

        {loading && <LoadingIcon size={14} className="browser-loading-spinner" />}

        {/* Config Dropdown */}
        {tune.open && (
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
                        history.navigate(`http://localhost:${p.port}`)
                        tune.close()
                      }}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <BrowserDeviceBar deviceMode={tune.deviceMode} onSelect={tune.setDeviceMode} />

            <div className="browser-tune-section browser-shortcuts">
              <div className="browser-tune-section-title"><KeyboardIcon size={13} /> Atajos del navegador</div>
              <div className="browser-shortcuts-list">
                <span><kbd>Ctrl</kbd><kbd>L</kbd><em>Ir a la URL</em></span>
                <span><kbd>Ctrl</kbd><kbd>F</kbd><em>Buscar en la página</em></span>
                <span><kbd>Alt</kbd><kbd>←</kbd><em>Volver</em></span>
                <span><kbd>Ctrl</kbd><kbd>T</kbd><em>Nueva pestaña</em></span>
                <span><kbd>Ctrl</kbd><kbd>W</kbd><em>Cerrar pestaña</em></span>
                <span><kbd>Ctrl</kbd><kbd>D</kbd><em>Guardar favorito</em></span>
                <span><kbd>Ctrl</kbd><kbd>0</kbd><em>Restablecer zoom</em></span>
              </div>
            </div>
            {tune.profile && (
              <div className="browser-tune-section">
                <div className="browser-tune-section-title">Perfil de datos (este exe)</div>
                <div style={{ fontSize: 11, color: "var(--muted)", overflowWrap: "anywhere" }}>
                  <div title={tune.profile.data_dir}>Datos: {tune.profile.data_dir}</div>
                  <div title={tune.profile.downloads_dir}>Descargas: {tune.profile.downloads_dir}</div>
                </div>
                <button
                  type="button"
                  className="browser-port-btn"
                  style={{ marginTop: 6 }}
                  onClick={() => { try { void navigator.clipboard.writeText(tune.profile!.downloads_dir) } catch {} }}
                >
                  Copiar ruta de descargas
                </button>
              </div>
            )}
          </div>
        )}

        <div className="browser-omnibox-actions">
          <button type="button" className={`browser-tune-btn${isBookmarked ? " browser-star-on" : ""}`} onClick={toggleBookmark} title={isBookmarked ? "Quitar favorito" : "Agregar a favoritos"} aria-label="Favorito">
            <span style={{ fontSize: 14 }}>{isBookmarked ? "*" : "☆"}</span>
          </button>
          <button type="button" className="browser-tune-btn browser-utility-secondary" onClick={copyUrl} title="Copiar URL" aria-label="Copiar URL">
            <span style={{ fontSize: 12 }}>⧉</span>
          </button>
          <div className="browser-zoom-group browser-utility-secondary" title="Zoom de página">
            <button type="button" className="browser-tune-btn" onClick={() => zoom.apply(zoom.level - 0.1)} aria-label="Alejar">−</button>
            <span style={{ fontSize: 11, minWidth: 34, textAlign: "center" }}>{Math.round(zoom.level * 100)}%</span>
            <button type="button" className="browser-tune-btn" onClick={() => zoom.apply(zoom.level + 0.1)} aria-label="Acercar">+</button>
            <button type="button" className="browser-tune-btn" onClick={() => zoom.apply(1)} aria-label="100%">↺</button>
          </div>
          <button type="button" className={`browser-tune-btn${find.open ? " active" : ""}`} onClick={find.toggle} title="Buscar en la página (Ctrl+F)" aria-label="Buscar">
            <SearchIcon size={13} />
          </button>
          <button type="button" className="browser-tune-btn" onClick={pip} title="Picture-in-Picture: clic en un video (en vivo) o en una región de la página" aria-label="Picture-in-Picture">
            <PipIcon size={14} />
          </button>
          {inspect.onToggle && (
            <button
              type="button"
              className={`browser-tune-btn${inspect.mode && inspect.tool === "picker" ? " active" : ""}`}
              onClick={() => inspect.onToggleTool ? inspect.onToggleTool("picker") : inspect.onToggle!()}
              title={inspect.mode && inspect.tool === "picker" ? "Salir selección (Esc)" : "Seleccionar elemento: clic (◈)"}
              aria-label="Seleccionar elemento"
              style={inspect.mode && inspect.tool === "picker" ? { color: "var(--primary)", background: "var(--primary-soft)" } : undefined}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>◈</span>
            </button>
          )}
          {inspect.onToggleTool && (
            <button
              type="button"
              className={`browser-tune-btn${inspect.mode && inspect.tool === "pod" ? " active" : ""}`}
              onClick={() => inspect.onToggleTool!("pod")}
              title={inspect.mode && inspect.tool === "pod" ? "Salir selección (Esc)" : "Marcar área: arrastrá un trazo (⬚)"}
              aria-label="Marcar área"
              style={inspect.mode && inspect.tool === "pod" ? { color: "var(--warning)", background: "var(--warning-soft)" } : undefined}
            >
              <span style={{ fontSize: 13, lineHeight: 1 }}>⬚</span>
            </button>
          )}
          {inspect.visualSelection && inspect.onClearVisual && (
            <button
              type="button"
              className="browser-tune-btn"
              onClick={inspect.onClearVisual}
              title="Quitar zona seleccionada"
              aria-label="Quitar zona"
            >
              ×
            </button>
          )}
          <button type="button" className="browser-tune-btn browser-utility-secondary" onClick={toggleMinimal} title={minimal ? "Mostrar barra" : "Modo minimalista (F11)"} aria-label="Minimal">Expand</button>
          <button
            type="button"
            className="browser-tune-btn browser-utility-secondary"
            onClick={openExternal}
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
  )
}
