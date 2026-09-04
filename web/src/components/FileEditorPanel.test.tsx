import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { EditorView } from "@codemirror/view"
import { useState } from "react"
import { FileEditorPanel } from "./shellPanels"

const writes: Array<{ path: string; data: string }> = []
const files: Record<string, string> = {}

function decodeB64(b64: string): string {
  return new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))
}

function editDoc(container: HTMLElement, text: string): void {
  const content = container.querySelector(".cm-content")
  expect(content).toBeTruthy()
  const view = content ? EditorView.findFromDOM(content) : null
  expect(view).toBeTruthy()
  act(() => {
    view!.dispatch({ changes: { from: 0, to: view!.state.doc.length, insert: text } })
  })
}

async function docText(container: HTMLElement): Promise<string> {
  await screen.findByText("b.txt")
  const content = container.querySelector(".cm-content")
  return content?.textContent ?? ""
}

// Espera síncrona canónica: el callback lanza hasta que el doc trae el texto.
async function waitDoc(container: HTMLElement, text: string): Promise<void> {
  await waitFor(
    () => {
      const content = container.querySelector(".cm-content")
      expect(content?.textContent ?? "").toContain(text)
    },
    { timeout: 3000 }
  )
}

function PanelHarness() {
  const [sel, setSel] = useState("/a.txt")
  return (
    <FileEditorPanel
      path="/a.txt"
      tabs={["/a.txt", "/b.txt"]}
      activePath={sel}
      onTabSelect={setSel}
      onTabClose={() => {}}
      initialCwd="/"
    />
  )
}

beforeEach(() => {
  writes.length = 0
  files["/a.txt"] = "hello"
  files["/b.txt"] = "world"
  vi.stubGlobal(
    "fetch",
    async (input: unknown, init?: { body?: unknown }) => {
      const url = String(input)
      if (url.endsWith("/shell/health")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }
      if (url.includes("/shell/fs/read")) {
        const u = new URL(url, "http://x")
        const p = u.searchParams.get("path") ?? ""
        return new Response(
          JSON.stringify({ path: p, content: files[p] ?? "", truncated: false, size: 0, ext: "txt" }),
          { status: 200 }
        )
      }
      if (url.includes("/shell/fs/write")) {
        const body = JSON.parse(String(init?.body ?? "{}"))
        writes.push(body)
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }
      return new Response(JSON.stringify({}), { status: 200 })
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("FileEditorPanel persistencia", () => {
  it("cambiar de tab sucia hace flush inmediato (cero pérdida)", async () => {
    const { container } = render(<PanelHarness />)
    await waitDoc(container, "hello")
    editDoc(container, "hello edited")
    // Switch antes de que el autosave (1s) pueda disparar: el write es del flush
    fireEvent.click(screen.getByText("b.txt"))
    await waitFor(() => expect(writes.length).toBe(1))
    expect(writes[0].path).toBe("/a.txt")
    expect(decodeB64(writes[0].data)).toBe("hello edited")
  })

  it("editar y revertir no escribe (dirty exacto)", async () => {
    const { container } = render(<PanelHarness />)
    await waitDoc(container, "hello")
    editDoc(container, "hello!")
    editDoc(container, "hello")
    fireEvent.click(screen.getByText("b.txt"))
    await waitDoc(container, "world")
    // Supera el debounce de autosave: no debe haber ningún write
    await new Promise((r) => setTimeout(r, 1200))
    expect(writes.length).toBe(0)
  })
})
