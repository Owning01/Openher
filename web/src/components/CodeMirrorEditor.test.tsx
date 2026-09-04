import { describe, expect, it, vi } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { CodeMirrorEditor } from "./CodeMirrorEditor"

describe("CodeMirrorEditor", () => {
  it("renderiza el contenido y la toolbar sin montar LiteEditor", async () => {
    const onChange = vi.fn()
    const onSave = vi.fn()
    const { container, unmount: u } = render(
      <CodeMirrorEditor path="a.ts" value={"const x = 1\n"} onChange={onChange} onSave={onSave} />,
    )
    // CodeMirror pinta el doc como nodos de texto dentro de .cm-content
    const content = container.querySelector(".cm-content")
    expect(content?.textContent).toContain("const x = 1")
    // Toolbar propia con prefs (A-, A+, T2, Wrap)
    expect(screen.getByTitle("Aumentar letra")).toBeTruthy()
    expect(screen.getByTitle("Ajuste de línea")).toBeTruthy()
    u()
    await Promise.resolve()
  })

  it("muestra el boton Diff solo si hay savedValue", () => {
    const base = { path: "a.ts", value: "x", onChange: () => {}, onSave: () => {} }
    const { unmount: u1 } = render(<CodeMirrorEditor {...base} />)
    expect(screen.queryByTitle("Ver cambios sin guardar")).toBeNull()
    u1()
    render(<CodeMirrorEditor {...base} savedValue="y" />)
    expect(screen.getByTitle("Ver cambios sin guardar")).toBeTruthy()
    cleanup()
  })
})
