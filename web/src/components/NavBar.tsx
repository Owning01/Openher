import { memo, useState, useEffect } from "react"
import { SettingsIcon, SunIcon, MoonIcon, StatsIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { ViewType } from "../types"

type NavVariant = "top" | "bottom"

type NavBarProps = {
  variant?: NavVariant
  view: ViewType
  onNavigate: (view: ViewType) => void
  hasConfiguredServer: boolean
  hasSelectedSession: boolean
  onToggleLightMode?: () => void
}

// Navegación mínima: a las sesiones/proyectos se llega tocando el brand
// "OpenCode"; al chat se entra tocando cada sesión.
const navItems: Array<{ view: ViewType; icon: JSX.Element; label: string }> = [
  { view: "stats", icon: <StatsIcon size={18} />, label: "nav.stats" },
  { view: "settings", icon: <SettingsIcon size={18} />, label: "nav.settings" }
]

export const NavBar = memo(function NavBar({ view, onNavigate, hasConfiguredServer, onToggleLightMode }: NavBarProps) {
  const t = useT()
  const [isLight, setIsLight] = useState(() => document.documentElement.getAttribute("data-theme") === "light")

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.getAttribute("data-theme") === "light")
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    return () => observer.disconnect()
  }, [])

  const disabledMap: Record<string, boolean> = {
    stats: !hasConfiguredServer,
    settings: false
  }

  return (
    <header className="top-nav fade-in">
      <div className="brand-section" onClick={() => onNavigate("sessions")} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate("sessions") } }}>
        <div className="brand-title">
          <img src="./img/opencode-logo-dark.jpg" alt="OpenCode" className="app-icon" />
          <span className="brand-name">OpenCode</span>
        </div>
      </div>
      <nav className="desktop-nav tab-row" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => (
          <button key={item.view} className={view === item.view ? "active" : ""}
            onClick={() => onNavigate(item.view)} disabled={disabledMap[item.view]}
            aria-label={t(item.label)}
            aria-current={view === item.view ? "page" : undefined}>
            {item.icon}
          </button>
        ))}
        {onToggleLightMode && (
          <button className="btn-icon btn-ghost theme-toggle-nav" onClick={onToggleLightMode}
            title={isLight ? "Dark mode" : "Light mode"}
            aria-label={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}>
            {isLight ? <MoonIcon size={16} /> : <SunIcon size={16} />}
          </button>
        )}
      </nav>
    </header>
  )
})
