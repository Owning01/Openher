import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react"
import { SessionToolbar } from "./SessionToolbar"

afterEach(() => cleanup())

function renderToolbar(over: Partial<Parameters<typeof SessionToolbar>[0]> = {}) {
  const props: Parameters<typeof SessionToolbar>[0] = {
    refreshing: false,
    creating: false,
    onRefresh: vi.fn(async () => true),
    onNewSession: vi.fn(),
    dataMode: "full",
    ...over,
  }
  render(<SessionToolbar {...props} />)
  return props
}

describe("SessionToolbar", () => {
  it("botón + dispara onNewSession", () => {
    const p = renderToolbar()
    fireEvent.click(screen.getByText("Nueva"))
    expect(p.onNewSession).toHaveBeenCalledTimes(1)
  })

  it("creando deshabilita el + sin disparar", () => {
    const p = renderToolbar({ creating: true })
    const btn = screen.getByText("Nueva").closest("button") as HTMLButtonElement
    expect(btn.disabled).toBe(true)
    fireEvent.click(btn)
    expect(p.onNewSession).not.toHaveBeenCalled()
  })

  it("refresh ok muestra indicador, fail muestra error", async () => {
    const ok = renderToolbar({ onRefresh: vi.fn(async () => true) })
    fireEvent.click(document.querySelector(".session-toolbar-left button")!)
    expect(ok.onRefresh).toHaveBeenCalled()
    await waitFor(() => expect(document.querySelector(".conn-ok")).toBeTruthy())
    cleanup()
    renderToolbar({ onRefresh: vi.fn(async () => false) })
    fireEvent.click(document.querySelector(".session-toolbar-left button")!)
    await waitFor(() => expect(document.querySelector(".toolbar-refresh-fail")).toBeTruthy())
  })

  it("toggles de búsqueda y selección solo si hay handlers", () => {
    renderToolbar()
    expect(document.querySelector(".session-search-toggle")).toBeNull()
    cleanup()
    const onSearchToggle = vi.fn()
    const onToggleSelect = vi.fn()
    renderToolbar({ onSearchToggle, onToggleSelect, searchOpen: true, selecting: true })
    const search = document.querySelector(".session-search-toggle")!
    expect(search.getAttribute("aria-expanded")).toBe("true")
    fireEvent.click(search)
    expect(onSearchToggle).toHaveBeenCalled()
    const sel = document.querySelector("[aria-pressed]")!
    expect(sel.getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(sel)
    expect(onToggleSelect).toHaveBeenCalled()
  })
})
