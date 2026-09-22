import { describe, it, expect, beforeAll, afterEach } from "vitest"
import { render, cleanup } from "@testing-library/react"
import { Markdown } from "./Markdown"

// El canvas mide sus nodos con ResizeObserver; jsdom no lo trae (mismo patrón
// que RemoteDesktop.test.tsx: mock de sólo las formas que usa el widget).
beforeAll(() => {
  ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

afterEach(cleanup)

const fence = (body: string, lang = "flowchart") => "```" + lang + "\n" + body + "\n```"

const spec = {
  steps: [
    {
      id: "users",
      row: 0,
      x: 0.5,
      w: 320,
      kind: { label: "Tabla", hue: "#9a5cff" },
      title: "users",
      caption: "id PK · name · email",
    },
    {
      id: "orders",
      row: 1,
      x: 0.5,
      w: 320,
      kind: { label: "Tabla", hue: "#f09a2f" },
      title: "orders",
      caption: "id PK · user_id FK",
    },
  ],
  edges: [{ from: "users", to: "orders" }],
}

describe("Markdown: bloque ```flowchart (bt-flowchart)", () => {
  it("renderiza el canvas con los nodos y la arista del JSON", () => {
    const { container } = render(<Markdown text={fence(JSON.stringify(spec, null, 2))} />)
    expect(container.querySelector(".bt-fc")).toBeTruthy()
    expect(container.textContent).toContain("users")
    expect(container.textContent).toContain("orders")
    // Los conectores viven en el <svg> hijo directo del canvas (los iconos de
    // las tarjetas también son svg/path pero están anidados en las cards).
    expect(container.querySelectorAll(".bt-fc > svg path")).toHaveLength(1)
  })

  it("JSON inválido cae al code block normal, sin canvas", () => {
    const { container } = render(<Markdown text={fence("{no es json}")} />)
    expect(container.querySelector(".bt-fc")).toBeNull()
    expect(container.querySelector(".code-block-wrap")).toBeTruthy()
  })

  it("descarta aristas hacia ids inexistentes en vez de tumbar el render", () => {
    const broken = {
      ...spec,
      edges: [
        { from: "users", to: "fantasma" },
        { from: "users", to: "orders" },
      ],
    }
    const { container } = render(<Markdown text={fence(JSON.stringify(broken))} />)
    expect(container.querySelector(".bt-fc")).toBeTruthy()
    expect(container.querySelectorAll(".bt-fc > svg path")).toHaveLength(1)
  })

  it("acepta también el id del catálogo bt-flowchart como lenguaje", () => {
    const { container } = render(<Markdown text={fence(JSON.stringify(spec), "bt-flowchart")} />)
    expect(container.querySelector(".bt-fc")).toBeTruthy()
  })

  it("steps vacío no renderiza canvas (fallback a código)", () => {
    const { container } = render(<Markdown text={fence(JSON.stringify({ steps: [] }))} />)
    expect(container.querySelector(".bt-fc")).toBeNull()
    expect(container.querySelector(".code-block-wrap")).toBeTruthy()
  })

  it("title/kind no-string caen a código: un objeto tumbaría React (regresión challenger)", () => {
    const tóxico = { steps: [{ ...spec.steps[0], title: { evil: true } }] }
    const a = render(<Markdown text={fence(JSON.stringify(tóxico))} />)
    expect(a.container.querySelector(".bt-fc")).toBeNull()
    expect(a.container.querySelector(".code-block-wrap")).toBeTruthy()

    const kindMalo = { steps: [{ ...spec.steps[0], kind: { label: { a: 1 }, hue: "#111" } }] }
    const b = render(<Markdown text={fence(JSON.stringify(kindMalo))} />)
    expect(b.container.querySelector(".bt-fc")).toBeNull()
  })

  it("rechaza specs sobre los techos y ids duplicados", () => {
    const many = Array.from({ length: 101 }, (_, i) => ({ id: "n" + i, row: i, x: 0.5, w: 300 }))
    const big = render(<Markdown text={fence(JSON.stringify({ steps: many }))} />)
    expect(big.container.querySelector(".bt-fc")).toBeNull()

    const dups = render(<Markdown text={fence(JSON.stringify({ steps: [spec.steps[0], spec.steps[0]] }))} />)
    expect(dups.container.querySelector(".bt-fc")).toBeNull()
  })

  it("JSON con BOM sí renderiza (fix de JSON.parse)", () => {
    const { container } = render(<Markdown text={fence("﻿" + JSON.stringify(spec))} />)
    expect(container.querySelector(".bt-fc")).toBeTruthy()
  })

  it("filtra self-edges y aristas duplicadas (queda solo la válida)", () => {
    const raro = {
      ...spec,
      edges: [
        { from: "users", to: "users" },
        { from: "users", to: "orders" },
        { from: "users", to: "orders" },
      ],
    }
    const { container } = render(<Markdown text={fence(JSON.stringify(raro))} />)
    expect(container.querySelector(".bt-fc")).toBeTruthy()
    expect(container.querySelectorAll(".bt-fc > svg path")).toHaveLength(1)
  })
})
