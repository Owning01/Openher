import { useState, useCallback, useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { Directory, Filesystem } from "@capacitor/filesystem"
import type { ServerConfig, ConnectionState, NoticeType, DataMode } from "../types"
import { api } from "../api"
import { STORAGE_KEYS } from "../constants"
import { encrypt, decrypt, isCiphertext } from "../utils/crypto"

const CONFIG_FILENAME = "opencode-mobile-config.json"

const defaultConfig: ServerConfig = {
  host: "",
  port: 4096,
  username: "opencode",
  password: "",
  apiVersion: "auto"
}

export function configKey(config: ServerConfig): string {
  return JSON.stringify({
    host: config.host.trim(),
    port: config.port,
    username: config.username.trim(),
    password: config.password,
    apiVersion: config.apiVersion ?? "auto"
  })
}

export function canTestConfig(config: ServerConfig): boolean {
  return Boolean(config.host.trim() && config.port > 0 && config.username.trim())
}

function loadInitialConfig(): ServerConfig {
  const stored = localStorage.getItem(STORAGE_KEYS.SERVER)
  if (stored) {
    try { return { ...defaultConfig, ...JSON.parse(stored) } } catch { }
  }
  return defaultConfig
}

function loadInitialDataMode(): DataMode {
  // Escritorio (shell wry) → SIEMPRE full, síncrono, sin esperar a la red.
  const isDesktop = typeof window !== "undefined" && !!(window as any).__OPENCODE_DESKTOP__
  if (isDesktop) return "full"
  const saved = localStorage.getItem(STORAGE_KEYS.DATA_MODE)
  return saved === "full" || saved === "saver" || saved === "ultra" || saved === "miser" ? saved : "saver"
}

async function readConfigFromFile(): Promise<ServerConfig | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVER_FILE)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.password && isCiphertext(parsed.password)) {
      parsed.password = await decrypt(parsed.password)
    }
    return { ...defaultConfig, ...parsed }
  } catch {
    return null
  }
}

async function writeConfigToFile(config: ServerConfig) {
  const toStore = { ...config }
  if (toStore.password) {
    try { toStore.password = await encrypt(toStore.password) } catch { }
  }
  localStorage.setItem(STORAGE_KEYS.SERVER_FILE, JSON.stringify(toStore))
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
    const toStore = { ...config }
    if (toStore.password) {
      try { toStore.password = await encrypt(toStore.password) } catch { }
    }
    await Filesystem.writeFile({
      path: CONFIG_FILENAME,
      data: JSON.stringify(toStore),
      directory: Directory.Documents,
      recursive: true
    })
  } catch {
    // External storage may not be available
  }
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
    (async () => {
      const restored = await readConfigFromExternal()
      if (!restored) {
        const fileBackup = await readConfigFromFile()
        if (fileBackup) {
          setConfig(fileBackup)
          setDraftConfig(fileBackup)
          localStorage.setItem(STORAGE_KEYS.SERVER, JSON.stringify(fileBackup))
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
      localStorage.setItem(STORAGE_KEYS.SERVER, JSON.stringify(restored))
      setConfig(restored)
      setDraftConfig(restored)
      writeConfigToExternal(restored)
    })()
  }, [])

  const hasConfiguredServer = Boolean(config.host && config.port > 0)
  const draftConfigKey = configKey(draftConfig)
  const savedConfigKey = configKey(config)
  const hasDraftChanges = draftConfigKey !== savedConfigKey
  const canTestDraft = canTestConfig(draftConfig)
  const testAlreadyPassedForDraft = lastTestedConfigKey === draftConfigKey

  const saveConfig = useCallback((t?: (key: string, params?: Record<string, string | number>) => string) => {
    setConfig(draftConfig)
    localStorage.setItem(STORAGE_KEYS.SERVER, JSON.stringify(draftConfig))
    writeConfigToFile(draftConfig)
    writeConfigToExternal(draftConfig)
    const tested = lastTestedConfigKey === configKey(draftConfig)
    setSettingsNotice({
      type: "success",
      text: t
        ? tested
          ? t('settings.saved')
          : `${t('settings.saved')}\n${t('settings.savedNotTested')}`
        : tested
          ? "Configuration saved. It will be used for Sessions."
          : "Configuration saved. It will be used for Sessions.\nTest the connection before using it."
    })
    setTimeout(() => setSettingsNotice(null), 6000)
    setConnectionState("connecting")
    setConnectionMessage("Connecting to OpenCode...")
  }, [draftConfig, lastTestedConfigKey])

  const testConnection = useCallback(async (t: (key: string, params?: Record<string, string | number>) => string) => {
    setTestingConnection(true)
    setSettingsNotice({ type: "info", text: t('settings.testingConnection') })
    // Auto-fallback: si 4096 falla y draft es 4096 sin pass, probar 4098 con octavio (opencode2 service real en este equipo)
    const tryConfigs = [draftConfig]
    if (draftConfig.host.trim() === "127.0.0.1" && draftConfig.port === 4096 && !draftConfig.password) {
      tryConfigs.push({ ...draftConfig, port: 4098, password: "octavio" })
    }
    if (draftConfig.host.trim() === "127.0.0.1" && draftConfig.port === 4097) {
      tryConfigs.push({ ...draftConfig, port: 4098, password: "octavio" })
      tryConfigs.push({ ...draftConfig, port: 4096, password: "" })
    }
    let lastErr: unknown = null
    try {
      for (const cfg of tryConfigs) {
        try {
          const health = await Promise.race([
            api.health(cfg),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Connection timed out")), 7000))
          ])
          if (cfg.port !== draftConfig.port || cfg.password !== draftConfig.password) {
            setDraftConfig(cfg)
          }
          setConnectedVersion(health.version)
          setLastTestedConfigKey(configKey(cfg))
          setSettingsNotice({ type: "success", text: t('settings.testedNotSaved', { version: health.version }) + (cfg.port !== draftConfig.port ? ` (auto → :${cfg.port})` : "") })
          return
        } catch (err) {
          lastErr = err
          const msg = (err as Error).message
          const isTimeout = msg === "Connection timed out" || /Failed to fetch|ECONNREFUSED|ERR_CONNECTION_REFUSED/i.test(msg)
          if (!isTimeout) break
        }
      }
      const err = lastErr as Error
      const msg = err?.message ?? "Error desconocido"
      let hint = msg === "Connection timed out"
        ? "El servidor no respondió en 7s. Probé 4096 y 4098 (opencode2). Verificá que opencode esté corriendo. Para opencode2 usa 127.0.0.1:4098 usuario opencode pass octavio."
        : msg.includes("Failed to fetch") || msg.includes("ERR_CONNECTION_REFUSED") || msg.includes("ECONNREFUSED")
          ? "Conexión rechazada. Probé 4096 y 4098. Iniciá opencode con: opencode serve --port 4096  o  opencode2 serve --service (usa 4098/octavio)"
          : msg.includes("ERR_NAME_NOT_RESOLVED") || msg.includes("ENOTFOUND")
            ? "No se pudo resolver el host."
            : msg.includes("401") || msg.includes("403")
              ? "Auth fallida. Para 4098 usa usuario opencode y pass octavio (ver C:\\Users\\...\\.config\\opencode\\service.json)"
              : null
      const fullMsg = hint ? `${msg}\n\n${hint}` : msg
      setSettingsNotice({ type: "error", text: t('settings.connectionFailed', { message: fullMsg }) })
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
