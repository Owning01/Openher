// Unión de directorios conocidos para el backfill por-dir de /session.
// Causa raíz de "proyectos que desaparecen": el historial con cap fijo se
// congelaba en los primeros 80 dirs y lo fresco nunca entraba; además el
// global puede venir parcial (server con scope) y el backfill es entonces
// la ÚNICA fuente de esos proyectos. Sin estado, 100% testeable.

import { normFsPath } from "./fsChanges"

// Clave de agrupación: mismo proyecto aunque varíe mayúsculas, `/` vs `\`
// o trailing slash (el server es Windows). Solo para comparar/agrupar,
// nunca para mostrar ni para llamar a la API.
export function dirKey(dir: string): string {
  if (!dir) return ""
  return normFsPath(dir)
}

// Agrupa sesiones por proyecto, fusionando variantes de escritura del mismo
// dir. display = primer raw visto (para mostrar y accionar); la key interna
// es dirKey(display).
export function groupSessionsByDir<T extends { directory: string }>(sessions: T[]): Array<[string, T[]]> {
  const map = new Map<string, { display: string; list: T[] }>()
  for (const s of sessions) {
    const key = dirKey(s.directory)
    const g = map.get(key)
    if (g) g.list.push(s)
    else map.set(key, { display: s.directory || "/", list: [s] })
  }
  return [...map.values()].map((g) => [g.display, g.list] as [string, T[]])
}

export type DirSources = {
  // dirs del listado global recién llegado (fresco, máxima prioridad)
  itemDirs: string[]
  // dirs de las sesiones que YA muestra la UI (nunca olvidar lo visible)
  stateDirs: string[]
  // dirs de /project del server
  projectDirs: string[]
  // historial persistido de refreshes anteriores
  historyDirs: string[]
  cap: number
}

// Ordena candidatos por prioridad (fresco > visible > proyectos > historial)
// dedup por dirKey, con cap. Lo fresco SIEMPRE entra aunque el historial
// esté lleno (anti-congelamiento). query excluye lo ya cubierto por el
// global para no re-preguntar; history es lo a persistir.
export function buildDirPlan(src: DirSources): { query: string[]; history: string[] } {
  const cap = Math.max(1, src.cap)
  const covered = new Set(src.itemDirs.map(dirKey))
  const seen = new Set<string>()
  const ordered: string[] = []
  const push = (raw: string) => {
    if (!raw) return
    const k = dirKey(raw)
    if (!k || seen.has(k)) return
    seen.add(k)
    ordered.push(raw)
  }
  for (const d of src.itemDirs) push(d)
  for (const d of src.stateDirs) push(d)
  for (const d of src.projectDirs) push(d)
  for (const d of src.historyDirs) push(d)
  const capped = ordered.slice(0, cap)
  return {
    query: capped.filter((d) => !covered.has(dirKey(d))),
    history: capped,
  }
}
