import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, cleanup, fireEvent, within } from "@testing-library/react"
import { I18nProvider } from "../i18n-context"
import { MCPBrowser } from "./MCPBrowser"
import { api } from "../api"
import type { ServerConfig } from "../types"

vi.mock("../api", () => ({
  api: {
    listMCPServers: vi.fn(),
    listMCPResources: vi.fn(),
    connectMCPServer: vi.fn(),
    disconnectMCPServer: vi.fn(),
  },
}))

vi.mock("../shared/api/version", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../shared/api/version")>()
  return { ...actual, getApiVersion: vi.fn(async () => "v2") }
})

const config = { host: "127.0.0.1", port: 4098, username: "opencode", password: "octavio", apiVersion: "auto" } as ServerConfig

function renderModal() {
  return render(
    <I18nProvider language="en">
      <MCPBrowser config={config} onClose={() => {}} />
    </I18nProvider>,
  )
}

function serverRow(name: string): HTMLElement {
  return screen.getByText(name).closest(".mcp-server") as HTMLElement
}

beforeEach(() => {
  vi.mocked(api.listMCPServers).mockResolvedValue([
    { name: "chrome-devtools", status: "connected" },
    { name: "firebase", status: "disabled" },
    { name: "roto", status: "failed", error: "spawn ENOENT" },
  ])
  vi.mocked(api.listMCPResources).mockResolvedValue([])
  vi.mocked(api.connectMCPServer).mockResolvedValue(undefined)
  vi.mocked(api.disconnectMCPServer).mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("MCPBrowser (servidores)", () => {
  it("muestra cada server con su estado y el error de los failed", async () => {
    renderModal()
    expect(await screen.findByText("chrome-devtools")).toBeTruthy()
    expect(within(serverRow("chrome-devtools")).getByText("Connected")).toBeTruthy()
    expect(within(serverRow("firebase")).getByText("Disabled")).toBeTruthy()
    expect(within(serverRow("roto")).getByText("Failed")).toBeTruthy()
    expect(screen.getByText("spawn ENOENT")).toBeTruthy()
  })

  it("desactivar un server conectado llama disconnect", async () => {
    renderModal()
    await screen.findByText("chrome-devtools")
    fireEvent.click(within(serverRow("chrome-devtools")).getByRole("button", { name: "Disable" }))
    await waitFor(() => expect(api.disconnectMCPServer).toHaveBeenCalledWith(config, "chrome-devtools", undefined))
    expect(api.connectMCPServer).not.toHaveBeenCalled()
  })

  it("activar un server desactivado llama connect", async () => {
    renderModal()
    await screen.findByText("firebase")
    fireEvent.click(within(serverRow("firebase")).getByRole("button", { name: "Enable" }))
    await waitFor(() => expect(api.connectMCPServer).toHaveBeenCalledWith(config, "firebase", undefined))
    expect(api.disconnectMCPServer).not.toHaveBeenCalled()
  })

  it("si el toggle falla, muestra el error de la acción", async () => {
    vi.mocked(api.connectMCPServer).mockRejectedValue(new Error("boom"))
    renderModal()
    await screen.findByText("firebase")
    fireEvent.click(within(serverRow("firebase")).getByRole("button", { name: "Enable" }))
    expect(await screen.findByText(/firebase: boom/)).toBeTruthy()
  })
})
