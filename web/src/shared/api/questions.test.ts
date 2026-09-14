import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { api } from "../../api"
import * as clientModule from "./client"
import * as versionModule from "./version"
import type { ServerConfig } from "../../types"
import { clearQuestionSettled, isQuestionSettled } from "../../utils/questionStore"

// Contrato real v2: Form.Info {id:"frm_*", metadata.tool:{messageID,id:callID},
// fields:[{key,title(header),description(pregunta)}]}.
const formInfo = (overrides: Record<string, unknown> = {}) => ({
  id: "frm_123",
  sessionID: "sess_456",
  title: "Select options",
  metadata: { kind: "question", tool: { messageID: "msg_1", id: "call_abc" } },
  fields: [
    {
      key: "q0",
      title: "Preference",
      description: "What is your preference?",
      type: "string",
      options: [{ label: "Option 1", value: "opt1", description: "First" }],
      custom: true,
    },
    {
      key: "q1",
      title: "Multiple",
      description: "Select multiple",
      type: "multiselect",
      options: [{ label: "Choice A", value: "a" }],
      custom: false,
    },
  ],
  ...overrides,
})

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
    clearQuestionSettled()
    requestSpy = vi.spyOn(clientModule, "request")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("listPendingQuestions", () => {
    it("parses the real v2 form contract (description=pregunta, title=header, metadata.tool)", async () => {
      requestSpy.mockResolvedValueOnce([formInfo()])

      const list = await api.listPendingQuestions(configV2, "/workspace")
      expect(list).toHaveLength(1)
      expect(list[0].id).toBe("frm_123")
      expect(list[0].sessionID).toBe("sess_456")
      expect(list[0].tool).toEqual({ messageID: "msg_1", callID: "call_abc" })
      expect(list[0].questions).toHaveLength(2)
      expect(list[0].questions![0]).toEqual({
        question: "What is your preference?",
        header: "Preference",
        options: [{ label: "Option 1", description: "First" }],
        multiple: false,
        custom: true,
        key: "q0",
      })
      expect(list[0].questions![1]).toEqual({
        question: "Select multiple",
        header: "Multiple",
        options: [{ label: "Choice A", description: undefined }],
        multiple: true,
        custom: false,
        key: "q1",
      })
    })
  })

  describe("questionReply", () => {
    it("resolves the callID to the real frm_* form and maps answers by field key", async () => {
      requestSpy.mockImplementation(async (_cfg: any, path: string) => {
        if (path.includes("/form/request")) return [formInfo()]
        if (path.includes("/form/frm_123/reply")) return true
        return true
      })

      const res = await api.questionReply(
        configV2,
        "call_abc",
        [["Single answer"], ["A", "B"]],
        "/workspace",
        "sess_456",
      )

      expect(res).toBe(true)
      const replyCall = requestSpy.mock.calls.find(([_, path]: [any, string]) =>
        path.includes("/form/frm_123/reply"),
      )
      expect(replyCall).toBeDefined()
      expect(replyCall[1]).toContain("/session/sess_456/form/frm_123/reply")
      expect(replyCall[2].body.answer).toEqual({
        q0: "Single answer",
        q1: ["A", "B"],
      })
      // Sticky: se marcan settled formID y callID (inline y flotante se enteran).
      expect(isQuestionSettled("frm_123")).toBe(true)
      expect(isQuestionSettled("call_abc")).toBe(true)
    })

    it("accepts a real frm_* id directly (floating prompt) and settles both keys", async () => {
      requestSpy.mockImplementation(async (_cfg: any, path: string) => {
        if (path.includes("/form/request")) return [formInfo()]
        if (path.includes("/form/frm_123/reply")) return true
        return true
      })

      const res = await api.questionReply(configV2, "frm_123", [["OK"]], "/workspace", "sess_456")
      expect(res).toBe(true)
      const replyCall = requestSpy.mock.calls.find(([_, path]: [any, string]) =>
        path.includes("/form/frm_123/reply"),
      )
      expect(replyCall).toBeDefined()
      expect(isQuestionSettled("frm_123")).toBe(true)
      expect(isQuestionSettled("call_abc")).toBe(true)
    })

    it("400 (Unknown form field) rejects con el detalle y NO cierra en falso", async () => {
      const badRequest = Object.assign(new Error("Unknown form field: q0"), { cause: { status: 400 } })
      requestSpy.mockImplementation(async (_cfg: any, path: string) => {
        if (path.includes("/form/request")) return [formInfo()]
        if (path.includes("/reply")) throw badRequest
        return true
      })

      await expect(
        api.questionReply(configV2, "call_abc", [["x"]], "/workspace", "sess_456"),
      ).rejects.toThrow("Unknown form field: q0")
      expect(isQuestionSettled("frm_123")).toBe(false)
      expect(isQuestionSettled("call_abc")).toBe(false)
    })

    it("409 (form ya respondido) resuelve true y marca settled", async () => {
      const conflict = Object.assign(new Error("Conflict"), { cause: { status: 409 } })
      requestSpy.mockImplementation(async (_cfg: any, path: string) => {
        if (path.includes("/form/request")) return [formInfo()]
        if (path.includes("/reply")) throw conflict
        return true
      })

      const res = await api.questionReply(configV2, "call_abc", [["x"]], "/workspace", "sess_456")
      expect(res).toBe(true)
      expect(isQuestionSettled("frm_123")).toBe(true)
      expect(isQuestionSettled("call_abc")).toBe(true)
    })

    it("server v2 sin /form/request cae al endpoint legacy de sesión", async () => {
      const notFound = Object.assign(new Error("Not Found"), { cause: { status: 404 } })
      requestSpy.mockImplementation(async (_cfg: any, path: string) => {
        if (path.includes("/form/request")) throw notFound
        if (path.includes("/session/sess_1/question/call_x/reply")) return true
        return true
      })

      const res = await api.questionReply(configV2, "call_x", [["Ans"]], undefined, "sess_1")
      expect(res).toBe(true)
      const legacyCall = requestSpy.mock.calls.find(([_, path]: [any, string]) =>
        path.includes("/session/sess_1/question/call_x/reply"),
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
    it("resolves the callID and cancels the real frm_* form", async () => {
      requestSpy.mockImplementation(async (_cfg: any, path: string) => {
        if (path.includes("/form/request")) return [formInfo()]
        if (path.includes("/form/frm_123/cancel")) return true
        return true
      })

      const res = await api.questionReject(configV2, "call_abc", "/workspace", "sess_456")
      expect(res).toBe(true)
      const cancelCall = requestSpy.mock.calls.find(([_, path]: [any, string]) =>
        path.includes("/form/frm_123/cancel"),
      )
      expect(cancelCall).toBeDefined()
      expect(cancelCall[1]).toContain("/session/sess_456/form/frm_123/cancel")
      expect(isQuestionSettled("frm_123")).toBe(true)
      expect(isQuestionSettled("call_abc")).toBe(true)
    })

    it("409 al cancelar (ya resuelto) resuelve true y marca settled", async () => {
      const conflict = Object.assign(new Error("Conflict"), { cause: { status: 409 } })
      requestSpy.mockImplementation(async (_cfg: any, path: string) => {
        if (path.includes("/form/request")) return [formInfo()]
        if (path.includes("/cancel")) throw conflict
        return true
      })

      const res = await api.questionReject(configV2, "frm_123", "/workspace", "sess_456")
      expect(res).toBe(true)
      expect(isQuestionSettled("frm_123")).toBe(true)
    })

    it("calls v1 question reject on v1", async () => {
      requestSpy.mockResolvedValueOnce(true)

      const res = await api.questionReject(configV1, "req_v1")
      expect(res).toBe(true)
      expect(requestSpy.mock.calls[0][1]).toContain("/question/req_v1/reject")
    })
  })
})
