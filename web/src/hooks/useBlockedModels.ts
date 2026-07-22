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

  const toggleAllForProvider = useCallback((providerID: string, block: boolean) => {
    const keys = modelOptions.filter((m) => m.providerID === providerID).map(modelKey)
    setBlockedArr((prev) => {
      const current = new Set(prev)
      for (const k of keys) {
        if (block) current.add(k)
        else current.delete(k)
      }
      return [...current]
    })
  }, [modelOptions, setBlockedArr])

  const providerBlockedCount = useCallback((providerID: string) => {
    return modelOptions.filter((m) => m.providerID === providerID && blocked.has(modelKey(m))).length
  }, [modelOptions, blocked])

  const blockedCount = blocked.size

  return { blocked, filteredModelOptions, toggleBlocked, isBlocked, toggleAllForProvider, providerBlockedCount, blockedCount }
}
