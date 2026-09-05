import { describe, it, expect, afterEach } from "vitest"
import { render, cleanup } from "@testing-library/react"
import { I18nProvider } from "../i18n-context"
import { Composer } from "./Composer"

afterEach(() => {
  cleanup()
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

describe("Composer sending ring", () => {
  it("sin envío no hay anillo", () => {
    const { container } = renderComposer(false)
    expect(container.querySelector(".composer-input-wrap.is-working")).toBeNull()
    expect(container.querySelector(".composer-ring")).toBeNull()
  })

  it("con envío el anillo violeta 360° va puesto (glow + band)", () => {
    const { container } = renderComposer(true)
    expect(container.querySelector(".composer-input-wrap.is-working")).not.toBeNull()
    expect(container.querySelector(".composer-ring")).not.toBeNull()
    expect(container.querySelector(".composer-ring-glow")).not.toBeNull()
    expect(container.querySelector(".composer-ring-band")).not.toBeNull()
  })
})
