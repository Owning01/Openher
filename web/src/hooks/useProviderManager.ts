import { useState, useCallback, useMemo } from "react"
import { api } from "../api"
import { STORAGE_KEYS } from "../constants"
import type { ServerConfig, ModelOption, ProviderInfo } from "../types"
import { useLocalStorage } from "./useLocalStorage"

export function useProviderManager(modelOptions: ModelOption[], config: ServerConfig | null) {
  const [connectedMap, setConnectedMap] = useLocalStorage<Record<string, true>>(STORAGE_KEYS.CONNECTED_PROVIDERS, {})
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const providers: ProviderInfo[] = useMemo(() => {
    const seen = new Map<string, ProviderInfo>()
    for (const m of modelOptions) {
      if (!m.providerID || !m.providerName) continue
      const existing = seen.get(m.providerID)
      if (existing) {
        existing.modelsCount++
      } else {
        seen.set(m.providerID, {
          id: m.providerID,
          name: m.providerName,
          modelsCount: 1,
          connected: !!connectedMap[m.providerID],
        })
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [modelOptions, connectedMap])

  const connectProvider = useCallback(async (providerID: string, apiKey: string, sessionID: string, directory: string) => {
    if (!config) return
    setConnecting(providerID)
    setError(null)
    try {
      await api.sendCommand(config, sessionID, `/connect ${providerID} ${apiKey}`, "", directory)
      setConnectedMap((prev) => ({ ...prev, [providerID]: true as const }))
      setConnecting(null)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      setError(msg)
      setConnecting(null)
      return false
    }
  }, [config, setConnectedMap])

  const disconnectProvider = useCallback((providerID: string) => {
    setConnectedMap((prev) => {
      const next = { ...prev }
      delete next[providerID]
      return next
    })
  }, [setConnectedMap])

  return { providers, connecting, error, connectProvider, disconnectProvider }
}