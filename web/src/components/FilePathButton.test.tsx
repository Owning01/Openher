import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Markdown } from "./Markdown"
import { FilePathProvider } from "./FilePathButton"

describe("chips de rutas en el chat", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("convierte inline code y texto plano en chips", () => {
    render(
      <FilePathProvider onOpenFile={() => {}} directory={"G:\\Proyectos\\app"}>
        <Markdown text={"Abrí `G:\\Proyectos\\app\\src\\a.ts` y también src/utils/b.ts"} />
      </FilePathProvider>
    )
    expect(screen.getByRole("button", { name: "G:\\Proyectos\\app\\src\\a.ts" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "src/utils/b.ts" })).toBeInTheDocument()
  })

  it("el menú abre en el editor con la ruta resuelta", () => {
    const onOpenFile = vi.fn()
    render(
      <FilePathProvider onOpenFile={onOpenFile} directory={"G:\\Proyectos\\app"}>
        <Markdown text={"ver src/utils/b.ts ahora"} />
      </FilePathProvider>
    )
    fireEvent.click(screen.getByRole("button", { name: "src/utils/b.ts" }))
    const item = screen.getByRole("menuitem", { name: /Abrir en editor/i })
    fireEvent.click(item)
    expect(onOpenFile).toHaveBeenCalledWith("G:\\Proyectos\\app\\src\\utils\\b.ts")
  })

  it("sin onOpenFile no ofrece editor pero sí las apps del shell", () => {
    render(
      <FilePathProvider directory={"G:\\Proyectos\\app"}>
        <Markdown text={"ver G:\\Proyectos\\app\\src\\a.ts"} />
      </FilePathProvider>
    )
    fireEvent.click(screen.getByRole("button", { name: "G:\\Proyectos\\app\\src\\a.ts" }))
    expect(screen.queryByRole("menuitem", { name: /Abrir en editor/i })).toBeNull()
    expect(screen.getByRole("menuitem", { name: /app predeterminada/i })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /Abrir con…/i })).toBeInTheDocument()
  })

  it("una ruta relativa sin directorio de sesión se deja como texto", () => {
    render(
      <FilePathProvider onOpenFile={() => {}}>
        <Markdown text={"ver src/utils/b.ts"} />
      </FilePathProvider>
    )
    expect(screen.queryByRole("button", { name: "src/utils/b.ts" })).toBeNull()
    expect(screen.getByText(/src\/utils\/b\.ts/)).toBeInTheDocument()
  })

  it("no convierte rutas dentro de bloques de código", () => {
    render(
      <FilePathProvider onOpenFile={() => {}} directory={"G:\\Proyectos\\app"}>
        <Markdown text={"```\nC:\\Proyectos\\no-chip.ts\n```"} />
      </FilePathProvider>
    )
    expect(screen.queryByRole("button", { name: /no-chip\.ts/ })).toBeNull()
    expect(screen.getByText(/no-chip\.ts/)).toBeInTheDocument()
  })

  it("los links normales siguen siendo links", () => {
    render(
      <FilePathProvider onOpenFile={() => {}}>
        <Markdown text={"[docs](https://example.com/docs)"} />
      </FilePathProvider>
    )
    const link = screen.getByRole("link", { name: "docs" })
    expect(link).toHaveAttribute("href", "https://example.com/docs")
  })
})
