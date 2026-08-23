// History pane del source control: git graph con lanes + búsqueda + detalle
// de commit. Puerto del UX de terax-ai (Apache-2.0) con primitivas propias.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useT } from "../../i18n-context"
import { FileIcon, LoadingIcon, SearchIcon } from "../../Icons"
import { shell, type GitCommitFileChange, type GitLogEntry } from "../../shell"
import { layoutGraph, type GraphRow } from "./graph"
import { GraphRail } from "./GraphRail"
import { commitWebUrl, parseRemoteWebUrl } from "./remoteWebUrl"

const ROW_HEIGHT = 30
const LOG_PAGE = 100

function fmtTime(secs: number): string {
  if (!secs) return ""
  const d = new Date(secs * 1000)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" })
}

export const HistoryPane = memo(function HistoryPane({ repoRoot, onOpenPatch }: {
  repoRoot: string
  onOpenPatch: (title: string, text: string) => void
}) {
  const t = useT()
  const [entries, setEntries] = useState<GitLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedSha, setSelectedSha] = useState<string | null>(null)
  const [files, setFiles] = useState<GitCommitFileChange[]>([])
  const [remoteBase, setRemoteBase] = useState<string | null>(null)
  const rowsCache = useRef<GraphRow[] | null>(null)
  const searchTimer = useRef<number | null>(null)

  const load = useCallback((searchTerm: string, isSearch: boolean) => {
    setLoading(true)
    let alive = true
    if (isSearch) rowsCache.current = null
    shell.git.log(repoRoot, LOG_PAGE, undefined, searchTerm || undefined)
      .then((list) => {
        if (!alive) return
        setEntries(list)
        rowsCache.current = layoutGraph(list).rows
      })
      .catch(() => { if (alive) setEntries([]) })
      .finally(() => { if (alive) setLoading(false) })
  }, [repoRoot])

  useEffect(() => { load("", false) }, [load])

  useEffect(() => {
    if (!search) return
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => load(search, true), 300)
    return () => { if (searchTimer.current) window.clearTimeout(searchTimer.current) }
  }, [search, load])

  useEffect(() => () => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
  }, [])

  useEffect(() => {
    setFiles([])
    setRemoteBase(null)
    if (!selectedSha) return
    let alive = true
    shell.git.commitFiles(repoRoot, selectedSha)
      .then((f) => { if (alive) setFiles(f) })
      .catch(() => { if (alive) setFiles([]) })
    shell.git.remoteUrl(repoRoot, "origin")
      .then((u) => { if (alive) setRemoteBase(parseRemoteWebUrl(u)?.baseUrl ?? null) })
      .catch(() => {})
    return () => { alive = false }
  }, [selectedSha, repoRoot])

  const rows = useMemo(() => rowsCache.current ?? layoutGraph(entries).rows, [entries])
  const maxLanes = useMemo(() => Math.max(1, ...rows.map((r) => r.laneCount)), [rows])
  const remoteInfo = useMemo(() => parseRemoteWebUrl(remoteBase), [remoteBase])

  const openFileDiff = useCallback(async (sha: string, f: GitCommitFileChange, shortSha: string) => {
    try {
      const r = await shell.git.commitDiff(repoRoot, sha, f.path, f.originalPath ?? undefined)
      onOpenPatch(`${f.path} @ ${shortSha}`, r.diffText || r.fallbackPatch || "—")
    } catch {
      onOpenPatch(`${f.path} @ ${shortSha}`, "error")
    }
  }, [repoRoot, onOpenPatch])

  const openFullPatch = useCallback(async (e: GitLogEntry) => {
    try {
      const r = await shell.git.showCommitDiff(repoRoot, e.sha)
      onOpenPatch(`commit ${e.shortSha}`, r.diffText || "—")
    } catch {
      onOpenPatch(`commit ${e.shortSha}`, "error")
    }
  }, [repoRoot, onOpenPatch])

  return (
    <div className="scm-history">
      <div className="scm-search">
        <SearchIcon size={13} />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t("scm.searchCommits")} />
        {loading ? <LoadingIcon size={12} /> : null}
      </div>
      {!loading && entries.length === 0 ? (
        <div className="scm-empty">{t("scm.noCommits")}</div>
      ) : (
        <div className="scm-log" role="listbox" aria-label={t("scm.history")}>
          {rows.map((row, i) => {
            const e = entries[i]
            if (!e) return null
            const isSel = selectedSha === e.sha
            return (
              <div key={e.sha}>
                <div className={`scm-commit${isSel ? " sel" : ""}`} role="option" aria-selected={isSel} tabIndex={0}
                  onClick={() => setSelectedSha(isSel ? null : e.sha)}
                  onKeyDown={(ev) => { if (ev.key === "Enter") setSelectedSha(isSel ? null : e.sha) }}>
                  <GraphRail row={row} rowHeight={ROW_HEIGHT} maxLaneCount={maxLanes} active={isSel} />
                  <span className="scm-commit-body">
                    <span className="scm-commit-subj scm-trunc">{e.subject}</span>
                    <span className="scm-commit-meta scm-trunc">
                      {e.shortSha} · {e.author} · {fmtTime(e.timestampSecs)}
                      {e.filesChanged > 0 ? ` · ${e.filesChanged}±` : ""}
                    </span>
                  </span>
                </div>
                {isSel && e ? (
                  <div className="scm-commit-detail">
                    {remoteInfo ? (
                      <a className="scm-remote-link" href={commitWebUrl(remoteInfo, e.sha)} target="_blank" rel="noreferrer">
                        ↗ {remoteInfo.host}
                      </a>
                    ) : null}
                    {e.insertions > 0 || e.deletions > 0 ? (
                      <div className="scm-stat-line">
                        <span className="scm-add">+{e.insertions}</span>{" "}
                        <span className="scm-del">−{e.deletions}</span>
                      </div>
                    ) : null}
                    {files.map((f) => (
                      <button key={f.path} type="button" className="scm-file-chip"
                        onClick={() => void openFileDiff(e.sha, f, e.shortSha)}>
                        <FileIcon size={11} />
                        <span className="scm-trunc">{f.originalPath ? `${f.originalPath} → ${f.path}` : f.path}</span>
                        {f.isBinary ? <em>bin</em> : <em>+{f.added}/−{f.removed}</em>}
                      </button>
                    ))}
                    <button type="button" className="scm-file-chip scm-full-patch"
                      onClick={() => void openFullPatch(e)}>
                      {t("scm.fullPatch")}
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})
