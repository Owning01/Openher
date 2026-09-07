import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { api } from "../../api"
import * as clientModule from "./client"
import * as versionModule from "./version"
import type { ServerConfig } from "../../types"

describe("api question and form handling", () => {
  const configV2: ServerConfig = {
    server: "http://127.0.0.1:4098",
    host: "127.0.0.1",
    port: 4098,
    apiVersion: "v2",
  }

  const configV1: ServerConfig = {
    server: "http://127.0.0.1:4098",
    host: "127.0.0.1",
    port: 4098,
    apiVersion: "v1",
  }

  let requestSpy: any

  beforeEach(() => {
    versionModule.rememberApiVersion(configV2, "v2")
    versionModule.rememberApiVersion(configV1, "v1")
    requestSpy = vi.spyOn(clientModule, "request")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("listPendingQuestions", () => {
    it("parses v2 form fields correctly into QuestionInfo", async () => {
      requestSpy.mockResolvedValueOnce([
        {
          id: "form_123",
          sessionID: "sess_456",
          title: "Select options",
          fields: [
            {
              key: "field_a",
              title: "What is your preference?",
              type: "string",
              options: [{ label: "Option 1", value: "opt1", description: "First" }],
              custom: true,
            },
            {
              key: "field_b",
              title: "Select multiple",
              type: "multiselect",
              options: [{ label: "Choice A", value: "a" }],
              custom: false,
            },
          ],
        },
      ])

      const list = await api.listPendingQuestions(configV2, "/workspace")
      expect(list).toHaveLength(1)
      expect(list[0].id).toBe("form_123")
      expect(list[0].sessionID).toBe("sess_456")
      expect(list[0].questions).toHaveLength(2)
      expect(list[0].questions[0]).toEqual({
        question: "What is your preference?",
        header: "field_a",
        options: [{ label: "Option 1", description: "First" }],
        multiple: false,
        custom: true,
      })
      expect(list[0].questions[1]).toEqual({
        question: "Select multiple",
        header: "field_b",
        options: [{ label: "Choice A", description: undefined }],
        multiple: true,
        custom: false,
      })
    })
  })

  describe("questionReply", () => {
    it("calls v2 form reply endpoint with answer mapping and answers fallback", async () => {
      // Mock form get to return field keys
      requestSpy.mockImplementation(async (_cfg: any, path: string) => {
        if (path.includes("/form/form_123") && !path.includes("/reply")) {
          return {
            fields: [
              { key: "q_text", type: "string" },
              { key: "q_multi", type: "multiselect" },
            ],
          }
        }
        if (path.includes("/form/form_123/reply")) {
          return true
        }
        return true
      })

      const res = await api.questionReply(
        configV2,
        "form_123",
        [["Single answer"], ["A", "B"]],
        "/workspace",
        "sess_456",
      )

      expect(res).toBe(true)
      const replyCall = requestSpy.mock.calls.find(([_, path]: [any, string]) =>
        path.includes("/form/form_123/reply"),
      )
      expect(replyCall).toBeDefined()
      expect(replyCall[2].body.answer).toEqual({
        q_text: "Single answer",
        q_multi: ["A", "B"],
      })
      expect(replyCall[2].body.answers).toEqual([["Single answer"], ["A", "B"]])
    })

    it("falls back to global if sessionID is not passed in v2", async () => {
      requestSpy.mockImplementation(async (_cfg: any, path: string) => {
        if (path.includes("/form/request")) {
          return []
        }
        if (path.includes("/reply")) {
          return true
        }
        return {}
      })

      const res = await api.questionReply(configV2, "form_999", [["OK"]])
      expect(res).toBe(true)
      const replyCall = requestSpy.mock.calls.find(([_, path]: [any, string]) =>
        path.includes("/form/form_999/reply"),
      )
      expect(replyCall).toBeDefined()
      expect(replyCall[1]).toContain("/session/global/form/form_999/reply")
    })

    it("falls back to legacy question endpoint if form endpoint 404s", async () => {
      requestSpy.mockImplementation(async (_cfg: any, path: string) => {
        if (path.includes("/form/")) {
          const err = new Error("Not Found")
          err.cause = { status: 404 }
          throw err
        }
        if (path.includes("/question/form_legacy/reply")) {
          return true
        }
        return {}
      })

      const res = await api.questionReply(configV2, "form_legacy", [["Ans"]], undefined, "sess_1")
      expect(res).toBe(true)
      const legacyCall = requestSpy.mock.calls.find(([_, path]: [any, string]) =>
        path.includes("/session/sess_1/question/form_legacy/reply"),
      )
      expect(legacyCall).toBeDefined()
    })

    it("calls v1 question reply directly on v1", async () => {
      requestSpy.mockResolvedValueOnce(true)

      const res = await api.questionReply(configV1, "req_v1", [["answer"]])
      expect(res).toBe(true)
      expect(requestSpy.mock.calls[0][1]).toContain("/question/req_v1/reply")
    })
  })

  describe("questionReject", () => {
    it("calls v2 form cancel endpoint", async () => {
      requestSpy.mockResolvedValueOnce(true)

      const res = await api.questionReject(configV2, "form_123", "/workspace", "sess_456")
      expect(res).toBe(true)
      expect(requestSpy.mock.calls[0][1]).toContain("/session/sess_456/form/form_123/cancel")
    })

    it("falls back to legacy question reject on 404", async () => {
      requestSpy.mockImplementation(async (_cfg: any, path: string) => {
        if (path.includes("/form/")) {
          const err = new Error("Not Found")
          err.cause = { status: 404 }
          throw err
        }
        if (path.includes("/question/form_123/reject")) {
          return true
        }
        return {}
      })

      const res = await api.questionReject(configV2, "form_123", "/workspace", "sess_456")
      expect(res).toBe(true)
      expect(requestSpy.mock.calls[1][1]).toContain("/session/sess_456/question/form_123/reject")
    })

    it("calls v1 question reject on v1", async () => {
      requestSpy.mockResolvedValueOnce(true)

      const res = await api.questionReject(configV1, "req_v1")
      expect(res).toBe(true)
      expect(requestSpy.mock.calls[0][1]).toContain("/question/req_v1/reject")
    })
  })
})
