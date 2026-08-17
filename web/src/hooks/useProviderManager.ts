import { useState, useCallback, useMemo, useEffect } from "react"
import { api } from "../api"
import type { ServerConfig, ModelOption, ProviderInfo } from "../types"

// Manejo de proveedores con los endpoints REALES del server:
// v1 → GET /provider + PUT/DELETE /auth/:providerID. v2 → /api/integration.
// Antes esto era un fake: enviaba "/connect prov key" como comando chat que el
// server ignora (no existe ese comando) y solo marcaba localStorage.
export function useProviderManager(modelOptions: ModelOption[], config: ServerConfig | null) {
  const [connectedSet, setConnectedSet] = useState<Set<string>>(new Set())
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refreshConnected = useCallback(async () => {
    if (!config) return
    try {
      const list = await api.loadProviders(config)
      setConnectedSet(new Set(list.connected))
    } catch {
      // el server puede no exponer /provider; no bloquear la UI
    }
  }, [config])

  useEffect(() => {
    void refreshConnected()
  }, [refreshConnected])

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
          connected: connectedSet.has(m.providerID),
        })
      }
    }
    // Conectar un provider sin modelos (recién agregado) debe verse igual:
    // los del server conectados que faltan se listan al final.
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [modelOptions, connectedSet])

  const connectProvider = useCallback(async (providerID: string, apiKey: string) => {
    if (!config) return false
    setConnecting(providerID)
    setError(null)
    try {
      await api.setProviderAuth(config, providerID, apiKey)
      setConnectedSet((prev) => new Set(prev).add(providerID))
      setConnecting(null)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      setError(msg)
      setConnecting(null)
      return false
    }
  }, [config])

  const disconnectProvider = useCallback(async (providerID: string) => {
    if (!config) return
    setConnecting(providerID)
    setError(null)
    try {
      await api.removeProviderAuth(config, providerID)
      setConnectedSet((prev) => {
        const next = new Set(prev)
        next.delete(providerID)
        return next
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      setError(msg)
    }
    setConnecting(null)
  }, [config])

  const addCustomProvider = useCallback(async (
    providerID: string,
    name: string,
    baseURL: string,
    models: string[],
  ) => {
    if (!config) return false
    setConnecting("__custom__")
    setError(null)
    try {
      await api.addCustomProvider(config, providerID, name, baseURL, models)
      setConnecting(null)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      setError(msg)
      setConnecting(null)
      return false
    }
  }, [config])

  return { providers, connecting, error, connectProvider, disconnectProvider, addCustomProvider, refreshConnected }
}