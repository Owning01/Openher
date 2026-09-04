import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { FolderPicker } from "./FolderPicker"
import type { FileEntry } from "../types"

afterEach(() => cleanup())

const dir = (name: string, absolute: string): FileEntry => ({ name, path: name, absolute, type: "directory" })

function renderPicker(over: Partial<Parameters<typeof FolderPicker>[0]> = {}) {
  const props: Parameters<typeof FolderPicker>[0] = {
    pickerDir: "C:\\proj",
    pickerItems: [dir("sub", "C:\\proj\\sub")],
    pickerLoading: false,
    pickerError: null,
    creatingSession: false,
    onBrowse: vi.fn(),
    onCreate: vi.fn(),
    onCreateDefault: vi.fn(),
    onClose: vi.fn(),
    ...over,
  }
  render(<FolderPicker {...props} />)
  return props
}

describe("FolderPicker", () => {
  it("Crear aquí inicia la sesión en el dir visible", () => {
    const p = renderPicker()
    fireEvent.click(screen.getByText("Crear aquí"))
    expect(p.onCreate).toHaveBeenCalledWith("C:\\proj")
  })

  it("Usar default delega al directorio del server", () => {
    const p = renderPicker()
    fireEvent.click(screen.getByText("Usar default"))
    expect(p.onCreateDefault).toHaveBeenCalled()
    expect(p.onCreate).not.toHaveBeenCalled()
  })

  it("lista proyectos existentes dedup y ordenados, click crea ahí", () => {
    const p = renderPicker({ projects: ["C:\\b", "C:\\a", "C:\\b", ""] })
    const rows = screen.getAllByText("Nueva sesión")
    expect(rows).toHaveLength(2)
    fireEvent.click(rows[0]!.closest("button")!)
    expect(p.onCreate).toHaveBeenCalledWith("C:\\a")
  })

  it("click en subcarpeta navega, .. sube al padre", () => {
    const p = renderPicker()
    fireEvent.click(screen.getByText("sub"))
    expect(p.onBrowse).toHaveBeenCalledWith("C:\\proj\\sub")
    fireEvent.click(screen.getByText(".."))
    expect(p.onBrowse).toHaveBeenCalledWith("C:\\")
  })

  it("carpeta vacía y error visibles", () => {
    renderPicker({ pickerItems: [] })
    expect(screen.getByText("(carpeta vacía)")).toBeTruthy()
    cleanup()
    renderPicker({ pickerItems: [], pickerError: "sin acceso" })
    expect(screen.getByText("sin acceso")).toBeTruthy()
  })

  it("loading bloquea el estado de carga", () => {
    renderPicker({ pickerLoading: true })
    expect(screen.getByText("Cargando...")).toBeTruthy()
  })

  it("ruta manual absoluta navega ahí con Enter", () => {
    const p = renderPicker()
    fireEvent.click(screen.getByLabelText("Editar ruta"))
    const input = screen.getByPlaceholderText(/ruta absoluta/) as HTMLInputElement
    fireEvent.change(input, { target: { value: "D:\\otro" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(p.onBrowse).toHaveBeenCalledWith("D:\\otro")
  })

  it("ruta manual con .. se resuelve client-side", () => {
    const p = renderPicker({ pickerDir: "/a/b" })
    fireEvent.click(screen.getByLabelText("Editar ruta"))
    const input = screen.getByPlaceholderText(/ruta absoluta/) as HTMLInputElement
    fireEvent.change(input, { target: { value: ".." } })
    fireEvent.click(screen.getByText("Ir"))
    expect(p.onBrowse).toHaveBeenCalledWith("/a")
  })

  it("creando sesión deshabilita los botones de crear", () => {
    renderPicker({ creatingSession: true })
    expect((screen.getByText("Crear aquí").closest("button") as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByText("Usar default").closest("button") as HTMLButtonElement).disabled).toBe(true)
  })
})
