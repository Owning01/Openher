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
  refreshing,
  creating,
  onRefresh,
  onNewSession,
  onOpenSettings,
  dataMode,
  onSearchToggle,
  searchOpen,
  selecting = false,
  onToggleSelect,
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

  return (
    <div className="session-toolbar-wrap session-toolbar-row">
      <div className="session-toolbar-left">
        <button onClick={handleRefresh} className="btn-icon pcf-hbtn" disabled={refreshing} title={t("sessions.refresh")} aria-label={t("sessions.refresh")}>
          {refreshing ? <LoadingIcon size={16} /> : refreshFeedback === "fail" ? <CloseIcon size={15} className="toolbar-refresh-fail" /> : <RefreshIcon size={16} />}
        </button>
        {refreshFeedback === "ok" && (
          <span className="conn-ok" title={t("connection.connected")}>
            <CheckIcon size={13} />
            <span>{t("connection.connected")}</span>
          </span>
        )}
      </div>

      <div className="session-toolbar-right">
        {onSearchToggle && (
          <button
            type="button"
            onClick={onSearchToggle}
            className={`btn-icon pcf-hbtn session-search-toggle${searchOpen ? " active" : ""}`}
            title={t("sessions.searchPlaceholder")}
            aria-label={t("sessions.searchPlaceholder")}
            aria-expanded={searchOpen}
          >
            <SearchIcon size={15} />
          </button>
        )}
        {onToggleSelect && (
          <button
            type="button"
            onClick={onToggleSelect}
            className={`btn-icon pcf-hbtn${selecting ? " active" : ""}`}
            title={t("sessions.select")}
            aria-label={t("sessions.select")}
            aria-pressed={selecting}
          >
            <CheckboxIcon size={15} />
          </button>
        )}
        <span className="mode-indicator" title={t("settings.dataModeTitle")}>
          <span className="mode-btn-text">{modeLabel(dataMode, t)}</span>
        </span>
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="btn-icon pcf-hbtn"
            title={t("nav.settings") || "Settings"}
            aria-label={t("nav.settings") || "Settings"}
          >
            <SettingsIcon size={15} />
          </button>
        )}
        <button
          type="button"
          onClick={onNewSession}
          className="btn-primary compact btn-new-session"
          disabled={creating}
          title={t("sessions.new")}
          aria-label={t("sessions.new")}
        >
          {creating ? <LoadingIcon size={15} /> : <PlusIcon size={15} />}
          <span className="btn-new-session-text">{t("sessions.new") || "Nueva"}</span>
        </button>
      </div>
    </div>
  )
})
