import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MarkdownWithEmbeds } from "./AgentEmbed"

const HTML = "<html><body><h1>Hola widget</h1></body></html>"

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    async (input: unknown) => {
      const url = String(input)
      if (url.endsWith("/shell/health")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }
      if (url.includes("/shell/fs/read")) {
        return new Response(
          JSON.stringify({ path: "C:/w.html", content: HTML, truncated: false, size: HTML.length, ext: "html" }),
          { status: 200 }
        )
      }
      return new Response(JSON.stringify({}), { status: 200 })
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("MarkdownWithEmbeds", () => {
  it("sin embeds renderiza markdown normal", () => {
    render(<MarkdownWithEmbeds text="hola **mundo**" />)
    expect(screen.getByText("mundo").tagName).toBe("STRONG")
  })
  it("embed file://: texto + iframe con el html leído", async () => {
    render(<MarkdownWithEmbeds text={'mira:\n<agent-embed src="file:///C:/w.html"></agent-embed>'} />)
    expect(screen.getByText("mira:")).toBeInTheDocument()
    const frame = (await screen.findByTitle("Vista generada")) as HTMLIFrameElement
    expect(frame.getAttribute("srcDoc")).toBe(HTML)
    expect(frame.getAttribute("sandbox")).toContain("allow-scripts")
    expect(frame.getAttribute("sandbox")).not.toContain("allow-same-origin")
  })
  it("ruta inválida muestra error, no rompe el mensaje", async () => {
    render(<MarkdownWithEmbeds text={'<agent-embed src="C:/w.html"></agent-embed>'} />)
    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })
  it("Ampliar cambia la altura", async () => {
    render(<MarkdownWithEmbeds text={'<agent-embed src="file:///C:/w.html"></agent-embed>'} />)
    await screen.findByTitle("Vista generada")
    const box = document.querySelector(".agent-embed")
    expect(box?.className).not.toContain("tall")
    fireEvent.click(screen.getByText("Ampliar"))
    expect(box?.className).toContain("tall")
  })
  it("?v=N se recorta del path leído (cache-buster)", async () => {
    const seen: string[] = []
    vi.stubGlobal(
      "fetch",
      async (input: unknown) => {
        const url = String(input)
        if (url.includes("/shell/fs/read")) {
          seen.push(new URL(url, "http://x").searchParams.get("path") ?? "")
          return new Response(
            JSON.stringify({ path: "C:/w.html", content: HTML, truncated: false, size: HTML.length, ext: "html" }),
            { status: 200 }
          )
        }
        return new Response(JSON.stringify({}), { status: 200 })
      }
    )
    render(<MarkdownWithEmbeds text={'<agent-embed src="file:///C:/w.html?v=2"></agent-embed>'} />)
    await screen.findByTitle("Vista generada")
    expect(seen).toEqual(["C:/w.html"])
  })
  it("Recargar vuelve a leer el archivo", async () => {
    let reads = 0
    vi.stubGlobal(
      "fetch",
      async (input: unknown) => {
        const url = String(input)
        if (url.includes("/shell/fs/read")) {
          reads++
          return new Response(
            JSON.stringify({ path: "C:/w.html", content: HTML, truncated: false, size: HTML.length, ext: "html" }),
            { status: 200 }
          )
        }
        return new Response(JSON.stringify({}), { status: 200 })
      }
    )
    render(<MarkdownWithEmbeds text={'<agent-embed src="file:///C:/w.html"></agent-embed>'} />)
    await screen.findByTitle("Vista generada")
    expect(reads).toBe(1)
    fireEvent.click(screen.getByText("Recargar"))
    await screen.findByTitle("Vista generada")
    expect(reads).toBe(2)
  })
})
