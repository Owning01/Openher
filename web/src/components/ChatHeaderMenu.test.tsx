import { describe, it, expect, vi, afterEach } from "vitest"
import { render, fireEvent, cleanup } from "@testing-library/react"
import { I18nProvider } from "../i18n-context"
import { ChatHeader } from "./ChatHeader"
import { ChatOverflowMenu } from "./ChatOverflowMenu"
import type { SessionView } from "../types"

afterEach(() => cleanup())

function session(over: Partial<SessionView> & { id: string }): SessionView {
  return {
    title: over.id,
    directory: "C:\\proy",
    updated: 1000,
    status: "idle",
    files: 0,
    additions: 0,
    deletions: 0,
    ...over,
  }
}

// Contrato del menú "⋯" (25-sep): grupo tools primero con accordion, resto en
// raíz con Configuración separada, sin huérfanas. Los items conservan
// `.overflow-item` dentro de `.dropdown-menu`.
describe("ChatHeader menú fijo con grupo tools", () => {
  function renderMenu(over: Partial<Parameters<typeof ChatHeader>[0]> = {}) {
    const props: Parameters<typeof ChatHeader>[0] = {
      selectedSession: session({ id: "p1", title: "Chat" }),
      messages: [],
      busySessionIds: new Set(),
      sessions: [],
      onViewSubagents: vi.fn(),
      renamingSessionID: null,
      renameValue: "",
      onRenameChange: vi.fn(),
      onRenameConfirm: vi.fn(),
      onRenameCancel: vi.fn(),
      onBackToSessions: vi.fn(),
      pendingCount: 0,
      diffFiles: [],
      canCustomizeChat: false,
      onOpenChatCustomizer: vi.fn(),
      chatTermOpen: false,
      onToggleChatTerm: vi.fn(),
      showHistory: false,
      onToggleHistory: vi.fn(),
      showNotes: false,
      onToggleNotes: vi.fn(),
      isWorking: false,
      onOpenExport: vi.fn(),
      onToggleSearch: vi.fn(),
      flags: { fileBrowser: true } as never,
      readingMode: false,
      onToggleReadingMode: vi.fn(),
      onOpenPrompts: vi.fn(),
      onStartRename: vi.fn(),
      onOpenFileBrowser: vi.fn(),
      onOpenMCPBrowser: vi.fn(),
      onOpenOpenCodeHub: vi.fn(),
      onOpenSettings: vi.fn(),
      ...over,
    }
    const rendered = render(
      <I18nProvider language="en">
        <ChatHeader {...props} />
      </I18nProvider>
    )
    // Abrir el ⋯ (botón con title "More", sin clase propia).
    const dots = rendered.container.querySelector('.header-overflow button[title="More"]')
    fireEvent.click(dots!)
    return { ...rendered, props }
  }

  const labels = () =>
    Array.from(document.body.querySelectorAll(".dropdown-menu .overflow-item")).map((el) =>
      el.textContent ?? ""
    )

  it("tools agrupa las acciones de la conversación y la raíz lleva el resto en orden", () => {
    renderMenu({ onExportMarkdownTo: vi.fn(), onForkSession: vi.fn(), canCustomizeChat: true })
    const all = labels()
    // Grupo tools (accordion abierto por defecto): acciones de la conversación.
    expect(all.slice(0, 9)).toEqual([
      "tools",
      expect.stringContaining("Rename"),
      expect.stringContaining("Undo"),
      expect.stringContaining("Compact"),
      expect.stringContaining("Export .md"),
      expect.stringContaining("Fork"),
      expect.stringContaining("Search Messages"),
      expect.stringContaining("Prompts"),
      expect.stringContaining("Prompt history"),
    ])
    // Raíz: terminal, carpeta, MCP (vista), notas, OpenCode Config (vista),
    // personalizar y Configuración separado.
    expect(all.slice(9)).toEqual([
      expect.stringContaining("Terminal"),
      expect.stringContaining("Browse folder"),
      expect.stringContaining("MCP"),
      expect.stringContaining("Scratchpad"),
      expect.stringContaining("OpenCode Config"),
      expect.stringContaining("Customize chat"),
      expect.stringContaining("Settings"),
    ])
  })

  it("las 4 acciones recuperadas y las 2 de botón propio están en el menú", () => {
    renderMenu({ onExportMarkdownTo: vi.fn(), onForkSession: vi.fn(), canCustomizeChat: true })
    const text = labels().join("|")
    // Las 3 que el usuario pidió devolver (el modo lectura se volvió a sacar).
    expect(text).toContain("Export .md")
    expect(text).toContain("Fork")
    expect(text).toContain("Prompts")
    // Terminal y Personalizar: en ≤780px su botón está oculto (responsive.css),
    // así que el menú es la única entrada en el celu.
    expect(text).toContain("Terminal")
    expect(text).toContain("Customize chat")
    // El modo lectura no va en el menú.
    expect(text).not.toContain("Reading")
  })

  it("Terminal usa el mismo handler que su botón: toggle del dock", () => {
    const onToggleChatTerm = vi.fn()
    const { props } = renderMenu({ onToggleChatTerm })
    void props
    const term = Array.from(document.body.querySelectorAll(".dropdown-menu .overflow-item"))
      .find((el) => el.textContent?.includes("Terminal"))!
    fireEvent.click(term)
    expect(onToggleChatTerm).toHaveBeenCalledTimes(1)
  })

  it("el accordion de tools colapsa sin cerrar el menú", () => {
    renderMenu()
    const head = Array.from(document.body.querySelectorAll(".dropdown-menu .overflow-group-head"))[0]!
    expect(head.getAttribute("aria-expanded")).toBe("true")
    fireEvent.click(head)
    // El menú sigue abierto pero sin los hijos del grupo.
    expect(document.body.querySelector(".dropdown-menu")).toBeTruthy()
    expect(head.getAttribute("aria-expanded")).toBe("false")
    expect(labels().some((l) => l.includes("Rename"))).toBe(false)
  })

  it("Configuración lleva separador y las vistas llevan tag", () => {
    renderMenu()
    expect(document.body.querySelector(".dropdown-menu .overflow-separator")).toBeTruthy()
    const tags = Array.from(document.body.querySelectorAll(".dropdown-menu .overflow-tag")).map((el) => el.textContent)
    expect(tags).toEqual(["view", "view"])
  })
})

describe("ChatOverflowMenu aislado", () => {
  it("grupo vacío no renderiza cabecera", () => {
    render(
      <ChatOverflowMenu
        title="more"
        items={[{ id: "a", label: "A", onSelect: () => undefined }]}
        groups={[{ id: "tools", label: "tools" }]}
      />
    )
    expect(document.body.querySelector(".overflow-group-head")).toBeNull()
  })
})
