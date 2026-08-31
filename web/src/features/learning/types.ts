// Tipos del feature learning — plugin opcional de formación.

export interface LearningLesson {
  id: string
  file: string
  originalPath: string
  category: string
  categoryTitle: string
  subCategory: string | null
  title: string
  depth: "intro" | "intermedio" | "avanzado"
  minutes: number
  bytes: number
  isCustom?: boolean
}

export interface LearningCategory {
  id: string
  title: string
  level: number
  description: string
  count: number
  items: LearningLesson[]
  isCustom?: boolean
}

export interface LearningManifest {
  version: number
  generatedAt: string
  totalLessons: number
  categories: LearningCategory[]
}

/** Progreso de lectura persistido en localStorage. */
export type LearningProgress = Record<string, { done?: boolean; lastVisited?: number }>
