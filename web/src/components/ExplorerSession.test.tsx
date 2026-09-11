import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ExplorerPanel } from "./shellPanels"
import { DialogProvider } from "./DialogProvider"
import { ToastProvider } from "./Toasts"

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    async (input: unknown) => {
      const url = String(input)
      if (url.includes("/shell/fs/drives")) {
        return new Response(JSON.stringify({ drives: ["/proj"] }), { status: 200 })
      }
      if (url.includes("/shell/fs/favorites")) {
        return new Response(JSON.stringify({ favorites: [] }), { status: 200 })
      }
      if (url.includes("/shell/fs/list")) {
        return new Response(
          JSON.stringify({
            path: "/proj",
            dirs: [{ name: "sub", path: "/proj/sub" }],
            files: [
              { name: "app.ts", path: "/proj/app.ts", size: 12 },
              { name: "run.ps1", path: "/proj/run.ps1", size: 8 },
            ],
          }),
          { status: 200 }
        )
      }
      if (url.includes("/shell/fs/exec")) {
        return new Response(JSON.stringify({ ok: true, path: "/proj/run.ps1" }), { status: 200 })
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
      <ToastProvider>
        <ExplorerPanel onOpenSessionDir={onOpenSessionDir} initialCwd="/proj" />
      </ToastProvider>
    </DialogProvider>
  )
}

describe("ExplorerPanel unificado (PCFilesPanel)", () => {
  it("click derecho en subcarpeta ofrece sesión ahí", async () => {
    const onOpen = vi.fn()
    const { container } = renderExplorer(onOpen)
    await screen.findByText("sub")
    const row = container.querySelector(".pcf-row.pcf-dir")
    expect(row).toBeTruthy()
    fireEvent.contextMenu(row!, { clientX: 50, clientY: 50 })
    const item = await screen.findByText("Nueva sesión de chat aquí")
    fireEvent.click(item)
    expect(onOpen).toHaveBeenCalledWith("/proj/sub")
  })

  it("click derecho en fondo ofrece sesión en cwd", async () => {
    const onOpen = vi.fn()
    const { container } = renderExplorer(onOpen)
    await screen.findByText("app.ts")
    const root = container.querySelector(".pcf-tree")
    expect(root).toBeTruthy()
    fireEvent.contextMenu(root!, { clientX: 60, clientY: 120 })
    const items = await screen.findAllByText("Nueva sesión de chat aquí")
    expect(items.length).toBeGreaterThan(0)
    fireEvent.click(items[0]!)
    expect(onOpen).toHaveBeenCalledWith("/proj")
  })

  it("eliminar muestra confirm inline con aceptar/cancelar y avisa por toast", async () => {
    const onOpen = vi.fn()
    const { container } = renderExplorer(onOpen)
    await screen.findByText("app.ts")
    const rows = Array.from(container.querySelectorAll(".pcf-row.pcf-file"))
    const row = rows.find((r) => r.textContent?.includes("app.ts"))!
    expect(row).toBeTruthy()
    fireEvent.contextMenu(row, { clientX: 50, clientY: 50 })
    const delItems = await screen.findAllByText("Eliminar")
    fireEvent.click(delItems[0]!)
    // Inline dentro del árbol, no modal ni overlay
    const banner = await screen.findByRole("alertdialog")
    expect(banner.className).toContain("pcf-inline-confirm")
    expect(banner.className).toContain("is-danger")
    expect(banner.closest(".pcf-tree")).toBeTruthy()
    expect(container.querySelector(".modal-backdrop")).toBeNull()
    // Cancelar cierra sin borrar
    fireEvent.click(await screen.findByText("Cancelar"))
    expect(screen.queryByRole("alertdialog")).toBeNull()
    // Reabrir y aceptar mueve a Papelera + toast flotante (fuera del panel)
    fireEvent.contextMenu(row, { clientX: 50, clientY: 50 })
    fireEvent.click((await screen.findAllByText("Eliminar"))[0]!)
    await screen.findByRole("alertdialog")
    fireEvent.click(await screen.findByText("Mover"))
    await screen.findByText("A la Papelera: app.ts")
    expect(document.querySelector(".toast-stack")).toBeTruthy()
  })

  it("ejecutar script muestra confirm inline con aceptar/cancelar", async () => {
    const onOpen = vi.fn()
    const { container } = renderExplorer(onOpen)
    await screen.findByText("run.ps1")
    const rows = Array.from(container.querySelectorAll(".pcf-row.pcf-file"))
    const row = rows.find((r) => r.textContent?.includes("run.ps1"))!
    fireEvent.contextMenu(row, { clientX: 50, clientY: 50 })
    fireEvent.click(await screen.findByText("Ejecutar script"))
    const banner = await screen.findByRole("alertdialog")
    expect(banner.className).toContain("pcf-inline-confirm")
    expect(banner.className).toContain("is-exec")
    expect(banner.closest(".pcf-tree")).toBeTruthy()
    fireEvent.click(await screen.findByText("Ejecutar"))
    await screen.findByText("Ejecutando: run.ps1")
  })
})
