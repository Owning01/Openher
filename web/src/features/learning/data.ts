// Carga y cachea manifest + lecciones markdown.
import type { LearningManifest, LearningLesson } from "./types.ts"
import { applyCustomToManifest, getCustomDoc } from "./customStore.ts"

let cachedManifest: LearningManifest | null = null

const BASE = import.meta.env.BASE_URL || "/"
const LEARNING_BASE = `${BASE}learning/`

export async function loadManifest(): Promise<LearningManifest> {
  if (cachedManifest) return cachedManifest
  const res = await fetch(`${LEARNING_BASE}manifest.json`)
  if (!res.ok) throw new Error(`No se pudo cargar manifest (${res.status})`)
  const base = (await res.json()) as LearningManifest
  cachedManifest = applyCustomToManifest(base)
  return cachedManifest
}

export function invalidateManifestCache() {
  cachedManifest = null
}

const lessonCache = new Map<string, string>()

export async function loadLesson(lesson: LearningLesson): Promise<string> {
  const hit = lessonCache.get(lesson.id)
  if (hit !== undefined) return hit
  // Docs custom: están en localStorage, no en fetch
  if (lesson.isCustom || lesson.file.startsWith("custom:")) {
    const custom = getCustomDoc(lesson.id)
    if (custom !== null) {
      lessonCache.set(lesson.id, custom)
      return custom
    }
    // fallback: si es custom pero no hay contenido, devolver placeholder
    const placeholder = `# ${lesson.title}\n\nDocumento custom vacío. Pegá tu contenido acá o subí un .md.`
    lessonCache.set(lesson.id, placeholder)
    return placeholder
  }
  const res = await fetch(`${LEARNING_BASE}${lesson.file}`)
  if (!res.ok) throw new Error(`No se pudo cargar lección (${res.status})`)
  const md = await res.text()
  lessonCache.set(lesson.id, md)
  return md
}

export function cacheLessonContent(id: string, content: string) {
  lessonCache.set(id, content)
}
