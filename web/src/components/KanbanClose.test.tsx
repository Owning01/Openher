import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { I18nProvider } from "../i18n-context"
import { KanbanPanel } from "./KanbanPanel"
import { DialogProvider } from "./DialogProvider"

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    async (input: unknown) => {
      const url = String(input)
      if (url.includes("/shell/kanban")) {
        return new Response(
          JSON.stringify({
            boards: [{ id: "b1", name: "Tablero", columns: [], cards: [] }],
          }),
          { status: 200 }
        )
      }
      return new Response(JSON.stringify({}), { status: 200 })
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("KanbanPanel cerrar vs eliminar", () => {
  it("muestra Cerrar panel (cierra el split) separado de Eliminar tablero", async () => {
    const onClose = vi.fn()
    const { container } = render(
      <DialogProvider>
        <I18nProvider language="es">
          <KanbanPanel onClose={onClose} />
        </I18nProvider>
      </DialogProvider>
    )
    await screen.findByText("Tablero")
    const closeBtn = container.querySelector('button[aria-label="Cerrar panel"]')
    expect(closeBtn).toBeTruthy()
    fireEvent.click(closeBtn!)
    expect(onClose).toHaveBeenCalledTimes(1)
    // El botón de eliminar tablero sigue existiendo y NO llama onClose
    const delBtn = container.querySelector('.shell-kanban-head-actions button:has(svg[aria-label="Delete"])')
    expect(delBtn).toBeTruthy()
    expect(delBtn).not.toBe(closeBtn)
  })

  it("sin onClose no muestra el botón de cerrar panel", async () => {
    const { container } = render(
      <DialogProvider>
        <I18nProvider language="es">
          <KanbanPanel />
        </I18nProvider>
      </DialogProvider>
    )
    await screen.findByText("Tablero")
    expect(container.querySelector('button[aria-label="Cerrar panel"]')).toBeNull()
  })
})
