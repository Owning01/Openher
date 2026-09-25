import { describe, it, expect } from "vitest"
import { describeComputed } from "./domStyles"

describe("describeComputed", () => {
  it("captura props con valor y descarta las que no aportan", () => {
    const el = document.createElement("div")
    el.style.display = "flex"
    el.style.padding = "12px"
    el.style.color = "rgb(255, 0, 0)"
    document.body.appendChild(el)

    const computed = describeComputed(el)
    expect(computed["display"]).toBe("flex")
    expect(computed["padding"]).toBe("12px")
    expect(computed["color"]).toBe("rgb(255, 0, 0)")
    // sin info: no aparece
    expect(computed["box-shadow"]).toBeUndefined()
    el.remove()
  })

  it("devuelve {} con null (documento cross-origin)", () => {
    expect(describeComputed(null)).toEqual({})
  })
})
