import { describe, it, expect } from "vitest"
import { kanbanPromptText } from "./shell"

describe("kanbanPromptText", () => {
  it("solo título sin notas", () => {
    expect(kanbanPromptText("Hacer login", "")).toBe("Hacer login")
    expect(kanbanPromptText("Hacer login", "   ")).toBe("Hacer login")
  })
  it("título + notas separadas por línea en blanco", () => {
    expect(kanbanPromptText("Hacer login", "usar OAuth2")).toBe("Hacer login\n\nusar OAuth2")
  })
  it("recorta bordes", () => {
    expect(kanbanPromptText("  T  ", "  N  ")).toBe("T\n\nN")
  })
})
