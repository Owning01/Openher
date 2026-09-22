import { describe, it, expect, beforeEach } from "vitest"
import { diffRowLine, formatDiffNotes, type DiffNote } from "./diffAnnotations"
import { composerInjectStore, injectToComposer, takeComposerInjections } from "../stores/composerInjectStore"

describe("diffRowLine", () => {
  it("usa la línea nueva; cae a la vieja si no hay", () => {
    expect(diffRowLine({ newLine: 12, oldLine: 9 })).toBe(12)
    expect(diffRowLine({ newLine: null, oldLine: 9 })).toBe(9)
    expect(diffRowLine({})).toBe(0)
  })
})

describe("formatDiffNotes", () => {
  it("arma el bloque con archivo, línea y cita del código", () => {
    const notes: DiffNote[] = [{ file: "src/app.ts", line: 42, code: "const x = 1", note: "usá el store" }]
    const out = formatDiffNotes(notes)
    expect(out).toContain("Comentarios sobre el diff")
    expect(out).toContain("- src/app.ts:42 — usá el store")
    expect(out).toContain("`const x = 1`")
  })

  it("sin archivo usa 'línea N' y omite la cita si no hay código", () => {
    const out = formatDiffNotes([{ line: 7, note: "esto sobra" }])
    expect(out).toContain("- línea 7 — esto sobra")
    expect(out).not.toContain("`")
  })

  it("ignora notas vacías y devuelve \"\" si no queda nada", () => {
    expect(formatDiffNotes([{ line: 1, note: "   " }])).toBe("")
    expect(formatDiffNotes([])).toBe("")
  })
})

describe("composerInjectStore", () => {
  beforeEach(() => {
    composerInjectStore.set([])
  })

  it("encola, une y limpia", () => {
    injectToComposer("uno")
    injectToComposer("dos")
    expect(takeComposerInjections()).toBe("uno\n\ndos")
    expect(composerInjectStore.get()).toEqual([])
    expect(takeComposerInjections()).toBe("")
  })

  it("ignora vacíos", () => {
    injectToComposer("   ")
    expect(composerInjectStore.get()).toEqual([])
  })
})
