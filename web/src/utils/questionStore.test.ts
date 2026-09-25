import { describe, it, expect, beforeEach } from "vitest"
import {
  recordQuestionSettled,
  isQuestionSettled,
  getQuestionSettledInfo,
  clearQuestionSettled,
  onQuestionSettledChange,
} from "./questionStore"

describe("questionStore", () => {
  beforeEach(() => {
    clearQuestionSettled()
  })

  it("records answered question with answers and status", () => {
    expect(isQuestionSettled("q1")).toBe(false)
    recordQuestionSettled("q1", "answered", [["Ans1", "Ans2"]])
    expect(isQuestionSettled("q1")).toBe(true)

    const info = getQuestionSettledInfo("q1")
    expect(info?.status).toBe("answered")
    expect(info?.answers).toEqual([["Ans1", "Ans2"]])
  })

  it("records rejected question", () => {
    recordQuestionSettled("q2", "rejected")
    expect(isQuestionSettled("q2")).toBe(true)

    const info = getQuestionSettledInfo("q2")
    expect(info?.status).toBe("rejected")
  })

  it("notifies listeners on change", () => {
    const events: Array<{ id: string; status: string }> = []
    const unsubscribe = onQuestionSettledChange((id, info) => {
      events.push({ id, status: info.status })
    })

    recordQuestionSettled("q3", "answered", [["OK"]])
    recordQuestionSettled("q4", "rejected")

    expect(events).toEqual([
      { id: "q3", status: "answered" },
      { id: "q4", status: "rejected" },
    ])

    unsubscribe()
    recordQuestionSettled("q5", "answered")
    expect(events).toHaveLength(2)
  })

  it("supports multiple candidate IDs lookup", () => {
    recordQuestionSettled("call_abc", "answered", [["Candidate 1"]])
    expect(isQuestionSettled(["unknown_id", "call_abc"])).toBe(true)
    expect(isQuestionSettled(["non_existent"])).toBe(false)

    const info = getQuestionSettledInfo(["unknown_id", "call_abc"])
    expect(info?.status).toBe("answered")
    expect(info?.answers).toEqual([["Candidate 1"]])
  })
})
