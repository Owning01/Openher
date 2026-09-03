import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { useState } from "react"
import { LiteEditor } from "./LiteEditor"

vi.mock("../utils/editorOps", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../utils/editorOps")>()
  return {
    ...mod,
    diffLines: (...args: Parameters<typeof mod.diffLines>) => {
      const g = globalThis as Record<string, number>
      g.__diffCalls = (g.__diffCalls ?? 0) + 1
      return mod.diffLines(...args)
    },
  }
})

function diffCalls(): number {
  return (globalThis as Record<string, number>).__diffCalls ?? 0
}

beforeEach(() => {
  ;(globalThis as Record<string, number>).__diffCalls = 0
  localStorage.clear()
})

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

  it("Ctrl+D x2 acumula cursores sin autodestruirse", () => {
    render(<Harness initial="foo bar foo bar foo" />)
    const ta = textarea()
    ta.setSelectionRange(1, 1)
    fireEvent.keyDown(ta, { key: "d", ctrlKey: true })
    fireEvent.keyDown(ta, { key: "d", ctrlKey: true })
    expect(ta.selectionStart).toBe(8)
    expect(ta.selectionEnd).toBe(11)
    expect(document.querySelectorAll(".liteed-mark-caret").length).toBeGreaterThanOrEqual(1)
  })

  it("Ctrl+D sobre la 2da ocurrencia selecciona la 2da, no la 1ra", () => {
    render(<Harness initial="foo bar foo" />)
    const ta = textarea()
    ta.setSelectionRange(9, 9)
    fireEvent.keyDown(ta, { key: "d", ctrlKey: true })
    expect(ta.selectionStart).toBe(8)
    expect(ta.selectionEnd).toBe(11)
  })

  it("reemplazar todo inserta $ literal", () => {
    render(<Harness initial="a $x b $x" />)
    fireEvent.keyDown(textarea(), { key: "h", ctrlKey: true })
    fireEvent.change(screen.getByPlaceholderText("Buscar…"), { target: { value: "$x" } })
    fireEvent.change(screen.getByPlaceholderText("Reemplazar por…"), { target: { value: "R$&" } })
    fireEvent.click(screen.getByTitle("Reemplazar todas"))
    expect(textarea().value).toBe("a R$& b R$&")
  })

  it("IME en composición: Enter no inserta nada", () => {
    render(<Harness initial="  x" />)
    const ta = textarea()
    ta.setSelectionRange(3, 3)
    const ev = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })
    Object.defineProperty(ev, "isComposing", { value: true })
    fireEvent(ta, ev)
    expect(ta.value).toBe("  x")
  })

  it("gutter iguala al código con trailing newline", () => {
    render(<Harness initial={"a\nb\n"} />)
    expect(document.querySelector(".liteed-gutter-inner")?.textContent).toBe("1\n2\n3")
  })

  it("textarea con aria-label del path", () => {
    render(<Harness path="dir/test.ts" />)
    expect(textarea().getAttribute("aria-label")).toBe("Editar dir/test.ts")
  })

  it("diff cerrado no calcula LCS; abierto sí", async () => {
    render(<Harness initial={"a"} saved={"b"} />)
    fireEvent.change(textarea(), { target: { value: "ax" } })
    await new Promise((r) => setTimeout(r, 60))
    expect(diffCalls()).toBe(0)
    fireEvent.click(screen.getByTitle("Cambios sin guardar"))
    expect(await screen.findByRole("dialog", { name: "Cambios sin guardar" })).toBeInTheDocument()
    expect(diffCalls()).toBeGreaterThan(0)
  })
})
