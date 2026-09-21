import { describe, it, expect } from "vitest"
import {
  getShellResultInfo,
  isShellResultMessage,
  parseShellTag,
  stripShellWrapper,
} from "./messageShape"

// Payloads REALES del server (v2 `session_message` type "synthetic",
// metadata.source "shell"): el texto llega envuelto en `<shell ...>`.
const SIMPLE = `<shell id="sh_0a54d23db0010S7sfDKAHlDc8k" state="completed" command="node scripts/team-eval/spikes/f0-5-delivery.mjs">
[F0.5-delivery] ROJO {"N":10,"delivered":"0/10"}


Command exited with code 1.
</shell>`

// Comando con comillas y `>` adentro (el matcheo ingenuo de `[^"]*` lo corta).
const WITH_REDIRECT = `<shell id="sh_0a513ace9001lcPhIlHBkDxLiI" state="completed" command="Start-Process -FilePath 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' -ArgumentList '--remote-debugging-port=19222'; curl.exe -s -m 5 http://127.0.0.1:19222/json/version">
{"Browser": "Chrome/153.0.8010.37"}


Command exited with code 0.
</shell>`

// Comando multilínea (el tag de apertura ocupa dos líneas).
const MULTILINE = `<shell id="sh_0c593e25d0015wF6Bm1KDrhQ0a" state="completed" command="cd G:\\Proyectos\\opencode-remote-android
.\\scripts\\update-app.ps1 -Notes "chat: agrupado Trabajado" 2>&1 | tail -25">
Nueva version: 1.0.36 (10036)


Command exited with code 0.
</shell>`

// El server también manda `cancelled` (reinicio del server en el medio).
const CANCELLED = `<shell id="sh_0a5afb82e001vEPbTS5W9zWfMI" state="cancelled" command="Stop-Process -Name opencode -Force; Start-Sleep -Seconds 3">
Command cancelled because the server restarted
</shell>`

function envelope(role: string, text: string, metadata?: Record<string, unknown>) {
  return {
    info: { role, ...(metadata ? { metadata } : {}) },
    parts: [{ id: "p1", type: "text", text }],
  } as Parameters<typeof isShellResultMessage>[0]
}

describe("isShellResultMessage", () => {
  it("detecta por marca del server (metadata.source)", () => {
    expect(isShellResultMessage(envelope("synthetic", SIMPLE, { source: "shell", shellID: "sh_1" }))).toBe(true)
  })

  it("detecta por rol synthetic + etiqueta, sin metadata", () => {
    expect(isShellResultMessage(envelope("synthetic", SIMPLE))).toBe(true)
  })

  it("un user que menciona <shell> no matchea (ni con la marca del server)", () => {
    expect(isShellResultMessage(envelope("user", "mirá esto: <shell id=\"x\">"))).toBe(false)
    expect(isShellResultMessage(envelope("user", SIMPLE, { source: "shell" }))).toBe(false)
  })

  it("no matchea assistant normal ni synthetic sin etiqueta", () => {
    expect(isShellResultMessage(envelope("assistant", SIMPLE))).toBe(false)
    expect(isShellResultMessage(envelope("synthetic", "Continue if you have next steps"))).toBe(false)
  })

  it("tolera entradas vacías", () => {
    expect(isShellResultMessage(null)).toBe(false)
    expect(isShellResultMessage(undefined)).toBe(false)
    expect(isShellResultMessage({ info: null, parts: null })).toBe(false)
    expect(getShellResultInfo(envelope("assistant", SIMPLE))).toBeNull()
  })
})

describe("parseShellTag", () => {
  it("lee id, state y comando", () => {
    expect(parseShellTag(SIMPLE)).toEqual({
      id: "sh_0a54d23db0010S7sfDKAHlDc8k",
      state: "completed",
      command: "node scripts/team-eval/spikes/f0-5-delivery.mjs",
    })
  })

  it("no corta el comando con comillas ni con '>' adentro", () => {
    const tag = parseShellTag(WITH_REDIRECT)
    expect(tag?.id).toBe("sh_0a513ace9001lcPhIlHBkDxLiI")
    expect(tag?.command).toBe(
      "Start-Process -FilePath 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' -ArgumentList '--remote-debugging-port=19222'; curl.exe -s -m 5 http://127.0.0.1:19222/json/version",
    )
  })

  it("conserva el comando multilínea", () => {
    expect(parseShellTag(MULTILINE)?.command).toBe(
      'cd G:\\Proyectos\\opencode-remote-android\n.\\scripts\\update-app.ps1 -Notes "chat: agrupado Trabajado" 2>&1 | tail -25',
    )
  })

  it("cancelled también trae comando", () => {
    expect(parseShellTag(CANCELLED)?.state).toBe("cancelled")
  })

  it("null cuando no hay etiqueta", () => {
    expect(parseShellTag("hola")).toBeNull()
  })
})

describe("stripShellWrapper", () => {
  it("deja la salida sin la etiqueta", () => {
    const out = stripShellWrapper(SIMPLE)
    expect(out.startsWith("[F0.5-delivery] ROJO")).toBe(true)
    expect(out.endsWith("Command exited with code 1.")).toBe(true)
    expect(out.includes("<shell")).toBe(false)
    expect(out.includes("</shell>")).toBe(false)
  })

  it("texto sin etiqueta pasa tal cual", () => {
    expect(stripShellWrapper("sin etiqueta")).toBe("sin etiqueta")
  })
})

describe("getShellResultInfo", () => {
  it("junta marca del server + etiqueta", () => {
    const msg = envelope("synthetic", SIMPLE, {
      source: "shell",
      shellID: "sh_0a54d23db0010S7sfDKAHlDc8k",
      jobID: "sh_0a54d23db0010S7sfDKAHlDc8k",
      state: "completed",
      truncated: false,
      exit: 1,
    })
    expect(getShellResultInfo(msg)).toEqual({
      shellID: "sh_0a54d23db0010S7sfDKAHlDc8k",
      jobID: "sh_0a54d23db0010S7sfDKAHlDc8k",
      state: "completed",
      command: "node scripts/team-eval/spikes/f0-5-delivery.mjs",
      output: '[F0.5-delivery] ROJO {"N":10,"delivered":"0/10"}\n\n\nCommand exited with code 1.',
      exit: 1,
      truncated: undefined,
    })
  })

  it("sin metadata cae a la etiqueta y no inventa exit", () => {
    const info = getShellResultInfo(envelope("synthetic", CANCELLED))!
    expect(info.shellID).toBe("sh_0a5afb82e001vEPbTS5W9zWfMI")
    expect(info.state).toBe("cancelled")
    expect(info.exit).toBeUndefined()
    expect(info.output).toBe("Command cancelled because the server restarted")
  })
})
