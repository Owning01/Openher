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

// Status HTTP del error envuelto por el cliente (sin status = fallo de red).
function httpStatus(err: unknown): number | undefined {
  const cause = (err as { cause?: { status?: unknown } } | undefined)?.cause
  return typeof cause?.status === "number" ? cause.status : undefined
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

// Un directorio es absoluto si trae unidad Windows (C:\ o C:/), raíz Unix (/)
// o UNC (\\server\share). El listado v2 devuelve paths relativos al dir listado;
// un cursor relativo (bug viejo) queda anclado al cwd del server.
export function isAbsoluteDir(dir: string): boolean {
  const d = dir.trim()
  if (!d) return false
  return /^[A-Za-z]:[\\/]/.test(d) || d.startsWith("/") || d.startsWith("\\\\")
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

  // Devuelve null si listó OK, o el error si falló (para que openNewSessionPicker
  // pueda caer al home cuando el directorio guardado ya no existe).
  const loadDir = useCallback(async (dir: string): Promise<Error | null> => {
    const prevDir = pickerDir
    setPickerLoading(true)
    setPickerError(null)
    setPickerDir(dir)
    try {
      const items = await api.listFiles(config, "", dir || undefined)
      setPickerItems(items.filter((item) => item.type === "directory").sort((a, b) => a.name.localeCompare(b.name)))
      return null
    } catch (err) {
      setPickerError((err as Error).message)
      setPickerItems([])
      setPickerDir(prevDir)
      return err as Error
    } finally {
      setPickerLoading(false)
    }
  }, [config, pickerDir])

  const browseNewSessionDirectory = useCallback(async (dir: string) => {
    await loadDir(dir)
  }, [loadDir])

  const openNewSessionPicker = useCallback(async (initialDir?: string) => {
    setShowNewSessionPicker(true)
    setPickerError(null)
    try {
      // El chat abre el picker en el proyecto actual (la sesión seleccionada);
      // si no sirve cae al cursor guardado y, por último, al directorio del server.
      const preferred = (initialDir ?? "").trim()
      if (preferred && isAbsoluteDir(preferred)) {
        const failure = await loadDir(preferred)
        if (!failure) return
      }
      const saved = newSessionDirectory.trim()
      if (saved && saved !== preferred) {
        // Cursor relativo (lo persistía el bug v2): se descarta y cae al home.
        if (!isAbsoluteDir(saved)) {
          setNewSessionDirectory("")
        } else {
          const failure = await loadDir(saved)
          if (!failure) return
          // El dir guardado ya no existe (el server responde 4xx/5xx al listarlo):
          // limpiarlo evita reintentos y abre el picker en el home. Un fallo de
          // red (sin status) conserva la preferencia.
          if (httpStatus(failure) !== undefined) setNewSessionDirectory("")
        }
      }
      const info = await api.loadPath(config)
      await loadDir(info.directory ?? "")
    } catch (err) {
      setPickerItems([])
      setPickerDir("")
      setPickerError("Could not load directory listing from server")
    }
  }, [config, newSessionDirectory, loadDir, setNewSessionDirectory])

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
