// History pane — puerto fiel de terax-ai src/modules/git-history/GitHistoryPane.tsx (Apache-2.0)
// Virtualizado, paginado, graph tail, búsqueda diferida, tint autor, highlight.
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useT } from "../../i18n-context"
import { FileIcon, LoadingIcon, SearchIcon, CopyIcon, LinkIcon } from "../../Icons"
import { shell, type GitCommitFileChange, type GitLogEntry } from "../../shell"
import { EMPTY_GRAPH_STATE, layoutGraph, type GraphRow, type GraphState } from "./graph"
import { GraphRail, MAX_VISIBLE_LANES, railWidth } from "./GraphRail"
import { commitWebUrl, parseRemoteWebUrl, type RemoteWebInfo } from "./remoteWebUrl"

const ROW_HEIGHT = 32
const TABLE_HEADER_HEIGHT = 24
const NEAR_BOTTOM_PX = 240
const FILES_CACHE_LIMIT = 16
const PAGE_SIZE = 30
const RAIL_RESERVED_PX = railWidth(MAX_VISIBLE_LANES)
const GRID_TEMPLATE = `${RAIL_RESERVED_PX + 4}px 60px minmax(0, 560px) minmax(12px, 1fr) minmax(140px, max-content) 96px 116px`

type FilesEntry = { state: "loading" } | { state: "loaded"; files: GitCommitFileChange[] } | { state: "error"; error: string }

function compactDate(secs: number): string {
  if (!secs) return ""
  const d = new Date(secs * 1000)
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  const month = d.toLocaleString(undefined, { month: "short" })
  const day = String(d.getDate()).padStart(2, "0")
  if (sameYear) {
    const hh = String(d.getHours()).padStart(2, "0")
    const mm = String(d.getMinutes()).padStart(2, "0")
    return `${month} ${day}  ${hh}:${mm}`
  }
  return `${month} ${day} ${d.getFullYear()}`
}
function absoluteTime(secs: number): string {
  if (!secs) return ""
  return new Date(secs * 1000).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}
