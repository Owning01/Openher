import { useSyncExternalStore } from "react"

const KEY = "openher.devbar.enabled"

function readInitial(): boolean {
  try {
    return localStorage.getItem(KEY) === "1"
  } catch {
    return false
  }
}

let enabled = readInitial()
const listeners = new Set<() => void>()

function emit(): void {
  for (const l of listeners) l()
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function getSnapshot(): boolean {
  return enabled
}

export function setDevbarEnabled(v: boolean): void {
  if (enabled === v) return
  enabled = v
  try {
    localStorage.setItem(KEY, v ? "1" : "0")
  } catch {
    // almacenamiento no disponible: el toggle solo vive en memoria
  }
  emit()
}

export function toggleDevbar(): void {
  setDevbarEnabled(!enabled)
}

export function useDevbarEnabled(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
