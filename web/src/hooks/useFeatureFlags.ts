import { useCallback, useMemo } from "react"
import type { FeatureFlags } from "../types"
import { STORAGE_KEYS } from "../constants"
import { useLocalStorage } from "./useLocalStorage"

const DEFAULT_FLAGS: FeatureFlags = {
  fileBrowser: true,
  inlineDiff: true,
  contextMenu: true,
  planBreakdown: true,
  gitOps: true,
  mcpConfig: true,
  sessionArchive: true,
  streamingFull: true,
  offlineCache: true,
  questionAuto: true,
  permissionUI: true,
  autoOpencode2: false,
}

export function useFeatureFlags() {
  // Merge con defaults: si el storage guardó flags viejos (sin streamingFull, etc.)
  // los campos faltantes toman su default en vez de quedar undefined (que
  // deshabilitaba el SSE en modo full silenciosamente).
  const [storedFlags, setStoredFlags] = useLocalStorage<Partial<FeatureFlags>>(STORAGE_KEYS.FEATURE_FLAGS, {})
  const flags = useMemo<FeatureFlags>(() => ({ ...DEFAULT_FLAGS, ...(storedFlags ?? {}) }), [storedFlags])

  const BOOL_FLAGS: ReadonlySet<keyof FeatureFlags> = new Set([
    "fileBrowser", "inlineDiff", "contextMenu", "planBreakdown",
    "gitOps", "mcpConfig", "sessionArchive", "streamingFull",
    "offlineCache", "questionAuto", "permissionUI", "autoOpencode2"
  ])

  const toggleFlag = useCallback((key: keyof FeatureFlags) => {
    if (!BOOL_FLAGS.has(key)) return
    setStoredFlags((prev) => ({ ...(prev ?? {}), [key]: !flags[key] as never }))
  }, [setStoredFlags, flags])

  const setFlag = useCallback(<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) => {
    setStoredFlags((prev) => ({ ...(prev ?? {}), [key]: value }))
  }, [setStoredFlags])

  return { flags, toggleFlag, setFlag }
}