function authorInitials(name: string): string {
  const t = (name ?? "").trim()
  if (!t) return "?"
  const p = t.split(/\s+/)
  if (p.length === 1) return p[0].charAt(0).toUpperCase()
  return (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase()
}
const AUTHOR_TINTS = ["#7aa2f7","#bb9af7","#9ece6a","#e0af68","#f7768e","#73daca","#ff9e64","#b4f9f8"]
function authorTint(key: string): string {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
  return AUTHOR_TINTS[Math.abs(h) % AUTHOR_TINTS.length]
}
function highlight(text: string, query: string) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (<>{text.slice(0, idx)}<mark className="scm-mark">{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</>)
}
function dirname(path: string): string { const n = path.replace(/\\/g,"/"); const i = n.lastIndexOf("/"); if (i<=0) return ""; return n.slice(0,i) }

export const HistoryPane = memo(function HistoryPane({ repoRoot, onOpenPatch }: { repoRoot: string; onOpenPatch: (title: string, text: string) => void }) {
  const t = useT()
  const [commits, setCommits] = useState<GitLogEntry[]>([])
  const [loadStatus, setLoadStatus] = useState<"idle"|"initial"|"more"|"error">("idle")
  const [error, setError] = useState<string|null>(null)
  const [endReached, setEndReached] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const deferredSearch = useDeferredValue(searchInput.trim())
  const activeSearch = deferredSearch.length >= 2 ? deferredSearch : ""
  const [openSha, setOpenSha] = useState<string|null>(null)
  const [remoteWeb, setRemoteWeb] = useState<RemoteWebInfo|null>(null)
  const filesCacheRef = useRef(new Map<string, FilesEntry>())
  const [filesTick, setFilesTick] = useState(0)
  const bumpFiles = useCallback(() => setFilesTick((n)=>n+1), [])
  const requestIdRef = useRef(0)
  const inflightMoreRef = useRef(false)
  const filesInflightRef = useRef(new Set<string>())
  const scrollRef = useRef<HTMLDivElement|null>(null)
  const graphCacheRef = useRef<{ rows: GraphRow[]; byCommit: Map<string, GraphRow>; tail: GraphState; firstSha: string|null; len: number; maxLaneCount: number }>({
    rows: [], byCommit: new Map(), tail: EMPTY_GRAPH_STATE, firstSha: null, len: 0, maxLaneCount: 1
  })

  const { graphByCommit, maxLaneCount } = useMemo(() => {
    const cache = graphCacheRef.current
    if (commits.length === 0) {
      cache.rows=[]; cache.byCommit=new Map(); cache.tail=EMPTY_GRAPH_STATE; cache.firstSha=null; cache.len=0; cache.maxLaneCount=1
      return { graphByCommit: cache.byCommit, maxLaneCount: 1 }
    }
    const firstSha = commits[0].sha
    const canAppend = cache.firstSha === firstSha && commits.length >= cache.len
    if (!canAppend) {
      const { rows, state } = layoutGraph(commits)
      const byCommit = new Map<string, GraphRow>()
      let max=1
      for (const row of rows) { byCommit.set(row.sha, row); if (row.laneCount>max) max=row.laneCount }
      cache.rows=rows; cache.byCommit=byCommit; cache.tail=state; cache.firstSha=firstSha; cache.len=commits.length; cache.maxLaneCount=max
      return { graphByCommit: byCommit, maxLaneCount: max }
    }
    if (commits.length > cache.len) {
      const delta = commits.slice(cache.len)
      const { rows: newRows, state } = layoutGraph(delta, cache.tail)
      let max = cache.maxLaneCount
      for (const row of newRows) { cache.byCommit.set(row.sha, row); if (row.laneCount>max) max=row.laneCount }
      cache.rows = cache.rows.concat(newRows); cache.tail=state; cache.len=commits.length; cache.maxLaneCount=max
    }
    return { graphByCommit: cache.byCommit, maxLaneCount: cache.maxLaneCount }
  }, [commits])

  const filtered = useMemo(() => {
    const q = activeSearch.toLowerCase()
    if (!q) return commits
    return commits.filter((c) => c.subject.toLowerCase().includes(q) || c.author.toLowerCase().includes(q) || c.authorEmail.toLowerCase().includes(q) || c.shortSha.includes(q))
  }, [commits, activeSearch])

  const virtualizer = useVirtualizer({ count: filtered.length, getScrollElement: () => scrollRef.current, estimateSize: () => ROW_HEIGHT, overscan: 8, getItemKey: (i)=> filtered[i]?.sha ?? i })

  const loadInitial = useCallback(async () => {
    const id = ++requestIdRef.current
    setLoadStatus("initial"); setError(null); setEndReached(false)
    try {
      const entries = await shell.git.log(repoRoot, PAGE_SIZE, undefined, activeSearch || undefined)
      if (id !== requestIdRef.current) return
      setCommits(entries); setLoadStatus("idle")
      if (entries.length < PAGE_SIZE) setEndReached(true)
    } catch (e) {
      if (id !== requestIdRef.current) return
      setError(String(e)); setLoadStatus("error")
    }
  }, [repoRoot, activeSearch])

  const loadMore = useCallback(async () => {
    if (inflightMoreRef.current || endReached) return
    if (loadStatus !== "idle") return
    const last = commits[commits.length-1]
    if (!last) return
    inflightMoreRef.current=true; setLoadStatus("more")
    try {
      const entries = await shell.git.log(repoRoot, PAGE_SIZE, last.sha, activeSearch || undefined)
      setCommits((prev) => {
        const seen = new Set(prev.map((c)=>c.sha))
        const merged=[...prev]
        for (const e of entries) if (!seen.has(e.sha)) merged.push(e)
        return merged
      })
      if (entries.length < PAGE_SIZE) setEndReached(true)
      setLoadStatus("idle")
    } catch (e) {
      setError(String(e)); setLoadStatus("error")
    } finally { inflightMoreRef.current=false }
  }, [commits, endReached, loadStatus, repoRoot, activeSearch])

  useEffect(() => {
    filesInflightRef.current.clear(); filesCacheRef.current.clear(); bumpFiles(); setCommits([]); setOpenSha(null); void loadInitial()
  }, [bumpFiles, loadInitial])

  useEffect(() => {
    let cancelled=false
    shell.git.remoteUrl(repoRoot, "origin").then((url)=> { if (cancelled) return; setRemoteWeb(parseRemoteWebUrl(url)) }).catch(()=> { if (cancelled) return; setRemoteWeb(null) })
    return () => { cancelled=true }
  }, [repoRoot])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current; if (!el) return
    if (activeSearch) return
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
    if (remaining < NEAR_BOTTOM_PX) void loadMore()
  }, [activeSearch, loadMore])

  useEffect(() => {
    if (loadStatus !== "idle") return
    if (endReached) return
    if (activeSearch) return
    if (commits.length===0) return
    const el = scrollRef.current; if (!el) return
    const scrollable = el.scrollHeight - el.clientHeight
    if (scrollable > NEAR_BOTTOM_PX) return
    const id = window.setTimeout(()=> { void loadMore() }, 0)
    return () => window.clearTimeout(id)
  }, [commits.length, activeSearch, endReached, loadMore, loadStatus])

  const fetchFiles = useCallback(async (sha: string) => {
    if (filesInflightRef.current.has(sha)) return
    const cache = filesCacheRef.current
    const ex = cache.get(sha)
    if (ex && ex.state !== "error") return
    filesInflightRef.current.add(sha); cache.set(sha, { state: "loading" }); bumpFiles()
    try {
      const files = await shell.git.commitFiles(repoRoot, sha)
      cache.set(sha, { state: "loaded", files })
      while (cache.size > FILES_CACHE_LIMIT) {
        const oldest = cache.keys().next().value
        if (oldest===undefined || oldest===sha) break
        cache.delete(oldest)
      }
      bumpFiles()
    } catch (e) {
      cache.set(sha, { state: "error", error: String(e) }); bumpFiles()
    } finally { filesInflightRef.current.delete(sha) }
  }, [repoRoot, bumpFiles])

  const handleRowClick = useCallback((sha: string) => {
    if (openSha === sha) { setOpenSha(null); return }
    setOpenSha(sha); void fetchFiles(sha)
  }, [fetchFiles, openSha])

  const openFilesEntry = useMemo(() => {
    if (!openSha) return null
    return filesCacheRef.current.get(openSha) ?? null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSha, filesTick])

  const copyToClipboard = useCallback(async (value: string) => {
    try { await navigator.clipboard.writeText(value) } catch {}
  }, [])

  const handleFileOpen = useCallback((commit: GitLogEntry, file: GitCommitFileChange) => {
    shell.git.commitDiff(repoRoot, commit.sha, file.path, file.originalPath ?? undefined)
      .then((r)=> onOpenPatch(`${file.path} @ ${commit.shortSha}`, r.diffText || r.fallbackPatch || "—"))
      .catch(()=> onOpenPatch(`${file.path} @ ${commit.shortSha}`, "error"))
    setOpenSha(null)
  }, [repoRoot, onOpenPatch])

  // debounce search reload
  const searchTimer = useRef<number|null>(null)
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    // wait 300ms after input stops
    searchTimer.current = window.setTimeout(() => {
      // loadInitial already watches activeSearch (deferred), but we need to trigger reload when activeSearch changes
      // Do nothing — loadInitial effect will trigger via activeSearch dep
    }, 300)
    return () => { if (searchTimer.current) window.clearTimeout(searchTimer.current) }
  }, [searchInput])

  if (loadStatus === "initial" && commits.length===0) {
    return (<div className="scm-history"><div className="scm-empty"><LoadingIcon size={14} /><span className="scm-muted" style={{ fontSize: 11.5 }}>{t("scm.loadingHistory")}</span></div></div>)
  }
  if (loadStatus==="error" && commits.length===0) {
    return (<div className="scm-history"><div className="scm-empty"><div style={{ fontSize:13, fontWeight:600 }}>{t("common.error")}</div><div className="scm-muted" style={{ fontSize:11, maxWidth: 360 }}>{error ?? "Unknown error"}</div><button className="btn-primary compact" onClick={()=>void loadInitial()}>Retry</button></div></div>)
  }
  if (commits.length===0) {
    return (<div className="scm-history"><div className="scm-empty"><div style={{ fontSize:13, fontWeight:600 }}>{t("scm.noCommits")}</div></div></div>)
  }

  return (
    <div className="scm-history">
      <div className="scm-search">
        <SearchIcon size={13} />
        <input value={searchInput} onChange={(e)=>setSearchInput(e.target.value)} placeholder={t("scm.searchCommits")} />
        {loadStatus==="initial" || loadStatus==="more" ? <LoadingIcon size={12} /> : null}
      </div>

      <div className="scm-history-header" style={{ display: "grid", gridTemplateColumns: GRID_TEMPLATE, height: TABLE_HEADER_HEIGHT }}>
        <div />
        <div className="scm-muted" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.14, textTransform:"uppercase" }}>SHA</div>
        <div className="scm-muted" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.14, textTransform:"uppercase" }}>Subject</div>
        <div />
        <div className="scm-muted" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.14, textTransform:"uppercase", marginLeft: 8 }}>Author</div>
        <div className="scm-muted" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.14, textTransform:"uppercase", textAlign:"right" }}>Date</div>
        <div className="scm-muted" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.14, textTransform:"uppercase", textAlign:"right" }}>Changes</div>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="scm-log">
        <div style={{ height: virtualizer.getTotalSize(), position:"relative", width:"100%" }}>
          {virtualizer.getVirtualItems().map((vr) => {
            const commit = filtered[vr.index]
            if (!commit) return null
            const active = openSha === commit.sha
            const graphRow = graphByCommit.get(commit.sha) ?? null
            const date = compactDate(commit.timestampSecs)
            const initials = authorInitials(commit.author)
            const totalStat = commit.insertions + commit.deletions
            return (
              <div key={vr.key} style={{ position:"absolute", top:0, left:0, width:"100%", height: vr.size, transform:`translateY(${vr.start}px)` }}>
                <button type="button" onClick={()=>handleRowClick(commit.sha)}
                  className={`scm-history-row${active ? " active" : ""}`}
                  style={{ display: "grid", gridTemplateColumns: GRID_TEMPLATE }}>
                  <div style={{ display:"flex", alignItems:"center", paddingLeft: 4 }}>
                    {graphRow ? <GraphRail row={graphRow} rowHeight={ROW_HEIGHT} maxLaneCount={maxLaneCount} active={active} /> : null}
                  </div>
                  <span className="scm-muted" style={{ fontFamily:"var(--font-mono)", fontSize:10.5, paddingLeft: 2 }}>{commit.shortSha}</span>
                  <span className={`scm-trunc ${active ? "scm-strong" : ""}`} style={{ fontSize:12, fontWeight: active?600:500 }}>{commit.subject ? highlight(commit.subject, activeSearch) : <span className="scm-muted">(no subject)</span>}</span>
                  <span aria-hidden />
                  <span style={{ display:"inline-flex", alignItems:"center", gap:6, maxWidth:"100%", overflow:"hidden", background:"color-mix(in srgb, var(--text) 6%, transparent)", borderRadius:6, padding:"2px 6px", marginLeft:8, height:18, alignSelf:"center" }}>
                    <span style={{ display:"inline-flex", width:14, height:14, alignItems:"center", justifyContent:"center", borderRadius:3, fontFamily:"var(--font-mono)", fontSize:8.5, fontWeight:700, color:"var(--bg)", background: authorTint(commit.authorEmail||commit.author) }}>{initials}</span>
                    <span className="scm-trunc" style={{ fontSize:10.5, fontWeight:500 }}>{commit.author ? highlight(commit.author, activeSearch) : "Unknown"}</span>
                  </span>
                  <span className="scm-muted" style={{ fontFamily:"var(--font-mono)", fontSize:10.5, textAlign:"right" }}>{date}</span>
                  <span style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:6, fontFamily:"var(--font-mono)", fontSize:10 }}>
                    {commit.filesChanged>0 ? <span className="scm-muted" style={{ display:"inline-flex", alignItems:"center", gap:3 }}><FileIcon size={10} />{commit.filesChanged}</span> : null}
                    {commit.filesChanged>0 && totalStat>0 ? <span style={{ width:3, height:3, borderRadius:99, background:"var(--border)" }} /> : null}
                    {totalStat>0 ? <span style={{ display:"inline-flex", gap:4 }}>{commit.insertions>0 ? <span style={{ color:"#34d399", fontWeight:600 }}>+{commit.insertions}</span> : null}{commit.deletions>0 ? <span style={{ color:"#fb7185", fontWeight:600 }}>−{commit.deletions}</span> : null}</span> : commit.filesChanged===0 ? <span className="scm-muted">—</span> : null}
                  </span>
                </button>
                {active ? (
                  <div className="scm-commit-detail">
                    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--muted)" }}>
                      <span style={{ background:"var(--surface-strong)", borderRadius:4, padding:"2px 6px", fontFamily:"var(--font-mono)", fontSize:10.5 }}>{commit.shortSha}</span>
                      <span className="scm-trunc" style={{ fontWeight:600, color:"var(--text)" }}>{commit.subject || "(no subject)"}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:10.5, color:"var(--muted)" }}>
                      <span className="scm-trunc">{commit.author || "Unknown"}</span>
                      {commit.authorEmail ? (<><span>·</span><span className="scm-trunc">{commit.authorEmail}</span></>) : null}
                      <span>·</span><span>{absoluteTime(commit.timestampSecs)}</span>
                    </div>
                    <div style={{ display:"flex", gap:6, marginTop:6 }}>
                      <button className="btn-secondary compact" style={{ fontSize:11, height:24 }} onClick={()=> { void copyToClipboard(commit.sha) }}><CopyIcon size={11} /> Copy SHA</button>
                      {remoteWeb ? <a className="scm-remote-link" href={commitWebUrl(remoteWeb, commit.sha)} target="_blank" rel="noreferrer"><LinkIcon size={11} /> {remoteWeb.hostname}</a> : null}
                    </div>
                    <CommitFiles commit={commit} filesEntry={openFilesEntry} onOpenFile={handleFileOpen} onRetry={()=>void fetchFiles(commit.sha)} onFullPatch={async (c)=> {
                      try { const r = await shell.git.showCommitDiff(repoRoot, c.sha); onOpenPatch(`commit ${c.shortSha}`, r.diffText||"—") } catch { onOpenPatch(`commit ${c.shortSha}`, "error") }
                    }} />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
        {loadStatus==="more" ? <div className="scm-muted" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:12, fontSize:11 }}><LoadingIcon size={12} /> Loading more…</div> : null}
        {endReached && !activeSearch ? <div className="scm-muted" style={{ textAlign:"center", padding:12, fontSize:10.5 }}>End of history</div> : null}
        {loadStatus==="error" && commits.length>0 ? <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:12, fontSize:11, color:"var(--danger)" }}>{error ?? "Failed to load more"}<button className="btn-secondary compact" style={{ height:24 }} onClick={()=>void loadMore()}>Retry</button></div> : null}
      </div>
    </div>
  )
})

