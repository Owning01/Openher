import { describe, it, expect } from "vitest"
import { calcMenuPos } from "./menuPos"

const VP = { w: 1280, h: 800 }

describe("calcMenuPos", () => {
  it("ancla al borde derecho del anchor cuando hay espacio", () => {
    const pos = calcMenuPos({ right: 500, bottom: 100, top: 70 }, 260, 300, VP)
    expect(pos).toEqual({ left: 240, top: 106 })
  })
  it("se corre a la izquierda si se saldría del viewport", () => {
    const pos = calcMenuPos({ right: 1280, bottom: 100, top: 70 }, 260, 300, VP)
    expect(pos.left).toBe(1280 - 260 - 8)
    expect(pos.top).toBe(106)
  })
  it("nunca sale por la izquierda con sidebar angosto", () => {
    // Sidebar de 200px: el dropdown de 260 no entra ni a derecha; left = margen
    const pos = calcMenuPos({ right: 190, bottom: 60, top: 30 }, 260, 300, VP)
    expect(pos.left).toBe(8)
  })
  it("flip hacia arriba si no entra abajo", () => {
    const pos = calcMenuPos({ right: 500, bottom: 780, top: 750 }, 260, 300, VP)
    expect(pos).toEqual({ left: 240, bottom: 800 - 750 + 6 })
  })
  it("viewport más chico que el menú: ocupa casi todo", () => {
    const pos = calcMenuPos({ right: 300, bottom: 100, top: 70 }, 260, 300, { w: 200, h: 800 })
    expect(pos.left).toBe(8)
  })
})
