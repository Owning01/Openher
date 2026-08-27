import { memo, Suspense, type ReactNode } from "react"
import { useT } from "../../i18n-context"
import { PluginSlot } from "../../plugins"
import type { DesktopActivity } from "../activity-bar/ActivityBar"
import type { SessionView } from "../../types"
import { PCFilesPanel } from "../../features/pc-files/PCFilesPanel"
import { SourceControlPanel } from "../../components/SourceControlPanel"
import { ConfigPanel } from "../../components/shellPanels"

const PANEL_SUSPENSE_FALLBACK = (
  <div
    className="panel-loading"
    style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}
  >
    Cargando…
  </div>
)

export interface DesktopSidebarProps {
  activity: DesktopActivity
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean | ((prev: boolean) => boolean)) => void
  sessionsView: ReactNode
  currentActiveSession: SessionView | null
  activeSessionDir?: string
  selectedSession: SessionView | null
  explorerCwd?: string
  sessions: SessionView[]
  setExplorerCwd: (d: string) => void
  startSidebarResize: (e: React.PointerEvent<HTMLDivElement>) => void
}

export const DesktopSidebar = memo(function DesktopSidebar({
  activity,
  sidebarCollapsed,
  setSidebarCollapsed,
  sessionsView,
  currentActiveSession,
  activeSessionDir,
  selectedSession,
  explorerCwd,
  sessions,
  setExplorerCwd,
  startSidebarResize,
}: DesktopSidebarProps) {
  const t = useT()
  const isFiles = activity === "explorer" || activity === "pcFiles"

  return (
    <aside className={`app-desktop-sidebar${sidebarCollapsed ? " collapsed" : ""}`}>
      {sidebarCollapsed ? (
        <div className="desktop-sidebar-rail">
          <button
            type="button"
            className="btn-icon compact"
            title={t("desktop.expandSidebar")}
            aria-label={t("desktop.expandSidebar")}
            onClick={() => setSidebarCollapsed(false)}
          >
            »
          </button>
        </div>
      ) : (
        <>
          {!isFiles && (
            <div className="desktop-sidebar-header">
              <span className="desktop-sidebar-title">
                {activity === "sessions"
                  ? "OpenHer"
                  : activity === "scm"
                  ? t("scm.title")
                  : t("shell.kindConfig")}
              </span>
              <span className="desktop-sidebar-actions">
                <button
                  type="button"
                  className="btn-icon compact"
                  title={t("desktop.collapseSidebar")}
                  aria-label={t("desktop.collapseSidebar")}
                  onClick={() => setSidebarCollapsed(true)}
                >
                  «
                </button>
              </span>
            </div>
          )}
          <div className="desktop-sidebar-body">
            <Suspense fallback={PANEL_SUSPENSE_FALLBACK}>
              {activity === "sessions" ? (
                sessionsView
              ) : isFiles ? (
                <PCFilesPanel onCollapseSidebar={() => setSidebarCollapsed(true)} />
              ) : activity === "scm" ? (
                <SourceControlPanel
                  cwd={
                    currentActiveSession?.directory ||
                    activeSessionDir ||
                    selectedSession?.directory ||
                    explorerCwd ||
                    sessions[0]?.directory
                  }
                  availableDirs={Array.from(new Set(sessions.map((s) => s.directory).filter(Boolean)))}
                  onSelectDir={(d) => setExplorerCwd(d)}
                />
              ) : (
                <ConfigPanel />
              )}
              <PluginSlot id="sidebar.activity" />
            </Suspense>
          </div>
          <div
            className="desktop-sidebar-resizer"
            onPointerDown={startSidebarResize}
            title={t("desktop.resizeSidebar")}
          />
        </>
      )}
    </aside>
  )
})
