import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, cleanup } from "@testing-library/react"
import { pluginBus } from "../../plugins/bus"
import { useSSEHandler } from "../../hooks/useSSEHandler"
import {
  activeDebateForSession,
  debatesForSession,
  fetchDebateState,
  hydrateDebate,
  ingestDebateEnvelope,
  resetDebateStore,
  sendDebateControl,
  sendDebateIntervene,
  useDebatesForSession,
} from "./debateStore"

const ORIGIN = "ses-origen"
const OTHER = "ses-otra"
const DEBATE = "deb-1"

function startedPayload(seq = 1) {
  return { debateID: DEBATE, seq, ts: 1000, topic: "Tema", engine: "isolated", roles: ["architect"], sessionID: ORIGIN, directory: "/proj" }
}

function messagePayload(seq: number, role = "architect", body = "texto") {
  return { debateID: DEBATE, seq, ts: 1000 + seq, role, body, status: "ARGUING", sessionID: ORIGIN, directory: "/proj" }
}

beforeEach(() => {
  resetDebateStore()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("debateStore: dedupe por (debateID, seq)", () => {
  it("el mismo evento dos veces produce una sola entrada", () => {
    ingestDebateEnvelope("rpc.debate.started", startedPayload(1))
    ingestDebateEnvelope("rpc.debate.message", messagePayload(2))
    ingestDebateEnvelope("rpc.debate.message", messagePayload(2))
    const deb = activeDebateForSession(ORIGIN)
    expect(deb?.messages).toHaveLength(1)
    expect(deb?.messages[0]?.body).toBe("texto")
  })

  it("dual-emit v1+v2 con el mismo seq (turn + message) produce una entrada", () => {
    ingestDebateEnvelope("rpc.debate.started", startedPayload(1))
    ingestDebateEnvelope("rpc.debate.turn", { ...messagePayload(2), index: 1 })
    ingestDebateEnvelope("rpc.debate.message", messagePayload(2))
    expect(activeDebateForSession(ORIGIN)?.messages).toHaveLength(1)
  })

  it("dual-emit de acta + artifact con el mismo seq no duplica el acta", () => {
    ingestDebateEnvelope("rpc.debate.started", startedPayload(1))
    ingestDebateEnvelope("rpc.debate.acta", { debateID: DEBATE, seq: 5, text: "acta v1", consensus: true, sessionID: ORIGIN })
    ingestDebateEnvelope("rpc.debate.artifact", { debateID: DEBATE, seq: 5, kind: "acta", text: "acta v2", consensus: true, sessionID: ORIGIN })
    const deb = activeDebateForSession(ORIGIN)
    expect(deb?.acta?.text).toBe("acta v1")
  })
})

describe("debateStore: filtro por sesión", () => {
  it("un debate solo existe en su sesión de origen con el originSessionID correcto", () => {
    ingestDebateEnvelope("rpc.debate.started", startedPayload(1))
    ingestDebateEnvelope("rpc.debate.message", messagePayload(2))
    expect(debatesForSession(ORIGIN)).toHaveLength(1)
    expect(debatesForSession(OTHER)).toHaveLength(0)
    expect(activeDebateForSession(ORIGIN)?.originSessionID).toBe(ORIGIN)
    expect(activeDebateForSession(OTHER)).toBeNull()
  })

  it("el hook useDebatesForSession solo expone los debates de la sesión pedida", () => {
    ingestDebateEnvelope("rpc.debate.started", startedPayload(1))
    const { result: r1 } = renderHook(() => useDebatesForSession(ORIGIN))
    const { result: r2 } = renderHook(() => useDebatesForSession(OTHER))
    expect(r1.current).toHaveLength(1)
    expect(r2.current).toHaveLength(0)
    act(() => {
      ingestDebateEnvelope("rpc.debate.message", messagePayload(2))
    })
    expect(r1.current[0]?.messages).toHaveLength(1)
    expect(r2.current).toHaveLength(0)
  })
})

describe("debateStore: rehidratado vía RPC debate/state", () => {
  it("hydrateDebate fusiona snapshot sin duplicar mensajes ya vistos", () => {
    ingestDebateEnvelope("rpc.debate.started", startedPayload(1))
    ingestDebateEnvelope("rpc.debate.message", messagePayload(2))
    hydrateDebate(ORIGIN, {
      debateID: DEBATE,
      topic: "Tema",
      messages: [
        { seq: 2, role: "architect", body: "texto", status: "ARGUING" },
        { seq: 3, role: "pragmatist", body: "nuevo", status: "CONSENSUS_READY" },
      ],
      status: { turns: 2, consensusPct: 50, stalled: false },
      acta: { text: "acta final", consensus: true, minorities: ["disenso x"], confidence: 80 },
    })
    const deb = activeDebateForSession(ORIGIN)
    expect(deb?.messages).toHaveLength(2)
    expect(deb?.messages.map((m) => m.seq)).toEqual([2, 3])
    expect(deb?.acta?.minorities).toEqual(["disenso x"])
    expect(deb?.status.consensusPct).toBe(50)
  })

  it("fetchDebateState pide POST a debate/state y devuelve el snapshot", async () => {
    const snap = { debateID: DEBATE, topic: "T", messages: [] }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ output: snap }) })
    vi.stubGlobal("fetch", fetchMock)
    const out = await fetchDebateState({ host: "h", port: 1, username: "u", password: "p" }, DEBATE)
    expect(out).toEqual(snap)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/api/rpc/debate/state")
  })

  it("el RPC se envuelve en {input} (Rpc.Input del server unificado)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ output: { ok: true } }) })
    vi.stubGlobal("fetch", fetchMock)
    await sendDebateControl({ host: "h", port: 1, username: "u", password: "p" }, ORIGIN, DEBATE, "stop")
    const rawBody = (fetchMock.mock.calls[0]?.[1] as { body?: unknown })?.body
    expect(JSON.parse(String(rawBody))).toEqual({ input: { debateID: DEBATE } })
  })

  it("fetchDebateState devuelve null si el plugin viejo no tiene el RPC", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    const out = await fetchDebateState({ host: "h", port: 1, username: "u", password: "p" }, DEBATE)
    expect(out).toBeNull()
  })
})

