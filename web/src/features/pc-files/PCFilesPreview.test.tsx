import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PCFilesPanel } from "./PCFilesPanel"
import { DialogProvider } from "../../components/DialogProvider"

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    async (input: unknown) => {
      const url = String(input)
      if (url.includes("/shell/fs/drives")) {
        return new Response(JSON.stringify({ drives: ["C:\\proj"] }), { status: 200 })
      }
      if (url.includes("/shell/fs/favorites")) {
        return new Response(JSON.stringify({ favorites: [] }), { status: 200 })
      }
      if (url.includes("/shell/fs/list")) {
        return new Response(
          JSON.stringify({
            path: "C:\\proj",
            dirs: [],
            files: [{ name: "index.html", path: "C:\\proj\\index.html", size: 100 }],
          }),
          { status: 200 }
        )
      }
      if (url.includes("/shell/project/serve")) {
        return new Response(
          JSON.stringify({
            ok: true,
            token: "TOK",
            previewUrl: "",
            directory: "C:\\proj",
            entrypoint: "index.html",
            htmlFiles: ["index.html"],
            hasPackageJson: false,
            scripts: {},
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

describe("PCFilesPanel vista previa HTML", () => {
  it("abre el html en ventana del navegador con URL servida", async () => {
    const onOpenBrowser = vi.fn()
    const { container } = render(
      <DialogProvider>
        <PCFilesPanel onOpenBrowser={onOpenBrowser} />
      </DialogProvider>
    )
    await screen.findByText("index.html")
    const row = container.querySelector(".pcf-row.pcf-file")
    expect(row).toBeTruthy()
    fireEvent.contextMenu(row!, { clientX: 50, clientY: 50 })
    fireEvent.click(await screen.findByText("Vista previa HTML"))
    await waitFor(() =>
      expect(onOpenBrowser).toHaveBeenCalledWith(expect.stringContaining("/shell/preview/TOK/index.html"))
    )
    // No abre el visor inline
    expect(container.querySelector(".pcf-html-preview")).toBeNull()
  })

  it("sin onOpenBrowser usa window.open como fallback", async () => {
    const openSpy = vi.fn()
    ;(window as unknown as { open: unknown }).open = openSpy
    const { container } = render(
      <DialogProvider>
        <PCFilesPanel />
      </DialogProvider>
    )
    await screen.findByText("index.html")
    const row = container.querySelector(".pcf-row.pcf-file")
    expect(row).toBeTruthy()
    fireEvent.contextMenu(row!, { clientX: 50, clientY: 50 })
    fireEvent.click(await screen.findByText("Vista previa HTML"))
    await waitFor(() =>
      expect(openSpy).toHaveBeenCalledWith(expect.stringContaining("/shell/preview/TOK/index.html"), "_blank")
    )
  })
})
