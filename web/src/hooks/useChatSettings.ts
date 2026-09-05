// @react-compiler-skip: el compiler memoiza el effect [settings] y las CSS
// vars (--chat-desktop-gutter, etc.) quedan con el valor del primer mount.
"use no memo"
import { useCallback, useEffect, useMemo } from "react"
import { STORAGE_KEYS } from "../constants"
import type { ChatSettings } from "../types"
import { useLocalStorage } from "./useLocalStorage"

const DEFAULTS: ChatSettings = {
  fontSize: 14,
  messageSpacing: "normal",
  showThinking: true,
  thinkingDefault: "auto",
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
  compactTools: false,
  minimalistMode: false,
  completionSound: true,
  reduceMotion: false,
  composerCharLimit: 0,
  desktopGutter: 12,
}

const SPACING_MAP: Record<ChatSettings["messageSpacing"], string> = {
  compact: "var(--space-2)",
  normal: "var(--space-3)",
  comfortable: "var(--space-5)",
}

const FONT_MAP: Record<ChatSettings["fontFamily"], string> = {
  system: "inherit",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "var(--font-mono)",
}

// Ancho del texto del chat (px de margen a CADA lado del mensaje): el bubble
// pasa de ocupar todo el ancho (0) a quedar centrado con Npx libres por lado
// (calc(100% - 2*Npx)). Se aplica en todos los tamaños.
function textMaxWidth(gutterPx: number): string {
  return `calc(100% - ${Math.max(0, Math.min(120, gutterPx)) * 2}px)`
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
  root.style.setProperty("--chat-max-width", textMaxWidth(s.desktopGutter))
  root.style.setProperty("--chat-font-family", FONT_MAP[s.fontFamily])
  root.classList.toggle("no-motion", s.reduceMotion)
}

export function useChatSettings() {
  const [stored, setSettings] = useLocalStorage<ChatSettings>(STORAGE_KEYS.CHAT_SETTINGS, DEFAULTS)
  // Normaliza el storage viejo (sin los campos nuevos): merge con DEFAULTS.
  // desktopGutter era "normal"|"compact"|"minimal" (string) — migra a px.
  const settings = useMemo<ChatSettings>(() => {
    const merged = { ...DEFAULTS, ...stored }
    if (typeof merged.desktopGutter !== "number" || !Number.isFinite(merged.desktopGutter)) {
      merged.desktopGutter = DEFAULTS.desktopGutter
    }
    return merged
  }, [stored])

  useEffect(() => { applyCSSVars(settings) }, [settings])

  const setSetting = useCallback(<K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [setSettings])

  const resetDefaults = useCallback(() => {
    setSettings({ ...DEFAULTS })
  }, [setSettings])

  return { settings, setSetting, resetDefaults, DEFAULTS }
}
