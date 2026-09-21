import { createStore, useStore } from "../../shared/lib/store"

const KEY = "openher.devbar.enabled"

function readInitial(): boolean {
  try {
    return localStorage.getItem(KEY) === "1"
  } catch {
    return false
  }
}

const store = createStore<boolean>(readInitial())

export function setDevbarEnabled(v: boolean): void {
  if (store.get() === v) return
  try {
    localStorage.setItem(KEY, v ? "1" : "0")
  } catch {
    // almacenamiento no disponible: el toggle solo vive en memoria
  }
  store.set(v)
}

export function toggleDevbar(): void {
  setDevbarEnabled(!store.get())
}

export function useDevbarEnabled(): boolean {
  return useStore(store)
}
