import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { useState } from "react"
import { FileEditorPanel } from "./shellPanels"

const writes: Array<{ path: string; data: string }> = []
const files: Record<string, string> = {}

function decodeB64(b64: string): string {
  return new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))
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
    render(<PanelHarness />)
    const ta = (await screen.findByLabelText("Editar /a.txt")) as HTMLTextAreaElement
    fireEvent.change(ta, { target: { value: "hello edited" } })
    // Switch antes de que el autosave (1s) pueda disparar: el write es del flush
    fireEvent.click(screen.getByText("b.txt"))
    await waitFor(() => expect(writes.length).toBe(1))
    expect(writes[0].path).toBe("/a.txt")
    expect(decodeB64(writes[0].data)).toBe("hello edited")
  })

  it("editar y revertir no escribe (dirty exacto)", async () => {
    render(<PanelHarness />)
    const ta = (await screen.findByLabelText("Editar /a.txt")) as HTMLTextAreaElement
    fireEvent.change(ta, { target: { value: "hello!" } })
    fireEvent.change(ta, { target: { value: "hello" } })
    fireEvent.click(screen.getByText("b.txt"))
    await screen.findByLabelText("Editar /b.txt")
    // Supera el debounce de autosave: no debe haber ningún write
    await new Promise((r) => setTimeout(r, 1200))
    expect(writes.length).toBe(0)
  })
})
