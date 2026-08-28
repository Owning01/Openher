import { useCallback, useSyncExternalStore } from "react"

const STORAGE_KEY = "opencode.desktop.tabTitles.v1"

type TitlesMap = Record<string, string>

function read(): TitlesMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object") {
      const out: TitlesMap = {}
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof k === "string" && typeof v === "string" && v.trim()) {
          out[k] = v.trim().slice(0, 80)
        }
      }
      return out
    }
  } catch {}
  return {}
}

let cache: TitlesMap = read()
const listeners = new Set<() => void>()

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function notify(): void {
  for (const l of listeners) l()
}

function write(next: TitlesMap): void {
  cache = next
  try {
    if (Object.keys(next).length === 0) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {}
  notify()
}

export function getTabTitlesSnapshot(): TitlesMap {
  return cache
}

export function getTabTitlesServerSnapshot(): TitlesMap {
  return cache
}

export function setTabTitle(id: string, title: string | null): void {
  const t = title?.trim().slice(0, 80) ?? ""
  if (!id) return
  const next = { ...cache }
  if (!t) delete next[id]
  else next[id] = t
  write(next)
}

export function getTabTitle(id: string): string | null {
  return cache[id] ?? null
}

export function useTabTitles(): TitlesMap {
  return useSyncExternalStore(subscribe, getTabTitlesSnapshot, getTabTitlesServerSnapshot)
}

export function useTabTitleActions() {
  const set = useCallback((id: string, title: string | null) => setTabTitle(id, title), [])
  const get = useCallback((id: string) => getTabTitle(id), [])
  return { set, get }
}
