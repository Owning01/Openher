import { memo, useState, useEffect, type ReactNode } from "react"
import { SettingsIcon, SunIcon, MoonIcon, BrainIcon, FolderIcon, GraduationCapIcon } from "../Icons"
import { WeatherChip } from "./WeatherChip"
import { useT } from "../i18n-context"
import type { ViewType } from "../types"

type NavVariant = "top" | "bottom"

type NavBarProps = {
  variant?: NavVariant
  view: ViewType
  onNavigate: (view: ViewType) => void
  onToggleLightMode?: () => void
}

// Navegación mínima: a las sesiones/proyectos se llega tocando el brand
// "OpenCode"; al chat se entra tocando cada sesión.
const navItems: Array<{ view: ViewType; icon: ReactNode; label: string }> = [
  { view: "pcFiles", icon: <FolderIcon size={18} />, label: "Archivos" },
  { view: "quickchat", icon: <BrainIcon size={18} />, label: "quickchat.title" },
  { view: "learning", icon: <GraduationCapIcon size={18} />, label: "learning.title" },
  { view: "settings", icon: <SettingsIcon size={18} />, label: "nav.settings" }
]

export const NavBar = memo(function NavBar({ variant = "top", view, onNavigate, onToggleLightMode }: NavBarProps) {
  const t = useT()
  const [isLight, setIsLight] = useState(() => document.documentElement.getAttribute("data-theme") === "light")

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.getAttribute("data-theme") === "light")
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    return () => observer.disconnect()
  }, [])

  if (variant === "bottom") {
    // Barra inferior móvil (llega al pulgar): los 3 destinos que el top
    // oculta en táctil. El CSS .bottom-nav ya existía pero nada lo montaba.
    return (
      <nav className="bottom-nav" role="navigation" aria-label="Navegación principal">
        {navItems.filter((item) => item.view !== "settings").map((item) => (
          <button key={item.view} type="button" data-view={item.view} className={view === item.view ? "active" : ""}
            onClick={() => onNavigate(item.view)}
            aria-label={t(item.label)}
            aria-current={view === item.view ? "page" : undefined}>
            {item.icon}
          </button>
        ))}
      </nav>
    )
  }

  return (
    <header className="top-nav fade-in">
      <button className="brand-section" onClick={() => onNavigate("sessions")} type="button"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate("sessions") } }}>
        <div className="brand-title">
          <img src="./img/apple-touch-icon-180x180.jpg" alt="OpenHer" className="app-icon" />
          <span className="brand-name">OpenHer</span>
        </div>
      </button>
      <nav className="desktop-nav tab-row" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => (
          <button key={item.view} data-view={item.view} className={view === item.view ? "active" : ""}
            onClick={() => onNavigate(item.view)}
            aria-label={t(item.label)}
            aria-current={view === item.view ? "page" : undefined}>
            {item.icon}
          </button>
        ))}
        {onToggleLightMode && (
          <button className="btn-icon btn-ghost theme-toggle-nav" onClick={onToggleLightMode}
            title={isLight ? t('nav.darkMode') : t('nav.lightMode')}
            aria-label={isLight ? t('nav.darkMode') : t('nav.lightMode')}>
            {isLight ? <MoonIcon size={16} /> : <SunIcon size={16} />}
          </button>
        )}
        <WeatherChip />
      </nav>
    </header>
  )
})
