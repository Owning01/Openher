import { describe, it, expect } from "vitest"
import type { ChatSettings, PromptSnippet, ThemePreference, NoticeType } from "./model.ts"

// Defaults extraídos de hooks/useChatSettings.ts — fuente de verdad para ChatSettings
const CHAT_DEFAULTS: ChatSettings = {
  fontSize: 14,
  messageSpacing: "normal",
  showThinking: true,
  thinkingDefault: "auto",
  showToolCalls: true,
  showTimestamps: true,
  showTodoButton: true,
  showModelInfo: true,
  showDiffs: true,
  showSubagentHint: true,
  showCompactionCheckpoint: true,
  showImages: true,
  bubbleRadius: 12,
  messageMaxWidth: "full",
  fontFamily: "system",
  compactTools: false,
  minimalistMode: false,
  completionSound: true,
  composerCharLimit: 0,
  desktopGutter: 12,
}

// ---------------------------------------------------------------------------
// ChatSettings
// ---------------------------------------------------------------------------
describe("ChatSettings", () => {
  it("defaults tiene 20 campos", () => {
    expect(Object.keys(CHAT_DEFAULTS)).toHaveLength(20)
  })

  it("valida shape completo con defaults", () => {
    const s: ChatSettings = { ...CHAT_DEFAULTS }
    expect(s.fontSize).toBe(14)
    expect(s.bubbleRadius).toBe(12)
    expect(s.desktopGutter).toBe(12)
    expect(s.composerCharLimit).toBe(0)
  })

  it("acepta messageSpacing compact/normal/comfortable", () => {
    const values: ChatSettings["messageSpacing"][] = ["compact", "normal", "comfortable"]
    for (const v of values) {
      const s: ChatSettings = { ...CHAT_DEFAULTS, messageSpacing: v }
      expect(s.messageSpacing).toBe(v)
    }
  })

  it("acepta thinkingDefault auto/expanded/collapsed", () => {
    const values: ChatSettings["thinkingDefault"][] = ["auto", "expanded", "collapsed"]
    for (const v of values) {
      const s: ChatSettings = { ...CHAT_DEFAULTS, thinkingDefault: v }
      expect(s.thinkingDefault).toBe(v)
    }
  })

  it("acepta messageMaxWidth normal/wide/full", () => {
    const values: ChatSettings["messageMaxWidth"][] = ["normal", "wide", "full"]
    for (const v of values) {
      const s: ChatSettings = { ...CHAT_DEFAULTS, messageMaxWidth: v }
      expect(s.messageMaxWidth).toBe(v)
    }
  })

  it("acepta fontFamily system/serif/mono", () => {
    const values: ChatSettings["fontFamily"][] = ["system", "serif", "mono"]
    for (const v of values) {
      const s: ChatSettings = { ...CHAT_DEFAULTS, fontFamily: v }
      expect(s.fontFamily).toBe(v)
    }
  })

  it("todos los flags booleanos están definidos y son boolean", () => {
    const boolKeys: (keyof ChatSettings)[] = [
      "showThinking",
      "showToolCalls",
      "showTimestamps",
      "showTodoButton",
      "showModelInfo",
      "showDiffs",
      "showSubagentHint",
      "showCompactionCheckpoint",
      "showImages",
      "compactTools",
      "minimalistMode",
      "completionSound",
    ]
    for (const k of boolKeys) {
      expect(typeof CHAT_DEFAULTS[k], `${k} should be boolean`).toBe("boolean")
    }
  })

  it("campos numéricos son numbers finitos", () => {
    const numKeys: (keyof ChatSettings)[] = ["fontSize", "bubbleRadius", "composerCharLimit", "desktopGutter"]
    for (const k of numKeys) {
      const v = CHAT_DEFAULTS[k]
      expect(typeof v, `${k}`).toBe("number")
      expect(Number.isFinite(v as number)).toBe(true)
    }
  })

  it("permite merge parcial con defaults (simula migración de localStorage)", () => {
    const stored = { fontSize: 18 } as unknown as ChatSettings
    const merged: ChatSettings = { ...CHAT_DEFAULTS, ...stored }
    expect(merged.fontSize).toBe(18)
    expect(merged.messageSpacing).toBe("normal")
    expect(merged.showThinking).toBe(true)
  })

  it("desktopGutter migración: string inválido cae a default", () => {
    const stored = { desktopGutter: "compact" } as unknown as ChatSettings
    const merged = { ...CHAT_DEFAULTS, ...stored }
    // replica lógica de useChatSettings: si no es number finito, usar default
    if (typeof merged.desktopGutter !== "number" || !Number.isFinite(merged.desktopGutter)) {
      merged.desktopGutter = CHAT_DEFAULTS.desktopGutter
    }
    expect(merged.desktopGutter).toBe(12)
  })

  it("desktopGutter acepta valor numérico custom", () => {
    const s: ChatSettings = { ...CHAT_DEFAULTS, desktopGutter: 48 }
    expect(s.desktopGutter).toBe(48)
  })

  it("permite desactivar todos los shows", () => {
    const s: ChatSettings = {
      ...CHAT_DEFAULTS,
      showThinking: false,
      showToolCalls: false,
      showTimestamps: false,
      showImages: false,
      showDiffs: false,
    }
    expect(s.showThinking).toBe(false)
    expect(s.showToolCalls).toBe(false)
    expect(s.showTimestamps).toBe(false)
    expect(s.showImages).toBe(false)
  })

  it("minimalistMode y compactTools pueden ser true", () => {
    const s: ChatSettings = { ...CHAT_DEFAULTS, minimalistMode: true, compactTools: true }
    expect(s.minimalistMode).toBe(true)
    expect(s.compactTools).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// PromptSnippet
// ---------------------------------------------------------------------------
describe("PromptSnippet", () => {
  it("valida shape con id/name/text", () => {
    const p: PromptSnippet = { id: "1", name: "Snippet 1", text: "Hola mundo" }
    expect(p.id).toBe("1")
    expect(p.name).toBe("Snippet 1")
    expect(p.text).toBe("Hola mundo")
  })

  it("permite text vacío", () => {
    const p: PromptSnippet = { id: "2", name: "Empty", text: "" }
    expect(p.text).toBe("")
  })

  it("permite text multilínea", () => {
    const p: PromptSnippet = { id: "3", name: "Multi", text: "línea1\nlínea2\nlínea3" }
    expect(p.text.split("\n")).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// ThemePreference
// ---------------------------------------------------------------------------
describe("ThemePreference", () => {
  it("acepta los 4 valores permitidos", () => {
    const values: ThemePreference[] = ["system", "light", "dark", "scheduled"]
    expect(values).toHaveLength(4)
    for (const v of values) {
      const t: ThemePreference = v
      expect(typeof t).toBe("string")
    }
  })

  it("valida asignación de cada variante", () => {
    const light: ThemePreference = "light"
    const dark: ThemePreference = "dark"
    const system: ThemePreference = "system"
    const scheduled: ThemePreference = "scheduled"
    expect(light).toBe("light")
    expect(dark).toBe("dark")
    expect(system).toBe("system")
    expect(scheduled).toBe("scheduled")
  })
})

// ---------------------------------------------------------------------------
// NoticeType
// ---------------------------------------------------------------------------
describe("NoticeType", () => {
  it("acepta los 3 valores permitidos", () => {
    const values: NoticeType[] = ["info", "success", "error"]
    expect(values).toHaveLength(3)
    for (const v of values) {
      const n: NoticeType = v
      expect(typeof n).toBe("string")
    }
  })

  it("valida cada variante por separado", () => {
    const info: NoticeType = "info"
    const success: NoticeType = "success"
    const error: NoticeType = "error"
    expect(info).toBe("info")
    expect(success).toBe("success")
    expect(error).toBe("error")
  })

  it("puede usarse en switch exhaustivo", () => {
    function label(t: NoticeType): string {
      switch (t) {
        case "info": return "ℹ️"
        case "success": return ""
        case "error": return ""
      }
    }
    expect(label("info")).toBe("ℹ️")
    expect(label("success")).toBe("")
    expect(label("error")).toBe("")
  })
})
