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
  }
}

function saveFlags(flags: FeatureFlags) {
  localStorage.setItem(STORAGE_KEYS.FEATURE_FLAGS, JSON.stringify(flags))
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(loadFlags)

  const toggleFlag = useCallback((key: keyof FeatureFlags) => {
    setFlags((prev) => {
      const next = { ...prev, [key]: !prev[key] }
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