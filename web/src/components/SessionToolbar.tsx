import { memo, useState, useRef, useEffect } from "react"
import { RefreshIcon, PlusIcon, LoadingIcon, SettingsIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { DataMode } from "../types"

type SessionToolbarProps = {
  refreshing: boolean
  creating: boolean
  onRefresh: () => void
  onNewSession: () => void
  onOpenSettings?: () => void
  dataMode: DataMode
  onDataModeChange: (mode: DataMode) => void
  onSearchMessages?: () => void
  onOpenArchivedView?: () => void
  onOpenThemeCreator?: () => void
  onOpenFavoritesManager?: () => void
}

const MODES: DataMode[] = ["full", "saver", "ultra", "miser"]

export const SessionToolbar = memo(function SessionToolbar({
  refreshing, creating, onRefresh, onNewSession, onOpenSettings, dataMode, onDataModeChange,
  onSearchMessages, onOpenArchivedView, onOpenThemeCreator, onOpenFavoritesManager
}: SessionToolbarProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const overflowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClick)
      document.addEventListener("touchstart", handleClick)
    }, 20)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("click", handleClick)
      document.removeEventListener("touchstart", handleClick)
    }
  }, [open])

  useEffect(() => {
    if (!overflowOpen) return
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false)
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClick)
      document.addEventListener("touchstart", handleClick)
    }, 20)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("click", handleClick)
      document.removeEventListener("touchstart", handleClick)
    }
  }, [overflowOpen])

  return (
    <div className="session-toolbar-wrap" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", flexWrap: "nowrap", width: "100%", margin: "0.25rem 0" }}>
      <button onClick={onRefresh} className="btn-icon btn-secondary compact" disabled={refreshing} title={t('sessions.refresh')} style={{ flexShrink: 0, width: 32, height: 32, padding: 0 }}>
        {refreshing ? <LoadingIcon size={14} /> : <RefreshIcon size={14} />}
      </button>
      <button onClick={onNewSession} className="btn-primary compact btn-new-session" disabled={creating} title={t('sessions.new')} style={{ flexShrink: 0, height: 32, padding: "0 0.65rem", display: "inline-flex", alignItems: "center", gap: 6 }}>
        {creating ? <LoadingIcon size={14} /> : <PlusIcon size={14} />}
        <span>{creating ? t('sessions.creating') : t('sessions.new')}</span>
      </button>
      <div className="mode-dropdown-wrap" ref={menuRef} style={{ flexShrink: 0, position: "relative", zIndex: 100 }}>
        <button
          type="button"
          className="btn-secondary compact mode-dropdown-btn"
          onClick={(e) => {
            e.stopPropagation()
            setOpen((v) => !v)
          }}
          title="Data mode"
          style={{ height: 32, padding: "0 0.55rem", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700, fontSize: "0.75rem" }}>
          <span className="mode-btn-text">{dataMode.toUpperCase()}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
        {open && (
          <div
            className="mode-dropdown-menu fade-in"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              left: "auto",
              zIndex: 99999,
              display: "flex",
              flexDirection: "column",
              width: 120,
              background: "var(--surface-strong, #1a1a20)",
              border: "1px solid var(--border-strong, #444)",
              borderRadius: "var(--radius-md, 8px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
              padding: 4,
              gap: 2
            }}>
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                className={`mode-dropdown-item${dataMode === m ? " active" : ""}`}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.45rem 0.75rem",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  borderRadius: "var(--radius-sm, 4px)",
                  border: "none",
                  background: dataMode === m ? "var(--primary, #3b7dd8)" : "transparent",
                  color: dataMode === m ? "#ffffff" : "var(--text, #fff)",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onDataModeChange(m)
                  setOpen(false)
                }}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>
      {onOpenSettings && (
        <button onClick={onOpenSettings} className="btn-icon btn-secondary compact" title={t('nav.settings') || "Settings"} style={{ flexShrink: 0, width: 32, height: 32, padding: 0 }}>
          <SettingsIcon size={14} />
        </button>
      )}
      {(onSearchMessages || onOpenArchivedView || onOpenThemeCreator || onOpenFavoritesManager) && (
        <div className="mode-dropdown-wrap" ref={overflowRef} style={{ flexShrink: 0, position: "relative", zIndex: 100 }}>
          <button onClick={(e) => { e.stopPropagation(); setOverflowOpen((v) => !v) }}
            className="btn-icon btn-secondary compact" title="More"
            style={{ flexShrink: 0, width: 32, height: 32, padding: 0, fontSize: "1.1rem", lineHeight: 1 }}>
            ⋮
          </button>
          {overflowOpen && (
            <div className="mode-dropdown-menu fade-in" style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0, left: "auto", zIndex: 99999,
              display: "flex", flexDirection: "column", width: 180,
              background: "var(--surface-strong, #1a1a20)",
              border: "1px solid var(--border-strong, #444)",
              borderRadius: "var(--radius-md, 8px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)", padding: 4, gap: 2
            }}>
              {onSearchMessages && <button className="mode-dropdown-item" onClick={() => { setOverflowOpen(false); onSearchMessages() }}>🔍 Search Messages</button>}
              {onOpenArchivedView && <button className="mode-dropdown-item" onClick={() => { setOverflowOpen(false); onOpenArchivedView() }}>📦 Archived</button>}
              {onOpenThemeCreator && <button className="mode-dropdown-item" onClick={() => { setOverflowOpen(false); onOpenThemeCreator() }}>🎨 Theme Creator</button>}
              {onOpenFavoritesManager && <button className="mode-dropdown-item" onClick={() => { setOverflowOpen(false); onOpenFavoritesManager() }}>⭐ Favorites</button>}
            </div>
          )}
        </div>
      )}
    </div>
  )
})
