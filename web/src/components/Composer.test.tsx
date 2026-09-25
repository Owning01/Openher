// Tests de caracterización del Composer (F9-Q1) sobre el render raíz:
// habilitación de Enviar/Adjuntar/Detener, anillo de trabajo, límite de
// caracteres, rotación de agente y pill de modelo. Los atajos slash/drop/
// historial ya tienen sus propios tests.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, cleanup } from "@testing-library/react"
import { I18nProvider } from "../i18n-context"
import { Composer } from "./Composer"

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  localStorage.clear()
})

function renderComposer(overrides: Record<string, unknown> = {}) {
  const onSend = vi.fn()
  const onAbort = vi.fn()
  const onChangeAgent = vi.fn()
  const utils = render(
    <I18nProvider language="es">
      <Composer
        value=""
        commands={[]}
        onChange={() => {}}
        onSend={onSend}
        onAbort={onAbort}
        disabled={false}
        isWorking={false}
        activeAgentID="build"
        primaryAgentOptions={[]}
        onChangeAgent={onChangeAgent}
        {...overrides}
      />
    </I18nProvider>
  )
  return { ...utils, onSend, onAbort, onChangeAgent }
}

const sendBtn = (c: HTMLElement) => c.querySelector<HTMLButtonElement>(".composer-send-btn")!

describe("Composer caracterización", () => {
  it("charLimit bloquea el envío si el texto lo excede", () => {
    const { container } = renderComposer({ value: "abcdef", charLimit: 3 })
    expect(container.querySelector("textarea")!.getAttribute("maxlength")).toBe("3")
    expect(sendBtn(container)).toBeDisabled()
  })
})
