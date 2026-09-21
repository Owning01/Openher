import { BROWSER_BOOKMARKS_KEY, BROWSER_HISTORY_KEY } from "./constants"
import type { BrowserBookmark } from "./types"

export function loadBookmarks(): BrowserBookmark[] {
  try {
    const raw = localStorage.getItem(BROWSER_BOOKMARKS_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((x: any) => x && typeof x.url === "string") : []
  } catch { return [] }
}

export function saveBookmarks(items: BrowserBookmark[]) {
  try { localStorage.setItem(BROWSER_BOOKMARKS_KEY, JSON.stringify(items.slice(0, 100))) } catch (e: any) {
    if (e?.name === "QuotaExceededError" || e?.code === 22) {
      try { localStorage.setItem(BROWSER_BOOKMARKS_KEY, JSON.stringify(items.slice(0, 20))) } catch {}
      console.warn("[Browser] bookmarks quota exceeded, trimmed to 20")
    } else {
      console.warn("[Browser] saveBookmarks failed", e)
    }
  }
}

export function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(BROWSER_HISTORY_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((x: any) => typeof x === "string").slice(0, 80) : []
  } catch { return [] }
}

export function pushHistory(url: string) {
  if (!url || url === "about:blank") return
  try {
    const list = loadHistory().filter((u) => u !== url)
    list.unshift(url)
    localStorage.setItem(BROWSER_HISTORY_KEY, JSON.stringify(list.slice(0, 80)))
  } catch {}
}
