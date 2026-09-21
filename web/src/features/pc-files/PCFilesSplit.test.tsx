import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PCFilesPanel } from "./PCFilesPanel"
import { DialogProvider } from "../../components/DialogProvider"
import { ToastProvider } from "../../components/Toasts"

// Cobertura del panel dividido: ambos paneles comparten ExplorerPane/usePaneNav
// tras el refactor, y el secundario no tenía test propio.
const ROOT = "C:\\proj"

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal(
    "fetch",
    async (input: unknown) => {
      const url = String(input)
      if (url.includes("/shell/fs/drives")) return json({ drives: [ROOT] })
      if (url.includes("/shell/fs/favorites")) return json({ favorites: [] })
      if (url.includes("/shell/fs/list")) {
        return json({
          path: ROOT,
          dirs: [{ name: "sub", path: `${ROOT}\\sub`, is_dir: true, size: null, modified: null }],
          files: [{ name: "app.ts", path: `${ROOT}\\app.ts`, is_dir: false, size: 21, modified: null }],
        })
      }
      return json({})
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe("PCFilesPanel vista dividida", () => {
  it("abre un segundo panel con su propio header, crumbs y árbol", async () => {
    const { container } = render(
      <DialogProvider>
        <ToastProvider>
          <PCFilesPanel initialCwd={ROOT} />
        </ToastProvider>
      </DialogProvider>
    )
    await screen.findByText("sub")

    expect(container.querySelectorAll(".pcf-workspace-header")).toHaveLength(1)
    fireEvent.click(screen.getByLabelText("Dividir vista"))
    await waitFor(() => expect(container.querySelectorAll(".pcf-workspace-header")).toHaveLength(2))

    // El segundo panel replica workspace, breadcrumbs y árbol.
    const names = Array.from(container.querySelectorAll(".pcf-workspace-name")).map((n) => n.textContent)
    expect(names).toEqual(["proj", "proj"])
    expect(container.querySelectorAll(".pcf-crumbs")).toHaveLength(2)
    expect(container.querySelectorAll(".pcf-tree[aria-label='Archivos (2)']")).toHaveLength(1)

    fireEvent.click(screen.getByLabelText("Cerrar panel"))
    await waitFor(() => expect(container.querySelectorAll(".pcf-workspace-header")).toHaveLength(1))
  })
})
