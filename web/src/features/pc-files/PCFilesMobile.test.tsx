import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PCFilesPanel } from "./PCFilesPanel"
import { DialogProvider } from "../../components/DialogProvider"
import { ToastProvider } from "../../components/Toasts"

// jsdom no implementa scrollIntoView; el visor lo usa para centrar la línea.
Element.prototype.scrollIntoView = () => {}

const ROOT = "C:\\proj"
const SUB = "C:\\proj\\sub"

let downloadCalls: string[]

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

beforeEach(() => {
  localStorage.clear()
  downloadCalls = []
  vi.stubGlobal(
    "fetch",
    async (input: unknown) => {
      const url = String(input)
      const decoded = decodeURIComponent(url)
      if (url.includes("/shell/fs/drives")) {
        return json({ drives: [ROOT] })
      }
      if (url.includes("/shell/fs/favorites")) {
        return json({ favorites: [] })
      }
      if (url.includes("/shell/fs/list")) {
        if (decoded.includes("\\sub")) {
          return json({
            path: SUB,
            dirs: [],
            files: [{ name: "inside.txt", path: `${SUB}\\inside.txt`, is_dir: false, size: 15, modified: null }],
          })
        }
        return json({
          path: ROOT,
          dirs: [{ name: "sub", path: SUB, is_dir: true, size: null, modified: null }],
          files: [
            { name: "app.ts", path: `${ROOT}\\app.ts`, is_dir: false, size: 21, modified: null },
            { name: "locked.txt", path: `${ROOT}\\locked.txt`, is_dir: false, size: 10, modified: null },
            { name: "blob.bin", path: `${ROOT}\\blob.bin`, is_dir: false, size: 24, modified: null },
          ],
        })
      }
      if (url.includes("/shell/fs/read")) {
        if (decoded.includes("locked.txt")) return json({ error: "os error 32" }, 500)
        if (decoded.includes("blob.bin")) return json({ content: "PNG\u0000\u0000IHDRbinary", truncated: false })
        if (decoded.includes("inside.txt")) return json({ content: "contenido dentro", truncated: false })
        return json({ content: "linea uno\nlinea dos", truncated: false })
      }
      if (url.includes("/shell/fs/download")) {
        downloadCalls.push(url)
        return new Response("bytes", { status: 200 })
      }
      return json({})
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  localStorage.clear()
  delete (window as unknown as Record<string, unknown>).__OPENHER_DESKTOP__
})

function renderPanel() {
  return render(
    <DialogProvider>
      <ToastProvider>
        <PCFilesPanel initialCwd={ROOT} />
      </ToastProvider>
    </DialogProvider>
  )
}

function fileRow(container: HTMLElement, name: string): HTMLElement {
  const row = Array.from(container.querySelectorAll<HTMLElement>(".pcf-row.pcf-file")).find((r) =>
    r.textContent?.includes(name)
  )
  if (!row) throw new Error(`fila no encontrada: ${name}`)
  return row
}

async function openFile(container: HTMLElement, name: string) {
  await screen.findByText(name)
  fireEvent.click(fileRow(container, name))
}

describe("PCFilesPanel móvil (táctil por defecto en jsdom)", () => {
  it("tap en carpeta entra y el breadcrumb cambia", async () => {
    const { container } = renderPanel()
    await screen.findByText("sub")
    expect(container.querySelector(".pcf-crumb.active")?.textContent).toBe("proj")
    const dirRow = Array.from(container.querySelectorAll<HTMLElement>(".pcf-row.pcf-dir")).find((r) =>
      r.textContent?.includes("sub")
    )!
    fireEvent.click(dirRow)
    await screen.findByText("inside.txt")
    await waitFor(() => expect(container.querySelector(".pcf-crumb.active")?.textContent).toBe("sub"))
  })

  it("tap en archivo de texto abre el visor móvil y al cerrar conserva el cwd", async () => {
    const { container } = renderPanel()
    // Entrar a sub y abrir su archivo: al cerrar debe seguir en sub.
    await screen.findByText("sub")
    const dirRow = Array.from(container.querySelectorAll<HTMLElement>(".pcf-row.pcf-dir")).find((r) =>
      r.textContent?.includes("sub")
    )!
    fireEvent.click(dirRow)
    await screen.findByText("inside.txt")
    await openFile(container, "inside.txt")
    await waitFor(() => expect(container.querySelector(".pcf-code-viewer.is-mobile")).toBeTruthy())
    await waitFor(() => expect(container.textContent).toContain("contenido dentro"))
    fireEvent.click(screen.getByLabelText("Cerrar visor"))
    await waitFor(() => expect(container.querySelector(".pcf-code-viewer")).toBeNull())
    expect(container.querySelector(".pcf-crumb.active")?.textContent).toBe("sub")
  })

  it("A+ aumenta el tamaño del texto y lo persiste en localStorage", async () => {
    const { container } = renderPanel()
    await openFile(container, "app.ts")
    const viewer = await waitFor(() => {
      const v = container.querySelector<HTMLElement>(".pcf-code-viewer.is-mobile")
      expect(v).toBeTruthy()
      return v!
    })
    expect(viewer.style.getPropertyValue("--pcf-code-font-size")).toBe("13px")
    fireEvent.click(screen.getByLabelText("Aumentar tamaño de texto"))
    await waitFor(() => expect(viewer.style.getPropertyValue("--pcf-code-font-size")).toBe("14px"))
    expect(localStorage.getItem("opencode.explorer.viewerFontSize")).toBe("14")
    // A− vuelve al valor por defecto.
    fireEvent.click(screen.getByLabelText("Reducir tamaño de texto"))
    await waitFor(() => expect(viewer.style.getPropertyValue("--pcf-code-font-size")).toBe("13px"))
  })

  it("archivo bloqueado (os error 32) muestra mensaje en español y NO descarga", async () => {
    const { container } = renderPanel()
    await openFile(container, "locked.txt")
    const alert = await screen.findByRole("alert")
    expect(alert.textContent).toContain("El archivo está en uso por otro proceso")
    expect(container.querySelector(".pcf-code-viewer.is-mobile")).toBeTruthy()
    // Sin descarga ciega y sin botón de descarga (no ayuda si está bloqueado).
    expect(downloadCalls).toHaveLength(0)
    expect(alert.querySelector("button")).toBeNull()
  })

  it("binario no muestra basura y ofrece Descargar", async () => {
    const { container } = renderPanel()
    await openFile(container, "blob.bin")
    const alert = await screen.findByRole("alert")
    expect(alert.textContent).toContain("parece binario")
    expect(container.textContent).not.toContain("IHDR")
    fireEvent.click(screen.getByText("Descargar"))
    await waitFor(() => expect(downloadCalls.length).toBe(1))
    expect(downloadCalls[0]).toContain("/shell/fs/download")
  })

  it("una lectura vieja no pisa la última abierta ni reabre el visor cerrado", async () => {
    const pending: Array<{ url: string; resolve: (r: Response) => void }> = []
    vi.stubGlobal("fetch", async (input: unknown) => {
      const url = String(input)
      if (url.includes("/shell/fs/read")) {
        return await new Promise<Response>((resolve) => pending.push({ url, resolve }))
      }
      if (url.includes("/shell/fs/drives")) return json({ drives: [ROOT] })
      if (url.includes("/shell/fs/favorites")) return json({ favorites: [] })
      if (url.includes("/shell/fs/list")) {
        return json({
          path: ROOT,
          dirs: [],
          files: [
            { name: "a.txt", path: `${ROOT}\\a.txt`, is_dir: false, size: 3, modified: null },
            { name: "b.txt", path: `${ROOT}\\b.txt`, is_dir: false, size: 3, modified: null },
          ],
        })
      }
      return json({})
    })
    const { container } = renderPanel()
    await screen.findByText("a.txt")

    // a abre primero (respuesta manual), luego b queda en vuelo.
    fireEvent.click(fileRow(container, "a.txt"))
    await waitFor(() => expect(pending.length).toBe(1))
    pending[0]!.resolve(json({ content: "AAA", truncated: false }))
    await waitFor(() => expect(container.querySelector(".pcf-code-viewer")).toBeTruthy())
    fireEvent.click(fileRow(container, "b.txt"))
    await waitFor(() => expect(pending.length).toBe(2))

    // El usuario cierra; la lectura de b no debe reabrir el visor.
    fireEvent.click(screen.getByLabelText("Cerrar visor"))
    await waitFor(() => expect(container.querySelector(".pcf-code-viewer")).toBeNull())
    pending[1]!.resolve(json({ content: "BBB", truncated: false }))
    await new Promise((r) => setTimeout(r, 30))
    expect(container.querySelector(".pcf-code-viewer")).toBeNull()

    // Y si se abre otra vez, una respuesta vieja no pisa la nueva lectura.
    fireEvent.click(fileRow(container, "a.txt"))
    await waitFor(() => expect(pending.length).toBe(3))
    fireEvent.click(fileRow(container, "b.txt"))
    await waitFor(() => expect(pending.length).toBe(4))
    pending[3]!.resolve(json({ content: "BBB", truncated: false }))
    await waitFor(() => expect(container.querySelector(".pcf-code-viewer-file")?.textContent).toContain("b.txt"))
    pending[2]!.resolve(json({ content: "AAA", truncated: false }))
    await new Promise((r) => setTimeout(r, 30))
    expect(container.querySelector(".pcf-code-viewer-file")?.textContent).toContain("b.txt")
    expect(container.textContent).not.toContain("AAA")
  })

  it("una respuesta vieja de carpeta no pisa la navegación nueva", async () => {
    const listPending: Array<{ url: string; resolve: (r: Response) => void }> = []
    let deferLists = false
    vi.stubGlobal("fetch", async (input: unknown) => {
      const url = String(input)
      const decoded = decodeURIComponent(url)
      if (url.includes("/shell/fs/drives")) return json({ drives: [ROOT] })
      if (url.includes("/shell/fs/favorites")) return json({ favorites: [] })
      if (url.includes("/shell/fs/list")) {
        if (deferLists) {
          return await new Promise<Response>((resolve) => listPending.push({ url: decoded, resolve }))
        }
        return json({
          path: ROOT,
          dirs: [{ name: "sub", path: SUB, is_dir: true, size: null, modified: null }],
          files: [{ name: "root.txt", path: `${ROOT}\\root.txt`, is_dir: false, size: 4, modified: null }],
        })
      }
      return json({})
    })
    const { container } = renderPanel()
    await screen.findByText("root.txt")

    deferLists = true
    fireEvent.click(container.querySelector<HTMLElement>(".pcf-row.pcf-dir")!)
    const subReq = await waitFor(() => {
      expect(listPending.length).toBe(1)
      return listPending[0]!
    })
    const rootCrumb = Array.from(container.querySelectorAll<HTMLElement>(".pcf-crumb")).find(
      (c) => c.textContent?.trim() === "proj"
    )
    expect(rootCrumb).toBeTruthy()
    fireEvent.click(rootCrumb!)
    const rootReq = await waitFor(() => {
      expect(listPending.length).toBe(2)
      return listPending[1]!
    })

    // Responde primero la navegación vigente (root) y después la vieja (sub).
    rootReq.resolve(
      json({
        path: ROOT,
        dirs: [{ name: "sub", path: SUB, is_dir: true, size: null, modified: null }],
        files: [{ name: "root.txt", path: `${ROOT}\\root.txt`, is_dir: false, size: 4, modified: null }],
      })
    )
    await waitFor(() => expect(container.textContent).toContain("root.txt"))
    subReq.resolve(
      json({
        path: SUB,
        dirs: [],
        files: [{ name: "inside.txt", path: `${SUB}\\inside.txt`, is_dir: false, size: 15, modified: null }],
      })
    )
    await new Promise((r) => setTimeout(r, 30))
    expect(container.textContent).not.toContain("inside.txt")
    expect(container.querySelector(".pcf-crumb.active")?.textContent).toBe("proj")
  })

  it("tamaño de texto corrupto en storage no rompe A+ (sin NaN)", async () => {
    localStorage.setItem("opencode.explorer.viewerFontSize", '"abc"')
    const { container } = renderPanel()
    await openFile(container, "app.ts")
    const viewer = await waitFor(() => {
      const v = container.querySelector<HTMLElement>(".pcf-code-viewer.is-mobile")
      expect(v).toBeTruthy()
      return v!
    })
    expect(viewer.style.getPropertyValue("--pcf-code-font-size")).toBe("13px")
    fireEvent.click(screen.getByLabelText("Aumentar tamaño de texto"))
    await waitFor(() => expect(viewer.style.getPropertyValue("--pcf-code-font-size")).toBe("14px"))
  })
})
