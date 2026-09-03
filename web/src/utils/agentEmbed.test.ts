import { describe, it, expect } from "vitest"
import { splitEmbeds, fileUrlToPath } from "./agentEmbed"

describe("splitEmbeds", () => {
  it("sin tags devuelve un solo chunk md", () => {
    expect(splitEmbeds("hola **mundo**")).toEqual([{ type: "md", text: "hola **mundo**" }])
  })
  it("parte texto + embed + texto", () => {
    const parts = splitEmbeds('mira:\n<agent-embed src="file:///C:/a/w.html"></agent-embed>\nlisto')
    expect(parts).toEqual([
      { type: "md", text: "mira:\n" },
      { type: "embed", src: "file:///C:/a/w.html" },
      { type: "md", text: "\nlisto" },
    ])
  })
  it("soporta self-closing sin cierre", () => {
    const parts = splitEmbeds('<agent-embed src="https://x/y" />')
    expect(parts).toEqual([{ type: "embed", src: "https://x/y" }])
  })
  it("ignora src vacío", () => {
    expect(splitEmbeds('<agent-embed src="">')).toEqual([{ type: "md", text: '<agent-embed src="">' }])
  })
})

describe("fileUrlToPath", () => {
  it("convierte file:///C:/… a path", () => {
    expect(fileUrlToPath("file:///C:/Users/a/w.html")).toBe("C:/Users/a/w.html")
    expect(fileUrlToPath("file://C:/a/b.html")).toBe("C:/a/b.html")
  })
  it("decodifica %20", () => {
    expect(fileUrlToPath("file:///C:/mis%20docs/w.html")).toBe("C:/mis docs/w.html")
  })
  it("rechaza http y paths sueltos", () => {
    expect(fileUrlToPath("https://x/y.html")).toBeNull()
    expect(fileUrlToPath("C:/a.html")).toBeNull()
  })
})
