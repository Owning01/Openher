import { describe, it, expect, afterEach, vi } from "vitest"
import { render, cleanup, fireEvent } from "@testing-library/react"
import { I18nProvider } from "../i18n-context"
import { Composer } from "./Composer"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
})

const COMMANDS: Array<{ name: string; description: string; source: "command" }> = []

function renderComposer(sessionID: string, onSend: (...args: never[]) => void) {
  return render(
    <I18nProvider language="es">
      <Composer
        value=""
        commands={COMMANDS}
        onChange={() => {}}
        onSend={onSend as never}
        onAbort={() => {}}
        disabled={false}
        isWorking={false}
        activeAgentID="build"
        primaryAgentOptions={[]}
        onChangeAgent={() => {}}
        sessionID={sessionID}
      />
    </I18nProvider>,
  )
}

function ta(container: HTMLElement): HTMLTextAreaElement {
  return container.querySelector("textarea") as HTMLTextAreaElement
}

// Regresión: las flechas ↑/↓ mostraban prompts de TODAS las sesiones (key
// global). Ahora el historial es por sesión.
describe("Composer historial por sesión", () => {
  it("↑ en otra sesión no muestra lo enviado en la primera", () => {
    const { container, rerender } = renderComposer("sess-A-hist", vi.fn())
    fireEvent.change(ta(container), { target: { value: "prompt de A" } })
    fireEvent.keyDown(ta(container), { key: "Enter" })

    rerender(
      <I18nProvider language="es">
        <Composer
          value=""
          commands={COMMANDS}
          onChange={() => {}}
          onSend={vi.fn() as never}
          onAbort={() => {}}
          disabled={false}
          isWorking={false}
          activeAgentID="build"
          primaryAgentOptions={[]}
          onChangeAgent={() => {}}
          sessionID="sess-B-hist"
        />
      </I18nProvider>,
    )
    fireEvent.keyDown(ta(container), { key: "ArrowUp" })
    expect(ta(container).value).toBe("")
  })

  it("al volver a la sesión recupera su propio historial", () => {
    const onSend = vi.fn()
    const first = renderComposer("sess-C-hist", onSend)
    fireEvent.change(ta(first.container), { target: { value: "prompt de C" } })
    fireEvent.keyDown(ta(first.container), { key: "Enter" })
    expect(onSend).toHaveBeenCalledTimes(1)
    first.unmount()

    renderComposer("sess-D-hist", vi.fn())

    const back = renderComposer("sess-C-hist", vi.fn())
    fireEvent.keyDown(ta(back.container), { key: "ArrowUp" })
    expect(ta(back.container).value).toBe("prompt de C")
  })
})
