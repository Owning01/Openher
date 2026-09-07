// Persistencia del progreso de lectura en localStorage.
import type { LearningProgress } from "./types.ts"

const KEY = "learning.progress.v1"

export function loadProgress(): LearningProgress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as LearningProgress
  } catch {
    return {}
  }
}

export function saveProgress(progress: LearningProgress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    // storage lleno o bloqueado — silencioso
  }
}

export function markDone(lessonId: string, done: boolean): LearningProgress {
  const p = loadProgress()
  p[lessonId] = { ...p[lessonId], done }
  saveProgress(p)
  return p
}

export function markVisited(lessonId: string): LearningProgress {
  const p = loadProgress()
  p[lessonId] = { ...p[lessonId], lastVisited: Date.now() }
  saveProgress(p)
  return p
}

export function resetProgress(): LearningProgress {
  saveProgress({})
  return {}
}

export function markCategoryDone(lessonIds: string[], done: boolean): LearningProgress {
  const p = loadProgress()
  for (const id of lessonIds) p[id] = { ...p[id], done }
  saveProgress(p)
  return p
}

export function lastVisitedLesson(progress: LearningProgress): string | null {
  let best: string | null = null
  let bestAt = 0
  for (const [id, v] of Object.entries(progress)) {
    if (v?.done) continue
    const at = v?.lastVisited ?? 0
    if (at >= bestAt && at > 0) { bestAt = at; best = id }
  }
  return best
}

export function recentLessons(progress: LearningProgress, limit = 5): string[] {
  return Object.entries(progress)
    .map(([id, v], i) => ({ id, at: v?.lastVisited ?? 0, i }))
    .filter((e) => e.at > 0)
    .sort((a, b) => b.at - a.at || b.i - a.i)
    .slice(0, limit)
    .map((e) => e.id)
}

const SCROLL_PREFIX = "learning:scroll:"

export function loadScrollTop(lessonId: string): number {
  try {
    const v = Number(localStorage.getItem(SCROLL_PREFIX + lessonId))
    return Number.isFinite(v) && v > 0 ? v : 0
  } catch { return 0 }
}

export function saveScrollTop(lessonId: string, top: number) {
  try {
    if (top > 40) localStorage.setItem(SCROLL_PREFIX + lessonId, String(Math.round(top)))
    else localStorage.removeItem(SCROLL_PREFIX + lessonId)
  } catch { /* ignore */ }
}
