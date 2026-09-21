// Tests de caracterización de BrowserPanel (F9-Q1), en jsdom (IS_DESKTOP=false,
// rama iframe/proxy). Fijan: tabs, omnibox, minimal, tune dropdown, favoritos,
// find bar, estado offline y estado de error del iframe.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { BrowserPanel } from "./BrowserPanel"

vi.mock("../shell", () => ({
  shell: {
    browser: {
      open: vi.fn().mockResolvedValue(undefined),
      setBounds: vi.fn().mockResolvedValue(undefined),
      setVisibility: vi.fn().mockResolvedValue(undefined),
      navigate: vi.fn().mockResolvedValue(undefined),
      eval: vi.fn().mockResolvedValue(undefined),
      url: vi.fn().mockResolvedValue(""),
      shortcuts: vi.fn().mockResolvedValue([]),
      downloads: vi.fn().mockResolvedValue([]),
      drainPicks: vi.fn().mockResolvedValue([]),
    },
    fs: { pickFolder: vi.fn().mockResolvedValue({ ok: false }) },
    project: { serve: vi.fn().mockResolvedValue({ ok: false }) },
    profile: { get: vi.fn().mockResolvedValue(null) },
  },
}))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  localStorage.clear()
})

const tabs = (c: HTMLElement) => c.querySelectorAll(".browser-tab")

describe("BrowserPanel caracterización", () => {
  it("monta con una pestaña, omnibox y navegación deshabilitada al inicio", () => {
    const { container } = render(<BrowserPanel initialUrl="http://localhost:5173" />)
    expect(tabs(container)).toHaveLength(1)
    expect(container.querySelector<HTMLInputElement>(".browser-omnibox-input")!.value).toBe(
      "http://localhost:5173"
    )
    expect(screen.getByLabelText("Atrás")).toBeDisabled()
    expect(screen.getByLabelText("Adelante")).toBeDisabled()
    expect(screen.getByLabelText("Nueva pestaña")).toBeTruthy()
    expect(container.querySelector("iframe.browser-iframe-element")).toBeTruthy()
  })

  it("onClose se muestra como botón solo si se pasa; cerrar la última pestaña lo llama", () => {
    const onClose = vi.fn()
    const { container, rerender } = render(<BrowserPanel initialUrl="about:blank" />)
    expect(screen.queryByLabelText("Cerrar")).toBeNull()
    rerender(<BrowserPanel initialUrl="about:blank" onClose={onClose} />)
    fireEvent.click(screen.getByLabelText("Cerrar pestaña"))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(tabs(container)).toHaveLength(1)
  })

  it("agrega y cierra pestañas manteniendo al menos una", () => {
    const { container } = render(<BrowserPanel initialUrl="about:blank" />)
    fireEvent.click(screen.getByLabelText("Nueva pestaña"))
    expect(tabs(container)).toHaveLength(2)
    fireEvent.click(screen.getAllByLabelText("Cerrar pestaña")[1]!)
    expect(tabs(container)).toHaveLength(1)
    fireEvent.click(screen.getAllByLabelText("Cerrar pestaña")[0]!)
    expect(tabs(container)).toHaveLength(1)
  })

  it("hideTabBar oculta la barra de pestañas y navega con pila persistida", () => {
    const { container } = render(
      <BrowserPanel initialUrl="http://localhost:5173" hideTabBar persistKey="p1" />
    )
    expect(container.querySelector(".browser-tabbar")).toBeNull()
    expect(screen.queryByLabelText("Nueva pestaña")).toBeNull()
    expect(container.querySelector<HTMLInputElement>(".browser-omnibox-input")!.value).toBe(
      "http://localhost:5173"
    )
  })

  it("modo minimal esconde toolbar y se restaura con Mostrar barra", async () => {
    const { container } = render(<BrowserPanel initialUrl="about:blank" />)
    fireEvent.click(screen.getByLabelText("Minimal"))
    await waitFor(() => expect(container.querySelector(".browser-minimal")).toBeTruthy())
    expect(container.querySelector(".browser-toolbar")).toBeNull()
    fireEvent.click(screen.getByLabelText("Mostrar barra"))
    await waitFor(() => expect(container.querySelector(".browser-minimal")).toBeNull())
    expect(container.querySelector(".browser-toolbar")).toBeTruthy()
  })

  it("el dropdown de configuración lista puertos y modos de dispositivo", async () => {
    const { container } = render(<BrowserPanel initialUrl="about:blank" />)
    fireEvent.click(screen.getByLabelText("Configuración"))
    expect(await screen.findByText("Puertos locales rápidos")).toBeTruthy()
    expect(screen.getByText("Modo de dispositivo")).toBeTruthy()
    fireEvent.click(screen.getByText("375px"))
    await waitFor(() => expect(screen.queryByText("Puertos locales rápidos")).toBeNull())
    // iframe toma el ancho del modo dispositivo
    await waitFor(() =>
      expect(container.querySelector<HTMLIFrameElement>("iframe.browser-iframe-element")!.style.width).toBe("375px")
    )
  })

  it("la barra de favoritos navega al bookmark guardado", async () => {
    localStorage.setItem(
      "opencode.browser.bookmarks",
      JSON.stringify([{ url: "https://example.com/doc", title: "Doc", addedAt: 1 }])
    )
    const { container } = render(<BrowserPanel initialUrl="about:blank" />)
    const bm = await screen.findByText("Doc")
    fireEvent.click(bm)
    await waitFor(() =>
      expect(container.querySelector<HTMLInputElement>(".browser-omnibox-input")!.value).toBe(
        "https://example.com/doc"
      )
    )
  })

  it("find bar se abre y se cierra con Escape", async () => {
    render(<BrowserPanel initialUrl="about:blank" />)
    fireEvent.click(screen.getByLabelText("Buscar"))
    const input = await screen.findByPlaceholderText("Buscar en la página…")
    fireEvent.keyDown(input, { key: "Escape" })
    await waitFor(() => expect(screen.queryByPlaceholderText("Buscar en la página…")).toBeNull())
  })

  it("sin conexión muestra el cartel 'Sin conexión'", async () => {
    render(<BrowserPanel initialUrl="about:blank" />)
    fireEvent(window, new Event("offline"))
    expect(await screen.findByText("Sin conexión")).toBeTruthy()
    expect(screen.getByText("Reintentar")).toBeTruthy()
  })

  // Nota: el estado hasError ("No se pudo conectar con la página") se dispara
  // con el onError del iframe, que React 19 no cablea para <iframe> en jsdom
  // (probado: fireEvent.error no invoca el handler). Por eso se caracteriza la
  // navegación de historial, que es el otro productor de estado del viewport.
  it("navegar desde el omnibox habilita Atrás y Atrás vuelve", async () => {
    const { container } = render(<BrowserPanel initialUrl="about:blank" />)
    const input = container.querySelector<HTMLInputElement>(".browser-omnibox-input")!
    fireEvent.change(input, { target: { value: "example.com/doc" } })
    fireEvent.keyDown(input, { key: "Enter" })
    await waitFor(() => expect(input.value).toBe("https://example.com/doc"))
    expect(screen.getByLabelText("Atrás")).not.toBeDisabled()
    fireEvent.click(screen.getByLabelText("Atrás"))
    await waitFor(() => expect(input.value).toBe("about:blank"))
    expect(screen.getByLabelText("Atrás")).toBeDisabled()
  })
})
