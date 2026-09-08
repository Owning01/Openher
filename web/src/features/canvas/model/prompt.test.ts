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

  it("describe las partes nuevas de app y el preset app", () => {
    const doc = makeDoc("MiApp")
    const home = doc.screens[0]!
    const appScreen = makeScreen("Principal", "app")
    doc.screens.push(appScreen)
    doc.parts[appScreen.id] = [
      { ...makePart("sideBar", 1280), label: "Inicio, Ajustes" },
      { ...makePart("chatBubble", 1280), label: "Hola", variant: "filled" },
      { ...makePart("avatar", 1280), label: "Ada Lovelace" },
      { ...makePart("tabBar", 1280), label: "Chats, Llamadas" },
    ]
    const es = generatePrompt(doc, { lang: "es" })
    expect(es).toContain("ventana de app desktop 1280x800")
    expect(es).toContain("Barra lateral")
    expect(es).toContain("propia")
    expect(es).toContain("Avatar")
    expect(es).toContain("Pestañas")
    const en = generatePrompt(doc, { lang: "en", screenId: appScreen.id })
    expect(en).toContain("desktop app window")
    expect(en).toContain("outgoing chat bubble")
    expect(en).toContain("avatar with initials")
  })

  it("makePart da tamaños coherentes a las partes nuevas", () => {
    expect(makePart("sideBar", 1280).w).toBe(232)
    expect(makePart("avatar", 412).w).toBe(48)
    expect(makePart("chatBubble", 412).variant).toBe("tonal")
  })
})
