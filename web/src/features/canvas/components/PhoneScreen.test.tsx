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
