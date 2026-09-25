import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ getGlobal: vi.fn(), read: vi.fn() }))
vi.mock("../shell", () => ({
  shell: {
    opencode: { getGlobal: mocks.getGlobal },
    fs: { read: mocks.read },
  },
}))

import { homeFromConfigPath, parseTeamLog, teamLogPath } from "./team"

describe("homeFromConfigPath", () => {
  it("resuelve el home desde el config global en Windows (backslash)", () => {
    expect(homeFromConfigPath("C:\\Users\\perca\\.config\\opencode\\opencode.json")).toBe("C:/Users/perca")
  })
  it("resuelve el home desde .opencode y con forward slash", () => {
    expect(homeFromConfigPath("C:/Users/perca/.opencode/config.json")).toBe("C:/Users/perca")
  })
  it("resuelve el home desde el candidato APPDATA", () => {
    expect(homeFromConfigPath("C:/Users/perca/AppData/Roaming/opencode/config.json")).toBe("C:/Users/perca")
  })
  it("resuelve el home desde un scan root (.agents/skills)", () => {
    expect(homeFromConfigPath("C:\\Users\\perca\\.agents\\skills")).toBe("C:/Users/perca")
  })
  it("devuelve null si no matchea", () => {
    expect(homeFromConfigPath("")).toBeNull()
    expect(homeFromConfigPath("D:/tmp/otra/cosa.json")).toBeNull()
  })
})

describe("teamLogPath", () => {
  it("arma la ruta absoluta del log", () => {
    expect(teamLogPath("C:/Users/perca")).toBe("C:/Users/perca/.local/share/opencode/team/messages.jsonl")
  })
  it("no duplica la barra final", () => {
    expect(teamLogPath("C:/Users/perca/")).toBe("C:/Users/perca/.local/share/opencode/team/messages.jsonl")
  })
})

describe("parseTeamLog", () => {
  it("parsea lineas validas preservando el orden del archivo", () => {
    const content = [
      '{"ts":200,"from":"OH1","to":"ses_b","text":"segundo"}',
      '{"ts":100,"from":"OH2","to":"ses_a","text":"primero"}',
    ].join("\n")
    const out = parseTeamLog(content)
    expect(out.map((m) => m.text)).toEqual(["segundo", "primero"])
    expect(out[1]).toEqual({ ts: 100, from: "OH2", to: "ses_a", text: "primero" })
  })

  it("ignora lineas vacias y corruptas", () => {
    const content = ['{"ts":1,"from":"A","to":"b","text":"ok"}', "", "no-json", '{"ts":2,"from":"B"}'].join("\n")
    const out = parseTeamLog(content)
    expect(out).toHaveLength(1)
    expect(out[0].text).toBe("ok")
  })

  it("tolera to ausente", () => {
    expect(parseTeamLog('{"ts":5,"from":"A","text":"x"}')[0].to).toBe("")
  })

  it("devuelve [] con contenido vacio", () => {
    expect(parseTeamLog("")).toEqual([])
  })
})

describe("loadTeamLog", () => {
  beforeEach(() => {
    mocks.getGlobal.mockReset()
    mocks.read.mockReset()
    vi.resetModules()
  })

  const cfg = { configPath: "C:/Users/x/.config/opencode/opencode.json", scannedRoots: [] }

  it("lee el log, ordena por ts y usa el path derivado", async () => {
    mocks.getGlobal.mockResolvedValue(cfg)
    mocks.read.mockResolvedValue({ content: '{"ts":2,"from":"B","to":"s","text":"b"}\n{"ts":1,"from":"A","to":"s","text":"a"}\n' })
    const { loadTeamLog } = await import("./team")
    const out = await loadTeamLog()
    expect(out.map((m) => m.text)).toEqual(["a", "b"])
    expect(mocks.read).toHaveBeenCalledWith("C:/Users/x/.local/share/opencode/team/messages.jsonl")
  })

  it("log inexistente ('no es archivo') => [] (no error)", async () => {
    mocks.getGlobal.mockResolvedValue(cfg)
    mocks.read.mockRejectedValue(new Error("no es archivo"))
    const { loadTeamLog } = await import("./team")
    await expect(loadTeamLog()).resolves.toEqual([])
  })

  it("cae al scan root si configPath no resuelve", async () => {
    mocks.getGlobal.mockResolvedValue({ configPath: "", scannedRoots: ["C:/Users/x/.agents/skills"] })
    mocks.read.mockResolvedValue({ content: "" })
    const { loadTeamLog } = await import("./team")
    await expect(loadTeamLog()).resolves.toEqual([])
    expect(mocks.read).toHaveBeenCalledWith("C:/Users/x/.local/share/opencode/team/messages.jsonl")
  })

  it("propaga un error real (no 404) y re-resuelve en el proximo intento", async () => {
    mocks.getGlobal.mockResolvedValue(cfg)
    mocks.read.mockRejectedValue(new Error("EPERM locked"))
    const { loadTeamLog } = await import("./team")
    await expect(loadTeamLog()).rejects.toThrow("EPERM")
    await expect(loadTeamLog()).rejects.toThrow("EPERM")
    expect(mocks.getGlobal).toHaveBeenCalledTimes(2)
  })

  it("sin home ni scan roots => error", async () => {
    mocks.getGlobal.mockResolvedValue({ configPath: "", scannedRoots: [] })
    const { loadTeamLog } = await import("./team")
    await expect(loadTeamLog()).rejects.toThrow(/home/)
  })
})
