import { describe, it, expect } from "vitest"
import { appendWebFinal, combineDisplay, mergeNativePartial } from "./dictationBuffer"

describe("appendWebFinal", () => {
  it("parte de vacío", () => {
    expect(appendWebFinal("", "hola")).toBe("hola")
  })
  it("acumula con espacio", () => {
    expect(appendWebFinal("hola", "mundo")).toBe("hola mundo")
  })
  it("no duplica la cola re-emitida tras reinicio", () => {
    expect(appendWebFinal("hola mundo", "mundo")).toBe("hola mundo")
  })
  it("chunk vacío no toca el buffer (no borra)", () => {
    expect(appendWebFinal("hola mundo", "   ")).toBe("hola mundo")
  })
  it("permite repetir una palabra en posición nueva", () => {
    expect(appendWebFinal("hola", "hola de nuevo")).toBe("hola hola de nuevo")
  })
})

describe("combineDisplay", () => {
  it("solo finales", () => {
    expect(combineDisplay("hola", "")).toBe("hola")
  })
  it("finales + interim", () => {
    expect(combineDisplay("hola", "cómo")).toBe("hola cómo")
  })
  it("nunca vacía si hay finales", () => {
    expect(combineDisplay("hola mundo", "  ")).toBe("hola mundo")
  })
})

describe("mergeNativePartial (regresión: pausar y retomar no borra)", () => {
  it("parcial vacío se ignora, jamás vacía", () => {
    expect(mergeNativePartial("hola mundo", 0, "   ")).toBe("hola mundo")
  })
  it("hipótesis que crece reescribe la cola", () => {
    expect(mergeNativePartial("hola", 0, "hola mundo")).toBe("hola mundo")
  })
  it("hipótesis a mitad de palabra conserva lo más largo", () => {
    expect(mergeNativePartial("hola mun", 0, "hola mu")).toBe("hola mun")
  })
  it("segmento nuevo tras pausa se añade, no reemplaza", () => {
    expect(mergeNativePartial("hola", 4, "cómo estás")).toBe("hola cómo estás")
  })
  it("parcial contenido en el buffer no borra (palabra repetida)", () => {
    expect(mergeNativePartial("hola mundo", 0, "hola")).toBe("hola mundo")
  })
  it("segunda utterance reescribe solo su cola", () => {
    const base = "hola".length
    const step1 = mergeNativePartial("hola", base, "cómo")
    expect(step1).toBe("hola cómo")
    const step2 = mergeNativePartial(step1, base, "cómo estás bien")
    expect(step2).toBe("hola cómo estás bien")
  })
  it("final con distinto casing/puntuación reemplaza la cola, no duplica", () => {
    expect(mergeNativePartial("hola mundo", 0, "Hola mundo.")).toBe("Hola mundo.")
  })
  it("extensión con casing distinto reescribe la cola", () => {
    expect(mergeNativePartial("hola mun", 0, "Hola mundo")).toBe("Hola mundo")
  })
})
