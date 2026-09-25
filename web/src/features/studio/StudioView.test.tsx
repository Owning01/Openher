import { describe, it, expect, vi, afterEach } from "vitest"
import { StrictMode } from "react"
import { render, fireEvent, cleanup, waitFor } from "@testing-library/react"
import { I18nProvider } from "../../i18n-context"
import { StudioView } from "./StudioView"

const h = vi.hoisted(() => ({
  project: null as any,
  sessionFor: (_dir: string): any => null,
}))

vi.mock("./useStudioProject", () => ({
  useStudioProject: () => ({
    project: h.project,
    previewUrl: h.project ? "http://127.0.0.1:5173/" : "",
    serving: false,
    error: null,
    reloadKey: 0,
    devServer: { hasDevServer: false, devCommand: null, status: "idle", serverUrl: null, startDevServer: vi.fn(), stopDevServer: vi.fn() },
    startDev: vi.fn(),
    openFolder: vi.fn(),
    openDirectory: vi.fn(),
    close: vi.fn(),
    reload: vi.fn(),
    selectEntry: vi.fn(),
    setError: vi.fn(),
  }),
}))

vi.mock("./useOpenDesign", () => ({
  useOpenDesign: () => ({ projects: [], loading: false, error: null, refresh: vi.fn() }),
}))

vi.mock("../external-plugins/ExternalIframePanel", () => ({
  ExternalIframePanel: () => <div data-testid="od-embed" />,
}))

vi.mock("../../components/SessionChatPanel", () => ({
  SessionChatPanel: ({ session }: any) => <div data-testid="studio-chat" data-session={session?.directory} />,
}))

afterEach(() => {
  cleanup()
  h.project = null
  h.sessionFor = () => null
})

const vs = {
  annotations: [] as any[],
  inspectMode: false,
  inspectTool: "picker",
  selection: null,
  promptContext: "",
  clear: vi.fn(),
  clearAnnotations: vi.fn(),
  setInspectMode: vi.fn(),
  removeAnnotation: vi.fn(),
  setAnnotationComment: vi.fn(),
}

function props(over: Record<string, unknown> = {}) {
  const noop = vi.fn()
  return {
    config: null as any,
    dataMode: "full" as any,
    connectionState: "connected" as any,
    busySessions: new Set<string>(),
    baseChatProps: {} as any,
    vs,
    sessions: [],
    onEnsureProjectSession: async (dir: string) => h.sessionFor(dir),
    onRefreshSessions: noop,
    onSetCommands: noop,
    onRecordPrompt: noop,
    onQueueAction: noop,
    onShellExecute: noop,
    onChangeAgent: noop,
    onOpenInThisPanel: noop,
    onSwapPanels: noop,
    onSettleSession: noop,
    onOpenFile: noop,
    onOpenConnect: noop,
    onOpenBrowser: noop,
    onToggleInspectTool: noop,
    onBrowserVisualPick: noop,
    ...over,
  }
}

const proj = (dir: string) => ({ directory: dir, name: dir.split("/").pop(), kind: "node", token: "t1", entryPoint: "index.html", htmlFiles: ["index.html"] })

describe("StudioView (sin proyecto)", () => {
  it("al elegir Open Design muestra el generador embebido y los detectados", () => {
    const { getByText, getByTestId, queryByText } = render(<I18nProvider language="en"><StudioView {...(props() as any)} /></I18nProvider>)
    fireEvent.click(getByText("Generate with Open Design"))
    expect(getByTestId("od-embed")).toBeTruthy()
    expect(getByText("Detected in Open Design")).toBeTruthy()
    expect(queryByText("Open existing project")).toBeNull()
  })
})

describe("StudioView (cambio de proyecto)", () => {
  it("no deja visible la sesión del proyecto anterior si la nueva falla", async () => {
    h.project = proj("C:/A")
    h.sessionFor = (dir) => (dir.includes("/A") ? { id: "sA", directory: "C:/A", title: "A" } : null)
    const p = props({ config: {} as any })

    const { rerender, findByTestId, queryByTestId, getByText } = render(
      <I18nProvider language="en"><StudioView {...(p as any)} /></I18nProvider>
    )
    const chatA = await findByTestId("studio-chat")
    expect(chatA.getAttribute("data-session")).toBe("C:/A")

    // Cambiar a un proyecto cuya sesión no se puede crear.
    h.project = proj("C:/B")
    rerender(<I18nProvider language="en"><StudioView {...(p as any)} /></I18nProvider>)

    await waitFor(() => expect(queryByTestId("studio-chat")).toBeNull())
    expect(getByText(/Could not create the project agent session/)).toBeTruthy()
  })

  it("no pierde la sesión si el callback cambia de identidad mientras resuelve", async () => {
    h.project = proj("C:/A")
    let resolveEnsure: (v: unknown) => void = () => {}
    const ensure1 = () => new Promise((r) => { resolveEnsure = r })
    const p = props({ config: {} as any, onEnsureProjectSession: ensure1 })
    const { rerender, findByTestId } = render(
      <I18nProvider language="en"><StudioView {...(p as any)} /></I18nProvider>
    )
    // En producción el callback cambia de identidad en cada render (depende de
    // `sessions`/`creatingSession`); no debe cancelar la request en vuelo.
    const ensure2 = () => new Promise((r) => { resolveEnsure = r })
    rerender(<I18nProvider language="en"><StudioView {...(props({ config: {} as any, onEnsureProjectSession: ensure2 }) as any)} /></I18nProvider>)
    resolveEnsure({ id: "sA", directory: "C:/A" })
    const chat = await findByTestId("studio-chat")
    expect(chat.getAttribute("data-session")).toBe("C:/A")
  })

  it("no entra en bucle si el server devuelve el dir con otra forma (\\ vs /)", async () => {
    h.project = proj("C:/A")
    let calls = 0
    const ensure = async () => { calls += 1; return { id: "sA", directory: "C:\\A\\" } }
    const { findByTestId } = render(
      <I18nProvider language="en"><StudioView {...(props({ config: {} as any, onEnsureProjectSession: ensure }) as any)} /></I18nProvider>
    )
    const chat = await findByTestId("studio-chat")
    expect(chat.getAttribute("data-session")).toBe("C:\\A\\")
    await new Promise((r) => setTimeout(r, 30))
    expect(calls).toBe(1)
  })

  it("monta bajo StrictMode sin quedar en 'Preparing…' (replay de efectos)", async () => {
    h.project = proj("C:/A")
    h.sessionFor = () => ({ id: "sA", directory: "C:/A", title: "A" })
    const { findByTestId } = render(
      <StrictMode>
        <I18nProvider language="en"><StudioView {...(props({ config: {} as any }) as any)} /></I18nProvider>
      </StrictMode>
    )
    const chat = await findByTestId("studio-chat")
    expect(chat.getAttribute("data-session")).toBe("C:/A")
  })
})
