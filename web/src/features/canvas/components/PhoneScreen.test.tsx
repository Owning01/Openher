import { describe, it, expect, vi } from "vitest"
import { render, cleanup, fireEvent } from "@testing-library/react"
import { PhoneScreen } from "./PhoneScreen"
import { makePart, makeScreen, type CanvasPartKind, type ScreenPreset } from "../model/canvasTypes"

const KINDS: CanvasPartKind[] = [
  "topAppBar", "button", "chip", "text", "card", "listItem", "switch",
  "textField", "divider", "fab", "bottomNav", "searchBar",
  "sideBar", "chatBubble", "avatar", "tabBar",
]

function screenWithAll(preset: ScreenPreset) {
  const screen = makeScreen("Test", preset)
  const w = preset === "phone" ? 412 : 1280
  return {
    screen,
    parts: KINDS.map((kind, i) => ({ ...makePart(kind, w), y: 30 + i * 100 })),
  }
}

afterEach(cleanup)

describe("PhoneScreen", () => {
  it.each(["phone", "desktop", "app"] as const)("renderiza los 16 tipos en preset %s sin crashear", (preset) => {
    const { screen, parts } = screenWithAll(preset)
    const { container } = render(<PhoneScreen screen={screen} parts={parts} mode="edit" />)
    expect(container.querySelector(".m3e-scope")).not.toBeNull()
    // 16 partes + fondo de edicion
    expect(container.querySelectorAll(".m3e-part").length).toBe(16)
    expect(container.querySelector(".m3e-sidebar")).not.toBeNull()
    expect(container.querySelector(".m3e-bubble")).not.toBeNull()
    expect(container.querySelector(".m3e-avatar")).not.toBeNull()
    expect(container.querySelector(".m3e-tabs")).not.toBeNull()
    // Iconos Lucide reales (SVG del proyecto), no glifos de texto legacy
    for (const sel of [".m3e-fab", ".m3e-search", ".m3e-list", ".m3e-bar-top", ".m3e-bar-bottom"]) {
      const el = container.querySelector(sel)
      expect(`${sel} con SVG`).toBeTruthy()
      expect(el!.querySelector("svg")).not.toBeNull()
    }
  })

  it("marco de celular con status y notch; ventana con titlebar en desktop/app", () => {
    const p = screenWithAll("phone")
    const r1 = render(<PhoneScreen screen={p.screen} parts={p.parts} mode="preview" />)
    expect(r1.container.querySelector(".m3e-statusbar")).not.toBeNull()
    expect(r1.container.querySelector(".m3e-notch")).not.toBeNull()
    expect(r1.container.querySelector(".m3e-titlebar")).toBeNull()
    r1.unmount()
    const d = screenWithAll("desktop")
    const r2 = render(<PhoneScreen screen={d.screen} parts={d.parts} mode="preview" />)
    expect(r2.container.querySelector(".m3e-browser")).not.toBeNull()
    r2.unmount()
    const a = screenWithAll("app")
    const r3 = render(<PhoneScreen screen={a.screen} parts={a.parts} mode="preview" />)
    expect(r3.container.querySelector(".m3e-titlebar-btns")).not.toBeNull()
    r3.unmount()
  })

  it("click en edicion selecciona; tap en preview navega", () => {
    const { screen, parts } = screenWithAll("phone")
    const onSelect = vi.fn()
    const r = render(<PhoneScreen screen={screen} parts={parts} mode="edit" onSelect={onSelect} />)
    const first = r.container.querySelector(".m3e-part") as HTMLElement
    fireEvent.click(first)
    expect(onSelect).toHaveBeenCalled()
    r.unmount()

    const withAction = parts.map((x, i) => (i === 0 ? { ...x, action: { to: "back" } } : x))
    const onTap = vi.fn()
    const r2 = render(<PhoneScreen screen={screen} parts={withAction} mode="preview" onTap={onTap} />)
    // topAppBar no es draggable pero en preview el tap dispara igual
    const tappable = r2.container.querySelectorAll(".m3e-tappable")
    expect(tappable.length).toBe(1)
    fireEvent.click(tappable[0] as HTMLElement)
    expect(onTap).toHaveBeenCalled()
    r2.unmount()
  })
})
