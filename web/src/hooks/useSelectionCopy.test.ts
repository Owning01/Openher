import { describe, it, expect } from "vitest"
import { isNativeTextDrag } from "./useSelectionCopy"

function el(): HTMLElement {
  return document.createElement("div")
}

describe("isNativeTextDrag", () => {
  it("bloquea arrastrar una seleccion de texto dentro del chat", () => {
    const wrap = el()
    const target = el()
    wrap.appendChild(target)
    expect(
      isNativeTextDrag({ target, wrap, insideDraggable: false, selectionCollapsed: false })
    ).toBe(true)
  })

  it("no bloquea los drags reales que salen de un elemento draggable", () => {
    const wrap = el()
    const chip = el()
    chip.setAttribute("draggable", "true")
    wrap.appendChild(chip)
    expect(
      isNativeTextDrag({ target: chip, wrap, insideDraggable: true, selectionCollapsed: false })
    ).toBe(false)
  })

  it("no bloquea el arrastre que empieza fuera del chat (composer, otros paneles)", () => {
    const wrap = el()
    const afuera = el()
    expect(
      isNativeTextDrag({ target: afuera, wrap, insideDraggable: false, selectionCollapsed: false })
    ).toBe(false)
  })

  it("no bloquea cuando no hay seleccion (arrastre de un elemento suelto)", () => {
    const wrap = el()
    const target = el()
    wrap.appendChild(target)
    expect(
      isNativeTextDrag({ target, wrap, insideDraggable: false, selectionCollapsed: true })
    ).toBe(false)
  })

  it("sin wrap montado no bloquea nada", () => {
    const target = el()
    expect(
      isNativeTextDrag({ target, wrap: null, insideDraggable: false, selectionCollapsed: false })
    ).toBe(false)
  })
})
