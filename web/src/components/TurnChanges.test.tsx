import { describe, it, expect } from "vitest"
import { groupTurnDiffs } from "../utils/rendered"
import type { RenderedMessage } from "../types"

function rm(id: string, role: string, text: string, diffs: Array<{ file: string; additions: number; deletions: number; patch?: string }> = [], toolParts: never[] = []): RenderedMessage {
  return {
    info: { id, role, sessionID: "s1", time: { created: 1 } },
    parts: [],
    text,
    hasCompaction: false,
    thinkingParts: [],
    toolParts: toolParts as never,
    summaryDiffs: diffs as never,
  } as never
}

function tp(tool: string, state: unknown): never {
  return { id: `tp-${tool}`, type: "tool", tool, state } as never
}

describe("groupTurnDiffs", () => {
  it("agrupa diffs del turno y fusiona archivos repetidos", () => {
    const out = groupTurnDiffs([
      rm("u1", "user", "Agrega el botón"),
      rm("a1", "assistant", "listo", [{ file: "a.ts", additions: 10, deletions: 2 }]),
      rm("a2", "assistant", "más", [{ file: "a.ts", additions: 5, deletions: 1, patch: "P2" }, { file: "b.ts", additions: 3, deletions: 0 }]),
    ])
    expect(out.length).toBe(1)
    expect(out[0].label).toBe("Agrega el botón")
    expect(out[0].files.length).toBe(2)
    const a = out[0].files.find((f) => f.file === "a.ts")!
    expect(a.additions).toBe(15)
    expect(a.deletions).toBe(3)
    expect(a.patch).toBe("P2")
  })

  it("cada prompt user abre un turno; turnos sin archivos se excluyen", () => {
    const out = groupTurnDiffs([
      rm("u1", "user", "Hola sin cambios"),
      rm("a1", "assistant", "hola"),
      rm("u2", "user", "Cambia x"),
      rm("a2", "assistant", "ok", [{ file: "x.ts", additions: 1, deletions: 1 }]),
    ])
    expect(out.length).toBe(1)
    expect(out[0].label).toBe("Cambia x")
  })

  it("label largo se trunca a 80 chars", () => {
    const out = groupTurnDiffs([
      rm("u1", "user", "x".repeat(200)),
      rm("a1", "assistant", "ok", [{ file: "x.ts", additions: 1, deletions: 0 }]),
    ])
    expect(out[0].label.length).toBeLessThanOrEqual(81)
  })

  it("deriva archivos de tool parts cuando no hay summaryDiffs (opencode v2)", () => {
    const out = groupTurnDiffs([
      rm("u1", "user", "Cambia vite"),
      rm("a1", "assistant", "", [], [
        tp("edit", {
          input: { path: "G:\\proj\\web\\vite.config.ts", oldString: "a\nb", newString: "a\nc" },
          metadata: { files: [{ file: "web/vite.config.ts", patch: "@@ -1,2 +1,2 @@\n a\n-b\n+c", additions: "1", deletions: "1" }] },
        }),
        tp("read", { input: { path: "x.ts" } }),
      ]),
    ])
    expect(out.length).toBe(1)
    expect(out[0].files.length).toBe(1)
    expect(out[0].files[0].file).toBe("web/vite.config.ts")
    expect(out[0].files[0].additions).toBe(1)
    expect(out[0].files[0].deletions).toBe(1)
    expect(out[0].files[0].patch).toContain("-b")
  })

  it("sintetiza patch desde old/newString si el server no manda patch", () => {
    const out = groupTurnDiffs([
      rm("u1", "user", "Edita"),
      rm("a1", "assistant", "", [], [
        tp("edit", { input: { path: "x.ts", oldString: "a", newString: "b" }, metadata: {} }),
      ]),
    ])
    expect(out.length).toBe(1)
    expect(out[0].files[0].patch).toContain("@@")
  })

  it("prefiere summaryDiffs del server sobre tool parts del mismo mensaje", () => {
    const out = groupTurnDiffs([
      rm("u1", "user", "Cambia"),
      rm("a1", "assistant", "ok", [{ file: "srv.ts", additions: 7, deletions: 0 }], [
        tp("edit", { input: { path: "other.ts", oldString: "a", newString: "b" }, metadata: {} }),
      ]),
    ])
    expect(out.length).toBe(1)
    expect(out[0].files.length).toBe(1)
    expect(out[0].files[0].file).toBe("srv.ts")
  })
})
