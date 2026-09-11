import { describe, it, expect } from "vitest"
import { toolPartFileDiff } from "./toolFileDiff"

describe("toolPartFileDiff", () => {
  it("usa metadata.files con patch y coercea strings a número", () => {
    const r = toolPartFileDiff({
      tool: "edit",
      state: {
        input: { path: "G:\\proj\\web\\vite.config.ts" },
        metadata: { files: [{ file: "web/vite.config.ts", patch: "@@ -1,2 +1,2 @@\n a\n-b\n+c", additions: "2", deletions: "3" }] },
      },
    })
    expect(r).not.toBeNull()
    expect(r!.file).toBe("web/vite.config.ts")
    expect(r!.additions).toBe(2)
    expect(r!.deletions).toBe(3)
    expect(r!.patch).toContain("-b")
  })

  it("sintetiza desde old/newString (edit sin patch del server)", () => {
    const r = toolPartFileDiff({
      tool: "edit",
      state: { input: { path: "x.ts", oldString: "a\nb", newString: "a\nc" }, metadata: {} },
    })
    expect(r).not.toBeNull()
    expect(r!.file).toBe("x.ts")
    expect(r!.additions).toBe(1)
    expect(r!.deletions).toBe(1)
    expect(r!.patch).toContain("@@")
  })

  it("sintetiza write desde content", () => {
    const r = toolPartFileDiff({
      tool: "write",
      state: { input: { filePath: "nuevo.ts", content: "l1\nl2\nl3" }, metadata: {} },
    })
    expect(r).not.toBeNull()
    expect(r!.additions).toBe(3)
    expect(r!.deletions).toBe(0)
  })

  it("ignora tools que no son de archivo", () => {
    expect(toolPartFileDiff({ tool: "bash", state: { input: { command: "ls" } } })).toBeNull()
    expect(toolPartFileDiff({ tool: null, state: null })).toBeNull()
  })

  it("edit sin datos útiles devuelve null", () => {
    expect(toolPartFileDiff({ tool: "edit", state: { input: {}, metadata: {} } })).toBeNull()
  })
})
