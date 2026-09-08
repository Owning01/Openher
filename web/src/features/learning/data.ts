import type { LearningManifest, LearningLesson, LearningCategory } from "./types"
import { applyCustomToManifest, getCustomDoc } from "./customStore"
import { shell } from "../../shell"

let cachedManifest: LearningManifest | null = null

const BASE = import.meta.env.BASE_URL || "/"
const LEARNING_BASE = `${BASE}learning/`

interface ReportEntry {
  id: string
  title: string
  file: string
  tags?: string[]
  description?: string
}

function normalizeReportFile(raw: string): string {
  const name = raw.replace(/^\/?reports\//, "").split("/").pop() ?? raw
  return `reports/${name}`
}

export async function loadManifest(): Promise<LearningManifest> {
  if (cachedManifest) return cachedManifest
  const res = await fetch(`${LEARNING_BASE}manifest.json`)
  if (!res.ok) throw new Error(`No se pudo cargar manifest (${res.status})`)
  const base = (await res.json()) as LearningManifest
  // Merge informes (reports) as category inside aprendizaje — replaces standalone ReportsPage
  try {
    let reports: ReportEntry[] | null = null
    // try desktop shell.fs first
    try {
      const candidates = [
        "G:\\Proyectos\\opencode-remote-android\\data\\reports\\manifest.json",
        "G:\\Proyectos\\53plataforma-informes\\public\\reports.json",
      ]
      for (const p of candidates) {
        try {
          const r = (await shell.fs.read(p)) as { content?: string } | null
          if (r?.content) { reports = JSON.parse(r.content) as ReportEntry[]; break }
        } catch { /* siguiente candidato */ }
      }
    } catch { /* sin shell: sigue por fetch */ }
    if (!reports) {
      const r = await fetch(`${BASE}reports/manifest.json`).then((x) => (x.ok ? x.json() : null)).catch(() => null)
        || await fetch(`${BASE}reports.json`).then((x) => (x.ok ? x.json() : null)).catch(() => null)
        || await fetch(`reports/manifest.json`).then((x) => (x.ok ? x.json() : null)).catch(() => null)
      if (Array.isArray(r)) reports = r as ReportEntry[]
    }
    if (Array.isArray(reports) && reports.length > 0) {
      const lessons: LearningLesson[] = reports.map((rep) => ({
        id: `report-${rep.id}`,
        title: rep.title,
        file: normalizeReportFile(rep.file),
        originalPath: rep.file,
        category: "informes",
        categoryTitle: "Informes",
        subCategory: null,
        depth: "intermedio",
        minutes: 5,
        bytes: 0,
        isCustom: false,
      }))
      const cat: LearningCategory = {
        id: "informes",
        title: "Informes",
        level: 2,
        description: "Reportes técnicos integrados (ex-Plataforma Informes)",
        count: lessons.length,
        items: lessons,
      }
      if (!base.categories.some((c) => c.id === "informes")) {
        base.categories.push(cat)
        base.totalLessons = base.categories.reduce((a, c) => a + c.count, 0)
      }
    }
  } catch { /* informes opcionales: el curriculum carga igual */ }
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
    const placeholder = `# ${lesson.title}\n\nDocumento custom vacío. Pegá tu contenido acá o subí un .md.`
    lessonCache.set(lesson.id, placeholder)
    return placeholder
  }
  // reports from informes category are under /reports/
  if (lesson.file.startsWith("reports/")) {
    try {
      const candidates = [
        `G:\\Proyectos\\opencode-remote-android\\data\\reports\\${lesson.file.replace("reports/", "")}`,
        `G:\\Proyectos\\opencode-remote-android\\public\\${lesson.file}`,
        `G:\\Proyectos\\53plataforma-informes\\public\\${lesson.file.replace("reports/", "")}`,
      ]
      for (const p of candidates) {
        try {
          const r = (await shell.fs.read(p)) as { content?: string } | null
          if (r?.content) { lessonCache.set(lesson.id, r.content); return r.content }
        } catch { /* siguiente candidato */ }
      }
    } catch { /* sin shell: sigue por fetch */ }
    const resR = await fetch(`${BASE}${lesson.file}`).catch(() => null)
    if (resR && resR.ok) { const md = await resR.text(); lessonCache.set(lesson.id, md); return md }
    const resAlt = await fetch(`reports/${lesson.file.replace("reports/", "")}`).catch(() => null)
    if (resAlt && resAlt.ok) { const md = await resAlt.text(); lessonCache.set(lesson.id, md); return md }
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
