import { describe, it, expect } from "vitest"
import { makeDoc, makePart, makeScreen, BACK_TARGET } from "./canvasTypes"
import { generatePrompt } from "./prompt"

function seedDoc() {
  const doc = makeDoc("Recetas")
  const home = doc.screens[0]!
  const detail = makeScreen("Detalle", "phone")
  doc.screens.push(detail)
  doc.parts[detail.id] = []
  doc.parts[home.id] = [
    { ...makePart("topAppBar", 412), label: "Recetas" },
    { ...makePart("button", 412), label: "Cocinar", action: { to: detail.id } },
  ]
  return { doc, home, detail }
}

describe("generatePrompt", () => {
  it("describe pantallas, partes y navegacion en español", () => {
    const { doc } = seedDoc()
    const out = generatePrompt(doc, { lang: "es", platform: "android" })
    expect(out).toContain('Construi la app "Recetas"')
    expect(out).toContain('Pantalla "Inicio"')
    expect(out).toContain("Barra superior")
    expect(out).toContain('abre "Detalle"')
    expect(out).toContain("Jetpack Compose")
  })

  it("genera en ingles con stack web y respeta screenId", () => {
    const { doc, detail } = seedDoc()
    const out = generatePrompt(doc, { lang: "en", platform: "web", screenId: detail.id })
    expect(out).toContain('Build the "Recetas" app with React + Tailwind')
    expect(out).toContain('Screen "Detalle"')
    expect(out).not.toContain('Screen "Inicio"')
  })

  it("marca pantallas vacias y accion back", () => {
    const doc = makeDoc("Vacia")
    const home = doc.screens[0]!
    doc.parts[home.id] = [{ ...makePart("text", 412), label: "Hola", action: { to: BACK_TARGET } }]
    const out = generatePrompt(doc, { lang: "es" })
    expect(out).toContain("vuelve a la pantalla anterior")
  })
})
