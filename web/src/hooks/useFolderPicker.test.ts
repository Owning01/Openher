import { describe, it, expect } from "vitest"
import { dirParent, dirParts, partsToDir, toAbsolute } from "./useFolderPicker"

describe("dirParent", () => {
  it("raíces devuelven null", () => {
    expect(dirParent("")).toBeNull()
    expect(dirParent("/")).toBeNull()
    expect(dirParent("C:\\")).toBeNull()
    expect(dirParent("C:/")).toBeNull()
    expect(dirParent("D:")).toBeNull()
  })
  it("rutas relativas sin raíz devuelven null", () => {
    expect(dirParent("proyectos")).toBeNull()
    expect(dirParent("a/b")).toBeNull()
  })
  it("windows sube un nivel con backslashes", () => {
    expect(dirParent("C:\\a\\b")).toBe("C:\\a")
    expect(dirParent("C:\\a")).toBe("C:\\")
    expect(dirParent("C:\\a\\b\\")).toBe("C:\\a")
  })
  it("unix sube un nivel", () => {
    expect(dirParent("/a/b")).toBe("/a")
    expect(dirParent("/a")).toBe("/")
    expect(dirParent("/a/b/")).toBe("/a")
  })
})

describe("dirParts", () => {
  it("vacío y raíz", () => {
    expect(dirParts("")).toEqual([])
    expect(dirParts("/")).toEqual(["/"])
  })
  it("windows separa unidad y segmentos", () => {
    expect(dirParts("C:\\")).toEqual(["C:"])
    expect(dirParts("C:\\a\\b")).toEqual(["C:", "a", "b"])
    expect(dirParts("C:/a/b/")).toEqual(["C:", "a", "b"])
  })
  it("unix ignora trailing slashes", () => {
    expect(dirParts("/a/b/")).toEqual(["a", "b"])
  })
})

describe("partsToDir", () => {
  it("casos base", () => {
    expect(partsToDir([])).toBe("")
    expect(partsToDir(["/"])).toBe("/")
  })
  it("reconstruye unidad windows", () => {
    expect(partsToDir(["C:"])).toBe("C:\\")
    expect(partsToDir(["C:", "a", "b"])).toBe("C:\\a\\b")
  })
  it("reconstruye unix", () => {
    expect(partsToDir(["a", "b"])).toBe("/a/b")
  })
  it("roundtrip con dirParts", () => {
    expect(partsToDir(dirParts("C:\\a\\b"))).toBe("C:\\a\\b")
    expect(partsToDir(dirParts("/a/b"))).toBe("/a/b")
  })
})

describe("toAbsolute", () => {
  it("manual vacío conserva el dir", () => {
    expect(toAbsolute("C:\\a", "  ")).toBe("C:\\a")
  })
  it("acepta unidad sola y rutas absolutas windows", () => {
    expect(toAbsolute("C:\\a", "D:")).toBe("D:\\")
    expect(toAbsolute("C:\\a", "D:\\x\\y")).toBe("D:\\x\\y")
    expect(toAbsolute("C:\\a", "D:/x/y")).toBe("D:\\x\\y")
  })
  it("acepta absolutas unix", () => {
    expect(toAbsolute("/a/b", "/x/y")).toBe("/x/y")
  })
  it("resuelve relativas contra el dir (windows y unix)", () => {
    expect(toAbsolute("C:\\a", "sub")).toBe("C:\\a\\sub")
    expect(toAbsolute("/a/b", "sub")).toBe("/a/b/sub")
  })
  it("resuelve .. client-side (el server los rechaza con 500)", () => {
    expect(toAbsolute("/a/b", "..")).toBe("/a")
    expect(toAbsolute("C:\\a\\b", "..")).toBe("C:\\a")
    expect(toAbsolute("/a/b", "sub/../c")).toBe("/a/b/c")
    expect(toAbsolute("/a/b", ".")).toBe("/a/b")
  })
  it(".. nunca escapa de la unidad ni de la raíz", () => {
    expect(toAbsolute("C:\\a", "..\\..\\..")).toBe("C:\\")
    expect(toAbsolute("/a", "../../..")).toBe("/")
  })
})
