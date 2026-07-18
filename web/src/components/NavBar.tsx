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
}

const navItems: Array<{ view: ViewType; icon: JSX.Element; label: string }> = [
  { view: "sessions", icon: <FolderIcon size={18} />, label: "nav.sessions" },
  { view: "detail", icon: <ChatIcon size={18} />, label: "nav.detail" },
  { view: "settings", icon: <SettingsIcon size={18} />, label: "nav.settings" }
]

export const NavBar = memo(function NavBar({ variant, view, onNavigate, hasConfiguredServer, hasSelectedSession }: NavBarProps) {
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
          </div>
        </div>
        <nav className="desktop-nav tab-row" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => (
            <button key={item.view} className={view === item.view ? "active" : ""}
              onClick={() => onNavigate(item.view)} disabled={disabledMap[item.view]}
              aria-label={t(item.label)}>
              {item.icon}
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
          aria-label={t(item.label)}>
          {item.icon}
        </button>
      ))}
    </nav>
  )
})
