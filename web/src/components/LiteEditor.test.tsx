import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { useState } from "react"
import { LiteEditor } from "./LiteEditor"

function Harness({
  initial = "const a = 1\nconst b = 2\n",
  path = "test.ts",
  saved,
  onSave = () => {},
}: {
  initial?: string
  path?: string
  saved?: string
  onSave?: () => void
}) {
  const [value, setValue] = useState(initial)
  return (
    <LiteEditor
      path={path}
      value={value}
      savedValue={saved}
      onChange={setValue}
      onSave={onSave}
    />
  )
}

function textarea(): HTMLTextAreaElement {
  return document.querySelector(".liteed-input") as HTMLTextAreaElement
}

describe("LiteEditor", () => {
  it("renderiza gutter, toolbar y status plano en archivo grande", () => {
    render(<Harness />)
    expect(document.querySelector(".liteed-gutter-inner")?.textContent).toContain("1")
    expect(screen.getByRole("toolbar")).toBeInTheDocument()
    expect(screen.getByTitle("Paleta de comandos (Ctrl+Shift+P)")).toBeInTheDocument()
    // 3 líneas → sin badge plano
    expect(document.querySelector(".liteed-plain")).toBeNull()
  })

  it("muestra badge plano en archivo gigante", () => {
    render(<Harness initial={Array.from({ length: 6000 }, () => "x").join("\n")} />)
    expect(document.querySelector(".liteed-plain")).not.toBeNull()
  })

  it("escribir actualiza el valor", () => {
    render(<Harness initial="" />)
    fireEvent.change(textarea(), { target: { value: "hola" } })
    expect(textarea().value).toBe("hola")
  })

  it("Ctrl+/ comenta con el prefijo del lenguaje", () => {
    render(<Harness initial="const a = 1" />)
    const ta = textarea()
    ta.setSelectionRange(0, 11)
    fireEvent.keyDown(ta, { key: "/", ctrlKey: true })
    expect(ta.value).toBe("// const a = 1")
  })

  it("Ctrl+S llama onSave", () => {
    const onSave = vi.fn()
    render(<Harness onSave={onSave} />)
    fireEvent.keyDown(textarea(), { key: "s", ctrlKey: true })
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it("paleta filtra y ejecuta: wrap toggle", () => {
    render(<Harness />)
    fireEvent.click(screen.getByTitle("Paleta de comandos (Ctrl+Shift+P)"))
    const dialog = screen.getByRole("dialog", { name: "Paleta de comandos" })
    fireEvent.change(within(dialog).getByPlaceholderText("Escribe un comando…"), {
      target: { value: "ajuste" },
    })
    fireEvent.click(screen.getByText("Activar ajuste de línea"))
    // Wrap activo → gutter oculto
    expect(document.querySelector(".liteed-gutter")).toBeNull()
  })

  it("buscar muestra índice actual/total", () => {
    render(<Harness initial="foo bar foo" />)
    fireEvent.keyDown(textarea(), { key: "f", ctrlKey: true })
    fireEvent.change(screen.getByPlaceholderText("Buscar…"), { target: { value: "foo" } })
    expect(screen.getByTitle("Coincidencia actual / total").textContent).toBe("1/2")
  })

  it("diff: sin cambios muestra mensaje", () => {
    render(<Harness initial={"a\nb"} saved={"a\nb"} />)
    fireEvent.click(screen.getByTitle("Cambios sin guardar"))
    expect(screen.getByText("Sin cambios")).toBeInTheDocument()
  })

  it("diff: muestra líneas -/+", () => {
    render(<Harness initial={"a\nB"} saved={"a\nb"} />)
    fireEvent.click(screen.getByTitle("Cambios sin guardar"))
    const dialog = screen.getByRole("dialog", { name: "Cambios sin guardar" })
    // Signo y texto van en spans separados
    expect(dialog.querySelector(".liteed-dline-del")?.textContent).toBe("-b")
    expect(dialog.querySelector(".liteed-dline-add")?.textContent).toBe("+B")
  })

  it("Ctrl+D selecciona la palabra bajo el caret", () => {
    render(<Harness initial="foo bar foo" />)
    const ta = textarea()
    ta.setSelectionRange(1, 1)
    fireEvent.keyDown(ta, { key: "d", ctrlKey: true })
    // Primera pulsación selecciona la palabra
    expect(ta.selectionStart).toBe(0)
    expect(ta.selectionEnd).toBe(3)
  })
})
