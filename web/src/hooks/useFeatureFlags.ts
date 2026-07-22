import { useState, useCallback } from "react"
import type { FeatureFlags } from "../types"
import { STORAGE_KEYS, DEFAULT_AUTO_SUMMARIZE_THRESHOLD } from "../constants"

function loadFlags(): FeatureFlags {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FEATURE_FLAGS)
    if (raw) return JSON.parse(raw) as FeatureFlags
  } catch { }
  return {
    fileBrowser: false,
    inlineDiff: false,
    contextMenu: false,
    planBreakdown: false,
    gitOps: false,
    mcpConfig: false,
    sessionArchive: false,
    autoSummarize: false,
    autoSummarizeThreshold: DEFAULT_AUTO_SUMMARIZE_THRESHOLD,
    streamingFull: false,
    offlineCache: false,
    questionAuto: false,
    permissionUI: false,
  }
}

function saveFlags(flags: FeatureFlags) {
  localStorage.setItem(STORAGE_KEYS.FEATURE_FLAGS, JSON.stringify(flags))
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(loadFlags)

  const BOOL_FLAGS: ReadonlySet<keyof FeatureFlags> = new Set([
    "fileBrowser", "inlineDiff", "contextMenu", "planBreakdown",
    "gitOps", "mcpConfig", "sessionArchive", "autoSummarize", "streamingFull",
    "offlineCache", "questionAuto", "permissionUI"
  ])

  const toggleFlag = useCallback((key: keyof FeatureFlags) => {
    if (!BOOL_FLAGS.has(key)) return
    setFlags((prev) => {
      const next = { ...prev, [key]: !prev[key as keyof FeatureFlags] as never }
      saveFlags(next)
      return next
    })
  }, [])

  const setFlag = useCallback(<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) => {
    setFlags((prev) => {
      const next = { ...prev, [key]: value }
      saveFlags(next)
      return next
    })
  }, [])

  return { flags, toggleFlag, setFlag }
}