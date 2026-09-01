// Persistencia para secciones y documentos custom del usuario — localStorage + fallback a IndexedDB si hace falta.
// No toca public/learning/manifest.json; todo es overlay en memoria.

import type { LearningCategory, LearningLesson, LearningManifest } from "./types.ts"

const KEY_CATS = "learning:customCategories:v1"
const KEY_DOCS = "learning:customDocs:v1"
const KEY_LAYOUT = "learning:customLayout:v1" // { categoryOrder: string[], lessonMoves: Record<string, {toCategory:string, toIndex:number}> }

export interface CustomLayout {
  categoryOrder?: string[]
  lessonMoves?: Record<string, { toCategory: string; toIndex: number }>
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

// ---- Categorías custom ----
export function loadCustomCategories(): LearningCategory[] {
  try {
    const raw = localStorage.getItem(KEY_CATS)
    return safeParse<LearningCategory[]>(raw, [])
  } catch { return [] }
}

export function saveCustomCategories(cats: LearningCategory[]) {
  try { localStorage.setItem(KEY_CATS, JSON.stringify(cats)) } catch { /* ignore */ }
}

// ---- Docs custom (markdown) ----
export function loadCustomDocs(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEY_DOCS)
    return safeParse<Record<string, string>>(raw, {})
  } catch { return {} }
}

export function saveCustomDoc(id: string, content: string) {
  try {
    const docs = loadCustomDocs()
    docs[id] = content
    localStorage.setItem(KEY_DOCS, JSON.stringify(docs))
  } catch { /* ignore quota */ }
}

export function deleteCustomDoc(id: string) {
  try {
    const docs = loadCustomDocs()
    delete docs[id]
    localStorage.setItem(KEY_DOCS, JSON.stringify(docs))
  } catch { /* ignore */ }
}

export function getCustomDoc(id: string): string | null {
  try {
    const docs = loadCustomDocs()
    return docs[id] ?? null
  } catch { return null }
}

// ---- Layout custom (reordenamientos) ----
export function loadCustomLayout(): CustomLayout {
  try {
    const raw = localStorage.getItem(KEY_LAYOUT)
    return safeParse<CustomLayout>(raw, {})
  } catch { return {} }
}

export function saveCustomLayout(layout: CustomLayout) {
  try { localStorage.setItem(KEY_LAYOUT, JSON.stringify(layout)) } catch { /* ignore */ }
}

// ---- Helpers de creación ----
export function slugifyTitle(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "seccion"
}

export function createCustomCategory(title: string, level = 2, description = "Sección creada por vos. Arrastrá archivos acá."): LearningCategory {
  const slug = slugifyTitle(title)
  const id = `custom-${slug}-${Date.now().toString(36)}`
  return {
    id,
    title: title.trim() || "Nueva sección",
    level,
    description,
    count: 0,
    items: [],
    isCustom: true,
  }
}

export function createCustomLesson(category: LearningCategory, fileName: string, content: string): LearningLesson {
  const base = fileName.replace(/\.[^.]+$/, "")
  const title = base.replace(/[-_]+/g, " ").trim() || fileName
  const id = `custom-${slugifyTitle(base)}-${Date.now().toString(36)}`
  const bytes = new Blob([content]).size
  const words = content.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return {
    id,
    file: `custom:${id}`,
    originalPath: `custom/${category.id}/${fileName}`,
    category: category.id,
    categoryTitle: category.title,
    subCategory: null,
    title,
    depth: "intro",
    minutes,
    bytes,
    isCustom: true,
  }
}

// ---- Merge manifest base + custom ----
export function applyCustomToManifest(base: LearningManifest): LearningManifest {
  const customCats = loadCustomCategories()
  const layout = loadCustomLayout()
  // Clonar para no mutar base
  let categories: LearningCategory[] = [...base.categories.map(c => ({ ...c, items: [...c.items] })), ...customCats.map(c => ({ ...c, items: [...c.items] }))]
  // Aplicar reorden de categorías si existe
  if (layout.categoryOrder && layout.categoryOrder.length > 0) {
    const orderMap = new Map<string, number>()
    layout.categoryOrder.forEach((id, idx) => orderMap.set(id, idx))
    categories = [...categories].sort((a, b) => {
      const ai = orderMap.has(a.id) ? orderMap.get(a.id)! : 1e9
      const bi = orderMap.has(b.id) ? orderMap.get(b.id)! : 1e9
      if (ai !== bi) return ai - bi
      return 0
    })
  }
  // Aplicar movimientos de lecciones entre categorías (y reorden)
  if (layout.lessonMoves) {
    // Primero, recolectar todas las lecciones en un mapa
    const lessonMap = new Map<string, LearningLesson>()
    for (const cat of categories) {
      for (const it of cat.items) lessonMap.set(it.id, it)
    }
    // Remover lecciones movidas de sus categorías originales
    for (const cat of categories) {
      cat.items = cat.items.filter(it => {
        const mv = layout.lessonMoves![it.id]
        return !mv || mv.toCategory === cat.id // si está movida a otra cat, la sacamos de acá
      })
    }
    // Insertar en destino según toIndex
    // Agrupar movimientos por categoría destino y ordenar por toIndex
    const movesByCat = new Map<string, Array<{ id: string; toIndex: number }>>()
    for (const [lessonId, mv] of Object.entries(layout.lessonMoves)) {
      const arr = movesByCat.get(mv.toCategory) || []
      arr.push({ id: lessonId, toIndex: mv.toIndex })
      movesByCat.set(mv.toCategory, arr)
    }
    for (const [catId, moves] of movesByCat) {
      const cat = categories.find(c => c.id === catId)
      if (!cat) continue
      // Ordenar por índice destino
      moves.sort((a, b) => a.toIndex - b.toIndex)
      for (const { id, toIndex } of moves) {
        const lesson = lessonMap.get(id)
        if (!lesson) continue
        // Actualizar categoría de la lección para consistencia (no mutar original, clonar)
        const updated: LearningLesson = { ...lesson, category: catId, categoryTitle: cat.title }
        // Insertar
        const idx = Math.max(0, Math.min(toIndex, cat.items.length))
        // Evitar duplicados: si ya está, no insertar de nuevo
        if (!cat.items.some(it => it.id === id)) {
          cat.items.splice(idx, 0, updated)
        }
      }
    }
    // Actualizar counts
    for (const cat of categories) cat.count = cat.items.length
  } else {
    for (const cat of categories) cat.count = cat.items.length
  }
  const totalLessons = categories.reduce((a, c) => a + c.items.length, 0)
  return { ...base, categories, totalLessons }
}

// ---- Persistencia de movimientos ----
export function persistLessonMove(lessonId: string, toCategory: string, toIndex: number) {
  const layout = loadCustomLayout()
  const moves = { ...(layout.lessonMoves || {}) }
  moves[lessonId] = { toCategory, toIndex }
  saveCustomLayout({ ...layout, lessonMoves: moves })
}

export function persistCategoryOrder(orderedIds: string[]) {
  const layout = loadCustomLayout()
  saveCustomLayout({ ...layout, categoryOrder: orderedIds })
}

export function removeLessonMove(lessonId: string) {
  const layout = loadCustomLayout()
  if (!layout.lessonMoves || !layout.lessonMoves[lessonId]) return
  const { [lessonId]: _, ...rest } = layout.lessonMoves
  saveCustomLayout({ ...layout, lessonMoves: rest })
}
