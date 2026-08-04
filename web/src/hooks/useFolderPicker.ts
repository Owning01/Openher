import { useState, useCallback } from "react"
import type { ServerConfig, FileEntry } from "../types"
import { api } from "../api"
import { STORAGE_KEYS } from "../constants"
import { useLocalStorage } from "./useLocalStorage"

const CURSOR_STORAGE_KEY = STORAGE_KEYS.CURSOR

// El server 1.18.12 lista SOLO rutas relativas al project directory ("" = raíz).
// El FolderPicker navega relativo; la creación de sesión usa la ruta absoluta
// que devuelve el server en cada entry (item.absolute).
export function useFolderPicker(config: ServerConfig) {
  const [newSessionDirectory, setNewSessionDirectory] = useLocalStorage<string>(CURSOR_STORAGE_KEY, "")
  const [showNewSessionPicker, setShowNewSessionPicker] = useState(false)
  const [pickerPath, setPickerPath] = useState("")
  const [pickerItems, setPickerItems] = useState<FileEntry[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerError, setPickerError] = useState<string | null>(null)

  const normalizedDirectory = newSessionDirectory.trim() || undefined

  const browseNewSessionDirectory = useCallback(async (path: string) => {
    setPickerLoading(true)
    setPickerError(null)
    setPickerPath(path)
    try {
      const items = await api.listFiles(config, path)
      setPickerItems(items.filter((item) => item.type === "directory").sort((a, b) => a.name.localeCompare(b.name)))
    } catch (err) {
      setPickerError((err as Error).message)
      setPickerItems([])
    } finally {
      setPickerLoading(false)
    }
  }, [config])

  const openNewSessionPicker = useCallback(async () => {
    setShowNewSessionPicker(true)
    setPickerError(null)
    try {
      const items = await api.listFiles(config, "")
      setPickerPath("")
      setPickerItems(items.filter((item) => item.type === "directory").sort((a, b) => a.name.localeCompare(b.name)))
    } catch (err) {
      setPickerItems([])
      setPickerPath("")
      setPickerError("Could not load directory listing from server")
    }
  }, [config])

  const persistDirectory = useCallback((dir: string) => {
    setNewSessionDirectory(dir)
  }, [setNewSessionDirectory])

  return {
    newSessionDirectory,
    setNewSessionDirectory,
    showNewSessionPicker,
    setShowNewSessionPicker,
    pickerPath,
    pickerItems,
    pickerLoading,
    pickerError,
    normalizedDirectory,
    browseNewSessionDirectory,
    openNewSessionPicker,
    persistDirectory
  }
}
