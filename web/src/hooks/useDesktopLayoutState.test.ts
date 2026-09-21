import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { pruneBrowserUrls, loadDesktopState, DESKTOP_STATE_KEY } from "./useDesktopLayoutState"

describe("pruneBrowserUrls", () => {
  it("pasa undefined tal cual", () => {
    expect(pruneBrowserUrls(undefined, new Set(["browser:1"]))).toBeUndefined()
  })
  it("sin huérfanos devuelve la misma referencia", () => {
    const urls = { "browser:1": "https://a.com" }
    expect(pruneBrowserUrls(urls, ["browser:1"])).toBe(urls)
  })
  it("elimina bids cerrados y conserva vivos (Set y array)", () => {
    const urls = { "browser:1": "https://a.com", "browser:2": "https://b.com", "browser:3": "https://c.com" }
    expect(pruneBrowserUrls(urls, new Set(["browser:1", "browser:3"]))).toEqual({
      "browser:1": "https://a.com",
      "browser:3": "https://c.com",
    })
    expect(pruneBrowserUrls(urls, ["browser:2"])).toEqual({ "browser:2": "https://b.com" })
    expect(pruneBrowserUrls(urls, [])).toEqual({})
  })
})

// D8: tabs virtuales legacy (__design__ / __reports__ / __screenshots__).
// Ya no existe ningún creador de esas tabs: la vía viva de plugins externos es
// `plugin:external:*` (opendesign / screenshots). loadDesktopState las migra al
// cargar (filtra esos ids en sessions y tabStacks) siguiendo el patrón del prune
// de browserTabUrls; este bloque fija ese contrato de migración.
describe("loadDesktopState — migración de tabs virtuales legacy (D8)", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  const seed = (state: unknown) => {
    localStorage.setItem(DESKTOP_STATE_KEY, JSON.stringify(state))
  }

  it("elimina __design__/__reports__/__screenshots__ de sessions y tabStacks", () => {
    seed({
      layout: {
        cols: 1,
        rows: 1,
        sessions: ["__design__"],
        panelKinds: ["session"],
        panelIds: ["panel-legacy"],
        colSizes: [null],
        rowSizes: [null],
      },
      tabStacks: [["__design__", "__reports__", "__screenshots__"]],
    })
    const state = loadDesktopState(null)
    expect(state.tabStacks).toEqual([[]])
    expect(state.layout.sessions).toEqual([null])
    expect(state.layout.panelKinds).toEqual(["session"])
  })

  it("no deja panel vacío: si queda un tab vivo, la sesión cae en él", () => {
    seed({
      layout: {
        cols: 1,
        rows: 1,
        sessions: ["__design__"],
        panelKinds: ["session"],
        panelIds: ["panel-legacy"],
        colSizes: [null],
        rowSizes: [null],
      },
      tabStacks: [["__design__", "sesion-viva"]],
    })
    const state = loadDesktopState(null)
    expect(state.tabStacks).toEqual([["sesion-viva"]])
    expect(state.layout.sessions).toEqual(["sesion-viva"])
  })

  it("normaliza panelKinds desconocidos a session y poda los ids por panel", () => {
    seed({
      layout: {
        cols: 2,
        rows: 1,
        sessions: ["__reports__", "__screenshots__"],
        panelKinds: ["kind-desconocido", "session"],
        panelIds: ["a", "b"],
        colSizes: [null, null],
        rowSizes: [null],
      },
    })
    const state = loadDesktopState(null)
    expect(state.layout.panelKinds).toEqual(["session", "session"])
    expect(state.layout.sessions).toEqual([null, null])
    expect(state.tabStacks).toEqual([[], []])
  })

  it("formato anidado: saca el legacy y conserva el tab vivo seleccionado", () => {
    seed({
      layout: {
        cols: 1,
        rows: 1,
        sessions: [["__design__", "s1"]],
        panelKinds: ["session"],
        panelIds: ["p1"],
        colSizes: [null],
        rowSizes: [null],
      },
    })
    const state = loadDesktopState(null)
    expect(state.layout.sessions).toEqual(["s1"])
    expect(state.tabStacks).toEqual([["s1"]])
  })

  it("formato anidado con todos legacy cae al placeholder sin panel vacío", () => {
    seed({
      layout: {
        cols: 1,
        rows: 1,
        sessions: [["__design__", "__reports__", "__screenshots__"]],
        panelKinds: ["session"],
        panelIds: ["p1"],
        colSizes: [null],
        rowSizes: [null],
      },
    })
    const state = loadDesktopState(null)
    expect(state.layout.sessions).toEqual([null])
    expect(state.tabStacks).toEqual([[]])
  })

  it("formato anidado vacío queda en placeholder", () => {
    seed({
      layout: {
        cols: 1,
        rows: 1,
        sessions: [[]],
        panelKinds: ["session"],
        panelIds: ["p1"],
        colSizes: [null],
        rowSizes: [null],
      },
    })
    const state = loadDesktopState(null)
    expect(state.layout.sessions).toEqual([null])
    expect(state.tabStacks).toEqual([[]])
  })

  it("un panel browser con session legacy conserva su bId (no lo pisa el fallback)", () => {
    seed({
      layout: {
        cols: 1,
        rows: 1,
        sessions: ["__design__"],
        panelKinds: ["browser"],
        panelIds: ["p1"],
        colSizes: [null],
        rowSizes: [null],
      },
      tabStacks: [["s1"]],
    })
    const state = loadDesktopState(null)
    const bId = state.layout.sessions[0]
    expect(typeof bId).toBe("string")
    expect(bId).toMatch(/^browser:/)
    expect(state.layout.panelKinds).toEqual(["session"])
    expect(state.layout.sessions).toEqual([bId])
    expect(state.tabStacks?.[0]).toEqual(["s1", bId])
    expect((state.layout as any).browserTabUrls?.[bId as string]).toBe("https://www.google.com")
  })

  it("no toca los virtuals vivos (__learning__ / __kanban__)", () => {
    seed({
      layout: {
        cols: 1,
        rows: 2,
        sessions: ["__learning__", "__kanban__"],
        panelKinds: ["session", "session"],
        panelIds: ["a", "b"],
        colSizes: [null],
        rowSizes: [null, null],
      },
      tabStacks: [["__learning__"], ["__kanban__", "__screenshots__"]],
    })
    const state = loadDesktopState(null)
    expect(state.layout.sessions).toEqual(["__learning__", "__kanban__"])
    expect(state.tabStacks).toEqual([["__learning__"], ["__kanban__"]])
  })

  it("un layout sin tabs legacy no cambia", () => {
    seed({
      layout: {
        cols: 1,
        rows: 1,
        sessions: ["s1"],
        panelKinds: ["session"],
        panelIds: ["p1"],
        colSizes: [null],
        rowSizes: [null],
      },
      tabStacks: [["s1", "s2"]],
    })
    const state = loadDesktopState(null)
    expect(state.layout.sessions).toEqual(["s1"])
    expect(state.tabStacks).toEqual([["s1", "s2"]])
  })
})
