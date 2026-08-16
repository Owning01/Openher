import { memo, useCallback, useRef, useState } from "react"
import { RefreshIcon, PlusIcon, LoadingIcon, SettingsIcon, SearchIcon, CheckIcon, CloseIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { DataMode } from "../types"

type SessionToolbarProps = {
  refreshing: boolean
  creating: boolean
  /** Debe resolver true si el refresh terminó ok, false si falló (feedback visible). */
  onRefresh: () => Promise<boolean>
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
  const [refreshFeedback, setRefreshFeedback] = useState<"ok" | "fail" | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleRefresh = useCallback(async () => {
    if (refreshing) return
    setRefreshFeedback(null)
    const ok = await onRefresh()
    setRefreshFeedback(ok ? "ok" : "fail")
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => setRefreshFeedback(null), 1600)
  }, [refreshing, onRefresh])

  const btnStyle: React.CSSProperties = { flexShrink: 0, width: 40, height: 40, padding: 0 }
  const btnClass = "btn-icon btn-secondary compact"

  return (
    <div className="session-toolbar-wrap session-toolbar-row" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", flexWrap: "nowrap", width: "100%", margin: "0.25rem 0" }}>
      <button onClick={handleRefresh} className="btn-icon" disabled={refreshing} title={t('sessions.refresh')} aria-label={t('sessions.refresh')} style={{ ...btnStyle, background: "transparent", border: "none" }}>
        {refreshing ? <LoadingIcon size={20} /> : refreshFeedback === "fail" ? <CloseIcon size={16} className="toolbar-refresh-fail" /> : <RefreshIcon size={20} />}
      </button>
      {refreshFeedback === "ok" && (
        <span className="conn-ok" title={t('connection.connected')}>
          <CheckIcon size={14} />
          <span>{t('connection.connected')}</span>
        </span>
      )}
      {onSearchToggle && (
        <button onClick={onSearchToggle} className={`${btnClass} session-search-toggle`} title={t('sessions.searchPlaceholder')} aria-label={t('sessions.searchPlaceholder')} aria-expanded={searchOpen} style={btnStyle}>
          <SearchIcon size={18} />
        </button>
      )}
      {onToggleSelect && (
        <button onClick={onToggleSelect} className={`${btnClass}${selecting ? " active" : ""}`}
          title={t('sessions.select')} aria-label={t('sessions.select')} aria-pressed={selecting}
          style={btnStyle}>
          <CheckboxIcon size={18} />
        </button>
      )}
      <button onClick={onNewSession} className="btn-primary compact btn-new-session" disabled={creating} title={t('sessions.new')} aria-label={t('sessions.new')} style={{ ...btnStyle, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        {creating ? <LoadingIcon size={18} /> : <PlusIcon size={18} />}
      </button>
      <span className="mode-indicator" title={t('settings.dataModeTitle')}>
        <span className="mode-btn-text">{modeLabel(dataMode, t)}</span>
      </span>
      {onOpenSettings && (
        <button onClick={onOpenSettings} className={btnClass} title={t('nav.settings') || "Settings"} style={btnStyle}>
          <SettingsIcon size={18} />
        </button>
      )}
    </div>
  )
})
