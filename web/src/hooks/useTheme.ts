import { useState, useEffect, useCallback, useMemo } from "react"
import type { ThemePreference } from "../types"
import { STORAGE_KEYS } from "../constants"
import { useLocalStorage } from "./useLocalStorage"

function scheduledTheme(): "light" | "dark" {
  const hour = new Date().getHours()
  return hour >= 7 && hour < 19 ? "light" : "dark"
}

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<ThemePreference>(STORAGE_KEYS.THEME, "system")
  const [scheduledTick, setScheduledTick] = useState(0)

  const resolvedTheme = useMemo(() => {
    if (theme === "scheduled") return scheduledTheme()
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return theme
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, scheduledTick])

  const applyTheme = useCallback(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    applyTheme()
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      mediaQuery.addEventListener("change", applyTheme)
      return () => mediaQuery.removeEventListener("change", applyTheme)
    }
    if (theme === "scheduled") {
      const scheduleNext = () => {
        const next = new Date()
        const hour = next.getHours()
        const target = hour >= 7 && hour < 19 ? 19 : 7
        next.setHours(target, 0, 0, 0)
        const ms = next.getTime() - Date.now()
        return setTimeout(() => {
          setScheduledTick((n) => n + 1)
        }, ms > 0 ? ms : ms + 86400000)
      }
      const timer = scheduleNext()
      return () => clearTimeout(timer)
    }
  }, [theme, applyTheme, setScheduledTick])

  return { theme, setTheme }
}
