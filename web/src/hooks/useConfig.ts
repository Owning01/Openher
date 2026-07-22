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

async function readConfigFromFile(): Promise<ServerConfig | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVER_FILE)
    if (!raw) return null
    return decryptConfig(raw)
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

async function decryptConfig(raw: string): Promise<ServerConfig> {
  const parsed = JSON.parse(raw)
  if (parsed.password && isCiphertext(parsed.password)) {
    try { parsed.password = await decrypt(parsed.password) } catch { /* keep as-is */ }
  }
  return { ...defaultConfig, ...parsed }
}

function loadInitialConfig(): ServerConfig {
  const stored = localStorage.getItem(STORAGE_KEYS.SERVER)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (parsed.password && isCiphertext(parsed.password)) {
        parsed.password = ""
      }
      return { ...defaultConfig, ...parsed }
    } catch { }
  }
  return defaultConfig
}

async function persistConfigToLS(config: ServerConfig) {
  const toStore = { ...config }
  if (toStore.password) {
    try { toStore.password = await encrypt(toStore.password) } catch { }
  }
  localStorage.setItem(STORAGE_KEYS.SERVER, JSON.stringify(toStore))
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
    (async () => {
      const restored = await readConfigFromExternal()
      if (!restored) {
        const fileBackup = await readConfigFromFile()
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
      persistConfigToLS(restored)
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

  const saveConfig = useCallback(() => {
    setConfig(draftConfig)
    persistConfigToLS(draftConfig)
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
      const msg = (err as Error).message
      let hint = msg === "Connection timed out"
        ? "El servidor no respondió en 12 segundos. Verificá que OpenCode esté corriendo, que el puerto sea correcto y que no haya un firewall bloqueando la conexión."
        : msg.includes("Failed to fetch") || msg.includes("ERR_CONNECTION_REFUSED") || msg.includes("ECONNREFUSED")
          ? "Conexión rechazada. El servidor no está aceptando conexiones en esa dirección y puerto. Revisá la IP, el puerto y que el servidor esté iniciado."
          : msg.includes("ERR_NAME_NOT_RESOLVED") || msg.includes("ENOTFOUND")
            ? "No se pudo resolver el nombre del host. Revisá que la dirección IP o el hostname sea correcto."
            : msg.includes("401") || msg.includes("403")
              ? "Autenticación fallida. Revisá el nombre de usuario y contraseña."
              : msg.includes("ERR_CONNECTION_RESET")
                ? "La conexión fue interrumpida. El servidor puede estar reiniciándose o hay un proxy bloqueando el tráfico."
                : msg.includes("CORS")
                  ? "Error CORS. El servidor necesita iniciarse con el flag --cors para aceptar conexiones desde la app."
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
