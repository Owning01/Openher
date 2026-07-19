import { useState, useCallback, useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { Directory, Filesystem } from "@capacitor/filesystem"
import type { ServerConfig, ConnectionState, NoticeType, DataMode } from "../types"
import { api } from "../api"
import { STORAGE_KEYS } from "../constants"

const CONFIG_FILENAME = "opencode-mobile-config.json"

const defaultConfig: ServerConfig = {
  host: "",
  port: 4096,
  username: "opencode",
  password: ""
}

export function configKey(config: ServerConfig): string {
  return JSON.stringify({
    host: config.host.trim(),
    port: config.port,
    username: config.username.trim(),
    password: config.password
  })
}

export function canTestConfig(config: ServerConfig): boolean {
  return Boolean(config.host.trim() && config.port > 0 && config.username.trim())
}

function readConfigFromFile(): ServerConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVER_FILE)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeConfigToFile(config: ServerConfig) {
  localStorage.setItem(STORAGE_KEYS.SERVER_FILE, JSON.stringify(config))
}

async function readConfigFromExternal(): Promise<ServerConfig | null> {
  try {
    if (!Capacitor.isNativePlatform()) return null
    const { data } = await Filesystem.readFile({
      path: CONFIG_FILENAME,
      directory: Directory.Documents
    })
    return JSON.parse(data as string)
  } catch {
    return null
  }
}

async function writeConfigToExternal(config: ServerConfig) {
  try {
    if (!Capacitor.isNativePlatform()) return
    await Filesystem.writeFile({
      path: CONFIG_FILENAME,
      data: JSON.stringify(config),
      directory: Directory.Documents,
      recursive: true
    })
  } catch {
    // External storage may not be available
  }
}

function loadInitialConfig(): ServerConfig {
  const stored = localStorage.getItem(STORAGE_KEYS.SERVER)
  if (stored) {
    try { return { ...defaultConfig, ...JSON.parse(stored) } } catch { }
  }
  return defaultConfig
}

function loadInitialDataMode(): DataMode {
  const saved = localStorage.getItem(STORAGE_KEYS.DATA_MODE)
  return saved === "full" || saved === "saver" || saved === "ultra" || saved === "miser" ? saved : "saver"
}

export function useConfig() {
  const [config, setConfig] = useState<ServerConfig>(loadInitialConfig)
  const [draftConfig, setDraftConfig] = useState<ServerConfig>(config)
  const [connectedVersion, setConnectedVersion] = useState("")
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    config.host && config.port > 0 ? "connecting" : "idle"
  )
  const [connectionMessage, setConnectionMessage] = useState("")
  const [settingsNotice, setSettingsNotice] = useState<{ type: NoticeType; text: string } | null>(null)
  const [lastTestedConfigKey, setLastTestedConfigKey] = useState<string | null>(null)
  const [dataMode, setDataMode] = useState<DataMode>(loadInitialDataMode)

  // Restore config from external storage on mount (survives uninstall)
  useEffect(() => {
    readConfigFromExternal().then((restored) => {
      if (!restored) {
        // Fallback: try file in localStorage
        const fileBackup = readConfigFromFile()
        if (fileBackup) {
          setConfig(fileBackup)
          setDraftConfig(fileBackup)
          writeConfigToExternal(fileBackup)
        }
        return
      }
      const currentRaw = localStorage.getItem(STORAGE_KEYS.SERVER)
      if (currentRaw) {
        try {
          const current = JSON.parse(currentRaw)
          if (configKey(current) === configKey(restored)) return
        } catch { }
      }
      setConfig(restored)
      setDraftConfig(restored)
      localStorage.setItem(STORAGE_KEYS.SERVER, JSON.stringify(restored))
    })
  }, [])

  const hasConfiguredServer = Boolean(config.host && config.port > 0)
  const draftConfigKey = configKey(draftConfig)
  const savedConfigKey = configKey(config)
  const hasDraftChanges = draftConfigKey !== savedConfigKey
  const canTestDraft = canTestConfig(draftConfig)
  const testAlreadyPassedForDraft = lastTestedConfigKey === draftConfigKey

  const saveConfig = useCallback(() => {
    setConfig(draftConfig)
    localStorage.setItem(STORAGE_KEYS.SERVER, JSON.stringify(draftConfig))
    writeConfigToFile(draftConfig)
    writeConfigToExternal(draftConfig)
    setSettingsNotice({ type: "success", text: "Configuration saved. It will be used for Sessions." })
    setConnectionState("connecting")
    setConnectionMessage("Connecting to OpenCode...")
  }, [draftConfig])

  const testConnection = useCallback(async (t: (key: string, params?: Record<string, string | number>) => string) => {
    setTestingConnection(true)
    setSettingsNotice({ type: "info", text: t('settings.testingConnection') })
    try {
      const health = await Promise.race([
        api.health(draftConfig),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Connection timed out")), 12000))
      ])
      setConnectedVersion(health.version)
      setLastTestedConfigKey(configKey(draftConfig))
      setSettingsNotice({ type: "success", text: t('settings.testedNotSaved', { version: health.version }) })
    } catch (err) {
      setSettingsNotice({ type: "error", text: t('settings.connectionFailed', { message: (err as Error).message }) })
    } finally {
      setTestingConnection(false)
    }
  }, [draftConfig])

  const resetConnection = useCallback(() => {
    setConnectionState("connecting")
    setConnectionMessage("Connecting to OpenCode...")
    setConnectedVersion("")
    setLastTestedConfigKey(null)
  }, [])

  const changeDataMode = useCallback((mode: DataMode) => {
    setDataMode(mode)
    localStorage.setItem(STORAGE_KEYS.DATA_MODE, mode)
  }, [])

  return {
    config,
    draftConfig,
    setDraftConfig,
    connectedVersion,
    testingConnection,
    connectionState,
    connectionMessage,
    settingsNotice,
    setSettingsNotice,
    lastTestedConfigKey,
    hasConfiguredServer,
    hasDraftChanges,
    canTestDraft,
    testAlreadyPassedForDraft,
    dataMode,
    changeDataMode,
    saveConfig,
    testConnection,
    resetConnection,
    setConnectedVersion,
    setConnectionState,
    setConnectionMessage,
    setLastTestedConfigKey
  }
}
