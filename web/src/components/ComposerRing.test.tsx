import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react"
import { I18nProvider } from "../i18n-context"
import { Composer } from "./Composer"

vi.useFakeTimers()

afterEach(() => {
  cleanup()
  vi.clearAllTimers()
})

function renderComposer(isWorking = false) {
  return render(
    <I18nProvider language="es">
      <Composer
        value=""
        commands={[]}
        onChange={() => {}}
        onSend={() => {}}
        onAbort={() => {}}
        disabled={false}
        isWorking={isWorking}
        activeAgentID="build"
        primaryAgentOptions={[]}
        onChangeAgent={() => {}}
      />
    </I18nProvider>,
  )
}

describe("Composer sending ring (preview)", () => {
  it("sin envío no hay anillo pero sí botón de vista previa", () => {
    const { container } = renderComposer(false)
    expect(container.querySelector(".composer-input-wrap.is-working")).toBeNull()
    expect(screen.getByLabelText("Vista previa del anillo de envío")).not.toBeNull()
  })

  it("el ojo activa el anillo 8s sin mandar nada", () => {
    const onSend = vi.fn()
    const { container } = render(
      <I18nProvider language="es">
        <Composer
          value=""
          commands={[]}
          onChange={() => {}}
          onSend={onSend}
          onAbort={() => {}}
          disabled={false}
          isWorking={false}
          activeAgentID="build"
          primaryAgentOptions={[]}
          onChangeAgent={() => {}}
        />
      </I18nProvider>,
    )
    fireEvent.click(screen.getByLabelText("Vista previa del anillo de envío"))
    expect(container.querySelector(".composer-input-wrap.is-working")).not.toBeNull()
    expect(onSend).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(8000)
    })
    expect(container.querySelector(".composer-input-wrap.is-working")).toBeNull()
  })

  it("con envío real el anillo va puesto", () => {
    const { container } = renderComposer(true)
    expect(container.querySelector(".composer-input-wrap.is-working")).not.toBeNull()
  })
})
