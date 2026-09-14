import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TreeFolder } from "./TreeFolder"
import type { FsEntry } from "../../shell"

function dirEntry(name: string, path: string): FsEntry {
  return { name, path, is_dir: true, size: null, modified: null }
}

function makeProps() {
  return {
    entry: dirEntry("sub", "/proj/sub"),
    onEnterDir: vi.fn(),
    query: "",
    downloading: null,
    onDownload: vi.fn(),
    favorites: [] as string[],
    onFav: vi.fn(),
    showNotice: vi.fn(),
    getFileGitStatus: () => null,
    getFolderGitStatus: () => null,
  }
}

let listCalls: string[]

beforeEach(() => {
  listCalls = []
  vi.stubGlobal(
    "fetch",
    async (input: unknown) => {
      const url = String(input)
      if (url.includes("/shell/fs/list")) {
        listCalls.push(url)
        return new Response(
          JSON.stringify({
            path: "/proj/sub",
            dirs: [dirEntry("child", "/proj/sub/child")],
            files: [],
          }),
          { status: 200 }
        )
      }
      return new Response(JSON.stringify({}), { status: 200 })
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("TreeFolder modo táctil (touchNav)", () => {
  it("tap en la fila entra a la carpeta y NO expande", () => {
    const props = makeProps()
    const { container } = render(<TreeFolder {...props} touchNav />)
    const row = container.querySelector(".pcf-row.pcf-dir")!
    fireEvent.click(row)
    expect(props.onEnterDir).toHaveBeenCalledWith("/proj/sub")
    expect(listCalls).toHaveLength(0)
    expect(container.querySelector(".pcf-sublist")).toBeNull()
  })

  it("el chevron expande sin entrar a la carpeta", async () => {
    const props = makeProps()
    const { container } = render(<TreeFolder {...props} touchNav />)
    const chevron = container.querySelector(".pcf-chevron-btn") as HTMLElement
    expect(chevron).toBeTruthy()
    expect(chevron.getAttribute("aria-label")).toBe("Expandir")
    fireEvent.click(chevron)
    await screen.findByText("child")
    expect(props.onEnterDir).not.toHaveBeenCalled()
    expect(listCalls).toHaveLength(1)
    expect(listCalls[0]).toContain("/shell/fs/list")
  })

  it("dblclick táctil no entra a la carpeta", () => {
    const props = makeProps()
    const { container } = render(<TreeFolder {...props} touchNav />)
    const row = container.querySelector(".pcf-row.pcf-dir")!
    fireEvent.doubleClick(row)
    expect(props.onEnterDir).not.toHaveBeenCalled()
    expect(container.querySelector(".pcf-sublist")).toBeNull()
  })
})

describe("TreeFolder modo desktop (regresión)", () => {
  it("click simple expande y dblclick entra", async () => {
    const props = makeProps()
    const { container } = render(<TreeFolder {...props} />)
    const row = container.querySelector(".pcf-row.pcf-dir")!
    fireEvent.click(row)
    await screen.findByText("child")
    expect(props.onEnterDir).not.toHaveBeenCalled()
    // Sin touchNav el chevron vuelve a ser decorativo.
    expect(container.querySelector(".pcf-chevron-btn")).toBeNull()
    fireEvent.doubleClick(row)
    expect(props.onEnterDir).toHaveBeenCalledWith("/proj/sub")
  })
})
