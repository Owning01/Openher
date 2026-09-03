import { describe, it, expect } from "vitest"
import { normFsPath, parentDirOf, affectedParentDirs } from "./fsChanges"

describe("normFsPath", () => {
  it("unifica separadores, case y trailing", () => {
    expect(normFsPath("C:/Proyectos/a/")).toBe("c:\\proyectos\\a")
    expect(normFsPath("c:\\Proyectos\\A")).toBe("c:\\proyectos\\a")
  })
})

describe("parentDirOf", () => {
  it("devuelve el padre normalizado", () => {
    expect(parentDirOf("C:\\a\\nuevo.txt")).toBe("c:\\a")
    expect(parentDirOf("c:/a/b/")).toBe("c:\\a")
  })
})

describe("affectedParentDirs", () => {
  it("solo create/remove, dedup", () => {
    const dirs = affectedParentDirs([
      { seq: 1, path: "C:\\a\\1.txt", kind: "create" },
      { seq: 2, path: "C:\\a\\2.txt", kind: "modify" },
      { seq: 3, path: "C:\\a\\3.txt", kind: "remove" },
      { seq: 4, path: "C:\\a\\4.txt", kind: "create" },
      { seq: 5, path: "", kind: "create" },
    ])
    expect(dirs).toEqual(["c:\\a"])
  })
})
