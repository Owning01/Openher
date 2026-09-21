// Tests de caracterización de AppModals (F9-Q1).
// Fijan QUÉ modal se monta con cada flag de App y con qué props sale el modal.
// Los hijos se stubbean: acá se caracteriza el cableado de AppModals, no cada modal.
import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { AppModals, type AppModalsProps } from "./AppModals"

vi.mock("./BottomSheet", () => ({ BottomSheet: () => <div data-testid="bottom-sheet" /> }))
vi.mock("./ConfirmModal", () => ({
  ConfirmModal: (props: { session: { id: string } }) => (
    <div data-testid="confirm-modal">{props.session.id}</div>
  ),
}))
vi.mock("./ShortcutsModal", () => ({
  ShortcutsModal: (props: { desktop: boolean }) => (
    <div data-testid="shortcuts">{String(props.desktop)}</div>
  ),
}))
vi.mock("./ErrorModal", () => ({
  ErrorModal: (props: { message: string }) => <div data-testid="error-modal">{props.message}</div>,
}))
vi.mock("./OpenCodeHubModal", () => ({
  OpenCodeHubModal: (props: { isOpen: boolean }) =>
    props.isOpen ? <div data-testid="hub" /> : null,
}))
vi.mock("../plugins", () => ({ PluginSlot: () => null }))
vi.mock("./ThemePicker", () => ({ ThemePicker: () => <div data-testid="theme-picker" /> }))
vi.mock("./ThemeCreator", () => ({ ThemeCreator: () => <div data-testid="theme-creator" /> }))
vi.mock("./ConnectProviderSheet", () => ({
  ConnectProviderSheet: () => <div data-testid="connect-sheet" />,
}))
vi.mock("./MCPBrowser", () => ({ MCPBrowser: () => <div data-testid="mcp-browser" /> }))
vi.mock("./ArchivedList", () => ({
  ArchivedList: (props: { sessions: Array<{ id: string }> }) => (
    <div data-testid="archived">{props.sessions.map((s) => s.id).join(",")}</div>
  ),
}))
vi.mock("./FileEditor", () => ({ FileEditor: () => <div data-testid="file-editor" /> }))
vi.mock("./FileBrowser", () => ({ FileBrowser: () => <div data-testid="file-browser" /> }))
vi.mock("./TerminalView", () => ({
  TerminalView: (props: { sessionID: string }) => (
    <div data-testid="terminal">{props.sessionID}</div>
  ),
}))
vi.mock("./RemoteDesktop", () => ({ RemoteDesktop: () => <div data-testid="remote-desktop" /> }))
vi.mock("./FavoritesManager", () => ({ FavoritesManager: () => <div data-testid="favorites" /> }))

afterEach(cleanup)

const CONFIG = { host: "127.0.0.1", port: 4096, username: "u", password: "p" } as never

function baseProps(overrides: Partial<AppModalsProps> = {}): AppModalsProps {
  return {
    activeDetailSheet: null,
    onCloseDetailSheet: vi.fn(),
    modelOptions: [],
    modelLoadError: null,
    activeModelOption: null,
    filteredVariantGroups: { recentModels: [], groups: new Map() },
    modelQuery: "",
    isWorking: false,
    changeModel: vi.fn(),
    setModelQuery: vi.fn(),
    selectedVariant: null,
    formatLimit: () => "",
    projectName: null,
    projectPath: null,
    vcsBranch: null,
    projectDashboard: null,
    diffFiles: [],
    totalDiffAdditions: 0,
    totalDiffDeletions: 0,
    dashboardError: null,
    config: null,
    loadModels: async () => {},
    selectedSession: null,
    sessionToDelete: null,
    onConfirmDeleteSession: vi.fn(),
    onCancelDeleteSession: vi.fn(),
    showThemePicker: false,
    onCloseThemePicker: vi.fn(),
    showThemeCreator: false,
    onCloseThemeCreator: vi.fn(),
    showConnectSheet: false,
    onCloseConnectSheet: vi.fn(),
    connectProvider: async () => true,
    disconnectProvider: async () => {},
    removeProviderCredential: async () => {},
    activateProviderCredential: async () => {},
    addCustomProvider: async () => true,
    showMCPBrowser: false,
    onCloseMCPBrowser: vi.fn(),
    showArchivedView: false,
    onCloseArchivedView: vi.fn(),
    sessions: [],
    onRestoreArchivedSession: vi.fn(),
    onOpenSession: vi.fn(),
    fileEditorPath: null,
    onCloseFileEditor: vi.fn(),
    currentActiveSession: null,
    activeSessionDir: "",
    fb: {
      isOpen: false,
      currentPath: "",
      items: [],
      loading: false,
      error: null,
      close: vi.fn(),
      navigateTo: vi.fn(),
      goUp: vi.fn(),
    },
    onOpenFileEditor: vi.fn(),
    showTerminal: false,
    isDesktop: false,
    terminalDocked: false,
    shellLines: [],
    shellRunning: false,
    terminalShell: "powershell",
    setTerminalShell: vi.fn(),
    shellExecute: vi.fn(),
    shellClear: vi.fn(),
    onCloseTerminal: vi.fn(),
    shellHistory: [],
    setTerminalDocked: vi.fn(),
    showRemoteDesktop: false,
    onCloseRemoteDesktop: vi.fn(),
    desktopCfg: null,
    dataMode: "full",
    onNavigateSettings: vi.fn(),
    showShortcuts: false,
    onCloseShortcuts: vi.fn(),
    showFavoritesManager: false,
    onCloseFavoritesManager: vi.fn(),
    favorites: new Set<string>(),
    showOpenCodeHub: false,
    onCloseOpenCodeHub: vi.fn(),
    agentOptions: [],
    activeAgentID: "",
    changeAgent: vi.fn(),
    runtimeError: null,
    onCloseRuntimeError: vi.fn(),
    ...overrides,
  }
}

