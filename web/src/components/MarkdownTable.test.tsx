import { describe, it, expect, afterEach } from "vitest"
import { render, cleanup } from "@testing-library/react"
import { Markdown } from "./Markdown"

// Tablas del chat: hasta 3 columnas entran en el ancho del mensaje; de 4 en
// adelante la tabla se marca para scrollear en horizontal (`.table-wrap-scroll`,
// que chat.css hace `overflow-x: auto`) en vez de aplastar las celdas.

function table(cols: number): string {
  const head = `| ${Array.from({ length: cols }, (_, i) => `H${i + 1}`).join(" | ")} |`
  const sep = `| ${Array.from({ length: cols }, () => "---").join(" | ")} |`
  const row = `| ${Array.from({ length: cols }, (_, i) => `c${i + 1}`).join(" | ")} |`
  return `${head}\n${sep}\n${row}`
}

const wrap = (container: HTMLElement) => container.querySelector(".message-content .table-wrap, .table-wrap")

afterEach(() => cleanup())

describe("tablas en el chat: scroll horizontal", () => {
  it("3 columnas: tabla normal, sin scroll", () => {
    const { container } = render(<Markdown text={table(3)} />)
    const el = wrap(container)!
    expect(el).toBeTruthy()
    expect(el.classList.contains("table-wrap-scroll")).toBe(false)
  })

  it("4 columnas: se marca para scroll horizontal", () => {
    const { container } = render(<Markdown text={table(4)} />)
    expect(wrap(container)!.classList.contains("table-wrap-scroll")).toBe(true)
  })

  it("8 columnas: también, y la tabla queda completa", () => {
    const { container } = render(<Markdown text={table(8)} />)
    expect(wrap(container)!.classList.contains("table-wrap-scroll")).toBe(true)
    expect(container.querySelectorAll("thead th")).toHaveLength(8)
  })
})
