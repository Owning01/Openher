import { Capacitor } from "@capacitor/core"
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { STORAGE_KEYS } from "./constants"

const CONFIG_FILE = "opencode-config.json"
const allKeys = Object.values(STORAGE_KEYS)

let saveTimer: ReturnType<typeof setTimeout> | null = null
let patched = false

async function ensureDirectory() {
  try {
    await Filesystem.readdir({ path: "", directory: Directory.Documents })
  } catch {
    await Filesystem.mkdir({ path: "", directory: Directory.Documents })
  }
}

export async function restorePersistedConfig() {
  if (!Capacitor.isNativePlatform()) return
  try {
    await ensureDirectory()
    const result = await Filesystem.readFile({ path: CONFIG_FILE, directory: Directory.Documents })
    const raw = typeof result.data === "string" ? result.data : await new Response(result.data).text()
    const data = JSON.parse(raw) as Record<string, string>
    for (const key of allKeys) {
      if (data[key] !== undefined) {
        localStorage.setItem(key, data[key])
      }
    }
  } catch {
    // no saved config yet
  }
}

export async function persistConfig() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const data: Record<string, string> = {}
    for (const key of allKeys) {
      const val = localStorage.getItem(key)
      if (val !== null) data[key] = val
    }
    if (Object.keys(data).length === 0) return
    await Filesystem.writeFile({
      path: CONFIG_FILE,
      directory: Directory.Documents,
      data: JSON.stringify(data, null, 2),
      encoding: Encoding.UTF8,
    })
  } catch {
    // silent
  }
}

function scheduleSave() {
  if (!Capacitor.isNativePlatform()) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    persistConfig()
  }, 2000)
}

export function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  persistConfig()
}

export function initAutoPersist() {
  if (!Capacitor.isNativePlatform() || patched) return
  patched = true

  const origSetItem = localStorage.setItem.bind(localStorage)
  localStorage.setItem = function (key: string, value: string) {
    origSetItem(key, value)
    if (allKeys.includes(key as any)) {
      scheduleSave()
    }
  } as typeof localStorage.setItem

  const origRemoveItem = localStorage.removeItem.bind(localStorage)
  localStorage.removeItem = function (key: string) {
    origRemoveItem(key)
    if (allKeys.includes(key as any)) {
      scheduleSave()
    }
  } as typeof localStorage.removeItem
}
