import { describe, it, expect } from "vitest"
import { mergeSessionPoll } from "../entities/session/sessionsPlan"
import type { SessionView } from "../types"

function view(status: SessionView["status"]): SessionView {
  return {
    id: "s1",
    title: "t",
    directory: "G:\\p",
    updated: 1,
    status,
    files: 0,
    additions: 0,
    deletions: 0,
  }
}

describe("mergeSessionPoll", () => {
  it("status fresco (dir consultado) pisa el local: busy → idle al terminar", () => {
    expect(mergeSessionPoll(view("busy"), view("idle"), true).status).toBe("idle")
  })

  it("sin status fresco conserva el local: no apaga busy aunque el poll no lo traiga", () => {
    expect(mergeSessionPoll(view("busy"), view("idle"), false).status).toBe("busy")
  })

  it("sin existente previo usa el status entrante", () => {
    expect(mergeSessionPoll(undefined, view("idle"), false).status).toBe("idle")
  })
})
