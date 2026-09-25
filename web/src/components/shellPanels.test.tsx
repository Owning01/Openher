// Tests de caracterización del dispatcher ShellPanel y de los paneles simples
// (docs/updates/labs/config) de shellPanels.tsx (F9-Q1). Terminal/Explorer/
// Kanban/Browser/Doc tienen su propia maquinaria y tests vecinos. useT se mockea
// a identidad para que las aserciones sean sobre claves i18n estables.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { Component, type ReactNode } from "react"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { ShellPanel } from "./shellPanels"

// Error boundary mínima para capturar el crash de render de DocsPanel sin que
// se escape como error no manejado de Vitest.
class Catch extends Component<{ onError: (e: Error) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error) {
    this.props.onError(error)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

const { docsList, docsRead, updatesGet, labsList, configGet, configImport } = vi.hoisted(() => ({
  docsList: vi.fn(),
  docsRead: vi.fn(),
  updatesGet: vi.fn(),
  labsList: vi.fn(),
  configGet: vi.fn(),
  configImport: vi.fn(),
}))

vi.mock("../i18n-context", () => ({ useT: () => (k: string) => k }))
vi.mock("./DialogProvider", () => ({
  useDialog: () => ({ alert: vi.fn(async () => {}), confirm: vi.fn(async () => true), prompt: vi.fn(async () => null) }),
}))
vi.mock("../features/opencode2/Opencode2Button", () => ({ Opencode2Button: () => null }))
vi.mock("../shell", () => ({
  b64decode: (s: string) => s,
  fileIcon: () => null,
  shell: {
    docs: { list: docsList, read: docsRead },
    updates: { get: updatesGet },
    labs: { list: labsList, start: vi.fn(async () => ({})) },
    server: { status: vi.fn(async () => ({ running: true })), start: vi.fn(async () => ({})), stop: vi.fn(async () => ({})) },
    autostart: { get: vi.fn(async () => ({ enabled: false })), set: vi.fn(async () => ({})) },
    config: { get: configGet, import: configImport, export: vi.fn(async () => ({ config: { a: 1 } })) },
    opencode2: { autostartGet: vi.fn(async () => null), autostartSet: vi.fn(), ensure: vi.fn(), patch: vi.fn() },
  },
}))

beforeEach(() => {
  docsList.mockResolvedValue({
    root: "C:\\docs",
    files: [{ name: "a.md", path: "C:\\docs\\a.md", size: 10 }],
  })
  docsRead.mockResolvedValue({ path: "C:\\docs\\a.md", content: "# Hola" })
  updatesGet.mockResolvedValue({
    github: [{ repo: "o/r", releases: [{ tag: "v1", name: "One", date: "", url: "#", body: "" }], commits: [] }],
    x: [],
  })
  labsList.mockResolvedValue({ apps: [{ id: "app1", title: "App One", configured: true }] })
  configGet.mockResolvedValue({ a: 1 })
  configImport.mockResolvedValue({})
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderKind(kind: string) {
  return render(<ShellPanel kind={kind as never} cwd="C:\\x" onOpenSessionDir={vi.fn()} />)
}

describe("ShellPanel caracterización", () => {
  it("kind=docs lista archivos y al abrir uno renderiza el contenido sin romper", async () => {
    // FIX: antes DocsPanel pasaba children (`{!doc && ...}` => false) y
    // dangerouslySetInnerHTML en el mismo div, y React 19 lanzaba "Can only set
    // one of children or props.dangerouslySetInnerHTML" desmontando el panel.
    // Ahora el estado vacio y el cuerpo del doc se montan en ramas excluyentes,
    // asi que con doc solo se renderiza el HTML sanitizado.
    const errors: Error[] = []
    render(
      <Catch onError={(e) => errors.push(e)}>
        <ShellPanel kind={"docs" as never} cwd="C:\\x" onOpenSessionDir={vi.fn()} />
      </Catch>
    )
    expect(screen.getByPlaceholderText("shell.searchDocs")).toBeTruthy()
    fireEvent.click(await screen.findByText("a.md"))
    await waitFor(() => expect(docsRead).toHaveBeenCalledWith("C:\\docs\\a.md"))
    expect(await screen.findByText("Hola")).toBeTruthy()
    expect(errors).toHaveLength(0)
  })

  it("kind=config carga la config cruda formateada", async () => {
    const { container } = renderKind("config")
    const ta = (await waitFor(() => {
      const el = container.querySelector<HTMLTextAreaElement>(".shell-config-ta")
      expect(el?.value).toContain('"a": 1')
      return el!
    })) as HTMLTextAreaElement
    fireEvent.click(screen.getByText("shell.apply"))
    await waitFor(() => expect(configImport).toHaveBeenCalledWith({ a: 1 }))
    expect(ta.value).toContain('"a": 1')
  })
})
