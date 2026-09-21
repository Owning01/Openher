// Tests de caracterización del Composer (F9-Q1) sobre el render raíz:
// habilitación de Enviar/Adjuntar/Detener, anillo de trabajo, límite de
// caracteres, rotación de agente y pill de modelo. Los atajos slash/drop/
// historial ya tienen sus propios tests.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
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
const stopBtn = (c: HTMLElement) => c.querySelector<HTMLButtonElement>(".composer-stop-btn")

describe("Composer caracterización", () => {
  it("vacío: Enviar deshabilitado y sin botón Detener", () => {
    const { container } = renderComposer()
    expect(sendBtn(container)).toBeDisabled()
    expect(stopBtn(container)).toBeNull()
    expect(container.querySelector(".composer-ring")).toBeNull()
  })

  it("con texto habilita Enviar y onSend recibe el texto", async () => {
    const { container, onSend } = renderComposer({ value: "hola" })
    expect(sendBtn(container)).not.toBeDisabled()
    fireEvent.click(sendBtn(container))
    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1))
    expect(onSend.mock.calls[0][2]).toBe("hola")
  })

  it("isWorking muestra anillo + Detener (y permite encolar envío)", () => {
    const { container, onAbort } = renderComposer({ value: "siguiente", isWorking: true })
    expect(container.querySelector(".composer-ring")).toBeTruthy()
    const stop = stopBtn(container)
    expect(stop).toBeTruthy()
    fireEvent.click(stop!)
    expect(onAbort).toHaveBeenCalledTimes(1)
    expect(sendBtn(container)).not.toBeDisabled()
  })

  it("disabled bloquea textarea, adjuntar y enviar", () => {
    const { container } = renderComposer({ value: "x", disabled: true })
    expect(container.querySelector("textarea")).toBeDisabled()
    expect(sendBtn(container)).toBeDisabled()
    expect(container.querySelector(".composer-img-btn")).toBeDisabled()
  })

  it("charLimit bloquea el envío si el texto lo excede", () => {
    const { container } = renderComposer({ value: "abcdef", charLimit: 3 })
    expect(container.querySelector("textarea")!.getAttribute("maxlength")).toBe("3")
    expect(sendBtn(container)).toBeDisabled()
  })

  it("con más de un agente primario, el toggle rota al siguiente", () => {
    const { container, onChangeAgent } = renderComposer({
      primaryAgentOptions: [
        { id: "build", name: "Build", mode: "primary" },
        { id: "plan", name: "Plan", mode: "primary" },
      ],
    })
    const toggle = container.querySelector<HTMLButtonElement>(".agent-toggle")!
    expect(toggle.textContent).toContain("Build")
    fireEvent.click(toggle)
    expect(onChangeAgent).toHaveBeenCalledWith("plan")
  })

  it("muestra la pill del modelo activo", () => {
    const { container } = renderComposer({
      activeModelOption: { providerID: "p", modelID: "m", modelName: "Kimi K3" },
    })
    const pill = container.querySelector(".composer-model-pill")
    expect(pill?.textContent).toContain("Kimi K3")
  })
})
