import { describe, it, expect, vi, afterEach } from "vitest"
import { render, fireEvent, cleanup } from "@testing-library/react"
import { SessionList } from "./SessionList"
import { DialogProvider } from "./DialogProvider"
import type { SessionView } from "../types"

afterEach(() => cleanup())

function session(over: Partial<SessionView> & { id: string; title: string; directory: string }): SessionView {
  return {
    updated: 1000,
    status: "idle",
    files: 0,
    additions: 0,
    deletions: 0,
    ...over,
  }
}

const dirA = "C:\\proyA"
const dirB = "C:\\proyB"

const parentA = session({ id: "p1", title: "Chat principal A", directory: dirA, updated: 3000 })
const childA = session({ id: "c1", title: "Subagente A1", directory: dirA, updated: 2000, parentID: "p1" })
const topA = session({ id: "t1", title: "Otro chat A", directory: dirA, updated: 1000 })
// Huérfano: su padre ya no existe (borrado) pero la sesión sigue en el server.
const orphanB = session({ id: "o1", title: "Huerfano B", directory: dirB, updated: 2500, parentID: "padre-borrado" })

const all = [parentA, childA, topA, orphanB]

function renderList() {
  const props: Parameters<typeof SessionList>[0] = {
    projects: [
      [dirA, [parentA, childA, topA]],
      [dirB, [orphanB]],
    ],
    projectSessions: [],
    selectedProjectDir: null,
    sessions: all,
    selectedID: null,
    refreshingSessions: false,
    creatingSession: false,
    renamingSessionID: null,
    renameValue: "",
    connectionState: "connected",
    query: "",
    activeSessions: [],
    recentSessions: all,
    favorites: new Set(),
    dataMode: "full",
    onSelectProject: vi.fn(),
    onQueryChange: vi.fn(),
    onRefresh: vi.fn(async () => true),
    onNewSession: vi.fn(),
    onOpen: vi.fn(),
    onStartRename: vi.fn(),
    onRenameChange: vi.fn(),
    onRenameConfirm: vi.fn(),
    onRenameCancel: vi.fn(),
    onDelete: vi.fn(),
    onToggleFavorite: vi.fn(),
  }
  return render(
    <DialogProvider>
      <SessionList {...props} />
    </DialogProvider>
  )
}

function projectTitles(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll(".project-sessions-inline .session-title")).map(
    (el) => el.textContent ?? ""
  )
}

function recentTitles(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("#quick-recent .quick-access-title")).map(
    (el) => el.textContent ?? ""
  )
}

describe("SessionList proyectos múltiples y subagentes", () => {
  it("muestra la tarjeta del proyecto solo-subagentes (huérfanos visibles)", () => {
    const { container } = renderList()
    // Antes: el filtro !parentID dejaba la lista de B vacía y la tarjeta
    // caía por `length > 0`: el proyecto entero desaparecía.
    expect(container.querySelectorAll(".project-card")).toHaveLength(2)
  })

  it("despliega varias carpetas a la vez con sus sesiones", () => {
    const { container } = renderList()
    const cards = container.querySelectorAll(".project-card")
    fireEvent.click(cards[0]!)
    // Antes (un solo string|null): abrir B cerraba A. Ahora ambas abiertas.
    fireEvent.click(cards[1]!)
    expect(container.querySelectorAll(".project-sessions-inline")).toHaveLength(2)
    const titles = projectTitles(container)
    expect(titles).toContain("Chat principal A")
    expect(titles).toContain("Otro chat A")
    expect(titles).toContain("Huerfano B")
  })

  it("el hijo con padre listado se agrupa bajo él, no como tarjeta suelta", () => {
    const { container } = renderList()
    fireEvent.click(container.querySelectorAll(".project-card")[0]!)
    expect(container.querySelectorAll(".project-sessions-inline .is-child-session")).toHaveLength(1)
    const child = container.querySelector(".project-sessions-inline .is-child-session .session-title")
    expect(child?.textContent).toBe("Subagente A1")
  })

  it("recientes muestra huérfanos pero no hijos con padre listado", () => {
    const { container } = renderList()
    const recents = recentTitles(container)
    expect(recents).toContain("Chat principal A")
    expect(recents).toContain("Otro chat A")
    expect(recents).toContain("Huerfano B")
    // El hijo vive bajo su padre en la tarjeta del proyecto: duplicarlo en
    // recientes solo mete ruido.
    expect(recents).not.toContain("Subagente A1")
  })
})