describe("debateStore: RPC intervene / pause / resume / stop", () => {
  it("intervene publica vía RPC y el mensaje vuelve por SSE como humano", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ output: { seq: 7 } }) }))
    ingestDebateEnvelope("rpc.debate.started", startedPayload(1))
    const ok = await sendDebateIntervene({ host: "h", port: 1, username: "u", password: "p" }, DEBATE, "alto ahí")
    expect(ok).toBe(true)
    ingestDebateEnvelope("rpc.debate.message", { debateID: DEBATE, seq: 7, role: "human", body: "alto ahí", status: "ARGUING", sessionID: ORIGIN })
    const last = activeDebateForSession(ORIGIN)?.messages.at(-1)
    expect(last?.kind).toBe("user")
    expect(last?.role).toBe("human")
  })

  it("pause marca pausa local; resume la levanta", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ output: { ok: true } }) }))
    const cfg = { host: "h", port: 1, username: "u", password: "p" }
    ingestDebateEnvelope("rpc.debate.started", startedPayload(1))
    expect(await sendDebateControl(cfg, ORIGIN, DEBATE, "pause")).toBe(true)
    expect(activeDebateForSession(ORIGIN)?.paused).toBe(true)
    expect(await sendDebateControl(cfg, ORIGIN, DEBATE, "resume")).toBe(true)
    expect(activeDebateForSession(ORIGIN)?.paused).toBe(false)
  })
})

describe("debate: 2 paneles, 1 evento → 1 entrada", () => {
  function handlerFor(sessionID: string) {
    const noop = () => undefined
    const { result } = renderHook(() =>
      useSSEHandler({
        sessionID,
        directory: "/proj",
        loadSelected: noop,
        applyDelta: noop,
        applyPart: noop,
        setAwaitingAssistantReply: noop,
        setRuntimeError: noop,
        awaitingRef: () => false,
        onSettled: noop,
      }),
    )
    return result.current
  }

  it("dos handlers (uno por panel) reemiten con el originSessionID del evento", () => {
    const hA = handlerFor(ORIGIN)
    const hB = handlerFor(OTHER)
    // El server emite el evento una vez por stream: cada panel lo ve y lo
    // reemite al pluginBus con la precedencia de Fase 2.
    const sse = {
      id: "e1",
      type: "rpc.debate.message",
      properties: { data: { debateID: DEBATE, originSessionID: ORIGIN, directory: "/proj", seq: 2, ts: 2000, role: "adversary", body: "objeción", status: "DISSENTING" } },
    }
    act(() => {
      hA(sse)
      hB(sse)
    })
    const mine = activeDebateForSession(ORIGIN)
    expect(mine?.messages).toHaveLength(1)
    expect(mine?.originSessionID).toBe(ORIGIN)
    expect(mine?.messages[0]?.role).toBe("adversary")
    expect(activeDebateForSession(OTHER)).toBeNull()
  })

  it("emisión directa doble por pluginBus también colapsa a 1 entrada", () => {
    const payload = { ...messagePayload(2) }
    act(() => {
      pluginBus.emit("rpc.debate.started", { ...startedPayload(1) })
      pluginBus.emit("rpc.debate.started", { ...startedPayload(1) })
      pluginBus.emit("rpc.debate.message", payload)
      pluginBus.emit("rpc.debate.message", { ...payload })
    })
    expect(activeDebateForSession(ORIGIN)?.messages).toHaveLength(1)
  })
})
