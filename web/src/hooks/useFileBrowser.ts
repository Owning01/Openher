import { useState, useCallback } from "react"
import type { ServerConfig, FileEntry } from "../types"
import { api } from "../api"

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

  const open = useCallback(async (path: string) => {
    setIsOpen(true)
    await browseDir(path)
  }, [browseDir])

  const close = useCallback(() => {
    setIsOpen(false)
    setError(null)
    setItems([])
  }, [])

  const navigateTo = useCallback(async (path: string) => {
    await browseDir(path)
  }, [browseDir])

  const goUp = useCallback(() => {
    const parent = parentDir(currentPath)
    if (parent !== null) browseDir(parent)
  }, [currentPath, browseDir])

  return { isOpen, currentPath, items, loading, error, open, close, navigateTo, goUp }
}

function parentDir(path: string): string | null {
  if (!path || path === "/") return null
  const normalized = path.replace(/[\\/]+$/, "").replace(/\\/g, "/")
  const index = normalized.lastIndexOf("/")
  if (index <= 0) return "/"
  return normalized.slice(0, index)
}
