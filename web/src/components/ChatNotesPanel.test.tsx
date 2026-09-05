import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { render, fireEvent, cleanup, act } from "@testing-library/react"
import { ChatNotesPanel } from "./ChatNotesPanel"
import { writeChatNotes } from "../utils/chatNotes"

// Sin provider useT devuelve "": se consulta por clase/rol, no por texto.
function actionButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll(".chat-notes-actions button")) as HTMLButtonElement[]
}

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  document.body.innerHTML = ""
  vi.useRealTimers()
})

describe("ChatNotesPanel", () => {
  it("muestra la nota guardada de la sesión", () => {
    writeChatNotes("S1", "pendiente: revisar diff")
    render(<ChatNotesPanel sessionID="S1" onClose={vi.fn()} />)
    const area = document.querySelector(".chat-notes-area") as HTMLTextAreaElement
    expect(area.value).toBe("pendiente: revisar diff")
    expect(document.querySelector('[role="dialog"]')).toBeTruthy()
  })

  it("aísla notas por sesión", () => {
    writeChatNotes("A", "nota A")
    writeChatNotes("B", "nota B")
    const { unmount } = render(<ChatNotesPanel sessionID="A" onClose={vi.fn()} />)
    expect((document.querySelector(".chat-notes-area") as HTMLTextAreaElement).value).toBe("nota A")
    unmount()
    cleanup()
    render(<ChatNotesPanel sessionID="B" onClose={vi.fn()} />)
    expect((document.querySelector(".chat-notes-area") as HTMLTextAreaElement).value).toBe("nota B")
  })

  it("autoguarda con debounce sin perder al cerrar", () => {
    const onClose = vi.fn()
    render(<ChatNotesPanel sessionID="S1" onClose={onClose} />)
    const area = document.querySelector(".chat-notes-area") as HTMLTextAreaElement
    fireEvent.change(area, { target: { value: "borrador nuevo" } })
    expect(localStorage.getItem("openher.chatNotes.S1")).toBeNull()
    act(() => { vi.advanceTimersByTime(500) })
    expect(localStorage.getItem("openher.chatNotes.S1")).toBe("borrador nuevo")
  })

  it("insertar manda el texto al composer", () => {
    const onInsert = vi.fn()
    render(<ChatNotesPanel sessionID="S1" onClose={vi.fn()} onInsert={onInsert} />)
    fireEvent.change(document.querySelector(".chat-notes-area")!, { target: { value: "  pasar al chat  " } })
    fireEvent.click(actionButtons()[0])
    expect(onInsert).toHaveBeenCalledWith("pasar al chat")
  })

  it("borrar pide doble toque y limpia storage", () => {
    writeChatNotes("S1", "algo")
    render(<ChatNotesPanel sessionID="S1" onClose={vi.fn()} />)
    const btns = actionButtons()
    const clearBtn = btns[btns.length - 2]
    fireEvent.click(clearBtn)
    // Primer toque solo arma: la nota sigue.
    expect((document.querySelector(".chat-notes-area") as HTMLTextAreaElement).value).toBe("algo")
    fireEvent.click(clearBtn)
    expect((document.querySelector(".chat-notes-area") as HTMLTextAreaElement).value).toBe("")
    expect(localStorage.getItem("openher.chatNotes.S1")).toBeNull()
  })

  it("Escape cierra", () => {
    const onClose = vi.fn()
    render(<ChatNotesPanel sessionID="S1" onClose={onClose} />)
    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })) })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
