import { describe, it, expect, afterEach, vi } from "vitest"
import { render, cleanup } from "@testing-library/react"
import { I18nProvider } from "../i18n-context"
import { Composer } from "./Composer"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
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

  it("fase alineada al reloj: el delay equivale a -(Date.now()%3500)/1000", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000)
    const { container } = renderComposer(true)
    const ring = container.querySelector(".composer-ring") as HTMLElement
    expect(ring.style.getPropertyValue("--ring-delay")).toBe(`-${((1_000_000 % 3500) / 1000).toFixed(3)}s`)
  })

  it("dos sesiones activadas en distinto momento comparten fase del ciclo", () => {
    const t0 = 2_000_000
    vi.spyOn(Date, "now").mockReturnValue(t0)
    const first = renderComposer(true)
    const d1 = (first.container.querySelector(".composer-ring") as HTMLElement).style.getPropertyValue("--ring-delay")
    first.unmount()
    cleanup()
    // 1200ms después: otro punto del ciclo, pero misma fase relativa al reloj.
    vi.spyOn(Date, "now").mockReturnValue(t0 + 1200)
    const second = renderComposer(true)
    const d2 = (second.container.querySelector(".composer-ring") as HTMLElement).style.getPropertyValue("--ring-delay")
    expect(d2).toBe(`-${(((t0 + 1200) % 3500) / 1000).toFixed(3)}s`)
    // Un periodo completo después: idéntico delay (misma fase).
    second.unmount()
    cleanup()
    vi.spyOn(Date, "now").mockReturnValue(t0 + 3500)
    const third = renderComposer(true)
    const d3 = (third.container.querySelector(".composer-ring") as HTMLElement).style.getPropertyValue("--ring-delay")
    expect(d3).toBe(d1)
  })
})
