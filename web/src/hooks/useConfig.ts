import { useState, useCallback, useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { Directory, Filesystem } from "@capacitor/filesystem"
import type { ServerConfig, ConnectionState, NoticeType, DataMode } from "../types"
import { api } from "../api"
import { STORAGE_KEYS } from "../constants"
import { invalidateShellBase } from "../shell"
import { encrypt, decrypt, isCiphertext } from "../utils/crypto"
import { discoverServer, isLoopbackHost } from "../utils/serverDiscovery"
import { withTimeout } from "../shared/lib/async"
import { useT } from "../i18n-context"

const CONFIG_FILENAME = "openher-config.json"

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
  const isDesktop = typeof window !== "undefined" && !!(window as any).__OPENHER_DESKTOP__
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
  const t = useT()
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

  // Autodescubrimiento del server local: la config es por origen (localStorage),
  // así que una pestaña/instancia nueva arranca vacía y el shell inyecta su
  // config (posiblemente stale). Si no hay config o la guardada es loopback y
  // no responde, buscamos el server en 127.0.0.1/localhost × 4096/4098/4097 con
  // las credenciales documentadas. Solo al montar; no pisa un server remoto.
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return
    let cancelled = false
    void (async () => {
      const stored = config.host ? config : null
      if (stored && !isLoopbackHost(stored.host)) return
      const found = await discoverServer({ stored, health: (cfg) => api.health(cfg) })
      if (!found || cancelled) return
      const same = config.host === found.config.host
        && config.port === found.config.port
        && config.username === found.config.username
        && config.password === found.config.password
      if (same) return
      setConfig(found.config)
      setDraftConfig(found.config)
      localStorage.setItem(STORAGE_KEYS.SERVER, JSON.stringify(found.config))
      invalidateShellBase()
    })()
    return () => { cancelled = true }
    // Solo al montar: no re-descubrir ante cada cambio de config.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasConfiguredServer = Boolean(config.host && config.port > 0)
  const draftConfigKey = configKey(draftConfig)
  const savedConfigKey = configKey(config)
  const hasDraftChanges = draftConfigKey !== savedConfigKey
  const canTestDraft = canTestConfig(draftConfig)
  const testAlreadyPassedForDraft = lastTestedConfigKey === draftConfigKey

  const saveConfig = useCallback((translate?: (key: string, params?: Record<string, string | number>) => string) => {
    setConfig(draftConfig)
    localStorage.setItem(STORAGE_KEYS.SERVER, JSON.stringify(draftConfig))
    writeConfigToFile(draftConfig)
    writeConfigToExternal(draftConfig)
    // El puente del shell (/shell/*) se deriva del host del server: al cambiar
    // la conexión hay que invalidar la base resuelta (TTL 30s) para el explorador.
    invalidateShellBase()
    const tr = translate ?? t
    const tested = lastTestedConfigKey === configKey(draftConfig)
    setSettingsNotice({
      type: "success",
      text: tested
        ? tr('settings.saved')
        : `${tr('settings.saved')}\n${tr('settings.savedNotTested')}`
    })
    setTimeout(() => setSettingsNotice(null), 6000)
    setConnectionState("connecting")
    setConnectionMessage(t('connection.connecting'))
  }, [draftConfig, lastTestedConfigKey, t])

  const testConnection = useCallback(async (translate: (key: string, params?: Record<string, string | number>) => string) => {
    const tr = translate ?? t
    setTestingConnection(true)
    setSettingsNotice({ type: "info", text: tr('settings.testingConnection') })
    const timeoutMessage = tr('error.connectionTimeout')
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
          const health = await withTimeout(api.health(cfg), 7000, timeoutMessage)
          if (cfg.port !== draftConfig.port || cfg.password !== draftConfig.password) {
            setDraftConfig(cfg)
          }
          setConnectedVersion(health.version)
          setLastTestedConfigKey(configKey(cfg))
          setSettingsNotice({ type: "success", text: tr('settings.testedNotSaved', { version: health.version }) + (cfg.port !== draftConfig.port ? ` (auto → :${cfg.port})` : "") })
          return
        } catch (err) {
          lastErr = err
          const msg = (err as Error).message
          const isTimeout = msg === timeoutMessage || /Failed to fetch|ECONNREFUSED|ERR_CONNECTION_REFUSED/i.test(msg)
          if (!isTimeout) break
        }
      }
      const err = lastErr as Error
      const msg = err?.message ?? tr('error.unknown')
      let hint = msg === timeoutMessage
        ? tr('settings.timeoutHint')
        : msg.includes("Failed to fetch") || msg.includes("ERR_CONNECTION_REFUSED") || msg.includes("ECONNREFUSED")
          ? tr('settings.refusedHint')
          : msg.includes("ERR_NAME_NOT_RESOLVED") || msg.includes("ENOTFOUND")
            ? tr('settings.nameNotResolvedHint')
            : msg.includes("401") || msg.includes("403")
              ? tr('settings.authFailedHint')
              : null
      const fullMsg = hint ? `${msg}\n\n${hint}` : msg
      setSettingsNotice({ type: "error", text: tr('settings.connectionFailed', { message: fullMsg }) })
    } finally {
      setTestingConnection(false)
    }
  }, [draftConfig, t])

  const resetConnection = useCallback(() => {
    setConnectionState("connecting")
    setConnectionMessage(t('connection.connecting'))
    setConnectedVersion("")
    setLastTestedConfigKey(null)
  }, [t])

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
