import { describe, it, expect, beforeEach } from "vitest"
import { kanbanPromptText, shellAuthHeader } from "./shell"

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

describe("shellAuthHeader", () => {
  beforeEach(() => localStorage.clear())

  it("manda Basic con username aunque el password esté vacío (pair móvil sin contraseña)", () => {
    localStorage.setItem(
      "opencode.remote.server",
      JSON.stringify({ host: "100.64.0.2", port: 4098, username: "opencode", password: "" })
    )
    expect(shellAuthHeader()).toEqual({ Authorization: `Basic ${btoa("opencode:")}` })
  })

  it("manda Basic con user:pass cuando hay contraseña", () => {
    localStorage.setItem(
      "opencode.remote.server",
      JSON.stringify({ host: "100.64.0.2", port: 4098, username: "opencode", password: "secreto" })
    )
    expect(shellAuthHeader()).toEqual({ Authorization: `Basic ${btoa("opencode:secreto")}` })
  })

  it("sin username no manda header", () => {
    localStorage.setItem("opencode.remote.server", JSON.stringify({ host: "100.64.0.2", port: 4098 }))
    expect(shellAuthHeader()).toEqual({})
  })
})
