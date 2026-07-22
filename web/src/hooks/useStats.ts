import { useCallback } from "react"
import { STORAGE_KEYS } from "../constants"
import { useLocalStorage } from "./useLocalStorage"

const STATS_KEY = STORAGE_KEYS.STATS

type UsageStats = {
  promptsSent: number
  sessionsCreated: number
  firstUsed: number
}

const initialStats: UsageStats = { promptsSent: 0, sessionsCreated: 0, firstUsed: Date.now() }

export function useStats() {
  const [stats, setStats] = useLocalStorage<UsageStats>(STATS_KEY, initialStats)

  const recordPrompt = useCallback((_text: string) => {
    setStats((prev) => ({ ...prev, promptsSent: prev.promptsSent + 1 }))
  }, [setStats])

  const recordSessionCreated = useCallback(() => {
    setStats((prev) => ({ ...prev, sessionsCreated: prev.sessionsCreated + 1 }))
  }, [setStats])

  const resetStats = useCallback(() => {
    setStats({ promptsSent: 0, sessionsCreated: 0, firstUsed: Date.now() })
  }, [setStats])

  return { stats, recordPrompt, recordSessionCreated, resetStats }
}
