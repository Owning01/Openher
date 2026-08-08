import { useState, useCallback } from "react"
import type { ServerConfig, FileEntry } from "../types"
import { api } from "../api"
import { STORAGE_KEYS } from "../constants"
import { useLocalStorage } from "./useLocalStorage"

const CURSOR_STORAGE_KEY = STORAGE_KEYS.CURSOR

// ——— Helpers de navegación por rutas ABSOLUTAS (Windows y Unix) ———
// El server 1.18.x lista DENTRO de un directory absoluto cualquiera
// (/file?path=&directory=C:\...), pero los paths relativos no escapan (.. → 500).
// Por eso el FolderPicker navega cambiando el directory, nunca con ".." relativo.

export function dirParent(dir: string): string | null {
  if (!dir || dir === "/") return null
  if (/^[A-Za-z]:[\\/]?$/i.test(dir)) return null
  if (!dir.includes("\\") && !dir.startsWith("/")) return null
  const windows = dir.includes("\\")
  const norm = dir.replace(/\\/g, "/").replace(/\/+$/, "")
  const idx = norm.lastIndexOf("/")
  if (idx < 0) return null
  let parent = norm.slice(0, idx)
  if (!parent) parent = "/"
  if (/^[A-Za-z]:$/i.test(parent)) parent += "/"
  return windows ? parent.replace(/\//g, "\\") : parent
}

export function dirParts(dir: string): string[] {
  if (!dir) return []
  if (dir === "/") return ["/"]
  const norm = dir.replace(/\\/g, "/").replace(/\/+$/, "")
  return norm.split("/").filter(Boolean)
}

export function partsToDir(parts: string[]): string {
  if (parts.length === 0) return ""
  if (parts.length === 1 && parts[0] === "/") return "/"
  const [head, ...tail] = parts
  if (/^[A-Za-z]:$/i.test(head)) {
    return tail.length > 0 ? `${head}\\${tail.join("\\")}` : `${head}\\`
  }
  return `/${parts.join("/")}`
}

// Resuelve ".." y "." contra el path absoluto (el server rechaza ".." con 500).
function resolveDots(path: string): string {
  const windows = path.includes("\\")
  const parts = path.replace(/\\/g, "/").split("/")
  const out: string[] = []
  for (const p of parts) {
    if (p === "..") {
      const prev = out[out.length - 1]
      if (prev && !/^[A-Za-z]:$/i.test(prev)) { out.pop(); continue }
      continue
    }
    if (p && p !== ".") out.push(p)
  }
  if (out.length === 0) return windows ? "C:\\" : "/"
  const joined = out.join("/")
  const driveHead = /^[A-Za-z]:$/i.test(out[0])
  if (windows || driveHead) {
    return out.length === 1 && driveHead ? `${joined}\\` : joined.replace(/\//g, "\\")
  }
  return `/${joined}`
}

// Convierte una entrada manual (absoluta o relativa) en un directorio absoluto.
// Los ".." se resuelven client-side; el server /file los rechaza (500).
export function toAbsolute(dir: string, manual: string): string {
  const m = manual.trim().replace(/[\\/]+$/, "")
  if (!m) return dir
  let absolute: string
  if (/^[A-Za-z]:$/i.test(m)) {
    absolute = `${m}\\`
  } else if (/^[A-Za-z]:[\\/]/.test(m)) {
    absolute = m.replace(/\//g, "\\")
  } else if (m.startsWith("/")) {
    absolute = m
  } else if (!dir) {
    absolute = m.replace(/\\/g, "/")
  } else if (dir.includes("\\")) {
    absolute = `${dir.replace(/[\\/]+$/, "")}\\${m.replace(/\\/g, "/").replace(/^\/+/, "")}`.replace(/\//g, "\\")
  } else {
    absolute = `${dir.replace(/\/+$/, "")}/${m.replace(/\\/g, "/").replace(/^\/+/, "")}`
  }
  return resolveDots(absolute)
}

// El FolderPicker navega por TODO el filesystem del server: el estado es un
// directorio ABSOLUTO y el server lista su contenido (path relativo "" = raíz).
export function useFolderPicker(config: ServerConfig) {
  const [newSessionDirectory, setNewSessionDirectory] = useLocalStorage<string>(CURSOR_STORAGE_KEY, "")
  const [showNewSessionPicker, setShowNewSessionPicker] = useState(false)
  const [pickerDir, setPickerDir] = useState("")
  const [pickerItems, setPickerItems] = useState<FileEntry[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerError, setPickerError] = useState<string | null>(null)

  const normalizedDirectory = newSessionDirectory.trim() || undefined

  const loadDir = useCallback(async (dir: string) => {
    const prevDir = pickerDir
    setPickerLoading(true)
    setPickerError(null)
    setPickerDir(dir)
    try {
      const items = await api.listFiles(config, "", dir || undefined)
      setPickerItems(items.filter((item) => item.type === "directory").sort((a, b) => a.name.localeCompare(b.name)))
    } catch (err) {
      setPickerError((err as Error).message)
      setPickerItems([])
      setPickerDir(prevDir)
    } finally {
      setPickerLoading(false)
    }
  }, [config, pickerDir])

  const browseNewSessionDirectory = useCallback(async (dir: string) => {
    await loadDir(dir)
  }, [loadDir])

  const openNewSessionPicker = useCallback(async () => {
    setShowNewSessionPicker(true)
    setPickerError(null)
    try {
      const saved = newSessionDirectory.trim()
      if (saved) {
        await loadDir(saved)
        return
      }
      const info = await api.loadPath(config)
      await loadDir(info.directory ?? "")
    } catch (err) {
      setPickerItems([])
      setPickerDir("")
      setPickerError("Could not load directory listing from server")
    }
  }, [config, newSessionDirectory, loadDir])

  const persistDirectory = useCallback((dir: string) => {
    setNewSessionDirectory(dir)
  }, [setNewSessionDirectory])

  return {
    newSessionDirectory,
    setNewSessionDirectory,
    showNewSessionPicker,
    setShowNewSessionPicker,
    pickerDir,
    pickerItems,
    pickerLoading,
    pickerError,
    setPickerError,
    normalizedDirectory,
    browseNewSessionDirectory,
    openNewSessionPicker,
    persistDirectory
  }
}
