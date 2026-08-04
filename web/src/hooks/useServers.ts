import { useCallback } from "react"
import { useLocalStorage } from "./useLocalStorage"
import { STORAGE_KEYS } from "../constants"
import type { ServerConfig, ServerProfile, TunnelConfig } from "../types"

export type ServerProfileInput =
  | { kind: "http"; config: ServerConfig }
  | { kind: "tunnel"; config: TunnelConfig }

function profileKey(input: ServerProfileInput): string {
  return input.kind === "http"
    ? `http:${input.config.host}:${input.config.port}`
    : `tunnel:${input.config.name}`
}

export function describeProfile(p: ServerProfile): string {
  return p.kind === "http"
    ? `${p.config.host}:${p.config.port}`
    : p.config.name
}

// Perfiles de servidores guardados: cada uno apunta a una computadora distinta
// (HTTP directo o túnel WebRTC). El perfil activo se aplica a `useConfig`/`useRemoteTunnel`.
export function useServers() {
  const [profiles, setProfiles] = useLocalStorage<ServerProfile[]>(STORAGE_KEYS.SERVERS, [])

  const addProfile = useCallback((name: string, input: ServerProfileInput): ServerProfile => {
    const id = `srv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    const profile: ServerProfile = { id, name, ...input }
    setProfiles((prev) => {
      const withoutDuplicate = prev.filter((p) => profileKey(p) !== profileKey(input))
      return [...withoutDuplicate, profile]
    })
    return profile
  }, [setProfiles])

  const removeProfile = useCallback((id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id))
  }, [setProfiles])

  const renameProfile = useCallback((id: string, name: string) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))
  }, [setProfiles])

  return { profiles, addProfile, removeProfile, renameProfile }
}
