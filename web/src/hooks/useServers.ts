import { useCallback } from "react"
import { useLocalStorage } from "./useLocalStorage"
import { STORAGE_KEYS } from "../constants"
import type { ServerConfig, ServerProfile } from "../types"

export type ServerProfileInput = { config: ServerConfig; kind?: ServerProfile["kind"] }

function profileKey(p: ServerProfile): string {
  return `${p.kind}:${p.config.host}:${p.config.port}`
}

export function describeProfile(p: ServerProfile): string {
  return `${p.config.host}:${p.config.port}`
}

export function isPairProfile(p: ServerProfile): boolean {
  return p.kind === "pair"
}

// Perfiles de servidores guardados: cada uno apunta a una computadora distinta.
// El perfil activo se aplica a `useConfig`.
export function useServers() {
  const [profiles, setProfiles] = useLocalStorage<ServerProfile[]>(STORAGE_KEYS.SERVERS, [])

  const addProfile = useCallback((name: string, input: ServerProfileInput): ServerProfile => {
    const id = `srv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    const profile: ServerProfile = { id, name, kind: input.kind ?? "http", config: input.config }
    setProfiles((prev) => {
      const withoutDuplicate = prev.filter((p) => profileKey(p) !== profileKey(profile))
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

  const updateProfile = useCallback((id: string, patch: Partial<ServerProfileInput> & { name?: string }) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [setProfiles])

  return { profiles, addProfile, removeProfile, renameProfile, updateProfile }
}
