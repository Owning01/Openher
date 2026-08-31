// Source Control panel — puerto fiel del UX de terax-ai (Apache-2.0,
// src/modules/source-control/SourceControlPanel.tsx) adaptado a este
// proyecto: shell.git.*, CSS scm.*, hooks locales, sin Tauri/ChatStore.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useT } from "../i18n-context"
import { Modal } from "./Modal"
import { useDialog } from "./DialogProvider"
import {
  CheckIcon,
  ChevronIcon,
  FileIcon,
  FolderIcon,
  LoadingIcon,
  RefreshIcon,
  UndoIcon,
} from "../Icons"
import { shell, type GitStatusSnapshot } from "../shell"
import { HistoryPane } from "./scm/HistoryPane"
import { useSourceControlPanel, type SourceControlFileEntry } from "./scm/useSourceControlPanel"

type Props = { cwd?: string; availableDirs?: string[]; onSelectDir?: (dir: string) => void }

function basename(path: string): string {
  const parts = path.split(/[\\/]/).filter(Boolean)
  return parts.length > 0 ? parts[parts.length - 1] : path
}
function dirname(path: string): string {
  const normalized = path.replace(/\\/g, "/")
  const idx = normalized.lastIndexOf("/")
  if (idx <= 0) return ""
  return normalized.slice(0, idx)
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
function checkboxAria(state: string): boolean | "mixed" {
  if (state === "checked") return true
  if (state === "indeterminate") return "mixed" as const
  return false
}

const DiffModal = memo(function DiffModal({ title, patch, onClose }: { title: string; patch: string; onClose: () => void }) {
  const lines = useMemo(() => patch.split("\n").slice(0, 4000), [patch])
  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{title}</h3>
        <button className="btn-icon compact" onClick={onClose} aria-label="close">✕</button>
      </div>
      <div className="scm-diff">
        {lines.map((l, i) => (
          <div key={i} className={l.startsWith("+") && !l.startsWith("+++") ? "scm-dl-add" : l.startsWith("-") && !l.startsWith("---") ? "scm-dl-del" : l.startsWith("@@") ? "scm-dl-hunk" : "scm-dl-ctx"}>{l || " "}</div>
        ))}
      </div>
    </Modal>
  )
})

type RowDescriptor =
  | { kind: "banner-diverged"; key: string }
  | { kind: "list-header"; key: string; count: number }
  | { kind: "entry"; key: string; entry: SourceControlFileEntry }

const ROW_HEIGHTS = { banner: 32, header: 30, entry: 30 } as const

