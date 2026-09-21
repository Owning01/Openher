// Tests de caracterización de OpenCodeHubModal (F9-Q1).
// Fijan: puerta isOpen, tabs agents/skills/config, filtro por búsqueda,
// selección de agente, validación/formato/guardado de JSON y cierre con Esc.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import type { ComponentProps } from "react"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { OpenCodeHubModal } from "./OpenCodeHubModal"

const getGlobal = vi.fn()
const saveGlobal = vi.fn()
const loadRawConfig = vi.fn()

vi.mock("../shell", () => ({
  shell: {
    opencode: {
      getGlobal: (...args: unknown[]) => getGlobal(...args),
      saveGlobal: (...args: unknown[]) => saveGlobal(...args),
    },
  },
}))
vi.mock("../api", () => ({
  api: { loadRawConfig: (...args: unknown[]) => loadRawConfig(...args) },
}))

const CONFIG_CONTENT = '{"model":"x"}'
const GLOBAL_DATA = {
  configPath: "C:\\cfg\\opencode.json",
  configContent: CONFIG_CONTENT,
  configFiles: [{ path: "C:\\cfg\\opencode.json", name: "opencode.json", content: CONFIG_CONTENT }],
  instructionsFiles: [],
  skills: [
    { name: "skill-a", description: "hace A", path: "C:\\skills\\a", skillFile: "SKILL.md", source: "global" },
  ],
  scannedRoots: ["C:\\skills"],
}

const AGENTS = [
  { id: "build", name: "build", description: "constructor", prompt: "PROMPT BUILD", mode: "primary" },
  { id: "plan", name: "plan", description: "planificador", mode: "primary" },
]

beforeEach(() => {
  vi.clearAllMocks()
  getGlobal.mockResolvedValue(GLOBAL_DATA)
  saveGlobal.mockResolvedValue({ ok: true })
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  })
})

afterEach(cleanup)

function renderModal(overrides: Partial<ComponentProps<typeof OpenCodeHubModal>> = {}) {
  return render(
    <OpenCodeHubModal
      isOpen
      onClose={vi.fn()}
      agents={AGENTS}
      activeAgentID="build"
      onSelectAgent={vi.fn()}
      {...overrides}
    />
  )
}

describe("OpenCodeHubModal caracterización", () => {
  it("isOpen=false no renderiza nada", () => {
    const { container } = render(
      <OpenCodeHubModal isOpen={false} onClose={vi.fn()} agents={AGENTS} />
    )
    expect(container.innerHTML).toBe("")
  })

  it("abierto lista agentes y marca el activo; no ofrece seleccionar el activo", async () => {
    renderModal()
    expect(await screen.findByText(/OpenHer Hub \(Agentes, Skills & Configuración\)/)).toBeTruthy()
    expect(screen.getByText("Agentes Oficiales (2)")).toBeTruthy()
    expect((await screen.findAllByText("build")).length).toBeGreaterThan(0)
    expect(screen.getByText("ACTIVO EN CHAT")).toBeTruthy()
    // plan es el único no activo => un solo botón Seleccionar
    expect(screen.getAllByText("Seleccionar")).toHaveLength(1)
  })

  it("la búsqueda filtra agentes por nombre, id o prompt", async () => {
    renderModal()
    await screen.findAllByText("plan")
    fireEvent.change(screen.getByPlaceholderText(/Buscar agentes o prompts/), {
      target: { value: "planificador" },
    })
    expect(screen.queryByText("build")).toBeNull()
    expect(screen.getAllByText("plan").length).toBeGreaterThan(0)
  })

  it("Seleccionar llama onSelectAgent con el id y cierra", async () => {
    const onSelectAgent = vi.fn()
    const onClose = vi.fn()
    renderModal({ onSelectAgent, onClose })
    await screen.findAllByText("plan")
    fireEvent.click(screen.getByText("Seleccionar"))
    expect(onSelectAgent).toHaveBeenCalledWith("plan")
    expect(onClose).toHaveBeenCalled()
  })

  it("tab Skills muestra skills y rutas escaneadas; vacío muestra mensaje", async () => {
    renderModal()
    await screen.findAllByText("plan")
    fireEvent.click(screen.getByText("Skills del Sistema (1)"))
    expect(await screen.findByText("skill-a")).toBeTruthy()
    expect(screen.getByText("C:\\skills")).toBeTruthy()

    getGlobal.mockResolvedValue({ ...GLOBAL_DATA, skills: [], scannedRoots: [] })
    cleanup()
    renderModal()
    fireEvent.click(await screen.findByText("Skills del Sistema (0)"))
    expect(await screen.findByText("No se detectaron skills en las carpetas estándar.")).toBeTruthy()
    expect(screen.getByText("ninguna carpeta encontrada")).toBeTruthy()
  })

  it("tab Config carga el JSON, valida y bloquea Guardar si es inválido", async () => {
    renderModal()
    fireEvent.click(await screen.findByText(/Configuración Oficial/))
    const ta = (await screen.findByDisplayValue(CONFIG_CONTENT)) as HTMLTextAreaElement
    fireEvent.change(ta, { target: { value: "{ roto" } })
    expect(screen.getAllByText(/Expected|JSON|Unexpected/i).length).toBeGreaterThan(0)
    const save = screen.getByText("Guardar Configuración").closest("button")!
    expect(save).toBeDisabled()
  })

  it("Formatear JSON reindenta el contenido válido", async () => {
    renderModal()
    fireEvent.click(await screen.findByText(/Configuración Oficial/))
    const ta = (await screen.findByDisplayValue(CONFIG_CONTENT)) as HTMLTextAreaElement
    fireEvent.click(screen.getByText("Formatear JSON"))
    await waitFor(() => expect(ta.value).toBe('{\n  "model": "x"\n}'))
  })

  it("Guardar Configuración usa saveGlobal y muestra éxito", async () => {
    renderModal()
    fireEvent.click(await screen.findByText(/Configuración Oficial/))
    await screen.findByDisplayValue(CONFIG_CONTENT)
    fireEvent.click(screen.getByText("Guardar Configuración"))
    await waitFor(() => expect(saveGlobal).toHaveBeenCalledWith("C:\\cfg\\opencode.json", CONFIG_CONTENT))
    expect(await screen.findByText("¡Configuración guardada exitosamente!")).toBeTruthy()
  })

  it("Escape dispara onClose", async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    await screen.findAllByText("plan")
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("sin getGlobal cae al config del servidor vía api.loadRawConfig", async () => {
    getGlobal.mockRejectedValue(new Error("no bridge"))
    loadRawConfig.mockResolvedValue({ model: "server-model" })
    renderModal({ serverConfig: { host: "127.0.0.1", port: 4096 } as never })
    fireEvent.click(await screen.findByText(/Configuración Oficial/))
    expect(await screen.findByDisplayValue(/"server-model"/)).toBeTruthy()
  })
})
