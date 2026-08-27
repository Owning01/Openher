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

  if (x < w * 0.25) return "left"
  if (x > w * 0.75) return "right"
  if (y < h * 0.25) return "top"
  if (y > h * 0.75) return "bottom"
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
