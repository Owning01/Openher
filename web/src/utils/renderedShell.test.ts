import { describe, it, expect } from "vitest"
import { computeRenderedMessages } from "./rendered"
import { toMessageEnvelopeV1 } from "../shared/api/mappers"

// Mensaje crudo del server (v2): `synthetic` + metadata.source "shell", con la
// salida envuelta en `<shell ...>`. Antes se pintaba como texto con los tags.
const SHELL_RAW = {
  id: "msg_shell_1",
  sessionID: "s1",
  type: "synthetic",
  time: { created: 1_790_021_688_000 },
  metadata: { source: "shell", shellID: "sh_1", jobID: "sh_1", state: "completed", truncated: false, exit: 1 },
  description: "pnpm test",
  text: '<shell id="sh_1" state="completed" command="pnpm test 2>&1 | Select-Object -Last 15">\nfallo 1 test\n\n\nCommand exited with code 1.\n</shell>',
}

type RawV2 = Parameters<typeof toMessageEnvelopeV1>[0]
const asRaw = (raw: unknown) => raw as unknown as RawV2

describe("computeRenderedMessages con resultados de shell", () => {
  it("lo convierte en herramienta (comando + salida) y no deja tags crudos", () => {
    const { out } = computeRenderedMessages([toMessageEnvelopeV1(asRaw(SHELL_RAW))], undefined, new Map())
    expect(out).toHaveLength(1)
    const m = out[0]!
    expect(m.info.role).toBe("synthetic")
    expect(m.text).toBe("")
    expect(m.text.includes("<shell")).toBe(false)
    expect(m.toolParts).toHaveLength(1)
    const part = m.toolParts[0]!
    expect(part.tool).toBe("shell")
    expect(part.state?.status).toBe("completed")
    expect((part.state?.input as { command?: string }).command).toBe("pnpm test 2>&1 | Select-Object -Last 15")
    const output = String(part.state?.output ?? "")
    expect(output).toContain("fallo 1 test")
    expect(output.endsWith("Command exited with code 1.")).toBe(true)
    expect(output.includes("<shell")).toBe(false)
    // Sin segmento de tool: el cuerpo del mensaje no dibuja tools (los dibuja
    // la caja de actividad) y un segmento acá dejaría un contenedor vacío.
    expect(m.segments ?? []).toHaveLength(0)
  })

  it("un shell en error queda como tool en error", () => {
    const raw = { ...SHELL_RAW, id: "msg_shell_2", metadata: { ...SHELL_RAW.metadata, state: "error", exit: 127 } }
    const { out } = computeRenderedMessages([toMessageEnvelopeV1(asRaw(raw))], undefined, new Map())
    expect(out[0]!.toolParts[0]!.state?.status).toBe("error")
    expect((out[0]!.toolParts[0]!.state?.metadata as { exit?: number }).exit).toBe(127)
  })

  it("un user que menciona <shell> sigue siendo texto", () => {
    const raw = { id: "msg_u", sessionID: "s1", type: "user", time: { created: 1 }, content: [{ id: "p1", type: "text", text: "qué es <shell> acá?" }] }
    const { out } = computeRenderedMessages([toMessageEnvelopeV1(asRaw(raw))], undefined, new Map())
    expect(out[0]!.text).toBe("qué es <shell> acá?")
    expect(out[0]!.toolParts).toHaveLength(0)
  })
})