export const SourceControlPanel = memo(function SourceControlPanel({ cwd, availableDirs = [], onSelectDir }: Props) {
  const t = useT()
  const { confirm } = useDialog()
  const [activeCwd, setActiveCwd] = useState(cwd || "")
  const [tab, setTab] = useState<"changes" | "history">("changes")
  const [snapshot, setSnapshot] = useState<GitStatusSnapshot | null>(null)
  const [repoRoot, setRepoRoot] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [notRepo, setNotRepo] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [diffView, setDiffView] = useState<{ title: string; text: string } | null>(null)
  const [focusedKey, setFocusedKey] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const fbTimer = useRef<number | null>(null)
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; msg: string } | null>(null)

  useEffect(() => { if (cwd) setActiveCwd(cwd) }, [cwd])

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
      if (res?.ok && res.path) { setActiveCwd(res.path); onSelectDir?.(res.path) }
    } catch {}
  }
  const handleSwitchDir = (dir: string) => { setActiveCwd(dir); onSelectDir?.(dir) }

  const handleRefresh = useCallback(() => {
    setSpinning(true)
    void refresh().finally(() => window.setTimeout(() => setSpinning(false), 450))
  }, [refresh])

  const openDiff = useCallback(async (path: string, mode: "+" | "-", originalPath: string | null) => {
    if (!repoRoot) return
    const staged = mode === "+"
    try {
      // Prefer diff-content path for richer view, fallback to diff
      if (originalPath !== undefined) {
        const r = await shell.git.diff(repoRoot, path, staged)
        setDiffView({ title: `${basename(path)} (${staged ? "staged" : "unstaged"})`, text: r.diffText || "—" })
      } else {
        const r = await shell.git.diff(repoRoot, path, staged)
        setDiffView({ title: `${basename(path)} (${staged ? "staged" : "unstaged"})`, text: r.diffText || "—" })
      }
    } catch { /* noop */ }
  }, [repoRoot])

  const scm = useSourceControlPanel(repoRoot, snapshot, () => refresh(true), openDiff)

  // Feedback from hook
  useEffect(() => {
    if (scm.actionMessage) showFeedback("ok", scm.actionMessage)
    else if (scm.actionError) showFeedback("err", scm.actionError)
  }, [scm.actionMessage, scm.actionError, showFeedback])

  const isDiverged = !!snapshot && snapshot.ahead > 0 && snapshot.behind > 0
  const canCommit = scm.fileEntries.some((e) => e.staged) && scm.commitMessage.trim().length > 0 && !scm.actionBusy
  const commitShortcut = navigator.platform.toLowerCase().includes("mac") ? "⌘↩" : "Ctrl+Enter"

  const handleCommitKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canCommit) {
      e.preventDefault()
      void scm.commit()
    }
  }

  const rows = useMemo<RowDescriptor[]>(() => {
    const r: RowDescriptor[] = []
    if (isDiverged) r.push({ kind: "banner-diverged", key: "banner-diverged" })
    if (scm.fileEntries.length > 0) {
      r.push({ kind: "list-header", key: "list-header", count: scm.fileEntries.length })
      for (const entry of scm.fileEntries) r.push({ kind: "entry", key: entry.key, entry })
    }
    return r
  }, [isDiverged, scm.fileEntries])

  const rowKeyToIndex = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((row, i) => m.set(row.key, i))
    return m
  }, [rows])

  useEffect(() => {
    if (focusedKey && !rowKeyToIndex.has(focusedKey)) setFocusedKey(null)
  }, [focusedKey, rowKeyToIndex])

  const focusableIndices = useMemo(() => {
    const out: number[] = []
    rows.forEach((row, idx) => { if (row.kind === "entry") out.push(idx) })
    return out
  }, [rows])

  const estimateSize = useCallback((idx: number) => {
    const row = rows[idx]
    if (!row) return ROW_HEIGHTS.entry
    if (row.kind === "banner-diverged") return ROW_HEIGHTS.banner
    if (row.kind === "list-header") return ROW_HEIGHTS.header
    return ROW_HEIGHTS.entry
  }, [rows])

  const virtualizer = useVirtualizer({ count: rows.length, getScrollElement: () => scrollRef.current, estimateSize, overscan: 12, getItemKey: (i) => rows[i]?.key ?? i })

  const moveFocus = useCallback((dir: 1 | -1) => {
    if (focusableIndices.length === 0) return
    const cur = focusedKey === null ? -1 : (rowKeyToIndex.get(focusedKey) ?? -1)
    let pos = focusableIndices.findIndex((i) => i === cur)
    if (pos === -1) pos = dir > 0 ? -1 : focusableIndices.length
    let nextPos = pos + dir
    if (nextPos < 0) nextPos = 0
    if (nextPos > focusableIndices.length - 1) nextPos = focusableIndices.length - 1
    const targetIdx = focusableIndices[nextPos]
    const target = rows[targetIdx]
    if (!target) return
    setFocusedKey(target.key)
    virtualizer.scrollToIndex(targetIdx, { align: "auto" })
  }, [focusableIndices, focusedKey, rowKeyToIndex, rows, virtualizer])

  const focusedEntry = useCallback((): SourceControlFileEntry | null => {
    if (!focusedKey) return null
    const idx = rowKeyToIndex.get(focusedKey)
    if (idx === undefined) return null
    const row = rows[idx]
    return row && row.kind === "entry" ? row.entry : null
  }, [focusedKey, rowKeyToIndex, rows])

  const handlePanelKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null
    if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.closest("button"))) return
    const meta = e.metaKey || e.ctrlKey
    if (meta && (e.key === "r" || e.key === "R")) { e.preventDefault(); handleRefresh(); return }
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); moveFocus(1); break
      case "ArrowUp": e.preventDefault(); moveFocus(-1); break
      case "Enter": {
        const entry = focusedEntry()
        if (entry) { e.preventDefault(); void scm.selectFile(entry) }
        break
      }
      case " ":
      case "s":
      case "S": {
        if (meta) break
        const entry = focusedEntry()
        if (entry) { e.preventDefault(); void scm.toggleStageFile(entry) }
        break
      }
      case "d":
      case "D": {
        if (meta) break
        const entry = focusedEntry()
        if (entry && entry.unstaged) { e.preventDefault(); scm.requestDiscardFile(entry) }
        break
      }
    }
  }, [focusedEntry, handleRefresh, moveFocus, scm])

  const branchLabel = snapshot?.isDetached ? "(detached)" : snapshot?.branch ?? ""

  if (!activeCwd && !cwd) {
    return (
      <div className="scm-panel">
        <div className="scm-empty">
          <FolderIcon size={20} />
          <p>{t("scm.noSession")}</p>
          <button className="btn-primary compact" onClick={handlePickFolder} style={{ marginTop: 8 }}>Seleccionar Repositorio</button>
        </div>
      </div>
    )
  }

  if (notRepo) {
    const cf = activeCwd || cwd || ""
    return (
      <div className="scm-panel">
        {/* Selector siempre visible incluso sin git */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", background: "var(--surface-subtle)", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
            <span style={{ fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cf}>{cf.split(/[\\/]/).pop() || cf}</span>
            {availableDirs.length > 1 && (
              <select value={activeCwd} onChange={(e) => handleSwitchDir(e.target.value)} style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, padding: "1px 4px", maxWidth: 120 }}>
                {availableDirs.map((d) => (<option key={d} value={d}>{d.split(/[\\/]/).pop()}</option>))}
              </select>
            )}
          </div>
          <button className="btn-secondary compact" onClick={handlePickFolder} title="Elegir otra carpeta" style={{ fontSize: 12, padding: "2px 6px" }}>Cambiar</button>
        </div>
        <div className="scm-empty">
          <FolderIcon size={20} />
          <p>{t("scm.notARepo")}</p>
          <small>{cf}</small>
          <button className="btn-primary compact" onClick={handlePickFolder} style={{ marginTop: 12 }}>Abrir Otro Repositorio</button>
        </div>
      </div>
    )
  }

  const currentFolder = activeCwd || cwd || ""

  return (
    <div className="scm-panel">
      {/* Selector repositorio */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", background: "var(--surface-subtle)", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
          <span style={{ fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={repoRoot || currentFolder}>{(repoRoot || currentFolder).split(/[\\/]/).pop()}</span>
          {availableDirs.length > 1 && (
            <select value={activeCwd} onChange={(e) => handleSwitchDir(e.target.value)} style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, padding: "1px 4px", maxWidth: 120 }}>
              {availableDirs.map((d) => (<option key={d} value={d}>{d.split(/[\\/]/).pop()}</option>))}
            </select>
          )}
        </div>
        <button className="btn-secondary compact" onClick={handlePickFolder} title="Seleccionar otra carpeta" style={{ fontSize: 12, padding: "2px 6px" }}>Cambiar</button>
      </div>

      {/* Header tabs + acciones remotas — fiel a Terax */}
      <div className="scm-header">
        <button type="button" className={`scm-tabbtn${tab === "changes" ? " on" : ""}`} onClick={() => setTab("changes")}>{t("scm.changes")}</button>
        <button type="button" className={`scm-tabbtn${tab === "history" ? " on" : ""}`} onClick={() => setTab("history")}>{t("scm.history")}</button>
        <span className="scm-header-spacer" />
        {snapshot && snapshot.ahead + snapshot.behind > 0 ? (
          <span className="scm-ab-badge" title={`${snapshot.upstream ?? ""} ↑${snapshot.ahead} ↓${snapshot.behind}`}>↑{snapshot.ahead} ↓{snapshot.behind}</span>
        ) : null}
        <button type="button" className="scm-icon-btn" title={t("scm.refresh")} aria-label={t("scm.refresh")} onClick={handleRefresh} disabled={!!scm.actionBusy}>
          {loading ? <LoadingIcon size={14} /> : <RefreshIcon size={14} className={spinning ? "spin" : ""} />}
        </button>
      </div>

      {tab === "changes" ? (
        <>
          {/* Subheader con BranchDropdown + Fetch/Pull/Push — paridad Terax */}
          <div className="scm-subheader">
            <BranchDropdown repoRoot={repoRoot} repoLabel={branchLabel || t("scm.title")} displayRepoRoot={repoRoot} onRefresh={() => void refresh()} />
            <span className="scm-header-spacer" />
            <button type="button" className="scm-mini-btn" disabled={!snapshot?.upstream || !!scm.actionBusy} title={scm.pushHint ?? t("scm.fetch")} onClick={() => void scm.fetchRemote()}>{t("scm.fetch")}</button>
            <button type="button" className="scm-mini-btn" disabled={!snapshot?.upstream || !!scm.actionBusy || snapshot.behind === 0 || isDiverged} title={isDiverged ? t("scm.diverged") : snapshot?.upstream ? `${snapshot.behind} behind` : t("scm.fetch")} onClick={() => void scm.pull()}>{t("scm.pull")}</button>
            <button type="button" className="scm-mini-btn scm-primary" disabled={!scm.canPush || !!scm.actionBusy} title={scm.pushHint ?? ""} onClick={() => void scm.push()}>{scm.actionBusy === "push" ? "..." : t("scm.push")}</button>
          </div>

          {/* Commit box — terax style */}
          <div className="scm-commitbox-wrap">
            <div className={`scm-commitbox-card${scm.commitMessage.length > 0 ? " has-text" : ""}`}>
              <textarea
                value={scm.commitMessage}
                onChange={(e) => scm.setCommitMessage(e.target.value)}
                onKeyDown={handleCommitKey}
                placeholder={`${t("scm.commitMessage")} (${commitShortcut})`}
                rows={3}
                disabled={!!scm.actionBusy}
                className="scm-commit-textarea"
              />
              <div className="scm-commitbox-meta">
                {scm.commitMessage.length > 0 ? <span>Ch: {scm.commitMessage.length}</span> : <span>{commitShortcut} para commitear</span>}
              </div>
            </div>
            <div className="scm-commitbox-row">
              <span className="scm-commitbox-hint">
                <span className={`scm-dot ${canCommit ? "on" : scm.fileEntries.some((e) => e.staged) ? "mid" : ""}`} />
                <span className="scm-trunc">{scm.fileEntries.filter((e) => e.staged).length === 0 ? t("scm.noStaged") ?? "Nada staged" : `${scm.fileEntries.filter((e) => e.staged).length} staged`}</span>
                <span className="scm-push-label scm-trunc">{snapshot?.upstream ?? t("scm.noUpstream") ?? "Sin upstream"}</span>
              </span>
            </div>
            <div className="scm-commit-actions">
              <button type="button" className="scm-commit-btn" disabled={!canCommit} title={canCommit ? t("scm.commit") : t("scm.stageFirst")} onClick={() => void scm.commit()}>
                {scm.actionBusy === "commit" ? <LoadingIcon size={13} /> : <CheckIcon size={13} />} {t("scm.commit")}
              </button>
              <button type="button" className="btn-secondary compact" disabled={!scm.canPush || !!scm.actionBusy} title={scm.pushHint ?? ""} onClick={() => void scm.push()}>
                {scm.actionBusy === "push" ? <LoadingIcon size={13} /> : null} {t("scm.push")}
              </button>
            </div>
            {feedback ? <div className={`scm-feedback ${feedback.tone === "ok" ? "ok" : "err"}`} role="status">{feedback.msg}</div> : null}
          </div>

          {/* Lista virtualizada — single flat list con indeterminate */}
          {loading ? (
            <div className="scm-empty"><LoadingIcon size={14} /> {t("scm.loadingBranches") ?? "Cargando..."}</div>
          ) : scm.fileEntries.length === 0 ? (
            <div className="scm-empty">
              <div className="scm-clean-icon"><CheckIcon size={16} /></div>
              <div className="scm-clean-title">{t("scm.cleanTree")}</div>
              <div className="scm-clean-sub">en <span className="scm-mono">{branchLabel}</span></div>
            </div>
          ) : (
            <div ref={containerRef} tabIndex={0} role="listbox" aria-label={t("scm.changes")} aria-activedescendant={focusedKey ? `scm-row-${focusedKey}` : undefined} onKeyDown={handlePanelKeyDown} className="scm-listbox">
              <div ref={scrollRef} className="scm-list">
                <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
                  {virtualizer.getVirtualItems().map((vr) => {
                    const row = rows[vr.index]
                    if (!row) return null
                    return (
                      <div key={vr.key} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: vr.size, transform: `translateY(${vr.start}px)` }}>
                        {row.kind === "banner-diverged" ? (
                          <div className="scm-banner scm-banner-warn"><span className="scm-banner-dot" /> {t("scm.diverged")} <span className="scm-muted">— resolver en terminal</span></div>
                        ) : row.kind === "list-header" ? (
                          <ListHeader label={t("scm.changes")} count={row.count} checkState={scm.headerCheckState} onToggle={() => void scm.toggleAll()} disabled={!!scm.actionBusy} />
                        ) : (
                          <EntryRow
                            entry={row.entry}
                            focused={focusedKey === row.key}
                            selected={scm.selected?.path === row.entry.path}
                            actionBusy={scm.actionBusy}
                            onFocus={() => setFocusedKey(row.key)}
                            onToggleStage={() => void scm.toggleStageFile(row.entry)}
                            onOpenDiff={() => scm.selectFile(row.entry)}
                            onDiscard={() => scm.requestDiscardFile(row.entry)}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        repoRoot ? <HistoryPane repoRoot={repoRoot} onOpenPatch={(title, text) => setDiffView({ title, text })} /> : null
      )}

      {/* Discard confirm — DialogProvider */}
      {scm.pendingDiscard ? (
        <ConfirmDiscardModal
          label={scm.pendingDiscard.label}
          onCancel={() => scm.cancelPendingDiscard()}
          onConfirm={async () => {
            const ok = await confirm({ message: t("scm.discardConfirm").replace("{file}", scm.pendingDiscard!.label), confirmText: t("common.yes"), cancelText: t("common.cancel"), variant: "danger" })
            if (ok) await scm.confirmPendingDiscard()
            else scm.cancelPendingDiscard()
          }}
        />
      ) : null}

      {diffView ? <DiffModal title={diffView.title} patch={diffView.text} onClose={() => setDiffView(null)} /> : null}
    </div>
  )
})

function ListHeader({ label, count, checkState, onToggle, disabled }: { label: string; count: number; checkState: string; onToggle: () => void; disabled?: boolean }) {
  const checked = checkState === "checked"
  const indeterminate = checkState === "indeterminate"
  return (
    <div className="scm-lh">
      <span className="scm-lh-label">{label}</span>
      <span className="scm-lh-count">{count}</span>
      <label className="scm-lh-all">
        <span>All</span>
        <button type="button" className={`scm-check${checked ? " on" : indeterminate ? " ind" : ""}`} role="checkbox" aria-checked={checkboxAria(checkState) as any} disabled={disabled} onClick={onToggle} title={checked ? "Unstage all" : "Stage all"}>
          {checked ? <CheckIcon size={11} /> : indeterminate ? <span className="scm-check-dash" /> : null}
        </button>
      </label>
    </div>
  )
}

const EntryRow = memo(function EntryRow({ entry, focused, selected, actionBusy, onFocus, onToggleStage, onOpenDiff, onDiscard }: {
  entry: SourceControlFileEntry
  focused: boolean
  selected: boolean
  actionBusy: string | null
  onFocus: () => void
  onToggleStage: () => void
  onOpenDiff: () => void
  onDiscard: () => void
}) {
  const fileName = basename(entry.path)
  const pathLabel = entry.originalPath ? `${entry.originalPath} → ${dirname(entry.path) || ""}` : dirname(entry.path)
  const showDiscard = entry.unstaged
  const isStageBusy = actionBusy === `stage:${entry.path}` || actionBusy === `unstage:${entry.path}`
  const isDiscardBusy = actionBusy === `discard:${entry.path}`
  const disabled = actionBusy !== null
  const isDeleted = entry.statusCode === "D"
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void isDeleted
  return (
    <div
      id={`scm-row-${entry.key}`}
      data-focused={focused || undefined}
      data-selected={selected || undefined}
      role="option"
      aria-selected={selected}
      onMouseDown={onFocus}
      className={`scm-row${focused ? " focused" : ""}${selected ? " selected" : ""}`}
      onClick={onOpenDiff}
    >
      <span className={`scm-row-accent ${statusAccent(entry.statusCode)}`} aria-hidden />
      <button type="button" className={`scm-check${entry.checkState === "checked" ? " on" : entry.checkState === "indeterminate" ? " ind" : ""}`} aria-checked={checkboxAria(entry.checkState) as any} role="checkbox" disabled={disabled} onClick={(e) => { e.stopPropagation(); onToggleStage() }} title={entry.checkState === "checked" ? "Unstage" : "Stage"}>
        {isStageBusy ? <LoadingIcon size={10} /> : entry.checkState === "checked" ? <CheckIcon size={11} /> : entry.checkState === "indeterminate" ? <span className="scm-check-dash" /> : null}
      </button>
      <FileIcon size={14} />
      <div className="scm-row-text">
        <span className={`scm-name scm-trunc${selected || focused ? " strong" : ""}`}>{fileName}</span>
        {pathLabel ? <span className="scm-dir scm-trunc">{pathLabel}</span> : null}
      </div>
      {showDiscard ? (
        <button type="button" className="scm-icon-btn scm-row-action" title={`Discard ${entry.path}`} disabled={disabled} onClick={(e) => { e.stopPropagation(); onDiscard() }}>
          {isDiscardBusy ? <LoadingIcon size={11} /> : <UndoIcon size={11} />}
        </button>
      ) : null}
      <span className={`scm-status-code ${statusAccent(entry.statusCode)}`} title={entry.statusLabel}>{entry.statusCode}</span>
    </div>
  )
})

function ConfirmDiscardModal({ label, onCancel, onConfirm }: { label: string; onCancel: () => void; onConfirm: () => void }) {
  // Bridge to DialogProvider confirm — we render null and trigger via effect in parent; keep portal for a11y
  useEffect(() => { /* parent handles confirm via DialogProvider */ }, [])
  return createPortal(
    <div style={{ display: "none" }} aria-hidden>
      <button onClick={onCancel} />
      <button onClick={onConfirm}>{label}</button>
    </div>,
    document.body
  )
}

function BranchDropdown({ repoRoot, repoLabel, displayRepoRoot, onRefresh }: { repoRoot: string | null; repoLabel: string; displayRepoRoot: string | null; onRefresh: () => void }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [branches, setBranches] = useState<import("../shell").GitBranchEntry[]>([])
  const [loadingB, setLoadingB] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!open || !repoRoot) return
    setLoadingB(true)
    let alive = true
    shell.git.branches(repoRoot).then((r) => { if (alive) setBranches(r.branches) }).catch(() => { if (alive) setBranches([]) }).finally(() => { if (alive) setLoadingB(false) })
    return () => { alive = false }
  }, [open, repoRoot])
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])
  const local = branches.filter((b) => b.kind === "local")
  const worktrees = branches.filter((b) => b.kind === "worktree")
  const handleCheckout = async (branch: string) => {
    if (!repoRoot) return
    try { await shell.git.checkout(repoRoot, branch); setOpen(false); onRefresh() } catch {}
  }
  return (
    <div className="scm-branch-wrap" ref={ref}>
      <button type="button" className="scm-branch-btn" onClick={() => setOpen(!open)} title={displayRepoRoot ?? repoLabel} aria-expanded={open}>
        <FolderIcon size={12} />
        {displayRepoRoot ? (<><span className="scm-trunc scm-w22">{basename(displayRepoRoot)}</span><span className="scm-muted">/</span></>) : null}
        <span className="scm-trunc">{repoLabel}</span>
        <ChevronIcon size={10} />
      </button>
      {open ? (
        <div className="scm-menu">
          {displayRepoRoot ? (<><div className="scm-menu-label">{t("scm.repository")}</div><div className="scm-menu-path" title={displayRepoRoot}>{displayRepoRoot}</div></>) : null}
          {loadingB ? (
            <div className="scm-menu-empty"><LoadingIcon size={12} /> {t("scm.loadingBranches")}</div>
          ) : (
            <>
              {local.length > 0 ? (<><div className="scm-menu-label">{t("scm.localBranches")}</div>{local.map((b) => (<button key={b.name} type="button" className="scm-menu-item" onClick={() => void handleCheckout(b.name)}><span className="scm-check-slot">{b.isHead ? <CheckIcon size={12} /> : null}</span><span className="scm-trunc">{b.name}</span></button>))}</>) : null}
              {worktrees.length > 0 ? (<><div className="scm-menu-label">{t("scm.worktrees")}</div>{worktrees.map((b) => (<div key={b.worktreePath ?? b.name} className="scm-menu-item scm-menu-static"><span className="scm-check-slot"><FolderIcon size={12} /></span><span className="scm-menu-col"><span className="scm-trunc">{b.name}</span>{b.worktreePath ? <span className="scm-menu-sub scm-trunc">{b.worktreePath}</span> : null}</span></div>))}</>) : null}
              {branches.length === 0 ? <div className="scm-menu-empty">{t("scm.noBranches")}</div> : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
