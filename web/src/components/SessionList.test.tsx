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

function renderList(over: Partial<Parameters<typeof SessionList>[0]> = {}) {
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
    ...over,
  }
  const rendered = render(
    <DialogProvider>
      <SessionList {...props} />
    </DialogProvider>
  )
  return { ...rendered, props }
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

describe("SessionList rename in-place estilo Windows", () => {
  it("click derecho → Renombrar llama a onStartRename con la sesión", () => {
    const { container, props } = renderList()
    fireEvent.click(container.querySelectorAll(".project-card")[0]!)
    const card = container.querySelector(".project-sessions-inline .session-card") as HTMLElement
    expect(card).toBeTruthy()
    fireEvent.contextMenu(card!, { clientX: 50, clientY: 50 })
    const item = Array.from(document.body.querySelectorAll(".context-menu-item"))
      .find((el) => el.textContent?.includes("Renombrar"))
    expect(item).toBeTruthy()
    fireEvent.click(item!)
    expect(props.onStartRename).toHaveBeenCalledTimes(1)
    expect((props.onStartRename as ReturnType<typeof vi.fn>).mock.calls[0][0].id).toBe("p1")
  })

  it("el campo sustituye al título sin botones (in-place)", () => {
    // El proyecto se auto-expande al entrar en rename: sin clicks.
    const { container } = renderList({ renamingSessionID: "t1", renameValue: "Otro chat A" })
    const cards = Array.from(container.querySelectorAll(".project-sessions-inline .session-card"))
    const renaming = cards.find((c) => c.querySelector(".rename-input"))
    expect(renaming).toBeTruthy()
    const input = renaming!.querySelector<HTMLInputElement>(".rename-input")!
    expect(input.value).toBe("Otro chat A")
    // Estilo Windows: sin botones de guardar/cancelar dentro del campo.
    expect(renaming!.querySelector(".rename-inline button")).toBeNull()
    // El resto de tarjetas siguen mostrando su título como texto.
    expect(container.querySelectorAll(".project-sessions-inline .session-title").length).toBeGreaterThan(0)
  })

  it("auto-expande el proyecto colapsado al entrar en rename", () => {
    // Sin ningún click: el proyecto debe abrirse solo para mostrar el campo.
    const { container } = renderList({ renamingSessionID: "o1", renameValue: "Huerfano B" })
    expect(container.querySelectorAll(".project-sessions-inline")).toHaveLength(1)
    const input = container.querySelector(".project-sessions-inline .rename-input") as HTMLInputElement | null
    expect(input?.value).toBe("Huerfano B")
  })

  it("recientes también editan in-place con el mismo campo", () => {
    const { container } = renderList({ renamingSessionID: "t1", renameValue: "Otro chat A" })
    const input = container.querySelector("#quick-recent .rename-input") as HTMLInputElement | null
    expect(input).toBeTruthy()
    expect(input?.value).toBe("Otro chat A")
  })

  it("Enter confirma desde el campo", () => {
    const { container, props } = renderList({ renamingSessionID: "t1", renameValue: "Nuevo nombre" })
    const input = container.querySelector(".project-sessions-inline .rename-input")!
    fireEvent.keyDown(input, { key: "Enter" })
    expect(props.onRenameConfirm).toHaveBeenCalledWith("t1", "Nuevo nombre", dirA)
  })

  it("Escape cancela desde el campo sin confirmar", () => {
    const { container, props } = renderList({ renamingSessionID: "t1", renameValue: "Nuevo nombre" })
    fireEvent.keyDown(container.querySelector(".project-sessions-inline .rename-input")!, { key: "Escape" })
    expect(props.onRenameCancel).toHaveBeenCalledTimes(1)
    expect(props.onRenameConfirm).not.toHaveBeenCalled()
  })

  it("no se auto-cancela al montar dos campos (recientes + proyecto)", () => {
    // startRename deja renameValue === título: el blur interno entre los dos
    // campos montados no debe disparar onCancel (antes el rename parpadeaba
    // y se cerraba solo).
    const { container, props } = renderList({ renamingSessionID: "t1", renameValue: "Otro chat A" })
    expect(container.querySelectorAll(".rename-input").length).toBeGreaterThanOrEqual(2)
    expect(props.onRenameCancel).not.toHaveBeenCalled()
    expect(props.onRenameConfirm).not.toHaveBeenCalled()
  })

  it("F2 sobre la tarjeta abre el rename", () => {
    const { container, props } = renderList()
    fireEvent.click(container.querySelectorAll(".project-card")[0]!)
    const card = container.querySelector(".project-sessions-inline .session-card")!
    fireEvent.keyDown(card, { key: "F2" })
    expect(props.onStartRename).toHaveBeenCalledTimes(1)
  })
})

describe("SessionList spinner de subsesión activa", () => {
  function renderWithStatuses(children: SessionView[]) {
    const list = renderList({
      projects: [[dirA, [parentA, ...children, topA]]],
      sessions: [parentA, ...children, topA],
      recentSessions: [parentA, ...children, topA],
    })
    fireEvent.click(list.container.querySelectorAll(".project-card")[0]!)
    return list
  }

  it("la hija activa muestra spinner chiquito gris, la idle no", () => {
    const busy = session({ id: "c1", title: "Subagente vivo", directory: dirA, parentID: "p1", status: "busy" })
    const idle = session({ id: "c2", title: "Subagente quieto", directory: dirA, parentID: "p1", status: "idle" })
    const { container } = renderWithStatuses([busy, idle])
    const cards = Array.from(container.querySelectorAll(".project-sessions-inline .is-child-session"))
    const spinner = (el: Element) => el.querySelector(".session-child-spinner")
    expect(cards).toHaveLength(2)
    expect(spinner(cards[0]!)).toBeTruthy()
    expect(spinner(cards[1]!)).toBeNull()
  })

  it("el padre activo no lleva spinner de hija", () => {
    const busyParent = session({ id: "p1", title: "Chat principal A", directory: dirA, status: "busy" })
    const idle = session({ id: "c2", title: "Subagente quieto", directory: dirA, parentID: "p1", status: "idle" })
    const { container } = renderList({
      projects: [[dirA, [busyParent, idle, topA]]],
      sessions: [busyParent, idle, topA],
      recentSessions: [busyParent, idle, topA],
    })
    fireEvent.click(container.querySelectorAll(".project-card")[0]!)
    const parentCard = container.querySelector(".project-sessions-inline .session-card:not(.is-child-session)")!
    expect(parentCard.querySelector(".session-title")?.textContent).toBe("Chat principal A")
    expect(parentCard.querySelector(".session-child-spinner")).toBeNull()
  })
})
