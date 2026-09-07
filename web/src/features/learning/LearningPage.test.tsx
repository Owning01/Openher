import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { render, fireEvent, cleanup, waitFor } from "@testing-library/react"
import LearningPage from "./LearningPage"
import { markVisited, markDone } from "./progress"

// useT con interpolación mínima: sin provider devolvería "" y no se podría
// verificar el contenido del prompt emitido a plugin:insert-text.
vi.mock("../../i18n-context", () => ({
  useT: () => (key: string, params?: Record<string, string | number>) => {
    if (key === "learning.askPrompt") return `Sobre la lección "${params?.lesson}"${params?.section ?? ""}: `
    if (key === "learning.askSection") return ` (sección "${params?.section}")`
    if (key === "learning.minutes") return `${params?.count} min`
    if (key === "learning.ofLesson") return `Lección ${params?.i} de ${params?.n}`
    if (key === "learning.lessons") return `${params?.count} lecciones`
    if (key === "learning.remaining") return `~${params?.count} min`
    if (key === "learning.andMore") return `…y ${params?.count} más`
    return key
  },
}))

// Sin provider useT devuelve "": se consulta por clase/rol, no por texto.
const MANIFEST = {
  version: 1,
  generatedAt: "2026-01-01",
  totalLessons: 2,
  categories: [
    {
      id: "cat-1",
      title: "Fundamentos",
      level: 0,
      description: "Base",
      count: 2,
      items: [
        { id: "l1", file: "a.md", originalPath: "a.md", category: "cat-1", categoryTitle: "Fundamentos", subCategory: null, title: "Lección uno", depth: "intro", minutes: 5, bytes: 10 },
        { id: "l2", file: "b.md", originalPath: "b.md", category: "cat-1", categoryTitle: "Fundamentos", subCategory: null, title: "Lección dos", depth: "intermedio", minutes: 8, bytes: 10 },
      ],
    },
  ],
}

function mockFetch() {
  vi.stubGlobal("fetch", vi.fn(async (url: unknown) => {
    const u = String(url)
    if (u.endsWith("manifest.json") && u.includes("learning")) {
      return { ok: true, json: async () => structuredClone(MANIFEST) } as Response
    }
    if (u.endsWith(".md")) {
      return { ok: true, text: async () => "# Lección uno\n\n## Parte A\n\n## Parte B\n\ntexto\n" } as Response
    }
    return { ok: false, status: 404, json: async () => null } as unknown as Response
  }))
}

beforeEach(() => {
  try { localStorage.clear() } catch { /* ignore */ }
  mockFetch()
})

afterEach(() => {
  cleanup()
  document.body.innerHTML = ""
  vi.unstubAllGlobals()
})

describe("LearningPage", () => {
  it("muestra roadmap con nodos accionables por teclado", async () => {
    render(<LearningPage />)
    await waitFor(() => expect(document.querySelector(".learning-roadmap-diagram")).toBeTruthy())
    const nodes = document.querySelectorAll('.learning-roadmap-diagram g[role="button"]')
    expect(nodes).toHaveLength(1)
    expect(nodes[0].getAttribute("tabindex")).toBe("0")
    // Enter navega a la tarjeta de la sección
    fireEvent.keyDown(nodes[0], { key: "Enter" })
    await waitFor(() => expect(document.querySelector("#learning-cat-cat-1")).toBeTruthy())
  })

  it("banner continuar abre la última visitada no completada", async () => {
    markVisited("l2")
    render(<LearningPage />)
    await waitFor(() => expect(document.querySelector(".learning-resume")).toBeTruthy())
    fireEvent.click(document.querySelector(".learning-resume")!)
    await waitFor(() => expect(document.querySelector(".learning-lesson")).toBeTruthy())
    expect(document.querySelector(".learning-lesson-title")?.textContent).toBe("Lección dos")
  })

  it("ocultar completadas filtra el dashboard", async () => {
    markDone("l1", true)
    render(<LearningPage />)
    await waitFor(() => expect(document.querySelector(".learning-roadmap")).toBeTruthy())
    expect(document.querySelectorAll(".learning-lesson-row")).toHaveLength(2)
    fireEvent.click(document.querySelector(".learning-visibility-btn")!)
    await waitFor(() => expect(document.querySelectorAll(".learning-lesson-row")).toHaveLength(1))
  })

  it("recientes muestra visitas sin duplicar el resume", async () => {
    markVisited("l1")
    markVisited("l2")
    render(<LearningPage />)
    await waitFor(() => expect(document.querySelector(".learning-roadmap-diagram")).toBeTruthy())
    expect(document.querySelector(".learning-resume")).toBeTruthy()
    const chips = document.querySelectorAll(".learning-recent-chip")
    expect(chips).toHaveLength(1)
    fireEvent.click(chips[0])
    await waitFor(() => expect(document.querySelector(".learning-lesson")).toBeTruthy())
    expect(document.querySelector(".learning-lesson-title")?.textContent).toBe("Lección uno")
  })

  it("preguntar al chat emite plugin:insert-text con la lección", async () => {
    const seen: string[] = []
    const orig = window.dispatchEvent.bind(window)
    const spy = vi.spyOn(window, "dispatchEvent").mockImplementation(((e: Event) => {
      if (e.type === "plugin:insert-text") seen.push((e as CustomEvent).detail)
      return orig(e)
    }) as typeof window.dispatchEvent)
    markVisited("l1")
    render(<LearningPage />)
    await waitFor(() => expect(document.querySelector(".learning-resume")).toBeTruthy())
    fireEvent.click(document.querySelector(".learning-resume")!)
    await waitFor(() => expect(document.querySelector(".learning-lesson")).toBeTruthy())
    const btns = document.querySelectorAll(".learning-head-actions .btn-icon")
    fireEvent.click(btns[btns.length - 1])
    expect(seen).toHaveLength(1)
    expect(seen[0]).toContain("Lección uno")
    spy.mockRestore()
  })
})
