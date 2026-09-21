// Tests de caracterización de RemoteDesktop (F9-Q1).
// Fijan: config ausente, stream ok/error, consentimiento en datos móviles,
// teclado virtual y selector de fuente. El hook de stream y el puente desktop
// se mockean; acá se caracteriza el render y el cableado de la UI.
import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from "vitest"
import type { ComponentProps } from "react"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { I18nProvider } from "../i18n-context"
import { loadLanguage } from "../i18n"
import { RemoteDesktop } from "./RemoteDesktop"

const { hookState, inputMock, infoMock, thumbMock } = vi.hoisted(() => ({
  hookState: {
    current: {
      status: "idle" as string,
      error: null as string | null,
      imageUrl: null as string | null,
      info: null as unknown,
      fps: 0,
      bytes: 0,
      latency: null as number | null,
      refreshInfo: vi.fn(async () => null),
      retry: vi.fn(),
    },
  },
  inputMock: vi.fn(),
  infoMock: vi.fn(),
  thumbMock: vi.fn(async () => "blob:thumb"),
}))

vi.mock("../hooks/useRemoteDesktop", () => ({
  useRemoteDesktop: () => hookState.current,
}))
vi.mock("../desktop", () => ({
  desktopApi: { health: vi.fn(async () => true), input: inputMock, info: infoMock },
  desktopThumb: thumbMock,
}))

const CONFIG = { host: "127.0.0.1", port: 5901, username: "opencode", password: "x" }

// El chunk de idioma carga async; con es ya cargado el provider re-renderiza
// en el mismo tick del efecto y los findBy* ven el texto real en español.
beforeAll(async () => {
  await loadLanguage("es")
})

beforeEach(() => {
  inputMock.mockReset().mockResolvedValue(undefined)
  thumbMock.mockReset().mockResolvedValue("blob:thumb")
  hookState.current = {
    status: "idle",
    error: null,
    imageUrl: null,
    info: null,
    fps: 0,
    bytes: 0,
    latency: null,
    refreshInfo: vi.fn(async () => null),
    retry: vi.fn(),
  }
  ;(URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = vi.fn()
  ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    disconnect() {}
  }
})

afterEach(cleanup)

function renderDesktop(props: Partial<ComponentProps<typeof RemoteDesktop>> = {}) {
  return render(
    <I18nProvider language="es">
      <RemoteDesktop config={null} onClose={vi.fn()} {...props} />
    </I18nProvider>
  )
}

describe("RemoteDesktop caracterización", () => {
  it("sin config muestra el estado 'falta configurar' y abrir ajustes", async () => {
    const onClose = vi.fn()
    const onOpenSettings = vi.fn()
    renderDesktop({ onOpenSettings, onClose })
    expect(
      await screen.findByText("Configurá host/puerto del agente de escritorio para usar escritorio remoto")
    ).toBeTruthy()
    fireEvent.click(screen.getByText("Configuración"))
    expect(onClose).toHaveBeenCalled()
    expect(onOpenSettings).toHaveBeenCalled()
  })

  it("sin config y sin onOpenSettings no muestra el botón de ajustes", async () => {
    const { container } = renderDesktop()
    await screen.findByText(
      "Configurá host/puerto del agente de escritorio para usar escritorio remoto"
    )
    expect(container.querySelector(".desktop-missing button.btn-primary")).toBeNull()
  })

  it("streaming pinta el frame, fps y el chip de datos", async () => {
    hookState.current = {
      ...hookState.current,
      status: "streaming",
      imageUrl: "blob:frame",
      fps: 12,
      bytes: 2048,
      latency: 30,
    }
    renderDesktop({ config: CONFIG as never })
    expect(await screen.findByRole("dialog", { name: "Escritorio remoto" })).toBeTruthy()
    expect(screen.getByAltText("Escritorio remoto")).toBeTruthy()
    expect(screen.getByText("12 fps")).toBeTruthy()
    expect(screen.getByText(/12 fps · 30 ms · 2 KB/)).toBeTruthy()
  })

  it("estado error muestra Reintentar y llama al retry del hook", async () => {
    const retry = vi.fn()
    hookState.current = { ...hookState.current, status: "error", error: "connection failed", retry }
    renderDesktop({ config: CONFIG as never })
    expect((await screen.findAllByText("Fallo de conexión")).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByText("Reintentar"))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it("en datos móviles pide consentimiento y lo oculta al continuar", async () => {
    renderDesktop({ config: CONFIG as never, dataMode: "ultra" })
    expect(await screen.findByText("Estás en datos móviles")).toBeTruthy()
    fireEvent.click(screen.getByText("Continuar (Baja)"))
    await waitFor(() => expect(screen.queryByText("Estás en datos móviles")).toBeNull())
  })

  it("el teclado virtual aparece al togglear y manda mods al puente", async () => {
    renderDesktop({ config: CONFIG as never })
    fireEvent.click(await screen.findByLabelText("Teclado"))
    const ctrl = await screen.findByText("CTRL")
    fireEvent.click(ctrl)
    await waitFor(() =>
      expect(inputMock).toHaveBeenCalledWith(CONFIG, { type: "key", code: "ctrl", action: "down" })
    )
  })

  it("el selector de fuente lista ventanas y cambia la etiqueta", async () => {
    hookState.current = {
      ...hookState.current,
      info: {
        monitors: [{ primary: true }],
        windows: [{ hwnd: 7, title: "Editor", process: "code.exe" }],
      },
      refreshInfo: vi.fn(async () => ({
        monitors: [{ primary: true }],
        windows: [{ hwnd: 7, title: "Editor", process: "code.exe" }],
      })),
    }
    const { container } = renderDesktop({ config: CONFIG as never })
    fireEvent.click(await screen.findByLabelText("Fuente"))
    expect(await screen.findByText("Editor")).toBeTruthy()
    expect(container.querySelector(".desktop-picker")).toBeTruthy()
    fireEvent.click(screen.getByText("Editor").closest("button")!)
    await waitFor(() => expect(container.querySelector(".desktop-picker")).toBeNull())
    // la fuente elegida queda como label del botón de fuente
    expect(screen.getByLabelText("Fuente").textContent).toContain("Editor")
  })
})
