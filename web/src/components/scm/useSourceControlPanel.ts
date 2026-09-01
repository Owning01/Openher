// Hook SCM — puerto de terax-ai src/modules/source-control/useSourceControlPanel.ts (Apache-2.0)
// Adaptado: shell.git.* en lugar de native.*, sin AI ChatStore (generate disabled), sin diffCache.
// Mantiene fileEntries unificado con checkState indeterminate, optimistic stage/unstage/discard.

import { useCallback, useEffect, useMemo, useState } from "react"
import { shell, type GitChangedFile, type GitStatusSnapshot } from "../../shell"

export type DiffMode = "+" | "-"
export type CheckState = "checked" | "indeterminate" | "unchecked"

export type SourceControlEntry = {
  key: string
  path: string
  mode: DiffMode
  indexStatus: string
  worktreeStatus: string
  statusLabel: string
  statusCode: string
  originalPath: string | null
  untracked: boolean
}

export type SourceControlFileEntry = {
  key: string
  path: string
  originalPath: string | null
  statusCode: string
  statusLabel: string
  checkState: CheckState
  staged: boolean
  unstaged: boolean
  untracked: boolean
}

export type PendingDiscard = { scope: "single" | "all"; count: number; label: string } | null

function normalizeStatusCode(status: string): string {
  const code = status.trim().toUpperCase()
  switch (code) {
    case "?": return "U"
    case "A": return "A"
    case "M": return "M"
    case "D": return "D"
    case "R":
    case "C": return "R"
    case "U": return "U"
    default: return code || "M"
  }
}

function statusCodeForMode(mode: DiffMode, file: GitChangedFile): string {
  if (mode === "-" && file.untracked) return "U"
  const primary = mode === "+" ? file.indexStatus : file.worktreeStatus
  const fallback = mode === "+" ? file.worktreeStatus : file.indexStatus
  return normalizeStatusCode(primary !== " " ? primary : fallback)
}

function makeEntry(path: string, mode: DiffMode, file: GitChangedFile): SourceControlEntry {
  return {
    key: `${mode}:${path}`,
    path,
    mode,
    indexStatus: file.indexStatus,
    worktreeStatus: file.worktreeStatus,
    statusLabel: file.statusLabel,
    statusCode: statusCodeForMode(mode, file),
    originalPath: file.originalPath,
    untracked: file.untracked,
  }
}

function optimisticStage(status: GitStatusSnapshot, paths: Set<string>): GitStatusSnapshot {
  let changed = false
  const next = status.changedFiles.map((file) => {
    if (!paths.has(file.path)) return file
    if (file.staged && !file.unstaged) return file
    changed = true
    const wt = file.worktreeStatus !== " " ? file.worktreeStatus : file.indexStatus
    return { ...file, indexStatus: wt, worktreeStatus: " ", staged: true, unstaged: false, untracked: false }
  })
  if (!changed) return status
  return { ...status, changedFiles: next }
}

function optimisticUnstage(status: GitStatusSnapshot, paths: Set<string>): GitStatusSnapshot {
  let changed = false
  const next: GitChangedFile[] = []
  for (const file of status.changedFiles) {
    if (!paths.has(file.path)) { next.push(file); continue }
    if (!file.staged && file.unstaged) { next.push(file); continue }
    changed = true
    const idx = file.indexStatus !== " " ? file.indexStatus : file.worktreeStatus
    if (idx === "R" && file.originalPath) {
      next.push({ path: file.originalPath, originalPath: null, indexStatus: " ", worktreeStatus: "D", staged: false, unstaged: true, untracked: false, statusLabel: "Deleted" })
      next.push({ path: file.path, originalPath: null, indexStatus: " ", worktreeStatus: "?", staged: false, unstaged: true, untracked: true, statusLabel: "Untracked" })
      continue
    }
    next.push({ ...file, originalPath: null, indexStatus: " ", worktreeStatus: idx === "A" ? "?" : idx, staged: false, unstaged: true, untracked: idx === "A" })
  }
  if (!changed) return status
  return { ...status, changedFiles: next }
}

function optimisticDiscard(status: GitStatusSnapshot, paths: Set<string>): GitStatusSnapshot {
  let changed = false
  const next: GitChangedFile[] = []
  for (const file of status.changedFiles) {
    if (!paths.has(file.path)) { next.push(file); continue }
    if (file.staged) {
      changed = true
      next.push({ ...file, worktreeStatus: " ", unstaged: false, untracked: false })
    } else {
      changed = true
    }
  }
  if (!changed) return status
  return { ...status, changedFiles: next }
}

