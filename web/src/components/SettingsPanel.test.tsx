// Tests de caracterización de SettingsPanel (F9-Q1). Los hijos pesados y los
// hooks de entorno se mockean; se caracteriza la navegación por categorías
// (mobile muestra todo / desktop una sola), avisos, cierre y confirmaciones.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import type { ComponentProps } from "react"
import { SettingsPanel } from "./SettingsPanel"
import type { FeatureFlags, ServerConfig, ChatSettings } from "../types"

const { desktopState } = vi.hoisted(() => ({ desktopState: { value: false } }))

vi.mock("../i18n-context", () => ({ useT: () => (k: string) => k }))
vi.mock("../hooks/useIsDesktop", () => ({ useIsDesktop: () => desktopState.value }))
vi.mock("../hooks/useSidebarPrefs", () => ({
  useSidebarPrefs: () => ({ prefs: { position: "left", hidden: [] }, setPosition: vi.fn(), toggleItem: vi.fn() }),
  SIDEBAR_ITEM_IDS: [],
}))
vi.mock("../hooks/useAutoOpencode2", () => ({
  useAutoOpencode2: () => ({ enabled: false, setEnabled: vi.fn(), toggle: vi.fn() }),
}))
vi.mock("../shell", () => ({
  shell: {
    autostart: { get: vi.fn(async () => ({ enabled: false })), set: vi.fn(async () => ({})) },
    config: { get: vi.fn(async () => ({})), patch: vi.fn(async () => ({})) },
    opencode2: { autostartGet: vi.fn(async () => null), autostartSet: vi.fn(), ensure: vi.fn(), patch: vi.fn() },
  },
}))
vi.mock("../desktop", () => ({
  desktopApi: { health: vi.fn(async () => true) },
  loadDesktopConfig: () => ({ host: "", port: 5901, username: "opencode", password: "" }),
  saveDesktopConfig: vi.fn(),
  canTestDesktop: () => false,
}))
vi.mock("../goUsage", () => ({
  fetchGoUsage: vi.fn(),
  loadGoAccounts: vi.fn(async () => []),
  saveGoAccounts: vi.fn(async () => {}),
}))
vi.mock("./ProviderManager", () => ({ ProviderManager: () => <div data-testid="provider-manager" /> }))
vi.mock("./GoUsagePanel", () => ({ GoUsagePanel: () => <div data-testid="go-usage" /> }))
vi.mock("./DefaultModelPicker", () => ({ DefaultModelPicker: () => <div data-testid="default-model-picker" /> }))
vi.mock("./ChatCustomizer", () => ({ ChatCustomizer: () => <div data-testid="chat-customizer" /> }))
vi.mock("./SnippetManager", () => ({ SnippetManager: () => <div data-testid="snippet-manager" /> }))
vi.mock("./DataUsageModal", () => ({ DataUsageModal: () => <div data-testid="data-usage" /> }))
vi.mock("./ThinkingLevels", () => ({ ThinkingLevels: () => null }))
vi.mock("./PairModal", () => ({ PairModal: () => <div data-testid="pair-modal" /> }))
vi.mock("./WeatherSettings", () => ({ WeatherSettings: () => null }))
vi.mock("./ExportCacheButton", () => ({ ExportCacheButton: () => null }))
vi.mock("./BuildStamp", () => ({ BuildStamp: () => null }))
vi.mock("./LedSwitch", () => ({ LedSwitch: () => null }))
vi.mock("../features/opencode2/Opencode2Button", () => ({ Opencode2Button: () => null }))
vi.mock("../plugins", () => ({ PluginSlot: () => null }))

