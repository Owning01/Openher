import { useState, useCallback, useMemo } from "react"
import type { ServerConfig, FileEntry } from "../types"
import { api } from "../api"

// Navega el project directory con rutas RELATIVAS al server ("" = raíz).
// El server 1.18.12 rechaza rutas absolutas en /file (RelativePath.make).
export function useFileBrowser(config: ServerConfig, directory?: string) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState("")
  const [items, setItems] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const browseDir = useCallback(async (path: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.listFiles(config, path, directory)
      setCurrentPath(path)
      setItems(result.sort((a, b) => {
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1
        return a.name.localeCompare(b.name)
      }))
    } catch (err) {
      setError((err as Error).message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [config, directory])

  const open = useCallback(async () => {
    setIsOpen(true)
    await browseDir("")
  }, [browseDir])

  const close = useCallback(() => {
    setIsOpen(false)
    setError(null)
    setItems([])
  }, [])

  const navigateTo = useCallback(async (name: string) => {
    const next = currentPath ? `${currentPath}/${name}` : name
    await browseDir(next)
  }, [currentPath, browseDir])

  const goUp = useCallback(() => {
    const parent = parentDir(currentPath)
    if (parent !== null) browseDir(parent)
  }, [currentPath, browseDir])

  // Objeto estable entre renders: sin esto, `fb` en deps de baseChatProps
  // invalidaba el memo del chat entero en cada keystroke.
  return useMemo(() => ({ isOpen, currentPath, items, loading, error, open, close, navigateTo, goUp }), [isOpen, currentPath, items, loading, error, open, close, navigateTo, goUp])
}

function parentDir(path: string): string | null {
  if (!path) return null
  const normalized = path.replace(/\/+$/, "")
  const index = normalized.lastIndexOf("/")
  return index <= 0 ? "" : normalized.slice(0, index)
}
