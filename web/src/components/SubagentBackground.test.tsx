import { describe, it, expect, afterEach } from "vitest"
import { render, cleanup } from "@testing-library/react"
import { MessageBubble } from "./MessageBubble"

// Subagente en background: el tool part queda "completed" al delegar, pero si
// su sesión hija sigue activa (busySessionIds) la tarjeta debe mostrar que corre
// en segundo plano (mismo criterio que la TUI).
function taskMessage() {
  return {
    info: { id: "m1", role: "assistant", sessionID: "s1", time: { created: 1, completed: 2 } },
    parts: [],
    text: "",
    thinkingParts: [],
    toolParts: [
      {
        id: "tp1",
        type: "tool",
        tool: "task",
        callID: "c1",
        state: {
          status: "completed",
          input: { subagent_type: "explore", description: "Buscar X" },
          metadata: { background: true, sessionId: "ses_child", jobId: "ses_child" },
        },
      },
    ],
  } as any
}

afterEach(() => cleanup())

describe("subagente en background", () => {
  it("muestra el chip y el estado activo mientras la sesión hija corre", () => {
    const { container } = render(
      <MessageBubble message={taskMessage()} busySessionIds={new Set(["ses_child"])} />
    )
    const card = container.querySelector(".subagent-task-card")
    expect(card).toBeTruthy()
    expect(card!.classList.contains("is-background")).toBe(true)
    expect(card!.classList.contains("working")).toBe(true)
    expect(container.querySelector(".subagent-task-bg")).toBeTruthy()
  })

  it("queda en background pero completo cuando la sesión hija ya no está activa", () => {
    const { container } = render(
      <MessageBubble message={taskMessage()} busySessionIds={new Set()} />
    )
    const card = container.querySelector(".subagent-task-card")
    expect(card!.classList.contains("is-background")).toBe(true)
    expect(card!.classList.contains("working")).toBe(false)
  })

  it("un task normal (sin background) no pinta el chip", () => {
    const msg = taskMessage()
    msg.toolParts[0].state.metadata = { sessionId: "ses_child" }
    const { container } = render(<MessageBubble message={msg} busySessionIds={new Set(["ses_child"])} />)
    const card = container.querySelector(".subagent-task-card")
    expect(card!.classList.contains("is-background")).toBe(false)
    expect(container.querySelector(".subagent-task-bg")).toBeFalsy()
  })
})
