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

  const statusMap = useMemo(() => {
    const map = new Map<string, GitFileStatus>()
    for (const f of changedFiles) {
      const stat = computeGitFileStatus(f)
      const norm = f.path.replace(/\\/g, "/").toLowerCase()
      map.set(norm, stat)
    }
    return map
  }, [changedFiles])

  const getFileGitStatus = useCallback((filePath: string): GitFileStatus | null => {
    if (!filePath || statusMap.size === 0) return null
    const norm = filePath.replace(/\\/g, "/").toLowerCase()
    
    // Exact match
    if (statusMap.has(norm)) return statusMap.get(norm)!

    // Match by suffix (e.g. if path is absolute and git path is relative)
    for (const [gitPath, stat] of statusMap.entries()) {
      if (norm.endsWith("/" + gitPath) || norm === gitPath) {
        return stat
      }
    }
    return null
  }, [statusMap])

  const getFolderGitStatus = useCallback((folderPath: string): { color: string; hasChanges: boolean } | null => {
    if (!folderPath || statusMap.size === 0) return null
    const norm = folderPath.replace(/\\/g, "/").toLowerCase()

    let hasModified = false
    let hasUntracked = false

    for (const [gitPath, stat] of statusMap.entries()) {
      if (gitPath.startsWith(norm + "/") || norm.endsWith("/" + gitPath.split("/")[0])) {
        if (stat.status === "M") hasModified = true
        else if (stat.status === "U") hasUntracked = true
      }
    }

    if (hasModified) return { color: "var(--git-modified, #e2c08d)", hasChanges: true }
    if (hasUntracked) return { color: "var(--git-untracked, #73c991)", hasChanges: true }
    return null
  }, [statusMap])

  return {
    changedFiles,
    refreshGit,
    getFileGitStatus,
    getFolderGitStatus,
  }
}
