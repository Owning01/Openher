import { describe, it, expect, vi, afterEach } from "vitest"
import { render, cleanup, fireEvent } from "@testing-library/react"
import { DesktopCellPlaceholder } from "./DesktopCellPlaceholder"

// Regresión: arrastrar una SELECCIÓN DE TEXTO sobre una celda vacía abría un
// panel basura (el `else` final hacía onDock con cualquier payload) y rompía la
// interfaz. Solo un payload INTERNO del app puede dockear/cambiar paneles.

function fakeDT(data: Record<string, string>) {
  return {
    files: [],
    types: Object.keys(data),
    getData: (t: string) => data[t] ?? "",
    setData: () => {},
    dropEffect: "move",
  } as unknown as DataTransfer
}

function setup() {
  const props = {
    index: 0,
    style: {},
    label: "vacío",
    onActivate: vi.fn(),
    onClose: vi.fn(),
    onOpenFile: vi.fn(),
    onSwapPanels: vi.fn(),
    onDock: vi.fn(),
  }
  const { container } = render(<DesktopCellPlaceholder {...props} />)
  return { props, el: container.firstChild as Element }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("DesktopCellPlaceholder: drop", () => {
  it("NO dockea con una selección de texto (text/plain suelto)", () => {
    const { props, el } = setup()
    fireEvent.drop(el, { dataTransfer: fakeDT({ "text/plain": "G:\\Proyectos\\foo\\bar.txt" }) })
    expect(props.onDock).not.toHaveBeenCalled()
    expect(props.onOpenFile).not.toHaveBeenCalled()
    expect(props.onSwapPanels).not.toHaveBeenCalled()
  })

  it("sí dockea una sesión (payload interno)", () => {
    const { props, el } = setup()
    fireEvent.drop(el, { dataTransfer: fakeDT({ "application/x-opencode-path": "session:ses_123" }) })
    expect(props.onDock).toHaveBeenCalledWith(0, "center", "session:ses_123")
  })

  it("sí abre un archivo interno en la celda", () => {
    const { props, el } = setup()
    fireEvent.drop(el, { dataTransfer: fakeDT({ "application/x-opencode-path": "G:\\Proyectos\\a\\b.ts" }) })
    expect(props.onOpenFile).toHaveBeenCalledWith("G:\\Proyectos\\a\\b.ts", 0, "center")
  })
})
