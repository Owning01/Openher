// Carga y cachea manifest + lecciones markdown.
import type { LearningManifest, LearningLesson } from "./types.ts"

let cachedManifest: LearningManifest | null = null

const BASE = import.meta.env.BASE_URL || "/"
const LEARNING_BASE = `${BASE}learning/`

export async function loadManifest(): Promise<LearningManifest> {
  if (cachedManifest) return cachedManifest
  const res = await fetch(`${LEARNING_BASE}manifest.json`)
  if (!res.ok) throw new Error(`No se pudo cargar manifest (${res.status})`)
  cachedManifest = (await res.json()) as LearningManifest
  return cachedManifest
}

const lessonCache = new Map<string, string>()

export async function loadLesson(lesson: LearningLesson): Promise<string> {
  const hit = lessonCache.get(lesson.id)
  if (hit !== undefined) return hit
  const res = await fetch(`${LEARNING_BASE}${lesson.file}`)
  if (!res.ok) throw new Error(`No se pudo cargar lección (${res.status})`)
  const md = await res.text()
  lessonCache.set(lesson.id, md)
  return md
}
