import { describe, it, expect, beforeEach } from "vitest"
import {
  AUTOMATION_KEY,
  addAutomation,
  automationIntervalLabel,
  automationStore,
  isAutomationDue,
  nextAutomationRunAt,
  persistAutomations,
  removeAutomation,
  updateAutomation,
  markAutomationRun,
} from "./automationStore"

beforeEach(() => {
  localStorage.clear()
  persistAutomations([])
})

describe("automationStore", () => {
  it("agrega, persiste y recupera", () => {
    const created = addAutomation({ name: "Test", kind: "prompt", prompt: "corré los tests", sessionID: "ses_1", intervalMinutes: 30 })
    expect(created?.id).toBeTruthy()
    expect(automationStore.get().length).toBe(1)
    const raw = JSON.parse(localStorage.getItem(AUTOMATION_KEY) || "[]")
    expect(raw[0].name).toBe("Test")
  })

  it("rechaza prompts vacíos y comandos vacíos", () => {
    expect(addAutomation({ name: "x", kind: "prompt", prompt: "   ", sessionID: "s" })).toBeNull()
    expect(addAutomation({ name: "x", kind: "shell", command: "", terminalTabId: "t" })).toBeNull()
  })

  it("clampea el intervalo y cae al nombre por defecto", () => {
    const a = addAutomation({ name: "  ", kind: "prompt", prompt: "ok", sessionID: "s", intervalMinutes: 99999 })
    expect(a?.intervalMinutes).toBe(1440)
    expect(a?.name).toBe("Prompt")
  })

  it("update cambia campos y no pierde la definición", () => {
    const a = addAutomation({ name: "n", kind: "prompt", prompt: "p", sessionID: "s", intervalMinutes: 5 })!
    updateAutomation(a.id, { enabled: false, intervalMinutes: 60 })
    const after = automationStore.get()[0]
    expect(after.enabled).toBe(false)
    expect(after.intervalMinutes).toBe(60)
    expect(after.prompt).toBe("p")
  })

  it("remove borra", () => {
    const a = addAutomation({ name: "n", kind: "prompt", prompt: "p", sessionID: "s" })!
    removeAutomation(a.id)
    expect(automationStore.get()).toEqual([])
  })

  it("isAutomationDue respeta enabled, destino e intervalo", () => {
    const now = 1_000_000_000
    const base = { id: "1", name: "a", kind: "prompt" as const, prompt: "p", sessionID: "s", terminalTabId: "", command: "", intervalMinutes: 10, enabled: true, lastRunAt: now - 20 * 60_000 }
    expect(isAutomationDue(base, now)).toBe(true)
    expect(isAutomationDue({ ...base, enabled: false }, now)).toBe(false)
    expect(isAutomationDue({ ...base, sessionID: "" }, now)).toBe(false)
    expect(isAutomationDue({ ...base, lastRunAt: now - 60_000 }, now)).toBe(false)
    expect(isAutomationDue({ ...base, lastStatus: "running" }, now)).toBe(false)
  })

  it("isAutomationDue exige tab para los comandos de shell", () => {
    const now = 1_000_000
    const shellAuto = { id: "1", name: "s", kind: "shell" as const, prompt: "", sessionID: "", command: "ls", intervalMinutes: 5, enabled: true, lastRunAt: 0 }
    expect(isAutomationDue(shellAuto, now)).toBe(false)
    expect(isAutomationDue({ ...shellAuto, terminalTabId: "tab1" }, now)).toBe(true)
  })

  it("nextAutomationRunAt suma el intervalo", () => {
    const a = addAutomation({ name: "n", kind: "prompt", prompt: "p", sessionID: "s", intervalMinutes: 15 })!
    updateAutomation(a.id, { lastRunAt: 1_000_000 })
    expect(nextAutomationRunAt(automationStore.get()[0])).toBe(1_000_000 + 15 * 60_000)
  })

  it("markAutomationRun guarda estado, error y salida", () => {
    const a = addAutomation({ name: "n", kind: "shell", command: "ls", terminalTabId: "t" })!
    markAutomationRun(a.id, "error", { error: "boom" })
    expect(automationStore.get()[0].lastStatus).toBe("error")
    expect(automationStore.get()[0].lastError).toBe("boom")
    markAutomationRun(a.id, "ok", { output: "listado" })
    const after = automationStore.get()[0]
    expect(after.lastStatus).toBe("ok")
    expect(after.lastError).toBeUndefined()
    expect(after.lastOutput).toBe("listado")
    expect(after.lastRunAt).toBeGreaterThan(0)
  })

  it("automationIntervalLabel es legible", () => {
    expect(automationIntervalLabel(30)).toBe("cada 30 min")
    expect(automationIntervalLabel(120)).toBe("cada 2 h")
  })

  it("normaliza lo que entra por la API pública (basura no rompe)", () => {
    const a = addAutomation({ name: "x", kind: "shell", command: "  ls  ", terminalTabId: "t", intervalMinutes: -5 })
    expect(a?.id).toBeTruthy()
    expect(a?.intervalMinutes).toBe(1)
    expect(a?.command).toBe("  ls  ")
  })
})
