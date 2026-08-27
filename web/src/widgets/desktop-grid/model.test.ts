import { describe, it, expect } from "vitest"
import {
  buildGridTemplate,
  calcDropZone,
  reorderTabsInStack,
  removeTabFromStack,
  insertTabInStack,
} from "./model"

describe("desktop-grid model", () => {
  it("buildGridTemplate calculates CSS columns for left position", () => {
    const res = buildGridTemplate({
      position: "left",
      sidebarCollapsed: false,
      sidebarWidth: 260,
      rightSidebarCollapsed: true,
      rightSidebarWidth: 320,
    })
    expect(res.gridTemplateColumns).toBe(
      "calc(48px * var(--ui-scale, 1)) calc(260px * var(--ui-scale, 1)) minmax(0, 1fr) 0px"
    )
  })

  it("buildGridTemplate collapses sidebar when sidebarCollapsed is true", () => {
    const res = buildGridTemplate({
      position: "left",
      sidebarCollapsed: true,
      sidebarWidth: 260,
      rightSidebarCollapsed: false,
      rightSidebarWidth: 300,
    })
    expect(res.gridTemplateColumns).toBe(
      "calc(48px * var(--ui-scale, 1)) 0px minmax(0, 1fr) calc(300px * var(--ui-scale, 1))"
    )
  })

  it("calcDropZone detects drop zones correctly", () => {
    const rect = { left: 0, top: 0, width: 400, height: 400 }
    expect(calcDropZone(50, 200, rect)).toBe("left")
    expect(calcDropZone(350, 200, rect)).toBe("right")
    expect(calcDropZone(200, 50, rect)).toBe("top")
    expect(calcDropZone(200, 350, rect)).toBe("bottom")
    expect(calcDropZone(200, 200, rect, "editor")).toBe("center")
  })

  it("reorders tabs inside a stack correctly", () => {
    const stack = ["tab-1", "tab-2", "tab-3"]
    expect(reorderTabsInStack(stack, 0, 2)).toEqual(["tab-2", "tab-3", "tab-1"])
    expect(reorderTabsInStack(stack, 2, 0)).toEqual(["tab-3", "tab-1", "tab-2"])
  })

  it("removes tab from stack", () => {
    const stack = ["tab-1", "tab-2", "tab-3"]
    expect(removeTabFromStack(stack, 1)).toEqual(["tab-1", "tab-3"])
  })

  it("inserts tab into stack at correct position", () => {
    const stack = ["tab-1", "tab-3"]
    expect(insertTabInStack(stack, "tab-2", 1)).toEqual(["tab-1", "tab-2", "tab-3"])
  })
})
