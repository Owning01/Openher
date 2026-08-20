import type { ServerConfig } from "../../types"

export type ApiVersion = "auto" | "v1" | "v2"

export const detectedVersionCache = new Map<string, "v1" | "v2">()
export const detectionPromises = new Map<string, Promise<"v1" | "v2">>()

export function versionKey(config: ServerConfig): string {
  return `${config.host.trim()}:${config.port}`
}

let healthProbe: ((config: ServerConfig) => Promise<unknown>) | null = null

export function setHealthProbe(probe: (config: ServerConfig) => Promise<unknown>) {
  healthProbe = probe
}

export async function ensureVersionDetected(config: ServerConfig): Promise<"v1" | "v2"> {
  if (config.apiVersion === "v1" || config.apiVersion === "v2") return config.apiVersion
  const key = versionKey(config)
  const cached = detectedVersionCache.get(key)
  if (cached) return cached
  let promise = detectionPromises.get(key)
  if (!promise) {
    promise = (async () => {
      try {
        if (healthProbe) {
          await healthProbe(config)
        }
      } catch {
        // server caído: el error real lo reporta el request que sigue
      } finally {
        detectionPromises.delete(key)
      }
      return detectedVersionCache.get(key) ?? "v1"
    })()
    detectionPromises.set(key, promise)
  }
  return promise
}

export function resolveApiVersion(config: ServerConfig): "v1" | "v2" {
  if (config.apiVersion === "v1" || config.apiVersion === "v2") return config.apiVersion
  return detectedVersionCache.get(versionKey(config)) ?? "v1"
}

export function getApiVersion(config: ServerConfig): Promise<"v1" | "v2"> {
  return ensureVersionDetected(config)
}

export function rememberApiVersion(config: ServerConfig, version: "v1" | "v2") {
  const key = versionKey(config)
  if (detectedVersionCache.get(key) === version) return
  detectedVersionCache.set(key, version)
  versionListeners.forEach((fn) => fn())
}

export const versionListeners = new Set<() => void>()

export function onApiVersionChange(listener: () => void): () => void {
  versionListeners.add(listener)
  return () => {
    versionListeners.delete(listener)
  }
}

export function apiPath(config: ServerConfig, path: string): string {
  return resolveApiVersion(config) === "v2" ? `/api${path}` : path
}

export function unwrapData<T>(raw: T): T {
  if (raw && typeof raw === "object") {
    const candidate = raw as unknown as { data?: unknown }
    if ("data" in candidate) return candidate.data as T
  }
  return raw
}
