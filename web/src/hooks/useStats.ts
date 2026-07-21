import { useState, useCallback } from "react"
import { STORAGE_KEYS } from "../constants"

const STATS_KEY = STORAGE_KEYS.STATS

type UsageStats = {
  promptsSent: number
  sessionsCreated: number
  firstUsed: number
}

function loadStats(): UsageStats {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    return raw ? JSON.parse(raw) : { promptsSent: 0, sessionsCreated: 0, firstUsed: Date.now() }
  } catch {
    return { promptsSent: 0, sessionsCreated: 0, firstUsed: Date.now() }
  }
}

function saveStats(stats: UsageStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

export function useStats() {
  const [stats, setStats] = useState<UsageStats>(loadStats)

  const recordPrompt = useCallback((_text: string) => {
    setStats((prev) => {
      const next = { ...prev, promptsSent: prev.promptsSent + 1 }
      saveStats(next)
      return next
    })
  }, [])

  const recordSessionCreated = useCallback(() => {
    setStats((prev) => {
      const next = { ...prev, sessionsCreated: prev.sessionsCreated + 1 }
      saveStats(next)
      return next
    })
  }, [])

  const resetStats = useCallback(() => {
    const next = { promptsSent: 0, sessionsCreated: 0, firstUsed: Date.now() }
    saveStats(next)
    setStats(next)
  }, [])

  return { stats, recordPrompt, recordSessionCreated, resetStats }
}
