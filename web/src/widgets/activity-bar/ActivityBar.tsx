import { memo, type ReactNode } from "react"
import {
  ChatIcon,
  FolderIcon,
  TerminalIcon,
  StatsIcon,
  GlobeIcon,
  LayersIcon,
  BrainIcon,
  BranchIcon,
  PencilIcon,
  SettingsIcon,
  GraduationCapIcon,
} from "../../Icons"
import { useT } from "../../i18n-context"
import type { DesktopLayout, ViewType } from "../../types"

export type DesktopActivity = "sessions" | "explorer" | "stats" | "kanban" | "config" | "quickchat" | "scm" | "pcFiles" | "reports"

export interface PluginTabItem {
  key: string
  title?: string
  icon?: ReactNode
}

export interface ActivityBarProps {
  activity: DesktopActivity
  setActivity: (act: DesktopActivity) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean | ((prev: boolean) => boolean)) => void
  showTerminal: boolean
  setShowTerminal: (v: boolean | ((prev: boolean) => boolean)) => void
  tabStacks?: string[][]
  desktopLayout: DesktopLayout
  openStatsAsTab: () => void
  openBrowserAsTab: (url: string) => void
  handleOpenKanban: () => void
  rightSidebarCollapsed: boolean
  setRightSidebarCollapsed: (v: boolean | ((prev: boolean) => boolean)) => void
  handleOpenDesign: () => void
  setShowPluginsModal: (v: boolean) => void
  pluginTabs: PluginTabItem[]
  openPluginAsTab: (key: string) => void
  memInfo: { jsHeapUsed: number; jsHeapTotal: number } | null
  formatBytes: (bytes: number) => string
  handleOpenLearning: () => void
  handleOpenReports: () => void
  handleOpenScreenshots: () => void
  view: ViewType
  handleNavigate: (v: ViewType) => void
}

