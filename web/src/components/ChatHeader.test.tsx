import { describe, it, expect, vi, afterEach } from "vitest"
import { render, fireEvent, cleanup } from "@testing-library/react"
import { I18nProvider } from "../i18n-context"
import { ChatHeader } from "./ChatHeader"
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

const parent = session({ id: "p1", title: "Chat principal" })

function renderHeader(over: Partial<Parameters<typeof ChatHeader>[0]> = {}) {
  const props: Parameters<typeof ChatHeader>[0] = {
    selectedSession: parent,
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
    flags: {} as never,
    readingMode: false,
    onToggleReadingMode: vi.fn(),
    onOpenPrompts: vi.fn(),
    onStartRename: vi.fn(),
    ...over,
  }
  const rendered = render(
    <I18nProvider language="en">
      <ChatHeader {...props} />
    </I18nProvider>
  )
  return { ...rendered, props }
}

describe("ChatHeader botón de subagentes activos", () => {
  it("sin hijos activos no muestra el botón", () => {
    const idle = session({ id: "c1", title: "Subagente quieto", parentID: "p1", status: "idle" })
    const { container } = renderHeader({ sessions: [parent, idle], busySessionIds: new Set() })
    expect(container.querySelector(".header-bg-pill")).toBeNull()
  })

  it("con un hijo activo muestra el conteo y abre su chat al elegirlo", () => {
    const busy = session({ id: "c1", title: "Subagente vivo", parentID: "p1", status: "busy" })
    const idle = session({ id: "c2", title: "Subagente quieto", parentID: "p1", status: "idle" })
    const { container, props } = renderHeader({
      sessions: [parent, busy, idle],
      busySessionIds: new Set(["c1"]),
    })
    const btn = container.querySelector(".header-bg-pill")
    // en es síncrono (bundle estático): sin depender del chunk async.
    expect(btn?.textContent).toContain("Active subagents (1)")
    fireEvent.click(btn!)
    const item = Array.from(document.body.querySelectorAll(".dropdown-menu .overflow-item"))
      .find((el) => el.textContent?.includes("Subagente vivo"))
    expect(item).toBeTruthy()
    fireEvent.click(item!)
    expect(props.onViewSubagents).toHaveBeenCalledWith("c1")
  })
})
