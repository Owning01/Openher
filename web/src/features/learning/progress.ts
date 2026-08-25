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
