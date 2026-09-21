// Constantes del panel de ajustes (F4-P4). Extraído de SettingsPanel.tsx sin
// cambios de conducta: categorías, modos de datos y feature flags.
import type { FeatureFlags } from "../../types"

export type Translate = (key: string, params?: Record<string, string | number>) => string

export type CategoryKey = "servers" | "system" | "appearance" | "models" | "chat" | "remote"

export const CATEGORIES: Array<{ id: CategoryKey; label: string; subtitle: string }> = [
  { id: "servers", label: "General", subtitle: "Configure agent execution, queued message delivery, and permissions." },
  { id: "system", label: "Application", subtitle: "Configure application startup, feature flags, sidebar layout, and system tools." },
  { id: "appearance", label: "Appearance", subtitle: "Customize interface themes, font size, language, and default model selection." },
  { id: "models", label: "Models", subtitle: "Configure AI providers, primary agents, and API keys." },
  { id: "chat", label: "Customizations", subtitle: "Fine-tune chat parameters, thinking behavior, system prompts, and snippets." },
  { id: "remote", label: "Browser", subtitle: "Configure and connect to the remote host desktop agent and browser tools." },
]

export function buildDataModes(t: Translate) {
  return [
    { value: "full" as const, label: "Full", desc: t('settings.modeFullDesc') },
    { value: "saver" as const, label: t('settings.modeSaver'), desc: t('settings.modeSaverDesc') },
    { value: "ultra" as const, label: t('settings.modeUltra'), desc: t('settings.modeUltraDesc') },
    { value: "miser" as const, label: t('settings.modeMiser'), desc: t('settings.modeMiserDesc') }
  ]
}

export function buildFeatureFlags(t: Translate): Array<{ key: keyof FeatureFlags; label: string; desc: string }> {
  return [
    { key: "fileBrowser", label: t('settings.fileBrowser'), desc: t('settings.fileBrowserDesc') },
    { key: "inlineDiff", label: t('settings.inlineDiff'), desc: t('settings.inlineDiffDesc') },
    { key: "contextMenu", label: t('settings.contextMenu'), desc: t('settings.contextMenuDesc') },
    { key: "planBreakdown", label: t('settings.planBreakdown'), desc: t('settings.planBreakdownDesc') },
    { key: "gitOps", label: t('settings.gitOps'), desc: t('settings.gitOpsDesc') },
    { key: "mcpConfig", label: t('settings.mcpConfig'), desc: t('settings.mcpConfigDesc') },
    { key: "sessionArchive", label: t('settings.sessionArchive'), desc: t('settings.sessionArchiveDesc') },
    { key: "streamingFull", label: t('settings.streamingFull'), desc: t('settings.streamingFullDesc') },
    { key: "offlineCache", label: t('settings.offlineCache'), desc: t('settings.offlineCacheDesc') },
    { key: "questionAuto", label: t('settings.questionAuto'), desc: t('settings.questionAutoDesc') },
    { key: "permissionUI", label: t('settings.permissionUI'), desc: t('settings.permissionUIDesc') },
  ]
}
