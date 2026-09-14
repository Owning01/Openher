import { describe, it, expect, vi, afterEach } from "vitest"
import { render, fireEvent, cleanup } from "@testing-library/react"
import { I18nProvider } from "../../i18n-context"
import { StudioZones } from "./StudioZones"

afterEach(() => cleanup())

function annotation(over: Record<string, unknown>) {
  return {
    id: "a1",
    tag: "button",
    selector: ".cta",
    outerHTML: "<button class='cta'>Comenzar</button>",
    innerText: "Comenzar",
    boundingRect: { x: 0, y: 0, w: 10, h: 10 },
    url: "http://127.0.0.1:5173/",
    comment: "",
    timestamp: 1,
    ...over,
  } as any
}

function renderZones(props: Partial<Parameters<typeof StudioZones>[0]> = {}) {
  const base = { annotations: [] as any[], onRemove: vi.fn(), onComment: vi.fn() }
  const merged = { ...base, ...props }
  return render(
    <I18nProvider language="en">
      <StudioZones {...merged} />
    </I18nProvider>
  )
}

describe("StudioZones", () => {
  it("muestra el archivo:línea de cada zona", () => {
    const { container } = renderZones({
      annotations: [annotation({ source: { file: "src/hero.tsx", line: 24 } })],
    })
    expect(container.textContent).toContain("hero.tsx:24")
  })

  it("sin zonas no renderiza tarjetas", () => {
    const { container } = renderZones({ annotations: [] })
    expect(container.querySelector("textarea")).toBeNull()
  })

  it("quitar una zona llama onRemove con su id", () => {
    const onRemove = vi.fn()
    const { container } = renderZones({
      annotations: [annotation({ id: "z9", source: { file: "a.tsx", line: 1 } })],
      onRemove,
    })
    const buttons = container.querySelectorAll("button")
    fireEvent.click(buttons[0]!)
    expect(onRemove).toHaveBeenCalledWith("z9")
  })

  it("editar la nota llama onComment con id y texto", () => {
    const onComment = vi.fn()
    const { container } = renderZones({
      annotations: [annotation({ id: "z1", source: { file: "a.tsx", line: 2 } })],
      onComment,
    })
    const textarea = container.querySelector("textarea")!
    fireEvent.change(textarea, { target: { value: "más grande" } })
    expect(onComment).toHaveBeenCalledWith("z1", "más grande")
  })
})
