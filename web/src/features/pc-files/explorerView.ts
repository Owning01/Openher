import type { FsEntry } from "../../shell"

// Vista del explorer: orden, breadcrumbs e historial. Lógica pura (testeable);
// el panel solo la conecta al estado.

export type SortMode = "name" | "size" | "date"

function cmpName(a: FsEntry, b: FsEntry): number {
  const an = a.name.toLowerCase()
  const bn = b.name.toLowerCase()
  return an < bn ? -1 : an > bn ? 1 : 0
}

// Ordena una lista (carpetas o archivos por separado, como el Explorador).
// Tamaño/fecha ausentes (null) van al final en ascendente.
export function sortFsEntries(list: FsEntry[], mode: SortMode, dir: 1 | -1): FsEntry[] {
  const arr = [...list]
  switch (mode) {
    case "size":
      arr.sort((a, b) => {
        const av = a.size ?? -1
        const bv = b.size ?? -1
        return (av - bv) * dir || cmpName(a, b)
      })
      break
    case "date":
      arr.sort((a, b) => {
        const av = a.modified ?? 0
        const bv = b.modified ?? 0
        return (av - bv) * dir || cmpName(a, b)
      })
      break
    default:
      arr.sort((a, b) => cmpName(a, b) * dir)
  }
  return arr
}

export type Crumb = { label: string; path: string }

// "C:\a\b" → C:→C:\, a→C:\a, b→C:\a\b. Soporta UNC (\\srv\sh) y raíz Unix (/).
export function splitCrumbs(cwd: string | null): Crumb[] {
  if (!cwd) return []
  const back = cwd.includes("\\")
  const sep = back ? "\\" : "/"
  const unc = back && cwd.startsWith("\\\\")
  const absolute = unc || cwd.startsWith(sep)
  const parts = cwd.split(/[/\\]+/).filter(Boolean)
  if (parts.length === 0) return [{ label: sep, path: unc ? "\\\\" : sep }]
  const out: Crumb[] = []
  let acc = unc ? "\\\\" : ""
  parts.forEach((seg, i) => {
    if (i === 0 && /^[a-zA-Z]:$/.test(seg)) {
      // Unidad Windows: "C:" vive como "C:\".
      acc = `${seg}${sep}`
    } else if (i === 0 && absolute && !unc) {
      acc = `${sep}${seg}`
    } else {
      acc = acc.endsWith(sep) || acc === "" ? `${acc}${seg}` : `${acc}${sep}${seg}`
    }
    out.push({ label: seg, path: acc })
  })
  return out
}

// Historial atrás/adelante por panel (máx 50). pushHistory no duplica el actual
// (recargas con load(cwd) no ensucian el historial).
export function pushHistory(hist: string[], idx: number, cwd: string): { hist: string[]; idx: number } {
  if (hist[idx] === cwd) return { hist, idx }
  const next = [...hist.slice(0, idx + 1), cwd].slice(-50)
  return { hist: next, idx: next.length - 1 }
}
