import { useEffect, useState, useCallback, useMemo } from "react"
import { shell, type GitChangedFile } from "../../shell"

export type GitFileStatus = {
  status: "M" | "U" | "D" | "A" | "staged"
  color: string
  badge: string
}

export function computeGitFileStatus(f: GitChangedFile): GitFileStatus {
  if (f.untracked) {
    return { status: "U", color: "var(--git-untracked, #73c991)", badge: "U" }
  }
  if (f.unstaged || f.worktreeStatus === "M" || f.indexStatus === "M") {
    return { status: "M", color: "var(--git-modified, #e2c08d)", badge: "M" }
  }
  if (f.staged) {
    return { status: "staged", color: "var(--git-staged, #73c991)", badge: "S" }
  }
  return { status: "M", color: "var(--git-modified, #e2c08d)", badge: "M" }
}

export function useGitStatus(cwd: string | null) {
  const [changedFiles, setChangedFiles] = useState<GitChangedFile[]>([])

  const refreshGit = useCallback(async () => {
    if (!cwd) {
      setChangedFiles([])
      return
    }
    try {
      const snap = await shell.git.panel(cwd)
      setChangedFiles(snap?.status?.changedFiles ?? [])
    } catch {
      setChangedFiles([])
    }
  }, [cwd])

  useEffect(() => {
    refreshGit()
  }, [refreshGit])

  // Indices precomputados una vez por snapshot: antes cada fila/carpeta hacia
  // un scan lineal de todos los cambios (O(filas x cambios) por render).
  const gitIndex = useMemo(() => {
    const statusMap = new Map<string, GitFileStatus>()
    // Orden de insercion de cada path: preserva el "primer match" del scan
    // original al resolver por sufijo.
    const order = new Map<string, number>()
    // Agregados por carpeta ancestro y por primer segmento del path git.
    const folderMod = new Set<string>()
    const folderUnt = new Set<string>()
    const topMod = new Set<string>()
    const topUnt = new Set<string>()
    for (const f of changedFiles) {
      const stat = computeGitFileStatus(f)
      const norm = f.path.replace(/\\/g, "/").toLowerCase()
      if (!statusMap.has(norm)) order.set(norm, order.size)
      statusMap.set(norm, stat)
    }
    // Los agregados derivan del Map ya deduplicado (si un path se repite, el
    // scan original solo veia el ultimo estado).
    for (const [norm, stat] of statusMap) {
      const isMod = stat.status === "M"
      const isUnt = stat.status === "U"
      const firstSeg = norm.split("/")[0]
      if (firstSeg) {
        if (isMod) topMod.add(firstSeg)
        if (isUnt) topUnt.add(firstSeg)
      }
      let idx = norm.lastIndexOf("/")
      while (idx > 0) {
        const dir = norm.slice(0, idx)
        if (isMod) folderMod.add(dir)
        if (isUnt) folderUnt.add(dir)
        idx = dir.lastIndexOf("/")
      }
    }
    return { statusMap, order, folderMod, folderUnt, topMod, topUnt }
  }, [changedFiles])

  const getFileGitStatus = useCallback((filePath: string): GitFileStatus | null => {
    if (!filePath || gitIndex.statusMap.size === 0) return null
    const norm = filePath.replace(/\\/g, "/").toLowerCase()

    // Exact match
    const exact = gitIndex.statusMap.get(norm)
    if (exact) return exact

    // Match por sufijo (ruta absoluta vs path git relativo): recorre los
    // sufijos de norm por cada "/" y elige el de menor indice de insercion,
    // que es el mismo ganador que el scan completo original.
    let best: GitFileStatus | null = null
    let bestIdx = Infinity
    let i = norm.indexOf("/")
    while (i >= 0) {
      const cand = norm.slice(i + 1)
      const o = gitIndex.order.get(cand)
      if (o !== undefined && o < bestIdx) {
        bestIdx = o
        best = gitIndex.statusMap.get(cand) ?? best
      }
      i = norm.indexOf("/", i + 1)
    }
    return best
  }, [gitIndex])

  const getFolderGitStatus = useCallback((folderPath: string): { color: string; hasChanges: boolean } | null => {
    if (!folderPath || gitIndex.statusMap.size === 0) return null
    const norm = folderPath.replace(/\\/g, "/").toLowerCase()
    const slash = norm.lastIndexOf("/")
    const base = slash >= 0 ? norm.slice(slash + 1) : null

    const hasModified = gitIndex.folderMod.has(norm) || (base !== null && gitIndex.topMod.has(base))
    const hasUntracked = gitIndex.folderUnt.has(norm) || (base !== null && gitIndex.topUnt.has(base))

    if (hasModified) return { color: "var(--git-modified, #e2c08d)", hasChanges: true }
    if (hasUntracked) return { color: "var(--git-untracked, #73c991)", hasChanges: true }
    return null
  }, [gitIndex])

  return {
    changedFiles,
    refreshGit,
    getFileGitStatus,
    getFolderGitStatus,
  }
}
