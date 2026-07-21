import { useState, useCallback, useMemo } from "react"
import type { ModelOption } from "../types"
import { STORAGE_KEYS } from "../constants"
import { modelKey } from "./useSessions"

function loadBlocked(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BLOCKED_MODELS)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    localStorage.removeItem(STORAGE_KEYS.BLOCKED_MODELS)
    return new Set()
  }
}

function saveBlocked(set: Set<string>) {
  localStorage.setItem(STORAGE_KEYS.BLOCKED_MODELS, JSON.stringify([...set]))
}

export function useBlockedModels(modelOptions: ModelOption[]) {
  const [blocked, setBlocked] = useState<Set<string>>(loadBlocked)

  const filteredModelOptions = useMemo(() => {
    return modelOptions.filter((m) => !blocked.has(modelKey(m)))
  }, [modelOptions, blocked])

  const toggleBlocked = useCallback((key: string) => {
    setBlocked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      saveBlocked(next)
      return next
    })
  }, [])

  const isBlocked = useCallback((key: string) => blocked.has(key), [blocked])

  const blockedCount = blocked.size

  return { blocked, filteredModelOptions, toggleBlocked, isBlocked, blockedCount }
}