function CommitFiles({ commit, filesEntry, onOpenFile, onRetry, onFullPatch }: { commit: GitLogEntry; filesEntry: FilesEntry|null; onOpenFile: (c: GitLogEntry, f: GitCommitFileChange)=>void; onRetry: ()=>void; onFullPatch: (c: GitLogEntry)=>void }) {
  if (!filesEntry || filesEntry.state==="loading") return (<div className="scm-muted" style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", fontSize:11 }}><LoadingIcon size={12} /> Loading files…</div>)
  if (filesEntry.state==="error") return (<div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", fontSize:11, color:"var(--danger)" }}><span className="scm-trunc">{filesEntry.error}</span><button className="btn-secondary compact" style={{ height:24 }} onClick={onRetry}>Retry</button></div>)
  if (filesEntry.files.length===0) return (<div className="scm-muted" style={{ padding:"8px 12px", fontSize:11 }}>No file changes.</div>)
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, marginTop:8 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 2px" }}>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:0.12, textTransform:"uppercase", color:"var(--muted)" }}>Files</span>
        <span style={{ background:"var(--surface-strong)", borderRadius:4, padding:"1px 5px", fontSize:9.5, color:"var(--muted)" }}>{filesEntry.files.length}</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
        {filesEntry.files.map((file)=> (
          <button key={file.path} type="button" onClick={()=>onOpenFile(commit, file)} className="scm-file-chip">
            <FileIcon size={11} />
            <span className="scm-trunc">{file.originalPath ? `${file.originalPath} → ${file.path}` : file.path}</span>
            <span style={{ marginLeft:"auto", display:"inline-flex", gap:6, fontSize:10, fontVariantNumeric:"tabular-nums" }}>
              {file.isBinary ? <span className="scm-muted">binary</span> : (<><span style={{ color:"#34d399" }}>+{file.added}</span><span style={{ color:"#fb7185" }}>−{file.removed}</span></>)}
            </span>
            <span style={{ fontSize:9.5, fontWeight:700, width:16, textAlign:"center", color: file.status==="A"?"#34d399":file.status==="D"?"#fb7185":file.status==="M"?"#fbbf24":"var(--muted)" }}>{file.status.toUpperCase()}</span>
            <span className="scm-muted" style={{ fontSize:10.5 }}>{dirname(file.path)}</span>
          </button>
        ))}
        <button type="button" onClick={()=>void onFullPatch(commit)} className="scm-file-chip scm-full-patch">View full patch</button>
      </div>
    </div>
  )
}
