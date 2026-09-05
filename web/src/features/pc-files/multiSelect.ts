import { useCallback, useRef, useState } from "react"

// Selección múltiple estilo Explorador de Windows para el explorer:
// click = uno solo, Ctrl/Cmd+click = alternar, Shift+click = rango sobre la
// lista visible ordenada. Lógica pura (testeable) + hook por panel.

export function nextSelection(
  current: string[],
  ordered: string[],
  clicked: string,
  opts: { ctrl: boolean; shift: boolean; anchor: string | null },
): { selected: string[]; anchor: string | null } {
  if (opts.ctrl) {
    const has = current.includes(clicked)
    return {
      selected: has ? current.filter((p) => p !== clicked) : [...current, clicked],
      anchor: clicked,
    }
  }
  if (opts.shift && opts.anchor && opts.anchor !== clicked) {
    const a = ordered.indexOf(opts.anchor)
    const b = ordered.indexOf(clicked)
    if (a >= 0 && b >= 0) {
      const [from, to] = a < b ? [a, b] : [b, a]
      return { selected: ordered.slice(from, to + 1), anchor: opts.anchor }
    }
  }
  return { selected: [clicked], anchor: clicked }
}

// El drag&drop HTML5 lleva un solo string: varias rutas van unidas con \n.
export function joinDragPaths(paths: string[]): string {
  return paths.join("\n")
}

export function parseDragPaths(data: string): string[] {
  return data
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function useRowSelection() {
  const [selected, setSelected] = useState<string[]>([])
  const anchorRef = useRef<string | null>(null)

  const clear = useCallback(() => {
    anchorRef.current = null
    setSelected([])
  }, [])

  const select = useCallback(
    (
      clicked: string,
      ordered: string[],
      e: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
    ) => {
      const ctrl = e.ctrlKey || e.metaKey
      setSelected((prev) => {
        const r = nextSelection(prev, ordered, clicked, {
          ctrl,
          shift: e.shiftKey,
          anchor: anchorRef.current,
        })
        anchorRef.current = r.anchor
        return r.selected
      })
    },
    [],
  )

  // Click derecho sobre una fila fuera de la selección: la selección pasa a
  // ser solo esa fila (como en el Explorador); si ya está incluida se conserva.
  const selectOnly = useCallback((path: string) => {
    setSelected((prev) => {
      if (prev.includes(path)) return prev
      anchorRef.current = path
      return [path]
    })
  }, [])

  const selectAll = useCallback((ordered: string[]) => {
    anchorRef.current = ordered.length > 0 ? ordered[ordered.length - 1] : null
    setSelected([...ordered])
  }, [])

  return { selected, clear, select, selectOnly, selectAll }
}

export type RowSelection = ReturnType<typeof useRowSelection>
