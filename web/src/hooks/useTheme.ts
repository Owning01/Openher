import { useState, useEffect, useCallback } from "react"
import type { ThemePreference } from "../types"

const THEME_STORAGE_KEY = "opencode.remote.theme"

export function useTheme() {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system"
  })

  const applyTheme = useCallback(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const resolvedTheme = theme === "system" && mediaQuery.matches ? "dark" : theme === "dark" ? "dark" : "light"
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
  }, [theme])

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    applyTheme()
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", applyTheme)
    return () => mediaQuery.removeEventListener("change", applyTheme)
  }, [theme, applyTheme])

  return { theme, setTheme }
}
