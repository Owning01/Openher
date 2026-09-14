import { describe, it, expect } from "vitest"
import { joinFsPath, toFileEntryV2 } from "./mappers"

describe("joinFsPath", () => {
  it("une relativo a un base Windows con backslash", () => {
    expect(joinFsPath("C:\\Users\\perca", ".config")).toBe("C:\\Users\\perca\\.config")
    expect(joinFsPath("C:\\Users\\perca\\", "AppData\\Local")).toBe("C:\\Users\\perca\\AppData\\Local")
  })

  it("respeta base Unix", () => {
    expect(joinFsPath("/home/me", "proj")).toBe("/home/me/proj")
  })

  it("devuelve el path si ya es absoluto", () => {
    expect(joinFsPath("C:\\a", "D:\\x")).toBe("D:\\x")
    expect(joinFsPath("C:\\a", "/root")).toBe("/root")
  })

  it("sin base devuelve el relativo tal cual", () => {
    expect(joinFsPath(undefined, "sub")).toBe("sub")
    expect(joinFsPath(undefined, "")).toBe("")
  })

  it("normaliza separadores del relativo al estilo del base", () => {
    expect(joinFsPath("C:\\a", "b/c")).toBe("C:\\a\\b\\c")
  })
})

describe("toFileEntryV2", () => {
  it("convierte un directorio relativo del server en entrada ABSOLUTA", () => {
    expect(toFileEntryV2("C:\\Users\\perca", { path: ".config\\", type: "directory" })).toEqual({
      name: ".config",
      path: ".config",
      absolute: "C:\\Users\\perca\\.config",
      type: "directory",
    })
  })

  it("archivos sin separador final", () => {
    expect(toFileEntryV2("/home/me", { path: "notes.md", type: "file" })).toEqual({
      name: "notes.md",
      path: "notes.md",
      absolute: "/home/me/notes.md",
      type: "file",
    })
  })

  it("no ancla si el path ya es absoluto", () => {
    expect(toFileEntryV2("C:\\a", { path: "D:\\x\\y\\", type: "directory" }).absolute).toBe("D:\\x\\y")
  })
})
