import { describe, it, expect, afterEach, vi } from "vitest"
import { render, cleanup, fireEvent } from "@testing-library/react"
import { I18nProvider } from "../i18n-context"
import { Composer } from "./Composer"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const COMMANDS = [
  { name: "compact", description: "Compact history", source: "command" as const },
]

function renderComposer() {
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
        sessionID="drop-repro-1"
      />
    </I18nProvider>,
  )
}

function fakeDT(path: string) {
  return {
    files: [],
    types: ["application/x-opencode-path", "text/plain"],
    getData: (t: string) => (t === "application/x-opencode-path" || t === "text/plain" ? path : ""),
  }
}

describe("Composer drop file", () => {
  it("drop interno con x-opencode-path agrega la ruta al composer", () => {
    const { container } = renderComposer()
    const wrap = container.querySelector(".composer-input-wrap") as HTMLElement
    fireEvent.drop(wrap, { dataTransfer: fakeDT("C:\\proj\\app.ts") })
    const ta = container.querySelector("textarea") as HTMLTextAreaElement
    expect(ta.value).toContain("app.ts")
  })

  it("evento plugin:insert-text agrega el detalle al composer", () => {
    const { container } = renderComposer()
    window.dispatchEvent(new CustomEvent("plugin:insert-text", { detail: "C:\\proj\\app.ts" }))
    const ta = container.querySelector("textarea") as HTMLTextAreaElement
    expect(ta.value).toContain("app.ts")
  })

  it("dragover con effectAllowed move ofrece move (si fuerza copy el navegador no dispara drop)", () => {
    const { container } = renderComposer()
    const wrap = container.querySelector(".composer-input-wrap") as HTMLElement
    const dt = { files: [], types: ["text/plain"], effectAllowed: "move", dropEffect: "none" as string }
    fireEvent.dragOver(wrap, { dataTransfer: dt })
    expect(dt.dropEffect).toBe("move")
  })

  it("dragover con effectAllowed copy ofrece copy (archivos del SO)", () => {
    const { container } = renderComposer()
    const wrap = container.querySelector(".composer-input-wrap") as HTMLElement
    const dt = { files: [{ name: "a.png" }], types: ["Files"], effectAllowed: "all", dropEffect: "none" as string }
    fireEvent.dragOver(wrap, { dataTransfer: dt })
    expect(dt.dropEffect).toBe("copy")
  })
})
