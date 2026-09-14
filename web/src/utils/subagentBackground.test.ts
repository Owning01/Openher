import { describe, it, expect } from "vitest"
import { subagentBackground, isBackgroundRunning, isTaskToolPart, isForegroundRunningSubagent } from "./subagentBackground"

// El server marca los subagentes en background con state.metadata.background.
// El part queda "completed" al delegar; el estado vivo lo da la sesión hija.
describe("subagentBackground", () => {
  it("no es background sin metadata", () => {
    expect(subagentBackground({}).isBackground).toBe(false)
    expect(subagentBackground({ state: {} }).isBackground).toBe(false)
    expect(subagentBackground({ state: { metadata: {} } }).isBackground).toBe(false)
    expect(subagentBackground({ state: { metadata: { background: false } } }).isBackground).toBe(false)
  })

  it("detecta background y la sesión hija", () => {
    const info = subagentBackground({
      state: { metadata: { background: true, sessionId: "ses_child", jobId: "ses_child" } },
    })
    expect(info.isBackground).toBe(true)
    expect(info.childSessionID).toBe("ses_child")
    expect(info.jobID).toBe("ses_child")
  })

  it("acepta sessionID (otra capitalización) y cae a la sesión hija como jobID", () => {
    const info = subagentBackground({
      state: { metadata: { background: true, sessionID: "ses_x" } },
    })
    expect(info.childSessionID).toBe("ses_x")
    expect(info.jobID).toBe("ses_x")
  })
})

describe("isBackgroundRunning", () => {
  const bgPart = {
    state: { metadata: { background: true, sessionId: "ses_child" } },
  }

  it("false si no es background", () => {
    const busy = new Set(["ses_child"])
    expect(isBackgroundRunning({ state: { metadata: { sessionId: "ses_child" } } }, busy)).toBe(false)
  })

  it("false si la sesión hija no está activa", () => {
    expect(isBackgroundRunning(bgPart, new Set())).toBe(false)
    expect(isBackgroundRunning(bgPart, undefined)).toBe(false)
  })

  it("true solo cuando la sesión hija sigue activa", () => {
    expect(isBackgroundRunning(bgPart, new Set(["ses_child"]))).toBe(true)
    expect(isBackgroundRunning(bgPart, new Set(["otra"]))).toBe(false)
  })
})

describe("isTaskToolPart", () => {
  it("reconoce task por tool y por subagent_type en el input", () => {
    expect(isTaskToolPart({ tool: "task" })).toBe(true)
    expect(isTaskToolPart({ tool: "subagent" })).toBe(true)
    expect(isTaskToolPart({ state: { input: { subagent_type: "explore" } } })).toBe(true)
  })

  it("no confunde tools normales", () => {
    expect(isTaskToolPart({ tool: "bash", state: { input: { command: "ls" } } })).toBe(false)
    expect(isTaskToolPart({})).toBe(false)
  })
})

describe("isForegroundRunningSubagent", () => {
  it("true para task running sin background (candidato a promover)", () => {
    expect(
      isForegroundRunningSubagent({ tool: "task", state: { status: "running", metadata: { sessionId: "ses_c" } } })
    ).toBe(true)
  })

  it("false si ya está en background o no corre", () => {
    expect(
      isForegroundRunningSubagent({
        tool: "task",
        state: { status: "running", metadata: { background: true, sessionId: "ses_c" } },
      })
    ).toBe(false)
    expect(isForegroundRunningSubagent({ tool: "task", state: { status: "completed" } })).toBe(false)
  })

  it("false para tools normales aunque estén running", () => {
    expect(isForegroundRunningSubagent({ tool: "bash", state: { status: "running" } })).toBe(false)
  })
})
