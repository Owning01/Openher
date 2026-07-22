import { useCallback } from "react"
import type { FeatureFlags } from "../types"
import { STORAGE_KEYS, DEFAULT_AUTO_SUMMARIZE_THRESHOLD } from "../constants"
import { useLocalStorage } from "./useLocalStorage"

const DEFAULT_FLAGS: FeatureFlags = {
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
  offlineCache: true,
  questionAuto: false,
  permissionUI: false,
}

export function useFeatureFlags() {
  const [flags, setFlags] = useLocalStorage<FeatureFlags>(STORAGE_KEYS.FEATURE_FLAGS, DEFAULT_FLAGS)

  const BOOL_FLAGS: ReadonlySet<keyof FeatureFlags> = new Set([
    "fileBrowser", "inlineDiff", "contextMenu", "planBreakdown",
    "gitOps", "mcpConfig", "sessionArchive", "autoSummarize", "streamingFull",
    "offlineCache", "questionAuto", "permissionUI"
  ])

  const toggleFlag = useCallback((key: keyof FeatureFlags) => {
    if (!BOOL_FLAGS.has(key)) return
    setFlags((prev) => ({ ...prev, [key]: !prev[key as keyof FeatureFlags] as never }))
  }, [setFlags])

  const setFlag = useCallback(<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) => {
    setFlags((prev) => ({ ...prev, [key]: value }))
  }, [setFlags])

  return { flags, toggleFlag, setFlag }
}