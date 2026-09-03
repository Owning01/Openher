import type { CSSProperties } from "react"

export type DropZone = "left" | "right" | "top" | "bottom" | "center"

export interface BuildGridTemplateOptions {
  position?: "left" | "right" | "top"
  sidebarCollapsed: boolean
  sidebarWidth: number
  rightSidebarCollapsed: boolean
  rightSidebarWidth: number
  desktopDiffOpen?: boolean
  desktopDiffWidth?: number
  overrides?: { sidebarW?: number; rightW?: number }
}

export function buildGridTemplate({
  position = "left",
  sidebarCollapsed,
  sidebarWidth,
  rightSidebarCollapsed,
  rightSidebarWidth,
  desktopDiffOpen = false,
  desktopDiffWidth = 400,
  overrides,
}: BuildGridTemplateOptions): CSSProperties {
  const activityCol = "calc(48px * var(--ui-scale, 1))"
  const s = sidebarCollapsed ? "0px" : `calc(${overrides?.sidebarW ?? sidebarWidth}px * var(--ui-scale, 1))`
  const r = rightSidebarCollapsed ? "0px" : `calc(${overrides?.rightW ?? rightSidebarWidth}px * var(--ui-scale, 1))`
  const diff = desktopDiffOpen ? ` calc(${desktopDiffWidth}px * var(--ui-scale, 1))` : ""

  if (position === "top") {
    return {
      gridTemplateColumns: `${s} minmax(0, 1fr) ${r}${diff}`,
      gridTemplateRows: "auto minmax(0, 1fr)",
    }
  }
  if (position === "right") {
    return {
      gridTemplateColumns: `${s} minmax(0, 1fr) ${r}${diff} ${activityCol}`,
    }
  }
  return {
    gridTemplateColumns: `${activityCol} ${s} minmax(0, 1fr) ${r}${diff}`,
  }
}

export const TAB_BAR_GUARD = 40

export function isOverTabBar(clientY: number, rect: { top: number }): boolean {
  return clientY - rect.top < TAB_BAR_GUARD
}

export function calcDropZone(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  kind?: string
): DropZone {
  const x = clientX - rect.left
  const y = clientY - rect.top
  const w = rect.width
  const h = rect.height

  const edge = 0.18
  if (x < w * edge) return "left"
  if (x > w * (1 - edge)) return "right"
  if (y < h * edge) return "top"
  if (y > h * (1 - edge)) return "bottom"
  return kind === "editor" ? "center" : (x >= w / 2 ? "right" : "left")
}

export function reorderTabsInStack(stack: string[], fromIndex: number, toIndex: number): string[] {
  if (fromIndex < 0 || fromIndex >= stack.length || toIndex < 0 || toIndex >= stack.length) {
    return stack
  }
  const next = [...stack]
  const [moved] = next.splice(fromIndex, 1)
  if (moved !== undefined) {
    next.splice(toIndex, 0, moved)
  }
  return next
}

export function removeTabFromStack(stack: string[], tabIndex: number): string[] {
  return stack.filter((_, i) => i !== tabIndex)
}

export function insertTabInStack(stack: string[], tabId: string, toIndex: number): string[] {
  const at = Math.max(0, Math.min(toIndex, stack.length))
  return [...stack.slice(0, at), tabId, ...stack.slice(at)]
}

export type CompactLayoutInput = {
  cols: number
  rows: number
  sessions: Array<string | null>
  panelKinds: Array<string>
  panelIds: Array<string>
  colSizes: Array<number | null>
  rowSizes: Array<number | null>
  panelEditorTabStacks?: Record<number, string[]>
  panelEditorPaths?: Record<number, string>
}

export function compactLayout(layout: CompactLayoutInput, stacks: string[][]): CompactLayoutInput {
  let { cols, rows, sessions, panelKinds, panelIds, colSizes, rowSizes } = { ...layout, sessions: [...layout.sessions], panelKinds: [...layout.panelKinds], panelIds: [...layout.panelIds], colSizes: [...layout.colSizes], rowSizes: [...layout.rowSizes] } as CompactLayoutInput
  const isEmpty = (i: number) => {
    if (sessions[i]) return false
    if ((stacks[i]?.length ?? 0) > 0) return false
    const kind = panelKinds[i]
    if (kind === "editor") {
      const edt = (layout as any).panelEditorTabStacks?.[i] as string[] | undefined
      if (edt && edt.length > 0) return false
      if ((layout as any).panelEditorPaths?.[i]) return false
      return true
    }
    if (kind !== "session") return false
    return true
  }
  let changed = true
  while (changed) {
    changed = false
    for (let r = 0; r < rows; r++) {
      if (sessions.slice(r * cols, r * cols + cols).every((_, i) => isEmpty(r * cols + i)) && rows > 1) {
        sessions = sessions.filter((_, i) => Math.floor(i / cols) !== r)
        panelKinds = panelKinds.filter((_, i) => Math.floor(i / cols) !== r)
        panelIds = panelIds.filter((_, i) => Math.floor(i / cols) !== r)
        rows -= 1; rowSizes = (rowSizes as any[]).filter((_, i) => i !== r); changed = true; break
      }
    }
    if (changed) continue
    const emptyCols: number[] = []
    for (let c = 0; c < cols; c++) if (Array.from({ length: rows }, (_, r) => r * cols + c).every(isEmpty)) emptyCols.push(c)
    if (emptyCols.length > 0 && cols > emptyCols.length) {
      const rem = new Set(emptyCols)
      sessions = sessions.filter((_, i) => !rem.has(i % cols))
      panelKinds = panelKinds.filter((_, i) => !rem.has(i % cols))
      panelIds = panelIds.filter((_, i) => !rem.has(i % cols))
      cols -= emptyCols.length
      colSizes = (colSizes as any[]).filter((_, i) => !rem.has(i))
      changed = true
    }
    if (cols === 1) colSizes = [null]
    if (rows === 1) rowSizes = [null]
  }
  return { cols, rows, sessions, panelKinds, panelIds, colSizes, rowSizes, panelEditorTabStacks: (layout as any).panelEditorTabStacks, panelEditorPaths: (layout as any).panelEditorPaths, panelEditorActive: (layout as any).panelEditorActive } as any
}
