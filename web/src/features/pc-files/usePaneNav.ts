import { useCallback, useEffect, useMemo, useState } from "react"
import type { FsEntry } from "../../shell"
import { getParentPath, pushHistory, sortFsEntries, splitCrumbs, type SortMode } from "./explorerView"

// Navegación y vista de un panel del explorer (historial atrás/adelante,
// breadcrumbs, nombre de workspace y filas filtradas/ordenadas). Se usa igual
// para el panel primario y el secundario; antes era lógica duplicada inline.
export function usePaneNav(
  cwd: string | null,
  dirs: FsEntry[],
  files: FsEntry[],
  load: (path: string) => void,
  opts: { query: string; sortMode: SortMode; sortDir: 1 | -1 },
) {
  const [hist, setHist] = useState<string[]>([])
  const [hIdx, setHIdx] = useState(-1)

  // El historial registra navegaciones reales; recargar la misma carpeta no
  // duplica (pushHistory) y volver atrás no re-agrega (coincide con el índice).
  useEffect(() => {
    if (!cwd) return
    if (hist[hIdx] === cwd) return
    const r = pushHistory(hist, hIdx, cwd)
    setHist(r.hist)
    setHIdx(r.idx)
  }, [cwd, hist, hIdx])

  const goHist = useCallback(
    (delta: -1 | 1) => {
      const ni = hIdx + delta
      if (ni < 0 || ni >= hist.length) return
      const target = hist[ni]
      if (!target) return
      setHIdx(ni)
      load(target)
    },
    [hIdx, hist, load],
  )

  const workspaceName = useMemo(() => {
    if (!cwd) return "WORKSPACE"
    const cleaned = cwd.replace(/[/\\]+$/, "")
    const parts = cleaned.split(/[/\\]/)
    return parts[parts.length - 1] || cleaned
  }, [cwd])

  const parentPath = useMemo(() => getParentPath(cwd), [cwd])
  const canGoBack = !!parentPath && !!cwd
  const crumbs = useMemo(() => splitCrumbs(cwd), [cwd])

  const qLower = opts.query.trim().toLowerCase()
  const filteredDirs = useMemo(
    () => (qLower ? dirs.filter((d) => d.name.toLowerCase().includes(qLower)) : dirs),
    [dirs, qLower],
  )
  const filteredFiles = useMemo(
    () => (qLower ? files.filter((f) => f.name.toLowerCase().includes(qLower)) : files),
    [files, qLower],
  )
  const sortedDirs = useMemo(
    () => sortFsEntries(filteredDirs, opts.sortMode, opts.sortDir),
    [filteredDirs, opts.sortMode, opts.sortDir],
  )
  const sortedFiles = useMemo(
    () => sortFsEntries(filteredFiles, opts.sortMode, opts.sortDir),
    [filteredFiles, opts.sortMode, opts.sortDir],
  )
  // Orden visible (carpetas + archivos): base del Shift+rango.
  const ordered = useMemo(() => [...sortedDirs, ...sortedFiles].map((e) => e.path), [sortedDirs, sortedFiles])

  return useMemo(
    () => ({
      hist,
      hIdx,
      canBack: hIdx > 0,
      canForward: hIdx < hist.length - 1,
      goHist,
      workspaceName,
      parentPath,
      canGoBack,
      crumbs,
      qLower,
      sortedDirs,
      sortedFiles,
      ordered,
    }),
    [hist, hIdx, goHist, workspaceName, parentPath, canGoBack, crumbs, qLower, sortedDirs, sortedFiles, ordered],
  )
}

export type PaneNav = ReturnType<typeof usePaneNav>