export type UsePanelReturn = {
  status: GitStatusSnapshot | null
  stagedEntries: SourceControlEntry[]
  unstagedEntries: SourceControlEntry[]
  fileEntries: SourceControlFileEntry[]
  headerCheckState: CheckState
  allClean: boolean
  canPush: boolean
  pushHint: string | null
  commitMessage: string
  setCommitMessage: (v: string) => void
  refresh: () => Promise<void>
  toggleStageFile: (e: SourceControlFileEntry) => Promise<void>
  toggleAll: () => Promise<void>
  stageAll: (staged: boolean) => Promise<void>
  requestDiscardFile: (e: SourceControlFileEntry) => void
  pendingDiscard: PendingDiscard
  confirmPendingDiscard: () => Promise<void>
  cancelPendingDiscard: () => void
  commit: () => Promise<void>
  push: () => Promise<void>
  actionBusy: string | null
  actionError: string | null
  actionMessage: string | null
  fetchRemote: () => Promise<void>
  pull: () => Promise<void>
  selectFile: (e: SourceControlFileEntry) => void
  selected: { path: string; mode: DiffMode } | null
  selectEntry: (e: SourceControlEntry) => void
}

export function useSourceControlPanel(
  repoRoot: string | null,
  statusProp: GitStatusSnapshot | null,
  onRefresh: () => Promise<void>,
  onOpenDiff: ((path: string, mode: DiffMode, originalPath: string | null) => void) | null,
): UsePanelReturn {
  const [commitMessage, setCommitMessage] = useState("")
  const [localBusy, setLocalBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [pendingRaw, setPendingRaw] = useState<{ scope: "single"; entry: SourceControlEntry } | { scope: "all"; entries: SourceControlEntry[] } | null>(null)
  const [optimisticStatus, setOptimisticStatus] = useState<GitStatusSnapshot | null>(null)
  const status = optimisticStatus ?? statusProp
  const [selected, setSelected] = useState<{ path: string; mode: DiffMode } | null>(null)

  // reset optimistic when upstream status changes
  useEffect(() => { setOptimisticStatus(null) }, [statusProp])

  const stagedEntries = useMemo(() => (status?.changedFiles ?? []).filter((f) => f.staged).map((f) => makeEntry(f.path, "+", f)), [status])
  const unstagedEntries = useMemo(() => (status?.changedFiles ?? []).filter((f) => f.unstaged).map((f) => makeEntry(f.path, "-", f)), [status])

  const fileEntries = useMemo<SourceControlFileEntry[]>(() => {
    const seen = new Set<string>()
    const out: SourceControlFileEntry[] = []
    for (const file of status?.changedFiles ?? []) {
      if (seen.has(file.path)) continue
      seen.add(file.path)
      const checkState: CheckState = file.staged && file.unstaged ? "indeterminate" : file.staged ? "checked" : "unchecked"
      const statusCode = file.unstaged ? statusCodeForMode("-", file) : statusCodeForMode("+", file)
      out.push({ key: file.path, path: file.path, originalPath: file.originalPath, statusCode, statusLabel: file.statusLabel, checkState, staged: file.staged, unstaged: file.unstaged, untracked: file.untracked })
    }
    return out
  }, [status])

  const headerCheckState = useMemo<CheckState>(() => {
    if (fileEntries.length === 0) return "unchecked"
    const allChecked = fileEntries.every((e) => e.checkState === "checked")
    if (allChecked) return "checked"
    const anyStaged = fileEntries.some((e) => e.staged)
    return anyStaged ? "indeterminate" : "unchecked"
  }, [fileEntries])

  const allClean = stagedEntries.length === 0 && unstagedEntries.length === 0
  const canPush = !!status?.upstream && status.behind === 0

  const pushHint = useMemo(() => {
    if (!status) return null
    if (!status.upstream) return "Configure o publicá esta rama en la terminal para habilitar push."
    if (status.behind > 0) return "Hacé pull antes de pushear."
    if (status.ahead === 0) return `Nada para pushear a ${status.upstream}.`
    return `Push a ${status.upstream}.`
  }, [status])

  const runMutation = useCallback(async (busyKey: string, optimistic: ((s: GitStatusSnapshot) => GitStatusSnapshot) | null, ipc: () => Promise<unknown>, affected: string[]) => {
    if (!repoRoot) return
    setLocalBusy(busyKey)
    setActionMessage(null)
    setActionError(null)
    if (optimistic && statusProp) {
      try { setOptimisticStatus(optimistic(statusProp)) } catch {}
    }
    try {
      await ipc()
      setOptimisticStatus(null)
      await onRefresh()
    } catch (e) {
      setActionError(String(e))
      setOptimisticStatus(null)
      await onRefresh().catch(() => {})
    } finally {
      setLocalBusy(null)
    }
    void affected
  }, [repoRoot, statusProp, onRefresh])

  const toggleStageFile = useCallback(async (entry: SourceControlFileEntry) => {
    if (!repoRoot) return
    const paths = new Set([entry.path])
    if (entry.checkState === "checked") {
      await runMutation(`unstage:${entry.path}`, (s) => optimisticUnstage(s, paths), () => shell.git.unstage(repoRoot, [entry.path]), [entry.path])
    } else {
      await runMutation(`stage:${entry.path}`, (s) => optimisticStage(s, paths), () => shell.git.stage(repoRoot, [entry.path]), [entry.path])
    }
  }, [repoRoot, runMutation])

  const stageAll = useCallback(async (doStage: boolean) => {
    if (!repoRoot) return
    if (doStage) {
      const paths = unstagedEntries.map((e) => e.path)
      if (paths.length === 0) return
      const set = new Set(paths)
      await runMutation("stage:all", (s) => optimisticStage(s, set), () => shell.git.stage(repoRoot, paths), paths)
    } else {
      const paths = stagedEntries.map((e) => e.path)
      if (paths.length === 0) return
      const set = new Set(paths)
      await runMutation("unstage:all", (s) => optimisticUnstage(s, set), () => shell.git.unstage(repoRoot, paths), paths)
    }
  }, [repoRoot, runMutation, stagedEntries, unstagedEntries])

  const toggleAll = useCallback(async () => {
    if (headerCheckState === "checked") await stageAll(false)
    else await stageAll(true)
  }, [headerCheckState, stageAll])

  const requestDiscardFile = useCallback((entry: SourceControlFileEntry) => {
    if (!repoRoot) return
    setPendingRaw({ scope: "single", entry: { key: `-:${entry.path}`, path: entry.path, mode: "-" as DiffMode, indexStatus: " ", worktreeStatus: entry.statusCode, statusLabel: entry.statusLabel, statusCode: entry.statusCode, originalPath: entry.originalPath, untracked: entry.untracked } })
  }, [repoRoot])

  const pendingDiscard: PendingDiscard = useMemo(() => {
    if (!pendingRaw) return null
    if (pendingRaw.scope === "single") return { scope: "single", count: 1, label: pendingRaw.entry.path }
    return { scope: "all", count: pendingRaw.entries.length, label: `${pendingRaw.entries.length} archivos` }
  }, [pendingRaw])

  const confirmPendingDiscard = useCallback(async () => {
    if (!repoRoot || !pendingRaw) return
    const list = pendingRaw.scope === "single" ? [pendingRaw.entry] : pendingRaw.entries
    setPendingRaw(null)
    const entries = list.map((e) => ({ path: e.path, untracked: e.untracked }))
    const paths = new Set(list.map((e) => e.path))
    await runMutation(pendingRaw.scope === "single" ? `discard:${list[0].path}` : "discard:all", (s) => optimisticDiscard(s, paths), () => shell.git.discard(repoRoot, entries), [...paths])
  }, [pendingRaw, repoRoot, runMutation])

  const cancelPendingDiscard = useCallback(() => setPendingRaw(null), [])

  const commit = useCallback(async () => {
    if (!repoRoot) return
    setLocalBusy("commit")
    setActionMessage(null)
    setActionError(null)
    try {
      const r = await shell.git.commit(repoRoot, commitMessage)
      setCommitMessage("")
      setActionMessage(`${r.commitSha.slice(0, 7)} ${r.summary}`)
      await onRefresh()
    } catch (e) { setActionError(String(e)) } finally { setLocalBusy(null) }
  }, [repoRoot, commitMessage, onRefresh])

  const push = useCallback(async () => {
    if (!repoRoot) return
    setLocalBusy("push")
    setActionMessage(null)
    setActionError(null)
    try {
      await shell.git.push(repoRoot)
      setActionMessage(status?.upstream ? `Push a ${status.upstream}` : "Push OK")
      await onRefresh()
    } catch (e) { setActionError(String(e)) } finally { setLocalBusy(null) }
  }, [repoRoot, status?.upstream, onRefresh])

  const fetchRemote = useCallback(async () => {
    if (!repoRoot) return
    setLocalBusy("fetch")
    setActionError(null)
    try { await shell.git.fetch(repoRoot); setActionMessage("Fetch OK"); await onRefresh() } catch (e) { setActionError(String(e)) } finally { setLocalBusy(null) }
  }, [repoRoot, onRefresh])

  const pull = useCallback(async () => {
    if (!repoRoot) return
    setLocalBusy("pull")
    setActionError(null)
    try { await shell.git.pull(repoRoot); setActionMessage("Pull OK"); await onRefresh() } catch (e) { setActionError(String(e)) } finally { setLocalBusy(null) }
  }, [repoRoot, onRefresh])

  const selectFile = useCallback((entry: SourceControlFileEntry) => {
    const mode: DiffMode = entry.unstaged ? "-" : "+"
    setSelected({ path: entry.path, mode })
    onOpenDiff?.(entry.path, mode, entry.originalPath)
  }, [onOpenDiff])

  const selectEntry = useCallback((entry: SourceControlEntry) => {
    setSelected({ path: entry.path, mode: entry.mode })
    onOpenDiff?.(entry.path, entry.mode, entry.originalPath)
  }, [onOpenDiff])

  const refresh = useCallback(async () => { await onRefresh() }, [onRefresh])

  return {
    status, stagedEntries, unstagedEntries, fileEntries, headerCheckState, allClean, canPush, pushHint,
    commitMessage, setCommitMessage, refresh, toggleStageFile, toggleAll, stageAll, requestDiscardFile,
    pendingDiscard, confirmPendingDiscard, cancelPendingDiscard, commit, push, actionBusy: localBusy, actionError, actionMessage,
    fetchRemote, pull, selectFile, selected, selectEntry,
  }
}