function baseProps(overrides: Partial<ComponentProps<typeof SettingsPanel>> = {}) {
  return {
    draftConfig: { host: "127.0.0.1", port: 4096, username: "u", password: "p" } as ServerConfig,
    onChange: vi.fn(),
    onTest: vi.fn(),
    testingConnection: false,
    canTestDraft: true,
    testAlreadyPassedForDraft: false,
    connectedVersion: "",
    settingsNotice: null,
    language: "es" as const,
    onLanguageChange: vi.fn(),
    theme: "dark",
    onThemeChange: vi.fn(),
    languageOptions: [],
    dataMode: "full" as const,
    onDataModeChange: vi.fn(),
    onNavigate: vi.fn(),
    modelOptions: [],
    selectedModelKey: null,
    onChangeModel: vi.fn(),
    modelKey: () => "k",
    selectedVariant: null,
    activeModelOption: null,
    blockedModels: {
      isBlocked: () => false,
      toggleBlocked: vi.fn(),
      toggleAllForProvider: vi.fn(),
      providerBlockedCount: () => 0,
      blockedCount: 0,
    },
    flags: {} as FeatureFlags,
    onToggleFlag: vi.fn(),
    onSetFlag: vi.fn(),
    providers: [],
    connectingProvider: null,
    providerError: null,
    onConnectProvider: vi.fn(),
    onDisconnectProvider: vi.fn(),
    serverProfiles: [],
    onAddServerProfile: () => ({}),
    onRemoveServerProfile: vi.fn(),
    onUpdateServerProfile: vi.fn(),
    onApplyServerProfile: vi.fn(),
    onAddPairServer: vi.fn(),
    activeServerProfileID: null,
    chatSettings: {} as ChatSettings,
    onChatSettingChange: vi.fn(),
    onResetChatSettings: vi.fn(),
    snippets: [],
    onAddSnippet: vi.fn(),
    onRemoveSnippet: vi.fn(),
    onShutdownHost: vi.fn(),
    onRestartHost: vi.fn(),
    onOpenGitHub: vi.fn(),
    ...overrides,
  } as ComponentProps<typeof SettingsPanel>
}

beforeEach(() => {
  desktopState.value = false
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("SettingsPanel caracterización", () => {
  it("mobile: sin sidebar y con todas las secciones visibles", () => {
    const { container } = render(<SettingsPanel {...baseProps()} />)
    expect(container.querySelector(".settings-sidebar-nav")).toBeNull()
    expect(screen.getByText("Server & Data Connection")).toBeTruthy()
    expect(screen.getByText("Host Control & Maintenance")).toBeTruthy()
  })

  it("desktop: la sidebar navega y muestra una categoría por vez", async () => {
    desktopState.value = true
    const { container } = render(<SettingsPanel {...baseProps()} />)
    expect(container.querySelector(".settings-sidebar-nav")).toBeTruthy()
    expect(screen.getByRole("heading", { level: 2, name: "General" })).toBeTruthy()
    fireEvent.click(screen.getByText("Models"))
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 2, name: "Models" })).toBeTruthy()
    )
    expect(screen.queryByText("Server & Data Connection")).toBeNull()
    expect(screen.getByTestId("provider-manager")).toBeTruthy()
    fireEvent.click(screen.getByText("Browser"))
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 2, name: "Browser" })).toBeTruthy()
    )
  })

  it("pinta avisos de error y de conexión verificada", () => {
    render(
      <SettingsPanel
        {...baseProps({
          settingsNotice: { type: "error", text: "no conecta" },
          connectedVersion: "1.2.3",
          testAlreadyPassedForDraft: true,
        })}
      />
    )
    expect(screen.getByText("no conecta")).toBeTruthy()
    expect(screen.getByText("settings.connectedTo")).toBeTruthy()
  })

  it("con onClose envuelve en modal y el botón cierra", () => {
    const onClose = vi.fn()
    render(<SettingsPanel {...baseProps({ onClose })} />)
    expect(screen.getByRole("dialog", { name: "nav.settings" })).toBeTruthy()
    fireEvent.click(screen.getByLabelText("panel.close"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("Escape llama a onClose", () => {
    const onClose = vi.fn()
    render(<SettingsPanel {...baseProps({ onClose })} />)
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("el toggle de contraseña cambia el type del input", () => {
    const { container } = render(<SettingsPanel {...baseProps()} />)
    const pass = container.querySelector<HTMLInputElement>('input[name="password"]')!
    expect(pass.type).toBe("password")
    fireEvent.click(screen.getByLabelText("Mostrar"))
    expect(container.querySelector<HTMLInputElement>('input[name="password"]')!.type).toBe("text")
  })

  it("shutdown pide confirmación y luego llama onShutdownHost", () => {
    const onShutdownHost = vi.fn()
    render(<SettingsPanel {...baseProps({ onShutdownHost })} />)
    fireEvent.click(screen.getByRole("button", { name: "extras.shutdownHost" }))
    expect(screen.getByText("extras.shutdownConfirmTitle")).toBeTruthy()
    fireEvent.click(screen.getByText("extras.shutdownConfirm"))
    expect(onShutdownHost).toHaveBeenCalledTimes(1)
  })
})
