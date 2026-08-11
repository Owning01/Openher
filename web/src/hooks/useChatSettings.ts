import { useCallback, useEffect, useMemo } from "react"
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
  showModelInfo: true,
  showDiffs: true,
  showSubagentHint: true,
  showCompactionCheckpoint: true,
  showImages: true,
  bubbleRadius: 12,
  messageMaxWidth: "full",
  fontFamily: "system",
  userBubbleColor: "",
  chatBackground: "default",
  agentAccent: "",
  compactTools: false,
  completionSound: true,
  composerCharLimit: 0,
}

const SPACING_MAP: Record<ChatSettings["messageSpacing"], string> = {
  compact: "var(--space-2)",
  normal: "var(--space-3)",
  comfortable: "var(--space-5)",
}

const MAX_WIDTH_MAP: Record<ChatSettings["messageMaxWidth"], string> = {
  normal: "680px",
  wide: "900px",
  full: "100%",
}

const FONT_MAP: Record<ChatSettings["fontFamily"], string> = {
  system: "inherit",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "var(--font-mono)",
}

const BG_MAP: Record<ChatSettings["chatBackground"], { image?: string; color?: string }> = {
  default: {},
  indigo: { image: "linear-gradient(160deg, rgba(79,70,229,0.14), rgba(6,182,212,0.07))", color: "transparent" },
  amber: { image: "linear-gradient(160deg, rgba(245,158,11,0.12), rgba(239,68,68,0.05))", color: "transparent" },
  green: { image: "linear-gradient(160deg, rgba(16,185,129,0.12), rgba(6,95,70,0.10))", color: "transparent" },
  solid: { image: "none", color: "#0d0d14" },
}

function setVar(root: HTMLElement, name: string, value: string | undefined) {
  if (value) root.style.setProperty(name, value)
  else root.style.removeProperty(name)
}

function applyCSSVars(s: ChatSettings) {
  const root = document.documentElement
  root.style.setProperty("--chat-font-size", `${s.fontSize}px`)
  root.style.setProperty("--chat-message-gap", SPACING_MAP[s.messageSpacing])
  root.style.setProperty("--chat-thinking-vis", s.showThinking ? "block" : "none")
  root.style.setProperty("--chat-tool-vis", s.showToolCalls ? "block" : "none")
  root.style.setProperty("--chat-time-vis", s.showTimestamps ? "inline" : "none")
  root.style.setProperty("--chat-modelinfo-vis", s.showModelInfo ? "flex" : "none")
  root.style.setProperty("--chat-diffs-vis", s.showDiffs ? "block" : "none")
  root.style.setProperty("--chat-subagent-vis", s.showSubagentHint ? "block" : "none")
  root.style.setProperty("--chat-compaction-vis", s.showCompactionCheckpoint ? "block" : "none")
  root.style.setProperty("--chat-image-vis", s.showImages ? "block" : "none")
  root.style.setProperty("--chat-bubble-radius", `${s.bubbleRadius}px`)
  root.style.setProperty("--chat-max-width", MAX_WIDTH_MAP[s.messageMaxWidth])
  root.style.setProperty("--chat-font-family", FONT_MAP[s.fontFamily])
  setVar(root, "--chat-user-bubble-bg", s.userBubbleColor || undefined)
  setVar(root, "--chat-accent", s.agentAccent || undefined)
  const bg = BG_MAP[s.chatBackground]
  setVar(root, "--chat-bg-image", bg.image)
  setVar(root, "--chat-bg-color", bg.color)
}

export function useChatSettings() {
  const [stored, setSettings] = useLocalStorage<ChatSettings>(STORAGE_KEYS.CHAT_SETTINGS, DEFAULTS)
  // Normaliza el storage viejo (sin los campos nuevos): merge con DEFAULTS.
  const settings = useMemo<ChatSettings>(() => ({ ...DEFAULTS, ...stored }), [stored])

  useEffect(() => { applyCSSVars(settings) }, [settings])

  const setSetting = useCallback(<K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [setSettings])

  const resetDefaults = useCallback(() => {
    setSettings({ ...DEFAULTS })
  }, [setSettings])

  return { settings, setSetting, resetDefaults, DEFAULTS }
}
