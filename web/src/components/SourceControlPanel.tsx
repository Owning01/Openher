// Source Control panel — puerto del UX de terax-ai (Apache-2.0,
// src/modules/source-control) adaptado a este proyecto: CSS propio,
// hooks locales, Modal e i18n propios.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useT } from "../i18n-context"
import { Modal } from "./Modal"
import { useDialog } from "./DialogProvider"
import { CheckIcon, ChevronIcon, FolderIcon, LoadingIcon, RefreshIcon, UndoIcon } from "../Icons"
import { shell, type GitChangedFile, type GitStatusSnapshot } from "../shell"
import { HistoryPane } from "./scm/HistoryPane"

type Props = {
  cwd?: string
  availableDirs?: string[]
  onSelectDir?: (dir: string) => void
}

function basename(path: string): string {
  const parts = path.split(/[\\/]/).filter(Boolean)
  return parts.length > 0 ? parts[parts.length - 1] : path
}

function dirname(path: string): string {
  const normalized = path.replace(/\\/g, "/")
  const index = normalized.lastIndexOf("/")
  if (index <= 0) return ""
  return normalized.slice(0, index)
}

function statusAccent(code: string): string {
  switch (code) {
    case "A": return "scm-accent-a"
    case "U": return "scm-accent-u"
    case "M": return "scm-accent-m"
    case "D": return "scm-accent-d"
    case "R": return "scm-accent-r"
    default: return "scm-accent-x"
  }
}

const DiffModal = memo(function DiffModal({ title, patch, onClose }: {
  title: string; patch: string; onClose: () => void
}) {
  const lines = useMemo(() => patch.split("\n").slice(0, 4000), [patch])
  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{title}</h3>
        <button className="btn-icon compact" onClick={onClose}></button>
      </div>
      <div className="scm-diff">
        {lines.map((l, i) => (
          <div key={i} className={
            l.startsWith("+") && !l.startsWith("+++") ? "scm-dl-add"
              : l.startsWith("-") && !l.startsWith("---") ? "scm-dl-del"
                : l.startsWith("@@") ? "scm-dl-hunk" : "scm-dl-ctx"
          }>{l || " "}</div>
        ))}
      </div>
    </Modal>
  )
})

const EntryRow = memo(function EntryRow({ entry, staged, onToggleStage, onOpenDiff, onDiscard }: {
  entry: GitChangedFile
  staged: boolean
  onToggleStage: (entry: GitChangedFile, isStaged: boolean) => void
  onOpenDiff: (entry: GitChangedFile, staged: boolean) => void
  onDiscard: (entry: GitChangedFile) => void
}) {
  const labelDir = entry.originalPath ? `${entry.originalPath} →` : dirname(entry.path)
  const code = entry.indexStatus !== " " && entry.indexStatus !== "?" ? entry.indexStatus : entry.worktreeStatus
  return (
    <div className="scm-row" role="button" tabIndex={0}
      onClick={() => onOpenDiff(entry, staged)}
      onKeyDown={(e) => { if (e.key === "Enter") onOpenDiff(entry, staged) }}>
      <button type="button" className={`scm-check${staged ? " on" : ""}`}
        aria-checked={staged} role="switch" title={staged ? "Unstage" : "Stage"}
        onClick={(e) => { e.stopPropagation(); onToggleStage(entry, staged) }}>
        {staged ? <CheckIcon size={11} /> : null}
      </button>
      <span className={`scm-badge ${statusAccent(code)}`}>{code}</span>
      <span className="scm-row-text">
        {labelDir ? <span className="scm-dir scm-trunc">{labelDir}</span> : null}
        <span className="scm-name scm-trunc">{basename(entry.path)}</span>
      </span>
      {!staged ? (
        <button type="button" className="scm-icon-btn scm-row-action" title="Discard"
          onClick={(e) => { e.stopPropagation(); onDiscard(entry) }}>
          <UndoIcon size={13} />
        </button>
      ) : null}
    </div>
  )
})

