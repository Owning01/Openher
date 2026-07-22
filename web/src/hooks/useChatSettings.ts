import { useState, useCallback, useEffect } from "react"
import { STORAGE_KEYS } from "../constants"
import type { ChatSettings } from "../types"

const DEFAULTS: ChatSettings = {
  fontSize: 14,
  messageSpacing: "normal",
  showThinking: true,
  showToolCalls: true,
  showTimestamps: true,
}

const SPACING_MAP: Record<ChatSettings["messageSpacing"], string> = {
  compact: "var(--space-2)",
  normal: "var(--space-3)",
  comfortable: "var(--space-5)",
}

function load(): ChatSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_SETTINGS)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* fall through */ }
  return { ...DEFAULTS }
}

function save(settings: ChatSettings) {
  try { localStorage.setItem(STORAGE_KEYS.CHAT_SETTINGS, JSON.stringify(settings)) } catch {}
}

function applyCSSVars(s: ChatSettings) {
  const root = document.documentElement
  root.style.setProperty("--chat-font-size", `${s.fontSize}px`)
  root.style.setProperty("--chat-message-gap", SPACING_MAP[s.messageSpacing])
  root.style.setProperty("--chat-thinking-vis", s.showThinking ? "visible" : "none")
  root.style.setProperty("--chat-tool-vis", s.showToolCalls ? "visible" : "none")
  root.style.setProperty("--chat-time-vis", s.showTimestamps ? "visible" : "none")
}

export function useChatSettings() {
  const [settings, setSettings] = useState<ChatSettings>(load)

  useEffect(() => { applyCSSVars(settings) }, [settings])

  const setSetting = useCallback(<K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      save(next)
      return next
    })
  }, [])

  const resetDefaults = useCallback(() => {
    setSettings({ ...DEFAULTS })
    save(DEFAULTS)
  }, [])

  return { settings, setSetting, resetDefaults, DEFAULTS }
}
