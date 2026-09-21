import { useCallback, useState } from "react"
import { BROWSER_SHOW_BOOKMARKS_KEY } from "./constants"
import { loadBookmarks, saveBookmarks } from "./storage"
import { formatDisplayTitle } from "./url"
import type { BrowserBookmark } from "./types"

// Favoritos + visibilidad de su barra (persistida en localStorage).
export function useBookmarks(currentSrc: string) {
  const [bookmarks, setBookmarks] = useState<BrowserBookmark[]>(() => loadBookmarks())
  const [showBookmarks, setShowBookmarks] = useState(() => {
    try { return localStorage.getItem(BROWSER_SHOW_BOOKMARKS_KEY) !== "0" } catch { return true }
  })
  const isBookmarked = bookmarks.some((b) => b.url === currentSrc)

  const toggleBookmark = useCallback(() => {
    const title = formatDisplayTitle(currentSrc)
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.url === currentSrc)
      const next = exists ? prev.filter((b) => b.url !== currentSrc) : [{ url: currentSrc, title, addedAt: Date.now() }, ...prev].slice(0, 100)
      saveBookmarks(next)
      return next
    })
  }, [currentSrc])

  const setBookmarksVisible = useCallback((v: boolean) => {
    setShowBookmarks(v)
    try { localStorage.setItem(BROWSER_SHOW_BOOKMARKS_KEY, v ? "1" : "0") } catch {}
  }, [])

  return { bookmarks, showBookmarks, setBookmarksVisible, isBookmarked, toggleBookmark }
}
