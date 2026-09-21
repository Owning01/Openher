import { useMemo, type RefObject } from "react"
import { GlobeIcon, SearchIcon } from "../../Icons"
import { isProbablyUrl } from "./url"
import { loadHistory } from "./storage"
import type { BrowserBookmark } from "./types"

type Props = {
  containerRef: RefObject<HTMLDivElement | null>
  inputUrl: string
  bookmarks: BrowserBookmark[]
  showHistory: boolean
  suggestions: string[]
  suggestIdx: number
  onNavigate: (url: string) => void
  onCloseHistory: () => void
  onClearSuggestions: () => void
}

// Dropdown Chrome-like del omnibox: búsqueda, favoritos, suggestions e historial.
export function BrowserHistoryMenu({
  containerRef,
  inputUrl,
  bookmarks,
  showHistory,
  suggestions,
  suggestIdx,
  onNavigate,
  onCloseHistory,
  onClearSuggestions,
}: Props) {
  const visible = showHistory || suggestions.length > 0
  const q = inputUrl.trim().toLowerCase()
  const qTrim = inputUrl.trim()

  const history = useMemo(() => (visible ? loadHistory() : []), [visible, inputUrl])
  const filtered = useMemo(
    () => (q ? history.filter((u) => u.toLowerCase().includes(q)).slice(0, 6) : history.slice(0, 6)),
    [history, q]
  )
  const inFiltered = useMemo(() => new Set(filtered), [filtered])
  // Favoritos primero (funcionan sin red, a diferencia de Suggest).
  const markFiltered = useMemo(
    () => (q
      ? bookmarks.filter((b) => b.url.toLowerCase().includes(q) || (b.title ?? "").toLowerCase().includes(q))
      : bookmarks
    ).filter((b) => !inFiltered.has(b.url)).slice(0, 4),
    [bookmarks, q, inFiltered]
  )
  const showSearch = useMemo(() => Boolean(qTrim && !isProbablyUrl(qTrim)), [qTrim])

  if (!visible) return null

  const pick = (url: string) => {
    onCloseHistory()
    onClearSuggestions()
    onNavigate(url)
  }

  return (
    <div ref={containerRef} className="browser-suggest-dropdown">
      {showSearch && qTrim && (
        <button type="button" className="browser-suggest-item" style={{ fontWeight: 600 }} onClick={() => pick(`https://www.google.com/search?q=${encodeURIComponent(qTrim)}`)}>
          <SearchIcon size={13} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Buscar "{qTrim}" en Google</span>
        </button>
      )}
      {markFiltered.map((b) => (
        <button key={b.url} type="button" className="browser-suggest-item" onClick={() => pick(b.url)}>
          <span style={{ fontSize: 13, color: "var(--warning)" }}>*</span> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title || b.url}</span>
        </button>
      ))}
      {suggestions.map((s, idx) => (
        <button key={s} type="button" className={`browser-suggest-item${idx === suggestIdx ? " active" : ""}`} style={idx === suggestIdx ? { background: "var(--primary-soft)", color: "var(--primary)" } : undefined} onClick={() => pick(`https://www.google.com/search?q=${encodeURIComponent(s)}`)}>
          <SearchIcon size={13} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
        </button>
      ))}
      {filtered.map((u) => (
        <button key={u} type="button" className="browser-suggest-item" onClick={() => pick(u)}>
          <GlobeIcon size={13} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u}</span>
        </button>
      ))}
      {filtered.length === 0 && markFiltered.length === 0 && suggestions.length === 0 && !showSearch && (
        <div style={{ padding: "8px 10px", color: "var(--muted)", fontSize: 12 }}>Sin historial. Escribí para buscar en Google.</div>
      )}
    </div>
  )
}
