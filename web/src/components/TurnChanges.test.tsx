import { describe, it, expect, afterEach, vi } from "vitest"
import { render, cleanup, fireEvent } from "@testing-library/react"
import { I18nProvider } from "../i18n-context"
import { Composer } from "./Composer"
import { groupTurnDiffs } from "../utils/rendered"
import type { RenderedMessage } from "../types"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

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

const COMMANDS = [
  { name: "compact", description: "Compact history", source: "command" as const },
]

function renderComposer(turnChanges: never) {
  return render(
    <I18nProvider language="es">
      <Composer
        value=""
        commands={COMMANDS}
        onChange={() => {}}
        onSend={vi.fn() as any}
        onAbort={() => {}}
        disabled={false}
        isWorking={false}
        activeAgentID="build"
        primaryAgentOptions={[]}
        onChangeAgent={() => {}}
        sessionID="turn-test-1"
        turnChanges={turnChanges}
      />
    </I18nProvider>,
  )
}

const TURNS = groupTurnDiffs([
  rm("u1", "user", "Primer cambio"),
  rm("a1", "assistant", "ok", [{ file: "a.ts", additions: 10, deletions: 2, patch: "@@ -1,1 +1,1 @@\n-old\n+new" }]),
  rm("u2", "user", "Segundo cambio"),
  rm("a2", "assistant", "ok", [{ file: "b.ts", additions: 5, deletions: 5 }]),
]) as never

describe("Composer turn changes", () => {
  it("sin turnos no muestra el botón", () => {
    const { container } = renderComposer([] as never)
    expect(container.querySelector(".turn-changes-btn")).toBeNull()
  })

  it("muestra totales del último turno y despliega el listado", () => {
    const { container } = renderComposer(TURNS)
    const btn = container.querySelector(".turn-changes-btn") as HTMLElement
    expect(btn).not.toBeNull()
    expect(btn.textContent).toContain("1 archivo")
    expect(btn.textContent).toContain("+5")
    fireEvent.click(btn)
    const panel = container.querySelector(".turn-changes-panel") as HTMLElement
    expect(panel).not.toBeNull()
    expect(panel.textContent).toContain("b.ts")
    expect(panel.textContent).toContain("2/2")
  })

  it("pager navega al turno anterior y la fila expande el diff", () => {
    const { container } = renderComposer(TURNS)
    fireEvent.click(container.querySelector(".turn-changes-btn")!)
    const panel = container.querySelector(".turn-changes-panel") as HTMLElement
    const prev = panel.querySelector('.turn-pager button[aria-label="Turno anterior"]') as HTMLElement
    fireEvent.click(prev)
    expect(panel.textContent).toContain("a.ts")
    expect(panel.textContent).toContain("1/2")
    const row = panel.querySelector(".turn-file-row") as HTMLElement
    fireEvent.click(row)
    expect(panel.querySelector(".turn-patch")).not.toBeNull()
  })

  it("Escape cierra el panel", () => {
    const { container } = renderComposer(TURNS)
    fireEvent.click(container.querySelector(".turn-changes-btn")!)
    expect(container.querySelector(".turn-changes-panel")).not.toBeNull()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(container.querySelector(".turn-changes-panel")).toBeNull()
  })
})
