import { describe, it, expect } from "vitest"
import { loadDesktopState, genPanelId } from "./useDesktopLayoutState"

describe("useDesktopLayoutState", () => {
  it("generates unique panel ids", () => {
    const id1 = genPanelId()
    const id2 = genPanelId()
    expect(id1).not.toEqual(id2)
    expect(id1.startsWith("panel-")).toBe(true)
  })

  it("loads fallback desktop state correctly", () => {
    const state = loadDesktopState("session-123")
    expect(state.layout.cols).toBe(1)
    expect(state.layout.rows).toBe(1)
    expect(state.layout.sessions).toEqual(["session-123"])
    expect(state.activity).toBe("sessions")
  })
})
