import { useState, useCallback } from "react"
import type { ServerConfig, FileEntry } from "../types"
import { api } from "../api"
import { STORAGE_KEYS } from "../constants"

const CURSOR_STORAGE_KEY = STORAGE_KEYS.CURSOR

export function useFolderPicker(config: ServerConfig) {
  const [newSessionDirectory, setNewSessionDirectory] = useState(() => localStorage.getItem(CURSOR_STORAGE_KEY) ?? "")
  const [showNewSessionPicker, setShowNewSessionPicker] = useState(false)
  const [pickerPath, setPickerPath] = useState("")
  const [pickerItems, setPickerItems] = useState<FileEntry[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerError, setPickerError] = useState<string | null>(null)

  const normalizedDirectory = newSessionDirectory.trim() || undefined

  const browseNewSessionDirectory = useCallback(async (path: string) => {
    setPickerLoading(true)
    setPickerError(null)
    try {
      const items = await api.listFiles(config, path)
      setPickerPath(path)
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
    const tryBrowse = async (dir: string): Promise<boolean> => {
      try {
        const items = await api.listFiles(config, dir)
        setPickerPath(dir)
        setPickerItems(items.filter((item) => item.type === "directory").sort((a, b) => a.name.localeCompare(b.name)))
        setPickerError(null)
        return true
      } catch { return false }
    }
    const dir = normalizedDirectory
      ? normalizedDirectory
      : await api.loadPath(config).then((p) => p.directory).catch(() => undefined)
    if (dir) {
      if (await tryBrowse(dir)) return
    }
    if (!(await tryBrowse("/"))) {
      setPickerItems([])
      setPickerPath("")
      setPickerError("Could not load directory listing from server")
    }
  }, [config, normalizedDirectory])

  const persistDirectory = useCallback((dir: string) => {
    setNewSessionDirectory(dir)
    localStorage.setItem(CURSOR_STORAGE_KEY, dir)
  }, [])

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
