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

  it("recientes muestra solo sesiones principales (ni hijas ni huérfanas)", () => {
    const { container } = renderList()
    const recents = recentTitles(container)
    expect(recents).toContain("Chat principal A")
    expect(recents).toContain("Otro chat A")
    // Pedido explícito: las subsesiones (vivas u huérfanas) viven en la vista
    // de proyecto, nunca en Recientes.
    expect(recents).not.toContain("Huerfano B")
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

  it("auto-expande el proyecto colapsado al entrar en rename", () => {
    // Sin ningún click: el proyecto debe abrirse solo para mostrar el campo.
    const { container } = renderList({ renamingSessionID: "o1", renameValue: "Huerfano B" })
    expect(container.querySelectorAll(".project-sessions-inline")).toHaveLength(1)
    const input = container.querySelector(".project-sessions-inline .rename-input") as HTMLInputElement | null
    expect(input?.value).toBe("Huerfano B")
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

describe("SessionList acoplar subsesiones (toggle del toolbar)", () => {
  const KEY = "openher.coupleSubsessions"

  function toggleButton(container: HTMLElement): HTMLButtonElement {
    const btn = container.querySelector(".session-couple-toggle")
    expect(btn).toBeTruthy()
    return btn as HTMLButtonElement
  }

  it("arranca desacoplado: la hija no se duplica en recientes", () => {
    localStorage.removeItem(KEY)
    const { container } = renderList()
    expect(toggleButton(container).getAttribute("aria-pressed")).toBe("false")
    expect(recentTitles(container)).not.toContain("Subagente A1")
  })

  it("al acoplar, la hija queda bajo su padre SOLO en Favoritos (nunca en Recientes)", () => {
    localStorage.removeItem(KEY)
    localStorage.removeItem("opencode.collapsedSections")
    const { container } = renderList({ favorites: new Set(["p1", "c1"]) })
    fireEvent.click(toggleButton(container))

    expect(toggleButton(container).getAttribute("aria-pressed")).toBe("true")
    // Recientes: solo sesiones principales, con el toggle encendido o no.
    const titles = recentTitles(container)
    expect(titles).toContain("Chat principal A")
    expect(titles).not.toContain("Subagente A1")

    // En Favoritos la hija sí se acopla, con su wrap de árbol (línea + sangría).
    // Favoritos arranca colapsado: abrirlo solo después de medir Recientes
    // (el acordeón colapsa la otra sección al abrir una).
    if (!container.querySelector("#quick-favorites")) {
      fireEvent.click(container.querySelector('[aria-controls="quick-favorites"]')!)
    }
    const wrapped = container.querySelector("#quick-favorites .session-child-wrap")
    expect(wrapped?.querySelector(".quick-access-title")?.textContent).toBe("Subagente A1")
    // El padre conserva su fila normal (sin sangrar).
    const parent = Array.from(container.querySelectorAll("#quick-favorites > .quick-access-card"))
      .find((el) => el.querySelector(".quick-access-title")?.textContent === "Chat principal A")
    expect(parent).toBeTruthy()
    localStorage.removeItem(KEY)
    localStorage.removeItem("opencode.collapsedSections")
  })

  it("el estado queda persistido al recargar la vista", () => {
    localStorage.setItem(KEY, "1")
    const { container } = renderList()
    expect(toggleButton(container).getAttribute("aria-pressed")).toBe("true")
    // El toggle se restaura, pero Recientes sigue solo con principales.
    expect(recentTitles(container)).not.toContain("Subagente A1")
    localStorage.removeItem(KEY)
  })

  it("al desacoplar vuelve a la conducta histórica y guarda el 0", () => {
    localStorage.setItem(KEY, "1")
    const { container } = renderList()
    fireEvent.click(toggleButton(container))
    expect(toggleButton(container).getAttribute("aria-pressed")).toBe("false")
    expect(recentTitles(container)).not.toContain("Subagente A1")
    expect(localStorage.getItem(KEY)).toBe("0")
    localStorage.removeItem(KEY)
  })
})
