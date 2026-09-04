import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { I18nProvider } from "../i18n-context"

vi.mock("./shellPanels", () => ({
  SingleTerminal: ({ tabId, cwd }: { tabId: string; cwd?: string }) => (
    <div data-testid="single-term" data-tab={tabId} data-cwd={cwd ?? ""} />
  ),
}))

import { ChatTerminalDock } from "./ChatTerminalDock"

afterEach(() => {
  cleanup()
})

function renderDock(onHide: () => void, onKill: () => void) {
  return render(
    <I18nProvider language="en">
      <ChatTerminalDock tabId="chat-term-s1-g0" cwd="/proj" onHide={onHide} onKill={onKill} />
    </I18nProvider>
  )
}

describe("ChatTerminalDock", () => {
  it("reutiliza SingleTerminal con el tabId y cwd dados", async () => {
    const onHide = vi.fn()
    const onKill = vi.fn()
    renderDock(onHide, onKill)
    const term = await screen.findByTestId("single-term")
    expect(term.getAttribute("data-tab")).toBe("chat-term-s1-g0")
    expect(term.getAttribute("data-cwd")).toBe("/proj")
    expect(onHide).not.toHaveBeenCalled()
    expect(onKill).not.toHaveBeenCalled()
  })

  it("la X elimina (onKill) y el chevron solo oculta (onHide)", async () => {
    const onHide = vi.fn()
    const onKill = vi.fn()
    renderDock(onHide, onKill)
    await screen.findByTestId("single-term")
    fireEvent.click(screen.getByLabelText("Close panel"))
    expect(onKill).toHaveBeenCalledTimes(1)
    expect(onHide).not.toHaveBeenCalled()
    fireEvent.click(screen.getByLabelText("Collapse sidebar"))
    expect(onHide).toHaveBeenCalledTimes(1)
  })

  it("el borde superior redimensiona y persiste el alto", async () => {
    localStorage.removeItem("opencode.chat.term.height")
    const onHide = vi.fn()
    const onKill = vi.fn()
    const { container } = renderDock(onHide, onKill)
    await screen.findByTestId("single-term")
    const handle = container.querySelector(".terminal-dock-resizer")
    expect(handle).not.toBeNull()
    // jsdom: offsetHeight 0 → arrastrar 100px arriba da 100, clamp a 140
    fireEvent.pointerDown(handle!, { clientY: 300 })
    window.dispatchEvent(new window.MouseEvent("pointermove", { clientY: 200, bubbles: true }))
    window.dispatchEvent(new window.MouseEvent("pointerup", { bubbles: true }))
    expect(localStorage.getItem("opencode.chat.term.height")).toBe("140")
    expect(onHide).not.toHaveBeenCalled()
    expect(onKill).not.toHaveBeenCalled()
  })

  it("flotar mantiene el mismo tabId (PTY vivo) y clic fuera re-acopla", async () => {
    const onHide = vi.fn()
    const onKill = vi.fn()
    const { container } = renderDock(onHide, onKill)
    await screen.findByTestId("single-term")
    fireEvent.click(screen.getByLabelText("Maximize panel"))
    // En overlay flotante, misma terminal montada
    const term = await screen.findByTestId("single-term")
    expect(term.getAttribute("data-tab")).toBe("chat-term-s1-g0")
    expect(container.querySelector(".modal-overlay")).not.toBeNull()
    expect(onHide).not.toHaveBeenCalled()
    // Clic fuera: vuelve al dock, sin ocultar ni matar
    const overlay = container.querySelector(".modal-overlay") as HTMLElement
    fireEvent.click(overlay)
    await screen.findByTestId("single-term")
    expect(container.querySelector(".modal-overlay")).toBeNull()
    expect(onHide).not.toHaveBeenCalled()
    expect(onKill).not.toHaveBeenCalled()
  })
})