export const ActivityBar = memo(function ActivityBar({
  activity,
  setActivity,
  sidebarCollapsed,
  setSidebarCollapsed,
  showTerminal,
  setShowTerminal,
  tabStacks,
  desktopLayout,
  openStatsAsTab,
  openBrowserAsTab,
  handleOpenKanban,
  rightSidebarCollapsed,
  setRightSidebarCollapsed,
  handleOpenDesign,
  setShowPluginsModal,
  pluginTabs,
  openPluginAsTab,
  memInfo,
  formatBytes,
  handleOpenLearning,
  handleOpenReports,
  handleOpenScreenshots,
  view,
  handleNavigate,
}: ActivityBarProps) {
  const t = useT()

  return (
    <nav className="app-desktop-activity" aria-label="Actividades">
      <div className="app-desktop-activity-top">
        <button
          type="button"
          data-item="sessions"
          className={`activity-btn${activity === "sessions" ? " active" : ""}`}
          title={t("shell.kindSession")}
          aria-label={t("shell.kindSession")}
          onClick={() => {
            if (activity === "sessions") setSidebarCollapsed(!sidebarCollapsed)
            else {
              setActivity("sessions")
              setSidebarCollapsed(false)
            }
          }}
        >
          <ChatIcon size={18} />
        </button>

        <button
          type="button"
          data-item="explorer"
          className={`activity-btn${activity === "explorer" || activity === "pcFiles" ? " active" : ""}`}
          title="Archivos"
          aria-label="Archivos"
          onClick={() => {
            if (activity === "explorer" || activity === "pcFiles") setSidebarCollapsed(!sidebarCollapsed)
            else {
              setActivity("explorer")
              setSidebarCollapsed(false)
            }
          }}
        >
          <FolderIcon size={18} />
        </button>

        <button
          type="button"
          data-item="terminal"
          className={`activity-btn${showTerminal ? " active" : ""}`}
          title={t("session.terminal")}
          aria-label={t("session.terminal")}
          onClick={() => setShowTerminal((v) => !v)}
        >
          <TerminalIcon size={18} />
        </button>

        <button
          type="button"
          data-item="stats"
          className={`activity-btn${
            tabStacks?.some((s) => s.includes("__stats__")) ||
            desktopLayout.sessions.includes("__stats__")
              ? " active"
              : ""
          }`}
          title={t("shell.kindStats")}
          aria-label={t("shell.kindStats")}
          onClick={() => openStatsAsTab()}
        >
          <StatsIcon size={18} />
        </button>

        <button
          type="button"
          data-item="browser"
          className={`activity-btn${
            tabStacks?.some((s) => s.some((id) => id.startsWith("browser:"))) ||
            desktopLayout.sessions.some((s) => s?.startsWith("browser:"))
              ? " active"
              : ""
          }`}
          title="Navegador Web"
          aria-label="Navegador Web"
          onClick={() => openBrowserAsTab("https://www.google.com")}
        >
          <GlobeIcon size={18} />
        </button>

        <button
          type="button"
          data-item="kanban"
          className={`activity-btn${
            tabStacks?.some((s) => s.includes("__kanban__")) ||
            desktopLayout.sessions.includes("__kanban__") ||
            (desktopLayout.panelKinds as any[]).includes("kanban")
              ? " active"
              : ""
          }`}
          title={t("shell.kindKanban")}
          aria-label={t("shell.kindKanban")}
          onClick={handleOpenKanban}
        >
          <LayersIcon size={18} />
        </button>

        <button
          type="button"
          data-item="reports"
          className={`activity-btn${
            tabStacks?.some((s) => s.includes("__reports__")) ||
            desktopLayout.sessions.includes("__reports__")
              ? " active"
              : ""
          }`}
          title="Informes"
          aria-label="Informes"
          onClick={handleOpenReports}
        >
          <span style={{ fontSize: 14, fontWeight: 800 }}>≡</span>
        </button>

        <button
          type="button"
          data-item="screenshots"
          className={`activity-btn${
            tabStacks?.some((s) => s.includes("__screenshots__")) ||
            desktopLayout.sessions.includes("__screenshots__")
              ? " active"
              : ""
          }`}
          title="Screenshots"
          aria-label="Screenshots"
          onClick={handleOpenScreenshots}
        >
          <span style={{ fontSize: 14 }}>📸</span>
        </button>

        <button
          type="button"
          data-item="quickchat"
          className={`activity-btn${!rightSidebarCollapsed ? " active" : ""}`}
          title={t("quickchat.title")}
          aria-label={t("quickchat.title")}
          onClick={() => setRightSidebarCollapsed((v) => !v)}
        >
          <BrainIcon size={18} />
        </button>

        <button
          type="button"
          data-item="scm"
          className={`activity-btn${activity === "scm" ? " active" : ""}`}
          title={t("scm.title")}
          aria-label={t("scm.title")}
          onClick={() => {
            if (activity === "scm") setSidebarCollapsed(!sidebarCollapsed)
            else {
              setActivity("scm")
              setSidebarCollapsed(false)
            }
          }}
        >
          <BranchIcon size={18} />
        </button>

        <button
          type="button"
          data-item="design"
          className={`activity-btn${
            tabStacks?.some((s) => s.includes("__design__")) ||
            desktopLayout.sessions.includes("__design__") ||
            (desktopLayout.panelKinds as any[]).includes("design")
              ? " active"
              : ""
          }`}
          title="Open Design"
          aria-label="Open Design"
          onClick={handleOpenDesign}
        >
          <PencilIcon size={18} />
        </button>

        <button
          type="button"
          data-item="plugins"
          className={`activity-btn${
            tabStacks?.some((s) => s.some((id) => id.startsWith("plugin:external:"))) ? " active" : ""
          }`}
          title="Plugins"
          aria-label="Plugins"
          onClick={() => setShowPluginsModal(true)}
        >
          <GlobeIcon size={18} />
        </button>

        {pluginTabs.map((item) => {
          const isActive =
            tabStacks?.some((s) => s.includes(`plugin:${item.key}`)) ||
            desktopLayout.sessions.includes(`plugin:${item.key}`)
          return (
            <button
              key={item.key}
              type="button"
              className={`activity-btn${isActive ? " active" : ""}`}
              title={item.title || item.key}
              aria-label={item.title || item.key}
              draggable
              onDragStart={(e) => {
                const payload = `plugin:${item.key}`
                e.dataTransfer.setData("application/x-opencode-path", payload)
                e.dataTransfer.setData("text/plain", payload)
                e.dataTransfer.effectAllowed = "move"
              }}
              onClick={() => openPluginAsTab(item.key)}
            >
              {item.icon ? (
                <span style={{ display: "inline-flex" }}>{item.icon}</span>
              ) : (
                <span style={{ fontSize: 14 }}>
                  {(item.title || item.key).slice(0, 1).toUpperCase()}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="app-desktop-activity-bottom">
        {memInfo && (
          <div
            className="activity-ram-chip"
            title={`JS Heap: ${formatBytes(memInfo.jsHeapUsed)} / ${formatBytes(memInfo.jsHeapTotal)}`}
          >
            {formatBytes(memInfo.jsHeapUsed)}
          </div>
        )}
        <button
          type="button"
          data-item="learning"
          className={`activity-btn${
            tabStacks?.some((s) => s.includes("__learning__")) ||
            desktopLayout.sessions.includes("__learning__")
              ? " active"
              : ""
          }`}
          title={t("learning.title") || "Aprendizaje"}
          aria-label={t("learning.title") || "Aprendizaje"}
          draggable
          onDragStart={(e) => {
            const p = "plugin:learning"
            e.dataTransfer.setData("application/x-opencode-path", p)
            e.dataTransfer.setData("text/plain", p)
            e.dataTransfer.effectAllowed = "move"
          }}
          onClick={handleOpenLearning}
        >
          <GraduationCapIcon size={18} />
        </button>
        <button
          type="button"
          data-item="settings"
          className={`activity-btn${view === "settings" ? " active" : ""}`}
          title={t("nav.settings") || "Configuración"}
          aria-label={t("nav.settings") || "Configuración"}
          onClick={() => {
            if (view === "settings") {
              handleNavigate(desktopLayout.sessions.some(Boolean) ? "detail" : "sessions")
            } else {
              handleNavigate("settings")
            }
          }}
        >
          <SettingsIcon size={18} />
        </button>
        <button
          type="button"
          className="activity-btn"
          title={t("desktop.collapseSidebar")}
          aria-label={t("desktop.collapseSidebar")}
          onClick={() => setSidebarCollapsed(true)}
        >
          «
        </button>
      </div>
    </nav>
  )
})
