import { useCallback, useMemo } from "react"
import type { ModelOption } from "../types"
import { STORAGE_KEYS } from "../constants"
import { modelKey } from "../utils/model-utils"
import { useLocalStorage } from "./useLocalStorage"

export function useBlockedModels(modelOptions: ModelOption[]) {
  const [blockedArr, setBlockedArr] = useLocalStorage<string[]>(STORAGE_KEYS.BLOCKED_MODELS, [])
  const blocked = useMemo(() => new Set(blockedArr), [blockedArr])

  const filteredModelOptions = useMemo(() => {
    return modelOptions.filter((m) => !blocked.has(modelKey(m)))
  }, [modelOptions, blocked])

  const toggleBlocked = useCallback((key: string) => {
    setBlockedArr((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key)
      return [...prev, key]
    })
  }, [setBlockedArr])

  const isBlocked = useCallback((key: string) => blocked.has(key), [blocked])

  const blockedCount = blocked.size

  return { blocked, filteredModelOptions, toggleBlocked, isBlocked, blockedCount }
}
