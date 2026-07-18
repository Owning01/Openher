import { memo } from "react"
import { SettingsIcon, FolderIcon, ChatIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { ViewType } from "../types"

type NavVariant = "top" | "bottom"

type NavBarProps = {
  variant: NavVariant
  view: ViewType
  onNavigate: (view: ViewType) => void
  hasConfiguredServer: boolean
  hasSelectedSession: boolean
  hostLabel?: string
}

const navItems: Array<{ view: ViewType; icon: JSX.Element }> = [
  { view: "sessions", icon: <FolderIcon size={19} /> },
  { view: "detail", icon: <ChatIcon size={19} /> },
  { view: "settings", icon: <SettingsIcon size={19} /> }
]

const navLabel: Record<string, "nav.sessions" | "nav.detail" | "nav.settings"> = {
  sessions: "nav.sessions",
  detail: "nav.detail",
  settings: "nav.settings"
}

export const NavBar = memo(function NavBar({ variant, view, onNavigate, hasConfiguredServer, hasSelectedSession, hostLabel }: NavBarProps) {
  const t = useT()
  const disabledMap: Record<string, boolean> = {
    sessions: !hasConfiguredServer,
    detail: !hasSelectedSession,
    settings: false
  }

  if (variant === "top") {
    return (
      <header className="top-nav fade-in">
        <div className="brand-section">
          <div className="brand-title">
            <img src="/app-icon.png" alt="" className="app-icon" />
            <div>
              <h1>{t('app.title')}</h1>
              <p className="subtle">{hostLabel ?? ""}</p>
            </div>
          </div>
        </div>
        <nav className="desktop-nav tab-row" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => (
            <button key={item.view} className={view === item.view ? "active" : ""}
              onClick={() => onNavigate(item.view)} disabled={disabledMap[item.view]}
              aria-label={t(navLabel[item.view])}>
              {item.icon}
              <span>{t(navLabel[item.view])}</span>
            </button>
          ))}
        </nav>
      </header>
    )
  }

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Mobile navigation">
      {navItems.map((item) => (
        <button key={item.view} className={view === item.view ? "active" : ""}
          onClick={() => onNavigate(item.view)} disabled={disabledMap[item.view]}
          aria-label={t(navLabel[item.view])}>
          {item.icon}
          <span>{t(navLabel[item.view])}</span>
        </button>
      ))}
    </nav>
  )
})
