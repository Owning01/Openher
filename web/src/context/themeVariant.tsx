import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import { resolveTheme, themeToCSSVars, applyThemeVars } from "../utils/resolveTheme"

type ThemeVariantCtx = {
  themeName: string
  themeNames: string[]
  setTheme: (name: string) => void
  previewTheme: (name: string | null) => void
}

const ThemeVariantContext = createContext<ThemeVariantCtx | null>(null)

const STORAGE_KEY = "theme_variant"
const THEMES_DIR = "/themes/"

let cachedNames: string[] | null = null

async function fetchThemeNames(): Promise<string[]> {
  if (cachedNames) return cachedNames
  const names = [
    "aura", "ayu", "carbonfox", "catppuccin", "catppuccin-frappe", "catppuccin-macchiato",
    "cobalt2", "cursor", "dracula", "everforest", "flexoki", "github", "gruvbox",
    "kanagawa", "lucent-orng", "material", "matrix", "mercury", "monokai", "nightowl",
    "nord", "one-dark", "opencode", "orng", "osaka-jade", "palenight", "rosepine",
    "solarized", "synthwave84", "tokyonight", "vercel", "vesper", "zenburn",
  ]
  cachedNames = names
  return names
}

async function loadAndApply(name: string, mode: "dark" | "light") {
  try {
    const res = await fetch(`${THEMES_DIR}${name}.json`)
    const json = await res.json()
    const resolved = resolveTheme(json, mode)
    const vars = themeToCSSVars(resolved)
    applyThemeVars(vars)
  } catch {
    // fallback silent
  }
}

export function ThemeVariantProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState(() => localStorage.getItem(STORAGE_KEY) ?? "opencode")
  const [themeNames, setThemeNames] = useState<string[]>([])
  const savedRef = useRef(themeName)

  useEffect(() => {
    fetchThemeNames().then(setThemeNames)
  }, [])

  const getMode = useCallback(() => {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"
  }, [])

  useEffect(() => {
    const mode = getMode()
    loadAndApply(themeName, mode)
  }, [themeName, getMode])

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const mode = getMode()
      loadAndApply(savedRef.current, mode)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    return () => observer.disconnect()
  }, [getMode])

  const setTheme = useCallback((name: string) => {
    savedRef.current = name
    setThemeName(name)
    localStorage.setItem(STORAGE_KEY, name)
  }, [])

  const previewTheme = useCallback((name: string | null) => {
    const target = name ?? savedRef.current
    const mode = getMode()
    loadAndApply(target, mode)
  }, [getMode])

  return (
    <ThemeVariantContext.Provider value={{ themeName, themeNames, setTheme, previewTheme }}>
      {children}
    </ThemeVariantContext.Provider>
  )
}

export function useThemeVariant(): ThemeVariantCtx {
  const ctx = useContext(ThemeVariantContext)
  if (!ctx) throw new Error("useThemeVariant must be inside ThemeVariantProvider")
  return ctx
}
