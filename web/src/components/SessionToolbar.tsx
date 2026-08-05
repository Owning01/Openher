import { memo } from "react"
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
}

function modeLabel(mode: DataMode, t: (key: string, params?: Record<string, string | number>) => string): string {
  if (mode === "full") return "Full"
  if (mode === "saver") return t('settings.modeSaver')
  if (mode === "ultra") return t('settings.modeUltra')
  return t('settings.modeMiser')
}

export const SessionToolbar = memo(function SessionToolbar({
  refreshing, creating, onRefresh, onNewSession, onOpenSettings, dataMode
}: SessionToolbarProps) {
  const t = useT()

  return (
    <div className="session-toolbar-wrap" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", flexWrap: "nowrap", width: "100%", margin: "0.25rem 0" }}>
      <button onClick={onRefresh} className="btn-icon" disabled={refreshing} title={t('sessions.refresh')} aria-label={t('sessions.refresh')} style={{ flexShrink: 0, width: 40, height: 40, padding: 0, background: "transparent", border: "none" }}>
        {refreshing ? <LoadingIcon size={22} /> : <RefreshIcon size={22} />}
      </button>
      <button onClick={onNewSession} className="btn-primary compact btn-new-session" disabled={creating} title={t('sessions.new')} style={{ flexShrink: 0, height: 32, padding: "0 0.65rem", display: "inline-flex", alignItems: "center", gap: 6 }}>
        {creating ? <LoadingIcon size={14} /> : <PlusIcon size={14} />}
        <span>{creating ? t('sessions.creating') : t('sessions.new')}</span>
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
