import { useCallback, useState } from "react"
import { shell, type FsEntry } from "../../shell"
import { useGitStatus } from "./useGitStatus"

const EXPLORER_RECENT_KEY = "opencode.explorer.recentDirs"
function loadExplorerRecent(): string[] {
  try {
    const raw = localStorage.getItem(EXPLORER_RECENT_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((s: unknown) => typeof s === "string" && s).slice(0, 20) : []
  } catch {
    return []
  }
}

export function usePaneState(initialCwd: string | null = null) {
  const [cwd, setCwd] = useState<string | null>(initialCwd)
  const [dirs, setDirs] = useState<FsEntry[]>([])
  const [files, setFiles] = useState<FsEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { refreshGit } = useGitStatus(cwd)

  const load = useCallback(
    async (path: string) => {
      if (!path) return
      setCwd(path)
      setLoading(true)
      setError(null)
      try {
        const r = await shell.fs.list(path)
        setDirs(r.dirs || [])
        setFiles(r.files || [])
        const cur = loadExplorerRecent().filter((p) => p !== path)
        cur.unshift(path)
        try {
          localStorage.setItem(EXPLORER_RECENT_KEY, JSON.stringify(cur.slice(0, 20)))
        } catch {}
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        setError(msg || "No se pudo leer el directorio")
      } finally {
        setLoading(false)
        refreshGit()
      }
    },
    [refreshGit],
  )

  return { cwd, setCwd, dirs, files, loading, error, load }
}
