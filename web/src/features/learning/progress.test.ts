import { describe, it, expect, beforeEach } from "vitest"
import { loadProgress, markDone, markCategoryDone, markVisited, resetProgress, lastVisitedLesson, recentLessons, loadScrollTop, saveScrollTop } from "./progress"

beforeEach(() => {
  try { localStorage.clear() } catch { /* ignore */ }
})

describe("learning progress", () => {
  it("markDone marca y desmarca", () => {
    let p = markDone("a", true)
    expect(p["a"]?.done).toBe(true)
    p = markDone("a", false)
    expect(p["a"]?.done).toBe(false)
    expect(loadProgress()["a"]?.done).toBe(false)
  })

  it("markCategoryDone marca toda la sección de una", () => {
    const p = markCategoryDone(["a", "b", "c"], true)
    expect(p["a"]?.done).toBe(true)
    expect(p["b"]?.done).toBe(true)
    expect(p["c"]?.done).toBe(true)
  })

  it("lastVisitedLesson devuelve la última visitada no completada", () => {
    markVisited("old")
    markVisited("recent")
    markDone("recent", true)
    expect(lastVisitedLesson(loadProgress())).toBe("old")
  })

  it("lastVisitedLesson devuelve null sin visitas", () => {
    expect(lastVisitedLesson(loadProgress())).toBeNull()
  })

  it("resetProgress vacía todo", () => {
    markDone("a", true)
    expect(resetProgress()).toEqual({})
    expect(loadProgress()).toEqual({})
  })

  it("recentLessons ordena por última visita", () => {
    markVisited("a")
    markVisited("b")
    markVisited("c")
    expect(recentLessons(loadProgress(), 2)).toEqual(["c", "b"])
  })

  it("scroll persiste y expira bajo el umbral", () => {
    expect(loadScrollTop("x")).toBe(0)
    saveScrollTop("x", 10)
    expect(loadScrollTop("x")).toBe(0)
    saveScrollTop("x", 500)
    expect(loadScrollTop("x")).toBe(500)
  })
})
