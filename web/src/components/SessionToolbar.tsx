import { memo } from "react"
import { RefreshIcon, PlusIcon, LoadingIcon, SettingsIcon, SearchIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { DataMode } from "../types"

type SessionToolbarProps = {
  refreshing: boolean
  creating: boolean
  onRefresh: () => void
  onNewSession: () => void
  onOpenSettings?: () => void
  dataMode: DataMode
  onSearchToggle?: () => void
  searchOpen?: boolean
  selecting?: boolean
  onToggleSelect?: () => void
}

function modeLabel(mode: DataMode, t: (key: string, params?: Record<string, string | number>) => string): string {
  if (mode === "full") return "Full"
  if (mode === "saver") return t('settings.modeSaver')
  if (mode === "ultra") return t('settings.modeUltra')
  return t('settings.modeMiser')
}

function CheckboxIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" />
      <path d="M5.5 8.2l2 2 3.2-4" />
    </svg>
  )
}

export const SessionToolbar = memo(function SessionToolbar({
  refreshing, creating, onRefresh, onNewSession, onOpenSettings, dataMode, onSearchToggle, searchOpen, selecting = false, onToggleSelect
}: SessionToolbarProps) {
  const t = useT()

  return (
    <div className="session-toolbar-wrap" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", flexWrap: "nowrap", width: "100%", margin: "0.25rem 0" }}>
      <button onClick={onRefresh} className="btn-icon" disabled={refreshing} title={t('sessions.refresh')} aria-label={t('sessions.refresh')} style={{ flexShrink: 0, width: 40, height: 40, padding: 0, background: "transparent", border: "none" }}>
        {refreshing ? <LoadingIcon size={22} /> : <RefreshIcon size={22} />}
      </button>
      {onSearchToggle && (
        <button onClick={onSearchToggle} className="btn-icon btn-secondary compact session-search-toggle" title={t('sessions.searchPlaceholder')} aria-label={t('sessions.searchPlaceholder')} aria-expanded={searchOpen} style={{ flexShrink: 0, width: 32, height: 32, padding: 0 }}>
          <SearchIcon size={14} />
        </button>
      )}
      {onToggleSelect && (
        <button onClick={onToggleSelect} className={`btn-icon btn-secondary compact${selecting ? " active" : ""}`}
          title={t('sessions.select')} aria-label={t('sessions.select')} aria-pressed={selecting}
          style={{ flexShrink: 0, width: 32, height: 32, padding: 0 }}>
          <CheckboxIcon size={14} />
        </button>
      )}
      <button onClick={onNewSession} className="btn-primary compact btn-new-session" disabled={creating} title={t('sessions.new')} aria-label={t('sessions.new')} style={{ flexShrink: 0, width: 32, height: 32, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        {creating ? <LoadingIcon size={14} /> : <PlusIcon size={14} />}
      </button>
      <span className="mode-indicator" title={t('settings.dataModeTitle')}>
        <span className="mode-btn-text">{modeLabel(dataMode, t)}</span>
      </span>
      {onOpenSettings && (
        <button onClick={onOpenSettings} className="btn-icon btn-secondary compact" title={t('nav.settings') || "Settings"} style={{ flexShrink: 0, width: 32, height: 32, padding: 0 }}>
          <SettingsIcon size={14} />
        </button>
      )}
    </div>
  )
})
