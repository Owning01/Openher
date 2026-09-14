import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { Markdown } from "./Markdown"
import { shell } from "../shell"

beforeAll(() => {
  Object.defineProperty(URL, "createObjectURL", { value: vi.fn(() => "blob:mock"), writable: true, configurable: true })
  Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), writable: true, configurable: true })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("imágenes en mensajes", () => {
  it("una imagen remota se renderiza directo", () => {
    render(<Markdown text={"![foto](https://files.catbox.moe/gtehhy.png)"} />)
    expect(screen.getByRole("img", { name: "foto" })).toHaveAttribute("src", "https://files.catbox.moe/gtehhy.png")
  })

  it("una ruta local del PC se carga por el shell y se pinta como blob", async () => {
    const spy = vi
      .spyOn(shell.fs, "download")
      .mockResolvedValue(new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }))
    render(<Markdown text={"![shot](C:\\Users\\perca\\shot1.png)"} />)
    const img = await screen.findByRole("img", { name: "shot" })
    expect(spy).toHaveBeenCalledWith("C:\\Users\\perca\\shot1.png")
    expect(img).toHaveAttribute("src", "blob:mock")
  })

  it("soporta file:// y avisa si no es imagen", async () => {
    const spy = vi
      .spyOn(shell.fs, "download")
      .mockResolvedValue(new Blob([new Uint8Array([1])], { type: "application/zip" }))
    render(<Markdown text={"![doc](file:///C:/Users/perca/archivo.bin)"} />)
    expect(await screen.findByText(/no es una imagen|no se pudo cargar/)).toBeInTheDocument()
    expect(spy).toHaveBeenCalledWith("C:/Users/perca/archivo.bin")
  })

  it("si el shell falla, muestra aviso con la ruta (sin imagen rota)", async () => {
    vi.spyOn(shell.fs, "download").mockRejectedValue(new Error("401 unauthorized"))
    render(<Markdown text={"![falla](C:\\Users\\perca\\shot2.png)"} />)
    expect(await screen.findByText(/no se pudo cargar/)).toBeInTheDocument()
    expect(screen.queryByRole("img", { name: "falla" })).toBeNull()
  })

  it("una ruta web relativa no se confunde con el FS local", () => {
    const spy = vi.spyOn(shell.fs, "download")
    render(<Markdown text={"![logo](/img/openher-mark-180.png)"} />)
    expect(screen.getByRole("img", { name: "logo" })).toHaveAttribute("src", "/img/openher-mark-180.png")
    expect(spy).not.toHaveBeenCalled()
  })
})