describe("AppModals caracterización de flags", () => {
  it("sin flags solo monta el BottomSheet (y el Hub cerrado)", async () => {
    render(<AppModals {...baseProps()} />)
    expect(await screen.findByTestId("bottom-sheet")).toBeTruthy()
    expect(screen.queryByTestId("theme-picker")).toBeNull()
    expect(screen.queryByTestId("terminal")).toBeNull()
    expect(screen.queryByTestId("hub")).toBeNull()
  })

  it("sessionToDelete monta ConfirmModal con la sesión a borrar", async () => {
    render(<AppModals {...baseProps({ sessionToDelete: { id: "s-9" } as never })} />)
    expect((await screen.findByTestId("confirm-modal")).textContent).toBe("s-9")
  })

  it("showConnectSheet solo monta con config presente", async () => {
    const { rerender } = render(<AppModals {...baseProps({ showConnectSheet: true })} />)
    expect(screen.queryByTestId("connect-sheet")).toBeNull()
    rerender(<AppModals {...baseProps({ showConnectSheet: true, config: CONFIG })} />)
    expect(await screen.findByTestId("connect-sheet")).toBeTruthy()
  })

  it("showArchivedView filtra solo sesiones archived", async () => {
    render(
      <AppModals
        {...baseProps({
          showArchivedView: true,
          sessions: [
            { id: "a", status: "active" },
            { id: "b", status: "archived" },
            { id: "c", status: "archived" },
          ] as never,
        })}
      />
    )
    expect((await screen.findByTestId("archived")).textContent).toBe("b,c")
  })

  it("fileEditorPath requiere config para montar FileEditor", async () => {
    const { rerender } = render(<AppModals {...baseProps({ fileEditorPath: "/x.ts" })} />)
    expect(screen.queryByTestId("file-editor")).toBeNull()
    rerender(<AppModals {...baseProps({ fileEditorPath: "/x.ts", config: CONFIG })} />)
    expect(await screen.findByTestId("file-editor")).toBeTruthy()
  })

  it("showTerminal se oculta si es desktop y está dockeado", async () => {
    const { rerender } = render(
      <AppModals {...baseProps({ showTerminal: true, isDesktop: true, terminalDocked: true })} />
    )
    expect(screen.queryByTestId("terminal")).toBeNull()
    rerender(<AppModals {...baseProps({ showTerminal: true, isDesktop: true, terminalDocked: false })} />)
    expect(await screen.findByTestId("terminal")).toBeTruthy()
  })

  it("runtimeError monta ErrorModal con el mensaje", async () => {
    render(<AppModals {...baseProps({ runtimeError: "boom" })} />)
    expect((await screen.findByTestId("error-modal")).textContent).toBe("boom")
  })

  it("showThemeCreator y showFavoritesManager montan sus contenedores", async () => {
    render(<AppModals {...baseProps({ showThemeCreator: true, showFavoritesManager: true })} />)
    expect(await screen.findByTestId("theme-creator")).toBeTruthy()
    expect(await screen.findByTestId("favorites")).toBeTruthy()
  })
})
