import { useCallback, useMemo, useRef, useState } from "react"
import { shell, type FsEntry } from "../../shell"
import { useGitStatus } from "./useGitStatus"

const EXPLORER_RECENT_KEY = "opencode.explorer.recentDirs"

export function loadExplorerRecent(): string[] {
  try {
    const raw = localStorage.getItem(EXPLORER_RECENT_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((s: unknown) => typeof s === "string" && s).slice(0, 20) : []
  } catch {
    return []
  }
}

export function usePaneState(
  initialCwd: string | null = null,
  opts?: { onError?: (msg: string) => void },
) {
  const [cwd, setCwd] = useState<string | null>(initialCwd)
  const [dirs, setDirs] = useState<FsEntry[]>([])
  const [files, setFiles] = useState<FsEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>(() => loadExplorerRecent())
  const { refreshGit, getFileGitStatus, getFolderGitStatus } = useGitStatus(cwd)

  const loadSeqRef = useRef(0)

  const load = useCallback(
    async (path: string) => {
      if (!path) return
      const seq = ++loadSeqRef.current
      setCwd(path)
      setLoading(true)
      try {
        const r = await shell.fs.list(path)
        if (seq !== loadSeqRef.current) return
        setDirs(r.dirs || [])
        setFiles(r.files || [])
        const cur = loadExplorerRecent().filter((p) => p !== path)
        cur.unshift(path)
        try {
          localStorage.setItem(EXPLORER_RECENT_KEY, JSON.stringify(cur.slice(0, 20)))
        } catch {}
        setRecent(cur.slice(0, 20))
      } catch (e: unknown) {
        if (seq !== loadSeqRef.current) return
        const msg = e instanceof Error ? e.message : String(e)
        opts?.onError?.(msg || "No se pudo leer el directorio")
      } finally {
        if (seq === loadSeqRef.current) {
          setLoading(false)
          refreshGit()
        }
      }
    },
    [refreshGit, opts?.onError],
  )

  // Objeto estable por estado: evita recrear callbacks que dependen de la
  // identidad completa del pane (rompía memo(FileRow/TreeFolder)).
  return useMemo(
    () => ({ cwd, setCwd, dirs, files, loading, load, recent, getFileGitStatus, getFolderGitStatus }),
    [cwd, setCwd, dirs, files, loading, load, recent, getFileGitStatus, getFolderGitStatus],
  )
}

export type PaneState = ReturnType<typeof usePaneState>