export const SourceControlPanel = memo(function SourceControlPanel({ cwd, availableDirs = [], onSelectDir }: Props) {
  const t = useT()
  const { confirm } = useDialog()
  const [activeCwd, setActiveCwd] = useState(cwd || "")
  const [tab, setTab] = useState<"changes" | "history">("changes")
  const [snapshot, setSnapshot] = useState<GitStatusSnapshot | null>(null)
  const [repoRoot, setRepoRoot] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [notRepo, setNotRepo] = useState(false)
  const [commitMessage, setCommitMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; msg: string } | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [diffView, setDiffView] = useState<{ title: string; text: string } | null>(null)
  const fbTimer = useRef<number | null>(null)

  useEffect(() => {
    if (cwd) setActiveCwd(cwd)
  }, [cwd])

  const showFeedback = useCallback((tone: "ok" | "err", msg: string) => {
    setFeedback({ tone, msg })
    if (fbTimer.current) window.clearTimeout(fbTimer.current)
    fbTimer.current = window.setTimeout(() => setFeedback(null), 4000)
  }, [])

  const refresh = useCallback(async (silent = false) => {
    const targetDir = activeCwd || cwd
    if (!targetDir) { setNotRepo(true); return }
    if (!silent) setLoading(true)
    try {
      const snap = await shell.git.panel(targetDir)
      if (snap.repo && snap.status) {
        setRepoRoot(snap.repo.repoRoot)
        setSnapshot(snap.status)
        setNotRepo(false)
      } else {
        setNotRepo(true); setSnapshot(null); setRepoRoot(null)
      }
    } catch { setNotRepo(true) } finally { setLoading(false) }
  }, [activeCwd, cwd])

  useEffect(() => { void refresh() }, [refresh])

  const handlePickFolder = async () => {
    try {
      const res = await shell.fs.pickFolder()
      if (res?.ok && res.path) {
        setActiveCwd(res.path)
        onSelectDir?.(res.path)
      }
    } catch {}
  }

  const handleSwitchDir = (dir: string) => {
    setActiveCwd(dir)
    onSelectDir?.(dir)
  }

  const runAction = useCallback(async (fn: () => Promise<unknown>, okMsg?: string) => {
    if (busy || !repoRoot) return
    setBusy(true)
    try {
      await fn()
      await refresh(true)
      if (okMsg) showFeedback("ok", okMsg)
    } catch (e) {
      showFeedback("err", String(e))
    } finally {
      setBusy(false)
    }
  }, [busy, repoRoot, refresh, showFeedback])

  const toggleStage = useCallback((entry: GitChangedFile, isStaged: boolean) => {
    void runAction(() =>
      isStaged ? shell.git.unstage(repoRoot!, [entry.path]) : shell.git.stage(repoRoot!, [entry.path]))
  }, [runAction, repoRoot])

  const stageAll = useCallback((entries: GitChangedFile[], stage: boolean) => {
    void runAction(() =>
      stage ? shell.git.stage(repoRoot!, entries.map((e) => e.path)) : shell.git.unstage(repoRoot!, entries.map((e) => e.path)))
  }, [runAction, repoRoot])

  const discardEntry = useCallback(async (entry: GitChangedFile) => {
    const ok = await confirm({ message: t("scm.discardConfirm").replace("{file}", basename(entry.path)), confirmText: t("common.yes"), cancelText: t("common.cancel"), variant: "danger" })
    if (!ok) return
    void runAction(() => shell.git.discard(repoRoot!, [{ path: entry.path, untracked: entry.untracked }]))
  }, [runAction, repoRoot, t, confirm])

  const doCommit = useCallback(async () => {
    if (!repoRoot || !commitMessage.trim()) return
    const msg = commitMessage
    await runAction(async () => {
      const r = await shell.git.commit(repoRoot, msg)
      showFeedback("ok", `${r.commitSha.slice(0, 7)} · ${r.summary}`)
    })
    setCommitMessage("")
  }, [repoRoot, commitMessage, runAction, showFeedback])

  const openDiff = useCallback(async (entry: GitChangedFile, staged: boolean) => {
    if (!repoRoot) return
    try {
      const r = await shell.git.diff(repoRoot, entry.path, staged)
      setDiffView({ title: `${basename(entry.path)} (${staged ? "staged" : "unstaged"})`, text: r.diffText || "—" })
    } catch { /* noop */ }
  }, [repoRoot])

  const handleRefresh = useCallback(() => {
    setSpinning(true)
    void refresh().finally(() => window.setTimeout(() => setSpinning(false), 450))
  }, [refresh])

  const stagedEntries = useMemo(() => snapshot?.changedFiles.filter((f) => f.staged) ?? [], [snapshot])
  const fileEntries = useMemo(() => snapshot?.changedFiles.filter((f) => !f.staged) ?? [], [snapshot])
  const canCommit = stagedEntries.length > 0 && commitMessage.trim().length > 0 && !busy

  const onKeyDownCommit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canCommit) {
      e.preventDefault()
      void doCommit()
    }
  }

  const currentFolder = activeCwd || cwd || ""

  if (!currentFolder) {
    return (
      <div className="scm-panel">
        <div className="scm-empty">
          <FolderIcon size={20} />
          <p>{t("scm.noSession")}</p>
          <button className="btn-primary compact" onClick={handlePickFolder} style={{ marginTop: 8 }}>
             Seleccionar Repositorio
          </button>
        </div>
      </div>
    )
  }

  if (notRepo) {
    return (
      <div className="scm-panel">
        <div className="scm-header" style={{ padding: "6px 10px", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={currentFolder}>
             {currentFolder.split(/[\\/]/).pop() || currentFolder}
          </span>
          <button className="btn-secondary compact" onClick={handlePickFolder} title="Elegir otra carpeta">
             Cambiar
          </button>
        </div>
        <div className="scm-empty">
          <FolderIcon size={20} />
          <p>{t("scm.notARepo")}</p>
          <small>{currentFolder}</small>
          <button className="btn-primary compact" onClick={handlePickFolder} style={{ marginTop: 12 }}>
             Abrir Otro Repositorio
          </button>
        </div>
      </div>
    )
  }

  const branchLabel = snapshot?.isDetached ? "(detached)" : snapshot?.branch ?? ""

  return (
    <div className="scm-panel">
      {/* Selector de Repositorio / Directorio */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", background: "var(--surface-subtle)", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
          <span style={{ fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={repoRoot || currentFolder}>
             {(repoRoot || currentFolder).split(/[\\/]/).pop()}
          </span>
          {availableDirs.length > 1 && (
            <select
              value={activeCwd}
              onChange={(e) => handleSwitchDir(e.target.value)}
              style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, padding: "1px 4px", maxWidth: 120 }}
            >
              {availableDirs.map((d) => (
                <option key={d} value={d}>{d.split(/[\\/]/).pop()}</option>
              ))}
            </select>
          )}
        </div>
        <button className="btn-secondary compact" onClick={handlePickFolder} title="Seleccionar otra carpeta en disco" style={{ fontSize: 12, padding: "2px 6px" }}>
          Cambiar
        </button>
      </div>

      {/* Header: branch dropdown + upstream + acciones remotas */}
      <div className="scm-header">
        <button type="button" className={`scm-tabbtn${tab === "changes" ? " on" : ""}`} onClick={() => setTab("changes")}>
          {t("scm.changes")}
        </button>
        <button type="button" className={`scm-tabbtn${tab === "history" ? " on" : ""}`} onClick={() => setTab("history")}>
          {t("scm.history")}
        </button>
        <span className="scm-header-spacer" />
        {snapshot && snapshot.ahead + snapshot.behind > 0 ? (
          <span className="scm-ab-badge" title={`${snapshot.upstream ?? ""} ↑${snapshot.ahead} ↓${snapshot.behind}`}>
            ↑{snapshot.ahead} ↓{snapshot.behind}
          </span>
        ) : null}
        <button type="button" className="scm-icon-btn" title={t("scm.refresh")} aria-label={t("scm.refresh")} onClick={handleRefresh}>
          <RefreshIcon size={14} className={spinning ? "spin" : ""} />
        </button>
      </div>

      {tab === "changes" ? (
        <>
          <div className="scm-subheader">
            <BranchDropdown
              repoRoot={repoRoot}
              repoLabel={branchLabel || t("scm.title")}
              displayRepoRoot={repoRoot}
              onRefresh={() => void refresh()}
            />
            <span className="scm-header-spacer" />
            <button type="button" className="scm-mini-btn" disabled={!snapshot?.upstream || busy}
              title={t("scm.fetch")}
              onClick={() => void runAction(() => shell.git.fetch(repoRoot!), t("scm.fetched"))}>
              {t("scm.fetch")}
            </button>
            <button type="button" className="scm-mini-btn" disabled={!snapshot?.upstream || busy}
              title={t("scm.pull")}
              onClick={() => void runAction(() => shell.git.pull(repoRoot!), t("scm.pulled"))}>
              {t("scm.pull")}
            </button>
            <button type="button" className="scm-mini-btn scm-primary" disabled={!snapshot?.upstream || busy}
              title={t("scm.push")}
              onClick={() => void runAction(() => shell.git.push(repoRoot!), t("scm.pushed"))}>
              {t("scm.push")}
            </button>
          </div>

          {loading ? <div className="scm-empty"><LoadingIcon size={14} /></div> : (
            <div className="scm-list">
              {(snapshot?.ahead ?? 0) > 0 && (snapshot?.behind ?? 0) > 0 ? (
                <div className="scm-banner scm-banner-warn">{t("scm.diverged")}</div>
              ) : null}

              {fileEntries.length > 0 ? (
                <>
                  <ListHeader
                    label={t("scm.changes")}
                    count={fileEntries.length}
                    checkState={false}
                    onToggle={() => stageAll(fileEntries, true)}
                  />
                  {fileEntries.map((e) => (
                    <EntryRow key={`u-${e.path}`} entry={e} staged={false}
                      onToggleStage={toggleStage} onOpenDiff={openDiff} onDiscard={discardEntry} />
                  ))}
                </>
              ) : null}

              {stagedEntries.length > 0 ? (
                <>
                  <ListHeader
                    label={t("scm.staged")}
                    count={stagedEntries.length}
                    checkState={true}
                    onToggle={() => stageAll(stagedEntries, false)}
                  />
                  {stagedEntries.map((e) => (
                    <EntryRow key={`s-${e.path}`} entry={e} staged={true}
                      onToggleStage={toggleStage} onOpenDiff={openDiff} onDiscard={discardEntry} />
                  ))}
                </>
              ) : null}

              {fileEntries.length === 0 && stagedEntries.length === 0 ? (
                <div className="scm-empty">{t("scm.cleanTree")}</div>
              ) : null}
            </div>
          )}

          <div className="scm-commitbox">
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={onKeyDownCommit}
              placeholder={`${t("scm.commitMessage")} (Ctrl+Enter)`}
              rows={2}
              disabled={busy}
            />
            <button type="button" className="scm-commit-btn" disabled={!canCommit}
              title={canCommit ? t("scm.commit") : t("scm.stageFirst")}
              onClick={() => void doCommit()}>
              {busy ? <LoadingIcon size={13} /> : <CheckIcon size={13} />} {t("scm.commit")}
            </button>
          </div>

          {feedback ? (
            <div className={`scm-feedback ${feedback.tone === "ok" ? "ok" : "err"}`} role="status">
              {feedback.msg}
            </div>
          ) : null}
        </>
      ) : (
        repoRoot ? <HistoryPane repoRoot={repoRoot} onOpenPatch={(title, text) => setDiffView({ title, text })} /> : null
      )}

      {diffView ? <DiffModal title={diffView.title} patch={diffView.text} onClose={() => setDiffView(null)} /> : null}
    </div>
  )
})

function ListHeader({ label, count, checkState, onToggle }: {
  label: string; count: number; checkState: boolean; onToggle: () => void
}) {
  return (
    <div className="scm-lh">
      <button type="button" className={`scm-check${checkState ? " on" : ""}`}
        role="switch" aria-checked={checkState} onClick={onToggle}
        title={checkState ? "Unstage all" : "Stage all"}>
        {checkState ? <CheckIcon size={11} /> : null}
      </button>
      <span className="scm-lh-label">{label}</span>
      <span className="scm-lh-count">{count}</span>
    </div>
  )
}

// Branch dropdown: repo + ramas locales (checkout) + worktrees.
function BranchDropdown({ repoRoot, repoLabel, displayRepoRoot, onRefresh }: {
  repoRoot: string | null
  repoLabel: string
  displayRepoRoot: string | null
  onRefresh: () => void
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [branches, setBranches] = useState<import("../shell").GitBranchEntry[]>([])
  const [loadingB, setLoadingB] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open || !repoRoot) return
    setLoadingB(true)
    let alive = true
    shell.git.branches(repoRoot)
      .then((r) => { if (alive) setBranches(r.branches) })
      .catch(() => { if (alive) setBranches([]) })
      .finally(() => { if (alive) setLoadingB(false) })
    return () => { alive = false }
  }, [open, repoRoot])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  const local = branches.filter((b) => b.kind === "local")
  const worktrees = branches.filter((b) => b.kind === "worktree")

  const handleCheckout = async (branch: string) => {
    if (!repoRoot) return
    try {
      await shell.git.checkout(repoRoot, branch)
      setOpen(false)
      onRefresh()
    } catch { /* refresh mostrará estado real */ }
  }

  return (
    <div className="scm-branch-wrap" ref={ref}>
      <button type="button" className="scm-branch-btn" onClick={() => setOpen(!open)}
        title={displayRepoRoot ?? repoLabel} aria-expanded={open}>
        <FolderIcon size={12} />
        {displayRepoRoot ? (<><span className="scm-trunc scm-w22">{basename(displayRepoRoot)}</span><span className="scm-muted">/</span></>) : null}
        <span className="scm-trunc">{repoLabel}</span>
        <ChevronIcon size={10} />
      </button>
      {open ? (
        <div className="scm-menu">
          {displayRepoRoot ? (
            <>
              <div className="scm-menu-label">{t("scm.repository")}</div>
              <div className="scm-menu-path" title={displayRepoRoot}>{displayRepoRoot}</div>
            </>
          ) : null}
          {loadingB ? (
            <div className="scm-menu-empty"><LoadingIcon size={12} /> {t("scm.loadingBranches")}</div>
          ) : (
            <>
              {local.length > 0 ? (
                <>
                  <div className="scm-menu-label">{t("scm.localBranches")}</div>
                  {local.map((b) => (
                    <button key={b.name} type="button" className="scm-menu-item" onClick={() => void handleCheckout(b.name)}>
                      <span className="scm-check-slot">{b.isHead ? <CheckIcon size={12} /> : null}</span>
                      <span className="scm-trunc">{b.name}</span>
                    </button>
                  ))}
                </>
              ) : null}
              {worktrees.length > 0 ? (
                <>
                  <div className="scm-menu-label">{t("scm.worktrees")}</div>
                  {worktrees.map((b) => (
                    <div key={b.worktreePath ?? b.name} className="scm-menu-item scm-menu-static">
                      <span className="scm-check-slot"><FolderIcon size={12} /></span>
                      <span className="scm-menu-col">
                        <span className="scm-trunc">{b.name}</span>
                        {b.worktreePath ? <span className="scm-menu-sub scm-trunc">{b.worktreePath}</span> : null}
                      </span>
                    </div>
                  ))}
                </>
              ) : null}
              {branches.length === 0 ? <div className="scm-menu-empty">{t("scm.noBranches")}</div> : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
