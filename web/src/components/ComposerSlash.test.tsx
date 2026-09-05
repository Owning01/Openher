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
  { name: "help", description: "Show help", source: "command" as const },
]

function renderComposer(onSend: (...args: any[]) => void, sessionID: string) {
  return render(
    <I18nProvider language="es">
      <Composer
        value=""
        commands={COMMANDS}
        onChange={() => {}}
        onSend={onSend as any}
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

function typeAndEnter(container: HTMLElement, text: string) {
  const ta = container.querySelector("textarea") as HTMLTextAreaElement
  fireEvent.change(ta, { target: { value: text } })
  fireEvent.keyDown(ta, { key: "Enter" })
  return ta
}

describe("Composer slash Enter", () => {
  it("comando exacto se envía al PRIMER Enter", () => {
    const onSend = vi.fn()
    const { container } = renderComposer(onSend, "slash-exact-1")
    typeAndEnter(container, "/compact")
    expect(onSend).toHaveBeenCalledTimes(1)
    expect(onSend.mock.calls[0][2]).toBe("/compact")
  })

  it("comando exacto con args se envía al primer Enter", () => {
    const onSend = vi.fn()
    const { container } = renderComposer(onSend, "slash-args-1")
    typeAndEnter(container, "/compact foco en auth")
    expect(onSend).toHaveBeenCalledTimes(1)
    expect(onSend.mock.calls[0][2]).toBe("/compact foco en auth")
  })

  it("prefijo parcial autocompleta con Enter y envía con el siguiente", () => {
    const onSend = vi.fn()
    const { container } = renderComposer(onSend, "slash-partial-1")
    const ta = container.querySelector("textarea") as HTMLTextAreaElement
    fireEvent.change(ta, { target: { value: "/comp" } })
    fireEvent.keyDown(ta, { key: "Enter" })
    expect(onSend).not.toHaveBeenCalled()
    expect(ta.value).toBe("/compact ")
    fireEvent.keyDown(ta, { key: "Enter" })
    expect(onSend).toHaveBeenCalledTimes(1)
  })

  it("texto normal sigue enviándose al primer Enter", () => {
    const onSend = vi.fn()
    const { container } = renderComposer(onSend, "slash-normal-1")
    typeAndEnter(container, "hola mundo")
    expect(onSend).toHaveBeenCalledTimes(1)
  })
})
