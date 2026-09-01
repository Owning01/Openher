// @ts-nocheck
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
  // Merge informes (reports) as category inside aprendizaje — replaces standalone ReportsPage
  try {
    let reports: any[] | null = null
    // try desktop shell.fs first
    try {
      const { shell } = await import("../../shell")
      const candidates = [
        "G:\\Proyectos\\opencode-remote-android\\data\\reports\\manifest.json",
        "G:\\Proyectos\\53plataforma-informes\\public\\reports.json",
      ]
      for (const p of candidates) {
        try { const r: any = await shell.fs.read(p); if (r?.content) { reports = JSON.parse(r.content); break } } catch {}
      }
    } catch {}
    if (!reports) {
      const r = await fetch(`${BASE}reports/manifest.json`).then(x=>x.ok?x.json():null).catch(()=>null)
        || await fetch(`${BASE}reports.json`).then(x=>x.ok?x.json():null).catch(()=>null)
        || await fetch(`reports/manifest.json`).then(x=>x.ok?x.json():null).catch(()=>null)
      if (Array.isArray(r)) reports = r
    }
    if (Array.isArray(reports) && reports.length) {
      const lessons = reports.map((rep: any) => ({
        id: `report-${rep.id}`,
        title: rep.title,
        file: rep.file?.replace(/^\/?reports\//, "") ? `__reports__/${rep.file.replace(/^\/?reports\//, "")}` : rep.file,
        category: "informes",
        categoryTitle: "Informes",
        depth: "intermediate" as const,
        minutes: 5,
        tags: rep.tags ?? [],
        isCustom: false,
        description: rep.description,
      }))
      // Fix file path: ReportsViewer used reports/*.md, keep as reports/ for loader below
      for (const l of lessons) {
        const raw = (l as any).file as string
        if (raw.startsWith("__reports__/")) (l as any).file = raw.replace("__reports__/", "reports/")
        else if (!raw.includes("/") ) (l as any).file = `reports/${raw}`
        else if (!raw.startsWith("reports/")) (l as any).file = `reports/${raw.split("/").pop()}`
      }
      const cat = { id: "informes", title: "Informes", level: 2 as const, description: "Reportes técnicos integrados (ex-Plataforma Informes)", count: lessons.length, items: lessons }
      if (!base.categories.find((c:any)=>c.id==="informes")) {
        base.categories.push(cat as any)
        base.totalLessons = base.categories.reduce((a,c)=>a+c.count,0)
      }
    }
  } catch {}
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
      const { shell } = await import("../../shell")
      const candidates = [
        `G:\\Proyectos\\opencode-remote-android\\data\\reports\\${lesson.file.replace("reports/","")}`,
        `G:\\Proyectos\\opencode-remote-android\\public\\${lesson.file}`,
        `G:\\Proyectos\\53plataforma-informes\\public\\${lesson.file.replace("reports/","")}`,
      ]
      for (const p of candidates) {
        try { const r:any = await shell.fs.read(p); if (r?.content) { lessonCache.set(lesson.id, r.content); return r.content } } catch {}
      }
    } catch {}
    const resR = await fetch(`${BASE}${lesson.file}`).catch(()=>null)
    if (resR && resR.ok) { const md = await resR.text(); lessonCache.set(lesson.id, md); return md }
    const resAlt = await fetch(`reports/${lesson.file.replace("reports/","")}`).catch(()=>null)
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
