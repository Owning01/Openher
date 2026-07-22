import { useCallback, useEffect } from "react"
import { STORAGE_KEYS } from "../constants"
import type { ChatSettings } from "../types"
import { useLocalStorage } from "./useLocalStorage"

const DEFAULTS: ChatSettings = {
  fontSize: 14,
  messageSpacing: "normal",
  showThinking: true,
  showToolCalls: true,
  showTimestamps: true,
  showTodoButton: true,
}

const SPACING_MAP: Record<ChatSettings["messageSpacing"], string> = {
  compact: "var(--space-2)",
  normal: "var(--space-3)",
  comfortable: "var(--space-5)",
}

function applyCSSVars(s: ChatSettings) {
  const root = document.documentElement
  root.style.setProperty("--chat-font-size", `${s.fontSize}px`)
  root.style.setProperty("--chat-message-gap", SPACING_MAP[s.messageSpacing])
  root.style.setProperty("--chat-thinking-vis", s.showThinking ? "block" : "none")
  root.style.setProperty("--chat-tool-vis", s.showToolCalls ? "block" : "none")
  root.style.setProperty("--chat-time-vis", s.showTimestamps ? "inline" : "none")
}

export function useChatSettings() {
  const [settings, setSettings] = useLocalStorage<ChatSettings>(STORAGE_KEYS.CHAT_SETTINGS, DEFAULTS)

  useEffect(() => { applyCSSVars(settings) }, [settings])

  const setSetting = useCallback(<K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [setSettings])

  const resetDefaults = useCallback(() => {
    setSettings({ ...DEFAULTS })
  }, [setSettings])

  return { settings, setSetting, resetDefaults, DEFAULTS }
}
