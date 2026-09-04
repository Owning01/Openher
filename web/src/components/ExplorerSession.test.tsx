import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ExplorerPanel } from "./shellPanels"
import { DialogProvider } from "./DialogProvider"

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    async (input: unknown) => {
      const url = String(input)
      if (url.includes("/shell/fs/list")) {
        return new Response(
          JSON.stringify({
            path: "/proj",
            dirs: [{ name: "sub", path: "/proj/sub" }],
            files: [],
          }),
          { status: 200 }
        )
      }
      if (url.includes("/shell/fs/changes")) {
        return new Response(JSON.stringify({ seq: 1, events: [] }), { status: 200 })
      }
      return new Response(JSON.stringify({}), { status: 200 })
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderExplorer(onOpenSessionDir: (dir: string) => void) {
  return render(
    <DialogProvider>
      <ExplorerPanel onOpenSessionDir={onOpenSessionDir} initialCwd="/proj" />
    </DialogProvider>
  )
}

describe("ExplorerPanel nueva sesión", () => {
  it("click derecho en subcarpeta ofrece sesión ahí", async () => {
    const onOpen = vi.fn()
    const { container } = renderExplorer(onOpen)
    await screen.findByText("sub")
    const row = container.querySelector(".shell-dir")
    expect(row).toBeTruthy()
    fireEvent.contextMenu(row!, { clientX: 50, clientY: 50 })
    const item = await screen.findByText("Nueva sesión de chat aquí")
    fireEvent.click(item)
    expect(onOpen).toHaveBeenCalledWith("/proj/sub")
  })

  it("click derecho en fondo (carpeta general) ofrece sesión en cwd", async () => {
    const onOpen = vi.fn()
    const { container } = renderExplorer(onOpen)
    await screen.findByText("sub")
    const root = container.querySelector(".shell-explorer")
    expect(root).toBeTruthy()
    fireEvent.contextMenu(root!, { clientX: 60, clientY: 120 })
    const items = await screen.findAllByText("Nueva sesión de chat aquí")
    expect(items.length).toBeGreaterThan(0)
    fireEvent.click(items[0]!)
    await waitFor(() => expect(onOpen).toHaveBeenCalledWith("/proj"))
  })
})
