export type BrowserBookmark = { url: string; title: string; addedAt: number }

export type BrowserTabItem = {
  id: string
  url: string
  title: string
  history: string[]
  historyIdx: number
}
