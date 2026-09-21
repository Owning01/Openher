import { useCallback, useMemo, useState } from "react"
import { useT } from "../../i18n-context"
import { useConfig } from "../../hooks/useConfig"
import { useTheme } from "../../hooks/useTheme"
import { useIsDesktop } from "../../hooks/useIsDesktop"
import { useShellViewport } from "../../hooks/useShellViewport"
import { useUIZoom } from "../../hooks/useUIZoom"
import { useSidebarPrefs } from "../../hooks/useSidebarPrefs"
import { modelKey } from "../../utils/model-utils"
import { useAI } from "../../hooks/useAI"
import { useBlockedModels } from "../../hooks/useBlockedModels"
import { useFeatureFlags } from "../../hooks/useFeatureFlags"
import { useProviderManager } from "../../hooks/useProviderManager"
import { useServers } from "../../hooks/useServers"
import { useOfflineCache } from "../../hooks/useOfflineCache"
import { useOfflineQueue } from "../../hooks/useOfflineQueue"
import { useNotifications } from "../../hooks/useNotifications"
import type { ServerProfile } from "../../types"
import type { LanguageCode } from "../../i18n"
import { STORAGE_KEYS } from "../../constants"
import { invalidateShellBase } from "../../shell"

export type UseConnectionRuntimeParams = {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
}

/**
 * Runtime de conexión/ajustes: config del server, tema, viewport, IA/modelos,
 * proveedores, perfiles de server, flags, cola offline y cache offline.
 * Es el primero en la cadena porque el resto de los slices dependen de `config`.
 */
export function useConnectionRuntime({ language, setLanguage }: UseConnectionRuntimeParams) {
  const t = useT()

  const {
    config,
    draftConfig,
    setDraftConfig,
    connectedVersion,
    testingConnection,
    connectionState,
    settingsNotice,
    setSettingsNotice,
    hasConfiguredServer,
    canTestDraft,
    testAlreadyPassedForDraft,
    dataMode,
    changeDataMode,
    saveConfig,
    testConnection,
    setConnectionState,
    setConnectionMessage,
  } = useConfig()

  const { theme, setTheme } = useTheme()
  const isDesktop = useIsDesktop()
  const { narrow: shellNarrow, rightOverlay } = useShellViewport()
  useUIZoom()

  const handleToggleLightMode = useCallback(() => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light"
    setTheme(isLight ? "dark" : "light")
  }, [setTheme])

  const { prefs: sidebarPrefs } = useSidebarPrefs()

  const {
    agentOptions,
    modelOptions,
    modelLoadError,
    modelQuery,
    setModelQuery,
    primaryAgentOptions,
    allPrimaryAgents,
    disabledAgents,
    toggleAgentEnabled,
    activeAgent,
    activeAgentID,
    activeModelOption: globalActiveModelOption,
    activeModel: globalActiveModel,
    variantGroups,
    selectedModelKey,
    selectedVariant: globalSelectedVariant,
    changeVariant,
    activeModelVariants: globalActiveModelVariants,
    getModelForSession,
    loadAgents,
    loadModels,
    changeModel,
    changeAgent,
  } = useAI(config)

  const blockedModels = useBlockedModels(modelOptions)
  const { flags, toggleFlag, setFlag } = useFeatureFlags()

  const filteredVariantGroups = useMemo(() => {
    const bs = blockedModels.blocked
    return {
      recentModels: variantGroups.recentModels.filter((m) => !bs.has(modelKey(m))),
      groups: new Map(Array.from(variantGroups.groups.entries()).filter(([k]) => !bs.has(k))),
    }
  }, [variantGroups, blockedModels.blocked])

  const {
    providers: providerList,
    connecting: connectingProvider,
    error: providerError,
    connectProvider,
    disconnectProvider,
    addCustomProvider,
    removeCredential,
    activateCredential,
  } = useProviderManager(modelOptions, config)

  const { profiles: serverProfiles, addProfile, removeProfile, updateProfile } = useServers()

  const [activeServerProfileID, setActiveServerProfileID] = useState<string | null>(() =>
    localStorage.getItem("openher.activeServer")
  )

  const applyServerProfile = useCallback(
    (profile: ServerProfile) => {
      setActiveServerProfileID(profile.id)
      localStorage.setItem("openher.activeServer", profile.id)
      setDraftConfig(profile.config)
      saveConfig(t)
      invalidateShellBase()
    },
    [setDraftConfig, saveConfig, t]
  )

  const {
    enqueue: queueAction,
    listPending,
    ack: ackQueuedAction,
    markFailed: markQueuedActionFailed,
  } = useOfflineQueue()
  const { notify } = useNotifications()
  const { getCachedMessages, getCachedSessions, cacheMessages } = useOfflineCache(flags)

  const handleTest = useCallback(() => testConnection(t), [testConnection, t])

  const handleLanguageChange = useCallback(
    (lang: LanguageCode) => {
      setLanguage(lang)
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang)
    },
    [setLanguage]
  )

  const handleOpenGitHub = useCallback(() => {
    window.open("https://github.com/Owning01/Openher", "_system")
  }, [])

  return {
    t,
    language,
    isDesktop,
    shellNarrow,
    rightOverlay,
    sidebarPrefs,
    theme,
    setTheme,
    handleLanguageChange,
    handleToggleLightMode,
    handleOpenGitHub,
    config,
    draftConfig,
    setDraftConfig,
    handleTest,
    testingConnection,
    canTestDraft,
    testAlreadyPassedForDraft,
    connectedVersion,
    settingsNotice,
    setSettingsNotice,
    hasConfiguredServer,
    dataMode,
    changeDataMode,
    connectionState,
    setConnectionState,
    setConnectionMessage,
    modelOptions,
    modelLoadError,
    modelQuery,
    setModelQuery,
    selectedModelKey,
    changeModel,
    changeVariant,
    changeAgent,
    globalActiveModelOption,
    globalActiveModel,
    globalActiveModelVariants,
    globalSelectedVariant,
    variantGroups,
    allPrimaryAgents,
    disabledAgents,
    toggleAgentEnabled,
    agentOptions,
    primaryAgentOptions,
    activeAgent,
    activeAgentID,
    blockedModels,
    filteredVariantGroups,
    flags,
    toggleFlag,
    setFlag,
    providerList,
    connectingProvider,
    providerError,
    connectProvider,
    disconnectProvider,
    addCustomProvider,
    removeCredential,
    activateCredential,
    loadModels,
    loadAgents,
    getModelForSession,
    serverProfiles,
    addProfile,
    updateProfile,
    removeProfile,
    applyServerProfile,
    activeServerProfileID,
    setActiveServerProfileID,
    saveConfig,
    queueAction,
    listPending,
    ackQueuedAction,
    markQueuedActionFailed,
    notify,
    getCachedMessages,
    getCachedSessions,
    cacheMessages,
  }
}

export type ConnectionRuntime = ReturnType<typeof useConnectionRuntime>
